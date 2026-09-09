# Pj2-G 追修便 裁定返し 完了報告 — 2026-09-09

前便: `reports/projects-pj2g2-2026-09-08.md`（§8 要裁定3件）／裁定: 本便依頼書（ユウ 2026-09-09）
**大原則どおり、3行とも PATCH 直前に一次を再取得して逐語を取り直した**（`scripts/patch-projects-pj2g3-2026-09-09.ts` の PRIMARY に組込み。食い違えば書かずに退避する設計・退避 0）。
POST/DELETE/PUT なし。書込は指定 field のみ。HTTP は microCMS（GET/PATCH）・PR TIMES/九州電力（GET）のみ。

## 1. 実行サマリ

| # | slug | 送信 field | 一次再取得 | #106 | 冪等再走 |
|---|---|---|---|---|---|
| 1 | `kyuden-omuta-reuse` | body（§2「EV由来電池」→「リユース電池」1箇所） | 九州電力 2022-08-05 プレス: EV=0・電気自動車=0・電動フォークリフト=1 | ✓ 1 field・他変化 0 | skip（marker あり・置換元なし） |
| 2 | `pr-co140317-bess` | outputMw 0→**null**・cod "2025-10-14"→**null** | PR034: datePublished=2025-10-14 17:59:21／運転開始・稼働・竣工・運用開始・営業運転・出力・kW すべて 0／逐語「…約8.2MWh…計画しています」あり | ✓ 2 field・他変化 0 | skip（同値） |
| 3 | `pr-co69153-ibaraki-3` | capacityMwh 4.887→**4.8876** | PR000000004／000000006 とも逐語「システム構成は1927.2kW出力の4887.6kWh（2時間システム）となっており」あり | ✓ 1 field・他変化 0 | skip（同値） |

**実行 3 / 冪等スキップ 3（再走）/ 失敗 0 / 一次不一致 0。**
※ kyuden.co.jp は Node fetch の既定ヘッダに 403 を返す（curl -A では 200）。スクリプトは fetch 失敗時に curl へフォールバックし、取得失敗も「逐語を取り直せていない」として書かない扱いにした。

## 2. before / after（実測・GET 全件）

| 指標 | before | after | 差分 | 内訳 |
|---|---|---|---|---|
| 総件数 | 332 | 332 | ±0 | — |
| 掲載件数 | 241 | **241** | ±0 | — |
| 掲載合計 outputMw | 3,346.151 | **3,346.151** | ±0 | 140317 の 0→null は合計に寄与しない |
| 掲載合計 capacityMwh | 11,378.674 | **11,378.6746** | **+0.0006** | ibaraki-3 4.887→4.8876（裁定予測と一致） |
| 掲載の「調査中」（outputMw===0 ‖ capacityMwh===0） | 39 | **38** | −1 | 140317 が 0→null で調査中の定義から外れる |
| 運開予定超過（maintenance.overdue） | 55 | **54** | −1 | 140317（cod=配信日 < 今日・計画中 の偽陽性が解消） |

## 3. 各項目の詳細

### 3-1. kyuden-omuta-reuse §2（承認どおり 4文字・当該1文のみ）

- before: 「**EV由来電池**の系統用二次利用は、電池ライフサイクル価値最大化のモデルケースで、住友商事・日産のフォーアールエナジー千歳蓄電所と並ぶ国内サーキュラーエコノミー先行事例の一つです。」
- after: 「**リユース電池**の系統用二次利用は、…（以下同文）」
- 一意性: 置換元「EV由来電池」は body 全文で 1 箇所（一意）。marker（#122）=「リユース電池の系統用二次利用」（§3 の既存「リユース電池ならではの」とは衝突しない）。
- 保存後 GET: marker あり・「EV由来電池」なし・**送信値と全文一致 true**（この body は見出し・リンクを含まないため richEditor 正規化が起きなかった）。
- **依頼の付帯確認（body 全体で「EV」「電気自動車」が大牟田自身を指す箇所が他に残っていないか）**: 置換後 body 全文 621 字を走査 → **EV=0・電気自動車=0**。残存なし（報告のみ・追加の書込なし）。「リユース電池」は body 内 1→2（name・operator フィールドにも各1あり、ページとしては 4）。
- §1（電動フォークリフト由来）と §2 の矛盾は解消。本番確認は §7。

### 3-2. pr-co140317-bess（outputMw / cod の null 化）

**「null 化で表示が後退しないこと」の事前確認（実行前・コード読み）** — 後退ではないと判定して実行:

| 箇所 | 0 / "2025-10-14"（before） | null（after） | 判定 |
|---|---|---|---|
| /projects 一覧 出力セル | 「調査中」（斜体・muted） | 「—」 | 既存 null レコード（kaminara-bess・nanahongi-bess ほか outputMw null 4件）と同じ表現 |
| 一覧 並び順 | 計画中グループ末尾の「調査中」群 | 計画中グループの通常群（二次キー outputMw `?? 0` で末尾寄り） | 掲載は維持 |
| 一覧ヘッダ「調査中 n 件」 | 39 | 38 | 定義（===0）どおり |
| 詳細 バッジ | 「出力 調査中」＋「容量 8.2 MWh」 | 「容量 8.2 MWh」のみ | 容量は維持。未記載の出力に「調査中」バッジを出さなくなる |
| 詳細 「調査中」注記セクション | 表示 | 非表示（capacityMwh 8.2 ≠ 0） | 一次に出力の記載が無い＝調査で埋まる値ではないため妥当 |
| 詳細 「運転開始予定」行 | 「2025-10-14」 | 行ごと消滅（`{item.cod && …}`） | 依頼の意図どおり |
| 詳細 本文第1段落（reconstructProjectBody） | 「ステータス：計画中（発表日：2025-10-14）。」 | 「ステータス：計画中。」 | テンプレ分岐（status のみ）で壊れない |
| meta description | 「出力調査中・容量8.2MWh」 | 「出力—MW・容量8.2MWh」 | 既存 null レコードと同形（「—MW」表記は既存仕様。別途の見直し候補として §8 に記載） |
| JSON-LD additionalProperty | outputMw なし（0 は省略） | outputMw なし | 不変 |
| /grid/[slug] 県内案件メタ | 「0MW / 8.2MWh」（`!= null` 判定のため 0 が出ていた） | 「8.2MWh」 | **改善**（0MW の誤表示が消える） |
| maintenance.overdue | 該当（cod 2025-10-14 < 今日・計画中） | 非該当 | **偽陽性の解消** |
| HTTP | 200・掲載 | 200・掲載 | 不変 |

- 一次再取得（PR034）: datePublished=2025-10-14 17:59:21（可視「2025年10月14日 17時59分」）。本文 1,531 字に「運転開始」「稼働」「竣工」「運用開始」「営業運転」「出力」「kW」いずれも 0 件。逐語「和歌山県和歌山市松江に設備容量約8.2MWhの系統用蓄電所を建設・運営する事業を計画しています。」あり。
- PATCH `{outputMw: null, cod: null}` → GET: outputMw=null・cod=null（fields 指定 GET ではキーあり null）。status「計画中」・capacityMwh 8.2・name・city・operator・sourceUrl ほか他フィールド変化 0。

### 3-3. pr-co69153-ibaraki-3（capacityMwh 4.887 → 4.8876）

- 一次逐語（PR000000004・2025-03-12／PR000000006・2025-07-09 とも同文）: 「システム構成は1927.2kW出力の4887.6kWh（2時間システム）となっており、407.3kWhの蓄電ユニットを12台使用しています。」
- 換算元 **4,887.6 kWh** → 4.8876 MWh（÷1000・精度損失なし）。現値 4.887 は切り捨て。
- 掲載合計 capacityMwh は 11,378.674 → 11,378.6746（+0.0006）で裁定の想定と実測一致。
- outputMw 1.927（一次 1927.2kW＝1.9272MW の丸め）は本便の対象外のため触っていない（§8）。

## 4. 【読取のみ】Pj2-H 規模見積り（4(a)・4(b)）

ダンプは本便 PATCH **前**の全件 GET（332件・2026-09-09 10:43）。区分は `LIST_EXCLUDED_PROJECT_SLUGS`（EXCLUDED 43＋301元 42＝一覧に出ない）で分けた。

### 4(a) outputMw=0 または capacityMwh=0 — **124 件**（掲載 39・301元 42・EXCLUDED 43）

| | 両方0 | outputMw のみ0 | capacityMwh のみ0 | 計 |
|---|---|---|---|---|
| 全件 | 92 | 14 | 18 | **124** |
| うち掲載（一覧に出る） | 20 | 9 | 10 | **39** |

掲載 39 の status: 計画中 25・稼働中 12・建設中 2。

- 掲載・両方0（20）: mikimori-hachioji-bess mikimori-ise-bess mikimori-kakogawa-bess mikimori-kamimashiki-bess mikimori-katta-bess mikimori-kuma-bess mikimori-nishimorokata-bess mikimori-otawara-bess mikimori-tamana-gun-bess mikimori-yame-bess namie-redox-flow nc-ibigawa nc-kainan nc-nagano-city pr-co109041-bess pr-co161802-bess pr-co33609-bess pr-co55631-bess pr-tecra-miyagi starseeds-wakayama-inokuchi
- 掲載・outputMw のみ0（9）: marubeni-2400mwh olympia-ota-isesaki ota-bess pr-co12501-bess **pr-co140317-bess（本便で null 化済）** pr-co154894-bess pr-co173175-shiga-4mwh pr-co176308-bess pr-looop-saitama
- 掲載・capacityMwh のみ0（10）: glome-nishikata-kanai-2465-bess mimasaka-bess naganuma-bess pr-co110152-bess pr-co143072-bess pr-co164583-bess pr-co21766-bess pr-co55631-gunma pr-co55631-tokyo-4mw pr-co76147-bess-2
- 一覧に出ない 85（301元 42・EXCLUDED 43）の slug 一覧はスクリプト出力 `scripts/.tmp-pj2g3-scope.ts` を参照（301元は canonical 側に諸元があるため Pj2-H の対象外にできる。EXCLUDED は案件性なしで null 化の意味が薄い）。

本便後の掲載「調査中」は **38**（140317 が外れた）。

### 4(b) cod が sourceUrl（PR TIMES）の datePublished と同日 — **90 件**（PATCH 前・本便で 140317 を null 化 → 残 89）

- 対象: sourceUrl が prtimes.jp かつ cod あり **130 件**（ユニーク URL 112・全件 Chrome UA で GET・取得失敗 1）。
- 同日 90 件の区分: 掲載 52・301元 17・EXCLUDED 21。status: 稼働中 35・計画中 45・建設中 8・空 2。
- **掲載 52 の内訳**:
  - 計画中（17）: pr-co140317-bess（済） pr-co154894-bess pr-co154894-bess-2 pr-co166651-bess pr-co169202-bess-2 pr-co173175-saitama-5mwh-2 pr-co176308-bess pr-co70816-bess-3 pr-co76147-bess-2 pr-co76147-hokkaido pr-co86244-bess-4 pr-co86244-bess-7 pr-co86244-tochigi-8mwh pr-co89612-bess-2 pr-co96742-mie pr-energy-bess-2 pr-tecra-miyagi
  - 建設中（5）: pr-219mwh-bess pr-co143072-bess pr-co143072-bess-2 pr-co88876-bess pr-co88876-bess-2
  - 稼働中（28）: nc-iwami-bess pr-2mw-4mwh-bess-2 pr-co109041-bess pr-co109041-gunma pr-co109041-hyogo pr-co110152-bess pr-co111866-bess pr-co151398-bess pr-co160356-bess pr-co160356-bess-2 pr-co16325-gunma-2 pr-co169202-bess pr-co175281-shizuoka pr-co176494-okayama pr-co33609-bess pr-co33609-miyagi-2mw pr-co55631-bess pr-co55631-gunma pr-co55631-tokyo-4mw pr-co81706-iwate-58mwh pr-co86244-bess pr-co86244-bess-2 pr-co86244-mie-8mwh pr-co95695-bess pr-ekuenergyjapan-fukuoka pr-energy-bess pr-energy-ntt-bess pr-taokeenergy-mie-2mw
  - status 空（2）: nc-kama-kuchiharu nc-sendai-kamiayashi
- 一覧に出ない 38（301元 17・EXCLUDED 21）は `.tmp-pj2g3-scope.ts` 出力を参照。
- 既知3例: 140317 ✓検出（本便で解消）／兵庫 109041（`pr-co109041-bess` cod 2025-03-10 = 配信 2025-03-10 11:00）✓検出／板野 149815 は cod が既に null（金曜#5 追修便）のため対象外。
- 取得失敗 1: `fujitech-kushiro-katsuragoi-bess`（PR TIMES 000000042.000081547 が HTTP 500）。★この cod は ISO でなく「2027年2月1日（予定）」の文字列で、maintenance の日付解釈からも外れる（§8）。
- 4(a)∩4(b): 50 件（うち掲載は 140317 を含む少数。両リストの重なりは EXCLUDED/301元が大半）。

**読み方の注意（Pj2-H の設計向け）**: 「同日」＝誤りとは限らない。稼働中で「本日運転開始」を配信したリリース（例: 仙台上愛子 C `nc-sendai-kamiayashi` は受電告知 4/1 公表＝運開日 4/1）は同日が正しい。一方 **計画中で cod＝配信日の 16 件（140317 除く）と建設中 5 件は、定義上 COD が配信日と一致しえないため配信日混入の可能性が高い**。稼働中 28 件は各リリース本文の「運転開始日」欄の有無で個別判定が要る。

## 5. 一次・逐語の記録（再取得の証跡）

| 一次 | 取得時刻（JST） | 逐語／観測 |
|---|---|---|
| https://www.kyuden.co.jp/press/2022/h220805-1.html | 10:41・10:47（dry-run）・10:48（本実行）・10:49（再走） | 「本蓄電所の蓄電池は、電動フォークリフトで使用した蓄電池を再利用しており」。EV=0・電気自動車=0・中古=0 |
| PR034 https://prtimes.jp/main/html/rd/p/000000034.000140317.html | 同上 | datePublished=2025-10-14 17:59:21。「和歌山県和歌山市松江に設備容量約8.2MWhの系統用蓄電所を建設・運営する事業を計画しています。」出力・kW 0件 |
| PR004／PR006 https://prtimes.jp/main/html/rd/p/000000004.000069153.html ／ …000000006.000069153.html | 同上 | 「システム構成は1927.2kW出力の4887.6kWh（2時間システム）となっており、407.3kWhの蓄電ユニットを12台使用しています。」（両 PR 同文） |

## 6. 検証（ローカル）

- 禁止語: 本便で追加した文言は「リユース電池」のみ → `scripts/lv-invest-banned-words.json`（9語）に該当なし。
- `tsc --noEmit`: **0 errors**（10:51:59）。
- `npm run build`: **EXIT 0**（10:52:53 → 11:02:45）。`.env.local` をシェル読込して実行。`.next/cache/fetch-cache` は build 前に `.next/cache/fetch-cache.moved-20260909-105121` へ退避（#116・rm なし。scratchpad への mv は Permission denied だったため同ディレクトリ内リネーム）。
- verify: `verify:linkify` 15 pages clean ✓／`verify:nearby-cards` PASS（軸2 31 origin 混入 0）✓／`verify:operators` PASS ✓／`verify:projects-body` 28 PASS / 0 FAIL ✓。
- built HTML（`.next/server/app/projects/*.html`・script 外で判定・#107／#116）:
  - `kyuden-omuta-reuse`: EV由来電池 **0**・「リユース電池の系統用二次利用」1・電動フォークリフト 1・EV 0。
  - `pr-co140317-bess`: 「運転開始予定」**0**・「出力 調査中」0・調査中注記 0・「容量 8.2 MWh」1・「発表日」0・本文第1段落「ステータス：計画中。」1。meta description「…出力—MW・容量8.2MWh。」。JSON-LD（CreativeWork）description から dataNotice が消え、additionalProperty は capacityMwh 8.2 のみ。※「2025-10-14」が関連ニュース欄に 1 件残るが、これは関連記事の配信日で cod ではない。
  - `pr-co69153-ibaraki-3`: バッジ「容量 4.8876 MWh」・meta description「容量4.8876MWh」・JSON-LD capacityMwh **4.8876**（「4.887 MWh」0）。
  - `/projects` 一覧: 140317 行「和歌山県和歌山市松江蓄電所 | 和歌山県 和歌山市 | **—** | 8.2 MWh | エネルギーパワー株式会社 | **—**」。調査中注記「（**38** 件）」。★ibaraki-3 行の容量セルは「**4.888 MWh**」— 一覧の `fmtMWh` が `toLocaleString()`（既定 maximumFractionDigits=3）で丸めるため。保存値は 4.8876 で、詳細ページ・meta・JSON-LD は 4.8876。一覧の丸めは既存仕様のため本便では触らない（§8）。
  - `src/lib/generated/projects-maintenance.json`: investigating 39→**38**・overdue 55→**54**・both 9→**8**（140317 が両リストから消滅）・overdueAsOf 2026-09-09。
- 生成物差分: projects-maintenance.json（上記）＋ glossary-detail-index / grid-area-lists（generated_at）/ operators-detail-index の各1行（ビルド副産物・前便と同様に同梱）。セッション開始前から未コミットだった `scripts/experimental/operators/alias-expansion-report.json`・`src/data/substations/index.json` は本便と無関係のため含めない。

## 7. デプロイ・本番照合・監視

- 追修便（5038dcf）の30分監視は日付を跨いで最終確認が未記録だったため、本便着手時（2026-09-09 10:45・素URL）に late-final を実施: name 3件＋A の h1 ✓／ibaraki-2 → -3 の 301 ✓／一覧から jpn-gifu-sendai・ibaraki-2 消滅 ✓／kyuden 電動フォークリフト 1・中古EV 0 ✓／非重複メモ A・C 各1 ✓（EV由来電池 1 は本便で解消）。異常なし。
- 本便: commit → push → `commits/<sha>/status` で success を待ち、素URL＋x-vercel-cache/age で照合（期待: kyuden「EV由来電池」0／140317「運転開始予定」行 0／ibaraki-3 4.8876）。結果は完了報告（チャット）に記載。30分監視は追修便の監視に相乗り（同一の期待値を再照合）。

## 8. 報告のみ（本便では触っていない・Pj2-H／別便の候補）

1. **meta description の「出力—MW」表記**（`src/app/projects/[slug]/page.tsx` generateMetadata）: outputMw が null のとき `describeMW` が「—」を返し「出力—MW」となる。既存 null レコード（kaminara-bess・nanahongi-bess 等）と同形で本便が新たに作った表現ではないが、null を「出力 未記載」等に言い換える小修正の候補。
2. `pr-co69153-ibaraki-3` の outputMw 1.927 は一次 1927.2kW＝**1.9272**MW の丸め（裁定対象外）。
   併せて `/projects` 一覧の数値セルは `toLocaleString()` 既定の小数3桁丸めで「4.888 MWh」と出る（詳細は 4.8876）。一覧と詳細で表記が異なる状態は既存仕様（1.927 MW 等も同じ丸め）。桁を揃えるなら `maximumFractionDigits` を明示する小修正が要る。
3. `fujitech-kushiro-katsuragoi-bess` の cod「2027年2月1日（予定）」は ISO でない文字列。一覧・詳細にはそのまま出る。sourceUrl（PR TIMES）は HTTP 500。
4. 4(a) 掲載 39 のうち「両方0」20 件は、一次に諸元がない案件（案件性はある）か取込漏れかを個別に読む必要がある（mikimori 10件は同一社の一括取込）。
5. 4(b) の詳細は §4 の注意書きどおり、status 別に扱いを分けるのが安全。
