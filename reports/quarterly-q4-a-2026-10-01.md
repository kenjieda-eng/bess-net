# 四半期Q4 便A コード便 — incidents +3・カオスマップの誤り 3 件・/incidents の社内見出し（報告・2026-10-05・CC）

(0) 読んだ便ファイル（絶対パス）: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\四半期Q4_A_コード便_incidents＋industry-map_Claude_Code投入_2026-10-01起草_ユウ.md`

## 結論

- commit `731da71`（src 3 ファイル＋台帳）。microCMS 書込 0・GET 0。push は `a21b249`（月次バッチの本番再照合 docs・未 push だった分）と一緒に出た。
- `/incidents` の表示 9 → **12 件**。3 件の本文は便の案を一次の逐語で照合し、一次に無い語句を**削った**（足していない。下の表）。
- `/map/industry-chaos` の誤り 3 件（Fluence の出自・東電PG の空き容量・TMEIC→日立エナジーの JV）を一次どおりに直した。冒頭コメントの件数は消した。
- `/incidents` の社内コード「AJ」と未達の数値目標「30+ 件」を公開面から外した。
- 本番照合: deploy（`731da71`・commit status success 11:42 JST）後、素 URL で全項目 OK（下の §4）。`/incidents` 12 件・3 施設名が初期 DOM・JSON-LD 12、`/map/industry-chaos` の誤り 3 語が 0 件、サイトマップに 10/5 POST の news 10 件。

## 1. 変更前後

| ファイル | 箇所 | 前 | 後 | 一次 |
|---|---|---|---|---|
| src/data/incidents.ts | 末尾 | 11 件（表示 9） | 14 件（表示 12）: `rufford-colliery-2026`・`bautzen-2026`・`warwick-ny-2025` | 下の §2 |
| src/data/industry-map.ts | fluence の note | `三菱 × Siemens JV 出自` | `Siemens × AES が 2018 年に設立` | Fluence「Our Story」（https://fluenceenergy.com/about/our-story/・title「Our Story \| Fluence - A Siemens and AES Company」）逐語「In January 2018, Siemens and AES launched Fluence」 |
| 同 | tepco-pg の note | `系統運用、空き容量データ非公開中` | `系統運用。空き容量は 2026年6月2日に公開再開` | 東電PG「系統情報更新のお知らせ」（https://www.tepco.co.jp/pg/consignment/system/information/index-j.html）2026年6月2日付「2026年2月2日からデータメンテナンスのため公開を一時停止していた「系統の空き容量等に関する情報」および「需要・送配電に関する情報」の系統構成・予想潮流について、公開を再開しました。」→ `/grid/tokyo/status` の再開日 6月2日と**一致** |
| 同 | RELATIONS | `{ from: 'tmeic', to: 'hitachi-energy', type: 'jv', note: '東芝 × 三菱電機 PCS 共同' }` | 削除（理由をコメントで残す。差し替えない＝Ck-2 ■7 と同じ） | TMEIC「会社概要」（https://www.tmeic.co.jp/corporate/outline/・title「会社概要 \| 株式会社TMEIC」）出資比率「東芝50% ： 三菱電機50%」。日立エナジーとの JV の一次は無い |
| 同 | 冒頭コメント・見出しコメント | `operators 544 社`・`関係データ 30+ 件`・`PLAYERS (50+ 代表的事業者)`・`RELATIONS (35 件、…)` | 数を書かない表現（`代表的事業者`・`主要事業者間の関係`）。ページは `PLAYERS.length`／`RELATIONS.length` で数える | 実数: players 47・relations 34（削除後） |
| src/app/incidents/page.tsx | L.99 ラベル | `🔥 AJ 火災事例 DB v1 · 2026-05-28 公開` | `🔥 火災事例 DB v1 · 2026-05-28 公開` | （便 §3 は L.183〜191 の見出しだけを挙げていたが、受け入れ条件「AJ 火災事例 0 件」を満たすため同じ社内コードの L.99 も外した＝前提の差 ①） |
| 同 | 拡張計画の見出し | `AJ 火災事例 DB 拡張計画` | `今後の拡充予定` | — |
| 同 | 拡張計画の箇条 1 | `事例を 30+ 件に拡張（公開情報ベース・順次追加）` | `公開情報で確認できた事例を順次追加` | 他の箇条は不変 |
| src/data/source-documents.json | documents | 166 件 | 173 件（+7: ess-news 2・Stadt Bautzen・Village of Warwick・Fluence Our Story・東電PG お知らせ・TMEIC 会社概要） | 各 title を確認日 2026-10-05 で登録 |

## 2. 3 件の一次照合（素の UA・ブラウザ UA の両方で取得）

| id | 一次 | 素の UA | ブラウザ UA | 照合 |
|---|---|---|---|---|
| rufford-colliery-2026 | ESS News 2026-05-07（所有者 Gresham House の声明を逐語掲載） | 200 | 200 | ○ |
| bautzen-2026 | Stadt Bautzen 2026-274（Abschlussmeldung）／ESS News 2026-07-22 | 200／200 | 200／200 | ○ |
| warwick-ny-2025 | Village of Warwick 公式の経過ページ | **403**（Cloudflare） | **403**（Cloudflare） | Wayback のスナップショット（2026-06-11 取得・article:modified_time 2026-04-06）で照合 |

### 一次に無かったので削った語句（足していない）

| id | 削った／直した語句 | 理由（一次の逐語） |
|---|---|---|
| rufford | summary の「05:21、」 | 一次の 5:21 は消防が呼ばれた時刻（発生時刻ではない） |
| rufford | lessons 末尾「初期世代の設備の更新時期の管理が論点になる。」 | 一次に無い編集側の推論 |
| bautzen | location の「ザクセン州」 | 2 つの一次とも Sachsen／Saxony の記載なし |
| bautzen | lessons の「小規模」 | 一次に無い評価語 |
| bautzen | lessons の「直接の消火ではなく」 | ESS 7/22 時点の描写。市の速報 2026-270 ではコンテナを開けて注水し鎮火しており、残すと「最後まで冷却だけ」と読める |
| warwick | lessons「NYSERDA は…新規業務を 90 日停止した」 | 一次は「NYSERDA が村に伝えた」形で、停止の主体を書いていない →「NYSERDA が村に伝えたところでは、同社は…90 日間停止されている」 |
| warwick | lessons「…自治体側の課題として残っている」 | 一次に無い評価 → 削って「（村長の指摘）」に |
| warwick | 「浸水」 | 一次は water infiltration →「水の浸入」 |
| warwick | summary「隣接コンテナへの延焼もなかった」 | 事業者声明なので「事業者によれば」を付けた |
| warwick | summary「使用禁止命令」 | 一次の語（Condemnation）を括弧で併記 |
| warwick | lessons「RCA の結果待ち」 | 時点を明示「（村の公表時点）」（#123） |

- Rufford の消防（Nottinghamshire Fire & Rescue Service）自身の公表は、notts-fire.gov.uk のニュース一覧（25 ページ）とサイト内検索で見つからなかった（2026-10-05）。sourceUrls は便どおり 1 本。
- 3 件とも件数は焼き込んでいない（`VISIBLE_INCIDENTS.length` で数える既存のまま・#121）。

## 3. §1-4 入れない／保留の 2 件（探索結果・この便では入れていない）

### SRP Bolster（米 AZ・2025-10-01）— SRP 自身の一次あり（プレスリリースではなく評議会資料）

- SRP Newsroom（media.srpnet.com）に Bolster の火災のリリースは無い（2025-09〜2026-10 を展開して確認。近いのは 10/09 の「SRP and ESS Announce New 50 MWh Long Duration Energy Storage Pilot Project」で別件）。
- 一次: SRP District Council 2025-10-07 会議資料 https://www.srpnet.com/v3/assets/bltefc1fc708dcc94e7/blt2b1c17950458907a/20251007_DC_packet.pdf （200・両 UA で同一・1 ページ目「DISTRICT COUNCIL MEETING NOTICE AND AGENDA」「Tuesday, October 7, 2025」）。p.26〜30「Bolster Battery Fire / October 1st」の逐語: Bolster Battery is located adjacent to Agua Fria Generating Station／Tesla is the manufacturer／Owned by SRP／Tesla provides maintenance under long-term agreement／25 MW size／Originally placed in service in 2021／Modular design／Fire began about 4:30 pm／SRP Grid Incident Command responded／Local fire departments responded／Site was declared safe by early morning hours／No injuries／No evacuations required／No customer outages／Cause investigation underway。2026-02-03 の会議資料に続報は無い。
- 場所と構成: SRP ブログ（2021-09-16）https://blog.srpnet.com/new-battery-storage-system-in-the-works/ （title「Bolster Substation 25 MW battery station now online | SRPconnect Blog」）「25-megawatt (MW) battery storage facility at its Bolster Substation」「Adjacent to its Agua Fria Generating Station and located in Peoria」「a series of Tesla Megapacks」。MWh は SRP の一次に無い（100MWh は二次情報）。
- 起票案（入れていない）:

```ts
{
  id: 'srp-bolster-2025',
  date: '2025-10-01',
  location: '米国アリゾナ州 Peoria（Agua Fria Generating Station 隣接の Bolster Substation）',
  region: 'us',
  facilityName: 'SRP Bolster Battery（Bolster Substation・Tesla Megapack）',
  severity: 'moderate',
  cause: 'unknown',
  summary: '2025年10月1日 16時30分ごろ、Salt River Project（SRP）が所有する Bolster Battery（25MW・Agua Fria Generating Station 隣接）で火災が発生した。SRP の系統インシデント指揮（Grid Incident Command）と地元消防が対応し、未明までに現場の安全が宣言された。負傷者・避難・需要家の停電はなかった。原因は調査中（SRP の 2025年10月7日の評議会資料時点）。',
  lessons: 'Tesla 製で、保守は Tesla が長期契約で担う。2021年に運転を始めたモジュール型の設備。',
  sourceUrls: [
    'https://www.srpnet.com/v3/assets/bltefc1fc708dcc94e7/blt2b1c17950458907a/20251007_DC_packet.pdf',
    'https://blog.srpnet.com/new-battery-storage-system-in-the-works/',
  ],
}
```

  （capacity_mwh は置かない。lessons は一次に教訓に当たる記述が無いので事実だけ。入れる場合は台帳に 2 本の title を登録する。）

### La Verne（米 CA・2026-09-22）— 一次あり・EDAさんの判断待ち（便のとおり）

- 一次: City of La Verne https://www.laverneca.gov/736/METROPOLITAN-WATER-DISTRICT---SEPTEMBER- （200・両 UA で同一・title「METROPOLITAN WATER DISTRICT - SEPTEMBER 2026 | La Verne, CA」）。
- 需要家側であることの逐語: two lithium-ion battery energy storage systems that were installed to help meet the plant's energy needs and reduce its demand on the electrical grid／The incident involved two 250-kilowatt battery units housed in an indoor-outdoor facility／installed to support a 2-megawatt solar farm。
- 発生: September 22, 2026, at approximately 11:40 AM・Metropolitan Water District F.E. Weymouth Water Treatment Plant（3201 Wheeler Avenue）。原因は電池の搬出後に MWD が調査（MWD will investigate why the incident occurred once the battery packs are removed）。
- 250kW×2・2MW 太陽光併設・浄水場の自家需要向け＝系統用ではない、は便の記述と一致。鹿児島伊佐（2024-03・PV 併設）と同じ編集判断として保留。

## 4. 検証

- `npx tsc --noEmit` PASS。`npm run verify:source-names` 台帳 173 件・台帳に無い資料名 0 種。
- `npm run build` EXIT 0（prebuild の verify:generated 11/11 PASS・verify:source-names:src 0 種・5,576 ページ）。`/incidents`・`/map/industry-chaos` とも ○（静的）。
- 件数（ビルド前に tsx で確認）: incidents 14・表示 12・players 47・relations 34。

### 本番（素 URL・deploy 後）

取得 2026-10-05 11:42 JST（deploy 完了直後・クエリ無し・キャッシュ回避ヘッダ無し）。

| URL | HTTP | x-vercel-cache | age | 照合 |
|---|---|---|---|---|
| /incidents | 200 | PRERENDER | 0 | 表示件数「12 件」（前 9 件）／3 件の facilityName が初期 DOM（script 外・`<!-- -->` 除去後）に各 1 回／JSON-LD ItemList の numberOfItems 12・itemListElement 12／「AJ 火災事例」0・「30+ 件」0／「今後の拡充予定」1・「公開情報で確認できた事例を順次追加」1 |
| /map/industry-chaos | 200 | PRERENDER | 0 | 「三菱 × Siemens」0（前 1）／「Siemens × AES」初期 DOM 1・HTML 全体 3（前 0）／「非公開中」0（前 1）／「東芝 × 三菱電機 PCS 共同」0／「2026年6月2日に公開再開」1／ページの件数表示 47・34 |
| /sitemap.xml | 200 | PRERENDER | 0 | news 1,177 本・10/5 POST の 10 件すべて掲載（§5-5 のローカル欠落は本番に無い） |

新しい sourceUrl 4 本（2026-10-05 11:43 JST）:

| sourceUrl | curl 既定 UA | Python 既定 UA | ブラウザ UA | title（ブラウザ UA） |
|---|---|---|---|---|
| ess-news 2026-05-07（Rufford） | 200（222,932 B） | 403 | 200 | Exclusive: Short circuit in NMC batteries caused fire at UK BESS project - Energy Storage |
| bautzen.de 2026-274 | 200（80,206 B） | 200 | 200 | Abschlussmeldung zum Brand des Batteriespeichers auf dem Schliebenparkplatz – Stadt Bautzen |
| ess-news 2026-07-22（Bautzen） | 200（221,973 B） | 403 | 200 | Fire breaks out at 1.5 MW battery storage system in Germany - Energy Storage |
| villageofwarwickny.gov（Warwick） | 403 | 403 | 403（「Just a moment...」＝Cloudflare のチャレンジ） | 照合は Wayback 2026-06-11 で実施（title「28 Church Street - West Warwick 3 Battery Energy Storage Site Fire: Information & Updates - Village of Warwick」） |

- ess-news は UA 文字列「Python-urllib」だけを弾く（curl の既定 UA とブラウザ UA は 200）。読者向けのリンクとしては生きている。
- Warwick の村ページは Cloudflare のセキュリティ検証で機械取得できない。内蔵ブラウザで開いても「セキュリティ検証の実行」の画面のまま 6 秒以上進まなかった（検証の突破はしていない）。人の通常のブラウザで読めるかは**未確認**。本文の照合は Wayback 2026-06-11 のスナップショットで行った（便 §0 の「2 UA 取得」はこの 1 本だけ満たせていない）。

## 5. 前提の差・範囲外の所見

1. **L.99 のラベル**: 便 §3 は L.183〜191 の見出しだけを対象にしていたが、受け入れ条件「AJ 火災事例 が 0 件」は L.99 の `🔥 AJ 火災事例 DB v1` も含むため、同じ社内コードとしてこちらも外した（`🔥 火災事例 DB v1 · 2026-05-28 公開`）。
2. **「系統運用」**: 東電PG の一次に tepco-pg の役割語「系統運用」は無い（お知らせは公開再開の事実だけ）。note の前半は便の文言どおり残した（既存の役割ラベル）。
3. **`/grid/tokyo/status` の延期の記録**: 一次には 2026-04-30（5月中に延期）と 2026-05-29（6月上旬に再延期）の 2 回の延期告知があるが、`/grid/tokyo/status` には 5/29 の再延期が無い（再開日 6/2 は一致）。範囲外のため触っていない。
4. **`src/app/map/industry-chaos/page.tsx` L.27 の「関係 30+ 件」**: metadata の description に件数が焼き込まれている（#121）。削除後も 34 件で文としては偽ではないが、便の範囲外なので触っていない。
5. **ローカルビルドの news ページング**（この便の変更とは無関係・本番影響なし）: このビルドのログに `[microcms] WARN getAllNews: ページングで重複 10 件を除去` が 2 回出た。microCMS を同じ並び（`-publishedAt,-createdAt`）で全件 GET し直すと 1,402 件・重複 0・(publishedAt, createdAt) の同着 0 で、データ側は正常。ローカルの `.next/server/app/sitemap.xml` には 10/5 に POST した news 10 件が**無く**（本番のサイトマップには 10 件ともある）、ローカルの fetch キャッシュ（`.next/cache/fetch-cache`）に残っていた POST 前のページと、POST 後に取り直したページが混ざったものと見られる（#116 と同型。ページの一部だけが古いと、重複除去では消えるが**欠落は検出できない**）。Vercel のビルドは POST 後に走った `fcdc525` のビルドでキャッシュが POST 後の内容になっており、本番は 10 件とも掲載（deploy 後に再確認・上の表）。恒久策の案: getAllNews 系で「最終ページ到達時の件数＝totalCount」を照合し、合わなければ WARN（欠落の検出）。

## 6. 一時物の申告

- scratchpad（リポジトリ外）`…/scratchpad/q4a/` に取得物・照合スクリプト・ビルドログを残した（wf_* の HTML/PDF/txt、build_full.log、prod_before.json、news_paging_probe.json、prod_q4a.py ほか）。削除したものは無い。リポジトリ内に一時物は作っていない。
