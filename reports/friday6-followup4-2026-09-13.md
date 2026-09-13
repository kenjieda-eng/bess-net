# 金曜#6 追修便④ 報告（2026-09-13）

生成物の追跡解除（■1）・諸元 1,976／1,979 の定義確定（■2）・null にした値の本文残り（■3）。
書込は microCMS PATCH（差分限定・件別提示・#106）と git 操作。POST・DELETE・PUT なし。

---

## 0. 先に確認してほしいこと

1. **■1(a) の判定: 欠ければ「大声で落ちる」。ただし生成物を作る前に落ちる。このまま (b) をすると Vercel のビルドが毎回失敗する状態だったので、(a) の「先にそこを直してから」として直した。**
   生成物フォルダを退避して prebuild を走らせると、1 本目（build:glossary-faq-index）で即 `MODULE_NOT_FOUND`（news-topic-exclusions.json）。prebuild 9 本が読む src/lib/microcms.ts が生成物 2 本を読み込み時に import し、生成物の書き手自身も自分の出力を import していた（鶏と卵）。
   → **③ §7 で私が書いた「repo に置く理由は無い」は誤りだった**（コミット済みの 2 本が prebuild の起動に要っていた）。訂正します。
2. **依頼の前提の補足**: `EIC_MAX_FAILURE_RATE=0.10` は precompute-eic-data.ts（出力 `src/data/eic/`・既に ignore＝追跡外）の設定で、src/lib/generated の 11 本の書き手には部分失敗の許容は無い（9 本とも例外は exit 1）。コミット済みの生成物が失敗を隠しうる経路は「書き手が exit 0 のまま書かなかった」場合で、とくにサイトから import されない 2 本（projects-maintenance・operators-match-audit）は欠けても古くても素通りしていた → 検査を足して塞いだ。
3. **■2: 1,976 と 1,979 は別の量ではない**（どちらも発行者情報の同じ定型文「完成後の増加能力は、出力で…kW」で書かれ、対の容量も同じ 8,226kWh。別の量として書き分けた一次は無く、差 3kW は送電端換算の損失より 1 桁小さい）。ただし 1,976 は「古い値が後で改まった」ものではなく、1,979 と同じ時期に発行者情報の（注）でだけ使われた食い違いで、訂正開示も無い（どちらが正かを明言した資料は無い）。**発電所・事業一覧に施設ごとの記載がある**（朝来・丹波・和歌山とも「定格出力1,979kW」「定格容量8,226kWh」、和歌山は「予定」付き）。→ (b) により和歌山を 1.979／8.226 に。朝来・丹波は一覧と一致しており変更なし。**値は案Aと同じになったが、根拠は (a)(b)**（(c) は使っていない）。反証（3 視点のワークフロー）で C1〜C6 はすべて確認され、下書きの言い過ぎ 2 点を訂正した（§2.1・§2.2）。
4. **■3(d): 「フィールドが null なのに本文に数値」は和歌山 1 件だけ**（本件）。参考として「0（調査中）なのに本文に数値」は別に数えた（§3.1・是正は別便）。

---

## 1. ■1 生成物の追跡解除

### 1.1 (a) 判定の根拠（実測）

2026-09-13 01:33Z、src/lib/generated を丸ごと scratchpad へ退避（mv）した状態で prebuild の 1 本目と 9 本目を実行（直後に戻した）:

```
=== prebuild step 1: build:glossary-faq-index (fresh state)
Error: Cannot find module './generated/news-topic-exclusions.json'
Require stack:
- …\src\lib\news-topic-gate.ts
- …\src\lib\microcms.ts
- …\scripts\build-glossary-faq-index.ts
EXIT=1
=== prebuild step 9: build:news-topic-gate (fresh state)
Error: Cannot find module './generated/news-topic-exclusions.json'
Require stack:
- …\src\lib\news-topic-gate.ts
- …\scripts\precompute-news-topic-gate.ts
EXIT=1
```

esbuild の依存グラフ（prebuild 13 本全部）で確認した原因:

| prebuild の step（旧順） | 読み込み時に import していた生成物 | 経由 |
|---|---|---|
| 1〜5・7・8・10（計 8 本） | news-topic-exclusions.json・related-news-map.json | microcms.ts → news-topic-gate.ts／microcms.ts |
| 9 build:news-topic-gate（書き手本人） | news-topic-exclusions.json（自分の出力） | news-topic-gate.ts |
| 6・11〜13 | なし | — |

素通りの経路の棚卸し:
- 書き手（9 本・11 ファイル）: すべて `main().catch → process.exit(1)`。内部で例外を握って書かずに exit 0 で終わる経路は無い。
- 読み手（next build）: 9 本は静的 import（欠ければ Module not found で落ちる）。**projects-maintenance.json（保守リスト）と operators-match-audit.json（突合の監査・verify:operators の入力）はサイトから import されない** → 欠けても古くても素通り。
- 判定: 9 本は「大声で落ちる」、2 本は「素通り」。加えて全体が「生成物を作る前に落ちる」。

### 1.2 直したこと（コミット 2564fca・この 11 ファイルだけ）

| ファイル | 変更 |
|---|---|
| src/lib/news-topic-patterns.ts（新規） | 判定語 TOPIC_PATTERNS・allowlist・isOnTopicNewsText・isOnTopicNewsArticle を移設（生成物に依存しない部分。定義はここ 1 箇所） |
| src/lib/news-topic-gate.ts | 生成物（除外 slug 集合）を読む部分だけにし、上の 4 つを再エクスポート（既存の import 先は不変） |
| scripts/precompute-news-topic-gate.ts | 判定語を news-topic-patterns から読む（自分の出力を import しない）＋出力フォルダの mkdir |
| src/lib/microcms.ts | related-news-map.json の import を削除し、getRelatedNewsForSubstation を移設 |
| src/lib/related-cards.ts | getRelatedNewsForSubstation を受け入れ（同じマップを既に読んでいた＝マップの読込が 1 箇所に揃う） |
| src/app/grid/[slug]/page.tsx | 上の関数の import 先を related-cards へ |
| scripts/precompute-{explainer-related,projects-pref-count,projects-maintenance}.ts | 出力フォルダの mkdir（新規クローンにはフォルダ自体が無い） |
| scripts/verify-generated-present.ts（新規） | `--mark`: prebuild の先頭で出力フォルダを作り開始の印を置く／`--check`: 末尾で 11 本が「存在・空でない・JSON・印より後に書かれた」を検査し、1 本でも欠ければ exit 1 |
| package.json | prebuild を `build:generated-mark → build:news-topic-gate → （従来の順）→ verify:generated` に |

### 1.3 実証（ローカル・生成物ゼロから）

- src/lib/generated を丸ごと退避・fetch-cache も退避（#116）→ `npm run build`（01:51:41Z〜01:56:06Z）→ **BUILD_EXIT=0**・静的生成 5,569 ページ
- 依存グラフ（新しい順）: 全 step が「先行 step の生成物だけ」を import（step 3 以降が読むのは step 2 が作る news-topic-exclusions.json だけ）
- 検査の出力（ローカルのビルドログ）:

```
[verify:generated] ok   news-topic-exclusions.json     ← build:news-topic-gate       OK 5,800 bytes
[verify:generated] ok   glossary-faq-index.json        ← build:glossary-faq-index    OK 127,528 bytes
[verify:generated] ok   glossary-detail-index.json     ← build:glossary-detail       OK 7,913,744 bytes
[verify:generated] ok   operators-detail-index.json    ← build:operators-detail      OK 2,690,858 bytes
[verify:generated] ok   operators-category-index.json  ← build:operators-detail      OK 83,315 bytes
[verify:generated] ok   operators-match-audit.json     ← build:operators-detail      OK 510 bytes
[verify:generated] ok   grid-area-lists.json           ← build:substations           OK 5,374,075 bytes
[verify:generated] ok   related-news-map.json          ← build:related-news          OK 491,762 bytes
[verify:generated] ok   explainer-related-map.json     ← build:explainer-related     OK 66,161 bytes
[verify:generated] ok   projects-pref-count.json       ← build:projects-pref-count   OK 697 bytes
[verify:generated] ok   projects-maintenance.json      ← build:projects-maintenance  OK 31,960 bytes
[verify:generated] PASS 11/11 本（すべてこのビルドで生成）
```

- 新規生成 11 本 vs 前回ビルドの 11 本: 9 本はバイト同一・grid-area-lists は `generated_at` だけ・projects-maintenance は判定日 `overdueAsOf` だけ（日付が変わった分）＝**順序を変えても出力は変わらない**
- 否定テスト: 1 本欠け → `FAIL projects-maintenance.json … MISSING` exit 1／開始の印より古いファイル → `STALE` exit 1／戻して PASS
- tsc 0・verify 一式 PASS（linkify 15/15・no-301-links・projects-body 28・operators・grid-fields・nearby-cards）・/grid の関連ニュース（移設した関数）はローカルと本番で同一（cb-1001〜1003 各 3 本）

### 1.4 (b) `git rm -r --cached src/lib/generated`（単独コミット 6c3a114）

C1（2564fca）の Vercel デプロイ成功（02:09:11Z）を確かめてから実行。事前にステージが空であることを確認し、このコマンドだけでコミットした。

```
staged: none (OK)
=== staged after git rm --cached
     11 D
D	src/lib/generated/explainer-related-map.json
D	src/lib/generated/glossary-detail-index.json
D	src/lib/generated/glossary-faq-index.json
D	src/lib/generated/grid-area-lists.json
D	src/lib/generated/news-topic-exclusions.json
D	src/lib/generated/operators-category-index.json
D	src/lib/generated/operators-detail-index.json
D	src/lib/generated/operators-match-audit.json
D	src/lib/generated/projects-maintenance.json
D	src/lib/generated/projects-pref-count.json
D	src/lib/generated/related-news-map.json
 11 files changed, 21620 deletions(-)
   2564fca..6c3a114  main -> main
=== after
on disk: 11 files (+ .prebuild-started: yes)
tracked now: 0
ignored: yes
```

ディスク上の 11 本は残り（index から外しただけ）、以後は ignore される。

C1 の時点（追跡中）でも Vercel で新しい順の prebuild が走り、検査が通っていた（dpl_3jCT4W8fjDZfTuWWrk6jmqJftHvz のログ抜粋）:

```
2026-09-13T02:01:10.669Z  Cloning github.com/kenjieda-eng/bess-net (Branch: main, Commit: 2564fca)
2026-09-13T02:01:13.914Z  Running "npm run build"
2026-09-13T02:01:14.005Z  > npm run build:generated-mark && npm run build:news-topic-gate && npm run build:glossary-faq-index && …
2026-09-13T02:01:14.422Z  [verify:generated] 開始の印 src/lib/generated/.prebuild-started
2026-09-13T02:02:33.648Z  [verify:generated] PASS 11/11 本（すべてこのビルドで生成）
2026-09-13T02:08:44.646Z  Build Completed in /vercel/output [8m]
```

### 1.5 (c) デプロイ

| コミット | 生成物の状態 | Vercel（commits/&lt;sha&gt;/status） | ビルド |
|---|---|---|---|
| 2564fca（C1・修正） | まだ追跡中 | success 2026-09-13T02:09:11Z | 8 分・verify:generated 11/11 |
| **6c3a114（C2・git rm --cached）** | **リポジトリに無い（新規クローン）** | **success 2026-09-13T02:18:30Z** | 8 分・verify:generated 11/11 |

失敗時の revert は不要だった。

### 1.6 (d) prebuild が 11 本すべてを生成したことを示すビルドログの行（Vercel）

6c3a114 のデプロイ（dpl_4zWJfeZci54Ahq5WYpxn8wScBhN1）のビルドログ全文を `vercel inspect … --logs` で取得（2,886 行）し、該当行を抜粋。
クローン時点で src/lib/generated はリポジトリに無い（`Restored build cache` が戻すのは .next/cache で、src は戻らない）。検査は「開始の印より後に書かれた」ことまで見るので、PASS は 11 本すべてがこのビルドの prebuild で書かれたことを意味する。

```
2026-09-13T02:10:12.605Z  Cloning github.com/kenjieda-eng/bess-net (Branch: main, Commit: 6c3a114)
2026-09-13T02:10:14.463Z  Restored build cache from previous deployment (3jCT4W8fjDZfTuWWrk6jmqJftHvz)
2026-09-13T02:10:16.083Z  Running "npm run build"
2026-09-13T02:10:16.191Z  > bess-net@0.1.0 prebuild
2026-09-13T02:10:16.192Z  > npm run build:generated-mark && npm run build:news-topic-gate && npm run build:glossary-faq-index && …
2026-09-13T02:10:16.698Z  [verify:generated] 開始の印 src/lib/generated/.prebuild-started
2026-09-13T02:10:23.113Z  [news-topic-gate] news 1385件中 主題不適合 178件 → /vercel/path0/src/lib/generated/news-topic-exclusions.json
2026-09-13T02:11:28.543Z  [explainer-related] explainer 263件（非lv 176）→ 関連マップ 176entry → /vercel/path0/src/lib/generated/explainer-related-map.json
2026-09-13T02:11:29.937Z  [projects-pref-count] projects 344件（可視 253）→ 40都道府県 → /vercel/path0/src/lib/generated/projects-pref-count.json
2026-09-13T02:11:31.334Z  [projects-maintenance] projects 344件（掲載 253）→ 調査中 38 / 予定日超過 54（重複 8・判定日 2026-09-13）→ /vercel/path0/src/lib/generated/projects-maintenance.json
2026-09-13T02:11:31.698Z  [verify:generated] ok   news-topic-exclusions.json     ← build:news-topic-gate       OK 5,800 bytes
2026-09-13T02:11:31.701Z  [verify:generated] ok   glossary-faq-index.json        ← build:glossary-faq-index    OK 127,528 bytes
2026-09-13T02:11:31.787Z  [verify:generated] ok   glossary-detail-index.json     ← build:glossary-detail       OK 7,909,686 bytes
2026-09-13T02:11:31.815Z  [verify:generated] ok   operators-detail-index.json    ← build:operators-detail      OK 2,690,858 bytes
2026-09-13T02:11:31.816Z  [verify:generated] ok   operators-category-index.json  ← build:operators-detail      OK 83,315 bytes
2026-09-13T02:11:31.816Z  [verify:generated] ok   operators-match-audit.json     ← build:operators-detail      OK 510 bytes
2026-09-13T02:11:31.863Z  [verify:generated] ok   grid-area-lists.json           ← build:substations           OK 5,374,075 bytes
2026-09-13T02:11:31.868Z  [verify:generated] ok   related-news-map.json          ← build:related-news          OK 491,762 bytes
2026-09-13T02:11:31.869Z  [verify:generated] ok   explainer-related-map.json     ← build:explainer-related     OK 66,161 bytes
2026-09-13T02:11:31.869Z  [verify:generated] ok   projects-pref-count.json       ← build:projects-pref-count   OK 697 bytes
2026-09-13T02:11:31.869Z  [verify:generated] ok   projects-maintenance.json      ← build:projects-maintenance  OK 31,960 bytes
2026-09-13T02:11:31.870Z  [verify:generated] PASS 11/11 本（すべてこのビルドで生成）
2026-09-13T02:17:44.345Z  ✓ Generating static pages (5569/5569)
2026-09-13T02:17:54.835Z  Build Completed in /vercel/output [8m]
2026-09-13T02:18:29.687Z  Deployment completed
```

（glossary-detail-index のサイズがローカル 7,913,744 と Vercel 7,909,686 で違うのは C1 のビルドでも同じで、追跡の有無とは関係しない。ローカルと Vercel の同日ビルドの差で、中身の検討は本便の範囲外）

---

## 2. ■2 諸元 1,976 ／ 1,979

### 2.1 (a) 見出し語（逐語）と出典

EP の IR ページにある 2024〜2026 年の開示 PDF 85 本を全部読み、1,97x／8,226 の出現を拾った。1,976 が施設の出力として出るのは下の 2 箇所だけ。

| 値 | 見出し語（逐語） | 一次（頁） | 施設 | 日付 |
|---|---|---|---|---|
| 1,979 | 「（５）能力 出力：8,226kWh 容量：1,979kW」※ラベルと単位が入れ替わった書式（値は単位で読む）。行は 1 つで、2 施設の列に値は 1 つ | [ir_20241127-2](https://kenep.co.jp/pdf/ir_20241127-2.pdf) p.1 固定資産の取得及び資金借入に関するお知らせ | 朝来・丹波 | 2024-11-27 |
| 1,979 | 「PCS出力：1,979kW 蓄電容量（公称）：8,226 kWh」 | [パワーエックス PR TIMES](https://prtimes.jp/main/html/rd/p/000000154.000109041.html) | 朝来・丹波（各施設に同じ諸元） | 2025-04-09 |
| **1,976** | 「（注）完成後の増加能力は、出力で1,976kW、蓄電容量で8,226kWhの増加を想定しています。」 | [ir_20250530-1](https://kenep.co.jp/pdf/ir_20250530-1.pdf) p.16 2025年８月期中間発行者情報（「（１）重要な設備の新設等」の朝来・丹波 2 行に付く（注）） | 朝来・丹波 | 2025-05-30 |
| 1,979 | 「（５）能力 出力：8,226kWh 容量：1,979kW」（同じ入れ替わり） | [ir_20250812-3](https://kenep.co.jp/pdf/ir_20250812-3.pdf) p.1 固定資産の取得及び資金借入に関するお知らせ | 和歌山 | 2025-08-12 |
| **1,976** | 「（注）完成後の増加能力は、出力で1,976kW、蓄電容量で8,226kWhを想定しております。」 | [ir_20251128-4](https://kenep.co.jp/pdf/ir_20251128-4.pdf) p.19（表は p.18「（１）重要な設備の新設」の和歌山の行） | 和歌山 | 2025-11-28 |
| 1,979 | 「（注）１．完成後の増加能力は、出力で1,979kW、蓄電容量で8,226kWhを想定しております。」 | [ir_20260529-1](https://kenep.co.jp/pdf/ir_20260529-1.pdf) p.13 2026年8月期中間発行者情報 | 兵庫南あわじ（同じ 8,226kWh 構成） | 2026-05-29 |
| 1,979 | 「定格出力1,979kW 定格容量8,226kWh」（朝来・丹波・南あわじ）／「定格出力1,979kW予定 定格容量8,226kWh予定」（和歌山） | [EP 発電所・事業一覧](https://kenep.co.jp/denki/project/)（表は画像・数値は alt 属性） | 施設別 | 2026-09-13 取得 |

同型の兄弟施設（参考）: [ir_20251014-2](https://kenep.co.jp/pdf/ir_20251014-2.pdf)「出力：1,979kW 容量：8,226kWh」（南あわじ）・[ir_20251114-2](https://kenep.co.jp/pdf/ir_20251114-2.pdf)「出力：1,979kW 容量： 7,740kWh」（有田湯浅）・[ir_20260714-1](https://kenep.co.jp/pdf/ir_20260714-1.pdf)「出力：1,979kW 容量：7,521kWh」（北岐阜）。

判定: **別の量ではない**（同じ量＝施設の出力の、食い違う 2 つの値）。
- **見出し語が同じ**: 1,976（2025-05-30 版・2025-11-28 版）と 1,979（2026-05-29 版）は、発行者情報の同じ節・同じ定型文「完成後の増加能力は、出力で…kW、蓄電容量で…kWh」で書かれ、対になる容量も同じ 8,226kWh。
- **書き分けた一次が無い**: 1,976 を PCS 出力・送電端・連系容量・最大出力などの別の量として書いた一次は、EP の開示 85 本・EP サイト・メーカー発表・Web のどこにも無い。EP は太陽光では「計画最大出力 1,500kw（最大発電能力2389.41kw）」（ir_20240322-1）と別の量を書き分けているが、蓄電所では一度も書き分けていない。
- **数値の面でも別定義説は成り立ちにくい**（反証側の検討）: 差 3kW（0.15%）は、PCS から送電端までの典型的な損失（2,000kVA 変圧器 1 台の損失だけで約 0.6%）より 1 桁小さい。また 1,976 は公称容量 8,226kWh と組になっており、送電端の値らしくない。
- 1,979 の見出し語は、メーカーが「PCS出力」、EP 一覧が「定格出力」、EP 取得開示が「（５）能力」。PowerX の同じ 3 台構成の他社案件は 1,999kW で、PCS 出力は案件ごとの設定値（製品仕様からは導けない）。
- **時系列の注意（下書きからの訂正）**: 1,976 は「旧版に残った古い値」ではない。1,979 のほうが先に出ており（2024-11-27 取得開示・2025-04-09 メーカー発表）、2 本の 1,976 版の間にある 2025-08-12 の取得開示も 1,979。最新 2026-05-29 版の 1,979 は南あわじ・有田湯浅についての値で、3 施設（朝来・丹波・和歌山）はその版の新設計画の表に載っていない。3 施設について 1,976 を 1,979 に直した訂正開示も無い。→ 1,976 は発行者情報の（注）でだけ使われた食い違いの値で、誤記か別の設計値かは一次からは判定できない。**1,979 を採るのは、メーカーの PCS 出力・EP 一覧の定格出力・EP 取得開示がそろって 1,979 であることからの推論**（明言した資料は無い）。取得開示のうち 3 施設分の 2 本（2024-11-27・2025-08-12）はラベルの入れ替わった同じ雛形で、独立した裏付けとしては割り引いて見るべき。
- サイトの outputMw には明文の定義が無い（画面は「出力 X MW」、JSON-LD は PropertyValue「outputMw」）。同系の既存レコード（朝来・丹波）は一次の「PCS出力」を採っている。→ 1,979（PCS出力＝定格出力）がこの欄の使い方に合う。

反証（3 視点・読取のみのワークフロー）の結果:
- 読み手: C1〜C6 すべて confirmed。C6（ir_20241127-2 の「能力」行）は結合セルと確定（extract_tables の生値が None・能力の行帯にだけ列境界の縦罫線が無い・「容量：1,979kW」の文字が列境界をまたぐ）＝2 施設に共通の 1 値。
- 定義探し: C5 のみ partially（数値は正しいが、一覧は施設ごとの HTML 要素ではなく県ごとの画像。§2.2 に反映）。1,976 の出典は EP の開示・サイト・メーカー発表・Web のどこにも他に無い。
- 反対側: C4 のみ partially（「旧版だけに残る」は言い過ぎ。上の時系列の注意に反映）。「outputMw に 1,976 を採るべき」を支える資料は見つからず、「両方とも採れない」も過剰（差は 0.15%）という判断。

### 2.2 (b) 発電所・事業一覧の施設別の行

**ある**。https://kenep.co.jp/denki/project/（題名「再エネを支える系統用蓄電所・発電所の開発・運用 | エネルギーパワー株式会社」・2026-09-13T01:45Z 取得）は県ごとの画像 1 枚（兵庫県・和歌山県。PC 用と SP 用で各 2 回）で、画像の中に施設ごとのブロックがあり、alt 属性にも施設ごとに並ぶ（施設ごとの HTML 要素は無い）。画像本体（img_02.png・img_03.png、Last-Modified 2026-05-21）の表示と alt は同じ数字（反証側が画像を表示して確認）。alt（逐語）:

> 兵庫県 系統用蓄電所 朝来メガパワー蓄電所 定格出力1,979kW 定格容量8,226kWh 丹波メガパワー蓄電所定格出力1,979kW 定格容量8,226kWh 兵庫南あわじメガパワー蓄電所 定格出力1,979kW 定格容量8,226kWh
>
> 和歌山県 系統用蓄電所 和歌山メガパワー蓄電所 定格出力1,979kW予定 定格容量8,226kWh予定 有田湯浅町メガパワー蓄電所 定格出力 1,979kW 定格容量7,740kWh

和歌山の記載があるので、依頼どおり容量も一覧の値（8,226kWh → 8.226）を入れた。和歌山は運転開始（2026年3月・ir_20260414-1）後も「予定」表記のまま（画像の更新は 2026-05-21）。
容量のラベルの注意: 一覧の「定格容量」8,226kWh は、PowerX の発表でいう「蓄電容量（公称）」と同じ値（PowerX は同じ 3 台構成の他案件で「蓄電容量（定格）：7,404 kWh」と書き分けており、一覧のラベルは厳密ではない）。DB の capacityMwh は朝来・丹波とも既に 8.226（公称）で、和歌山も同じ扱いにした。

### 2.3 結果

| 施設 | 一覧（施設別） | DB 前 | DB 後 |
|---|---|---|---|
| 和歌山 pr-co140317-bess | 1,979kW予定／8,226kWh予定 | null／null | **1.979／8.226** |
| 朝来 pr-co109041-hyogo | 1,979kW／8,226kWh | 1.979／8.226 | 変更なし（照合のみ） |
| 丹波 tamba-megapower | 1,979kW／8,226kWh | 1.979／8.226 | 変更なし（照合のみ） |

- (c)（案A）は使っていないので、1,976 の notes 併記はしていない。なお projects には notes フィールドが無い（併記するなら本文になる）。
- (d) 結果として 3 施設が同じ値になったのは、一次が施設別に同じ値を書いているため（揃えること自体は目的にしていない）。

---

## 3. ■3 和歌山の本文

対象は本文第 1 段落の中の 1 文（capacityMwh は ③ で null、本文には 8.2 が地の文として残っていた）。

- 前: 「…2025年10月14日には株式会社脱炭素化支援機構が、同社が和歌山県和歌山市松江で計画する**設備容量約8.2MWhの**系統用蓄電所事業に3億円の支援を行うことを決定したと発表した（同日の同社開示: （開示事項の経過）資金借入に関するお知らせ（2025年10月14日））。」
- 後: 「…同社が和歌山県和歌山市松江で計画する系統用蓄電所事業に3億円の支援を行うことを決定したと発表した（同日の同社開示: …）。**株式会社脱炭素化支援機構のリリースでは、この事業を「設備容量約8.2MWh」と記載している。事業者エネルギーパワー自身の[発電所・事業一覧](https://kenep.co.jp/denki/project/)（2026年9月13日時点）の記載は「定格出力1,979kW予定 定格容量8,226kWh予定」で、両者の表記は一致しない（支援機構の値は概数）。諸元欄は事業者自身の記載を採っている（出力1.979MW・容量8.226MWh）。**」

- (a) 発表主体の明示: 数値を地の文から外し、「〈発表者〉のリリースでは…と記載」の形の独立した 1 文にした。発表者名は PR TIMES の配信元「株式会社脱炭素化支援機構」の逐語。
- (b)(c): ■2 で和歌山の値が確定したので (c) の形にした。出所の文と食い違いの記述は残し、諸元欄には確定値を入れた。本文には「諸元欄を空にしている」ではなく、どちらの記載を採ったかを書いた（フィールドと本文が同じ瞬間に揃うよう、2 フィールドと本文を 1 回の PATCH にまとめた）。
- 「一致しない（支援機構の値は概数）」と書いた理由: 8.2 は 8,226kWh を小数 1 桁に丸めた値と矛盾はしないが、同じ数ではない。「食い違い」と断定するより、表記が違うことと支援機構の値が概数であることをそのまま書いた。
- 時点明示（#123）: 一覧の「予定」表記は今後書き換わりうるため「2026年9月13日時点」を付けた。事業者自身の記載の出典として、一覧へのリンクを本文に 1 本足した。

### 3.1 (d) 横展開（調査のみ）

読者が見る本文（テンプレ本文は第1段落をフィールドから再生成した後）で数えた（projects 344 件・2026-09-13 GET）。

| 型 | 母数 | 本文に同種の数値あり |
|---|---|---|
| **outputMw が null** | 5 | **0** |
| **capacityMwh が null** | 16 | **1**（和歌山＝本件。■3 の PATCH 後は 0） |
| 参考: outputMw が 0（「調査中」表示） | 105 | 14 |
| 参考: capacityMwh が 0（「調査中」表示） | 110 | 12 |
| 参考: cod が null で本文に運転開始の年など | 76 | 12（年・年度・月精度のため意図して null にしたものを含む） |

- 数値の拾い方: MW/kW/GW と MWh/kWh/GWh（全角・カタカナ表記・大文字小文字を区別しない）。初回は大文字「KWH」「ギガワット」を取りこぼしており（反証ワークフローの分類係が検出）、数え直した。null の 2 行は数え直しでも変わらない。
- 参考の「0（調査中）なのに本文に数値」26 行（14＋12）を 1 件ずつ判定した（読取のみのワークフロー）:
  - **当該施設の数値を書いているのは 1 件**: pr-co55631-hokkaido（outputMw 0）の本文「北海道夕張郡長沼町の系統用蓄電所・37,515kWが落札。」。ただしこれは長期脱炭素電源オークションの**落札容量**で、定格出力とは別の量になりうる（「何の数字か」の一致は未確認）。
  - 残り 25 行は施設そのものの諸元ではない: 三木森ホールディングスの 10 案件合計「総出力19.8MW／総容量81MWh」（10 レコード×出力・容量＝20 行。本文自身が「個別の出力・容量は一次リリースに記載がなく調査中」と明記）／製品 1 台の型番「LUNA2000 215KWH」（starseeds-wakayama-inokuchi）／低圧設備の級「49.9kW」（pr-co13775-bess-3）／規制解説の容量帯「200kWh級」（pr-co13775-bess-2）／会社目標「蓄電池運用規模1,000MW」（pr-co139670-bess）／投資総額「2ギガワット以上」（pr-iqg-second-foundation-bess）。
- 是正は別便（依頼どおり件数のみ）。

---

## 4. 変更した field（#106 前後照合）

実行 2026-09-13 02:20:21〜02:20:32Z（scripts/patch-friday6-followup4-2026-09-13.ts）。書込直前に一次の逐語 6 片を取り直し（6/6）、2 フィールドと本文を 1 回の PATCH で送信。GET で全 field を照合。

| # | endpoint/slug | field | 前値 | 後値 | #106 |
|---|---|---|---|---|---|
| ■2 | projects/pr-co140317-bess | outputMw | null | 1.979 | ✓ 保存=1.979 |
| ■2 | projects/pr-co140317-bess | capacityMwh | null | 8.226 | ✓ 保存=8.226 |
| ■3 | projects/pr-co140317-bess | body | 「…計画する**設備容量約8.2MWhの**系統用蓄電所事業に3億円の支援を…（同日の同社開示: …）。」 | 「…計画する系統用蓄電所事業に3億円の支援を…（同日の同社開示: …）。」＋§3 の 3 文（1,291→1,552 字） | ✓ marker 1 回・置換元の残存なし・送信値と全文一致 |
| — | projects/pr-co109041-hyogo（朝来） | outputMw・capacityMwh | 1.979・8.226 | 変更なし（照合のみ・一次 4/4） | — |
| — | projects/tamba-megapower（丹波） | outputMw・capacityMwh | 1.979・8.226 | 変更なし（照合のみ・一次 2/2） | — |

`#106: ✓ 送信 3 field 反映・他フィールド変化 0`。再実行（dry-run）は 3 行とも skip（同値・本文は適用済み＝冪等）。

---

## 5. デプロイ後の本番 curl（和歌山・朝来・丹波）

PATCH（02:20:32Z）で microCMS の webhook が Vercel を再ビルド（6c3a114 に新しい commit status・success 2026-09-13T02:29:44Z）。取得は 02:29:57〜02:30:00Z、素 URL（クエリ・キャッシュ回避ヘッダなし）・依頼の curl 形式。
**STALE は 0 件**（3 件とも `PRERENDER`＝新デプロイの静的生成物・Age 0）→ 取り直しは不要だった。

### 5.1 projects/pr-co140317-bess（和歌山）— 200

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/pr-co140317-bess"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 54644
Content-Type: text/html; charset=utf-8
Date: Sun, 13 Sep 2026 02:29:58 GMT
Etag: "104cee675158c515502449fcc95ab5b2"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/pr-co140317-bess
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::z9qcp-1789266598041-ecee6075fbad

200
```

本文（script 外）の抜粋:
- `<h1>和歌山メガパワー蓄電所</h1>`・バッジ「出力 1.979 MW」「容量 8.226 MWh」・meta description「出力1.979MW・容量8.226MWh。」・`<dt>運転開始</dt><dd>2026-03-01</dd>`
- 「株式会社脱炭素化支援機構のリリースでは、この事業を「設備容量約8.2MWh」と記載している。」1 回
- 「（2026年9月13日時点）の記載は「定格出力1,979kW予定 定格容量8,226kWh予定」で、両者の表記は一致しない（支援機構の値は概数）。」1 回
- 「諸元欄は事業者自身の記載を採っている（出力1.979MW・容量8.226MWh）。」1 回
- 旧い地の文「計画する設備容量約8.2MWhの系統用蓄電所事業」0 回・一覧へのリンク `href="https://kenep.co.jp/denki/project/"` 1 本

### 5.2 projects/pr-co109041-hyogo（朝来）— 200

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/pr-co109041-hyogo"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 55025
Content-Type: text/html; charset=utf-8
Date: Sun, 13 Sep 2026 02:29:59 GMT
Etag: "bfcecf29e72cc168cfda9b62dad2c0f0"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/pr-co109041-hyogo
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::m49kr-1789266599441-6798c993343b

200
```

- `<h1>朝来メガパワー蓄電所</h1>`・バッジ「出力 1.979 MW」「容量 8.226 MWh」・meta description「出力1.979MW・容量8.226MWh。」・`<dt>運転開始</dt><dd>2025-12-01</dd>`（変更なし）
- 本文「PCS出力1,979kW／蓄電容量（公称）8,226kWh」2 回（第 1 段落と重複でない旨の注記・変更なし）

### 5.3 projects/tamba-megapower（丹波）— 200

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/tamba-megapower"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 55859
Content-Type: text/html; charset=utf-8
Date: Sun, 13 Sep 2026 02:30:00 GMT
Etag: "5cb4e4ac0d7682e238351849f9aaf773"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/tamba-megapower
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::v9n9q-1789266600688-5432df916f32

200
```

- `<h1>丹波メガパワー蓄電所</h1>`・バッジ「出力 1.979 MW」「容量 8.226 MWh」・meta description「出力1.979MW・容量8.226MWh。」・`<dt>運転開始</dt><dd>2025-12-01</dd>`（変更なし）
- 本文「PCS出力1,979kW／蓄電容量（公称）8,226kWh」2 回（変更なし）

---

## 6. 触らなかった行とその理由

| 項目 | 理由 |
|---|---|
| 朝来・丹波の諸元 | 一覧の施設別の行（1,979kW／8,226kWh）と一致（照合のみ・§2.3） |
| 朝来・丹波の本文（「PCS出力1,979kW／蓄電容量（公称）8,226kWh」） | メーカー発表の逐語で一次と一致 |
| 1,976 の notes 併記 | (c) を使っていない。projects に notes フィールドは無い |
| ■3(d) の参考行（0＝調査中なのに本文に数値・cod null） | 依頼どおり件数のみ（是正は別便） |
| src/data/subsidies.json（1 本）・src/data/substations/（43 本） | src/lib/generated の外にある同じ型のコミット済み生成物（build:subsidies・build:substations が毎ビルド書く）。本便の範囲外（件数と場所だけ） |
| 和歌山の「🎯 企業元リリース: jicn.co.jp」 | 前便と同じ（取込器テンプレのラベル問題・まとめて扱う便で） |
