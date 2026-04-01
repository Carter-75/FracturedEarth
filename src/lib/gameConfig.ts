export const EMOJI_OPTIONS = ['🌍', '🔥', '⚡', '🌊', '🪨', '🌪️', '🌙', '☀️', '🛰️', '🦾'] as const;

export const THEME_OPTIONS = [
  'Obsidian',
  'Void Static',
  'Ashen Frontier',
  'Deep Rift',
  'Ember Court',
  'Overgrowth',
  'Iron Atlas',
  'Pale Signal',
  'Neon Fracture',
  'Dusk Ritual',
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
  radius: string;
  fontDisplay: string;
  textTransform: string;
  glowStrength: string;
  scanlineOpacity: string;
}> = {
  Obsidian: {
    bg: '#020408',
    fg: '#f8fafc',
    panel: 'rgba(10, 15, 25, 0.8)',
    panelAlt: 'rgba(15, 20, 35, 0.9)',
    border: 'rgba(255, 255, 255, 0.1)',
    accent: '#f59e0b',
    accentSoft: '#38bdf8',
    muted: '#64748b',
    radius: '2rem',
    fontDisplay: 'var(--font-display)',
    textTransform: 'uppercase',
    glowStrength: '0.4',
    scanlineOpacity: '0.03',
  },
  'Void Static': {
    bg: '#000000',
    fg: '#ffffff',
    panel: 'rgba(5, 5, 5, 0.95)',
    panelAlt: 'rgba(10, 10, 10, 1)',
    border: '#00ffff',
    accent: '#00ffff',
    accentSoft: '#ff00ff',
    muted: '#333333',
    radius: '0px',
    fontDisplay: 'monospace',
    textTransform: 'uppercase',
    glowStrength: '0.8',
    scanlineOpacity: '0.15',
  },
  'Ashen Frontier': {
    bg: '#1a1410',
    fg: '#e6d5c3',
    panel: 'rgba(40, 30, 20, 0.8)',
    panelAlt: 'rgba(50, 40, 30, 0.9)',
    border: '#8b4513',
    accent: '#d2691e',
    accentSoft: '#deb887',
    muted: '#704214',
    radius: '0.5rem',
    fontDisplay: 'var(--font-body)',
    textTransform: 'none',
    glowStrength: '0.2',
    scanlineOpacity: '0.05',
  },
  'Deep Rift': {
    bg: '#010816',
    fg: '#e0f2f1',
    panel: 'rgba(2, 20, 40, 0.7)',
    panelAlt: 'rgba(5, 30, 60, 0.8)',
    border: '#006064',
    accent: '#26c6da',
    accentSoft: '#7e57c2',
    muted: '#37474f',
    radius: '3rem',
    fontDisplay: 'var(--font-display)',
    textTransform: 'uppercase',
    glowStrength: '0.6',
    scanlineOpacity: '0.02',
  },
  'Ember Court': {
    bg: '#0a0000',
    fg: '#fce4ec',
    panel: 'rgba(30, 5, 5, 0.85)',
    panelAlt: 'rgba(45, 10, 10, 0.9)',
    border: '#ffd700',
    accent: '#b71c1c',
    accentSoft: '#ffab00',
    muted: '#4a148c',
    radius: '0.25rem',
    fontDisplay: 'var(--font-body)',
    textTransform: 'uppercase',
    glowStrength: '0.5',
    scanlineOpacity: '0.04',
  },
  Overgrowth: {
    bg: '#050a05',
    fg: '#f1f8e9',
    panel: 'rgba(15, 30, 15, 0.8)',
    panelAlt: 'rgba(20, 45, 20, 0.9)',
    border: '#33691e',
    accent: '#558b2f',
    accentSoft: '#ffc107',
    muted: '#1b5e20',
    radius: '1.5rem',
    fontDisplay: 'var(--font-display)',
    textTransform: 'none',
    glowStrength: '0.3',
    scanlineOpacity: '0.02',
  },
  'Iron Atlas': {
    bg: '#121212',
    fg: '#cfd8dc',
    panel: 'rgba(30, 30, 35, 0.9)',
    panelAlt: 'rgba(40, 40, 45, 1)',
    border: '#455a64',
    accent: '#607d8b',
    accentSoft: '#bf360c',
    muted: '#263238',
    radius: '0px',
    fontDisplay: 'sans-serif',
    textTransform: 'uppercase',
    glowStrength: '0.1',
    scanlineOpacity: '0.08',
  },
  'Pale Signal': {
    bg: '#fcfaf5',
    fg: '#020408',
    panel: 'rgba(235, 230, 220, 0.9)',
    panelAlt: 'rgba(225, 220, 210, 1)',
    border: '#2c3e50',
    accent: '#1a1c22',
    accentSoft: '#2980b9',
    muted: '#7f8c8d',
    radius: '2px',
    fontDisplay: 'var(--font-body)',
    textTransform: 'none',
    glowStrength: '0',
    scanlineOpacity: '0.12',
  },
  'Neon Fracture': {
    bg: '#000000',
    fg: '#ffffff',
    panel: 'rgba(0, 0, 0, 0.9)',
    panelAlt: 'rgba(5, 5, 5, 0.95)',
    border: '#ff00ff',
    accent: '#ff00ff',
    accentSoft: '#39ff14',
    muted: '#121212',
    radius: '0px',
    fontDisplay: 'var(--font-display)',
    textTransform: 'uppercase',
    glowStrength: '1',
    scanlineOpacity: '0.06',
  },
  'Dusk Ritual': {
    bg: '#1a0d1a',
    fg: '#f3e5f5',
    panel: 'rgba(45, 20, 45, 0.8)',
    panelAlt: 'rgba(60, 30, 60, 0.9)',
    border: '#8e24aa',
    accent: '#4a148c',
    accentSoft: '#e65100',
    muted: '#311b92',
    radius: '4rem',
    fontDisplay: 'var(--font-display)',
    textTransform: 'uppercase',
    glowStrength: '0.4',
    scanlineOpacity: '0.03',
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
