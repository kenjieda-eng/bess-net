# 週次ニュース便 11/13 — ニュース 13 件 POST ＋ projects 同定照合（読取）報告（2026-11-13・CC）

microCMS 書込は **news の POST 13 件だけ**（PATCH・DELETE・PUT 0）。projects・policy-events・events への書込 0。

## ■0 申告

- 読んだ便ファイル: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次ニュース便_2026-11-13_ニュース13件_Claude_Code投入_ユウ.md`
  - 43,383 バイト・最終更新 2026-11-13 15:11:44 JST・sha256 `bc47af94563ecd4f…`
  - 起草時の 15 件の便（`…ニュース15件…`）は使っていない。
- GO: `_QUEUE.md` 110 行目（ユウ 11/13 15:2x）
- 実行開始: **2026-11-13 15:27:55 JST**・main の HEAD **`de16887`**
- 入力 JSON: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\news-import-2026-11-13_週次ニュース便_原文照合済み_ユウ.json`
  - 24,391 バイト・最終更新 15:00:35 JST・sha256 の先頭 16 桁 **`b67af9f27e21d5a5`**（便の値と一致。15 件の版 `2f99150b233a71b1` ではない）。
  - `scripts/news-import-2026-11-13.json` にコピーして使った。値は変えていない（原本も変更なし）。
- 他の GO 便とは同時に走らせていない（111 行の週次政策便は本便の後に流す）。
- webhook は止めていない（13 件＝20 件以下）。

## ■1 ニュース POST（13 件）

### 手順と結果

1. **一次の再照合**（POST の直前・15:2x）
   - 13 件が使う PR TIMES の個別ページ 15 本（海南・野村不動産は 2 本ずつ）を、**素の curl**（`-A` なし）で 1.5 秒間隔で取り直した。15 本とも HTTP 200。
   - 一次の更新日時（dateModified）の最新は 2026-11-13 06:10（Rearth）で、ユウの確認（14:5x〜15:0x）の後に改訂されたページは無い。
   - 13 件の title・lead・body（URL を除く）に出る数字・日付・数字＋単位 **134 個**を、一次の生 HTML の文字（script・style を除き NFKC・空白を除いて照合。MW／kW は MWh／kWh の中だけで当たっていないことも確かめた）と機械照合した: **不一致 0**。
2. **便の注意点**（「何の数字か」）を一次の語で確かめた。全部便の記述どおり:
   - E-Flow: 「突破する見込み」「1.0GW」「2030年までに稼働開始」。
   - ADW 日南: 表は全角（「約２MW」「約８MWh」「2027年２月頃」）・「引き渡し後速やかに運用開始」・「11か所」・「2026年11月6日」。
   - NC唐津浜玉: 「需給調整運用開始日 2026年11月6日」・「1,983kW・8,146kWh」・「ダイヘン（蓄電池：CATL）」。
   - グローム: 「一時調整力市場」（第 1 号の段落は「一次調整力市場」）・「西方町金井４４」。
   - NC荒尾: 「2026年10月28日」・「クラフティア」。
   - NC海南: リミックスポイントの本文「2026年11月9日に受電を開始」、日本蓄電池の表「運転開始日 2026年11月9日」・「ワイ・ジャスト」（本文は受電開始で統一＝原稿どおり）。
   - ADW 千葉銀行: 「11億4,310万円」・「2026年9月」・「系統用蓄電池事業所取得資金」・「蓄電池システムの導入費用に全額充当」。
   - エンブルー: 「1,998kW」「8,226kWh」「MegaPower MP2742-FB00」「NAMIJU」「2026年10月」。
   - デジタルグリッド 出雲古志: 「2026年11月11日」「1,997kW」「8,128kWh」「自社保有の蓄電所としては3カ所目」。
   - 野村不動産: 「2MW / 8MWh」「特別高圧案件6件」「計10件」・ブルースカイエナジーの本に「野村不動産株式会社」。
   - RENON POWER: 「74.85MW」「約75MW」「約300MWh」「49.9kW」「200kWh」（換算値）。
   - Rearth: 「2026年9月」。
3. **エコ革の 11 行の和**（便の指示）: 一次の表を取り直して足した。最大受電電力は 11 行の和 **21,895 kW**＝合計欄 21,895 kW。蓄電池容量は 11 行の和 **91,820 kWh**、合計欄は **82,662 kWh**（差 9,158 kWh＝1 行分）で、**一次はまだ直っていない**。→ 便のとおり POST した（題名と本文に容量の合計は無い）。
4. **重複**（15:2x・microCMS の news を全件 GET＝**1,448 件**・id の重複 0）:
   - 13 slug はどれも無い。15 本の PR TIMES の URL が既存の記事（sourceUrl と本文）に出ることも 0。
   - 題名の語の当たり（日南・千葉銀行・ちばぎん・NAMIJU・出雲古志・古志・Rearth・1,500サイト は 0 件）。当たった既存は、どれも別の出来事:
     - 唐津: `pr-2026-04-01-co161802-54(-2)`（浜玉町浜崎の設置開始）・`…-53`（相知町の設置開始）・`pr-2025-08-07-co161802-6`（防災協定）。
     - エコ革: `ecokaku-technologies-bess-4sites-keiren-2026-07`（4 施設）ほか 2025 年の 2 本。西方: `glome-nishikata-no2-hikiwatashi-2026-08`（引渡し）。海南: `nc-kainan-kizu-setti-2026-10`（設置開始）。
     - 境港: `birdman-sakaiminato-bess-unten-2026-07`（Birdman・1,999.9kW／8,128kWh＝エンブルーの 1,998kW／8,226kWh と別）。荒尾: 2023 年の 1 本。野村不動産: 2025 年の PPA の 1 本。
     - 便が名前を挙げた `bluesky-energy-4sites-unten-2026-08`（別の 4 拠点）・`buddynet-izumo-2mw-8mwh-completion-2026-09`（出雲市の完工）も、題名で別の出来事と確かめた。
   - 新しい slug の本番 URL は POST の前に開いていない（#127）。
5. **CATEGORY_OVERRIDE**: `scripts/import-news.ts` に 13 slug を「週次ニュース便 11/13」の経緯コメント付きで足した（各件の `_category` どおり。便の 3 件＝E-Flow 市場統計・野村不動産 投資・エンブルー 連系 もこの中）。
6. **dry run**（15:2x）: 13 件とも新規・category は override で決まる → **パイロット 2 件**（`--limit 2 --apply`・15:31:07）→ GET で照合（2/2 一致）→ **残り 11 件**（`--skip 2 --apply`・15:31:48）→ **全 13 件を GET で照合**:
   - 12/13 で title・lead・body・tags・sourceName・sourceUrl・slug が送信値と完全一致。category も各件の `_category` どおり（#106）。
   - 1 件（`rearth-energy-development-2026-11`）は body の「O&M」が保存で「O&amp;M」になった（richEditor の正規化・#122 と同じ型）。見える文字は同じで、意図の文言は全部入っている＝**失敗ではない**。
   - `_prtimesUrl`・`_publishedDate`・`_category`・`categorySuggestion` は送っていない（GET に出ない）。
   - news の総数は 1,448 → **1,461**。
   - 記事の日付: 前回（11/6）の記事と同じく、`publishedAt` は POST の時刻・`date` 欄は無い（importer は日付を送らない）＝「前回どおり」。
7. **原稿からの変更点: 0**（一次と食い違う箇所は無かった）。

| # | slug | microCMS id | category | 一次（PR TIMES） | 一次の dateModified |
|---|---|---|---|---|---|
| 1 | eflow-unyou-jutaku-1-5gw-2026-11 | zedurxvg6vtx | 市場統計 | 000000004.000189198 | 2026-11-08 07:40 |
| 2 | adw-miyazaki-nichinan-unten-2026-11 | k12ok3-lyg | 連系 | 000000093.000160356 | 2026-11-06 20:10 |
| 3 | nc-karatsu-hamatama-jukyu-2026-11 | iwk843ayjlh | 連系 | 000000120.000161802 | 2026-11-07 04:40 |
| 4 | ecokaku-11sites-keiren-2026-11 | ud2x7vx4uhn | 連系 | 000000003.000187675 | 2026-11-10 12:52 |
| 5 | glome-nishikata-no2-unyou-2026-11 | 121mq4jtsw | 連系 | 000000013.000185790 | 2026-11-09 20:10 |
| 6 | nc-arao-setti-2026-11 | d8j146g_s | 開発計画 | 000000121.000161802 | 2026-11-09 12:01 |
| 7 | renon-power-1500sites-2026-11 | l02acngg8qt | 技術 | 000000007.000185433 | 2026-11-09 11:20 |
| 8 | nc-kainan-kizu-juden-2026-11 | 2n02be6x7l3 | 連系 | 000000233.000033609・000000123.000161802 | 11-10 15:10・11-10 18:10 |
| 9 | adw-chibagin-loan-2026-11 | lpg_p031p0g | 投資 | 000000094.000160356 | 2026-11-10 19:10 |
| 10 | enblue-sakaiminato-hikiwatashi-2026-11 | d89727d4x | 連系 | 000000012.000171049 | 2026-11-12 04:40 |
| 11 | rearth-energy-development-2026-11 | vf-6non1ktk3 | 開発計画 | 000000019.000179313 | 2026-11-13 06:10 |
| 12 | digitalgrid-izumo-koshi-jukyu-2026-11 | akgo8uskp | 連系 | 000000071.000045726 | 2026-11-12 12:10 |
| 13 | nomura-re-4sites-bess-2026-11 | tz6vha-rcg | 投資 | 000001034.000025694・000000018.000175281 | 11-12 18:10・11-12 18:10 |

## ■2 projects の同定照合（読取のみ・書込 0）

microCMS の projects を全件 GET（**412 件**）し、name・city・operator・諸元・sourceUrl で照合した。slug は推測していない。

| | 設備 | 結果 | projects の slug と現在値 |
|---|---|---|---|
| a | ADW宮崎日南市蓄電所（宮崎県日南市） | **既存あり** | `adw-nichinan-bess`（宮崎県日南市蓄電所（エー・ディー・ワークス）・status 建設中・2MW／8MWh・cod なし・sourceUrl 000000074.000160356）。ニュースは 11/6 竣工・引渡し＝status の更新の候補 |
| b | NC唐津市浜玉町浜崎蓄電所（佐賀県唐津市） | **無し＝新規候補** | 唐津市は `pr-co161802-saga-2`（NC唐津市相知町蓄電所・稼働中・1.988MW／8.146MWh）と `pr-co161802-saga`（「日本蓄電池と九電工は系統用蓄電池」・第1号案件は唐津市・0／0・稼働中 2025-08-07）。浜玉町の名のレコードは無い。`pr-co161802-saga` がどの施設かは判別不能（値が 0） |
| c | エコ革の 11 か所 | **無し＝新規候補（11 か所とも）** | 「エコ革」の名のレコードは 0（7 月の 4 施設の記事の設備も projects に無い）。同じ市の既存はどれも別の事業者・別の諸元: 恵那市＝`remixpoint-ena-iwamura-3-bess`（リミックスポイント）／熊谷市＝`yatogo-bess`・`kumagaya-bess`（1.96MW／7.46MWh）・`kaminara-bess`・`pr-co169829-bess`・`pr-co173175-saitama-5mwh`（HOBE・日本蓄電開発機構）／比企郡＝`pr-looop-saitama`（Looop・小川町・7.6838MWh）／境港市・鹿沼市・いすみ市・深谷市・岩舟町は 0。栃木市西方①（1,994kW）は d と同じ値だが、同一の記載は無い＝判別だけ（下の d） |
| d | GM西方町金井2465蓄電所（栃木県栃木市西方町金井） | **既存あり** | `glome-nishikata-kanai-2465-bess`（status 稼働中・cod 2026-07-10・1.994MW／0・sourceUrl 000000008.000185790＝引渡しの発表）。ニュースは 11/4 運用開始（第 2 号施設）。エコ革の「栃木市西方①」（1,994 kW）と最大受電電力が同じだが、一次に同一の記載は無い＝**判別不能** |
| e | NC荒尾市府本字打越蓄電所（熊本県荒尾市） | **無し＝新規候補** | 荒尾市の既存は `arao-bess`・`pr-co55631-kumamoto`・`pr-afterfit-bess`（テレビショッピング研究所／しろくま電力・2023 年）＝別の設備 |
| f | NC海南市木津蓄電所（和歌山県海南市） | **既存あり** | `nc-kainan`（合同会社NCパイオニア・status 建設中・出力・容量なし・sourceUrl 000000201.000033609）。ニュースは 1,996kW／8,146kWh・11/9 受電開始＝値の更新の候補（日本蓄電池の表の「運転開始日」は受電開始の日付＝status を決めるときに注意） |
| g | 境港市新屋町1158蓄電所（鳥取県境港市・エンブルー→NAMIJU） | **無し＝新規候補** | 境港市のレコードは 0（Birdman の境港も projects に無い） |
| h | 出雲古志蓄電所（島根県出雲市・デジタルグリッドアセットマネジメント） | **判別不能** | `buddynet-izumo-koshi-bess`（出雲市古志町 系統用蓄電所・建設中・2MW／8MWh・sourceUrl バディネット 000000015.000168478）がある。同じ古志町だが、一次に同一の記載は無い。ほかに `nc-izumo-kunitomi-bess`（国富町・別） |
| i | 野村不動産の 4 拠点（いわき市・児玉郡・前橋市・富士宮市） | **無し＝新規候補（3 拠点）・判別不能（富士宮市）** | 富士宮市は `buddynet-fujinomiya-bess`（日進LRD蓄電所・建設中・2MW／8MWh）がある。一次に同一の記載は無い。いわき市・児玉郡・前橋市は 0 |
| j | ADW の三重県多気町・熊本県熊本市の事業所（融資の充当先） | **既存あり** | `adw-taki-bess`（三重県多気町蓄電所・計画中・2MW／8MWh）・`adw-kumamoto-bess`（熊本県熊本市蓄電所・計画中・2MW／8MWh） |

→ 本便では projects に書いていない（ユウの裁定の後、projects 便で）。

## ■3 本番照合・IndexNow

- 最後の POST（15:32:10）の後の webhook ビルド: `/build-info.json` の `builtAt` **2026-11-13T15:36:47+09:00**（15:44 に確認。前は 13:32:50）。
- 素の URL（15:44〜15:45 JST）:

| URL | HTTP | x-vercel-cache | age | 確認 |
|---|---|---|---|---|
| `/news` | 200 | HIT | 31 | 新規 13 件のうち 12 件の題名が初期 DOM の一覧にある（下の注） |
| `/news/{slug}` 13 本 | 200（13/13） | PRERENDER | 0 | 13 本とも題名・リードが script の外の本文にあり、本文の数字・日付（4〜18 個）も全部ある |

- 注: `eflow-unyou-jutaku-1-5gw-2026-11`（市場統計）は `/news` の埋め込みデータにはあるが、初期 DOM の一覧のリンクには出ない。同じ category の既存 `digitalgrid-bess-250mw-2026-11`・`bluefield-aggregation-150mw-2026-11` も同じ（一覧の作りどおり＝この便の不具合ではない）。個別ページは 200。
- **IndexNow**（CLAUDE.md 2-4）: 新規 13 件と `/news` の 14 URL を `reports/weekly-news-2026-11-13.indexnow-urls.txt` に書き、dry run で 14 件を確かめてから `--apply` で 1 回（15:45 JST）→ **14 件とも HTTP 200（受理）**・鍵 605d…・本番の鍵のファイル HTTP 200 で中身一致。記録 `reports/weekly-news-2026-11-13.indexnow.json`。

## 申告

- 一次は素の curl（`-A` なし）で取った（11/6 便は Chrome の UA だったが、本便の指示どおり UA は付けていない）。
- 一時物（リポの外・消していない）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\wn1113\`（取得物 `prt\` 15 本・`fetched.json`・`tokens.json`・`news_before.json`・`projects_all.json`・`getcheck_*.json`・`prod_a.json` と道具）。
- 作業前からある未コミットの差分（`src/data/substations/*.json`・`scripts/experimental/operators/alias-expansion-report.json`）は commit に入れていない。
- microCMS の書込は news の POST 13 件だけ。rm／Remove-Item・`git push --force`・`.env` の表示はしていない。
