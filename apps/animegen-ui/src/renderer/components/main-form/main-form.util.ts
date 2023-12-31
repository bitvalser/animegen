import { MAL_APP_URL, SHIKIMORI_API_URL } from '../../core/contstants';
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
  {
    label: 'AnimeThemes',
    value: 'anime-themes',
  },
];

export const ANIME_PROVIDERS = [
  {
    label: 'Shikimori',
    value: 'shikimori',
  },
  {
    label: 'MyAnimeList',
    value: 'mal',
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
  preset: 'default',
  name: '',
  shuffleStrategy: false,
  animeProvider: 'shikimori',
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
  musicProvider: 'anisongdb',
} as never as FormValues;

export const shikimoriUserValidate = (
  value: string,
): Promise<boolean | string> =>
  fetch(`${SHIKIMORI_API_URL}/users/${encodeURIComponent(value)}`).then(
    (response) =>
      response.status === 200 ? true : 'Такого пользователя не существует',
  );

export const malUserValidate = (value: string) =>
  fetch(`${MAL_APP_URL}/animelist/${encodeURIComponent(value)}`).then(
    (response) =>
      response.status === 200 ? true : 'Такого пользователя не существует',
  );
