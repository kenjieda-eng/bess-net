import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F2D4F',
        blue: { DEFAULT: '#1E5AA8' },
        accent: '#00B5A5',
        bg: '#F7F9FC',
        muted: '#6B7280',
        line: '#E5E7EB',
      },
      fontFamily: {
        sans: [
          'Yu Gothic',
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Noto Sans JP',
          'sans-serif',
        ],
      },
      maxWidth: {
        content: '960px',
      },
    },
  },
  plugins: [],
};
export default config;
