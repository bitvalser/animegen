import { AnimeCharacterRole } from '../constants/anime-character-role.constants';
import { AnimeKind } from '../constants/anime-kind.constants';
import { PackRound } from '../constants/pack-round.constants';
import { downloadFile } from '../helpers/download-file.helper';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { AnimeProviderBase } from './anime-provider-base.class';
import { MusicDownloaderProviderBase } from './music-downloader-provider-base.class';
import { SIPackBuilder } from './si-pack-builder.class';
import { SIQuestionDownloaderBase } from './si-question-downloader-base.class';
import { GeneratorRoundStrategy } from './generator-round-strategy.class';
import { RoundsGeneratorStrategy } from './rounds-generator-strategy.class';
import { CoubApi } from './coub-api.class';
import { ProgressLogger } from './progress-logger.class';
import { AnimeItem } from '../interfaces/anime-item.interface';
import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';
import { MusicProviders } from '../constants/music-providers.constants';

export type ProgressListener = (percent: number, status: string) => void;

export class AnimeGenerator {
  public static QUESTION_PRICE = 100;
  public progressLogger = new ProgressLogger();
  public coubApi = CoubApi.getInstance();

  public constructor(
    public provider: AnimeProviderBase,
    public musicDownloaderProviderBase: MusicDownloaderProviderBase,
    private buildStrategy: GeneratorRoundStrategy = new RoundsGeneratorStrategy(),
  ) {}

  private async getList(options: GeneratorOptions): Promise<AnimeItem[]> {
    if (options.noRepeats) {
      return await this.provider.getUniqAnimeList();
    }
    return await this.provider.getAnimeList();
  }

  public async createPack(options: Partial<GeneratorOptions> = {}): Promise<string> {
    const defaultOptions: GeneratorOptions = {
      animeKinds: [AnimeKind.Film, AnimeKind.ONA, AnimeKind.OVA, AnimeKind.Special, AnimeKind.TV],
      charactersRoles: [AnimeCharacterRole.Main, AnimeCharacterRole.Supporting],
      imageCompression: 0.7,
      audioBitrate: 96,
      musicLength: 25,
      rounds: [PackRound.Characters, PackRound.Screenshots, PackRound.Openings, PackRound.Endings],
      titleCounts: 100,
      showScore: true,
      noRepeats: false,
      packName: 'Аниме доза-пак by Walerchik',
      ...options,
    };
    this.progressLogger.defineSteps([
      { from: 0, to: 30 },
      { from: 30, to: 45 },
      { from: 45, to: 100 },
    ]);
    this.provider.progressLogger = this.progressLogger;
    this.progressLogger.info('Получение списка аниме....');
    this.provider.customOptions.fetchLinks = this.musicDownloaderProviderBase.getName() === MusicProviders.AnisongDB;
    const titles = await this.getList(defaultOptions).then((items) =>
      items.filter((item) => defaultOptions.animeKinds.includes(item.kind)),
    );
    const musicDownloaderProvider = this.musicDownloaderProviderBase;
    const packBuilder = new SIPackBuilder<AnimeItem>(
      new (class extends SIQuestionDownloaderBase<AnimeItem> {
        public downloadImage(question: SIPackQuestion, destination: string): Promise<void> {
          return downloadFile(question.originalBody, destination);
        }
        public downloadVideo(question: SIPackQuestion, destination: string): Promise<void> {
          return downloadFile(question.originalBody, destination);
        }
        public async downloadMusic(question: SIPackQuestion, destination: string): Promise<void> {
          try {
            return await musicDownloaderProvider.runTask(question, destination);
          } catch (error) {
            console.log(error);
          }
        }
      })(),
    );
    packBuilder.progressLogger = this.progressLogger;
    this.buildStrategy.progressLogger = this.progressLogger;
    packBuilder.setInfo({
      name: defaultOptions.packName,
      author: `${this.provider.getProviderName()} ${this.provider.getName()}`,
    });
    packBuilder.setCompression(defaultOptions.imageCompression);

    this.progressLogger.finishInfoStep('Генерация раундов...');
    await this.buildStrategy.buildRounds(this, defaultOptions, packBuilder, titles);

    this.progressLogger.finishInfoStep('Сборка пакета....');
    return packBuilder.build().then((path) => {
      this.progressLogger.finishInfoStep('Готово!');
      return path;
    });
  }
}
