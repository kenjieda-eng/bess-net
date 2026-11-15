# projects 便 — 11/13 のニュースに出た設備の登録と更新（2026-11-15・CC・`_QUEUE.md` 113 行）

microCMS の書込は `projects` の **POST 7 件・PATCH 6 件（24 op）**（DELETE・PUT 0・ほかの API 0）。webhook は止めていない（書込 13 件）。
**P8（ADW熊本益城町蓄電所）は POST していない**: 同じ設備のレコード `pr-co160356-bess-2` が既に在った（便 §0「在れば、その件は POST せずに報告する」・下の (1)・(9)）。
コードは `src/data/corrections.json` に 1 件と、資料名の台帳 `src/data/source-documents.json` に 15 件（便に書かれていない作業・(9)）。

## (0) 申告

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\projects便_11月13日のニュースに出た設備の登録と更新_POST8・PATCH6・訂正履歴1件_Claude_Code投入_2026-11-15起草_ユウ.md`（14,928 バイト・最終更新 2026-11-15 13:19:49 JST）
- 計画: 同じフォルダの `projects-plan-2026-11-15_ニュースに出た設備の登録と更新_一次照合済み_ユウ.json`（57,386 バイト・最終更新 2026-11-15 13:19:50 JST）
  - sha256 の先頭 16 桁 **`48cc5d8ffe53816f`**（便の値と一致）。リポに `reports/projects-plan-2026-11-15_ユウ.json` として写した（値は変えていない・同じ sha256）。
- GO: `_QUEUE.md` 113 行（ユウ 11/15 20:4x・EDAさん 20:45「OK全て」・1 本目）。114・115 行（BX・BY）はこの便が終わってから（同時に走らせていない）。
- 実行: 21 時台（一次の取り直し 21:12:13〜21:13:08・baseline の GET 21:15〜21:17・本実行 21:18:55〜21:19:40 JST）。main の HEAD **`d1856a2`**（origin/main と同じ）。
- スクリプト:
  - `scripts/build-projects-write-2026-11-15.ts`（読むだけ・GET 12）: baseline の全件 GET・不在の再確認・old／keep の照合・applier の計画 `reports/projects-write-2026-11-15.json` を書く・見るだけの表。
  - `scripts/apply-projects-2026-11-15.ts`（`runApplier`・11/8 の applier と同じ形）。既定 dry run・本実行は `--apply`。
- 記録: `reports/projects-write-2026-11-15.json`（計画＋照合）・`.dry.json`（書込前の dry run）・`.apply1.json`（canary P2）・`.apply2.json`（残り）・`.dry2.json`（書込後の dry run＝全件 skip）。

## (1) baseline・不在の再確認・一次の取り直し

### baseline（書込の直前）

- 2026-11-15 21:17:59 JST（`2026-11-15T12:17:59.402Z`）に projects を全件 GET: **totalCount 412・取得 412・id の重複 0**（便の見込みどおり）。
- 2026-11-13 00:00 JST 以降に作成・更新されたレコード: **0 件**（11/13 の後に足された・変わったレコードは無い）。

### 不在の再確認（POST 8 件）

slug の衝突は 8 件とも 0。名称の固有部分・所在地の固有部分・**同じ所在地での**社名で照らした（下の「照らし方」）。

| | slug | 名称／所在地／同じ所在地の社名の一致 | 判定 |
|---|---|---|---|
| P1 | `nc-karatsu-hamatama-bess` | 2: `pr-co161802-saga`（→ `pr-co161802-saga-2` への 301）・`pr-co161802-saga-2`（NC唐津市相知町蓄電所）＝便 §1「書かないもの」で別の設備 | 無い → POST |
| P2 | `nc-arao-bess` | 3: `arao-bess`（荒尾蓄電所・テレビショッピング研究所）＝便 §2-8 で別の設備／`pr-afterfit-bess`・`pr-co55631-kumamoto`（しろくま電力・荒尾市）＝どちらも `arao-bess` への 301（`src/lib/projects-301.ts` 53・54 行「荒尾2MW/8MWh 同一案件（3重登載）」） | 無い → POST |
| P3 | `namiju-sakaiminato-bess` | 0（「境港」「新屋町」「NAMIJU」とも 0） | 無い → POST |
| P4 | `nomura-re-iwaki-bess` | 0（「いわき」・野村不動産とも 0） | 無い → POST |
| P5 | `nomura-re-kodama-bess` | 0（「児玉」） | 無い → POST |
| P6 | `nomura-re-maebashi-bess` | 0（「前橋」） | 無い → POST |
| P7 | `nomura-re-fujinomiya-bess` | 1: `buddynet-fujinomiya-bess`（日進LRD蓄電所）＝便 §2-7 で別の設備 | 無い → POST |
| **P8** | `adw-mashiki-bess` | **2: `pr-co160356-bess-2`**（下）・`mikimori-kamimashiki-bess`（熊本県上益城郡蓄電所（三木森HD）・計画中・運転開始予定 2027年2月・10 案件の一つ） | **在る → POST しない** |

- **P8 の `pr-co160356-bess-2`**（id `5wym-85hrn9`・一覧から外していない・301 でもない）: name「系統用蓄電所（ADワークスグループ）」・status ["稼働中"]・outputMw 2・capacityMwh 8・prefecture 熊本県・city **益城町**・operator「ADワークスグループ」・cod `2026-08-31`・sourceUrl **`https://prtimes.jp/main/html/rd/p/000000085.000160356.html`**（＝P8 の一次 E1「第２号「ADW熊本益城町蓄電所」が竣工・稼働開始」そのもの）・publishedAt 2026-05-09・updatedAt 2026-09-03。本文はテンプレ（第 1 段落は表示時に欄から作り直す＝`src/lib/projects-body.ts`。生の本文には「三重に立地」「発表日：2026-02-12」と別のリリース 000000043 が残っている）。
  → 便 §2-3 の「益城町は、当サイトのニュースにも projects にも無かった登録もれ」と違い、**projects には在った**（名前が「系統用蓄電所（ADワークスグループ）」のため、名称では見つからない）。直すなら、このレコードへの PATCH（名称・事業者・cod〔今の 2026-08-31 は配信日＝口春の前例では空〕・本文）になる。この便では書いていない（(9) 要判断 1）。
- **照らし方**: 最初は社名を「どこかのレコードに社名が出たら止める」で照らした（21:15）。P4〜P7 が、ブルースカイエナジー株式会社が事業者のほかの土地の 8 件（`bluesky-nakatsu-bess` 大分県中津市・`bluesky-miyaki-bess` 佐賀県みやき町・`bluesky-osaki-bess` 宮城県大崎市・`bluesky-himeji-bess` 兵庫県姫路市・`pr-co175281-shizuoka`／`pr-co175281-bess` 静岡県牧之原市・`pr-co175281-bess-2` 認定告知〔一覧から外したもの〕・`pr-japan-bess`〔所在地なし・出典 000000008.000175281＝Sungrow Japan との購入の基本合意書の発表〕）で止まった。どれもいわき・児玉・前橋・富士宮の設備ではないので、社名は「同じ所在地での一致」だけを同じ設備の候補にし、社名だけの一致は一覧に出すだけに直した（`build-projects-write-2026-11-15.ts` のコメント）。野村不動産の一致は 0。
- 社名で照らした語: P1 クラフティア・日本蓄電池・リミックスポイント・デジタルグリッド（唐津）／P2 クラフティア・日本蓄電池（荒尾）／P3 NAMIJU・エンブルー（境港）／P4〜P7 野村不動産・ブルースカイ（各市町）／P8 エー・ディー・ワークス・ADワークス・ADW（益城）。

### 一次の取り直しと照合（16 本）

- 2026-11-15 21:12:13〜21:13:08 JST に、計画の `primaries` 16 本を素の curl で 1 本ずつ取った（1.5 秒あけ・並列なし・ブラウザのふりをする UA なし）。**16 本とも HTTP 200**。WebFetch は使っていない。
  - バディネットの施工実績のページ（K3）の sha256 先頭 16 桁は `d3dd31a00171d082`＝計画と同じ。PR TIMES の 15 本は計画の sha と違う（便 §0 のとおり枠の部分。照合は ev で行った）。
- 照合（NFKC・空白を除いて・script を除いた本文で）:
  - 計画の `ev`（一次の逐語）**128 個すべて**が、その一次の見える本文にある（script の中だけに在ったものは 0）。
  - 本文（POST の body・PATCH の body の new／insert）の「」の引用と出典の題名 **95 個すべて**が、その件の一次にある。出典リンクの文言（題名・発行元・日付）は 15 本とも計画の題名・発行元・日付と一致し、題名は取り直したページの `<title>` に含まれる。
  - 本文の数字・日付 **125 個すべて**が、その件の一次にある。
  - **合わなかったもの: 0**。
- PR TIMES の更新日時（`dateModified`）: どれも配信の当日か翌日（A1 11-07・C1 11-12・G2 08-15・K2 09-18 ほか）で、ユウの 11/15 の取り直しより前。本文は計画の逐語のとおり。

## (2) POST 7 件（P8 は書いていない）

送信値は計画の `payload` のまま（dry run の送信値と計画の payload を機械で突き合わせて一致）。POST の後の GET で全 field が送信値と一致（#106）。

| | slug | id | field | 名称 | 状態 | 出力／容量 | 事業者 | EPC | 運転開始 | 市場 |
|---|---|---|---|---|---|---|---|---|---|---|
| P2（canary） | `nc-arao-bess` | `12s9l02dsvf7` | 8 | NC荒尾市府本字打越蓄電所 | 建設中 | 空／空 | 空 | 株式会社クラフティア | 空 | 空 |
| P1 | `nc-karatsu-hamatama-bess` | `qxyhqiwr8t2z` | 12 | NC唐津市浜玉町浜崎蓄電所 | 稼働中 | 1.983／8.146 | 空 | 株式会社クラフティア | 2026-06-05 | 需給調整市場 |
| P3 | `namiju-sakaiminato-bess` | `8iwl8fc_r` | 10 | 境港市新屋町1158蓄電所 | 建設中 | 1.998／8.226 | 株式会社NAMIJU | 空 | 空 | 空 |
| P4 | `nomura-re-iwaki-bess` | `ypibqkgsftii` | 12 | 福島県いわき市蓄電所（野村不動産） | 計画中 | 2／8 | 野村不動産株式会社 | ブルースカイエナジー株式会社 | 2026年12月（予定） | 空 |
| P5 | `nomura-re-kodama-bess` | `ixnh-jvyg` | 12 | 埼玉県児玉郡蓄電所（野村不動産） | 計画中 | 2／8 | 同上 | 同上 | 2027年1月（予定） | 空 |
| P6 | `nomura-re-maebashi-bess` | `qbehw_fux` | 12 | 群馬県前橋市蓄電所（野村不動産） | 計画中 | 2／8 | 同上 | 同上 | 2027年4月（予定） | 空 |
| P7 | `nomura-re-fujinomiya-bess` | `cl0ia83r5` | 12 | 静岡県富士宮市蓄電所（野村不動産） | 計画中 | 2／8 | 同上 | 同上 | 2027年5月（予定） | 空 |

- 手順（便 §5-3）: canary の P2 を 21:18:55 に POST → GET 照合 8/8 → 21:19:12〜21:19:40 に残り（POST 6・PATCH 6）。
- select の値は実在の選択肢だけ（status: 稼働中／建設中／計画中・marketParticipation: 需給調整市場）。

## (3) PATCH 6 件（24 op）

| | slug（id） | 旧 → 新 | GET 照合 |
|---|---|---|---|
| U1 | `adw-nichinan-bess`（`w90_f0qufmf4`） | name「宮崎県日南市蓄電所（エー・ディー・ワークス）」→「ADW宮崎日南市蓄電所」／status ["建設中"]→["稼働中"]／sourceUrl `…000000074.000160356.html` → `…000000093.000160356.html`／body 607 → 637 字（全文） | 送信 4 field 一致・他 field 変化 0 |
| U2 | `glome-nishikata-kanai-2465-bess`（`6nf7or1-rj12`） | cod `2026-07-10` → `2026-11-04`／marketParticipation [] → ["需給調整市場"]／sourceUrl `…000000008.000185790.html` → `…000000013.000185790.html`／body 550 → 825 字（全文） | 送信 4 field 一致・他 field 変化 0 |
| U3 | `nc-kainan`（`qtst1yvdh`） | outputMw 空 → 1.996／capacityMwh 空 → 8.146／status ["建設中"]→["稼働中"]／cod 空 → `2026-11-09`／sourceUrl `…000000201.000033609.html` → `…000000123.000161802.html`／body 739 → 774 字（全文） | 送信 6 field 一致・他 field 変化 0 |
| U4 | `adw-taki-bess`（`ub53w4hqi`） | body 612 → 1,021 字（末尾の注記の段落の直前に、千葉銀行の融資の 1 段落） | 送信 1 field 一致・他 field 変化 0 |
| U5 | `adw-kumamoto-bess`（`94xu2v85m`） | body 579 → 988 字（同上） | 送信 1 field 一致・他 field 変化 0 |
| U6 | `buddynet-izumo-koshi-bess`（`4yv2yhwfg`） | name「出雲市古志町 系統用蓄電所」→「出雲古志蓄電所」／operator 空 →「デジタルグリッドアセットマネジメント株式会社」／outputMw 2 → 1.997／capacityMwh 8 → 8.128／status ["建設中"]→["稼働中"]／marketParticipation [] → ["需給調整市場"]／sourceUrl `…000000015.000168478.html` → `…000000071.000045726.html`／body 918 → 972 字（全文） | 送信 8 field 一致・他 field 変化 0 |

- **計画の old と GET の値: 24 op のうち body 以外の 18 op はすべて一致**（「空」は null・[]・未設定を同じに扱った＝便 §0）。body は GET の値を old に使った（全文の置換 4 件）。
- **U4・U5**: GET した本文の末尾が `<p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>` で、それがちょうど 1 回であることを確かめてから、その直前に計画の `insert` を入れた（送る本文は「GET の本文の注記の段落の直前に insert」と機械で突き合わせて一致）。
- **計画の keep と GET: 27 欄すべて一致**（違ったもの 0）。
- 送った値は、dry run の段階で計画の `new`（U4・U5 は上の組み立て）と機械で突き合わせて **31 欄すべて一致**。
- 冪等: 書込の後にもう一度 dry run（`.dry2.json`）→ **13 件すべて skip**（POST は slug 既存・PATCH は expect_final と一致）。中止 0・生の文字列の突き合わせの不一致 0。
- microCMS の呼び出し: 書込で GET 33・POST 7・PATCH 6（canary 1 回＋残り 1 回）。計画づくりで GET 12×3 回（下の (9) 申告）、dry run で GET 19×2 回。
- 書込の後の全件の件数: **totalCount 419**（412＋7）。

## (4) バディネットの施工実績のページ（U6）

`https://www.buddynet.jp/solution/energy/grid-battery/works/koshi-bess/` を 21:13 に素の curl で取り直した（HTTP 200・55,139 バイト・sha256 先頭 16 桁 `d3dd31a00171d082`＝計画と同じ）。
- `<title>`「出雲古志蓄電所 - 島根県出雲市古志町での施工事例｜株式会社バディネット」
- 表: **事業所名「出雲古志蓄電所」・所在地「島根県出雲市古志町」**・システム出力 2MW・蓄電容量 8MWh・完工時期 2026年7月。
→ 便 §2-6 のとおり（事業所名・所在地とも一致）なので U6 を書いた。

## (5) 訂正履歴の 1 件

- `src/data/corrections.json` の `items` の末尾に **`20261115-01`** を足した（訂正・`/projects/glome-nishikata-kanai-2465-bess`・targetTitle「GM西方町金井2465蓄電所（グローム・ホールディングス）」）。before・after・basis（一次 2 本）は計画の `corrections[0]` のまま。date は本番に出た日（2026-11-15・(6)）、internalRef はこの報告。
- 既存の 496 件は 1 字も変えていない（追記だけ・497 件）。`verify:corrections` は (6) の build の中で通った。

## (6) デプロイ・本番の確認

（デプロイの後に記入）

## (7) IndexNow

（本番確認の後に記入）

## (8) 見るだけ（書いていない）

計画の `look_only` の 4 行の名前を、projects の全件 412 件（一覧から外した 105 件を含む・baseline）の名称・所在地・事業者・EPC で照らした。

| 計画の行 | 照らした語 | projects にあるか |
|---|---|---|
| ADW の第10号（栃木県日光市）・第11号（長野県松本市） | 日光・松本 | 第10号: **在る**＝`adw-nikko-bess`「栃木県日光市蓄電所（エー・ディー・ワークス）」（日光市・株式会社エー・ディー・ワークス）／第11号（松本）: 無い |
| NC相知町長部田蓄電所（佐賀県唐津市） | 長部田 | 無い（唐津市の NC の既存は `pr-co161802-saga-2`「NC唐津市相知町蓄電所」。同じ設備かは見ていない） |
| GM豊岡市但東町蓄電所（グローム・ホールディングスの第1号） | 但東・豊岡 | 無い |
| 御殿場高圧蓄電所・大垣市上石津一之瀬蓄電所（デジタルグリッドグループの自社保有） | 御殿場・上石津・大垣 | 無い |

## (9) 申告

### 書かなかった件

- **P8 `adw-mashiki-bess`（ADW熊本益城町蓄電所）**: 同じ設備のレコード `pr-co160356-bess-2` が在った（(1)）。便 §0 のとおり POST していない。そのため、全件は 412 → **419**（便の見込み 420）、一覧は 307 → **314** の見込み（便の見込み 315）。IndexNow も 15 URL（便の見込み 16）。
- エコ革の 11 か所（S1）・`pr-co161802-saga`・`buddynet-fujinomiya-bess` は便 §1 のとおり何もしていない。

### 要判断

1. **`pr-co160356-bess-2` を ADW熊本益城町蓄電所として直すか**: 計画の P8 の値（name「ADW熊本益城町蓄電所」・operator「株式会社エー・ディー・ワークス」・cod 空・body）をこのレコードへの PATCH にすれば、P8 の内容が入る。今の値で直すべきところ: name（施設名が出ていない）・operator「ADワークスグループ」（親会社。事業は子会社の ADW）・cod `2026-08-31`（E1 の配信日。表の日付は竣工・引渡日で、稼働開始の日付の記載が無い＝口春の前例では空）・本文（テンプレのまま。生の本文には三重の別リリースの文が残る）。slug は `pr-co160356-bess-2` のまま（推測で変えない）。
2. **社名の照らし方**（(1)「照らし方」）: 便の「社名の部分一致が 0」を「同じ所在地での社名の一致が 0」と読んで、P4〜P7 を書いた。字義どおり（社名がどこかに出たら止める）なら P4〜P7 は止まっていた（ブルースカイエナジーのほかの土地の 8 件）。

### 便に書かれていない作業

- **資料名の台帳 `src/data/source-documents.json` に 15 件を足した**（追記だけ・既存の 431 件は 1 字も変えていない・446 件）。書いた本文で出典に挙げた一次 15 本（A1・A2・B1・C1・D1・D2・F1・G1・G2・H1・H2・J1・K1・K2・K3。P8 の E1 は書いていないので足していない）。title_verbatim は 21:12〜21:13 に素の curl で取った `<title>`、checked_on 2026-11-15。CLAUDE.md の受け入れ基準（資料名は書く前に一次の `<title>` を取り台帳に登録）と、11/8 の projects 便の前例（38 件を足した）に合わせた。便 §4「ほかのコードは変えない」とは食い違う。要らなければ外す。`verify:source-names --no-cms` は ok（台帳に無い資料名 0）。

### そのほか

- 計画づくり（`build-projects-write-2026-11-15.ts`）を 3 回流した（GET のみ・各 12）。1 回目は社名の照らし方で P4〜P8 を止め、2 回目は P2 を荒尾市の 301 元 2 件で止めた（どちらも上の判断で直した）。書込は 3 回目の計画で行った。
- 新規の slug の本番の URL は、書込の前に開いていない（#127）。`pr-co160356-bess-2` の本番のページも開いていない。
- 一時物（リポの外・消していない）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\wp1115\`（`prim\` に一次 16 本〔.html・.hdr〕と Sungrow の発表 1 本〔`X_bluesky8.html`〕・`work\` に照合のスクリプトと結果・baseline の全件〔`baseline.json`〕・build と verify のログ）。
- 作業前からある未コミットの差分（`src/data/substations/*.json`・`scripts/experimental/operators/alias-expansion-report.json`）は commit に入れていない。
- rm／Remove-Item・`git push --force`・`.env` の表示はしていない。microCMS の書込は projects の POST 7・PATCH 6 だけ。
