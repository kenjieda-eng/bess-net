# 小さな直し便 — 更新履歴の title・/reports の「公開予定」・日付の表示を日本時間に・海外市場の評価の語・更新履歴の /news のリンク名（2026-10-29）

## (0) 読んだ便

- 便（第 2 版・10/29 08:1x の改訂で ■6 を追加）:
  - `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\小さな直し便_更新履歴のtitle・reportsの公開予定・日付の表示をJSTに・海外市場の評価の語_コードのみ_Claude_Code投入_2026-10-27起草_ユウ.md`
  - 8,724 バイト・sha256 `faaca0627496a51d16e27dca28d16daeef6636fbbc2ffb9c20d2be32db5e3ace`
- **書込**: microCMS は 0。ただし ■3 の影響を数えるために、news の publishedAt・revisedAt を GET で 15 回読んだ（読取専用）。
- **commit**: `54b567e`（push 08:20）。
- **停止条件**: rm 系・push --force・.env の表示は、どれも 0。

## (1) 当てた所の前後

- 「前」の文字列は、どれも実行日にちょうど 1 回あった。当てなかった所は 0。

**■1** `src/app/milestones/page.tsx`
- `PAGE_TITLE` を「更新履歴（主な公開と更新）」にし、`title: PAGE_TITLE` にした（layout の template で「更新履歴（主な公開と更新） | 蓄電所ネット」になる）。
- openGraph の title は `${PAGE_TITLE} | ${siteConfig.name}` で、`<title>` と同じ出力にした。
- h1・本文は不変。

**■2** `src/app/reports/page.tsx`
- description:
  - 前: 「蓄電所業界の年次レポートを公開予定。業界レポート2026 (7月予定)。」
  - 後: 「蓄電所業界の年次レポートの一覧です。業界レポート2026（本編）を公開しています。」
- 冒頭の文:
  - 前: 「蓄電所業界の年次レポートを公開予定。当サイト独自機能で蓄積したデータを編集統合します。」
  - 後: 「蓄電所業界の年次レポートの一覧です。当サイトのデータベースのデータをもとに、編集部がまとめています。」
- カードのラベル:
  - 前: 「準備中 · 2026年7月公開予定」
  - 後: 「公開中 · 2026年7月2日公開」
  - 色は `#c70` のまま。サイトに色つきの「公開中」のラベルの前例が無いため。
- カードの文:
  - 前: 「…を集約した当サイト独自の年次レポート。」＋改行＋「本編（全10章）を公開中。」（JSX の 2 行に分かれていて、見える文としては 1 回）
  - 後: 「…を集約した年次レポートです。」

**■3**: (2) に書いた。

**■4** `src/data/global-markets.ts` の keyPlayers 14 か所: 便の表のとおり。
- 例: L44「Tesla (Megapack、大型BESS最大手)」→「Tesla (Megapack)」、L186「AGL Energy / Origin Energy (発電大手、石炭跡地でBESS大規模建設)」→「AGL Energy / Origin Energy (発電事業者、石炭火力の跡地で BESS を建設)」。
- 行は 448317c のとおりだった。

**■6** `src/data/site-history.ts`
- id 13「ニュース一覧」→「業界ニュース」、id 55「ニュース」→「業界ニュース」（url はどちらも `/news`）。
- id 21 は元から「業界ニュース」。summary は不変。
- `verify:site-history` は ok。

**■5**: 訂正履歴には足していない（便のとおり）。

## (2) ■3 の場所と、日付が変わるページ

- `toLocaleDateString` の `timeZone` の無い所を grep し直すと、便の 18 か所と同じ行だった。ずれと追加は無し。
  - `toLocaleTimeString`・`Intl.DateTimeFormat` で `timeZone` の無いものは 0。
- 18 か所とも `timeZone: 'Asia/Tokyo'` を足した。書式の指定のあるものは、先頭に足して書式はそのまま。指定の無いものは `{ timeZone: 'Asia/Tokyo' }` を渡した。

  | ファイル | 行 |
  |---|---|
  | `src/app/news/[slug]/page.tsx` | 139・195 |
  | `src/lib/news-utils.ts` | 63 |
  | `src/components/RelatedNewsList.tsx` | 33 |
  | `src/app/page.tsx` | 290・399 |
  | `src/lib/explainer-utils.ts` | 83 |
  | `src/app/info/page.tsx` | 58 |
  | `src/app/info/[slug]/page.tsx` | 101・103 |
  | `src/app/projects/[slug]/page.tsx` | 265 |
  | `src/app/industry/top50/page.tsx` | 59 |
  | `src/app/grid/page.tsx` | 161 |
  | `src/app/grid/[slug]/page.tsx` | 95（行内の変更だけで行数は不変。asset-check の台帳の行番号はずれない） |
  | `src/app/grid/[slug]/AreaPage.tsx` | 46 |
  | `src/app/lv/page.tsx` | 176 |
  | `src/app/lv/invest/page.tsx` | 390 |
  | `src/app/ops/freshness/page.tsx` | 113 |

- **ビルドの前後の比較（便の指定）**: ローカルのビルド出力（ニュースの詳細 1,149 ページ）では、表示の日付が変わったページは **0** だった。
  - このパソコンは日本時間で動くので、ローカルのビルドでは前から JST の日になっていた。
  - そのため、本番（Vercel・UTC）で変わるページを、データから数えた。
- **本番で日付が変わるページ**: ニュースの詳細 **34 ページ**（全 1,402 件の GET・ビルドされる 1,149 ページのうち）。
  - publishedAt の UTC の日と JST の日が違うもの 26 件、revisedAt 14 件（重なりあり）。どれも JST 0〜9 時の日時。
- 例 3 件（どれも publishedAt が JST 2026-06-01 08:20〜08:21）。デプロイ前の本番（08:20）は 3 件とも「公開日：2026/5/31 / 最終更新：2026/5/31」と表示していた。
  - `sustainable-hd-primary-reserve-entry-2026-06`（2026-05-31T23:21:01Z）
  - `nomuraya-ueda-kokubun-bess-balancing-entry-2026-05`（2026-05-31T23:20:59Z）
  - `eku-energy-naganohara-bess-30mw-2026-05`（2026-05-31T23:20:58Z）
- 一覧（scratchpad の `sf/news-tz.json`）。

## (3) ■4 の残りの評価の語（keyPlayers の外・直していない）

| 行 | 欄 | 語 | 文（先頭） |
|---|---|---|---|
| L54 | japanComparison | 先行 | 「…日本の容量市場/需給調整市場議論の先行モデル。」 |
| L55 | notes | 最大 | 「世界最大の BESS 市場。…2026年の最大テーマは FEOC 対応…」 |
| L56 | overview | 最大・最高 | 「米国は世界最大の BESS 市場。2026年Q1に四半期過去最高の3.3GW/8.4GWh を導入（…SEIA）」 |
| L58 | highlights | 最高 | 「2026年Q1に過去最高3.3GW/8.4GWh導入（…SEIA Q1 2026 Outlook）」 |
| L76 | highlights | 大型 | 「ドイツ 系統利用料・接続規制改革 — 2026年が大型蓄電池の「正念場」」 |
| L89 | japanComparison | 先行 | 「…イタリアMACSEの容量報酬型モデルは、…比較可能な先行事例。」 |
| L91 | overview | 最高 | 「EUは2025年に欧州全体で過去最高36GWh を導入（…SolarPower Europe）」 |
| L93 | highlights | 最高 | 「2025年に欧州全体で過去最高36GWh導入（…SolarPower Europe）」 |
| L125 | notes | 最大 | 「世界最大の BESS 生産国 + 導入国。2026年の最大テーマは…」 |
| L132 | highlights | 先行 | 「セル/PCS/システム供給を支配、ナトリウムイオン量産も世界先行」 |
| L159 | japanComparison | 最大級・主導 | 「…伸び率は世界最大級（CAGR ~60%）。SECI/NTPC主導の入札…」 |
| L160 | notes | 主導 | 「PLI + VGF + SECI入札主導で世界最速級の成長。」 |
| L161 | overview | 主導・牽引 | 「…SECI/NTPC主導の入札が加速。」 |
| L167 | highlights | 牽引 | 「Reliance/Adani/Tataの財閥型垂直統合が牽引」 |
| L181 | highlights | トップ | 「NEM/FCAS市場 — BESSが周波数調整で世界トップ級収益（継続）」 |
| L193 | priceTrend | トップ | 「FCAS市場で世界トップ級収益（継続）。…」 |
| L194 | japanComparison | 先行 | 「…日本の需給調整市場（三次調整力等）の先行モデル。」 |
| L196 | overview | トップ | 「…投資パイプラインの46%を占める。FCAS市場で世界トップ級収益。」（overview の末尾の文） |
| L202 | highlights | トップ | 「NEMのFCAS市場でBESSが世界トップ級収益、Hornsdaleの実証から商用化が定着」 |

- 「過去最高」「世界最大」は出典つきの数値の文が多い（SEIA・SolarPower Europe）。
- 「世界最速級」「世界トップ級」「支配」「先行モデル」は出典の無い評価。
- 直すかはユウの裁定。

## (4) 本番の確認

- デプロイ: `e7edxlqe8`（`ba3f1b5` から・Ready 08:37）。`54b567e` もこのデプロイに入っている。途中のビルド 1 本（`6oqy67yw6`）は自動で Canceled。
- 08:37:54 に素の URL と `?v=` で取った（`<!-- -->` を剥がして数えた）。
  - 素の URL は、どれも 200・`x-vercel-cache: PRERENDER`・age 0。
  - `?v=` は、どれも 200・HIT・age 7〜14。
- 08:40:26 に `/milestones` を取り直した（素の URL・`?v=` とも HIT・age 150／152）。

| ページ | 結果 |
|---|---|
| `/milestones` | `<title>`・og:title とも「更新履歴（主な公開と更新） \| 蓄電所ネット」。h1「更新履歴」。項目 59。「業界ニュース」のリンク（href `/news`）は 3 つで、項目 13・21・55 の中。「ニュース一覧」は 0 |
| `/reports` | 「公開予定」「準備中」「7月予定」「独自」は、どれも 0。「2026年7月2日公開」は 1。description は新しい文 |
| `/global/us`・`eu`・`cn`・`in`・`au` | ■4 の前の語 14 個は、どれも 0 |
| ニュースの詳細 3 件（(2) の例） | 3 件とも「公開日：2026/6/1 / 最終更新：2026/6/1」（デプロイ前の 08:20 は 2026/5/31） |

- 照合の申告: 08:37:54 の照合スクリプト（`prod_sf.py`）は `/milestones` の項目を 0 と数えた。raw 文字列の中に `\\d` と書いたので、正規表現が数字ではなく「`\` と `d`」を探した。スクリプトの誤り。正規表現を直した `prod_recheck.py` で 59（上の表）。

## (5) ユウの前提違い（便の逐語 → 実際）

1. 「ビルドの前後で、ニュースの詳細ページ（全件）の表示日付が変わったページの数と例 3 件を報告（変わるのは JST 0〜9 時の配信のものだけのはず）」
   - ローカルのビルドは日本時間で動くので、前後で変わったページは 0 だった。
   - 本番（UTC）で変わるページは 34 件で、データから数えた（(2)）。
   - ビルドの前後の比較で効果を見るには、`TZ=UTC` でビルドする必要がある。
2. 「`npm run type-check`」: package.json に type-check のスクリプトは無いので、`npx tsc --noEmit -p .` で代えた。

## (6) 申告・一時物

- 使った道具: curl・Python・tsx・Vercel CLI。内蔵ブラウザ・Claude in Chrome・調べ役は使っていない。
- 一時物: scratchpad の `sf/` に置いた。消していない。
  - ニュースの日付: `news_dates.py`・`news-before.json`・`news-after.json`・`news_tz.py`・`news-tz.json`
  - 当てた記録: `apply_tz.py`・`apply_text.py`・`apply_text.log.json`
  - 評価の語の拾い: `gm_words.py`・`gm_words.txt`
  - 本番の照合: `prod_sf.py`・`prod1.txt`（08:37:54）、`prod_recheck.py`・`prod2.txt`（08:40:26）、`m.html`・`c.html`・`c.hdr`（取り直しの控え）
  - ビルドのログ
