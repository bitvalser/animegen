import { PackRound } from '../constants/pack-round.constants';
import { SICustomQuestion } from './si-pack-builder.class';

export abstract class SIQuestionDownloaderBase {
  public abstract downloadImage(question: SICustomQuestion, type: PackRound, destination: string): Promise<void>;
  public abstract downloadMusic(question: SICustomQuestion, type: PackRound, destination: string): Promise<void>;
}
