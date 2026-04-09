/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        'surface-raised': 'var(--bg-surface-raised)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        fg: 'var(--fg-main)',
        'fg-muted': 'var(--fg-muted)',
        'fg-subtle': 'var(--fg-subtle)',
        accent: 'var(--accent-primary)',
        'accent-alt': 'var(--accent-secondary)',
        'border-subtle': 'var(--border-subtle)',
        'border-active': 'var(--border-active)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: ['var(--font-geometric)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'grid-1': 'var(--sp-1)',
        'grid-2': 'var(--sp-2)',
        'grid-4': 'var(--sp-4)',
        'grid-8': 'var(--sp-8)',
      },
    },
  },
  plugins: [],
};
