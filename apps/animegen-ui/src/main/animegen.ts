import { app, ipcMain, shell } from 'electron';
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
  AnisongDBMusicDownloader,
  ProgressLogger,
  AppVersionsApi,
  AnimeProviders,
  MalProvider,
  CustomShikimoriProvider,
  AnimeThemesMusicDownloader,
} from '@bitvalser/animegen';
import log from 'electron-log';
import fsPromises from 'fs/promises';
import { AnimeGenOptions } from '../interfaces/animegen-options.interface';

const getAnimeProvider = (options: AnimeGenOptions): AnimeProviderBase => {
  if (options.preset === 'custom') {
    return new CustomShikimoriProvider();
  }
  switch (options.animeProvider) {
    case AnimeProviders.MAL:
      return new MalProvider(options.name);
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
    case MusicProviders.AnisongDB:
      return new AnisongDBMusicDownloader(
        process.env.FFMPEG_PATH as string,
        options,
      );
    case MusicProviders.AnimeThemes:
      return new AnimeThemesMusicDownloader(
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

ipcMain.on('open-location', (event, arg) => {
  const appPath = app.getAppPath().replace('resources\\app.asar', '');
  if (arg.file) {
    shell.showItemInFolder(`${appPath}${arg.path}\\${arg.file}`);
  } else {
    shell.openPath(`${appPath}${arg.path}`);
  }
});

ipcMain.on('check-version', async (event) => {
  const latestVersion = await AppVersionsApi.getInstance().getLatestVersion();
  const version = app.getVersion();
  const isNew =
    +latestVersion.version
      .split('.')
      .map((item) => item.padEnd(4, '0'))
      .join('') >
    +version
      .split('.')
      .map((item) => item.padEnd(4, '0'))
      .join('');
  event.sender.send('check-version', {
    isNew,
    latestVersion: latestVersion.version,
    currentVersion: version,
    url: latestVersion.url,
  });
});

ipcMain.on('get-logs', async (event) => {
  fsPromises
    .readFile('app.log', {
      encoding: 'utf-8',
    })
    .then((content) => {
      event.sender.send('get-logs', Buffer.from(content).toString('base64'));
    });
});

ipcMain.on('animegen', async (event, arg) => {
  log.info('animegen', arg);
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
      const logger = new ProgressLogger();
      logger.setLoggerFn((progress, message) => {
        event.sender.send('animegen', {
          type: 'gen-progress',
          message,
          progress,
        });
      });
      generator.progressLogger = logger;
      const packPath = await generator.createPack(options);
      event.sender.send('animegen', {
        type: 'gen-success',
        packPath,
      });
    } catch (error: any) {
      log.error(error);
      event.sender.send('animegen', {
        type: 'gen-error',
        message: error.message,
      });
    }
  }
});
