import { SIPackQuestion } from '../interfaces/si/si-pack-question.interface';

export abstract class SIQuestionDownloaderBase<T> {
  public abstract downloadImage(question: SIPackQuestion<T>, destination: string): Promise<void>;
  public abstract downloadMusic(question: SIPackQuestion<T>, destination: string): Promise<void>;
  public abstract downloadVideo(question: SIPackQuestion<T>, destination: string): Promise<void>;
}
