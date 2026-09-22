# Ck-1a 追修便 実行結果 — 2026-09-22

> 依頼: Ck-1a（実在しないレコードの非表示・小修正・承認済み PATCH）。参照: `reports/ck1-approval-2026-09-21.md`・同 `.data.json`（行 id で指示）。
> commit: **f6cd6cb**（■1 非表示）→ **615089d**（■2 小修正・PATCH スクリプト）→ **bce4b51**（■3 反映・非表示 2 件追加・ログ）→ 本報告は別 commit。microCMS は PATCH のみ（POST／PUT／DELETE なし）。デプロイ: f6cd6cb 10:32:39Z・615089d 12:00:36Z・bce4b51 12:11:10Z（いずれも Vercel success）。
> 調査・PATCH 計画はワークフロー（計画 6 本＋反証 4 本）で並列に作り、反証役が 1 件ずつ live の GET と一次で検証した。METI／エネ庁はブラウザで 1 件ずつ実測（PDF には遷移していない）。

## 要約

| 項目 | 結果 |
|---|---|
| ■1 非表示 | 補助金 18・事業者 4・links 12（■1-2 の 5・■3-6/3-7 分を ■1 で先に 5・■3 段階で 2 追加）・policy-events 43（Ck-1 の 1＋(a) 19＋(b) 23）・事故 1。取得の共通関数で外し、一覧・詳細（404）・件数・sitemap・JSON-LD・precompute が同時に揃う |
| ■2・■3 PATCH | 計画 194 件 → 適用 188（うち richEditor の正規化 2）・HTTP 400 1（変更なし）・未実行 5（links.url は必須項目で空にできない→非表示で代替）。#106 は全適用で対象外フィールドの変化 0。再実行で全件 skip＝二重適用なし |
| ■2 コード | 基準日の頭打ち（JEPX の明日の日付が「最新日」に出ていた）・件数の焼き込み撲滅（544・210・50）・9 エリア・LCOE の火力/原子力・停止条件（CLAUDE.md） |
| 本番 | 素URL curl で除外 id・名称 0（DOM／JSON-LD とも）・除外詳細は 404。■2 の各文言も反映（§4） |

## (1) 除外リスト（id と理由）

非破壊（microCMS は削除しない）。理由の行 id は承認表のもの。

### 補助金 18 件 — `src/data/subsidies-excluded.ts`（新設）

取得の共通関数 getAllSubsidies・getSubsidyBySlug・getAllSubsidySlugs で外す（precompute の subsidies.json 85→67 件・詳細 404・補助金マッチ・sitemap・業界マップのリンク・/industry の最新更新）。

| slug | 名称（レコード） | 行 id | 理由 |
|---|---|---|---|
| hyogo-energy-storage-2026 | 兵庫県 産業用太陽光・蓄電池支援事業 | §0-1 hyogo-energy-storage-2026 | 兵庫県の支援制度一覧に同名制度なし。近い非住宅太陽光補助は 1/3・上限 3,000 万円と一致しない |
| kawasaki-decarbonization-2026 | 川崎市 自家消費型太陽光・蓄電池補助金 | §0-1 kawasaki-decarbonization-2026 | 川崎市の事業者向け補助に 2/3・上限 2,000 万円の制度なし |
| kobe-sme-decarbonization-2026 | 神戸市 中小企業脱炭素化補助金 | §0-1 kobe-sme-decarbonization-2026 | 神戸市環境局の補助一覧に該当制度なし。近い経済観光局の制度は令和 4 年に受付終了で所管・率とも不一致 |
| nagoya-bess-2026 | 名古屋市 産業用蓄電池導入補助金 | §0-1 nagoya-bess-2026 | 名古屋市の補助一覧に産業用蓄電池の単独補助なし。担当部署名も不一致 |
| yokohama-self-consumption-2026 | 横浜市 産業用太陽光・蓄電池導入補助金 | §0-1 yokohama-self-consumption-2026 | 横浜市の令和 8 年度制度一覧（23 制度）に 1/2・上限 1,500 万円の制度なし |
| chiba-bess-support-2026 | 千葉県 産業用蓄電池導入支援補助金 | §0-1 chiba-bess-support-2026 | 千葉県の事業用支援制度一覧に該当なし。記録の「産業労働部」は実在しない（実際は商工労働部） |
| fukuoka-bess-2026 | 福岡県 蓄電池導入支援事業 | §0-1 fukuoka-bess-2026 | 福岡県商工部に「新産業振興課」なし。同名の県制度なし |
| gunma-bess-2026 | 群馬県 蓄電池導入支援補助金 | §0-1 gunma-bess-2026 | 群馬県産業経済部に「エネルギー政策課」なし。該当制度なし |
| hiroshima-bess-support-2026 | 広島県 産業用蓄電池支援補助金 | §0-1 hiroshima-bess-support-2026 | 広島県イノベーション推進チームに蓄電の記載なし。該当制度なし |
| hokkaido-renewable-2026 | 北海道 再生可能エネルギー導入加速化補助金 | §0-1 hokkaido-renewable-2026 | 北海道の令和 8 年度新エネ補助 8 事業に同名・1/3・系統用蓄電池対象の事業なし |
| ibaraki-decarbonization-2026 | 茨城県 中小企業脱炭素化補助金 | §0-1 ibaraki-decarbonization-2026 | 茨城県の助成・支援金一覧と産業政策課ページに該当制度なし |
| kagoshima-solar-bess-2026 | 鹿児島県 太陽光・蓄電池併設支援 | §0-1 kagoshima-solar-bess-2026 | 鹿児島県の実在 2 制度とも上限・所管が不一致。該当制度なし |
| nagano-self-consumption-2026 | 長野県 自家消費型太陽光・蓄電池補助金 | §0-1 nagano-self-consumption-2026 | 長野県の再エネ補助金一覧に事業者向け 1/2・上限 1,500 万円の制度なし |
| oita-bess-2026 | 大分県 系統用蓄電池導入支援 | §0-1 oita-bess-2026 | 大分県の事業者向け補助一覧に系統用蓄電池の制度なし。所管も不一致 |
| okinawa-island-energy-2026 | 沖縄県 離島電力安定化補助金 | §0-1 okinawa-island-energy-2026 | 沖縄県に「離島電力安定化補助金」は存在しない |
| saitama-decarbonization-2026 | 埼玉県 中小企業脱炭素化支援補助金 | §0-1 saitama-decarbonization-2026 | 同名制度なし。旧 URL の a0509 ディレクトリも県サイトに存在しない |
| shizuoka-bess-2026 | 静岡県 産業用蓄電池導入補助金 | §0-1 shizuoka-bess-2026 | 静岡県の補助制度一覧に同名制度なし。産業政策課は補助事業を持たない |
| regional-bank-green-loans | 地方銀行のグリーンローン（北海道・東北・北陸・中国・四国・九州エリア） | §0-1 regional-bank-green-loans | 単一の制度ではなく各地銀のグリーンローンの総称。出典の全銀協ページは存在した形跡がない |

### 事業者 4 件 — `src/lib/operators-excluded.ts` の HIDDEN_OPERATORS

既存ファイル（301 元の除外）に「非表示」の区分を足した。getAllOperators・getOperatorBySlug・getAllOperatorSlugs・用語検索・関連事業者・本文の自動リンクで外す（詳細 404・件数は一覧と同じ 574）。

| slug | 名称（レコード） | 行 id | 理由 |
|---|---|---|---|
| octa | OCTA Holdings | §0-3 operators/octa.sourceUrl | 出典・公式サイトの両ドメインとも名前解決できず、該当企業が見つからない |
| smile-energy | スマイルエナジー株式会社 | §0-3 operators/smile-energy.sourceUrl | ドメインは名前解決できずアーカイブもない。社名・設立年・本社所在地に一致する企業なし |
| kepco-power | 関西電力エネルギーソリューション株式会社 | §0-3 operators/kepco-power.sourceUrl | 「関西電力エネルギーソリューション株式会社」という商号を確認できない（近い Kenes は設立年・事業が異なる） |
| ses-japan | SES Smart Energy Services Japan株式会社 | §0-3 operators/ses-japan.sourceUrl | ドメインは名前解決できず、該当企業も SAP SE の子会社とする記述の裏付けもない |

### links 12 件 — `src/lib/links-excluded.ts` の HIDDEN_LINKS

既存の jepx-prices（統合＝200＋noindex）とは区分を分け、非表示は取得層で外して詳細 404 にした（実在しない団体・閉鎖したサイトのカードを見せ続けないため）。

| slug | タイトル（レコード） | 行 id | 理由 | 投入 |
|---|---|---|---|---|
| nedo-roadmap | NEDO ロードマップ | §0-2 links/nedo-roadmap.url | NEDO サイト上の掲載ページはすべて 404。旧 URL もアーカイブ記録なし | ■1（f6cd6cb） |
| engadget-energy | Engadget Japan エネルギー | §0-2 links/engadget-energy.url | エンガジェット日本版は 2022-05-01 にサイト閉鎖。転送先の米国版は英語の総合テックサイト | ■1（f6cd6cb） |
| esaj-japan | ESAJ 蓄電システム工業会 | §0-2 links/esaj-japan.url | 「蓄電システム工業会（ESAJ）」が実在する一次の痕跡なし。ドメインも名前解決できない | ■1（f6cd6cb） |
| news2u | News2u Net | §0-2 links/news2u.url | News2u.net は 2020-06-30 でサービス終了 | ■1（f6cd6cb） |
| pv-magazine-jp | PV Magazine Japan | §0-2 links/pv-magazine-jp.url | pv magazine の公式エディション一覧（12 サイト）に日本版・.jp サイトなし | ■1（f6cd6cb） |
| nagoya-env | 名古屋市 環境局 | §0-2 links/nagoya-env.url | 差し替え案（環境局トップ）は主題が異なり反証。作り直しは Ck-2 | ■1（f6cd6cb） |
| chiba-env | 千葉県 環境政策 | §0-2 links/chiba-env.url | 差し替え案（環境の親カテゴリ）は主題が異なり反証。カード名の変更を含む作り直しは Ck-2 | ■1（f6cd6cb） |
| climate-group-jp | Climate Group Japan | §0-2 links/climate-group-jp.url | 差し替え案は RE100 のみのページで反証。Climate Group の日本支部は一次で確認できず | ■1（f6cd6cb） |
| kyoto-env | 京都市 環境政策 | B3 https://www.city.kyoto.lg.jp/kankyo/ | /kankyo/ はページとして存在しない（403）。現行は局の組織一覧で説明文の「脱炭素支援情報」ではなく同定できず（url は必須項目のため空にできない） | ■3（bce4b51） |
| drimo-japan | Drimo | B3 https://drimo.jp/ | drimo.jp は apex に A レコードが無く記事が引けない（死） | ■1（f6cd6cb） |
| natural-power-jp | ナチュラルパワー | B3 https://natural-power.jp/ | HTTPS はサーバ側が TLS alert 80 で握手を拒否（死） | ■1（f6cd6cb） |
| occto-data | OCCTO 公開資料 | A11-2-07 | url が 404 で同一内容の現行ページを同定できず（url は必須項目のため空にできない） | ■3（bce4b51） |

### policy-events 43 件 — `src/lib/events-excluded.ts`

取得の共通関数 getAllEventsRaw で外す（/events・/policy-calendar・トップ・sitemap・JSON-LD）。
(b) は commit 1afdba9 の `scripts/ac-industry-events-drafts.json`（40 件）を機械抽出: 40 件すべて policy-events に残存、うち sourceUrl がドメインのトップだけのもの 34 件 → (a) と重なる 9 件・Ck-1 A4 の 1 件を除く 24 件。**energy-storage-summit-eu-2026 は ■3-1 で公式サイトへの差し替えが承認済み（一次で 2026-02-24〜25・InterContinental London を確認）のため非表示にせず PATCH した → (b) は 23 件。**
energy-basic-plan-7-2024-12: METI 2025-02-18「第7次エネルギー基本計画が閣議決定されました」（https://www.meti.go.jp/press/2024/02/20250218001/20250218001.html ・ブラウザ 200）で、閣議決定は 2025-02-18・原案提示は 2024-12-17。レコードの 2024-12-26 はどちらとも合わない。

| 区分 | slug | eventDate | title（レコード） | 行 id | 理由 |
|---|---|---|---|---|---|
| Ck-1 A4 | jepx-capacity-market-explain-2026-06 | 2026-06-15 | JEPX 容量市場 第8回 メインオークション 説明会 | Ck-1 A4 | 一次で実在を確認できない（JEPX は容量市場を運営していない・日付/主催/形式が実在の説明会と不一致） |
| (a) | n1-control-bess-2024-04 | 2024-04-01 | N-1電制 蓄電所適用ガイドライン 公表 | §0-4 policy-events/n1-control-bess-2024-04 | OCCTO のガイドライン改定履歴に 2024 年 4 月の改定も蓄電所向け指針もない |
| (a) | occto-non-firm-pubcomm-2025-09 | 2025-09-01 | ノンファーム接続制度 詳細運用ルール パブコメ | §0-4 policy-events/occto-non-firm-pubcomm-2025-09 | OCCTO の意見募集一覧（145 件）に 2025 年のノンファーム関連案件なし |
| (a) | non-firm-bess-extension-2025-04 | 2025-04-01 | ノンファーム型接続 蓄電所拡大適用 開始 | §0-4 policy-events/occto-non-firm-pubcomm-2025-09（同行の 2 件目） | 2025 年 4 月の蓄電所への本格適用を裏付ける一次なし（系統用蓄電池は暫定対策の記述のみ） |
| (a) | occto-balancing-market-explain-2025-12 | 2025-12-10 | OCCTO 需給調整市場 制度改定 説明会（2025年12月） | §0-4・A11-2-19 | OCCTO 新着（2,585 件）の 2025-11-15〜2026-01-10 に OCCTO 主催の需給調整市場説明会は 0 件 |
| (a) | balancing-market-tertiary-2-2025-04 | 2025-04-01 | 需給調整市場 三次調整力② 商品 本格運用開始 | A11-2-20 | 三次調整力②の開始は 2021 年 4 月で、記録の仕様も誤り |
| (a) | balancing-market-q1-2026 | 2026-01-04 | 需給調整市場 一次調整力（FCR）2026年第1四半期商品 募集開始 | A11-2-21 | 需給調整市場に「四半期商品」は存在しない。仕様も誤り |
| (a) | occto-balancing-market-review-2026 | 2026-03-01 | OCCTO 需給調整市場 制度見直し議論 開始 | A11-2-22 | 「2026 年 3 月に制度見直し議論を本格開始」を裏付ける一次なし |
| (a) | balancing-market-secondary-2026-04 | 2026-04-01 | 需給調整市場 二次調整力①・② 2026年度商品 制度改定 | A11-2-23 | issuer を OCCTO とするのは誤り（市場運営者は EPRX）。記述の一部も裏付けなし |
| (a) | catl-energy-storage-japan-2026 | 2026-10-08 | CATL Energy Storage Japan Symposium 2026 | B0 policy-events/catl-energy-storage-japan-2026 | イベントに言及する情報は本サイトの /events だけで循環。CATL 公式に記載なし |
| (a) | japa-bess-seminar-2025-11 | 2025-11-15 | 蓄電池事業者協議会 第1回セミナー（2025年11月） | B0 policy-events/japa-bess-seminar-2025-11 | 協議会（BBA）は 2025-11-18 登記・第 1 回セミナーは 2026-08-31 で、記録と矛盾 |
| (a) | japa-annual-2026 | 2026-06-12 | 蓄電池事業者協議会 通常総会 2026 | B0 policy-events/japa-bess-seminar-2025-11（同行）・§0-4 AC Phase A | 総会は実際には 6 月 25 日で日付が異なる |
| (a) | japa-bess-seminar-2026-05 | 2026-05-20 | 蓄電池事業者協議会 第3回セミナー（2026年5月） | B0 policy-events/japa-bess-seminar-2025-11（同行） | 第 3 回（2026 年 5 月）の記録は一次と矛盾（第 1 回が 2026-08-31） |
| (a) | world-energy-storage-china-2026 | 2026-11-04 | World Energy Storage Conference China 2026 | B0 policy-events/world-energy-storage-china-2026 | 名称・主催・日程・会場が一致するイベントなし |
| (a) | kansai-energy-expo-2026 | 2026-11-19 | 関西エネルギーEXPO 2026 | B0 policy-events/kansai-energy-expo-2026 | 「関西エネルギーEXPO」という名称のイベントなし |
| (a) | re-expo-osaka-2026 | 2026-09-08 | 再エネEXPO 大阪 2026 | B0 policy-events/re-expo-osaka-2026 | 「再エネEXPO」という名称のイベントを確認できない |
| (a) | re-expo-tokyo-2026 | 2026-02-26 | 再エネEXPO 東京 2026 | B0 policy-events/re-expo-osaka-2026（同行） | 「再エネEXPO」という名称のイベントを確認できない |
| (a) | battery-supply-plan-approved-2024-09 | 2024-09-01 | 蓄電池供給確保計画 第1回認定（GSユアサ等4社） | B3 https://www.meti.go.jp/press/2024/09/20240901001/20240901001.html | sourceUrl の METI プレスは存在しない（403＋「指定されたページまたはファイルは存在しません」） |
| (a) | energy-basic-plan-7-2024-12 | 2024-12-26 | 第7次エネルギー基本計画 閣議決定 | B3 https://www.meti.go.jp/press/2024/12/20241226002/20241226002.html | 閣議決定は 2025-02-18（原案提示は 2024-12-17）。記録の 2024-12-26・sourceUrl ともに一次と合わない |
| (a) | meti-bess-industry-strategy-2024-11 | 2024-11-15 | 蓄電池産業戦略検討会 第1回 | B3 https://www.meti.go.jp/shingikai/sankoshin/sangyo_gijutsu/chikudenchi/ | sourceUrl の審議会ページは存在しない（403＋「指定されたページまたはファイルは存在しません」） |
| (b) | smart-energy-week-spring-2026 | 2026-03-04 | スマートエネルギーWeek 2026 春 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.wsew.jp/） |
| (b) | smart-energy-week-autumn-2026 | 2026-09-30 | スマートエネルギーWeek 2026 秋 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.wsew.jp/） |
| (b) | pv-expo-2026 | 2026-03-04 | PV EXPO 2026（太陽光発電展） | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.wsew.jp/） |
| (b) | battery-japan-2026 | 2026-03-04 | BATTERY JAPAN 2026 春（二次電池展） | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.bjapan.jp/） |
| (b) | battery-japan-autumn-2026 | 2026-09-30 | BATTERY JAPAN 2026 秋（二次電池展） | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.bjapan.jp/） |
| (b) | japan-energy-summit-2026 | 2026-06-30 | Japan Energy Summit & Exhibition 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.japanenergysummit.com/） |
| (b) | occto-non-firm-explain-2026-04 | 2026-04-22 | OCCTO ノンファーム接続 制度説明会（2026年4月） | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.occto.or.jp/） |
| (b) | meti-bess-roadmap-seminar-2026-06 | 2026-06-20 | METI 蓄電池産業政策 ロードマップ 2026 セミナー | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.meti.go.jp/） |
| (b) | jpea-annual-2026 | 2026-06-25 | 太陽光発電協会（JPEA）通常総会 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.jpea.gr.jp/） |
| (b) | jwpa-annual-2026 | 2026-06-18 | 日本風力発電協会（JWPA）通常総会 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://jwpa.jp/） |
| (b) | iee-annual-2026 | 2026-03-18 | 電気学会 全国大会 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.iee.jp/） |
| (b) | jser-symposium-2026 | 2026-08-27 | エネルギー・資源学会 シンポジウム 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.jser.gr.jp/） |
| (b) | nedo-battery-tech-2026 | 2026-11-12 | NEDO 蓄電池技術シンポジウム 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.nedo.go.jp/） |
| (b) | jses-symposium-2026 | 2026-11-04 | 日本太陽エネルギー学会 シンポジウム 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.jses-solar.jp/） |
| (b) | fluence-japan-launch-2026 | 2026-06-10 | Fluence Japan 市場参入記念カンファレンス | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://fluenceenergy.com/） |
| (b) | re-plus-usa-2026 | 2026-09-08 | RE+ 2026（米国最大の再エネ・蓄電池展示会） | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.re-plus.com/） |
| (b) | kyushu-renewable-expo-2026 | 2026-10-15 | 九州再エネ・蓄電池EXPO 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.kyukeiren.or.jp/） |
| (b) | tohoku-energy-expo-2026 | 2026-08-06 | 東北再エネ・蓄電池EXPO 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.tokeiren.or.jp/） |
| (b) | occto-long-term-decarbonization-explain-2026-09 | 2026-09-25 | OCCTO 長期脱炭素オークション 第4回 説明会 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.occto.or.jp/） |
| (b) | jeric-grid-stability-2026 | 2026-07-10 | JEPIC 系統安定化シンポジウム 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.jepic.or.jp/） |
| (b) | biomass-expo-2026 | 2026-12-09 | バイオマス・再エネ複合EXPO 2026 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.wsew.jp/） |
| (b) | hydrogen-fc-expo-2026 | 2026-03-04 | FC EXPO 2026（水素・燃料電池展） | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.wsew.jp/） |
| (b) | occto-area-supply-plan-2027 | 2027-03-15 | OCCTO 広域系統長期方針 2027 公表説明会 | §0-4 policy-events（依頼AC Phase A 初期データ） | AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない（sourceUrl https://www.occto.or.jp/） |

### 事故 DB 1 件 — `src/data/incidents.ts`

`hidden?: boolean` を新設し、moss-landing-2024 を `hidden: true`（削除しない）。表示は `VISIBLE_INCIDENTS` だけを数える（10→9 件・JSON-LD numberOfItems 9）。理由: 承認表 §0-4「2024-09-26 の Moss Landing 火災は確認できず、PG&E Elkhorn（2022-09-20）と Vistra（2025-01-16）の火災を混同。引用の EPA 資料も実在を確認できない」。moss-landing-2021・liverpool-2020・japan-undisclosed-policy は残した（一次は Ck-2）。

## (2) PATCH 前後表（#106 件別）

全文は `scripts/ck1a-patch-plan-2026-09-22.json`（根拠・一次の URL と逐語つき）と `scripts/ck1a-patch-log-2026-09-22.json`。
#106 = 前後で GET し、対象フィールドが意図どおり・他フィールドの変化 0。richEditor（explainer.body・glossary.detail・news.body）は素の文字列（marker）で判定（#122）。

結果の凡例: **ok**＝#106 ✓ ／ **ok-normalized**＝richEditor が `'` を `&apos;` に正規化（再 GET で to の素の文字列を確認・from 0）／ **400**＝links.url は必須項目で "" を拒否（変更なし）／ **未実行**＝同じ理由で実行せず非表示で代替。

### ■2-1・2-2（2 件）

| id | 所在 | op | 前 | 後 | 結果 |
|---|---|---|---|---|---|
| 2-1 | subsidies/shiga-energy-saving-2026.scheme | set | 蓄電池単体（発電設備と併設または既設発電設備に接続する場合に限る。） 【対象】中小企業者等であって滋賀県内に事業所等を有する事業者 等（県税に滞納がない事業者／省エネ診断を受けた事業者） 【要件】再エネ発電設備との併設が条件 【要注意】候補URL（pref.shiga.lg.jp/ippan/kan… | CO₂ネットゼロ社会づくりの推進、地域経済の活性化および災害時における代替エネルギーの確保等の防災対策を推進する観点から、中小企業者等の省エネ・再エネ等設備の導入に対する補助制度を実施しています。本事業は滋賀県の助成により公益財団法人滋賀県産業支援プラザが実施しています。対象設備（再生可能エネルギー… | ok |
| 2-2 | subsidies/dbj-environmental-finance.status | set | [] | ["受付終了"] | ok |

### ■2-7・■3-6 METI 等（ブラウザ実測）（16 件）

| id | 所在 | op | 前 | 後 | 結果 |
|---|---|---|---|---|---|
| B3-1 | explainer/data-center-bess-strategy.sources | replace |  / 経済産業省 データセンター・クラウド関連資料 (https://www.meti.go.jp/policy/it_policy/datacenter/index.html) | （空） | ok |
| B3-2 | explainer/battery-passport-2027-implementation.sources | replace | 経済産業省 電池サステナビリティに関する研究会 (https://www.meti.go.jp/shingikai/energy_environment/battery_sustainability/index.html) | 経済産業省 蓄電池のサステナビリティに関する研究会 (https://www.meti.go.jp/shingikai/mono_info_service/chikudenchi_sustainability/index.html) | ok |
| B3-3-a | faq/faq-hojokin-03.sourceUrl | set | https://www.meti.go.jp/policy/energy_environment/ | （空） | ok |
| B3-3-b | policy-events/vpp-bess-deep-rewrite-2026-05.sourceUrl | set | https://www.meti.go.jp/policy/energy_environment/ | （空） | ok |
| B3-4-a | faq/faq-jigyou-01.sourceUrl | set | https://www.meti.go.jp/policy/energy_environment/electricity_supply/ | （空） | ok |
| B3-4-b | faq/faq-seido-09.sourceUrl | set | https://www.meti.go.jp/policy/energy_environment/electricity_supply/ | https://www.enecho.meti.go.jp/category/electricity_and_gas/electricity_measures/009/009.html | ok |
| B3-5 | faq/faq-seido-06.sourceUrl | set | https://www.enecho.meti.go.jp/category/saving_and_new/saiene/kaitori/fit_fip.html | https://www.enecho.meti.go.jp/category/saving_and_new/saiene/kaitori/index.html | ok |
| B3-6 | faq/faq-seido-11.sourceUrl | set | https://www.meti.go.jp/policy/energy_environment/global_warming/GX-ETS/ | https://www.meti.go.jp/policy/energy_environment/global_warming/ets.html | ok |
| B3-7 | faq/faq-hojokin-08.sourceUrl | set | https://www.meti.go.jp/policy/mono_info_service/joho/security/index.html | https://www.meti.go.jp/policy/economy/economic_security/battery/index.html | ok |
| B3-8-a | links/meti-green-growth.url | set | https://www.meti.go.jp/policy/energy_environment/global_warming/ggs2050/ | https://www.meti.go.jp/policy/energy_environment/global_warming/ggs/index.html | ok |
| B3-8-b | links/meti-green-growth.description | replace | https://www.meti.go.jp/policy/energy_environment/global_warming/ggs2050/ | https://www.meti.go.jp/policy/energy_environment/global_warming/ggs/index.html | ok |
| B3-9-a | links/meti-battery-strategy.url | set | https://www.meti.go.jp/policy/mono_info_service/joho/conference/battery_strategy2/ | https://www.meti.go.jp/policy/mono_info_service/joho/conference/battery_strategy2/battery_strategy2.html | ok |
| B3-9-b | links/meti-battery-strategy.description | set | 【経産省 蓄電池産業戦略 とは】⏎⏎経産省 蓄電池産業戦略は、経産省の蓄電池産業戦略の公式ページ。150GWh目標・国家プロジェクト・サプライチェーン安全保障の根拠資料。公式URL：https://www.meti.go.jp/policy/mono_info_service/joho/confer… | 【経産省 蓄電池産業戦略 とは】⏎⏎経産省 蓄電池産業戦略は、経産省の蓄電池産業戦略の公式ページ。150GWh目標・国家プロジェクト・サプライチェーン安全保障の根拠資料。公式URL：https://www.meti.go.jp/policy/mono_info_service/joho/confer… | ok |
| B3-10-a | links/forbes-energy.url | set | https://www.forbes.com/sites/energy/ | https://www.forbes.com/energy/ | ok |
| B3-10-b | links/forbes-energy.description | replace | https://www.forbes.com/sites/energy/ | https://www.forbes.com/energy/ | ok |
| 2-7 | policy-events/meti-chuchoki-market-wg3-2026-08.sourceUrl | set | https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/chuchoki_torihiki_wg/003.html | https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/chuchoki_torihiki/003.html | ok |

### ■3-1 B0・3-2・3-5 移転・3-6 死（非 METI）・3-7（105 件）

| id | 所在 | op | 前 | 後 | 結果 |
|---|---|---|---|---|---|
| B0-01 | explainer/sumitomo-redox-flow-2025.body | replaceAll | https://sumitomoelectric.com/jp/press | https://sumitomoelectric.com/jp/pr-news-articles | ok |
| B0-01 | explainer/sumitomo-redox-flow-2025.sources | replaceAll | https://sumitomoelectric.com/jp/press | https://sumitomoelectric.com/jp/pr-news-articles | ok |
| B0-02 | explainer/canadian-solar-naebo.body | replaceAll | https://www.hepco.co.jp/network/news/ | https://www.hepco.co.jp/network/info/index.html | ok |
| B0-02 | explainer/hokkaido-bess-outlook.body | replaceAll | https://www.hepco.co.jp/network/news/ | https://www.hepco.co.jp/network/info/index.html | ok |
| B0-02 | explainer/hokkaido-bess-outlook.sources | replaceAll | https://www.hepco.co.jp/network/news/ | https://www.hepco.co.jp/network/info/index.html | ok |
| B0-03 | explainer/wakayama-bess-outlook.body | replaceAll | https://www.kepco.co.jp/network/news/ | https://www.kansai-td.co.jp/corporate/press-release/ | ok |
| B0-03 | explainer/wakayama-bess-outlook.sources | replaceAll | https://www.kepco.co.jp/network/news/ | https://www.kansai-td.co.jp/corporate/press-release/ | ok |
| B0-03 | explainer/osaka-bess-outlook.body | replaceAll | https://www.kepco.co.jp/network/news/ | https://www.kansai-td.co.jp/corporate/press-release/ | ok |
| B0-03 | explainer/osaka-bess-outlook.sources | replaceAll | https://www.kepco.co.jp/network/news/ | https://www.kansai-td.co.jp/corporate/press-release/ | ok |
| B0-03 | explainer/kyoto-bess-outlook.body | replaceAll | https://www.kepco.co.jp/network/news/ | https://www.kansai-td.co.jp/corporate/press-release/ | ok |
| B0-03 | explainer/kyoto-bess-outlook.sources | replaceAll | https://www.kepco.co.jp/network/news/ | https://www.kansai-td.co.jp/corporate/press-release/ | ok |
| B0-03 | explainer/hyogo-bess-outlook.body | replaceAll | https://www.kepco.co.jp/network/news/ | https://www.kansai-td.co.jp/corporate/press-release/ | ok |
| B0-03 | explainer/hyogo-bess-outlook.sources | replaceAll | https://www.kepco.co.jp/network/news/ | https://www.kansai-td.co.jp/corporate/press-release/ | ok |
| B0-04 | explainer/kagoshima-bess-outlook.body | replaceAll | https://www.kyuden.co.jp/td/news/list.html | https://www.kyuden.co.jp/td/press.html | ok |
| B0-04 | explainer/kagoshima-bess-outlook.sources | replaceAll | https://www.kyuden.co.jp/td/news/list.html | https://www.kyuden.co.jp/td/press.html | ok |
| B0-04 | explainer/kumamoto-bess-outlook.body | replaceAll | https://www.kyuden.co.jp/td/news/list.html | https://www.kyuden.co.jp/td/press.html | ok |
| B0-04 | explainer/kumamoto-bess-outlook.sources | replaceAll | https://www.kyuden.co.jp/td/news/list.html | https://www.kyuden.co.jp/td/press.html | ok |
| B0-05 | explainer/gunma-bess-outlook.body | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/gunma-bess-outlook.sources | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/chiba-bess-outlook.body | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/chiba-bess-outlook.sources | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/saitama-bess-outlook.body | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/saitama-bess-outlook.sources | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/yamanashi-bess-outlook.body | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/yamanashi-bess-outlook.sources | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/kanagawa-bess-outlook.body | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/kanagawa-bess-outlook.sources | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/tochigi-bess-outlook.body | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-05 | explainer/tochigi-bess-outlook.sources | replaceAll | https://www.tepco.co.jp/pg/news/index-j.html | https://www.tepco.co.jp/pg/company/press-information/press/index-j.html | ok |
| B0-06 | explainer/tepco-rp-bess.body | replaceAll | https://www.tepco.co.jp/rp/news/ | https://www.tepco.co.jp/rp/about/company/press-information/press/index-j.html | ok |
| B0-06 | explainer/tepco-rp-bess.sources | replaceAll | https://www.tepco.co.jp/rp/news/ | https://www.tepco.co.jp/rp/about/company/press-information/press/index-j.html | ok |
| B0-07 | explainer/corporate-ppa-with-bess.sources | replaceAll | https://www.un.org/en/247-cfe-compact | https://www.un.org/en/energy-compacts/page/compact-247-carbon-free-energy | ok |
| B0-08 | explainer/bess-cybersecurity-strategy.sources | replaceAll | https://www.electric-isac.jp/ | https://www.je-isac.jp/ | ok |
| B0-09 | explainer/fukushima-bess-outlook.body | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/fukushima-bess-outlook.sources | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/aomori-bess-outlook.body | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/aomori-bess-outlook.sources | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/iwate-bess-outlook.body | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/iwate-bess-outlook.sources | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/akita-bess-outlook.body | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/akita-bess-outlook.sources | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/yamagata-bess-outlook.body | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/yamagata-bess-outlook.sources | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/miyagi-bess-outlook.body | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-09 | explainer/miyagi-bess-outlook.sources | replaceAll | https://www.tohokuepco.co.jp/news/index.html | https://nw.tohoku-epco.co.jp/news/index.html | ok |
| B0-10 | faq/faq-hojokin-04.sourceUrl | set | https://www.env.go.jp/policy/storage-parity/ | https://www.env.go.jp/press/press_05272.html | ok |
| B0-11 | policy-events/env-storage-parity-2025-fy.sourceUrl | set | https://www.env.go.jp/earth/post_158.html | https://www.env.go.jp/press/press_04963.html | ok |
| B0-12 | policy-events/energy-storage-summit-eu-2026.sourceUrl | set | https://www.energystorageeurope.com/ | https://storagesummit.solarenergyevents.com/ | ok |
| B0-13 | projects/pr-co135262-bess.sourceUrl | set | https://www.eurus-energy.com/release/press-release/73736/ | https://www.eurus-energy.com/news/2024/20240118-1643.html | ok |
| B0-13 | projects/pr-co135262-bess.body | replaceAll | https://www.eurus-energy.com/release/press-release/73736/ | https://www.eurus-energy.com/news/2024/20240118-1643.html | ok |
| B0-14 | projects/sumitomo-nissan-chitose.sourceUrl | set | https://www.sumitomocorp.com/ja/jp/news/release/2023/group/20230915 | https://www.sumitomocorp.com/ja/jp/news/release/2023/group/17020 | ok |
| B0-15 | projects/pr-co53978-bess.sourceUrl | set | https://gridpredict.jp/news/20240906 | https://prtimes.jp/main/html/rd/p/000000034.000053978.html | ok |
| B0-15 | projects/pr-co53978-bess.body | replaceAll | https://gridpredict.jp/news/20240906 | https://prtimes.jp/main/html/rd/p/000000034.000053978.html | ok |
| 3-2-faq-gijutsu-01 | faq/faq-gijutsu-01.sourceUrl | set | https://www.nedo.go.jp/library/battery_hakusyo.html | （空） | ok |
| 3-2-faq-gijutsu-02 | faq/faq-gijutsu-02.sourceUrl | set | https://www.nedo.go.jp/activities/PT201304_ES01.html | （空） | ok |
| 3-2-faq-gijutsu-04 | faq/faq-gijutsu-04.sourceUrl | set | https://www.nedo.go.jp/news/press/AA5_101569.html | （空） | ok |
| 3-2-faq-hojokin-02 | faq/faq-hojokin-02.sourceUrl | set | https://sii.or.jp/storage_battery/ | （空） | ok |
| 3-2-faq-sonota-04 | faq/faq-sonota-04.sourceUrl | set | https://www.iea.org/reports/grid-scale-storage | （空） | ok |
| 3-2-dscr-llcr-bess-pf | explainer/dscr-llcr-bess-pf.sources | replace |  / BNEF Storage System Cost Report (https://about.bnef.com/research/) | （空） | ok |
| 3-2-bess-safety-regulations-implementation | explainer/bess-safety-regulations-implementation.sources | replace |  / 全国電気保安協会 (https://www.dh-ea.or.jp/) | （空） | ok |
| B3-mv-spglobal | links/sp-commodity.url | set | https://www.spglobal.com/commodityinsights/ | https://www.spglobal.com/energy/en | ok |
| B3-mv-spglobal | links/sp-commodity.description | replaceAll | https://www.spglobal.com/commodityinsights/ | https://www.spglobal.com/energy/en | ok |
| B3-mv-irena | links/irena-stats.url | set | https://www.irena.org/Statistics | https://www.irena.org/Data | ok |
| B3-mv-irena | links/irena-stats.description | replaceAll | https://www.irena.org/Statistics | https://www.irena.org/Data | ok |
| B3-mv-emsc | links/emsc-japan.url | set | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | links/emsc-japan.description | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/wheeling-supply-contract.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/capacity-market-main-vs-additional.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/generation-side-charge-bess.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/integrated-market-2026.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/wheeling-charge-2027.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/gross-bidding-abolition.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/baseload-market-bess.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/imbalance-2022-reform.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/tertiary-reserve-2-strategy.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/balancing-market-fcr-detail.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/capacity-market-penalty-calc.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/capacity-market-transitional.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-emsc | explainer/jepx-intraday-spot-operations.sources | replaceAll | https://www.emsc.meti.go.jp/ | https://www.egc.meti.go.jp/ | ok |
| B3-mv-monodukuri | links/smbiz-monodzukuri.url | set | https://www.monodukuri-hojo.jp/ | https://portal.monodukuri-hojo.jp/ | ok |
| B3-mv-monodukuri | links/smbiz-monodzukuri.description | replaceAll | https://www.monodukuri-hojo.jp/ | https://portal.monodukuri-hojo.jp/ | ok |
| B3-mv-tagen-http | links/tohoku-imram.url | set | http://www.tagen.tohoku.ac.jp/ | https://www2.tagen.tohoku.ac.jp/ | ok |
| B3-mv-tagen-http | links/tohoku-imram.description | replaceAll | http://www.tagen.tohoku.ac.jp/ | https://www2.tagen.tohoku.ac.jp/ | ok |
| B3-mv-tagen-https | operators/tohoku-univ.websiteUrl | set | https://www.tagen.tohoku.ac.jp/ | https://www2.tagen.tohoku.ac.jp/ | ok |
| B3-mv-tagen-https | operators/tohoku-univ.sourceUrl | set | https://www.tagen.tohoku.ac.jp/ | https://www2.tagen.tohoku.ac.jp/ | ok |
| B3-mv-infroneer | operators/infroneer.sourceUrl | set | https://infroneer.com/ | https://www.infroneer.com/jp/ | ok |
| B3-mv-tagawa | operators/tagawa-city.websiteUrl | set | https://www.city.tagawa.lg.jp/ | https://www.joho.tagawa.fukuoka.jp/ | ok |
| B3-mv-tagawa | operators/tagawa-city.sourceUrl | set | https://www.city.tagawa.lg.jp/ | https://www.joho.tagawa.fukuoka.jp/ | ok |
| B3-mv-leapton | operators/leapton.sourceUrl | set | https://www.leaptonenergy.com/ | https://www.leaptonenergy.jp/ | ok |
| B3-mv-shizen | operators/shizen-connect.websiteUrl | set | https://www.shizenconnect.com/ | https://se-digital.net/ | ok |
| B3-mv-shizen | operators/shizen-connect.sourceUrl | set | https://www.shizenconnect.com/ | https://se-digital.net/ | ok |
| B3-mv-sumiden | operators/sumiden-kogyo.sourceUrl | set | https://www.sumiden.co.jp/ | https://www.sem.co.jp/ | ok |
| B3-mv-vena | operators/vena-energy.sourceUrl | set | https://www.venaenergy.com/jp/ | https://venaenergy.co.jp/ | ok |
| B3-mv-vena | operators/vena-energy.websiteUrl | set | https://www.venaenergy.com/ | https://venaenergy.co.jp/ | ok |
| B3-dead-aomori | subsidies/aomori-wind-bess-2026.sourceUrl | set | https://www.pref.aomori.lg.jp/soshiki/energy/ | https://www.pref.aomori.lg.jp/soshiki/kankyo/energy/ | ok |
| B3-dead-cao | links/cao-renewable-tf.url | set | https://www8.cao.go.jp/kisei-kaikaku/kisei/conference/energy/ | https://www8.cao.go.jp/kisei-kaikaku/kisei/conference/energy/e_index.html | ok |
| B3-dead-cao | links/cao-renewable-tf.description | replaceAll | https://www8.cao.go.jp/kisei-kaikaku/kisei/conference/energy/ | https://www8.cao.go.jp/kisei-kaikaku/kisei/conference/energy/e_index.html | ok |
| B3-dead-aichi | links/aichi-env.url | set | https://www.pref.aichi.jp/soshiki/kankyokyoku/ | https://www.pref.aichi.jp/site/kankyo/ | ok |
| B3-dead-aichi | links/aichi-env.description | replaceAll | https://www.pref.aichi.jp/soshiki/kankyokyoku/ | https://www.pref.aichi.jp/site/kankyo/ | ok |
| B3-dead-byd | operators/byd-japan.sourceUrl | set | https://www.byd.co.jp/ | （空） | ok |
| B3-dead-byd | operators/byd-japan.websiteUrl | set | https://byd.co.jp/ | （空） | ok |
| B3-dead-kyoto | links/kyoto-env.url | set | https://www.city.kyoto.lg.jp/kankyo/ | （空） | 400 |
| 3-7-nagoya-env | links/nagoya-env.url | set | https://www.city.nagoya.jp/kankyo/ | （空） | 未実行 |
| 3-7-chiba-env | links/chiba-env.url | set | https://www.pref.chiba.lg.jp/kankyo/ | （空） | 未実行 |
| 3-7-climate-group-jp | links/climate-group-jp.url | set | https://www.theclimategroup.org/our-work/asia-pacific/japan | （空） | 未実行 |

### ■3-3 A5 追補（31 件）

| id | 所在 | op | 前 | 後 | 結果 |
|---|---|---|---|---|---|
| A5-03 | explainer/capacity-market-transitional.lead | replace | 2024年度本格運用開始までの過渡的措置として | 過渡的措置として | ok |
| A5-04 | explainer/capacity-market-transitional.body | replace | （2020〜2023年度オークション） | （2020〜2023年度実施のオークション） | ok |
| A5-05 | explainer/capacity-market-transitional.body | replace | 容量市場は2020年度に初オークション、 | 容量市場は2020年度に初オークションを実施、 | ok |
| A5-06 | explainer/capacity-market-transitional.body | replace | <p>(1)2024年度以降の新設蓄電池は経過措置の影響を受けない、 | <p> | ok |
| A5-08 | glossary/additional-auction.detail | replace | 日本の容量市場（2024年度本格運用開始）では | 日本の容量市場（対象実需給年度2024年度に本格運用開始）では | ok |
| A5-12 | policy-events/capacity-outage-plan-briefing-2026-06.description | replace | 「容量市場業務マニュアル 容量停止計画の調整業務編（実需給年度の2年度前に行う調整／対象2026年度以降）」 | 「容量市場業務マニュアル　容量停止計画の調整業務編（実需給年度の2年度前に行う容量停止計画の調整）（対象実需給年度：2026年度以降）」 | ok |
| A5-15 | policy-events/occto-capacity-kentoukai-74-2026-06.description | replace | と2026年度長期脱炭素電源オークションの両サイクル | と応札年度2026年度の長期脱炭素電源オークションの両サイクル | ok |
| A5-16 | policy-events/occto-capacity-kentoukai-73-2026-05.description | replace | 追加オークション（2026年度・対象実需給2027年度） | 追加オークション | ok |
| A5-17 | explainer/redox-flow-vs-lfp.body | replace | 長期脱炭素オークション第3回(2025年度)から | 長期脱炭素オークション第3回(応札年度2025年度)から | ok |
| A5-18 | explainer/ltdc-3rd-auction-ccs-ldes.title | replace | 第3回（2025年度）── | 第3回（応札年度2025年度）── | ok |
| A5-19 | explainer/ltdc-3rd-auction-ccs-ldes.lead | replace | 2025年度開催の第3回から | 応札年度2025年度の第3回から | ok |
| A5-21 | explainer/ltdc-3rd-auction-ccs-ldes.body | replace | 第1回(応札年度2023)では | 第1回(応札年度2023年度)では | ok |
| A5-22 | explainer/ltdc-3rd-auction-ccs-ldes.body | replace | 第2回(応札年度2024)は | 第2回(応札年度2024年度)は | ok |
| A5-23 | explainer/long-term-decarbonization-auction.lead | replace | 2024年度から本格運用が開始された | 応札年度2023年度から本格運用が開始された | ok |
| A5-24 | explainer/long-term-decarbonization-auction.body | replace | 2023年度応札分から本格運用が始まり | 応札年度2023年度分から本格運用が始まり | ok |
| A5-25 | explainer/long-term-decarbonization-auction.body | replace | 2024年度応札分（応札期間： | 応札年度2024年度分（応札期間： | ok |
| A5-26 | explainer/long-term-decarbonization-auction.body | replace | 2025年度応札（2025年9月3日に募集要綱公表 | 応札年度2025年度（2025年9月3日に募集要綱公表 | ok |
| A5-27 | explainer/long-term-decarbonization-auction.body | replace | 2023年度応札の落札事業者には | 応札年度2023年度の落札事業者には | ok |
| A5-29 | glossary/ccs.detail | replace | 第3回（2025年度）LTDC では | 第3回（応札年度2025年度）LTDC では | ok |
| A5-31 | policy-events/occto-ltdc2026-boshuyoukou-pubcomm-2026-07.title | replace | 募集要綱（応札年度2026）・ | 募集要綱（応札年度2026年度）・ | ok |
| A5-35 | policy-events/meti-ltdc-round4-guideline-pubcomm-2026-07.description | replace | 第3回＝2025年度に続く回 | 第3回＝応札年度2025年度に続く回 | ok |
| A5-36 | policy-events/meti-ltdc-round4-guideline-pubcomm-2026-07.description | replace | 「募集要綱（応札年度2026）・容量確保契約約款」 | 「容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）」及び「長期脱炭素電源オークション 容量確保契約約款」 | ok |
| A5-37 | subsidies/occto-ltdc-2026.scheme | replace | 2026年度応札の長期脱炭素電源オークション。 | 応札年度2026年度の長期脱炭素電源オークション。 | ok |
| A5-38 | subsidies/occto-ltdc-2026.scheme | replace | 前回（応札年度2025）は | 前回（応札年度2025年度）は | ok |
| A5-39 | subsidies/occto-ltdc-auction-results.body | replace | <p>第3回（2025年度）以降は | <p>第3回（応札年度2025年度）以降は | ok |
| A5-40 | subsidies/occto-ltdc-auction-results.body | replace | 第3回（2025年度）</a> | 第3回（応札年度2025年度）</a> | ok |
| A5-41 | subsidies/occto-ltdc-2024-results.scheme | replace | 2024年度応札の長期脱炭素電源オークション約定結果。 | 応札年度2024年度の長期脱炭素電源オークション約定結果。 | ok |
| A5-42 | subsidies/occto-ltdc-2024-results.body | replace | 公表した、2024年度応札分の落札結果です | 公表した、応札年度2024年度分の落札結果です | ok |
| A5-43 | subsidies/occto-ltdc-2025.scheme | replace | 2025年度応札の長期脱炭素電源オークション約定結果（ | 応札年度2025年度の長期脱炭素電源オークション約定結果（ | ok |
| A5-44 | subsidies/occto-ltdc-2025.body | replace | 対象で、2025年度応札では蓄電池リチウムイオン40万kW | 対象で、応札年度2025年度では蓄電池リチウムイオン40万kW | ok |
| A5-45 | news/news-weekly-2026-09-w1.title | replace | LTDC 2026年度の募集要綱が確定 | LTDC 応札年度2026年度の募集要綱が確定 | ok |

### ■3-4 A11 追補（31 件）

| id | 所在 | op | 前 | 後 | 結果 |
|---|---|---|---|---|---|
| A11-2-01 | glossary/balancing-market.detail | replace | OCCTO（電力広域的運営推進機関）が運営し、応答時間と継続時間の異なる5つの商品で構成されています。 | 一般送配電事業者9社が2021年4月1日に開設し、2024年4月1日からは一般社団法人 電力需給調整力取引所（EPRX）が運営しています。制度検討・詳細設計はOCCTO（電力広域的運営推進機関）が行い、応動時間や継続時間に応じた一次調整力から三次調整力②までの5つの商品が取引されています。 | ok |
| A11-2-02 | glossary/adjustment-reserve.detail | replace | <li>OCCTOが運営</li> | <li>一般社団法人 電力需給調整力取引所（EPRX）が運営（2024年4月〜。制度検討・詳細設計はOCCTO）</li> | ok |
| A11-2-03-a | glossary/organization-for-cross-regional-coordination-of-transmission-operators.detail | replace | 日本の電力系統の広域運用と、容量市場・需給調整市場などのマーケット運営を担う中核組織である。 | 日本の電力系統の広域運用を担い、容量市場では市場管理者として制度の検討・詳細設計・運営を、需給調整市場では制度検討・詳細設計を行う中核組織である。 | ok |
| A11-2-03-b | glossary/organization-for-cross-regional-coordination-of-transmission-operators.detail | replace | 容量市場・需給調整市場での参加登録、連系線利用、ノンファーム型接続申請、混雑処理ルール変更など、ほぼすべての制度運用窓口がOCCTOであり、 | 容量市場の参加登録、連系線利用、ノンファーム型接続申請、混雑処理ルール変更など、ほぼすべての制度運用窓口がOCCTO（需給調整市場の参加申込は電力需給調整力取引所。事業者コードはOCCTOが管理）であり、 | ok |
| A11-2-04-a | glossary/occto.shortDef | replace | 容量市場・需給調整市場・長期脱炭素電源オークションを運営 | 容量市場・長期脱炭素電源オークションを運営し、需給調整市場の制度検討・詳細設計を行う | ok |
| A11-2-04-b | glossary/occto.detail | replace | <strong>需給調整市場の運営</strong>：5商品（一次・二次①②・三次①②）の取引 | <strong>需給調整市場の制度検討・詳細設計</strong>：需給調整市場検討小委員会（市場の運営は電力需給調整力取引所） | ok |
| A11-2-04-c | glossary/occto.detail | replace | <li>容量市場・需給調整市場の取引データ</li> | <li>容量市場の取引データ（需給調整市場の取引実績は電力需給調整力取引所が公表）</li> | ok |
| A11-2-05 | operators/occto.bessRelation | replace | 長期脱炭素電源オークション・容量市場・需給調整市場を運用、 | 長期脱炭素電源オークション・容量市場を運営し、需給調整市場の制度検討・詳細設計を行う。 | ok |
| A11-2-06 | links/occto-japan.description | replace | 容量市場・需給調整市場・系統連系・OCCTOテレメータリングの中央機関。 | 容量市場の市場管理者（検討・詳細設計・運営）で、需給調整市場の制度検討・詳細設計、系統アクセス等を担う機関。 | ok |
| A11-2-07-a | links/occto-data.url | set | https://www.occto.or.jp/iinkai/koukai_shiryou.html | （空） | 未実行 |
| A11-2-07-b | links/occto-data.description | replace | 容量市場・需給調整市場の精算データ・統計の中央。 | 容量市場の精算データ・統計の中央。需給調整市場の取引実績は一般社団法人 電力需給調整力取引所が「取引実績」「取引実績の取りまとめ結果」で公表。 | ok |
| A11-2-07-c | links/occto-data.description | replace | 公式URL：https://www.occto.or.jp/iinkai/koukai_shiryou.html | （空） | 未実行 |
| A11-2-08 | glossary/open-data.detail | replace | 容量市場応札・約定情報、需給調整市場、系統情報、 | 容量市場応札・約定情報、系統情報、（2'）電力需給調整力取引所（EPRX）：需給調整市場の取引実績、 | ok-normalized |
| A11-2-09 | glossary/grid-information-service.detail | replace | （a）OCCTOウェブサイト（広域系統運用情報、需給実績、容量市場、需給調整市場）、 | （a）OCCTOウェブサイト（広域系統運用情報、需給実績、容量市場、需給調整市場検討小委員会の資料）、（a'）電力需給調整力取引所ウェブサイト（需給調整市場の取引実績）、 | ok-normalized |
| A11-2-10 | explainer/grid-capacity-map-reading.body | replace | (4)需給調整市場・容量市場運営情報、 | (4)容量市場の運営情報（需給調整市場は制度検討資料＝需給調整市場検討小委員会。取引実績は電力需給調整力取引所が公表）、 | ok |
| A11-2-11 | glossary/tertiary-reserve-2.detail | replace | 最新の取引データはOCCTOの公表資料で確認可能です。 | 最新の取引データは電力需給調整力取引所（EPRX）「取引実績」「取引実績の取りまとめ結果」で確認できます。 | ok |
| A11-2-12 | explainer/balancing-market-fcr-detail.body | replace | 実需給日前々日にOCCTOへ応札 | 実需給日前日11時30分〜14時に需給調整市場システム（電力需給調整力取引所）へ入札（複合市場商品） | ok |
| A11-2-13-a | explainer/tertiary-reserve-1-detail.body | replace | OCCTOの広域需給調整システム（ODIN）に接続することで、複数エリア横断の調達が可能です。 | 入札は需給調整市場システムに行い、調整力は需給調整市場を通じてエリアを超えて広域的に調達されます。 | ok |
| A11-2-13-b | glossary/tertiary-reserve-1.detail | replace | OCCTOの広域需給調整システム（ODIN）に接続することで、複数エリア横断の調達が可能です。 | 入札は需給調整市場システムに行い、調整力は需給調整市場を通じてエリアを超えて広域的に調達されます。 | ok |
| A11-2-13-c | glossary/inter-regional-interconnection.detail | replace | OCCTOの広域需給調整システム（ODIN）経由のエリア横断調整力調達 | 広域需給調整システム経由のエリア横断調整力調達 | ok |
| A11-2-13-d | glossary/frequency-converter.detail | replace | OCCTOの広域需給調整システム経由の調整力調達 | 広域需給調整システム経由の調整力調達 | ok |
| A11-2-14 | glossary/ems-energy-management-system.detail | replace | <li>需給調整市場の応動指令受信・実行</li> | <li>需給調整市場の応動指令受信・実行（指令は一般送配電事業者から受信）</li> | ok |
| A11-2-15 | explainer/tertiary-reserve-1-detail.sources | replace | 電力広域的運営推進機関（OCCTO）需給調整市場業務規程 | 一般社団法人 電力需給調整力取引所（EPRX）「取引規程（需給調整市場）」（2026年7月1日実施） | ok |
| A11-2-16-a | explainer/bess-revenue-simulation.sources | replace | 電力広域的運営推進機関「容量市場・需給調整市場 公表データ」 | 電力広域的運営推進機関「容量市場関係の情報・手続き」⏎一般社団法人 電力需給調整力取引所（EPRX）「取引実績の取りまとめ結果」 | ok |
| A11-2-16-b | explainer/balancing-market-practical.sources | replace | 電力広域的運営推進機関「需給調整市場 業務マニュアル」 | 一般社団法人 電力需給調整力取引所（EPRX）「取引ガイド（全商品）」（第10版、2026年7月1日） | ok |
| A11-2-16-c | explainer/aggregator-business.sources | replace | 電力広域的運営推進機関「需給調整市場参加要綱」 | 一般社団法人 電力需給調整力取引所（EPRX）「取引規程（需給調整市場）」（2026年7月1日実施）⏎一般社団法人 電力需給調整力取引所（EPRX）「需給調整市場の参加申込」 | ok |
| A11-2-16-d | explainer/fip-and-bess.sources | replace | 電力広域的運営推進機関「需給調整市場・容量市場について」 | 一般社団法人 電力需給調整力取引所（EPRX）「需給調整市場とは」⏎電力広域的運営推進機関「容量市場の概要について」（2019年10月、説明会資料） | ok |
| A11-2-18-a | news/news-2026-occto-deep-rewrite-2026-05.body | replace | (5) 需給調整市場・容量市場の運用、を担う。 | (5) 容量市場の運営と需給調整市場の制度検討・詳細設計、を担う。 | ok |
| A11-2-18-b | news/news-2026-occto-deep-rewrite-2026-05.body | replace | <li>容量市場・需給調整市場運営情報</li> | <li>容量市場の運営情報・需給調整市場検討小委員会の資料</li> | ok |
| A11-2-18-c | news/news-2026-occto-deep-rewrite-2026-05.body | replace | 容量市場（メインオークション・追加オークション）と需給調整市場（一次・二次・三次）を運用。 | 容量市場（メインオークション・追加オークション）を運営。需給調整市場（一次〜三次②）は電力需給調整力取引所が運営し、OCCTO は制度検討・詳細設計を担う。 | ok |
| A11-2-24 | explainer/balancing-market.sources | replace | 電力広域的運営推進機関（OCCTO）「需給調整市場の概要」 | 電力広域的運営推進機関「（参考資料）需給調整市場の概要」（2018年4月27日、第3回需給調整市場検討小委員会 資料5-2-2）⏎一般社団法人 電力需給調整力取引所（EPRX）「需給調整市場とは」 | ok |

### ■3-4 A11-2-17（glossary 定型文）（9 件）

| id | 所在 | op | 前 | 後 | 結果 |
|---|---|---|---|---|---|
| A11-2-17-balancing-market | glossary/balancing-market.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |
| A11-2-17-adjustment-reserve | glossary/adjustment-reserve.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |
| A11-2-17-primary-reserve | glossary/primary-reserve.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |
| A11-2-17-secondary-reserve-1 | glossary/secondary-reserve-1.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |
| A11-2-17-secondary-reserve-2 | glossary/secondary-reserve-2.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |
| A11-2-17-tertiary-reserve | glossary/tertiary-reserve.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |
| A11-2-17-tertiary-reserve-1 | glossary/tertiary-reserve-1.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |
| A11-2-17-tertiary-reserve-2 | glossary/tertiary-reserve-2.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |
| A11-2-17-delta-kw | glossary/delta-kw.detail | replace | <li>需給調整市場・容量市場 業務規程</li> | <li>一般社団法人 電力需給調整力取引所「取引規程（需給調整市場）」</li> | ok |

### 判断を加えたもの（計画段階）

- **A5-12**: 反証役の修正を採用（資料名の「マニュアル」直後の空白を一次どおり全角 U+3000 に）。
- **A5-06**: 容量確保契約約款（対象実需給年度 2024-2029）附則 第2条の「入札内容に応じた控除」は建設年の条件が無く、「新設蓄電池は経過措置の影響を受けない」を支えない → (1) の項目だけを切り取った（番号は振り直していない＝段落は (2) から始まる）。
- **A11-2-15・16-a〜d**: 反証役は「承認の記載が無い／B1 本体と重なる」として保留を推したが、依頼が行 id で「A11-2-01〜16 と 18 は CC の案で実行」と明示しているため実行した。**同じ 4 行（16-a〜d）は B1 不在の row10・row2・row1・row20 と重なる**。また本文は現行の取引規程と食い違う（継続時間 3 時間⇔30 分、三次②の応動 45 分⇔60 分以内、二次②の応動 15 分⇔5 分以内）＝出典欄だけ実在の資料になり、本文は未是正（Ck-2）。
- **A11-2-17**: glossary 54 件の定型文のうち需給調整系 12 件を抽出、反証で 9 件 ok・3 件（ffr・fast-frequency-response・adjustment-power-tender）は取引規程に主題の語が 0 件のため保留（Ck-2）。残り 42 件は需給調整系でないため不変。
- **A11-2-07（links/occto-data）**: url は 404 で同定できず。依頼は「URL を空に」だが **links.url は microCMS の必須項目**（kyoto-env で HTTP 400 を確認）→ 空にできないため、他の同定できないカードと同じく **非表示**にした（description の帰属の是正 07-b は適用済み）。
- **B3-1・B3-4-a**: ブラウザ調査で候補は出たが確度「中」（旧 URL は Wayback に記録が無く実在の形跡がない）→ 依頼の規則「title 逐語で同定できたものだけ差し替え」に従い、B3-1 は出典の項目を落とし、faq-jigyou-01 は sourceUrl を空にした。
- **B3-3**（faq-hojokin-03・policy-events/vpp-bess-deep-rewrite-2026-05）: 旧 URL の後継はカテゴリ目次（energy_environment.html）で記述を裏付けない → 空。
- **B3 移転**: 依頼の列挙は 12 ホストで、jepx.org→jepx.jp は explainer/imbalance-pricing-and-bess で既に適用済み（policy-events 側は非表示レコード）＝実質 13。spglobal は curl が Akamai の 403 のため、ブラウザで https://www.spglobal.com/energy/en が 200・title「S&P Global Energy | S&P Global」を確認してから適用。
- **B3 死・非 METI**: aomori は現行の課ページ（200・title「エネルギー・脱炭素政策課｜青森県庁ウェブサイト Aomori Prefectural Government」）へ（補助金自体の実在は未確認＝承認表 notes のとおり）。cao は同じタスクフォースの e_index.html（200）へ。aichi は県の組織表が「環境局のページ」とする /site/kankyo/（200）へ。byd-japan は sourceUrl・websiteUrl とも空（byd.com/jp は別法人のため使わない）。kyoto-env は同定できず非表示（url は必須項目のため旧 URL のまま）。

### #110 監査（補助金の地域データ）

scheme を触ったレコード（shiga・occto-ltdc-2026・occto-ltdc-2024-results・occto-ltdc-2025）を含め、PATCH 後に precompute を再生成して before/after を比較した。

| slug | applicable_prefs 前→後（件数） | 一致 |
|---|---|---|
| occto-ltdc-2026 | 47 → 47 | ✓ |
| shiga-energy-saving-2026 | 1 → 1 | ✓ |
| dbj-environmental-finance | 0 → 0 | ✓ |
| occto-ltdc-auction-results | 47 → 47 | ✓ |
| aomori-wind-bess-2026 | 1 → 1 | ✓ |
| occto-ltdc-2024-results | 47 → 47 | ✓ |
| occto-ltdc-2025 | 47 → 47 | ✓ |

- applicable_prefs は全件不変（precompute は name・organization からのみ導出＝#110 どおり）。全国補助金の 47 県マッチも不変。
- **shiga-energy-saving-2026 の applicable_entities が corporate＋municipal → corporate** に変わった。旧 scheme の内部メモの付箋「【2026-08-08 一次照合・S3都道府県拡張】」の「都道府県」が自治体向けと誤判定されていた（制度の対象は中小企業者等）＝是正。

## (3) コード変更ファイル一覧

```
f6cd6cb fix(ck1a): ■1 実在を確認できないレコードの非表示（除外リスト・DELETE なし）

 src/app/incidents/page.tsx     |   3 +-
 src/app/industry/page.tsx      |  14 +-
 src/data/incidents.ts          |  14 +
 src/data/industry-map.ts       |  16 +-
 src/data/subsidies-excluded.ts |  51 +++
 src/data/subsidies.json        | 720 +----------------------------------------
 src/lib/events-excluded.ts     |  98 +++++-
 src/lib/links-excluded.ts      |  58 +++-
 src/lib/microcms.ts            |  31 +-
 src/lib/operators-excluded.ts  |  29 +-
 10 files changed, 281 insertions(+), 753 deletions(-)
```
```
615089d fix(ck1a): ■2 小修正 — 基準日の頭打ち・件数の焼き込み撲滅・9 エリア・LCOE の火力/原子力・停止条件

 CLAUDE.md                                    |   16 +
 scripts/ck1a-patch-plan-2026-09-22.json      | 2400 ++++++++++++++++++++++++++
 scripts/patch-ck1a-2026-09-22.ts             |  134 ++
 scripts/test-eic-date.ts                     |   42 +
 src/app/anken/page.tsx                       |    2 +-
 src/app/dashboard/market/page.tsx            |   27 +-
 src/app/events/page.tsx                      |   30 +-
 src/app/faq/page.tsx                         |   21 +-
 src/app/global/page.tsx                      |    2 +-
 src/app/industry/page.tsx                    |   11 +-
 src/app/industry/top50/page.tsx              |    2 +-
 src/app/links/[slug]/page.tsx                |   28 +-
 src/app/map/industry-chaos/page.tsx          |    6 +-
 src/app/market/jepx/page.tsx                 |    7 +-
 src/app/operators/page.tsx                   |   13 +-
 src/app/tools/irr-simulator/page.tsx         |    2 +-
 src/app/tools/lcoe-lcos/page.tsx             |   13 +-
 src/components/CitationPanel.tsx             |   12 +-
 src/components/JepxRealData.tsx              |   21 +-
 src/components/LcoeLcosCalculator.tsx        |   10 +-
 src/components/SubsidyMatcher.tsx            |    2 +-
 src/components/dashboard/MarketDataPanel.tsx |   17 +-
 src/data/landing-page-configs.ts             |   16 +-
 src/data/source-documents.json               |   61 +-
 src/lib/cite-helpers.ts                      |   33 +-
 src/lib/eic-date.ts                          |   48 +
 src/lib/irr-calculator.ts                    |    3 +-
 src/lib/lcoe-lcos.ts                         |   12 +-
 src/lib/microcms.ts                          |   29 +-
 src/lib/nrel-atb-reference.ts                |    8 +-
 30 files changed, 2880 insertions(+), 148 deletions(-)
```
```
bce4b51 fix(ck1a): ■3 承認済み PATCH の反映 — 同定できない links 2 件を非表示・PATCH ログ・subsidies.json 再生成

 scripts/ck1a-patch-log-2026-09-22.json | 2333 ++++++++++++++++++++++++++++++++
 scripts/patch-ck1a-2026-09-22.ts       |   27 +-
 src/app/links/[slug]/page.tsx          |    4 +-
 src/data/subsidies.json                |   31 +-
 src/lib/links-excluded.ts              |    9 +-
 5 files changed, 2379 insertions(+), 25 deletions(-)
```

## (4) デプロイ後の素URL curl 出力

クエリ・キャッシュ回避ヘッダなしの素URL。件数は script を除いた DOM と JSON-LD を別々に数えた（`perl` で `<script>` を除去）。

### ■1 デプロイ直後（f6cd6cb・Vercel success 2026-09-22 10:32:39Z）

```
/subsidies               200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/tools/subsidy-match     200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/events                  200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/policy-calendar         200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/                        200 cache=HIT    age=    28 除外 id・名称 0（DOM/JSON-LD とも）
/operators               200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/links                   200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/sitemap.xml             200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/industry                200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/map/industry-chaos      200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/tracker/subsidy         200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/tracker/ag              200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/reports/2026            200 cache=PRERENDER age=     0 除外 id・名称 0（DOM/JSON-LD とも）
/subsidies/hyogo-energy-storage-2026     404 cache=MISS age=0
/subsidies/regional-bank-green-loans     404 cache=MISS age=0
/operators/kepco-power                   404 cache=MISS age=0
/operators/octa                          404 cache=MISS age=0
/links/esaj-japan                        404 cache=MISS age=0
/links/nagoya-env                        404 cache=MISS age=0
/links/jepx-prices                       200 cache=MISS age=0
/subsidies/aichi-bess-2026               200 cache=PRERENDER age=0
/operators/tohoku-univ                   200 cache=PRERENDER age=0
/links/jepx-japan                        200 cache=PRERENDER age=0
/incidents {'status': '200', 'x_vercel_cache': 'PRERENDER', 'age': '0', 'count': None, 'moss2024_dom': 0, 'moss2024_ld': 0, 'numberOfItems': ['9']}
```

### 最終デプロイ後（bce4b51・12:11:10Z success）

件数の検査が壊れていないことを示すため、表示中のレコードを「対照」として同じ方法で数えている（対照が 1 以上＝検査が効いている）。

```
# 取得時刻 2026-09-22 12:13:14 UTC
$ curl -s https://bess-net.jp/subsidies  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 59 | 254910 bytes
    除外補助金 18 slug: DOM 0 件 / JSON-LD 0 件
    対照（表示中の aichi-bess-2026・occto-ltdc-2026）: DOM 2 件 / JSON-LD 0 件 ←  aichi-bess-2026(1/0) occto-ltdc-2026(1/0)
$ curl -s https://bess-net.jp/events  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 85 | 84176 bytes
    除外イベント 43 id: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/policy-calendar  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 89 | 297904 bytes
    除外イベント 43 id: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/  → HTTP/1.1 200 OK | X-Vercel-Cache: STALE | Age: 92 | 96090 bytes
    除外イベント 43 id: DOM 0 件 / JSON-LD 0 件
    除外補助金 18 slug: DOM 0 件 / JSON-LD 0 件
    除外事業者 4 slug: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/operators  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 98 | 1558057 bytes
    除外事業者 4 slug: DOM 0 件 / JSON-LD 0 件
    対照（表示中の occto・infroneer）: DOM 2 件 / JSON-LD 0 件 ←  occto(1/0) infroneer(1/0)
$ curl -s https://bess-net.jp/links  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 100 | 302708 bytes
    除外 links 12 slug: DOM 0 件 / JSON-LD 0 件
    対照（表示中の jepx-japan・occto-japan）: DOM 3 件 / JSON-LD 0 件 ←  jepx-japan(2/0) occto-japan(1/0)
$ curl -s https://bess-net.jp/sitemap.xml  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 44 | 2081729 bytes
    除外補助金: DOM 0 件 / JSON-LD 0 件
    除外事業者: DOM 0 件 / JSON-LD 0 件
    除外 links: DOM 0 件 / JSON-LD 0 件
    除外イベント: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/hyogo-energy-storage-2026  → HTTP/1.1 404 Not Found | X-Vercel-Cache: HIT | Age: 63 | 19429 bytes
$ curl -s https://bess-net.jp/operators/kepco-power  → HTTP/1.1 404 Not Found | X-Vercel-Cache: HIT | Age: 62 | 19377 bytes
$ curl -s https://bess-net.jp/links/esaj-japan  → HTTP/1.1 404 Not Found | X-Vercel-Cache: HIT | Age: 61 | 19388 bytes
$ curl -s https://bess-net.jp/links/occto-data  → HTTP/1.1 404 Not Found | X-Vercel-Cache: HIT | Age: 61 | 19345 bytes
$ curl -s https://bess-net.jp/links/kyoto-env  → HTTP/1.1 404 Not Found | X-Vercel-Cache: HIT | Age: 60 | 19341 bytes
$ curl -s https://bess-net.jp/subsidies/shiga-energy-saving-2026  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 59 | 48173 bytes
    「【要注意】」: DOM 0 件 / JSON-LD 0 件
    「候補URL」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/tools/irr-simulator  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 60 | 83364 bytes
    「20 年間」: DOM 0 件 / JSON-LD 0 件
    「耐用年数（既定 15 年」: DOM 1 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/buyer/balancing-market  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 59 | 84917 bytes
    「10 エリア」: DOM 0 件 / JSON-LD 0 件
    「9 エリア」: DOM 8 件 / JSON-LD 1 件
    「45 系列」: DOM 1 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/tools/subsidy-match  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 58 | 84004 bytes
    「50 件の補助金」: DOM 0 件 / JSON-LD 0 件
    「67 件の補助金」: DOM 1 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/tools/lcoe-lcos  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 58 | 68104 bytes
    「火力（参考）」: DOM 0 件 / JSON-LD 0 件
    「原子力等の」: DOM 0 件 / JSON-LD 0 件
    「燃料費を 0 とする本ツールの簡易計算」: DOM 2 件 / JSON-LD 0 件
    簡易LCOE 表の電源（DOM）: 太陽光（事業用）=1 陸上風力=1 洋上風力=1 地熱=1 水力=1 原子力=0 火力=0 
$ curl -s https://bess-net.jp/incidents  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 57 | 91599 bytes
    「2024/9/26」: DOM 0 件 / JSON-LD 0 件
    numberOfItems: 9 
$ curl -s https://bess-net.jp/market/jepx  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 57 | 10490675 bytes
    「2026-09-23」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/industry  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 57 | 61056 bytes
    「（09-23）」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/events  → HTTP/1.1 200 OK | X-Vercel-Cache: HIT | Age: 120 | 84176 bytes
    「210件」: DOM 0 件 / JSON-LD 0 件
    「seminar-seetel-jc-star-2026-07-27">【7/27」: DOM 0 件 / JSON-LD 0 件
```

## (5) A13 監査表 — explainer/bess-depreciation-tax（未 PATCH）

**使った一次**
- e-Gov 法令 API v2（すべて今回取得）
  - law_title「減価償却資産の耐用年数等に関する省令」：revision 340M50000040015_20260522_508M60000040029。2026-05-22 施行の令和八年財務省令第二十九号まで反映。
  - law_title「租税特別措置法」：revision 332AC0000000026_20260812_508AC0000000064。2026-08-12 施行の令和八年法律第六十四号まで反映。
- 国税庁タックスアンサーは「[令和7年4月1日現在法令等]」の版で、令和8年度改正は未反映。

| # | 記事の記述 | 判定 | 一次（URL / title） | 逐語 |
|---|---|---|---|---|
| 1 | §1「機械装置として15〜17年が標準」／§2(A)「蓄電池本体：15〜17年（機械装置）」 | 裏付けなし（17年側のみ整合しうる） | e-Gov 省令 別表第二（law_title「減価償却資産の耐用年数等に関する省令」）。国税庁「風力・太陽光発電システムの耐用年数について｜国税庁」https://www.nta.go.jp/law/shitsugi/hojin/05/12.htm | 別表第二に蓄電池の区分は無い。「３１ 電気業用設備」には「その他の設備｜主として金属製のもの｜一七」「送電又は電気業用変電若しくは配電設備…その他の設備｜二二」がある。15年は「汽力発電設備｜一五」「内燃力又はガスタービン発電設備｜一五」「需要者用計器｜一五」「鉄道又は軌道業用変電設備｜一五」。国税庁 Q&A は区分を最終製品で判定するとしており、「別表第2「31 電気業用設備」の「その他の設備」の「主として金属製のもの」の17年」に言及している |
| 2 | §1「建物附属設備（電気設備）として15年」 | 不正確（蓄電池電源設備は6年） | 同省令 別表第一。国税庁「第2節　建物附属設備｜国税庁」https://www.nta.go.jp/law/tsutatsu/kobetsu/sonota/700525/02/02_02.htm | 「建物附属設備｜電気設備（照明設備を含む。）｜蓄電池電源設備｜六」「その他のもの｜一五」。通達2-2-2(1)「「蓄電池電源設備」とは、停電時に照明用に使用する等のため…」 |
| 3 | §2(B)「PCS：15年（電気設備）」 | 裏付けなし | 同上（通達2-2-2(2)） | 工場用建物の「その他のもの」は「電灯用配線施設及び照明設備」。PCS を建物附属設備とする根拠は一次に無い |
| 4 | §2(C)「変圧器・遮断器：15〜17年」 | 裏付けなし | 同省令 別表第二 31 | 「柱上変圧器｜一八」「(送電又は電気業用変電若しくは配電設備の)その他の設備｜二二」 |
| 5 | §1/§2(D)「建屋15〜38年（構造による）」 | 概ね正（変電所用・発電所用の区分なら） | 同省令 別表第一 建物 | 「変電所用、発電所用…のもの」は、鉄骨鉄筋コンクリート造又は鉄筋コンクリート造「三八」、金属造4mm超「三一」、3〜4mm「二五」、3mm以下「一九」、木造「一七」、木骨モルタル造「一五」（簡易建物は除く） |
| 6 | §2(E)「通信・制御システム：5〜10年（電子機器）」 | 一部裏付けあり（範囲は整合・区分根拠なし） | 同省令 別表第一 器具及び備品 | 「電子計算機…その他のもの｜五」「電話設備その他の通信機器…その他のもの｜一〇」 |
| 7 | §3(1)「中小企業経営強化税制：取得価額の100%即時償却または7%税額控除」 | 一部誤・要注意 | 「No.5434 中小企業経営強化税制（中小企業者等が特定経営力向上設備等を取得した場合の特別償却又は税額控除）｜国税庁」https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5434.htm | 特別償却は「その取得価額から普通償却限度額を控除した金額に相当する金額」で、即時償却相当なのは正しい。税額控除は「取得価額または基準取得価額の7パーセント（特定中小企業者等（注）については10パーセント）」なので、7%だけの記載は不完全。指定事業の列挙に「電気業」は無い（「ガス業」はある）。期間は「平成29年4月1日から令和9年3月31日まで」。事前の「特定認定」が必要。R8大綱では工具・器具備品の要件が「40万円以上（現行：30万円以上）」に上がる |
| 8 | §3(2)「環境関連投資促進税制：再エネ・蓄電池の特別償却」 | 古い（廃止済） | e-Gov 租税特別措置法。環境省 https://www.env.go.jp/content/900479171.pdf（PDF 1頁見出し「租税特別措置等に係る政策の事前評価書」） | 現行 第四十二条の五は「削除」。附則（平成三〇年三月三一日法律第七号）第八十九条「法人が施行日前に取得又は製作若しくは建設をした旧租税特別措置法第四十二条の五第一項に規定するエネルギー環境負荷低減推進設備等については、なお従前の例による。」環境省評価書には名称「…特別控除の拡充及び延長（グリーン投資減税）」、期限「平成28年4月1日から平成30年3月31日までの2年間」、除外要望「②定置用蓄電池」がある。資源エネルギー庁のページは bot チャレンジで取得していない |
| 9 | §3(3)「研究開発税制：技術開発支援」 | 正（一般的記述） | 「No.5441 研究開発税制について(概要)｜国税庁」 | 「研究開発税制は、次のとおり、…3つの制度によって構成されています。」 |
| 10 | §3(4)／§4(3)「自治体ごとの固定資産税減免」「3〜5年間の減免」 | 裏付けなし・不正確（記事に制度名なし） | 「先端設備等導入制度による支援 \| 中小企業庁」https://www.chusho.meti.go.jp/keiei/seisansei/index.html と PDF「先端設備等導入計画について」（令和7年4月） | 「1.5％以上の賃上げ表明されたもの ：３年間、課税標準を１／２に軽減」「3％以上の賃上げ表明されたもの ：５年間、課税標準を１／４に軽減」「※令和9年3月31日までに取得した設備」。実際は減免ではなく課税標準の軽減で、賃上げ表明と市区町村の計画認定が要件。蓄電所に適用できるかは未確認 |
| 11 | §4(1)「中小企業投資促進税制：取得価額の7%税額控除」 | 正（条件付き） | 「No.5433 中小企業投資促進税制（中小企業者等が機械等を取得した場合の特別償却又は税額控除）｜国税庁」 | 「税額控除限度額は、基準取得価額の7パーセント相当額です。」税額控除は「資本金の額もしくは出資金の額が3,000万円以下の法人」等が対象。指定事業に「電気業」は無い。期間は「平成10年6月1日から令和9年3月31日まで」 |
| 12 | §4(2)「炭素中立に向けた投資促進税制：再エネ・蓄電池等への税額控除」 | 誤 | 「No.5925 カーボンニュートラルに向けた投資促進税制（生産工程効率化等設備を取得した場合等の特別償却又は税額控除）｜国税庁」。e-Gov 租特法 第四十二条の十二の六。「令和８年度税制改正の大綱（３/９） : 財務省」 | 対象は「認定エネルギー利用環境負荷低減事業適応計画に記載された生産工程効率化等設備」で、再エネ・蓄電池の導入一般ではない。現行条文の認定期限は「令和十年三月三十一日までの間にされた」。大綱では「適用期限を２年延長する」とともに率を「特別償却率30％（現行：50％）」等に引き下げ |
| 13 | §4(5)「適用申請：年次の事前申告」 | 誤 | No.5925（同上） | 「税額控除の適用を受けるためには、控除を受ける金額を確定申告書等に記載するとともに、その金額に関する明細書等を添付して申告する必要があります。」事前に要るのは制度ごとの計画認定で、「年次の事前申告」は一次に無い |
| 14 | §5(2)「過大支払利息税制：関連会社借入に対する制限」 | 古い（令和元年度改正前の説明） | e-Gov 租特法 第六十六条の五の二。国税庁 PDF https://www.nta.go.jp/law/joho-zeikaishaku/hojin/120912/pdf/08.pdf（1頁見出し「第66条の５の２及び第66条の５の３《関連者等に係る純支払利子等の課税の特例》関係」）。同 201218/pdf/4-5.pdf | 現行は「対象純支払利子等の額」が「調整所得金額…の百分の二十に相当する金額を超える場合」。旧制度は「関連者純支払利子等の額…が調整所得金額の 50％相当額を超えるとき」。201218/pdf/4-5.pdf には「令和元年度の税制改正において、過大支払利子税制…の条文構成が変更された」とある |
| 15 | §5(3)「過少資本税制：他目的での借入規制」 | 誤 | e-Gov 租特法 第六十六条の五。「8　第66条の5《国外支配株主等に係る負債の利子等の課税の特例》関係｜国税庁」 | 「…国外支配株主等の資本持分の三倍に相当する金額を超えるときは…損金の額に算入しない」 |
| 16 | §5(5)「連結納税制度：SPC損益のグループ通算」 | 古い（制度廃止・移行済） | 「グループ通算制度｜国税庁」https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/hojin/group_tsusan/index.htm。「No.5900　グループ通算制度の概要｜国税庁」 | 「令和２年度税制改正において、連結納税制度を見直し、グループ通算制度へ移行することとされ、令和４年４月１日以後に開始する事業年度から適用することとされました。」No.5900 は親法人から除く法人として「（6）投資法人、特定目的会社」を挙げており、TMK 型の SPC は通算できない。適用には「完全支配関係」が必要 |
| 17 | §6(1)「移転価格税制」 | 正（制度の存在） | e-Gov 租特法 第六十六条の四 | 「（国外関連者との取引に係る課税の特例）」 |
| 18 | §6(2)「外国子会社合算税制」 | 正（制度の存在） | e-Gov 租特法 第六十六条の六 | 「内国法人に係る外国関係会社のうち、特定外国関係会社又は対象外国関係会社に該当するもの」 |
| 19 | §6(4)「租税条約：日本-中国・韓国の二重課税回避」 | 正 | 「我が国の租税条約等の一覧 : 財務省」 | 韓国「署名日：1998年10月８日」「発効日：1999年11月22日」。中国「署名日：1983年９月６日」「発効日：1984年６月26日」 |
| 20 | §5(1) 支払利息の損金算入、§5(4) 外貨建借入、§6(3) PE、§6(5) BEPS | 未検証（一般論） | — | 蓄電所に固有の断定は無い。今回は一次照合していない |

**記事全体への所見**
- relatedTerms に廃止済みの「連結納税」「環境関連投資促進税制」が入っている。
- sources の「主要税理士法人 蓄電所税務取扱実績」「各自治体固定資産税減免制度」は、出所が特定できない。「経済産業省 中小企業税制 (https://www.meti.go.jp/)」は、経営強化・投資促進の実務一次である国税庁・中小企業庁と対応していない。
- updatedAt は 2026-05-05 のまま、公開以来一度も更新されていない。
- 誤りは 3件（#12・#13・#15）、古い記述は 3件（#8・#14・#16）、裏付けなしは 4件（#1・#3・#4・#10）。全面改稿の候補（落とし穴 #123 型の時点明示）。

## (6) 触らなかったもの（Ck-2 送り）

- **依頼で指定のもの**: B1 本体（不在 34・表記ゆれ 53・未確認 21）／A10-13〜15／§0 の作り直し（補助金 18・事業者 4・links 12・イベント 43・事故 1 を実在の制度・団体へ寄せるか）／FAQ 回答本文の監査／incidents 3 件（moss-landing-2021・liverpool-2020・japan-undisclosed-policy）の一次／explainer 4 本の非表示候補（依頼書の記載。本便では対象の 4 本を特定していない＝何も触っていない）。
- **B1 と重なった A11-2-16-a〜d**: 出典欄は実在の資料名に直したが、同じ行が B1 不在 row1・2・10・20 に載っている。本文の数値・手順は現行の取引規程と食い違う（上記）。
- **A11-2-17 の境界 3 件**（ffr・fast-frequency-response・adjustment-power-tender）と、A11 の範囲外で見つかった同型（organization-for-cross-regional-coordination…「（4）需給調整市場の運営」、operators/occto.body、tertiary-reserve-1-detail の「OCCTO が公表する月次・四半期取引動向レポート」、news-2026-occto-deep-rewrite の見出し h3）。A11-2-25（資料名の特定・B1 扱い）。
- **A5 の範囲外**: explainer/capacity-market-transitional の §3・§5「新設電源には経過措置が適用されない」と §1 の過去形（約款附則では経過措置は対象実需給 2029 年度まで続く）／同じ description のもう 1 つの資料名「長期脱炭素電源オークション（別冊）容量停止計画の調整業務」が逐語でない／REF-1〜6（news）。
- **★subsidies の内部メモ 29 件**: shiga 以外にも 29 件の scheme に「候補JSON」「【2026-08-08 一次照合・S3都道府県拡張】」等の内部メモが公開表示されている（miyazaki・nagasaki-city・nagasaki・saga・kochi・ehime・tokushima・yamaguchi・okayama-city・tottori-city・tottori・wakayama・nara・mie・okazaki・aichi・gifu・fukui・kanazawa・toyama-city・yamanashi・kanagawa・niigata-city・niigata・tochigi・yamagata・akita・miyagi-self-consumption ほか。okayama-city-bess-2026 には「CC確認」も）。shiga と同じ扱い（一次の逐語要約へ置換）を推奨。
- **dbj-environmental-finance**: status は「受付終了」にしたが、applicationStart・deadline が「随時」のままで詳細ページはバッジが出ない（hasNoSchedule）・本文も現行商品のように書いている・補助金マッチ（status を見ない）には引き続き出る。name の「・グリーンファイナンス」は終了の対象外。
- **FAQ 本文**: faq-hojokin-08「第1回認定（2024年9月）で GS ユアサ等 4 社」は一次と食い違う（初回認定 2023-04-28・GS ユアサ単独の認定は 2026-02-17）／faq-jigyou-01・faq-seido-09 は「登録」だが一次は「届出」、「蓄電所所有なら必須」は発電事業の届出に当たる。sourceUrl を空にした faq 7 件（gijutsu-01/02/04・hojokin-02/03・sonota-04・jigyou-01）と policy-events/vpp-bess-deep-rewrite-2026-05 の出典の作り直し。
- **links.url が必須項目**: 非表示にした 4 件（nagoya-env・chiba-env・climate-group-jp・kyoto-env）と occto-data は旧 URL（死・反証済み）のまま。到達できないので実害はないが、作り直すときに差し替える。
- **■2-13 JEPX の 1 ULP 差分（上流 eic-data-pipeline・提案のみ）**: 変化検知は上流の nightly-fetch.yml が `git diff --cached --quiet`（CSV のバイト比較）。今日の取込（commit 76ddbf1）は jepx-spot 10 系列 8,726 行が変化、|Δ|>0.005 は 0 行（最大 2.84e-14・1 ULP 8,715 行・2 ULP 11 行）、変わったのは 2012-04-02〜2025-03-31 の過去行だけ。原因は io.py の `pd.read_csv` の既定パーサ（正しく丸めない）と前日のバックフィルとの往復。**依頼の「小数第 2 位で丸めて比較」では x.xx5 の境界で 132 行が残り、本物の小改定も捨てる**ため、`float_precision="round_trip"`＋許容差 1e-9 の差し戻しを提案（別リポジトリのため適用していない。diff は scratchpad のコード監査メモ）。bess-net 側に比較処理は無い（src/data/eic は gitignore・prebuild が上書き）。
- **/market/jepx**: `getIndicatorsByIdPrefix('jepx-')` がスプレッド 30 系列も拾い、本文が「40 系列」・HTML が約 10.5MB（見出しは「10 系列」）。'jepx-spot-' に絞る案。
- **/dashboard/market** の燃料の遅れ月数（nowD＝サーバの TZ）を runDate（JST）に揃える件は任意として未実施。

## (7) 申告

- **削除操作なし**（rm／rmdir／Remove-Item を使っていない）。一時物はすべて残している: scratchpad の `ck1a/` 一式（live_*.json・計画生成・検証スクリプト・ビルドログ・`dump_excl.ts`＝使わなかった下書き）、ワークフローの各エージェントの作業ファイル（`ck1a/agents/` 配下・各エージェントが列挙）、`.next/cache/fetch-cache` は削除せず scratchpad へ移動（fetch-cache-ck1a-1〜3）。
- **リポジトリ内に一時ファイルを 1 つ作った**: `scripts/.ck1a-dump-exclusions.ts`（報告用に除外リストを JSON で出す）。消さずに scratchpad へ mv した（除外リストの追加後に取り直すため、もう一度 scripts/ へ戻して実行し、再び scratchpad へ mv。コミットには含めていない）。
- **PATCH が 1 件 HTTP 400 で止まった**: links/kyoto-env の url を "" にする PATCH が「'url' field required error」で拒否され（変更なし）、スクリプトが例外で停止した（ログ未書き出し）。以後は 1 件の失敗で止まらないよう修正し、ログは 1 回目の出力から再構成した（`scripts/ck1a-patch-log-2026-09-22.json`）。同じ理由の 3-7 の 3 件・A11-2-07-a/c は実行していない。
- **依頼の字義から外れたもの**: (a) links の url を空にする 5 件 → 必須項目のため不可、非表示で代替（occto-data・kyoto-env は ■3 段階で非表示に追加）。(b) 非表示にした補助金・事業者・links の詳細は 200＋noindex ではなく 404（実在しないものを見せない）。既存の jepx-prices（統合）は 200＋noindex のまま。(c) energy-storage-summit-eu-2026 は (b) の機械抽出に当たるが ■3-1 の承認を優先して非表示にしなかった。(d) 2-1 は「制度概要が無ければ空」の字義ではなく、3127.html がリンクする県公式「ゼロナビしが」の逐語で要約した（空にすると蓄電池の条件が消えるため。3127.html 自体の本文は 1 文のみ）。(e) 2-13 は変化検知が別リポジトリにあるため提案だけ。(f) 2-6 は依頼の 2 ファイルに加え、同型の /faq と getOperatorCountSafe の 4 呼び出し元も揃えた。
- **ブラウザ**: 調査エージェントが enecho のページで「Human Verification」画面に当たり、操作せず未取得とした。最後に使ったタブは spglobal のページのまま。PDF への遷移はしていない。
- **ワークフロー**: 調査 6 本＋反証 4 本（計 10 エージェント）。microCMS への書込は本体のスクリプトだけ（エージェントは GET のみ）。
- **最終確認の 1 回目は無効**: 検査スクリプトの `grep -P` がこの環境のロケールで動かず、件数が検査されないまま 0 と出た（イベント一覧の読み込みも失敗）。perl に直し、表示中のレコードを「対照」として数えて検査が効いていることを確かめたうえで取り直した。§4 はその取り直しの出力。
- **報告用のデータ取り出しで 1 回ハング**: `npx tsx -e` が終わらず、TaskStop で止めた（その際に出力先の JSON が 0 バイトになったが、削除はしていない・同じファイルを作り直した）。
- **Vercel**: microCMS の PATCH ごとに webhook のビルドが積まれ、615089d 宛て 63 件が 12:11Z に「Canceled from the Vercel Dashboard」になった（当方は操作していない）。本番は全 PATCH の後に始まった bce4b51 のビルド（12:11:10Z success）で、PATCH 後の内容を含む。

