# 金曜#6 追修便③ 報告（2026-09-12）

カジノ化ドメインの解除・和歌山と鹿児島の直し残り・伊万里の cod・丹波の座標・301 元の固定参照・`src/lib/generated/` の扱い。
書込は microCMS PATCH（差分限定・件別提示・#106）とコード修正のみ。POST・DELETE・PUT なし。

---

## 0. 先に確認してほしいこと

1. **■2(a) の IR は既に在った**（生値で確認）。`kenep.co.jp/pdf/ir_20260414-1.pdf` へのリンクと逐語「和歌山メガパワー蓄電所は2026年３月から商業運転を開始しております。」は本文の第 1 段落にある。
   依頼者の要約ツールに見えていた「jicn.co.jp と PR TIMES の 2 本」は本文末尾の出典ブロック（取込器テンプレのまま）で、そこには IR は並んでいない。依頼どおり追加はしていない。
2. **■2(c) は容量を null にした**。8.2 の出所は JICN の PR TIMES の概数「設備容量約8.2MWh」（対になる出力はスキーム図の「1.9MW」＝不採用）で、事業者エネルギーパワーの一次は 8,226kWh。
   **同じ食い違いが朝来・丹波にもある**: 両施設も 2025 年の発行者情報の（注）は「出力で1,976kW」だが、DB は 1.979／8.226 で入っている。同じ型を 1 つの DB で別々に処理しないなら、3 施設まとめて「1.979／8.226（取得開示・kenep 一覧の値）」か「3 件とも保留」かを決める必要がある（§2.3・承認事項）。
3. **■3 は同趣旨の節が既にあった**ので、足さずに置き換えた（重複させない）。「同資料の該当部分は「2026年2月12日公表資料 引用」で」を、依頼例の形の 1 文「なお 2026年8月6日付の決算説明資料に残る 2026年12月 の記載は、同年2月12日付資料の再掲である（…）。」へ。
4. **■6 の microCMS 側の固定参照（/links・/news の relatedTerms、FAQ の関連用語）は、データを書き換えず表示の直前に宛先へ付け替えた**（共有ヘルパ `canonicalizeTermLinks`）。用語本文の固定リンク 1 件だけは PATCH。
5. **■7 は `.gitignore` に入れたが、追跡中の 11 ファイルはこの行だけでは ignore されない**。`git rm -r --cached src/lib/generated`（リポジトリから外すだけでディスクのファイルは消さない）が別途必要で、rm 系の操作なので承認待ちにした（§7）。
6. **■1 の当該 news は、サイト上は本便の前から 404 だった**。2026-07-18 の主題キーワードゲート（ffde8f3「蓄電池と無関係なPRを表示系から一貫除外」）が、蓄電・BESS 等の語を含まない記事（熱電発電チューブの発表）として除外しており、`src/lib/generated/news-topic-exclusions.json` に 17b1163（9/11）・c81488b（本便の前）の時点で既に載っている。本番の sitemap（12,498 URL）にも無い。
   → サイトの詳細ページ・sitemap からカジノ化したリンクが配信されていたわけではなく、**残っていたのは microCMS のデータ側**（allowlist で復帰させた時点で露出する状態）。依頼どおりリンクは外した。本便の PATCH は `<a>` を外しただけでゲートの判定語には触れない＝404 は本便の影響ではない。本番での確認は API の生値で行った（§10）。

---

## 1. ■1 カジノ化ドメインのリンク解除

- (a) `news/pr-2025-06-09-co156400-2` の body: `<a href="https://ict2025.jp/" … rel="noopener noreferrer nofollow">The 41st International and 7th Asian Conference on Thermo-electronics (ICT/ACT 2025)</a>` → 学会名の平文だけ残す。本文中の「ict2025」は 0 件（URL の平文も残していない）。リンク先は開いていない（must なし）。
- (b) 全 endpoint（projects 344・policy-events 107・news 1,385・explainer 263・glossary 1,535・faq 62）の全 field を grep → `ict2025` の参照は**この 1 件だけ**。
- (c) 前便の「死亡・変質 60 件」の内訳（解除は Lk-1 便で）:

| 区分 | 件数 | 該当 |
|---|---|---|
| **ドメイン転売・別サイト化** | **1** | news/pr-2025-06-09-co156400-2 → ict2025.jp（本便で解除済み） |
| **内容変質**（HTTP 200 のまま中身が別物・空） | **4** | news/pr-2025-12-12-co54933-48 の YouTube 2 本（非公開化）・news/pr-2024-09-12-co42328-1076 の jpi.co.jp（ソフト404「セミナーが存在しません」）・news/pr-2025-05-20-co70390-64 の n-expo.jp（2027 年版の頁に切替） |
| アンカー構造の崩れ（リンク先は 200） | 1 | news/pr-2025-10-30-co111100-134 の Amazon（取込時に `<a>` がラベルを包んだ） |
| 名前解決不可（ドメイン不存在・応答なし） | 14 | explainer の東北 6 県 × 本文・出典欄＝12（`www.tohokuepco.co.jp` はハイフン抜けで元から不存在）・toshiba-energy.com・k-line-inc.com |
| 404（URL 移転・削除・保存期限切れ） | 40 | 送配電各社のハブ URL（東電PG・関西送配電・九電送配電・北海道NW・東電RP）・住友電工・TDnet 保存期限切れ ほか |

---

## 2. ■2 和歌山 `pr-co140317-bess`

### 2.1 (a) 生値の確認 — 既に在る

| 所在 | 生値 |
|---|---|
| sourceUrl（単一 field） | https://prtimes.jp/main/html/rd/p/000000034.000140317.html（JICN の発表・所在地と支援の一次） |
| body 第 1 段落 | 「朝来メガパワー蓄電所及び丹波メガパワー蓄電所は2025年12月から、和歌山メガパワー蓄電所は2026年３月から商業運転を開始しております。」（出典: `<a href="https://kenep.co.jp/pdf/ir_20260414-1.pdf">エネルギーパワー「子会社設立に関するお知らせ」</a>`, 2026年4月14日）— リンク 1 本・逐語あり |
| body 末尾の出典ブロック | 🎯 企業元リリース: jicn.co.jp／企業公式サイト: jicn.co.jp（→ 本便で是正）／PR TIMES: JICN の発表 |

### 2.2 (b) 企業公式サイト

事業者はエネルギーパワー株式会社。同社の適時開示の表紙の URL 欄は「https://kenep.co.jp/」（ir_20260414-1 ほか）、同サイトの題名は「エネルギーパワー株式会社｜ENERGY POWER｜…」。
出典ブロックの「企業公式サイト: https://www.jicn.co.jp/」→「企業公式サイト: https://kenep.co.jp/」へ差し替えた（表示名＝URL のため href と表示の両方）。
「🎯 企業元リリース: https://www.jicn.co.jp/」は発表主体（JICN）のトップで、取込器テンプレのラベル問題（前便 §1.3 の 407 件と同型）。本便では触れていない。

### 2.3 (c) 容量 8.2 の出所 → 保留（null）

| 値 | 出所 | 性質 |
|---|---|---|
| **8.2（現値）** | JICN の PR TIMES 本文「和歌山県和歌山市松江に**設備容量約8.2MWh**の系統用蓄電所を建設・運営する事業を計画しています。」・スキーム図「出力 1.9MW、容量 8.2MWh」 | 概数。同じ図の出力 1.9 は採っておらず、片方だけ使っていた |
| 8,226kWh | 事業者の一次: 発行者情報 ir_20251128-4 p.19「（注）完成後の増加能力は、出力で1,976kW、蓄電容量で8,226kWhを想定しております。」・kenep 発電所一覧「定格容量8,226kWh予定」 | 同じ一次の出力が 1,976kW（発行者情報）／1,979kW（取得開示・一覧）で食い違う |

依頼の規則（対になる諸元は同じ一次から。出力を保留するなら同じ不確かな出所の容量も保留）に従い、capacityMwh 8.2 → null。
**要判断（承認事項）**: 朝来・丹波（DB 1.979／8.226）も発行者情報 ir_20250530-1 p.16 の（注）は「出力で1,976kW」で、同じ型の食い違いを持つ。3 施設を同じ扱いに揃える案:
- 案A: 3 施設とも 1.979／8.226（取得開示・kenep 一覧の値。発行者情報の 1,976 は注記として本文に残す）
- 案B: 3 施設とも保留（null／null）

---

## 3. ■3 鹿児島 `adw-kagoshima-bess`

既存の節「…とあるが、同資料の該当部分は「2026年2月12日公表資料 引用」で、後の8月31日付資料と食い違う。」を次の形に置き換えた（三資料を順に見せる時系列の書き方は不変）:

> …とあるが、後の8月31日付資料と食い違う。なお 2026年8月6日付の決算説明資料に残る 2026年12月 の記載は、同年2月12日付資料の再掲である（同資料 p.25「企業価値向上に向けた成長戦略 （2026年2月12日公表資料 引用）」）。

一次: 8/6 資料 p.25 の扉「企業価値向上に向けた成長戦略 （2026年2月12日公表資料 引用）」・p.46「第３号拠点 鹿児島県鹿児島市にて 2026年12月稼働開始予定」。

---

## 4. ■4 伊万里 `adw-imari-bess`（鹿児島と同じ形）

**8/31 付資料の該当行（逐語）**: [エー・ディー・ワークスの系統用蓄電所事業、第２号「ADW熊本益城町蓄電所」が竣工・稼働開始（2026年8月31日）](https://contents.xj-storage.jp/xcontents/32500/4e70bc3a/61ad/4235/9598/07d55a68f006/140120260831528488.pdf) p.9「〈更新〉2026年8月31日付 ５．蓄電所保有状況／用地取得状況」

> 7号 佐賀県伊万里市 約2MW／約8MWh
> 稼働準備中
> （2028年稼働予定）

（pdftotext -raw のコンテンツ順。-layout は行をずらすため不使用。行の帰属は前便の反証で語座標でも確定済み）

年精度（2028年）のため cod を null にし、sourceUrl を最新の一次（8/31 資料）へ、本文は 6/22 発表 → 6/24 資料 → 8/31 資料の順に示した:

| 時点 | 一次 | 記載 |
|---|---|---|
| 2026-06-22 | PR077「エー・ディー・ワークス、系統用蓄電所事業拡大に向け 第７号・第８号開発用地の取得契約を締結」 | 稼働開始時期 2027年５月（予定） |
| 2026-06-24 | ADWG 資料「５．蓄電所保有状況／用地取得状況」 | 7号 用地取得契約締結（2027年稼働予定） |
| **2026-08-31（最新）** | ADWG 資料 p.9 | 7号 稼働準備中（2028年稼働予定） |

6/24 資料へのリンクの表示名も、頁見出し「５．蓄電所保有状況／用地取得状況」から PDF の表題へ是正した（鹿児島と同じ）。
同じ 8/31 の表で 8号 日光（DB cod 2027-09-01）・9号 東浦（2028-02-01）は年が一致するため触っていない（月は 6/22・6/24 の一次のみ）。

---

## 5. ■5 丹波 `tamba-megapower` の座標

逆ジオ（国土地理院）: `{"muniCd":"28223","lv01Nm":"青垣町西芦田"}` — 一次所在地「兵庫県丹波市青垣町西芦田字藤渕」の**町名（青垣町西芦田）まで一致**を書込直前にも確認してから、latitude 35.227734・longitude 134.98851 を設定。

---

## 6. ■6 301 元の固定参照 → 宛先へ差し替え

| 種別 | 箇所 | 301 元 → 宛先 | 扱い | built HTML 上の本数 |
|---|---|---|---|---|
| コードの固定リンク | src/components/IRRSimulator.tsx:1270 | irr → internal-rate-of-return | リテラルを差し替え | /tools 1 |
| コードの判定用リスト | src/app/glossary/[slug]/page.tsx `GRID_RELATED_GLOSSARY_SLUGS` | non-firm-detail・output-control | 削除（宛先 non-firm-connection・curtailment は既にある。301 元の頁は描画されない死に行） | 0（リンクではない） |
| microCMS の参照（人が選んだ関連用語） | links.relatedTerms（/links 各頁） | repower-eu・ul-9540a-standard・multi-use-detail・lfp・non-firm-detail・cbi-standard-2 | 表示の直前に宛先へ付け替え（`canonicalizeTermLinks`・同じ宛先は 1 つにまとめる） | /links 201 |
| 同上 | news.relatedTerms（12 参照） | tesla-megapack-product・low-voltage-resource・iea-international | 同上 | /news 12 |
| 同上 | faq/faq-seido-07.relatedGlossary | output-control | 同上（`canonicalizeSlugLines`・サーバー側で付け替えてから FaqClient へ） | /faq 1 |
| microCMS の本文 | glossary/capacity-contribution.detail | capacity-procurement-contract-amount → capacity-contract-payment | PATCH（href のみ・表示語不変） | /glossary 1 |
| （対象外）除外用リスト | src/app/sitemap.ts の denylist | — | 変更不要（除外のための列挙） | 0 |
| （対象外）生成一覧 | 関連プロジェクト（news・glossary 詳細・tracker・explainer）が PROJECTS_301 の元を指す（約 75 本） | — | 規則上は「除外」。生成器への配線は本便の対象外（固定参照ではない） | — |

`verify:no-301-links` に軸1c を追加: コード内の `'/glossary/<301元>'` リテラルが残れば FAIL。

---

## 7. ■7 `src/lib/generated/`

- **gitignore 済みではなかった**（`git check-ignore` 非該当）。11 ファイルがすべて追跡中（計 約 17MB。glossary-detail-index 7.9MB・grid-area-lists 5.4MB など）。
- 11 ファイルとも package.json の prebuild 連鎖（build:glossary-faq-index … build:projects-maintenance）のどれかが毎ビルド書き出す（書き手を 1 対 1 で確認済み）。prebuild は `&&` 連鎖なので、どれかが失敗すればビルド自体が止まり、コミット済みの版がフォールバックとして使われる経路も無い。
  → **Vercel は `npm run build` の prebuild で毎回再生成するので、repo に置く理由は無い**（`next dev` だけで起動する場合は先に prebuild を 1 回走らせる必要が出る程度）。毎回 dirty になり、5〜8MB の JSON が履歴に積もる害の方が大きい。
- 実施: `.gitignore` に `src/lib/generated/` を追加（新しく増えるファイルは ignore される）。
- **未実施（承認待ち）**: 追跡中の 11 ファイルを外す `git rm -r --cached src/lib/generated`（ディスクのファイルは残る・リポジトリの次のコミットで削除扱い）。rm 系の操作のため本便では実行していない。承認後はこのコマンド 1 本＋ローカルビルドで再生成を確認してからコミットする。

---

## 8. 変更した field（#106 前後照合つき・再実行は全行冪等 skip）

| # | endpoint/slug | field | 前値 | 後値 | #106 |
|---|---|---|---|---|---|
| ■1 | news/pr-2025-06-09-co156400-2 | body | `<a href="https://ict2025.jp/" …>The 41st … (ICT/ACT 2025)</a>` | 学会名の平文のみ（1,888→1,803 字・「ict2025」0 件） | ✓ 他 field 変化 0 |
| ■2(b) | projects/pr-co140317-bess | body | 企業公式サイト: https://www.jicn.co.jp/ | 企業公式サイト: https://kenep.co.jp/（1,297→1,291 字） | ✓ |
| ■2(c) | projects/pr-co140317-bess | capacityMwh | 8.2 | null | ✓ |
| ■3 | projects/adw-kagoshima-bess | body | §3 の前 | §3 の後（1,432→1,503 字） | ✓ |
| ■4 | projects/adw-imari-bess | cod | 2027-05-01 | null | ✓ |
| ■4 | projects/adw-imari-bess | sourceUrl | https://prtimes.jp/main/html/rd/p/000000077.000160356.html | 8/31 付 ADWG 資料 PDF | ✓ |
| ■4 | projects/adw-imari-bess | body | 6/22「稼働開始時期は2027年5月（予定・月精度）」＋6/24「用地取得契約締結」 | §4 の時系列（652→1,219 字） | ✓ |
| ■5 | projects/tamba-megapower | latitude / longitude | null / null | 35.227734 / 134.98851 | ✓ |
| ■6 | glossary/capacity-contribution | detail | `href="/glossary/capacity-procurement-contract-amount"` | `href="/glossary/capacity-contract-payment"`（809→798 字） | ✓ |

スクリプト: `scripts/patch-friday6-followup3-2026-09-12.ts`（書込直前に一次の逐語を取り直し・現在値が承認時と違えば書かない。リンク解除と href 付け替えは「元のリンクが無く、後の文字列がある」で冪等判定）。

---

## 9. 検証

ローカルビルド（fetch-cache 退避 #116・BUILD EXIT 0・本便の PATCH 後のデータ）。

- tsc 0 エラー／verify:linkify 15/15 clean／verify:projects-body 28 PASS（テンプレ指紋一致 172 件・不変）／verify:nearby-cards PASS／verify:operators PASS
- verify:no-301-links PASS: 軸1c（コード内の `'/glossary/<301元>'` リテラル）0・/grid 固定リンク 0・glossary.html 0・宛先不在 0。
  詳細ページ等の 301 元リンク **292 → 75 本**（/links 201→0・/faq→0・/tools→0・/news の relatedTerms 分→0）。残る 75 本は生成一覧（関連プロジェクト）の PROJECTS_301 元のみ（/news 56・/glossary 15・/explainer 2・/tracker 2）
- built HTML:
  - projects/pr-co140317-bess.html: `<dt>運転開始</dt><dd>2026-03-01</dd>`・`企業公式サイト: <a href="https://kenep.co.jp/"`
  - projects/adw-kagoshima-bess.html: 「同年2月12日付資料の再掲である」あり
  - projects/adw-imari-bess.html: 「「7号」のステータスは「稼働準備中」、稼働時期は「2028年稼働予定」」あり・運転開始行なし（cod null）
  - faq.html: `/glossary/curtailment`・`/glossary/internal-rate-of-return`（301 元への直リンク 0）
  - tools/irr-simulator.html: `/glossary/internal-rate-of-return`
  - links/adb-org.html: 301 元へのリンクなし
  - news/pr-2025-06-09-co156400-2 はビルド成果物に無い（主題ゲートで除外＝詳細は 404・§0-6）→ データは本番 API の生値で確認（§10）

---

## 10. デプロイ後の本番 curl

デプロイ: 42ffd55 の commit status が success（2026-09-12T14:23:08Z・開始 14:05:38Z）。取得は 14:23:18〜14:23:24Z、素 URL（クエリ・キャッシュ回避ヘッダなし）・依頼の curl 形式。
**STALE は 0 件**（projects 4 件は `PRERENDER`＝新デプロイの静的生成物・Age 0、news は `MISS`）→ 取り直しは不要だった。

### 10.1 news/pr-2025-06-09-co156400-2 — 404（本便の前から・§0-6）

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/news/pr-2025-06-09-co156400-2"
HTTP/1.1 404 Not Found
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Length: 18767
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 14:23:18 GMT
Etag: "2a5pwocg9pchr"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /news/[slug]
X-Vercel-Cache: MISS
X-Vercel-Id: hnd1::iad1::mmpck-1789222996723-59c458fd940d

404
```

- 404 ページの HTML 全体（RSC 含む）の「ict2025」: 0 件
- 本番 API の生値（デプロイ後に GET・読取のみ）:

```
GET status 200
totalCount 1 | slug pr-2025-06-09-co156400-2 | revisedAt 2026-09-12T13:58:12.964Z | body 1803 字
ict2025 出現: 0
学会名の前後: 作に成功しました。</p><p>　同社はこれら２件の開発成果を、6月15～19日に仙台で開催される「The 41st International and 7th Asian Conference on Thermo-electronics (ICT/ACT 2025)」で発表します。</p><p></p><p></p>
学会名を包む <a>: 0
```

### 10.2 projects/pr-co140317-bess（和歌山）— 200

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/pr-co140317-bess"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 52911
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 14:23:20 GMT
Etag: "c4620bfb0d4633e685a183df63140930"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/pr-co140317-bess
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::hb564-1789222999832-a42db7863a0b

200
```

本文（script 外）の抜粋:
- `<h1>和歌山メガパワー蓄電所</h1>`・`<dt>運転開始</dt><dd>2026-03-01</dd>`
- 企業公式サイト: `https://kenep.co.jp/`（jicn.co.jp へのリンクは「企業元リリース」の 1 本だけ）
- IR 逐語「…和歌山メガパワー蓄電所は2026年３月から商業運転を開始しております。」の出典: `https://kenep.co.jp/pdf/ir_20260414-1.pdf`
- 容量の行: なし（capacityMwh null）

### 10.3 projects/adw-kagoshima-bess（鹿児島）— 200

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/adw-kagoshima-bess"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 57080
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 14:23:21 GMT
Etag: "a7c8eec08c0d8551be79d4a8b65fb9f5"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/adw-kagoshima-bess
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::tfwch-1789223001229-06b1af0f3d7d

200
```

本文の抜粋: 「なお 2026年8月6日付の決算説明資料に残る 2026年12月 の記載は、同年2月12日付資料の再掲である（同資料 p.25「企業価値向上に向けた成長戦略 （2026年2月12日公表資料 引用）」）。」

### 10.4 projects/adw-imari-bess（伊万里）— 200

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/adw-imari-bess"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 56198
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 14:23:22 GMT
Etag: "43f8685fac396abbf9a4b0e363b55ca8"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/adw-imari-bess
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::g297p-1789223002278-785264b11d67

200
```

本文の抜粋:
- 「最新の2026年8月31日付資料（エー・ディー・ワークスの系統用蓄電所事業、第２号「ADW熊本益城町蓄電所」が竣工・稼働開始（2026年8月31日））の同じ表では、「7号」のステータスは「稼働準備中」、稼働時期は「2028年稼働予定」と記載されている（年までの表記）。」
- 運転開始／運転開始予定の行: なし（cod null）・8/31 PDF へのリンク 3 本（本文＋出典）

### 10.5 projects/tamba-megapower（丹波）— 200

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/tamba-megapower"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 55859
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 14:23:23 GMT
Etag: "0f2c229701a95bb53c07f55ac7faebaa"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/tamba-megapower
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::s26c4-1789223003140-dcb1ef8f65b0

200
```

- `<h1>丹波メガパワー蓄電所</h1>`・`<dt>運転開始</dt><dd>2025-12-01</dd>`
- **座標は HTML に出ない**。座標を使う表示は「接続変電所候補」（この頁・半径 10km の変電所）と /grid/[slug] の「近隣のプロジェクト」だが、どちらも変電所側の座標が要り、変電所の座標は中部にしか無い（兵庫の変電所は座標なし）ため、丹波の座標が入っても現時点で見た目は変わらない（「接続変電所候補」の節は非表示のまま）。
- 本番 API の生値（デプロイ後に GET・読取のみ）:

```
GET status 200
{"totalCount":1,"slug":"tamba-megapower","name":"丹波メガパワー蓄電所","latitude":35.227734,"longitude":134.98851,"revisedAt":"2026-09-12T13:58:36.821Z"}
```

---

## 11. 触らなかった行とその理由

| 項目 | 理由 |
|---|---|
| 和歌山の出典ブロックへの IR 追加 | 既に本文第 1 段落に逐語＋リンクがある（依頼どおり報告のみ） |
| 和歌山の「🎯 企業元リリース: jicn.co.jp」 | 取込器テンプレのラベル問題（407 件と同型）。まとめて扱う便で |
| 和歌山の outputMw・朝来／丹波の 1.979／8.226 | 1,976／1,979 の一次内の食い違い。3 施設を揃える案 A/B の判断待ち（§2.3） |
| 伊万里・日光・東浦以外の ADW の status 語（稼働準備中↔計画中／建設中） | 依頼範囲外（前便 §4.4 の表） |
| 8号 日光・9号 東浦の cod | 8/31 の年と一致（食い違いなし） |
| ■1(c) の残り 59 件 | 依頼どおり Lk-1 便でまとめて |
| 生成一覧（関連プロジェクト）の PROJECTS_301 元 | 固定参照ではない（生成器側の除外配線は別便） |
| `git rm -r --cached src/lib/generated` | rm 系の操作のため承認待ち（§7） |
| news/pr-2025-06-09-co156400-2 の主題ゲート除外（詳細 404） | 7/18 のゲートの設計どおり（熱電発電の発表で蓄電池と無関係）。allowlist に入れる理由は無い（§0-6） |
| 丹波の「接続変電所候補」が出ないこと | 兵庫の変電所に座標が無いため（変電所座標は中部のみ）。座標の設定自体は API 生値で確認済み（§10.5） |
