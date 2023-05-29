import { ThemesMoeMusicDownloader } from '../classes/themes-moe-music-downloader.class';

const [name, round, destination, jsonOptions] = global._TASK_CONTEXT?.args || [];
console.log(`Скачивание ${name}...`);
const downloader = new ThemesMoeMusicDownloader(
  process.env.FFMPEG_PATH || 'libs/ffmpeg',
  JSON.parse(Buffer.from(jsonOptions, 'base64').toString('ascii')),
);
downloader
  .downloadMusicByName(name, round, destination)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
