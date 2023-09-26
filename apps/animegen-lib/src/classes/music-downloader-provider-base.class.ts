import { PackRound } from '../constants/pack-round.constants';

export abstract class MusicDownloaderProviderBase {
  public static DOWNLOAD_TIMEOUT = 90 * 1000;
  public abstract downloadMusicByName(name: string, type: PackRound, destination: string): Promise<void>;
  public abstract runTask(...args: Parameters<MusicDownloaderProviderBase['downloadMusicByName']>): Promise<void>;
}
