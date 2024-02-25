import axios from 'axios';
import { PackRound } from '../constants/pack-round.constants';
import { AnimeCharacter } from '../interfaces/anime-character.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { MalAnimeItemApi } from '../interfaces/api/mal-anime-item-api.interface';
import { AnimeProviderBase } from './anime-provider-base.class';
import { ProgressLogger } from './progress-logger.class';
import { ShikimoriProvider } from './shikimori-provider.class';
import { getRandomInt } from '../helpers/random-number.helper';

export class MalProvider extends AnimeProviderBase {
  public progressLogger = new ProgressLogger();
  public static BASE_URL = 'https://api.myanimelist.net/v2';
  public static CLIENT_ID = '4fe526be3754f744284b91ac5f94d3c7';
  private shikimoriProvider: ShikimoriProvider;

  public constructor(name: string) {
    super(name);

    this.shikimoriProvider = new ShikimoriProvider(name);
    this.shikimoriProvider.customOptions = this.getCustomOptions();
  }

  private getCustomOptions() {
    return {
      ...this.customOptions,
      fromMalProvider: true,
    };
  }

  public getProviderName(): string {
    return 'MyAnimeList';
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

  public async getAnimeList(): Promise<AnimeItem[]> {
    this.shikimoriProvider.customOptions = this.getCustomOptions();
    const list: MalAnimeItemApi[] = [];
    let page = 0;
    let keepFetch = true;
    const LIMIT = 1000;
    do {
      const response = await axios.get<{ data: MalAnimeItemApi[] }>(
        `${MalProvider.BASE_URL}/users/${encodeURIComponent(this.name)}/animelist?limit=${LIMIT}&offset=${
          page * LIMIT
        }&fields=list_status&status=completed&page=${page}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-MAL-CLIENT-ID': MalProvider.CLIENT_ID,
          },
        },
      );
      list.push(...response.data.data);
      if (!response.data || response.data.data.length === 0) {
        keepFetch = false;
      }
      page += 1;
    } while (keepFetch);
    this.progressLogger.defineSteps([{ size: list.length }]);
    const titles: AnimeItem[] = [];
    let i = 0;
    for (const item of list) {
      this.progressLogger.doInfoStep(`Получения деталей аниме (${(i += 1)}/${list.length})...`);
      try {
        const animeItem = await this.shikimoriProvider.getAnimeItem(String(item.node.id));
        titles.push({
          ...animeItem,
          id: animeItem.id.toString(),
          kind: animeItem.kind,
          originalName: animeItem.name,
          russianName: animeItem.russian,
          score: item.list_status?.score > 0 ? item.list_status.score.toString() : null,
        });
      } catch (error) {
        console.error(error);
      }
    }
    return titles;
  }

  public async getUniqAnimeList(): Promise<AnimeItem[]> {
    this.shikimoriProvider.customOptions = this.getCustomOptions();
    const titles: {
      [franchise: string]: AnimeItem[];
    } = {};
    const originalList = await this.getAnimeList();
    for (const details of originalList) {
      titles[details.franchise] = [...(titles[details.franchise] || []), details];
    }
    return Object.values(titles).map((items) => items[getRandomInt(0, items.length - 1)]);
  }

  public getAnimeScreenshots(id: string): Promise<string[]> {
    return this.shikimoriProvider.getAnimeScreenshots(id);
  }

  public getCharacterList(id: string): Promise<AnimeCharacter[]> {
    return this.shikimoriProvider.getCharacterList(id);
  }
}
