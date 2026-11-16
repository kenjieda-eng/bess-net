# projects の小さな直し便 — ADW の益城町と松阪（2026-11-16・CC・`_QUEUE.md` 116 行）

microCMS の書込は `projects` の **PATCH 2 件（5 op）**（POST・DELETE・PUT 0・ほかの API 0）。webhook は止めていない（書込 2 件）。
コードは `src/data/corrections.json` に 2 件（`20261116-01`・`20261116-02`）と、資料名の台帳 `src/data/source-documents.json` に 2 件（E1・M1）。

## (0) 申告

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\projects便_小さな直し_ADWの益城町と松阪_名称と事業者と運転開始の欄_PATCH2・訂正履歴2件_Claude_Code投入_2026-11-15起草_ユウ.md`（6,414 バイト・最終更新 2026-11-15 21:46 JST）
- 計画: 同じフォルダの `projects-plan-2026-11-15b_ADWの益城町と松阪_一次照合済み_ユウ.json`（7,764 バイト・最終更新 2026-11-15 21:46 JST）
  - sha256 の先頭 16 桁 **`a0a5a604c6fd8d56`**（便の値と一致）。リポに `reports/projects-plan-2026-11-15b_ユウ.json` として写した（値は変えていない）。
- 裁定: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\02_計画・運営\検証記録_projects便_11月13日のニュースに出た設備の登録と更新_2026-11-15_ユウ.md` の裁定 1（11,224 バイト・最終更新 2026-11-15 22:56 JST）。
- GO: `_QUEUE.md` 116 行（ユウ 11/16 10:0x・EDAさん 10:03「任せます」）。ほかの GO 便は無い。
- 実行: 2026-11-16 10:3x JST（一次の取り直し 10:34:48・計画づくりの GET 10:35:44・本実行 10:36:05〜10:36:13）。main の HEAD **`b4b0626`**（origin/main と同じ）。
- スクリプト: `scripts/build-projects-write-2026-11-16b.ts`（読むだけ・GET 5）・`scripts/apply-projects-2026-11-16b.ts`（`runApplier`・11/15 と同じ形）。
- 記録: `reports/projects-write-2026-11-16b.json`（計画＋照合）・`.dry.json`（書込前の dry run）・`.apply.json`・`.dry2.json`（書込後の dry run＝2 件とも skip）。

## (1) GET と old・keep の照合・一次の照合

- projects の全件 **419**（2026-11-16 10:35:44 JST）。
- 対象 2 件を slug で GET: V1 `pr-co160356-bess-2`（id `5wym-85hrn9`・updatedAt 2026-09-03T10:27:32.273Z）・V2 `pr-co160356-bess`（id `hn71p7s3tx`・updatedAt 2026-09-08T04:37:08.909Z）。どちらも 11/15 の後に変わっていない。
- **計画の old と GET の値: 5 op すべて一致**（V1 name「系統用蓄電所（ADワークスグループ）」・operator「ADワークスグループ」・cod `2026-08-31`・body は GET の値〔563 字〕を old に／V2 cod `2026-03-31`）。訂正履歴の before の「運転開始 2026-08-31」「運転開始 2026-03-31」は、この cod の値が詳細ページの「運転開始」の行に出ていたもの（書込の前に本番のページは開いていない＝#127）。
- **計画の keep と GET: 15 欄すべて一致**（違ったもの 0）。
- 一次 2 本を素の curl で取り直した（10:34:48〜・1.5 秒あけ・並列なし・ブラウザのふりをする UA なし）:
  - E1 `https://prtimes.jp/main/html/rd/p/000000085.000160356.html`: HTTP 200・258,129 バイト（計画と同じ）・`dateModified` 2026-08-31 19:10:48。
  - M1 `https://prtimes.jp/main/html/rd/p/000000054.000160356.html`: HTTP 200・240,944 バイト（計画と同じ）・`dateModified` 2026-03-31 19:10:57。
  - sha256 は計画の値と違う（PR TIMES の枠の部分。11/15 の便と同じ）。照合は逐語で行った。
- 照合（NFKC・空白を除いて・script を除いた本文で）:
  - 計画の `ev` **12 個すべて**（V1 10・V2 2）が、その一次の見える本文にある。
  - V1 の本文の「」の引用と出典の題名 **7 個すべて**・数字と日付 **8 個すべて**が E1 にある。出典リンクの題名・発行元・日付は E1 と一致。
  - 訂正履歴 2 件の「」の引用のうち一次からの引用（「竣工・引渡日」「ADワークスグループ」「株式会社エー・ディー・ワークス」「ADW熊本益城町蓄電所」「本連系を完了し、稼働開始したことをお知らせいたします」）はすべて一次にある。basis の題名 2 本も一次のページの題名と一致。
  - **合わなかったもの: 0**。

## (2) PATCH 2 件

| | slug（id） | 旧 → 新 | GET 照合 |
|---|---|---|---|
| V1 | `pr-co160356-bess-2`（`5wym-85hrn9`） | name「系統用蓄電所（ADワークスグループ）」→「**ADW熊本益城町蓄電所**」／operator「ADワークスグループ」→「**株式会社エー・ディー・ワークス**」／cod `2026-08-31` → **空**／body 563 → 639 字（全文・計画の本文） | 送信 4 field 一致・他 field 変化 0 |
| V2 | `pr-co160356-bess`（`hn71p7s3tx`） | cod `2026-03-31` → **空** | 送信 1 field 一致・他 field 変化 0 |

- cod を空にする書き方は 11/8 の揖斐川・長野と同じ（文字列の op で new ""。microCMS は空として保存）。
- 送った値は、dry run の段階で計画の `new` と機械で突き合わせて **5 欄すべて一致**。
- 冪等: 書込の後にもう一度 dry run（`.dry2.json`）→ **2 件とも skip**（expect_final と一致）。中止 0・生の文字列の突き合わせの不一致 0。
- microCMS の呼び出し: 計画づくり GET 5・dry run GET 4×2・本実行 GET 6・PATCH 2。
- slug は変えていない。状態（稼働中）・出力と容量・所在地・出典・市場の欄は変えていない（keep のとおり）。

## (3) 訂正履歴の 2 件・資料名の台帳

- `src/data/corrections.json` の `items` の末尾に 2 件（既存の 497 件は 1 字も変えていない・499 件）:
  - **`20261116-01`**: 訂正・`/projects/pr-co160356-bess-2`・targetTitle「ADW熊本益城町蓄電所」（運転開始の欄・事業者・名称）。
  - **`20261116-02`**: 訂正・`/projects/pr-co160356-bess`・targetTitle「ADW三重松阪市蓄電所」（運転開始の欄）。
  - before・after・basis は計画の `corrections` のまま。date は本番に出た日（2026-11-16・(4)）、internalRef はこの報告。
- 資料名の台帳 `src/data/source-documents.json` に 2 件を足した（追記だけ・446 → 448 件）: E1（V1 の本文の出典・`20261116-01` の basis）と M1（`20261116-02` の basis）。どちらも台帳に無かった。title_verbatim は 10:34 に素の curl で取った `<title>`・checked_on 2026-11-16。`verify:source-names --no-cms` は ok（台帳に無い資料名 0）。

## (4) デプロイ・本番の確認

- push 前のローカル: `npx tsc --noEmit` PASS・`npm run build` PASS（BUILD EXIT 0・prebuild の verify は全部通過・`verify:corrections` ok 499 件・`verify:source-names` ok 台帳 448 件）・`verify:linkify` PASS（15 ページ clean）・`verify:projects-body` 28 PASS／0 FAIL。
  - 1 回目の build（11/16 10:3x）は Git Bash の fork の失敗（`dofork: child -1 - forked process died unexpectedly`・`Resource temporarily unavailable`）で途中で止まった（コードの失敗ではない）。16:1x に取り直して PASS。取り直しの前に、書込後の dry run をもう一度流して 2 件とも skip（microCMS は書いた状態のまま）を確かめた。
- PATCH 2 件は 10:36 に書いた（webhook のビルドで本番に出ていた・書き直していない）。commit **`062a78d`** を 16:15 に push → Vercel **success**（16:26:29 に確認・`/build-info.json` の builtAt 2026-11-16T16:20:44+09:00）。
- 本番（素の URL・クエリなし・初期 DOM〔script を除き `<!-- -->` を剥がした〕）:

| 時刻（JST） | URL | HTTP | x-vercel-cache | age | 確認 |
|---|---|---|---|---|---|
| 16:26:37 | `/projects/pr-co160356-bess-2` | 200 | PRERENDER | 0 | h1「**ADW熊本益城町蓄電所**」・事業者「**株式会社エー・ディー・ワークス**」・**運転開始の行が無い**（欄は 所在地「熊本県 益城町」・事業者・出典 の 3 つ）・本文は計画の本文の 4 段落とも文字どおり・旧本文の「三重に立地」は無い・「訂正履歴を見る」と記事末の `correction-20261116-01` |
| 16:26:38 | `/projects/pr-co160356-bess` | 200 | PRERENDER | 0 | h1「ADW三重松阪市蓄電所」・**運転開始の行が無い**（所在地「三重県 松阪市」・事業者・出典）・第 1 段落が「…ステータス：稼働中。」で終わる・「訂正履歴を見る」と `correction-20261116-02` |
| 16:26:39 | `/projects` | 200 | HIT | 8 | 掲載件数 **314**（変わらず）・「ADW熊本益城町蓄電所」がある・「系統用蓄電所（ADワークスグループ）」は無い・`/projects/pr-co160356-bess-2` へのリンク |
| 16:26:40 | `/corrections` | 200 | PRERENDER | 0 | 2 件とも targetTitle・before の各行・after の各行（益城町 3 行・松阪 1 行）・対象ページへのリンクがある |

- 30 分後の確かめはユウが行う（EDAさん 11/16 の指示）。CC は待たずに終えた。

## (5) IndexNow

- `scripts/indexnow-submit.ts --urls reports/projects-write-2026-11-16b.indexnow-urls.txt`: dry run → `--apply`（16:26:5x JST・鍵 605d…）。
- 送った URL **4 件**（`/projects/pr-co160356-bess-2`・`/projects/pr-co160356-bess`・`/projects`・`/corrections`）。変電所の詳細 0・noindex 0。
- 応答: **1〜4 件目 HTTP 200（受理）**・1 回（記録 `reports/projects-write-2026-11-16b.indexnow.json`）。本番の鍵のファイルは HTTP 200・中身一致。

## (6) 申告

- 一時物（リポの外・消していない）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\wp1116\`（`prim\` に一次 2 本・`work\` に照合のスクリプトと結果）。
- 作業前からある未コミットの差分（`src/data/substations/*.json`・`scripts/experimental/operators/alias-expansion-report.json`）は commit に入れていない。
- rm／Remove-Item・`git push --force`・`.env` の表示はしていない。microCMS の書込は projects の PATCH 2 だけ。
