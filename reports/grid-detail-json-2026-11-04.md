# 変電所の詳細をビルド時の JSON から読む便 報告（実行時の microCMS を 0 に・429 で 404 にならない）

実施 2026-11-04 18:25〜19:23 JST。commit `18fabb8`（コードのみ・microCMS の書込 0・IndexNow の決まりは変えていない）。

## (0) 絶対パス

`C:\Users\kenji\Documents\GitHub\bess-net\reports\grid-detail-json-2026-11-04.md`

## 結果（先に）

- **`/grid/[slug]`（変電所の詳細 8,347 枚＋凍結 7 枚＋エリアのページ 9 枚）は、実行時に microCMS を呼ばなくなった。**
  - 本体・関連事業者・近くの案件をビルド時の JSON から読む。関連ニュースは元から JSON。
  - `revalidate` は外した（`false`）。データは毎朝 00:10 JST の再ビルドと push のビルドで入れ替わる。
  - 「1 時間ごとの作り直しで 429 を受けて 404 に置き換わる」経路が無くなった。
- **中身は変わっていない。** 本番（変更前）で保存した 38 枚と、手元のビルドを突き合わせた。本文・題名・description・OG・canonical・JSON-LD とも、**38 枚とも同じ**。
- **ビルド時間**: Vercel で 7 分 22 秒（変更前 7 分 33 秒）＝ **11 秒短い**（+3 分以内）。microCMS からの取得は欄を足した分 16.8 秒→71.3 秒と長くなったが、事前生成の中部 1,082 枚が microCMS を呼ばなくなった分で相殺した。
- **関数の大きさ**: 詳細の JSON は 10 本で計 5.5MB（最大は関西の 1.2MB）。関数に入るファイルの合計は 26.8MB（圧縮の目安 1.8MB）で、上限に大きく余裕がある。**関数のコードに microCMS への接続先は 0 本**。
- **変わったこと 1 つ**: microCMS の id で開く URL（`/grid/a7m1-_9p0n5`・`/grid/o66z7a3i9`）が 200 から 404 になった。slug の URL の重複で（canonical は slug 側）、サイトのどこからもリンクされていない。

## (1) 作り

**取得（ビルド時に 1 回）**: `scripts/precompute-substations.ts`（prebuild の `build:substations`）。

- 一覧用に既に全件を取っている（約 84 回）。その取得の欄に、詳細が使う欄を足した（`src/lib/grid-detail-fields.ts` の `GRID_DETAIL_FIELDS`・35 欄）。取得の回数は変わらない。
- 関連事業者（送配電 10 社の名前を含む事業者・上位 5 件）は、事業者ごとに 1 回で計 10 回。
- 近くの案件の候補（緯度経度のある案件 146 件）は 1 回。
- **取得はすべて、ファイルを書く前に済ませる**。失敗は throw でビルドを止める（黙って空にしない）。

**置き場所と大きさ**（生成物・`src/lib/generated/` は git の外）:

| ファイル | 中身 | 大きさ |
|---|---|---|
| `grid-detail/{hokkaido,tohoku,tokyo,chubu,hokuriku,kansai,chugoku,shikoku,kyushu,okinawa}.json` | slug → 生のレコード（microCMS の形・凍結も含む） | 計 5.5MB・最大 kansai 1.2MB |
| `grid-detail-index.json` | slug → 分け先・事前生成の slug（座標のある 1,082）・関連事業者（10 社）・近くの案件（139 変電所） | 250KB |

**読み方**:

- `src/lib/grid-detail-static.ts` が、slug の分け先の 1 本だけを動的 import で読む。webpack がエリアごとに別のチャンクにする（ビルド出力で確認）。
  - JSON に無い slug は 404 で、これは本当に無いページ。
  - 読み込みに失敗した Promise は持ち続けない。
- 関連事業者は `src/lib/grid-related-operators.ts`（索引だけを読む）。エリアのページ（`AreaPage`・`/grid/tokyo` も）はこちらだけを使うので、詳細の JSON を関数に載せない。
- 近くの案件の選び方は `src/lib/nearby-projects.ts` の `nearbyProjectsFrom` 1 か所にした。ビルド時の計算と、`related-cards.ts` の `getNearbyProjects` の両方が使う。
- 関連ニュースは `src/lib/related-news-substation.ts` へ移した（`related-cards.ts` は microcms.ts を読むので、ページから読まない）。
- 府県・設備区分は、生のレコードを `normalizeSubstationPlace` に 1 回だけ通す（以前と同じ。#119）。
- 詳細のレコードの型は `SubstationDetail = Pick<Substation, GRID_DETAIL_FIELDS>`。ページが一覧に無い欄を読めば tsc で止まる（#118）。

**作り直し**:

- `export const revalidate = false`。事前生成は以前と同じ（エリア 9＋座標のある 1,082）。
- 残りは初めて開かれたときに JSON から作られ、その deploy の間キャッシュされる。microCMS は読まない。

**検査（prebuild に入れた・ビルドで落ちる）**: `npm run verify:grid-detail-static`。

1. `/grid/[slug]` のページと、同じ関数に入る `layout`・`not-found` から読み込み先をたどる。microcms.ts と microcms-js-sdk を値として読み込んでいないことを見る（`import type` は可・`require` も見る）。
2. 詳細の JSON が、一覧の全件（8,347）と凍結（7）を持つ。
3. 府県と主な数値（名前・空容量・運用容量・設備容量・台数・電圧・N-1・公表日・No.・座標）が一覧と同じ。
4. ページの `sub.〇〇` がすべて詳細の欄にある。
5. 関連事業者の表に全社が入り、エリアの 10 社とも 0 件でない。近くの案件の表が空でない。
6. 大きさ（1 本 4MB・合計 16MB 以下）。

**壊して落ちることを確かめた**（すべて戻した）:

- ページが `related-cards`（microcms.ts を読む）を読む
- 関連ニュースのモジュールが microcms.ts の値を読む
- 型の行のすぐ後に値の import を置く
- `require('./microcms')` を足す
- 欄の一覧から `cap_avail_upper_mw` を外す

**レビューで直したもの**（読取専用のレビューを別の担当に頼んだ）:

- **既存の検査 2 本の向け先**: `verify:no-301-links` と `verify-nearby-cards` が、近隣カードの除外の配線を `related-cards.ts` の中で探していて、移設で落ちるようになっていた。`nearby-projects.ts` とビルド時の計算に向け直した（どちらも ok）。
- **import の検査の取りこぼし**: from の無い型の行から次の from まで伸びて、値の import を見落とす書き方があった。句の形を限る拾い方にした。
- **取得の順番**: 取得を書き出しより前へ移した。
- **読み込みの失敗**: 失敗した読み込みを持ち続けないようにした。
- **使われなくなった関数を外した**: `getSubstationBySlug`・`getSubstationSlugsWithCoords`・`getRelatedOperatorsForSubstation`、`related-cards.ts` の使われない import 3 つ。
- **案件の座標の取得**: `getAllProjectsWithCoords` が途中まで取れた分を返す作りは残した。
- **古いコメント**: 5 か所。CLAUDE.md の #127 にも一言足した（変電所の詳細は書込前に開いても旧値が残らなくなった）。

## (2) ビルド時間の前後

| | 変更前（`bess-5d647psbp`・11/4 14:36） | 変更後（`bess-kehpfjvu7`・11/4 19:12） |
|---|---|---|
| Vercel のビルド（開始〜Build Completed） | 7 分 33 秒 | **7 分 22 秒** |
| うち変電所の全件取得（prebuild） | 16.8 秒 | 71.3 秒（取る欄を 22→35 に） |
| 静的ページ | 5,640 枚 | 5,640 枚（事前生成の範囲は同じ） |
| 手元の `npm run build` | — | 222 秒（1 回目 286 秒） |

`vercel ls` の表示はどちらも 8 分。ビルドのログ（`vercel inspect --logs`）の時刻で測った。

## (3) 本番の確認

push 19:12・Vercel success 19:19:39。**確認は 19:20〜19:22、素の URL を 2 回ずつ**（38 枚・変更前の保存と同じ一覧）。

| slug | 種類 | 1 回目 | 2 回目 |
|---|---|---|---|
| `tpg-1712` | 事前生成の外（東京） | 200・MISS・age 0 | 200・HIT・age 51 |
| `thk-kikan-0008-2` | 事前生成の外（東北・基幹） | 200・MISS・age 0 | 200・HIT・age 50 |
| `ksi-kikan-cm` | 事前生成の外（関西・基幹） | 200・MISS・age 0 | 200・HIT・age 50 |
| `kyu-713` | 事前生成の外（九州・同名・電圧つき） | 200・MISS・age 0 | 200・HIT・age 49 |
| `oki-honto-66kv-330001` | 事前生成の外（沖縄） | 200・MISS・age 0 | 200・HIT・age 48 |
| `cb-6126` | 事前生成の内（中部） | 200・PRERENDER・age 0 | 200・HIT・age 47 |

- 38 枚の全体: 1 回目は MISS 33・PRERENDER 5、2 回目は HIT 38。すべて 200。
- **中身は変更前（14:2x〜18:29 に保存した本番）と 38 枚とも同じ**: 本文（`<main>` の文字・`<!-- -->` を剥がす）・title・description・og:title・canonical・JSON-LD。
- 38 枚には、凍結の 4 枚（`tpg-1623`・`egz-kikan-x`・`ksi-kikan-l`・`ksi-local-ea-4`）と、id と slug が違う 2 件（`ydn-kikan-0013-2`・`kyu-884`）、エリアのページ 3 枚（`/grid/kansai`・`/grid/tohoku`・`/grid/chubu`）を含む。
- **Vercel のログ（直近 15 分・本番）**: 5xx 0 件・404 0 件。
- 手元（`next start`）では、無い slug が 404、`/grid/tokyo` が 200、サーバーのエラーは 0。
- id で開く URL（`/grid/a7m1-_9p0n5`・`/grid/o66z7a3i9`）は、変更前の本番が 200・手元の変更後が 404（(5) の申告）。

## (4) ほかの 9 ルートの表と案（コードは変えていない）

どのルートも、取得の関数が失敗すると `null` を返し、ページが `notFound()` にする（鉄則 #100）。事前生成の枚数はビルドの prerender-manifest の数。作り直しで呼ぶ取得は、コードを読んで数えたもの（実測ではない）。

| ルート | 事前生成 | 作り直し | 作り直しで呼ぶ microCMS | 429 で 404 に置き換わるか | webhook |
|---|---:|---|---|---|---|
| `/glossary/[slug]` | 1,534（全件・precompute の索引） | 1 日 | `getGlossaryBySlug` 1 回（関連は precompute） | **はい**（1 日 1 回の作り直しのとき） | あり |
| `/operators/[slug]` | 581（全件・precompute の索引） | 1 日 | `getOperatorBySlug` 1 回（関連は precompute） | **はい** | あり |
| `/news/[slug]` | 1,187（主題ゲートを通るもの） | 10 分 | `getNewsBySlugWithRelations`・`getLinkableTargets`・`getRelatedEntities` | **はい** | あり（11/2 の月次で止めて戻した） |
| `/explainer/[slug]` | 260 | 10 分 | `getExplainerBySlug`・`getGlossaryLiteList`・`getLinkableTargets`・`getRelatedEntities` | **はい** | あり |
| `/lv/invest/[slug]` | 87 | 10 分 | 解説と同じ型 | **はい** | あり（解説記事の API） |
| `/projects/[slug]` | 367 | 10 分 | `getProjectBySlug`・`getLinkableTargets`・`getNearbySubstations`（変電所の座標の全件）・`getRelatedEntities` | **はい** | 要確認 |
| `/subsidies/[slug]` | 77 | 10 分 | `getSubsidyBySlug`（状態の日付の判定は描画のとき） | **はい** | あり |
| `/links/[slug]` | 199 | 10 分 | `getLinkBySlug` | **はい** | 要確認 |
| `/info/[slug]` | 32 | 5 分 | `getNewsBySlug` | **はい** | あり（news の API） |

- 9 ルートとも、ビルド時に全件を作っているので、初回で microCMS に当たるのはビルド後に足された slug だけ。
- **穴は作り直しの方**。10 分〜1 日ごとに作り直すときに 429 を受けると、`notFound()` の結果が revalidate つきでキャッシュされ、表示できていたページが次の作り直しまで 404 になる。
- 直近 1 日のログでは、実在のページの 404 は 0 件（11/4 の 429 と 404 の調べ便）。

**直し方の案（次の便でユウが裁定）**:

| 案 | 中身 | 効き目 | 手間 | 鉄則との関係 |
|---|---|---|---|---|
| A. `revalidate = false`（変電所と同じ） | 書込は webhook でビルドが走る。時刻で変わる表示は毎朝の再ビルドが作り直す | 作り直しが無くなる＝穴が無くなる。事前生成のページは実行時の microCMS 0 | 小（1 行 × 9。webhook の無い API は先に確かめる） | 鉄則 #3 にそろう。#100 は変えない |
| B. 取得の失敗は throw（見つからないときだけ null） | 作り直しで失敗すると前の版が出たまま。初回の失敗は 500 | 404 にならない。負荷は同じ | 中（関数 8 本を「無い」と「失敗」に分ける） | **鉄則 #100 を変える**（500 がアラートに出る） |
| C. 本体も precompute の JSON から読む（変電所と同じ） | 用語集・事業者は関連が既に precompute。本体の欄を足すだけ | 実行時の microCMS 0 | 中〜大（ルートごと。関連の取得が多い news・解説・案件は大きい） | 鉄則 #3・#102 にそろう |

**おすすめは A を先に**。

- webhook のある API（解説記事・用語集・補助金・事業者・news）は、書込のたびにビルドが走るので、10 分〜1 日ごとの作り直しで microCMS を見に行く理由が無い。時刻の表示は毎朝の再ビルドで足りる（11/4 の時刻の確認で、補助金の判定はどれも JST の「今日」を描画のときに出す作り）。
- webhook の有無を確かめる必要があるのは、`projects` と `links` の 2 つ。無ければ、それらは A の前に、書込の便の後に push する運用を決める。
- B は A の後に、ビルドの後に足された slug（初回で microCMS に当たる）の安全網として考える。

## (5) 申告

- **id で開く URL が 404 に**: `/grid/a7m1-_9p0n5`（＝`ydn-kikan-0013-2`）と `/grid/o66z7a3i9`（＝`kyu-884`）。以前は microCMS の id でも引けたので 200 だった（canonical は slug 側）。サイト内・サイトマップには id の URL は無い（grep 0）。
- **IndexNow**: 変電所の詳細を外す決まり（10/31 の裁定 3）は変えていない。道具はそのまま。送るかどうかはこの便の後にユウが裁定。
- **鮮度の扱いが変わった**:
  - 「変電所空き容量DB」には webhook が無い。再取込の PATCH は、以前は詳細ページに最大 1 時間で出たが、今は次のビルド（push か毎朝 00:10）まで出ない。一覧・エリア・県のページは以前から同じ扱いなので、一覧と詳細の食い違い（#116）は無くなる方向。
  - 再取込の便では、本実行の後に push する（今までの手順どおり）。
- **時刻で変わる部分**: お知らせバナー・ヘッダの NEW は、このルートでは毎朝の再ビルドで入れ替わる（以前は 1 時間ごと）。毎朝の再ビルドが止まると古いままになる。
- **関数に JSON が二重に載る**: 詳細の JSON は、チャンクに入る分と元のファイルの両方が関数に入る（約 5.5MB × 2）。上限内なので残した。
- **確かめていないこと**:
  - Vercel のログで「microCMS への問い合わせが出ていない」ことは、CLI のログに外への通信の記録が無いので直接は見られない。代わりの根拠は 3 つ: 関数のコードに microCMS の接続先が 0 本・検査・本番の 2 回目の取得が HIT。
  - deploy 後 30 分の監視と、microCMS の警告メールは私からは見えない。
- **一時物**（消していない・リポジトリの外）:
  - `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\gd`（変更前・後の HTML 38 枚、突き合わせのスクリプト、ビルドのログ、レビューの一時スクリプト）

停止条件に触れた操作なし。microCMS の書込 0。
