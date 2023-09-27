import { YoutubeMusicDownloader } from '../classes/youtube-music-downloader.class';

const [name, round, destination, jsonOptions] = global._TASK_CONTEXT?.args || process.argv.slice(2) || [];
console.log(`Скачивание ${name}...`);
const downloader = new YoutubeMusicDownloader(
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
