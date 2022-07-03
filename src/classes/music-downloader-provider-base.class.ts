import { PackRound } from '../constants/pack-round.constants';

export abstract class MusicDownloaderProviderBase {
  public abstract downloadMusicByName(name: string, type: PackRound, destination: string): Promise<void>;
}
