import { PackRound } from '../../constants/pack-round.constants';
import { SIAtomType } from '../../constants/si-atom-type.constants.constants';

export interface SIPackQuestion {
  price: number;
  atomType: SIAtomType;
  body: string;
  round?: PackRound;
  comment?: string;
  rightAnswer: string;
}
