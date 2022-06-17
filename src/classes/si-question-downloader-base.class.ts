import { SICustomQuestion } from './si-pack-builder.class';

export abstract class SIQuestionDownloaderBase {
  public abstract downloadImage(question: SICustomQuestion, destination: string): Promise<void>;
  public abstract downloadMusic(question: SICustomQuestion, destination: string): Promise<void>;
}
