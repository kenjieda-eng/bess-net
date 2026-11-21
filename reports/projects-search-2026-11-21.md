# 蓄電所一覧の検索便（2026-11-21）— /projects に絞り込み・並べ替え・CSV を付け、スマホで横にずらさず読める形にする

コードのみ・**microCMS 書込 0**（GET はビルドと検査の軸 4 だけ）。`src/app/grid/**`・メニュー・トップ・sitemap・詳細ページ・`/tracker/pf` は触っていない。
`/projects` の title・description・canonical・初めの 4 つの表（全行・6 つの欄の文字・見出し）は前と同じ。

## (0) 実行の記録

| 項目 | 値 |
|---|---|
| 便 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\蓄電所一覧の検索便_絞り込み・並べ替え・CSV・スマホの見え方_コードのみ_Claude_Code投入_2026-11-21起草_ユウ.md`（sha256 `f6f9a5c56a8583ac0b3b6cdcea66083506c893b7d786fa8d4c2ba10e06df8112`・29,611 バイト＝便の記載と同じ） |
| 開始 | 2026-11-21 21:22 JST・HEAD `a4e1d02`（130 行〔蓄電所一覧便〕の DONE の後） |
| `_QUEUE.md` | 131 行（GO: ユウ 11/21 21:19・EDAさん 21:18「OK」） |
| commit | `eead9ae`（9 ファイル・push 21:46:52）・報告は別の commit |
| 停止条件 | rm 系 0・push --force 0・.env 表示 0（読み込みのみ）・microCMS は GET だけ |
| §0 の停止 4 つ | 1. 初めの HTML の表: **同じ**（下の (2)）／2. `/projects` は `○`・`initialRevalidateSeconds: 600`／3. `projects-pref-count.json` の差分 **0**／4. gzip **+1,501 バイト**（25 KB 以内） → どれにも当たらず push |

## (1) 作ったファイルと、移した関数

| ファイル | 中身 |
|---|---|
| `src/lib/projects-list.ts`（新・React なし） | 行の軽い形 `ListRow`（slug・名前・状態・都道府県・市町村・出力・容量・事業者・EPC・cod・出典 URL・公開日・更新日。body・緯度経度・市場・id は持たない）と `toListRow`／状態の並びと語↔URL の鍵（`STATUS_ORDER`・`statusKey`・`statusAnchor`。h2 の id も同じ対応から）／`groupByStatus`（今の並び）・`groupRows`（並べ直さずにまとめる）／`isInvestigating`／`sumReliable`・`reliableCount`・`fmtTotal`・`fmtMW`・`fmtMWh`（ロケール `en-US` に固定・出てくる文字は同じ）／47 都道府県 `PREFECTURES` と `prefOf`（ぴったり同じ名前だけ）／地方 8 つ `REGIONS`／出力の帯 `mwBand`／`codYear`・`codSortKey`（`normalizeCod` を使い、年だけの書き方は鍵の側で 12/31。`normalizeCod` は変えていない）／URL の `parseState`・`serializeState`（鍵の並び固定・初めの値は書かない・知らない値は捨てる・例外を出さない・区切りのカンマはそのまま）／`matchKeyword`（NFKC・小文字・空白区切りは AND・名前・事業者・EPC・都道府県・市町村だけ）／`filterRows`・`sortRows`（同着は 名前 `localeCompare('ja')` → slug。初めの並びはサーバーの順のまま）／CSV の `buildCsv`・`csvText`・`csvNum`・`describeState`・`jstStamp` |
| `src/app/projects/ProjectsBrowser.tsx`（新・`'use client'`） | 絞り込み・並べ替えの箱／結果の行／表へ移動／children（最終更新日と注記 2 つ）／4 つの表（条件を選ぶと `hidden`）／1 つの表（条件か並べ替えを選んだときだけ描く・「状態」の列つき）。import は React・`next/link`・`projects-list`・`projects-cod` だけ |
| `src/app/projects/page.tsx` | `getAllProjects()` を 1 回 → 一覧除外（`LIST_EXCLUDED_PROJECT_SLUGS.has(`）→ `groupByStatus` の順に並べ、軽い形にして部品へ。`STATUS_ORDER`・`sortInvestigatingLast`・`groupByStatus`・`fmtMW`・`fmtMWh`・`fmtTotal`・`STATUS_ANCHOR`・`cellClass`・`sumReliable`・`reliableCount` は lib へ移した。metadata・`revalidate = 600`・編集部へのリンク（`contactUrl`）は page.tsx のまま。`searchParams` は受け取らない |
| `scripts/precompute-projects-pref-count.ts` | 県の判定を正規表現 `/^(.{2,3}?[都道府県])$/` から `prefOf` に替えた → `projects-pref-count.json` 差分 0・`projects-listed-count.json` は `generatedAt` だけ |
| `scripts/precompute-projects-maintenance.ts` | `isInvestigating` の中身を lib の関数に（export の形は同じ）→ `projects-maintenance.json` 差分 0 |
| `src/app/globals.css` | 末尾に `/projects` だけの class（`.projects-*`）を 215 行。640 以下で `.projects-table` を 1 行 1 かたまりに・`.project-stats` を横 1 列に・`.projects-browser [hidden]{display:none !important}` |
| `src/data/site-history.ts` | 先頭に N5（2026-11-21・データベース・題と文は便の §5 のとおり・リンク「全国の蓄電所一覧」→ `/projects`） |
| `scripts/verify-projects-list.ts`（新）＋ `npm run verify:projects-list` | 軸 1・2 を prebuild の最後に。軸 3 は `--html .next/server/app`、軸 4 は `--live`（`--sample <path>`） |
| `reports/projects-list-sample-2026-11-21.csv` | 条件なしの CSV の先頭 8 行（BOM つき・CRLF） |

## (2) 初めの HTML の比べ・大きさ・ビルドの一覧

**前**: 本番の素 URL `/projects`（21:23:13 取得・`x-vercel-cache: HIT`・`age: 147`）。**後**: ローカルビルドの `.next/server/app/projects.html`。
比べ方: script を除き、タグとコメントを除いた文字で、h2（id と文字）・`th`・各行の slug と 6 つの欄を順に比べた（`scratchpad\ps1121\compare_projects.py`）。

| 項目 | 結果 |
|---|---|
| 表の数・行の数 | 4 → 4・304 → 304 |
| 見出し（id・文字） | 同じ（`status-operating` 稼働中（155件）／`status-construction` 建設中（47件）／`status-planned` 計画中（85件）／`status-other` その他（17件）） |
| 列見出し・行の並び・slug・6 つの欄の文字 | **差 0** |
| title・description・canonical・h1 | 同じ |
| 件数の箱 3 つ（304・3,124.5（274 件分）・9,403.5（258 件分）） | 同じ |
| 最終更新日（2026年11月21日）・注記 2 つ・「関連」の節 | 同じ |
| 表へ移動 | 「表へ移動:」が頭に付いた（便の §3-5 のとおり）。区切りの「｜」は前の項目の後ろに置き、折り返しても行の頭に来ない（390 の幅で確認） |
| 「状態」の列のある表 | 初めの HTML に無い |

| 大きさ | 前（本番） | 後（ビルド） | 差 |
|---|---|---|---|
| 生 | 406,155 バイト | 360,268 バイト | −45,887 |
| gzip（level 9 で同じ計り方） | 50,021 バイト | 51,522 バイト | **+1,501** |

- 生が減ったのは、表の要素の木（RSC の payload）が行の軽い JSON（304 件）に替わったため。
- 便の数「gzip で 50,240」は計り方の違い（こちらは Python の gzip level 9）。差は同じ計り方の前後で出した。

| ビルドの一覧 | 前（130 行のビルド） | 後 |
|---|---|---|
| `/projects` | `○ /projects 1.27 kB 103 kB` | `○ /projects 8.57 kB 110 kB` |
| prerender-manifest | — | `initialRevalidateSeconds: 600`（ISR 10 分のまま） |

`git diff --stat` に `src/app/grid/**` は無い（変更 9 ファイルは (1) の表のとおり）。

## (3) verify

- ビルド: `BUILD EXIT 0`。prebuild の verify は全部 ok（`verify:projects-list ok（軸 1・2）` を含む）。`npm run verify:linkify` 15 ページ clean。`verify:no-301-links`（全軸）All checks passed。
- **軸 1（関数）**: 便 §6 の例を全部入れた（都道府県 9・47 県の並び＝`REAL_PREFECTURES`・地方 8 つに 47 が 1 回ずつ・出力の帯 9・年 6・並べ替えの鍵 5・キーワード〔`ｊｆｅ`・`レノバ 姫路` の AND・EPC だけ・slug に当てない〕・並べ替え〔空と 0 が最後・同着 名前 → slug・状態ごとは同じ配列のまま〕・URL〔読んで書くと同じ・初めの値は書かない・知らない鍵と値を捨てる・壊れた文字列 6 つで例外なし・データに無い年は捨てる・q 100 字〕・CSV〔1 行目・2 行目・条件の行・13 列・`"` と `,` と改行・先頭 `=` `+` `-` `@` に `'`・数字の欄に単位と桁区切りなし・空と 0 が空欄・空の状態は「その他」・行の数〕）→ ok。
- **軸 2（ソース）**: page.tsx に `searchParams` なし・`src/app/projects/**` に検索パラメータの hook なし・title／description／canonical／`revalidate = 600`／`LIST_EXCLUDED_PROJECT_SLUGS.has(` が前と同じ文字・部品と lib の import が許したものだけ → ok。
- **軸 3（`--html .next/server/app`）**: 表 4・行 304＝`data-list-total` 304＝件数の箱 304。状態のボタンの `data-count`＝見出しの件数（155・47・85・17）。出力のボタン le2 204／2-10 7／10-50 40／ge50 23／na 30（計 304）。地域の select 47 県＋未記載＝304・県の並びは JIS。年 2023 1／2024 12／2025 50／2026 80／2027 15／2028 18／2029 1／2030 1／記載なし 126（計 304）。「状態」の列のある表なし → ok。
- **軸 4（`--live`・GET 419 件・掲載 304）**: 県ごとの件数＝`projects-pref-count.json`。条件なしの CSV の行 304・出力の合計 3,124.478・容量の合計 9,403.459（ページの合計と小数 3 桁まで同じ）・slug の集合と並びがビルドの HTML の表と同じ → ok。
  - 埋まっている件数（掲載 304 のうち）: `epc` 58／`sourceUrl` 302／`marketParticipation` 102／`cod` 178／`prefecture` 273／`status` 287。
  - 公開日の日ごとの件数（多い順に 5 つ）: 2026-05-09 78／2026-05-02 66／2026-11-08 33／2026-08-04 23／2026-09-25 20。
  - 条件なしの CSV の先頭 8 行 → `reports/projects-list-sample-2026-11-21.csv`。

**便 §7 の参考の数との照合**（軸 4 で数え直した・データは 19:16 から動いていない）

| 条件 | 便 | 数え直し |
|---|---|---|
| なし | 304・3,124.478（274）・9,403.459（258） | 同じ |
| 地域＝福岡県 | 19・149.591（17）・542.502（16） | 同じ（`projects-pref-count.json` の福岡県 19 とも同じ） |
| 地域＝九州・沖縄 全体 | 67・615.169（60）・2,257.788（57） | 同じ |
| 地域＝所在地が未記載・確認中 | 31・154.942（27）・332.408（22） | 同じ |
| 状態＝稼働中 | 155・528.924（149）・1,725.740（148） | 155・528.924（149）・**1,725.739**（148） |
| 稼働中＋10〜50MW・50MW 以上 | 10・251.295（10）・673.160（10） | 同じ |
| 出力の帯 | 204／7／40／23／30 | 同じ |
| 運転開始の年＝2026 | 80・408.870（71）・1,492.194（73） | 同じ |
| 年の件数 | 1・12・50・80・15・18・1・1・126 | 同じ |
| 調査中だけ | 20 | 同じ |
| 出力の大きい順の上から 3 行 | 北豊富（240）・米原湖東（134）・SGET札幌1,2（100・千葉と同着で名前の順） | 同じ（4 行目が千葉蓄電所〔ENEOS Power〕100） |

- 稼働中の容量の合計だけ小数 3 桁目が 1 違う。148 件の容量を 10 進で足すと **1,725.7394**（ビルドの HTML に載った値から計算）＝小数 3 桁は 1,725.739。便の 1,725.740 は四捨五入の位置の違い（画面の表示は小数 1 桁でどちらも 1,725.7）。

## (4) 手元で見たこと・見ていないこと

`npm run start`（内蔵ブラウザ・localhost:3000）で確認。コンソールのエラー 0・サーバーのエラー 0。

- `?pref=福岡県` で開く → 地域が「福岡県」・1 つの表 19 行（列 プロジェクト名・状態・所在地・出力・容量・事業者・運転開始）・4 つの表は 0 個見えている・結果の行「該当 19 件（全 304 件中）｜合計出力 149.6 MW（17 件分）｜合計容量 542.5 MWh（16 件分）」・canonical は `https://bess-net.jp/projects`。
- 条件をクリア → URL が `/projects` に戻り、4 つの表 304 行・「全 304 件を表示中」と CSV のボタンだけ。
- 状態 稼働中＋出力 10〜50MW・50MW 以上（ボタンを押す）→ URL `?status=operating&mw=10-50,ge50`・10 件・251.3／673.2・`aria-pressed` 3 つ。
- よく使う見方 3 つ: 出力の大きい順（`?sort=mw`・上から 北豊富 240・米原湖東 134・SGET札幌1,2 100・千葉 100、最後は調査中）／最近 運転を始めた蓄電所（`?status=operating&sort=cod-desc`・155 件・先頭 2026-11-09・2026-11-04・2026年10月、運転開始の空は最後）／新しく載った蓄電所（`?sort=new`・名前の下に「公開日 2026年11月15日」）。
- 年 2026 → 80 件／調査中だけ → 20 件／未記載 → 31 件／九州・沖縄 全体 → 67 件（いずれも URL を開いて同じ表示）。
- キーワード `ｊｆｅ`（全角で入力）→ 5 件。EPC にだけ当たった 2 行に「EPC: JFEエンジニアリング」。入力欄を離れたときに `projects_filter {filter_kind: q, result_count: 5}` が 1 回。
- 壊れた URL（`?foo=1&pref=火星&sort=zzz&year=1999&q=%`）→ 知らない値は捨てて `?q=%25` に書き直し、表は消えない（`%` を含む 4 件）。
- CSV: ダウンロードは手元に保存せず、ページの中で Blob を受け取って中身を見た（EDAさんの Downloads に保存しないため）。ファイル名 `projects-bess-net-20261121.csv`・先頭 3 バイト `EF BB BF`・CRLF・1〜4 行目が便のとおり・行 5（キーワード ｊｆｅ）・`projects_csv_download {result_count: 5, conditions: 1}`。表計算ソフトでは開いていない（UTF-8 BOM の扱いは事業者ナビの CSV と同じ作り）。
- URL のコピー: 内蔵ブラウザはクリップボードの書き込みが拒否される（`NotAllowedError`）ため、URL を出して選ぶ表示になった（`GridSearchUrlCopy` と同じ動き）。「コピーしました」の表示は見ていない。出た URL を別のタブで開くと、同じ 5 件・入力欄に「ｊｆｅ」。`projects_url_copy {conditions: 1}`。
- 幅 390: ページの横幅 390（横スクロールなし）・表の枠の中の横スクロール 0（4 つの表・1 つの表とも）・件数の箱 3 つが横 1 列（各 109px）・絞り込みの箱の上端 511px（最初の画面 844 に入る）・入力欄と select が横いっぱい（316px）・ボタンの高さ 40px 以上・「表へ移動」の 2 行目の頭は「計画中」。
- 幅 1280: 表は今までどおりの表（`table-row`・見出し行あり）・件数の箱 3 列。

## (5) 本番の確認

Vercel: `eead9ae` success 2026-11-21 21:53:46 JST（status の更新時刻）。素の URL を curl（ブラウザの UA なし・キャッシュ回避ヘッダなし）で 2 回ずつ取った。

| 時刻 | URL | HTTP | x-vercel-cache | age | バイト |
|---|---|---|---|---|---|
| 21:54:15 | `/projects` | 200 | PRERENDER | 0 | 360,268 |
| 21:54:16 | `/projects?pref=福岡県` | 200 | HIT | 1 | 360,268 |
| 21:54:19 | `/grid/kyu-836` | 200 | MISS | 0 | 72,110 |
| 21:54:20 | `/` | 200 | PRERENDER | 0 | 99,870 |
| 21:54:22 | `/milestones` | 200 | PRERENDER | 0 | 204,049 |
| 21:54:51 | `/projects` | 200 | HIT | 35 | 360,268 |
| 21:54:52 | `/projects?pref=福岡県` | 200 | HIT | 36 | 360,268 |
| 21:54:53 | `/grid/kyu-836` | 200 | HIT | 34 | 72,110 |
| 21:54:54 | `/` | 200 | HIT | 28 | 99,870 |
| 21:54:55 | `/milestones` | 200 | HIT | 32 | 204,049 |

- `/projects`: title・description・canonical（`https://bess-net.jp/projects`）・h1「全国の蓄電所一覧」が前と同じ。**表の行が前（21:23 の本番）と同じ**（(2) と同じ比べ方で 4 表・304 行・差 0。違いは「表へ移動:」の頭だけ）。絞り込みの箱あり・結果の行「全 304 件を表示中」・`data-list-total="304"`・ボタンの件数 稼働中 155／建設中 47／計画中 85／その他 17・出力 204／7／40／23／30・1 つの表は初めの HTML に無い。大きさ 生 406,155 → 360,268・gzip（level 9）50,021 → 51,517（+1,496）。2 回目は 1 回目とバイト単位で同じ。
- `/projects?pref=福岡県`: HTML が `/projects` と同じ大きさ・表の行が同じ・canonical は `/projects`（サーバーは条件を見ない＝静的のまま。絞り込みはブラウザで）。
- `/grid/kyu-836`: title・description・h1 が前と同じ。「福岡県の蓄電所案件 19件 → プロジェクトDB」も前と同じ。
- `/`: 「蓄電所一覧 304件」が前と同じ。
- `/milestones`: 先頭が N5「蓄電所一覧に絞り込み・並べ替え・CSV を追加」、次が N4。
- 本番のブラウザでの動き（絞り込み・CSV・スマホ）は見ていない（手元の `next start` で見た＝(4)）。ユウの 30 分後の確かめで。

## (6) IndexNow

- `reports/projects-search-2026-11-21.indexnow-urls.txt`（`https://bess-net.jp/projects` の 1 URL）。dry run → `--apply`。鍵 605d…・本番の鍵のファイル HTTP 200・中身一致。
- 21:54:42 頃 送信 1〜1 件目 **HTTP 200（受理）**。記録 `reports/projects-search-2026-11-21.indexnow.json`。

## (7) 申告・一時物・気づき

- 停止条件の操作 0。一時物は scratchpad（`C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\ps1121\`）にだけ作った（前の控え `before\`・生成物の控え `gen_before\`・`build\build.log`・`compare_projects.py`・`prod_check.py`・`projects.css`）。消していない。
- ローカルの `next start` を 1 回起動し、確認の後に止めた（開いたのは `/projects` だけ。ISR のため microCMS を叩くのは 10 分に 1 回まで）。
- CSV の「運転開始」は、便の §2-5 のとおり画面の欄と同じ文字（`codCellText`）にしたので、cod が空の行は「—」が入る（出力・容量の空は空欄）。表計算で並べ替えるときに「—」が混ざる。空欄にするかは裁定を。
- データで気になった行: `pr-co61878-bess` の名前が「当社初となる系統用蓄電池」（発表文の言い回しで、蓄電所の名前になっていない）。キーワード「jfe」で目に付いた。この便では直していない（§8 のとおり別の便で一次を確かめてから）。
- 都道府県の欄が 47 の名前に当たらない 31 件は「所在地が未記載・確認中」に入る（`prefecture` が空 31 のうち、文字があって県に当たらないものは 0＝`prefecture` が埋まっている 273 件は全部 47 の名前のどれか）。
