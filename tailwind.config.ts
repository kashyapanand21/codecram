import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111110',
        paper: '#F5F4EF',
        signal: '#D2361C',
        dim: '#767672',
        // legacy aliases — keep existing component classNames working
        // until they're restyled in the next pass
        bg: '#F5F4EF',
        panel: '#FFFFFF',
        border: '#111110',
        text: '#111110',
        'text-dim': '#767672',
        accent: '#D2361C',
        danger: '#D2361C',
      },
      fontFamily: {
        sans: ['Switzer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;