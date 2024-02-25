import 'axios';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { AnimeGenerator } from './classes/anime-generator.class';
import { AnimeProviderBase } from './classes/anime-provider-base.class';
import { DriveUploaderBase } from './classes/drive-uploader-base.class';
import { GoogleDriveUploader } from './classes/google-drive-uploader.class';
import { ThemesMoeMusicDownloader } from './classes/themes-moe-music-downloader.class';
import { AnimeThemesMusicDownloader } from './classes/anime-themes-music-downloader.class';
import { MusicDownloaderProviderBase } from './classes/music-downloader-provider-base.class';
import { ShikimoriProvider } from './classes/shikimori-provider.class';
import { MalProvider } from './classes/mal-provider.class';
import { CustomShikimoriProvider } from './classes/custom-shikimori-provider.class';
import { AppVersionsApi } from './classes/app-versions-api.class';
import { YoutubeMusicDownloader } from './classes/youtube-music-downloader.class';
import { AnisongDBMusicDownloader } from './classes/anisongdb-music-downloader.class';
import { AnimeCharacterRole } from './constants/anime-character-role.constants';
import { AnimeProviders } from './constants/anime-providers.constants';
import { GeneratorOptions } from './interfaces/generator-options.interface';
import { AnimeKind } from './constants/anime-kind.constants';
import { PackRound } from './constants/pack-round.constants';
import { AnimeThemeType } from './constants/anime-theme-type.constants';
import { GeneratorRoundStrategy } from './classes/generator-round-strategy.class';
import { RoundsGeneratorStrategy } from './classes/rounds-generator-strategy.class';
import { ProgressLogger } from './classes/progress-logger.class';
import { SIPackBuilder } from './classes/si-pack-builder.class';
import { RandomGeneratorStrategy } from './classes/random-generator-strategy.class';
import { MusicProviders } from './constants/music-providers.constants';

const DELAY_INTERVAL_TIME = 15000;
const SHIKIMORI_API_DELAY = 600;

axiosRetry(axios, {
  retries: 3, // number of retries
  retryDelay: (retryCount) => {
    console.log(`Превышено число обращений к апи, повторная попытка: ${retryCount}`);
    return retryCount * DELAY_INTERVAL_TIME;
  },
  retryCondition: (error) => {
    console.error(error);
    return error.response?.status === 429 || error.code === 'ETIMEDOUT';
  },
});

axios.defaults.timeout = 60000;
axios.interceptors.request.use((config) => {
  if (config.url.includes(ShikimoriProvider.BASE_URL)) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(config), SHIKIMORI_API_DELAY);
    });
  } else {
    return config;
  }
}, Promise.reject);

export {
  AnimeGenerator,
  ShikimoriProvider,
  AnimeProviderBase,
  YoutubeMusicDownloader,
  MusicDownloaderProviderBase,
  GoogleDriveUploader,
  DriveUploaderBase,
  GeneratorOptions,
  PackRound,
  AnimeKind,
  AnimeCharacterRole,
  ThemesMoeMusicDownloader,
  AnimeThemeType,
  RoundsGeneratorStrategy,
  GeneratorRoundStrategy,
  RandomGeneratorStrategy,
  MusicProviders,
  SIPackBuilder,
  AnisongDBMusicDownloader,
  ProgressLogger,
  AppVersionsApi,
  MalProvider,
  AnimeProviders,
  CustomShikimoriProvider,
  AnimeThemesMusicDownloader,
};
