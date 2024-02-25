import axios, { Axios } from 'axios';
import { getRandomInt } from '../helpers/random-number.helper';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { ShikimoriProvider } from './shikimori-provider.class';
import { shuffleArray } from '../helpers/shuffle-array.helper';

export class CustomShikimoriProvider extends ShikimoriProvider {
  public static MAX_TITLES_TO_FETCH = 400;

  public constructor() {
    super(null);
    this.customOptions.fromCustomShikimori = true;
  }

  public getProviderName(): string {
    return 'CustomShikimori';
  }

  public async getAnimeList(): Promise<AnimeItem[]> {
    const { presetFields, presetJson, generatorOptions } = this.customOptions as {
      generatorOptions: GeneratorOptions;
      presetFields: GeneratorOptions['presetFields'];
      presetJson: GeneratorOptions['presetJson'];
    };
    const getterFunction = new Function(
      'axios',
      'fields',
      'options',
      presetJson?.getterFn || 'return Promise.resolve([]);',
    ) as (
      axios: Axios,
      fields: GeneratorOptions['presetFields'],
      options: GeneratorOptions,
    ) => Promise<{ id: string }[]>;

    let list = await getterFunction(axios, presetFields, generatorOptions);
    list = shuffleArray(list).slice(
      0,
      Math.min(
        Math.min(
          generatorOptions.titleCounts *
            (generatorOptions.titleCounts > 100 ? 2 : Math.min(generatorOptions.rounds.length, 4)),
          CustomShikimoriProvider.MAX_TITLES_TO_FETCH,
        ),
        list.length,
      ),
    );

    this.progressLogger.defineSteps([{ size: list.length }]);
    const titles: AnimeItem[] = [];
    let i = 0;
    for (const item of list) {
      this.progressLogger.doInfoStep(`Получения деталей аниме (${(i += 1)}/${list.length})...`);
      try {
        const animeItem = await this.getAnimeItem(String(item.id));
        titles.push({
          ...animeItem,
          id: animeItem.id.toString(),
          kind: animeItem.kind,
          originalName: animeItem.name,
          russianName: animeItem.russian,
        });
      } catch (error) {
        console.error(error);
      }
    }
    return titles;
  }

  public async getUniqAnimeList(): Promise<AnimeItem[]> {
    const titles: {
      [franchise: string]: AnimeItem[];
    } = {};
    const originalList = await this.getAnimeList();
    for (const details of originalList) {
      if (details.franchise) {
        titles[details.franchise] = [...(titles[details.franchise] || []), details];
      }
    }
    return Object.values(titles).map((items) => items[getRandomInt(0, items.length - 1)]);
  }
}
