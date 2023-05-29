import { AnimeCharacterRole } from '../constants/anime-character-role.constants';
import { AnimeKind } from '../constants/anime-kind.constants';
import { AnimeProviders } from '../constants/anime-providers.constants';
import { MusicProviders } from '../constants/music-providers.constants';
import { PackRound } from '../constants/pack-round.constants';

export const CREATE_ARGUMENTS_DATA: {
  [argument: string]: {
    required?: boolean;
    mapTo?: string;
    mapValue?: (value: string) => any;
    validator: (value: string) => boolean;
  };
} = {
  name: {
    required: true,
    mapValue: (value: string) => value.substring(0, 100),
    validator: (value) => value.trim().length > 2,
  },
  titles: {
    mapTo: 'titleCounts',
    mapValue: (value) => +value,
    validator: (value: string) => +value > 9 && +value <= 400,
  },
  kinds: {
    mapTo: 'animeKinds',
    mapValue: (value: string) => value.split(','),
    validator: (value: string) =>
      value.split(',').every((item) => Object.values(AnimeKind).includes(item as AnimeKind)),
  },
  roles: {
    mapTo: 'charactersRoles',
    mapValue: (value: string) => value.split(','),
    validator: (value: string) =>
      value.split(',').every((item) => Object.values(AnimeCharacterRole).includes(item as AnimeCharacterRole)),
  },
  compression: {
    mapTo: 'imageCompression',
    mapValue: (value: string) => +value,
    validator: (value: string) => +value >= 0.1 && +value <= 1,
  },
  musicTime: {
    mapTo: 'musicLength',
    mapValue: (value: string) => +value,
    validator: (value: string) => +value >= 1 && +value <= 45,
  },
  audioBitrate: {
    mapTo: 'audioBitrate',
    mapValue: (value: string) => +value,
    validator: (value: string) => +value >= 12 && +value <= 196,
  },
  rounds: {
    mapTo: 'rounds',
    mapValue: (value: string) => value.split(','),
    validator: (value: string) =>
      value.split(',').every((item) => Object.values(PackRound).includes(item as PackRound)),
  },
  'anime-provider': {
    mapTo: 'animeProvider',
    validator: (value) => Object.values(AnimeProviders).includes(value as AnimeProviders),
  },
  score: {
    mapTo: 'showScore',
    validator: (value) => (value as never as boolean) ?? false,
  },
  random: {
    validator: (value) => (value as never as boolean) ?? false,
  },
  'skip-repeats': {
    mapTo: 'noRepeats',
    validator: (value) => (value as never as boolean) ?? false,
  },
  'music-provider': {
    mapTo: 'musicProvider',
    validator: (value) => Object.values(MusicProviders).includes(value as MusicProviders),
  },
};
