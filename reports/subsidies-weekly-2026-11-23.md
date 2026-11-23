# 補助金 月曜定例 11-23 — 鹿児島県の四次募集（〜2026-12-25）を反映し「受付終了」の表示を「公募中」に（2026-11-23・CC）

microCMS の書込は `subsidies` の **PATCH 1 レコード（3 op）**（POST・DELETE・PUT 0・ほかの API 0）。webhook は止めていない（書込 1）。
訂正履歴は足していない（便 ■3＝一次の新しい掲示への追随＝更新）。資料名の台帳も触っていない（便 ■2）。

## (0) 読んだもの・実行

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\補助金便_月曜定例11-23_鹿児島県の四次募集を反映_受付終了の表示を公募中に_Claude_Code投入_2026-11-23起草_ユウ.md`
  - 19,671 バイト・最終更新 2026-11-23 11:51 JST・sha256 の先頭 16 桁 `9853ba76d153dd68`
- 計画: 同じフォルダの `subsidies-patch-plan-2026-11-23_月曜定例_一次照合済み_ユウ.json`
  - 7,157 バイト・sha256 `62248d59e26bc24af0ca1d2de659a4d8b6b09ff2f32e12fd965bc9a3276a4034`（便の値と一致）
- GO: EDAさんの指示（2026-11-23 12:5x「〈この便のファイル名〉 を読んで実行して」）。`_QUEUE.md` に**この便の行は無い**（便のとおり。自走の起草のため）。便が求める「GO の前に通常セッションのユウが §1 の一次を抜き取り確認する」が済んだかは、CC からは分からない（この報告の (1) で CC が 3 本を取り直した）。
- 実行: 2026-11-23（JST）。一次の取り直し 12:53:02〜12:53:05・dry run 12:53 台・本実行 12:53:34〜12:53:39。main の HEAD `8f4c9d1`（origin/main と同じ・先の GO 便〔140 行〕の push の後）。
- **日付は替えていない**: 実行日が 2026-11-23、県のページの「更新日：」が 2026年11月13日のため、計画のコピー `reports/subsidies-weekly-2026-11-23.data.json` は中身を変えていない（sha256 は上と同じ `62248d59…4034`）。
- スクリプト: `scripts/apply-subsidies-weekly-2026-11-23.ts`（`runApplier` を呼ぶだけ・11-16 と同じ形・label「補助金 月曜定例 11-23 applier」）。
- 記録: `reports/subsidies-weekly-2026-11-23.data.json`（計画）・`.dry.json`・`.apply.json`・`.dry2.json`。
- commit `ce96eab`（push 12:59:59）・この報告は別の commit。

## (1) 一次の取り直し（素の curl・1 本ずつ・1.5 秒あけ・ブラウザのふりをする UA なし）

| | URL | 取得（JST） | HTTP・バイト・sha256 先頭 | 確かめたこと |
|---|---|---|---|---|
| (a) | https://www.pref.kagoshima.jp/ac10/saienesenshin2026.html | 12:53:02 | 200・23,958・`5209bd381f30b1a2`（last-modified 2026-11-13 04:00:25 GMT） | **「更新日：2026年11月13日」**。「次募集：令和8年12月25日（金曜日）必着」1 回・「現在、四次募集中です。」1 回・「現在、三次募集中です。」0 回。予算到達・受付終了の掲示は無い。応募申請書提出期限は一次〜四次の 4 行（便 §1 の逐語のとおり） |
| (b) | https://www.pref.kagoshima.jp/ac10/documents/127695_20261005132145-1.pdf | 12:53:04 | 200・382,815・`7b1bb46474755c01`（last-modified 2026-10-05） | `pdftotext -layout` で第８ ２ (1) に「四次募集 令和８年 12 月 25 日（金）必着」「※三次募集で予算に達した場合は、四次募集は行いません」。県のページの募集要領のファイル名は同じ |
| (c) | https://www.pref.kagoshima.jp/ac10/documents/127695_20260507085932-1.pdf | 12:53:05 | 200・184,957・`2a35049aaca33c9e`（last-modified 2026-05-07） | 県のページの交付要綱のファイル名は `127695_20260507085932-1.pdf` のまま |

- 県のページの sha256 は、自走のユウの取得（`9f54ea0de12e5db5`）と違う。バイト数と last-modified は同じで、便が引いた文字はどれもある（ページの動く部分の違いと見られる）。PDF 2 本は sha256 も同じ。
- 県のページの関係書類のファイル名は 8 本（便 §1 のとおり。PRチラシだけ 11/13 の `127695_20261113122845-1.pptx`）。
- PDF は内蔵ブラウザで開いていない（curl だけ）。
- 一時物: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\sub1123\pri\`（3 本と応答ヘッダ）。

## (2) PATCH（dry run・本実行・冪等）

```
[dry run 12:53]  ■ PATCH subsidies/kagoshima-saiene-chikudenchi-2026（69m-j-ku5z4）ops 3（適用済み 0）→ deadline 33→34字・body 1389→1362字
                 [done] PATCH 1 / POST 0 / skip 0 / 中止 0 / 失敗 0・生の文字列の突き合わせの不一致 0・GET 2
[本実行 12:53:34〜12:53:39]
                 ■ PATCH subsidies/kagoshima-saiene-chikudenchi-2026（69m-j-ku5z4）ops 3（適用済み 0）→ deadline 33→34字・body 1389→1362字
                    #106/#122: ✓ 送信 2 field 一致・他 field 変化 0
                 [done] PATCH 1 / POST 0 / skip 0 / 中止 0 / 失敗 0・不一致 0・GET 3・PATCH 1
[書込後の dry run] ■ PATCH subsidies/kagoshima-saiene-chikudenchi-2026（69m-j-ku5z4）[skip] 全 3 op 適用済み（冪等）
                 [done] PATCH 0 / skip 1 / 中止 0 / 失敗 0・GET 2
```

- 書込前の body は 1,389 字（便 §1 の本番の RSC の body と同じ字数）。3 op の old は GET の値にちょうど 1 回ずつあった（applier の確かめ・中止 0）。
- 送った field は deadline・body の 2 つ（body の op は 2 本）。status は送っていない（生は「公募中」のまま）。

## (3) `src/data/subsidies.json` の diff（`npm run build` の prebuild で作り直したもの）

```diff
@@ -523,13 +523,13 @@
     "applicationStart": "",
-    "deadline_raw": "2026年11月6日（金曜日）必着（三次募集の応募申請書提出期限）",
-    "deadline_iso": "2026-11-06",
+    "deadline_raw": "2026年12月25日（金曜日）必着（四次募集の応募申請書提出期限）",
+    "deadline_iso": "2026-12-25",
     "is_rolling": false,
     "no_schedule": false,
     "fiscalYear": "令和8年度（2026年度）",
     "sourceUrl": "https://www.pref.kagoshima.jp/ac10/saienesenshin2026.html",
-    "updatedAt": "2026-10-22T03:48:36.186Z",
+    "updatedAt": "2026-11-23T03:53:37.214Z",
```

- 変わったのは `kagoshima-saiene-chikudenchi-2026` の deadline_raw・deadline_iso・updatedAt の 3 キーだけ（6 行）。件数は 80 のまま・ほかの 79 件の変化 0。status（生）・start_iso・is_rolling・no_schedule・applicable_prefs・applicable_use_cases・applicable_entities は不変。
- `displaySubsidyStatus`（今日 2026-11-23）で数えた見出しの件数: 前 公募中 25・採択結果公表 17・受付終了 33・その他 5 → 後 **公募中 26・採択結果公表 17・受付終了 32・その他 5**（鹿児島は「公募中」）。
- `npm run verify:source-names:src` ok（台帳に無い資料名 0 種）・`npm run type-check` ok・`npm run build`（`BUILD EXIT 0`）の prebuild の verify は全部 ok・`verify:linkify` 15 ページとも clean。
- ローカルの build の詳細ページは、バッジ「公募中」（precompute）だが、本文と公募期間は前の値のままだった（`.next/cache` の fetch キャッシュ＝#116）。本番は新しい値（(4)）。
- #127: 書込の前に、書込対象の 2 URL（詳細・`/subsidies`）は開いていない。

## (4) 本番照合（素の URL・script を除いた初期 DOM）

Vercel: `ce96eab` success 2026-11-23 13:09:47 JST（push 12:59:59）。13:10:13〜13:10:18 に 3 本（どれも PRERENDER・age 0）、13:10:33〜13:10:37 にもう一度（HIT・age 18）。2 回目は `/subsidies`・`/tracker/subsidy` がバイト単位で同じ、詳細は `<script>` の中だけが違う（script を除いた HTML は同じ）。

- **`/subsidies/kagoshima-saiene-chikudenchi-2026`**: バッジ「公募中」・**初期 DOM の「受付終了」0 回**（前は 3 回）・description と og:description の頭が「公募中・締切12/25／」・「2026年12月25日（金曜日）必着（四次募集の応募申請書提出期限）」3 回・「現在、四次募集中です。」1 回・「2026年11月23日時点」1 回・「2026年11月23日確認」1 回・「現在、三次募集中です。」「四次募集は行われません」「2026年10月17日」はどれも 0 回・**更新日「2026年11月23日」**・公募期間「— 〜 2026年12月25日（金曜日）必着（四次募集の応募申請書提出期限）」。`<title>` は前と同じ（状態は付かない）。
- **`/subsidies`**: 見出しの件数 **公募中 26・採択結果公表 17・受付終了 32・その他 5**＝(3) で数えた値と同じ。鹿児島の行は「いま公募中（締切が近い順）」の節。
- **`/tracker/subsidy`**: 先頭「2026-11-23（1 件）」に鹿児島の行・タグ「公募中」。
- 変電所のページは見ていない（便 ■1 のとおり、「この県で使える補助金 N件」は applicable_prefs の件数で、状態を見ないため変わらない）。

## (5) IndexNow

`reports/subsidies-weekly-2026-11-23.indexnow-urls.txt` の 2 URL（詳細・`/subsidies`）。dry run → `--apply`（13:10:39）→ **1〜2 件目 HTTP 200（受理）**。鍵は先頭 4 文字だけを記録に残す。記録 `reports/subsidies-weekly-2026-11-23.indexnow.json`。

## (6) 申告

- 停止条件の操作 0（rm 系・push --force・.env の表示 0。`.env.local` は読み込みだけ）。microCMS は subsidies の PATCH 1 と GET だけ。
- 一時物は scratchpad（`C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\sub1123\`）にだけ作った。消していない。
- **日付は替えていない**（(0)）。逸脱: 便の手順 9 は「push 1 回」。直しの commit は 1 回だけ push し、この報告は別の commit で push した（11/22〜23 の projects 便と同じ分け方）。
- webhook を止めていないので、PATCH の webhook のビルドの 1 本が **13:03:07 に公開された**（`8f4c9d1` の上）。このビルドも prebuild で `subsidies.json` を microCMS から作り直すので、表示はこの push のデプロイ（13:09:47）と同じ新しい形になっていたはず（その間の本番は見ていない）。
- `_QUEUE.md`: この便の行は無い（行なし）。`_QUEUE.md` は編集していない。
- 便が求める「30 分後の本番の確かめ」はユウ。CC は 1 回見て終えた。
