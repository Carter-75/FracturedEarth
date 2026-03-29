export const EMOJI_OPTIONS = ['🌍', '🔥', '⚡', '🌊', '🪨', '🌪️', '🌙', '☀️', '🛰️', '🦾'] as const;

export const THEME_OPTIONS = [
  'Obsidian',
  'DeepTeal',
  'ElectricIndigo',
  'CrimsonNight',
  'ForestSignal',
  'CarbonGold',
  'ArcticTerminal',
  'SolarFlare',
  'VoidPurple',
  'TitaniumSlate',
] as const;

export type ThemeName = (typeof THEME_OPTIONS)[number];

export const THEME_PRESETS: Record<ThemeName, {
  bg: string;
  fg: string;
  panel: string;
  panelAlt: string;
  border: string;
  accent: string;
  accentSoft: string;
  muted: string;
}> = {
  Obsidian: {
    bg: '#0e1116',
    fg: '#f6f2e8',
    panel: '#171c24',
    panelAlt: '#202734',
    border: '#384252',
    accent: '#cf4b3f',
    accentSoft: '#ff9f79',
    muted: '#9aa5b5',
  },
  DeepTeal: {
    bg: '#081a1b',
    fg: '#e7fffb',
    panel: '#0f292b',
    panelAlt: '#15373a',
    border: '#2e5a5f',
    accent: '#23c6a4',
    accentSoft: '#8ff3dc',
    muted: '#98b8b2',
  },
  ElectricIndigo: {
    bg: '#110f22',
    fg: '#f4f1ff',
    panel: '#1a1834',
    panelAlt: '#25204a',
    border: '#4e448a',
    accent: '#6b7cff',
    accentSoft: '#ff5ca8',
    muted: '#a7abd1',
  },
  CrimsonNight: {
    bg: '#18090c',
    fg: '#fff1f1',
    panel: '#2a1117',
    panelAlt: '#381922',
    border: '#6b3340',
    accent: '#d44343',
    accentSoft: '#ff9a4d',
    muted: '#c0a2a6',
  },
  ForestSignal: {
    bg: '#0b150b',
    fg: '#eff9ec',
    panel: '#132215',
    panelAlt: '#1b2d1d',
    border: '#406148',
    accent: '#4db35f',
    accentSoft: '#b1ff63',
    muted: '#a7b7a2',
  },
  CarbonGold: {
    bg: '#15130c',
    fg: '#fff7e0',
    panel: '#231f12',
    panelAlt: '#302916',
    border: '#685838',
    accent: '#d7a43c',
    accentSoft: '#81f2ff',
    muted: '#c1b08d',
  },
  ArcticTerminal: {
    bg: '#0b1820',
    fg: '#ecfbff',
    panel: '#132633',
    panelAlt: '#183240',
    border: '#3a6677',
    accent: '#3fb5e8',
    accentSoft: '#6ef2a4',
    muted: '#9cb9c6',
  },
  SolarFlare: {
    bg: '#1a0f06',
    fg: '#fff2df',
    panel: '#2a180d',
    panelAlt: '#3b2414',
    border: '#775233',
    accent: '#ea6a1b',
    accentSoft: '#f8d64c',
    muted: '#cfb598',
  },
  VoidPurple: {
    bg: '#13081c',
    fg: '#faf0ff',
    panel: '#20112d',
    panelAlt: '#2b183b',
    border: '#5b3b70',
    accent: '#9a46d8',
    accentSoft: '#f067da',
    muted: '#b8a2c7',
  },
  TitaniumSlate: {
    bg: '#10151b',
    fg: '#edf3f7',
    panel: '#182029',
    panelAlt: '#1f2833',
    border: '#475463',
    accent: '#6d8599',
    accentSoft: '#d6dde5',
    muted: '#9eabb7',
  },
};

export function isThemeName(value: string): value is ThemeName {
  return THEME_OPTIONS.includes(value as ThemeName);
}

// Game Rules
export const MAX_HAND_SIZE = 5;
export const WINNING_POINTS = 100;
export const INITIAL_HEALTH = 5;
export const MAX_ACTIONS_PER_TURN = 3;
export const STARTING_HAND_SIZE = 5;
