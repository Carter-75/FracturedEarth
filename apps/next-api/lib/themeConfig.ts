export interface Theme {
  name: string;
  primary: number; 
  secondary: number;
  accent: number;
  bgTint: number;
  particle: number;
  fontPrimary: string;
  // Cinematic Engine Extensions
  bgAsset: string;
  vignetteAlpha: number;
  scanlineAlpha: number;
  noiseAlpha: number;
  glitchMode: boolean;
  bloomIntensity: number;
}

export const THEMES: Theme[] = [
  {
    name: 'Obsidian',
    primary: 0x38bdf8,
    secondary: 0x075985,
    accent: 0xf59e0b,
    bgTint: 0x38bdf8,
    particle: 0x38bdf8,
    fontPrimary: 'monospace',
    bgAsset: 'bg_survival',
    vignetteAlpha: 0.4,
    scanlineAlpha: 0.05,
    noiseAlpha: 0.02,
    glitchMode: false,
    bloomIntensity: 1.2
  },
  {
    name: 'Void Static',
    primary: 0x00ffff,
    secondary: 0x000000,
    accent: 0xff00ff,
    bgTint: 0x000000,
    particle: 0x00ffff,
    fontPrimary: 'monospace',
    bgAsset: 'bg_chaos',
    vignetteAlpha: 0.8,
    scanlineAlpha: 0.4,
    noiseAlpha: 0.15,
    glitchMode: true,
    bloomIntensity: 2.0
  },
  {
    name: 'Ashen Frontier',
    primary: 0xd2691e,
    secondary: 0x4a2c10,
    accent: 0x8b4513,
    bgTint: 0xd2691e,
    particle: 0xd2691e,
    fontPrimary: 'serif',
    bgAsset: 'bg_disaster',
    vignetteAlpha: 0.5,
    scanlineAlpha: 0.08,
    noiseAlpha: 0.1,
    glitchMode: false,
    bloomIntensity: 0.8
  },
  {
    name: 'Deep Rift',
    primary: 0x26c6da,
    secondary: 0x006064,
    accent: 0x7e57c2,
    bgTint: 0x26c6da,
    particle: 0x26c6da,
    fontPrimary: 'monospace',
    bgAsset: 'bg_adapt',
    vignetteAlpha: 0.7,
    scanlineAlpha: 0.2,
    noiseAlpha: 0.05,
    glitchMode: false,
    bloomIntensity: 1.5
  },
  {
    name: 'Ember Court',
    primary: 0xb71c1c,
    secondary: 0x3e0505,
    accent: 0xffd700,
    bgTint: 0xb71c1c,
    particle: 0xffd700,
    fontPrimary: 'serif',
    bgAsset: 'bg_power',
    vignetteAlpha: 0.6,
    scanlineAlpha: 0.02,
    noiseAlpha: 0.03,
    glitchMode: false,
    bloomIntensity: 1.8
  },
  {
    name: 'Overgrowth',
    primary: 0x558b2f,
    secondary: 0x1b5e20,
    accent: 0xffc107,
    bgTint: 0x558b2f,
    particle: 0x558b2f,
    fontPrimary: 'monospace',
    bgAsset: 'bg_survival',
    vignetteAlpha: 0.4,
    scanlineAlpha: 0.1,
    noiseAlpha: 0.05,
    glitchMode: false,
    bloomIntensity: 1.0
  },
  {
    name: 'Iron Atlas',
    primary: 0x607d8b,
    secondary: 0x263238,
    accent: 0xbf360c,
    bgTint: 0x121212,
    particle: 0x607d8b,
    fontPrimary: 'sans-serif',
    bgAsset: 'bg_cataclysm',
    vignetteAlpha: 0.4,
    scanlineAlpha: 0.3,
    noiseAlpha: 0.08,
    glitchMode: false,
    bloomIntensity: 1.0
  },
  {
    name: 'Pale Signal',
    primary: 0x1a1c22,
    secondary: 0x020408,
    accent: 0x2980b9,
    bgTint: 0xfcfaf5,
    particle: 0x1a1c22,
    fontPrimary: 'serif',
    bgAsset: 'bg_twist',
    vignetteAlpha: 0.2,
    scanlineAlpha: 0.0,
    noiseAlpha: 0.01,
    glitchMode: false,
    bloomIntensity: 0.5
  },
  {
    name: 'Neon Fracture',
    primary: 0xff00ff,
    secondary: 0x222222,
    accent: 0x39ff14,
    bgTint: 0x000000,
    particle: 0xff00ff,
    fontPrimary: 'monospace',
    bgAsset: 'bg_chaos',
    vignetteAlpha: 0.5,
    scanlineAlpha: 0.6,
    noiseAlpha: 0.2,
    glitchMode: true,
    bloomIntensity: 2.5
  },
  {
    name: 'Dusk Ritual',
    primary: 0x8e24aa,
    secondary: 0x4a148c,
    accent: 0xe65100,
    bgTint: 0x1a0d1a,
    particle: 0x8e24aa,
    fontPrimary: 'monospace',
    bgAsset: 'bg_ascended',
    vignetteAlpha: 0.7,
    scanlineAlpha: 0.15,
    noiseAlpha: 0.08,
    glitchMode: false,
    bloomIntensity: 1.5
  }
];
