# operators POST 便 — 3 社（コレックHD・グローム・HD・CHC Japan）報告（2026-10-05・CC）

## (0) 読んだ便ファイル（絶対パス）

- `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\operators_POST便_3社_コレックHD・グローム・HD・CHC_Japan_Claude_Code投入_2026-10-05起草_ユウ.md`
- 承認: EDAさん 10/5「任せます・進めて」（判断 ①）→ ユウ裁定（`_QUEUE.md` の GO 10/5 14:20）。根拠は `reports/quarterly-q4-b-2026-10-01.md` ■B-2。

## 結論

- microCMS 書込は **operators の POST 3 のみ**（PATCH・DELETE・PUT 0）。dry run POST 3 → canary 1 社（コレックHD）→ 残り 2 社 → 3 社とも #106 全 field 一致 → 冪等 dry run 3/3 skip。
- id: `correc-hd`＝`sjZ1y189Sy`・`glome-hd`＝`1eYMNfz4TTs`・`chc-japan`＝`egsHcs4e4c`（POST の自動採番。operators は id≠slug の既存レコードが多く、ページは slug で引く）。
- 台帳に一次 3 本を登録（179 件・`verify:source-names:src` 0 種）。commit `0eb8f1b`（push 済み）。
- 本番: push `0eb8f1b` のデプロイ（18:34 JST 完了）後、3 社のページが 200・社名と説明文が初期 DOM に・`/operators` が「全国 574 社」→「**577 社**」（+3）・関連 projects 3 件から事業者ページへのリンクが自動で張られた（要・リンク便ではない）。

## (1) 不在の再確認（POST 直前・2026-10-05 18:11 JST）

- operators を全件 GET（580 件・id 重複 0）し、名称と aliases を `normalizeEntityName`（src/lib/operator-match.ts）で正規化して完全一致・部分一致を照合 → **4 社とも不在**（完全一致 0・部分一致 0。④ アドウェイズ・エナジーは見送りなので照合のみ）。slug `correc-hd`・`glome-hd`・`chc-japan` も既存と衝突なし（applier も POST 直前に slug で GET して 0 件を確認）。
- **一次の取り直し**（Chrome UA・全 200）:

| 一次 | HTTP（bytes） | 確認した逐語 |
|---|---|---|
| コレック PR TIMES https://prtimes.jp/main/html/rd/p/000000110.000040575.html | 200（270,235） | title「系統用蓄電池事業への参入及び蓄電池設備の取得に関するお知らせ \| 株式会社コレックホールディングスのプレスリリース」・「東京都豊島区南池袋」・「エネルギー事業、アウトソーシング事業、メディアプラットフォーム事業」・「系統用蓄電池設備を取得・所有し」・「東証スタンダード」・岡山蓄電所・約２ＭＷ／約８ＭＷｈ |
| コレック 適時開示 PDF（…/140120260831528606.pdf） | 200（169,459） | 「6578」・「東証スタンダード」（証券コードは PR TIMES の本文には無く、この PDF にある） |
| グローム 7/21 適時開示 PDF（…/140120260721597032.pdf） | 200（17,466） | 「上場会社名 グローム・ホールディングス株式会社」「（東証グロース・コード 8938）」「（開示の経過）系統用蓄電所事業の本格展開に向けた子会社設立に関するお知らせ」・「グローム・エナジー株式会社」・「系統用蓄電所に関わる事業全般」 |
| グローム 6/11 適時開示 PDF（…/140120260611567823.pdf） | 200（18,614） | 「（第２号施設）」・「西方町金井2465蓄電所」・「栃木県栃木市西方町金井」（説明文の「第2号施設」の根拠） |
| https://www.glome-holdings.com/ | 200（21,773） | title「グローム・ホールディングス株式会社」 |
| OCCTO 落札電源一覧 PDF（260513_…_besshi_ousatsu2025.pdf） | 200（305,895） | 「6 CHCJapan株式会社 益田市蓄電所 蓄電池（リチウムイオン蓄電池） 75,633」「7 CHCJapan株式会社 新富町蓄電所 蓄電池（リチウムイオン蓄電池） 36,722」 |
| https://chcbess.com/ | 200（247,032） | title「Home - CHC」・「東京都千代田区有楽町」・「Copyright © 2026 CHC Energy Pte Ltd」 |

## (2) 送信値と GET 照合（#106）

計画: `reports/operators-post-3-2026-10-05.data.json`（値は Q4 便B 報告 ■B-2 §3 のまま）。applier: `scripts/apply-operators-post-2026-10-05.ts`（共通 `scripts/lib/microcms-applier.ts`・既定 dry run）。

| 欄 | correc-hd | glome-hd | chc-japan |
|---|---|---|---|
| name | 株式会社コレックホールディングス | グローム・ホールディングス株式会社 | CHC Japan株式会社 |
| category | ["開発事業者"] | ["開発事業者"] | ["開発事業者"] |
| corporateType | 株式会社 | 株式会社 | 株式会社 |
| listedMarket／ticker | 東証スタンダード／6578 | 東証グロース／8938 | （送らない） |
| prefecture／city | 東京都／豊島区 | （送らない） | 東京都／千代田区 |
| sourceUrl | PR TIMES 000000110.000040575 | 7/21 適時開示 PDF | OCCTO 落札電源一覧 PDF |
| websiteUrl | （送らない） | https://www.glome-holdings.com/ | https://chcbess.com/ |
| aliases（改行区切り） | コレックホールディングス／コレック／CORREC | グロームホールディングス／グローム／GLOME／グローム・エナジー株式会社 | CHCJapan株式会社／CHC Japan K.K.／CHCジャパン |
| description＝bessRelation | ■B-2 §3 ①（195 字） | ②（163 字） | ③＋「（OCCTO の落札電源一覧の表記は「CHCJapan株式会社」）」（160 字） |
| 結果 | ✓ 全 12 field 一致（id `sjZ1y189Sy`） | ✓ 全 11 field 一致（`1eYMNfz4TTs`） | ✓ 全 11 field 一致（`egsHcs4e4c`） |

- body・relatedTerms は送っていない（便 §1）。category「開発事業者」は実在の選択肢（使用中 68 件）で、黙って落ちていない（GET で保存を確認）。
- ログ: `reports/operators-post-3-2026-10-05.{dry,apply1,apply2,dry2}.json`。microCMS 呼び出し: dry run GET 3／本実行 GET 6・POST 3／冪等 GET 3。

## (3) 本番（webhook とpush のビルド後・素 URL・初期 DOM）

取得 2026-10-05 18:34 JST（webhook の 3 本は自動 Canceled・push の `bess-2tl5qaykc` が Ready）。初期 DOM は script を除き `<!-- -->` を剥がして数えた。

| URL | HTTP | x-vercel-cache／age | 照合 |
|---|---|---|---|
| /operators/correc-hd | 200 | PRERENDER／0 | title「株式会社コレックホールディングスの蓄電所事業 — 案件1件・関連ニュース1本｜…」・name 5・description（全文）2（リード＋「蓄電所事業との関係」）・「開発事業者」4・sourceUrl あり |
| /operators/glome-hd | 200 | PRERENDER／0 | title「グローム・ホールディングス株式会社の蓄電所事業 — 案件1件・関連ニュース2本｜…」・name 5・description 2・websiteUrl あり |
| /operators/chc-japan | 200 | PRERENDER／0 | title「CHC Japan株式会社の蓄電所事業 — 案件1件｜…」・name 4・description 2・websiteUrl あり |
| /operators | 200 | PRERENDER／0 | title「蓄電所事業者ナビ（全国577社）」（前 574＝580 − 除外 6）・3 社の名称が一覧に各 1 |
| /projects/correc-okayama-kumegun-bess | 200 | PRERENDER／0 | `href="/operators/correc-hd"` 2 本 |
| /projects/glome-nishikata-kanai-2465-bess | 200 | PRERENDER／0 | `href="/operators/glome-hd"` 2 本 |
| /projects/yonden-matsuyama | 200 | PRERENDER／0 | `href="/operators/chc-japan"` 2 本（事業者欄「四国電力・CHC Japan（松山みかんエナジー合同会社）」から解決） |

## (4) 前提違い（逐語で）

1. 便 §1「relatedTerms・body は送らない（第 1 層の作り・前回と同じ）」: 前回（2026-08-23 の第 1 層 POST・`scripts/post-operators-tier1-2026-08-23.ts`）は **body を組み立てて送っていた**（会社概要・蓄電所事業との関係・出典の 3 節）。今回は便の指示どおり body を送らなかった。microCMS は body 無しでも POST を受理し、事業者ページは「詳細」の節を出さないだけで、description・bessRelation・会社情報は表示される（`src/app/operators/[slug]/page.tsx` の `bodyHtml &&`）。既存 580 社は全件 body ありなので、この 3 社だけ「詳細」節が無い。
2. 便 ■B-2 の表の「corporateType 株式会社（※日本語の正式名は自社の一次で未確認）」（CHC）: 便どおり name「CHC Japan株式会社」・corporateType「株式会社」で送った。日本語の正式名・法人格は依然として自社の一次で未確認（英文「CHC Japan K.K.」・OCCTO は「CHCJapan株式会社」）。

## (5) 申告

- 見送った ④ アドウェイズ・エナジーの再検討条件: **当サイトに関連案件が載る、または同社が設備の取得・保有を一次で言う**（今は「系統用蓄電池事業」「需給調整市場を活用し…運用」まで・関連案件なし）。
- 一時物: scratchpad（リポジトリ外）`…/scratchpad/ops1005/`（取り直した一次・不在の照合結果・本番照合スクリプト）。削除したものは無い。
- 新しい事業者ページは、デプロイ完了まで本番で開かなかった（BS+BT 便の教訓＝書込前の確認アクセスが「0 件」をキャッシュする）。
