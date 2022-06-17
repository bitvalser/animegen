import { AnimeCharacterRole } from '../constants/anime-character-role.constants';

export interface AnimeCharacter {
  roles: AnimeCharacterRole[];
  id: string;
  originalName: string;
  russianName: string;
  image: string;
}
