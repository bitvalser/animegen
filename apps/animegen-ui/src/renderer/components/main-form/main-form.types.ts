import { GeneratorOptions } from '@bitvalser/animegen';

export interface FormValues extends GeneratorOptions {
  name: string;
  musicProvider: string;
  concurrency: number;
  shuffleStrategy: boolean;
}
