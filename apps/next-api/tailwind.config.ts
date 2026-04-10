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
        bg: 'var(--bg)',
        surface: 'var(--panel)',
        'surface-raised': 'var(--panel-alt)',
        'surface-elevated': 'var(--panel-alt)',
        fg: 'var(--fg)',
        'fg-muted': 'var(--muted)',
        'fg-subtle': 'var(--muted)',
        accent: 'var(--accent)',
        'accent-alt': 'var(--accent-soft)',
        'border-subtle': 'var(--border)',
        'border-active': 'var(--accent)',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
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
