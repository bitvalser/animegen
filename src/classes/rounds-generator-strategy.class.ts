import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { AnimeGenerator, ProgressListener } from './anime-generator.class';
import { GeneratorRoundStrategy } from './generator-round-strategy.class';
import { SIPackBuilder } from './si-pack-builder.class';
import { getRandomInt } from '../helpers/random-number.helper';
import { shuffleArray } from '../helpers/shuffle-array.helper';
import { splitArray } from '../helpers/split-array.helper';
import { AnimeCharacter } from '../interfaces/anime-character.interface';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';
import { SIAtomType } from '../constants/si-atom-type.constants.constants';
import { PackRound } from '../constants/pack-round.constants';
import { AnimeKind } from '../constants/anime-kind.constants';

export class RoundsGeneratorStrategy extends GeneratorRoundStrategy {
  public async buildRounds(
    generator: AnimeGenerator,
    defaultOptions: GeneratorOptions,
    packBuilder: SIPackBuilder,
    titles: AnimeItem[],
    progressListener: ProgressListener,
  ): Promise<void> {
    let progress = 0;
    if (
      defaultOptions.rounds.includes(PackRound.Screenshots) &&
      generator.provider.isRoundSupport(PackRound.Screenshots)
    ) {
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
        const list = await generator.provider.getAnimeScreenshots(title.id);
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

    if (
      defaultOptions.rounds.includes(PackRound.Characters) &&
      generator.provider.isRoundSupport(PackRound.Characters)
    ) {
      const selected = shuffleArray(titles).slice(0, defaultOptions.titleCounts);
      const characters: AnimeCharacter[] = [];
      progressListener((progress += 30 / defaultOptions.rounds.length), 'Загрузка персонажей...');
      let i = 0;
      for (const title of selected) {
        let list = await generator.provider.getCharacterList(title.id);
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

    if (defaultOptions.rounds.includes(PackRound.Openings) && generator.provider.isRoundSupport(PackRound.Openings)) {
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

    if (defaultOptions.rounds.includes(PackRound.Endings) && generator.provider.isRoundSupport(PackRound.Endings)) {
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

    if (defaultOptions.rounds.includes(PackRound.Coubs) && generator.provider.isRoundSupport(PackRound.Coubs)) {
      const selected = shuffleArray(titles).slice(0, Math.ceil(defaultOptions.titleCounts * (3 / 2)));
      progressListener((progress += 30 / defaultOptions.rounds.length), 'Загрузка коубов...');
      let coubs: {
        title: AnimeItem;
        coub: string;
      }[] = [];
      let i = 0;
      for (const title of selected) {
        try {
          let list = await generator.coubApi.searchCoubs(title.originalName).then((data) => data.coubs);
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
  }
}
