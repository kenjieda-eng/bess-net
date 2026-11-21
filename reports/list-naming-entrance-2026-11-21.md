# 蓄電所一覧便（2026-11-21）— /projects の呼び名を「蓄電所一覧」にそろえ、トップの最初の画面に入口を置く

コードのみ・**microCMS 書込 0**。`src/app/grid/**` は触っていない。`/projects` の title・description・表の中身は変えていない。

## (0) 実行の記録

| 項目 | 値 |
|---|---|
| 便 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\蓄電所一覧便_呼び名と入口_メニュー・見出し・リンクの文字を「蓄電所一覧」に・トップの最初の画面に件数とボタン_コードのみ_Claude_Code投入_2026-11-21起草_ユウ.md` |
| 開始 | 2026-11-21 18:29 JST・HEAD `6e61c41`（129 行〔合計を正す便〕の DONE の後） |
| `_QUEUE.md` | 130 行（GO: ユウ 11/21 17:18・EDAさん 17:18「A と B で任せます」・2 本目） |
| commit | `8708f5b`（21 ファイル）・報告は別の commit |
| 停止条件 | rm 系 0・push --force 0・.env 表示 0（読み込みのみ）・microCMS は GET だけ（ビルドの取得） |

## (1) 呼び名を替えた所・残した所

便の表の 20 か所（行番号は `3bcffc4` から少しずれていたので文字で探した）:

| # | 場所 | 後 |
|---|---|---|
| 1 | `src/lib/site-config.ts` の `nav` | 「蓄電所一覧」・位置を「系統空き容量」の前へ（ニュース → 解説 → 用語集 → 補助金 → **蓄電所一覧** → 系統空き容量 → 事業者ナビ → 流通案件 …） |
| 2〜4 | `src/app/projects/page.tsx` | パンくず「トップ / 蓄電所一覧」・h1「全国の蓄電所一覧」・リード「計画中・建設中・稼働中の系統用蓄電池プロジェクトを、公開情報をもとに一覧にしています。」 |
| 5 | `src/app/projects/[slug]/page.tsx` | パンくず「蓄電所一覧」・「← 蓄電所一覧へ戻る」 |
| 6 | `src/app/page.tsx` ヒーローの文 | 「業界ニュース、全国の蓄電所一覧、市場制度解説、…」 |
| 7 | `src/components/Report2026Body.tsx` | リンク 3 つ「蓄電所一覧」「蓄電所一覧」「蓄電所一覧（N件）」 |
| 8 | `src/app/reports/2026/page.tsx` | `sub="蓄電所一覧"`・「蓄電所一覧 (N件)」 |
| 9 | `src/app/industry/top50/page.tsx` 253 | 「蓄電所一覧」 |
| 10 | `src/app/anken/page.tsx` | 「全国の蓄電所一覧」 |
| 11 | `src/app/tracker/deals/page.tsx` | 「全国の蓄電所一覧」 |
| 12 | `src/app/tracker/pf/page.tsx` 80・88 | 「蓄電所一覧」・「蓄電所一覧 (全件)」 |
| 13 | `src/app/events/page.tsx` | 「蓄電所一覧（国内の事例）」 |
| 14 | `src/app/map/industry-chaos/page.tsx` | 「蓄電所一覧」 |
| 15 | `src/app/info/seminar-bess-investment-2026-10-14/page.tsx` | 「蓄電所一覧（国内の事例）」 |
| 16 | `src/data/contact-pages-configs.ts` 146 | label「蓄電所一覧」 |
| 17 | `src/lib/news-next-step.ts` | label「蓄電所一覧」 |
| 18 | `src/lib/explainer-next-step.ts` | 「全国の蓄電所一覧と流通案件で」・「全国の蓄電所一覧」・「全国の蓄電所一覧で開発状況を見る」 |
| 19 | `src/lib/glossary-next-step.ts` | 同上の 2 つ |
| 20 | `src/components/DealsList.tsx` | 個別の案件ページへのリンクの文字「蓄電所のページ」 |

- 表の外で見つけた所: **無し**。`/projects` へのリンクの文字は上で全部。フッターのリンクに `/projects` は無い。`/projects/[slug]` に JSON-LD のパンくずは無い。
- **残した所**（grep `プロジェクトDB｜プロジェクトデータベース｜プロジェクト DB`・`src/app/grid/**` を除く）: `about`（2）・`industry`（2）・`industry/top50`（4・description と本文の出典の文）・`operators/aggregators`／`epc`／`makers` の説明文（5）・`reports/2026` の「付録: … / プロジェクトDB / …」（1）・`tracker` と `tracker/pf` の説明文（4）・`OperatorCategoryList.tsx` の本文（2）・`Report2026Body.tsx` の本文（3）・`contact-pages-configs.ts` の本文（4）・`site-history.ts`（1）・`deals-related.ts` のコメント（1）・`site-config.ts` の description とお知らせ（3）・`sop-schedule.ts`（1）・`tools-cta.ts`（1）。どれも便 §0 の「文の中で、データの名前として出てくる『プロジェクトDB』」（次の便でそろえる）で、リンクの文字ではない。`OperatorCategoryList.tsx` と `reports/2026` の付録の行は §0 の例に名前が無いが、同じ型（データの名前）として残した。

## (2) トップ（`src/app/page.tsx`）

- **件数の出どころ**: `scripts/precompute-projects-pref-count.ts`（`build:projects-pref-count`・ビルド時・runtime の microCMS 0）が、/projects の掲載件数と同じ集合（`LIST_EXCLUDED_PROJECT_SLUGS` を除く）の件数を `src/lib/generated/projects-listed-count.json`（`{ listed, generatedAt }`）に書く。`projects-pref-count.json`（県 → 件数の対応表・変電所のページがキーで引く）に合計のキーを混ぜないため、別の生成物にした。`scripts/verify-generated-present.ts` の一覧に足した（14/14）。取れないときは数字の行の項目とカードを出さない。
- **数字の行**: 先頭に「蓄電所一覧 304件 · 」（後ろは今のまま）。
- **ボタン**: 「系統連系診断を使う」→ **「蓄電所一覧を見る」**（`/projects`・`btn-secondary`）→「業界レポート2026を読む」の 3 つ。
- **カード**: 「データベースとツール」の前面の先頭に「全国の蓄電所一覧」（`/projects`・tag DB・「計画中・建設中・稼働中の系統用蓄電池 304件。出力・容量・事業者・運転開始を一覧で。」）。前面 5 → 6 枚。折りたたみの 6 枚と「その他の機能を表示（… 6件）」はそのまま。
- **計測**: ボタンに `data-list-entry="top_hero"`、カードに `data-list-entry="top_card"`。`src/components/ContactClickTracker.tsx`（root layout の委譲の listener）に分岐を 1 つ足し、`gtag('event', 'list_entry_click', { entry_position, entry_to })`（中クリックも数える・gtag が無ければ何もしない）。`contact_click`・`next_step_click` は不変。

## (3) 一覧（`src/app/projects/page.tsx`）

- **表へ飛ぶリンク**: 件数の箱の下に 1 行「稼働中（155）｜建設中（47）｜計画中（85）｜その他（17）」。件数と並びは表と同じ `grouped` から（状態が増えても出る）。各表の h2 に id（`status-operating`・`status-construction`・`status-planned`・`status-other`。表に無い状態は並びの番号）。押しやすいよう余白を付けた。
- **合計**: 小数 1 桁（`3,124.5`・`9,403.5`）。「(N 件分)」・値そのもの・数え方は不変。
- **最終更新日**: 掲載中の蓄電所の `revisedAt` のうちいちばん新しいもの（JST の暦日・`src/lib/page-dates.ts` の `jstDay`／`jaDayLabel`＝詳細ページの「更新日」と同じ関数）。横に「追加・更新の履歴 →」（`/tracker/pf`）。
- title・description・表の中身・注記・「関連」の節は不変。

## (4) 本番の確認（素の URL・クエリなし）

- `8708f5b`（18:37:02 push）→ Vercel success 18:43:50 JST。前は 18:29（`6e61c41` のデプロイ後）、後は 18:43:59〜18:44:54 に取った。比べは scratchpad の `compare.py`（script・style・noscript を除き `<!-- -->` を剥がした文字）。

| URL | 後の HTTP・cache・age | 見たもの |
|---|---|---|
| `/` | 200・PRERENDER・0 | ヒーローの文に「全国の蓄電所一覧」・数字の行の先頭「蓄電所一覧 304件」（`/projects` の掲載件数 304 と同じ）・ボタン 3 つ（2 つ目「蓄電所一覧を見る」→ `/projects`）・「データベースとツール」の先頭のカードが `/projects`・`data-list-entry` top_hero／top_card・メニューは 補助金 → **蓄電所一覧** → 系統空き容量（「プロジェクト」は無い） |
| `/projects` | 200・PRERENDER・0 | title・meta description が前と同じ・h1「全国の蓄電所一覧」・パンくず・リード・表へ飛ぶリンク 4 本の href が 4 つの h2 の id と一致・合計「3,124.5」「9,403.5」・「最終更新: 2026年11月21日」・**表の行は前後とも 304 行・並びも同じ** |
| `/projects/tagawa-130mwh` | 200・PRERENDER・0 | パンくず「蓄電所一覧」・「← 蓄電所一覧へ戻る」（メニューと合わせて 3 本） |
| `/anken` | 200・PRERENDER・0 | 「蓄電所プロジェクトDB（全国）」→「全国の蓄電所一覧」 |
| `/tracker/deals` | 200・PRERENDER・0 | 「蓄電所プロジェクトDB」→「全国の蓄電所一覧」 |
| `/reports/2026` | 200・PRERENDER・0 | 「プロジェクトDB」2 本 →「蓄電所一覧」 |
| `/news/sonnedix-osakagas-oita-heisetsu-unten-2026-11` | 200・PRERENDER・0 | 次の一歩の箱「事業・案件の動きを追う」の 1 つ目が「蓄電所一覧」→ `/projects`（`/news/lehmansoft-…` は別の箱の型で `/projects` を出さないので、こちらで見た） |
| `/grid/kyu-836`・`/grid/prefecture/福岡県`・`/grid/tpg-0779` | 200・MISS／PRERENDER／MISS・0 | **title・meta description・h1 が前と同じ**。文字の差は 3 本とも 2 行だけ＝メニューの「プロジェクト」が消え「蓄電所一覧」が入った（並びの変化）。**メニューのほかの差 0** |

- **スマホの幅（390×844）**: 本番と同じビルドを手元（`next start`）で開き、内蔵ブラウザで見た。トップの最初の画面にボタン 3 つが縦に並び、2 つ目が「蓄電所一覧を見る」。`/projects` の先頭（パンくず・h1・リード・件数の箱 3 つ・表へ飛ぶリンク・最終更新日）は崩れていない。表へ飛ぶリンクは 2 行に折り返し、2 行目の頭に区切りの「｜」が来る（「｜その他（17）」）。読めるが、区切りを項目の後ろに付ける形にすれば行頭に来ない（小さな直しの候補）。

## (5) IndexNow

`reports/list-naming-entrance-2026-11-21.indexnow-urls.txt`（`/`・`/projects`）。dry run（2 件・鍵のファイル 200 一致）→ `--apply --log=reports/list-naming-entrance-2026-11-21.indexnow.json`: 18:45 JST・**HTTP 200（受理）**・2 件。鍵は先頭 4 文字 `605d` だけを書く。

## (6) 申告・一時物・気づき

- 停止条件に当たる操作なし（rm 系・push --force・.env の表示・microCMS の書込 いずれも 0）。
- `scripts/precompute-projects-pref-count.ts` に足した 1 行で、改行の `\n` がシェルの経由で本物の改行になり、型の検査で落ちた（push の前）。Edit で直した。
- 確かめに `next start`（本番ビルド・localhost:3000）を一時的に動かし、止めた。
- 一時物はすべて scratchpad（リポの外）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\ln1121\`（`before\`・`after\` の取得物・`compare.py`・`build\build.log`）。消していない。
- commit は名前を指定して入れた。
- 気づき: `scripts/verify-generated-present.ts` の冒頭の説明は「11 本」のまま（一覧は 14 本）。説明の数を一覧の長さに合わせる直しは別の小さな便でよい。
