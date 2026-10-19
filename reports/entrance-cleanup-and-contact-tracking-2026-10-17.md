# 入口の掃除と計測便 — 入口 26 ページの是正・件数の自動化・相談リンクの UTM と GA4（2026-10-17 実装・本番反映）

**結論**: 入口 26 ページから、次のものを外しました。
- 過ぎた「公開予定」と、出ていない機能の予告（E-3・C-3・F-4・B-1・B-4・G-1・AJ）
- 社内の役名「リク」と「顧問チーム（公認会計士…）」
- 「10 年運営」
- 出典の無い「1兆円超」
- 「迅速に対応いたします」
- 題名の二重（17 本）
- トップの「決定版」

件数（540社超・403社・540+・10社・8,225）は、手書きをやめて /operators・/grid と同じ数（577 社・10 社・8,346）を自動で出すようにしました。

相談のリンクは関数 1 つ（`contactUrl`）にまとめ、src の 53 か所と microCMS の本文 2 件の全部に UTM を付けました。GA4 の `contact_click` は、全ページで出ます。

- commit: `e68e4e2`（45 ファイル）
- Vercel: success 2026-10-17 21:52:41 JST
- 本番（素 URL・21:52:53）: 便 §3 の確認 1〜4 がすべて OK
- microCMS: 書込 0（GET のみ）
- 訂正履歴: 2 件（20261017-03・-04）

---

## (0) 読んだ便

- `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\入口の掃除と計測便_入口26ページの古い予定・符号・役名を外す・件数の自動化・相談リンクのUTMとGA4_コードのみ_Claude_Code投入_2026-10-17起草_ユウ.md`
  - 14,876 バイト・最終更新 2026-10-17 18:55:30 JST
  - sha256 `55da53a8eb2c659fead163b0daf8e4f382ca04fea774224584c465961fc0e276`
- OneDrive の正本を読んだ。リポ直下の同名フォルダに、この便は 0 本。
- 変更の全一覧（前・後の逐語・回数）、洗い出し・レビューの結果は `reports/entrance-cleanup-and-contact-tracking-2026-10-17.data.json`。

## 進め方

1. **洗い出し**: 読取専用の調べ役 6 本（ワークフロー `wf_430f0361-d1b`）。
   - 26 ページは 3 本に分担し、本番の素 URL の見える本文と src を突き合わせた。
   - あとの 3 本は、役名（コード全体＋microCMS の全 API を GET・書込 0）・件数・相談リンク。
   - 拾ったのは 144 件で、うち「迷う」は 58 件。
2. **実装**: 迷う印の無いものと、便の決まりにそのまま当たるものだけを直した。迷うものは (9) へ回した。
3. **レビュー**: 読取専用 5 観点（外し忘れ・件数・相談リンク・コード・訂正履歴）。指摘ごとに 2 観点で反証（ワークフロー `wf_788d2395-e99`・45 体・失敗 0）。実在とされたものは直すか、(9) へ回した（下の「レビューで直したもの」）。
4. **検証**:
   - type-check・build（3 回・どれも EXIT 0）
   - 相談リンクの検査（src・ビルド HTML・故障注入）
   - 便 §3 の検査スクリプト（ビルド HTML と本番の両方）
   - 内蔵ブラウザで 375px（主な 8 ページ）
   - GA4 のイベントの発火（gtag の身代わり）

**レビューで直したもの**（push 前）:
- 「業界データ基盤の運営元 —」の後ろの半角スペースが消えていた（JSX の文を `{`…`}` に替えたため。#jsx-template-whitespace と同じ型）。テンプレートの頭に空白を入れて「— 蓄電所ネットは」に戻した（/start の 3 ページ・/info/operating-bess-introduction）。
- /projects で使われなくなった import。
- /seller/reuse-secondhand に、/buyer で外したのと同じ型の 2 文が残っていた。「容量市場入札ツールで参入可能性試算可能。」と「為替リスクは当ページデータセクションの USD/JPY 動向で継続把握、ヘッジ戦略の検討材料。」を外した。
- 検査の抜け道を塞いだ。変数に入れてから href に渡す形（旧 /projects の `siteContactUrl`）を見逃していた。
- /ops/freshness の「担当」列に、社内の役名（セイ・モリ・ノブ・チサ・リン など）が人として出ていた。便 (c) に当たるので、列を描画しないようにした。データ（`src/lib/sop-schedule.ts` の persona）は残した。
- 訂正履歴は 3 件の案を 2 件にした。/buyer/factory-commercial の分は、同じページの h1「20-30% 削減する」（迷うもの）と一組にして (9) へ回した。文言も、確かめた範囲に合わせて直した。

---

## (1) 外した・直した文の一覧

記号は便 §1 の (a)〜(i)。迷う印の付いていた項目のうち、日付・符号の部分だけを直したものは「迷うもの」の側にも残した（(9)-2）。

**迷う印があったが直したもの**（レビュー R9 の申し送り）:
- /seller/developer の課題「…E-3 自治体条例 (11/21 公開予定) 情報の把握」
- 同 FAQ の「案件 DB (C-3 アグリゲーター、8 月公開)」の括弧
- /seller/epc の課題の「/2027」「(C-3…)」
- 同 FAQ の「寄稿枠を準備中。」
- 同 FAQ の「メーカー DB (B-1、8/15 頃公開) + メーカー別スペック比較」
- /seller/manufacturer の FAQ「メーカー DB (8 月公開予定) への登録方法は?」の組
- 同「技術論文寄稿の枠を準備中。」
- /seller/reuse-secondhand の課題カード「劣化曲線の実測データ不足」
- 同 FAQ「市場規模は?」の第 2 文

どれも、(a)（出ていない機能の予告）・(b)（符号）として便が外すよう決めている部分です。迷いが残る点（カードごと外すか・問いと答えが合うか）は (9)-2 にあります。

### (1)-1 LP の設定（src/data/landing-page-configs.ts）の置換

| # | ページ | 記号 | 前（逐語） | 後（逐語） | 回数 |
|---|---|---|---|---|---:|
| 1 | /buyer/factory-commercial | d | エネルギー情報センターの 10 年運営実績で、業界事業者を中立的に支援します。 | 運営元の一般社団法人エネルギー情報センター（EIC）が、業界事業者を中立的に支援します。 | 1 |
| 2 | /buyer/factory-commercial | d | 10 年運営の実績で、業界中立の立場から導入検討を支援します。 | 運営元の一般社団法人エネルギー情報センター（EIC）が、業界中立の立場から導入検討を支援します。 | 1 |
| 3 | /buyer/new-entry | d | 業界中立(エネルギー情報センター10年運営)の視点で解説。 | 業界中立(一般社団法人エネルギー情報センター・2015 年設立)の視点で解説。 | 1 |
| 4 | /buyer/new-entry | d | エネルギー情報センター10年運営の信頼性で、新規参入の意思決定を支援します。 | 運営元の一般社団法人エネルギー情報センター（EIC）が、新規参入の意思決定を支援します。 | 1 |
| 5 | /buyer/investor | d | 中立の立場で論点整理を支援します(エネルギー情報センター10年運営)。 | 中立の立場で論点整理を支援します(一般社団法人エネルギー情報センター・2015 年設立)。 | 1 |
| 6 | /seller/manufacturer | d | エネルギー情報センター (10 年運営) の事業として、 | 一般社団法人エネルギー情報センター（2015 年設立）の事業として、 | 1 |
| 7 | /seller/manufacturer・/seller/epc・/seller/developer・/seller/reuse-secondhand | b・d・a | (導入検討ページ群)。エネルギー情報センター10年運営の中立メディアとして、まず事業者ナビ(/operators)への中立掲載、業界レポート2026本編(7/5公開予定)での引用・掲載、AJ火災事例DB(5/28公開)やInsight記事での取材機会をご用意。 | 。一般社団法人エネルギー情報センター（2015 年設立）の中立メディアとして、まず事業者ナビ(/operators)への中立掲載、[業界レポート2026](/reports/2026)本編での引用・掲載、[火災事例DB](/incidents)やInsight記事での取材機会をご用意。 | 4 |
| 8 | /buyer/investor | i | 業界中立の実データで。国内の蓄電所投資は1兆円超、市場急拡大のなかで投資判断を支援します。 | 業界中立の実データで。 | 1 |
| 9 | /buyer/investor | i | 立地(系統空き容量)・アグリゲーター・収益構成を中立データで評価。市場規模1兆円超・300GWh級の拡大局面における出口の考え方も整理。 | 立地(系統空き容量)・アグリゲーター・収益構成を中立データで評価。 | 1 |
| 10 | /buyer/factory-commercial | i | ③追加収益 (容量市場・需給調整市場参入)。最新の事例では年間 20-30% の電気代削減 + 容量市場収益が報告されています。 | ③追加収益 (容量市場・需給調整市場参入)。 | 1 |
| 11 | /buyer/capacity-market | a | OCCTO 認定が主要要件です。詳細は OCCTO 公式 + 当社の容量市場入札ツールで条件チェック可能です。 | OCCTO 認定が主要要件です。 | 1 |
| 12 | /buyer/capacity-market | a | 運転計画の最適化が重要。当社の容量市場入札ツールで稼働率シミュレーションが可能です。 | 運転計画の最適化が重要。 | 1 |
| 13 | /buyer/balancing-market | a | description: '容量市場との並行参加検討。実需給期間の運転計画最適化に活用。', | description: '容量市場との並行参加検討。', | 1 |
| 14 | /buyer/ppa-offtake | a | ③燃料費調整連動 (USD ベース)。当ページの USD/JPY + 円建て LNG データで影響度試算可能。 | ③燃料費調整連動 (USD ベース)。 | 1 |
| 15 | /buyer/balancing-market | a | 'balancing-tertiary2-vs-jepx', | （外した） | 1 |
| 16 | /buyer/ppa-offtake | a | 'us-jp-rate-vs-usdjpy', | （外した） | 1 |
| 17 | /seller/manufacturer | a・b | 業界レポート + メーカー DB (8 月公開予定) で詳細分析支援。 | 業界レポート + [メーカー DB](/operators/makers)で詳細分析支援。 | 1 |
| 18 | /seller/manufacturer | a・b | AJ 火災事例 DB (5/28 公開) + B-4 消火比較 (9 月) で技術品質向上支援。 | [火災事例 DB](/incidents)で技術品質向上支援。 | 1 |
| 19 | /seller/manufacturer | a | 蓄電所ネットの業界レポート 2026 (7/5公開予定) + 業界レポート 2027 (12/25) でのメーカー引用機会。 | 蓄電所ネットの[業界レポート 2026](/reports/2026)でのメーカー引用機会。 | 1 |
| 20 | /seller/manufacturer | a | 業界レポート 2026 (7/5公開予定) + 業界レポート 2027 (12/25 公開) で、メーカー製品の引用枠あり。 | [業界レポート 2026](/reports/2026)で、メーカー製品の引用枠あり。 | 1 |
| 21 | /seller/manufacturer | a・b | {         question: 'メーカー DB (8 月公開予定) への登録方法は?',         answer:           'メーカー DB は 8/15 頃公開予定 (B-1 機能)。製品スペック・価格レンジ・実績案件の登録枠を準備中。8 月初旬にメーカー向け登録案内を予定。',       }, | （外した） | 1 |
| 22 | /seller/manufacturer | a・b | 業界レポート企画、Insight 記事、AJ 火災事例 DB 等で取材機会あり。技術担当者・経営層へのインタビュー、技術論文寄稿の枠を準備中。お問い合わせフォームからご相談ください。 | 業界レポート企画、Insight 記事、[火災事例 DB](/incidents) 等で取材機会あり。お問い合わせフォームからご相談ください。 | 1 |
| 23 | /seller/epc | a・b | EPC 事業者の施工実績・案件規模・技術ノウハウを業界レポート 2026/2027 + 案件 DB (C-3 アグリゲーター、8 月公開) で可視化機会。 | EPC 事業者の施工実績・案件規模・技術ノウハウを[業界レポート 2026](/reports/2026) + 案件 DB で可視化機会。 | 1 |
| 24 | /seller/epc | a・b | {         icon: '🔧',         title: 'O&M ベンチマーク',         description:           'F-4 O&M ベンチマーク (9 月公開予定) で運用保守の業界水準を比較可能、サービス差別化に活用。',       }, | （外した） | 1 |
| 25 | /seller/epc | a・b | 業界レポート、Insight 記事、AJ 火災事例 DB 等で取材機会あり。EPC 視点での技術ノウハウ、施工事例の寄稿枠を準備中。 | 業界レポート、Insight 記事、[火災事例 DB](/incidents) 等で取材機会あり。 | 1 |
| 26 | /seller/epc | a・b | {         question: 'F-4 O&M ベンチマーク (9 月公開) への参加方法は?',         answer:           'F-4 機能は 9/17-9/23 公開予定。EPC 事業者の O&M データ提供枠を準備中、8 月後半に案内予定。',       }, | （外した） | 1 |
| 27 | /seller/epc | a・b | メーカー DB (B-1、8/15 頃公開) + メーカー別スペック比較 (B-1 機能内) で、EPC 事業者の機材選定支援。 | [メーカー DB](/operators/makers)で、EPC 事業者の機材選定支援。 | 1 |
| 28 | /seller/developer | a・b | 蓄電所立地の土地確保、地元自治体との連携、E-3 自治体条例 (11/21 公開予定) 情報の把握。 | 蓄電所立地の土地確保、地元自治体との連携。 | 1 |
| 29 | /seller/developer | a | 蓄電池導入補助金、再エネ特措法、固定資産税優遇等の最新動向。業界レポート 2026/2027 で詳細解説予定。 | 蓄電池導入補助金、再エネ特措法、固定資産税優遇等の最新動向。 | 1 |
| 30 | /seller/developer | b | label: 'PPA・オフテイク契約検討 (Buyer Landing)', | label: 'PPA・オフテイク契約検討', | 1 |
| 31 | /seller/developer | a・b・c | 業界レポートでの事業性データ引用、E-3 自治体条例 (11/21 公開) 情報。SPC スキーム設計の助言は弊社顧問チーム (公認会計士、リク等) でご相談可能。 | 業界レポートでの事業性データ引用。 | 1 |
| 32 | /seller/developer | a・b | {         question: '土地確保・自治体連携の支援はあるか?',         answer:           'E-3 自治体条例 (11/21 公開予定) で全国の自治体条例情報を集約予定。土地確保時の地元自治体折衝の基礎情報。',       }, | （外した） | 1 |
| 33 | /seller/developer | a | 業界レポート 2026 (7/5公開予定) + 業界レポート 2027 (12/25) で補助金・優遇税制の最新動向を解説予定。 | [業界レポート 2026](/reports/2026)で補助金の動向を解説しています。 | 1 |
| 34 | /seller/developer | a・b | 業界レポート、Insight 記事、案件 DB (C-3 アグリゲーター、8 月公開) でデベロッパー実績の掲載枠あり。 | 業界レポート、Insight 記事、案件 DB でデベロッパー実績の掲載枠あり。 | 1 |
| 35 | /seller/reuse-secondhand | a・b | {         icon: '📉',         title: '劣化曲線の実測データ不足',         description:           'G-1 劣化曲線実測データ (9/24 公開予定) で、メーカー別・使用条件別の劣化曲線を可視化。リユース価格設定の基礎データ。',       }, | （外した） | 1 |
| 36 | /seller/reuse-secondhand | a・b | AJ 火災事例 DB (5/28 公開) で安全性ガイダンス + リユース固有のリスク管理。 | [火災事例 DB](/incidents)で安全性ガイダンス + リユース固有のリスク管理。 | 1 |
| 37 | /seller/reuse-secondhand | a・b | 2026 年以降本格化見込み。G-1 劣化曲線実測データ (9/24 公開) + 業界レポート 2027 (12/25) で市場規模・成長率の詳細解説予定。 | 2026 年以降本格化見込み。 | 1 |
| 38 | /seller/reuse-secondhand | a・b | {         question: '劣化曲線の実測データはいつ公開されるか?',         answer:           'G-1 劣化曲線実測データは 9/24 公開予定。メーカー別・使用条件別の劣化曲線データを業界中立で提供、リユース価格設定の基礎データ。',       }, | （外した） | 1 |
| 39 | /seller/reuse-secondhand | a・b | 業界レポート 2026/2027、AJ 火災事例 DB、Insight 記事でリユース事業者の事例掲載機会あり。 | [業界レポート 2026](/reports/2026)、[火災事例 DB](/incidents)、Insight 記事でリユース事業者の事例掲載機会あり。 | 1 |
| 40 | /buyer/new-entry・/buyer/landowner | e | 接続検討の集中により申請が殺到しており、接続まで18ヶ月〜2年、想定以上の接続負担金が発生する例もあります。系統空き容量ページ(/grid、10社8,225件)で周辺の余力を先に確認するのが有効です。 | 接続検討の集中により申請が殺到しており、接続まで18ヶ月〜2年、想定以上の接続負担金が発生する例もあります。系統空き容量ページ(/grid、{GRID_COMPANY_COUNT}社{SUBSTATION_TOTAL_STR}件)で周辺の余力を先に確認するのが有効です。 | 1 |
| 41 | /buyer/new-entry・/buyer/landowner | e | 系統空き容量ページ(/grid、10社8,225件)で、対象地の周辺変電所の空き容量・連系条件の当たりをつけられます。 | 系統空き容量ページ(/grid、{GRID_COMPANY_COUNT}社{SUBSTATION_TOTAL_STR}件)で、対象地の周辺変電所の空き容量・連系条件の当たりをつけられます。 | 1 |
| 42 | /buyer/new-entry・/buyer/landowner | e | 10社8,225件の変電所別 空き容量・連系条件。対象地周辺の系統余力を確認。 | {GRID_COMPANY_COUNT}社{SUBSTATION_TOTAL_STR}件の変電所別 空き容量・連系条件。対象地周辺の系統余力を確認。 | 1 |
| 43 | /seller/reuse-secondhand | a | 保証期間の扱いが論点。容量市場入札ツールで参入可能性試算可能。 | 保証期間の扱いが論点。 | 1 |
| 44 | /seller/reuse-secondhand | a | 品質保証の確保が主要リスク。為替リスクは当ページデータセクションの USD/JPY 動向で継続把握、ヘッジ戦略の検討材料。 | 品質保証の確保が主要リスク。 | 1 |


### (1)-2 そのほかのファイル

| # | ページ | 記号 | ファイル | 前 | 後 |
|---|---|---|---|---|---|
| 1 | /contact/media | f | `src/data/contact-pages-configs.ts` | …データ利用許諾に関するお問い合わせを受け付けています。迅速に対応いたします。 | …データ利用許諾に関するお問い合わせを受け付けています。 |
| 2 | /contact/seller | e | `src/data/contact-pages-configs.ts` | 事業者ナビ（403社掲載）への新規掲載申請… | 事業者ナビ（${OPERATOR_COUNT}社掲載）への新規掲載申請…（577社） |
| 3 | /contact と /contact/* 5 ページ | g | `src/data/contact-pages-configs.ts` | title: '…のお問い合わせ ｜ 蓄電所ネット'（6 本） | title: '…のお問い合わせ'（template が「 ｜ 蓄電所ネット」を付ける・#88） |
| 4 | /buyer 7・/seller 4 | g | `src/data/landing-page-configs.ts` | title: '…｜蓄電所ネット'（10 本）・'… - 蓄電所ネット'（1 本） | title: '…'（便の (g) と同じ型・#88） |
| 5 | /buyer 7・/seller 4（共通部品） | d | `src/components/LandingPage/LandingPageCTA.tsx` | 一般社団法人エネルギー情報センター (10 年運営実績) が、業界中立で対応いたします。 | 一般社団法人エネルギー情報センター（2015 年設立）が、業界中立で対応いたします。 |
| 6 | /start/buy・/start/sell・/start/partner（StartTrustBlock）・/info/operating-bess-introduction | e | `src/components/StartTrustBlock.tsx・src/app/info/operating-bess-introduction/page.tsx` | 蓄電所ネットは全国10社・{.total}変電所の系統情報DB、540社超の事業者ナビ、 | {` 蓄電所ネットは全国${GRID_COMPANY_COUNT}社・${SUBSTATION_TOTAL_STR}変電所の系統情報DB、${OPERATOR_COUNT}社の事業者ナビ、`}（10社・8,346・577社） |
| 7 | /start/partner | e | `src/app/start/partner/page.tsx` | 業界データベース — 事業者ナビ（540社超）・業界カオスマップ・事業者ランキング Top50 | 業界データベース{` — 事業者ナビ（${OPERATOR_COUNT}社）・…`}（577社） |
| 8 | /tracker/ag | e | `src/app/tracker/ag/page.tsx` | title '事業者トラッカー (蓄電所事業者 540+ 更新タイムライン)'・description '事業者ナビ (540+社) …'・og:title '…540+)' | 同じ文の 540+ → ${OPERATOR_COUNT}社（577社） |
| 9 | /（トップ） | h | `src/app/page.tsx` | …公的一次情報から編集統合した決定版です。 | …公的一次情報から編集統合したものです。 |
| 10 | /milestones/2026-05-22-feature-complete・/milestones/2026-06-11-vip-citation | c | `src/data/milestones.ts` | 'リン (data.eic-jp.org 編集長) との Phase D 第 1 期連動。…、リン case A 準拠、L-EIC-008 §1…'／'リン担当の data.eic-jp.org（catalog 512 系列…' | 'data.eic-jp.org との Phase D 第 1 期連動。…、L-EIC-008 §1…'／'data.eic-jp.org（catalog 512 系列…' |
| 11 | /ops/freshness | c | `src/app/ops/freshness/page.tsx` | 表の「担当」列（セイ・モリ・ノブ・チサ・リン・ジン・山口/加藤/斎藤） | 「担当」列を描画しない（データ src/lib/sop-schedule.ts の persona は残す） |
| 12 | /anken/buy・/anken/sell・/anken/flow・/anken/faq | 2(d) | `src/app/sitemap.ts` | sitemap に無い | 4 行を足した（monthly・0.7） |


---

## (2) 件数の一覧

| ページ | 前 | 後（10/17 の値） | 出どころ |
|---|---|---|---|
| /start/buy・/start/sell・/start/partner（共通の部品 StartTrustBlock）・/info/operating-bess-introduction | 「全国10社」（手書き） | `GRID_COMPANY_COUNT`＝10 | `src/lib/site-counts.ts`＝`src/data/substations/index.json` の `summary.by_area_slug` で 0 件より多いエリアの数（/reports/2026 と同じ式） |
| 同上 | 「540社超の事業者ナビ」 | `OPERATOR_COUNT`＝577社 | `src/lib/operator-count.ts`＝`src/lib/generated/operators-category-index.json` の件数。/operators の本文と同じ式（getAllOperators から非表示・301 元を除く）。/operators/makers ほか 4 ページが既に使っている |
| 同上 | 変電所数（`index.json` の最上位 `.total`・自動） | `SUBSTATION_TOTAL_STR`＝8,346（`summary.total`） | Ck2f で統一した `summary.total` に寄せた（値は同じ） |
| /start/partner | 「事業者ナビ（540社超）」 | 「事業者ナビ（577社）」 | 同上 |
| /contact/seller | 「事業者ナビ（403社掲載）」 | 「事業者ナビ（577社掲載）」 | 同上 |
| /tracker/ag（title・description・og:title） | 「540+」「540+社」 | 「577社」 | 同上（metadata は静的のまま・runtime の microCMS は足していない） |
| /buyer/new-entry（FAQ）・/buyer/landowner（課題欄・ツール欄） | 「10社8,225件」×3 | 「10社8,346件」 | `site-counts.ts`（GRID_COMPANY_COUNT・SUBSTATION_TOTAL_STR） |

- 丸めは作っていない（既存の表示どおり実数・`toLocaleString('en-US')`）。
- `operator-count.ts`（生成物）は、prebuild のスクリプトから読まれるモジュールでは import していない。`scripts/verify-corrections.ts` が `src/data/landing-page-configs.ts` を読むためで、LP の設定はリポに入っている `index.json` だけを使う（生成物ゼロからの起動・#generated-untracked-bootstrap）。
- レビュー（件数の観点）: 入口ページと /tracker/ag の 577・8,346・10 は、ローカルビルドの /operators・/grid とも、本番の素 URL とも一致した。取り違え 0。

---

## (3) 相談リンクの一覧

- 返す形は `https://eic-jp.org/contact?utm_source=bess-net&utm_medium=<referral|anken>&utm_campaign=<campaign>&utm_content=<position>`。
- 既にある campaign 名は変えていない。utm_content を末尾に足しただけで、`scripts/lv-invest-audit.ts` の含む照合は通る。
- 画面に URL を文字で出している所（about・editorial-policy・privacy・terms・トップ）は、表示の文字を `https://eic-jp.org/contact` のままにし、href だけに UTM を付けた。
- ご指摘・情報提供のリンクは position＝`feedback`（編集方針 2・変電所の詳細の位置情報・/incidents の削除依頼・/projects・プロジェクトの詳細 2・/tools の要望）。
- 下の表のほかに、microCMS の本文（news 2 レコードの body）のリンクに、描画時に href だけ UTM を足す（`addContactUtmToHtml`）。
  - /news/[slug] は campaign `news_detail`、/info/[slug] は `info_detail`。どちらも position `body`。
- 行番号は 10/20 の作業ツリー（次の便の未コミットの変更で、`src/app/page.tsx` などは数行ずれる）。

| # | ファイル:行 | campaign | position | medium | 前から UTM |
|---|---|---|---|---|---|
| 1 | `src/app/about/page.tsx:125` | 'about' | org_table | referral | なし（今回付けた） |
| 2 | `src/app/about/page.tsx:142` | 'about' | inquiry | referral | なし（今回付けた） |
| 3 | `src/app/contact/page.tsx:186` | 'contact_index' | form_button | referral | なし（今回付けた） |
| 4 | `src/app/editorial-policy/page.tsx:93` | 'editorial_policy' | feedback | referral | なし（今回付けた） |
| 5 | `src/app/editorial-policy/page.tsx:113` | 'editorial_policy' | feedback | referral | なし（今回付けた） |
| 6 | `src/app/grid/[slug]/page.tsx:696` | 'grid_detail' | feedback | referral | なし（今回付けた） |
| 7 | `src/app/incidents/page.tsx:118` | 'incidents' | feedback | referral | なし（今回付けた） |
| 8 | `src/app/info/operating-bess-introduction/page.tsx:26` | 'operating_bess_intro' | cta | referral | あり（名前は不変・utm_content を足した） |
| 9 | `src/app/lv/buying-guide/page.tsx:145` | 'funnel_lv_entry' | cross_link | referral | あり（名前は不変・utm_content を足した） |
| 10 | `src/app/lv/entry-guide/page.tsx:143` | 'funnel_lv_buy' | cross_link | referral | あり（名前は不変・utm_content を足した） |
| 11 | `src/app/lv/invest/[slug]/page.tsx:31` | 'funnel_lv_invest' | cta | referral | あり（名前は不変・utm_content を足した） |
| 12 | `src/app/lv/invest/page.tsx:19` | 'funnel_lv_invest' | cta | referral | あり（名前は不変・utm_content を足した） |
| 13 | `src/app/page.tsx:460` | 'top' | inquiry | referral | なし（今回付けた） |
| 14 | `src/app/privacy/page.tsx:111` | 'privacy' | org_table | referral | なし（今回付けた） |
| 15 | `src/app/projects/[slug]/page.tsx:189` | 'projects_detail' | feedback | referral | なし（今回付けた） |
| 16 | `src/app/projects/[slug]/page.tsx:340` | 'projects_detail' | feedback | referral | なし（今回付けた） |
| 17 | `src/app/projects/page.tsx:11` | 'projects_index' | feedback | referral | なし（今回付けた） |
| 18 | `src/app/start/buy/page.tsx:15` | 'funnel_buy' | cta | referral | あり（名前は不変・utm_content を足した） |
| 20 | `src/app/start/partner/page.tsx:16` | 'funnel_partner' | cta | referral | あり（名前は不変・utm_content を足した） |
| 21 | `src/app/start/sell/page.tsx:15` | 'funnel_sell' | cta | referral | あり（名前は不変・utm_content を足した） |
| 22 | `src/app/terms/page.tsx:111` | 'terms' | body | referral | なし（今回付けた） |
| 23 | `src/app/tools/page.tsx:285` | 'tools_index' | feedback | referral | なし（今回付けた） |
| 24 | `src/components/AnkenContactCTA.tsx:26` | `anken_${page}` | （引数） | anken | あり（anken・形は不変） |
| 25 | `src/components/LvContactCta.tsx:14` | 'funnel_lv_buy' | cta | referral | あり（名前は不変・utm_content を足した） |
| 26 | `src/components/LvContactCta.tsx:20` | 'funnel_lv_entry' | cta | referral | あり（名前は不変・utm_content を足した） |
| 27 | `src/components/SiteFooter.tsx:43` | 'site_footer' | footer | referral | なし（今回付けた） |
| 28 | `src/data/contact-pages-configs.ts:98` | 'contact_buyer' | form_button | referral | なし（今回付けた） |
| 29 | `src/data/contact-pages-configs.ts:143` | 'contact_seller' | form_button | referral | なし（今回付けた） |
| 30 | `src/data/contact-pages-configs.ts:188` | 'contact_media' | form_button | referral | なし（今回付けた） |
| 31 | `src/data/contact-pages-configs.ts:233` | 'contact_investor' | form_button | referral | なし（今回付けた） |
| 32 | `src/data/contact-pages-configs.ts:278` | 'contact_advisor' | form_button | referral | なし（今回付けた） |
| 33 | `src/data/landing-page-configs.ts:101` | 'lp_factory_commercial' | hero | referral | なし（今回付けた） |
| 34 | `src/data/landing-page-configs.ts:202` | 'lp_factory_commercial' | cta | referral | なし（今回付けた） |
| 35 | `src/data/landing-page-configs.ts:217` | 'lp_capacity_market' | hero | referral | なし（今回付けた） |
| 36 | `src/data/landing-page-configs.ts:319` | 'lp_capacity_market' | cta | referral | なし（今回付けた） |
| 37 | `src/data/landing-page-configs.ts:333` | 'lp_balancing_market' | hero | referral | なし（今回付けた） |
| 38 | `src/data/landing-page-configs.ts:434` | 'lp_balancing_market' | cta | referral | なし（今回付けた） |
| 39 | `src/data/landing-page-configs.ts:448` | 'lp_ppa_offtake' | hero | referral | なし（今回付けた） |
| 40 | `src/data/landing-page-configs.ts:550` | 'lp_ppa_offtake' | cta | referral | なし（今回付けた） |
| 41 | `src/data/landing-page-configs.ts:566` | 'lp_new_entry' | hero | referral | なし（今回付けた） |
| 42 | `src/data/landing-page-configs.ts:667` | 'lp_new_entry' | cta | referral | なし（今回付けた） |
| 43 | `src/data/landing-page-configs.ts:682` | 'lp_investor' | hero | referral | なし（今回付けた） |
| 44 | `src/data/landing-page-configs.ts:800` | 'lp_investor' | cta | referral | なし（今回付けた） |
| 45 | `src/data/landing-page-configs.ts:815` | 'lp_landowner' | hero | referral | なし（今回付けた） |
| 46 | `src/data/landing-page-configs.ts:900` | 'lp_landowner' | cta | referral | なし（今回付けた） |
| 47 | `src/data/landing-page-configs.ts:915` | 'lp_manufacturer' | hero | referral | なし（今回付けた） |
| 48 | `src/data/landing-page-configs.ts:1011` | 'lp_manufacturer' | cta | referral | なし（今回付けた） |
| 49 | `src/data/landing-page-configs.ts:1025` | 'lp_epc' | hero | referral | なし（今回付けた） |
| 50 | `src/data/landing-page-configs.ts:1114` | 'lp_epc' | cta | referral | なし（今回付けた） |
| 51 | `src/data/landing-page-configs.ts:1128` | 'lp_developer' | hero | referral | なし（今回付けた） |
| 52 | `src/data/landing-page-configs.ts:1225` | 'lp_developer' | cta | referral | なし（今回付けた） |
| 53 | `src/data/landing-page-configs.ts:1239` | 'lp_reuse_secondhand' | hero | referral | なし（今回付けた） |
| 54 | `src/data/landing-page-configs.ts:1330` | 'lp_reuse_secondhand' | cta | referral | なし（今回付けた） |


---

## (4) 検査（故障注入を含む）

| 検査 | 結果 |
|---|---|
| `npm run type-check` | OK |
| `npm run build`（`.env.local` を読み込んで 3 回） | 3 回とも `BUILD EXIT 0`。prebuild の `verify:contact-links`・`verify:corrections` も ok |
| `scripts/verify-contact-links.ts`（新規・prebuild で src を検査・警告のみ） | src: 生の URL と UTM の無い href が 0 件（直す前の HEAD に当てると 56 件を検出） |
| 同 `--html .next/server/app` | 5,589 ページ・6,225 本が全部 UTM つき・表示の文字に UTM 0（直す前のビルドに当てると 6,111 本を検出） |
| 同 `--self-test`（故障注入） | 25 通りで ok。内訳は src の違反 10（生の URL・`href={siteConfig…contactUrl}`・設定の `heroCtaUrl`・変数に入れてから渡す形・表示用の URL に文字を足す形 ほか）、src の正しい行 7、HTML の違反 4（UTM なし・utm_source なし・表示の文字に UTM・`www.` と末尾の `/`）、HTML の正しいリンク 3、本文に足す関数 2（href だけ変わる・冪等） |
| 便 §3 の 1〜4 の検査（scratchpad の `cleanup_check.py`・ビルド HTML） | 26 ページ・トップ・/tracker/ag・sitemap の 4 ページが全部 OK |
| `npm run verify:corrections` | ok（記録 283 件＝訂正 192・表示の停止 90・表示の再開 1） |
| 375px（内蔵ブラウザ・ローカルの next start） | 主な 8 ページ（/seller/epc・/seller/developer・/buyer/investor・/contact/seller・/start/partner・/info/operating-bess-introduction・/contact ほか）とも scrollWidth 375・はみ出す要素 0 |
| GA4 の発火（gtag の身代わり・移動は止めた） | 左クリック 1 回で `contact_click` 1 回（cta_campaign・cta_position・link_url が UTM どおり）。中クリック（button 1）で 1 回、右クリック（button 2）で 0 回。リンクの中の文字のクリックでも 1 回 |
| 読取専用レビュー（5 観点＋反証） | 指摘 31 件。実在とされたもののうち、コードで直すものは上の「レビューで直したもの」で直した。残りは (6)・(9) に回した |

---

## (5) 本番 curl（素 URL・x-vercel-cache と age）

**2026-10-17 21:52:53 JST**（e68e4e2 の Vercel success 21:52:41 の直後）:
- 26 ページと /tracker/ag は、どれも 200 PRERENDER age 0。トップは HIT age 46。
- 便 §3 の確認:
  1. 26 ページで「公開予定」・符号・「リク」・「10 年／10年」・「403社」・「540社超」・「迅速」・「(導入検討ページ群)」が 0。トップの「決定版」0。/tracker/ag の「540+」0。/buyer・/seller の 11 ページに「2015 年設立」あり。
  2. 相談リンク: 次の 18 ページ・42 本が全部 UTM つきで、表示の文字に UTM 0。
     - /contact・/about・/editorial-policy・/privacy・/terms・/tools・/projects・/incidents
     - info・news の本文 2 本ずつ
     - /grid/cb-3617（位置情報のボタンが出る変電所の詳細）
     - /start/buy・/anken・/lv/invest・/buyer/investor・/seller/developer
  3. /contact と /contact/* の題名の二重 0（LP 11 本も 0）。
  4. sitemap に /anken/buy・/anken/sell・/anken/flow・/anken/faq がある。

**2026-10-20 08:45:56 JST**（30 分監視の代わり・(8) 参照）: 26 ページ・トップ・/tracker/ag・sitemap の確認は全部 OK のまま。

| URL | x-vercel-cache | age |
|---|---|---:|
| / | HIT | 39 |
| /contact | HIT | 33,607 |
| /about | HIT | 211,946 |
| /editorial-policy | HIT | 211,945 |
| /tools | HIT | 36,533 |
| /projects | HIT | 41 |
| /incidents | HIT | 37,103 |
| /info/news-2026-1010-bessnet-9companies-milestone | STALE | 55,825 |
| /news/news-2026-1010-bessnet-9companies-milestone | STALE | 211,934 |
| /grid/cb-3617 | STALE | 62,723 |
| /start/buy | HIT | 212,007 |
| /anken | HIT | 40,814 |
| /buyer/investor | HIT | 33,711 |
| /seller/developer | HIT | 21,979 |
| /contact/seller | HIT | 76,512 |
| /tracker/ag | HIT | 9 |

- 相談リンクは 16 ページ・37 本が全部 UTM つき。
- Vercel の本番デプロイは、e68e4e2（3 日前）の後に 1 本（2 日前・`bess-84fwb0oxh`・Ready）があった。git の commit はその後 0 なので、microCMS の webhook によるビルドとみられる（私の書込は 0）。

---

## (6) EDAさん向けの GA4 の手順

1. 管理 → データの表示 → イベントに `contact_click` が出ているかを見る（出るまで 1 日ほど）。
2. `contact_click` の「キーイベントとしてマークを付ける」をオンにする。
3. `anken_contact_click` をキーイベントにしているなら外す（/anken のボタンでは両方が出るため。/anken の内訳は cta_campaign＝anken_* で見る）。
4. 管理 → カスタム定義 → カスタムディメンションを作成: 範囲「イベント」、イベントパラメータ `cta_campaign`、表示名「相談リンクの種類」。
5. 同じく `cta_position`、表示名「相談リンクの位置」。
6. 探索 → 自由形式: 行に「ページパス」と「相談リンクの種類」、列に「相談リンクの位置」、値に「イベント数」、フィルタに イベント名＝contact_click。
7. ご指摘・情報提供は「相談リンクの位置」＝feedback で分けて見る（相談の数には入れない）。
8. ボタン別の表は「種類 × 位置」で作る（`link_url` は 100 字を超えて切れるので使わない）。

---

## (7) 私（ユウ）の前提違い（逐語で）

1. **既存の名前**: 便 §2(a) の既存名の一覧「funnel_buy・funnel_sell・funnel_partner・operating_bess_intro・funnel_lv_buy・funnel_lv_entry・anken_*」に `funnel_lv_invest` が無い。実在する（/lv/invest と 87 記事）ので変えていない。
2. **6 か所**: 「`contact-pages-configs.ts` の 6 か所」のうち 1 か所は 8 行目のコメント。リンクは 5 か所。
3. **8,346変電所**: 便 (e) の例「8,346変電所」は、入口の 4 ページではもう手書きではなかった（`index.json` の `.total` から自動）。`summary.total` に寄せただけ。手書きの変電所数は LP の「10社8,225件」3 か所だった。
4. **題名の二重**: 便 (g) が名指ししているのは「`/contact` と `/contact/[type]`」だけ。LP の 11 本（/buyer 7・/seller 4）も「…｜蓄電所ネット | 蓄電所ネット」の二重だったので、同じ型として直した。そのため LP の og:title からサイト名が消えている（(9)-4）。
5. **業界レポート 2026 と税制**: 便 (a)「業界レポート 2026 → `/reports/2026`」について。/reports/2026 は補助金を扱う（第6章）が、税制（固定資産税・再エネ特措法・優遇税制）の記述は 0 件だった。
   - /seller/developer の課題欄「蓄電池導入補助金、再エネ特措法、固定資産税優遇等の最新動向。業界レポート 2026/2027 で詳細解説予定。」は、リンクの文にせず第 2 文を外した。
   - FAQ「補助金・税制優遇の最新情報は?」は、補助金だけを「[業界レポート 2026](/reports/2026)で補助金の動向を解説しています。」にした。
6. **リンクの文にした「機会」**: 便 (a)「業界レポート 2026 → `/reports/2026`」で、元の「(7/5公開予定)」「+ 業界レポート 2027 (12/25)」だけを外してリンクの文にすると、公開済みの 2026 年版に「引用・掲載の機会」がある、という文になる（9 か所・レビュー R2）。(9)-2 へ回した。
7. **アグリゲーター**: 便 (a) の対応づけ「アグリゲーター → `/operators/aggregators`」について。本文の「案件 DB (C-3 アグリゲーター、8 月公開)」の「案件 DB」は、/projects を指すのか /operators/aggregators を指すのか、文から決まらない。括弧（符号・日付）だけを外し、行き先は (9)-2 へ。
8. **出典の無い数字**: 便 (i)「出典の無い数字」の例は「市場規模などの数」。費用・期間・面積の目安（初期 5〜6億円・接続まで 18ヶ月〜2年・700〜1,000㎡・8,000-12,000 万円・20-30%・予定利回り数%台・1〜4円）も出典が無いが、市場規模ではないので (9)-1 に回した。
9. **例外 0**: 便 2(c)「ビルド後の HTML: `eic-jp.org/contact` への `href` が全部 `utm_source=bess-net` を持つこと（例外 0）」は、microCMS の news 2 レコードの本文にリンクがあり、書込 0 のままでは満たせなかった。描画時に href だけ UTM を足す関数で満たした（表示の文字は不変）。
10. **同じタブで移るリンク**: LP の相談のボタンは next/link で描画され、同じタブで移る（`target="_blank"` なし）。GA4 の gtag は beacon で送るので数えられる。gtag の身代わりで発火までは確かめたが、GA4 への着地は確かめていない。
11. **/ops/freshness**: 便 (c) の洗う所は「コード全体」。/ops/freshness（noindex・robots で Disallow・サイト内リンクなし・素 URL では 200）の「担当」列に役名が人として出ていたので、列の描画をやめた。運用で要るなら、裁定で戻せる（データは残してある）。
12. **10 年運営の数**: 「10 年運営」の類は、見える本文で 9 種（LP 共通の CTA は 11 ページに出る）に、meta description 1 か所を足した数だった。

---

## (8) 申告・一時物

- **停止条件**: `rm`・`rmdir`・`Remove-Item` は発行していない。`git push --force` もしていない。`.env.local` は読み込んで使っただけで、内容は表示していない。
- **microCMS**: 書込 0。GET は次の 3 つだけ（どれも書込 0・間隔 300ms 以上）。
  - 役名の走査: 全 API を全件
  - 相談リンクの走査: 9 API・54 リクエスト
  - 次の一歩便の下調べ: 解説 13 本
- **30 分監視の遅れ**: 本来は e68e4e2 の Vercel success（10/17 21:52）の 30 分後に取るべきだった。セッションが調べ役の利用上限で止まり、取れなかった。2026-10-20 08:45 に素 URL で取り直した（(5)）。microCMS からの警告メール・EDAさんからの連絡の有無は、CC からは確認できない。
- **scratchpad の外に作ったもの**（消していない）:
  - 洗い出しの調べ役の 1 本が、`C:/Users/kenji/AppData/Local/Temp/g3_p…`（`git show HEAD:src/app/page.tsx` の出力）を作った（調べ役の申告）。
  - 私も `/tmp/x`（Git Bash の /tmp＝`C:\Users\kenji\AppData\Local\Temp\x`。`git show HEAD:src/app/projects/page.tsx` の出力）を作った。
- **一時物**（scratchpad の `ent1017/` の下・消していない）:
  - 本番の取得物 `prod/`・`prodA/`・`prodA_links/`・`prodB/`・`prodB_links/`
  - 変更前の写し `before/`
  - 編集・検査のスクリプト `tools/`（調べ役・レビュー役が作ったものを含む）
  - `scout.json`・`review1.json`・`lp_changes.json`・`diff_brief.patch`・`files_mod.txt`・ビルドのログ 3 本・表の断片
- **編集の失敗**（3 回）: 編集用のワンライナーが、クォート・改行（CRLF）・Python のエスケープの誤りで止まった。どれも書込の前に止まり、リポの変更は 0。
- **ローカルの next start**: 375px の確認のために、内蔵ブラウザで `next start`（`.claude/launch.json` の next-start）を起動し、確認の後で止めた。
- **並行**: 同じ時間帯に、売買事例の研究便（読取のみ）と次の一歩便の下調べ（読取のみ）を走らせた。どちらも push・書込なし。
- **訂正履歴の id**: 20261017-03・-04。-05 として作った /seller/developer の分を、公開前に -04 へ詰めた。

---

## 訂正履歴（便 (j)）

**足した 2 件**（`src/data/corrections.json`・本番の `/corrections` と各ページの記事末に表示）:

| id | ページ | 直す前 | 直した後 |
|---|---|---|---|
| 20261017-03 | /buyer/investor | 導入文に「国内の蓄電所投資は1兆円超、市場急拡大のなかで投資判断を支援します。」、課題欄に「市場規模1兆円超・300GWh級の拡大局面における出口の考え方も整理。」と記載（出典の記載なし） | どちらの数値も、裏づけとなる一次資料を確認できなかったため、この 2 つの文を削除しました |
| 20261017-04 | /seller/developer | よくある質問「プロジェクトデベロッパー向けの主な支援内容は?」の答えに、SPC スキーム設計の助言を顧問チーム（公認会計士ほか）に相談できると記載（出典の記載なし） | 記載の顧問チームを確認できず、公認会計士が在籍するという裏づけも無いため、この文を削除しました |

**載せなかったもの・載せる候補**（ユウの裁定待ち）:

| 是正 | 扱い | 理由 |
|---|---|---|
| /buyer/factory-commercial の FAQ「最新の事例では年間 20-30% の電気代削減 + 容量市場収益が報告されています。」の削除 | **候補**（h1 の裁定と一組で） | 同じページの h1「工場・商業施設の電気代を、蓄電池で 20-30% 削減する」が残っている（迷うもの）。訂正を先に載せると、出典の無い数として消した数字と同じ数字が見出しに残る（レビュー C1・R8） |
| ツールに無い機能を書いた文の削除。/buyer/capacity-market（容量市場ツールの条件チェック・稼働率シミュレーション）・/buyer/balancing-market（運転計画の最適化）・/buyer/ppa-offtake（当ページのデータで影響度試算）・/seller/reuse-secondhand（参入可能性試算・データ欄で継続把握） | **候補** | 公開済みの記述の是正だが、外部の一次は無い（根拠は当サイトのツールそのもの）。basis 0 本の 2 型に当たらないので、型の追加をユウが裁定してから（レビュー C2・C5） |
| 「10 年運営」→「2015 年設立」 | 載せない | 言い方の統一（2015 年設立なので「10 年」は誤りとまでは言えない） |
| 過ぎた「公開予定」・予告・符号の削除 | 載せない | 時間の経過による更新（締切の追随と同じ型） |
| 件数の自動化（403社・540社超・540+・8,225） | 載せない | 更新 |
| 404 の Insight カード 2 枚・「迅速に対応いたします」・題名の二重・「決定版」 | 載せない | 表示の整理・言い方 |

---

## (9) 迷うもの（ユウの裁定待ち）と範囲外の所見

### (9)-2 直した後にも残る迷う点（レビューで実在とされたもの）

1. **公開済みの 2026 年版に「機会」が残る**（レビュー R2・反証 2/2）。逐語:
   - 売り手 4 ページ共通の FAQ「[業界レポート2026](/reports/2026)本編での引用・掲載、[火災事例DB](/incidents)やInsight記事での取材機会をご用意。」
   - /seller/manufacturer「蓄電所ネットの[業界レポート 2026](/reports/2026)でのメーカー引用機会。」「[業界レポート 2026](/reports/2026)で、メーカー製品の引用枠あり。技術仕様・市場シェア・実績数値の中立的な引用、メーカー側の事前確認可能。」
   - /seller/epc「…を[業界レポート 2026](/reports/2026) + 案件 DB で可視化機会。」
   - /seller/reuse-secondhand「[業界レポート 2026](/reports/2026)、[火災事例 DB](/incidents)、Insight 記事でリユース事業者の事例掲載機会あり。」
   - /seller/developer「業界レポート、Insight 記事、案件 DB でデベロッパー実績の掲載枠あり。」

   /reports/2026 は 7 月公開の固定の 10 章で、引用枠・掲載枠・メーカーの事前確認にあたる記述は無い。案 1 は「機会・枠・事前確認」の節だけを外す。案 2 はそのまま残す。
2. **「案件 DB」の行き先**（R4）: /seller/epc の課題欄と /seller/developer の FAQ。案 1 は /operators/aggregators へのリンクの文（便の対応づけ）。案 2 は /projects へのリンク。案 3 は「案件 DB」の語を外す。
3. **リンクの文と行き先の中身**（R5）:
   - /seller/epc の FAQ「Q. メーカー製品の比較情報は?」の答えが「[メーカー DB](/operators/makers)で、EPC 事業者の機材選定支援。」。メーカー一覧に製品・比較の情報は無い。問いと答えの組ごと外すかどうか。
   - /seller/reuse-secondhand の「[火災事例 DB](/incidents)で安全性ガイダンス + リユース固有のリスク管理。」。/incidents に「リユース」は 0 件。
4. **問いと答えが合わない FAQ**（R7）:
   - /seller/reuse-secondhand「Q. リユース蓄電池事業の市場規模は?」の答えが、出典の無い見込み 1 文だけになった。
   - /seller/manufacturer・/seller/epc「Q. 取材・寄稿の機会は?」から寄稿の文が消えた。
   - /seller/developer「Q. 補助金・税制優遇の最新情報は?」に、税制への答えが無い。
   - /seller/developer の課題カードの説明が、題の言い直し 1 文だけになった。
5. **/buyer/factory-commercial の h1「20-30% 削減する」**（R8・C1）: 訂正履歴の候補と一組で裁定してほしい（上の「訂正履歴」）。
6. **/ops/freshness の担当列**: 運用で要るなら戻す（(7)-11）。

### (9)-4 範囲外の所見（26 ページの外・直していない）

- /milestones/2026-05-22-feature-complete・/milestones/2026-06-11-vip-citation に「eic-jp.org (運営窓口、10 年実績)」「eic-jp.org（運営窓口・10 年実績）」。同じファイルに社内の語（Phase D・L-EIC-008・case A など）も残る。READY のサイトの歩み便の範囲。
- /tools「※ ツール群は Sprint 3 以降で順次拡充予定。」（社内の語・過ぎた予定）。
- /incidents「原則48時間以内に対応します」（約束の言葉）。
- /tracker のカード「事業者ナビ (540+社)」「(8,200+ 件)」、/industry「事業者 (540+)」「変電所8,200+」。/tracker/ag は 577 社になったので、親ページと食い違う。
- 共通フッター「マーケットデータ (29 系列)」。/dashboard/market の本文は 31 系列で、数が違う。フッター向けの軽い出どころは無い。
- LP 11 本の og:title からサイト名が消えた（題名の二重を直したため）。LP の openGraph に `siteName` を足すかどうか。
- `src/lib/site-counts.ts` の `GRID_COMPANY_COUNT` と `/reports/2026` の `SUBSTATION_AREA_COUNT` が同じ式を 2 か所で計算している（値は 10 で一致・#121）。後の便で寄せる。
- microCMS の役名の走査で、人として出ていたのは news `pr-2025-06-11-co55631-143` の本文「代表取締役：コウ ユウ」だけ。社外の実在の人の名前で、社内の役名ではない（直さない）。
- `src/lib/sop-schedule.ts` の persona（担当）は、コードには残っている（画面には出ない）。

### (9)-1 迷うもの（洗い出しで「迷う」とされ、直していないもの・58 件）


| # | ページ | 記号 | 見える本文（逐語） | 出どころ | 案 |
|---|---|---|---|---|---|
| 1 | /contact/buyer・/contact/seller・/contact/media・/contact/investor・/contact/advisor（共通部品 ContactPageLayout） | f | お問い合わせフォームはエネルギー情報センター（eic-jp.org）が管理・運営しています。 内容確認後、担当者よりご連絡いたします（平日 10:00–18:00 目安）。 | `src/components/ContactPage/ContactPageLayout.tsx:125` | 迷うもの（ユウの裁定）。案1: 残す（時間帯の目安で、返信の早さの約束ではない）。案2: 括弧「（平日 10:00–18:00 目安）」だけ外す |
| 2 | /contact | f | ご回答は平日 10:00〜18:00 を目安にしています。内容によっては回答にお時間をいただく場合があります。 | `src/app/contact/page.tsx:179` | 迷うもの（ユウの裁定）。案1: 残す。案2: 箇条書きのこの 1 項目を外す |
| 3 | 全ページ共通のフッター（担当 10 ページすべてに出る） | e | マーケットデータ (29 系列) | `src/lib/site-config.ts:94` | 迷うもの（ユウの裁定）。フッターは担当 26 ページの本文ではないが、入口ページに出る手書きの件数。いまの値は /dashboard/market の「METI 12 + Fuel 7 + Finance 10 = 29 系列」と合っている。自動にするなら /dashboard/market の系列の定義から数える |
| 4 | /contact/seller | a | データ連携・API提供に関するご相談 自社データや公開情報を蓄電所ネットと連携したい場合のご相談を受け付けています。 | `src/data/contact-pages-configs.ts:128` | 迷うもの（ユウの裁定）。日付つきの予告ではない。ただ「API提供」は出ていない機能を思わせる。外すなら見出しの「・API提供」の語だけを外す（説明文は残す） |
| 5 | /buyer/new-entry | i | そもそも儲かるのか・事業性が読めない JEPX＋容量市場＋需給調整＋長期脱炭素オークションの「積み上げ型(レベニュースタッキング)」収益構造を実データで把握。高圧2MW/8MWhで初期5〜6億円が目安、収益は電力市場取引の巧拙で変動。 | `src/data/landing-page-configs.ts:572` | 出典が無いので文ごと外す候補（ページにも台帳 src/data/source-documents.json にも、この費用の出典が無い） |
| 6 | /buyer/new-entry | i | Q. 系統用蓄電池の初期費用と回収期間の目安は?+ 高圧の代表例(出力2MW・容量8MWh)で初期5〜6億円が目安。収益は電力市場取引の巧拙で変動し回収年数も幅があります。IRRシミュレーターで自案件の前提を入れて試算できます。 | `src/data/landing-page-configs.ts:644` | 出典が無いので文ごと外す候補。外すと問いの「目安は?」への答えが無くなるので、問いと答えの組ごと外すかもユウの裁定 |
| 7 | /buyer/new-entry | i | 接続検討に18ヶ月〜2年・接続負担金 接続検討の集中で申請が殺到、接続まで18ヶ月〜2年・想定以上の接続負担金が発生する例も。系統空き容量(/grid)で周辺の余力と立地適性を先に確認。 | `src/data/landing-page-configs.ts:578` | 出典が無いので文ごと外す候補。同じ数字が painPoint の見出し（576 行「接続検討に18ヶ月〜2年・接続負担金」）と FAQ（649 行）にもある |
| 8 | /buyer/investor | i | 収益のブレ(市場依存)とリスク評価 蓄電池・VPPは高単価商品(三次②等)で「当たれば」単価が桁違い、ただし約定は稀。揚水は1〜4円の基準線。蓄電池109.43/VPP46.24/揚水0.72(三次②FY2024・円/ΔkW・30分／EPRX公表の月次値から当サイト集計)＝約152倍の二極構造をデータで把握。 | `src/data/landing-page-configs.ts:694` | 出典が無ければ文ごと外す候補。続く 3 値と倍率は catalog から出ていて出典（EPRX 公表の月次値から当サイト集計）がついているので残す |
| 9 | /buyer/investor | i | 利回りの相場観・実態がつかめない 融資型ファンドで予定利回り数%台、エクイティ/表面では高めをうたう案件もあるが変動が大きい。実データと収益構造で相場観を補正。 | `src/data/landing-page-configs.ts:688` | 出典の無い数として外すか、具体の数ではないので残すかの裁定（FAQ 777 行「融資型ファンドで予定利回り数%台、…」も同じ） |
| 10 | /buyer/investor | f | 総収益は「単価×自社入札量×落札率」で、約定の希少性を必ず織り込む(過大評価を避ける)。／FAQ: 総収益は「単価×自社入札量×落札率」で、約定の希少性(低い約定率)を必ず織り込んでください。 | `src/data/landing-page-configs.ts:700` | 残す案（読者への注意で、当方の約束ではない）。ユウの確認だけ |
| 11 | /buyer/landowner | i | 蓄電所の用地条件(目安700〜1,000㎡・高圧線が近い・大型車の搬入路)、…／目安は700〜1,000㎡、近くに高圧線、大型トレーラーの搬入路(幅6〜8m)、住居から一定距離など。／FAQ: 目安として面積700〜1,000㎡程度、近くに高圧線、大型トレーラーの搬入路(道路幅6〜8m以上)、… | `src/data/landing-page-configs.ts:821` | 出典が無い数として外すか、用地条件の目安として残すかの裁定。外すと用地ページの主旨が抜ける |
| 12 | /buyer/factory-commercial | i | 工場・商業施設の電気代を、蓄電池で 20-30% 削減する | `src/data/landing-page-configs.ts:95` | 出典の無い数。h1 なので文ごと外すとヒーローの見出しが無くなる。外すか・数を抜くかはユウの裁定（言い換えはしない決まり） |
| 13 | /buyer/factory-commercial | i | Q. 初期費用と回収期間はどれくらいですか?+ 規模・用途により異なりますが、500kWh クラスで初期費用 8,000-12,000 万円、補助金活用後の回収期間は 7-12 年が目安です。IRR シミュレーターで具体的な試算が可能です。 | `src/data/landing-page-configs.ts:182` | 出典が無いので文ごと外す候補。外すと問いへの答えが無くなるので、問いと答えの組ごと外すかの裁定 |
| 14 | /buyer/factory-commercial | other | ★ 当サイト独自・無料 火災リスク自己診断 設置検討中の蓄電池の火災リスクを自己診断。UL9540A / NFPA855 準拠。 使ってみる → | `src/data/landing-page-configs.ts:159` | 「UL9540A / NFPA855 準拠。」を外す候補（ツール側 src/app/tools/fire-risk-check/page.tsx:11 は「UL9540A / NFPA 855 / 消防法 は参考」と書いており、「準拠」は言い過ぎ） |
| 15 | /buyer/capacity-market | b | ★ 当サイト独自・無料 容量市場入札ツール 容量市場の入札価格を試算。最新の約定価格・落札枠を反映、Backfill 5 年分データで傾向分析。 使ってみる → | `src/data/landing-page-configs.ts:270` | 「Backfill 5 年分データで傾向分析。」を外す候補（「Backfill」はデータ取り込みの社内の言い方。ツールに「傾向」の機能も無い・「5 年分」も手書き） |
| 16 | /buyer/capacity-market | i | Q. 容量市場の今後の見通しは?+ 日本のエネルギー基本計画では 2030 年までに蓄電池容量を大幅拡大予定。容量市場の枠も連動して拡大見込み。最新動向は当ページのデータセクションで継続更新します。 | `src/data/landing-page-configs.ts:314` | 出典（エネルギー基本計画の版・該当箇所）がページにも台帳にも無いので文ごと外す候補。外すと答えがほぼ無くなるので、問いと答えの組ごと外すかの裁定 |
| 17 | /buyer/capacity-market | f | 最新動向は当ページのデータセクションで継続更新します。 | `src/data/landing-page-configs.ts:314` | 文ごと外す候補（データ欄は data.eic-jp.org への外部リンクのカード 4 枚だけで、このページで更新する仕組みは無い＝更新の約束） |
| 18 | /buyer/capacity-market | other | OCCTO 運営の容量市場は蓄電池事業者にとって kW 価値 (容量提供) による安定収益源。最新の約定価格・落札枠・参入条件をリアルタイムで把握、IRR シミュレーションで投資判断を支援します。 | `src/data/landing-page-configs.ts:213` | 「リアルタイムで把握」は言い過ぎ（メインオークションは年 1 回・ページはリンクのみ）。外すかはユウの裁定（言い換えはしない決まり） |
| 19 | /buyer/balancing-market | a | データ出典 需給調整市場 一次調整力 約定価格 → EIC Data で詳細 | `src/data/landing-page-configs.ts:361` | 行き先が 404。実在する catalog へ直す（候補 https://data.eic-jp.org/catalog/balancing-primary-price＝ではなく balancing-price-primary・HTTP 200）か、カードごと外すかの裁定 |
| 20 | /buyer/balancing-market | a | データ出典 需給調整市場 三次調整力② 約定価格 → EIC Data で詳細 | `src/data/landing-page-configs.ts:366` | 行き先が 404。実在する catalog へ直す（候補 balancing-price-tertiary-2・HTTP 200）か、カードごと外すかの裁定 |
| 21 | /buyer/balancing-market | f | Q. 9 エリア別の参加判断は?+ エリア別に需要規模・約定価格・電源構成が異なります。北海道・東北は再エネ変動が大きく調整力需要高、九州は太陽光抑制対応で調整力需要急増。最新動向は当ページデータセクションで継続更新。／Q. 今後の需給調整市場の見通しは?+ …最新の市場動向は当ページデータセクション + Insight 記事で継続更新します。 | `src/data/landing-page-configs.ts:415` | 2 文とも外す候補（データ欄は外部リンクのみ・更新の約束） |
| 22 | /buyer/balancing-market | other | ★ 当サイト独自・無料 火災リスク自己診断 需給調整市場参加に向けて設置検討中の蓄電池の火災リスクを自己診断。UL9540A / NFPA855 準拠。 使ってみる → | `src/data/landing-page-configs.ts:397` | 「UL9540A / NFPA855 準拠。」を外す候補（ツール側は「参考」） |
| 23 | /buyer/ppa-offtake | a | ★ 当サイト独自・無料 IRR シミュレーター PPA・オフテイク契約価格を入力、為替・金利・燃料コスト変動シナリオでの IRR 感度分析。 使ってみる → | `src/data/landing-page-configs.ts:502` | 文ごと外す候補（IRR シミュレーターに PPA 価格・金利・燃料の入力が無い）。説明文が空になるので、カードの扱いはユウの裁定 |
| 24 | /buyer/ppa-offtake | a | ★ 当サイト独自・無料 容量市場入札ツール PPA + 容量市場の併用収益モデル試算。長期契約と短期市場収益のバランス最適化。 使ってみる → | `src/data/landing-page-configs.ts:508` | 文ごと外す候補（容量市場ツールに PPA の機能が無い）。説明文が空になるので、カードの扱いはユウの裁定 |
| 25 | /buyer/ppa-offtake | f | Q. 契約期間中の燃料コスト変動への対応は?+ 燃料費調整制度 (fuel adjustment clause) の契約への組み込み、LNG/原油/石炭インデックスへの連動、固定価格 + 燃料サーチャージ等の選択肢。当社で契約設計支援可能。 | `src/data/landing-page-configs.ts:542` | 外す候補（根拠の無いサービスの約束。運営は一般社団法人で「当社」とも合わない） |
| 26 | /buyer/* 7 ページ全部（共通部品。/seller/* 4 ページにも出る） | h | ★ 当サイト独自・無料（関連ツールの各カード。7 ページで計 22 回） | `src/components/LandingPage/LandingPageToolsLinks.tsx:55` | 「独自」は最上級の語（決定版・唯一・最大・No.1・日本一）ではないので残す案。外すかはユウの裁定 |
| 27 | /buyer/* 7 ページ全部（共通部品。/seller/* 4 ページにも出る） | f | 業界の関連 Insight data.eic-jp.org の業界中立 Insight。引用可能・常時更新。 | `src/components/LandingPage/LandingPageInsightCarousel.tsx:47` | 「常時更新」を外す候補（更新の約束。リンク先のうち 2 件は 404） |
| 28 | 全ページ共通のフッター（/buyer 7 ページで確認） | e | マーケットデータ (29 系列) | `src/lib/site-config.ts:94` | 手書きの件数。/dashboard/market の系列数から出すか、件数を外すかの裁定 |
| 29 | /seller/developer | a | 蓄電所立地の土地確保、地元自治体との連携、E-3 自治体条例 (11/21 公開予定) 情報の把握。 | `src/data/landing-page-configs.ts:1162` | 外す: 「、E-3 自治体条例 (11/21 公開予定) 情報の把握」（実在しない機能・(b) 符号 E-3 も同時に消える）。残りは「蓄電所立地の土地確保、地元自治体との連携。」 |
| 30 | /seller/developer | b | PPA・オフテイク契約相手 (Buyer 視点) の検討材料。デベロッパー視点での契約設計支援。 | `src/data/landing-page-configs.ts:1210` | 外す: 「 (Buyer 視点)」 |
| 31 | /seller/manufacturer・/seller/epc・/seller/developer・/seller/reuse-secondhand | b | まず事業者ナビ(/operators)への中立掲載、 | `src/data/landing-page-configs.ts:988` | 外す: 「(/operators)」の生パス（またはリンク文にする） |
| 32 | /seller/manufacturer・/seller/epc・/seller/developer・/seller/reuse-secondhand | f | 掲載相談はお問い合わせフォームから随時受け付けています。 | `src/data/landing-page-configs.ts:988` | 迷うもの: 「随時」が受付の約束に当たるか。外すなら「随時」だけ |
| 33 | /seller/developer | a | 業界レポート、Insight 記事、案件 DB (C-3 アグリゲーター、8 月公開) でデベロッパー実績の掲載枠あり。お問い合わせフォームから掲載相談可能。 | `src/data/landing-page-configs.ts:1243` | リンク文にする: アグリゲーター一覧（/operators/aggregators）。「C-3」「8 月公開」は書かない |
| 34 | /seller/epc | a | EPC 事業者の施工実績・案件規模・技術ノウハウを業界レポート 2026/2027 + 案件 DB (C-3 アグリゲーター、8 月公開) で可視化機会。 | `src/data/landing-page-configs.ts:1048` | リンク文にする: 業界レポート 2026（/reports/2026）とアグリゲーター一覧（/operators/aggregators）。「/2027」「C-3」「8 月公開」は書かない |
| 35 | /seller/epc | a | Q. 案件マッチング機能は提供されるか?+ / 当面は業界中立の情報提供に注力、案件マッチングは将来検討。但しお問い合わせフォーム経由でエンドユーザーとの接点機会あり。 | `src/data/landing-page-configs.ts:1112` | 迷うもの: 「将来検討」は出ていない機能の予告。組ごと外すか、「案件マッチングは将来検討。」だけ外すか |
| 36 | /seller/epc | a | 業界レポート、Insight 記事、AJ 火災事例 DB 等で取材機会あり。EPC 視点での技術ノウハウ、施工事例の寄稿枠を準備中。 | `src/data/landing-page-configs.ts:1117` | リンク文にする: 「火災事例 DB」（/incidents）。「AJ」は外す。「寄稿枠を準備中」の文は外すか迷う |
| 37 | /seller/epc | a | Q. メーカー製品の比較情報は?+ / メーカー DB (B-1、8/15 頃公開) + メーカー別スペック比較 (B-1 機能内) で、EPC 事業者の機材選定支援。 | `src/data/landing-page-configs.ts:1127` | メーカー DB はリンク文に（/operators/makers・「B-1」「8/15 頃公開」は書かない）。「+ メーカー別スペック比較 (B-1 機能内)」は外す（実在しない） |
| 38 | /seller/manufacturer | f | 技術仕様・市場シェア・実績数値の中立的な引用、メーカー側の事前確認可能。 | `src/data/landing-page-configs.ts:998` | 迷うもの: 事前確認の約束に当たるか。外すなら「、メーカー側の事前確認可能」 |
| 39 | /seller/manufacturer | a | Q. メーカー DB (8 月公開予定) への登録方法は?+ / メーカー DB は 8/15 頃公開予定 (B-1 機能)。製品スペック・価格レンジ・実績案件の登録枠を準備中。8 月初旬にメーカー向け登録案内を予定。 | `src/data/landing-page-configs.ts:1001` | 文ごと外す: 問いと答えの組ごと外す（メーカー DB は実在するが、問いの「登録方法」＝登録枠・登録案内は実在しない） |
| 40 | /seller/manufacturer | a | 業界レポート企画、Insight 記事、AJ 火災事例 DB 等で取材機会あり。技術担当者・経営層へのインタビュー、技術論文寄稿の枠を準備中。お問い合わせフォームからご相談ください。 | `src/data/landing-page-configs.ts:1013` | リンク文にする: 「火災事例 DB」（/incidents）。「AJ」は外す。「技術論文寄稿の枠を準備中」の文は外すか迷う |
| 41 | /seller/manufacturer | h | 市場規模・競合分布・技術トレンドを業界中立で提供し、業界レポート引用・事業者ナビ掲載でメーカーの可視性を最大化します。 | `src/data/landing-page-configs.ts:913` | 迷うもの: 「最大化します」は自称の最上級というより効果の約束。外すなら「でメーカーの可視性を最大化します」の言い切り |
| 42 | /seller/reuse-secondhand | a | 劣化曲線の実測データ不足 / G-1 劣化曲線実測データ (9/24 公開予定) で、メーカー別・使用条件別の劣化曲線を可視化。リユース価格設定の基礎データ。 | `src/data/landing-page-configs.ts:1272` | 文ごと外す: 説明（1272）の 2 文は全部実在しない機能 G-1。課題カード（icon 📉・題 1270）ごと外す |
| 43 | /seller/reuse-secondhand | a | Q. リユース蓄電池事業の市場規模は?+ / 日本の EV 普及に伴い、退役 EV 電池の蓄電池 2 次利用市場が 2026 年以降本格化見込み。G-1 劣化曲線実測データ (9/24 公開) + 業界レポート 2027 (12/25) で市場規模・成長率の詳細解説予定。 | `src/data/landing-page-configs.ts:1339` | 第2文は外す（G-1・業界レポート 2027 の予告）。第1文は出典の無い見込み（(i) 別項目）。両方外れると答えが空になるので問いと答えの組ごと外す |
| 44 | /seller/reuse-secondhand | i | 日本の EV 普及に伴い、退役 EV 電池の蓄電池 2 次利用市場が 2026 年以降本格化見込み。 | `src/data/landing-page-configs.ts:1339` | 出典が無ければ文ごと外す（ページにも台帳にも出典なし） |
| 45 | /seller/reuse-secondhand | i | 蓄電池リユース市場の急成長を、業界データで支援 | `src/data/landing-page-configs.ts:1256` | 迷うもの: 「急成長」は出典の無い市場の断定。数ではないので (i) に当たるか判断がつかない |
| 46 | /seller/reuse-secondhand | a | 市場規模・劣化曲線・収益モデルを業界中立で提供し、事業者ナビ掲載で買い手との接点を確保します。 | `src/data/landing-page-configs.ts:1258` | 迷うもの: 「劣化曲線」は出ていない機能（G-1）。外すなら「・劣化曲線」だけ。title（1252）と description（1254）の「劣化曲線」も同じ扱い |
| 47 | /seller/reuse-secondhand | a | 中古セルの調達コスト、再生検査・組み直し費用、販売価格、保証期間設計の最適化。業界実例集も提供。 | `src/data/landing-page-configs.ts:1278` | 迷うもの: 「業界実例集も提供。」は実在が確かめられない（src に「実例集」はこの 1 か所だけ）。外すなら文ごと |
| 48 | /seller/reuse-secondhand | other | リユース蓄電池の火災リスクを自己診断。UL9540A / NFPA855 準拠、リユース固有のリスク評価項目あり。 | `src/data/landing-page-configs.ts:1315` | 迷うもの: 「リユース固有のリスク評価項目あり」は事実と違う（src/data/fire-risk-checklist.ts に「リユース」「中古」の項目 0 件）。外すなら「、リユース固有のリスク評価項目あり」 |
| 49 | /seller/reuse-secondhand | other | リユース蓄電池を用いた自家消費・容量市場参入の収益試算。劣化曲線を考慮したライフサイクル分析。 | `src/data/landing-page-configs.ts:1321` | 迷うもの: IRR シミュレーターの劣化は「年 1% 容量低下 (下限 70%)」の固定（src/app/tools/irr-simulator/page.tsx:290）で、劣化曲線ではない |
| 50 | /seller/reuse-secondhand | other | データ出典 / EV 関連市場規模指標 (参考) / → EIC Data で詳細 | `src/data/landing-page-configs.ts:1289` | 迷うもの: 札は「EV 関連市場規模指標」だが、リンク先と指標は JEPX 東京スポット価格（jepx-spot-tokyo）。札と中身が違う |
| 51 | /seller/manufacturer・/seller/epc・/seller/developer・/seller/reuse-secondhand | b | Buyer に見つけてもらう — 掲載・取材のご相談 | `src/data/landing-page-configs.ts:914` | 迷うもの: 「Buyer」は社内の区分（buyer/seller）の言い方。外すかはユウの裁定 |
| 52 | 全ページ共通（担当ページすべてのフッター） | b | メーカー向け (Seller) / EPC 事業者向け (Seller) / プロジェクトデベロッパー向け (Seller) / 中古売買・リユース (Seller) | `src/lib/site-config.ts:111` | 迷うもの: 「 (Seller)」を外すか |
| 53 | /seller/manufacturer・/seller/epc・/seller/developer・/seller/reuse-secondhand（共通部品のため /buyer の 7 ページにも出る） | h | ★ 当サイト独自・無料 | `src/components/LandingPage/LandingPageToolsLinks.tsx:55` | 迷うもの: 「独自」は (h) の例（決定版・唯一・最大・No.1・日本一）には無いが自称に近い |
| 54 | /seller/manufacturer・/seller/epc・/seller/developer・/seller/reuse-secondhand（共通部品のため /buyer にも出る） | f | data.eic-jp.org の業界中立 Insight。引用可能・常時更新。 | `src/components/LandingPage/LandingPageInsightCarousel.tsx:47` | 迷うもの: 「常時更新」は更新の約束。外すなら「・常時更新」 |
| 55 | /anken・/anken/sell・/anken/flow・/anken/faq | f | A. お預かりした情報はお取り次ぎの目的の範囲でのみ扱い、しつこい営業は行いません。公開ページに住所・座標等の個別情報は掲載しません。 | `src/app/anken/page.tsx:193` | 迷うもの: 「しつこい営業は行いません」は行動の約束。(f) の例（迅速・すぐに・必ず・営業日）には当たらない |
| 56 | /anken | a | 対応エリア：全国（実例の掲載は中部から順次拡大中） ／ 下表・下記分布は中部エリアの抜粋例 | `src/app/anken/page.tsx:222` | 迷うもの: 「順次拡大中」は日付の無い予告。外すなら「（実例の掲載は中部から順次拡大中）」 |
| 57 | / | a | サイトの歩み・公開予定 → | `src/app/page.tsx:464` | 迷うもの: リンク文に「公開予定」がある。サイトの歩み便の範囲かもしれない |
| 58 | 全ページ共通（担当ページすべてのフッター） | e | マーケットデータ (29 系列) | `src/lib/site-config.ts:94` | 迷うもの: 手書きの件数。自動にするか、件数を外すか |
