import { MusicProviders } from '../constants/music-providers.constants';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';

export abstract class MusicDownloaderProviderBase {
  public static DOWNLOAD_TIMEOUT = 90 * 1000;
  protected options: Partial<GeneratorOptions>;
  public constructor(options: Partial<GeneratorOptions>) {
    this.options = { ...options };
    delete this.options.presetJson;
    delete this.options.presetFields;
  }
  public abstract getName(): MusicProviders;
  public abstract downloadMusicByQuestion(question: SIPackQuestion<AnimeItem>, destination: string): Promise<void>;
  public abstract runTask(...args: Parameters<MusicDownloaderProviderBase['downloadMusicByQuestion']>): Promise<void>;
}
