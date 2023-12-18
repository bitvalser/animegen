import { GeneratorOptions } from '@bitvalser/animegen';

export interface AnimeGenOptions extends GeneratorOptions {
  preset: string;
  name: string;
  musicProvider: string;
  animeProvider: string;
  concurrency: number;
  shuffleStrategy: boolean;
}
