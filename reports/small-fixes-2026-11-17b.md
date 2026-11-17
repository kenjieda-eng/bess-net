# 小さな直し便（その 2）— `/tracker/grid` の今日足した行の文言 3 か所（2026-11-17）

コードのみ・microCMS 書込 0。数（件数・減・増）と、ほかの行・過去の行は変えていない。

## (0) 実行の記録

- リポジトリ: `C:\Users\kenji\Documents\GitHub\bess-net`（着手時 HEAD `0fc1b25`・2026-11-17 16:53 JST）
- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\小さな直し便その2_更新タイムラインの文言3か所_関西の例の名前と注記・東京の注記_コードのみ_Claude_Code投入_2026-11-17起草_ユウ.md`
  - 4,363 バイト・最終更新 2026-11-17 13:27 JST・sha256 `d2081efd68f4eef070000e9f7c541926b6c834bd9465831e4d1d78c5ab37bba7`
- `_QUEUE.md` 123 行（GO: ユウ 11/17 16:38・EDAさん 16:37「２OK」）
- 変えたファイル: `src/lib/grid-refresh-log.ts`・`src/app/tracker/grid/page.tsx`（2 ファイル・+10 −7 行）

## (1) 3 か所の前後

### ① 関西（取込 2026-11-05）の「減少の例」

書く前に `reports/grid-kansai-dryrun-2026-11-05.md` の「減った上位 10」の表で電圧を確かめた:
`ksi-kikan-as` 新綾部 基幹 275/77・259 → 161／`ksi-kikan-d-3` 新綾部 基幹 500/275・1,108 → 1,039。

| | 前 | 後 |
|---|---|---|
| データ（`grid-refresh-log.ts`） | `{ name: '新綾部', … from: 259, to: 161 }`／`{ name: '新綾部', … from: 1108, to: 1039 }` | `name: '新綾部（275/77kV）'`／`name: '新綾部（500/275kV）'`（from・to は不変） |
| 見え方 | 新綾部（基幹系統）259 → 161 MW ／ 新綾部（基幹系統）1108 → 1039 MW | 新綾部（275/77kV）（基幹系統）259 → 161 MW ／ 新綾部（500/275kV）（基幹系統）1,108 → 1,039 MW |
| 桁区切り（`page.tsx`） | `{d.from} → {d.to}` | `{d.from.toLocaleString('en-US')} → {d.to.toLocaleString('en-US')}` |
| 部品の key（`page.tsx`） | `key={d.name}`（同じ名前 2 つで重なる） | ``key={`${i}-${d.name}`}``（並びの番号を前に付けて重ならない） |

- 1,000 以上の from・to は全 10 行のうちこの 1 か所だけ（`grep -E "from: [0-9]{4}|to: [0-9]{4}"` で 1 件）。ほかの行の見え方は変わらない。
- 桁区切りは「減少の例」だけに入れた。同じ行の「減った 142 件」等の件数（3 桁まで）と見出しの `total`（すでに `toLocaleString()`）は触っていない。

### ② 関西の注記

- 前: 「…空容量が0以下になった11件を含む（関西の空容量は運用容量と予想潮流から算出しており、算出値が負のものは0と表示。減少の例も表示の値）。N-1電制の未算定3件は…」
- 後: 「…空容量が0以下になった11件を含む。基幹系統とローカル系の一部の空容量は、公表の式（運用容量−予想潮流の絶対値）で当サイトが算出した値で、負になるものは0と表示している。件数は算出値で数え、減少の例は表示の値で選んだ。N-1電制の未算定3件は…」（便の文のまま）
- 書く前に `reports/grid-kansai-dryrun-2026-11-05.md` (7) で文のとおりであることを確かめた（合わない所なし）:
  - 「基幹系統」: more 127 行すべてで空容量の欄は「-」・126 行を算出（1 行 ＢＵ は運用容量・予想潮流とも公表が無く算出できない）。
  - 「ローカル系の一部」: less は直読 1,296・算出 278。
  - 「公表の式（運用容量−予想潮流の絶対値）」: 同社の留意事項(2)「空容量は『運用容量値（MW）』−『予想潮流値（MW）の絶対値』により算定できます」（11/2 版の PDF）。
  - 「件数は算出値で数え」: 減 142（more 38・less 104）・増 55 は算出値（負のまま）の比較。例: 北摂 −318 → −1,176 は表示ではどちらも 0 だが、減った 142 件に入っている（上位 10 の 1 行目）。
  - 「減少の例は表示の値で選んだ」: 11/17 の小さな直し便（`ed45ca9`）で、表示の値（負は 0）で上位 5 件を選んだ（`reports/small-fixes-2026-11-17.md` (3)）。

### ③ 東京（取込 2026-11-02）の注記

- 前: 「N-1電制の未算定18件は「未算定」と表示（山梨の5件を一覧に追加）。出力制御の可能性は…」
- 後: 「N-1電制の未算定18件は「未算定」と表示。出力制御の可能性は…」

### 決まりとの関係

`grid-refresh-log.ts` は「追記のみ・過去分は書き換えない」の決まり。今回は今日（`ed45ca9`）足した行の言い回しの誤りを足した当日に直すもので、冒頭のコメントに 1 行（いつ・何を・なぜ）残した。数（total・decreased・zeroed・increased・changed・added・removed・from・to）は 1 つも変えていない（diff の数の行は新綾部 2 行の name だけが変わった行）。

## (2) 確かめ・本番

- `npx tsc --noEmit` EXIT 0・`npm run build` BUILD EXIT 0（WARN 0）・`verify:grid-fields` PASS（軸 1〜6）・`verify:linkify` PASS（15 ページ clean）。
- built HTML（`.next/server/app/tracker/grid.html`・script を除き `<!-- -->` を剥がした初期 DOM）: 直した 4 つの文がそれぞれ 1 回・「山梨の5件」「1108」「関西の空容量は運用容量と予想潮流から算出」は 0 回。
- commit `531099a`（16:59:55 JST push）→ Vercel の status success 17:08:50 JST（`/build-info.json` の builtAt 17:03:19）。
- 本番 `/tracker/grid`（素の URL・クエリなし）:

  | 時刻（JST） | HTTP | x-vercel-cache | age |
  |---|---|---|---|
  | 16:59:44（push 前・比べる元） | 200 | HIT | 92 |
  | 17:09:01 | 200 | PRERENDER | 0 |
  | 17:09:03 | 200 | HIT | 2 |

  - 「直近の再取込サマリ」の節（初期 DOM の文字・見出しから「関連」の手前まで）を push 前と比べた: push 前の文に便の 4 か所の置き換え（新綾部 2・関西の注記・東京の注記）だけを当てたものと、push 後の文が**完全に一致**（ほかの行・数は 1 字も変わっていない）。
  - 関西の行: 「新綾部（275/77kV）（基幹系統）259 → 161 MW ／ 新綾部（500/275kV）（基幹系統）1,108 → 1,039 MW」・直した注記が 1 回。東京の行: 括弧書きが 0 回。
  - 便の「ほかの行は 11/17 13:2x と同じ」は、ユウの 13:2x の取得物を持っていないので、push 直前（16:59・`ed45ca9` の deploy）の本番と比べた。`ed45ca9` から本便までの間に `grid-refresh-log.ts` を変えた commit は無い。
- 比べた道具: scratchpad の `cmp.py`（下の (4)）。

## (3) IndexNow

- `npx tsx scripts/indexnow-submit.ts --urls reports/small-fixes-2026-11-17b.indexnow-urls.txt`（dry run で 1 件・鍵のファイル 200 一致）→ `--apply --log=reports/small-fixes-2026-11-17b.indexnow.json`: 17:09:24 JST・**HTTP 200（受理）**・1 URL（`https://bess-net.jp/tracker/grid`）。鍵は先頭 4 文字 `605d` だけを書く。

## (4) 申告・一時物

- 停止条件に当たる操作なし（rm 系・push --force・.env の表示・microCMS の書込 いずれも 0）。
- 一時物はすべて scratchpad（リポジトリの外）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\note1117\`（`before.html`・`after1.html`・`after2.html`・各 `.hdr`・`cmp.py`・`build.log`・変更前の 2 ファイルの写し・`indexnow-urls.txt`）。消していない。
- 同じ作業ツリーで、次の便（124 行・BV 九州 dry-run）の下準備として `scripts/experimental/kyushu/fetch_baseline.py`（出力先の引数・`orders=-publishedAt`・id の重複検査）と `scripts/experimental/kyushu/parse_kyushu_2611.py`（10/30 版の写し）を作った。本便の commit には入れていない（124 行の便で扱う）。
- commit は名前を指定して入れた（`src/data/substations/*.json`・`alias-expansion-report.json` は入れていない）。
