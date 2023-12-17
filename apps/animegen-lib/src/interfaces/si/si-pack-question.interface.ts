import { PackRound } from '../../constants/pack-round.constants';
import { SIAtomType } from '../../constants/si-atom-type.constants.constants';
import { AnimeItem } from '../anime-item.interface';

export interface SIPackQuestion<T = AnimeItem> {
  id: string;
  originalBody: string;
  price: number;
  atomType: SIAtomType;
  body: string;
  round: PackRound;
  comment?: string;
  rightAnswer: string;
  data: T;
}
