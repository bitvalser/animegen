import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fsPromises from 'fs/promises';
import * as uuid from 'uuid';
import { fork } from 'child_process';
import kill from 'tree-kill';
import { AnimeThemeType } from '../constants/anime-theme-type.constants';
import { PackRound } from '../constants/pack-round.constants';
import { ThemesMoeApi } from '../interfaces/api/themes-moe-api.interface';
import { getRandomInt } from '../helpers/random-number.helper';
import { MusicDownloaderProviderBase } from './music-downloader-provider-base.class';
import { downloadFile } from '../helpers/download-file.helper';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { MusicProviders } from '../constants/music-providers.constants';

type AnimeThemesMap = {
  [key in AnimeThemeType]?: string[];
};

export class ThemesMoeMusicDownloader extends MusicDownloaderProviderBase {
  private static BASE_URL = 'https://themes.moe/api';
  private static DEFAULT_MUSIC_TIME = 30;
  private static START_TIME = 5;
  private audioBitrate: number = null;
  private musicLength: number = null;

  public constructor(
    private ffmpegPath: string = process.env.FFMPEG_PATH,
    options: Partial<GeneratorOptions>,
  ) {
    super(options);
    ffmpeg.setFfmpegPath(this.ffmpegPath);
    this.audioBitrate = options.audioBitrate;
    this.musicLength = options.musicLength;
  }

  private getTypeByApiType(type: string): AnimeThemeType {
    if (type.startsWith('OP')) {
      return AnimeThemeType.Opening;
    } else if (type.startsWith('ED')) {
      return AnimeThemeType.Ending;
    }
    return AnimeThemeType.Unknown;
  }

  private getTypeByRound(round: PackRound): AnimeThemeType {
    switch (round) {
      case PackRound.Openings:
        return AnimeThemeType.Opening;
      case PackRound.Endings:
        return AnimeThemeType.Ending;
      default:
        return AnimeThemeType.Unknown;
    }
  }

  private mapTitle(title: ThemesMoeApi): AnimeThemesMap {
    if (title?.themes) {
      return (title.themes || []).reduce<AnimeThemesMap>((acc, val) => {
        const type = this.getTypeByApiType(val.themeType);
        return {
          ...acc,
          [type]: [...(acc[type] || []), val.mirror.mirrorURL],
        };
      }, {});
    }
    return {};
  }

  public getName(): MusicProviders {
    return MusicProviders.ThemesMoe;
  }

  public searchByName(name: string): Promise<number[]> {
    return axios
      .get<number[]>(
        `${ThemesMoeMusicDownloader.BASE_URL}/anime/search/${encodeURI(
          name.replace(/(\(TV\))|(\(\d\d\d\d\))|(!$)/g, '').trim(),
        )}`,
      )
      .then((response) => response.data);
  }

  public searchByIds(ids: number[]): Promise<ThemesMoeApi[]> {
    return axios
      .post<ThemesMoeApi[]>(`${ThemesMoeMusicDownloader.BASE_URL}/themes/search`, ids)
      .then((response) => response.data);
  }

  public getThemesUrlById(id: number): Promise<AnimeThemesMap> {
    return axios.get<ThemesMoeApi[]>(`${ThemesMoeMusicDownloader.BASE_URL}/themes/${id}`).then((response) => {
      if (response.data.length > 0) {
        return this.mapTitle(response.data[0]);
      }
      return {};
    });
  }

  public downloadMusicByQuestion(question: SIPackQuestion<AnimeItem>, destination: string): Promise<void> {
    return this.searchByName(question.data.originalName)
      .then((items) => {
        if (items.length > 0) {
          return this.searchByIds(items).then((titles) => this.mapTitle(titles?.[0]));
        }
        throw new Error('Anime not found');
      })
      .then((themes) => {
        const songs = themes[this.getTypeByRound(question.round)] || [];
        if (songs.length > 0) {
          return songs[getRandomInt(0, songs.length - 1)];
        }
        throw new Error('Themes not found');
      })
      .then((song) =>
        fsPromises.mkdir('ffmpegtemp', { recursive: true }).then(() => {
          const path = `ffmpegtemp/${uuid.v4()}`;
          return downloadFile(song, path).then(() => path);
        }),
      )
      .then((path) => {
        return new Promise<void>((resolve, reject) => {
          (this.options.musicRandomStart ? this.getTrackDuration(path) : Promise.resolve(0)).then((duration) => {
            const startTime = getRandomInt(
              0,
              Math.max(duration - (this.musicLength ?? ThemesMoeMusicDownloader.DEFAULT_MUSIC_TIME), 0),
            );
            ffmpeg(path)
              .audioBitrate(this.audioBitrate ?? 196)
              .setStartTime(startTime)
              .outputOptions(['-id3v2_version', '4'])
              .withAudioCodec('libmp3lame')
              .toFormat('mp3')
              .setDuration(this.musicLength ?? ThemesMoeMusicDownloader.DEFAULT_MUSIC_TIME)
              .once('error', reject)
              .once('end', resolve)
              .saveToFile(destination);
          });
        }).finally(() => {
          fsPromises.rm(path, { force: true }).catch();
        });
      });
  }

  public runTask(question: SIPackQuestion<AnimeItem>, destination: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const child = fork(
        `./${process.env.TASKS_FOLDER || 'tasks'}/download-themes-moe.task.js`,
        [
          Buffer.from(JSON.stringify(question)).toString('base64'),
          destination,
          Buffer.from(JSON.stringify(this.options)).toString('base64'),
          this.ffmpegPath,
        ],
        {
          detached: true,
          cwd: process.cwd(),
          stdio: 'inherit',
          env: process.env,
        },
      );
      child.unref();
      const timeoutRef = setTimeout(() => {
        kill(child.pid);
      }, MusicDownloaderProviderBase.DOWNLOAD_TIMEOUT);
      child.on('close', () => {
        if (timeoutRef) {
          clearTimeout(timeoutRef);
        }
        resolve();
      });
    });
  }
}
