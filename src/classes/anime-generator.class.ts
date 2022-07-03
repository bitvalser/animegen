import { AnimeCharacterRole } from '../constants/anime-character-role.constants';
import { AnimeKind } from '../constants/anime-kind.constants';
import { PackRound } from '../constants/pack-round.constants';
import { SIAtomType } from '../constants/si-atom-type.constants.constants';
import { downloadFile } from '../helpers/download-file.helper';
import { getRandomInt } from '../helpers/random-number.helper';
import { shuffleArray } from '../helpers/shuffle-array.helper';
import { splitArray } from '../helpers/split-array.helper';
import { AnimeCharacter } from '../interfaces/anime-character.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';
import { AnimeProviderBase } from './anime-provider-base.class';
import { MusicDownloaderProviderBase } from './music-downloader-provider-base.class';
import { SICustomQuestion, SIPackBuilder } from './si-pack-builder.class';
import { SIQuestionDownloaderBase } from './si-question-downloader-base.class';
import { CoubApi } from './coub-api.class';

export type ProgressListener = (percent: number, status: string) => void;

export class AnimeGenerator {
  private static QUESTION_PRICE = 100;
  private coubApi = CoubApi.getInstance();

  public constructor(
    private provider: AnimeProviderBase,
    private musicDownloaderProviderBase: MusicDownloaderProviderBase,
  ) {}

  public async createPack(
    options: Partial<GeneratorOptions> = {},
    progressListener: ProgressListener = () => null,
  ): Promise<string> {
    const defaultOptions: GeneratorOptions = {
      animeKinds: [AnimeKind.Film, AnimeKind.ONA, AnimeKind.OVA, AnimeKind.Special, AnimeKind.TV],
      charactersRoles: [AnimeCharacterRole.Main, AnimeCharacterRole.Supporting],
      imageCompression: 0.7,
      rounds: [PackRound.Characters, PackRound.Screenshots, PackRound.Openings, PackRound.Endings],
      titleCounts: 100,
      showScore: true,
      packName: 'Аниме доза-пак by Walerchik',
      ...options,
    };
    let progress = 0;
    progressListener(progress, 'Получение списка аниме....');
    const titles = await this.provider.getAnimeList();
    const musicDownloaderProvider = this.musicDownloaderProviderBase;
    const packBuilder = new SIPackBuilder(
      new (class extends SIQuestionDownloaderBase {
        public downloadImage(question: SICustomQuestion, type: PackRound, destination: string): Promise<void> {
          return downloadFile(question.originalBody, destination);
        }
        public downloadVideo(question: SICustomQuestion, type: PackRound, destination: string): Promise<void> {
          return downloadFile(question.originalBody, destination);
        }
        public downloadMusic(question: SICustomQuestion, type: PackRound, destination: string): Promise<void> {
          return musicDownloaderProvider.downloadMusicByName(question.originalBody, type, destination);
        }
      })(),
    );
    packBuilder.setInfo({
      name: defaultOptions.packName,
      author: `${this.provider.getProviderName()} ${this.provider.getName()}`,
    });
    packBuilder.setCompression(defaultOptions.imageCompression);

    if (defaultOptions.rounds.includes(PackRound.Screenshots) && this.provider.isRoundSupport(PackRound.Screenshots)) {
      const selected = shuffleArray(titles).slice(0, defaultOptions.titleCounts);
      const screenshots: {
        title: AnimeItem;
        screenshot: string;
      }[] = [];
      progressListener(
        (progress += 30 / defaultOptions.rounds.length),
        `Загрузка скриншотов (0/${selected.length})....`,
      );
      let i = 0;
      for (const title of selected) {
        const list = await this.provider.getAnimeScreenshots(title.id);
        if (list.length > 0) {
          screenshots.push({
            title,
            screenshot: list[getRandomInt(0, list.length - 1)],
          });
        }
        i += 1;
        progressListener(progress, `Загрузка скриншотов (${i}/${selected.length})....`);
      }
      splitArray(splitArray(screenshots, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Скриншоты ${array.length > 1 ? i + 1 : ''}`,
          PackRound.Screenshots,
          round.map((questions, i) => ({
            name: `Скриншоты ${i + 1}`,
            questions: questions.map(
              ({ screenshot, title }): SIPackQuestion => ({
                atomType: SIAtomType.Image,
                body: screenshot,
                price: AnimeGenerator.QUESTION_PRICE,
                rightAnswer: `${title.originalName} / ${title.russianName} ${
                  defaultOptions.showScore && title.score ? `(Оценка ${title.score})` : ''
                }`,
              }),
            ),
          })),
        );
      });
    }

    if (defaultOptions.rounds.includes(PackRound.Characters) && this.provider.isRoundSupport(PackRound.Characters)) {
      const selected = shuffleArray(titles).slice(0, defaultOptions.titleCounts);
      const characters: AnimeCharacter[] = [];
      progressListener((progress += 30 / defaultOptions.rounds.length), 'Загрузка персонажей...');
      let i = 0;
      for (const title of selected) {
        let list = await this.provider.getCharacterList(title.id);
        list = list.filter((item) => defaultOptions.charactersRoles.includes(item.roles[0]));
        if (list.length > 0) {
          characters.push(list[getRandomInt(0, list.length - 1)]);
        }
        i += 1;
        progressListener(progress, `Загрузка персонажей (${i}/${selected.length})....`);
      }

      splitArray(splitArray(characters, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Персонажи ${array.length > 1 ? i + 1 : ''}`,
          PackRound.Characters,
          round.map((questions, i) => ({
            name: `Персонажи ${i + 1}`,
            questions: questions
              .filter((item) => Boolean(item) && Boolean(item.image))
              .map(
                (character): SIPackQuestion => ({
                  atomType: SIAtomType.Image,
                  body: character.image,
                  price: AnimeGenerator.QUESTION_PRICE,
                  rightAnswer: `${character.originalName} / ${character.russianName}`,
                }),
              ),
          })),
        );
      });
    }

    if (defaultOptions.rounds.includes(PackRound.Openings) && this.provider.isRoundSupport(PackRound.Openings)) {
      const selected = shuffleArray(titles.filter((item) => [AnimeKind.TV, AnimeKind.ONA].includes(item.kind))).slice(
        0,
        defaultOptions.titleCounts,
      );
      progressListener((progress += 30 / defaultOptions.rounds.length), 'Сборка опенингов...');

      splitArray(splitArray(selected, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Опенинги ${array.length > 1 ? i + 1 : ''}`,
          PackRound.Openings,
          round.map((title, i) => ({
            name: `Опенинги ${i + 1}`,
            questions: title
              .filter((item) => Boolean(item))
              .map(
                (item): SIPackQuestion => ({
                  atomType: SIAtomType.Voice,
                  body: item.originalName,
                  price: AnimeGenerator.QUESTION_PRICE,
                  rightAnswer: `${item.originalName} / ${item.russianName}`,
                }),
              ),
          })),
        );
      });
    }

    if (defaultOptions.rounds.includes(PackRound.Endings) && this.provider.isRoundSupport(PackRound.Endings)) {
      const selected = shuffleArray(titles.filter((item) => [AnimeKind.TV, AnimeKind.ONA].includes(item.kind))).slice(
        0,
        defaultOptions.titleCounts,
      );
      progressListener((progress += 30 / defaultOptions.rounds.length), 'Сборка эндингов...');

      splitArray(splitArray(selected, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Эндинги${array.length > 1 ? i + 1 : ''}`,
          PackRound.Endings,
          round.map((title, i) => ({
            name: `Эндинги ${i + 1}`,
            questions: title
              .filter((item) => Boolean(item))
              .map(
                (item): SIPackQuestion => ({
                  atomType: SIAtomType.Voice,
                  body: item.originalName,
                  price: AnimeGenerator.QUESTION_PRICE,
                  rightAnswer: `${item.originalName} / ${item.russianName}`,
                }),
              ),
          })),
        );
      });
    }

    if (defaultOptions.rounds.includes(PackRound.Coubs) && this.provider.isRoundSupport(PackRound.Coubs)) {
      const selected = shuffleArray(titles).slice(0, defaultOptions.titleCounts);
      progressListener((progress += 30 / defaultOptions.rounds.length), 'Загрузка коубов...');
      let coubs = [];
      let i = 0;
      for (const title of selected) {
        try {
          let list = await this.coubApi.searchCoubs(title.originalName).then((data) => data.coubs);
          if (list.length > 0) {
            const selectedCoub = list[getRandomInt(0, list.length - 1)]?.file_versions?.share?.default;
            if (selectedCoub) {
              coubs.push({
                title,
                coub: selectedCoub,
              });
            }
          }
        } catch (error) {}
        i += 1;
        progressListener(progress, `Загрузка коубов (${i}/${selected.length})....`);
      }

      splitArray(splitArray(coubs, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Коубы${array.length > 1 ? i + 1 : ''}`,
          PackRound.Endings,
          round.map((coub, i) => ({
            name: `Коубы ${i + 1}`,
            questions: coub
              .filter((item) => Boolean(item))
              .map(
                (item): SIPackQuestion => ({
                  atomType: SIAtomType.Video,
                  body: item.coub,
                  price: AnimeGenerator.QUESTION_PRICE,
                  rightAnswer: `${item.title.originalName} / ${item.title.russianName}`,
                }),
              ),
          })),
        );
      });
    }

    progressListener(30, 'Сборка пакета....');
    return packBuilder.build(progressListener).then((path) => {
      progressListener(100, 'Готово!');
      return path;
    });
  }
}
