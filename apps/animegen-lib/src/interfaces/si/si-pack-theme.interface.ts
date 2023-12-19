import { AnimeItem } from '../anime-item.interface';
import { SIPackQuestion } from './si-pack-question.interface';

export interface SIPackTheme<T = AnimeItem> {
  name: string;
  questions: SIPackQuestion<T>[];
}
