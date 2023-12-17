import { PackRound } from '../../constants/pack-round.constants';
import { AnimeItem } from '../anime-item.interface';
import { SIPackTheme } from './si-pack-theme.interface';

export interface SIPackRound<T = AnimeItem> {
  type: PackRound;
  name: string;
  themes: SIPackTheme<T>[];
}
