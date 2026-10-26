# 補助金便 月曜定例 10-26 — 鳥取県・滋賀県の受付終了・愛媛県の期日延伸とエリア拡大・栃木県の締切の年（2026-10-26）

## (0) 読んだ便と入力

| 種類 | 絶対パス | sha256 |
|---|---|---|
| 便 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\補助金便_月曜定例10-26_鳥取県と滋賀県の受付終了・愛媛県の期日延伸とエリア拡大・栃木県の締切の年_Claude_Code投入_2026-10-26起草_ユウ.md` | `9436aeca33bdad11780376b3e5cc7f98be5c9e2d196af63f7d140b00421a79be` |
| 計画 JSON | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\subsidies-patch-plan-2026-10-26_月曜定例_一次照合済み_ユウ.json`（11,630 バイト） | `c568265f6c4d480ed49137e5106b31c260d5804b5493007423597627dcaae77f`（便の記載と一致。コピーの `reports/subsidies-weekly-2026-10-26.data.json` も同じ） |

- GO は EDAさんの指示（10/26「…補助金便_月曜定例10-26… を読んで実行して」）による。
- `_QUEUE.md` にこの便の行は無いので、触っていない（便の規則どおり）。
- 着手の順: 同じ時間に走っていたサイトの歩み便の push（`d563c7a`）と本番の確認の後に着手した。サイトの歩み便は `subsidies.json` を触っていない。
- **書込**: microCMS は `subsidies` の PATCH 4 レコード・8 op だけ（17:56:22〜17:56:32 JST）。POST・DELETE・PUT は 0。webhook は止めていない（便のとおり不要）。
- **#127**: 書込の前に、対象の 4 ページ・`/subsidies`・`/tools/subsidy-match` は開いていない。前の状態は、リポの `subsidies.json` で見た。
- **停止条件**: rm 系・push --force・.env の表示は、どれも 0。

## 結論

- 4 件とも、10/26 17:55 に一次を取り直して便の事実どおりだったので、計画のまま当てた。
  - dry run: PATCH 4・中止 0・生の不一致 0。
  - 本実行: #106/#122 は 4/4 で ✓。
  - 再実行: skip 4。
- `subsidies.json` の差分は、便の期待どおりの 4 レコードの欄だけで、件数は 80。
- 本番（デプロイ `3fb1b19`・18:21 に Ready）:
  - 栃木は「公募中・締切10/30」、滋賀と鳥取県は「受付終了」、愛媛は「公募中・締切1/29」で、対象は県内全市町になった。
  - `/subsidies` は「35件該当（全80件中）」で、基準日 10/26 で数えた 37 → 35 と一致。

## (1) 一次の取り直し（2026-10-26 17:55 JST・curl・Chrome UA・ブラウザは使っていない）

| | URL | HTTP・バイト | sha256（先頭） | 判定 |
|---|---|---|---|---|
| (a) 栃木 | pref.tochigi.lg.jp/d02/kouhou/jikasyouhitaiyoukou_zigyousya.html | 200・31,390 | `7f58ca15068c67b5`（便と一致） | 「令和８(2026)年５月11日(月曜日)～同年10月30日(金曜日)」が 1 回 → ■1 を当てた。「受付を終了」の 1 回は申請期間の注記 ※2（予算到達の新着は無し）。新着は「予算に対する交付決定額の割合：約70％(令和8(2026)年10月７日現在)」のまま |
| (b) 滋賀（県） | pref.shiga.lg.jp/cg00/3127.html | 200・15,426 | `530edfbba7eaa49d`（一致） | 「【※今年度(令和8年度)の受付は終了しました。】」が 1 回 → ■2 を当てた。「受付中」の 1 回は別の制度（促進区域内再エネ導入促進事業補助金） |
| (b) 滋賀（プラザ） | shigaplaza.or.jp/news/hojokin-co2-20260422/ | 200・138,116 | `c475cb1b0c01de44`（一致） | 「受付終了いたしました」が 2 回。申請状況は「令和8年10月15日（木）14:30時点　予算63,000千円　　申請累計金額63,332千円　　交付決定額46,653千円」で、便の値と同じ（金額・時点は替えていない）。「受付中」の 1 回はサイトのメニューのラベル |
| (c) 鳥取県 | pref.tottori.lg.jp/320404.htm | 200・55,947 | `9e08b3dcd931ab64`（便は `494a6fc4…`） | 「（お知らせ）令和８年度の募集は終了しました」が 1 回 → ■3 を当てた。sha の違いはページ上部の注目情報（防災ポータルの「再開」など）の差し替えで、補助金の項は便の逐語どおり。「追加募集」は 0、「再開」の 2 回は防災の注目情報 |
| (d) 愛媛 | pref.ehime.jp/page/144869.html | 200・30,892 | `e24b4aa135d9dfe1`（一致） | 「令和8年5月20日（水曜日）～令和9年1月29日（金曜日）」と「補助対象エリアを11市町から県内全市町へ拡大」が 1 回ずつ → ■4 を当てた |

## (2) PATCH

```
dry run（--log=reports/subsidies-weekly-2026-10-26.dry.json）
■ PATCH subsidies/tochigi-bess-2026（fy-ajkuxzws）ops 2（適用済み 0）→ deadline 13→103字・applicationStart 20→43字
■ PATCH subsidies/shiga-energy-saving-2026（tdlhluna7xb）ops 2（適用済み 0）→ status 3→4字・deadline 64→255字
■ PATCH subsidies/tottori-bess-2026（7q1ky3riyt）ops 2（適用済み 0）→ status 3→4字・deadline 59→148字
■ PATCH subsidies/ehime-bess-2026（5wtsubx5v）ops 2（適用済み 0）→ deadline 11→97字・targetEntity 168→192字
[done] PATCH 4 / POST 0 / skip 0 / 中止 0 / 失敗 0　生の文字列の不一致 0　GET 8

本実行（--apply・--log=reports/subsidies-weekly-2026-10-26.apply.json・17:56:22〜17:56:32）
4 件とも「#106/#122: ✓ 送信 2 field 一致・他 field 変化 0」
[done] PATCH 4 / POST 0 / skip 0 / 中止 0 / 失敗 0　生の文字列の不一致 0　GET 12・PATCH 4

冪等（--log=reports/subsidies-weekly-2026-10-26.dry2.json）
[done] PATCH 0 / POST 0 / skip 4 / 中止 0 / 失敗 0
```

- 滋賀の deadline の全角空白（U+3000）は、PATCH 後の GET の生の文字列で確かめた。
  - 送信値と完全一致し、U+3000 は 5 個（時点の後に 1 つ、金額の間に 2 つずつ）。
  - status は `["受付終了"]`。

## (3) `src/data/subsidies.json` の diff（`npm run build` の prebuild で作り直したもの・commit `3fb1b19`）

| レコード | 変わったキー | 値 |
|---|---|---|
| tochigi-bess-2026 | applicationStart・start_iso・deadline_raw・deadline_iso・updatedAt | start_iso 無し → `2026-05-11`、deadline_iso 無し → `2026-10-30` |
| shiga-energy-saving-2026 | status・deadline_raw・deadline_iso・updatedAt | status `["公募中"]` → `["受付終了"]`、deadline_iso 無し → `2026-12-10` |
| tottori-bess-2026 | status・deadline_raw・updatedAt | status `["公募中"]` → `["受付終了"]`（deadline_iso は無しのまま） |
| ehime-bess-2026 | targetEntity_raw・deadline_raw・deadline_iso・updatedAt | deadline_iso 無し → `2027-01-29` |

- 便の期待どおりで、件数は 80 → 80、ほかの 76 件の変化は 0（python で全件のキーを比べた）。
- 差分の行数は 28 行（±）。
- ビルド: PASS（tsc・prebuild の verify 全部 ok・WARN 0）。`npm run verify:source-names:src` は ok（台帳は触っていない）。

## (4) 本番照合（デプロイ `bess-pnnvklpjb`・18:21 に Ready・照合 18:21:56 JST・素の URL と `?v=`）

| URL | 素の URL（cache・age） | 結果 |
|---|---|---|
| `/subsidies/tochigi-bess-2026` | PRERENDER・0 | `<title>`「事業者用太陽光発電設備等導入支援事業 — 公募中・締切10/30｜蓄電所ネット」。description の先頭「公募中・締切10/30」。「令和８(2026)年５月11日(月曜日)～同年10月30日(金曜日)」1 回 |
| `/subsidies/shiga-energy-saving-2026` | PRERENDER・0 | `<title>`「省エネ・再エネ等設備導入加速化事業補助金 — 受付終了｜蓄電所ネット」（公募中 0 回）。「今年度(令和8年度)の受付は終了しました」1 回・「受付終了」3 回 |
| `/subsidies/tottori-bess-2026` | PRERENDER・0 | `<title>`「鳥取県企業の省エネ・再エネ推進事業補助金 — 受付終了｜蓄電所ネット」（公募中 0 回）。「令和８年度の募集は終了しました」2 回 |
| `/subsidies/ehime-bess-2026` | PRERENDER・0 | `<title>`「愛媛県サイクル拠点施設再エネ設備等導入支援補助金 — 公募中｜蓄電所ネット」（便の予想どおり）。description の先頭「公募中・締切1/29」。「令和9年1月29日（金曜日）」1 回・「八幡浜市」0 回・「補助対象エリアの拡大（県内全市町へ）」1 回 |
| `/subsidies` | PRERENDER・0 | 「35件該当（全80件中）」。「いま公募中」の棚に滋賀・鳥取県は 0 回 |

- `?v=` 付き（HIT・age 3〜4）も同じ値だった。
- 「公募中」の件数は、基準日 2026-10-26 で `displaySubsidyStatus` を使って数えた（scratchpad の `count_open.ts`）。前の `subsidies.json` で 37、新しい方で 35。本番の 35 と一致した。
- `/tools/subsidy-match`: 候補は初期 DOM に出ないので、開いていない（#127）。ビルド出力の `subsidies.json` では、滋賀・鳥取県の status が `受付終了` になった。`src/lib/subsidy-matcher.ts` の `CLOSED_FOR_APPLICATION_STATUSES`（受付終了・採択結果公表）により、候補から外れる。

## (5) 訂正履歴（■6）

- 愛媛・栃木・滋賀は更新（県の改正への追随・締切の書式・掲示から 5 日）なので載せない。便のとおり。
- 鳥取県は `src/data/corrections.json` に足していない（便のとおり。載せるかはユウの裁定）。載せるとしたときの案:
  - before: 「状態を「公募中」と表示し、締切を「申請期限は１月末」と記載（鳥取県は 2026年9月8日に「令和８年度の募集は終了しました」と掲示済み）」
  - after: 「状態を「受付終了」に修正し、締切の欄に「募集終了（鳥取県の新着情報〔09月08日〕「（お知らせ）令和８年度の募集は終了しました」…）」と記載」
  - basis: 鳥取県「（お知らせ）令和８年度の募集は終了しました」https://www.pref.tottori.lg.jp/item/1437274.htm
  - path: `/subsidies/tottori-bess-2026`・kind: 訂正・date: 2026-10-26

## (6) 前提違い・気づいた点

1. (c) 鳥取県のページの sha256 は、便の `494a6fc4…` と違った（10/26 17:55 は `9e08b3dc…`・55,947 バイト）。
   - 違いはページ上部の注目情報（防災ポータルの運用再開など）で、補助金の項の逐語は便どおり。止める条件（募集再開・追加募集の新着）には当たらない。
2. 栃木は、10/30 を過ぎると、次のビルドから「受付終了」になる。
   - 締切超過は `deriveSubsidyStatus` がビルドの日付で導く。ISR の再生成か次のデプロイで切り替わる。
   - 10/31 以降の本番で受付終了になっていることは、次の月曜定例で確かめるとよい。
3. 便の §0 の「実行日が 2026-10-31 以降なら…」には当たらない（実行日 10/26）。

## (7) 申告・一時物

- 使った道具: curl・Python・tsx（applier・件数の数え上げ）・Vercel CLI。内蔵ブラウザ・Claude in Chrome・調べ役は使っていない。
- 一時物: scratchpad の `sub/` に置いた。消していない。
  - 一次の HTML と照合の結果: `primary/`
  - 本番の照合: `prod_sub.py`・`prod1.txt`
  - 件数の数え上げ: `count_open.ts`・`subsidies-old.json`
  - 差分の控え: `subsidies.diff`
  - ビルドのログ
- 便からの逸脱: なし。
