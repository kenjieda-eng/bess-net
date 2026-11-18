# BV 九州 本実行（2026-11-18）— 九州電力送配電の予想潮流を 2026年10月30日更新版に（11/17 の dry run と裁定どおり）

microCMS「変電所空き容量DB」**PATCH 884・POST 0・DELETE／PUT 0**。この API に webhook は無い（反映は push のビルド）。

## (0) 実行の記録

| 項目 | 値 |
|---|---|
| リポジトリ | `C:\Users\kenji\Documents\GitHub\bess-net`（着手 2026-11-18 11:43 JST・HEAD `b535cc9`＝125 行〔九州の県の直し便〕の後） |
| 便 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\BV_九州_本実行便_予想潮流を10月30日版に更新・電圧3件を公表どおりに_裁定どおり_Claude_Code投入_2026-11-17起草_ユウ.md` |
| 入力 | dry run 便 `BV_九州電力送配電_予想潮流更新_dry-run_2026-11-17.md`・報告 `reports/grid-kyushu-dryrun-2026-11-17.md`（commit `4867fc3`）・裁定 `02_計画・運営/検証記録_BV九州dry-run_確かめと裁定_2026-11-17_ユウ.md`（便の §0 と同じとして当てた）・前の裁定 `検証記録_BU東京・BV九州dry-run_裁定_2026-10-29_ユウ.md` |
| `_QUEUE.md` | 126 行（GO: ユウ 11/17 18:32・EDAさん 18:32「両方OK」・2 本目＝125 行の DONE の後） |
| 計画 | `scripts/experimental/kyushu/update_plan_202611.json`（`parse_kyushu_2611.py --emit-plan`・baseline `baseline_live_2611b.json`） |
| 書込の記録 | `reports/grid-kyushu-2026-11-18.apply.json`・`.apply.jsonl`（1 件ごと・884 行） |
| 停止条件 | rm 系 0・push --force 0・.env 表示 0（読み込みのみ）・microCMS は PATCH 884 と GET だけ（DELETE・PUT 0） |

## (1) 版の確認（書込の前・11:43:39〜11:43:41・素の curl・1 本ずつ・2 秒あけ・ブラウザのふりをする UA なし）

- 公表ページ https://www.kyuden.co.jp/td/service/wheeling/disclosure.html: HTTP 200・本文「2026年10月30日更新」・「変圧器CSV（zipファイル）」の href は `/var/rev0/0958/7243/td_oIcmhBw1.zip`（11/17 と同じ）。
- ZIP: HTTP 200・33,544 バイト・Last-Modified 2026-11-16 15:13:33 GMT・sha256 `bc6e80aba501b0e9ed5f0422618004641c9fe2908e542f781d3735bbf2abc4fb`（11/17 の取得物とリポの `src/td_oIcmhBw1.zip` と同じ）。→ **版は変わっていない（10/30 の版で進めた。便 §0-3 の条件は使っていない）**。
- baseline: 11:43:48 に microCMS を GET（`fetch_baseline.py`・9 回・884 件＝totalCount・id の重複 0）→ `baseline_live_2611b.json`。11/17 の baseline と全件同じ（変わったレコード 0）。

## (2) 計画と dry run の差

- 計画: **PATCH 884**（数値の 7 欄が変わる 87・電圧が変わる 3・重なり 0＝何か変わる **90**・残る 794 件は last_updated・source_url・fetched_at だけ）・**POST 0**（新規 2 は保留の行）・名称の修正 0・external_id の更新 0（振り直し 0）・出力制御の可能性 空にする 0／値を入れる 0・N-1 可（取込後）69・N-1 未算定で現値維持 2。
- dry run（11/17）との差: 数値の 87 件と内訳（予想潮流 46・空容量 40・上位系等 10・運用容量 2・設備容量 2・N-1 可能量 1）は同じ。足したのは裁定 1 の電圧 3 件だけ。
- 計画を作る道具（`parse_kyushu_2611.py`）に足したこと（11/17 裁定 1）: 電圧が違う行が裁定の 3 件（`kyu-110` 110/6・`kyu-111` 110/22・`kyu-112` 110/6）と違えば書かずに止める／3 行で電圧のほかに違う欄があれば止める（どちらも 0 で通った）。書く欄は `voltage_primary_kv`（110）と `voltage_class`（`["110kV系"]`。九州で既に 30 件が使っている選択肢＝#106 の黙った捨てはない）。二次電圧は変わらないので送っていない。
- **計画の機械検査**（scratchpad の `apply\check_plan.py`・パーサを読まない独自のコードで ZIP を直接読む）: **NG 0**。数: 何か変わる 90・電圧 3・空容量 減 30（ゼロ化 4）・増 10・N-1 可 69（変化 0）・**取込後の空容量プラス 595**（便の見込みと同じ）。
  - 故障注入 8 通り（串木野の空容量を 1 ずらす・基山の一次電圧を書き忘れる・原田の電圧階級を書き忘れる・ほかの行〔串木野〕の電圧を変える・南関の未算定を潰す・last_updated を旧版のまま・notes を書く・1 件落とす）→ **8/8 が落ちる**。
- applier の dry run（11:44〜11:52・GET 884）: dry 884・skip_changed 0・failed 0。

## (3) 電圧の 3 件

| slug | 名称 | 公表 No. | 当方（前） | 公表（10/30 版） | 電圧階級 | ほかの欄 |
|---|---|---|---|---|---|---|
| `kyu-110` | 原田 | 地区 06 No.4 | 66/6 | **110/6** | 66kV系 → **110kV系** | 変化なし（台数 2・設備容量 38・運用容量・空容量・N-1 とも同じ） |
| `kyu-111` | 基山 | 地区 06 No.5(1) | 66/22 | **110/22** | 66kV系 → **110kV系** | 変化なし（台数 1・設備容量 28） |
| `kyu-112` | 基山 | 地区 06 No.5(2) | 66/6 | **110/6** | 66kV系 → **110kV系** | 変化なし（台数 2・設備容量 38） |

slug・名称・県（microCMS の prefecture＝福岡県）は変えていない。県の表示は 125 行の対応表で決まる: 原田 `kyu-110` は推定のまま「福岡県（当サイトの推定）」、基山 `kyu-111`・`kyu-112` は「確認中」（地名検索で佐賀 11・福岡 1）。

## (4) 書込と照合

```
applier の dry run（11:44〜11:52・GET のみ）
[done] {"patched":0,"dry":884,"skip_done":0,"skip_changed":0,"failed":0,"posted":0,"post_dry":0,"post_skip":0}
[microCMS 呼び出し] GET 884・再送 0

本実行（11:52:39〜12:21:15・逐次 400ms・並列なし・reports/grid-kyushu-2026-11-18.apply.json／.apply.jsonl）
[done] {"patched":884,"dry":0,"skip_done":0,"skip_changed":0,"failed":0,"posted":0,"post_dry":0,"post_skip":0}
[microCMS 呼び出し（HTTP 送信・再送込み）] GET 1773・PATCH 884・再送 0
```

- PATCH は 1 件ごとに前後の GET で照合した（送った欄は送信値と一致・ほかの欄の変化 0）。**取り直し 5 件**（`kyu-99`・`kyu-230`・`kyu-276`・`kyu-279`・`kyu-495`）: PATCH 直後の GET が送信値と合わず、3 秒後の取り直しで全部一致（保存の反映の遅れ）。GET 1,773＝前 884＋後 884＋取り直し 5。DELETE・PUT は 0。この API に webhook は無い。
- **GET 全件照合**（12:21:39・`fetch_baseline.py` で 884 件を取り直し〔GET 9〕・scratchpad の `apply\verify_after.py`）: **不一致 0**。
  - 884 件・slug の重複 0・slug の集合は計画と同じ。
  - 計画の 884 件は、送った欄が計画どおりで、送っていない欄は書込前と同じ（書込前に無かった欄に値が入ったもの 0）。
  - last_updated 2026-10-30 が 884・fetched_at 2026-11-18 が 884・source_url は全件 `https://www.kyuden.co.jp/var/rev0/0958/7243/td_oIcmhBw1.zip`。
  - N-1 可 69。電圧の 3 件: `kyu-110` 110/6・`kyu-111` 110/22・`kyu-112` 110/6、電圧階級はどれも `["110kV系"]`。
- 文字の欄（対象設備の当該設備・上位系設備・備考）は書いていない（扱いは 12/1 の月次で決める）。
- #127: 書込の対象の詳細（`/grid/kyu-…`）と `/grid/kyushu` は、125 行の本番確認（11:41〜11:42）で書込の前に開いている。変電所の詳細は 11/4 からビルド時の JSON を読み（実行時の microCMS 0・revalidate false）、`/grid/kyushu` も precompute の静的データなので、Data Cache に旧値は残らない（反映は今回の push のビルド）。

## (5) N-1 の三値・`grid-refresh-log.ts` に足した 1 件

- `scripts/experimental/_common/build_n1_status.py` に §11（九州 10/30 版の未算定の一覧 `n1_undetermined_kyushu_2611.json` の 2 件を照らし、source を 10/30 版の取込にする。足りない行があれば足す）を足して回し直した（12:21・microCMS GET 84）。
  - 変わったのは九州の 2 件だけ（件数 423 のまま・凍結 1 件のまま）:

    | slug | 名前 | 変化 |
    |---|---|---|
    | `kyu-278` | 大鶴 | as_of 2026-09-29 → **2026-10-30**・source を「td_oIcmhBw1.zip（2026-10-30公表）・2026-11-18 取込」に |
    | `kyu-500` | 南関 | 同上 |

  - 2 件とも reason は undetermined のまま（10/30 版の CSV で N-1 欄が「―」）。microCMS の n1_eligible は false のまま（潰していない）。as_of が last_updated（2026-10-30）と一致するので、表示は「未算定」のまま効く（`verify:grid-fields` 軸 6: 九州 undetermined 2/2）。凍結のページの N-1（`n1StatusAtFreeze` の検査）は ok のまま。
- `src/lib/grid-refresh-log.ts` の先頭に 1 件（追記のみ）:
  - `importedOn` 2026-11-18・`publishedVersion`「2026年10月30日更新版（全31地区同一版）」・`total` 884・`decreased` 30・`zeroed` 4・`increased` 10・**`changed` 90**（数値 87＋電圧 3・重なり 0）・`added` 0・`removed` 0。
  - `topDecreases`（減り幅の大きい順）: 串木野（鹿児島県）22 → 16・木佐木（66/6kV）（福岡県）5 → 3・土谷（佐賀県）2 → 0・石原町（福岡県）9 → 7・宮原（熊本県）9 → 7。
    - 選び方: 県を一次で確かめたもの（対応表の verified＝木佐木）か、県をまたがない地区のもの（串木野 地区 23・土谷 11・石原町 13・宮原 17）だけ。減った 30 件のうち、確認中の 7 件（細野・鷹尾・日南・宇島・行橋・玉名・高崎1）と規則に届かなかった泉、県をまたぐ地区の推定のもの（大川・木室・大和・佐々）は使っていない。
    - 2 件目からは減り幅 2 の同着（使える行は 10 件）。この中の選び方に決まりは無いので、確かめた木佐木・ゼロ化の土谷を先に入れ、残り 2 件は地区の違う石原町（地区 13）・宮原（地区 17）にした（新水俣(配変)・二島・南郷・香月(6kV) なども同じ減り幅で使える行）。橘 `kyu-404`（14 → 12）は同じ名前の橘 `kyu-405` が増えた例（8 → 12）なので紛らわしく、壱岐 `kyu-879`（20 → 18・福岡県で収録）は名前が長崎県の島の名と同じで紛らわしいので外した。木佐木は同じ名前が 3 件あるので電圧を添えた（11/17 の新綾部と同じ扱い）。
  - `note`: 原田・基山の 3 件は、公表の一次電圧が 66kV から 110kV に変わった（設備は同一・URL は維持）。志和池の第 3 バンク・原田（22/6kV）の 2 件は、収録を保留のまま。N-1 電制の未算定 2 件（大鶴・南関）は現値維持。出力制御の可能性の変化はなし。
  - 九州の行には 125 行の「※ 九州の県は、当サイトの推定を含みます。」が共通で出る（この行で 3 行目）。

## build・push

- `npx tsc --noEmit` EXIT 0・`npm run build` BUILD EXIT 0（★WARN 0。`verify:kyushu-prefecture` ok〔external_id の振り直し 0 のため表はそのまま〕・`verify:grid-pages` ok・`verify:grid-detail-static` ok）・`verify:grid-fields` PASS（軸 3: 九州 area_dates 2026-10-30〔1 種〕＝実データの最新・軸 6: 九州 undetermined 2/2）・`verify:linkify` PASS。
- built HTML: `/grid/kyushu` は 884・空容量プラス **595**・N-1 69・「公表 2026/10/30」。`/tracker/grid` の先頭が九州の 1 件。
- commit `ed6e3c1`（計画・baseline・パーサー・`build_n1_status.py`・`n1-status.json`・`grid-refresh-log.ts`・書込の記録）→ 12:28:00 JST push。

## (6) 本番の確認（素の URL・クエリなし・script を除き `<!-- -->` を剥がした初期 DOM）

Vercel の status success 12:35:50 JST（commit `ed6e3c1`）。

| 時刻（JST） | URL | HTTP | x-vercel-cache | age | 見たもの |
|---|---|---|---|---|---|
| 12:35:56 | `/grid/kyushu` | 200 | PRERENDER | 0 | 「公表 2026/10/30」・**884 件・空容量プラス 595・N-1 電制適用可 69**・県別は 125 行の後の数のまま（福岡 232・鹿児島 130・長崎 129・熊本 121・大分 107・県は確認中 70・宮崎 56・佐賀 39） |
| 12:35:59 | `/grid/kyu-714`（串木野） | 200 | MISS | 0 | 空容量（当該設備）**16 MW**（22 → 16）・データ最終更新日 2026/10/30 |
| 12:36:02 | `/grid/kyu-280`（土谷） | 200 | MISS | 0 | **0 MW**・2026/10/30 |
| 12:36:04 | `/grid/kyu-624`（阿久根） | 200 | MISS | 0 | **0 MW**・2026/10/30 |
| 12:36:06 | `/grid/kyu-672`（高崎1） | 200 | MISS | 0 | **0 MW**・2026/10/30（県は確認中＝題名に県なし） |
| 12:36:08 | `/grid/kyu-757`（南郷） | 200 | MISS | 0 | **0 MW**・2026/10/30 |
| 12:36:10 | `/grid/kyu-405`（橘・増えた例） | 200 | MISS | 0 | **12 MW**（8 → 12）・2026/10/30 |
| 12:36:12 | `/grid/kyu-110`（原田） | 200 | MISS | 0 | 題名「原田変電所（福岡県・九州電力送配電）の系統空き容量・蓄電池連系条件」・電圧（一次）**110 kV**・（二次）6 kV・電圧階級 **110kV系** |
| 12:36:14 | `/grid/kyu-111`（基山） | 200 | MISS | 0 | 題名「基山変電所（110/22kV）の…」・**110 kV**／22 kV・**110kV系**（県は確認中＝題名に県なし） |
| 12:36:16 | `/grid/kyu-112`（基山） | 200 | MISS | 0 | 題名「基山変電所（110/6kV）の…」・**110 kV**／6 kV・**110kV系** |
| 12:36:17 | `/grid/kyu-278`（大鶴） | 200 | MISS | 0 | N-1電制適用可「**未算定**」 |
| 12:36:19 | `/grid/kyu-500`（南関） | 200 | MISS | 0 | 「**未算定**」（残っている） |
| 12:36:21 | `/tracker/grid` | 200 | PRERENDER | 0 | 先頭が「九州エリア（九州電力送配電）／2026年10月30日更新版（全31地区同一版） ／ 取込 2026-11-18 ／ 884件」 |
| 12:36:23 | `/corrections` | 200 | PRERENDER | 0 | 503 件（変化なし） |

- 原田の題名に電圧が付かないのは、九州のレコードに同じ名前の原田がほかに無いため（保留の原田 22/6kV は未収録）。題名の重なりは無い（`verify:grid-pages`: 同じエリアで title と h1 の重なり 0）。
- 道具: scratchpad の `apply\prod.py`・結果 `apply\prod.json`（取得物は `apply\prod\`）。

## (7) IndexNow

`reports/grid-kyushu-2026-11-18.indexnow-urls.txt`（92 URL: 値か電圧が変わった 90 件の詳細＋`/grid/kyushu`・`/tracker/grid`。日付だけ変わった 794 件は入れていない）。dry run（92 件・鍵のファイル 200 一致）→ `--apply --log=reports/grid-kyushu-2026-11-18.indexnow.json`: 12:36 JST・**HTTP 200（受理）**・92 件。鍵は先頭 4 文字 `605d` だけを書く。

## (8) 申告・一時物

- 停止条件に当たる操作なし（rm 系・push --force・.env の表示 いずれも 0。microCMS は PATCH 884 と GET だけ・DELETE／PUT 0）。公表元は素の curl で 1 本ずつ・2 秒あけ（公表ページ 1・ZIP 1）。
- 訂正履歴は足していない（便 §0-4: 定例のデータ更新・電圧は公表側の記載の変更）。
- 便と違えたところ: なし（例の 5 件の選び方は (5) のとおり。同着の中の選び方は便に決まりが無い）。
- 一時物はすべて scratchpad（リポジトリの外）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\kyu1118\apply\`（`disclosure.html`・`disc.hdr`・`zip\`〔取り直した ZIP と応答ヘッダ〕・`dry\`〔計画を作ったときの報告の出力〕・`check_plan.py`・`verify_after.py`・`after_2611.json`〔書込後の全件 GET〕・`n1-status.before.json`・`applydry.log`・`apply.log`・`prod.py`・`prod.json`・`prod\`）と `kyu1118\build2\build.log`。消していない。
- commit は名前を指定して入れた（`src/data/substations/*.json`・`alias-expansion-report.json` は入れていない）。
