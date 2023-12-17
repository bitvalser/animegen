import { PackRound } from '../constants/pack-round.constants';
import { AnimeCharacter } from '../interfaces/anime-character.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { ProgressLogger } from './progress-logger.class';

export abstract class AnimeProviderBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public customOptions: Record<string, any> = {};
  public progressLogger: ProgressLogger;
  protected name;

  public constructor(name: string) {
    this.name = name;
  }

  public getName(): string {
    return this.name;
  }

  public abstract getProviderName(): string;
  public abstract isRoundSupport(round: PackRound): boolean;
  public abstract getAnimeList(): Promise<AnimeItem[]>;
  public abstract getUniqAnimeList(): Promise<AnimeItem[]>;
  public abstract getAnimeScreenshots(id: string): Promise<string[]>;
  public abstract getCharacterList(id: string): Promise<AnimeCharacter[]>;
}
