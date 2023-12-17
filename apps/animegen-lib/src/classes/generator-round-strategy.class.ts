import { AnimeItem } from '../interfaces/anime-item.interface';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { AnimeGenerator } from './anime-generator.class';
import { ProgressLogger } from './progress-logger.class';
import { SIPackBuilder } from './si-pack-builder.class';

export abstract class GeneratorRoundStrategy {
  public progressLogger: ProgressLogger;

  public abstract buildRounds(
    generator: AnimeGenerator,
    defaultOptions: GeneratorOptions,
    packBuilder: SIPackBuilder<AnimeItem>,
    titles: AnimeItem[],
  ): Promise<void>;
}
