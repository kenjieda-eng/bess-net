# 補助金 月曜定例 11-16 — 環境省 ストレージパリティ R8 の二次公募の採択結果を反映し「採択結果公表」に（2026-11-17・CC・`_QUEUE.md` 117 行）

microCMS の書込は `subsidies` の **PATCH 1 レコード（3 op）**（POST・DELETE・PUT 0・ほかの API 0）。webhook は止めていない（書込 1）。
訂正履歴は足していない（便 ■3＝一次の新しい掲示への追随＝更新）。資料名の台帳も触っていない（便 ■2）。

## (0) 読んだもの・実行

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\補助金便_月曜定例11-16_ストレージパリティR8の二次採択結果を反映_採択結果公表に_Claude_Code投入_2026-11-16起草_ユウ.md`
  - 17,780 バイト・最終更新 2026-11-16 12:07 JST・sha256 `a85d8256f1e6fda7aea90cdba15416e16443a5cc0dca68289cb460b3110e74dc`
- 計画: 同じフォルダの `subsidies-patch-plan-2026-11-16_月曜定例_一次照合済み_ユウ.json`
  - 5,751 バイト・sha256 `f5b61123eae56295d29aa7e883bb56e88ed63cc09581fa2dfc89e34e7b0b1814`（便の値と一致）
- GO: `_QUEUE.md` 117 行（ユウ 11/17 09:2x・EDAさん 09:19「全て進めて」・1 本目）。
- 実行: 2026-11-17（JST）。一次の取り直し 09:50:52〜09:50:57・dry run 09:51 台・本実行 09:51:46〜09:51:50。main の HEAD `c4fbb85`（origin/main と同じ）。
- **★日付を替えた**（便 §0 ★・実行日が 11/16 でないため）: 計画のコピー `reports/subsidies-weekly-2026-11-16.data.json` の側で、op W1116-03 の new の「【2026-11-16 更新】」→「【2026-11-17 更新】」・「2026年11月16日時点」→「2026年11月17日時点」の 2 か所だけを替えた。
  - 替える前に、(1) の取り直しで三次公募の告知が無いことを確かめた。
  - 置換は W1116-03 の `new` の値の中だけ（同じ文字列は note にもあるが、note は替えていない）。JSON として読んで、替えた値以外が元と同じことを機械で確かめた。
  - 替えた後の sha256: `a68832a49bb73c15a081dbf984f41988ee90de1d67216d9b2a328a98af0143b4`。
- スクリプト: `scripts/apply-subsidies-weekly-2026-11-16.ts`（`runApplier` を呼ぶだけ・11-09 と同じ形・label「補助金 月曜定例 11-16 applier」）。
- 記録: `reports/subsidies-weekly-2026-11-16.data.json`（計画）・`.dry.json`・`.apply.json`・`.dry2.json`。

## (1) 一次の取り直し（素の curl・1 本ずつ・1.5 秒あけ・ブラウザのふりをする UA なし）

| | URL | 取得（JST） | HTTP・バイト | 確かめたこと |
|---|---|---|---|---|
| (a) | https://www.eic.or.jp/eic/topics/2026/st_r08/ | 09:50:52 | 200・14,459 | 先頭「2026.10.28｜【R8】二次公募の採択結果」・続いて 09.24 一次の採択結果／08.27 二次公募のお知らせ／07.09 公募のお知らせ。**「三次」を含む見出し 0** |
| (b) | https://www.eic.or.jp/eic/topics/2026/st_r08/2ndrst/ | 09:50:55 | 200・15,088・sha256 先頭 `44d60e4c8e7a0159`（ユウの取得と同じ） | 「採択案件を別添のとおり決定しましたので、お知らせします。」1 回・「2026.10.28」 |
| (c) | https://www.eic.or.jp/eic/topics/2026/st_r08/1st/ | 09:50:57 | 200・18,544 | 「【公募は終了しました】」1 回・「三次」0 |

- (a)〜(c) とも便の条件どおり → 3 op とも進めた。`result02.pdf` は開いていない（取りもしていない・ユウが 11/16 と 11/17 に 2 者を確かめ済み）。
- 一時物: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\sub1117\prim\`（3 本と応答ヘッダ）。

## (2) PATCH（dry run・本実行・冪等）

```
[dry run 09:51]  ■ PATCH subsidies/moe-storage-parity-r08（k3vt2k7favbr）ops 3（適用済み 0）→ status 4→6字・deadline 21→61字・scheme 407→605字
                 [done] PATCH 1 / POST 0 / skip 0 / 中止 0 / 失敗 0・生の文字列の突き合わせの不一致 0・GET 2
[本実行 09:51:46〜09:51:50]
                 ■ PATCH subsidies/moe-storage-parity-r08（k3vt2k7favbr）ops 3（適用済み 0）→ status 4→6字・deadline 21→61字・scheme 407→605字
                    #106/#122: ✓ 送信 3 field 一致・他 field 変化 0
                 [done] PATCH 1 / POST 0 / skip 0 / 中止 0 / 失敗 0・不一致 0・GET 3・PATCH 1
[書込後の dry run] ■ PATCH subsidies/moe-storage-parity-r08（k3vt2k7favbr）[skip] 全 3 op 適用済み（冪等）
                 [done] PATCH 0 / skip 1 / 中止 0 / 失敗 0・GET 2
```

- 書込前の値（dry run の GET）は便 §1 の「当サイトの今の値」と同じ（status `["受付終了"]`・deadline「2026年10月2日（金）正午必着【厳守】」・scheme の末尾「…2026年10月5日時点で三次公募の告知なし。出典: …/1strst/」）。
- 書込後: status `["採択結果公表"]`・deadline「2026年10月2日（金）正午必着【厳守】（二次公募は終了。二次公募の採択結果は2026年10月28日にEIC機構が公表）」・scheme の末尾「…二次公募は2026年10月2日（金）正午で締切。【2026-11-17 更新】二次公募（2026年8月27日〜10月2日正午）の採択結果を2026年10月28日に公表（EIC機構の採択事業者一覧に2者掲載: オンサイトPPAモデル1・自己所有モデル1。件数は編集部集計）。2026年11月17日時点で三次公募の告知なし（EIC機構の公募ページは「【公募は終了しました】」と掲示）。出典: …/1strst/ ／ …/2ndrst/」。

## (3) `src/data/subsidies.json` の diff（`npm run build` の prebuild で作り直したもの）

```diff
@@ -640,21 +640,21 @@
     "status": [
-      "受付終了"
+      "採択結果公表"
     ],
@@
-    "deadline_raw": "2026年10月2日（金）正午必着【厳守】",
+    "deadline_raw": "2026年10月2日（金）正午必着【厳守】（二次公募は終了。二次公募の採択結果は2026年10月28日にEIC機構が公表）",
     "deadline_iso": "2026-10-02",
@@
-    "updatedAt": "2026-10-05T03:44:17.588Z",
-    "scheme": "…二次公募は2026年10月2日（金）正午で締切。2026年10月5日時点で三次公募の告知なし。出典: https://www.eic.or.jp/eic/topics/2026/st_r08/1strst/",
+    "updatedAt": "2026-11-17T00:51:49.532Z",
+    "scheme": "…二次公募は2026年10月2日（金）正午で締切。【2026-11-17 更新】二次公募（2026年8月27日〜10月2日正午）の採択結果を2026年10月28日に公表（EIC機構の採択事業者一覧に2者掲載: オンサイトPPAモデル1・自己所有モデル1。件数は編集部集計）。2026年11月17日時点で三次公募の告知なし（EIC機構の公募ページは「【公募は終了しました】」と掲示）。出典: https://www.eic.or.jp/eic/topics/2026/st_r08/1strst/ ／ https://www.eic.or.jp/eic/topics/2026/st_r08/2ndrst/",
```
（scheme の前半〔「自家消費型の太陽光発電設備と…【2026-10-05 更新】一次公募…9者掲載…」〕は前後で同じなので「…」で略した。全文は commit `20901dd` の diff）

- 機械で全キーを比べた結果: 件数 80 → 80・slug の集合は同じ。**変わったのは `moe-storage-parity-r08` の `status`・`deadline_raw`・`scheme`・`updatedAt` の 4 キーだけ**。ほかの 79 件の変化 0。`deadline_iso`（2026-10-02）・`start_iso`（2026-08-27）・`is_rolling`・`no_schedule`・`applicable_prefs`（47）・`applicable_use_cases`・`applicable_entities` は不変（便 ■1 の派生の期待どおり）。
- `/subsidies` の見出し（**ビルドの日 2026-11-17** の `displaySubsidyStatus` で数えた値）: HEAD 公募中 26・受付終了 33・採択結果公表 16・その他 5 → 今 公募中 26・受付終了 **32**・採択結果公表 **17**・その他 5。
  - 便の 11/16 基準の見込み（採択結果公表 16 → 17・受付終了 32 → 31・公募中 27）と、受付終了・公募中の数が 1 ずつ違うのは、便の注意書きのとおり、福島 地域活用型（締切 2026-11-16）が 11/17 には公募中 → 受付終了に移っているため（HEAD の subsidies.json を 11/16 の日付で数えると 公募中 27・受付終了 32・採択結果公表 16・その他 5＝便の前提と一致）。
- `verify:source-names:src` ok（台帳 448 件・台帳に無い資料名 0）・`type-check` ok・`npm run build` BUILD EXIT 0（prebuild の verify は全部 ok・★WARN 0）・`verify:linkify` 15 ページ clean。

## (4) 本番照合（素の URL・script を除いた初期 DOM・`<!-- -->` を剥がして数えた）

- deploy: `20901dd` を 09:58 に push → Vercel **success 10:08:33**（`/build-info.json` の builtAt 2026-11-17T10:04:15+09:00）。照合は 10:09:07〜10:09:08。
  - その前に、microCMS の PATCH（09:51）の webhook のビルドが 09:56:46 に出ていた（builtAt で確認）。

| URL | HTTP・x-vercel-cache・age | 結果 |
|---|---|---|
| `/subsidies/moe-storage-parity-r08` | 200・HIT・9 | 状態のバッジ「**採択結果公表**」（本文で「受付終了」0・「公募中」0）・「2026年10月28日」6 回・**「2026年10月5日時点」0 回**・「2者掲載」3 回・「【2026-11-17 更新】」3 回・「2026年11月17日時点」3 回・「二次公募は終了」3 回・2ndrst の URL 3 回 |
| `/subsidies` | 200・HIT・8 | 見出し 公募中 26・**採択結果公表 17**・**受付終了 32**・その他 5（(3) の数えた値と一致）。詳細へのリンクあり |
| `/tracker/subsidy` | 200・PRERENDER・0 | 2026-11-17 の行に「ストレージパリティの達成に向けた…（令和8年度当初予算）」・タグ「**採択結果公表**」 |

- 3 回ずつ出るのは、meta description・og:description と本文の 3 か所に出るため（11-09 と同じ）。
- **★便の期待と違う 1 点: `<title>` に「採択結果」は入らない**（`<title>`「ストレージパリティの達成に向けた太陽光発電設備等の価格低減促進事業（令和8年度当初予算）｜蓄電所ネット」）。
  - 理由: `buildSubsidyTitle`（`src/lib/subsidies-meta.ts`）は、題が `TITLE_MAX`（40 字）を超えるときは状態のラベルを付けない（自前で切り詰めない・要素を落とす）。このレコードは名称だけで 44 字あるので、前の「受付終了」のときも状態のラベルは付いていなかった（この便で変わったものではない）。
  - 状態は meta description・og:description の先頭（「採択結果／対象: …」）と、本文のバッジに出ている。

## (5) IndexNow

- 2 URL（詳細・`/subsidies`）を `--urls` で（`reports/subsidies-weekly-2026-11-16.indexnow-urls.txt`）。dry run（送る 2 件・変電所の詳細 0・noindex 0・鍵 605d…・本番の鍵のファイル HTTP 200 で中身一致）のあと `--apply` を 1 回。
- 応答: **1〜2 件目 HTTP 200（受理）**・10:09:4x JST（`reports/subsidies-weekly-2026-11-16.indexnow.json`）。

## (6) 申告

- **★日付を替えた**: 計画のコピーで W1116-03 の 2 か所を 11-16 → 11-17（(0) のとおり・替える前に三次公募の告知なしを確かめた）。
- **一時物をリポの中に作って、mv で外に出した**: `/subsidies` の見出しを数える小さなスクリプトを `scripts/.count-sub-1117.ts` に作って 1 回使い（import の相対パスの都合）、すぐに scratchpad（`…\scratchpad\sub1117\work\count-sub-1117.ts`）へ mv した（消していない・commit にも入れていない）。最初から scratchpad で動かすべきだった。
- 一時物（リポの外・消していない）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\sub1117\`（`prim\` に一次 3 本と応答ヘッダ・`work\` に build のログ・数えたスクリプト・本番照合のスクリプトと結果）。
- 作業前からある未コミットの差分（`src/data/substations/*.json`・`scripts/experimental/operators/alias-expansion-report.json`）は commit に入れていない。118 行（BX）の作業中の差分（`scripts/experimental/chubu/` ほか）もこの便の commit には入れていない。
- rm／Remove-Item・`git push --force`・`.env` の表示はしていない。microCMS の書込は subsidies の PATCH 1 だけ。訂正履歴は足していない（便 ■3）。
- 30 分の監視（microCMS の警告メール・Vercel のエラー率）は EDAさん・ユウの側で（CC は受信箱を見られない）。
