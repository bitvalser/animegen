import { AnimeItem } from '../interfaces/anime-item.interface';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { AnimeGenerator, ProgressListener } from './anime-generator.class';
import { SIPackBuilder } from './si-pack-builder.class';

export abstract class GeneratorRoundStrategy {
  public abstract buildRounds(
    generator: AnimeGenerator,
    defaultOptions: GeneratorOptions,
    packBuilder: SIPackBuilder,
    titles: AnimeItem[],
    progressListener: ProgressListener,
  ): Promise<void>;
}
