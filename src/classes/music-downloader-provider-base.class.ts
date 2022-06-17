export abstract class MusicDownloaderProviderBase {
  public abstract downloadMusicByName(name: string, destination: string): Promise<void>;
}
