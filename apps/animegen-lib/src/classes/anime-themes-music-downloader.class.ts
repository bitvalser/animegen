import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fsPromises from 'fs/promises';
import * as uuid from 'uuid';
import { fork } from 'child_process';
import kill from 'tree-kill';
import { AnimeThemeType } from '../constants/anime-theme-type.constants';
import { PackRound } from '../constants/pack-round.constants';
import { AnimeThemesItemApi } from '../interfaces/api/anime-themes-item-api.interface';
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

export class AnimeThemesMusicDownloader extends MusicDownloaderProviderBase {
  private static BASE_URL = 'https://api.animethemes.moe';
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

  private mapTitle(title: AnimeThemesItemApi): AnimeThemesMap {
    if (title?.animethemes) {
      return (title.animethemes || []).reduce<AnimeThemesMap>((acc, val) => {
        const type = this.getTypeByApiType(val.type);
        return {
          ...acc,
          [type]: [
            ...(acc[type] || []),
            ...(val.animethemeentries || []).map((item) => item.videos[0]?.link).filter(Boolean),
          ],
        };
      }, {});
    }
    return {};
  }

  public getName(): MusicProviders {
    return MusicProviders.AnimeThemes;
  }

  public searchById(id: string): Promise<AnimeThemesItemApi> {
    return axios
      .get<{ anime: AnimeThemesItemApi[] }>(
        `${AnimeThemesMusicDownloader.BASE_URL}/anime?include=animethemes.animethemeentries.videos&filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${id}`,
      )
      .then((response) => (response.data?.anime || [])[0]);
  }

  public downloadMusicByQuestion(question: SIPackQuestion<AnimeItem>, destination: string): Promise<void> {
    return this.searchById(question.data.id)
      .then((anime) => {
        if (anime) {
          return this.mapTitle(anime);
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
              Math.max(duration - (this.musicLength ?? AnimeThemesMusicDownloader.DEFAULT_MUSIC_TIME), 0),
            );
            ffmpeg(path)
              .audioBitrate(this.audioBitrate ?? 196)
              .setStartTime(startTime)
              .outputOptions(['-id3v2_version', '4'])
              .withAudioCodec('libmp3lame')
              .toFormat('mp3')
              .setDuration(this.musicLength ?? AnimeThemesMusicDownloader.DEFAULT_MUSIC_TIME)
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
        `./${process.env.TASKS_FOLDER || 'tasks'}/download-anime-themes.task.js`,
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
