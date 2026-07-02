import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Alsama brand accent (magenta/pink). #c12c68 is the 600 shade —
        // the exact brand hex — used for primary actions, active states,
        // and the malpractice/critical accent (per the Alsama style guide,
        // both share this one accent rather than a separate danger color).
        brand: {
          50: '#fdf1f6',
          100: '#fbe0eb',
          200: '#f6c1d6',
          300: '#ec93b7',
          400: '#dd5f93',
          500: '#c8397a',
          600: '#c12c68',
          700: '#a12456',
          800: '#841d47',
          900: '#6b1a3c',
        },
        ink: '#1f2a31',
        muted: '#8b959d',
        caption: '#97a1a9',
        surface: '#ffffff',
        page: '#fbfcfd',
        border: '#d5dbe1',
      },
      borderColor: {
        DEFAULT: '#d5dbe1',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Segoe UI', 'Tahoma', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        script: ['var(--font-script)', 'cursive'],
      },
      borderRadius: {
        tile: '28px',
        'tile-sm': '10px',
      },
      boxShadow: {
        soft: '0 1px 4px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
