# BW 関西 本実行便 — 関西電力送配電の予想潮流を 11/2 の版に更新した（2026-11-05・CC）

## (0) 絶対パス・読んだもの

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\BW_関西_本実行便_予想潮流を11月2日版に更新_裁定どおり_Claude_Code投入_2026-11-05起草_ユウ.md`
  - 5,915 バイト・sha256 `900b004f5c4e20d8b3c64a82c461751ed035a70cc0ba1b4c4365e1855e170890`
- 裁定: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\02_計画・運営\検証記録_小さな直し便・BW関西dry-run_裁定_2026-11-05_ユウ.md` の「2 本目」裁定 1〜6
  - 9,274 バイト・sha256 `cb508fb2bb6d01889c6f3b59954728750dfd2441c621f5fea692bffd5139a7f5`
- GO: `_QUEUE.md` 94 行目（ユウ 11/05 19:0x・EDAさん「進めて下さい GOです」）
- 報告: `C:\Users\kenji\Documents\GitHub\bess-net\reports\grid-kansai-2026-11-05.md`（本書）
- 書込の記録: `C:\Users\kenji\Documents\GitHub\bess-net\reports\grid-kansai-2026-11-05.apply.json`・`.apply.jsonl`
- 計画: `C:\Users\kenji\Documents\GitHub\bess-net\scripts\experimental\kansai\update_plan_202611.json`
- 解析: `C:\Users\kenji\Documents\GitHub\bess-net\scripts\experimental\kansai\parse_kansai_csv_2611.py`（`--emit-plan`・`--baseline`・`--out-json`・`--n1-out`・`--fetched-on` を足した）
- baseline: `C:\Users\kenji\Documents\GitHub\bess-net\scripts\experimental\kansai\baseline_live_2611b.json`（11/5 18:54 の GET）
- **書込**: microCMS「変電所空き容量DB」の関西の PATCH 1,700＋POST 1 だけ（19:11:07〜20:04:46）。DELETE・PUT は 0。この API に webhook は無い。
- commit: `f4edf00`（20:14 push・Vercel success 20:23:07）

## 結論

- 関西 1,702 件を 2026年11月02日更新版にした。
  - 凍結 2 件を除く 1,700 件を PATCH し、新規 1 件を POST した。
  - 失敗 0・再送 0・GET 全件照合 不一致 0。
- 本番の `/grid/kansai` は「公表 2026/11/02 時点（当サイト取込 2026/11/05）」・1,701 件。全国は 8,347 → 8,346 件。
- 裁定 1〜6 はすべてそのとおりに当てた。想定の外（ほかの名前の変化・電圧面の変化など）は 0。
- 便に無い追加が 1 点ある: 新規の 1 件は id が slug と違う（`7c1n48509wi9`）ので、`next.config.js` の転送と CLAUDE.md #113 に足した（#113 の決まりのとおり）。

## (1) 版の確認（11/5 18:52・curl・書込の前）

- 公表ページ `https://www.kansai-td.co.jp/consignment/disclosure/distribution-equipment/index.html`: HTTP 200・67,641 B。
  - 「154kV以上変圧器空容量一覧［13,832B］」→ `/interchange/takusou/pdf/154kv_more_trans.csv`
  - 「154kV未満変圧器空容量一覧［161,591B］」→ `/interchange/takusou/pdf/154kv_less_trans.csv`
  - 11/5 の dry run と同じ href・同じサイズ表示。
- CSV 3 本（more・less・fence）を取り直した。
  - どれも HTTP 200 で、Last-Modified は 11/5 の dry run と同じ（2026-11-04 16:08 GMT）。
  - **3 本とも、11/5 の dry run で取ってリポジトリに置いた `src_2611/` と sha256 が一致した。**
  - 1 行目はどれも「2026年11月02日更新」（strict で utf-8-sig NG → cp932）。
- **11/02 より新しい版は出ていない** → 書込に進んだ。版の日付は全レコード 2026-11-02（#121・版は割れていない）。

## (2) 計画と 11/5 の dry run との差

- baseline: 11/5 18:54 の GET（`shikoku/fetch_baseline.py ksi-`・`orders=-publishedAt`・id の重複除去）。
  - 1,707 件（totalCount 一致・重複 0）。凍結 5 件を除いて 1,702。
  - 11/5 18:12 の GET（dry run の baseline）と、レコードの中身まで差 0。
- 計画は `parse_kansai_csv_2611.py --emit-plan` で作った。
  - 11/5 の dry run の記録（`reports/grid-kansai-dryrun-2026-11-05.json`・`_common/n1_undetermined_kansai_2611.json`）は上書きしていない（出力は scratchpad）。
  - 裁定の想定（名前 3・振り直し 2・消滅 2・新規 1・電圧面の変化 0・曖昧 0）と違えば、計画を作らずに止める作りにした。

**差は 0**:

| 項目 | 計画 | 11/5 の dry run |
|---|---:|---:|
| PATCH（突合した組） | 1,700 | 1,700 |
| うち値の変化 | 274 | 274 |
| うち名前だけ | 3 | 3（名称の変化） |
| うち日付だけ | 1,423 | 1,423（値が変わらない 1,426 − 名前 3） |
| POST | 1（`ksi-local-gc-5`） | 新規 1 |
| 凍結（書込なし） | 2 | 消滅 2 |
| 空容量（当該）の減（ゼロ以下）・増 | 142（11）・55 | 142（11）・55 |
| 未算定で現値維持（N-1・出力制御） | 3・17 | 3・17 |
| N-1 可（取込後・凍結を除く） | 140 | — |

- 列ごとの変化: 空容量（当該）197・空容量（上位系等）197・予想潮流 104・出力制御の可能性 24・N-1 量 21・運用容量 6・設備容量 6・名前 3・external_id 2。
  - N-1 可否・運用容量制約要因・台数・電圧・notes・prefecture は 1 件も書かない。
- **計画の機械検査**（scratchpad の `check_plan.py`）: NG 0。
  - 件数と列ごとの変化が 11/5 の JSON と一致。空容量の増減の全 197 行も一致。
  - name を変えるのは裁定の 3 件だけ。external_id を変えるのは新大岩の 2 件だけ。
  - last_updated は全件 2026-11-02、fetched_at は全件 2026-11-05。
  - before は実行時の baseline と同じ。id は baseline の id（#113）。
  - 新規の slug は全国の slug・凍結と衝突しない。
  - **パーサーを通さず CSV を直接読み、計画を当てた後の値（1,700 件・数値 7 欄と名前・9,040 値）が CSV と一致**することを確かめた。日付だけの 1,423 件も含む。
  - 故障注入: 計画の値を 1 つ書き換えた写しで、検査が落ちることを確かめた。
- applier の dry run（18:57:58〜19:10:44）: dry 1,700・post_dry 1・skip_changed 0・failed 0・GET 1,701・再送 0。

## (3) 名前の 3 件・振り直し 2 件・凍結 2 件・新規 1 件

**名前の 3 件（裁定 1）**: 新しい版の名前に直した。値は 3 件とも変わらず、日付だけ更新した。

| slug | 前の名前 | 新しい名前 | 本番の題名（20:23） |
|---|---|---|---|
| `ksi-kikan-m` | 西京都 | 西京都（154） | 西京都変電所（154）の系統空き容量・蓄電池連系条件 |
| `ksi-local-ef-8` | 有馬6 | 有馬 | 有馬変電所（77/6.6kV）の系統空き容量・蓄電池連系条件 |
| `ksi-local-ef-9` | 有馬22 | 有馬 | 有馬変電所（77/22kV）の系統空き容量・蓄電池連系条件 |

- 有馬の 2 件は同名の組になり、電圧が添えられて分かれた（11/2 の作り）。
- 西京都（154）は「（154）」を名前の後ろに残す部分として扱い、「西京都変電所（154）」になった。
  - 「西京都」の同名の組は 3 件から 2 件（Ｆ 500/275・ＢＡ 275/77）になった。この 2 件の題名は変わらない（本番 20:26: `ksi-kikan-f-2`「西京都変電所（500/275kV）」・`ksi-kikan-ba`「西京都変電所（275/77kV）」）。
  - 題名の重なりは 0（`verify:grid-pages`）。

**No. の振り直し 2 件（裁定 2）**: `ksi-local-gl-2`（77/6.6）・`ksi-local-gl-3`（77/22）新大岩。
- slug を保ち、external_id を `kansai_local_北GL` → `kansai_local_北GO` にした。
- `scripts/experimental/_common/external_id_history.json` に 2 件足した（根拠は名称・電圧面・設備容量・運用容量・台数の 5 項目一致）。
- 本番の題名は「新大岩変電所（77/6.6kV）」など、前と同じ。

**凍結 2 件（裁定 3）**: DELETE せず、`src/data/substations-frozen.json` に足した。microCMS は書いていない（2026-08-17 の値のまま）。301 はしない。
- `ksi-local-cq-6` 須磨 77/33（同じ No.・名前の 77/6.6 の行 `ksi-local-cq-5` は掲載あり・更新した）。
- `ksi-local-fx` 間谷 22/6.6。
- 詳細の注記は 8/19 の凍結 5 件と同じ形: 「この設備は関西電力送配電の2026年11月2日更新版の公表データに掲載がないため、更新を停止しています（2026年8月17日公表時点の値のまま）。…」
- 一覧・件数から外れるので、関西は 1,702 → 1,701 件。
- 凍結は 7 → 9 件（全国）。
- 須磨 77/33 は N-1 可だったので、全国の N-1 可は 790 → 789 になった。

**新規 1 件（裁定 3）**: 南GC 咲洲２（22/6.6）を POST した。
- slug は `ksi-local-gc-5`。8/19 と同じ採番: 頭の字を外した「gc」→ `ksi-local-gc`〜`-gc-4` が使用済みなので `-5`。
- id は `7c1n48509wi9`（POST の自動採番）。
- 中身は 20 欄で、POST 後の GET で全欄一致・slug 1 件:
  - 1 台・設備容量 5・運用容量 5・空容量 5（直読）
  - N-1 は CSV「不可 ＃２」→ false
  - prefecture は「関西ローカル系」
  - 運用容量制約要因と出力制御の可能性は CSV が空欄なので入れていない
  - notes は入れていない
- 本番の題名は「**咲洲２**の系統空き容量・蓄電池連系条件」で、「変電所」は付いていない。11/2 の名前便の規則（名前の末尾の数字の意味が分からないものは足さない）のまま。
- **id ≠ slug**: 関西の 1,708 件で、id と slug が違うのはこの 1 件だけ（全国では 3 件目）。
  - CLAUDE.md #113 の「増えたら、ここにも足す」のとおり、`next.config.js` に `/grid/7c1n48509wi9` → `/grid/ksi-local-gc-5`（permanent）を足した。
  - CLAUDE.md #113 の件数も 3 件に直した。

**そのほか裁定どおり**: notes は書いていない（裁定 5）。算出の作りは変えていない（裁定 6）。例: 東大阪 275/154 は空容量 −130 MW と表示。

## (4) 書込と照合

```
本実行（19:11:07〜20:04:46・逐次 400ms・並列なし・reports/grid-kansai-2026-11-05.apply.json／.jsonl）
  POST ksi-local-gc-5 → id=7c1n48509wi9（全 20 field 一致・slug 1 件）
[done] {"patched":1700,"dry":0,"skip_done":0,"skip_changed":0,"failed":0,"posted":1,"post_dry":0,"post_skip":0}
[microCMS 呼び出し（HTTP 送信・再送込み）] GET 3404・PATCH 1700・POST 1・再送 0
```

- PATCH は 1 件ごとに前後の GET で照合した（送った欄は送信値と一致・ほかの欄の変化 0）。
  - 直後の GET が合わず、3 秒後に取り直したのが 1 件（`ksi-local-fm-2`）。取り直して一致した（10/5 の実測と同じ現象）。
- **GET 全件照合**（20:06・scratchpad の `verify_after.py`）: **不一致 0**。
  - 1,708 件（書込前 1,707＋新規 1）・slug の重複 0。
  - 計画の 1,700 件は、送った欄が計画どおりで、送っていない欄は書込前と同じ。
  - 書込の外の 7 件（凍結 5＋今回の凍結 2）は中身も updatedAt も変化 0。
  - last_updated: 2026-11-02 が 1,701 件（＋凍結 7: 2026-04-01 が 5・2026-08-17 が 2）。
  - fetched_at: 2026-11-05 が 1,701 件。
  - N-1 可: 凍結を除いて 140（計画どおり）。
- `npm run build`（20:08〜20:12・253 秒）: PASS・★WARN 0。
  - `verify:grid-pages`: 名称非公開 23・title と h1 の重なり 0。
  - `verify:grid-detail-static`: 詳細 8,355 件＝一覧 8,346＋凍結 9。
  - ほかの prebuild の verify も全部 ok。
- `verify:grid-fields`: PASS。
  - 軸 1: 関西 1,701 件・台数あり 1,701。
  - 軸 3: 関西の `area_dates` 2026-11-02（1 種）＝実データの最新版。
  - 軸 4〜6 ok。
- `tsc --noEmit` 0・`verify:linkify` clean。
- 生成物（`src/data/substations/*.json`）は commit していない。

## (5) N-1 の三値

- `scripts/experimental/_common/build_n1_status.py` を回し直し、`src/data/n1-status.json` を更新した（20:07・microCMS GET 84）。
  - §3（関西）は、空欄か「－」かの判定を 11/02 版の CSV（`kansai/src_2611`）で行うようにした。
  - §9 を足した（関西 11/02 版の未算定・空欄の一覧 `n1_undetermined_kansai_2611.json` の 3 件を照らし、source を 11/02 版の取込にする）。
- 変わったのは関西の 3 件だけ。件数は 424 のまま、ほかの社の entry は変化 0:

| slug | 名前 | reason | as_of | source |
|---|---|---|---|---|
| `ksi-kikan-bu` | 名称非公開（ＢＵ） | undetermined（「－」） | 2026-08-17 → **2026-11-02** | 154kv_{more,less}_trans.csv（2026-11-02公表）・2026-11-05 取込 |
| `ksi-local-ec-6` | 赤子山 | blank（空欄） | 2026-08-17 → **2026-11-02** | 同上 |
| `ksi-local-d-7` | 高時川 | blank（空欄） | 2026-08-17 → **2026-11-02** | 同上 |

- `verify:grid-fields` 軸 5（as_of が last_updated と不一致）0 件・軸 6 の関西 undetermined 3/3。
- 本番の 3 件とも、N-1電制適用可否は「**未算定**」（(6)）。microCMS の n1_eligible は false のまま（boolean を潰していない）。

## (6) 本番の確認（素の URL・クエリ無し・`<!-- -->` を剥がした）

デプロイは GitHub のコミットの状態で success 20:23:07（Vercel `6Q7WxuW55WGLUgbpcT5hAdHP6ctv`）。1 回目 20:23:36・2 回目 20:24:07。

| ページ | x-vercel-cache・age | 結果 |
|---|---|---|
| `/grid/kansai` | PRERENDER・0 | 「公表 2026/11/02 時点（当サイト取込 2026/11/05）」・題名「…変電所一覧 — 1,701件」 |
| `ksi-kikan-ad` 東大阪 275/154（ゼロ以下） | MISS・0 | 予想潮流 −557 MW・空容量（当該設備）**−130 MW**・最終更新 2026/11/2 |
| `ksi-local-ca-9` 志方（ゼロ化） | MISS・0 → HIT・27 | 空容量（当該設備）**0 MW**・最終更新 2026/11/2 |
| `ksi-local-d-4` 黒井（ゼロ化） | MISS・0 → HIT・27 | 空容量（当該設備）**0 MW**・上位系 0 MW・最終更新 2026/11/2 |
| `ksi-kikan-m`（名前） | MISS・0 | 題名・h1「西京都変電所（154）」・変電所名の欄「西京都（154）」 |
| `ksi-local-ef-8`（名前） | MISS・0 → HIT・26 | 題名・h1「有馬変電所（77/6.6kV）」・変電所名の欄「有馬」・空容量 11 MW |
| `ksi-local-ef-9`（名前） | MISS・0 | 題名・h1「有馬変電所（77/22kV）」・変電所名の欄「有馬」 |
| `ksi-local-gc-5` 咲洲２（新規） | MISS・0 → HIT・24 | 200・関西ローカル系・22/6.6・空容量 5 MW・最終更新 2026/11/2 |
| `/grid/7c1n48509wi9`（新規の id） | — | **308** → `/grid/ksi-local-gc-5` |
| `ksi-local-cq-6` 須磨 77/33（凍結） | MISS・0 | 注記「…2026年11月2日更新版の公表データに掲載がないため、更新を停止しています（2026年8月17日公表時点の値のまま）…」・最終更新 2026/8/17 |
| `ksi-local-fx` 間谷（凍結） | MISS・0 | 同じ注記・最終更新 2026/8/17 |
| `ksi-local-ea-4` 玄妙（8/19 の凍結・比べる用） | MISS・0 | 「…2026年8月17日更新版の…（2026年4月1日公表時点の値のまま）」＝同じ形 |
| `ksi-kikan-bu`（N-1） | MISS・0 | 題名「名称非公開の変電所（関西電力送配電・No.ＢＵ）」・N-1「未算定」・最終更新 2026/11/2 |
| `ksi-local-ec-6` 赤子山（N-1） | MISS・0 | N-1「未算定」・最終更新 2026/11/2 |
| `ksi-local-d-7` 高時川（N-1） | MISS・0 | N-1「未算定」・最終更新 2026/11/2 |
| `ksi-local-gl-2` 新大岩（振り直し） | MISS・0 | 題名「新大岩変電所（77/6.6kV）」・最終更新 2026/11/2 |

- 変電所の詳細は 11/4 からビルド時の JSON で描くので、Data Cache の旧値の窓（#116・#127）は無い。1 回目から全部新しい値だった。
- 30 分の監視（microCMS の警告メール・Vercel のエラー率）は、EDAさん・ユウの側で見てもらう必要がある（CC は受信箱を見られない）。

## (7) IndexNow の応答

- `npx tsx scripts/indexnow-submit.ts --urls <ファイル> --apply --log=<ファイル>`（dry run の後に 1 回）。URL のファイルとログは scratchpad。
- 送った 278 件: 値か名前が変わった slug 277（値 274＋名前 3）と新規の `ksi-local-gc-5`。
  - 日付だけ変わった 1,423 件は送っていない。
  - 凍結の 2 件も送っていない（便の対象の外）。
  - ＢＵ は変化が無いので一覧に入らない（道具の NO_SUBMIT_SLUGS でも外れる・「名称非公開 0 件を外した」）。
- 2026-11-05 20:24:33 JST・1 回・278 件・**HTTP 200（受理）**・本文は空。鍵は 605d…（本番の鍵のファイルは HTTP 200・中身一致）。

## (8) 申告・一時物

- 停止条件: rm 系・push --force・.env の表示・microCMS の DELETE／PUT は、どれも 0。
  - .env.local は `set -a && . ./.env.local && set +a` で読み込んで使った。
- #127: この便では、書込の前に関西の詳細ページを開いていない。前の状態は microCMS の GET で見た。
  - 11/5 の dry run の報告の後（18:1x）に 2 枚開いたことは、dry run の報告で申告済み。11/4 から詳細はビルド時の JSON なので、影響は無い。
- **便に無かったこと 3 点**:
  1. **fetched_at を全件 2026-11-05 にした**（新規も）。便は last_updated だけを書いていたが、8/19 の関西（applier が実行時刻を足した）と 10/30・11/2 の東京・九州の本実行が、取込日を fetched_at に入れている。本番の「当サイト取込 2026/11/05」はこの値。
  2. **新規の id ≠ slug の転送と CLAUDE.md #113**（(3)）。
  3. **`external_id_history.json` の `count` を 13 → 19 に直した**。足す前から `entries` は 17 件で、`count` が古いまま（13）だった。2 件足して実件数 19 にそろえた。
- 訂正履歴は足していない（定例のデータ更新・便 §1-8）。
- 足した・変えたファイル（commit `f4edf00`）:
  - `CLAUDE.md`（#113・更新履歴）
  - `next.config.js`
  - `src/data/substations-frozen.json`
  - `src/data/n1-status.json`
  - `scripts/experimental/_common/build_n1_status.py`
  - `scripts/experimental/_common/external_id_history.json`
  - `scripts/experimental/kansai/parse_kansai_csv_2611.py`
  - `scripts/experimental/kansai/update_plan_202611.json`
  - `scripts/experimental/kansai/baseline_live_2611b.json`
  - `reports/grid-kansai-2026-11-05.apply.json`・`.apply.jsonl`
  - src のコードの変更は `next.config.js` の 1 行だけ。
- 使った道具: curl・Python・tsx（applier・IndexNow）・gh（コミットの状態）。ブラウザ・Claude in Chrome・調べ役は使っていない。PDF は取っていない（版は CSV の 1 行目と sha256 で確かめた）。
- 一時物（消していない）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\bx\`
  - 取り直した一次: `landing\index.html`・`csv\`（CSV 3 本とヘッダ 3 本）
  - 道具: `check_plan.py`・`verify_after.py`・`add_frozen_history.py`・`prod.py`・`targets.json`・`targets2.json`
  - `out\` の中:
    - 解析と検査: `parse.log`・`parse_2611b.json`・`n1_2611b.json`・`check_plan.txt`・`plan_fault.json`（故障注入の写し）
    - 書込と照合: `dry.log`・`apply.log`・`after.json`・`verify.txt`
    - N-1 とビルド: `n1-status.before.json`・`n1.log`・`build.log`・`grid-fields.log`
    - 本番と IndexNow: `prod1.txt`・`prod2.txt`・`indexnow-kansai.txt`・`indexnow-kansai-log.json`
- この後: 関西の府県の割り当て便（版は 11/02 にそろった）。
