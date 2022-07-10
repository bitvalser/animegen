import { AnimeCharacterRole } from '../constants/anime-character-role.constants';
import { AnimeKind } from '../constants/anime-kind.constants';
import { PackRound } from '../constants/pack-round.constants';
import { downloadFile } from '../helpers/download-file.helper';
import { GeneratorOptions } from '../interfaces/generator-options.interface';
import { AnimeProviderBase } from './anime-provider-base.class';
import { MusicDownloaderProviderBase } from './music-downloader-provider-base.class';
import { SICustomQuestion, SIPackBuilder } from './si-pack-builder.class';
import { SIQuestionDownloaderBase } from './si-question-downloader-base.class';
import { GeneratorRoundStrategy } from './generator-round-strategy.class';
import { RoundsGeneratorStrategy } from './rounds-generator-strategy.class';
import { CoubApi } from './coub-api.class';
import { AnimeItem } from '../interfaces/anime-item.interface';

export type ProgressListener = (percent: number, status: string) => void;

export class AnimeGenerator {
  public static QUESTION_PRICE = 100;
  public coubApi = CoubApi.getInstance();

  public constructor(
    public provider: AnimeProviderBase,
    public musicDownloaderProviderBase: MusicDownloaderProviderBase,
    private buildStrategy: GeneratorRoundStrategy = new RoundsGeneratorStrategy(),
  ) {}

  private async getList(options: GeneratorOptions, listener: ProgressListener): Promise<AnimeItem[]> {
    if (options.noRepeats) {
      return await this.provider.getUniqAnimeList(listener);
    }
    return await this.provider.getAnimeList();
  }

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
      noRepeats: false,
      packName: 'Аниме доза-пак by Walerchik',
      ...options,
    };
    let progress = 0;
    progressListener(progress, 'Получение списка аниме....');
    const titles = await this.getList(defaultOptions, progressListener);
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

    await this.buildStrategy.buildRounds(this, defaultOptions, packBuilder, titles, progressListener);

    progressListener(30, 'Сборка пакета....');
    return packBuilder.build(progressListener).then((path) => {
      progressListener(100, 'Готово!');
      return path;
    });
  }
}
