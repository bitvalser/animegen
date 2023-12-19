import { GeneratorOptions } from '@bitvalser/animegen';

export interface FormValues extends GeneratorOptions {
  preset: string;
  name: string;
  musicProvider: string;
  animeProvider: string;
  concurrency: number;
  shuffleStrategy: boolean;
}
