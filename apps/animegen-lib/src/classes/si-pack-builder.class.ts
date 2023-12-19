import * as uuid from 'uuid';
import fsPromises from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import archiver from 'archiver';
import formatXml from 'xml-formatter';
import rimraf from 'rimraf';
import { SIPackInfo } from '../interfaces/si/si-pack-info.interface';
import { SIPackRound } from '../interfaces/si/si-pack-round.interface';
import { SIPackTheme } from '../interfaces/si/si-pack-theme.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';
import { SIAtomType } from '../constants/si-atom-type.constants.constants';
import { createWriteStream } from 'fs';
import { SIQuestionDownloaderBase } from './si-question-downloader-base.class';
import { PackRound } from '../constants/pack-round.constants';
import { queueTasks } from '../helpers/queue-tasks.helper';
import { ProgressLogger } from './progress-logger.class';

export type SIPackThemeCreatePayload<T> = Omit<SIPackTheme<T>, 'questions'> & {
  questions: Omit<SIPackQuestion<T>, 'id' | 'originalBody'>[];
};

export class SIPackBuilder<T> {
  public progressLogger = new ProgressLogger();
  public static PARALLEL_SIZE = 3;
  private id: string;
  private date: string;
  private info: SIPackInfo;
  private rounds: SIPackRound<T>[] = [];
  private questions: {
    [id: string]: SIPackQuestion<T>;
  } = {};
  private compressionFactor = 0.7;

  public constructor(
    private downloader: SIQuestionDownloaderBase<T>,
    private ffmpegPath: string = process.env.FFMPEG_PATH,
  ) {
    ffmpeg.setFfmpegPath(this.ffmpegPath);
    this.id = uuid.v4();
    this.date = new Date().toLocaleDateString();
  }

  private getQuestionBody(question: Pick<SIPackQuestion<T>, 'atomType' | 'body'>, id: string): string {
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

  public setInfo(info: SIPackInfo): SIPackBuilder<T> {
    this.info = {
      ...this.info,
      ...info,
    };
    return this;
  }

  public addRound(name: string, type: PackRound, themes: SIPackThemeCreatePayload<T>[]): SIPackBuilder<T> {
    this.rounds.push({
      type,
      name,
      themes: themes.map(
        (theme): SIPackTheme<T> => ({
          ...theme,
          questions: theme.questions.map((question): SIPackQuestion<T> => {
            const questionId = uuid.v4();
            const { body, rightAnswer, originalBody, id, round } = (this.questions[questionId] = {
              ...question,
              originalBody: question.body,
              body: this.getQuestionBody(question, questionId),
              id: questionId,
              round: question.round || type,
              rightAnswer: question.rightAnswer.replace(/[&]/g, 'and'),
            });
            return {
              ...question,
              id,
              round,
              originalBody,
              rightAnswer,
              body,
            };
          }),
        }),
      ),
    });
    return this;
  }

  public setCompression(factor: number): SIPackBuilder<T> {
    this.compressionFactor = Math.min(Math.max(factor, 0.1), 1);
    return this;
  }

  public build(): Promise<string> {
    this.progressLogger.defineSteps([
      { from: 45, to: 47 },
      { from: 47, to: 90 },
      { from: 90, to: 95 },
    ]);
    this.progressLogger.info('Создание основных каталогов...');
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
          this.progressLogger.finishStep();
          // INIT
          const questionsImagesToDownload = Object.values(this.questions).filter(
            (question) => question.atomType === SIAtomType.Image,
          );
          const questionsMusicToDownload = Object.values(this.questions).filter(
            (question) => question.atomType === SIAtomType.Voice,
          );
          const questionsVideoToDownload = Object.values(this.questions).filter(
            (question) => question.atomType === SIAtomType.Video,
          );
          this.progressLogger.defineSteps(
            [
              questionsImagesToDownload.length && { size: questionsImagesToDownload.length },
              questionsMusicToDownload.length && { size: questionsMusicToDownload.length },
              questionsVideoToDownload.length && { size: questionsVideoToDownload.length },
            ].filter(Boolean),
          );

          // IMAGE TASKS
          if (questionsImagesToDownload.length > 0) {
            this.progressLogger.info(`Скачивание изображений (0/${questionsImagesToDownload.length})...`);
            let i = 0;

            const imageDownloadTask = async (question: SIPackQuestion<T>) => {
              try {
                await this.downloader.downloadImage(question, `gentemp/${this.id}/imgs/${question.id}.jpg`);
                // eslint-disable-next-line no-empty
              } catch (error) {
                this.progressLogger.info(`Ошибка для ${question.originalBody} -> ${error}`);
              }
            };

            await queueTasks(
              questionsImagesToDownload.map((question) => () => imageDownloadTask(question)),
              SIPackBuilder.PARALLEL_SIZE,
              () => {
                i += 1;
                this.progressLogger.doInfoStep(`Скачивание изображений (${i}/${questionsImagesToDownload.length})...`);
              },
            );
            this.progressLogger.finishStep();
          }

          // MUSIC TASKS
          if (questionsMusicToDownload.length > 0) {
            this.progressLogger.info(`Скачивание музыки (0/${questionsMusicToDownload.length})...\n\n`);

            const musicDownloadTask = async (question: SIPackQuestion<T>) => {
              try {
                await this.downloader.downloadMusic(question, `packs/${this.id}/Audio/${question.id}.mp3`);
                await fsPromises.access(`packs/${this.id}/Audio/${question.id}.mp3`);
                // eslint-disable-next-line no-empty
              } catch (error) {
                this.progressLogger.info(`Ошибка для ${question.originalBody} -> ${error}`);
                console.log(`${question.originalBody}\n${error}`);
                delete this.questions[question.id];
              }
            };

            let i = 0;
            await queueTasks(
              questionsMusicToDownload.map((question) => () => musicDownloadTask(question)),
              SIPackBuilder.PARALLEL_SIZE,
              () => {
                i += 1;
                this.progressLogger.doInfoStep(`Скачивание музыки (${i}/${questionsMusicToDownload.length})...`);
              },
            );
            this.progressLogger.finishStep();
          }

          // VIDEO TASKS
          if (questionsVideoToDownload.length > 0) {
            this.progressLogger.info(`Скачивание видео (0/${questionsVideoToDownload.length})...`);

            const videoDownloadTask = async (question: SIPackQuestion<T>) => {
              try {
                await this.downloader.downloadVideo(question, `packs/${this.id}/Video/${question.id}.mp4`);
                // eslint-disable-next-line no-empty
              } catch (error) {
                this.progressLogger.info(`Ошибка для ${question.originalBody} -> ${error}`);
              }
            };

            let i = 0;
            await queueTasks(
              questionsVideoToDownload.map((question) => () => videoDownloadTask(question)),
              SIPackBuilder.PARALLEL_SIZE,
              () => {
                i += 1;
                this.progressLogger.doInfoStep(`Скачивание видео (${i}/${questionsVideoToDownload.length})...`);
              },
            );
            this.progressLogger.finishStep();
          }
        })(),
      )
      .then(() => {
        this.progressLogger.info(`Сжатие изображений...`);
        return fsPromises.readdir(`gentemp/${this.id}/imgs`).then((files) =>
          (async () => {
            for (const file of files) {
              try {
                await new Promise<void>((resolve, reject) => {
                  ffmpeg(`gentemp/${this.id}/imgs/${file}`)
                    .addOutputOption([`-compression_level ${Math.ceil(this.compressionFactor * 100)}`])
                    .once('error', reject)
                    .once('end', resolve)
                    .saveToFile(`packs/${this.id}/Images/${file}`);
                });
              } catch (error) {
                console.log(error);
                this.progressLogger.info(`Проблема с сжатием изображения ${file}, копируем в оригинал...`);
                try {
                  await fsPromises.copyFile(`gentemp/${this.id}/imgs/${file}`, `packs/${this.id}/Images/${file}`);
                } catch (error) {
                  this.progressLogger.info(`Пропускаем файл ${file} из-за прооблем с доступом...`);
                }
              }
            }
          })(),
        );
      })
      .then(() => {
        this.progressLogger.info(`Удаления буфферной папки gentemp...`);
        return new Promise<void>((resolve) => {
          rimraf(`gentemp/${this.id}`, {}, (error) => {
            if (error) {
              this.progressLogger.info(
                'Проблема с удалением буферной папки gentemp, пожалуйста удалите её самостоятельно после закрытия программы!',
              );

              console.log(error);
            }
            resolve();
          });
        });
      })
      .then(() => {
        this.progressLogger.info(`Удаления буфферной папки ffmpegtemp...`);
        return new Promise<void>((resolve) => {
          rimraf('ffmpegtemp', {}, (error) => {
            if (error) {
              this.progressLogger.info(
                'Проблема с удалением буферной папки ffmpegtemp, пожалуйста удалите её самостоятельно после закрытия программы!',
              );
              console.log(error);
            }
            resolve();
          });
        });
      })
      .then(() => {
        this.progressLogger.finishInfoStep(`Создание content.xml...`);
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
        this.progressLogger.info(`Архивирование пакета...`);
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
            this.progressLogger.finishStep();
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
