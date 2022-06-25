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

export type SICustomQuestion = SIPackQuestion & { originalBody: string; id: string };

export class SIPackBuilder {
  private id: string;
  private date: string;
  private info: SIPackInfo;
  private rounds: SIPackRound[] = [];
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

  public addRound(name: string, themes: SIPackTheme[]): SIPackBuilder {
    this.rounds.push({
      name,
      themes: themes.map((theme) => ({
        ...theme,
        questions: theme.questions.map((question) => {
          const questionId = uuid.v4();
          const { body, rightAnswer } = (this.questions[questionId] = {
            ...question,
            originalBody: question.body,
            body: this.getQuestionBody(question, questionId),
            id: questionId,
            rightAnswer: question.rightAnswer.replace(/[&]/g, 'and'),
          });
          return {
            ...question,
            rightAnswer,
            body,
          };
        }),
      })),
    });
    return this;
  }

  public setCompression(factor: number): SIPackBuilder {
    let fixedFactor = factor;
    if (factor > 1) {
      fixedFactor = 1;
    } else if (factor < 0.1) {
      fixedFactor = 0.1;
    }
    this.compressionFactor = fixedFactor;
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
          const questionsImagesToDownload = Object.values(this.questions).filter(
            (question) => question.atomType === 'image',
          );
          progressListener((progress += 3), `Скачивание изображений (0/${questionsImagesToDownload.length})...`);
          let i = 0;
          for (const question of questionsImagesToDownload) {
            try {
              await this.downloader.downloadImage(question, `gentemp/${this.id}/imgs/${question.id}.jpg`);
              // eslint-disable-next-line no-empty
            } catch (error) {}
            i += 1;
            progressListener(
              progress + 20 * (i / questionsImagesToDownload.length),
              `Скачивание изображений (${i}/${questionsImagesToDownload.length})...`,
            );
          }
          progress = 55;

          const questionsMusicToDownload = Object.values(this.questions).filter(
            (question) => question.atomType === 'voice',
          );
          progressListener((progress += 3), `Скачивание музыки (0/${questionsMusicToDownload.length})...`);
          i = 0;
          for (const question of questionsMusicToDownload) {
            try {
              await this.downloader.downloadMusic(question, `packs/${this.id}/Audio/${question.id}.mp3`);
              // eslint-disable-next-line no-empty
            } catch (error) {}
            i += 1;
            progressListener(
              progress + 20 * (i / questionsImagesToDownload.length),
              `Скачивание музыки (${i}/${questionsMusicToDownload.length})...`,
            );
          }
          progress = 75;
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
        progressListener((progress += 14), `Удаления буфферной папки gentemp...`);
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
                      .map(
                        (question) => `
                    <question price="${question.price}">
                      <scenario>
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
