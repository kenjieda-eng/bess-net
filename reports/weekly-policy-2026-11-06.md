# 週次政策 2026-11-06 実施分 投入報告（policy-events POST 3・PATCH 5）

## (0) 読んだ原稿

| 種類 | 絶対パス | 最終更新 | sha256 |
|---|---|---|---|
| 原稿 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次政策_policy-calendar投入_2026-11-06.md` | 2026-11-06 11:52:39 JST | `09fd7a75489c071bb22ce977bb27ffa341e1b40d3f977db7ef0ce6cda72b86a7`（63,800 バイト） |
| 値の正 | 同フォルダの `週次政策_policy-calendar投入_2026-11-06.data.json` | 2026-11-06 11:52:39 JST | `413ffb3c82b2099a5cc9f79c3c2e205cc01ede69c4ac2f68b0c512df7d3a026e`（20,437 バイト） |

- OneDrive の正本を最後まで読んだ。リポ直下の `bess-net\03_5月13日朝_実行` ではない。
- **10/30 便の報告 `reports/weekly-policy-2026-10-30.md` はリポにある**（commit `b98bd9c`・30 分後の追記 `73f8fea`。`.data.json`・`.dry.json`・`.dry2.json`・`.apply.json` も同じ場所）。
- GO: `_QUEUE.md` 96 行目（EDAさん 11/6 11:22「流します」・ユウ 11/06 12:0x）。任意の 3 行（POST ③・PATCH D・E）は「任意は入れない」の指示が無いので、既定どおり投入した。
- 他の GO 便とは同時に走らせていない（GO はこの 1 本だけ。READY の 2 本は policy-events を触らない）。webhook は止めていない（書込 8 件）。
- **書込**: microCMS は policy-events の POST 3・PATCH 5 だけ（12:08:47〜12:09:05 JST）。DELETE・PUT 0。他のエンドポイント・スキーマは触っていない。
- **停止条件**: rm 系・push --force・.env の表示は、どれも 0。PDF は curl で取った（内蔵ブラウザ・Claude in Chrome・調べ役は使っていない）。

## 結論

- **POST 3**（skip 0・中止 0）。送ったあと 1 件ずつ GET し、全項目が送信値どおり（#106）。
- **PATCH 5**（skip 0・中止 0）。
  - 書く前の GET で、5 件とも id・updatedAt・status・sourceUrl・description の字数・title（A・B）が原稿の期待値と一致した。
  - **現在値が期待値と違う行は 0**。
  - 送った欄は送信値どおり、他の欄の変化は 0（#106／#122）。
- 原稿からの変更点は 2（一次の逐語への是正・(2)）。「…時点」の日付は 3 か所とも原稿のまま（実行日も 11/6・(2)）。
- 冪等: 同じ便を dry run で流し直して skip 8（POST 3 は slug 既存・PATCH 5 は全項目が適用済み）。
- policy-events の総件数: **149 → 152**（kind 未設定 101→104・業界 48）＝原稿の期待どおり。
- 本番の `/policy-calendar`（12:15・素の URL・HIT・age 49）: JSON-LD numberOfItems **91 → 94**（原稿の期待どおり）。

## (1) 事前の確認（12:04〜12:08）

- **重複（#87）**: 全件 GET（12:08）で 149 件（kind 未設定 101・業界 48）＝10/30 便の期待値と同じ。
  - (a) POST の 3 slug はどれも不存在。
  - (b) title の語は、どれも 0 件（公開ページに出ない kind 未設定の 10 件も含めた全件で見た）。
    - 「第26回」＋「同時市場」
    - 「第7回」＋「基盤構築小委員会」
    - 「195260077」
    - 「施行規則」＋「廃棄物」
  - (c) PATCH の 5 件は、slug から引いた id が原稿の id と一致。updatedAt・status・sourceUrl・description の字数・title（A・B）も、原稿の期待値と全部一致した:

| 行 | slug | id | updatedAt | status | 字数 |
|---|---|---|---|---|---:|
| A | `egc-seido-kanshi-25-2026-10` | `dv1ilddgxfxh` | 2026-10-30T03:48:20.289Z | 予定 | 437 |
| B | `occto-balancing-committee-64-2026-11` | `m417bjl3j` | 2026-10-30T03:48:12.961Z | 予定 | 484 |
| C | `occto-chousei-iinkai-122-hokan-auction-2026-09` | `u63xq484k` | 2026-10-10T02:48:26.272Z | 終了 | 517 |
| D | `occto-teikan-kitei-henkou-pubcomm-2026-09` | `6i1u2sgun-k4` | 2026-10-10T02:48:35.313Z | 終了 | 709 |
| E | `meti-doji-shijo-kentoukai-25-2026-09` | `lkuuuf36h` | 2026-09-25T01:38:33.748Z | 終了 | 446 |

- **select（#106）**: eventType・status・category は v4 スキーマの選択肢に実在し、配列で送った。kind・relatedTopics・eventTopics は `[]`。endDate は ③ だけ。registrationDeadline は送っていない。
- **sourceUrl の生死**（12:04・Chrome の UA の curl・本文で目視）: どれも 200。METI の 202 の空応答は無かった（1 回目で本文）。

| 行 | URL | 本文で見た語 |
|---|---|---|
| ① | `meti.go.jp/shingikai/information/2026/20261109_2k.html` | title「第26回 同時市場の在り方等に関する検討会」・「2026年11月9日」・「15時00分」「18時00分」・議題 3 件・「最終更新日：2026年11月2日」 |
| ② | `meti.go.jp/shingikai/information/2026/20261110_3k.html` | title「…第7回次世代電力・ガス事業基盤構築小委員会（開催案内）」・「2026年11月10日」・「オンライン」・「改正電気事業法について」・「最終更新日：2026年11月4日」 |
| ③ | e-Gov `…PCMMSTDETAIL&id=195260077…` | 「195260077」・省令の題名・「2026年11月4日」・「2026年12月4日」・「募集中」 |
| A（新） | `egc.meti.go.jp/activity/emsc_systemsurveillance/025_haifu.html` | title「制度設計・監視専門会合（第25回）‐配布資料」・資料1〜5・「※2026年10月30日18:00現在、資料4、P12一部修正が発生したため差し替え」・「最終更新日：2026年10月30日」 |

- **引用の照合**（便の値は原稿で機械照合済みだが、書く前に一次で確かめ直した）:
  - POST の「」16 か所と PATCH A〜E の追加文の「」18 か所（A 8・B 5・C 2・D 3・E 0）を、一次の HTML と PDF（curl で取得）の本文で探した。全部見つかった。
    - POST ③ の政令案の題名は 195260074 の案件詳細で確認。
    - PDF は pdfplumber の文字の並びで照合した。
  - PATCH の追加文の数値・日付も一次にある（B の 5,320・4,999・669・908 は資料2 p.7・p.20 の表の値、単位は表の（MW））。
  - 違ったのは (2) の 2 点。

## (2) 原稿からの変更点（逐語）

当てた写し: `reports/weekly-policy-2026-11-06.data.json`（`meta._run_note` に記録）。

1. **PATCH A の置換 2 の置換後の文**: 「**配付**資料（資料1 議事次第、…）は電力・ガス取引監視等委員会の**配付**資料ページに掲載された」→「**配布**資料（資料1 議事次第、…）は電力・ガス取引監視等委員会の**配布**資料ページに掲載された」。
   - 理由: 監視等委のページの表記は「制度設計・監視専門会合（第25回）‐配布資料」で、ページ内に「配付」は 0 回。既登録の第24回（`egc-seido-kanshi-24-2026-09`）の文も「配布資料」。
   - 字数は変わらない（1,074 字）。
   - 範囲の外の既存の文「関連政策ページとして第25回 制度設計・監視専門会合配付資料のページを案内している」は、METI の開催案内のリンクの表記を写した文なので触っていない。
2. **PATCH C の置換後の文の引用**: 「「**FIP 発電事業者**やアグリゲーター、蓄電池事業者等」」→「「**FIP発電事業者**やアグリゲーター、蓄電池事業者等」」。
   - 理由: 議事録 PDF（`chousei_122_gijiroku.pdf` p.8）の字の並びに空白は無い（pdfplumber の文字単位で「P」の次が「発」）。pdftotext（原稿の照合に使った道具）は、P と 発 の字間 2.5pt から半角空白を補って出す。
   - 置換後の字数 676 → **675**。
3. **「…時点」の日付（3 か所）は変えていない**。実行日も 2026-11-06 で、12:04 に次のとおりだった:
   - ① の委員会の一覧（`doji_shijo_kento/index.html`）の回のページは 025 まで（第26回は無い）。
   - ② の一覧（`jisedai_kiban/index.html`）は 006 まで（第7回は無い）。
   - OCCTO `64.html` に「録画」「議事録」の語は 0（更新日：2026年11月04日）。
   - よって ①②の「配布資料は2026年11月6日時点で未掲載（開催案内のみ）。」と、PATCH B の「録画・議事録は2026年11月6日時点で未掲載。」は原稿のまま。
- status: ①②は `["予定"]` のまま送った（実行日は開催日より前）。③は `["進行中"]`。
- ほかは原稿の JSON の値のまま。

## (3) 投入（12:08:47〜12:09:05 JST）

`npx tsx scripts/post-policy-events-2026-11-06.ts --apply --log=reports/weekly-policy-2026-11-06.apply.json`

| 行 | slug | 結果 |
|---|---|---|
| POST ① | `meti-doji-shijo-kentoukai-26-2026-11` | id `l66j-l5u3`（createdAt 2026-11-06T03:08:50Z）・全 12 field 一致 |
| POST ② | `meti-jisedai-kiban-shoiinkai-7-2026-11` | id `3gsrcm86dr`（03:08:52Z）・全 12 field 一致 |
| POST ③（任意） | `egov-haikibutsu-kisoku-lithium-chikudenchi-pubcomm-2026-11` | id `swi36e2d_vsk`（03:08:54Z）・全 13 field 一致（endDate 2026-12-03 を含む） |
| PATCH A | `egc-seido-kanshi-25-2026-10` | status 予定→終了・sourceUrl → egc の `025_haifu.html`・description 437→1,074 字（置換 2） |
| PATCH B | `occto-balancing-committee-64-2026-11` | status 予定→終了・description 484→961 字（置換 2） |
| PATCH C | `occto-chousei-iinkai-122-hokan-auction-2026-09` | description 517→675 字（置換 1） |
| PATCH D（任意） | `occto-teikan-kitei-henkou-pubcomm-2026-09` | description 709→771 字（置換 1） |
| PATCH E（任意） | `meti-doji-shijo-kentoukai-25-2026-09` | description 446→480 字（置換 2） |

- 置換元は、どれも description 内にちょうど 1 回だった。置換後の字数は原稿の `_afterLen` と一致（C は (2) の是正で 675）。
- PATCH は送った欄が送信値どおり、他の欄の変化 0（#106／#122）。
- 呼び出し: GET 25・POST 3・PATCH 5。
- 書く前の dry run（12:08:16）: POST 3・PATCH 5・中止 0（`reports/weekly-policy-2026-11-06.dry.json`）。
- **流し直しの dry run**: skip 8・中止 0（`reports/weekly-policy-2026-11-06.dry2.json`）。
  - 1 回目の流し直しでは、POST の 3 行が skip でなく「中止」と出た。私が足した title の語の重複確認が、作ったばかりのレコード自身を数えたため（書込は無い dry run）。
  - 同じ slug を重複に数えないように直して、もう一度流した結果が skip 8。

**置換の範囲の外に残る、時点の古い言い回し（書き換えていない・申告）**:
- PATCH B の既存の文「**予定議題は**「需給調整市場前日取引化後の市場外調整力の状況等について（その２）」の1件で…」（開催前の言い方）。
- PATCH D の既存の文「上位法令の意見公募は**今後**資源エネルギー庁が別途実施**予定**。」（11/6 時点でそうなっているかは確かめていない）。
- 11/13 便か 12/1 の月次で見てもらう必要がある。

## (4) 本番の確認

- 書込 8 件の webhook でビルドが 8 本並んだ（12:09 時点で 1 本ビルド中・7 本待ち）。私の push（`29de94c`・12:14）でもう 1 本。
- `/policy-calendar` は revalidate 600 で、デプロイを待たずに入れ替わった。
  - 12:14:30 の素の URL は STALE・age 851 で旧い内容（91 件）。裏の作り直しが始まった印。
  - 12:15:10 から新しい内容。
- **1 回目**（12:15:20・素の URL・HTTP 200・x-vercel-cache **HIT**・age **49**）:
  - JSON-LD numberOfItems **94**（91 → 94＝原稿の期待どおり・任意 POST を含む）。
  - POST ①②③ の title が、見える本文に 1 回ずつ・埋め込みに 2 回ずつある。
  - PATCH A〜E の置換後の文（8 本）は、見える本文と埋め込みの両方に文字どおりある。
  - PATCH A は、出典リンクが `https://www.egc.meti.go.jp/activity/emsc_systemsurveillance/025_haifu.html`（href 1）で、旧の `20261030_4k.html` は 0。表示は「終了」。
- **30 分後の再確認**: (5) に追記する。

## (5) 30 分後の監視

- **12:43:33**（1 回目の 28 分後・素の URL）: HTTP 200・x-vercel-cache **HIT**・age **431**（12:36 ごろの描画）。
  - JSON-LD numberOfItems **94**（不変）。POST ①〜③ の title は 3 件ともある。
  - PATCH A〜E の置換後の文と、A の出典リンクは 1 回目と同じ。
- Vercel のデプロイ:
  - 書込の webhook の 1 本目（`bess-jg1kslgrr`）と、push のデプロイ（`bess-dhcr70itj`・ビルド 7 分）が **Ready**。
  - 間の 7 本は自動で Canceled（いつもどおり）。
  - Error になったデプロイは 0。
- Vercel のエラー率の画面と microCMS の警告メールは、CC からは見られない（EDAさん・ユウの側で見てもらう必要がある）。

## (6) 申告・一時物

- スクリプト `scripts/post-policy-events-2026-11-06.ts` は、`post-policy-events-2026-10-30.ts` を写して次を変えた:
  1. updatedAt も期待値に含め、違えば中止する（10/30 版は updatedAt が違っても値で照合して進んでいた）。
  2. 字数の照合を常に行う。
  3. title の語の重複確認を全件 GET の中で行う（同じ slug は数えない）。
  4. 置換後の全文をログに出す。
  - 既定 dry run・`--apply`・`--skip-optional` は 10/30 版と同じ。
- 訂正履歴は足していない（週次の追加・結果の反映）。
- 使った道具: curl（一次・本番）・Python（照合・pdfplumber・pdftotext）・tsx（投入）・Vercel CLI。
- 一時物（消していない）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\wp\`
  - 一次: `live\`（取得した HTML 11 本）・`pdf\`（PDF 7 本と pdftotext の出力 2 本）
  - 道具: `make_script.py`・`check_live.py`・`check_quotes.py`・`check_two.py`・`check_post3.py`・`apply_corrections.py`・`prod_check.py`
  - ログ: `dry.log`・`apply.log`・`dry2.log`・`dry3.log`・`build.log`・`prod1.txt`
- ローカルのビルド（12:10〜12:14・228 秒）: PASS・★WARN 0。tsc 0。
