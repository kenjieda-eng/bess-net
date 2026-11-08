# 小さな直し便 — 訂正履歴 4 件・市場の欄の名前・凍結の並び・注記行の転送・合計空容量の書き方（2026-11-08・CC）

- 便: `03_5月13日朝_実行/小さな直し便_訂正履歴4件・市場の欄の名前・凍結の並び・注記行の301・合計空容量の書き方_コードのみ_Claude_Code投入_2026-11-08起草_ユウ.md`（`_QUEUE.md` 101 行目）
- 読んだ記録: `02_計画・運営/検証記録_projects便段2_2026-11-08_ユウ.md`（裁定 1・2）・`02_計画・運営/検証記録_小さな直し便11-07・projects段1_裁定_2026-11-07_ユウ.md`（A の「CC の申告への裁定」4）
- commit: `2187a91`（コード・データ）・報告の commit は本ファイル。**microCMS の書込 0**（prebuild の GET だけ）。

**結論**: 5 つとも本番で確かめた。訂正履歴 490 → 494（4 件とも `/corrections` と各ページの記事末に出る）。projects の詳細の市場の欄は、稼働中でない 38 件（ローカルのビルドの数）が「参加予定の市場」に、稼働中は「市場参加」のまま。凍結は詳細の並びに 0（表示の変化 0）。`/grid/egz-kikan-x` は 308 で `/grid/chugoku` へ（凍結のページ 9 → 8・データは残した）。県のページの合計空容量は「6,130」の形（エリアのページのサマリ統計もそろえた）。IndexNow は `/corrections` の 1 URL を 1 回送って HTTP 200。

## (0) 絶対パス

- この報告: `C:\Users\kenji\Documents\GitHub\bess-net\reports\small-fixes-2026-11-08.md`（＋ `small-fixes-2026-11-08.indexnow-urls.txt`・`small-fixes-2026-11-08.indexnow.json`・`small-fixes-2026-11-08.prod.json`）
- 読んだ `_QUEUE.md`: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md`（101 行目）

## (1) 訂正履歴の 4 件（`src/data/corrections.json`・490 → 494 件）

- 形は今の記録と同じ（id・date・kind「訂正」・path・record・targetTitle・before・after・basis・internalRef）。date は本番に出た日の 2026-11-08、id はその日の通し番号。
- before は段 2 の書込の前の値（`reports/projects-write-2026-11-08.json` の op の old）から書いた。targetTitle は今の h1。
- basis の資料名は一次の `<title>` を 11/8 に取り直して逐語（4 本とも配信後の改訂なし＝更新日時が段 2 の台帳と同じ）。

| id | path | before | after | basis |
|---|---|---|---|---|
| 20261108-01 | `/projects/nc-shunan-yuno` | 出典の欄に、別の蓄電所（福島県白河市の「NC白河市表郷番沢蓄電所」）の受電開始のリリースを挙げていた | 出典を、この蓄電所の受電開始のリリース（日本蓄電池株式会社・2026年4月23日）に直しました | 【日本蓄電池株式会社】山口県周南市にて系統用蓄電施設「NC周南市湯野蓄電所」受電開始（`000000059.000161802`） |
| 20261108-02 | `/projects/nc-ibigawa` | 「運転開始予定 2026年10月（予定）」と表示 | 運転開始予定の欄を外しました（一次の「2026年10月」は受電開始の見込みで、運転開始の時期ではないため）。／受電開始の見込みは、2026年11月5日の発表にある「2026年12月」を本文に書きました | 【日本蓄電池との共同プロジェクト】鹿児島県枕崎市で約2MW系統用蓄電所が受電開始（`000000232.000033609`） |
| 20261108-03 | `/projects/nc-nagano-city` | 同上 | 同上（「2027年3月」） | 同上 |
| 20261108-04 | `/projects/daiwa-kurate` | 市場参加を「JEPX / 需給調整市場」と表示／本文に、一次に無い評価の語（「代表例」「象徴します」「想定され」）があった | 市場参加の欄を外しました（どの一次にも参加する市場の記載が無いため）／本文を、一次の記載だけで書き直しました | 大和ハウス工業の系統蓄電所に蓄電システムを納入（`000000270.000109041`） |

- 「／」は画面では箇条の改行（before・after の `\n`）。
- 足していないもの（裁定どおり）: 三川町の出力・海南の受電の見込み・稼働中への更新。
- verify:corrections（prebuild）: ok（検査 14,589 件・記録 494 件〔訂正 403・表示の停止 90・表示の再開 1〕・社内の語 0・internalRef の報告は実在）。

## (2) 市場の欄の名前

- 決まり（裁定 1）: 稼働中は実績の市場だけ／計画中・建設中は、一次がその蓄電所について名指しする予定の市場も入れてよい。欄の名前をこれに合わせた。
- 判定: `src/lib/projects-cod.ts` に `marketLabel(p)` を足した。中身は `codLabel` と同じ `isCodRealized`（status＝稼働中）だけで、新しい判定は作っていない。
  - 稼働中 → 「**市場参加**」。それ以外（建設中・計画中・その他・空） → 「**参加予定の市場**」。
- 変えた所の一覧:

| 所 | 前 | 後 |
|---|---|---|
| `src/app/projects/[slug]/page.tsx`（詳細の dl） | `<dt>市場参加</dt>`（状態を問わず） | `<dt>{marketLabel(item)}</dt>` |

- 見て、変えなかった所（市場の欄の「名前」を出していない）:
  - `/projects`（一覧）: 市場の列が無い（description の「市場参加形態」は DB の説明文で、欄の名前ではない）。
  - `/tracker/pf`: `marketParticipation` を値のバッジ（「需給調整市場」など）として出すだけで、欄の名前が無い。値は変えない決まりなので触っていない。
  - 詳細の JSON-LD: 市場の項目が無い。
  - 事業者のページ・比べるページ: projects の市場を出している所が無い（`marketParticipation` を読むのは上の 2 ファイルと `microcms.ts` の型だけ）。
- データ（microCMS）は変えていない。
- verify を足した: `scripts/verify-projects-labels.ts`（`npm run verify:projects-labels`・prebuild に入れた）。
  - 軸1（関数）: status の 8 つの形（配列・文字列・空配列・null・undefined・その他）で、`marketLabel` と `codLabel` が同じ判定で分かれる。
  - 軸2（ソース）: 詳細の欄が `marketLabel(item)`／`codLabel(item)` を通る。`src` に欄の名前の直書き（`<dt>市場参加</dt>`・文字列の「参加予定の市場」）が無い。
    - 故障を入れて確かめた: page.tsx を `<dt>市場参加</dt>` に戻した写しを一時的に置くと NG 2 件で落ちた（元に戻して `cmp` で同一を確認）。
  - 軸3（`--html .next/server/app`・ビルドの後に手で回す）: ローカルのビルドの詳細 367 件で ok（「市場参加」51 件・「参加予定の市場」38 件・食い違い 0）。
    - ★ただしローカルのビルドの projects の詳細は、ローカルの fetch のキャッシュ（`.next/cache/fetch-cache`）の**段 2 の書込の前のデータ**で描かれていた（湯野が「運転開始予定」・鞍手が建設中・新規 33 件が無い）。欄の名前とバッジの組み合わせの検査としては有効だが、今のデータでの確認は本番で行った（(4)）。

## (3) 変電所の 3 つの直し

### (a) `pref_top`・`area_top` から凍結を外した

- `scripts/precompute-substations.ts` の 2 つのループで、凍結（`FROZEN_SUBSTATION_SLUGS`＝`isNoindexSubstation` の凍結の側が読むのと同じ `src/data/substations-frozen.json`）を飛ばす。
- 前後の比較: 11/7 のビルドの `index.json` と今回のビルドの `index.json` で、`pref_top`（48 キー・unknown を含む）・`area_top`（10 エリア）とも**差分 0**。上位 8 件に凍結が入っていなかったので、表示は変わらない（11/7 の気づきのとおり）。
- verify（verify:grid-pages に足した）: `pref_top`・`area_top` の凍結の slug が 0 → ok（0 件）。

### (b) `egz-kikan-x` を `/grid/chugoku` への恒久の転送に

- 仕組みは 11/5 の id の URL と同じ `next.config.js` の `redirects`（`permanent: true`）。
- 転送先は `src/data/substations-frozen.json` の `egz-kikan-x` に足した `redirectTo: "/grid/chugoku"`（＋`redirectDecidedOn`・`redirectReason`）。`next.config.js` がこの欄から転送を作る（定義は JSON の 1 か所・#119。TS・Python と同じファイル）。
- データは消していない: 凍結のまま（件数・一覧・検索・TOP20・IndexNow から今までどおり外れる）。microCMS のレコードもビルドの JSON（grid-detail）の行もそのまま。
- `src/lib/substations-frozen.ts`: `FROZEN_REDIRECTS`（slug → 転送先）と `FROZEN_PAGE_SLUGS`（開ける凍結＝凍結 − 転送）を足した。`FROZEN_SUBSTATION_SLUGS`（凍結の全件）は今までどおり 9 件。
- precompute の `frozen_by_area`（同名の判定に使う凍結の行）は `FROZEN_PAGE_SLUGS` だけにした → **凍結のページ 9 → 8**。
  - `egz-kikan-x` の同名の判定のキーは「(名称非公開) energia_kikan_【留意事項】」で、中国に同じキーは無い＝外しても、ほかのページの題名・h1 は変わらない。
- verify（verify:grid-pages）: 凍結の行 8 件＝凍結のページ 8 件・凍結のページ＋転送＝凍結の全件・転送先はエリアのページ・転送した slug は凍結の行／一覧に無い・`next.config.js` の `redirects()` を評価して「/grid/egz-kikan-x → /grid/chugoku（permanent）」がちょうど 1 本。
  - ビルド前（11/7 の生成物のまま）に回すと「egz-kikan-x が凍結の行に入っている」で NG 3 件になり、precompute のあとは ok（検査が古い生成物を見分けた）。
- IndexNow: 送らない（`NO_SUBMIT_SLUGS` は `FROZEN_SUBSTATION_SLUGS` を含む＝今のまま）。サイトマップ: 今までどおり入らない。
- 中国エリアのページ（`/grid/chugoku`）から `egz-kikan-x` へのリンクは前から 0（凍結は一覧に出ない）＝転送の URL を指す内部リンクは無い。

### (c) 県のページの「合計空容量」の書き方

- `src/lib/grid-avail.ts` に `formatStatNumber(v)` を足した: 小数 1 桁で丸め、`toLocaleString('ja-JP', { maximumFractionDigits: 1 })`。桁区切りを付け、整数なら小数を付けない（6130 → 「6,130」・780.5 → 「780.5」）。値は変えない（表示だけ）。
- 県のページ（`src/app/grid/prefecture/[prefecture]/page.tsx`）の「サマリ統計」4 枚と、同じ部品のエリアのページ（`src/app/grid/[slug]/AreaPage.tsx`）の「サマリ統計」4 枚を、この関数にそろえた。
  - 県のページ: 合計空容量 `totalCap.toFixed(1)`（「6130.0」）→ `formatStatNumber`。件数 3 枚（変電所件数・空容量プラス・N-1）も同じ関数（今は全県 1,000 未満なので見た目は変わらない）。
  - エリアのページ: 変電所数（「1701」）・空容量プラス・N-1・平均空容量（今の `fmt`＝整数なら整数・小数は 1 桁）を同じ関数に。
- 見た目が変わるもの（本番の前の値 → 後の値・(4) で確かめる）: 合計空容量 兵庫県 6130.0 → 6,130・愛知県 12920.0 → 12,920・北海道 3110.0 → 3,110・和歌山県 780.0 → 780。エリアの変電所数 関西 1701 → 1,701・東京 1718 → 1,718、空容量プラス 関西 1552 → 1,552・東京 1306 → 1,306。平均空容量 関西 48.0 → 48（小数 1 桁で丸めて整数になるもの）。

## (4) 本番の確認

- deploy: commit `2187a91` を 23:25 に push → Vercel success **23:32:10**（`commits/2187a91/status`）。microCMS の書込は無いので、ビルドはこの push の 1 本。
- 確かめ方: 本番の素の URL（クエリ無し・キャッシュ回避のヘッダ無し）を 23:32:30 に取った（`small-fixes-2026-11-08.prod.json`）。前の状態は deploy の前（23:19〜23:21）に同じ道具で取った。初期 DOM の `<!-- -->` は剥がして読んだ。

| URL | HTTP・x-vercel-cache・age | 結果 |
|---|---|---|
| `/corrections` | 200・PRERENDER・0 | 記録 494 件（前 490）。20261108-01〜04 の 4 件が出ていて、題名・直す前・直した後・一次の資料名がデータどおり |
| `/projects/nc-shunan-yuno`（稼働中） | 200・PRERENDER・0 | 欄「**市場参加** 需給調整市場」のまま。記事末に「訂正履歴」20261108-01 |
| `/projects/gec-fukuchiyama-haji-bess`（土師・稼働中） | 200・PRERENDER・0 | 欄「**市場参加** JEPX」のまま |
| `/projects/fantasista-nagahama-pss`（建設中） | 200・PRERENDER・0 | 「市場参加 需給調整市場」→「**参加予定の市場** 需給調整市場」 |
| `/projects/hexa-oyabe-bess`（計画中） | 200・PRERENDER・0 | 「市場参加 長期脱炭素」→「**参加予定の市場** 長期脱炭素」 |
| `/projects/remixpoint-ena-iwamura-3-bess`（計画中） | 200・PRERENDER・0 | 「市場参加 需給調整市場」→「**参加予定の市場** 需給調整市場」 |
| `/projects/nc-ibigawa`・`/projects/nc-nagano-city`（建設中） | 200・PRERENDER・0 | 欄は変わらず（市場の欄なし）。記事末に「訂正履歴」20261108-02・03 |
| `/projects/daiwa-kurate`（稼働中） | 200・PRERENDER・0 | 欄は変わらず（市場の欄なし）。記事末に「訂正履歴」20261108-04（直す前 2 項・直した後 2 項・一次） |
| `/grid/egz-kikan-x` | **308**・Location `/grid/chugoku` | たどると `/grid/chugoku` が 200（転送 1 回）。前は 200・noindex のページだった |
| `/grid/chugoku`・`/grid/kansai`・`/grid/tokyo`・`/grid/chubu` | 200・PRERENDER・0 | `egz-kikan-x` へのリンク 0。サマリ統計: 関西 1,701／1,552／140／48・東京 1,718／1,306／188／16.9・中部 1,107／864／148／29.4・中国 873／599／69／9.2（前: 関西 1701／1552／140／48.0・東京 1718／1306／188／16.9） |
| `/grid/prefecture/兵庫県` | 200・PRERENDER・0 | 合計空容量 6130.0 → **6,130**（件数 452／396／23 は不変） |
| `/grid/prefecture/愛知県` | 200・PRERENDER・0 | 12920.0 → **12,920** |
| `/grid/prefecture/北海道`・`和歌山県` | 200・PRERENDER・0 | 3110.0 → **3,110**・780.0 → **780** |
| `/grid/ksi-local-ca-9`（対照） | 200・MISS・0・index | 「兵庫県の他の変電所（空容量の大きい順）」の見出しとリンクが deploy の前と同じ |
| `/grid/egz-kikan-s0016`・`/grid/tpg-1623`（凍結と名称非公開の対照） | 200・MISS・0・noindex | 「中国エリアで空容量の大きい変電所」「静岡県の他の変電所」の並びが前と同じ。湯船（凍結のページ）は今までどおり開ける |

- **判定**: 便の確認点はすべて期待どおり。値の変化は無い（表示の名前と書き方だけ）。
- 変電所の詳細の `MISS` は、詳細がビルドの JSON から初回アクセスで作られる（`dynamicParams`・11/4〜）ため。実行時の microCMS は 0 のまま。

## (5) IndexNow

- 便のとおり `/corrections` の 1 URL だけ（`small-fixes-2026-11-08.indexnow-urls.txt`）。ほかは見た目の変更なので送っていない。
- dry run（送る URL 1 件・変電所の詳細 0・noindex 0・鍵 605d…・本番の鍵のファイル HTTP 200 で中身一致）→ 本番の確認のあと `--apply` を 1 回。
- 応答: **HTTP 200（受理）**・2026-11-08T14:33:39.241Z（JST 23:33:39）・本文は空（`small-fixes-2026-11-08.indexnow.json`）。

## (6) 申告

1. **「301」と書かれた転送は 308 になる**: 便の「11/5 の id の URL と同じ仕組み」（`next.config.js` の `permanent: true`）は、Next.js では 308（恒久の転送）を返す。11/5 の 3 件と同じ。検索エンジンの扱いは 301 と同じ（恒久）。301 そのものが要るなら `statusCode: 301` に変えられる（11/5 の 3 件もそろえるかは要判断）。
2. **転送は 1 行の直書きでなく、凍結の JSON の欄から作った**: 11/5 の 3 件は `next.config.js` に 1 行ずつ書いている。今回は「凍結であること」と「転送先」を同じ `substations-frozen.json` に置き、`next.config.js` はそれを読んで作る（定義を 1 か所に・#119）。verify:grid-pages が `redirects()` を評価して 1 本あることを確かめる。
3. **合計空容量のほか、同じ「サマリ統計」の数も書き方をそろえた**: 便は「同じ部品のほかのページに同じ書き方があれば、そろえる」。エリアのページの変電所数（「1701」）・空容量プラス（「1552」）も桁区切りが無かったので、同じ関数を通した。平均空容量は「48.0」→「48」のように、丸めて整数になるものの「.0」が消える。値は変えていない。
4. **資料名の台帳に 2 件を足した**（429 → 431・追記だけ）: 湯野の受電のリリース（`000000059.000161802`）と需給調整市場のリリース（`000000110.000161802`）。どちらも段 2 で湯野の本文の出典に挙げたのに、段 2 で台帳に足していなかった（段 2 の私の漏れ）。059 は今回の訂正履歴の basis にも使う。11/8 に Chrome の UA で取り直し、title を逐語で写した。verify:source-names（src）ok。
5. **訂正履歴の targetTitle は今の h1**: 鞍手は書込の前の名前（「福岡鞍手系統用蓄電所（大和ハウス工業）」）ではなく、今の「DREAM Storage Battery 福岡鞍手系統用蓄電所」にした（記録が付くページの今の題名）。
6. **揖斐川・長野の basis は 11/5 の発表 1 本だけ**: 便の表のとおり。前の「2026年10月」がどの一次の受電見込みだったか（段 1 の前の本文「受電開始は2026年10月見込み。」の元）は、basis に足していない。
7. **新しい verify を prebuild に入れた**: `verify:projects-labels`（軸1・軸2）。軸3（ビルドの HTML）は prebuild では見られない（ビルドの前に走る）ので、ビルドの後に手で回した。
8. **故障の注入で repo のファイルを一時的に置き換えた**: page.tsx の写しを scratchpad に取り、直書きに戻した写しを置いて verify を回し、元の写しを戻して `cmp` で同一を確かめた（消したファイルは無い）。
9. **一時物**（消していない・どれも scratchpad）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\sf8\` の下（`add_corrections.py`・`add_ledger.py`・`prod_check.py`・`prod_before.json`・`prod_after.json`・`tops_before.json`・`tops_diff.txt`・`build.log`・`page.orig.tsx`・`page.inject.tsx`・`primary\`〔一次 5 本の HTML と title〕ほか）。
10. **30 分の監視**（23:32〜00:02）: microCMS の警告メールと Vercel のエラー率は私からは見えない（EDAさんにお願いしたい）。この便は microCMS へ書かず、ビルドはコードの push の 1 本。報告の push でもう 1 本走る（`reports/` だけ・前の便と同じ扱い）。
11. **ローカルのビルドの projects の詳細は古いデータだった**: ローカルの fetch のキャッシュ（`.next/cache/fetch-cache`）が段 2 の書込の前の応答を返し、湯野が「運転開始予定」・鞍手が建設中・新規 33 件が無い形で描かれた（10/5 の「WARN getAllNews 重複除去」と同じ、ローカルのキャッシュの現象・本番には無関係）。欄の名前の判定の検査は有効だったが、今のデータでの確認は本番の素の URL で行った（(4) で 8 ページとも今の状態と欄の名前が合う）。
