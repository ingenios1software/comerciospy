import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.06)',
        glow: '0 0 0 1px rgba(15, 23, 42, 0.05), 0 24px 80px rgba(15, 23, 42, 0.08)'
      },
      colors: {
        surface: '#f8fafc',
        surface2: '#f1f5f9',
        card: '#ffffff',
        accent: '#dc2626',
        accent2: '#fda4af',
        muted: '#64748b',
        text: '#111827'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(220, 38, 38, 0.1), transparent 40%), linear-gradient(180deg, #f8fafc, #eef2f7)'
      }
    }
  },
  plugins: []
};

export default config;
