import { AnimeKind } from '../constants/anime-kind.constants';
import { PackRound } from '../constants/pack-round.constants';
import { shuffleArray } from '../helpers/shuffle-array.helper';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { AnimeGenerator } from './anime-generator.class';
import { ProgressLogger } from './progress-logger.class';
import { SIPackBuilder } from './si-pack-builder.class';

export abstract class GeneratorRoundStrategy {
  public progressLogger: ProgressLogger;
  protected allTitles: AnimeItem[];

  protected getTitlesForRound(round: PackRound, options: GeneratorOptions): AnimeItem[] {
    const { ratio } = options.roundsFill[round];
    const count = Math.ceil(options.titleCounts * ratio);
    switch (round) {
      case PackRound.Screenshots:
      case PackRound.Characters:
      case PackRound.Endings:
        return options.noRepeatsAtAll ? this.allTitles.splice(0, count) : shuffleArray(this.allTitles).slice(0, count);
      case PackRound.Openings:
        return options.noRepeatsAtAll
          ? this.allTitles.splice(0, count)
          : shuffleArray(
              this.allTitles.filter((item) => [AnimeKind.TV, AnimeKind.ONA, AnimeKind.Film].includes(item.kind)),
            ).slice(0, count);
      case PackRound.Coubs:
        return options.noRepeatsAtAll
          ? this.allTitles.splice(0, Math.ceil(count * (3 / 2)))
          : shuffleArray(this.allTitles).slice(0, Math.ceil(count * (3 / 2)));
    }
  }

  public abstract buildRounds(
    generator: AnimeGenerator,
    defaultOptions: GeneratorOptions,
    packBuilder: SIPackBuilder<AnimeItem>,
    titles: AnimeItem[],
  ): Promise<void>;
}
