import 'axios';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { AnimeGenerator } from './classes/anime-generator.class';
import { AnimeProviderBase } from './classes/anime-provider-base.class';
import { MusicDownloaderProviderBase } from './classes/music-downloader-provider-base.class';
import { ShikimoriProvider } from './classes/shikimori-provider.class';
import { AppVersionsApi } from './classes//app-versions-api.class';
import { YoutubeMusicDownloader } from './classes/youtube-music-downloader.class';
import { AnimeCharacterRole } from './constants/anime-character-role.constants';
import { AnimeKind } from './constants/anime-kind.constants';
import { PackRound } from './constants/pack-round.constants';
import { GeneratorOptions } from './interfaces/generator-options.interface';
import yargs from 'yargs/yargs';
import fs from 'fs';
import { hideBin } from 'yargs/helpers';
import { CREATE_ARGUMENTS_DATA } from './data/create-arguments.data';
import packageJson from '../package.json';
import { MusicProviders } from './constants/music-providers.constants';
import { ThemesMoeMusicDownloader } from './classes/themes-moe-music-downloader.class';
import { SIPackBuilder } from './classes/si-pack-builder.class';
import { GeneratorRoundStrategy } from './classes/generator-round-strategy.class';
import { RoundsGeneratorStrategy } from './classes/rounds-generator-strategy.class';
import { RandomGeneratorStrategy } from './classes/random-generator-strategy.class';

const DELAY_INTERVAL_TIME = 15000;
type CreateArguments = Record<keyof typeof CREATE_ARGUMENTS_DATA, any> & Partial<GeneratorOptions>;

axiosRetry(axios, {
  retries: 3, // number of retries
  retryDelay: (retryCount) => {
    console.log(`\nПревышено число обращений к апи, повторная попытка: ${retryCount}`);
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

const getBuildStrategy = (formattedOptions: CreateArguments): GeneratorRoundStrategy => {
  if (formattedOptions.random) {
    return new RandomGeneratorStrategy();
  }
  return new RoundsGeneratorStrategy();
};

const getMusicProvider = (formattedOptions: CreateArguments): MusicDownloaderProviderBase => {
  switch (formattedOptions.musicProvider) {
    case MusicProviders.ThemesMoe:
      return new ThemesMoeMusicDownloader('libs/ffmpeg');
    case MusicProviders.Youtube:
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
    showScore: formattedOptions.showScore ?? true,
    noRepeats: formattedOptions.noRepeats ?? false,
  };
};

const patchConsoleFuncs = () => {
  const _originalLog = console.log;
  const _originalError = console.error;
  const _originalInfo = console.info;

  console.log = (...args) => {
    const firstArg = args[0];
    const restArgs = args.slice(1);
    _originalLog.apply(this, [`\n${firstArg}`, ...restArgs]);
  };

  console.error = (...args) => {
    const firstArg = args[0];
    const restArgs = args.slice(1);
    _originalError.apply(this, [`\n${firstArg}`, ...restArgs]);
  };

  console.info = (...args) => {
    const firstArg = args[0];
    const restArgs = args.slice(1);
    _originalInfo.apply(this, [`\n${firstArg}`, ...restArgs]);
  };
};

const endCommand = () => {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 0));
};

const options: any = yargs(hideBin(process.argv))
  .command(
    'generate [name] [titles] [compression] [kinds] [roles] [anime-provider] [music-provider] [upload] [parallel-size] [random] [skip-repeats]',
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
        .positional('random', {
          describe: 'смешивает выбранные раунды',
          type: 'boolean',
        })
        .positional('skip-repeats', {
          describe: 'убрать повторы из одной франшизы',
          type: 'boolean',
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
          describe: 'сервиса аниме который будет использоваться для получения списка',
          type: 'string',
        })
        .positional('parallel-size', {
          describe: 'количество-одновременных задач',
          type: 'number',
        })
        .positional('score', {
          describe: 'оценка тайтла от выбранного пользователя',
          type: 'boolean',
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
  .option('author', {
    type: 'boolean',
    description: 'автор программы',
  })
  .version(packageJson.version)
  .parse();

if (options.verbose) {
  console.log(options);
}

if (options.author) {
  console.log('Автор программы -> Walerchik (bitvalser@gmail.com)');
}

if (options['parallel-size']) {
  SIPackBuilder.PARALLEL_SIZE = Math.min(Math.max(options['parallel-size'] || 2, 1), 6);
}

const checkVersion = () => {
  const appVersions = AppVersionsApi.getInstance();
  appVersions
    .getLatestVersion()
    .then((data) => {
      if (data && data.version !== packageJson.version) {
        console.log(
          '\x1b[32m',
          `Есть более новая версия программы ${data.version}, ваша текущая версия ${packageJson.version}`,
          '\n',
          '\x1b[0m',
          data.url,
        );
      }
    })
    .catch();
};

if (options._[0] === 'generate') {
  patchConsoleFuncs();
  checkVersion();
  const formattedOptions: CreateArguments = {};
  let lastNotValidArg: string = null;
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
    const buildStrategy = getBuildStrategy(formattedOptions);
    const generator = new AnimeGenerator(animeProvider, musicProvider, buildStrategy);
    generator
      .createPack(getDefaultOptions(formattedOptions), (progress: number, status: string) => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${Math.ceil(progress)}% -> ${status}`);
      })
      .then((path) => {
        console.info(`Пак -> ${path}`);
        endCommand();
      })
      .catch((error) => {
        console.error(error.message || 'Что-то пошло не так :(');
        endCommand();
      });
  } else if (lastNotValidArg) {
    console.error(`Аргумент ${lastNotValidArg} не корректный!`);
  } else {
    console.error('Что-то пошло не так :(');
  }
}
if (options._[0] === 'run') {
  try {
    const taskFile = fs.readFileSync(options._[1]).toString();
    global._TASK_CONTEXT = {
      args: options._.slice(2),
    };
    eval(taskFile);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
} else {
  console.info('Запустите animegen --help для помощи');
}
