import { PackRound } from '../../constants/pack-round.constants';
import { SIPackQuestion } from './si-pack-question.interface';
import { SIPackTheme } from './si-pack-theme.interface';

export interface SIPackRound<TQuestion = SIPackQuestion> {
  type: PackRound;
  name: string;
  themes: SIPackTheme<TQuestion>[];
}
