import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { AnimeGenerator } from './anime-generator.class';
import { GeneratorRoundStrategy } from './generator-round-strategy.class';
import { SIPackBuilder, SIPackThemeCreatePayload } from './si-pack-builder.class';
import { getRandomInt } from '../helpers/random-number.helper';
import { shuffleArray } from '../helpers/shuffle-array.helper';
import { splitArray } from '../helpers/split-array.helper';
import { AnimeCharacter } from '../interfaces/anime-character.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { SIAtomType } from '../constants/si-atom-type.constants.constants';
import { PackRound } from '../constants/pack-round.constants';

export class RoundsGeneratorStrategy extends GeneratorRoundStrategy {
  public async buildRounds(
    generator: AnimeGenerator,
    defaultOptions: GeneratorOptions,
    packBuilder: SIPackBuilder<AnimeItem>,
    titles: AnimeItem[],
  ): Promise<void> {
    const screenshotsRound =
      defaultOptions.rounds.includes(PackRound.Screenshots) && generator.provider.isRoundSupport(PackRound.Screenshots);
    const charactersRound =
      defaultOptions.rounds.includes(PackRound.Characters) && generator.provider.isRoundSupport(PackRound.Characters);
    const openingsRound =
      defaultOptions.rounds.includes(PackRound.Openings) && generator.provider.isRoundSupport(PackRound.Openings);
    const endingsRound =
      defaultOptions.rounds.includes(PackRound.Endings) && generator.provider.isRoundSupport(PackRound.Endings);
    const coubsRound =
      defaultOptions.rounds.includes(PackRound.Coubs) && generator.provider.isRoundSupport(PackRound.Coubs);

    this.progressLogger.defineSteps(
      [
        screenshotsRound && { size: defaultOptions.titleCounts },
        charactersRound && { size: defaultOptions.titleCounts },
        coubsRound && { size: defaultOptions.titleCounts },
      ].filter(Boolean),
    );
    this.allTitles = shuffleArray(titles);

    if (screenshotsRound) {
      const selected = this.getTitlesForRound(PackRound.Screenshots, defaultOptions);
      const screenshots: {
        title: AnimeItem;
        screenshot: string;
      }[] = [];
      this.progressLogger.info(`Загрузка скриншотов (0/${selected.length})....`);
      let i = 0;
      for (const title of selected) {
        const list = await generator.provider.getAnimeScreenshots(title.id);
        if (list.length > 0) {
          screenshots.push({
            title,
            screenshot: list[getRandomInt(0, list.length - 1)],
          });
        }
        i += 1;
        this.progressLogger.doInfoStep(`Загрузка скриншотов (${i}/${selected.length})....`);
      }
      splitArray(splitArray(screenshots, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Скриншоты ${array.length > 1 ? i + 1 : ''}`,
          PackRound.Screenshots,
          round.map((questions, i) => ({
            name: `Скриншоты ${i + 1}`,
            questions: questions.map(({ screenshot, title }) => ({
              atomType: SIAtomType.Image,
              body: screenshot,
              price: AnimeGenerator.QUESTION_PRICE,
              rightAnswer: `${title.originalName} / ${title.russianName} ${
                defaultOptions.showScore && title.score ? `(Оценка ${title.score})` : ''
              }`,
              data: title,
            })) as SIPackThemeCreatePayload<AnimeItem>['questions'],
          })),
        );
      });
      this.progressLogger.finishStep();
    }

    if (charactersRound) {
      const selected = this.getTitlesForRound(PackRound.Characters, defaultOptions);
      const characters: (AnimeCharacter & { anime: AnimeItem })[] = [];
      this.progressLogger.info('Загрузка персонажей...');
      let i = 0;
      for (const title of selected) {
        let list = (await generator.provider.getCharacterList(title.id)) as never as (AnimeCharacter & {
          anime: AnimeItem;
        })[];
        list = list
          .filter((item) => defaultOptions.charactersRoles.includes(item.roles[0]))
          .map((item) => ({
            ...item,
            anime: title,
          }));
        if (list.length > 0) {
          characters.push(list[getRandomInt(0, list.length - 1)]);
        }
        i += 1;
        this.progressLogger.doInfoStep(`Загрузка персонажей (${i}/${selected.length})....`);
      }

      splitArray(splitArray(characters, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Персонажи ${array.length > 1 ? i + 1 : ''}`,
          PackRound.Characters,
          round.map((questions, i) => ({
            name: `Персонажи ${i + 1}`,
            questions: questions
              .filter((item) => Boolean(item) && Boolean(item.image))
              .map((character) => ({
                atomType: SIAtomType.Image,
                body: character.image,
                price: AnimeGenerator.QUESTION_PRICE,
                rightAnswer: `${character.originalName} / ${character.russianName}`,
                data: character.anime,
              })) as SIPackThemeCreatePayload<AnimeItem>['questions'],
          })),
        );
      });
      this.progressLogger.finishStep();
    }

    if (openingsRound) {
      const selected = this.getTitlesForRound(PackRound.Openings, defaultOptions);

      this.progressLogger.info('Сборка опенингов...');

      splitArray(splitArray(selected, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Опенинги ${array.length > 1 ? i + 1 : ''}`,
          PackRound.Openings,
          round.map((title, i) => ({
            name: `Опенинги ${i + 1}`,
            questions: title
              .filter((item) => Boolean(item))
              .map((item) => ({
                atomType: SIAtomType.Voice,
                body: item.originalName,
                price: AnimeGenerator.QUESTION_PRICE,
                rightAnswer: `${item.originalName} / ${item.russianName}`,
                data: item,
              })) as SIPackThemeCreatePayload<AnimeItem>['questions'],
          })),
        );
      });
    }

    if (endingsRound) {
      const selected = this.getTitlesForRound(PackRound.Endings, defaultOptions);

      this.progressLogger.info('Сборка эндингов...');

      splitArray(splitArray(selected, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Эндинги${array.length > 1 ? i + 1 : ''}`,
          PackRound.Endings,
          round.map((title, i) => ({
            name: `Эндинги ${i + 1}`,
            questions: title
              .filter((item) => Boolean(item))
              .map((item) => ({
                atomType: SIAtomType.Voice,
                body: item.originalName,
                price: AnimeGenerator.QUESTION_PRICE,
                rightAnswer: `${item.originalName} / ${item.russianName}`,
                data: item,
              })) as SIPackThemeCreatePayload<AnimeItem>['questions'],
          })),
        );
      });
    }

    if (coubsRound) {
      const selected = this.getTitlesForRound(PackRound.Coubs, defaultOptions);

      this.progressLogger.info('Загрузка коубов...');
      const coubs: {
        title: AnimeItem;
        coub: string;
      }[] = [];
      let i = 0;
      for (const title of selected) {
        try {
          const list = await generator.coubApi.searchCoubs(title.originalName).then((data) => data.coubs);
          if (list.length > 0) {
            const selectedCoub = list[getRandomInt(0, list.length - 1)]?.file_versions?.share?.default;
            if (selectedCoub) {
              coubs.push({
                title,
                coub: selectedCoub,
              });
            }
          }
        } catch (error) {
          console.error(error);
        }
        i += 1;
        this.progressLogger.doInfoStep(`Загрузка коубов (${i}/${selected.length})....`);
      }

      splitArray(splitArray(coubs, 15), 10).forEach((round, i, array) => {
        packBuilder.addRound(
          `Коубы ${array.length > 1 ? i + 1 : ''}`,
          PackRound.Endings,
          round.map((coub, i) => ({
            name: `Коубы ${i + 1}`,
            questions: coub
              .filter((item) => Boolean(item))
              .map((item) => ({
                atomType: SIAtomType.Video,
                body: item.coub,
                price: AnimeGenerator.QUESTION_PRICE,
                rightAnswer: `${item.title.originalName} / ${item.title.russianName}`,
                data: item.title,
              })) as SIPackThemeCreatePayload<AnimeItem>['questions'],
          })),
        );
      });
      this.progressLogger.finishStep();
    }
  }
}
