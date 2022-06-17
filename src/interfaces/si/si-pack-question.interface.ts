import { SIAtomType } from '../../constants/si-atom-type.constants.constants';

export interface SIPackQuestion {
  price: number;
  atomType: SIAtomType;
  body: string;
  rightAnswer: string;
}
