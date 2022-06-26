import { AnimeKind } from '../../constants/anime-kind.constants';

export interface ShikimoriUserHistoryApi {
  id: number;
  score: number;
  status: 'completed' | 'planned';
  anime?: {
    id: number;
    image: {
      original: string;
    };
    kind: AnimeKind;
    score: string;
    name: string;
    russian: string;
  };
}
