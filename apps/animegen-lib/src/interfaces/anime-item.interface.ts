import { AnimeKind } from '../constants/anime-kind.constants';

export interface AnimeItem {
  id: string;
  originalName: string;
  russianName: string;
  score?: string;
  annId?: string;
  franchise?: string;
  kind: AnimeKind;
}
