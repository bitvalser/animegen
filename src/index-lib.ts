import 'axios';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { AnimeGenerator } from './classes/anime-generator.class';
import { AnimeProviderBase } from './classes/anime-provider-base.class';
import { MusicDownloaderProviderBase } from './classes/music-downloader-provider-base.class';
import { ShikimoriProvider } from './classes/shikimori-provider.class';
import { YoutubeMusicDownloader } from './classes/youtube-music-downloader.class';
import { AnimeCharacterRole } from './constants/anime-character-role.constants';
import { AnimeKind } from './constants/anime-kind.constants';
import { PackRound } from './constants/pack-round.constants';
import { GeneratorOptions } from './interfaces/generator-options.interface';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { CREATE_ARGUMENTS_DATA } from './data/create-arguments.data';
import packageJson from '../package.json';

const DELAY_INTERVAL_TIME = 10000;
type CreateArguments = Record<keyof typeof CREATE_ARGUMENTS_DATA, any> & Partial<GeneratorOptions>;

axiosRetry(axios, {
  retries: 3, // number of retries
  retryDelay: (retryCount) => {
    console.log(`Превышено число обращений к апи, повторная попытка: ${retryCount}`);
    return retryCount * DELAY_INTERVAL_TIME;
  },
  retryCondition: (error) => error.response.status === 429,
});

const getAnimeProvider = (formattedOptions: CreateArguments): AnimeProviderBase => {
  switch (formattedOptions.animeProvider) {
    default:
      return new ShikimoriProvider(formattedOptions.name);
  }
};

const getMusicProvider = (formattedOptions: CreateArguments): MusicDownloaderProviderBase => {
  switch (formattedOptions.musicProvider) {
    default:
      return new YoutubeMusicDownloader('libs/ffmpeg');
  }
};

const getDefaultOptions = (formattedOptions: CreateArguments): Partial<GeneratorOptions> => {
  return {
    animeKinds: formattedOptions.animeKinds || [
      AnimeKind.Film,
      AnimeKind.ONA,
      AnimeKind.OVA,
      AnimeKind.Special,
      AnimeKind.TV,
    ],
    charactersRoles: formattedOptions.charactersRoles || [AnimeCharacterRole.Main, AnimeCharacterRole.Supporting],
    imageCompression: formattedOptions.imageCompression || 0.7,
    ...(formattedOptions.packName ? { packName: formattedOptions.packName } : {}),
    rounds: formattedOptions.rounds || [
      PackRound.Characters,
      PackRound.Endings,
      PackRound.Screenshots,
      PackRound.Openings,
    ],
    titleCounts: formattedOptions.titleCounts || 50,
    showScore: false,
  };
};

const options: any = yargs(hideBin(process.argv))
  .command(
    'generate [name] [titles] [compression] [kinds] [roles] [anime-provider] [music-provider] [upload]',
    'генерирует сигейм аниме пак',
    (yargs) => {
      return yargs
        .positional('name', {
          describe: 'имя пользователя используемого провайдера аниме листа (прим. shikimori)',
          type: 'string',
        })
        .positional('titles', {
          describe: 'количество тайтлов используемых для генерации',
          type: 'string',
        })
        .positional('compression', {
          describe: 'качество сжатия изображения',
          type: 'number',
        })
        .positional('kinds', {
          describe: 'типы аниме учавствующие в выборке',
          type: 'string',
        })
        .positional('roles', {
          describe: 'роли аниме персонажей учавствующие в выборке',
          type: 'string',
        })
        .positional('anime-provider', {
          describe: '',
          type: 'string',
        })
        .positional('music-provider', {
          describe: '',
          type: 'string',
        })
        .positional('upload', {
          describe: 'загрузка аниме пака на облако',
          type: 'boolean',
        });
    },
  )
  .option('verbose', {
    type: 'boolean',
    description: 'запуск команды с логгированием событий',
  })
  .version(packageJson.version)
  .parse();

if (options.verbose) {
  console.log(options);
}

if (options._[0] === 'generate') {
  const formattedOptions: CreateArguments = {};
  let lastNotValidArg = null;
  let isValid = Object.entries(CREATE_ARGUMENTS_DATA).every(([arg, data]) => {
    if (options[arg]) {
      const isValid = data.validator(options[arg]);
      if (isValid) {
        formattedOptions[data.mapTo || arg] = data.mapValue ? data.mapValue(options[arg]) : options[arg];
      } else {
        lastNotValidArg = arg;
      }
      return isValid;
    }
    return !data.required;
  });
  if (isValid) {
    const animeProvider = getAnimeProvider(formattedOptions);
    const musicProvider = getMusicProvider(formattedOptions);
    const generator = new AnimeGenerator(animeProvider, musicProvider);
    generator
      .createPack(getDefaultOptions(formattedOptions), (progress: number, status: string) => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${Math.ceil(progress)}% -> ${status}`);
      })
      .then((path) => {
        console.info(`\nПак -> ${path}`);
      })
      .catch((error) => {
        console.error(error.message || 'Что-то пошло не так :(');
      });
  } else if (lastNotValidArg) {
    console.error(`Аргумент ${lastNotValidArg} не корректный!`);
  } else {
    console.error('Что-то пошло не так :(');
  }
} else {
  console.info('Запустите animegen --help для помощи');
}
