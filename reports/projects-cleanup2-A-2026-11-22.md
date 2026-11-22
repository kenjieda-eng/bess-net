# projects の掃除便（その 2・2026-11-22）— A: 同じ設備の重複 6 件を 301 で統合／B: 1 件の蓄電所でない記録 4 件を一覧と合計から外す

microCMS `projects` の **PATCH 4 件（30 op）**・POST／DELETE／PUT 0。コード（301 の 6 行・除外の 4 行・訂正履歴 15 件・台帳 18 件）。

## (0) 実行の記録

| 項目 | 値 |
|---|---|
| 便 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\projects便_掃除その2_重複6件の統合（301）・4件を一覧から外す・PATCH4件・訂正履歴15件_Claude_Code投入_2026-11-22起草_ユウ.md`（20,882 バイト・sha256 `2f4fae241a6bc53d3473684a186e596a029e849cfaab32c99b06bdb7a6df75c6`＝`_QUEUE.md` の先頭 16 桁と一致） |
| 計画 | 同フォルダの `projects-plan-2026-11-22_A_重複6件の統合と4件の除外_一次照合済み_ユウ.json`（76,475 バイト・sha256 `df908094a87b2d045df0e6cf284e915806501a2feb6332127d7a4e40097560c6`＝便の先頭 16 桁と一致）。リポに `reports/projects-plan-2026-11-22-A_ユウ.json` として写した |
| 開始 | 2026-11-22 11:41 JST・HEAD `5c21505`（131 行の報告の後） |
| `_QUEUE.md` | 132 行（GO: ユウ 11/22 11:41・EDAさん 11:40「３つともOK」・メモ「A と B の両方を進める」）→ **A と B を両方入れた** |
| 道具 | 計画を書込の形にする `scripts/build-projects-2026-11-22.ts --part=A`（GET だけ）→ applier `scripts/apply-projects-2026-11-22.ts`（`runApplier`・既定 dry run）。書込の計画 `reports/projects-cleanup2-A-2026-11-22.json`・記録 `.dry.json`／`.apply.json`／`.dry2.json` |
| commit | `13a5356`（11 ファイル・push 12:12:15）・報告は別の commit |
| 停止条件 | rm 系 0・push --force 0・.env 表示 0（読み込みのみ）・microCMS は PATCH 4 と GET だけ（DELETE・PUT 0）・webhook は止めていない |

## (1) GET と今の値の照合・一次 18 本の照合

- **本番 `/projects` の今の数字**（11:42:46・素の URL・HIT・age 27）: 掲載 304・3,124.5 MW（274）・9,403.5 MWh（258）・稼働中 155／建設中 47／計画中 85／その他 17・調査中 20＝計画の `expected.before` と同じ。
- **15 件の GET**（A の 11 件＝301 元 6・統合先 5、B の 4 件）: 計画の `from_now`・`to_now`・`now`・`old`・`keep` と **179 照合・違い 0**（書込の直前にもう一度 GET して old **30/30**・keep **17/17** 一致＝`build-projects-2026-11-22.ts`・GET 8）。書込の前に、書込対象の詳細ページは開いていない（#127）。
- **一次 18 本**（どれも PR TIMES）を素の curl で取り直した（11:44:00〜11:45:02・1 本ずつ・3 秒あけ・ブラウザのふりをする UA なし）。18 本とも HTTP 200。バイト数は 13 本が計画と同じ・5 本が ±2（ページの動く部分）。sha256 は全部違う（動く部分が入るため）。PR TIMES の `dateModified` は全部が `datePublished` より後だが、どれも計画の作成より前（いちばん新しいのは BS16 の 2026-08-21）＝**計画の後の改訂は無い**。
- **照合**（scratchpad の `check_ev2.py`。便 §0 の範囲＝題名とリリース本文〔`id="press-release-body"` から末尾の「このプレスリリースには」「すべての画像」「ビジネスカテゴリ」の手前まで〕・NFKC・空白と表の区切りを除く）:
  - 計画の `ev` **98 本**: 合わない **0**。題名 18 本も一致。
  - V1〜V4 の新しい本文: 「」の引用（11・17・17・9）と数字・日付（11・10・8・4）が一次に全部ある。出典リンク（3・3・3・2）の題名・日付が計画と一致。
  - 訂正履歴 15 件の「」の引用: 一次か当サイトの今のレコードに全部ある。1 つだけ一次にない「稼働中」（七本木の after）は、当サイトの新しい状態の名前で引用ではない。basis の名前は 15 件とも一次の題名にある。
- **CC の目での確かめ**: 15 件の名前・所在地・諸元・出典・本文を読んだ。「同じ設備と言えない」「1 件の蓄電所と言える」ものは無かった。

## (2) PATCH の旧 → 新と GET 照合

dry run（11:46〜）: PATCH 4・中止 0・失敗 0・生の文字列の突き合わせ 不一致 0 → **本実行（11:47:19〜11:47:30）**: PATCH 4 件・**各件 GET で送信の欄が一致・ほかの欄の変化 0**（#106／#122）→ 再実行の dry run: **skip 4**。送った本文 4 本は、GET の値と生の文字列も画面の文字も同じ（richEditor の正規化の差 0）。

| | slug（id） | 変えた欄 |
|---|---|---|
| V1 | `pr-co161802-bess-4`（w25p39fcn） | name「日本蓄電池」→「NC春日井西尾蓄電所（日本蓄電池）」／prefecture 空 →「愛知県」／city（発表の題名の切れ端）→「春日井市西尾町」／cod 2025-10-14 → 2025-05-07／epc 空 →「株式会社サンヴィレッジ」／市場 空 →［需給調整市場］／sourceUrl 会社のトップページ → PR TIMES 000000008.000161802／body 全文 |
| V2 | `nanahongi-bess`（h041mltp4wga） | name →「七本木蓄電所（日本蓄電開発機構）」／operator →「日本蓄電開発機構株式会社」／status 空 →［稼働中］／outputMw 空 → 2／cod 2026-03-31 → 2026-06-16／city →「児玉郡上里町」／epc 空 →「イー・トップ株式会社」／市場 空 →［需給調整市場］／sourceUrl 空 → PR TIMES 000000007.000173175／body（今は空）→ 全文 |
| V3 | `kaminara-bess`（xe565pnilk3g） | name →「上奈良蓄電所（日本蓄電開発機構）」／operator →「日本蓄電開発機構株式会社」／outputMw 空 → 2／cod 2026-03-27 → 2026-06-16／city →「熊谷市上奈良」／epc 空 →「イー・トップ株式会社」／市場 空 →［需給調整市場］／sourceUrl 空 → PR TIMES 000000006.000173175／body（今は空）→ 全文 |
| V4 | `pr-co175281-shizuoka`（4o_e0xsi_3h） | name →「牧之原蓄電所（ブルースカイエナジー）」／市場 空 →［需給調整市場］／body 全文 |

## (3) 301 の 6 行・外した 4 行・リンク

- `src/lib/projects-301.ts` に 25〜30（`pr-co86244-bess`・`sunvillage-chubu` → `pr-co161802-bess-4`／`pr-co173175-saitama-5mwh-2` → `nanahongi-bess`／`pr-co169829-bess` → `kaminara-bess`／`pr-co61878-bess` → `js-tamana-nagasu-bess`／`pr-japan-bess` → `pr-co175281-shizuoka`）。コメントに根拠の逐語と統合先の理由（19〜24 番と同じ書き方）。
- `src/lib/projects-excluded.ts` に (A-6) として 4 件（`pr-co168657-bess`・`pr-co154894-bess`・`pr-co86244-bess-4`・`pr-co55631-bess`）。コメントに型・一次の逐語・日付。
- `verify:no-301-links:static`: 宛先が 301 元／表示除外 0（連鎖 0・noindex 着地 0）。build の後の全軸: 一覧・sitemap・用語集・トップ 0・**All checks passed**。
- **ほかの面のリンク**（build した HTML を全部走査・scratchpad の `scan_links.py`）: 今日の 10 件へのリンクは **0**（前便で一覧・用語集・関連カード・`/tracker/pf`・ランキングが同じ判定を通すようになったため、コードの張り替えは要らなかった）。残る 2 本（`operators/mitsuuroko-gr-hd`・`operators/otentosan` の本文）は前便からのもので、今日の 10 件ではない。microCMS の本文は書き換えていない。

## (4) 訂正履歴・台帳

- `src/data/corrections.json` に **15 件**（`20261122-01`〜`15`・date 2026-11-22・519 → 534 件）: 表示の停止 10（A 6・B 4）・訂正 5（統合先 4・`/projects` 1）。文は計画のとおり（`key`・`part`・`numbers` は入れていない）。`/projects` の 1 件の数字は、実行の直前の本番（304・3,124.5・9,403.5）と、build した HTML の値（294・3,112.5・9,304.6）。
- 資料名の台帳 `src/data/source-documents.json` に **18 件**（473 → 491）。名前は取り直したページの題名（`title_verbatim`）から。`verify:source-names:src` ok。

## (5) デプロイ・本番の確認

Vercel: `13a5356` success 2026-11-22 12:18:55 JST（push 12:12:15）。素の URL を curl（ブラウザの UA なし・キャッシュ回避ヘッダなし）で、12:19:06〜12:20:21 に 31 本、12:20:46〜12:20:55 に 6 本をもう一度。1 回目は PRERENDER／MISS・age 0、2 回目は HIT・age 36〜86（301 は cache の印なし）。

- **転送**: 301 元 6 本が 301・Location が統合先（`pr-co86244-bess`・`sunvillage-chubu` → `pr-co161802-bess-4`／`pr-co173175-saitama-5mwh-2` → `nanahongi-bess`／`pr-co169829-bess` → `kaminara-bess`／`pr-co61878-bess` → `js-tamana-nagasu-bess`／`pr-japan-bess` → `pr-co175281-shizuoka`）。統合先 5 本は 200・`index, follow`。
- **外した 4 本**（B）: 200・`noindex, follow`（4 本とも）。
- **`/projects`**（PRERENDER age 0 → HIT age 63）: 掲載 **304 → 294**・合計出力 **3,124.5 → 3,112.5 MW**（274 → 269 件分）・合計容量 **9,403.5 → 9,304.6 MWh**（258 → 250 件分）・稼働中 151／建設中 47／計画中 80／その他 16・調査中 18＝**計画の `expected.after_AB` と同じ**（ビルドの HTML に載った値を 10 進で足すと 3,112.4800・9,304.6114）。301 元・外した件は一覧に無い。「NC春日井西尾蓄電所（日本蓄電池）」「七本木蓄電所（日本蓄電開発機構）」「上奈良蓄電所（日本蓄電開発機構）」「牧之原蓄電所（ブルースカイエナジー）」がある。七本木は「稼働中」の表。title・description・h1 は前と同じ。
- **統合先 4 ページ**: 表の値（所在地・事業者・EPC・運転開始・市場・出典）が計画の新しい値・本文の要点がある・「訂正履歴を見る」がある（`js-tamana-nagasu-bess` は PATCH も訂正も無いので無い）。
- **`/corrections`**: 519 → **534 件**（15 件増）。
- **sitemap**: `<loc>` 12,610 → 12,600。減ったのは 301 元 6 本と外した 4 本の 10 本だけ、増えた URL は 0。統合先 5 本はある。
- **事業者のページ**（`operators-detail-index.json` の前後。本番のページのリンクの増減も同じ）:

| 事業者 | 保有・開発の案件 | 関与する案件 |
|---|---|---|
| 日本蓄電開発機構（`pr-co173175`） | −上里町（301 元）・**＋七本木・＋上奈良** | 変化なし |
| HOBE ENERGY（`pr-hobeenergy`） | −七本木・−上奈良・−次世代蓄電池（301 元） | **＋七本木・＋上奈良（機器供給）** |
| サンヴィレッジ（`agg-03001791`） | −春日井西尾の 2 本（301 元）・−キャピタルエナジーとの提携（外した件） | ＋春日井西尾（EPC・施工） |
| 日本蓄電池（`nipponchikuden`） | 変化なし（春日井西尾は統合先のまま） | 変化なし |
| デジタルグリッド（`agg-01187063`） | 変化なし | ＋春日井西尾（運用・最適化） |
| JFEエンジニアリング（`jfe-engineering`） | −「当社初となる…」（301 元） | 変化なし |
| ブルースカイエナジー（`jepco-pg-bess`） | −「系統用蓄電池（ブルースカイエナジー）」（301 元） | 変化なし |
| Shizen Connect（`shizen-connect`） | −ヒューリックの束ね（外した件） | 変化なし |
| RSアセットアドバイザーズ（`agg-rs-9244`） | −合計40MWh（外した件） | 変化なし |
| しろくま電力（`agg-01030733`） | −全国10カ所（外した件） | 変化なし |
| イー・トップ | 事業者のページは無い（EPC の欄に文字で入るだけ） | — |

- **事業者ランキング**（`/industry/top50`・集計 304 → 294 件・161 → 158 社。本番の表と `operator-ranking.json` の前後が同じ）: サンヴィレッジ 28 → **32 位**（64 → 48 MWh・16 → 12 MW・9 → 6 件・4 → 3 県）／ブルースカイエナジー 33 → **38 位**（48.4 → 40.4 MWh・12 → 10 MW・6 → 5 件）／RSアセットアドバイザーズ 34 位 → **表の外**／日本蓄電池は 14 位のまま（22 件・県が 12 → 13）／29〜49 位の行は 1〜2 つ上がる／50 位に JMES BESS ONE が入る。日本蓄電開発機構・HOBE ENERGY・Shizen Connect・イー・トップ・デジタルグリッドは、前後とも上位 50 の表に出ていない。しろくま電力は「容量のある案件が無い」の欄で 2 → 1 件。
- **変電所のページ**: `/grid/tpg-0471`（埼玉県）「埼玉県の蓄電所案件 13件 → **11件**」。title・meta description・h1 は前と同じ（`/grid/prefecture/埼玉県` の 3 つも同じ）。`projects-pref-count.json` の差は埼玉県の 13 → 11 だけ（春日井西尾に県が入った愛知県は、`sunvillage-chubu` が減って差し引き 0）。

## (6) IndexNow

`reports/projects-cleanup2-A-2026-11-22.indexnow-urls.txt` の 7 URL（統合先 4・`/projects`・`/corrections`・`/industry/top50`）。dry run → `--apply`（12:20:45 頃）→ **1〜7 件目 HTTP 200（受理）**。301 元・外した件は送っていない。記録 `reports/projects-cleanup2-A-2026-11-22.indexnow.json`。

## (7) 申告・一時物・気づき

- 停止条件の操作 0。一時物は scratchpad（`C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\pc1122\`）にだけ作った（一次の取得 `primA\`・本番の前後 `before\`・`afterA\`・`check_ev2.py`・`prod_a.py`・ビルドのログなど）。消していない。
- **この報告の最初の commit（`9954bd8`）は、(5)〜(7) が書きかけのままだった**（書き足しの手順が失敗したのに、続けて commit と push をした）。commit の文の数字は本番で確かめた値で、この版で (5)〜(7) を埋めた。
- 作業の途中で、環境変数を読み込まないまま `npm run build` を誤って 1 回起動し、すぐに止めた（prebuild の最初で `MICROCMS env required` で終わっていた・残っているプロセスなし）。
- `scripts/build-projects-2026-11-22.ts`・`apply-projects-2026-11-22.ts` は、次の便（名前の直し・`--part=B`／`--plan=`）でも使う。
- 外した X1・X3 の詳細ページには、発表の配信日が「運転開始予定」として残る（X1 2026-04-15・X3 2025-02-04。便 §3 のとおり直していない・noindex）。
- `src/lib/projects-301.ts` の冒頭のコメント「2 上奈良蓄電所 → kaminara-bess（HOBE ENERGY・5MWh）」は、直した後の事業者名と食い違う。コメントだけなので、便の範囲（301 と除外の行だけ）で変えていない。
- 長洲町の運転開始の欄・七本木と上奈良の容量・`sunvillage-chubu` の市場の欄と本文の運用の記述は、便 §4-6 のとおり触っていない。
- ほかに見つけた重複や束ねの候補: 今日読んだ 15 件の中には無かった。
