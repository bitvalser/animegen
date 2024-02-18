import axios from 'axios';
import ffmpeg, { ffprobe } from 'fluent-ffmpeg';
import fsPromises from 'fs/promises';
import * as uuid from 'uuid';
import { fork } from 'child_process';
import kill from 'tree-kill';
import { PackRound } from '../constants/pack-round.constants';
import { getRandomInt } from '../helpers/random-number.helper';
import { MusicDownloaderProviderBase } from './music-downloader-provider-base.class';
import { downloadFile } from '../helpers/download-file.helper';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { AnisongDbApi } from '../interfaces/api/anisongdb-api.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { MusicProviders } from '../constants/music-providers.constants';

export class AnisongDBMusicDownloader extends MusicDownloaderProviderBase {
  private static BASE_URL = 'https://anisongdb.com/api';
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

  private getFiltersByRound(round: PackRound): Record<string, boolean> {
    return {
      ending_filter: round === PackRound.Endings,
      ignore_duplicate: false,
      insert_filter: round === PackRound.Inserts,
      opening_filter: round === PackRound.Openings,
    };
  }

  public getName(): MusicProviders {
    return MusicProviders.AnisongDB;
  }

  public searchById(id: string, filters: Record<string, string | boolean>): Promise<string[]> {
    return axios
      .post<AnisongDbApi[]>(`${AnisongDBMusicDownloader.BASE_URL}/annId_request`, {
        annId: id,
        ...filters,
      })
      .then((response) => response.data.map((item) => item.audio));
  }

  public downloadMusicByQuestion(question: SIPackQuestion<AnimeItem>, destination: string): Promise<void> {
    if (!question.data.annId) {
      throw new Error('Anime networks id not provided');
    }
    return this.searchById(question.data.annId, this.getFiltersByRound(question.round))
      .then((songs) => {
        if ((songs || []).length > 0) {
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
              Math.max(duration - (this.musicLength ?? AnisongDBMusicDownloader.DEFAULT_MUSIC_TIME), 0),
            );
            ffmpeg(path)
              .audioBitrate(this.audioBitrate ?? 196)
              .setStartTime(startTime)
              .outputOptions(['-id3v2_version', '4'])
              .withAudioCodec('libmp3lame')
              .toFormat('mp3')
              .setDuration(this.musicLength ?? AnisongDBMusicDownloader.DEFAULT_MUSIC_TIME)
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
        `./${process.env.TASKS_FOLDER || 'tasks'}/download-anisongdb.task.js`,
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
