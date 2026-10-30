# 週次政策 2026-10-30 実施分 投入報告（policy-events POST 7・PATCH 6）

## (0) 読んだ原稿

| 種類 | 絶対パス | 最終更新 | sha256 |
|---|---|---|---|
| 原稿 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次政策_policy-calendar投入_2026-10-30.md` | 2026-10-30 11:42:45 JST | `105c4c07ff90a5fe042b46142e2ea1232ae26dcdee13d1cb808c569dc1b0341e`（66,688 バイト） |
| 値の正 | 同フォルダの `週次政策_policy-calendar投入_2026-10-30.data.json` | 2026-10-30 11:42:46 JST | `b23e43ac72bd3a208c0dbf408e978666fe5c5a7bb033d46000b902f0f77eee0a` |

- OneDrive の正本を読んだ。リポ直下の `bess-net\03_5月13日朝_実行` ではない。
- GO: EDAさん 10/30「`03_5月13日朝_実行` の `週次政策_policy-calendar投入_2026-10-30.md` を読んで実行して」。原稿 §0 の判断のうち、任意の 2 行には指示が無かったので、既定どおり投入した。
- `_QUEUE.md` にこの便の行は無いので、触っていない。
- 他の GO 便とは同時に走らせていない（直前の BU・BV 本実行便は 12:44 に終わった後）。webhook は止めていない（書込 13 件）。
- **書込**: microCMS は policy-events の POST 7・PATCH 6 だけ（12:48:09〜12:48:37 JST）。DELETE・PUT 0。他のエンドポイント・スキーマは触っていない。
- **停止条件**: rm 系・push --force・.env の表示は、どれも 0。PDF は取っていない。ブラウザ・Claude in Chrome・調べ役は使っていない。

## 結論

- **POST 7**（skip 0）。
  - 送ったあと全件 GET し、全項目が送信値どおり（#106）。日付は日付の部分で比べた。
  - 任意の ⑦（e-Gov 195260074）も入れた。
- **PATCH 6**（skip 0）。
  - 送った欄は送信値どおり、他の欄の変化は 0（#106／#122）。
  - 任意の F も入れた。
- 冪等: 同じ便を dry run で流し直して skip 13（POST 7 は slug 既存・PATCH 6 は全項目が適用済み）。
- policy-events の総件数: **142 → 149**（kind 未設定 94→101・業界 48）。原稿の期待どおり。
- 本番: (4)。

## (1) 事前の確認（12:46〜12:47）

- **重複（#87）**: 全件 GET（12:47）で 142 件（kind 未設定 94・業界 48）＝原稿の 11:13 と同じ。
  - (a) POST の 7 slug はどれも不存在。
  - (b) title の語「第64回」「第77回」「第123回」「第10回＋排出量取引」「第25回＋制度設計・監視専門会合」「新様式」「195260074」「廃棄物」は、どれも 0 件。
  - (c) PATCH の 6 件は、id・updatedAt とも原稿と一致。
- **select（#106）**: eventType・status・category は v4 スキーマの選択肢に実在し、配列で送った。kind・relatedTopics・eventTopics は `[]`。endDate は ⑦ だけ。registrationDeadline は送っていない。
- **sourceUrl の生死**（Chrome の UA の curl・本文で目視）: POST の 7 本と PATCH B の新しい sourceUrl は、どれも 200。

| 行 | URL | 本文で見た語 |
|---|---|---|
| ① | `occto.or.jp/iinkai/jukyuchousei/64.html` | title「第64回需給調整市場検討小委員会（第81回 調整力の細分化及び広域調達の技術的検討に関する作業会と合同開催）」・「2026年11月5日」・「16時～17時」・議題（その２）・「更新日：2026年10月29日」・**配布資料の語 0＝未掲載** |
| ② | `occto.or.jp/iinkai/youryou_kentoukai/77.html` | 「第７７回」・「開催済」・「2026年10月22日」・「発動指令電源」 |
| ③ | `occto.or.jp/iinkai/chousei_jukyu/123.html` | 「第123回」・「開催済」・「2026年10月26日」・「電力需給検証報告書」 |
| ④ | `meti.go.jp/…/emissions_trading/010.html` | title「第10回 … 排出量取引制度小委員会」・「2026年10月27日」・「資料3」・「バンキング」 |
| ⑤ | `meti.go.jp/shingikai/information/2026/20261030_4k.html` | title「第25回 制度設計・監視専門会合（開催案内）」・「2026年10月30日」・「15時00分～18時00分」・「需給調整の動向等について」 |
| ⑥ | `occto.or.jp/news/access_oshirase_2026_261029_1_1.html` | title「接続検討申込書の変更に伴う新様式の公開について」・「2026年10月29日」・「2026年11月」 |
| ⑦ | e-Gov `…PCMMSTDETAIL&id=195260074…` | 「195260074」・政令の題名・「2026年11月29日」・「募集中」 |
| B（新） | `meti.go.jp/…/chuchoki_torihiki/005.html` | title「… 中長期取引市場検討ワーキンググループ（第5回）」・「2026年10月20日」・「議事要旨」・「最終更新日：2026年10月28日」 |

- METI の 3 本は、1 回目で 200 と本文が返った（202 の空応答は無かった）。

## (2) 原稿からの変更点（逐語）

1. **⑤ `egc-seido-kanshi-25-2026-10` の status**: JSON の `["終了"]` → **`["予定"]`**。
   - 原稿 §2 の注記・§4「⑤の status は、実行日が 2026-10-30 なら ["予定"]」のとおり（実行日 2026-10-30）。
   - deriveDisplayStatus が 10/31 以降は「終了」に読み替える。
2. **① の description の末尾**「配布資料は2026年10月30日時点で未掲載（開催案内のみ）。」: **変えていない**。
   - 64.html を 12:47 に本文で見て、配布資料・資料の語は 0＝未掲載。実行日も 2026-10-30 なので、日付も同じ。
- ほかは原稿の JSON の値のまま（一次と食い違う箇所は見つからなかった）。
- 上の 1 を当てた写し: `reports/weekly-policy-2026-10-30.data.json`（`meta._run_note` に記録）。

## (3) 投入（12:48:09〜12:48:37）

| # | slug | id | 結果 |
|---|---|---|---|
| ① | occto-balancing-committee-64-2026-11 | m417bjl3j | POST ✓（全 12 field 一致）・status 予定・484 字 |
| ② | occto-capacity-kentoukai-77-2026-10 | 92bepjkx8q6 | POST ✓・終了・984 字 |
| ③ | occto-chousei-iinkai-123-jukyu-kensho-2026-10 | l721lxqff524 | POST ✓・終了・642 字 |
| ④ | meti-haishutsuryo-torihiki-shoiinkai-10-2026-10 | y702cen7hvd | POST ✓・終了・823 字 |
| ⑤ | egc-seido-kanshi-25-2026-10 | dv1ilddgxfxh | POST ✓・**予定**（(2)-1）・437 字 |
| ⑥ | occto-access-setsuzoku-kentou-shinyoushiki-tokko-2026-11 | 8gijsiiwmwg | POST ✓・終了・876 字 |
| ⑦ | egov-haikibutsu-shorei-lithium-chikudenchi-pubcomm-2026-10（任意） | pkl98i1pjdh | POST ✓（全 13 field 一致・endDate 2026-11-29）・進行中・691 字 |
| A | occto-capacity-manual-jitsujukyu-fy2027-pubcomm-2026-10 | 3apxmlozq-zm | PATCH ✓ status 進行中→終了・description 891→997 字（置換 1） |
| B | meti-chuchoki-market-wg5-2026-10 | 4g6ah3qtwbd | PATCH ✓ status 予定→終了・sourceUrl→005.html・title・description 430→790 字（置換 2） |
| C | meti-der-wg4-2026-10 | 9vchyg4h3k | PATCH ✓ description 1364→1353 字（会議体名「再生可能エネルギー主力電源化小委員会」） |
| D | meti-chuchoki-market-wg3-2026-08 | 273brdxbqin5 | PATCH ✓ title・description 195→290 字 |
| E | occto-saiene-kitei-henkou-pubcomm-2026-08 | 1188jc97rsd6 | PATCH ✓ description 356→417 字（置換 2） |
| F | occto-capacity-outage-plan-briefing-fy2028-2027-2026-09（任意） | 3m8y5vvxwn | PATCH ✓ description 640→744 字 |

```
[done] POST 7 / PATCH 6 / skip 0 / 中止 0 / 失敗 0
[microCMS 呼び出し] GET 36・POST 7・PATCH 6
[前] policy-events 全 142 件（kind 未設定 94・業界 48）
[後] policy-events 全 149 件（kind 未設定 101・業界 48）
冪等（reports/weekly-policy-2026-10-30.dry2.json）: POST 0 / PATCH 0 / skip 13
```

- 置換は、どれも置換元が description にちょうど 1 回だった。
- 記録: `reports/weekly-policy-2026-10-30.dry.json`（dry run）・`.apply.json`（本実行・各行の前後）・`.dry2.json`（冪等の確認）。
- スクリプト: `scripts/post-policy-events-2026-10-30.ts`（10-16 便と同じ型・既定 dry run・`--apply`・`--skip-optional`）。

## (4) 本番の確認

- 書込 13 件の webhook でビルドが 13 本並んだ。12 本は自動で Canceled になり、`ov2nxo346` が Ready（12:59・ビルド 8 分）。
- 13:00:11 に素の URL と `?v=` で `/policy-calendar` を取った（`<!-- -->` を剥がし、タグと空白を外して数えた）。
  - 素の URL: 200・HIT・age 18（デプロイの後）。`?v=` も 200・HIT・age 18。
  - JSON-LD numberOfItems **91**（84 → 91＝原稿の期待どおり・任意 POST を含む）。

| 確認 | 結果 |
|---|---|
| POST ①〜⑦ の title | 7 件とも表示あり |
| PATCH A | 置換後の文（「意見募集は2026年10月26日に終了した…」）あり・カードの状態の表示は「終了」 |
| PATCH B | 新しい title あり・旧い title 0・出典リンクが `chuchoki_torihiki/005.html`・置換 1・2 の後の文あり・置換 1 の前の文 0・状態は「終了」 |
| PATCH C | 置換後の文（「再生可能エネルギー主力電源化小委員会／」）あり（下の注） |
| PATCH D | 新しい title あり・旧い title 0・置換後の文あり・前の文 0 |
| PATCH E | 置換 1・2 の後の文あり・前の文 0 |
| PATCH F | 置換後の文あり・前の文 0 |
| ①・⑤・⑦ の状態 | ①「予定」・⑤「予定」（10/31 から deriveDisplayStatus で「終了」）・⑦「進行中」 |

- **注（PATCH C）**: 照合の初回は「置換元（再生可能エネルギー大量導入・次世代電力ネットワーク小委員会／）がページに残る」と出た。
  - 出どころは別のレコード `meti-grid-wg11-bess-connection-2026-06`（第11回 次世代電力系統WG・2026年6月10日開催）の description で、PATCH C の対象ではない。
  - C 自身の description は、microCMS の GET で旧い会議体名 0・新しい会議体名 1。
  - 第11回の記述（6 月時点の会議体名）が正しいかは本便の範囲外。確かめていない。
- **30 分後の再確認**（13:29:35・素の URL）: 200・HIT・age 386。
  - 本番は `kv42g5dis`（この報告の push〔b98bd9c〕のビルド・Ready 13:1x）。
  - numberOfItems **91**（不変）。POST ①〜⑦ の title は 7 件ともあり。PATCH A〜F の結果は 1 回目と同じ。
  - C の「前の文」は、上の注の別レコード（第11回 次世代電力系統WG）のもの。
  - Vercel の新しいデプロイ 2 本はどちらも Ready（エラーは出ていない）。
  - microCMS の警告メールは、私からは見えない（EDAさんの受信箱）。

## (5) 申告・一時物

- 使った道具: curl（sourceUrl・本番）・Python（重複の確認・本番の照合）・tsx（投入）・Vercel CLI。内蔵ブラウザ・Claude in Chrome・調べ役は使っていない。
- 一時物（scratchpad の `wp/`・消していない）: `src1.html`〜`src8.html`（sourceUrl の本文の控え）・`check_src.py`・`check.txt`・`prod_pc.py`。
- 次回（11/6 便）への持ち越しは原稿 §6 のとおり（⑤の配付資料と sourceUrl の差し替え・①の結果・000773 の結果公表 ほか）。本便では触っていない。
