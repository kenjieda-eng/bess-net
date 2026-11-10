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

- 毎朝の再ビルド: `.github/workflows/daily-rebuild.yml` が毎日 00:10 JST に Vercel の deploy hook（secret `VERCEL_DEPLOY_HOOK_URL`）を叩き、ビルドの時点で固まるもの（静的なページのお知らせバナーの HTML・ビルド時の生成物・JEPX のページなど）を作り直す。GitHub の定時の実行は毎日 数時間 遅れて始まる（00:10 の分の開始は 04:23〜08:45 JST だった・2026-11-05〜11-10）。手動実行は Actions の画面か `gh workflow run daily-rebuild.yml`（手動実行は印を見ずに必ず叩く）。
- 補助金の一覧（`/subsidies`）は再ビルドに頼らない: `revalidate` 600（10 分）で自分で作り直す（ビルド時の `subsidies.json` と今日の日付だけで作る・実行時の microCMS 0）。日付が変わって 10 分ほどで「本日締切」「受付終了」が今日の表示になる。間隔が 600 であることと、実行時の読み込み（microCMS・`fetch(`）が無いことは `verify:jst-today` が見る。
- 印を見て決める（00:10 と予備）: 00:10 の回と、予備の 02:10・04:10・06:10・09:10 JST の回は、ビルドの日付の印 `https://bess-net.jp/build-info.json`（`dateJst`・`builtAt`・ビルド時に決まる静的な JSON）を見て、印が今日ならやり直さない（何もせず成功）・前の日付なら hook を叩く。印が読めないときは 06:10 の回だけ叩く。遅れた 00:10 の回が、先に作り直した日に 2 本目のビルドを走らせない。判定だけ試すなら `gh workflow run daily-rebuild.yml -f check_only=true`（叩かない）。
- IndexNow の後段: リポジトリ変数 `INDEXNOW_DAILY` を `on` にしたときだけ、01:00 JST に前日以降 lastmod の URL を `scripts/indexnow-submit.ts --since` で送る（既定は止めてある・変電所の詳細は送らない）。
- 止め方: Actions の画面で daily-rebuild を Disable（再ビルド・予備・IndexNow の後段がすべて止まる）。IndexNow だけ止めるなら `INDEXNOW_DAILY` を `on` 以外にする。

## ライセンス

MIT License
