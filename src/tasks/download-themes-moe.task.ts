import { ThemesMoeMusicDownloader } from '../classes/themes-moe-music-downloader.class';

const [name, round, destination] = global._TASK_CONTEXT?.args || [];
console.log(`Скачивание ${name}...`);
const downloader = new ThemesMoeMusicDownloader(process.env.FFMPEG_PATH || 'libs/ffmpeg');
downloader
  .downloadMusicByName(name, round, destination)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
