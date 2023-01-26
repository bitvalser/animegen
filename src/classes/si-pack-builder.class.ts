import * as uuid from 'uuid';
import fsPromises from 'fs/promises';
import sharp from 'sharp';
import archiver from 'archiver';
import formatXml from 'xml-formatter';
import rimraf from 'rimraf';
import { SIPackInfo } from '../interfaces/si/si-pack-info.interface';
import { SIPackRound } from '../interfaces/si/si-pack-round.interface';
import { SIPackTheme } from '../interfaces/si/si-pack-theme.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';
import { SIAtomType } from '../constants/si-atom-type.constants.constants';
import { ProgressListener } from './anime-generator.class';
import { createWriteStream } from 'fs';
import { SIQuestionDownloaderBase } from './si-question-downloader-base.class';
import { PackRound } from '../constants/pack-round.constants';
import { splitArray } from '../helpers/split-array.helper';

export type SICustomQuestion = SIPackQuestion & {
  originalBody: string;
  id: string;
  roundIndex: number;
};

export class SIPackBuilder {
  public static PARALLEL_SIZE = 3;
  private id: string;
  private date: string;
  private info: SIPackInfo;
  private rounds: SIPackRound<SICustomQuestion>[] = [];
  private questions: {
    [id: string]: SICustomQuestion;
  } = {};
  private compressionFactor = 0.7;

  public constructor(private downloader: SIQuestionDownloaderBase) {
    this.id = uuid.v4();
    this.date = new Date().toLocaleDateString();
  }

  private getQuestionBody(question: SIPackQuestion, id: string): string {
    switch (question.atomType) {
      case SIAtomType.Voice:
        return `@${id}.mp3`;
      case SIAtomType.Image:
        return `@${id}.jpg`;
      case SIAtomType.Video:
        return `@${id}.mp4`;
      default:
        return question.body;
    }
  }

  public setInfo(info: SIPackInfo): SIPackBuilder {
    this.info = {
      ...this.info,
      ...info,
    };
    return this;
  }

  public addRound(name: string, type: PackRound, themes: SIPackTheme[]): SIPackBuilder {
    this.rounds.push({
      type,
      name,
      themes: themes.map((theme) => ({
        ...theme,
        questions: theme.questions.map((question): SICustomQuestion => {
          const questionId = uuid.v4();
          const { body, rightAnswer, originalBody, id, roundIndex, round } = (this.questions[questionId] = {
            ...question,
            originalBody: question.body,
            roundIndex: this.rounds.length,
            body: this.getQuestionBody(question, questionId),
            id: questionId,
            round: question.round || type,
            rightAnswer: question.rightAnswer.replace(/[&]/g, 'and'),
          });
          return {
            ...question,
            roundIndex,
            id,
            round,
            originalBody,
            rightAnswer,
            body,
          };
        }),
      })),
    });
    return this;
  }

  public setCompression(factor: number): SIPackBuilder {
    this.compressionFactor = Math.min(Math.max(factor, 0.1), 1);
    return this;
  }

  public build(progressListener: ProgressListener = (): void => null): Promise<string> {
    let progress = 30;
    progressListener((progress += 2), 'Создание основных каталогов...');
    return (async () => {
      await fsPromises.mkdir(`packs/${this.id}/Images`, { recursive: true });
      await fsPromises.mkdir(`gentemp/${this.id}/imgs`, { recursive: true });
      await fsPromises.mkdir(`packs/${this.id}/Audio`, { recursive: true });
      await fsPromises.mkdir(`packs/${this.id}/Texts`, { recursive: true });
      await fsPromises.mkdir(`packs/${this.id}/Video`, { recursive: true });
      await fsPromises.writeFile(
        `packs/${this.id}/Texts/authors.xml`,
        '<?xml version="1.0" encoding="utf-8"?><Authors />',
      );
      await fsPromises.writeFile(
        `packs/${this.id}/Texts/sources.xml`,
        '<?xml version="1.0" encoding="utf-8"?><Sources />',
      );
      await fsPromises.writeFile(
        `packs/${this.id}/[Content_Types].xml`,
        '<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="si/xml" /></Types>',
      );
    })()
      .then(() =>
        (async () => {
          // IMAGE TASKS
          const questionsImagesToDownload = Object.values(this.questions).filter(
            (question) => question.atomType === SIAtomType.Image,
          );
          progressListener((progress += 3), `Скачивание изображений (0/${questionsImagesToDownload.length})...`);
          let i = 0;
          for (const question of questionsImagesToDownload) {
            try {
              await this.downloader.downloadImage(
                question,
                question.round,
                `gentemp/${this.id}/imgs/${question.id}.jpg`,
              );
              // eslint-disable-next-line no-empty
            } catch (error) {}
            i += 1;
            progressListener(
              progress + 15 * (i / questionsImagesToDownload.length),
              `Скачивание изображений (${i}/${questionsImagesToDownload.length})...`,
            );
          }
          progress = 50;

          // MUSIC TASKS
          const questionsMusicToDownload = Object.values(this.questions).filter(
            (question) => question.atomType === SIAtomType.Voice,
          );
          progressListener(progress, `\nСкачивание музыки (0/${questionsMusicToDownload.length})...`);

          const musicDownloadTask = async (question: SICustomQuestion) => {
            try {
              await this.downloader.downloadMusic(
                question,
                question.round,
                `packs/${this.id}/Audio/${question.id}.mp3`,
              );
              await fsPromises.access(`packs/${this.id}/Audio/${question.id}.mp3`);
              // eslint-disable-next-line no-empty
            } catch (error) {
              console.log(`${question.originalBody}\n${error}`);
              delete this.questions[question.id];
            }
          };

          const questionsMusicToDownloadChunks = splitArray(questionsMusicToDownload, SIPackBuilder.PARALLEL_SIZE);
          i = 0;
          for (const questions of questionsMusicToDownloadChunks) {
            await Promise.all(questions.map(musicDownloadTask));
            i += SIPackBuilder.PARALLEL_SIZE;
            progressListener(
              progress + 15 * (i / questionsMusicToDownload.length),
              `Скачивание музыки (${i}/${questionsMusicToDownload.length})...`,
            );
          }
          progress = 50;

          // VIDEO TASKS
          const questionsVideoToDownload = Object.values(this.questions).filter(
            (question) => question.atomType === SIAtomType.Video,
          );
          progressListener(progress, `Скачивание видео (0/${questionsVideoToDownload.length})...`);
          i = 0;
          for (const question of questionsVideoToDownload) {
            try {
              await this.downloader.downloadVideo(
                question,
                question.round,
                `packs/${this.id}/Video/${question.id}.mp4`,
              );
              // eslint-disable-next-line no-empty
            } catch (error) {}
            i += 1;
            progressListener(
              progress + 15 * (i / questionsVideoToDownload.length),
              `Скачивание видео (${i}/${questionsVideoToDownload.length})...`,
            );
          }
          progress = 80;
        })(),
      )
      .then(() => {
        progressListener(progress, `Сжатие изображений...`);
        return fsPromises.readdir(`gentemp/${this.id}/imgs`).then((files) =>
          (async () => {
            for (const file of files) {
              try {
                await sharp(`gentemp/${this.id}/imgs/${file}`, {
                  failOnError: false,
                })
                  .jpeg({
                    quality: this.compressionFactor * 100,
                    force: true,
                    progressive: true,
                  })
                  .toFile(`packs/${this.id}/Images/${file}`);
              } catch (error) {
                progressListener(progress, `Проблема с сжатием изображения ${file}, копируем в оригинал...`);
                try {
                  await fsPromises.copyFile(`gentemp/${this.id}/imgs/${file}`, `packs/${this.id}/Images/${file}`);
                } catch (error) {
                  progressListener(progress, `Пропускаем файл ${file} из-за прооблем с доступом...`);
                }
              }
            }
          })(),
        );
      })
      .then(() => {
        progressListener((progress += 9), `Удаления буфферной папки gentemp...`);
        return new Promise<void>((resolve) => {
          rimraf(`gentemp/${this.id}`, {}, (error) => {
            if (error) {
              console.log(
                'Проблема с удалением буферной папки, пожалуйста удалите её самостоятельно после закрытия программы!',
              );
              console.log(error);
            }
            resolve();
          });
        });
      })
      .then(() => {
        progressListener((progress += 1), `Создание content.xml...`);
        const content = `
        <?xml version="1.0" encoding="utf-8"?>
        <package name="${this.info.name}" version="4" id="${this.id}" date="${
          this.date
        }" difficulty="5" xmlns="http://vladimirkhil.com/ygpackage3.0.xsd">
          <info>
            <authors>
              <author>${this.info.author}</author>
              <author>Walerchik</author>
            </authors>
          </info>
          <rounds>
            ${this.rounds
              .map(
                (round) => `
            <round name="${round.name}">
              <themes>
                ${round.themes
                  .map(
                    (theme) => `
                <theme name="${theme.name}">
                  <questions>
                    ${theme.questions
                      .filter((item) => Boolean(this.questions[item.id]))
                      .map((item) => this.questions[item.id])
                      .map(
                        (question) => `
                    <question price="${question.price}">
                      <scenario>
                        ${question.comment ? `<atom type="say">${question.comment}</comments>` : ''}
                        ${
                          question.atomType === SIAtomType.Text
                            ? `<atom>${question.body}</atom>`
                            : `<atom type="${question.atomType}">${question.body}</atom>`
                        }
                      </scenario>
                      <right>
                        <answer>${question.rightAnswer}</answer>
                      </right>
                    </question>
                    `,
                      )
                      .join('')}
                  </questions>
                </theme>
                `,
                  )
                  .join('')}
              </themes>
            </round>
            `,
              )
              .join('')}
          </rounds>
        </package>
        `;
        return fsPromises.writeFile(
          `packs/${this.id}/content.xml`,
          formatXml(content, {
            indentation: ' ',
            collapseContent: true,
          }),
        );
      })
      .then(() => {
        progressListener((progress += 5), `Архивирование пакета...`);
        return new Promise<void>((resolve, reject) => {
          const output = createWriteStream(`packs/${this.id}.siq`);
          const archive = archiver('zip');

          output.on('close', () => {
            resolve();
          });
          output.on('end', () => {
            reject('Data has been drained');
          });
          archive.on('error', function (err) {
            reject(err);
          });

          archive.pipe(output);
          archive.directory(`packs/${this.id}`, false);
          archive.finalize();
        });
      })
      .then(
        () =>
          new Promise<void>((resolve, reject) => {
            rimraf(`packs/${this.id}`, {}, (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          }),
      )
      .then(() => `packs/${this.id}.siq`);
  }
}
