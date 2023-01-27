import { YoutubeMusicDownloader } from '../classes/youtube-music-downloader.class';

const [name, round, destination] = global._TASK_CONTEXT?.args || [];
console.log(`Скачивание ${name}...`);
const downloader = new YoutubeMusicDownloader(process.env.FFMPEG_PATH || 'libs/ffmpeg');
downloader
  .downloadMusicByName(name, round, destination)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
