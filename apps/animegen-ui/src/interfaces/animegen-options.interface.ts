import { GeneratorOptions } from '@bitvalser/animegen';

export interface AnimeGenOptions extends GeneratorOptions {
  name: string;
  musicProvider: string;
  concurrency: number;
  shuffleStrategy: boolean;
}
