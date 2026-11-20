# 週次ニュース便 11/20 — ニュース 11 件 POST ＋ projects 同定照合（読取）報告（2026-11-20・CC）

microCMS 書込は **news の POST 11 件だけ**（PATCH・DELETE・PUT 0）。projects・policy-events・events への書込 0。

## ■0 申告

- 読んだ便ファイル: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次ニュース便_2026-11-20_ニュース11件_Claude_Code投入_ユウ.md`
  - 39,388 バイト・最終更新 2026-11-20 14:23:58 JST・sha256 `5ca7b40d715d65c5…`
- GO: `_QUEUE.md` 128 行（ユウ 11/20 21:14・EDAさん「２本ともOK　入れる」・2 本目＝127 行〔週次政策〕の DONE の後）
- 実行開始: **2026-11-20 21:28:31 JST**・main の HEAD **`6eabc61`**
- 入力 JSON: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\news-import-2026-11-20_週次ニュース便_原文照合済み_ユウ.json`
  - 22,298 バイト・最終更新 13:51:07 JST・sha256 の先頭 16 桁 **`b5ced5c5c9edbfb7`**（便の値と一致）。
  - `scripts/news-import-2026-11-20.json` にコピーして使った。値は変えていない（原本も変更なし）。
- 他の GO 便とは同時に走らせていない。webhook は止めていない（11 件＝20 件以下）。
- #127: 新規 11 slug の本番 URL は POST の前に開いていない（重複確認は microCMS の GET）。

## ■1 ニュース POST（11 件）

### 手順と結果

1. **一次の再照合**（POST の直前・21:29）
   - 11 件が使う PR TIMES の個別ページ 13 本（大分・ハンファは 2 本ずつ）を、**素の curl**（`-A` なし）で 1.5 秒あけて取り直した。13 本とも HTTP 200。
   - 11 件の title・lead・body（URL を除く）に出る数字・日付・数字＋単位 **98 個**と「」の引用（計 22）を、一次の本文（script・style を除き NFKC・空白を除く）と機械照合: **NG 0**。
   - 一次の更新日時（dateModified）: Second Foundation（`000000011.000177112`）だけが **2026-11-20 18:40:03** で、ユウの確認（14:21〜14:24）の後に改訂されていた。今のページで、記事が使う語（「2026年[11月9日]」・「いずれも出力2MW」「日本各地に所在」・合同会社日本オブノ・「長期アグリゲーター」・株式会社IQg の O&M・ICG を過半数株主・稼働中4拠点・案件12件・約1.5GWh）が全部あることを確かめた（記事の中身は変えていない）。ほかの 12 本の最新の改訂は 11/20 12:10（デジタルグリッド）で、ユウの確認より前。
2. **重複**（21:30・microCMS の news を全件 GET＝**1,461 件**・`orders=-publishedAt,-createdAt`・id の重複 0）:
   - 11 slug・11 sourceUrl とも既存 0。
   - 便が挙げた近い題名のもの（`digitalgrid-bess-250mw-2026-11`＝総容量 250MW の別の発表・`bluefield-aggregation-150mw-2026-11`＝Bluefield の採用決定容量・`pr-2025-12-11-co9490-200`＝ハンファの 2025 年の発表・`qenest-storage-aggregation-service`・`pr-2026-04-03-co161802-56` ほか日本蓄電池の上愛子 4 件・`powerx-kamigumi-oita-storage`・`pr-2025-11-14-daigas-174`＝大分市の併設蓄電池の「設置」の発表）を目で見た。どれも別の出来事・別の設備。
3. **CATEGORY_OVERRIDE** に 11 slug を足した（`scripts/import-news.ts`・経緯コメント「週次ニュース便 11/20（2026-11-20 起草・対象 11/13〜11/20 12:00 配信）」）。値は各件の `_category` と全部一致することを機械で確かめた（技術 4・開発計画 2・連系 2・投資 1・海外 1・市場統計 1）。
4. **dry run**（21:31:10）: ok 11（新規 11・skip 0・err 0）。
5. **パイロット** `--limit 2 --apply`（21:31:28〜33）: lehmansoft（id `s44qw_33zgw`）・sunvillage（id `62e8gjfs3af`）→ GET 照合（title・lead・body・tags・sourceName・sourceUrl・category）一致。news 1,461 → 1,463。
6. **残り 9 件** `--skip 2 --apply`（21:31:55〜32:08）: ok 9・err 0。news 1,463 → **1,472**。
7. **全 11 件の GET 照合**: 9 件は全欄一致。2 件（`second-foundation-ray8-4projects-2026-11`・`ecostyle-teiatsu-kiki-package-2026-11`）は body の「O&M」の `&` が保存で `&amp;` になった差だけ（richEditor の正規化・#122。画面の文字は同じ）。ほかの欄の差 0。

| slug | id | category |
|---|---|---|
| lehmansoft-bess-gateway-jc-star-2026-11 | s44qw_33zgw | 技術 |
| sunvillage-sendai-kamiayashi-heisetsu-2026-11 | 62e8gjfs3af | 開発計画 |
| sonnedix-osakagas-oita-heisetsu-unten-2026-11 | mf58p2x9vrf | 連系 |
| bluefield-openadr-2b-2026-11 | 6nzfgbzrmemp | 技術 |
| second-foundation-ray8-4projects-2026-11 | c3tzfb9_h | 投資 |
| renon-power-jc-star-3products-2026-11 | lefmui19m5uy | 技術 |
| adw-kumamoto-mashiki-jukyu-2026-11 | kxlvfx8md76c | 連系 |
| ecostyle-teiatsu-kiki-package-2026-11 | 2l0lijnjc | 技術 |
| powerx-averroes-gcc-partnership-2026-11 | dg42dptz5-6 | 海外 |
| digitalgrid-jukyu-150mw-2026-11 | yd9_b5cgs9 | 市場統計 |
| hanwha-japan-teiatsu-bess-2026-11 | y8epm0vexdf | 開発計画 |

- 原稿からの変更: なし（JSON のまま送った）。

## ■2 projects の同定照合（読取のみ・書込ゼロ）

projects を全件 GET（21:34・419 件・id の重複 0）して照らした。

| 便の項 | 結果 | 該当と現在値 |
|---|---|---|
| a. ADW熊本益城町蓄電所 | **既存あり** | `pr-co160356-bess-2`「ADW熊本益城町蓄電所」・operator 株式会社エー・ディー・ワークス・熊本県 益城町・status 稼働中・出力 2・容量 8・運開日（cod）null・**marketParticipation は空（[]）**・sourceUrl `…/000000085.000160356.html`。今回の発表（卸電力市場と需給調整市場の両方で運用）から見ると、市場の欄は空のまま＝PATCH の候補（取引開始の日付は一次に無い） |
| b. 大分市の太陽光（約39MW）併設の蓄電池（約30MW／約125MWh） | **無し＝新規候補** | 大分市（city・名称）のレコード 0。大阪ガス・Daigas・ソネディックスの名のあるレコードは 6 件（千歳 3・千里 2・武雄 1）で、どれも別の設備。系統用ではなく再エネ併設型なので、載せるかは裁定事項 |
| c. Second Foundation → レイエイトエナジーの 4 件 | 設備の同定はしない（所在地なし） | operator に「合同会社日本オブノ」「レイエイトエナジー」のレコードは 0。Second Foundation の名のあるものは `pr-iqg-second-foundation-bess`（IQg と Second Foundation の資本提携の発表・設備ではない）と `pr-co177112-bess`「ドイツ・系統用蓄電池」の 2 件だけ |
| d. 仙台市上愛子発電所の併設蓄電池（2,444kWh・完工 2027年3月予定） | **無し＝新規候補** | サンヴィレッジ／SVC の上愛子のレコードは 0。上愛子のレコード 2 件（`nc-sendai-kamiayashi`・`pr-co161802-miyagi`）は日本蓄電池の別の設備（混同しない）。再エネ併設型なので、載せるかは裁定事項 |

→ 新規 POST・PATCH は本便ではしていない（ユウの裁定の後、projects の便で）。

## ■3 本番照合（素の URL・クエリなし）

- commit `f3968e3`（CATEGORY_OVERRIDE と入力 JSON）→ Vercel の status success 21:50:05 JST（webhook のビルドの後の最後のビルド）。
- 21:50:12〜21:50:36 JST:

| URL | HTTP | x-vercel-cache | age | 見たもの |
|---|---|---|---|---|
| `/news` | 200 | PRERENDER | 0 | 11 件の title が最初の画面に全部ある |
| `/news/{11 slug}` | 11 本とも 200 | 11 本とも PRERENDER | 0 | title が初期 DOM（script・style を除き `<!-- -->` を剥がしたもの）にある・各件の数字（4〜15 個・計 98）が script の外の本文に全部ある |

- IndexNow: `reports/weekly-news-2026-11-20.indexnow-urls.txt`（新規 11 件＋`/news`＝12 行）。dry run（12 件・鍵のファイル 200 一致）→ `--apply --log=reports/weekly-news-2026-11-20.indexnow.json`: 21:50 JST・**HTTP 200（受理）**・12 件。鍵は先頭 4 文字 `605d` だけを書く。

## 申告・一時物

- 停止条件に当たる操作なし（rm 系・push --force・.env の表示・microCMS の DELETE／PUT いずれも 0）。
- 最初の一次の取り直しで、Python が書いた URL 一覧の改行（CRLF）が curl に渡って 13 本とも取れなかった（ファイルは作られていない）。改行を除いて取り直した（21:29:16〜）。
- 一時物はすべて scratchpad（リポの外）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\wn1120\`（`pr\` に PR TIMES 13 本と応答ヘッダ・`urls.json`／`urls.txt`・`news_all.py`・`news_before.json`・`verify_news.py`・`projects.json`・`prod.py`・`prod.json`・`prod\`）。消していない。
- commit は名前を指定して入れた。
