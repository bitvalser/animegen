import { AnimeCharacterRole } from '../constants/anime-character-role.constants';
import { AnimeKind } from '../constants/anime-kind.constants';
import { PackRound } from '../constants/pack-round.constants';
import { PresetScheme } from './preset-scheme.interface';

export interface GeneratorOptions {
  rounds: PackRound[];
  packName: string;
  presetJson?: PresetScheme;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  presetFields?: Record<string, any>;
  titleCounts: number;
  imageCompression: number;
  audioBitrate: number;
  musicLength: number;
  showScore: boolean;
  noRepeats: boolean;
  animeKinds: AnimeKind[];
  charactersRoles: AnimeCharacterRole[];
}
