# 補助金便 月曜定例 11-09 — SII の R7 補正 3 事業の締切の文面・業務産業用（小規模）を採択結果公表に（2026-11-09・CC）

**結論**: microCMS `subsidies` に PATCH 3 レコード・4 op を書いた（POST・DELETE・PUT 0）。#106／#122 の照合は 3/3 ✓。もう一度 dry run を流すと 3 件とも skip だった。`subsidies.json` の差分は計画どおりの 7 行だけ（80 件のまま）。本番は 3 件の詳細と `/subsidies` が新しい内容で、見出しは採択結果公表 16・受付終了 31 件。IndexNow 4 URL は HTTP 200。

**★要裁定 1**: 小規模（`sii-syoukibo-gyousan-ess-07r`）のページに、「（公募中）」がまだ 3 回出る（便の照合の基準「0 回」に届かない）。出どころは計画に無い欄 `scheme` の「公募期間2026-03-24〜10-30（公募中）。」で、meta description・og:description・本文の概要に出ている。この便で書いてよいのは計画の 4 op だけなので、直していない（(4)・(6) 1）。

- commit: `87e0c63`（applier・計画・書込の記録・`subsidies.json`）・報告の commit は本ファイル。

## (0) 読んだ絶対パス

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\補助金便_月曜定例11-09_SII3事業の締切の文面と小規模の状態_Claude_Code投入_2026-11-09起草_ユウ.md`
- 計画 JSON: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\subsidies-patch-plan-2026-11-09_月曜定例_一次照合済み_ユウ.json`（5,151 バイト・sha256 `fe2e4d7439bb8d8a54e33671818a460137eec972f014793044a2d25d23744a0c`＝便の記載と一致）
  - リポへのコピー `reports/subsidies-weekly-2026-11-09.data.json` も同じ sha256（中身は変えていない）。
- 根拠の記録: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\02_計画・運営\月曜定例ログ_補助金巡回_2026-11-09.md`
- `_QUEUE.md`: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md`（102 行目）
- この報告: `C:\Users\kenji\Documents\GitHub\bess-net\reports\subsidies-weekly-2026-11-09.md`（＋ `.data.json`・`.dry.json`・`.apply.json`・`.dry2.json`・`.prod.json`・`.indexnow-urls.txt`・`.indexnow.json`）

## (1) 一次の取り直し（2026-11-09 12:00 JST・Chrome の UA の curl で 1 URL ずつ・1.5 秒あけて）

| 件 | URL | HTTP・バイト・sha256 先頭 | 確かめたこと |
|---|---|---|---|
| (a) 小規模 | https://sii.or.jp/DRchikudenchi_gyousan07r/ | 200・37,995・`1f223020aee6f302` | 新着の先頭は「令和8年10月30日（金）「令和7年度補正 業務産業用蓄電システム導入支援事業」の公募は終了しました。」、次が 08/28 の交付決定の公表開始。公募の再開・2 次公募の新着は無い |
| (b) 大規模 | https://sii.or.jp/daikibogyousan07r/ | 200・38,904・`7d275000d8010bf1` | 「※本事業は、1次公募の結果をもって終了いたしました。」あり。新着の先頭は 07/30 の交付決定の公開。2 次公募の新着は無い（「公募を開始しました」は 03/24 の 1 次の告知だけ） |
| (c) 再エネ併設 | https://sii.or.jp/saieneheisetsu07r/ | 200・39,262・`4b58da83fe32101f` | (b) と同じ（終了の掲示あり・07/30 の交付決定・2 次公募の新着なし） |

- 3 本とも、ユウの 11:17 の取得とバイト数・sha256 先頭が同じ（ページは変わっていない）。止める条件には当たらない。

## (2) PATCH（#106／#122）

**dry run**（`.dry.json`）

```
■ PATCH subsidies/sii-syoukibo-gyousan-ess-07r（fexb5t8o48p）ops 2（適用済み 0）→ deadline 19→102字・status 3→6字
■ PATCH subsidies/sii-daikibo-gyousan-ess-07r（xbto4lcso-9t）ops 1（適用済み 0）→ deadline 68→82字
■ PATCH subsidies/sii-saiene-heisetsu-ess-07r（xij59tdwho86）ops 1（適用済み 0）→ deadline 68→82字
[done] PATCH 3 / POST 0 / skip 0 / 中止 0 / 失敗 0
[生の文字列の突き合わせ] 送る値と計画の適用後の値の不一致 0
[microCMS 呼び出し] GET 6
```

**本実行**（`--apply` を 1 回・12:01:28〜12:01:37・`.apply.json`）

```
■ PATCH subsidies/sii-syoukibo-gyousan-ess-07r（fexb5t8o48p）ops 2（適用済み 0）→ deadline 19→102字・status 3→6字
   #106/#122: ✓ 送信 2 field 一致・他 field 変化 0
■ PATCH subsidies/sii-daikibo-gyousan-ess-07r（xbto4lcso-9t）ops 1（適用済み 0）→ deadline 68→82字
   #106/#122: ✓ 送信 1 field 一致・他 field 変化 0
■ PATCH subsidies/sii-saiene-heisetsu-ess-07r（xij59tdwho86）ops 1（適用済み 0）→ deadline 68→82字
   #106/#122: ✓ 送信 1 field 一致・他 field 変化 0
[done] PATCH 3 / POST 0 / skip 0 / 中止 0 / 失敗 0
[生の文字列の突き合わせ] 送る値と計画の適用後の値の不一致 0
[microCMS 呼び出し] GET 9・PATCH 3
```

**冪等**（もう一度 dry run・`.dry2.json`）

```
■ PATCH subsidies/sii-syoukibo-gyousan-ess-07r（fexb5t8o48p）[skip] 全 2 op 適用済み（冪等）
■ PATCH subsidies/sii-daikibo-gyousan-ess-07r（xbto4lcso-9t）[skip] 全 1 op 適用済み（冪等）
■ PATCH subsidies/sii-saiene-heisetsu-ess-07r（xij59tdwho86）[skip] 全 1 op 適用済み（冪等）
[done] PATCH 0 / POST 0 / skip 3 / 中止 0 / 失敗 0
```

## (3) `src/data/subsidies.json` の diff（`npm run build` の prebuild で作り直したもの）

```diff
@@ -1870 +1870 @@
-      "公募中"
+      "採択結果公表"
@@ -1878 +1878 @@
-    "deadline_raw": "2026年10月30日（金）（公募中）",
+    "deadline_raw": "2026年10月30日（金）に公募終了（SIIは2026年10月30日に「「令和7年度補正 業務産業用蓄電システム導入支援事業」の公募は終了しました。」と掲示）。交付決定の公表は2026年8月28日に開始",
@@ -1884 +1884 @@
-    "updatedAt": "2026-09-23T09:36:49.513Z",
+    "updatedAt": "2026-11-09T03:01:31.143Z",
@@ -1962 +1962 @@
-    "deadline_raw": "2026年5月29日（金）12:00必着（1次公募終了。2次公募は申請・採択状況により実施の場合あり）。交付決定は2026年7月下旬以降",
+    "deadline_raw": "2026年5月29日（金）12:00必着（1次公募終了。SIIは「本事業は、1次公募の結果をもって終了いたしました。」と掲示）。交付決定は2026年7月30日に公開",
@@ -1968 +1968 @@
-    "updatedAt": "2026-09-23T09:36:53.316Z",
+    "updatedAt": "2026-11-09T03:01:33.645Z",
@@ -2047 +2047 @@
-    "deadline_raw": "2026年5月29日（金）12:00必着（1次公募終了。2次公募は申請・採択状況により実施の場合あり）。交付決定は2026年7月下旬以降",
+    "deadline_raw": "2026年5月29日（金）12:00必着（1次公募終了。SIIは「本事業は、1次公募の結果をもって終了いたしました。」と掲示）。交付決定は2026年7月30日に公開",
@@ -2053 +2053 @@
-    "updatedAt": "2026-09-23T09:36:57.109Z",
+    "updatedAt": "2026-11-09T03:01:35.544Z",
```

- 機械で全キーを比べた結果: 件数 80 → 80・slug の集合は同じ。変わったのは小規模 `deadline_raw`・`status`・`updatedAt`、大規模・再エネ併設 `deadline_raw`・`updatedAt` だけ。ほかの 77 件の変化 0。`deadline_iso` は 3 件とも変わらない（2026-10-30・2026-05-29・2026-05-29）。
- `/subsidies` の見出し（ビルドの日 2026-11-09 の `displaySubsidyStatus` で数えた値）: HEAD 公募中 28・受付終了 32・採択結果公表 15・その他 5 → 今 公募中 28・受付終了 **31**・採択結果公表 **16**・その他 5（便の見込みどおり）。
- prebuild の verify は全部 ok（NG・WARN 0）。`verify:source-names:src` ok・`type-check` ok・BUILD EXIT 0。

## (4) 本番照合（素の URL・script を除いた初期 DOM・`<!-- -->` を剥がして数えた）

- deploy: `87e0c63` を 12:07 に push → Vercel success **12:16:58**。照合は 12:17:13（`.prod.json`）。

| URL | HTTP・x-vercel-cache・age | 結果 |
|---|---|---|
| `/subsidies/sii-syoukibo-gyousan-ess-07r` | 200・PRERENDER・0 | 状態「**採択結果公表**」・「公募は終了しました」3 回・「交付決定の公表は2026年8月28日に開始」3 回。**「（公募中）」3 回**（★下） |
| `/subsidies/sii-daikibo-gyousan-ess-07r` | 200・PRERENDER・0 | 「2次公募は申請・採択状況により実施の場合あり」0 回・「交付決定は2026年7月下旬以降」0 回・「1次公募の結果をもって終了いたしました」3 回・「交付決定は2026年7月30日に公開」3 回・状態「採択結果公表」 |
| `/subsidies/sii-saiene-heisetsu-ess-07r` | 200・PRERENDER・0 | 大規模と同じ（0・0・3・3・採択結果公表） |
| `/subsidies` | 200・PRERENDER・0 | 見出し 公募中 28・**採択結果公表 16**・**受付終了 31**・その他 5（(3) の数えた値と一致）。3 件とも一覧からリンクあり |

- 3 回ずつ出るのは、締切の文面が meta description・og:description（「締切: …」）と詳細の表の「公募期間」の欄の 3 か所に出るため（大規模で確かめた）。
- **★小規模の「（公募中）」3 回の出どころ**: 締切の欄（`deadline`）ではなく、概要の欄 `scheme` の末尾近く「…Jグランツ（GビズID必須）で電子申請。**公募期間2026-03-24〜10-30（公募中）。**予算＝再生可能エネルギー導入拡大・分散型エネルギーリソース導入支援等事業費補助金。」。meta description・og:description と本文の概要の段落に出ている。
  - microCMS の GET（読取のみ・1 回）で確かめた: このレコードで「公募中」を含む欄は `scheme` だけ。`subsidies.json` の 80 件でも、「（公募中）」を含むのはこのレコードの `scheme` だけ。
  - 計画に `scheme` の op は無いので、直していない（(6) 1）。

## (5) IndexNow

- 4 URL（3 件の詳細・`/subsidies`）を `--urls` で（`.indexnow-urls.txt`）。dry run（送る 4 件・変電所の詳細 0・noindex 0・鍵 605d…・本番の鍵のファイル HTTP 200 で中身一致）のあと `--apply` を 1 回。
- 応答: **HTTP 200（受理）**・2026-11-09T03:18:27.838Z（JST 12:18:27）・本文は空（`.indexnow.json`）。

## (6) 申告

1. **★小規模の `scheme` に「（公募中）」が残る**（要裁定）: 便の照合の基準「（公募中）が 0 回」に届かない。直すなら `scheme` の「公募期間2026-03-24〜10-30（公募中）。」を、締切の欄と同じ書き方（例「公募期間2026-03-24〜10-30（2026年10月30日に公募終了）。」）にする PATCH 1 op が要る。文言はユウの判断。
   - `scheme` を触る PATCH は、受け入れ基準どおり `applicable_prefs` の before／after の監査と都道府県マッチの確認が要る（#110）。`precompute-subsidies.ts` は県を name・organization だけから出すので、`scheme` の書き換えで県は変わらないはず（確かめるのは書くとき）。
   - 便の判断どおり、訂正履歴には足していない（3 件とも一次の新しい掲示への追随＝更新）。`scheme` の件も同じ扱いになりそう。
2. **IndexNow は便どおり 4 URL を送った**: 小規模のページは `scheme` の 1 文が古いまま。`scheme` を後で直したら、そのページだけもう一度送れる（中身が変わるので、CLAUDE.md 2-4 の「変わっていないのに何度も送らない」には当たらない）。
3. **ローカルのビルドの詳細ページは古い締切の文面だった**: 詳細の締切の文面は実行時の microCMS（revalidate 600）から、状態のバッジは `subsidies.json` から取る。ローカルのビルドは fetch のキャッシュの古い応答で描かれたので、バッジは新・文面は旧になった（本番は 12:17 に両方とも新）。
4. **webhook**: `subsidies` は webhook のある API なので、PATCH 3 回でもビルドが走った可能性がある（中間は自動で取り消される）。確かめたのは `87e0c63` の deploy の success だけ。
5. **一時物**（消していない・どれも scratchpad）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\sub1109\` の下（`primary\`〔一次 3 本の HTML・照合の結果〕・`dry.out`・`apply.out`・`dry2.out`・`build.log`・`subsidies.diff`・`diff_keys.txt`・`counts.json`・`ts\count.ts`・`ts\get_fields.ts`・`get_fields.json`・`kobochu_ctx.txt`・`kobochu_fields.txt`・`prod_check.py`・`prod_1.json`）と `scratchpad\sf8\` の `row102.txt`・`plan_1109.json`・`log_1109.md`。
6. **便からの逸脱**: 無し。push は便どおり 1 回（`87e0c63`）。この報告の push でもう 1 本ビルドが走る（`reports/` だけ）。
7. **30 分の監視**（12:17〜12:47）: microCMS の警告メールと Vercel のエラー率は私からは見えない（EDAさんにお願いしたい）。
