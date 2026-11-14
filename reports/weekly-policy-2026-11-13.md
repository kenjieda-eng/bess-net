# 週次政策 2026-11-13 — policy-events 投入の報告（2026-11-13・CC）

microCMS の書込は policy-events の **POST 1 件・PATCH 6 件**（DELETE・PUT 0・ほかのエンドポイント 0）。
**POST ①・PATCH A・PATCH B の 3 行は書いていない**（出典の METI のページを WebFetch で読めなかった＝原稿 §4 手順 3 のとおり。下の「書かなかった行」）。

## (0) 読んだ原稿

- `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次政策_policy-calendar投入_2026-11-13.md`（66,027 バイト・最終更新 2026-11-13 15:11:43 JST）
- `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次政策_policy-calendar投入_2026-11-13.data.json`（21,086 バイト・最終更新 15:11:43 JST）
  - sha256 の先頭 16 桁 **`bf5d8b1fe585f995`**（原稿の値と一致＝ユウが 11/13 15 時台に直した版）。OneDrive の正本（リポ直下の同名フォルダではない）。
  - リポに `reports/weekly-policy-2026-11-13.data.json` として写した（値は変えていない）。
- GO: `_QUEUE.md` 111 行目（ユウ 11/13 15:2x）。110 行（週次ニュース便）が終わってから流した（同時に走らせていない）。
- スクリプト: `scripts/post-policy-events-2026-11-13.ts`（11/6 版と同型。既定 dry run・本実行は `--apply`・`--skip-optional`。この便で **`--exclude=①,A,B`**〔一次を読めなかった行を書かない〕を足した）。
- 実行: dry run（全 10 行・GET のみ・15:4x）→ dry run（7 行）→ **本実行 15:49:11〜15:49:29 JST**（`--apply --exclude=①,A,B`）。記録 `reports/weekly-policy-2026-11-13.dry.json`（全 10 行の dry run）・`reports/weekly-policy-2026-11-13.apply.json`。
- webhook は止めていない（書込 7 件）。

## POST（2 件のうち 1 件・skip 1）

| 行 | slug | 結果 |
|---|---|---|
| ①（★★） | `meti-electric-power-wg5-2026-11` | **書いていない**（出典 `https://www.meti.go.jp/shingikai/information/2026/20261118_3k.html` を WebFetch で 2 回取って 2 回とも HTTP 403。委員会の一覧 `…/electric_power_wg/index.html` も 403 で、「第5回のページが有るか」も確かめられなかった） |
| ②（★★・任意） | `egov-kikenbutsu-kisoku-lithium-chikudenchi-pubcomm-2026-11` | **POST**（id `1i6ifr77h75`・#106 全 13 field 一致）。一次: e-Gov 860202606 を WebFetch で読んだ＝「募集中」・案の公示日 2026年11月7日・受付開始 2026年11月7日0時0分・受付締切 2026年12月7日23時59分・問合せ先 総務省消防庁予防課危険物保安室 |

- 事前の重複確認（#87・全件 GET）: 2 slug とも無い。title の語「第5回」＋「電力事業環境整備」0 件・「860202606」0 件・「危険物」0 件（公開ページに出ない kind 未設定のレコードを含む全件で見た）。

## PATCH（8 件のうち 6 件・skip 2）

| 行 | slug（id） | 結果 |
|---|---|---|
| A（★★） | `meti-doji-shijo-kentoukai-26-2026-11`（`l66j-l5u3`） | **書いていない**（新しい出典 `https://www.meti.go.jp/shingikai/energy_environment/doji_shijo_kento/026.html` が WebFetch で 2 回とも 403） |
| B（★★） | `meti-jisedai-kiban-shoiinkai-7-2026-11`（`3gsrcm86dr`） | **書いていない**（新しい出典 `…/jisedai_kiban/007.html` が WebFetch で 403） |
| C（★★★） | `meti-der-wg4-2026-10`（`9vchyg4h3k`） | **PATCH**（description 1353→1643 字＝原稿の `_afterLen` と一致・他 field 変化 0） |
| D（★★） | `egov-keitou-renkei-gijutsu-youken-gl-pubcomm-2026-10`（`xr9b7urq09`） | **PATCH**（status 進行中→終了・description 547→575 字・一致） |
| E（★★） | `egov-denjiho-kaisei-sekou-seirei-pubcomm-2026-10`（`k4b614rqha`） | **PATCH**（status 進行中→終了・description 647→675 字・一致） |
| F（任意） | `occto-balancing-committee-64-2026-11`（`m417bjl3j`） | **PATCH**（置換 3・description 961→963 字・一致） |
| G（任意） | `occto-teikan-kitei-henkou-pubcomm-2026-09`（`6i1u2sgun-k4`） | **PATCH**（description 771→991 字・一致） |
| H（任意） | `meti-electric-power-wg4-2026-09`（`gpdmg43hfw`） | **PATCH**（description 532→593 字・一致） |

- 8 件とも、slug から解決した id は原稿の id と一致。updatedAt・status・sourceUrl・description の文字数・置換元の出現回数（各ちょうど 1 回）も、8 件とも原稿の期待値どおり（**A・B を含む全 10 行の dry run で中止 0**＝A・B・① は、出典を読めれば原稿のまま入れられる状態）。
- PATCH C の description は microCMS の実値でも 1,353 字（公開データの復元値と一致）。
- 投入後の GET 照合（#106／#122）: 6 件とも送信した field が一致・送っていない field の変化 0。

### 書かなかった行（POST ①・PATCH A・PATCH B）

- 原稿 §4 手順 3: 「WebFetch で本文目視（素の curl は METI・e-Gov とも 403 が返る。ブラウザのふりをする UA は使わない。**WebFetch で読めなければ、読めなかったと報告して、その行は書かない**。」のとおりにした。
- 15:4x に WebFetch で METI の 4 ページ（開催案内 20261118_3k・委員会一覧 electric_power_wg/index・026.html・007.html）を取ったところ、4 本とも HTTP 403。開催案内と 026.html は取り直しても 403。e-Gov（860202606）は WebFetch で読めた。
- ① は 11/18（水）11時の開催で、原稿の期限は **11/17（火）の夕方**。METI のページを読める方法（WebFetch の取り直し・ブラウザで本文を読む〔本文の HTML だけ・PDF は開かない〕など）をユウか EDAさんが決めれば、同じスクリプトで `--exclude` を外して ①・A・B だけを流せる（ほかの 7 行は適用済み＝冪等で skip）。
- PATCH H（任意・第4回の議事録の掲載と「第5回は2026年11月18日に開催予定」）は手順 3 の確認の対象外なので、原稿どおり入れた。

## 原稿からの変更点

- **値の変更 0**（`.data.json` のまま送った）。
- 「…時点」の日付の置き換え（原稿 §4）:
  - PATCH F の「録画・議事録は2026年11月13日時点で未掲載。」: OCCTO の `64.html` を素の curl で取って本文を見た（HTTP 200・更新日 2026年11月04日・「録画」「議事録」の語なし）＝未掲載。実行日も 2026-11-13 なので、**原稿のまま**。
  - POST ① の「配布資料は2026年11月13日時点で未掲載」: ① を書いていないので置き換えなし（委員会の一覧も 403 で読めなかった）。

## policy-events の総件数

- 前 **152 件**（kind 未設定 104・業界 48）＝原稿の期待どおり → 後 **153 件**（kind 未設定 105・業界 48）。
- 原稿の期待は全部入れたとき 154（任意の POST を外したとき 153）。今回は ① を書かず ② を入れたので 153。

## 本番（素の URL・cb なし）

| 時刻（JST） | URL | HTTP | x-vercel-cache | age | 確認 |
|---|---|---|---|---|---|
| 15:59:32 | `/policy-calendar` | 200 | PRERENDER | 0 | JSON-LD numberOfItems **95**（94＋②）・② の title が見える文字にある・PATCH C〜H の置換後の文が 6 件とも見える文字にある・①の title と A・B の置換後の文は無い（書いていないため） |

- 書込の後の webhook ビルド: `/build-info.json` の `builtAt` 2026-11-13T15:54:59+09:00（前は 15:36:47＝週次ニュース便の分）。
- PATCH D・E の status「終了」は、レコードの値（GET で確かめた）。

### 30 分監視（鉄則 #5）

| 時刻（JST） | URL | HTTP | x-vercel-cache | age | 確認 |
|---|---|---|---|---|---|
| 16:29:42 | `/policy-calendar` | 200 | HIT | 480 | numberOfItems 95・② の title と PATCH C〜H の置換後の文はそのまま（15:59 と同じ）。`builtAt` は 15:54:59 のまま＝その後のビルドなし |

- 30 分の間に取った本番のページは全部 200。Vercel の管理画面のエラー率は見ていない（CLI で見られる記録が無い）。microCMS の警告メールの有無は EDAさんの受信箱で（CC からは見えない）。

## 申告

- METI のページは WebFetch で 403 だった（ユウの 11/13 の確認では WebFetch で読めていた）。素の curl・ブラウザのふりをする UA は使っていない。内蔵ブラウザ・Chrome も使っていない（原稿の指示が WebFetch のため）。
- 一時物（リポの外・消していない）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\wp1113\`（`occto64.html`・`pc.html`・`prod.py`・`prod_a.json`・`prod_b.json`）。
- 作業前からある未コミットの差分（`src/data/substations/*.json`・`scripts/experimental/operators/alias-expansion-report.json`）は commit に入れていない。
- microCMS の書込は policy-events の POST 1・PATCH 6 だけ。rm／Remove-Item・`git push --force`・`.env` の表示はしていない。

---

# 追い便（2026-11-14・`_QUEUE.md` 112 行）— 経産省が出典の 3 行（POST ①・PATCH A・PATCH B）

microCMS の書込は policy-events の **POST 1 件（①）・PATCH 2 件（A・B）だけ**（DELETE・PUT 0・ほかのエンドポイント 0・②と C〜H は触っていない）。webhook は止めていない（書込 3 件）。

## ■0 申告

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次政策の追い便_2026-11-13_経産省が出典の3行（POST①・PATCH_A・B）_Claude_Code投入_ユウ.md`（12,910 バイト・最終更新 2026-11-14 09:26:24 JST）
- 原稿: 同じフォルダの `週次政策_policy-calendar投入_2026-11-13.md`（66,027 バイト・最終更新 2026-11-13 15:11:43 JST）
- 値: 同じフォルダの `週次政策_policy-calendar投入_2026-11-13.data.json`（21,086 バイト・最終更新 2026-11-13 15:11:43 JST）
  - sha256 の先頭 16 桁 **`bf5d8b1fe585f995`**（便の値と一致）。リポの写し `reports/weekly-policy-2026-11-13.data.json` も同じ sha256（値は変えていない）。
- 実行開始 **2026-11-14 09:35:25 JST**・main の HEAD **`ed4dfb5`**（origin/main と同じ）。
- GO: `_QUEUE.md` 112 行（ユウ 11/14 09:3x）。ほかの GO 便は無い（同時に走らせていない）。1 便 1 回（本実行は 1 回だけ）。

## ■1 出典

- CC は経産省のページを取りに行っていない（WebFetch・curl・ブラウザとも）。便の ■1（ユウが 11/13 15:0x・16:1x と 11/14 09:2x に WebFetch で読んだ一覧）を、111 行の手順 3（sourceUrl の本文目視）の代わりにした。

## スクリプト

- `scripts/post-policy-events-2026-11-13.ts`（111 行と同じ）に 2 つ足した（ほかの動きは変えていない）:
  - `--only=①,A,B`: この行だけを対象にする（原稿に無い行名なら中止）。
  - `--asof=YYYY-MM-DD`: POST ① の description の「配布資料は2026年11月13日時点で未掲載（開催案内のみ）。」を、その日付に置き換えて送る。**実行日（JST）が指定日と違えば ① は書かずに中止**・置換元がちょうど 1 回のときだけ置換。JSON は書き換えない（便の ■2）。
- 実行: dry run 09:35〜09:36（GET 7・中止 0）→ **本実行 09:36:39〜09:36:50 JST**（`--only=①,A,B --asof=2026-11-14 --apply`）。記録 `reports/weekly-policy-2026-11-14-oi.dry.json`・`reports/weekly-policy-2026-11-14-oi.apply.json`。microCMS の呼び出しは本実行で GET 12・POST 1・PATCH 2。

## 事前確認（#87）

- 全件 GET: **153 件**（kind 未設定 105・業界 48）＝便の見込みどおり。
- ① の slug `meti-electric-power-wg5-2026-11` は 0 件・title に「第5回」かつ「電力事業環境整備」を含む既存は 0 件。
- A・B: slug から解決した id は原稿の id と一致（A `l66j-l5u3`・B `3gsrcm86dr`）。updatedAt（A 2026-11-06T03:08:50.543Z・B 2026-11-06T03:08:52.332Z）・status ["予定"]・sourceUrl（A …/20261109_2k.html・B …/20261110_3k.html）・description の字数（A 535・B 471）が、すべて原稿の期待値どおり。

## POST 1・PATCH 2 の結果

| 行 | slug（id） | 結果 |
|---|---|---|
| ①（★★） | `meti-electric-power-wg5-2026-11`（**`2qpkah9x2`**・新規） | **POST**・#106 全 12 field 一致（eventDate 2026-11-18・eventType／category ["重要会議"]・status ["予定"]・kind／relatedTopics／eventTopics []・description 480 字） |
| A（★★） | `meti-doji-shijo-kentoukai-26-2026-11`（`l66j-l5u3`） | **PATCH**（status ["予定"]→["終了"]・sourceUrl → `https://www.meti.go.jp/shingikai/energy_environment/doji_shijo_kento/026.html`・置換 2 か所〔各 置換元 1 回〕・description 535→**1087** 字＝`_afterLen` と一致）・#106/#122 送信 3 field 一致・他 field 変化 0 |
| B（★★） | `meti-jisedai-kiban-shoiinkai-7-2026-11`（`3gsrcm86dr`） | **PATCH**（status ["予定"]→["終了"]・sourceUrl → `https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/007.html`・置換 2 か所〔各 置換元 1 回〕・description 471→**1097** 字＝`_afterLen` と一致）・#106/#122 送信 3 field 一致・他 field 変化 0 |

## 原稿からの変更点（逐語）

- POST ① の description の 1 か所だけ（便の ■2・実行日 2026-11-14）:
  - 前（JSON）: 「配布資料は2026年11月13日時点で未掲載（開催案内のみ）。」
  - 後（送った値）: 「配布資料は2026年11月14日時点で未掲載（開催案内のみ）。」
  - 字数は 480 のまま。ほかの文字は JSON のまま。A・B は JSON のまま（変更 0）。

## policy-events の総件数

- 前 **153 件**（kind 未設定 105・業界 48）→ 後 **154 件**（kind 未設定 106・業界 48）＝便の見込みどおり。

## 本番（素の URL・cb なし）

| 時刻（JST） | URL | HTTP | x-vercel-cache | age | 確認 |
|---|---|---|---|---|---|
| 09:37:35（書込の後・ビルド前） | `/policy-calendar` | 200 | HIT | 23 | numberOfItems 95・①・A・B の新しい内容は無い（ビルド前の記録） |
| 09:44:13 | `/policy-calendar` | 200 | PRERENDER | 0 | JSON-LD numberOfItems **96**（95→96）・下の表のとおり ①・A・B とも便の期待どおり |

- 書込の後の webhook ビルド: `/build-info.json` の `builtAt` 2026-11-14T09:39:54+09:00（前は 06:27:16＝毎朝の再ビルド）。09:44:09 に切り替わりを確認。
- 各レコードの `<li>`（script を除き `<!-- -->` を剥がした初期 DOM）の中で見た:

| 行 | 確認 |
|---|---|
| ① | `<li>` 1 件・title が見える文字にある・出典リンク `…/information/2026/20261118_3k.html`・description 全文（「配布資料は2026年11月14日時点で未掲載（開催案内のみ）。」を含む）が見える文字にある・バッジ「重要会議」「予定」 |
| A | 出典リンク `…/doji_shijo_kento/026.html` の `<li>` 1 件・前の出典（20261109_2k.html）のリンクは無い・バッジ「重要会議」「終了」・置換後の文 2 か所とも文字どおり |
| B | 出典リンク `…/jisedai_kiban/007.html` の `<li>` 1 件・前の出典（20261110_3k.html）のリンクは無い・バッジ「重要会議」「終了」・置換後の文 2 か所とも文字どおり |

- 「終了」バッジについて: 一覧は「予定」で期日を過ぎた行を表示側で「終了」にする（`PolicyCalendarClient.tsx` 165 行・L-EIC-027）ので、A・B は書込の前から「終了」と出ていた。レコードの status が ["終了"] になったことは、PATCH の後の GET で確かめた（上の表）。
- 前日分（②の title・C〜H の置換後の文）もそのまま出ている。

### 30 分後（鉄則 #5）

| 時刻（JST） | URL | HTTP | x-vercel-cache | age | 確認 |
|---|---|---|---|---|---|
| 10:14:10 | `/policy-calendar` | 200 | HIT | 506 | numberOfItems 96・①・A・B は 09:44 と同じ（① の title・出典・11/14 時点の文／A・B の出典 026.html・007.html・「終了」・置換後の文 2 か所ずつ）・②と C〜H もそのまま |

- `/build-info.json` の `builtAt` は 2026-11-14T09:46:57+09:00 に変わっていた（09:39:54 の後にもう 1 本＝書込 3 件の webhook の後の分と見ている。確かめてはいない）。内容は 09:44 と同じ。
- 30 分の間に取った本番のページは全部 200。Vercel の管理画面のエラー率は見ていない（CLI で見られる記録が無い）。microCMS の警告メールの有無は EDAさんの受信箱で（CC からは見えない）。

## 申告（追い便）

- 経産省のページは取りに行っていない（便の ■1 のとおり）。内蔵ブラウザ・Chrome も使っていない。本番で開いたのは `/policy-calendar` と `/build-info.json` だけ（① の詳細ページなど、書込対象の新しい URL は開いていない＝#127）。
- IndexNow は送っていない（便に指示が無い）。
- 一時物（リポの外・消していない）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\wp1114\`（`dry.txt`・`apply.txt`・`prod.py`・`pc0.html`・`pc0.hdr`・`before.html`・`before.json`・`after1.html`・`after1.json`・`after30.html`・`after30.json`）。
- 作業前からある未コミットの差分（`src/data/substations/*.json`・`scripts/experimental/operators/alias-expansion-report.json`）は commit に入れていない。
- microCMS の書込は policy-events の POST 1・PATCH 2 だけ。rm／Remove-Item・`git push --force`・`.env` の表示はしていない。
