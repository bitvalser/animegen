import axios from 'axios';
import { PackRound } from '../constants/pack-round.constants';
import { AnimeCharacter } from '../interfaces/anime-character.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { ShikimoriAnimeItemApi } from '../interfaces/api/shikimori-anime-item-api.interface';
import { ShikimoriAnimeItemLinksApi } from '../interfaces/api/shikimori-anime-item-links-api.interface';
import { ShikimoriAnimeCharacterApi } from '../interfaces/api/shikimori-anime-character-api.interface';
import { ShikimoriAnimeScreenshotApi } from '../interfaces/api/shikimori-anime-screenshot-api.interface';
import { ShikimoriUserHistoryApi } from '../interfaces/api/shikimori-user-histroy-api.interface';
import { AnimeProviderBase } from './anime-provider-base.class';
import { getRandomInt } from '../helpers/random-number.helper';
import { axiosForceTimeout } from '../helpers/axios-force-timeout.helper';
import { ProgressLogger } from './progress-logger.class';

export class ShikimoriProvider extends AnimeProviderBase {
  public progressLogger = new ProgressLogger();
  public static BASE_URL = 'https://shikimori.one/api';
  private static APP_URL = 'https://shikimori.one';

  public constructor(name: string) {
    super(name);
  }

  public getProviderName(): string {
    return 'Shikimori';
  }

  public isRoundSupport(round: PackRound): boolean {
    return [
      PackRound.Characters,
      PackRound.Endings,
      PackRound.Openings,
      PackRound.Inserts,
      PackRound.Screenshots,
      PackRound.Coubs,
    ].includes(round);
  }

  private getAnimeAnnId(id: string): Promise<string> {
    return new Promise((resolve) => {
      axiosForceTimeout<ShikimoriAnimeItemLinksApi[]>({
        method: 'GET',
        url: `${ShikimoriProvider.BASE_URL}/animes/${id}/external_links`,
      })
        .then((response) => response.data.find((item) => item?.kind === 'anime_news_network'))
        .then((link) => new URLSearchParams((link?.url || '').split('?')?.[1] || '').get('id'))
        .then(resolve)
        .catch(() => resolve(null));
    });
  }

  public getAnimeItem(id: string): Promise<ShikimoriAnimeItemApi> {
    return axiosForceTimeout<ShikimoriAnimeItemApi>({
      method: 'GET',
      url: `${ShikimoriProvider.BASE_URL}/animes/${id}`,
    })
      .then((response) => response.data)
      .then((item) => {
        if (
          (this.customOptions.fromMalProvider || this.customOptions.fromCustomShikimori) &&
          this.customOptions.fetchLinks
        ) {
          return this.getAnimeAnnId(`${item.id}`).then((annId) => ({
            ...item,
            annId,
            franchise: item.franchise || item.name,
          }));
        }
        return {
          ...item,
          franchise: item.franchise || item.name,
        };
      });
  }

  public async getUniqAnimeList(): Promise<AnimeItem[]> {
    const titles: {
      [franchise: string]: AnimeItem[];
    } = {};
    const originalList = await this.getAnimeList();
    this.progressLogger.defineSteps([{ size: originalList.length }]);
    let i = 0;
    for (const title of originalList) {
      try {
        const details = await this.getAnimeItem(title.id);
        titles[details.franchise] = [...(titles[details.franchise] || []), title];
      } catch (error) {
        console.error(error);
      }
      this.progressLogger.doInfoStep(`Загрузка деталей аниме (${(i += 1)}/${originalList.length})...`);
    }
    return Object.values(titles).map((items) => items[getRandomInt(0, items.length - 1)]);
  }

  public async getAnimeList(): Promise<AnimeItem[]> {
    const list: ShikimoriUserHistoryApi[] = [];
    let page = 1;
    let keepFetch = true;
    do {
      const response = await axios.get<ShikimoriUserHistoryApi[]>(
        `${ShikimoriProvider.BASE_URL}/users/${encodeURIComponent(
          this.name,
        )}/anime_rates?limit=100&target_type=Anime&page=${page}`,
      );
      list.push(...response.data);
      if (!response.data || response.data.length === 0) {
        keepFetch = false;
      }
      page += 1;
    } while (keepFetch);
    const titles: AnimeItem[] = list
      .filter((item) => Boolean(item.anime) && item?.status === 'completed')
      .map((item) => ({
        id: item.anime.id.toString(),
        kind: item.anime.kind,
        originalName: item.anime.name,
        russianName: item.anime.russian,
        score: item.score > 0 ? item.score.toString() : null,
      }));
    if (this.customOptions.fetchLinks) {
      let i = 0;
      for (const title of titles) {
        this.progressLogger.info(`Получения ссылок для аниме (${(i += 1)}/${titles.length})...`);
        title.annId = await this.getAnimeAnnId(title.id);
      }
    }
    return titles;
  }

  public async getAnimeScreenshots(id: string): Promise<string[]> {
    const response = await axios.get<ShikimoriAnimeScreenshotApi[]>(
      `${ShikimoriProvider.BASE_URL}/animes/${id}/screenshots`,
    );
    return response.data.map((item) => `${ShikimoriProvider.APP_URL}${item.original}`);
  }

  public async getCharacterList(id: string): Promise<AnimeCharacter[]> {
    const response = await axios.get<ShikimoriAnimeCharacterApi[]>(`${ShikimoriProvider.BASE_URL}/animes/${id}/roles`);
    return response.data
      .filter((item) => Boolean(item.character))
      .map(({ roles, character }): AnimeCharacter => {
        const image = character.image.original || character.image.preview;
        return {
          id: character.id.toString(),
          image: image ? `${ShikimoriProvider.APP_URL}${image}` : null,
          originalName: character.name,
          russianName: character.russian,
          roles,
        };
      });
  }
}
