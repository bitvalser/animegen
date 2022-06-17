import { AnimeCharacterRole } from '../constants/anime-character-role.constants';
import { AnimeKind } from '../constants/anime-kind.constants';
import { PackRound } from '../constants/pack-round.constants';

export interface GeneratorOptions {
  rounds: PackRound[];
  packName: string;
  titleCounts: number;
  imageCompression: number;
  showScore: boolean;
  animeKinds: AnimeKind[];
  charactersRoles: AnimeCharacterRole[];
}
