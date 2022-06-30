import YoutubeMp3Downloader from 'youtube-mp3-downloader';
import * as youtubeSearch from 'youtube-search-without-api-key';
import { PackRound } from '../constants/pack-round.constants';
import { MusicDownloaderProviderBase } from './music-downloader-provider-base.class';

export class YoutubeMusicDownloader extends MusicDownloaderProviderBase {
  private static BASE_URL = 'https://www.googleapis.com/youtube/v3';
  private static MUSIC_TIME = 30;

  public constructor(private ffmpegPath: string = process.env.FFMPEG_PATH) {
    super();
  }

  private getNameByType(name: string, type: PackRound) {
    switch (type) {
      case PackRound.Openings:
        return `${name} opening`;
      case PackRound.Endings:
        return `${name} ending`;
      default:
        return name;
    }
  }

  public downloadMusicByName(name: string, type: PackRound, destination: string): Promise<void> {
    return youtubeSearch
      .search(this.getNameByType(name, type))
      .then((items) => {
        if (items.length > 0) {
          return items[0].id.videoId;
        } else {
          throw new Error('Video not found!');
        }
      })
      .then((videoId) => {
        const path = destination.split('/');
        const filename = path.pop();
        return new Promise<void>((resolve, reject) => {
          const downloader = new YoutubeMp3Downloader({
            ffmpegPath: this.ffmpegPath,
            outputPath: path.join('/'),
            youtubeVideoQuality: 'lowest',
            queueParallelism: 2,
            progressTimeout: 2000,
            allowWebm: false,
          });
          downloader.on('finished', resolve);
          downloader.on('error', reject);
          downloader.download(videoId, filename, (proc) => proc.setDuration(YoutubeMusicDownloader.MUSIC_TIME));
        });
      });
  }
}
