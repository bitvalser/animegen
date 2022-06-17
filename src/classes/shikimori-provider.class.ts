import axios from 'axios';
import { PackRound } from '../constants/pack-round.constants';
import { AnimeCharacter } from '../interfaces/anime-character.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { ShikimoriAnimeCharacterApi } from '../interfaces/api/shikimori-anime-character-api.interface';
import { ShikimoriAnimeScreenshotApi } from '../interfaces/api/shikimori-anime-screenshot-api.interface';
import { ShikimoriUserHistoryApi } from '../interfaces/api/shikimori-user-histroy-api.interface';
import { AnimeProviderBase } from './anime-provider-base.class';

export class ShikimoriProvider extends AnimeProviderBase {
  private static BASE_URL = 'https://shikimori.one/api';
  private static APP_URL = 'https://shikimori.one';

  public constructor(name: string) {
    super(name);
  }

  public getProviderName(): string {
    return 'Shikimori';
  }

  public isRoundSupport(round: PackRound): boolean {
    return [PackRound.Characters, PackRound.Endings, PackRound.Openings, PackRound.Screenshots].includes(round);
  }

  public async getAnimeList(): Promise<AnimeItem[]> {
    const list: ShikimoriUserHistoryApi[] = [];
    let page = 1;
    let keepFetch = true;
    do {
      const response = await axios.get<ShikimoriUserHistoryApi[]>(
        `${ShikimoriProvider.BASE_URL}/users/${encodeURIComponent(
          this.name,
        )}/history?limit=100&target_type=Anime&page=${page}`,
      );
      list.push(...response.data);
      if (response.data.length === 0) {
        keepFetch = false;
      }
      page += 1;
    } while (keepFetch);
    return list
      .filter((item) => Boolean(item.target))
      .map((item) => ({
        id: item.target.id.toString(),
        kind: item.target.kind,
        originalName: item.target.name,
        russianName: item.target.russian,
        score: null,
      }));
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
