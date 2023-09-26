import 'axios';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import dotenv from 'dotenv';
import { AnimeGenerator } from './classes/anime-generator.class';
import { AnimeProviderBase } from './classes/anime-provider-base.class';
import { DriveUploaderBase } from './classes/drive-uploader-base.class';
import { GoogleDriveUploader } from './classes/google-drive-uploader.class';
import { ThemesMoeMusicDownloader } from './classes/themes-moe-music-downloader.class';
import { MusicDownloaderProviderBase } from './classes/music-downloader-provider-base.class';
import { ShikimoriProvider } from './classes/shikimori-provider.class';
import { YoutubeMusicDownloader } from './classes/youtube-music-downloader.class';
import { AnimeCharacterRole } from './constants/anime-character-role.constants';
import { GeneratorOptions } from './interfaces/generator-options.interface';
import { AnimeKind } from './constants/anime-kind.constants';
import { PackRound } from './constants/pack-round.constants';
import { AnimeThemeType } from './constants/anime-theme-type.constants';
import { GeneratorRoundStrategy } from './classes/generator-round-strategy.class';
import { RoundsGeneratorStrategy } from './classes/rounds-generator-strategy.class';
import { RandomGeneratorStrategy } from './classes/random-generator-strategy.class';
dotenv.config();

const DELAY_INTERVAL_TIME = 15000;

axiosRetry(axios, {
  retries: 3, // number of retries
  retryDelay: (retryCount) => {
    console.log(`Превышено число обращений к апи, повторная попытка: ${retryCount}`);
    return retryCount * DELAY_INTERVAL_TIME;
  },
  retryCondition: (error) => error.response.status === 429,
});

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
};
