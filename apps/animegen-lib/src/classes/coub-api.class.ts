import axios from 'axios';
import { CoubSearchApi } from '../interfaces/api/coub-search-api.interface';

export class CoubApi {
  private static BASE_URL = 'https://coub.com/api/v2';
  private static instance: CoubApi;

  public static getInstance(): CoubApi {
    if (CoubApi.instance) {
      return CoubApi.instance;
    }
    return (CoubApi.instance = new CoubApi());
  }

  public searchAutocomplete(query: string): Promise<string[]> {
    return axios
      .get<{ tags: { title: string }[] }>(`${CoubApi.BASE_URL}/search/autocomplete?q=${encodeURIComponent(query)}`)
      .then((response) => response.data.tags.map((item) => item.title));
  }

  public searchCoubs(query: string): Promise<CoubSearchApi> {
    return this.searchAutocomplete(query).then((tags) => {
      if (tags.length > 0) {
        return axios
          .get<CoubSearchApi>(
            `${CoubApi.BASE_URL}/timeline/tag/${encodeURIComponent(
              tags[0],
            )}?order_by=likes_count&page=1&per_page=25`,
          )
          .then((response) => response.data);
      }
      throw new Error('Anime not found!');
    });
  }
}
