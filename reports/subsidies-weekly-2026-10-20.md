# 補助金便 月曜定例 10-20 報告 — 高知県・佐賀県の締切延長（11/30）と三重県の受付再開を反映・福島県の 2 制度を掲載（2026-10-25 実行）

## (0) 読んだ便ファイル（絶対パス）

- `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\補助金便_月曜定例10-20_高知と佐賀の締切延長・三重の受付再開を反映・福島県の2制度を掲載_Claude_Code投入_2026-10-20起草_ユウ.md`（31,004 バイト）
- キュー: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md`（この便の行が GO・EDAさん 10/25「`03_5月13日朝_実行` の `_QUEUE.md` の GO を上から実行して」）。リポ直下の同名フォルダには `_QUEUE.md` が無い（gitignore の対象）。
- 入力 2 本（sha256 は便の記載と一致）:
  - `subsidies-patch-plan-2026-10-20_月曜定例_一次照合済み_ユウ.json` → `reports/subsidies-weekly-2026-10-20.data.json`（`02e00356584f52dac96793eae1460cf555988040281ff7f5da71a03d8dccc451`・中身は変えていない）
  - `subsidies-import-2026-10-20_月曜定例_福島2件_一次照合済み_ユウ.json` → `scripts/subsidies-import-2026-10-20.json`（写しの前 `b1274a488a5f736a2f84d93199898dc07e76a65053310b7e635d2bfefb3fd847` → 実行日の書き換え後 `ad59b8a096ab11a6baa4573d1a2684a54e63d4a2bda1a26aa966a737658a9821`）
- 停止条件: rm・rmdir・Remove-Item・git push --force・.env の内容表示 いずれも 0。microCMS は subsidies の PATCH 3 レコード（4 op）と POST 2 件だけ（DELETE・PUT・スキーマ変更 0）。applier と import-subsidies.ts はどちらも dry run の後に `--apply` を 1 回ずつ。
- #127: 書込対象の URL（高知・佐賀・三重・福島 2 件の詳細、/subsidies、/tools/subsidy-match、福島県の県ページ）は書込前に開いていない。前の状態はリポの `src/data/subsidies.json`（HEAD）で見た。

## 結論

- microCMS 書込: subsidies の **PATCH 3 レコード・4 op**（2026-10-25 17:47:38〜46 JST）と **POST 2**（17:50:03〜08 JST）。中止 0・失敗 0・生の文字列の不一致 0。#106／#122 は 3 件とも ✓（送った field は送信値と一致・他の field の変化 0）。冪等の確認（dry run）は 3 件とも skip。
- POST の 2 件は、送った 14 field（`_note` を除く）が全部入力と一致（body は `plain()` で比較・生の文字数も一致）。subsidies の総件数 97 → 99（+2）。
- 一次の取り直し（a〜f）はすべて便の「事実」どおり。三重の残り金額と時点は変わっていない（推進センターのページは便の取得と同じバイト列）→ ■3 の new は書き換えていない。
- `src/data/subsidies.json` の差分は期待どおり（件数 78 → 80・高知／佐賀／三重の各 3 キー・福島 2 件の追加・ほかの 75 件の変化 0）。福島 2 件の派生値は便 ■4 の表と一致。
- 台帳 `src/data/source-documents.json` に 5 件を登録（375 → 380 件）。`verify:source-names:src` ok。
- 訂正履歴（`src/data/corrections.json`）には足していない（■6 のとおり）。
- commit `d858cc8`（push 17:58:52 JST）→ Vercel success 18:10:09 JST。本番照合（素 URL と `?v=` 付き・x-vercel-cache 記録）は全項目 OK（(5)）。

## (1) 着手前の一次の取り直し（Chrome UA の curl・2026-10-25 17:46〜17:47 JST）

| | URL | HTTP・バイト | sha256 | 結果 |
|---|---|---|---|---|
| (a) 高知 | https://www.pref.kochi.lg.jp/doc/2024011100113/ | 200・34,236 | `9c7477eb…`（便 `1e2b7e7f…`・同じバイト数） | `<h1>`「【募集期間延長（11/30まで）のお知らせ】…」・「更新日 2026年09月29日」・「令和８年11月30日（月）まで　17時必着」・「［延長］」1 回・`<del>10月30日（金）まで　17時必着</del>`。sha の違いは同じバイト数の差＝便の逐語はすべて在る → **■1 続行** |
| (b) 佐賀 | https://ondanka-boushi.net/zc-hojo/ | 200・135,335 | `e77c2f99…`（便 `03afef85…`・133,885・WordPress で日々変わる） | 「申請期間延長しました!!」・「令和８年11月30日（月）17時まで」・「令和8年10月30日（金）→ 令和8年11月30日（月）」。受付終了・予算到達の掲示なし（「受付を終了します。」は「※予算がなくなり次第、受付を終了します。」の 1 回だけ）。予算到達率は「10月23日時点」「太陽光・蓄電池」「41.09%」（便では 10月19日時点・同じ 41.09%・この便では使わない） → **■2 続行** |
| (c) 三重 県 | https://www.pref.mie.lg.jp/TOPICS/m0012300381.htm | 200・25,607 | `b11504a5…`（便 `269c91d2…`・25,606） | `<title>`「三重県｜令和８年度三重県太陽光発電設備等設置費（事業者向け）補助金の募集を再開します」・「※補助金の申請受付を再開します。」。「受付を終了」0 回 → **■3 続行** |
| (c) 三重 センター | https://www.mec.or.jp/ondan/info/%E4%BB%A4%E5%92%8C…/ | 302 → `https://www.mec.or.jp/index.php/ondan/info/…/` で 200・15,326 | `c58625755e7eb9afc48f841c3f2093140aeb5b888a5ff20b8e40882f00895fc2`＝**便と一致** | 「※　補助金の申請受付を再開します。」「補助金の残り金額は、」「４３０，０００円」「2026年10月6日（火）時点」＝変化なし → ■3 の new はそのまま |
| (d) 福島 地産地消型 | https://www.pref.fukushima.lg.jp/sec/11025c/chisanchisyo-r8-2.html | 200・17,587 | `dcc75bec…`＝**便と一致** | 公募期間・申請希望届の逐語は便と同じ |
| (d) 公募要領 | …/uploaded/attachment/767043.pdf | 200・586,432 | `424e73ce…`＝**便と一致** | （同一ファイル） |
| (d) 事業概要 | …/uploaded/attachment/754156.pdf | 200・631,205 | `da4a1e63…`＝**便と一致** | （同一ファイル） |
| (e) 福島 地域活用型 | https://www.pref.fukushima.lg.jp/sec/11025c/katsuyo-r8.html | 200・16,559 | `d8f5918f…`＝**便と一致** | 公募期間の逐語は便と同じ・募集終了の掲示なし |
| (e) 公募要領 | …/uploaded/attachment/753429.pdf | 200・545,485 | `40197631…`＝**便と一致** | （同一ファイル） |
| (f) | microCMS GET | — | — | `import-subsidies.ts` の dry run で 2 slug とも skip されず「[dry-run] POST」＝未登録 |

PDF は curl だけで取った（ブラウザで開いていない）。取得物はリポの外（scratchpad の `primary/`）に残してある。

## (2) PATCH（#106／#122）

```
[補助金 月曜定例 10-20 applier] mode=DRY-RUN plan=reports/subsidies-weekly-2026-10-20.data.json
■ PATCH subsidies/kochi-bess-2026（ss8zx2r_o）ops 1（適用済み 0）→ deadline 21→83字
■ PATCH subsidies/saga-bess-2026（tvs__p89kmzk）ops 1（適用済み 0）→ deadline 42→63字
■ PATCH subsidies/mie-bess-2026（o51k5czja6d）ops 2（適用済み 0）→ status 4→3字・deadline 14→108字
[done] PATCH 3 / POST 0 / skip 0 / 中止 0 / 失敗 0
[生の文字列の突き合わせ] 送る値と計画の適用後の値の不一致 0
[microCMS 呼び出し] GET 6

（本実行 2026-10-25 17:47:38 JST）
[補助金 月曜定例 10-20 applier] mode=本実行 plan=reports/subsidies-weekly-2026-10-20.data.json
■ PATCH subsidies/kochi-bess-2026（ss8zx2r_o）ops 1（適用済み 0）→ deadline 21→83字
   #106/#122: ✓ 送信 1 field 一致・他 field 変化 0
■ PATCH subsidies/saga-bess-2026（tvs__p89kmzk）ops 1（適用済み 0）→ deadline 42→63字
   #106/#122: ✓ 送信 1 field 一致・他 field 変化 0
■ PATCH subsidies/mie-bess-2026（o51k5czja6d）ops 2（適用済み 0）→ status 4→3字・deadline 14→108字
   #106/#122: ✓ 送信 2 field 一致・他 field 変化 0
[done] PATCH 3 / POST 0 / skip 0 / 中止 0 / 失敗 0
[生の文字列の突き合わせ] 送る値と計画の適用後の値の不一致 0
[microCMS 呼び出し] GET 9・PATCH 3

（冪等の確認・dry run 17:47:46 JST）
■ PATCH subsidies/kochi-bess-2026（ss8zx2r_o）[skip] 全 1 op 適用済み（冪等）
■ PATCH subsidies/saga-bess-2026（tvs__p89kmzk）[skip] 全 1 op 適用済み（冪等）
■ PATCH subsidies/mie-bess-2026（o51k5czja6d）[skip] 全 2 op 適用済み（冪等）
[done] PATCH 0 / POST 0 / skip 3 / 中止 0 / 失敗 0
[microCMS 呼び出し] GET 6
```

ログ: `reports/subsidies-weekly-2026-10-20.dry.json`・`.apply.json`・`.dry2.json`。

## (3) POST

```
（dry run）
[import-subsidies] subsidies 現在件数: 97
[import-subsidies] mode=DRY-RUN  入力=2件  処理対象=2件
  [dry-run] POST fukushima-chisanchisyo-saiene-2026 [公募中] 令和8年度 福島県 地産地消型再生可能エネルギー発電設備導入促進事業
  [dry-run] POST fukushima-katsuyo-saiene-2026 [公募中] 令和8年度 福島県 地域活用型再生可能エネルギー導入支援事業
[done] ok=2  skip=0  err=0

（本実行 2026-10-25 17:50:03 JST）
[import-subsidies] mode=EXECUTE  入力=2件  処理対象=2件
  [ok] fukushima-chisanchisyo-saiene-2026 — created id=2_0s-weq2y
  [get照合] fukushima-chisanchisyo-saiene-2026: PASS
  [ok] fukushima-katsuyo-saiene-2026 — created id=gwkvqf9o1
  [get照合] fukushima-katsuyo-saiene-2026: PASS
[done] ok=2  skip=0  err=0
[subsidies 総件数] 投入前=97  投入後=99  差分=+2
```

実行日の書き換え（リポの写しだけ）: 2 件の body の「2026年10月20日時点」→「2026年10月25日時点」、「（2026年10月20日確認）」→「（2026年10月25日確認）」。各 2 か所・計 4 か所。ほかの文言は変えていない。

全 field の照合（slug で GET・`_note` を除く 14 field）:

| field | 地産地消型（2_0s-weq2y） | 地域活用型（gwkvqf9o1） |
|---|---|---|
| slug・name・organization・category・status | 一致 | 一致 |
| subsidyRate・upperLimit・targetEntity | 一致 | 一致 |
| applicationStart・deadline・fiscalYear・sourceUrl・scheme | 一致 | 一致 |
| body（`plain()` で比較） | 一致（正規化 2,018 字・生 送信 2,326／保存 2,326） | 一致（正規化 1,531 字・生 送信 1,832／保存 1,832） |

不一致 0。

## (4) `src/data/subsidies.json` の差分（c28b400 → d858cc8）

- 件数 78 → 80（追加 `fukushima-katsuyo-saiene-2026`・`fukushima-chisanchisyo-saiene-2026`・削除 0）。ほかの 75 件の変化 0。
- 変化した 3 件と鍵（期待どおり）:

| slug | 鍵 | 前 | 後 |
|---|---|---|---|
| kochi-bess-2026 | deadline_iso | 2026-10-30 | 2026-11-30 |
| | deadline_raw | 令和８年10月30日（金）まで　17時必着 | 令和８年11月30日（月）まで　17時必着　［延長］（延長前は10月30日（金）まで　17時必着。募集期間内であっても、内示額の合計が予算額に達した時点で募集を終了） |
| | updatedAt | 2026-09-23T09:30:27.378Z | 2026-10-25T08:47:46.825Z |
| saga-bess-2026 | deadline_iso | 2026-10-30 | 2026-11-30 |
| | deadline_raw | 令和８年10月30日（金）17時まで（先着順）※予算がなくなり次第、受付を終了します | 令和８年11月30日（月）17時まで（先着順）※予算がなくなり次第、受付を終了します（受付終了日は10月30日（金）から延長） |
| | updatedAt | 2026-09-23T09:30:25.418Z | 2026-10-25T08:47:48.731Z |
| mie-bess-2026 | status | ["受付終了"] | ["公募中"] |
| | deadline_raw | 令和８年１１月６日（金曜日） | 令和８年１１月６日（金曜日）（三重県は2026年9月7日に「※補助金の申請受付を再開します。」と告知。補助金の残り金額は430,000円〔2026年10月6日（火）時点・三重県地球温暖化防止活動推進センターの掲示〕） |
| | updatedAt | 2026-09-23T09:30:45.068Z | 2026-10-25T08:47:50.713Z |

- 福島 2 件の派生値（便 ■4 の表と一致）:

| slug | prefs | use_cases | entities | kind | rate_max_pct | start_iso | deadline_iso | 状態 |
|---|---|---|---|---|---|---|---|---|
| fukushima-chisanchisyo-saiene-2026 | 福島 | self_consumption, industrial | corporate | subsidy | 50 | 2026-10-15 | 2026-11-20 | 公募中 |
| fukushima-katsuyo-saiene-2026 | 福島 | self_consumption, industrial | corporate, municipal | subsidy | 10 | 2026-07-01 | 2026-11-16 | 公募中 |

- ビルド: `npm run build` BUILD EXIT 0 → `npm run type-check` EXIT 0。
- commit `d858cc8`（push 2026-10-25 17:58:52 JST・`c28b400..d858cc8`）。同じ push に、別便（relation 欄の applier 改修）の `25d2f15`（scripts と reports だけ・本番の表示に関係しない）が先に乗っている。
- Vercel: success 2026-10-25 18:10:09 JST。

## (5) 本番照合（2026-10-25 18:10:55 JST・デプロイ完了の 46 秒後）

| 種 | URL | HTTP | x-vercel-cache | age | 結果 |
|---|---|---|---|---|---|
| 素 | /subsidies/kochi-bess-2026 | 200 | PRERENDER | 0 | 「令和８年11月30日（月）まで」3 回・「10月30日（金）まで」は 3 回とも「延長前は」に続く形（締切として出している箇所 0）・「公募中」3・description に「締切11/30」 |
| ?v= | 同 | 200 | HIT | 0 | 同じ |
| 素 | /subsidies/saga-bess-2026 | 200 | PRERENDER | 0 | 「令和８年11月30日（月）17時まで」3 回・description に「締切11/30」・題「SAGAゼロカーボン加速化事業（事業者向け）補助金 — 公募中｜蓄電所ネット」（不変） |
| ?v= | 同 | 200 | HIT | 0 | 同じ |
| 素 | /subsidies/mie-bess-2026 | 200 | PRERENDER | 0 | 題「三重県太陽光発電設備等設置費（事業者向け）補助金 — 公募中｜蓄電所ネット」・題の「受付終了」0・「申請受付を再開します」3・「公募中」5 |
| ?v= | 同 | 200 | HIT | 0 | 同じ |
| 素 | /subsidies/fukushima-chisanchisyo-saiene-2026 | 200 | PRERENDER | 0 | 題「福島県 地産地消型再生可能エネルギー発電設備導入促進事業｜蓄電所ネット」（■4 の表どおり・状態は入らない）・「公募中」3・締切の逐語 4・県のページへのリンク 3 |
| ?v= | 同 | 200 | HIT | 0 | 同じ |
| 素 | /subsidies/fukushima-katsuyo-saiene-2026 | 200 | PRERENDER | 0 | 題「福島県 地域活用型再生可能エネルギー導入支援事業 — 公募中｜蓄電所ネット」（■4 の表どおり）・「公募中」5・締切の逐語 4・県のページへのリンク 3 |
| ?v= | 同 | 200 | HIT | 0 | 同じ |
| 素 | /subsidies | 200 | PRERENDER | 0 | 「該当（全80件中）」・「公募中のみ表示 37件」・「公募中（37件）」。ビルド日 10/25 の `displaySubsidyStatus` で数えた値は前 34 → 後 37（一致）。「いま公募中（締切が近い順）」の一覧 37 件に三重・福島 2 件が各 1 回 |
| ?v= | 同 | 200 | HIT | 0 | 同じ |
| 素 | /sitemap.xml | 200 | PRERENDER | 0 | 福島の 2 slug 各 1 回・`fukushima-renewable-storage-2026` 0 回 |
| ?v= | 同 | 200 | HIT | 0 | 同じ |
| 素 | /tools/subsidy-match | 200 | PRERENDER | 0 | 初期 DOM には制度名が出ない（診断はブラウザ側）。ビルド出力 `subsidies.json` で福島 2 件と三重がどれも status 公募中・deadline_iso 未来＝候補に入る状態 |

すべて素 URL で新しい内容（PRERENDER・age 0＝新しい deploy の出力）。判定 NG 0。

## (6) 訂正履歴の扱い（■6）

- 高知・佐賀（延長）・三重（県の再開への追随）は更新、福島 2 件は新しい掲載として `src/data/corrections.json` には足していない。
- 三重を載せるとしたときの案（ユウの判断用・1 行ずつ）:
  - before: 「受付終了（2026年9月7日に県が申請受付の再開を告知した後も、受付終了と表示）」
  - after: 「公募中に直し、締切欄に県の再開の告知と残り金額（430,000円・2026年10月6日時点）を書き足しました」
  - 種別「訂正」・日付 2026-10-25・path `/subsidies/mie-bess-2026`・basis 三重県「三重県｜令和８年度三重県太陽光発電設備等設置費（事業者向け）補助金の募集を再開します」（https://www.pref.mie.lg.jp/TOPICS/m0012300381.htm）

## (7) 前提違い・気づいた点

- 前提違いは無かった。一次はすべて便の「事実」のとおり（高知・三重 県のページは sha が違うがバイト数がほぼ同じで逐語は同一、佐賀は日々変わる WordPress）。
- 推進センター（三重）の URL `https://www.mec.or.jp/ondan/info/…` は 302 で `https://www.mec.or.jp/index.php/ondan/info/…`（小文字の %xx）に転送される。転送先は便の取得と同じバイト列。
- 佐賀の予算到達率は「10月23日時点」で「太陽光・蓄電池 41.09%」（便の 10月19日時点と同じ値）。この便では使っていない。
- use_cases の粗さ（便 ■4 のとおり）: 福島 2 件はどちらも発電事業の補助だが、「需要家」「事業所」「PPA」の語から self_consumption・industrial が付く。キーワード方式の限界。grid は付かない。
- 公募要領（地産地消型）の表２の蓄電池の単位は「２０万円／ｋＷ」で、事業概要は「20万円/kWh」。サイトの本文は事業概要の表記（「事業概要の表記」と明記）で、台帳の note にも両方を書いた。
- 便 §3-11 の順（type-check → build）は、この worktree では生成物（`src/lib/generated/`・`src/data/eic/`）が無いため type-check が先に失敗した（TS2307・生成物の未生成。memory の generated-untracked-bootstrap と同じ）。build（prebuild で生成）→ type-check の順で走らせ直し、どちらも EXIT 0。
- ビルドのログに `verify:asset-check` と `verify:balancing-rules` の ★WARN（生成スクリプトを `node_modules/tsx` のパスで呼ぶが、この worktree には `node_modules` が無い＝ Cannot find module）。prebuild は WARN だけで止まらない。Vercel には `node_modules` があるので本番の判定には関係しない。
- prebuild で `src/data/substations/index.json`（total 8,345 → 8,346 など）・都道府県別の変電所 JSON 44 本・`legacy-news-allowlist.json`・`alias-expansion-report.json` も書き換わった。リポの静的 JSON が microCMS の現値より古いということ（この便の対象外）。**commit していない**（作業ツリーに変更として残っている）。

## (8) 申告

- 台帳: `src/data/source-documents.json` に福島の 5 件（便 ■5）を登録（375 → 380 件）。高知・佐賀・三重は触っていない。
- 一時物（消していない）: 一次の取得物（`primary/` の HTML 5・PDF 3・302 の応答 1）・ビルドのログ 3 本・照合用のスクリプト（POST の全 field 照合・公募中の件数・本番照合）は scratchpad（リポの外）に置いた。
- ★`scripts/.tmp-count-open.ts` をリポの中に空で作ってしまい、すぐ `mv` で scratchpad へ移した（消していない・リポには残っていない）。
- `.env.local` は worktree に無いので、元のチェックアウトのものを `set -a && . … && set +a` で読み込んだ（内容は表示していない）。
- `_QUEUE.md`: この便の行を DONE にし、報告パスを書いた（便の規則どおり自分の行だけ）。
