# 蓄電所一覧の小さな直し便（2026-11-22）— CSV の 2 点・絞り込んだ結果をすぐ下に・スマホの絞り込みの箱を短く

コードのみ・**microCMS 書込 0**・`src/app/grid/**` は触っていない。`/projects` の title・description・canonical・h1 と、初めの HTML（条件を選んでいないとき）は変えていない。

## (0) 実行の記録

| 項目 | 値 |
|---|---|
| 便 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\蓄電所一覧の小さな直し便_CSVの2点・結果をすぐ下に・スマホの箱を短く_コードのみ_Claude_Code投入_2026-11-22起草_ユウ.md`（6,438 バイト・sha256 `0eefaca4f1bfc3c515eba0bda50333b810e12f3aef4916c4961602eb1ad0a15c`＝`_QUEUE.md` の先頭 16 桁と一致） |
| 開始 | 2026-11-22 12:45 JST・HEAD `03fc101`（133 行の報告の後） |
| `_QUEUE.md` | 134 行（GO: ユウ 11/22 11:41・EDAさん 11:40「３つともOK」・132 行と 133 行が DONE になってから） |
| 直す前の本番の控え | `/projects`（12:45:19・HIT・age 148）351,985 バイト・sha256 `749f54754599faf9006a2d37ec4a882b084205c0d388fc899c701757894e966f`。`/projects?pref=福岡県`（同じ 351,985 バイト）・`/grid/kyu-836`・`/` |
| commit | `5795606`（5 ファイル・push 12:57:47）・報告は別の commit |
| 停止条件 | rm 系 0・push --force 0・.env 表示 0（読み込みのみ）・microCMS 書込 0 |

## (1) 直した所

| 点 | ファイル | 変えたこと |
|---|---|---|
| ① CSV の運転開始 | `src/lib/projects-list.ts` の `buildCsv` | `cod` が空（空の文字列・空白だけ）の行は、運転開始の欄を空欄に。値がある行は今のまま（「2026年8月（予定）」など、画面と同じ文字）。画面の表の「—」は変えていない |
| ② CSV の先頭 3 行 | 同上 | 1〜3 行目（出典・注意・条件）も `csvText()` を通して `"` で囲む。4 行目の見出しと 5 行目からの行は今のまま |
| ③ 結果の表の位置 | `src/app/projects/ProjectsBrowser.tsx` | 条件を選んだときの 1 つの表（`projects-table-flat` の `<section>`）を、`{children}`（最終更新日・注記 2 つ）の前、「表へ移動」の後へ移した。中身は 1 文字も変えていない（移しただけ）。`active` でないときは描かれない＝初めの HTML は変わらない。0 件のときは今のまま |
| ④ スマホの箱 | `src/app/globals.css` の `@media (max-width: 640px)` の中だけ | 便の 3 点（`.projects-filter-grid` を 2 列＋gap 8px・`.projects-field-q` を 2 列ぶち抜き・`.projects-chips` の gap 6px／margin-top 8px・`.projects-chip` の padding 6px 10px／14px）。**便の指定に無い調整を 3 点足した**（下） |
| 検査 | `scripts/verify-projects-list.ts` | (a) 運転開始が空の行の 9 列目が空欄・値がある行は画面と同じ文字／(b) 1〜3 行目が `"` で始まり `"` で終わる／(c) キーワード `a,b"c` でも 3 行目が 1 つの欄／(d) 5 行目からの列が 13／条件なしの 3 行目の比べを囲みに合わせた |

- **④ の追加の調整**（便の指定だけだと、幅 390 の箱の高さが **667px** で、目安の 650px 以下に届かなかった）: 同じ `@media` の中で `.projects-filter` の padding 12px → 10px 12px・`.projects-filter-title` の margin-bottom 12px → 4px・`.projects-field label` の margin-bottom 4px → 2px。これで **648.7px**。入力欄と選ぶ欄の文字 16px・高さ 44px・ボタンの高さ 40px は変えていない。幅 641 以上は変わらない（641 と 1280 で計算済みの値を見て、padding 16px・ボタン 15px・箱の列の幅が前と同じ）。
- commit `5795606` の文の「375 → 648.7px」は誤り（正しくは 667 → 648.7px）。履歴は書き換えていない。

## (2) verify の結果

- type-check ok・build `BUILD EXIT 0`（prebuild の verify は全部 ok）・`/projects` は `○`（静的・ISR 600）。
- `verify:projects-list`: 軸 1・2 ok、`--html .next/server/app` の軸 3 ok（表 4・行 294・見出し 150／49／79／16・初めの HTML に 1 つの表は無い）。
- **足した検査が効くこと**: `src/lib/projects-list.ts` だけを直す前（HEAD）に戻して回すと、**8 件 NG**（条件なしの 3 行目・運転開始が空・値がある行・1〜3 行目の囲み ×3・3 行目が割れる・列の数）で落ちる。戻して ok。
- 手元の `npm run start`（内蔵ブラウザ・幅 390）: 箱の高さ 648.7px・横スクロール 0（scrollWidth 390）・ボタンの高さ 40px 以上・入力欄の文字 16px。`?pref=福岡県` で、1 つの表が結果の行の 17px 下に始まり、注記（最終更新日・注記 2 つ）より前・4 つの表は見えない・19 件。CSV（Downloads に保存せず、ページの中で中身を見た）: ファイル名 `projects-bess-net-20261122.csv`・1〜3 行目が `"` で囲まれている・運転開始の空欄（「—」0 個）・17 件で 17 行。`?q=a,b"c` は 0 件・エラーなし。コンソールとサーバーのエラー 0。

## (3) デプロイ・本番の確認

Vercel: `5795606` success 2026-11-22 13:04:13 JST（push 12:57:47）。素の URL を curl（ブラウザの UA なし・キャッシュ回避ヘッダなし）。

| 時刻 | URL | HTTP | x-vercel-cache | age | バイト |
|---|---|---|---|---|---|
| 13:04:27 | `/projects` | 200 | PRERENDER | 0 | 351,985 |
| 13:04:29 | `/projects?pref=福岡県` | 200 | HIT | 2 | 351,985 |
| 13:04:33 | `/grid/kyu-836` | 200 | MISS | 0 | 72,110 |
| 13:04:36 | `/` | 200 | PRERENDER | 0 | 99,870 |
| 13:04:40 | `/projects` | 200 | HIT | 13 | 351,985 |
| 13:04:42 | `/grid/kyu-836` | 200 | HIT | 8 | 72,110 |

- **`/projects` の初めの HTML**: `<main>` の中が、直す前の本番（12:45:19）と**バイト単位で同じ**（200,438 バイト）。全体のバイト数も同じ 351,985。違うのは `<main>` の外のスクリプトの中の JS ファイル名だけ（例 `app/projects/page-5ed6ae3eae504502.js` → `page-9f038e90fdcb30f5.js`）。title・meta description・canonical・h1 は前と同じ。
- `/projects?pref=福岡県` は `/projects` と**バイト単位で同じ HTML**。
- `/grid/kyu-836` と `/` は、title・meta description・canonical・h1・画面の文字・バイト数が前と同じ。
- IndexNow は送っていない（便 §3-4 のとおり）。
- **ブラウザでの確かめ（絞り込んだときの並び・スマホの高さ・CSV の中身）は、ユウがする**（手元の `npm run start` で見たものは (2)）。

## (4) 申告・一時物・気づき

- 停止条件の操作 0。一時物は scratchpad（`C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\pc1122\` の `before134\`・`after134\`・`cmp_main.py`・`edit_134.py` など）にだけ作った。消していない。
- ④ の追加の余白の調整（上の (1)）は、便の指定に無い。目安の 650px に届かせるためのもので、戻すときは同じ `@media` の 3 つの規則を消せば 667px になる（便の指定どおりの形）。
- commit `5795606` の文に、箱の高さの数字の誤り（「375 → 648.7px」。正しくは 667 → 648.7px）がある。
- 検索便の報告に置いた条件なしの CSV の先頭 8 行（`reports/projects-list-sample-2026-11-21.csv`）は、直す前の形（1〜3 行目が囲まれていない）のまま。書き直していない。
- 133 行の報告（`reports/projects-names-2026-11-22.md`）の気づき 1 の言い回しを 1 か所直した版を、この便の commit に入れた（事実の直し・他の報告の変更なし）。
