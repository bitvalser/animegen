import { AnimeThemesMusicDownloader } from '../classes/anime-themes-music-downloader.class';

const [jsonQuestion, destination, jsonOptions, ffmpegPath] = global._TASK_CONTEXT?.args || process.argv.slice(2) || [];
const downloader = new AnimeThemesMusicDownloader(
  process.env.FFMPEG_PATH || ffmpegPath || 'libs/ffmpeg',
  JSON.parse(Buffer.from(jsonOptions, 'base64').toString('ascii')),
);
downloader
  .downloadMusicByQuestion(JSON.parse(Buffer.from(jsonQuestion, 'base64').toString('utf-8')), destination)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
