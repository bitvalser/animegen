import { AnimeKind } from '../../constants/anime-kind.constants';

export interface ShikimoriAnimeItemApi {
  id: number;
  name: string;
  russian: string;
  franchise: string;
  kind: AnimeKind;
}
