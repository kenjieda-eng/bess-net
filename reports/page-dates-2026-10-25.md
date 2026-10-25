# 日付表示便 報告 — 解説・用語集・補助金・事業者・案件・政策カレンダーの詳細に「公開日・更新日」（2026-10-25）

## (0) 読んだ便ファイル（絶対パス）

- `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\日付表示便_解説・用語集・補助金・事業者・案件・政策の詳細に公開日と更新日_コードのみ_Claude_Code投入_2026-10-17起草_ユウ.md`（4,787 バイト）
- キュー: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md`（この便の行が GO・依存の「本実行便の後」は 10/22 DONE、「補助金便 10-20 の後」は同日 `d858cc8` で DONE）
- 停止条件: rm 全形・Remove-Item・git push --force・.env の内容表示 いずれも 0。microCMS 書込 0（GET もこの便では precompute のビルドだけ）。

## 結論

- 共通の部品 `src/components/PageDates.tsx`（日付の作り方は `src/lib/page-dates.ts`）を、6 種の詳細の題名の直下に差し込んだ。表示は「公開日 2026年4月30日」「更新日 2026年10月22日」（13px・`--color-muted`）、訂正履歴の記録があるページは行末に「訂正履歴を見る」（`#correction-history` へのページ内リンク）。
- 日付は microCMS の `publishedAt`（公開日）と `revisedAt`（更新日）だけから作る。`updatedAt` は使わない。日は JST の暦日で切り、更新日の日が公開日と同じなら更新日を出さない。値が無い項目は出さない。
- ビルド出力で、6 種の詳細 2,845 ページの**全部**に「公開日」があり、「訂正履歴を見る」は訂正記録のあるページと**同数**（計 301）・リンク先の節が無いページは 0。
- 読取専用のレビュー（別のエージェント）: 正しさの不具合 0。「訂正履歴を見る」で飛ぶと節が固定ヘッダの下に隠れる、の指摘を受けて `scroll-margin-top: 110px` を足した。
- commit `5fadc32`（push 2026-10-25 18:15:36 JST）→ Vercel success 18:23:48 JST。本番の素 URL 10 本で全部期待どおり（(3)）。

## (1) 差し込んだページと取得の欄

| ページ | 置き場所 | データの出どころ | 取得の変更 |
|---|---|---|---|
| `/explainer/[slug]` | `h1.article-title` の直下 | `getExplainerBySlug`（fields 指定なし＝publishedAt・revisedAt を含む） | なし。構造化データ（datePublished・dateModified）は今のまま |
| `/glossary/[slug]` | `h1.article-title` の直下（英名・読みの上） | precompute `glossary-detail-index.json` の `term` | `scripts/precompute-glossary-detail.ts` の出力に publishedAt・revisedAt を追加（取得 `getAllGlossary` は fields 指定なし）。fallback（`entryFromTerm`）にも写した。構造化データの dateModified は足していない（便で任意） |
| `/subsidies/[slug]` | `h1.page-title` の直下 | `getSubsidyBySlug`（fields 指定なし） | なし。一覧の「最終更新」は触っていない |
| `/operators/[slug]` | `h1.op-detail-title`（と英名）の直下 | precompute `operators-detail-index.json` の `operator` | `scripts/precompute-operators-detail.ts` の出力に追加（取得 `getAllOperators` は fields 指定なし）。fallback（`loadEntry`）にも写した |
| `/projects/[slug]` | `h1.page-title` の直下 | `getProjectBySlug`（fields 指定なし） | なし。もとからページの日付の表示は無かった（関連ニュースの日付だけ）＝重なりなし |
| `/policy-calendar/[slug]` | `h1.article-title` の直下・開催日のメタ行の上 | `getAllPolicyEvents`（fields 指定なし・全件 1 回の取得を共有） | なし。開催日（ラベルなしの「2026年…」）とは別の行・「公開日」のラベル付きで混ざらない |
| `CorrectionHistory`（記事末の訂正履歴） | — | — | `<section>` に `id="correction-history"` と `scroll-margin-top: 110px` |

- 一覧の取得のペイロードは変えていない（fields を足した取得は 0）。precompute の JSON は用語集 1,535 件・事業者 577 件に 2 鍵ずつ増えるだけ（約 100KB）。
- ニュースの詳細は変えていない。表記の違い（(4) に書く）。

## (2) 検査

- `npm run build` EXIT 0 → `npm run type-check` EXIT 0（scroll-margin を足した後は `tsc --noEmit` EXIT 0）。
- `npm run verify:page-dates`（新設・`scripts/verify-page-dates.ts`）16 件 ok: JST の境目（UTC 14:59 → 同じ日、15:00 → 翌日・JST 8:30 は UTC の前日）・同じ JST 日なら更新日なし（UTC で同じ日でも JST で別の日なら出す・逆も）・値が無い／読めない・ラベル「2026年4月30日」（ゼロを付けない）。
- ビルド出力の全数（`.next/server/app/<種>/*.html`・script を除き `<!-- -->` を剥がした初期 DOM）:

| 種 | 詳細 HTML | 「公開日」 | 「更新日」 | 「訂正履歴を見る」 | 訂正記録のあるページ | リンク先の節が無い |
|---|---|---|---|---|---|---|
| explainer | 260 | 260 | 146 | 53 | 53 | 0 |
| glossary | 1,534 | 1,534 | 1,518 | 37 | 37 | 0 |
| subsidies | 80 | 80 | 59 | 15 | 15 | 0 |
| operators | 577（＋ハブ 4） | 577 | 233 | 151 | 151 | 0 |
| projects | 379 | 379 | 261 | 43 | 43 | 0 |
| policy-calendar | 11 | 11 | 5 | 2 | 2 | 0 |

  - operators の HTML 581 のうち日付が無い 4 本は `aggregators`・`epc`・`makers`・`pref`（事業者のハブ＝詳細ではない）。
  - 見本: explainer/aggregator-business「公開日 2026年4月30日 更新日 2026年10月22日 訂正履歴を見る」（本実行便で直したページ）・glossary/adjustment-power-tender「公開日 2026年5月1日 更新日 2026年10月22日 訂正履歴を見る」・subsidies/chiba-gyomu-datsutanso-2026「公開日 2026年9月29日 更新日 2026年10月22日 訂正履歴を見る」・operators/agg-01001933「公開日 2026年5月4日 更新日 2026年10月22日 訂正履歴を見る」・projects/kirishima-bess「公開日 2026年5月2日 更新日 2026年10月22日 訂正履歴を見る」・policy-calendar/balancing-market-reform-2026-03「公開日 2026年6月12日 更新日 2026年10月22日 訂正履歴を見る」。
- JST の境目（実データ）: 00:00〜08:59 JST に更新したレコードは用語集に 1 件。`specified-wholesale-supply` の revisedAt `2026-10-08T23:36:10.060Z`（JST 10/9 8:36）→ 表示「更新日 2026年10月9日」＝JST の日（UTC で切ると 10/8 になるところ）。
- 読取専用のレビュー（別のエージェント・ファイル編集なし）の結果:
  - 欄の取り違え・JST・重複表示・fallback の欠け・型: 指摘なし。リンクの条件は `PageDates` と `CorrectionHistory` が同じ path 文字列で同じ `correctionsForPath` を見るので一致。
  - 低〜中: `.site-header` が sticky で `scroll-margin` が無く、「訂正履歴を見る」で飛ぶと見出しがヘッダの下に隠れる → **直した**（`scroll-margin-top: 110px`）。
  - 低（見た目のみ・直していない）: h1 の下マージン（`.article-detail .article-title` 16px・`.page-title` 12px）が日付の行の上マージン 4px と相殺され、explainer・glossary・policy-calendar では日付の行の上 16px・下 12px と、題名より本文側に寄って見える。事業者は英名の有無で上 4px／12px。375px では折り返すだけで横あふれなし。

## (3) 本番 curl（2026-10-25 18:24:35 JST・Vercel success 18:23:48 の 47 秒後）

| 種 | URL | HTTP | x-vercel-cache | age | 題名の下の行 | 記事末の節 |
|---|---|---|---|---|---|---|
| 素 | /explainer/aggregator-business | 200 | PRERENDER | 0 | 公開日 2026年4月30日 更新日 2026年10月22日 訂正履歴を見る | あり |
| 素 | /glossary/adjustment-power-tender | 200 | PRERENDER | 0 | 公開日 2026年5月1日 更新日 2026年10月22日 訂正履歴を見る | あり |
| 素 | /subsidies/chiba-gyomu-datsutanso-2026 | 200 | PRERENDER | 0 | 公開日 2026年9月29日 更新日 2026年10月22日 訂正履歴を見る | あり |
| 素 | /operators/agg-01001933 | 200 | PRERENDER | 0 | 公開日 2026年5月4日 更新日 2026年10月22日 訂正履歴を見る | あり |
| 素 | /projects/kirishima-bess | 200 | PRERENDER | 0 | 公開日 2026年5月2日 更新日 2026年10月22日 訂正履歴を見る | あり |
| 素 | /policy-calendar/balancing-market-reform-2026-03 | 200 | PRERENDER | 0 | 公開日 2026年6月12日 更新日 2026年10月22日 訂正履歴を見る | あり |
| 素 | /glossary/specified-wholesale-supply（JST の境目） | 200 | PRERENDER | 0 | 公開日 2026年4月30日 更新日 2026年10月9日 訂正履歴を見る | あり |
| 素 | /subsidies/kochi-bess-2026（補助金便 10-20 で今日 PATCH） | 200 | PRERENDER | 0 | 公開日 2026年8月7日 更新日 2026年10月25日 | なし（訂正記録なし） |
| 素 | /explainer/3min-guide | 200 | PRERENDER | 0 | 公開日 2026年7月25日（更新日なし） | なし |
| 素 | /policy-calendar/bess-grid-connection-quick-2026-04 | 200 | PRERENDER | 0 | 公開日 2026年6月12日（更新日なし） | なし |

- `?v=` 付きは 10 本とも HIT・age 0 で素と同じ内容。素 URL がすべて PRERENDER・age 0＝新しい deploy の出力（TTL の窓なし）。
- 本番の節は `id="correction-history"`・`scroll-margin-top:110px` 付き（explainer/aggregator-business で確認）。

## (4) 前提違い・気づいた点（逐語）

- 便 §2「`fields=` で欄を絞っている取得には、publishedAt と revisedAt を足す」: 6 種の詳細の取得はどれも fields を絞っていなかった（`getExplainerBySlug`・`getSubsidyBySlug`・`getProjectBySlug`・`getAllPolicyEvents`、precompute の `getAllGlossary`・`getAllOperators`）。足したのは precompute の**出力**（用語集・事業者）だけで、microCMS への取得は変えていない。
- 便 §0「`updatedAt` は下書きの保存でも動くので使わない」: そのとおり使っていない。補助金の一覧の「最終更新: 2026-10-25（掲載データの最新更新日）」は `subsidies.json` の `updatedAt` 由来で、便の指示どおり触っていない（詳細の「更新日」は revisedAt なので、両者は別の値になりうる）。
- ニュースの詳細（変えていない）: 表記は「公開日：2026/10/22 / 最終更新：2026/10/22」の形（`toLocaleDateString('ja-JP')`・区切りは「／」でなく「 / 」、年月日は数字とスラッシュ）。この部品は「公開日 2026年10月22日」。★加えてニュースは `toLocaleDateString` に timeZone を渡していないので、サーバ（UTC）の暦日になり、00:00〜08:59 JST の公開・更新は前の日に出る。直すかはユウの判断（同じ部品に寄せれば JST になる）。
- 本実行便（10/22）で書いたページは「更新日 2026年10月22日」になる（便の期待どおり）。用語集は 1,518／1,534 に更新日が出る（多くは 2026-05-13 の一括更新）。

## (5) 申告・一時物

- 一時物（消していない）: ビルドのログ・ビルド出力の全数の数え・本番照合の出力は scratchpad（リポの外）。部品の下書き `PageDates.tsx` も scratchpad に残っている（リポの版が正）。
- `scripts/verify-page-dates.ts` を新設し `package.json` に `verify:page-dates` を足した（prebuild には入れていない）。
- この worktree には `node_modules` が無く、prebuild の `verify:asset-check` に ★WARN 1 件（生成スクリプトを worktree のパスの tsx で呼ぶため Cannot find module）。補助金便と同じで、本番の判定には関係しない。
- prebuild で書き換わった変電所の静的 JSON など（補助金便の報告 (7) と同じ）は commit していない。
- `_QUEUE.md`: この便の行を DONE にし、報告パスを書いた（自分の行だけ）。
