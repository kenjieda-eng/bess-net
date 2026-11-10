# 補助金の一覧の作り直しの間隔便 — `/subsidies` の ISR を 1 日 → 10 分に（2026-11-10・CC）

- 依頼書: `03_5月13日朝_実行/補助金の一覧の作り直しの間隔便_subsidiesのISRを1日から10分に_GitHubの定時の遅れに頼らない_コードのみ_Claude_Code投入_2026-11-10起草_ユウ.md`（`_QUEUE.md` 105 行・GO ユウ 11/10 19:5x）
- 裁定: `02_計画・運営/検証記録_毎朝の再ビルド便_2026-11-04_ユウ.md` の 11/10 15:2x・19:3x の追記（裁定 2・3）
- microCMS の書込 0・読み込みの増加 0。IndexNow は送っていない（見た目の変更が無い）。

## (0) 絶対パス

- 報告: `C:\Users\kenji\Documents\GitHub\bess-net\reports\subsidies-hub-isr-2026-11-10.md`
- 判定の試しの出力: `C:\Users\kenji\Documents\GitHub\bess-net\reports\subsidies-hub-isr-2026-11-10.tests.txt`
- 本番の確認の記録: `C:\Users\kenji\Documents\GitHub\bess-net\reports\subsidies-hub-isr-2026-11-10.prod.json`

## (1) 変えた所

| ファイル | 変えたこと |
|---|---|
| `src/app/subsidies/page.tsx` | `export const revalidate = 86400;` → `600`。S1 のコメント（「日次ISR」）・本文の中の「revalidate=86400 の日次自己更新」・一覧の上の JSX コメント（「日次ISRの自己更新」）を直した。ほかは変えていない（データの出どころ・状態の出し方・絞り込み）。 |
| `src/app/subsidies/SubsidiesBrowser.tsx` | 先頭のコメント（「ハブの revalidate=86400（日次自己更新）」）と `status` の型のコメント（「日次 ISR で更新」）を直した。コードは変えていない。 |
| `.github/workflows/daily-rebuild.yml` | 00:10 の回（`10 15 * * *`）も印を見て決める（(4)）。先頭のコメントと cron の注記・手順の名前を直した。予備の時刻・印・IndexNow の後段・concurrency は変えていない。 |
| `scripts/verify-jst-today.ts` | `/subsidies` の検査を足した（(2)）。 |
| `scripts/lib/import-graph.ts`（新規） | `verify-grid-detail-static.ts` にあった「読み込み先をたどって microCMS を値で import していないかを見る」部分を切り出した（2 つの検査で同じものを使う）。 |
| `scripts/verify-grid-detail-static.ts` | 上の切り出しを使う形にした。挙動は不変（出力が前後で一字一句同じ・下に記録）。 |
| `README.md` | 「デプロイ」の節: 再ビルドが作り直すもの・補助金の一覧は再ビルドに頼らないこと・00:10 の回も印を見ること・定時の遅れ。 |
| `src/app/tracker/subsidy/page.tsx` | 先頭のコメントの「/subsidies の日次 ISR と同じ考え方」を「ISR〔2026-11-10 から 10 分〕」に（コメントだけ・便に名前の無いファイルなので申告 (6)）。 |

- CLAUDE.md: ISR の値の一覧や `/subsidies` の間隔の記述は無かった（`grep 86400` 0 件・`revalidate` の行は #112・#116・#127 の一般の話と 3-2 の雛形だけ）＝直していない。
- `verify-grid-detail-static` の出力（切り出しの前後で同じ・`diff` で差 0）:
  `[verify:grid-detail-static] 読み込み先 63 本・詳細 8355 件（一覧 8346＋凍結 9）・座標あり 1082・事業者 10・JSON 10 本 計 5.51MB（最大 1.16MB）`

### 負荷の試算（鉄則 #4）

- `/subsidies` の作り直しで読むのは、ビルド時の `src/data/subsidies.json`（バンドル済み）と `getTodayJST()` だけ。作り直し 1 回あたりの microCMS は 0 回・外部の fetch は 0 回。
- ピーク負荷＝1 ページ × 0 リクエスト × 何並列でも ＝ 0 req/分。間隔を 1 日 → 10 分にしても microCMS の負荷は増えない。
- ISR の書込の数え方（作り直した中身が前と同じなら数えない）は、依頼書が引いた Vercel の docs のとおりで、CC は確かめていない（Vercel の使用量の画面は見ていない）。

## (2) 足した検査（`verify:jst-today`・prebuild に入っている）

`scripts/verify-jst-today.ts` に足した（「今日を JST で出しているか」の検査で、`/subsidies` の日付の表示が今日になる話と同じ組）。

1. `src/app/subsidies/page.tsx` の `export const revalidate` がちょうど 1 つで、値が `600`。
2. ページと root の layout から読み込み先をたどり（`scripts/lib/import-graph.ts`）、`src/lib/microcms.ts` と `microcms-js-sdk` を値として読み込んでいない（`import type` は可）。
3. たどった読み込み先の `.ts`／`.tsx`（いま 12 本）に `fetch(` が無い（コメントは外して見る）。

出力（ok のとき）:

```
[verify:jst-today] ok   2026-11-04T15:15:00Z（JST 11/5 00:15）で今日は 11/5・11/4 締切は受付終了／締切済／申込不可
[verify:jst-today] ok   /subsidies は revalidate 600・読み込み先 12 本に microCMS の import と fetch( が無い
```

落ちるべき所で落ちるかの試し（page.tsx を一時的に書き換えて流し、最後に元へ戻した＝sha256 が同じ）:

| 書き換え | 結果 | 出た行 |
|---|---|---|
| revalidate を 86400 に戻す | 落ちる ✓ | `src/app/subsidies/page.tsx の revalidate: 期待「600」・実際「86400」…` |
| `import { getSubsidyList } from '@/lib/microcms'` を足す | 落ちる ✓ | `/subsidies: microcms.ts を値として import している: src\app\subsidies\page.tsx → src/lib/microcms.ts` |
| `import type { Subsidy } from '@/lib/microcms'` を足す | 通る ✓ | （型だけは可） |
| `import { createClient } from 'microcms-js-sdk'` を足す | 落ちる ✓ | `/subsidies: src\app\subsidies\page.tsx が microcms-js-sdk を import している` |
| ページに `void fetch('https://example.invalid/')` を足す | 落ちる ✓ | `/subsidies: src\app\subsidies\page.tsx に fetch( がある…` |
| コメントの中に `fetch(` を書く | 通る ✓ | （コメントは見ない） |
| `export const revalidate` を消す | 落ちる ✓ | `…期待「600」・実際「（無い）」…` |

（便の前、ページを変える前に足した検査を流したときも「期待 600・実際 86400」で落ちた。）

## (3) ほかの ISR 1 日のページ（変えていない）

依頼書の 3 ページ:

| ページ | 作り直しで microCMS を読むか | 作り直しで fetch | データの出どころ | 日付を使う所 | この便の見立て |
|---|---|---|---|---|---|
| `/market/jepx` | 読まない | なし | ビルド時の EIC の JSON（`src/lib/eic-data.ts` が `src/data/eic/*.json` を import する・コメントも「外部 fetch 0」） | `todayJst()` を `runDate` に（最新日を今日で頭打ちにして `JepxRealData` に渡す） | 短くできる候補。外部を読まない。ただし数値はビルドのときにしか変わらないので、短くして変わるのは「今日で頭打ち」の所だけ（受渡日＝明日の点が、日付が変わると出る） |
| `/dashboard/market` | 読まない | なし | 同じ（`meti-`・`fuel-`・`jgb-`・`us-treasury-`・`fx-` の系列） | `todayJst()` を `runDate` に（最新月・前回値の頭打ち）・`new Date()`（`nowD`） | 短くできる候補（同上） |
| `/industry` | 読む（`getSubsidyList`・`getSubstationList`・`getOperatorList`・`getProjectList` の 4 軸 × 2〔最新・7 日の件数〕＝作り直し 1 回で 8 回） | なし（microCMS は SDK 経由） | microCMS＋ビルド時の JSON | `todayJst()`（JEPX の最新平均）・`Date.now()`（7 日前） | 変えない（依頼書どおり） |

ほか（便の外の確かめ・読取のみ）: `revalidate = 86400` のページは 42 本（`/subsidies` を除く）。

- microCMS を値として読み込むのは 6 本: `/anken`・`/global`・`/glossary/[slug]`・`/industry`・`/map/industry-chaos`・`/operators/[slug]`。
- サーバ側の `fetch(` を持つものは 0 本。
- `/market/jepx`・`/dashboard/market`・`/industry` のほかに、ページ自身でサーバ側の日付を使うものは無かった。`/tools/subsidy-match` は `getTodayJST()` を使うが、読者のブラウザで計算する（`SubsidyMatcher` は `'use client'`）。
- どのページも root の layout がお知らせバナーに描画日を渡す（`toJstDate(new Date())`）。`/subsidies` は 10 分ごとの作り直しで、バナーの HTML も 10 分ごとに今日になる（おまけの効果）。

## (4) 00:10 の回の決め方と、判定の試し

- 変更前: 00:10 の定時の回は、印を見ずに必ず hook を叩いた。
- 変更後: 00:10 の回（`10 15 * * *`）も予備と同じ決め方。枠は「00:10」と出る。
  - 印の `dateJst` が今日 → 何もしない。前の日付 → 叩く。印が読めない → 何もしない（06:10 の回が叩く）。
- 手動実行（check_only でない）は、今までどおり印を見ずに必ず叩く。check_only は今までどおり。
- 2 つの回が 10 分ほどの間に続けて始まると、どちらも前の日付の印を読んで 2 本走ることがある（デプロイが Ready になるまで印は変わらない）。害は無い（先頭のコメントに書いた）。

判定の試し（予備便と同じやり方: YAML から `decide` の手順を取り出し、ローカルの http サーバで印の形を差し替えて流す。hook の手順は流していない）:

- 実行: 2026-11-10 19:56 JST（日本と UTC の日付が同じ時間帯。Git Bash の `date` は `TZ=Asia/Tokyo` を効かせない）。
- 予備便の 13 通り: 変わったのは 9（00:10 の定時・印は今日）だけ（叩く → 叩かない）。ほかの 12 通りは前と一字一句同じ（`diff` で 9 行目だけ）。
- 00:10 の追加 5 通り（便の 3 通り＝今日・昨日・読めない、のうち「読めない」を 4 つの形で）: すべて決めたとおり。

```
[9 00:10 の定時（印は今日）] … 枠 00:10・印 HTTP 200・dateJst 2026-11-10 → 今日の日付でビルド済み。何もしない（hook: 叩かない） | fire=false
[14 00:10・印が昨日] … 枠 00:10・印 HTTP 200・dateJst 2026-11-09 → 前の日付のビルドなので叩く（hook: 叩く） | fire=true
[15 00:10・壊れた JSON（読めない）] … 印が読めないので、この回は何もしない（hook: 叩かない） | fire=false
[16 00:10・HTTP 404（読めない）] … 印が読めないので、この回は何もしない（hook: 叩かない） | fire=false
[17 00:10・つながらない（読めない）] … 印 HTTP 000 … 何もしない（hook: 叩かない） | fire=false
[18 00:10・dateJst 無し（読めない）] … 何もしない（hook: 叩かない） | fire=false
```

全 18 行は `reports/subsidies-hub-isr-2026-11-10.tests.txt`。YAML は PyYAML で読めた（cron 6 本は変わらず）。

## (5) 本番の確認

- push: `dd1b5fc`（20:04 JST）。デプロイ `bess-iow869t2m`（作成 20:04:57・Ready）。commit の状態が success になったのを 20:12:14 に確かめた。
- 印 `https://bess-net.jp/build-info.json`: `{"dateJst":"2026-11-10","builtAt":"2026-11-10T20:07:44+09:00"}`（このデプロイのビルド）。
- サイトマップの URL の数: 12,586（変わらず）。

素の URL（クエリ・キャッシュ回避ヘッダ無し）で読んだ値（`<!-- -->` と script を外した初期 DOM で数えた）:

| 時刻（JST） | URL | HTTP | x-vercel-cache | age | 中身 |
|---|---|---|---|---|---|
| 20:01:53（前のデプロイ） | /subsidies | 200 | PRERENDER | 0 | 見出し 公募中 27・採択結果公表 16・受付終了 32・その他 5 |
| 20:12:16 | /subsidies | 200 | PRERENDER | 0 | 同じ（11/10 の `displaySubsidyStatus` で数えた値と同じ）・「いま公募中」27 行・先頭は福島県の「あと6日」 |
| 20:12:17 | /subsidies/sii-chikudenchi07r | 200 | PRERENDER | 0 | |
| 20:12:19 | /tracker/subsidy | 200 | PRERENDER | 0 | |
| 20:12:20 | /build-info.json | 200 | PRERENDER | 0 | |
| 20:12:21 | / | 200 | HIT | 4 | |

**作り直しの確かめ**（デプロイの完了 20:12 から 11 分たった 20:23 から、1 分おきに 3 回）:

| 時刻（JST） | HTTP | x-vercel-cache | age | 見出し |
|---|---|---|---|---|
| 20:23:04 | 200 | STALE | 647 | 27・16・32・5 |
| 20:24:05 | 200 | HIT | 343 | 27・16・32・5 |
| 20:25:05 | 200 | HIT | 403 | 27・16・32・5 |

- 1 回目は、20:12:17 に入った写し（age 647＝600 秒を過ぎた）が STALE で返った。2 回目からは、より新しい写し（age 343＝20:18 ごろに作り直された写し）が HIT で返った。1 日（86400 秒）なら、この時刻に STALE は出ない。間隔が 600 秒になったことを本番で確かめた。
- 2 回目の写しが 20:18 ごろのものなのは、20:17:44（ビルド 20:07:44 から 600 秒）より後に、ほかの訪問（クローラなど）が作り直しを起こしたためとみられる（CC の読みではない）。
- 同じ日のうちは中身は変わらない（見出しは 3 回とも同じ）。
- 日付の変わり目の確かめは、便のとおりユウが 0 時台に行う。11/10 と 11/11 では見出しの件数は変わらない（11/10 締切の補助金が無い。`subsidies.json` を 11/11 で数えても 27・16・32・5）。変わるのは「あと N 日」で、福島県（締切 2026-11-16）が「あと6日」から「あと5日」になる見込み。
- 全部の読みは `reports/subsidies-hub-isr-2026-11-10.prod.json`。

## (6) 申告

- **便に名前の無いファイルを 3 つ触った**:
  - `src/app/tracker/subsidy/page.tsx`: 先頭のコメントの「/subsidies の日次 ISR」を直した。コメントだけ。
  - `src/app/build-info.json/route.ts`: 先頭のコメントを直した（報告の commit に入れた）。「読み手は予備の回」「00:10 の…再ビルドが始まらず」が、この便の後では古いので、「定時の回（00:10 も）」「毎日 数時間 遅れて始まる」に。値と動きは変えていない。
  - `scripts/verify-grid-detail-static.ts`: 読み込み先をたどる処理を `scripts/lib/import-graph.ts` に切り出した。出力は前後で一字一句同じ。
- **page.tsx を一時的に書き換えた**: 検査が落ちるかの試しで、7 通りに書き換えて流した。終わってから元へ戻し、sha256 が同じことを確かめた。
- **ローカルの http サーバ**: 判定の試しのため、`127.0.0.1:18765` で印の形の JSON（scratchpad の `fx/`）を配った。試しの後に止めた。
- **前の便の報告の取り違え**: 予備便（104 行）のチャットの要約と `_QUEUE.md` の DONE の注記で、00:10 の分の開始を「04:13〜06:17 JST」と書いた。04:13・06:17 は遅れの長さで、開始は 04:23〜06:27 JST が正しい（ユウが 11/10 19:3x の追記で指摘・報告 `daily-rebuild-backup-2026-11-10.md` の表は正しい）。104 行の注記は、この便の行ではないので直していない。この報告・README・ワークフローのコメント・verify のコメントには、開始の時刻（04:23〜08:45 JST）を書いた。
- **確かめていないこと**: Vercel の ISR の書込の数え方（中身が同じなら数えない）は、依頼書が引いた docs のとおりで、使用量の画面は見ていない。
- **同じ時間に別の便の作業をしていた**: 78 行（売買事例の一覧便）の下調べ（調べ役 5 体・読取と curl だけ）と、作業ツリーでの実装を、この便の本番の確認を待つ間に始めた。78 行のファイルは、この便の commit には入れていない（名指しで commit）。
- **一時物**（消していない・すべて scratchpad の `isr1110/`）:
  - 試しの道具: `extract.py`・`decide.sh`・`run_tests.sh`・`fault_inject.py`・`fault_inject.txt`・`prod_check.py`・`count_status.ts`・`isr_table.ts`
  - 試しの記録: `tests.txt`・`old13.txt`・`new13.txt`・`yaml_summary.txt`・`isr_pages.txt`・`isr_pages.jsonl`・`fx/`（印の形）・`run/`
  - 前後の出力: `*.before.txt`・`*.after.txt`
  - 本番の読み: `prod_*.json`・`body.html`・`reval*.out`
  - 編集用のスクリプト: `edit_*.py`・`fix_regex.py`
  - ビルドのログ: `build.log`
  - 78 行の下調べの物（`rows_*.txt`・`decisions*`・`area_*` ほか）も同じフォルダにある。
- IndexNow は送っていない（便どおり）。microCMS の書込 0・GET 0。
