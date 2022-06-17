import { PackRound } from '../constants/pack-round.constants';
import { AnimeCharacter } from '../interfaces/anime-character.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';

export abstract class AnimeProviderBase {
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
  public abstract getAnimeScreenshots(id: string): Promise<string[]>;
  public abstract getCharacterList(id: string): Promise<AnimeCharacter[]>;
}
