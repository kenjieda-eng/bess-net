# Pj2-H-0 構造便 実行結果（2026-09-24）

依頼書: `03_5月13日朝_実行/Pj2H0_構造便_Claude_Code投入_2026-09-20_ユウ.md`
裁定書: `02_計画・運営/Pj2H_裁定書_104行_2026-09-13_ユウ.md`（R1〜R9）
commit: `296643f`（コード）／microCMS PATCH 4 件・POST 4 件
提案値の台帳: `reports/pj2h0-split-post-values-2026-09-24.json`（■2・■3 の新規 POST 値。★未実行）

実行したもの: ■1(a)(b) の 301 統合 ＋ ■4(a)(b)(c)(d)
判定だけしたもの（承認待ち・未実行）: ■2 の 7 件、■3 の 5 件
触らなかったもの: ■1(c)

---

## (1) ■1 同定判定（逐語つき）と 301 の前後

### (a) `pr-co70816-bess-3` → `mitsuuroko-tahara`（承認済・実行した）

**同定**: 同一設備。決め手は canonical 自身の一次（日経BP）。

- URL: https://project.nikkeibp.co.jp/ms/atcl/19/news/00001/03667/?ST=msb （HTTP 200・2026-09-24 取得）
- `<title>` 逐語: 「ミツウロコ、田原市に6MWhの系統用蓄電池を設置 - ニュース - メガソーラービジネス plus : 日経BP」
- 本文逐語: 「ミツウロコグループホールディングスの連結子会社であるミツウロコグリーンエネルギー（東京都中央区）は、愛知県田原市に系統用蓄電池を設置し、9月20日から「ミツウロコ愛知県田原蓄電所」として運用を開始した。」「蓄電池は米テスラ製を採用し、出力は1.5MW、容量は6MWh。」
- 301 元の `name`「ミツウロコ愛知県田原蓄電所」はこの**正式施設名の逐語**と一致。所在地（愛知県田原市）・諸元（1.5MW/6MWh）も一致。

**★依頼書の前提の訂正（2 点）**

1. **301 元の sourceUrl は田原の出典になっていない。** PR TIMES 000000040.000070816（2022-02-09・HTTP 200 で本文取得）の本文は北海道北広島市の別施設の発表で、逐語は「当社連結子会社のミツウロコグリーンエネルギー株式会社…は…北海道北広島市に2022年12月の運用開始を目指し、「北広島第一、第二蓄電所」…の建設準備を開始いたしました」「所在地：北海道北広島市／蓄電池：TESLA社製 Megapack／出　力：3,085.6KW／容　量：12,192kWh」。**田原の諸元（1.5MW/6MWh）とも一致しない。** 301 元の `cod` 2022-02-09 はこのリリースの配信日。
   → したがって 301 元に「一次の裏付けのある非重複情報」は無い。前例と同じ扱いにした（`projects-301.ts` 15 番 `pr-co69153-ibaraki-2`「-2 側に排他的な実情報は無く…移植はしていない」）。
2. **依頼書が想定した「operator 正式社名の移植」は、そのままでは実行できない。** 301 元の operator「株式会社ミツウロコグループホールディングス」は PR TIMES のアカウント名（親会社）で、一次は運用主体を**連結子会社のミツウロコグリーンエネルギー**と明記している。operators マスタには両社とも実在する（`mitsuuroko-gr-hd`／`agg-01067848`）。canonical の現値「ミツウロコ」はマスタのどれとも完全一致せず事業者ページに紐付いていなかった（構造化欄はマスタ完全一致）。
   → **一次の逐語が支える側**を入れた: `operator` 「ミツウロコ」→「ミツウロコグリーンエネルギー株式会社」。

**301 前後**

| | 301 前 | 301 後（デプロイ後） |
|---|---|---|
| `/projects/pr-co70816-bess-3` | 200（重複ページ） | 301 → `/projects/mitsuuroko-tahara` ／一覧・sitemap から除外 |
| `/projects/mitsuuroko-tahara` | 200（operator「ミツウロコ」） | 200（operator「ミツウロコグリーンエネルギー株式会社」） |

同クラスタの既存 301（`pr-co70816-bess`・`pr-co70816-bess-2` → `mitsuuroko-tahara`）は従来どおり。多段 301 は発生しない。

### (b) `nc-sendai-kamiayashi` × `pr-co33609-miyagi-2mw`（新規判定・実行した）

**同定**: 同一設備（施設名「NC仙台市青葉区上愛子蓄電所」）。canonical = `nc-sendai-kamiayashi`。

決め手は**諸元一致ではない**（同諸元の双子が実在するため使っていない）。両レコードの sourceUrl が同一リリースであり、**そのリリースが名指しする宮城の拠点が 1 施設しかない**こと。

- URL: https://prtimes.jp/main/html/rd/p/000000199.000033609.html （HTTP 200・2026-09-24 取得）
- `<title>` 逐語: 「【日本蓄電池との共同プロジェクト】全国7拠点の蓄電所開発を推進 宮城県仙台市で2MW系統用蓄電所が受電開始 | 株式会社リミックスポイントのプレスリリース」
- 本文逐語: 「このたび、本プロジェクトの2拠点目として宮城県仙台市の系統用蓄電所「NC仙台市青葉区上愛子蓄電所」（定格出力約2MW、定格容量約8MWh）が、2026年4月1日に受電を開始しました。」
- 施設概要 逐語: 「施設名 NC仙台市青葉区上愛子蓄電所／所在地 宮城県仙台市／定格出力 1,988kW／定格容量 8,146kWh／蓄電システム CATL製／PCS（パワーコンディショナ） TMEIC製」

**双子（`pr-co161802-miyagi`「NC仙台市上愛子B蓄電所」）とは寄せていない。** A と B は一次で 3 点分離できる — 施設名（000000051 と 000000056）／公表日（4/1 と 4/3）／需給調整市場の運用開始日（000000079 の 6/23 と 自社 news/1795 の 6/30）。B のページは 200 のまま据え置き。

canonical 選定（規則 ①②③）: ① 301 元の name「日本蓄電池（株式会社リミックスポイント）」は施設名ですらない社名の断片 → canonical 側の勝ち。② cod は両者 2026-04-01 で同値。status は 301 元だけが「稼働中」だったので**移植した**（下記）。③ 同一施設の日本蓄電池側 stub `pr-co161802-miyagi-2` は既に `nc-sendai-kamiayashi` へ 301 済（前例 9-10 と同型）＝向きを変えると多段 301 になる。

**301 前に移植した非重複情報**: `status` `[]` → `["稼働中"]`
- 根拠 URL: https://prtimes.jp/main/html/rd/p/000000079.000161802.html （HTTP 200・2026-09-24 取得）
- 逐語: 「2026年6月23日より需給調整市場向けの運用を開始」（`<title>`「…「NC仙台市青葉区上愛子蓄電所」需給調整市場への運用開始…」）
- 移植しなければ 301 で「稼働中」がサイトから消えていた（301 元は一覧・sitemap から外れる）。

| | 301 前 | 301 後 |
|---|---|---|
| `/projects/pr-co33609-miyagi-2mw` | 200（同一施設の二重掲載・二重計上） | 301 → `/projects/nc-sendai-kamiayashi` |
| `/projects/nc-sendai-kamiayashi` | 200（status 空） | 200（status 稼働中） |
| `/projects/pr-co161802-miyagi`（双子 B） | 200 | 200（変更なし） |

### (c) `pr-co169202-bess-2`（触らなかった）

**同定できないため触らない**（canonical・301・据え置き案のいずれも書かない）。

- 301 元候補の sourceUrl（PR TIMES 000000004.000169202・HTTP 200）は単一案件の発表ではなく会社単位の実績発表。`<title>` 逐語: 「【野村屋ホールディングス】系統用蓄電池販売実績が累計120,000kWを達成、TUN POWERとの協業で導入支援を拡大」。本文に 16 サイト（販売実績 15＋自社敷地モデル設置 1）が並び、**全 16 サイトが 2,000kW / 8,000Wh で諸元が完全同一**。リリース A には施設固有名が 1 つも無い（「上田市古里蓄電所」「BESS KOSATO」の出現 0）。
- レコード側にサイト特定情報が皆無: `name`「系統用蓄電池（野村屋グループ）」＝見出し語、`city`「【野村」＝`<title>` 冒頭「【野村屋ホールディングス】」の切り出し破損、`cod` 2025-12-01＝配信日、`prefecture` null。
- 依頼書の「別レコードの実運開 2026-01-27」の逐語は**相手方リリース B にのみ存在**（000000008.000169202「2026年1月27日に電力系統への接続および受電を開始し…運転を開始した」「運転開始日 2026年1月27日」）。A には「2026年1月27日」「1月27日」とも 0 件。live の `pr-co169202-bess` の cod は 2026-02-09（B の配信日）で、一次の運転開始日とは別。
- 確定できたのは「リリース A の自社敷地サイトと B の BESS KOSATO は同一設備」までで、「レコード -2 がその自社敷地サイトを指しているか」は確定できない。

→ 次便への送り: 「-2 は案件レコードか、リリース単位の取り込み残骸か」（重複判定ではなく案件成立の問い）。`pr-co169202-bess` の値是正（`prefecture`=長野県／`city`=上田市／cod 候補 2026-01-27）も値便。

---

## (2) ■2 粒度 7 件の判定（全件 (i) 分割）＋ 新規 POST 値（★承認後に実行）

一次の施設別の表・施設別の日付があるかで判定した結果、**7 件すべてが (i) 分割**。(ii)（合計のみ）・(iii)（どちらも無い）はゼロ。
新規 POST の全フィールドは `reports/pj2h0-split-post-values-2026-09-24.json` に件別に載せた（14 件）。**本便では 1 件も投入していない。**

| # | 束ねレコード | 判定 | 新規 POST | 束ねの処分（推奨） |
|---|---|---|---|---|
| 1 | `pr-219mwh-bess` | (i) | 2 件 `banpu-fukushima-bess` / `banpu-miyazaki-bess` | EXCLUDED（福島・宮崎とも 40台/109.6MWh/26MW/2028年で**諸元完全同一**＝代表が一次から決まらない） |
| 2 | `olympia-ota-isesaki` | (i) | 0 件（既存 `pr-co109041-gunma`・`oly-powerstorage-midorimachi`） | ★要判断（下記） |
| 3 | `pr-co143072-bess-2` | (i) | 2 件 `tc-tokushima` / `tc-itano` | EXCLUDED（2施設とも 2,000kW・約8,100kWh で代表なし。納入時期 9月/10月の差だけ） |
| 4 | `pr-co86244-bess-7` | (i) | 3 件 `pr-co86244-mie-tsu` / `-aichi-chita` / `-shizuoka-makinohara` | **301 → `pr-co86244-mie-tsu`**（一次逐語「最初の案件は2025年3月運転開始を目指しています」＋表で 2025年3月 は津市のみ＝代表が一次で一意） |
| 5 | `pr-co55631-gunma` | (i) | 3 件 `-gunma-kameoka` / `-gunma-nitta-akabori` / `-tochigi-horigome` | EXCLUDED（3施設を完全並列に列挙・出力も運開日も同一。束ねの city「太田市」は 3 件目（栃木県足利市）を覆えていない） |
| 6 | `pr-co76147-bess-2` | (i) | 4 件 `tc-nasushiobara` / `tc-isahaya` / `tc-shimabara` / `tc-taku` | EXCLUDED（4拠点が3県に分散・出力最大は那須塩原/容量最大は多久で代表が一意にならない） |
| 7 | `pr-co21766-bess` | (i) | 0 件（既存 `renova-mori-mutsumi2`・`renova-tomakomai`） | EXCLUDED（案件性なし。一次は東京ガス自身の蓄電所ではなく**需給運用の受託**発表） |

### 一次の逐語（主要なもの）

- **#1** PR TIMES 000000122.000109041 相当（パワーエックス）: 拠点別の表に「福島県内／宮崎県内」「40台」「109.6MWh」「26MW」「2028年」。★`operator`=パワーエックスは**受注（供給）側**で、蓄電所を新設するのはバンプージャパン。市町村は一次に「福島県内」「宮崎県内」しか無いので `city` は null（PR TIMES の位置情報メタ「（販売・提供エリア）」は所在地に使わない）。
- **#4** PR TIMES 000000035.000086244: `<table>` は 2 つだけ（役割分担表・3施設諸元表）で、施設別に出力・電池容量・運開予定（2025年3月／2025年7月／2026年1月）。★**依頼書の手がかりの訂正**: 「同じリリースに別案件（三菱HC単独・北海道）の数値表が載っている」は当たらない（HTML 中 三菱=0・北海道=0・苫小牧=0・千歳=0）。
- **#5** PR TIMES 000000146.000055631: 本文に3施設の案件名・所在地・出力（２MW）・蓄電池システム（CATL）。★**手がかりの訂正**: 「合計6,880kWh」は本文に存在しない（'kWh' 0件・'6,880' 0件）。出所はリリース内の参考資料 PDF（東京都補助金の実績報告）の「蓄電池設備 定格容量合計 kWh 6,880」＝**3施設の合計**で施設別内訳は無い。→ 新規3件の `capacityMwh` は **null**（按分しない。0 も入れない＝0 は「調査中」の意味）。
- **#6** PR TIMES 000000212.000076147 ＋ IR PDF: 【各事業の概要】に4拠点の「蓄電池設置予定地／定格出力／定格容量／電池方式／敷地面積／運転開始時期（予定）」。逐語「定格出力｜30,000 kW｜16,000kW｜16,000kW｜39,000kW」「定格容量｜112,665 kWh｜64,380kWh｜64,380kWh｜144,855kWh」「運転開始時期（予定）｜2028年度｜2028年度｜2029年度｜2030年度」。★**手がかりの訂正**: 合計容量 386,280kWh は**一次に存在しない**（可視テキストの「386」出現 0・PDF にも合計容量なし）＝当サイトの加算値。合計出力 101MW は一次の逐語（表題「（国内4カ所・合計101MW）」）。30+16+16+39=101 が厳密一致するため、既存 `tc-nagasaki`（長崎市畝刈・15.6MW/64.38MWh）は 4 拠点に含まれ得ない（双子の分離が算術でも確定）。
- **#7** 東京ガス 20250306-01: 副題逐語「～（株）レノバが開発する合計165MWの蓄電所について20年超の需給運用を受託～」、表逐語「名称｜森町睦実蓄電所｜苫小牧蓄電所」「設置場所｜静岡県周智郡森町睦実｜北海道苫小牧市」「蓄電池想定送電端出力｜75MW｜90MW」。75+90=165 が一致し、既存 renova 2 件は一覧に生きているので、束ねの除外は **165MW の二重計上の是正**にもなる。

### ★#2 `olympia-ota-isesaki` は要判断（判定が割れた 1 件）

- **301 → `oly-powerstorage-midorimachi`（緑町）案**: 当該レコードの現 sourceUrl が緑町（太田市）リリースそのものなので代表が一意に定まる。
- **EXCLUDED 案（反証側・私の推奨）**: sourceUrl 以外の**全フィールドが 2 施設を指す**（`name`「太田・伊勢崎蓄電所」／`city`「太田市・伊勢崎市」／`capacityMwh` 14.8＝2拠点合計／body「2カ所に立地します」）。緑町・三室町は 2,468kWh×3＝7,404kWh・PCS 1,998kW で**完全同一**＝代表を一次から選べない。さらに「14.8」も「2023年8月」も緑町ページに存在せず（実機確認）、本文の出所は別 URL の PR TIMES 000000034 → sourceUrl だけが後から差し替わった外れ値。前例 `jpn-gifu-sendai`／`gifu-imari-bess`（合成名の混載＝案件性なしで除外）と同型。
- どちらを採る場合も**併せて決める必要がある**: `projects-301.ts` 8 番 `/projects/pr-co109041-gunma-148mwh` → `/projects/olympia-ota-isesaki` の扱い（放置すると「301 先が noindex の混載ページ」になる）。推奨は 8 番を削除し `pr-co109041-gunma-148mwh` も EXCLUDED に明示追加（301 を消すと `LIST_EXCLUDED` の自動 union から外れるため明示が必要）。

---

## (3) ■3 告知レコード 5 件 — 案A/案B の比較と推奨

### (a) 一次は単一施設を特定しているか（逐語再確認）

| slug | 判定 | 一次の逐語（要点） |
|---|---|---|
| `pr-co109041-bess` | **not-single-facility** | ヘキサ×パワーエックスの業務提携告知。「〜26年3月までに10拠点の高圧蓄電所を運転開始へ〜」で個別地点の諸元なし |
| `pr-co12501-bess` | **not-single-facility** | パワーエックス×エコスタイルの提携。「全国各地に開発」・180MWh は**目標値** |
| `pr-co161802-bess` | **not-single-facility** | 日本蓄電池「2026年末までに７か所の蓄電所を運転開始」のプログラム告知 |
| `pr-co33609-bess` | **not-single-facility** | 同一事象のリミックスポイント側リリース |
| `pr-co89612-bess-2` | **not-single-facility** | マーチャントバンカーズ。200MW/800MWh は**複数サイトの総容量** |

★**反証で判明した訂正**: 7 拠点の内訳表（画像・市区町村精度・各 2MW/8MWh・運開予定月）は **`pr-co33609-bess` 側だけでなく `pr-co161802-bess` 側にも本文インライン図として存在する**（`161802-12-d6ab582f…-2000x1414.jpg`）。したがって「この表はこのレコードにしかない」という情報損失の評価は誤りで、**2 件同時に外さない限り一次表への参照は残る**。

### (c) 0 値・配信日 cod の現況（live GET・事実確認のみ／値は直していない）

| slug | prefecture/city | outputMw / capacityMwh | cod | status |
|---|---|---|---|---|
| `pr-co109041-bess` | null / null | 0 / 0 | 2025-03-10（=PR 配信日） | 稼働中 |
| `pr-co12501-bess` | null / null | 0 / 180（目標値） | 2024-02-07（=配信日） | 計画中 |
| `pr-co161802-bess` | null / null | 0 / 0 | 2025-12-10（=配信日） | 稼働中 |
| `pr-co33609-bess` | null / null | 0 / 0 | 2025-12-09（=配信日） | 稼働中 |
| `pr-co89612-bess-2` | null / null | 200 / 800（複数サイト総量） | 2025-09-02（=配信日） | 計画中 |

body の定型文が「ステータス：稼働中（発表日：2025-03-10）」の形で、cod＝配信日であることがレコード自身の本文からも確認できる。

### (b)(d) 案A / 案B の比較（実装コスト込み）

| | 案A: EXCLUDED フラグ | 案B: 「業界動向」枠へ移す |
|---|---|---|
| 実装 | `src/lib/projects-excluded.ts` に 1 行 × 5（＋根拠コメント） | **該当する枠が存在しない**（`src/` 全文 grep で「業界動向」0 件。`/industry` は precompute ベースの分析ハブでレコード単位の受け皿ではない） |
| 挙動 | 一覧・件数・集計・sitemap から除外、詳細は **200 のまま noindex**（404 を作らない・既存 URL とアクセスは維持） | 近い既存枠は `news`（カテゴリ 開発計画25／投資8 等が実在）。移設は「news へ 5 件 POST ＋ projects 側を EXCLUDED」 |
| コスト | 5 分（前例 40 件以上・確立済み） | 1 件あたり lead/body の編集執筆が必要。加えて `news` は月次の人手キュレーション運用（`scripts/import-news.ts`）で、**2024〜2025 年の古い告知を publishedAt 順の一覧に流し込むと「新着」表示が壊れる**（落とし穴 #108） |
| 情報損失 | なし（個別施設は別レコードで生きている。日本蓄電池/NC 系は 25 件、HEXA 系は `hexa-*` 4 件が実在） | なし |
| リスク | 低（前例どおり） | 中（新設枠の設計・鮮度 UI との整合・二重運用） |

**推奨: 5 件すべて 案A（EXCLUDED）。** 理由は (1) 一次が単一施設を特定していない＝`/projects`（案件の台帳）の粒度に乗らない、(2) 構成施設は個別レコードで既に可視、(3) 0 値・配信日 cod を残さないという依頼書の条件を、値を書き換えずに満たせる（除外すれば集計に入らない）、(4) 既存 40 件以上と同じ扱いで一貫する。
案B は「業界動向」枠の**新設**が前提になるため、本便の範囲（粒度と重複）を超える。枠を作るかどうかは別途の企画判断。

**(d) `pr-co109041-bess` の sourceUrl 差し替えは却下済みのため、差し替え提案はしていない**（現状維持）。

**★要判断（別便候補）**: 7 拠点表のうち `枕崎市桜山東町`（鹿児島県）だけが live に対応レコードを持たない（344 件走査で「枕崎」0 件）。新規起票の値案を台帳 JSON に 1 件入れた（`nc-makurazaki-sakurayamahigashi`）。ただし諸元の出所は**画像内の表**であり、本便では投入していない。

---

## (4) ■4 同乗 4 件の件数と変更箇所

### (a) `scripts/precompute-glossary-detail.ts` に主題ゲートを通した

- 変更: `fetchAllNewsWithRel()` で `isExcludedNews` / `isTopicExcludedNews` を適用（`precompute-operators-detail.ts:241` と同条件）。ビルドログ: `[news] 表示対象 1154 件（除外 231 件: news-excluded / 主題ゲート）`。
- ★**前提の訂正**: 現状の壊れリンクは **0 件**だった。live の news 1,385 件のうち `relatedTerms` を持つのは 26 件で、そのいずれも非表示対象ではない（生成済み index の全 1,534 entry を走査しても該当 0）。**したがって本件は予防的な是正**（今後 relatedTerms を持つ記事が除外対象になった瞬間に壊れリンクになるのを防ぐ）。

### (b) `subsidies/shizuoka-bess-2026` の 410 リンク解除 ＋ 同型 grep

- リンク先 `/news/news-2026-201-kepco-orix-kinokawa-startup` は本番 **410**（`legacy-news-allowlist.json` 28 件に不在）。`<a>` だけ外し表示文字列「紀の川蓄電所」は残した。
- 同型 grep: microCMS **10 endpoint・12,928 レコード**の全文字列フィールドを走査し、`/news/news-2026-{数字}-…` 形式へのリンクは**本件 1 件のみ**（`src/` 側も 0 件）。
- 備考: このレコードは Ck-1a で除外済み（詳細 404）のため、読者への露出は元から無い。データ側の衛生。

### (c) 9/17 LTDC 制度詳細説明会の POST（1 件）

- `policy-events/occto-ltdc2026-shousai-setsumeikai-2026-09`（id `3kx2nam-q9o`）。
- 一次を自分で再取得して照合（HTTP 200・更新日 2026-09-15）: `<title>`「容量市場　長期脱炭素電源オークション（応札年度：2026年度）制度詳細説明会の開催のご案内について｜電力広域的運営推進機関」、逐語「1.日時　2026年9月17日（木曜日）　14時00分～16時30分」「※参加受付は終了いたしました。」「2.場所（現地、Web同時開催）」「住所：東京都江東区豊洲6-2-15」「Webex」。
- 用意済み値（`reports/friday6-followup-2026-09-11.md` §6）からの差分:
  - `status`: `["予定"]` → **`["終了"]`**（9/17 は既に過去。live で「終了」64 件使用＝#106 の drop なし。表示側 `deriveDisplayStatus` は「予定＋過去日」を「終了」に自動補正するが、格納値まで「予定」にすると stale を 1 件増やす）
  - `category`: `["容量市場"]` → **`["容量市場","長期脱炭素オークション"]`**（どちらも live 実在値。7/27 レコード作成後に作られた LTDC 系 10 件は併記）
  - `description`: 案内ページが 09-15 に更新され「資料は後日掲載いたします。」が HTML コメント化・資料 PDF 2 本が掲載済みになったため、その部分を差し替え。当日資料 PDF（150 ページ・pdfplumber）p.6 の日程（事業者情報 10/13〜16、電源等情報 10/19〜23、期待容量 12/9〜15、応札 2027/1/19〜26）と p.7/p.19 の蓄電池の募集上限（リチウムイオン 40万kW・それ以外の蓄電池 40万kW・揚水/長期貯蔵 合計40万kW、制度適用期間 原則20年・蓄電池は40年上限）を帰属つきで追加。
  - `registrationDeadline`・`endDate`・`location`・`venue` は設定しない（kind=[] の 70 件は全件 null）。
- **9/25 レコード `occto-long-term-decarbonization-explain-2026-09` は削除していない。** Ck-1a の `src/lib/events-excluded.ts:81` で既に非表示（今回あらためて確認）。一次（9/17 案内ページ・当日資料 p.3 の説明会系列表）に 9/25 開催を支える記載はなく、系列表で日付が確定しているのは「制度概要説明 2026/7/27」「制度詳細説明 2026年9月17日」の 2 回のみ（実務説明 4 回は「今後実施予定」で日付未公表）＝同定できないため据え置き。

### (d) エネルギーパワー 3 施設の POST（3 件）

一次 PDF は**私自身が再取得して pdfplumber で照合**（3 本とも HTTP 200・能力行まで一致）。

| slug | name | 所在地 | 出力/容量 | cod | status | marketParticipation |
|---|---|---|---|---|---|---|
| `minamiawaji-megapower` | 兵庫南あわじメガパワー蓄電所 | 兵庫県南あわじ市（市小井） | 1.979 / 8.226 | **null** | **[]** | 容量市場 |
| `arida-yuasa-megapower` | 有田湯浅町メガパワー蓄電所 | 和歌山県有田郡湯浅町 | 1.979 / 7.74 | **null** | 計画中 | 需給調整市場 |
| `kitagifu-megapower` | 北岐阜メガパワー蓄電所 | 岐阜県岐阜市（大字太郎丸字寺洞） | 1.979 / 7.521 | **null** | 計画中 | 需給調整市場 |

- 能力行の逐語（自分の pdfplumber 実行結果）: `ir_20251014-2`「（５）能力 出力：1,979kW 容量：8,226kWh」／`ir_20251114-2`「（５）能力 出力：1,979kW 容量： 7,740kWh」／`ir_20260714-1`「（５）能力 出力：1,979kW 容量：7,521kWh」。
- `cod` は 3 件とも **null**: 一次は「2026 年８月期中」「2027 年８月期中」の**年度精度**（R2）。物件引渡日（2026年4月・7月・2027年2月予定）は cod ではない（R3）。
- `status` は一次の記述に厳密に合わせた: **南あわじ `[]`** — 2026-09-15 開示で用途が「需給調整市場等における調整力等の取引」→「容量市場における発電能力の取引」へ変更され、「本蓄電所は、用途の変更が生じたため、現在移設を検討しております」とされたため、稼働中・建設中・計画中のいずれも一次で支えられない。**有田湯浅 `計画中`** — 中間発行者情報（基準日 2026-02-28）の着手は「2026年３月」＝**基準日より後**なので「建設中」は一次に無い（R8）。**北岐阜 `計画中`** — 着工・工事期間がすべて「予定」。
- **三重霞（合同会社三重霞メガパワー）は起票していない**（依頼書の指示どおり。諸元の開示が無い）。
- 既存重複の確認: live 344 件を走査し「南あわじ／あわじ／淡路」「有田／湯浅」「北岐阜」いずれも 0 件。`kitagifu-megapower`（岐阜市大字太郎丸）は既存 `pr-co161802-gifu`（NC岐阜市太郎丸蓄電所・日本蓄電池・1,988kW/8,146kWh）と**同じ地名だが別設備**（事業者・諸元・時期が異なる）＝寄せていない。
- 投入前に落とした記述: 南あわじ body の「朝来・丹波の住所と諸元」と有田 body の「和歌山メガパワー蓄電所の容量 8,226kWh」は、本 run で出典を確認していないため削除した（推測で埋めない）。★なお同社の取得開示（`ir_20241127-2`・`ir_20250812-3`）は能力欄が「出力：8,226kWh 容量：1,979kW」と**発行者側で単位ラベルが入れ替わっている**ため、これらを引くときは注意が必要（別便への申し送り）。

---

## (5) 変更した全フィールド（#106 前後表）

### microCMS PATCH 4 件（すべて `otherFieldChanges: 0`）

| # | endpoint/slug | field | 前値 | 後値 |
|---|---|---|---|---|
| 1 | `projects/mitsuuroko-tahara` | `operator` | `ミツウロコ` | `ミツウロコグリーンエネルギー株式会社` |
| 2 | `projects/nc-sendai-kamiayashi` | `status` | `[]` | `["稼働中"]` |
| 3 | `subsidies/shizuoka-bess-2026` | `body` | `…(4) <a href="https://bess-net.jp/news/news-2026-201-kepco-orix-kinokawa-startup">紀の川蓄電所</a>のような…` | `…(4) 紀の川蓄電所のような…`（リンクのみ解除・文字列は保持） |
| 4 | `projects/minamiawaji-megapower` | `body` | `…点に留意。</p><p></p>` | `…点に留意。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>` |

#4 は POST の後始末。出典の無い一文を投入前に落とした際に段落の開始タグ `<p>` が残り、richEditor が空段落として保存した（#122 の正規化）。他 2 件と同じ末尾注記に揃えた。

ログ: `scripts/pj2h0-patch-log-2026-09-24.json`（計画は `scripts/pj2h0-patch-plan-2026-09-24.json`・根拠逐語つき）

### microCMS POST 4 件（新規・投入後に全 field を GET 照合）

| endpoint/slug | id | 照合 |
|---|---|---|
| `policy-events/occto-ltdc2026-shousai-setsumeikai-2026-09` | `3kx2nam-q9o` | 12 field 中 11 一致。差分は `eventDate` 送信 `"2026-09-17"` → 保存 `"2026-09-17T00:00:00.000Z"`（**microCMS の ISO 正規化**。既存レコードも同形式） |
| `projects/minamiawaji-megapower` | `o_wm0oo4-1` | 12 field 中 11 一致。差分は `body` の末尾空段落のみ（タグを除いた素の本文は**完全一致**を確認）→ 上表 #4 の PATCH で解消 |
| `projects/arida-yuasa-megapower` | `1vk6sckv3vd8` | **全 12 field 一致** |
| `projects/kitagifu-megapower` | `jernjilw-0` | **全 12 field 一致** |

ログ: `scripts/pj2h0-post-log-2026-09-24.json`（計画は `scripts/pj2h0-post-plan-2026-09-24.json`）

### コード（commit `296643f`）

| ファイル | 変更 |
|---|---|
| `src/lib/projects-301.ts` | 16 番 `/projects/pr-co70816-bess-3` → `/projects/mitsuuroko-tahara`、17 番 `/projects/pr-co33609-miyagi-2mw` → `/projects/nc-sendai-kamiayashi`（各々に同定の一次逐語をコメントで固定） |
| `scripts/precompute-glossary-detail.ts` | `isVisibleNewsSlug()` を追加し `fetchAllNewsWithRel()` で適用＋除外件数をログ出力 |
| `scripts/patch-pj2h0-2026-09-24.ts` ほか計画/ログ 4 本 | 本便の適用器と計画・ログ |

**DELETE / PUT は 1 件も発行していない。** microCMS のレコードは削除していない（301 は middleware・非表示は除外リスト）。

### ビルド・検査

- `npm run build` EXIT **0**、static **5,537 ページ**、ルート種別 **○89 / ●18 / ƒ1**（ƒ は `/grid/search` のみ＝基準どおり）
- `verify:generated` **PASS 11/11**（すべて当ビルドで生成）／`verify:linkify` **PASS**（15 ページ clean）／`verify:grid-fields` **PASS**（軸1〜3）／`verify:operators` **PASS**
- `verify:source-names` は EXIT 0（警告のみ・台帳に無い資料名 87 種は Ck-2 の既存残件で本便の増分ではない）
- `.next/cache/fetch-cache` は**削除せず** scratchpad へ退避（#116）

---

## (6) デプロイ後の素URL curl（生出力）

デプロイ: commit `296643f` / Vercel `9ipoHEkQFyYHzepgpumHZVzjUjuA` / `gh api commits/296643f/status` = **success**（2026-09-25 00:01 JST）
すべて**素URL**（クエリ無し・キャッシュ回避ヘッダ無し）。`x-vercel-cache` と `age` を記録（#112／鉄則 #5）。**STALE は 1 本も出なかった**ため取り直しは不要。

```
# 取得時刻 2026-09-24 15:02:00 UTC / commit 296643f
## ■1(a) 301: pr-co70816-bess-3 → mitsuuroko-tahara
$ curl -sI https://bess-net.jp/projects/pr-co70816-bess-3  → HTTP/1.1 301 Moved Permanently | Location: /projects/mitsuuroko-tahara | x-vercel-cache: - | age: -
$ curl -s https://bess-net.jp/projects/mitsuuroko-tahara  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 55934 bytes
    「ミツウロコグリーンエネルギー株式会社」: DOM 2 件
    「田原蓄電所」: DOM 5 件
    「ミツウロコ愛知県田原蓄電所」: DOM 0 件
## ■1(b) 301: pr-co33609-miyagi-2mw → nc-sendai-kamiayashi
$ curl -sI https://bess-net.jp/projects/pr-co33609-miyagi-2mw  → HTTP/1.1 301 Moved Permanently | Location: /projects/nc-sendai-kamiayashi | x-vercel-cache: - | age: -
$ curl -s https://bess-net.jp/projects/nc-sendai-kamiayashi  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 51659 bytes
    「稼働中」: DOM 2 件
    「NC仙台市青葉区上愛子蓄電所」: DOM 5 件
## 双子 B（変更なしの確認）
$ curl -sI https://bess-net.jp/projects/pr-co161802-miyagi  → HTTP/1.1 200 OK | Location: - | X-Vercel-Cache: PRERENDER | Age: 0
## ■4(d) 新規 POST 3 件
$ curl -s https://bess-net.jp/projects/minamiawaji-megapower  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 56080 bytes
    「エネルギーパワー」: DOM 4 件 ／「1,979」: DOM 3 件 ／「計画中」: DOM 0 件（status=[] のため正しい）
$ curl -s https://bess-net.jp/projects/arida-yuasa-megapower  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 55018 bytes
    「エネルギーパワー」: DOM 4 件 ／「1,979」: DOM 3 件 ／「計画中」: DOM 1 件
$ curl -s https://bess-net.jp/projects/kitagifu-megapower  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 51784 bytes
    「エネルギーパワー」: DOM 3 件 ／「1,979」: DOM 1 件 ／「計画中」: DOM 1 件
## ■4(c) 9/17 LTDC（policy-calendar 一覧）
$ curl -s https://bess-net.jp/policy-calendar  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 305445 bytes
    「長期脱炭素電源オークション（応札年度2026年度）制度詳細説明会」: DOM 1 件
## ■4(b) 410 リンク解除
$ curl -sI https://bess-net.jp/subsidies/shizuoka-bess-2026  → HTTP/1.1 404 Not Found（Ck-1a で非表示のまま＝変更なし）
$ curl -sI https://bess-net.jp/news/news-2026-201-kepco-orix-kinokawa-startup  → HTTP/1.1 410 Gone（リンク先は依然 410。本文からリンクだけ外した）
## /projects 一覧と sitemap
$ curl -s https://bess-net.jp/projects  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 346676 bytes
    「mitsuuroko-tahara」: DOM 1 件 ／「pr-co70816-bess-3」: DOM 0 件 ／「pr-co33609-miyagi-2mw」: DOM 0 件 ／「minamiawaji-megapower」: DOM 1 件
$ curl -s https://bess-net.jp/sitemap.xml  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 2081723 bytes
    raw「pr-co70816-bess-3」: 0 件 ／「pr-co33609-miyagi-2mw」: 0 件
    raw「mitsuuroko-tahara」: 1 件 ／「minamiawaji-megapower」: 1 件 ／「arida-yuasa-megapower」: 1 件 ／「kitagifu-megapower」: 1 件
```

**本文が初期DOMに出ているか（#107）** — 2 回目の取得（`X-Vercel-Cache: HIT / Age: 20`）

```
$ curl -s https://bess-net.jp/projects/minamiawaji-megapower → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 20
    「移設を検討」: 1 件 ／「容量市場」: 5 件 ／「8,226kWh」: 3 件 ／「2026 年８月期中」: 1 件
$ curl -s https://bess-net.jp/policy-calendar → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 20
    「2026年10月13日」: 1 件 ／「リチウムイオン蓄電池」: 3 件
$ curl -s https://bess-net.jp/events → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0
    「制度詳細説明会」: 0 件（新レコードは kind=[] のため /events には出ない＝設計どおり）
```

**件数の突合（焼き込みではなく動的参照・#118）**

`/projects` のステータス別件数は **前 稼働中121・計画中76・建設中34・その他22（計253）→ 後 稼働中121・計画中77・建設中34・その他22（計254）**。内訳は想定と厳密に一致した。

| 増減 | 内訳 |
|---|---|
| −1 計画中 | `pr-co70816-bess-3`（計画中）が 301 で一覧除外 |
| −1 稼働中 | `pr-co33609-miyagi-2mw`（稼働中）が 301 で一覧除外 |
| +1 稼働中 / −1 その他 | `nc-sendai-kamiayashi` の status 空 →「稼働中」移植 |
| +2 計画中 | `arida-yuasa-megapower`・`kitagifu-megapower` の新規 POST |
| +1 その他 | `minamiawaji-megapower`（status `[]`）の新規 POST |

レコード総数は 344 → **345**（−2 +3）。

---

## (7) 触らなかった行とその理由

| 対象 | 理由 |
|---|---|
| `pr-co169202-bess-2`（■1(c)） | 同定できない。一次 A は 16 サイトが全て 2,000kW/8,000Wh の実績発表で施設固有名が 0、レコード側の全フィールドがリリース単位メタ由来。**据え置き案も書かない**（依頼書の指示） |
| ■2 の 7 件の実処置（分割 POST・301/EXCLUDED） | 判定と POST 値の提示までが本便の範囲。**実行は承認後**（依頼書「実行は私の承認後」） |
| ■3 の 5 件の実処置 | 案A/案B の比較と推奨までが本便の範囲。「案が決まってから」（依頼書） |
| `pr-co109041-bess` の sourceUrl | 差し替えは却下済み＝現状維持。差し替え提案もしていない |
| 三重霞（合同会社三重霞メガパワー） | 諸元の開示が一次に無い＝起票しない（依頼書の指示） |
| `occto-long-term-decarbonization-explain-2026-09`（9/25） | Ck-1a で既に非表示。一次に 9/25 を支える記載がなく同定できないため据え置き（削除もしない） |
| `occto-ltdc2026-gaiyou-setsumeikai-2026-07`（7/27） | 本便対象外。格納 `status` が過去日で「予定」のまま（live 112 件中 24 件が同型）。表示は自動補正されるが、`/events` の Event JSON-LD は生の `status="予定"` だけで絞る実装（`src/app/events/page.tsx`）なので、`kind` を持つレコードでは過去イベントが `EventScheduled` で出力されうる（別便向けの所見。7/27 は `kind=[]` のため /events には出ない） |
| 値（`outputMw`／`capacityMwh`／`cod`）全般 | 本便では直さない（依頼書）。申し送り: `mitsuuroko-tahara` の cod null（一次は「9月20日から…運用を開始」＝2023-09-20）・body の「株式会社ミツウロコが運営する」は一次と不一致（運用は連結子会社）／`nc-sendai-kamiayashi` の outputMw 1.988 vs 一次 1,998kW（000000079）の食い違いは要裁定のまま／`pr-co169202-bess` の city「【野村」破損・cod 2026-02-09（配信日）／`tc-nagasaki` の outputMw 16（一次 15.6）・capacityMwh 64（一次 64.38）と body の「特高蓄電所4カ所・合計101MWの…本案件もその一翼」（畝刈は 4 カ所に含まれない＝誤り） |
| `scripts/experimental/operators/alias-expansion-report.json`・`src/data/substations/index.json` | セッション開始時点で既に未コミットの変更があり、本便の成果物ではないためコミットに含めていない（残置・申告） |

---

## 申告（停止条件・作法）

- `rm` / `rmdir` / `Remove-Item` / `del` は**未使用**。`.next/cache/fetch-cache` は削除ではなく scratchpad へ `mv`。一時ファイルは scratchpad 配下のみ（残置）。
- `git push --force` は未使用。`.env` / `.env.local` の内容は表示していない（`set -a && . ./.env.local` で読み込んで使用）。
- microCMS の **DELETE / PUT は未発行**。PATCH は差分限定＋前後 GET（#106）、POST は投入後に全 field 照合。
- 調査は読取専用のサブエージェント 15 本（うち 7 本は反証役）で実施し、一次はすべて本 run で再取得。反証で判定が覆った箇所は本報告に反映済み（olympia の処分、有田の status、7 拠点表の所在、386,280kWh の不在、tc-nagasaki の同定可否）。
- 途中でサブエージェント 2 本が新規ディレクトリへの書込待ちで停止したため、ワークフローを停止し「ファイル書込なし」の指示で再開した（完了済みエージェントはキャッシュ再利用）。停止・再開の事実を申告する。
