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

- 毎朝の再ビルド: `.github/workflows/daily-rebuild.yml` が毎日 00:10 JST に Vercel の deploy hook（secret `VERCEL_DEPLOY_HOOK_URL`）を叩き、日付で変わる表示（補助金の「公募中・本日締切」など）を作り直す。手動実行は Actions の画面か `gh workflow run daily-rebuild.yml`。
- IndexNow の後段: リポジトリ変数 `INDEXNOW_DAILY` を `on` にしたときだけ、01:00 JST に前日以降 lastmod の URL を `scripts/indexnow-submit.ts --since` で送る（既定は止めてある・変電所の詳細は送らない）。
- 止め方: Actions の画面で daily-rebuild を Disable（両方止まる）。IndexNow だけ止めるなら `INDEXNOW_DAILY` を `on` 以外にする。

## ライセンス

MIT License
