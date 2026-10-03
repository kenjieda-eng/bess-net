# N1b 三値化 段1 コード便 報告（2026-10-03・CC）

commit: `d74588b`（コード・一覧・push 1 回）。microCMS への書込 0（GET のみ）。スキーマ変更なし。
「可」の件数は全国 790・エリア別とも不変（停止条件に当たらず）。

## (0) 読んだ絶対パス

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\N1b_三値化_段1_コード便_リポ側の未算定一覧と表示の三値化_書込なし_Claude_Code投入_2026-10-03起草_ユウ.md`
- キュー: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md`
- 裁定: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\02_計画・運営\検証記録_10-02便_ATB2025追随・補助金全角・Ck2c・N1計画_裁定_2026-10-02_ユウ.md`
- 計画便の報告: `reports/n1-tristate-plan-2026-10-02.md`（＋`.data.json`）

## (1) 一覧 `src/data/n1-status.json`

- 件数 391。`as_of` の取得: 2026-10-03 18:33 JST（`generated_at` 2026-10-03T09:33:19Z・microCMS substations を GET 84 回）。
- 一覧の写しは `reports/n1-tristate-stage1-2026-10-03.data.json` の `list`。

### reason 別

| reason | 件数 | 表示 |
|---|---:|---|
| undetermined（「－」「―」「-」） | 262 | 未算定 |
| blank（空欄・名称非公開など） | 16 | 未算定 |
| no_column（N-1 列そのものが無い） | 113 | 公表なし |
| 計 | 391 | |

### エリア別（未算定＝undetermined＋blank）

| エリア | undetermined | blank | 未算定 計 | 公表なし | 計画便の数 |
|---|---:|---:|---:|---:|---|
| 北海道 | 8 | 0 | 8 | 0 | 7＋漏れ 1（hkd-kikan-0230） |
| 東北 | 20 | 0 | 20 | 0 | 20 |
| 東京 | 13 | 0 | 13 | 0 | 13 |
| 北陸 | 212 | 13 | 225 | 0 | 222＋漏れ 3 |
| 関西 | 1 | 2 | 3 | 0 | 2＋漏れ 1（ksi-kikan-bu） |
| 中国 | 6 | 1 | 7 | 0 | 7 |
| 九州 | 2 | 0 | 2 | 0 | 2 |
| 沖縄 | 0 | 0 | 0 | 113 | 113 |
| 中部・四国 | 0 | 0 | 0 | 0 | 中部 0・四国は BS 便 |
| 計 | 262 | 16 | 278 | 113 | 273＋漏れ 5＝278・沖縄 113 |

- 漏れ 5 件はすべて入った: `rkd-toyama-tss0074`（「-」）・`rkd-toyama-tss0075`（「-」）・`rkd-toyama-tss0076`（**空欄**・名称非公開）・`hkd-kikan-0230`（「―」）・`ksi-kikan-bu`（「－」）。
- 前身の 273 件はすべて新しい一覧に入っている（落ちた行 0）。
- 沖縄の no_column は、microCMS の `source_url` でどの公表 CSV 由来かを見て、沖縄電力の CSV 6 本のヘッダで N-1 列の有無を確かめた（N-1 列があるのは `con_res_map01_02.csv` だけ＝38 行。残る 113 行が no_column）。
- 四国は入れていない（BS 便）。

### 表示の区分（ビルド後の静的データ・全国 8,345）

| 区分 | 件数 |
|---|---:|
| 可 | 790（不変） |
| 不可 | 7,164（7,555 → 7,164） |
| 未算定 | 278 |
| 公表なし | 113 |

エリア別の「可」: 北海道 24・東北 100・東京 188・中部 148・北陸 28・関西 141・中国 69・四国 19・九州 69・沖縄 4（計画便 §2 の表と一致・変更前の本番と一致）。

## (2) verify の結果（`npm run verify:grid-fields`）

| 軸 | 内容 | 結果 |
|---|---|---|
| 軸1 | 静的 JSON に `n1_status` がある | PASS（10 エリア） |
| 軸2 | `n1_status` が `toSubstationShape` まで届く | PASS |
| 軸4（FAIL） | 一覧の slug で `n1_eligible === true` | 0 件 |
| 軸5（WARN） | 一覧の `as_of` が `last_updated` と不一致 | 0 件 |
| 軸6（FAIL） | 一覧（as_of 一致分）と静的 `n1_status` の件数・エリア×区分 | 全一致: 中国 未算定 7/7・九州 2/2・北海道 8/8・北陸 225/225・東京 13/13・東北 20/20・沖縄 公表なし 113/113・関西 3/3 |

ほか: `npm run type-check` PASS・`npm run build` EXIT 0（静的 5,576 ページ・prebuild の verify 全部 PASS）。

## (3) 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/data/n1-status.json` | 新設（一覧・真実源） |
| `src/lib/n1-status.ts` | 新設。`n1StatusOf`（true → 可／一覧にあり as_of 一致 → 未算定・公表なし／それ以外 → 不可）・`N1_STATUS_SLUGS`・`n1StatusAsOfMismatch` |
| `src/lib/n1-status-label.ts` | 新設。型 `N1Status`・`n1StatusLabel`・`isN1Ok`・`n1StatusBadgeClass`・`n1StatusFromRow`（クライアントコンポーネントが 130KB の一覧を読み込まないよう、判定とラベルを分けた） |
| `scripts/experimental/_common/build_n1_status.py` | 新設（一覧の生成・GET のみ） |
| `scripts/experimental/_common/n1_status.py` | 新設（Python 側の読み手。規則は TS と同じ） |
| `scripts/experimental/_common/build_n1_undetermined.py`・`n1_undetermined.json` | 残して「後継は n1-status.json」を 1 行ずつ |
| `scripts/precompute-substations.ts` | `n1_status` を書き出す（`n1_eligible` は残す）。summary に `n1_undetermined`・`n1_no_column` |
| `scripts/verify-grid-list-fields.ts` | `n1_status` を軸1・軸2 に。軸4〜6 を追加 |
| `src/lib/grid-static-lists.ts` | 型と `toSubstationShape` に `n1_status` |
| `src/lib/microcms.ts` | `Substation` 型に `n1_status?`。中部マップは二値のままとコメント |
| `src/app/grid/[slug]/AreaPage.tsx` | 空容量プラス TOP20 の N-1 列を 4 値に（stat は不変） |
| `src/components/SubstationsBrowser.tsx` | 一覧の N-1 列を 4 値に（フィルタ「N-1電制可」は可のみ・不変） |
| `src/app/grid/[slug]/page.tsx` | 個別ページ（runtime）を `n1StatusOf` に（可能量は「情報なし」のまま） |
| `src/app/grid/prefecture/[prefecture]/page.tsx`・`src/app/grid/search/page.tsx` | 結果行の付記に「N-1電制 未算定」「N-1電制 公表なし」 |
| `src/app/grid/page.tsx` | カード副題「ノンファーム接続候補」→「N-1電制適用可の割合」（件数ロジック不変） |
| `src/lib/grid-connection-checker.ts`・`src/components/GridConnectionChecker.tsx` | CSV の N-1 列を「YES／NO／未算定／公表なし」に（列名・加点は不変） |
| `src/app/globals.css` | `.grid-badge-muted`（未算定・公表なし。不可と見分けるため破線枠） |

触っていない: `src/app/tracker/grid/page.tsx`・`grid-refresh-log.ts`（既に注記あり）・`scripts/precompute-glossary-detail.ts`（Ck2e）・`src/lib/grid-search-core.ts`（絞り込みは可のみで不変）・各社パーサ。

## (4) 本番の前後

- commit 18:48・push（`d74588b`）→ Vercel 完了 18:56（commit status success）。
- 前: デプロイ前の本番を 18:5x に素URL で取得。後: 18:56〜18:58 に素URL で取得（クエリ無し・キャッシュ回避ヘッダ無し・初期DOM＝script 外・`<!-- -->` 除去）。
- `x-vercel-cache`／`age`（後）: エリア 10 ページ・`/grid`・県 2 ページは `PRERENDER`／`0`。個別ページ 2 件は `MISS`／`0`（on-demand ISR の初回生成）。前の `/grid` は `HIT`／`age 699`（旧デプロイ）。

### 便 §5 の確認項目

| 確認 | 期待（便 §5） | 前 | 後 |
|---|---|---|---|
| `/grid/hokuriku` 空容量プラス TOP20 | 不可 0・未算定 20 | 不可 20 | **未算定 20・不可 0** |
| `/grid/hokuriku` 一覧の初期 20 行 | 未算定 19・不可 1 | 不可 20 | **未算定 20・不可 0**（(5)-1） |
| `/grid/hokuriku` stat「N-1電制適用可」 | 28 不変 | 28 | 28 |
| `/grid/rkd-ishikawa-iss0019` | 未算定 1・不可 0・可能量「情報なし」 | 「不可」・情報なし | **「未算定」**（ページ内 未算定 1・不可 0）・可能量「情報なし」 |
| `/grid/rkd-kikan-hss0014` | 同上 | 「不可」・情報なし | **「未算定」**（未算定 1・不可 0）・可能量「情報なし」 |
| `/grid` カード | 790・「N-1電制適用可の割合」・「ノンファーム接続候補」0 | 790・「9% / ノンファーム接続候補」 | 790・「9% / N-1電制適用可の割合」・「ノンファーム接続候補」0（script 内も 0） |
| `/grid/okinawa` | 「公表なし」が出る | 不可 40 | TOP20 公表なし 20・一覧 公表なし 19／不可 1 |
| `/grid/tokyo` 40 行 | 不変 | — | TOP20・一覧とも前後で行・値が完全一致 |

### エリア別（後・本番 HTML の RSC ペイロードにある全行の `n1_status` を数えた）

| エリア | stat 可（前→後） | 可 | 不可 | 未算定 | 公表なし | 計 |
|---|---|---:|---:|---:|---:|---:|
| 北海道 | 24→24 | 24 | 427 | 8 | 0 | 459 |
| 東北 | 100→100 | 100 | 764 | 20 | 0 | 884 |
| 東京 | 188→188 | 188 | 1,517 | 13 | 0 | 1,718 |
| 中部 | 148→148 | 148 | 959 | 0 | 0 | 1,107 |
| 北陸 | 28→28 | 28 | 21 | 225 | 0 | 274 |
| 関西 | 141→141 | 141 | 1,558 | 3 | 0 | 1,702 |
| 中国 | 69→69 | 69 | 797 | 7 | 0 | 873 |
| 四国 | 19→19 | 19 | 275 | 0 | 0 | 294 |
| 九州 | 69→69 | 69 | 812 | 2 | 0 | 883 |
| 沖縄 | 4→4 | 4 | 34 | 0 | 113 | 151 |
| 計 | 790→790 | 790 | 7,164 | 278 | 113 | 8,345 |

一覧（(1)）のエリア別件数と全エリアで一致。

### 初期DOM で見えている行（10 エリア × TOP20＋一覧 20＝400 行）の前後

- 変わったのは 82 行で、内訳は「不可→未算定」43・「不可→公表なし」39 だけ。「可」の行・「不可」のままの行は前後で同じ。
- エリア別: 北陸 40（TOP20 20・一覧 20）・沖縄 39（TOP20 20・一覧 19）・北海道 1（旭川変電所）・東北 1（1A08）・中国 1（energia_kikan_基S16）。東京・中部・関西・四国・九州は 0。

### 県ページ（付記）

- `/grid/prefecture/石川県`: 98 件中「N-1電制 未算定」89・「N-1電制可」0（石川県の可は 0 件）。
- `/grid/prefecture/沖縄県`: 「N-1電制 公表なし」113・「N-1電制可」4。

確認していないもの: `/grid/search`（ƒ・検索語が要る）と系統連系チェッカーの CSV 出力（ブラウザでの操作が要る）は本番では見ていない。どちらも静的 JSON の `n1_status` を読むだけで、型検査とビルドは通っている。

## (5) ユウの前提違い（逐語）

1. §5「一覧の初期 20 行は「未算定」19・「不可」1」→ **未算定 20・不可 0**。計画便の「40 件中 39 件が未算定」は前身の 273 件で数えた数で、40 件目は漏れ 5 件のひとつ `rkd-toyama-tss0076`（N-1 欄が空欄・名称非公開）。便 §1 で漏れを足し、空欄は「未算定」と決めたので、20 行とも未算定になるのが規則どおり。
2. §1 の表「`undetermined` … 273＋漏れ 5…＝278」「`blank` … 15（北陸 12・関西 2・中国 1）」と、裁定 §2「一覧は 278 件（漏れ 5 件を足す）＋ blank 15 ＋ no_column 113」→ **空欄 15 件は前身の 273 件にもともと含まれていた**（重複して数えている）。実際の内訳は undetermined 262＋blank 16＝278、一覧の総数は 278＋113＝**391**（406 ではない）。blank が 16 なのは、漏れの `rkd-toyama-tss0076` が「－」でなく空欄だったため。
3. §5「北海道 7」→ **8**（7＋漏れ `hkd-kikan-0230`）。北陸「222＋3」・関西「2＋1」は漏れ込みで書かれているが、北海道だけ漏れが足されていない。
4. 裁定 §2「社別ファイルで `src/data/n1-status/` に」→ 便 §2 の「`src/data/n1-status.json`（1 ファイル）」に従った（_QUEUE の読み方 4: 便ファイルを正）。
5. §2「`build_n1_undetermined.py` を `build_n1_status.py` に改め、入力（…東京 2607 のパス直書きは引数に）」→ 改名ではなく**新しいスクリプトを作り、前身は残した**（前身の JSON を残すので、その生成元も残した方が再現できるため）。入力も引数にはしていない: 前身の一覧（273 件）を土台にし、北陸（CSV 全行）・関西・中国は公表 CSV で空欄か「－」かを判定し直し、北海道・関西の新設時の漏れは更新計画＋公表 CSV から足した。東京・東北・九州・北海道（既存 7 件）は前身の一覧のまま（CSV の再確認はしていない）。東京 2607 のパス直書きは前身のスクリプトに残ったまま。

## (6) 申告

- microCMS: GET のみ（一覧の生成で 84 回・報告の確認で数回）。PATCH・POST・DELETE・PUT・スキーマ変更 0。本番照合は bess-net.jp への HTTP GET だけ。
- `src/data/substations/*.json`（県別・index）はローカルのビルドで再生成され作業ツリーで変更ありのまま。**commit していない**（prebuild の生成物で、Vercel のビルドで同じものが作られる。index.json は本便の前から変更ありだった）。
- Python の読み手 `n1_status.py` は、最初は `as_of == last_updated` の完全一致だけで比べていた（TS は日付部分の一致も許す）。commit 前に TS と同じ規則に揃えた。
- 本番照合のスクリプトと前後の写しは scratchpad（`…\scratchpad\n1b\`）: prod_n1b.py・prod_n1b_before.json・prod_n1b_local.json・prod_n1b_after.json。消していない。
- 一時物: Ck2d 便で作った scratchpad の build_n1b.log・build_substations_n1b.log もこの便のビルドログ。

## 段2（案A）への申し送り

- **選択肢名**: `可`／`不可`／`未算定`／`公表なし`（「0MW可」は作らない・可能量 0 の「可」は可能量で表す）。
- **投入件数の見込み**（2026-10-03 時点・凍結除外 8,345 件）: 可 790・不可 7,164・未算定 278・公表なし 113。BS 便で四国の「－」28 行を足すと未算定 306・不可 7,136（四国の可 19 は不変の見込み）。凍結 7 件を含めて全件 PATCH するなら 8,352 件。
- **5 か所同時追加（#118）**: `FETCH_FIELDS`・`LiteSubstation`・`GridListItem`・`toSubstationShape`・`verify-grid-list-fields` の `REQUIRED_FOR_LIST`／`SHAPE_CRITICAL`。今回 `n1_status` で 4 か所はすでに通してあるので、段2 では値の出どころを `n1StatusOf`（一覧）から microCMS のフィールドに替える形になる（関数の呼び出し側は変えずに済む）。
- **canary（#106）**: select を新設したら、まず 1 件だけ PATCH して GET で 4 値すべてが保存されることを確かめてから全件（select は未定義の値を黙って落とす）。
- **一覧の扱い**: 段2 の投入後は `n1-status.json` を「投入の入力」として 1 回使い、その後は microCMS の値を正とする。`as_of` が `last_updated` とずれた行（再取込で更新された行）は一覧を当てない今の規則のまま、各社の再取込で `n1_status` も一緒に書く。
- 停止条件として「可」の件数（全国 790・エリア別）を今回と同じく使える。
