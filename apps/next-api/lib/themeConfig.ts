export interface Theme {
  name: string;
  primary: number; 
  secondary: number;
  accent: number;
  bgTint: number;
  particle: number;
  fontPrimary: string;
}

export const THEMES: Theme[] = [
  {
    name: 'Obsidian',
    primary: 0x38bdf8,
    secondary: 0x075985,
    accent: 0xf59e0b,
    bgTint: 0x0a0a0a,
    particle: 0x38bdf8,
    fontPrimary: 'monospace'
  },
  {
    name: 'Void Static',
    primary: 0x00ffff,
    secondary: 0x000000,
    accent: 0xff00ff,
    bgTint: 0x000000,
    particle: 0x00ffff,
    fontPrimary: 'monospace'
  },
  {
    name: 'Ashen Frontier',
    primary: 0xd2691e,
    secondary: 0x4a2c10,
    accent: 0x8b4513,
    bgTint: 0x1a1410,
    particle: 0xd2691e,
    fontPrimary: 'serif'
  },
  {
    name: 'Deep Rift',
    primary: 0x26c6da,
    secondary: 0x006064,
    accent: 0x7e57c2,
    bgTint: 0x010816,
    particle: 0x26c6da,
    fontPrimary: 'monospace'
  },
  {
    name: 'Ember Court',
    primary: 0xb71c1c,
    secondary: 0x3e0505,
    accent: 0xffd700,
    bgTint: 0x0a0000,
    particle: 0xffd700,
    fontPrimary: 'serif'
  },
  {
    name: 'Overgrowth',
    primary: 0x558b2f,
    secondary: 0x1b5e20,
    accent: 0xffc107,
    bgTint: 0x050a05,
    particle: 0x558b2f,
    fontPrimary: 'monospace'
  },
  {
    name: 'Iron Atlas',
    primary: 0x607d8b,
    secondary: 0x263238,
    accent: 0xbf360c,
    bgTint: 0x121212,
    particle: 0x607d8b,
    fontPrimary: 'sans-serif'
  },
  {
    name: 'Pale Signal',
    primary: 0x1a1c22,
    secondary: 0x020408,
    accent: 0x2980b9,
    bgTint: 0xfcfaf5,
    particle: 0x1a1c22,
    fontPrimary: 'serif'
  },
  {
    name: 'Neon Fracture',
    primary: 0xff00ff,
    secondary: 0x222222,
    accent: 0x39ff14,
    bgTint: 0x000000,
    particle: 0xff00ff,
    fontPrimary: 'monospace'
  },
  {
    name: 'Dusk Ritual',
    primary: 0x8e24aa,
    secondary: 0x4a148c,
    accent: 0xe65100,
    bgTint: 0x1a0d1a,
    particle: 0x8e24aa,
    fontPrimary: 'monospace'
  }
];
