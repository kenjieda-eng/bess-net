# Ck2d 追補 コード便 報告（2026-10-03・CC）

commit: `f2011af`（コード 2 ファイル・push 20:33 頃・Vercel 完了 20:40 JST）。microCMS への書込 0（GET のみ）。変更ファイルは 2 つ（`src/lib/subsidies-meta.ts`・`scripts/precompute-glossary-detail.ts`）。
否定テストは 2 項目とも期待どおりで、停止条件には当たっていない。push 前に独立レビュー（読取専用のサブエージェント 3＋反証 3）を回し、この差分の不具合は 0 件。範囲外の所見は (6) にまとめた。

## (0) 読んだ絶対パス

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\Ck2d追補_コード便_title短ラベル再適用10件・glossary件数の凍結除外_Claude_Code投入_2026-10-03起草_ユウ.md`
- キュー: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md`
- 裁定: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\02_計画・運営\検証記録_10-03便_Ck2d・N1b_裁定_2026-10-03_ユウ.md`
- 前便の報告: `reports/ck2d-code-2026-10-03.md`

## 変更

| ファイル | 変更 |
|---|---|
| `src/lib/subsidies-meta.ts` | `buildSubsidyTitle`: 締切付きの長いラベル（「公募中・締切MM/DD」「公募中・締切MM月」）が `TITLE_MAX`（40 字）に入らないときは、短い「公募中」で再試行してから年度へ（分岐 1 つ・3 行）。`statusLabel` は不変（description は長いラベルのまま）。優先順「制度名 → 状態 → 年度」も不変 |
| `scripts/precompute-glossary-detail.ts` | `loadGridStats()`: 県別 JSON の行を自前で数える（凍結込み 8,352・N-1 可 791）のをやめ、`/grid` と同じ `src/data/substations/index.json` の `summary`（`total` 8,345・`n1_ok` 790・`by_operator` の社数 10）を読む。社数は「その他」（operator 空のレコードの寄せ先）を数えない（旧実装も空は数えていなかった）。N-1 件数も桁区切り（`toLocaleString('en-US')`・/grid と同じ）。summary が読めないときはビルドを止める（黙って誤った件数を出さない） |

## (1) ■3 の 78 件 前後表

現物 78 件（microCMS GET で名称を取得・本日 2026-10-03 JST）で、旧コードと新コードの title を比べた。

- **変わったのは期待の 10 件だけ**（11 件目なし）。変更後の title は 10 件とも Ck2d 報告 (2) の表の「変更後」と逐語一致。残り 68 件は不変。
- 状態の変化による差分（10/3 以降に締切を過ぎて「受付終了」に変わったもの）: 0 件（同じ日付で旧・新を比べたため）。

| slug | 変更前 | 変更後 |
|---|---|---|
| kawasaki-eco-ka-2026 | 市内事業者エコ化支援事業（市内事業者エコ化支援補助金）｜蓄電所ネット | 市内事業者エコ化支援事業（市内事業者エコ化支援補助金） — 公募中｜蓄電所ネット |
| fukuoka-sme-datsutanso-2026 | 福岡県中小企業脱炭素化緊急支援事業補助金｜蓄電所ネット | 福岡県中小企業脱炭素化緊急支援事業補助金 — 公募中｜蓄電所ネット |
| nagasaki-city-bess-2026 | 長崎市ゼロカーボンシティ推進事業費補助金（令和8年度）｜蓄電所ネット | 長崎市ゼロカーボンシティ推進事業費補助金 — 公募中（令和8年度）｜蓄電所ネット |
| saga-bess-2026 | SAGAゼロカーボン加速化事業（事業者向け）補助金（令和８年度）｜蓄電所ネット | SAGAゼロカーボン加速化事業（事業者向け）補助金 — 公募中｜蓄電所ネット |
| okayama-city-bess-2026 | 岡山市事業所用スマートエネルギー導入促進補助事業（令和8年度）｜蓄電所ネット | 岡山市事業所用スマートエネルギー導入促進補助事業 — 公募中｜蓄電所ネット |
| nara-bess-2026 | 事業所エネルギー効率的利用推進事業補助金｜蓄電所ネット | 事業所エネルギー効率的利用推進事業補助金 — 公募中｜蓄電所ネット |
| fukui-bess-2026 | 企業の太陽光・蓄電池設備導入促進事業補助金（令和８年度）｜蓄電所ネット | 企業の太陽光・蓄電池設備導入促進事業補助金 — 公募中｜蓄電所ネット |
| kanazawa-bess-2026 | 金沢市事業者用太陽光発電設備等重点対策加速化事業補助金｜蓄電所ネット | 金沢市事業者用太陽光発電設備等重点対策加速化事業補助金 — 公募中｜蓄電所ネット |
| toyama-city-bess-2026 | 富山市太陽光発電設備及び蓄電池導入促進補助金｜蓄電所ネット | 富山市太陽光発電設備及び蓄電池導入促進補助金 — 公募中｜蓄電所ネット |
| niigata-city-bess-2026 | 事業者用太陽光発電・蓄電池設備導入補助金｜蓄電所ネット | 事業者用太陽光発電・蓄電池設備導入補助金 — 公募中｜蓄電所ネット |

ローカルのビルド結果（`.next/server/app/subsidies/<slug>.html` の `<title>`）でも 10 件とも上の「変更後」と一致。

## (2) glossary の件数表記が変わった slug と前後

`src/lib/generated/glossary-detail-index.json`（1,534 件）を変更前後で比べた。

- 変わったのは **73 件の `term.detail` だけ**（ほかのフィールドの変化 0・件数 1,534 不変）。
- 置換の中身は 2 種類だけ:
  - 「10社8,352変電所」→「10社8,345変電所」72 件・「全国10社・8,352変電所」→「全国10社・8,345変電所」66 件
  - 「N-1電制適用可 約791件」→「約790件」・「N-1電制可 約791件」→「約790件」各 1 件（`non-firm-connection`・`non-firm-detail`）
- 変更後、`detail` に「8,352」を含む用語は 0 件。

変わった 73 slug: anti-islanding, balancing-market, capacity-market, capacity-market-agreement, capacity-market-settlement, cell-voltage, chikudensho, connection-study, connection-study-response, dielectric-strength, extra-high-voltage-grid, extra-hv-bess, general-transmission-distribution, grid-available-capacity, grid-enhancement, grid-frequency, grid-inertia, grid-information-service, grid-interconnection, grid-interconnection-code, grid-interconnection-contract, grid-operation, grid-scale-battery, grid-scale-battery-detail, grid-scale-bess, grid-scale-bess-subsidy, grid-voltage, high-voltage-grid, hokkaido-honshu-interconnection, hv-bess-detail, inter-regional-interconnection, interconnection-line, jeac-9701, jpea, jwpa, kagoshima-bess, low-voltage-grid, lv-bess-detail, non-firm-connection, non-firm-detail, offshore-wind, offshore-wind-detail, ofw-offshore-wind, open-circuit-voltage, osaka-bess, ovr-uvr, photovoltaic, point-of-interconnection, re100-japan, regional-decarbonization-grant, renewable-output-forecast, renewable-special-law, renewable-surcharge, reverse-power-flow, self-transmission, solar-mandate, solar-power, study-fee-detail, substation, transformer, transmission-capacity, transmission-grid, trunk-grid, tso-japan-detail, unbundling, voltage-flicker, voltage-fluctuation, wheeling, wheeling-charge, wheeling-contract, wheeling-supply, wheeling-supply-tariff, wind-power

- 年度が入らなくなるのは 3 件（saga・okayama-city・fukui）。優先順「制度名 → 状態 → 年度」どおり（裁定）。nagasaki-city は状態と年度の両方が入ってちょうど 40 字。
- 日付による変化（レビューで 2026-10-03〜2027-03-15 を 1 日ずつ計算）: 10/30 JST までは同じ 10 件。締切を過ぎた行から旧・新の title が同じ（「受付終了」）に戻るので、10/31 以降は 9 件・11/01 以降は 8 件…と減る（退行ではない）。詳細ページは revalidate 600 で、状態は締切翌日 0 時（JST）後の再生成で切り替わる（変更前からの挙動）。

## (3) 本番 curl

- push（`f2011af`）→ Vercel 完了 20:40（commit status success）。前: 補助金 20:25・用語集 20:34、後: 補助金 20:41・用語集 20:42 に素URL で取得（クエリ無し・キャッシュ回避ヘッダ無し・初期DOM＝script 外・`<!-- -->` 除去）。

| 確認 | 期待（便 §3） | 前 | 後 |
|---|---|---|---|
| 10 件の `<title>` | 全部「— 公募中」を含む | 10 件とも「— 公募中」なし | **10/10 が「— 公募中」を含み、(1) の表の「変更後」と逐語一致** |
| 78 件の `<title>` | 変わるのは 10 件だけ | — | 変わったのは 10 件だけ（集合が期待と一致）。68 件は前後で同一 |
| `/subsidies` | 78・「いま公募中」の並び不変 | 全 78 件 | 全 78 件・一覧の並び（78 slug の順）と「いま公募中」節の並びが前後で完全に一致 |
| `/subsidies/yamanashi-bess-2026` | （前便）受付終了のまま | — | title に状態なし（名称だけで 40 字超）・変化なし |
| `/glossary/substation` | 「8,352」0・「8,345」≥1 | 8,352 が 2・8,345 が 1（`HIT`・age 2,086） | **8,352 が 0・8,345 が 3**（`PRERENDER`・age 0）。8,225 は 3 のまま（Ck2e） |
| 用語集の 73 slug | 件数表記が同じ出どころに揃う | 8,352 を含むページ 67・約791件 2 | **8,352 を含むページ 0**・8,345 を含むページ 69・約790件 2・約791件 0 |
| `/grid` | （参照）8,345 | 8,345 が 4 | 8,345 が 4 |

- `x-vercel-cache`／`age`（後）: 補助金 78 ページは全部 `PRERENDER`／`0`。用語集 73 ページは `PRERENDER` 68・`HIT` 5（いずれも新しい内容）。前の取得では補助金 4 ページが `STALE`（occto-ltdc-2026・meti-battery-supply-plan-certification・occto-ltdc-2025・yamanashi-bess-2026、age 1,481〜3,281・旧デプロイ内の ISR）。
- 用語集 73 slug のうち 4 つ（chikudensho・re100-japan・renewable-special-law・renewable-surcharge）は 301 の移動元（`src/lib/glossary-301.ts`）で、生成データにはあるが表示されない（前後とも件数表記 0）。表示される 69 ページはすべて「8,345」を含み、「8,352」は 0。

## (4) ユウの前提違い（逐語）

1. §2「microCMS 本文の「8,225」3 か所は Ck2e の対象」→ `/glossary/substation` の「8,225」3 か所は**用語集の本文ではなく、関連解説カード**（explainer `substation-availability-cross-area-analysis` の title「…統合DB（10社8,225件）…」1 か所と lead「8,225件（2026年6月時点の集計。現在は関東を含む10社・8,225変電所を収録）…N-1電制適用可は約535件」2 か所）。このカードは用語集の 14 ページに出る（n-1-densei・non-firm-detail・non-firm-connection・substation・grid-available-capacity ほか）。Ck2e で直す先は glossary ではなくこの explainer の title・lead。lead の「現在は…8,225」は時点が曖昧な書き方（#123）でもある。
2. §2「他の glossary ページの件数表記も同じ出どころに揃う」→ 1 か所だけ揃わない: `/glossary/non-firm-connection` の本文「N-1電制適用可（ノンファーム接続候補）の変電所を含む全国9社・約536件の N-1電制可データを統合提供」。置換表（2026-07-06 からの完全一致）の言い回しと違うため、変更の前も後も当たらない（前は 536 と 791、後は 536 と 790 が同じブロックに並ぶ）。同じ文が N-1 電制を「ノンファーム接続候補」と言い換えている（N1b で /grid から外した混同）ので、数字だけ置換せず、**Ck2e で本文ごと書き直す**のが妥当と判断して、この便では置換を足していない。

## (5) 申告

- **push 前の独立レビュー**: Workflow で読取専用のサブエージェント 6 体（title・glossary・回帰の 3 観点のレビュー＋medium 所見 3 件の反証）。この差分の不具合は 0 件。medium の 3 件（トップの件数・non-firm-connection の 536 ×2）は、反証役が「差分の範囲外・変更前から」と判定（(6) に記載）。サブエージェントは scratchpad `…\scratchpad\ck2d-add\` に `wf_*` の一時ファイル（tsx スクリプト・ログ・HTML の写し）を作った。消していない。
- **レビュー後に 2 点を足した**（push 前）: 社数で「その他」を数えない・N-1 件数を桁区切りに。足したあとで用語集の生成物を作り直し、直前の出力と**バイト単位で同一**を確認（全体のビルドは足す前に実行して EXIT 0・5,576 ページ）。
- `loadGridStats` のコメントで、prebuild の順序による遅れ（下の (6)-2）を書いた。
- microCMS: GET のみ（title の前後表で subsidies を 1 回・ビルドの prebuild）。書込 0。
- `src/data/substations/*.json`（ビルドで再生成）は前便と同じく commit していない。
- scratchpad の一時物（消していない）: subsidies-meta_before.ts・precompute-glossary-detail_before.ts・title_test.ts・title_test_out.json・glossary-detail-index_before.json・glossary-detail-index_after1.json・glossary_changed_slugs.json・prod_titles.py・prod_titles_before/after.json・prod_glossary.py・prod_glossary_before/after.json・build_full.log・build_glossary_detail.log・build_glossary_detail2.log。

## (6) 範囲外の所見（レビューで見つかったもの・提案のみ・この便では触っていない）

1. **トップページの変電所件数が 8,352 のまま**（本番 `/` で 3 か所:「変電所 8,352件/10社」「全国10社・8,352件の予想潮流…」「(8,352件DB)」）。`src/app/page.tsx` が runtime に microCMS の `totalCount`（凍結込み）を取っているため（revalidate 60）。`/grid` は 8,345。#121 と同じ型。提案: `summary.total` を読む形に（runtime の microCMS リクエストも 1 つ減る）。
2. **prebuild の順序による遅れ**: `build:glossary-detail` は `build:substations` より先に走るので、Vercel では**コミット済みの** index.json を読む。再取込や凍結の追加で件数が変わってから index.json をコミットするまで、用語集の件数は何回ビルドしても旧いまま（/grid・用語集ページ下部の節は新しい値）。旧実装も同じ構造で、この便で悪化はしていない。提案: package.json の prebuild で `build:glossary-detail` を `build:substations` の後ろへ移す（glossary-detail が読む生成物は build:news-topic-gate の出力だけで、移しても依存は壊れない）。次の BS+BT 便（四国・沖縄の再取込）で件数が動くので、その前が望ましい。
3. **県ページの meta と系統連系チェッカーのプルダウンが凍結込みの件数**: `/grid/prefecture/静岡県` の meta description「…変電所252件…」と h1「静岡県の変電所一覧（251件）」が同じページで食い違う（`pref_meta.count`・`by_pref` が県別 JSON の行数＝凍結込み）。チェッカーのプルダウンは「unknown (1,880 件)」も出している。
4. **`/reports/2026`** は件数を現行値（8,345）で出しつつ「9送配電エリア」を焼き込んでいる。`/tracker/grid` は「8345 件」（桁区切りなし）。
5. **`nedo-koubo-list`** の title に「— 公募中」が付くが、本文の状態バッジは hasNoSchedule で消している（変更前から・この差分の分岐は通らない）。
6. 用語集の導線ブロックに焼き込まれた「中部地方マップ（…1,081マーカー／1,081箇所）」は、index.json の座標あり 1,082 と 1 違う可能性（低確度・Ck2e で件数を本文から外すときに一緒に）。

