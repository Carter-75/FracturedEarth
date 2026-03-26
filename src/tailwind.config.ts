/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Mirrors the 10 Android themes as CSS custom-property sets
      colors: {
        earth: {
          obsidian:  { bg: '#111111', primary: '#E53935', accent: '#FF6F00' },
          teal:      { bg: '#0D2B2B', primary: '#00BFA5', accent: '#64FFDA' },
          indigo:    { bg: '#0D0D2B', primary: '#5C6BC0', accent: '#FF4081' },
          crimson:   { bg: '#1A0000', primary: '#B71C1C', accent: '#FF6D00' },
          forest:    { bg: '#0A1A0A', primary: '#2E7D32', accent: '#76FF03' },
          gold:      { bg: '#1A1A0A', primary: '#F9A825', accent: '#00E5FF' },
          arctic:    { bg: '#0A1A2B', primary: '#0288D1', accent: '#00E676' },
          solar:     { bg: '#1A0D00', primary: '#E65100', accent: '#FFD600' },
          void:      { bg: '#0D001A', primary: '#7B1FA2', accent: '#E040FB' },
          titanium:  { bg: '#111418', primary: '#546E7A', accent: '#CFD8DC' },
        },
      },
      fontFamily: {
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
