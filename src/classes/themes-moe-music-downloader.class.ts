import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fsPromises from 'fs/promises';
import rimraf from 'rimraf';
import fs from 'fs';
import * as uuid from 'uuid';
import { AnimeThemeType } from '../constants/anime-theme-type.constants';
import { PackRound } from '../constants/pack-round.constants';
import { ThemesMoeApi } from '../interfaces/api/themes-moe-api.interface';
import { getRandomInt } from '../helpers/random-number.helper';
import { MusicDownloaderProviderBase } from './music-downloader-provider-base.class';
import { downloadFile } from '../helpers/download-file.helper';

type AnimeThemesMap = {
  [key in AnimeThemeType]?: string[];
};

export class ThemesMoeMusicDownloader extends MusicDownloaderProviderBase {
  private static BASE_URL = 'https://themes.moe/api';
  private static MUSIC_TIME = 30;

  public constructor(private ffmpegPath: string = process.env.FFMPEG_PATH) {
    super();
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

  public searchByName(name: string): Promise<number[]> {
    return axios
      .get<number[]>(`${ThemesMoeMusicDownloader.BASE_URL}/anime/search/${encodeURIComponent(name)}`)
      .then((response) => response.data);
  }

  public getThemesUrlById(id: number): Promise<AnimeThemesMap> {
    return axios.get<ThemesMoeApi[]>(`${ThemesMoeMusicDownloader.BASE_URL}/themes/${id}`).then((response) => {
      if (response.data.length > 0) {
        return response.data[0].themes
          .filter((item) => item)
          .reduce<AnimeThemesMap>((acc, val) => {
            const type = this.getTypeByApiType(val.themeType);
            return {
              ...acc,
              [type]: [...(acc[type] || []), val.mirror.mirrorURL],
            };
          }, {});
      }
      return {};
    });
  }

  public downloadMusicByName(name: string, type: PackRound, destination: string): Promise<void> {
    return this.searchByName(name)
      .then((items) => {
        if (items.length > 0) {
          return this.getThemesUrlById(items[items.length - 1]);
        }
        throw new Error('Anime not found');
      })
      .then((themes) => {
        const songs = themes[(this, this.getTypeByRound(type))] || [];
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
          ffmpeg({
            source: fs.createReadStream(path),
          })
            .audioBitrate(192)
            .withAudioCodec('libmp3lame')
            .toFormat('mp3')
            .setDuration(ThemesMoeMusicDownloader.MUSIC_TIME)
            .on('error', reject)
            .on('end', resolve)
            .saveToFile(destination);
        }).finally(() => {
          rimraf(path, {}, () => {});
        });
      });
  }
}
