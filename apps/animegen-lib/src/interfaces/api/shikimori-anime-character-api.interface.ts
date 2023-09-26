import { AnimeCharacterRole } from '../../constants/anime-character-role.constants';

export interface ShikimoriAnimeCharacterApi {
  roles: AnimeCharacterRole[];
  character?: {
    id: number;
    name: string;
    russian?: string;
    image: {
      original: string;
      preview: string;
    };
  };
}
