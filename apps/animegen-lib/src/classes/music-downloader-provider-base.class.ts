import { MusicProviders } from '../constants/music-providers.constants';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';

export abstract class MusicDownloaderProviderBase {
  public static DOWNLOAD_TIMEOUT = 90 * 1000;
  public static DEFAULT_DURATION = 90;
  protected options: Partial<GeneratorOptions>;
  public constructor(options: Partial<GeneratorOptions>) {
    this.options = { ...options };
    delete this.options.presetJson;
    delete this.options.presetFields;
  }
  public abstract getName(): MusicProviders;
  public abstract downloadMusicByQuestion(question: SIPackQuestion<AnimeItem>, destination: string): Promise<void>;
  public abstract runTask(...args: Parameters<MusicDownloaderProviderBase['downloadMusicByQuestion']>): Promise<void>;
  protected getTrackDuration(path: string): Promise<number> {
    return new Promise((resolve) => {
      let cmd: FfmpegCommand = null;
      const manualTimeout = setTimeout(() => {
        if (cmd) {
          cmd.kill('SIGKILL');
        }
        resolve(MusicDownloaderProviderBase.DEFAULT_DURATION);
      }, 4000);
      try {
        cmd = ffmpeg(path)
          .addOption('-f', 'null')
          .on('codecData', (codecData) => {
            clearTimeout(manualTimeout);
            if (codecData?.duration) {
              const durationSplit = codecData.duration.split(':');
              const seconds = Math.floor(+durationSplit[0] * 3600 + +durationSplit[1] * 60 + +durationSplit[2]);
              if (isNaN(seconds)) {
                resolve(MusicDownloaderProviderBase.DEFAULT_DURATION);
              } else {
                resolve(seconds);
              }
            } else {
              resolve(MusicDownloaderProviderBase.DEFAULT_DURATION);
            }
          })
          .on('error', () => {
            clearTimeout(manualTimeout);
            resolve(MusicDownloaderProviderBase.DEFAULT_DURATION);
          })
          .output('nowhere');
        cmd.run();
      } catch {
        clearTimeout(manualTimeout);
        resolve(MusicDownloaderProviderBase.DEFAULT_DURATION);
      }
    });
  }
}
