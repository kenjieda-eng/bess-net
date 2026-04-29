# 蓄電所ネット (bess-net.jp)

系統用蓄電池および低圧リソース事業の情報ポータル。

業界ニュース、プロジェクトデータベース、市場制度解説、補助金カレンダー、変電所別 系統空き容量、事業者一覧、用語集を、日本市場特化で一元化することを目指します。

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Hosting**: Vercel
- **CMS**: microCMS (Sprint 1で導入)
- **Database**: Supabase (Sprint 1〜2で導入)
- **Map**: Mapbox + deck.gl (Sprint 2で導入)
- **Search**: Algolia (Sprint 1〜2で導入)

## 開発の始め方

```bash
# 依存関係をインストール
npm install

# ローカルサーバー起動（http://localhost:3000）
npm run dev

# 型チェック
npm run type-check

# 本番ビルド
npm run build

# 本番ビルドのプレビュー
npm start
```

## ディレクトリ構成

```
src/
├── app/              # ページ・レイアウト（App Router）
│   ├── layout.tsx    # 全体レイアウト
│   ├── page.tsx      # トップページ（Coming Soon）
│   ├── globals.css   # グローバルCSS
│   ├── robots.ts     # robots.txt自動生成
│   └── sitemap.ts    # sitemap.xml自動生成
├── components/       # 共通コンポーネント
└── lib/              # ユーティリティ・定数
public/               # 静的アセット（ロゴ、ファビコン）
```

## デプロイ

GitHub の main ブランチにpushすると、Vercelが自動デプロイします。

## ライセンス

MIT License
