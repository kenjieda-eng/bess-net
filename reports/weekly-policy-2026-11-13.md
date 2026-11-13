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
