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
        // 一覧/ダッシュボード/ナビ/フッターなど、情報密度が必要な領域
        content: '1200px',
        // 将来：キラーコンテンツ（変電所マップ等）用に予約
        wide: '1400px',
        // 記事本文・規約類の読みやすい幅（760px）はCSS直書きで指定
      },
    },
  },
  plugins: [],
};
export default config;
