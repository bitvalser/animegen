import { ThemesMoeMusicDownloader } from '../classes/themes-moe-music-downloader.class';

console.log(`Скачивание ${process.argv[2]}...`);
const downloader = new ThemesMoeMusicDownloader(process.env.FFMPEG_PATH || 'libs/ffmpeg');
downloader
  .downloadMusicByName(process.argv[2], process.argv[3] as never, process.argv[4])
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
