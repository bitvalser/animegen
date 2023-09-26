import { SIPackQuestion } from './si-pack-question.interface';

export interface SIPackTheme<TQuestion = SIPackQuestion> {
  name: string;
  questions: TQuestion[];
}
