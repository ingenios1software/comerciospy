import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.08)',
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px rgba(15,23,42,0.12)'
      },
      colors: {
        surface: '#0f172a',
        surface2: '#111827',
        accent: '#38bdf8',
        accent2: '#8b5cf6',
        muted: '#94a3b8'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 40%), linear-gradient(180deg, rgba(15,23,42,1), rgba(15,23,42,0.96))'
      }
    }
  },
  plugins: []
};

export default config;
