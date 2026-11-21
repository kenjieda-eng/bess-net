# projects の合計を正す便（2026-11-21）— A: 同じ設備の重複 6 組を 301 で統合／B: 複数の蓄電所を合わせた計画 4 件を一覧から外す

microCMS `projects` の **PATCH 7 件（23 op）**・POST／DELETE／PUT 0。コード（301 の 6 行・除外の 4 行・訂正履歴 16 件・台帳 15 件）と、一覧から外したものを他の面からも外す修正。

## (0) 実行の記録

| 項目 | 値 |
|---|---|
| 便 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\projects便_合計を正す_重複6組の統合（301）・計画4件を一覧から外す・PATCH7件・訂正履歴16件_Claude_Code投入_2026-11-21起草_ユウ.md`（19,682 バイト） |
| 計画 | 同フォルダの `projects-plan-2026-11-21_合計を正す_重複6組の統合と計画4件の除外_一次照合済み_ユウ.json`（71,038 バイト・sha256 `217c4563156a8a63e9c34fc41b4a11dd156389e1d768ccbc0d4f44744aea21b9`＝便の先頭 16 桁と一致）。リポに `reports/projects-plan-2026-11-21_ユウ.json` として写した |
| 開始 | 2026-11-21 17:21 JST・HEAD `3bcffc4` |
| `_QUEUE.md` | 129 行（GO: ユウ 11/21 17:18・EDAさん 17:18「AとBで任せm洲」＝「A と B で任せます」）→ **A と B を両方入れた** |
| 道具 | 計画を書込の形にする `scripts/build-projects-totals-2026-11-21.ts`（GET だけ）→ applier `scripts/apply-projects-2026-11-21.ts`（`runApplier`・既定 dry run）。書込の計画 `reports/projects-totals-fix-2026-11-21.json`・記録 `.dry.json`／`.apply.json`／`.dry2.json` |
| commit | `63b4b72`（データ・コード・訂正履歴・台帳・計画と記録）・`3f14af0`（事業者ランキングの集合を /projects とそろえる）・報告は別の commit |
| 停止条件 | rm 系 0・push --force 0・.env 表示 0（読み込みのみ）・microCMS は PATCH 7 と GET だけ（DELETE・PUT 0）・webhook は止めていない |

## (1) GET と今の値の照合・一次 17 本の照合

- **本番 `/projects` の今の数字**（17:21:48・素の URL・HIT・age 343）: 掲載 **314**・合計出力 **3,578.943 MW（283 件分）**・合計容量 **12,872.379 MWh（267 件分）**・建設中 49／計画中 88／その他 17・調査中 22＝計画の `expected.before` と同じ。
- **16 件の GET**（17:2x・slug ごと・GET 16）: 計画の `from_now`・`to_now`・`now` と **違う欄 0**。PATCH の `old` **23/23 一致**・`keep` **48/48 一致**（書込の直前にもう一度 GET して確かめた＝`build-projects-totals-2026-11-21.ts`・GET 14）。
- **一次 17 本**を素の curl で取り直した（17:22:40〜・1 本ずつ・1.5 秒あけ・ブラウザのふりをする UA なし）。17 本とも HTTP 200。
  - バイト数・sha256 が計画と同じ: 日経BP 2 本・出光興産の PDF・レノバ・ユーラス・JFE（6 本）。PR TIMES の 9 本と丸紅はページの動く部分で sha256 が違い、東急（248,833／計画 248,835）と丸紅（67,454／67,442）はバイト数も少し違う。照らした語は全部ある（下）ので、改訂の影響なし。
- **照合**（scratchpad の `check_ev.py`・NFKC・空白を除く・月日の先頭の 0 を除く・「YYYY/MM/DD」も年月日に直して見る・PDF は pdfplumber で文字に）:
  - 計画の `ev` **101 本**: 合わない **0**。
  - V1〜V3 の新しい本文: 「」の引用（7・10・11）と数字・日付（4・11・5）が一次に全部ある。
  - 訂正履歴 16 件の「」の引用: 一次か当サイトの今のレコードに全部ある（「計画中」の 2 つは当サイトの新しい状態の名前で、引用ではない）。basis の名前は 16 件とも一次の題名にある。
  - V4（`sparx-sapporo-351`）: GET した本文の末尾が計画の `seen` と同じ形（`<h2 id="h1b9eb7c3a9">出典</h2>` と PR TIMES 000004339.000032407 の 1 行）で、そのリンクは塊の中の 2 回（href と文字）だけ。
- 「同じ設備と言えない」「1 件の蓄電所と言える」ものは見つからなかった。

## (2) PATCH の旧 → 新と GET 照合

dry run（17:25:35）: PATCH 7・中止 0・失敗 0・生の文字列の突き合わせ 不一致 0 → **本実行（17:25:49〜17:26:06）**: PATCH 7 件・**各件 GET で送信の欄が一致・ほかの欄の変化 0**（#106／#122）→ 再実行の dry run: **skip 7**（最終状態と一致）。

| | slug（id） | 変えた欄 |
|---|---|---|
| V1 | `tagawa-130mwh`（xxc-c210cur） | name「田川市・川宮蓄電所（130MWh）」→「田川蓄電所（ヘキサ・エネルギーサービス）」／capacityMwh 130 → 130.39／epc 空 →「しろくま電力株式会社」／sourceUrl 日経BP → PR TIMES 000000001.000173123／body 全文（539 → 600 字） |
| V2 | `renova-himeji`（ts42w9orf） | name「姫路蓄電所（レノバ）」→「姫路蓄電所（出光興産・レノバ他）」／operator「レノバ」→「合同会社姫路蓄電所（出光興産・レノバ・長瀬産業・SMFLみらいパートナーズ）」／cod「2025年10月」→ 2025-10-10／sourceUrl レノバのページ → 出光興産 251010.pdf／body 全文（596 → 864 字） |
| V3 | `eurus-tagawa-4`（79l9pdf84t_9） | operator「ユーラスエナジー」→「株式会社ユーラスエナジーホールディングス」／cod 空 → 2024-01-17／epc 空 →「株式会社ダイヘン」／sourceUrl 日経BP → ユーラスの発表／body 全文（501 → 696 字） |
| V4 | `sparx-sapporo-351`（u1ulndgu3t） | body の末尾の「出典」の見出しと PR TIMES 000004339.000032407 の 1 行だけを外した（895 → 663 字・ほかは不変） |
| V5 | `jfe-tc-memuro`（1wf8z6r9z） | capacityMwh 79 → 78.97／operator「東京センチュリー・JFEエンジニアリング」→「J&TC北芽室蓄電合同会社（東京センチュリー・JFEエンジニアリング）」 |
| V6 | `pr-co10686-tokyo`（vzllm0p-b） | status［稼働中］→［計画中］／cod 2026-04-08 → 空／prefecture「東京都」→ 空（prefecture は文字の欄で、空にできた＝GET で null） |
| V7 | `pr-co72482-miyagi-264mwh`（ejgkpix1ntf） | status［建設中］→［計画中］／cod 2026-02-26 → 空 |

- V1〜V3 の本文で、GET の字面が送信と違う所は無かった（richEditor の正規化の差は照合の上で吸収・画面の文字は同じ）。

## (3) 301 の 6 行・外した 4 行・リンク

- `src/lib/projects-301.ts` に 19〜24（`pr-co164154-bess` → `sparx-sapporo-351`／`pr-co173123-fukuoka` → `tagawa-130mwh`／`idemitsu-hyogo` → `renova-himeji`／`pr-co135262-bess` → `eurus-tagawa-4`／`pr-co96742-mie` → `pr-co160356-bess`／`pr-co76147-hokkaido` → `jfe-tc-memuro`）。コメントに根拠の逐語と統合先の理由（12〜18 番と同じ書き方）。
- `src/lib/projects-excluded.ts` に (A-5) として 4 件（`pr-co10686-tokyo`・`marubeni-2400mwh`・`pr-co110152-bess`・`pr-co72482-miyagi-264mwh`）。コメントに一次の逐語と日付。
- build の後の `verify:no-301-links`: 一覧・sitemap 0・**All checks passed**。
- **ほかの面に残っていたリンク**（build した HTML を走査・scratchpad の `scan_links.py`）: 今日の 10 件へのリンクが、用語集の「関連の蓄電所プロジェクト」8・ニュースの関連カード（と構造化データ）7・`/tracker/pf` 2・事業者の本文 1 に残っていた。調べると、この 3 つの面（用語集の関連プロジェクト・自動リンクと関連カードの宛先＝`getLinkableTargets`・`/tracker/pf`）は、**前からの 301 元・除外も含めて**一覧の判定を通していなかった（用語集 48 ページ・ニュース 76 ページ・解説 2 ページ・トラッカー 1 ページ、計 140 本ほど）。
  - 3 つの面に、一覧・sitemap・近隣カードと同じ判定 `isListExcludedProject` を足した（`scripts/precompute-glossary-detail.ts`・`src/lib/microcms.ts` の `getLinkableTargets`・`src/app/tracker/pf/page.tsx`）。**301 元の名前を統合先へ張り替えずに外した**のは、関連カードが同じ slug の最長の名前を出すため（301 元の PR 題名の名前が統合先のカードに出てしまう）。統合先は、自分の名前が本文にあれば今までどおり出る。
  - 直した後の走査: 残るのは **事業者の本文（microCMS）の 2 本だけ**（`operators/otentosan` の出典の「当サイト: …/projects/pr-co72482-miyagi-264mwh」＝今日の分・`operators/mitsuuroko-gr-hd` の `pr-co70816-bess-3`＝前から）。便のとおり、microCMS の本文は書き換えていない。
  - `/tracker/pf` の「全 N 件」は 419 → **304**（/projects の掲載件数と同じ集合）。
- **事業者ランキング**（`scripts/precompute-operator-ranking.ts`）も、419 件すべてを数えていた（9/25 から一覧の外の丸紅新電力他 2,400MWh が 1 位・マーチャントバンカーズ 800MWh が 3 位）。訂正履歴 20261121-16 の文（「同じデータから作る事業者ランキング・…も、これに合わせて変わりました」）に合わせ、同じ判定で除いた（集計 419 → 304 件・commit `3f14af0`）。

## (4) 訂正履歴・台帳

- `src/data/corrections.json` に **16 件**（`20261121-01`〜`16`・date 2026-11-21・500 → 519 件〔11/18 の 3 件を含む〕）: 表示の停止 10（A 6・B 4）・訂正 5（V1・V2・V3・V4・V5）・`/projects` 1。文は計画のとおり（`key`・`part`・`only_if`・`basis_note` は入れていない）。V4 は書いたので入れた（basis 0 本・before に「出典」・after に「見当たら」）。
  - `/projects` の 1 件の数字は、実行の直前の本番（314・3,578.943・12,872.379）と、build した HTML の値（304・3,124.478・9,403.459）で確かめた。本番の値は (5)。
  - `/projects` は記事末を持たない一覧のページなので、`scripts/verify-corrections.ts` の一覧のページの集合に `/projects` を足した。
  - internalRef の書き方を、検査が報告のパスを読める形（`reports/projects-totals-fix-2026-11-21.md （計画 …）`）にした。
- 資料名の台帳 `src/data/source-documents.json` に **15 件**（訂正履歴の basis と本文に出る一次のうち台帳に無かったもの。title は取り直したページの `<title>`・PDF は本文の見出し）。458 → 473 件。A54（ADW 000000054）は前からある。

## (5) デプロイ・本番の確認（素の URL・クエリなし・1 本ずつ）

- `63b4b72` → Vercel success 18:19:39 JST・`3f14af0` → success 18:26:24 JST。確かめは 18:26:29〜18:28 JST（`3f14af0` の後）。

| URL | HTTP | x-vercel-cache | age | 見たもの |
|---|---|---|---|---|
| 301 元 6 本（`/projects/pr-co164154-bess` ほか） | **301** ×6 | — | — | Location がそれぞれ統合先（`sparx-sapporo-351`・`tagawa-130mwh`・`renova-himeji`・`eurus-tagawa-4`・`pr-co160356-bess`・`jfe-tc-memuro`） |
| 統合先 6 本 | 200 ×6 | PRERENDER | 0 | robots `index, follow`・題名が新しい名前（田川蓄電所（ヘキサ・エネルギーサービス）・姫路蓄電所（出光興産・レノバ他））・「訂正履歴」あり。V1〜V5 の新しい値（名前・容量 130.39／78.97・事業者・運転開始 2025-10-10／2024-01-17・EPC・出典）と本文の書き出しが初期 DOM にある。`sparx-sapporo-351` の本文に PR TIMES 000004339.000032407 のリンク 0・「出典」の見出し 0（表の「出典」の欄は関西電力の PDF のまま） |
| 外した 4 本 | 200 ×4 | PRERENDER | 0 | robots `noindex, follow`・状態「計画中」（V6・V7 で直した 2 本と、もとから計画中の 2 本） |
| `/projects` | 200 | PRERENDER | 0 | **掲載 304・合計出力 3,124.478 MW（274 件分）・合計容量 9,403.459 MWh（258 件分）・稼働中 155／建設中 47／計画中 85／その他 17・調査中 20**＝計画の `expected.after_AB` と同じ。301 元と外した件の名前 0・新しい名前 2 つあり |
| `/corrections` | 200 | PRERENDER | 0 | 519 件（503＋16）・16 件の中身の語がある |
| `/sitemap.xml` | 200 | PRERENDER→HIT | 0→14 | `<loc>` 12,620 → **12,610**・`/projects/` 314 → **304**・301 元と外した件 0 |
| `/tracker/pf` | 200 | PRERENDER | 0 | 「全 304 件」（前 419） |

**事業者ランキング `/industry/top50`**（前 17:22・HIT・age 33,564 → 後 18:27・PRERENDER・age 0。順位・総容量 MWh・総出力 MW・件数・都道府県数）:

| 事業者 | 前 | 後 |
|---|---|---|
| 丸紅新電力他 | 1 位・2,400・—・1・1 | 外れた（B） |
| レノバ | 2 位・1,178・320・5・3 | **1 位**・1,130・305・4・2（姫路の事業者を合同会社姫路蓄電所に直した分） |
| 東京センチュリー株式会社 | 5 位・529.3・338・9・4 | 3 位・450.3・117・5・3（9/25 から一覧の外の束ね・告知のレコードを数えなくなった分） |
| ヘキサ・エネルギーサービス合同会社 | 6 位・472.4・163.6・6・4 | 7 位・342.4・133.7・5・4（田川の重複 1 件分） |
| SUNGROW JAPAN | 10 位・351・100・1・0 | 外れた（札幌の重複＝301 元） |
| 株式会社おてんとさん | 14 位・264・66・1・1 | 外れた（B） |
| 東急 | 19 位・184・46・1・1 | 外れた（B） |
| 東京センチュリー・JFEエンジニアリング | 30 位・79・20・1・1 | 名前が「J&TC北芽室蓄電合同会社（東京センチュリー・JFEエンジニアリング）」で 23 位・79・20・1・1 |
| 出光興産・レノバ・長瀬産業・SMFLみらいパートナーズ | 42 位・48・15・1・1 | 外れた（姫路の重複＝301 元）。「合同会社姫路蓄電所（出光興産・レノバ・長瀬産業・SMFLみらいパートナーズ）」が 35 位・48・15・1・1 |
| IBeeT（リブラ） | 50 位の中に無い | 変化なし（外した 174MW は容量が調査中で、もとから順位に無い） |
| サステナブルホールディングス | 50 位の中に無い | 変化なし |
| ユーラスエナジー | 50 位の中に無い | 変化なし |

- 東京センチュリーの 529.3 → 450.3 は、今日の 2 件（芽室の 301 元）だけでなく、9/25 から一覧の外にあった束ね（`pr-co76147-bess-2` など）を数えなくなった分を含む（ランキングの集合を /projects にそろえた結果）。

**変電所のページ**（前 17:22 → 後 18:27・県ごと 1 本）: title・meta description・h1 は **6 本とも前と同じ**。本文の「◯◯県の蓄電所案件 N件」だけが変わった（計画の `prefCount` のとおり）:

| ページ | 前 → 後 |
|---|---|
| `/grid/kyu-100`（浮羽・福岡県） | 20 → **19** |
| `/grid/ksi-kikan-ca`（西宮・兵庫県） | 11 → **10** |
| `/grid/cb-3601`（西名古屋(1)・三重県） | 9 → **8** |
| `/grid/hkd-main-0001`（幌延・北海道） | 22 → **21** |
| `/grid/tpg-0779`（戸田・東京都） | 3 → **2** |
| `/grid/thk-miyagi-0401`（宮城・宮城県） | 11 → **10** |

## (6) IndexNow

`reports/projects-totals-fix-2026-11-21.indexnow-urls.txt`（統合先 6・`/projects`・`/corrections`・`/industry/top50`＝9 URL。301 元・外した件は送らない）。dry run（9 件・鍵のファイル 200 一致）→ `--apply --log=reports/projects-totals-fix-2026-11-21.indexnow.json`: 18:27 JST・**HTTP 200（受理）**・9 件。鍵は先頭 4 文字 `605d` だけを書く。`/tracker/pf`・リンクの外れた用語集とニュースのページは送っていない。

## (7) 申告・一時物・気づき

- 停止条件に当たる操作なし（rm 系・push --force・.env の表示・microCMS の DELETE／PUT いずれも 0）。
- **便の書き方より広く変えたところ**（どれも一覧・sitemap と同じ判定 `isListExcludedProject` を足しただけ）:
  - 用語集の関連プロジェクト・自動リンクと関連カードの宛先・`/tracker/pf` から、一覧の外のもの（今日の 10 件と前からの 301 元・除外）を外した。便は「コードから出ているものは統合先へ張り替える」。張り替えでなく外したのは (3) の理由。前からの分（140 本ほど）も一緒に外れた。
  - 事業者ランキングの集合を /projects とそろえた（419 → 304 件）。1 位が丸紅新電力他（一覧の外の合意の発表）からレノバに替わった。訂正履歴 20261121-16 の文に合わせたもの。
- **microCMS の本文の中に残るリンク**（書き換えていない）: `operators/otentosan` の本文の出典「当サイト: https://bess-net.jp/projects/pr-co72482-miyagi-264mwh」（今日外した件・詳細ページは noindex で 200）・`operators/mitsuuroko-gr-hd` の `pr-co70816-bess-3`（前からの 301 元）。
- 一時物はすべて scratchpad（リポの外）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\pj1121\`（`before\`・`after\`・`after2\` の取得物・`prim\`〔一次 17 本〕・`recs_before.json`・`check_ev.py`・`snap.py`・`scan_links.py`・`scan_links.ts`〔書き方の誤りで動かなかった・残した〕・`top50.py`・`prod_after.py`・`prod_after.json`・`operator-ranking.local-before.json`・`srcdocs_head.json`・`build\`）。消していない。
- 台帳の used_in の id を後から入れる 1 回目の書換えは、同じ文字列が複数あって書かずに止めた。HEAD の台帳から作り直した（中身は上のとおり）。
- commit は名前を指定して入れた。
- 気づき: 便 §4-5 の「この便では触らない候補」（香春町／田川〔NTTアノードエナジーほか〕・上田市古里・日進LRD／富士宮・南阿蘇・筑後・しろくま電力 10 カ所・遠野）はそのまま。ランキングの集合をそろえたことで、上位に残る複数サイトの束ねが無いか（例: 東京センチュリーの 5 件）は、掃除の調べ便で一緒に見るとよい。
