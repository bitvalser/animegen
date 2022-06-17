import { AnimeKind } from '../../constants/anime-kind.constants';

export interface ShikimoriUserHistoryApi {
  id: number;
  description: string;
  target?: {
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
