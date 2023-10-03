import { FormValues } from './main-form.types';

export const ROUNDS_OPTIONS = [
  {
    label: 'Скриншоты',
    value: 'screenshots',
  },
  {
    label: 'Персонажи',
    value: 'characters',
  },
  {
    label: 'Опенинги',
    value: 'openings',
  },
  {
    label: 'Эндинги',
    value: 'endings',
  },
  {
    label: 'Коубы',
    value: 'coubs',
  },
];

export const MUSIC_PROVIDERS = [
  {
    label: 'YouTube',
    value: 'youtube',
  },
  {
    label: 'Themes.moe',
    value: 'themes-moe',
  },
  {
    label: 'AnisongDB',
    value: 'anisongdb',
  },
];

export const CHARACTER_ROLES_OPTIONS = [
  {
    label: 'Главные',
    value: 'Main',
  },
  {
    label: 'Второстепенные',
    value: 'Supporting',
  },
];

export const ANIME_TYPES_OPTIONS = [
  {
    label: 'TV-Сериал',
    value: 'tv',
  },
  {
    label: 'Фильм',
    value: 'movie',
  },
  {
    label: 'ONA',
    value: 'ona',
  },
  {
    label: 'Special',
    value: 'special',
  },
  {
    label: 'OVA',
    value: 'ova',
  },
];

export const DEFAULT_VALUES = {
  name: '',
  shuffleStrategy: false,
  animeKinds: ['ova', 'movie', 'tv', 'ona', 'special'],
  rounds: ['characters', 'screenshots', 'openings', 'endings', 'coubs'],
  imageCompression: 0.7,
  concurrency: 3,
  audioBitrate: 120,
  titleCounts: 100,
  musicLength: 20,
  showScore: true,
  noRepeats: false,
  charactersRoles: ['Main', 'Supporting'],
  musicProvider: 'themes-moe',
} as never as FormValues;
