import { ipcMain } from 'electron';
import {
  AnimeGenerator,
  AnimeProviderBase,
  GeneratorRoundStrategy,
  MusicDownloaderProviderBase,
  MusicProviders,
  RandomGeneratorStrategy,
  RoundsGeneratorStrategy,
  ShikimoriProvider,
  ThemesMoeMusicDownloader,
  YoutubeMusicDownloader,
} from '@bitvalser/animegen';
import { AnimeGenOptions } from '../interfaces/animegen-options.interface';

const getAnimeProvider = (options: AnimeGenOptions): AnimeProviderBase => {
  switch (options.musicProvider) {
    default:
      return new ShikimoriProvider(options.name);
  }
};

const getBuildStrategy = (options: AnimeGenOptions): GeneratorRoundStrategy => {
  if (options.shuffleStrategy) {
    return new RandomGeneratorStrategy();
  }
  return new RoundsGeneratorStrategy();
};

const getMusicProvider = (
  options: AnimeGenOptions,
): MusicDownloaderProviderBase => {
  switch (options.musicProvider) {
    case MusicProviders.ThemesMoe:
      return new ThemesMoeMusicDownloader(
        process.env.FFMPEG_PATH as string,
        options,
      );
    case MusicProviders.Youtube:
    default:
      return new YoutubeMusicDownloader(
        process.env.FFMPEG_PATH as string,
        options,
      );
  }
};

ipcMain.on('animegen', async (event, arg) => {
  if (!arg?.task) return;
  if (arg.task === 'start' && arg.options) {
    event.sender.send('animegen', {
      type: 'gen-start',
    });
    const options = arg.options;
    try {
      const generator = new AnimeGenerator(
        getAnimeProvider(options),
        getMusicProvider(options),
        getBuildStrategy(options),
      );

      const packPath = await generator.createPack(
        options,
        (progress, message) => {
          event.sender.send('animegen', {
            type: 'gen-progress',
            message,
            progress,
          });
        },
      );
      event.sender.send('animegen', {
        type: 'gen-success',
        packPath,
      });
    } catch (error: any) {
      event.sender.send('animegen', {
        type: 'gen-error',
        message: error.message,
      });
    }
  }
});
