# Lc-3 ■1 資料名の実在監査 — 全件判定表（2026-09-20）

> 読取専用の調査結果。**是正は未実施**（Lc-3 ■1(d)「是正は報告後・私の指示で」に従う）。
> 例外として、Lc-3 ■0 で実在名が確定していた 2 名称の取りこぼし 3 箇所のみ commit c13174c で是正済み。

## 集計

| 判定 | 件数 |
|---|---|
| 不在 | 34 |
| 表記ゆれ | 53 |
| 未確認 | 21 |
| 実在 | 70 |
| **合計** | **178** |

- 抽出元: src（.ts/.tsx・src/data/eic 除く）64 件／microCMS（当サイト編集物）147 件 → ユニーク 178 種
- news の PR 逐語 502 件は第三者の文章のため監査対象外
- 外部サイトへの HTTP リクエスト計 184（同一 URL の重複取得なし・取得間隔 1 秒）
- **src には「不在」が 0 件**。不在 34 件はすべて microCMS（explainer.sources 32・glossary.detail 2）

## 不在（34 件）

| 発行元 | 当サイトの資料名 | 正しい名称／備考 | 所在 |
|---|---|---|---|
| 電力広域的運営推進機関 | 需給調整市場参加要綱 | 取引規程（需給調整市場）／需給調整市場の参加申込（いずれも一般社団法人 電力需給調整力取引所＝EPRX） | explainer/aggregator-business.sources |
| 電力広域的運営推進機関 | 需給調整市場 業務マニュアル | （実務上の正しい参照先）一般社団法人 電力需給調整力取引所（EPRX）「需給調整市場に係る取引規程等」／EPRX「需給調整市場かいせつ資料」（2026年3月13日 第2版）。なお OCCTO の「業務マニュアル」シリーズは容量市場のみ | explainer/balancing-market-practical.sources |
| 一般送配電事業者各社 | 需給調整市場参加要綱 | （近い実在資料）経済産業省「需給調整市場ガイドライン」／EPRX「需給調整市場の概要・商品要件」 | explainer/balancing-market-practical.sources, explainer/balancing-market.sources |
| NEDO | 次世代蓄電池冷却技術 | （近い実在名）グリーンイノベーション基金事業「次世代蓄電池・次世代モーターの開発」／「革新型蓄電池実用化促進基盤技術開発」 | explainer/battery-cooling-systems.sources |
| 電池工業会 | 蓄電池温度管理ガイドライン | — | explainer/battery-cooling-systems.sources |
| 資源エネルギー庁 | 次世代蓄電池技術開発 | （実在する近い名称）NEDO「革新型蓄電池実用化促進基盤技術開発」／NEDO グリーンイノベーション基金事業「次世代蓄電池・次世代モーターの開発」 | explainer/battery-types-and-specs.sources |
| JESC（電気保安協会） | 保安規程ガイドライン | （保安規程そのものの手引きは）経済産業省 産業保安監督部「保安規程に関する手続き」／JESC の規格体系では JEAC 8021（JESC E0021）「自家用電気工作物保安管理規程」 | explainer/bess-epc-selection.sources |
| 業界団体（特定なし） | 蓄電池リスク評価指針 | （近い実在資料）総務省消防庁「蓄電池設備のリスクに応じた防火安全対策検討部会報告書」（令和5年3月）／製品評価技術基盤機構（NITE）「公共調達・重要インフラ向け蓄電池システムの安全ガイドライン」 | explainer/bess-insurance-guide.sources |
| 日本損害保険協会 | 再生可能エネルギー保険 | — | explainer/bess-insurance-guide.sources |
| 電力広域的運営推進機関 | 容量市場・需給調整市場 公表データ | 容量市場関係の情報・手続き（OCCTO）／需給調整市場の取引データは EPRX「取引実績」「取引実績の取りまとめ結果」 | explainer/bess-revenue-simulation.sources |
| 資源エネルギー庁 | 蓄電池事業の経済性評価 | 系統用蓄電池の現状と課題（資源エネルギー庁） | explainer/bess-revenue-simulation.sources |
| 資源エネルギー庁 | 蓄電池の安全性に関する技術指針 | （近い実在物）公共調達・重要インフラ向け蓄電池システムの安全ガイドライン（2026年4月17日）／蓄電所に対する保安規制のあり方について（2022年4月15日・電力安全課） | explainer/bess-safety-and-fire.sources |
| 日経BP | 蓄電所事業者分類 | — | explainer/bess-stakeholder-map.sources |
| IEEE | Energy Management System Standards | IEC 61970（Energy management system application program interface (EMS-API)）／IEEE 2030 シリーズ | explainer/bms-vs-ems.sources |
| OCCTO | 発動指令電源の応動評価 | 容量市場 業務マニュアル 実需給期間中リクワイアメント対応（発動指令電源）編／容量市場 業務マニュアル 実効性テスト編 | explainer/capacity-market-advanced.sources |
| NREL | Battery Storage Sizing Guide | （近い実在資料）Optimal Sizing of a Solar-Plus-Storage System for Utility Bill Savings（NREL/TP、docs.nrel.gov/docs/fy17osti/66088.pdf） | explainer/capacity-output-design.sources |
| 資源エネルギー庁 | 蓄電池の市場参加について | 系統用蓄電池の現状と課題（2024年5月29日 資料5）／系統用蓄電池の接続・利用の在り方について（2022年9月14日・2023年12月6日ほか） | explainer/capacity-output-design.sources |
| 電気保安協会 | 保安管理業務外部委託ガイドライン | 保安管理業務外部委託承認制度（経済産業省 産業保安監督部） | explainer/chief-electrical-engineer.sources |
| 資源エネルギー庁 | 再エネ特措法 改正の背景 | （近い実在資料）「再エネ特措法の改正等について」（2021年10月14日 資料2）／「改正再エネ特措法の施行に向けて」（2024年1月25日 資料1） | explainer/fip-and-bess.sources |
| 電力広域的運営推進機関 | 需給調整市場・容量市場について | 容量市場の概要について／需給調整市場の概要（いずれも別資料） | explainer/fip-and-bess.sources |
| 資源エネルギー庁 | 系統用蓄電池の活用について | 系統用蓄電池の接続・利用の在り方について／系統用蓄電池の現状と課題／系統用蓄電池の迅速な系統連系に向けて | explainer/grid-scale-bess.sources |
| 資源エネルギー庁 | 電力市場の状況について | （近い実在資料）「電力システムを取り巻く現状」（2024年1月22日 資料3） | explainer/jepx-arbitrage.sources |
| 電気事業連合会 | 電力単位の基礎 | kW（電力）とkWh（電力量）の違いって？（Enelog vol.45 SPECIAL ISSUE） | explainer/kwh-vs-mwh.sources |
| 環境省 | 再エネ普及における地域配慮の手引き | （近い実在資料）地域脱炭素のための促進区域設定等に向けたハンドブック（第4版）／環境省地域脱炭素政策調整担当参事官室・2024年4月 | explainer/local-ordinance-and-resident-consultation.sources |
| NEDO | 蓄電池長期運用研究 | — | explainer/om-service-selection.sources |
| 電気保安協会 | 電気主任技術者業務ガイドライン | （制度の正しい参照先）経済産業省 各産業保安監督部「保安管理業務外部委託承認制度」／電気事業法施行規則第52条第2項 | explainer/om-service-selection.sources |
| 電力広域的運営推進機関 | 系統運用について | （近い実在ページ）電力広域的運営推進機関「系統の接続および利用ルールについて」（https://www.occto.or.jp/grid/business/setsuzoku.html）／「全国の需給状況や系統の運用状況の監視を行います」（https://www.occto.or.jp/occto/about_occto/jukyu_chousei_kinou.html） | explainer/renewable-curtailment-and-bess.sources |
| NEDO | 蓄電池長期運用技術 | （NEDO の実在事業名の例）先進・革新蓄電池材料評価技術開発（第2期）／革新型蓄電池実用化促進基盤技術開発／次世代全固体蓄電池材料の評価・基盤技術開発 | explainer/soc-soh-degradation-management.sources |
| 電池工業会 | リチウムイオン電池の運用ガイドライン | （近い実在物）リチウムイオン二次電池の安全で正しい使い方／3V系リチウム一次電池使用機器の安全設計ガイドライン 第3版／電池器具安全確保のための表示に関するガイドライン 第6版 | explainer/soc-soh-degradation-management.sources |
| 資源エネルギー庁 | FIP制度・併設型蓄電池の運用 | （近い実在資料）資源エネルギー庁「FIP制度に関する政策措置について」（2024年9月30日 資料1）／経済産業省「系統用・再エネ併設蓄電システムのコスト面・収益面での課題整理」（2024年8月29日・2024年度第3回定置用蓄電システム普及拡大検討会） | explainer/solar-bess-hybrid.sources |
| NEDO | V2G実証事業 | 需要家側エネルギーリソースを活用したバーチャルパワープラント構築実証事業（V2Gアグリゲーター事業）／発行元は資源エネルギー庁（執行：一般社団法人環境共創イニシアチブ SII） | explainer/v2g-vehicle-to-grid.sources |
| 資源エネルギー庁 | 次世代モビリティ戦略 | モビリティDX戦略（経済産業省 製造産業局自動車課モビリティDX室・国土交通省物流自動車局／2024年5月策定・2025年6月アップデート） | explainer/v2g-vehicle-to-grid.sources |
| （記載なし。文脈上は経済産業省） | 使用済み蓄電池の再利用・リサイクル制度検討会 | （近い実在名）蓄電池のサステナビリティに関する研究会（経済産業省）／車載用電池を指すなら 産業構造審議会 自動車リサイクルWG | glossary/nite.detail |
| 日本記者クラブ | 記者クラブ倫理規範 | 新聞倫理綱領（日本新聞協会） | glossary/pr-article.detail |

## 表記ゆれ（53 件）

| 発行元 | 当サイトの資料名 | 正しい名称／備考 | 所在 |
|---|---|---|---|
| 資源エネルギー庁 | 特定卸供給事業（アグリゲーター）について | 特定卸供給事業にかかる届出義務について（ページ名）／特定卸供給事業について（特定卸供給事業の届出に係る事業者説明会資料）（資料名） | explainer/aggregator-business.sources |
| Energy-Storage.News | Fluence × ENERES | Fluence launching BESS trading, optimisation in Japan this year with aggregator ENERES | explainer/ai-optimization-for-bess.sources |
| 情熱電力 | 需給調整市場2026年度上限価格半減 | 【緊急解説】2026年度、需給調整市場の上限価格が半減！？系統用蓄電池ビジネスへの深刻な影響と対策 | explainer/balancing-market-cap-cut-2026.sources |
| 資源エネルギー庁 | 需給調整市場の運用 | 需給調整市場について（資源エネルギー庁／制度検討作業部会・電力安定供給WG 資料） | explainer/balancing-market-practical.sources |
| 資源エネルギー庁 | 需給調整市場における取引動向 | 需給調整市場について（資源エネルギー庁 審議会提出資料） | explainer/balancing-market.sources |
| 旭化成 | 蓄電池運用最適化システム | 蓄電池運用最適化システムの共同開発について | explainer/battery-degradation-diagnostics.sources |
| Bloomberg NEF | Battery Storage Market Outlook | Energy Storage Market Outlook（半期刊。例: 2H 2025 Energy Storage Market Outlook） | explainer/battery-types-and-specs.sources |
| MUFG | フルマーチャント蓄電所PF | 本邦系統用蓄電池設備によりフルマーチャントを前提に行う事業に対する本邦初のプロジェクトファイナンス組成について（株式会社三菱UFJ銀行、2025年5月7日） | explainer/bess-esg-green-finance.sources |
| MUFG | フルマーチャント前提のPF | 本邦系統用蓄電池設備によりフルマーチャントを前提に行う事業に対する本邦初のプロジェクトファイナンス組成について（2025年5月7日・株式会社三菱UFJ銀行） | explainer/bess-pf-merchant-vs-multiuse.sources |
| 消防庁 | 蓄電池設備の規制について | 蓄電池設備の基準（昭和四十八年二月十日 消防庁告示第二号） | explainer/bess-safety-and-fire.sources |
| 翌桧地所 | BESSに最適な土地条件 | 【2025年最新版】BESS(系統用蓄電所)に最適な土地条件と選定ポイント | explainer/bess-site-acquisition.sources |
| 資源エネルギー庁 | 容量市場の運用について | 容量市場について（資源エネルギー庁 審議会提出資料）／一般向け解説なら「くわしく知りたい！4年後の未来の電力を取引する「容量市場」」（エネこれ） | explainer/capacity-market-advanced.sources |
| 資源エネルギー庁 | 容量市場の制度設計 | 容量市場について（資源エネルギー庁の審議会資料の表題）／容量市場の制度詳細について（OCCTO 説明会資料） | explainer/capacity-market.sources |
| 電力広域的運営推進機関 | 容量市場 発動指令電源評価 | 容量市場 業務マニュアル 実需給期間中リクワイアメント対応（発動指令電源）編／同 実効性テスト編（電力広域的運営推進機関） | explainer/capacity-output-design.sources |
| 資源エネルギー庁 | FIP制度の概要 | FIP制度について（資源エネルギー庁）／再生可能エネルギー FIT・FIP制度ガイドブック（年度版） | explainer/fip-and-bess.sources |
| IEEFA | Japan grid-scale BESS market | Japan's grid-scale BESS market: Turning market hype into reality | explainer/global-bess-trends-2026.sources |
| 関西電力T&D | 系統情報公表ホームページ | 系統情報の公開（関西電力送配電「流通設備建設計画・系統連系制約等」内のセクション名） | explainer/grid-capacity-map-reading.body |
| 東京電力パワーグリッド | 系統情報サービス | 系統情報（東京電力パワーグリッド）／「系統情報サービス等」は電力広域的運営推進機関（OCCTO）の名称 | explainer/grid-capacity-map-reading.body |
| 資源エネルギー庁 | 電力ネットワーク次世代化検討資料 | 電力ネットワークの次世代化（2022年2月14日 資料3）／電力ネットワークの次世代化について（2024年9月11日 資料8 等） | explainer/grid-connection-process.body |
| 各一般送配電事業者 | 系統情報公表 | （各社のページ名）例：東京電力パワーグリッド「当社における系統情報について」。制度上の根拠名は資源エネルギー庁「系統情報の公表の考え方」 | explainer/grid-connection-process.body |
| 電力広域的運営推進機関（OCCTO） | 系統情報の公表について | 系統情報サービス等（電力広域的運営推進機関）／規定名は「本機関等が公表する系統情報の項目等」。制度上の考え方は資源エネルギー庁「系統情報の公表の考え方」 | explainer/grid-connection-process.sources |
| 経済産業省 | 電気事業法の改正等について | 電気事業法の一部を改正する法律について（令和8年7月 経済産業省 大臣官房産業保安・安全グループ 資料1）／改正概要の解説なら「電気事業法改正の概要について」（令和4年10月31日 産業保安グループ電力安全課） | explainer/grid-scale-bess.sources |
| OCCTO | 容量市場の運営について | 容量市場の概要について（電力広域的運営推進機関 説明会資料）／容量市場メインオークションの概要について | explainer/grid-scale-bess.sources |
| 経産省 | インバランス料金制度の見直し | インバランス料金制度の詳細設計等について（電力・ガス取引監視等委員会 制度設計・監視専門会合 事務局提出資料） | explainer/imbalance-pricing-and-bess.sources |
| 電力・ガス取引監視等委員会 | 卸電力市場の動向 | 電力取引の状況（電力取引報結果）／電力市場のモニタリングレポート（電力・ガス取引監視等委員会） | explainer/jepx-arbitrage.sources |
| JEPX | 取引データ | 市場情報（スポット市場）。ページ内見出しは「取引市場データ」 | explainer/jepx-arbitrage.sources |
| JEPX | 市場の概要 | 取引概要 | explainer/jepx-arbitrage.sources, explainer/grid-scale-bess.sources |
| 資源エネルギー庁 | 電力統計 | 電力調査統計 | explainer/kwh-vs-mwh.sources |
| JEPX | 市場価格データ | 市場情報（下層ページ名は「スポット市場」） | explainer/kwh-vs-mwh.sources, explainer/bess-revenue-simulation.sources |
| 資源エネルギー庁 | VPP・DRの取組について | バーチャルパワープラント・ディマンドリスポンスについて（下層に「VPP・DRとは」「取組事例の紹介」「VPP・DR普及に関する施策」） | explainer/low-voltage-resources-and-vpp.sources |
| 経済産業省 | 分散型エネルギーシステムの将来像 | 再エネ大量導入時代における分散型エネルギーシステムのあり方（2024年9月30日 資源エネルギー庁 資料2）／次世代の分散型電力システムに関する検討会 中間とりまとめ | explainer/low-voltage-resources-and-vpp.sources |
| SII | 需要家側エネルギーリソース活用に関する実証事業 | 需要家側エネルギーリソースを活用したバーチャルパワープラント構築実証事業費補助金 | explainer/low-voltage-resources-and-vpp.sources |
| 日経BP | リチウムイオン電池の募集量激減へ | 長期脱炭素電源オークション、リチウムイオン電池の募集量激減へ | explainer/ltdc-3rd-auction-ccs-ldes.sources |
| JFEエンジニアリング | JFEマルチユースEMS | 当社初となる系統用蓄電池事業の運用開始について～自社開発"JFEマルチユースEMS"により蓄電池を最適活用～（JFEエンジニアリング／アーバンエナジー、2024年10月21日） | explainer/multi-use-operation-strategy.sources |
| 電気学会 | 系統連系規程 | 一般社団法人 日本電気協会「系統連系規程 JEAC 9701-2024」（発行元が誤り） | explainer/pcs-selection-guide.sources |
| 経済産業省 | 蓄電池産業政策 | 蓄電池・電源産業戦略（2026年6月2日 蓄電池産業戦略推進会議。2022年8月31日策定の「蓄電池産業戦略」を改訂） | explainer/pcs-selection-guide.sources, explainer/battery-types-and-specs.sources |
| 電気事業連合会 | 電力制御システムセキュリティガイドライン | 日本電気協会「電力制御システムセキュリティガイドライン JEAG1111-2024（JESC Z0004(2025)）」（発行元が誤り） | explainer/remote-monitoring-selection.sources |
| 資源エネルギー庁 | 再エネの出力制御について | 出力制御について（なるほど！グリッド） | explainer/renewable-curtailment-and-bess.sources |
| 各一般送配電事業者 | 出力制御見通し | 再生可能エネルギー出力制御の見通し（各社）／再生可能エネルギー出力制御の長期見通し等について（資源エネルギー庁 系統WG） | explainer/renewable-curtailment-and-bess.sources |
| SII | 需要家主導型太陽光発電導入支援事業 | 需要家主導型太陽光発電・再生可能エネルギー電源併設型蓄電池導入支援事業費補助金（執行団体は JPEA太陽光発電推進センター。SII ではない） | explainer/solar-bess-hybrid.sources |
| 資源エネルギー庁 | 蓄電池産業政策 | 蓄電池・電源産業戦略（2026年6月2日改訂。旧称「蓄電池産業戦略」2022年8月31日 蓄電池産業戦略検討官民協議会） | explainer/subsidies-guide.sources |
| OCCTO | 系統情報の公表の考え方 | 系統情報の公表の考え方（発行元は資源エネルギー庁 電力・ガス事業部。OCCTO ではない） | explainer/substation-availability-13-indicators-guide.sources |
| 東京都都市整備局 | 新築建物太陽光発電設備設置等義務制度 | 建築物環境報告書制度（東京都環境局） | explainer/tokyo-solar-mandate-2025.sources |
| 経産省 | アグリゲーターガイドライン | エネルギー・リソース・アグリゲーション・ビジネスに関するガイドライン（ERABガイドライン） | glossary/aggregator-business.detail |
| 電力広域的運営推進機関 | 容量市場 追加オークション（対象実需給年度：2027年度）約定結果 | 容量市場追加オークション約定結果（対象実需給年度：2027年度）〔お知らせ表題は「…の公表について」〕 | glossary/area-price.detail |
| 日本卸電力取引所（JEPX） | 非化石価値取引市場 オークション結果 | 非化石価値取引 市場情報（JEPX）。市場の正式名称は「高度化法義務達成市場」「再エネ価値取引市場」 | glossary/power-market-price-trend.detail |
| OCCTO | 募集要綱（応札年度2026年度） | 容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度） | policy-events/meti-stable-supply-wg6-ltdc-round4-final-2026-08.description |
| 経済産業省（第2回電力安定供給WG） | 予備電源の第3回以降の募集内容及び容量市場の供給力確保時期の見直し（案） | 予備電源の第3回以降の募集内容及び容量市場の供給力確保時期の見直しについて（案）（第2回 電力安定供給ワーキンググループ 参考資料2） | policy-events/occto-yobidengen-boshuyoukou-pubcomm-2026-07.description |
| 総務省消防庁 | 蓄電池設備の規制（消防関係法令による規制体系） | 蓄電池設備の規制（資料１－４）／【消防関係法令による蓄電池設備の規制体系】 | src/app/lv/regulation-subsidy/page.tsx:179 / src/app/lv/buying-guide/page.tsx:167 / src/app/lv/risks/page.tsx:155 |
| DOWAエコジャーナル | リチウムイオン電池の貯蔵に関する消防法の規制見直し（2024） | リチウムイオン電池の貯蔵に関する消防法の規制が見直されました | src/app/lv/regulation-subsidy/page.tsx:185, src/app/lv/risks/page.tsx:161 |
| 日経BP メガソーラービジネス | 低圧蓄電所の開発が活発化 | 「低圧」蓄電所の開発が活発化、アグリや区画販売も | src/app/lv/what-is/page.tsx:159 |
| OCCTO | 長期脱炭素電源オークション約定結果（応札2023年度）落札電源一覧 | 容量市場 長期脱炭素電源オークション約定結果（応札年度：2023年度） 別紙：落札電源一覧 | src/components/Report2026Body.tsx:240 |
| 日経エネルギーNext | 系統用蓄電池が殺到、長期脱炭素電源オークション初回入札結果 | 系統用蓄電池が殺到、長期脱炭素電源オークションの初回入札結果をひもとく | src/components/Report2026Body.tsx:241 |

## 未確認（21 件）

| 発行元 | 当サイトの資料名 | 正しい名称／備考 | 所在 |
|---|---|---|---|
| 経済産業省 | 電気事業法に基づく工事計画 | — | explainer/bess-epc-selection.sources |
| 電気学会 | 電力系統制御技術 | — | explainer/bms-vs-ems.sources |
| 経済産業省 | 電気事業法および関連政令・省令 | — | explainer/chief-electrical-engineer.sources |
| 資源エネルギー庁 | 電気保安制度 | 再エネ発電設備に係る電気保安制度について（2024年10月9日・産業保安・安全グループ電力安全課） | explainer/chief-electrical-engineer.sources |
| EIC Data Insight #75 | EU ETS×日本GX-ETS | — | explainer/eu-ets-and-gx-ets-for-bess.sources |
| 経済産業省 | 排出量取引制度（GX-ETS） | — | explainer/eu-ets-and-gx-ets-for-bess.sources |
| 資源エネルギー庁 | ノンファーム型接続 | — | explainer/grid-connection-process.sources |
| 経済産業省 | 長期脱炭素電源オークション制度 | （資料として引くなら）資源エネルギー庁「長期脱炭素電源オークションについて」／「長期脱炭素電源オークションガイドライン」（2023年7月11日策定・2025年8月27日改定） | explainer/long-term-decarbonization-auction.sources |
| SII | 補助金事業 公募情報 | — | explainer/subsidies-guide.sources |
| 総務省消防庁 | 総務省消防庁資料（資料名なし） | （候補）総務省消防庁「蓄電池設備のリスクに応じた防火安全対策検討部会報告書」（令和5年3月） | src/app/lv/buying-guide/page.tsx:117 |
| 電力需給調整力取引所（EPRX） | EPRX 2026年7月30日公表（資料名なし） | 需給調整市場のΔkW上限価格について（2026/7/30 更新） | src/app/lv/regulation-subsidy/page.tsx:108 |
| 総務省消防庁／DOWAエコジャーナル | 総務省消防庁資料・DOWAエコジャーナル解説（資料名なし） | — | src/app/lv/regulation-subsidy/page.tsx:88 |
| 総務省消防庁 | 総務省消防庁資料・2024年の規制見直し解説（資料名なし） | — | src/app/lv/risks/page.tsx:113 |
| 日経BP | メガソーラービジネス（媒体名のみ・記事名なし） | — | src/app/lv/what-is/page.tsx:123 |
| 関西電力 | 関西電力 法人向け解説（資料名なし） | — | src/app/lv/what-is/page.tsx:78 |
| JEPX／OCCTO／SII／NREL | JEPX/OCCTO/SII 公表資料、業界EPC公表値、NREL ATB (CC BY 4.0) | — | src/app/tools/irr-simulator/page.tsx:148 |
| NREL | NREL ATB参考値 | Annual Technology Baseline (ATB) — 該当ページは Utility-Scale Battery Storage ／ Electricity ／ ATB | src/components/LcoeLcosCalculator.tsx:281 |
| OCCTO／日経エネルギーNext／PVeye | OCCTO 約定結果（資料名の特定なし） | 容量市場メインオークション約定結果（対象実需給年度：〇〇年度）／長期脱炭素電源オークションの場合は同オークションの約定結果公表資料 | src/components/Report2026Body.tsx:101 |
| 経済産業省・資源エネルギー庁／OCCTO | （資料名なし・省庁名のみ） | — | src/components/Report2026Body.tsx:78 |
| NEA／CNESA／Carbon Brief／S&P Global／ess-news | Carbon Brief (136号文) ほか | — | src/data/global-markets.ts:125 |
| 印政府・内閣／SECI／IEEFA／JMK Research／ess-news | （資料名なし・機関名のみ）VGF ほか | — | src/data/global-markets.ts:160 |

## 実在（70 件）

| 発行元 | 当サイトの資料名 | 正しい名称／備考 | 所在 |
|---|---|---|---|
| 電力広域的運営推進機関（OCCTO） | 需給調整市場の概要 | — | explainer/balancing-market.sources |
| EPRX | 需給調整市場のΔkW上限価格について | — | explainer/balancing-price-cap-10yen-explainer.sources / explainer/balancing-price-cap-10yen-explainer.body |
| 日経エネルギーNext | 系統用蓄電池事業への参入企業は4分類 | （完全な表題）系統用蓄電池事業への参入企業は4分類、電気事業ノウハウのない企業も | explainer/bess-business-decision-tree.sources |
| 三井住友銀行 | 再エネ導入の鍵、系統用蓄電池事業に国内初の融資 | — | explainer/bess-pf-merchant-vs-multiuse.sources |
| 経産省 | 蓄電池産業戦略 | — | explainer/bess-supply-chain-responsibility.sources, glossary/v2x.detail |
| OCCTO | 容量市場 業務マニュアル | — | explainer/capacity-market-advanced.sources |
| OCCTO | メインオークション約定結果 | （完全な表題）容量市場メインオークション約定結果（対象実需給年度：XXXX年度） | explainer/capacity-market.sources |
| 電力広域的運営推進機関 | 容量市場 業務マニュアル | — | explainer/capacity-market.sources |
| OCCTO | 容量市場の概要 | — | explainer/capacity-market.sources |
| 環境省 | 脱炭素先行地域 | — | explainer/decarbonization-leading-regions-detail.sources |
| 電力広域的運営推進機関（OCCTO） | 系統情報サービス | — | explainer/grid-connection-process.body |
| 資源エネルギー庁 | 電力ネットワークの次世代化 | — | explainer/grid-connection-process.sources |
| 電力広域的運営推進機関 | 需給調整市場の概要 | — | explainer/grid-scale-bess.sources |
| EIC Data Insight #74 | LCOE×電源構成 | — | explainer/lcoe-and-power-mix.sources |
| SOLAR JOURNAL | 2026年、日本の電力需要家に訪れる3つの大変革 | — | explainer/low-voltage-balancing-market-launch.sources |
| OCCTO | 容量市場 長期脱炭素電源オークション約定結果 | — | explainer/ltdc-3rd-auction-ccs-ldes.sources |
| ユーラスエナジー | 需給調整市場とは | — | explainer/multi-use-operation-strategy.sources |
| NEDO | 次世代全固体蓄電池材料の評価・基盤技術開発 | — | explainer/solid-state-battery-grid-deployment.sources |
| エナリス | 再エネ併設蓄電池 制御支援サービス | — | explainer/storage-parity-aggregation.sources |
| NEDO | 公募情報 | — | explainer/subsidies-guide.sources |
| 東京都環境局 | ゼロエミッション東京戦略 | — | explainer/tokyo-solar-mandate-2025.sources |
| 経済産業省 | 定置用蓄電システムの現状と課題 | — | glossary/battery-storage-site.detail |
| 電力広域的運営推進機関 | 容量拠出金を知ろう！ | — | glossary/capacity-contribution.detail |
| 環境省 | グリーンローンガイドライン | — | glossary/green-loan.detail |
| LMA（ローン・マーケット・アソシエーション）等 | グリーンローン原則（GLP） | — | glossary/green-loan.detail |
| 電力広域的運営推進機関 | 電源接続案件募集プロセス | — | glossary/interconnection-cost-burden.detail |
| 資源エネルギー庁 | 発電等設備の設置に伴う電力系統の増強及び事業者の費用負担等の在り方に関する指針 | — | glossary/interconnection-cost-burden.detail |
| 資源エネルギー庁 | なるほど！グリッド 出力制御について | — | glossary/n-1-densei.detail |
| 電力広域的運営推進機関 | N-1電制の基本的な考え方について | — | glossary/n-1-densei.detail |
| 電力広域的運営推進機関（OCCTO） | 容量市場 メインオークション約定結果 | — | glossary/power-market-price-trend.detail |
| 電力需給調整力取引所 | 取引実績の取りまとめ結果 | — | glossary/power-market-price-trend.detail |
| 電力需給調整力取引所 | 需給調整市場のΔkW上限価格について | — | glossary/power-market-price-trend.detail, explainer/balancing-market-fcr-detail.body, explainer/balancing-market-cap-cut-2026.body |
| 日本インタラクティブ広告協会（JIAA） | インターネット広告倫理綱領 | — | glossary/pr-article.detail |
| 環境省 | ストレージパリティの達成に向けた太陽光発電設備等の価格低減促進事業 | — | news/news-weekly-2026-09-w1.body |
| 電力・ガス取引監視等委員会／経済産業省 | 適正な電力取引についての指針 | — | policy-events/balancing-market-reform-2026-03.description |
| 電力広域的運営推進機関 | 長期脱炭素電源オークション 容量確保契約約款 | — | policy-events/ltdc-2026-boshuyoukou-kouhyou-2026-09.description |
| 電力広域的運営推進機関 | 容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度） | — | policy-events/ltdc-2026-boshuyoukou-kouhyou-2026-09.description |
| 経済産業省 | 蓄電池・電源産業戦略 | — | policy-events/meti-next-gen-battery-rd-plan-pubcomm-2026-07.description |
| OCCTO | 容量確保契約約款 | — | policy-events/meti-stable-supply-wg6-ltdc-round4-final-2026-08.description |
| 東京電力パワーグリッド | 当社における系統情報について | — | src/app/grid/tokyo/status/page.tsx:149, explainer/tepco-pg-grid-info-suspension-2026.sources |
| JEPX | 利用する場合は、出所を明示した上でご利用下さい（著作権条項の逐語） | — | src/app/industry/page.tsx:263, src/lib/eic-license.ts:146 |
| JEPX | リンクについて | — | src/app/industry/page.tsx:266 |
| 九州電力送配電 | 蓄電池等の低圧電線路への連系申込みについて | — | src/app/lv/entry-guide/page.tsx:159 |
| 資源エネルギー庁 | 系統用蓄電池の迅速な系統連系に向けて | — | src/app/lv/entry-guide/page.tsx:165 |
| GridWatch | 太陽光・蓄電池、JC-STAR★1が連系条件へ | — | src/app/lv/regulation-subsidy/page.tsx:191, src/app/lv/entry-guide/page.tsx:171 |
| OCCTO | 第57回需給調整市場検討小委員会資料 | — | src/app/lv/regulation-subsidy/page.tsx:95 |
| OCCTO（電力広域的運営推進機関） | 第57回 需給調整市場検討小委員会 資料3 | — | src/app/lv/revenue-model/page.tsx:162 / src/app/lv/regulation-subsidy/page.tsx:167 |
| 経済産業省 | 第4回 電力安定供給ワーキンググループ | — | src/app/lv/revenue-model/page.tsx:168, src/app/lv/regulation-subsidy/page.tsx:173, src/app/lv/buying-guide/page.tsx:161, src/app/lv/risks/page.tsx:149 |
| 電力需給調整力取引所（EPRX） | 需給調整市場のΔkW上限価格について | — | src/app/lv/revenue-model/page.tsx:90 / glossary/power-market-price-trend.detail / explainer/balancing-market-cap-cut-2026.body / policy-events/balancing-market-price-cap-10yen-2026-09.description / policy-events/meti-stable-supply-wg4-balancing-cap-2026-07.description |
| OCCTO | 第57回需給調整市場検討小委員会 資料 | — | src/app/lv/what-is/page.tsx:120, src/app/lv/revenue-model/page.tsx:86 |
| 関西電力 | 高圧電力とは？低圧電力や特別高圧電力との違い | — | src/app/lv/what-is/page.tsx:147 |
| OCCTO（電力広域的運営推進機関） | 需給調整市場における機器個別計測・低圧リソース導入について | — | src/app/lv/what-is/page.tsx:153 |
| EPRX | summary_2024.pdf ／ summary_2025.pdf（公表元ファイル名） | — | src/app/tools/balancing-revenue/page.tsx:484 |
| NREL | NREL ATB 2024（Annual Technology Baseline） | — | src/app/tools/lcoe-lcos/page.tsx:150 |
| 一般社団法人 電力需給調整力取引所（EPRX） | 取引実績の取りまとめ結果 | — | src/app/tracker/imbalance/page.tsx:190, src/data/eprx-monthly-battery.json:_meta.source_name |
| 電力需給調整力取引所（EPRX） | 取引実績の取りまとめ結果 | — | src/app/tracker/imbalance/page.tsx:251 / src/app/tools/balancing-revenue/page.tsx:461 / src/components/BalancingSourceComparison.tsx:243 / glossary/power-market-price-trend.detail |
| EPRX | 取引実績の取りまとめ結果 | — | src/app/tracker/imbalance/page.tsx:290, src/data/milestones.ts:175 |
| 電力需給調整力取引所（EPRX）／経済産業省 | 需給調整市場のΔkW上限価格について ／ 第 4 回 電力安定供給ワーキンググループ 資料 6 | — | src/components/BalancingRevenueEstimator.tsx:187 |
| 電力需給調整力取引所（EPRX）／経済産業省 | 需給調整市場のΔkW上限価格について ／ 第4回 電力安定供給ワーキンググループ 資料6 | （正式名）総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会 電力安定供給ワーキンググループ（第4回）資料6「需給調整市場について」 | src/components/BalancingSourceComparison.tsx:249 |
| 国土交通省 | 不動産情報ライブラリ(reinfolib) ／ 国土数値情報 | — | src/components/HazardRiskCard.tsx:191 |
| JEPX | スポット市場（JEPX_SPOT_PAGE_NAME 参照） | — | src/components/JEPXDashboard.tsx:182, src/app/market/jepx/page.tsx:130 |
| PVeye／経済産業省 電力安全課 | 蓄電池設備における爆発・火災事故及びその対応 | — | src/components/Report2026Body.tsx:169 |
| 資源エネルギー庁 | 系統用蓄電池の現状と課題 | — | src/components/Report2026Body.tsx:239 |
| PVeye WEB | 脱炭素電源競売で蓄電池1GW強落札 ／ 鹿児島で大型蓄電池が全焼 | — | src/components/Report2026Body.tsx:242 |
| 経済産業省 産業保安・安全グループ 電力安全課 | 蓄電池設備における爆発・火災事故及びその対応 | — | src/components/Report2026Body.tsx:243 |
| OCCTO | 容量市場メインオークション約定結果 | — | src/data/capacity-market-history.ts:120 / src/app/tools/capacity-market-bid/page.tsx:351 |
| 豪政府DCCEEW／AEMO／Energy-Storage.News | AEMO 2026 ISP（統合系統計画） | — | src/data/global-markets.ts:195 |
| SEIA／財務省・IRS／EIA | SEIA Energy Storage Market Outlook Q1 2026 ／ IRS Notice 2026-15 (FEOC) ／ EIA | （IRS の正式表題）Notice 2026-15 "Guidance to Apply Interim Safe Harbors for Purposes of Determining a Taxpayer's Material Assistance from a Prohibited Foreign Entity; Other Prohibited Foreign Entity Guidance" | src/data/global-markets.ts:55 |
| SolarPower Europe／Terna／S&P Global | SolarPower Europe European Battery Market Outlook 2026-2030 ／ Terna (MACSE) | — | src/data/global-markets.ts:90 |
| 一般社団法人 日本卸電力取引所（JEPX） | スポット市場 | — | src/lib/eic-license.ts:143 / glossary/power-market-price-trend.detail（2 箇所） |

## 根拠（判定ごとの逐語）

### 電力広域的運営推進機関「需給調整市場参加要綱」 — 不在

- 所在: explainer/aggregator-business.sources
- 正しい名称: 取引規程（需給調整市場）／需給調整市場の参加申込（いずれも一般社団法人 電力需給調整力取引所＝EPRX）
- 根拠: url なし → WebSearch（完全一致「需給調整市場」＋参加要綱／取引規程）。OCCTO（occto.or.jp）に「需給調整市場参加要綱」という資料は 0 件。需給調整市場の参加ルールを定める実在文書は EPRX 発行で、逐語「取引規程（需給調整市場） 2025年３月14日 実施 一般社団法人電力需給調整力取引所」（https://www.eprx.or.jp/outline/docs/kitei_250314.pdf ）、参加手続のページは逐語「需給調整市場の参加申込」（https://www.eprx.or.jp/outline/application.html 、当方が HTTP 200 で取得した EPRX トップのナビゲーションにも同語を確認）。名称・発行元の双方が誤り（「◯◯要綱」は容量市場／長期脱炭素電源オークションの「募集要綱」との混同の可能性）。

### 電力広域的運営推進機関「需給調整市場 業務マニュアル」 — 不在

- 所在: explainer/balancing-market-practical.sources
- 正しい名称: （実務上の正しい参照先）一般社団法人 電力需給調整力取引所（EPRX）「需給調整市場に係る取引規程等」／EPRX「需給調整市場かいせつ資料」（2026年3月13日 第2版）。なお OCCTO の「業務マニュアル」シリーズは容量市場のみ
- 根拠: url 指定なし。WebSearch を2回（occto.or.jp 限定／ドメイン無指定）実施したが、OCCTO の「需給調整市場 業務マニュアル」は0件。occto.or.jp でヒットする業務マニュアルは全て「容量市場 業務マニュアル ○○編」（実効性テスト編・リクワイアメント対応編・容量停止計画の調整業務編など）。需給調整市場の手続書は EPRX 側（https://www.eprx.or.jp/outline/docs/kaisetsu.pdf「需給調整市場かいせつ資料 一般社団法人電力需給調整力取引所 ２０２６年３月１３日 第２版」）に存在。発行元・名称の組み合わせとして不在。

### 一般送配電事業者各社「需給調整市場参加要綱」 — 不在

- 所在: explainer/balancing-market-practical.sources, explainer/balancing-market.sources
- 正しい名称: （近い実在資料）経済産業省「需給調整市場ガイドライン」／EPRX「需給調整市場の概要・商品要件」
- 根拠: url 指定なし→ 検索を実施。一般送配電事業者各社に「需給調整市場参加要綱」という名称の公表資料は存在しない。実在するのは経産省・電力・ガス取引監視等委員会の「需給調整市場ガイドライン」（https://www.egc.meti.go.jp/info/guideline/pdf/20260313001a.pdf、表題逐語「需給調整市場ガイドライン 策定 ２０２１年３月３０日 …改定 ２０２５年３月２４日」）、EPRX「需給調整市場の概要・商品要件」（https://www.eprx.or.jp/outline/docs/gaiyoushouhin_ver.4_20240401.pdf）、EPRX「需給調整市場かいせつ資料」、各社の調整力公募の募集要綱。★発行元・名称とも当サイトの表記は実在しない。

### NEDO「次世代蓄電池冷却技術」 — 不在

- 所在: explainer/battery-cooling-systems.sources
- 正しい名称: （近い実在名）グリーンイノベーション基金事業「次世代蓄電池・次世代モーターの開発」／「革新型蓄電池実用化促進基盤技術開発」
- 根拠: WebSearch（nedo.go.jp 限定）「NEDO 次世代蓄電池 冷却技術 研究開発 プロジェクト」の結果に「次世代蓄電池冷却技術」という事業名・資料名は 1 件も存在しない。実在するのは「次世代蓄電池・次世代モーターの開発」（https://green-innovation.nedo.go.jp/project/next-generation-storage-batteries-motors/、https://www.nedo.go.jp/koubo/CD2_100286.html）、「革新型蓄電池実用化促進基盤技術開発」（https://www.nedo.go.jp/activities/ZZJP_100121.html）、「2024年度『次世代蓄電池分野に係る政策・技術開発動向調査』」（https://www.nedo.go.jp/koubo/SE2_100001_00076.html）。なお前者の説明文中に出る「冷却技術」は次世代モーター（インバーター等）側の要素技術であって蓄電池冷却の事業名ではないため、「次世代蓄電池冷却技術」という資料名の裏付けにはならない。

### 電池工業会「蓄電池温度管理ガイドライン」 — 不在

- 所在: explainer/battery-cooling-systems.sources
- 根拠: url なし → WebSearch で公式ドメイン（baj.or.jp）を特定し取得。取得 URL: https://www.baj.or.jp/publication/books01.html ／ HTTP 200。<title> 逐語「電池工業会発行書籍 ／ 一般社団法人 電池工業会」、<h1> 逐語「電池工業会発行書籍」。発行書籍一覧の本文テキストに「温度管理」は 0 件（「ガイドライン」は 13 件あるが、逐語は「3Ｖ系リチウム一次電池使用機器の安全設計ガイドライン」「一次電池安全確保のための表示に関するガイドライン（第10版）」等で、蓄電池の温度管理に関するガイドラインは掲載なし）。当該名称の刊行物は確認できない。

### 資源エネルギー庁「次世代蓄電池技術開発」 — 不在

- 所在: explainer/battery-types-and-specs.sources
- 正しい名称: （実在する近い名称）NEDO「革新型蓄電池実用化促進基盤技術開発」／NEDO グリーンイノベーション基金事業「次世代蓄電池・次世代モーターの開発」
- 根拠: WebSearch 2 本（nedo.go.jp 限定／meti.go.jp 限定）のいずれでも、資源エネルギー庁名義の「次世代蓄電池技術開発」という事業名・資料名は返らない。次世代蓄電池の技術開発事業の実施主体は NEDO で、実在名は「革新型蓄電池実用化促進基盤技術開発」（https://www.nedo.go.jp/activities/ZZJP_100121.html）、「次世代蓄電池・次世代モーターの開発」（https://green-innovation.nedo.go.jp/project/next-generation-storage-batteries-motors/）。経産省側の政策文書は「蓄電池・電源産業戦略」（2026年6月2日）で、その中に全固体電池の本格実用化目標が含まれる。→ 発行元（資源エネルギー庁）と資料名の双方が実在しない組み合わせ。

### JESC（電気保安協会）「保安規程ガイドライン」 — 不在

- 所在: explainer/bess-epc-selection.sources
- 正しい名称: （保安規程そのものの手引きは）経済産業省 産業保安監督部「保安規程に関する手続き」／JESC の規格体系では JEAC 8021（JESC E0021）「自家用電気工作物保安管理規程」
- 根拠: WebSearch 2 本で確認。(1)「JESC 日本電気技術規格委員会 保安規程 ガイドライン」→ 公式 https://www.jesc.gr.jp/ ・https://www.jesc.gr.jp/jesc/jesc.html がヒットするが「保安規程ガイドライン」という規格・文書名は存在せず、JESC の体系は JEAC/JESC 番号付き規格（例 JEAC 8021/JESC E0021 自家用電気工作物保安管理規程）。(2)「"保安規程" ガイドライン 経済産業省 電気事業法」（meti.go.jp/jesc.gr.jp/denki.or.jp 限定）→ 返るのは「保安規程に関する手続き（中部近畿産業保安監督部近畿支部）」https://www.safety-kinki.meti.go.jp/electric/jikayou/hoankitei.html、「保安規程について（中国四国産業保安監督部）」、「自家用電気工作物におけるサイバーセキュリティの確保について（METI）」等で、「保安規程ガイドライン」は 0 件。★発行元名も誤り: JESC は「日本電気技術規格委員会（Japan Electrotechnical Standards and Codes Committee）」であり「電気保安協会」ではない。

### 業界団体（特定なし）「蓄電池リスク評価指針」 — 不在

- 所在: explainer/bess-insurance-guide.sources
- 正しい名称: （近い実在資料）総務省消防庁「蓄電池設備のリスクに応じた防火安全対策検討部会報告書」（令和5年3月）／製品評価技術基盤機構（NITE）「公共調達・重要インフラ向け蓄電池システムの安全ガイドライン」
- 根拠: url 指定なし・発行元も「業界団体（特定なし）」で特定不能。WebSearch で「"蓄電池リスク評価指針"」を完全一致検索したが、この名称の文書は業界団体・公的機関のいずれにも0件。ヒットしたのは消防庁の検討部会報告書（https://www.fdma.go.jp/singi_kento/kento/items/post-116/03/houkokusho.pdf）、NITE のガイドライン（https://www.nite.go.jp/gcet/nlab/infra-guideline.html）、および保険仲立人（WTW・Marsh 等）の民間コラムのみ。発行元も名称も実在しないため不在。

### 日本損害保険協会「再生可能エネルギー保険」 — 不在

- 所在: explainer/bess-insurance-guide.sources
- 根拠: sonpo.or.jp に限定した検索で「再生可能エネルギー保険」という刊行物・ページは 0 件（返ったのは協会概要・環境取組みに関する行動計画・会員会社一覧等の一般ページのみ）。損保協会が「再生可能エネルギー保険」という名称の資料を公表している事実は確認できない（個社の商品名はあり得るが協会発行ではない）。

### 電力広域的運営推進機関「容量市場・需給調整市場 公表データ」 — 不在

- 所在: explainer/bess-revenue-simulation.sources
- 正しい名称: 容量市場関係の情報・手続き（OCCTO）／需給調整市場の取引データは EPRX「取引実績」「取引実績の取りまとめ結果」
- 根拠: WebSearch（occto.or.jp 限定）で OCCTO の該当ページ名を確認: 「容量市場関係の情報・手続き」（https://www.occto.or.jp/various/capacity-market/）、「2026年度実需給関連｜電力広域的運営推進機関」、「容量市場メインオークション約定結果（対象実需給年度：2028年度）」。「容量市場・需給調整市場 公表データ」という名称の公表物は存在しない。★さらに発行元の切り分けが誤っている: 需給調整市場の取引データの公表元は OCCTO ではなく EPRX で、取得URL https://www.eprx.or.jp/ / HTTP 200 のナビに「取引実績」「取引実績（グラフ表示）」「取引実績の取りまとめ結果」が逐語で存在する（OCCTO 側は需給調整市場検討小委員会という審議体を持つのみ）。2市場を 1 つの資料名でまとめた総称であり、発行元・資料名とも書き直しが必要。

### 資源エネルギー庁「蓄電池事業の経済性評価」 — 不在

- 所在: explainer/bess-revenue-simulation.sources
- 正しい名称: 系統用蓄電池の現状と課題（資源エネルギー庁）
- 根拠: url なし → WebSearch「資源エネルギー庁 蓄電池事業の経済性評価」。公式ドメイン（meti.go.jp / enecho.meti.go.jp）の結果に当該名称の資料は 1 件も存在しない。返ったのは「系統用蓄電池の現状と課題」（資料３、2024年5月24日 資源エネルギー庁、https://www.meti.go.jp/shingikai/enecho/shoene_shinene/shin_energy/keito_wg/pdf/051_03_00.pdf ）、「系統用蓄電池の現状と課題」（資料５、2024年5月29日、https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/pdf/062_05_00.pdf ）、「定置用蓄電システムの現状と課題」等で、いずれも「蓄電池事業の経済性評価」とは逐語一致しない。JEPX・EPRX と同型の創作名の可能性が高い。

### 資源エネルギー庁「蓄電池の安全性に関する技術指針」 — 不在

- 所在: explainer/bess-safety-and-fire.sources
- 正しい名称: （近い実在物）公共調達・重要インフラ向け蓄電池システムの安全ガイドライン（2026年4月17日）／蓄電所に対する保安規制のあり方について（2022年4月15日・電力安全課）
- 根拠: meti.go.jp / enecho.meti.go.jp 限定で "蓄電池の安全性に関する技術指針" を検索 → 0 件。返った実在資料は https://www.meti.go.jp/policy/mono_info_service/joho/conference/battery_strategy2/0007/shiryo05.pdf「『公共調達・重要インフラ向け蓄電池システムの安全ガイドライン』について」、https://www.meti.go.jp/shingikai/sankoshin/hoan_shohi/denryoku_anzen/hoan_seido/pdf/010_01_00.pdf「蓄電所に対する保安規制のあり方について」等で、いずれも名称が異なる。

### 日経BP「蓄電所事業者分類」 — 不在

- 所在: explainer/bess-stakeholder-map.sources
- 根拠: project.nikkeibp.co.jp / nikkeibp.co.jp / xtech.nikkei.com に限定した検索（"蓄電所事業者" 分類）で、その名称の記事・資料は 0 件。返ったのは「蓄電所の市場規模、2030年度4240億円規模に拡大」「『低圧』蓄電所の開発が活発化…」等の別記事のみ。日経BP に「蓄電所事業者分類」という資料は確認できない。

### IEEE「Energy Management System Standards」 — 不在

- 所在: explainer/bms-vs-ems.sources
- 正しい名称: IEC 61970（Energy management system application program interface (EMS-API)）／IEEE 2030 シリーズ
- 根拠: url なし → WebSearch「IEEE standard energy management system EMS 規格名」。IEEE に「Energy Management System Standards」という名称の規格・文書は存在しない（IEEE の該当領域は IEEE 2030 シリーズ、IEEE P2686（Battery Management Systems）、IEEE P2688（Energy Storage Management Systems））。EMS を定義している国際規格は IEC 61970（ANSI ウェブストアの逐語タイトル「IEC 61970-1 Ed. 1.0 b:2005 - Energy management system application program interface (EMS-API) - Part 1: Guidelines and general requirements」、https://webstore.ansi.org/standards/iec/iec61970ed2005 ）で、発行元も IEEE ではなく IEC。発行元・名称の双方が誤り。

### OCCTO「発動指令電源の応動評価」 — 不在

- 所在: explainer/capacity-market-advanced.sources
- 正しい名称: 容量市場 業務マニュアル 実需給期間中リクワイアメント対応（発動指令電源）編／容量市場 業務マニュアル 実効性テスト編
- 根拠: url なし → WebSearch「OCCTO 発動指令電源 応動 評価 実効性テスト」。公式ドメイン occto.or.jp に「発動指令電源の応動評価」という名称の資料はない。発動指令電源の応動を扱う実在資料の逐語は「容量市場 業務マニュアル 実需給期間中 リクワイアメント対応 （発動指令電源）編 （対象実需給年度：2024 年度）」（https://www.occto.or.jp/assets/market-board/market/jitsujukyukanren/files/231129_2024_gyoumumanual_rikuwaiameto_hatsudoushirei.pdf ）および「容量市場 業務マニュアル 実効性テスト 編 （対象実需給年度：2025 年度）」（https://www.occto.or.jp/assets/market-board/market/jitsujukyukanren/files/230119_jikkouseitest_jitsujukyu2025.pdf ）。

### NREL「Battery Storage Sizing Guide」 — 不在

- 所在: explainer/capacity-output-design.sources
- 正しい名称: （近い実在資料）Optimal Sizing of a Solar-Plus-Storage System for Utility Bill Savings（NREL/TP、docs.nrel.gov/docs/fy17osti/66088.pdf）
- 根拠: url 指定なし→ nrel.gov 限定の完全一致検索 "Battery Storage Sizing Guide" を実施。この表題の NREL 刊行物は存在しない。ヒットしたのは別表題（docs.nrel.gov/docs/fy18osti/71619.pdf（home battery sizing）、fy17osti/66088.pdf、fy21osti/77480.pdf「The Four Phases of Storage Deployment」、atb.nrel.gov の ATB データ等）。★当サイトの資料名は発行元に実在しない合成名。

### 資源エネルギー庁「蓄電池の市場参加について」 — 不在

- 所在: explainer/capacity-output-design.sources
- 正しい名称: 系統用蓄電池の現状と課題（2024年5月29日 資料5）／系統用蓄電池の接続・利用の在り方について（2022年9月14日・2023年12月6日ほか）
- 根拠: meti.go.jp / enecho.meti.go.jp 限定で "蓄電池の市場参加" を検索 → 当該表題は 0 件。同庁の実在資料は「系統用蓄電池の現状と課題」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/pdf/062_05_00.pdf）、「系統用蓄電池の接続・利用の在り方について」（同 keito_wg/pdf/041_01_00.pdf 等）。「蓄電池の市場参加について」という表題の資料は確認できない。

### 電気保安協会「保安管理業務外部委託ガイドライン」 — 不在

- 所在: explainer/chief-electrical-engineer.sources
- 正しい名称: 保安管理業務外部委託承認制度（経済産業省 産業保安監督部）
- 根拠: WebSearch「保安管理業務外部委託承認制度 ガイドライン 電気保安協会」の結果に、電気保安協会（関東・関西・中部・北海道いずれも）が発行する「保安管理業務外部委託ガイドライン」という名称の文書は 1 件も存在しない。返るのは制度解説ページのみ: 経産省 中部近畿産業保安監督部近畿支部「保安管理業務外部委託承認申請」（https://www.safety-kinki.meti.go.jp/electric/jikayou/gaibuitaku.html）、関東東北産業保安監督部「外部委託承認制度」（https://www.safety-kanto.meti.go.jp/electric/jikayou/e_gaibuitaku.html）、関東電気保安協会「電気主任技術者の外部委託承認制度」（https://www.kdh.or.jp/corporation/outside.html）。制度の根拠は電気事業法施行規則第52条の2および平成15年経産省告示第249号で、「ガイドライン」という形式の公表物ではない。発行元（電気保安協会）は制度の受託事業者であって制度文書の発行者でもない。

### 資源エネルギー庁「再エネ特措法 改正の背景」 — 不在

- 所在: explainer/fip-and-bess.sources
- 正しい名称: （近い実在資料）「再エネ特措法の改正等について」（2021年10月14日 資料2）／「改正再エネ特措法の施行に向けて」（2024年1月25日 資料1）
- 根拠: url 指定なし→ meti.go.jp / enecho.meti.go.jp 限定の完全一致検索 "再エネ特措法" 改正 背景 を実施。この表題の資料は存在しない。実在するのは「再エネ特措法の改正等について」https://www.enecho.meti.go.jp/category/saving_and_new/saiene/community/dl/05_02.pdf、「改正再エネ特措法の施行に向けて」https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/kyosei_wg/pdf/012_01_00.pdf、解説ページ「再エネ特措法改正関連情報」https://www.enecho.meti.go.jp/category/saving_and_new/saiene/kaitori/FIP_index.html。なお「再エネ特措法」自体は法令（再生可能エネルギー電気の利用の促進に関する特別措置法）の通称で資料名ではない。★「改正の背景」を付した資料名は発行元に実在しない。

### 電力広域的運営推進機関「需給調整市場・容量市場について」 — 不在

- 所在: explainer/fip-and-bess.sources
- 正しい名称: 容量市場の概要について／需給調整市場の概要（いずれも別資料）
- 根拠: url なし → WebSearch（完全一致検索）「電力広域的運営推進機関 "需給調整市場・容量市場について"」。公式ドメイン occto.or.jp に当該名称の資料は 0 件。実在するのは両市場を別々に扱う資料で、逐語「容量市場の概要について 2019年10月 電力広域的運営推進機関 説明会資料」（https://www.occto.or.jp/assets/market-board/market/files/youryou_gaiyousetumei.pdf ）、「容量市場メインオークションの概要について 2023年7月」（https://www.occto.or.jp/assets/market-board/market/files/20230711_youryou_gaiyousetsumei.pdf ）等。2 市場を併記した資料名は存在しない。

### 資源エネルギー庁「系統用蓄電池の活用について」 — 不在

- 所在: explainer/grid-scale-bess.sources
- 正しい名称: 系統用蓄電池の接続・利用の在り方について／系統用蓄電池の現状と課題／系統用蓄電池の迅速な系統連系に向けて
- 根拠: meti.go.jp / enecho.meti.go.jp 限定で "系統用蓄電池の活用" を検索 → 当該表題は 0 件。実在するのは「系統用蓄電池の接続・利用の在り方について」（https://www.meti.go.jp/shingikai/enecho/shoene_shinene/shin_energy/keito_wg/pdf/041_01_00.pdf）、「系統用蓄電池の現状と課題」（.../saisei_kano/pdf/062_05_00.pdf）、「系統用蓄電池の迅速な系統連系に向けて」（.../smart_power_grid_wg/pdf/002_02_00.pdf）。

### 資源エネルギー庁「電力市場の状況について」 — 不在

- 所在: explainer/jepx-arbitrage.sources
- 正しい名称: （近い実在資料）「電力システムを取り巻く現状」（2024年1月22日 資料3）
- 根拠: url 指定なし→ 完全一致検索 "電力市場の状況について" 資源エネルギー庁 資料 を実施。この表題の資料は存在しない。実在するのは「電力システムを取り巻く現状」https://www.meti.go.jp/shingikai/enecho/denryoku_gas/denryoku_gas/pdf/069_03_00.pdf（逐語「電力システムを取り巻く現状 ２０２４年１月２２日 資源エネルギー庁 資料３」）、「需給調整市場について」「今後の電力需要の見通しについて」、統計の「電力調査統計」など、いずれも別表題。★「○○について」という発行元の命名慣行に似せた合成名の疑い。

### 電気事業連合会「電力単位の基礎」 — 不在

- 所在: explainer/kwh-vs-mwh.sources
- 正しい名称: kW（電力）とkWh（電力量）の違いって？（Enelog vol.45 SPECIAL ISSUE）
- 根拠: url 指定なし→ fepc.or.jp 限定検索を実施。「電力単位の基礎」という名称の資料・ページは発行元サイトに存在しない。単位を扱う実在コンテンツは Enelog vol.45 で、取得 https://www.fepc.or.jp/enelog/special/vol_45.html → HTTP 200、<title>「vol.45 SPECIAL ISSUE｜Enelog（エネログ）」、<h2> 逐語「「kW（電力）とkWh（電力量）の違いって？」」。★当サイトの資料名は発行元に実在しない合成名。

### 環境省「再エネ普及における地域配慮の手引き」 — 不在

- 所在: explainer/local-ordinance-and-resident-consultation.sources
- 正しい名称: （近い実在資料）地域脱炭素のための促進区域設定等に向けたハンドブック（第4版）／環境省地域脱炭素政策調整担当参事官室・2024年4月
- 根拠: url 指定なし→ 完全一致検索 "再エネ普及における地域配慮の手引き" および env.go.jp 限定検索を実施。env.go.jp にこの名称の資料は存在せず、検索結果はいずれも別表題（「地域脱炭素のための促進区域設定等に向けたハンドブック（第4版）」https://www.env.go.jp/policy/local_keikaku/data/sokushin_handbook_202404.pdf、「地域循環共生圏創造の手引き」等）。★「手引き」という語の一致だけで、当サイトの資料名は発行元に実在しない。

### NEDO「蓄電池長期運用研究」 — 不在

- 所在: explainer/om-service-selection.sources
- 根拠: url 指定なし→ nedo.go.jp 限定検索（「NEDO 蓄電池 長期 運用 劣化 実証研究 事業」）を実施。この名称の事業・報告書は存在しない。NEDO の実在する蓄電池関連事業は「次世代全固体蓄電池材料の評価・基盤技術開発」(ZZJP_100257)、「先進・革新蓄電池材料評価技術開発」(ZZJP_100064)、「電気自動車用革新型蓄電池開発」(ZZJP_100193)、「革新型蓄電池実用化促進基盤技術開発」(ZZJP_100121)、GI基金「次世代蓄電池・次世代モーターの開発」で、いずれも表題が異なる。★汎用的な合成名の疑い。

### 電気保安協会「電気主任技術者業務ガイドライン」 — 不在

- 所在: explainer/om-service-selection.sources
- 正しい名称: （制度の正しい参照先）経済産業省 各産業保安監督部「保安管理業務外部委託承認制度」／電気事業法施行規則第52条第2項
- 根拠: url 指定なし。WebSearch で「電気保安協会 電気主任技術者 業務 ガイドライン」を検索したが、この名称のガイドラインは0件。ヒットするのは四国電気保安協会「電気主任技術者の役割りと外部委託承認制度」（https://www.sdh.or.jp/business/outsourcing_engineer/index.html）、九州産業保安監督部「保安管理業務の外部委託」（https://www.safety-kyushu.meti.go.jp/denki/gaibuitaku.html）等の制度解説ページのみ。加えて「電気保安協会」は各地域の独立法人の総称で、単一の発行元として成立しない。名称・発行元とも不在。

### 電力広域的運営推進機関「系統運用について」 — 不在

- 所在: explainer/renewable-curtailment-and-bess.sources
- 正しい名称: （近い実在ページ）電力広域的運営推進機関「系統の接続および利用ルールについて」（https://www.occto.or.jp/grid/business/setsuzoku.html）／「全国の需給状況や系統の運用状況の監視を行います」（https://www.occto.or.jp/occto/about_occto/jukyu_chousei_kinou.html）
- 根拠: url 指定なし。WebSearch（allowed_domains: occto.or.jp）で「"系統運用"」を含めて検索したが、「系統運用について」という表題のページ・資料は0件。occto.or.jp の該当領域は「業務紹介」「系統の接続および利用ルールについて」「全国の需給状況や系統の運用状況の監視を行います」等で、いずれも別名。出典名として不在。

### NEDO「蓄電池長期運用技術」 — 不在

- 所在: explainer/soc-soh-degradation-management.sources
- 正しい名称: （NEDO の実在事業名の例）先進・革新蓄電池材料評価技術開発（第2期）／革新型蓄電池実用化促進基盤技術開発／次世代全固体蓄電池材料の評価・基盤技術開発
- 根拠: url 指定なし。WebSearch（allowed_domains: nedo.go.jp）で「蓄電池長期運用技術」に該当する事業・資料は0件。nedo.go.jp の蓄電池関連事業は材料評価・革新型電池の開発系（https://www.nedo.go.jp/activities/ZZJP_100146.html 等）で、SOC/SOH・長期運用（劣化管理）を表題に持つ事業は確認できない。名称不在。

### 電池工業会「リチウムイオン電池の運用ガイドライン」 — 不在

- 所在: explainer/soc-soh-degradation-management.sources
- 正しい名称: （近い実在物）リチウムイオン二次電池の安全で正しい使い方／3V系リチウム一次電池使用機器の安全設計ガイドライン 第3版／電池器具安全確保のための表示に関するガイドライン 第6版
- 根拠: baj.or.jp 限定検索で「リチウムイオン電池の運用ガイドライン」は 0 件。実在するのは https://www.baj.or.jp/battery/safety/safety16.html「リチウムイオン二次電池の安全で正しい使い方」、https://www.baj.or.jp/publication/gu58lf00000010fc-att/li.pdf「3V系リチウム一次電池使用機器の安全設計ガイドライン 第3版（2022年10月）」等で、いずれも名称が異なる。

### 資源エネルギー庁「FIP制度・併設型蓄電池の運用」 — 不在

- 所在: explainer/solar-bess-hybrid.sources
- 正しい名称: （近い実在資料）資源エネルギー庁「FIP制度に関する政策措置について」（2024年9月30日 資料1）／経済産業省「系統用・再エネ併設蓄電システムのコスト面・収益面での課題整理」（2024年8月29日・2024年度第3回定置用蓄電システム普及拡大検討会）
- 根拠: url 指定なし。WebSearch（allowed_domains: meti.go.jp / enecho.meti.go.jp）で当該表題は0件。公式ドメインで確認できた実在資料は「FIP制度に関する政策措置について 2024年9月30日 資源エネルギー庁 資料１」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/pdf/069_01_00.pdf）、「系統用・再エネ併設蓄電システムのコスト面・収益面での課題整理 2024年8月29日」（https://www.meti.go.jp/shingikai/energy_environment/storage_system/pdf/2024_003_03.pdf）等で、いずれも当サイトの表記とは別名。単一の該当資料が存在しないため不在。

### NEDO「V2G実証事業」 — 不在

- 所在: explainer/v2g-vehicle-to-grid.sources
- 正しい名称: 需要家側エネルギーリソースを活用したバーチャルパワープラント構築実証事業（V2Gアグリゲーター事業）／発行元は資源エネルギー庁（執行：一般社団法人環境共創イニシアチブ SII）
- 根拠: url 指定なし。WebSearch（allowed_domains: nedo.go.jp）で「NEDO V2G実証事業」に該当する事業名は0件。nedo.go.jp でヒットするのは公募「V2Gビジネスにおけるサイバーセキュリティに関する動向調査」（https://www.nedo.go.jp/koubo/SE2_100001_00049.html）のみで、実証事業ではない。追加検索で V2G 実証は「令和2年度『需要家側エネルギーリソースを活用したバーチャルパワープラント構築実証事業費補助金』」（SII: https://sii.or.jp/vpp02/）＝経済産業省資源エネルギー庁の補助事業であることを確認（中部電力・豊田通商・東京電力HD の各プレスリリースも「V2Gアグリゲーター事業」名義）。発行元・資料名とも誤りのため不在。

### 資源エネルギー庁「次世代モビリティ戦略」 — 不在

- 所在: explainer/v2g-vehicle-to-grid.sources
- 正しい名称: モビリティDX戦略（経済産業省 製造産業局自動車課モビリティDX室・国土交通省物流自動車局／2024年5月策定・2025年6月アップデート）
- 根拠: meti.go.jp / enecho.meti.go.jp に限定して "次世代モビリティ戦略" OR "モビリティDX戦略" を検索 → 「次世代モビリティ戦略」は 0 件、返ったのはすべて「モビリティDX戦略」（https://www.meti.go.jp/press/2024/05/20240524005/20240524005.html ほか）。同名の戦略文書は資源エネルギー庁にも経産省にも確認できず、所管も資源エネルギー庁ではない（製造産業局自動車課）。★実在しない資料名の可能性が高い。

### （記載なし。文脈上は経済産業省）「使用済み蓄電池の再利用・リサイクル制度検討会」 — 不在

- 所在: glossary/nite.detail
- 正しい名称: （近い実在名）蓄電池のサステナビリティに関する研究会（経済産業省）／車載用電池を指すなら 産業構造審議会 自動車リサイクルWG
- 根拠: WebSearch（meti.go.jp / env.go.jp 限定）「経済産業省 使用済み蓄電池 リユース リサイクル 検討会 名称」で、「使用済み蓄電池の再利用・リサイクル制度検討会」という会議体は 1 件も返らない。実在する会議体は「蓄電池のサステナビリティに関する研究会」（第2回 2022年3月25日 事務局資料 https://www.meti.go.jp/shingikai/mono_info_service/chikudenchi_sustainability/pdf/002_03_00.pdf）、「蓄電池産業戦略検討官民協議会」（https://www.meti.go.jp/policy/mono_info_service/joho/conference/battery_strategy.html）、「再生可能エネルギー発電設備の廃棄・リサイクルのあり方に関する検討会」（https://www.meti.go.jp/shingikai/energy_environment/disposal_recycle/index.html）、「車載用リチウムイオン電池のリユース等の推進に係る検討」（産構審 自動車リサイクルWG 資料5）。★当サイト側は発行元自体が「（記載なし）」のため、会議体名とあわせて主催官庁の明記も必要。

### 日本記者クラブ「記者クラブ倫理規範」 — 不在

- 所在: glossary/pr-article.detail
- 正しい名称: 新聞倫理綱領（日本新聞協会）
- 根拠: url なし → WebSearch「日本記者クラブ 倫理 規範 綱領」および公式サイト取得。取得 URL: https://www.jnpc.or.jp/ ／ HTTP 200、<title> 逐語「日本記者クラブ  JapanNationalPressClub (JNPC)」。同ページ本文に「倫理」0 件・「規範」0 件。検索でも jnpc.or.jp に倫理規定を示す文書は見つからず、当該名称の資料は確認できない。報道倫理の実在文書は日本新聞協会の逐語「新聞倫理綱領」（https://www.pressnet.or.jp/outline/ethics/ 、2000年6月21日制定）で、発行元・名称の双方が異なる。

### 資源エネルギー庁「特定卸供給事業（アグリゲーター）について」 — 表記ゆれ

- 所在: explainer/aggregator-business.sources
- 正しい名称: 特定卸供給事業にかかる届出義務について（ページ名）／特定卸供給事業について（特定卸供給事業の届出に係る事業者説明会資料）（資料名）
- 根拠: url 指定なし→ 検索で公式ページを特定し取得 https://www.enecho.meti.go.jp/category/electricity_and_gas/electricity_measures/009/009.html → HTTP 200。<title>／<h1> 逐語「特定卸供給事業にかかる届出義務について｜資源エネルギー庁」。掲載資料名は逐語「特定卸供給事業について（特定卸供給事業の届出に係る事業者説明会資料）（PDF形式：1,990KB）」「特定卸供給事業届出書等の記載要領」。制度・ページとも実在するが、当サイトの「特定卸供給事業（アグリゲーター）について」という表題はページ内に逐語で存在しない（「アグリゲーター」は問合せ先メールアドレス中にのみ出現）。

### Energy-Storage.News「Fluence × ENERES」 — 表記ゆれ

- 所在: explainer/ai-optimization-for-bess.sources
- 正しい名称: Fluence launching BESS trading, optimisation in Japan this year with aggregator ENERES
- 根拠: 取得 URL: https://www.energy-storage.news/fluence-launching-bess-trading-optimisation-in-japan-this-year-with-aggregator-eneres/ ／ HTTP 200。<h1> 逐語「Fluence launching BESS trading, optimisation in Japan this year with aggregator ENERES」、<title> 逐語「Fluence, ENERES launching trading, optimisation in Japan in 2025 - Energy-Storage.News」。記事は実在するが、当サイトの「Fluence × ENERES」は発行元の記事名ではなく当方が付けた略称。

### 情熱電力「需給調整市場2026年度上限価格半減」 — 表記ゆれ

- 所在: explainer/balancing-market-cap-cut-2026.sources
- 正しい名称: 【緊急解説】2026年度、需給調整市場の上限価格が半減！？系統用蓄電池ビジネスへの深刻な影響と対策
- 根拠: GET https://jo-epco.co.jp/balancing-market-2026-price-cap-warning/ → HTTP 200。<title>【緊急解説】2026年度、需給調整市場の上限価格が半減！？系統用蓄電池ビジネスへの深刻な影響と対策 ／ 情熱電力、<h1>同。当サイトの「需給調整市場2026年度上限価格半減」は逐語一致しない要約表記（記事・URL は実在）。

### 資源エネルギー庁「需給調整市場の運用」 — 表記ゆれ

- 所在: explainer/balancing-market-practical.sources
- 正しい名称: 需給調整市場について（資源エネルギー庁／制度検討作業部会・電力安定供給WG 資料）
- 根拠: url なし → WebSearch「資源エネルギー庁 需給調整市場の運用 資料」。公式ドメイン meti.go.jp の結果はいずれも逐語「需給調整市場について」で統一されている（例：「需給調整市場について 2026年1月23日 資源エネルギー庁 資料４」https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/110_04_00.pdf 、「需給調整市場について 2026年７月14日 資源エネルギー庁 資料６」https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/pdf/004_06_00.pdf ）。「需給調整市場の運用」という題の資料は同庁に存在しない。

### 資源エネルギー庁「需給調整市場における取引動向」 — 表記ゆれ

- 所在: explainer/balancing-market.sources
- 正しい名称: 需給調整市場について（資源エネルギー庁 審議会提出資料）
- 根拠: WebSearch（enecho.meti.go.jp / meti.go.jp / occto.or.jp 限定）で返る資源エネルギー庁名義の資料表題はいずれも「需給調整市場について」: 「需給調整市場について 2025年10月29日 資源エネルギー庁 資料４」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/108_04_00.pdf）、「需給調整市場について 2026年５月13日 資源エネルギー庁 資料８」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/pdf/001_08_00.pdf）、「需給調整市場について 2023年7月31日 資源エネルギー庁 資料３」。「需給調整市場における取引動向」という表題は 0 件。※実際の「取引動向（取引実績）」を公表しているのは EPRX（「取引実績の取りまとめ結果」）であり、発行元の取り違えの可能性が高い。

### 旭化成「蓄電池運用最適化システム」 — 表記ゆれ

- 所在: explainer/battery-degradation-diagnostics.sources
- 正しい名称: 蓄電池運用最適化システムの共同開発について
- 根拠: 取得 https://www.asahi-kasei.com/jp/news/2026/ze260423.html → HTTP 200。<title> 逐語「蓄電池運用最適化システムの共同開発について ／ 旭化成株式会社」。当サイトの「蓄電池運用最適化システム」はニュースリリースの表題ではなくシステム名の部分引用で、資料名としては不完全。

### Bloomberg NEF「Battery Storage Market Outlook」 — 表記ゆれ

- 所在: explainer/battery-types-and-specs.sources
- 正しい名称: Energy Storage Market Outlook（半期刊。例: 2H 2025 Energy Storage Market Outlook）
- 根拠: about.bnef.com / bnef.com / bloomberg.com に限定した検索で、BNEF の定期刊行物名は "Energy Storage Market Outlook"（版は 1H/2H 表記、例 2H 2022・2H 2025）。"Battery Storage Market Outlook" という刊行物名は BNEF 公式ドメインで確認できない（関連記事は "Battery Storage Costs Hit Record Lows…" 等の Insight 記事）。

### MUFG「フルマーチャント蓄電所PF」 — 表記ゆれ

- 所在: explainer/bess-esg-green-finance.sources
- 正しい名称: 本邦系統用蓄電池設備によりフルマーチャントを前提に行う事業に対する本邦初のプロジェクトファイナンス組成について（株式会社三菱UFJ銀行、2025年5月7日）
- 根拠: 取得URL https://www.bk.mufg.jp/info/pdf/full_merchant.pdf / HTTP 200 / 216,643 bytes / pdfplumber で1ページ目を読み取り、逐語「2025年5月7日 株式会社三菱UFJ銀行 本邦系統用蓄電池設備によりフルマーチャントを前提に行う事業に対する本邦初のプロジェクトファイナンス組成について」。当サイトの「フルマーチャント蓄電所PF」は PDF 内のどこにも逐語で存在せず（ファイル名 full_merchant.pdf に由来する略称と見られる）。資料は実在するため表記ゆれ。

### MUFG「フルマーチャント前提のPF」 — 表記ゆれ

- 所在: explainer/bess-pf-merchant-vs-multiuse.sources
- 正しい名称: 本邦系統用蓄電池設備によりフルマーチャントを前提に行う事業に対する本邦初のプロジェクトファイナンス組成について（2025年5月7日・株式会社三菱UFJ銀行）
- 根拠: GET https://www.bk.mufg.jp/info/pdf/full_merchant.pdf → HTTP 200・application/pdf・216,643 bytes。pdfplumber で1ページ目を読むと表題は「2025年5月7日／株式会社三菱UFJ銀行／本邦系統用蓄電池設備によりフルマーチャントを前提に行う事業に対する本邦初のプロジェクトファイナンス組成について」。当サイトの「フルマーチャント前提のPF」は要約表記で、発行元の表題と逐語一致しない（資料自体は実在・URL も生存）。

### 消防庁「蓄電池設備の規制について」 — 表記ゆれ

- 所在: explainer/bess-safety-and-fire.sources
- 正しい名称: 蓄電池設備の基準（昭和四十八年二月十日 消防庁告示第二号）
- 根拠: 取得URL: https://www.fdma.go.jp/laws/kokuji/assets/s48_kokuzi2.pdf / HTTP 200 (application/pdf) / pdfplumber で 1ページ目を抽出、表題が逐語で「蓄電池設備の基準」「(昭和四十八年二月十日)」「(消防庁告示第二号)」、本文冒頭「消防法施行規則(昭和三十六年自治省令第六号)第十二条第四号ロ(ホ)及び第二十四条第四号ロ(ホ)の規定に基づき、蓄電池設備の基準を次のとおり定める。」。WebSearch（fdma.go.jp 限定）でも「蓄電池設備の規制について」という表題の公表物は返らない。※リチウムイオン電池の危険物規制側を指す意図なら、実在名は「リチウムイオン蓄電池に係る危険物規制に関する検討報告書」（令和6年3月29日 消防庁）。どちらを指すかで正式名称が変わるため要確認。

### 翌桧地所「BESSに最適な土地条件」 — 表記ゆれ

- 所在: explainer/bess-site-acquisition.sources
- 正しい名称: 【2025年最新版】BESS(系統用蓄電所)に最適な土地条件と選定ポイント
- 根拠: 取得 URL: https://kkk-asunaro.com/asunaro20250804/ ／ HTTP 200。<title> 逐語「【2025年最新版】BESS(系統用蓄電所)に最適な土地条件と選定ポイント - 株式会社翌桧地所」、<h1> 逐語「【2025年最新版】BESS(系統用蓄電所)に最適な土地条件と選定ポイント」。記事は実在するが、当サイトの「BESSに最適な土地条件」は連続した逐語一致にならない（原題は BESS と「に最適な土地条件」の間に「(系統用蓄電所)」が入る）ため表記ゆれ。

### 資源エネルギー庁「容量市場の運用について」 — 表記ゆれ

- 所在: explainer/capacity-market-advanced.sources
- 正しい名称: 容量市場について（資源エネルギー庁 審議会提出資料）／一般向け解説なら「くわしく知りたい！4年後の未来の電力を取引する「容量市場」」（エネこれ）
- 根拠: WebSearch（enecho.meti.go.jp / meti.go.jp / occto.or.jp 限定）で、資源エネルギー庁名義の資料表題はいずれも「容量市場について」: 「容量市場について 2023年7月31日 資源エネルギー庁 資料4」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/denryoku_gas/seido_kento/pdf/083_04_00.pdf）、「容量市場について 2026年1月23日 資源エネルギー庁 資料3-3」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/110_03_03.pdf）、「容量市場について ２０１７年１１月１０日 資源エネルギー庁 資料４」。一般向けは「くわしく知りたい！4年後の未来の電力を取引する「容量市場」｜エネこれ｜資源エネルギー庁」（https://www.enecho.meti.go.jp/about/special/johoteikyo/youryou.html）。「容量市場の運用について」という表題の資料は返らない。なお容量市場の実際の運営主体は OCCTO であり、エネ庁資料は制度設計の議論資料である点も注意。

### 資源エネルギー庁「容量市場の制度設計」 — 表記ゆれ

- 所在: explainer/capacity-market.sources
- 正しい名称: 容量市場について（資源エネルギー庁の審議会資料の表題）／容量市場の制度詳細について（OCCTO 説明会資料）
- 根拠: url 指定なし→ 完全一致検索 "容量市場の制度設計" 資料 公表 を実施。この逐語の表題は発行元に存在しない。資源エネルギー庁の実在資料は「容量市場について」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/110_03_03.pdf 逐語「容量市場について 2026年1月23日 資源エネルギー庁 資料3-3」、同 113_05_00.pdf 2026年4月3日 資料5）。OCCTO 側は「容量市場の制度詳細について」（https://www.occto.or.jp/assets/market-board/market/files/202207_youryou_seidosyousaisetsumei.pdf）「容量市場の概要について」。★制度設計の議論・資料は実在するが、当サイトの表題は発行元の名称と一致しない。

### 電力広域的運営推進機関「容量市場 発動指令電源評価」 — 表記ゆれ

- 所在: explainer/capacity-output-design.sources
- 正しい名称: 容量市場 業務マニュアル 実需給期間中リクワイアメント対応（発動指令電源）編／同 実効性テスト編（電力広域的運営推進機関）
- 根拠: url 指定なし。WebSearch（allowed_domains: occto.or.jp）で「発動指令電源評価」は0件。公式ドメインの実在資料は「容量市場 業務マニュアル 実需給期間中 リクワイアメント対応（発動指令電源）編（対象実需給年度：2026年度）」（https://www.occto.or.jp/assets/various/capacity-market/jitsujukyukanren/2026_jitsujukyu_kanren/251225_2026_gyoumumanual_rikuwaiamento_hatsudoushirei.pdf）、「容量市場 業務マニュアル 実効性テスト編」、「容量市場におけるリクワイアメント・アセスメント・ペナルティの概要」。発動指令電源の評価（アセスメント・実効性テスト）を扱う資料は実在するが表題が異なるため表記ゆれ。

### 資源エネルギー庁「FIP制度の概要」 — 表記ゆれ

- 所在: explainer/fip-and-bess.sources
- 正しい名称: FIP制度について（資源エネルギー庁）／再生可能エネルギー FIT・FIP制度ガイドブック（年度版）
- 根拠: url 指定なし。WebSearch（allowed_domains: meti.go.jp / enecho.meti.go.jp）で公式ドメインの実在資料を確認: PDF 表題「FIP制度について 2022年6月24日 資源エネルギー庁 資料2-8」（https://www.meti.go.jp/shingikai/energy_environment/setsuden_dr/pdf/001_02_08.pdf）、「FIP制度について 2021年9⽉17⽇ 資源エネルギー庁」（enecho）、「再生可能エネルギー FIT・FIP制度ガイドブック」（年度版）。「FIP制度の概要」という表題の資料は検索では0件。★逐語確認の限界: enecho.meti.go.jp は curl が HTTP 202（本文0字）、WebFetch が HTTP 403、旧 URL（.../kaitori/fip.html）はブラウザで404のため、ガイドブック内の章見出しに「FIP制度の概要」がある可能性は排除できていない。資料自体は実在するため表記ゆれと判定。

### IEEFA「Japan grid-scale BESS market」 — 表記ゆれ

- 所在: explainer/global-bess-trends-2026.sources
- 正しい名称: Japan's grid-scale BESS market: Turning market hype into reality
- 根拠: 取得URL: https://ieefa.org/resources/japans-grid-scale-bess-market-turning-market-hype-reality / HTTP 200 (text/html, 71,126 bytes) / <title> と <h1> がともに逐語で「Japan's grid-scale BESS market: Turning market hype into reality」（og:title も同一）。当サイト表記「Japan grid-scale BESS market」は所有格（Japan's）と副題（: Turning market hype into reality）が欠落しており、発行元の名称と一致しない。

### 関西電力T&D「系統情報公表ホームページ」 — 表記ゆれ

- 所在: explainer/grid-capacity-map-reading.body
- 正しい名称: 系統情報の公開（関西電力送配電「流通設備建設計画・系統連系制約等」内のセクション名）
- 根拠: 取得URL: https://www.kansai-td.co.jp/consignment/disclosure/distribution-equipment/ / HTTP 200 / <title>「流通設備建設計画・系統連系制約等 ／ お知らせ・情報公開資料 ／ 託送（たくそう）とは ／ 関西電力送配電株式会社」・<h1>「流通設備建設計画・系統連系制約等」・<h2>「流通設備建設計画について」「系統連系制約について」「蓄電池連系に伴い大規模な上位系統増強が必要となるマップ」「ノンファーム型接続の受付について」。HTML 全文検索の結果、'系統情報公表' のヒット 0 / '系統情報の公開' のヒットあり（本文「系統情報の公開 地点別需要・系統潮流実績 他」「「系統情報の公開」に関する留意事項」）。なお資源エネルギー庁側の指針名は「系統情報の公表の考え方」（同ページが引用）で、これも「系統情報公表ホームページ」とは別名。★会社名も正式には「関西電力送配電株式会社」（「関西電力T&D」は通称）。

### 東京電力パワーグリッド「系統情報サービス」 — 表記ゆれ

- 所在: explainer/grid-capacity-map-reading.body
- 正しい名称: 系統情報（東京電力パワーグリッド）／「系統情報サービス等」は電力広域的運営推進機関（OCCTO）の名称
- 根拠: url なし → WebSearch で公式ドメイン（tepco.co.jp/pg）を特定し取得。取得 URL: https://www.tepco.co.jp/pg/consignment/system/ ／ HTTP 200。<title> 逐語「当社における系統情報について｜系統情報｜東京電力パワーグリッド株式会社」、<h1> 逐語「当社における系統情報について」。本文テキストに「系統情報サービス」は 0 件（「系統情報」は 14 件）。一方「系統情報サービス」は広域機関のページ名として実在（検索結果の逐語タイトル「系統情報サービス等｜電力広域的運営推進機関」https://www.occto.or.jp/institution/keitoujouhou/index.html ）。名称と発行元の組合せが誤っている可能性が高い。

### 資源エネルギー庁「電力ネットワーク次世代化検討資料」 — 表記ゆれ

- 所在: explainer/grid-connection-process.body
- 正しい名称: 電力ネットワークの次世代化（2022年2月14日 資料3）／電力ネットワークの次世代化について（2024年9月11日 資料8 等）
- 根拠: 「電力ネットワーク次世代化検討資料」という表題の資料は発行元に存在しない。ブラウザ取得 https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/039.html の開催資料一覧に逐語「資料3　電力ネットワークの次世代化（PDF形式：7,164KB）」。同名系の実在資料は複数（「電力ネットワークの次世代化について」2024年9月11日 資料8 https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/pdf/068_08_00.pdf 等）。★同じ explainer 内の .sources 側（本チャンク別項）は正しい「電力ネットワークの次世代化」で書かれており、.body 側だけが「次世代化検討資料」と揺れている。

### 各一般送配電事業者「系統情報公表」 — 表記ゆれ

- 所在: explainer/grid-connection-process.body
- 正しい名称: （各社のページ名）例：東京電力パワーグリッド「当社における系統情報について」。制度上の根拠名は資源エネルギー庁「系統情報の公表の考え方」
- 根拠: 取得URL https://www.tepco.co.jp/pg/consignment/system/ / HTTP 200 / <title>「当社における系統情報について｜系統情報｜東京電力パワーグリッド株式会社」、<h1>「当社における系統情報について」。本文に逐語「※経済産業省 資源エネルギー庁の「系統情報の公表の考え方」の改定（2024年12月）に伴い、ノンファーム型接続による再生可能エネルギー等の接続・申込状況に関する情報」は公表を終了しております。」。「系統情報公表」という語は各社のページ名としては使われておらず（OCCTO の「系統情報サービス等」ページの区分見出しには存在）、制度名としては「系統情報の公表の考え方」が正。発行元が「各一般送配電事業者」と総称のため資料名として一意に決まらない。表記ゆれ。

### 電力広域的運営推進機関（OCCTO）「系統情報の公表について」 — 表記ゆれ

- 所在: explainer/grid-connection-process.sources
- 正しい名称: 系統情報サービス等（電力広域的運営推進機関）／規定名は「本機関等が公表する系統情報の項目等」。制度上の考え方は資源エネルギー庁「系統情報の公表の考え方」
- 根拠: 取得URL https://www.occto.or.jp/institution/keitoujouhou/index.html / HTTP 200 / <title>「系統情報サービス等｜電力広域的運営推進機関」、<h1>「系統情報サービス等」、見出しに「系統情報公表」「広域予備率公表」「発電実績公表」、本文に逐語「公表情報に関する規定 本機関等が公表する系統情報の項目等」。「系統情報の公表について」は当該ページ全文でヒット0件。OCCTO のお知らせ表題も「本機関等が公表する系統情報の項目等の変更について」で別名。資料は実在するが名称が異なるため表記ゆれ。

### 経済産業省「電気事業法の改正等について」 — 表記ゆれ

- 所在: explainer/grid-scale-bess.sources
- 正しい名称: 電気事業法の一部を改正する法律について（令和8年7月 経済産業省 大臣官房産業保安・安全グループ 資料1）／改正概要の解説なら「電気事業法改正の概要について」（令和4年10月31日 産業保安グループ電力安全課）
- 根拠: WebSearch（meti.go.jp / enecho.meti.go.jp 限定）で返る実在表題: 「電気事業法の一部を改正する法律について 令和８年７月 経済産業省 大臣官房産業保安・安全グループ 資料１」（https://www.meti.go.jp/shingikai/sankoshin/hoan_shohi/denryoku_anzen/pdf/035_01_00.pdf）、「「電気事業法の一部を改正する法律案」が成立しました（METI/経済産業省）」（https://www.meti.go.jp/press/2026/07/20270721003.html）、「電気事業法改正の概要について 令和４年１０月３１日 産業保安グループ 電力安全課」（https://www.enecho.meti.go.jp/category/saving_and_new/saiene/community/dl/06_07.pdf）、「「電気事業法等の一部を改正する法律」（第2弾改正）（平成26年6月11日成立）について」（https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/system_reform004/）。「電気事業法の改正等について」という表題は返らず、「等」の位置（「電気事業法等の一部を改正する法律」が正式）も異なる。どの改正を指すかにより正式名称が変わるため、年次（第1弾/第2弾/令和8年改正など）の明示が必要。

### OCCTO「容量市場の運営について」 — 表記ゆれ

- 所在: explainer/grid-scale-bess.sources
- 正しい名称: 容量市場の概要について（電力広域的運営推進機関 説明会資料）／容量市場メインオークションの概要について
- 根拠: url 指定なし。WebSearch で「"容量市場の運営について"」を完全一致検索したが該当0件。公式ドメインの実在資料は「容量市場の概要について 2019年10月 電力広域的運営推進機関 説明会資料」（https://www.occto.or.jp/assets/market-board/market/files/youryou_gaiyousetumei.pdf）、「容量市場の概要について 2022年6月 電力広域的運営推進機関 説明会資料」（https://www.occto.or.jp/assets/market-board/market/oshirase/2022/files/202206_youryou_gaiyousetsumei.pdf）、「容量市場メインオークションの概要について 2023年7月」。「運営」ではなく「概要」が正しいため表記ゆれ。

### 経産省「インバランス料金制度の見直し」 — 表記ゆれ

- 所在: explainer/imbalance-pricing-and-bess.sources
- 正しい名称: インバランス料金制度の詳細設計等について（電力・ガス取引監視等委員会 制度設計・監視専門会合 事務局提出資料）
- 根拠: 当サイトが出典 URL としている https://www.meti.go.jp/shingikai/enecho/denryoku_gas/ を取得: HTTP 200 (text/html, 6,627 bytes) / <title>「電力・ガス事業分科会 （METI/経済産業省）」。本文は小委員会の一覧のみで、「インバランス」という語が 1 度も出現しない（HTML 全文で 'インバランス' のヒット 0）。→ 当該 URL にこの資料名は存在しない。実在資料は WebSearch（meti.go.jp / egc.meti.go.jp 限定）で確認でき、「インバランス料金制度の詳細設計等について」（第8回制度設計・監視専門会合 資料4-1, 2025年4月25日 https://www.egc.meti.go.jp/activity/emsc_systemsurveillance/pdf/008_04_01.pdf 他、複数回にわたり提出）、および「2022年度以降のインバランス料金制度について（中間とりまとめ）」。★資料名だけでなくリンク先 URL も差し替えが必要。

### 電力・ガス取引監視等委員会「卸電力市場の動向」 — 表記ゆれ

- 所在: explainer/jepx-arbitrage.sources
- 正しい名称: 電力取引の状況（電力取引報結果）／電力市場のモニタリングレポート（電力・ガス取引監視等委員会）
- 根拠: url 指定なし。WebSearch（allowed_domains: emsc.meti.go.jp / meti.go.jp）で「卸電力市場の動向」という表題は0件。公式ドメイン（egc.meti.go.jp／emsc.meti.go.jp）の実在資料は「電力取引の状況（電力取引報結果）」（https://www.egc.meti.go.jp/info/business/report/results.html）、月次の「電力取引の状況（令和◯年◯月分）」（https://www.egc.meti.go.jp/info/public/pdf/20251120001a.pdf 等）、四半期の「電力市場のモニタリングレポート」、「電力・ガス取引監視等委員会の活動状況」。相当する資料は実在するが表題が異なるため表記ゆれ。

### JEPX「取引データ」 — 表記ゆれ

- 所在: explainer/jepx-arbitrage.sources
- 正しい名称: 市場情報（スポット市場）。ページ内見出しは「取引市場データ」
- 根拠: GET https://www.jepx.jp/electricpower/market-data/spot/ → HTTP 200、<title>スポット市場 ／ 市場情報 ／ 電力取引 ／ JEPX、<h2>取引市場データ。「取引データ」は 0 hit。トップ（HTTP 200）のグローバルナビも「市場情報」「取引概要」「取引に関するお知らせ」で、「取引データ」という名称のコンテンツは存在しない。

### JEPX「市場の概要」 — 表記ゆれ

- 所在: explainer/jepx-arbitrage.sources, explainer/grid-scale-bess.sources
- 正しい名称: 取引概要
- 根拠: 取得URL: https://www.jepx.jp/electricpower/outline/ / HTTP 200 (25,175 bytes) / <title>「取引概要 ／ 電力取引 ／ JEPX」・<h1>「取引概要」・<h2>「一日前市場（スポット市場）」「当日市場（時間前市場）」「取引規程」「年会費」「取引手数料」。HTML 全文に '市場の概要' のヒット 0。JEPX トップ（https://www.jepx.jp/ HTTP 200）のグローバルナビ全数列挙でも掲出名は「取引概要」（/electricpower/outline/）であり、「市場の概要」というページ・資料は存在しない。

### 資源エネルギー庁「電力統計」 — 表記ゆれ

- 所在: explainer/kwh-vs-mwh.sources
- 正しい名称: 電力調査統計
- 根拠: url なし → WebSearch で公式ドメイン（enecho.meti.go.jp）を特定。curl・WebFetch は 403（meti 系の bot 判定）のためブラウザで取得。取得 URL: https://www.enecho.meti.go.jp/statistics/electric_power/ep002/ ／ ページ <title> 逐語「電力調査統計｜資源エネルギー庁」。資源エネルギー庁の統計名は「電力調査統計」であり、「電力統計」という名称の統計・資料は同庁にない（統計区分の親ページ名は「電力関連」）。

### JEPX「市場価格データ」 — 表記ゆれ

- 所在: explainer/kwh-vs-mwh.sources, explainer/bess-revenue-simulation.sources
- 正しい名称: 市場情報（下層ページ名は「スポット市場」）
- 根拠: 取得URL: https://www.jepx.jp/ / HTTP 200。グローバルナビのリンクを全数列挙したところ、電力取引配下の掲出名は「取引に関するお知らせ」「市場情報(/electricpower/market-data/spot/)」「市場監視情報」「取引概要」「取引会員情報」「各種お手続」で、「市場価格データ」という名称は存在しない。取得URL: https://www.jepx.jp/electricpower/market-data/spot/ / HTTP 200 / <title>「スポット市場 ／ 市場情報 ／ 電力取引 ／ JEPX」、HTML 全文に '市場価格データ' のヒット 0（<h2>は「取引市場データ閉じる」「約定価格(円/kWh)」「入札・約定量(kWh)」）。→ 一般名詞的な言い換えであり、発行元の名称ではない。

### 資源エネルギー庁「VPP・DRの取組について」 — 表記ゆれ

- 所在: explainer/low-voltage-resources-and-vpp.sources
- 正しい名称: バーチャルパワープラント・ディマンドリスポンスについて（下層に「VPP・DRとは」「取組事例の紹介」「VPP・DR普及に関する施策」）
- 根拠: 取得URL: https://www.enecho.meti.go.jp/category/saving_and_new/advanced_systems/vpp_dr/ / HTTP 200 / <title>「バーチャルパワープラント・ディマンドリスポンスについて｜資源エネルギー庁」・<h1>「バーチャルパワープラント・ディマンドリスポンスについて」・<h2>「バーチャルパワープラント(VPP)・ディマンドリスポンス(DR)とは」「VPP・DR普及に関する施策」「資料ダウンロード」。HTML 全文に 'VPP・DRの取組について' のヒット 0。下層ページの実在名は「VPP・DRとは」（/about.html）「取組事例の紹介」（/case.html）「VPP・DR普及に関する施策」（/measure.html）「VPP・DRの意義」（/meaning.html）で、「VPP・DRの取組について」はいずれとも一致しない。

### 経済産業省「分散型エネルギーシステムの将来像」 — 表記ゆれ

- 所在: explainer/low-voltage-resources-and-vpp.sources
- 正しい名称: 再エネ大量導入時代における分散型エネルギーシステムのあり方（2024年9月30日 資源エネルギー庁 資料2）／次世代の分散型電力システムに関する検討会 中間とりまとめ
- 根拠: url 指定なし。WebSearch（allowed_domains: meti.go.jp / enecho.meti.go.jp）で当該表題は0件。公式ドメインの実在資料は「再エネ大量導入時代における分散型エネルギーシステムのあり方 2024年９月30日 資源エネルギー庁 資料２」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/pdf/069_02_00.pdf）、「次世代の分散型電力システムに関する検討会 中間とりまとめ」（https://www.meti.go.jp/shingikai/energy_environment/jisedai_bunsan/20230314_report.html）、「分散型エネルギーシステムへの新規参入のための手引き」。「将来像」を表題に持つ資料は確認できず、内容の近い資料は「あり方」。表記ゆれ。

### SII「需要家側エネルギーリソース活用に関する実証事業」 — 表記ゆれ

- 所在: explainer/low-voltage-resources-and-vpp.sources
- 正しい名称: 需要家側エネルギーリソースを活用したバーチャルパワープラント構築実証事業費補助金
- 根拠: sii.or.jp 限定検索で公式事業ページを確認：https://sii.or.jp/vpp02/「令和2年度『需要家側エネルギーリソースを活用したバーチャルパワープラント構築実証事業費補助金』について」、https://sii.or.jp/vpp30/「平成30年度 需要家側エネルギーリソースを活用したバーチャルパワープラント構築実証事業費補助金（VPP）」。当サイトの「需要家側エネルギーリソース活用に関する実証事業」は逐語一致しない（後継は「分散型エネルギーリソースの更なる活用に向けた実証事業」＝別名称）。

### 日経BP「リチウムイオン電池の募集量激減へ」 — 表記ゆれ

- 所在: explainer/ltdc-3rd-auction-ccs-ldes.sources
- 正しい名称: 長期脱炭素電源オークション、リチウムイオン電池の募集量激減へ
- 根拠: 取得URL: https://project.nikkeibp.co.jp/energy/atcl/19/feature/00004/00024/ / HTTP 200 (text/html, 15,294 bytes) / <title>「長期脱炭素電源オークション、リチウムイオン電池の募集量激減へ｜日経エネルギーNext」・<h1>「長期脱炭素電源オークション、リチウムイオン電池の募集量激減へ」・og:title も同一。当サイト表記は主題の前半「長期脱炭素電源オークション、」が欠落。※媒体名も正確には「日経エネルギーNext」（発行 日経BP）。

### JFEエンジニアリング「JFEマルチユースEMS」 — 表記ゆれ

- 所在: explainer/multi-use-operation-strategy.sources
- 正しい名称: 当社初となる系統用蓄電池事業の運用開始について～自社開発"JFEマルチユースEMS"により蓄電池を最適活用～（JFEエンジニアリング／アーバンエナジー、2024年10月21日）
- 根拠: 取得URL https://www.jfe-eng.co.jp/news/2024/20241021.html / HTTP 200 / <title>「当社初となる系統用蓄電池事業 の運用開始について ～自社開発"JFEマルチユースEMS※1"により蓄電池を最適活用～ ／ JFEエンジニアリング株式会社」。本文に逐語「当社と共同開発したJFEマルチユースEMSを用いて蓄電池の最適運用を行い」「※1 JFEマルチユースEMS（Energy Management System）：…」。「JFEマルチユースEMS」は実在するが、それはシステム（製品）名であって資料名ではない。出典として示すならニュースリリース表題を使うべきなので表記ゆれ。

### 電気学会「系統連系規程」 — 表記ゆれ

- 所在: explainer/pcs-selection-guide.sources
- 正しい名称: 一般社団法人 日本電気協会「系統連系規程 JEAC 9701-2024」（発行元が誤り）
- 根拠: 資料名は逐語で実在。日本電気協会 Web ストア https://store.denki.or.jp/products/系統連系規程 に「系統連系規程 JEAC9701-2024」、国立国会図書館サーチにも「系統連系規程（JEAC 9701-2006 JESC E0019(2006)）」（日本電気協会）。発行は一般社団法人 日本電気協会（電気技術規程 系統連系編）であり、電気学会ではない。★発行元の付け替えが必要。

### 経済産業省「蓄電池産業政策」 — 表記ゆれ

- 所在: explainer/pcs-selection-guide.sources, explainer/battery-types-and-specs.sources
- 正しい名称: 蓄電池・電源産業戦略（2026年6月2日 蓄電池産業戦略推進会議。2022年8月31日策定の「蓄電池産業戦略」を改訂）
- 根拠: WebSearch（meti.go.jp 限定）で公式プレス「『蓄電池産業戦略』を『蓄電池・電源産業戦略』に改訂しました（METI/経済産業省）」（https://www.meti.go.jp/press/2026/06/20260602001/20260602001.html）、本体 PDF の表題が逐語で「蓄電池・電源産業戦略 2026年６月２日 蓄電池産業戦略推進会議」（https://www.meti.go.jp/press/2026/06/20260602001/20260602001-1r.pdf）。旧版は「蓄電池産業戦略 2022年８月31日 蓄電池産業戦略検討官民協議会」（https://www.meti.go.jp/policy/mono_info_service/joho/conference/battery_strategy/battery_saisyu_torimatome.pdf）。「蓄電池産業政策」という名称の公表物は存在しない（「戦略」であって「政策」ではない）。★2026年6月に改題されているため、旧称のままでも古くなる点に注意（落とし穴 #123 と同型）。

### 電気事業連合会「電力制御システムセキュリティガイドライン」 — 表記ゆれ

- 所在: explainer/remote-monitoring-selection.sources
- 正しい名称: 日本電気協会「電力制御システムセキュリティガイドライン JEAG1111-2024（JESC Z0004(2025)）」（発行元が誤り）
- 根拠: 資料名自体は逐語で実在。denki.or.jp / jesc.gr.jp 限定検索で、日本電気協会 Web ストアの商品名「電力制御システムセキュリティガイドライン JEAG1111-2019 JESC Z0004(2019)」および「同 JEAG1111-2024」、日本電気技術規格委員会（JESC）の承認規格一覧 jesc_Z0004_00.html / jesc_Z0004_25.html を確認。発行は一般社団法人 日本電気協会（JESC 承認規格）で、電気事業連合会ではない（fepc.or.jp 側は「情報セキュリティの取り組み」ページのみ）。★発行元の付け替えが必要。

### 資源エネルギー庁「再エネの出力制御について」 — 表記ゆれ

- 所在: explainer/renewable-curtailment-and-bess.sources
- 正しい名称: 出力制御について（なるほど！グリッド）
- 根拠: 取得URL: https://www.enecho.meti.go.jp/category/saving_and_new/saiene/grid/08_syuturyokuseigyo.html / HTTP 200 / <title>「出力制御について／なるほど！グリッド｜資源エネルギー庁」・<h1>「なるほど！グリッド」・<h2>「出力制御について」（以下「1．出力制御について」「2．需給バランス制約による出力制御に関する仕組み」「3．送電容量制約による出力制御に関する仕組み」「4．よくある質問」）。HTML 全文に '再エネの出力制御について' のヒット 0。→ 冒頭の「再エネの」は当サイトが付加したもので、発行元のページ名と一致しない。

### 各一般送配電事業者「出力制御見通し」 — 表記ゆれ

- 所在: explainer/renewable-curtailment-and-bess.sources
- 正しい名称: 再生可能エネルギー出力制御の見通し（各社）／再生可能エネルギー出力制御の長期見通し等について（資源エネルギー庁 系統WG）
- 根拠: 検索で確認した公表物は、東京電力ホールディングス「再生可能エネルギー出力制御の見通し」（https://www.tepco.co.jp/forecast/output-control.html）および資源エネルギー庁の系統WG資料「再生可能エネルギー出力制御の長期見通し等について」（2024年12月2日 https://www.meti.go.jp/shingikai/enecho/shoene_shinene/shin_energy/keito_wg/pdf/053_01_00.pdf、2026年3月16日 .../smart_power_grid_wg/pdf/008_01_00.pdf）。「出力制御見通し」という表題では発行元サイトに存在しない（各社試算は系統WGに集約して公表される形）。

### SII「需要家主導型太陽光発電導入支援事業」 — 表記ゆれ

- 所在: explainer/solar-bess-hybrid.sources
- 正しい名称: 需要家主導型太陽光発電・再生可能エネルギー電源併設型蓄電池導入支援事業費補助金（執行団体は JPEA太陽光発電推進センター。SII ではない）
- 根拠: url 指定なし→ 検索を実施。資源エネルギー庁の公募ページ https://www.enecho.meti.go.jp/appli/public_offer/2024/0426_01.html 等に逐語「需要家主導型太陽光発電・再生可能エネルギー電源併設型蓄電池導入支援事業費補助金」。執行団体は JPEA太陽光発電推進センター（jp-pc-info.jp、逐語「需要家主導による太陽光発電導入促進補助金 需要家主導型太陽光発電及び再生可能エネルギー電源併設型蓄電池導入支援事業費補助金」）。sii.or.jp 限定検索では当該事業は確認できず（SII の掲載事業は省エネ投資促進支援事業・系統用蓄電池導入支援事業等）。★事業は実在するが、当サイトは名称が短縮されており、かつ発行元（執行団体）が誤り。

### 資源エネルギー庁「蓄電池産業政策」 — 表記ゆれ

- 所在: explainer/subsidies-guide.sources
- 正しい名称: 蓄電池・電源産業戦略（2026年6月2日改訂。旧称「蓄電池産業戦略」2022年8月31日 蓄電池産業戦略検討官民協議会）
- 根拠: url 指定なし。WebSearch（allowed_domains: meti.go.jp）で「蓄電池産業政策」は0件。公式ドメインの実在資料は「蓄電池産業戦略 2022年８月31日 蓄電池産業戦略検討官民協議会」（https://www.meti.go.jp/policy/mono_info_service/joho/conference/battery_strategy/battery_saisyu_torimatome.pdf）、および経済産業省プレス「『蓄電池産業戦略』を『蓄電池・電源産業戦略』に改訂しました」（https://www.meti.go.jp/press/2026/06/20260602001/20260602001.html・2026年6月2日）。「政策」ではなく「戦略」が正しく、さらに現行名は「蓄電池・電源産業戦略」。名称が二重に古い。

### OCCTO「系統情報の公表の考え方」 — 表記ゆれ

- 所在: explainer/substation-availability-13-indicators-guide.sources
- 正しい名称: 系統情報の公表の考え方（発行元は資源エネルギー庁 電力・ガス事業部。OCCTO ではない）
- 根拠: url 指定なし→ 検索で公式 PDF を特定し取得 https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/pdf/keitou_kangaekata_20241209.pdf → HTTP 200（27頁）。1頁目 逐語「系統情報の公表の考え方／平成２４年１２月…令和６年１２月改定／資源エネルギー庁 電力・ガス事業部」。★資料名そのものは逐語で実在するが、発行元が誤り。本文冒頭も「平成２７年４月に電力広域的運営推進機関が発足して以降…」と、OCCTO は公表を担う側として言及されているだけで策定主体ではない。occto.or.jp 側に同名資料は無い。

### 東京都都市整備局「新築建物太陽光発電設備設置等義務制度」 — 表記ゆれ

- 所在: explainer/tokyo-solar-mandate-2025.sources
- 正しい名称: 建築物環境報告書制度（東京都環境局）
- 根拠: 取得URL: https://www.kankyo.metro.tokyo.lg.jp/climate/solar_portal/program / HTTP 200 / <title>「建築物環境報告書制度の概要等／太陽光ポータル／東京都環境局」・<h1>「建築物環境報告書制度の概要等」・<h2>「制度の概要」「改正の経緯」「条例・規則の改正」。WebSearch でも東京都環境局の「東京都建築物環境報告書制度の概要／中小規模新築建物における対策／東京都環境局」（https://www.kankyo.metro.tokyo.lg.jp/climate/green_housing/contents）がヒット。当サイトの「新築建物太陽光発電設備設置等義務制度」という名称は都の公式名称として存在しない（制度の根拠は「都民の健康と安全を確保する環境に関する条例」の改正、2025年4月1日施行）。★あわせて発行元も誤り: 所管は東京都都市整備局ではなく東京都環境局（ドメインも kankyo.metro.tokyo.lg.jp）。

### 経産省「アグリゲーターガイドライン」 — 表記ゆれ

- 所在: glossary/aggregator-business.detail
- 正しい名称: エネルギー・リソース・アグリゲーション・ビジネスに関するガイドライン（ERABガイドライン）
- 根拠: url 指定なし→ 検索を実施。METI の公式名称は逐語「エネルギー・リソース・アグリゲーション・ビジネスに関するガイドライン」（https://www.meti.go.jp/press/2025/11/20251119001/20251119001.html「『エネルギー・リソース・アグリゲーション・ビジネスに関するガイドライン』を改定しました」、本体 PDF 20251119001-1.pdf の表題逐語「エネルギー・リソース・アグリゲーション・ ビジネスに関するガイドライン 策定 平成２７年３月３０日 改定…」）。「アグリゲーターガイドライン」という名称の文書は経産省に存在しない（業界の略称）。

### 電力広域的運営推進機関「容量市場 追加オークション（対象実需給年度：2027年度）約定結果」 — 表記ゆれ

- 所在: glossary/area-price.detail
- 正しい名称: 容量市場追加オークション約定結果（対象実需給年度：2027年度）〔お知らせ表題は「…の公表について」〕
- 根拠: GET https://www.occto.or.jp/news/012931.html → HTTP 200。<title>／<h1>「容量市場追加オークション約定結果（対象実需給年度：2027年度）の公表について」（更新日 2026年08月06日）。ページ内で「容量市場追加オークション約定結果」は 7 hit、当サイトの書き方「容量市場 追加オークション（対象実需給年度：2027年度）約定結果」は 0 hit（括弧の位置と空白が異なる）。資料・URL は実在。

### 日本卸電力取引所（JEPX）「非化石価値取引市場 オークション結果」 — 表記ゆれ

- 所在: glossary/power-market-price-trend.detail
- 正しい名称: 非化石価値取引 市場情報（JEPX）。市場の正式名称は「高度化法義務達成市場」「再エネ価値取引市場」
- 根拠: 取得URL https://www.jepx.jp/nonfossil/market-data/ / HTTP 200 / <title>「市場情報 ／ 非化石価値取引 ／ JEPX」、見出しは「非化石価値取引」「FIT：約定価格(円/kWh)」「非FIT 再エネ指定：約定価格(円/kWh)」等。★「オークション」は当ページ全文でヒット0件、「結果」も0件（使われている語は「約定価格」「入札・約定量」）。追加 WebSearch（allowed_domains: jepx.jp）でも「オークション結果」という表題のページ・PDF は0件（ヒットは「市場情報」「取引概要」「非化石価値取引に関するお知らせ」）。データは実在するが当サイトの書き方が JEPX の名称と異なるため表記ゆれ。JEPX「スポット市場取引結果」→ 実在名「スポット市場」と同型。

### OCCTO「募集要綱（応札年度2026年度）」 — 表記ゆれ

- 所在: policy-events/meti-stable-supply-wg6-ltdc-round4-final-2026-08.description
- 正しい名称: 容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）
- 根拠: url なし → WebSearch で公式ドメイン（occto.or.jp）を特定し取得。取得 URL: https://www.occto.or.jp/news/013102.html ／ HTTP 200。<title> および <h1> 逐語「「容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）」及び「長期脱炭素電源オークション 容量確保契約約款」の公表について」。資料は実在するが、当サイトの表記は前置きの「容量市場 長期脱炭素電源オークション」を欠き、かつ「応札年度：」のコロンがないため逐語不一致（実在資料の省略形＝軽微）。

### 経済産業省（第2回電力安定供給WG）「予備電源の第3回以降の募集内容及び容量市場の供給力確保時期の見直し（案）」 — 表記ゆれ

- 所在: policy-events/occto-yobidengen-boshuyoukou-pubcomm-2026-07.description
- 正しい名称: 予備電源の第3回以降の募集内容及び容量市場の供給力確保時期の見直しについて（案）（第2回 電力安定供給ワーキンググループ 参考資料2）
- 根拠: curl・WebFetch とも meti.go.jp は 403 のためブラウザで取得。(1) https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/index.html ＝<title>「電力安定供給ワーキンググループ （METI/経済産業省）」、開催一覧に「2026年6月5日　第2回」を確認。(2) https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/002.html ＝<title>「総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会 電力安定供給ワーキンググループ（第2回）（METI/経済産業省）」、開催資料欄に逐語「参考資料2　予備電源の第3回以降の募集内容及び容量市場の供給力確保時期の見直しについて（案）（PDF形式：1,472KB）」。回次「第2回」は正しい。資料名のみ「見直しについて（案）」から「について」が脱落している（軽微な表記ゆれ）。

### 総務省消防庁「蓄電池設備の規制（消防関係法令による規制体系）」 — 表記ゆれ

- 所在: src/app/lv/regulation-subsidy/page.tsx:179 / src/app/lv/buying-guide/page.tsx:167 / src/app/lv/risks/page.tsx:155
- 正しい名称: 蓄電池設備の規制（資料１－４）／【消防関係法令による蓄電池設備の規制体系】
- 根拠: 取得 URL: https://www.fdma.go.jp/singi_kento/kento/items/kento164_05_shiryo1-4.pdf ／ HTTP 200 (application/pdf, 759,747 bytes, 12 ページ)。pdfplumber による 1 ページ目の表題逐語「蓄電池設備の規制 資料１－４」「【消防関係法令による蓄電池設備の規制体系】」。資料は実在するが、当サイトの括弧内「消防関係法令による規制体系」は発行元の「消防関係法令による蓄電池設備の規制体系」から「蓄電池設備の」が脱落した言い換え（軽微）。

### DOWAエコジャーナル「リチウムイオン電池の貯蔵に関する消防法の規制見直し（2024）」 — 表記ゆれ

- 所在: src/app/lv/regulation-subsidy/page.tsx:185, src/app/lv/risks/page.tsx:161
- 正しい名称: リチウムイオン電池の貯蔵に関する消防法の規制が見直されました
- 根拠: 取得URL: https://www.dowa-ecoj.jp/law/2024/20240102.html / HTTP 200 (text/html, 33,194 bytes) / <title>「リチウムイオン電池の貯蔵に関する消防法の規制が見直されました ／ DOWAエコジャーナル」、<h1>「リチウムイオン電池の貯蔵に関する消防法の規制が見直されました」。記事自体は実在しページも生存（<h2>「■消防法による規制とは」「■改正の背景」「■今回の改正内容」）。当サイトは「規制見直し（2024）」と体言止め＋年次併記に書き換えており、発行元の見出しと逐語一致しない。

### 日経BP メガソーラービジネス「低圧蓄電所の開発が活発化」 — 表記ゆれ

- 所在: src/app/lv/what-is/page.tsx:159
- 正しい名称: 「低圧」蓄電所の開発が活発化、アグリや区画販売も
- 根拠: GET https://project.nikkeibp.co.jp/ms/atcl/19/news/00001/05844/?ST=msb → HTTP 200。<title>「低圧」蓄電所の開発が活発化、アグリや区画販売も - ニュース - メガソーラービジネス plus : 日経BP、<h1>「低圧」蓄電所の開発が活発化、アグリや区画販売も。本文中に「低圧蓄電所の開発が活発化」（鉤括弧なし）は 0 hit。記事は実在し URL も生きているが、原題の鉤括弧と副題が落ちている（軽微）。

### OCCTO「長期脱炭素電源オークション約定結果（応札2023年度）落札電源一覧」 — 表記ゆれ

- 所在: src/components/Report2026Body.tsx:240
- 正しい名称: 容量市場 長期脱炭素電源オークション約定結果（応札年度：2023年度） 別紙：落札電源一覧
- 根拠: url 指定なし→ occto.or.jp 限定検索で公式 PDF を特定し取得 https://www.occto.or.jp/assets/market-board/market/oshirase/2024/files/240426_longauction_youryouyakujokekka_kouhyou_besshi_ousatsu2023.pdf → HTTP 200（2頁）。1頁目 逐語「電力広域的運営推進機関／2024年4月26日／容量市場 長期脱炭素電源オークション約定結果（応札年度:2023年度） 別紙：落札電源一覧／＜脱炭素電源＞」。資料自体は実在し公表日（当サイト記載 2024-04-26）も一致するが、当サイトは冒頭の「容量市場」と「応札年度：」の「年度：」、および「別紙：」を落としている。

### 日経エネルギーNext「系統用蓄電池が殺到、長期脱炭素電源オークション初回入札結果」 — 表記ゆれ

- 所在: src/components/Report2026Body.tsx:241
- 正しい名称: 系統用蓄電池が殺到、長期脱炭素電源オークションの初回入札結果をひもとく
- 根拠: url なし。WebSearch（発行元 日経BP の公式ドメイン project.nikkeibp.co.jp / xtech.nikkei.com のみ採用）で記事を特定。公式ページタイトル逐語「系統用蓄電池が殺到、長期脱炭素電源オークションの初回入札結果をひもとく｜日経エネルギーNext」（https://project.nikkeibp.co.jp/energy/atcl/19/feature/00004/00021/ ）、同一記事の日経クロステック版 https://xtech.nikkei.com/atcl/nxt/column/18/02421/082100054/ も同タイトル。記事は実在するが、当サイトの表記は「の」と「をひもとく」が脱落した短縮形。記事本体は有料会員向けのため直接取得は行わず、検索結果の公式ドメイン・タイトルで照合。

### 経済産業省「電気事業法に基づく工事計画」 — 未確認

- 所在: explainer/bess-epc-selection.sources
- 根拠: url なし。資料名ではなく手続・制度の通称（電気事業法第 48 条の工事計画届出）を指す記述で、発行元サイトにこの文字列の資料はない。手順 4 に従い未確認（資料名ではなく制度の通称）。出典として機能させるには「電気事業法施行規則」や経済産業省の該当手続ページ名を具体的に挙げる必要がある。

### 電気学会「電力系統制御技術」 — 未確認

- 所在: explainer/bms-vs-ems.sources
- 根拠: url 指定なし→ iee.jp / iee.or.jp / ieej.bookpark.ne.jp 限定検索を実施。この表題の技術報告・書籍は特定できなかった（ヒットしたのは「電力系統用パワーエレクトロニクス機器の解析・シミュレータ技術」(gh1459)、「自励交直変換器と電力系統の相互作用」(gh1612)、「系統における開閉現象と高電圧遮断器の開閉責務」(gh1376) 等、いずれも別表題）。電気学会の技術報告カタログ（電子図書館）は全文横断検索が外部に開かれておらず、また書籍販売サイトが2025年9月30日で終了しているため、不在と断定できない。★実在確認が取れるまで出典として掲げるのは避けるべき。

### 経済産業省「電気事業法および関連政令・省令」 — 未確認

- 所在: explainer/chief-electrical-engineer.sources
- 根拠: url なし。資料名ではなく法令の総称（「電気事業法」＋その施行令・施行規則の束）を指す記述であり、発行元サイトにこの文字列の資料は存在しない。手順 4 に従い未確認（資料名ではなく法令の通称）。参考：資源エネルギー庁「関係法令・ガイドライン等」（ブラウザ取得、<title>「関係法令・ガイドライン等｜資源エネルギー庁」）には「電気事業法」「電気事業法施行令」「電気事業法施行規則」が個別項目として逐語で並んでおり、個別名を挙げれば実在判定が可能。

### 資源エネルギー庁「電気保安制度」 — 未確認

- 所在: explainer/chief-electrical-engineer.sources
- 正しい名称: 再エネ発電設備に係る電気保安制度について（2024年10月9日・産業保安・安全グループ電力安全課）
- 根拠: 資料名ではなく制度の通称（指示の手順4）。参考として meti.go.jp / enecho.meti.go.jp 限定検索では、当該語を含む実在資料として「再エネ発電設備に係る電気保安制度について」（https://www.enecho.meti.go.jp/category/saving_and_new/saiene/community/dl/08_05.pdf）を確認したため、捏造ではなく「制度名を出典欄に書いている」状態。特定の資料を指すなら上記等の表題に置き換えるのが正確。

### EIC Data Insight #75「EU ETS×日本GX-ETS」 — 未確認

- 所在: explainer/eu-ets-and-gx-ets-for-bess.sources
- 根拠: WebSearch「"EIC Data Insight" EU ETS GX-ETS」で、「EIC Data Insight」という刊行物を発行する外部機関が特定できない（返るのは EEA の EU ETS data viewer、ENTSO-E の Energy Identification Codes(EIC)、英 EIC Partnership の UK ETS ページなど、いずれも無関係）。発行元の公式ドメインが確定できないため逐語照合が不能で「未確認」。「EIC Data Insight #75」は当サイト（EIC）側の自社連載・自社分析の通し番号である可能性が高く、その場合は「外部出典」ではなく自社コンテンツとして区別して表示すべき（外部出典として並べると、読者は第三者の公表資料と誤認する）。自社連載であれば当サイト内の該当記事へのリンクを併記するのが妥当。

### 経済産業省「排出量取引制度（GX-ETS）」 — 未確認

- 所在: explainer/eu-ets-and-gx-ets-for-bess.sources
- 根拠: url なし。資料名ではなく制度の名称であるため手順 4 に従い未確認。ただし創作名ではない：経済産業省の該当ページは逐語「排出量取引制度 （METI/経済産業省）」（https://www.meti.go.jp/policy/energy_environment/global_warming/ets.html ）、GXリーグ公式（gx-league.go.jp）のページは逐語「排出量取引制度（GX-ETS）」（https://gx-league.go.jp/action/gxets/ ）。出典として書くなら制度名ではなく具体の資料名（GX-ETS ガイドライン等）を挙げるのが望ましい。

### 資源エネルギー庁「ノンファーム型接続」 — 未確認

- 所在: explainer/grid-connection-process.sources
- 根拠: url なし。資料名ではなく系統接続制度の通称。手順 4 に従い未確認（資料名ではなく制度の通称）。参考：ブラウザで取得した資源エネルギー庁「関係法令・ガイドライン等」（https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/ 、<title>「関係法令・ガイドライン等｜資源エネルギー庁」）の掲載資料一覧にこの語の資料はなく、出典としては「電力品質確保に係る系統連系技術要件ガイドライン（令和6年12月1日改定）」や「系統情報の公表の考え方（令和8年4月改定）」など実在の資料名を挙げるのが妥当。

### 経済産業省「長期脱炭素電源オークション制度」 — 未確認

- 所在: explainer/long-term-decarbonization-auction.sources
- 正しい名称: （資料として引くなら）資源エネルギー庁「長期脱炭素電源オークションについて」／「長期脱炭素電源オークションガイドライン」（2023年7月11日策定・2025年8月27日改定）
- 根拠: 資料名ではなく制度の通称（指示の手順4）。meti.go.jp 限定検索では制度自体は実在し、資料としては「長期脱炭素電源オークションについて」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/denryoku_gas/seido_kento/pdf/092_03_03.pdf ほか複数回次）、「長期脱炭素電源オークションガイドライン」（https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/choukigl_20250827.pdf）が存在。「長期脱炭素電源オークション制度」という表題の文書は確認できないため未確認とした。

### SII「補助金事業 公募情報」 — 未確認

- 所在: explainer/subsidies-guide.sources
- 根拠: url 指定なし→ sii.or.jp 限定検索を実施。SII サイトには事業ごとに「公募情報」ページが多数実在する（例 https://sii.or.jp/setsubi06r/overview.html <title>「SII：一般社団法人 環境共創イニシアチブ｜公募情報（1次公募）（令和6年度補正予算 省エネルギー投資促進支援事業）」）が、「補助金事業 公募情報」という単一の資料／ページは存在しない。手順4に準じ、特定の資料を指さないサイト内区分の総称のため未確認。★是正するなら引用対象の事業名（例「令和6年度 系統用蓄電池・水電解装置導入支援事業」）まで特定するのが適切。

### 総務省消防庁「総務省消防庁資料（資料名なし）」 — 未確認

- 所在: src/app/lv/buying-guide/page.tsx:117
- 正しい名称: （候補）総務省消防庁「蓄電池設備のリスクに応じた防火安全対策検討部会報告書」（令和5年3月）
- 根拠: リクエストなし（照合対象が存在しないため）。src/app/lv/buying-guide/page.tsx:117 の記述は「（出典: 総務省消防庁資料）」で、資料名ではなく発行元名のみ。手順4により「資料名ではなく制度/媒体の通称（発行元名のみ）」として未確認。なお WebSearch で消防庁の実在資料として「蓄電池設備のリスクに応じた防火安全対策検討部会報告書 令和５年３月」（https://www.fdma.go.jp/singi_kento/kento/items/post-116/03/houkokusho.pdf）を確認したため、特定できるならこの表題に差し替えるのが望ましい。

### 電力需給調整力取引所（EPRX）「EPRX 2026年7月30日公表（資料名なし）」 — 未確認

- 所在: src/app/lv/regulation-subsidy/page.tsx:108
- 正しい名称: 需給調整市場のΔkW上限価格について（2026/7/30 更新）
- 根拠: 当サイト側は src/app/lv/regulation-subsidy/page.tsx:108 で「出典: 電力需給調整力取引所（EPRX）2026年7月30日公表」とのみ書いており、資料名を持たない＝手順4の「資料名が無いもの」に該当するため「未確認」。ただし該当公表物は特定できた: 取得URL https://www.eprx.or.jp/information/post.php / HTTP 200 / <title>「上限価格 ／ 取引情報 ／ 一般社団法人 電力需給調整力取引所」・<h1>「上限価格」。本文に逐語で「需給調整市場の各商品区分に適用する上限価格およびその期間は，本ページに掲載する資料「需給調整市場のΔkW上限価格について」を以って公開しております。」、および資料リンク行「需給調整市場のΔkW上限価格について［212.6 KB］ ※2026/7/30更新」。→ 資料名を補える。

### 総務省消防庁／DOWAエコジャーナル「総務省消防庁資料・DOWAエコジャーナル解説（資料名なし）」 — 未確認

- 所在: src/app/lv/regulation-subsidy/page.tsx:88
- 根拠: url 指定なし。当サイト src/app/lv/regulation-subsidy/page.tsx:88 の本文は「（出典: 総務省消防庁資料・DOWAエコジャーナル解説）」で、個別の資料名を持たない発行元／媒体名のみの記載。手順4により未確認。照合すべき逐語対象（資料表題）が存在しないため、実在・不在いずれの判定も不可。★是正するなら「消防法令の危険物第4類に係る具体的な通知／告示名」と「DOWAエコジャーナルの記事タイトル」を特定して明記する必要がある。

### 総務省消防庁「総務省消防庁資料・2024年の規制見直し解説（資料名なし）」 — 未確認

- 所在: src/app/lv/risks/page.tsx:113
- 根拠: 資料名が書かれていない（「総務省消防庁資料」という総称のみ）ため、逐語照合の対象が存在しない。発行元サイト（fdma.go.jp）で特定すべき対象を一意に決められず、指示の手順4に従い未確認とした。該当行に具体的な通知・報告書名（例: 屋内消火設備等に係る技術基準の改正関係）を補う必要がある。

### 日経BP「メガソーラービジネス（媒体名のみ・記事名なし）」 — 未確認

- 所在: src/app/lv/what-is/page.tsx:123
- 根拠: 資料名ではなく媒体の名称のみ。ローカル該当箇所は「（出典: 日経BP メガソーラービジネス）」で記事名・URL がなく、照合対象がない。媒体自体は実在（項目1で取得した https://project.nikkeibp.co.jp/... の <title> に「メガソーラービジネス plus : 日経BP」を確認、HTTP 200）。直近行（:159）で 05844 の記事を引いているので、同記事名を明示すれば解消する。

### 関西電力「関西電力 法人向け解説（資料名なし）」 — 未確認

- 所在: src/app/lv/what-is/page.tsx:78
- 根拠: url なし。当サイトの記載が資料名ではなく発行元＋媒体の説明（「関西電力 法人向け解説」）のみで、照合すべき逐語の資料名が存在しない。手順 4 に従い未確認（資料名ではなく媒体の通称）。なお同一ソース群の sol.kepco.jp（法人向けソリューションサイト「役に立つコラム」）は実在（上記 1 件目で HTTP 200 確認済み）なので、具体のコラム名を明記すれば実在判定が可能。

### JEPX／OCCTO／SII／NREL「JEPX/OCCTO/SII 公表資料、業界EPC公表値、NREL ATB (CC BY 4.0)」 — 未確認

- 所在: src/app/tools/irr-simulator/page.tsx:148
- 根拠: url 指定なし。当サイト src/app/tools/irr-simulator/page.tsx:148 の記載は「出典: JEPX/OCCTO/SII 公表資料、業界EPC公表値、NREL ATB (CC BY 4.0)。」で、個別の資料表題を持たない発行元／媒体名の列挙。手順4により未確認（照合すべき逐語対象が無い）。ただし構成要素のうち「NREL ATB（Annual Technology Baseline）」のみは実在の刊行物で、nrel.gov 限定検索で atb.nrel.gov の「Utility-Scale Battery Storage ／ Electricity ／ 2024 ／ ATB ／ NREL」等を確認済み。★是正するなら JEPX／OCCTO／SII の各「公表資料」を具体名（例: OCCTO「容量市場 メインオークション約定結果」）に展開する必要がある。

### NREL「NREL ATB参考値」 — 未確認

- 所在: src/components/LcoeLcosCalculator.tsx:281
- 正しい名称: Annual Technology Baseline (ATB) — 該当ページは Utility-Scale Battery Storage ／ Electricity ／ ATB
- 根拠: 直接取得を2回試行して失敗: curl https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage → HTTP 000（curl exit 6 = ホスト名解決不可）、curl https://www.nrel.gov/analysis/data-tech-baseline.html → HTTP 000（同）。WebFetch でも getaddrinfo ENOTFOUND atb.nrel.gov。本実行環境から nrel.gov 系ドメインが DNS 解決できないため逐語照合ができず「未確認」とした（推測で実在とはしない）。参考: WebSearch（nrel.gov 限定）では公式ドメイン上のページ名として「Utility-Scale Battery Storage ／ Electricity ／ 2024 ／ ATB ／ NREL」（https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage）が返り、刊行物名は「Annual Technology Baseline」。当サイトの逐語（src/components/LcoeLcosCalculator.tsx:281）は「「NREL ATB参考値」は ATB が独自CF・前提で算出した公表 LCOE（$/MWh）で、左の簡易値とは前提が異なります。」で、「NREL ATB参考値」は UI ラベルであり刊行物名ではない点に注意。

### OCCTO／日経エネルギーNext／PVeye「OCCTO 約定結果（資料名の特定なし）」 — 未確認

- 所在: src/components/Report2026Body.tsx:101
- 正しい名称: 容量市場メインオークション約定結果（対象実需給年度：〇〇年度）／長期脱炭素電源オークションの場合は同オークションの約定結果公表資料
- 根拠: 当サイト側の逐語（src/components/Report2026Body.tsx:101）: 「（出所：OCCTO 約定結果／日経エネルギーNext／PVeye）」。資料名も回次も年度も特定されていない＝手順4の「資料名が無いもの」に該当するため「未確認」。参考として OCCTO の実在名は WebSearch（occto.or.jp 限定）で確認: 「容量市場メインオークション約定結果（対象実需給年度：2028年度） 2025年1月29日 電力広域的運営推進機関」（https://www.occto.or.jp/assets/market-board/market/oshirase/2024/files/250129_mainauction_youryouyakujokekka_kouhyou_jitsujukyu2028.pdf）、「容量市場関係の情報・手続き」（https://www.occto.or.jp/various/capacity-market/）。本文が第1回・第2回の長期脱炭素電源オークションを論じているため、正しくは長期脱炭素電源オークションの約定結果資料名＋年度を明記すべき。

### 経済産業省・資源エネルギー庁／OCCTO「（資料名なし・省庁名のみ）」 — 未確認

- 所在: src/components/Report2026Body.tsx:78
- 根拠: url なし。当サイトの記載が省庁名・機関名の列挙のみで資料名が存在せず、照合対象の逐語がない。手順 4 に従い未確認（資料名ではなく発行元名のみ）。出典として機能させるには参照した資料名（例：資源エネルギー庁「需給調整市場について」、OCCTO「容量市場メインオークション約定結果」等）の明記が必要。

### NEA／CNESA／Carbon Brief／S&P Global／ess-news「Carbon Brief (136号文) ほか」 — 未確認

- 所在: src/data/global-markets.ts:125
- 根拠: url なし。当サイトの記載が媒体名の列挙＋「(136号文) ほか」という注記で、照合すべき記事名・資料名が特定できない（「136号文」は中国の政策文書の通称であって Carbon Brief の資料名ではない）。手順 4 に従い未確認（資料名ではなく媒体名の列挙）。出典として機能させるには各媒体の具体的な記事名と URL の明記が必要。

### 印政府・内閣／SECI／IEEFA／JMK Research／ess-news「（資料名なし・機関名のみ）VGF ほか」 — 未確認

- 所在: src/data/global-markets.ts:160
- 根拠: 当サイト側の逐語（src/data/global-markets.ts:160）: 「出典: 印政府/内閣 (VGF) / SECI / IEEFA / JMK Research / ess-news。(2026-06-30 半期更新)」。資料名ではなく発行機関名・媒体名のみの列挙であり、手順4の「媒体名のみ（資料名が無いもの）」に該当するため照合対象を特定できず「未確認」。VGF（Viability Gap Funding）は制度の略称であって資料名ではない。5機関それぞれについて、参照した公表資料名と年次（例: SECI の入札結果公表、IEEFA のレポート名、JMK Research のレポート名）を特定して書き下す必要がある。

### 電力広域的運営推進機関（OCCTO）「需給調整市場の概要」 — 実在

- 所在: explainer/balancing-market.sources
- 根拠: url なし → WebSearch（完全一致「需給調整市場の概要」）。公式ドメイン occto.or.jp に逐語一致の資料が実在：「（参考資料）需給調整市場の概要 ２０１８年４月２７日 電力広域的運営推進機関 意見募集資料 第３回需給調整市場検討小委員会 資料５－２－２」（https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2018/files/jukyu_shijo_03_05_02_02.pdf ）。発行元・資料名とも一致。

### EPRX「需給調整市場のΔkW上限価格について」 — 実在

- 所在: explainer/balancing-price-cap-10yen-explainer.sources / explainer/balancing-price-cap-10yen-explainer.body
- 根拠: 取得URL https://www.eprx.or.jp/information/post.php / HTTP 200 / <title>「上限価格 ／ 取引情報 ／ 一般社団法人 電力需給調整力取引所」、<h1>「上限価格」。本文に逐語「本ページに掲載する資料「需給調整市場のΔkW上限価格について」を以って公開しております。」、末尾に「需給調整市場のΔkW上限価格について［212.6 KB］ ※2026/7/30更新」。url・資料名とも正しい。

### 日経エネルギーNext「系統用蓄電池事業への参入企業は4分類」 — 実在

- 所在: explainer/bess-business-decision-tree.sources
- 正しい名称: （完全な表題）系統用蓄電池事業への参入企業は4分類、電気事業ノウハウのない企業も
- 根拠: 取得URL https://project.nikkeibp.co.jp/energy/atcl/19/feature/00029/081300002/ / HTTP 200 / <title>「系統用蓄電池事業への参入企業は4分類、電気事業ノウハウのない企業も｜日経エネルギーNext」、<h1>同文、本文「第2回 目黒 文子＝グローシップ シニアストラテジスト 2024/08/15 07:00」。当サイトの記載は表題の前半を逐語で含むため実在と判定。厳密さを期すなら副題「、電気事業ノウハウのない企業も」まで入れるのが正確。

### 三井住友銀行「再エネ導入の鍵、系統用蓄電池事業に国内初の融資」 — 実在

- 所在: explainer/bess-pf-merchant-vs-multiuse.sources
- 根拠: 取得URL: https://www.smfg.co.jp/sustainability/social_value/interview/0021.html / HTTP 200 (text/html, 18,805 bytes) / <h1>「再エネ導入の鍵、系統用蓄電池事業に国内初*の融資」で逐語一致（「国内初」の直後の「*」は同ページ内の注記記号であり名称の一部ではない）。<title> は「インタビュー： 三井住友フィナンシャルグループ」、<h2>「プロジェクトの開始経緯と系統用蓄電池事業の難しさ」「国内初のプロジェクトファイナンス組成までの道のり」。※発行元は smfg.co.jp ＝三井住友フィナンシャルグループ（SMFG）の sustainability サイト。当サイト表記の「三井住友銀行」は厳密には掲載主体と異なるが、資料名自体は一致。

### 経産省「蓄電池産業戦略」 — 実在

- 所在: explainer/bess-supply-chain-responsibility.sources, glossary/v2x.detail
- 根拠: 取得 https://www.meti.go.jp/policy/economy/economic_security/battery/ → HTTP 200。<title>「蓄電池 （METI/経済産業省）」、本文中に逐語「蓄電池産業戦略」。★注記: 2026年6月2日に経産省が「蓄電池産業戦略」を「蓄電池・電源産業戦略」へ改訂済み（https://www.meti.go.jp/press/2026/06/20260602001/20260602001.html をブラウザで取得、逐語「2022年8月に策定した『蓄電池産業戦略』について…『蓄電池・電源産業戦略』として改訂しました」）。名称は実在するが、現行戦略を指す文脈なら新名称への更新が必要。

### OCCTO「容量市場 業務マニュアル」 — 実在

- 所在: explainer/capacity-market-advanced.sources
- 根拠: url 指定なし→ occto.or.jp 限定検索で公式 PDF を特定し取得 https://www.occto.or.jp/assets/market-board/market/jitsujukyukanren/files/250130_jikkouseitest_jitsujukyu2027.pdf → HTTP 200（95頁）。1頁目 逐語「容量市場／業務マニュアル／実効性テスト 編／（対象実需給年度：2027 年度）／2025 年 1 月 30 日 第 1 版 発行／電力広域的運営推進機関」。「容量市場 業務マニュアル」はシリーズ名として逐語で実在（編ごとに副題が付く）。

### OCCTO「メインオークション約定結果」 — 実在

- 所在: explainer/capacity-market.sources
- 正しい名称: （完全な表題）容量市場メインオークション約定結果（対象実需給年度：XXXX年度）
- 根拠: url 指定なし。WebSearch（allowed_domains: occto.or.jp）で公式 PDF 表題「容量市場メインオークション約定結果 （対象実需給年度：2029年度） 2026年1月20日 2026年1月23日訂正 電力広域的運営推進機関」、お知らせ表題「容量市場メインオークション約定結果（対象実需給年度：2029年度）の公表について」（https://www.occto.or.jp/news/010680.html）を確認。当サイトの「メインオークション約定結果」は正式表題の逐語部分（先頭の「容量市場」が欠けているだけ）のため実在と判定。厳密には「容量市場メインオークション約定結果」と書くのが正確。

### 電力広域的運営推進機関「容量市場 業務マニュアル」 — 実在

- 所在: explainer/capacity-market.sources
- 根拠: url なし → WebSearch「電力広域的運営推進機関 容量市場 業務マニュアル」。公式ドメイン occto.or.jp に同名シリーズが多数実在し、PDF 表題が逐語「容量市場 業務マニュアル 実効性テスト 編 （対象実需給年度：2025 年度） 2023 年1 月19 日 第1 版 発行 電力広域的運営推進機関」（https://www.occto.or.jp/assets/market-board/market/jitsujukyukanren/files/230119_jikkouseitest_jitsujukyu2025.pdf ）、「容量市場 業務マニュアル メインオークションの 参加登録 編 （対象実需給年度：2026 年度）」（https://www.occto.or.jp/assets/market-board/market/jitsujukyukanren/files/220728_mainauction_sankatouroku.pdf ）等。「容量市場 業務マニュアル」はシリーズ名として逐語一致（引用時は「〜編（対象実需給年度：◯年度）」まで書くとより正確）。

### OCCTO「容量市場の概要」 — 実在

- 所在: explainer/capacity-market.sources
- 根拠: GET https://www.occto.or.jp/assets/market-board/market/files/youryou_gaiyousetumei.pdf → HTTP 200・application/pdf。pdfplumber で1ページ目：「説明会資料／容量市場の概要について／2019年10月／電力広域的運営推進機関」。当サイトの「容量市場の概要」は公式表題の逐語部分（末尾「について」のみ差）。

### 環境省「脱炭素先行地域」 — 実在

- 所在: explainer/decarbonization-leading-regions-detail.sources
- 根拠: url 指定なしのため WebSearch（allowed_domains: env.go.jp）で特定。公式ドメインに逐語のページ・報道発表が多数存在: 「脱炭素先行地域 - 脱炭素地域づくり支援サイト｜環境省」（https://policies.env.go.jp/policy/roadmap/preceding-region/）、「脱炭素先行地域選定結果（第６回）について ／ 報道発表資料 ／ 環境省」（https://www.env.go.jp/press/press_04798.html）、「脱炭素先行地域づくりガイドブック（第2版）令和４年６月 環境省」。制度名かつページ名として発行元サイトに逐語で存在するため実在。

### 電力広域的運営推進機関（OCCTO）「系統情報サービス」 — 実在

- 所在: explainer/grid-connection-process.body
- 根拠: GET https://www.occto.or.jp/institution/keitoujouhou/index.html → HTTP 200。<title>系統情報サービス等｜電力広域的運営推進機関、<h1>系統情報サービス等。「系統情報サービス」を逐語で含むサービス名として実在。

### 資源エネルギー庁「電力ネットワークの次世代化」 — 実在

- 所在: explainer/grid-connection-process.sources
- 根拠: curl は HTTP 202（bot判定・本文0字）のためブラウザで取得 https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/039.html。<title>「総合エネルギー調査会 省エネルギー・新エネルギー分科会／電力・ガス事業分科会 再生可能エネルギー大量導入・次世代電力ネットワーク小委員会（第39回）…合同会議（METI/経済産業省）」、開催日 2022年2月14日、開催資料に逐語「資料3　電力ネットワークの次世代化（PDF形式：7,164KB）」。問合せ先も資源エネルギー庁。同名の資料は他回にも複数存在（例「電力ネットワークの次世代化について」2024年9月11日 資料8）。

### 電力広域的運営推進機関「需給調整市場の概要」 — 実在

- 所在: explainer/grid-scale-bess.sources
- 根拠: url 指定なし→ occto.or.jp 限定検索で公式 PDF を特定し取得 https://www.occto.or.jp/assets/iken/2018/files/sankou_jukyuchouseishijo.pdf → HTTP 200（43頁）。1頁目 逐語「（参考資料）／需給調整市場の概要／２０１８年４月２７日／電力広域的運営推進機関」。表題・発行元とも一致（頭に「（参考資料）」が付く）。

### EIC Data Insight #74「LCOE×電源構成」 — 実在

- 所在: explainer/lcoe-and-power-mix.sources
- 根拠: GET https://data.eic-jp.org/ → HTTP 200（<title>EIC Data — 日本のエネルギーと金融の引用インフラ、「独自 Insight 108 本」と明記）。GET https://data.eic-jp.org/insight → HTTP 200、一覧に「LCOE × 電源構成：安い電源ほど日本では少ない」（出典: NREL ATB + METI 電力調査統計／更新 2026-06-08）を逐語で確認。★ただし通し番号「#74」はサイト上に表示がなく（"#7" 0 hit）、番号部分だけは公表面で照合できない。

### SOLAR JOURNAL「2026年、日本の電力需要家に訪れる3つの大変革」 — 実在

- 所在: explainer/low-voltage-balancing-market-launch.sources
- 根拠: 取得 https://solarjournal.jp/policy/61672/ → HTTP 200。<h1> 逐語「2026年、日本の電力需要家に訪れる3つの大変革。需給調整市場を低圧リソースに開放」。当サイト表記は句点までの前半と完全一致（後段の副題を省略）。副題を含めるとより正確。

### OCCTO「容量市場 長期脱炭素電源オークション約定結果」 — 実在

- 所在: explainer/ltdc-3rd-auction-ccs-ldes.sources
- 根拠: 取得 URL: https://www.occto.or.jp/news/market-board_market_oshirase_2025_20250428_youryouyakujokekka_kouhyou.html ／ HTTP 200。<title> および <h1> 逐語「容量市場　長期脱炭素電源オークション約定結果（応札年度：2024年度）の公表について」。当サイトの表記「容量市場 長期脱炭素電源オークション約定結果」は、この正式名の前半と逐語一致（末尾の「（応札年度：〇〇年度）の公表について」を省いた資料シリーズ名）。

### ユーラスエナジー「需給調整市場とは」 — 実在

- 所在: explainer/multi-use-operation-strategy.sources
- 根拠: GET https://www.eurus-energy.com/mirumiruwakaru/20260130-2618.html → HTTP 200。<h2>需給調整市場とは が逐語で存在（本文でも 7 hit）。ただし記事の完全タイトルは「需給調整市場とは？蓄電池ビジネスに欠かせない仕組みをわかりやすく解説」（<title>/<h1>）。見出し逐語一致のため実在と判定したが、記事名として引くなら完全タイトルが正確。

### NEDO「次世代全固体蓄電池材料の評価・基盤技術開発」 — 実在

- 所在: explainer/solid-state-battery-grid-deployment.sources
- 根拠: url 指定なし→ nedo.go.jp 限定検索で事業ページを特定し取得 https://www.nedo.go.jp/activities/ZZJP_100257.html → HTTP 200。<title>「次世代全固体蓄電池材料の評価・基盤技術開発 ／ 事業 ／ NEDO」、<h1>「次世代全固体蓄電池材料の評価・基盤技術開発」で逐語一致（事業略称 SOLiD-Next、2023〜2027年度）。

### エナリス「再エネ併設蓄電池 制御支援サービス」 — 実在

- 所在: explainer/storage-parity-aggregation.sources
- 根拠: url なし → WebSearch で公式ドメイン（eneres.co.jp / eneres.jp）を特定し取得。取得 URL: https://www.eneres.co.jp/news/20260107.html ／ HTTP 200。<title> および <h1> 逐語「「再エネ併設蓄電池 制御支援サービス」を2026年4月より提供開始に～再生可能エネルギーの有効活用と発電事業者の収益向上を目指し～」。本文中に逐語「再エネ併設蓄電池 制御支援サービス」が 5 箇所出現。公式サービスページ https://www.eneres.jp/service/renewable-energy-co-located-battery/ も同名。

### NEDO「公募情報」 — 実在

- 所在: explainer/subsidies-guide.sources
- 根拠: url なし → WebSearch で公式ドメイン（nedo.go.jp）を特定し取得。取得 URL: https://www.nedo.go.jp/koubo/index.html ／ HTTP 200。<title>「公募 ／ NEDO」、<h1>「公募」。本文に逐語「公募情報」が 2 箇所（「公募情報の検索ができます。」「公募情報 NEDO事業・プロジェクトの実施者を募集しています。」）。検索結果の別ページ https://www.nedo.go.jp/form/event.php?f=koubo.html は逐語「公募情報一覧 ／ NEDO」。ページ名として逐語が実在するため実在と判定（ただし特定の資料名ではなくサイト内の情報区分である点に注意）。

### 東京都環境局「ゼロエミッション東京戦略」 — 実在

- 所在: explainer/tokyo-solar-mandate-2025.sources
- 根拠: url なし → WebSearch で公式ドメイン（kankyo.metro.tokyo.lg.jp）を特定し取得。取得 URL: https://www.kankyo.metro.tokyo.lg.jp/policy_others/zeroemission_tokyo/strategy/ ／ HTTP 200。<title> 逐語「ゼロエミッション東京戦略／ゼロエミッション東京／東京都環境局」、<h1> 逐語「ゼロエミッション東京戦略」。本文に同語が 11 箇所。なお最新版は「ゼロエミッション東京戦略 Beyond カーボンハーフ」で、文脈により版の明記が望ましい。

### 経済産業省「定置用蓄電システムの現状と課題」 — 実在

- 所在: glossary/battery-storage-site.detail
- 根拠: 取得URL https://www.meti.go.jp/policy/mono_info_service/joho/conference/battery_strategy2/shiryo06.pdf / HTTP 200 / 4,061,631 bytes / 全19ページ / pdfplumber で1ページ目表題を読み取り、逐語「資料6 定置用蓄電システムの現状と課題 2025年3月12日 経済産業省」。完全一致。

### 電力広域的運営推進機関「容量拠出金を知ろう！」 — 実在

- 所在: glossary/capacity-contribution.detail
- 根拠: ★当サイトが貼っている url https://www.occto.or.jp/capacity-market/kyoshutsukin/ は HTTP 404（404ページが返る。<title>「電力広域的運営推進機関」）。occto.or.jp 限定検索で正しい URL を特定し取得 https://www.occto.or.jp/capacity-market/kyoshutsukin_know/ → HTTP 200、<title> 逐語「容量拠出金を知ろう！｜かいせつ容量市場スペシャルサイト｜電力広域的運営推進機関」。資料（ページ）名は実在するが、リンク URL が誤り（末尾 kyoshutsukin → kyoshutsukin_know）。要修正。

### 環境省「グリーンローンガイドライン」 — 実在

- 所在: glossary/green-loan.detail
- 根拠: 取得URL https://greenfinanceportal.env.go.jp/loan/guideline/guideline.html / HTTP 200 / <title>「グリーンローンガイドライン ／ グリーンローンガイドライン ／ ローン ／ グリーンファイナンスポータル」、<h1>「グリーンローンガイドライン」、本文「環境省では、グリーンローンの環境改善効果に関する信頼性の確保と、借り手のコストや事務的負担の軽減との両立を図り、国内におけるグリーンローンの普及を目的とし…」。見出しに「改訂履歴」あり。完全一致。

### LMA（ローン・マーケット・アソシエーション）等「グリーンローン原則（GLP）」 — 実在

- 所在: glossary/green-loan.detail
- 根拠: GET https://greenfinanceportal.env.go.jp/loan/guideline/guideline.html → HTTP 200、<title>グリーンローンガイドライン ／ … ／ グリーンファイナンスポータル。本文に「グリーンローン原則（GLP）」が逐語で 2 箇所（「国際的に広く認知されているGLP（グリーンローン原則）との整合性に配慮したガイドラインを策定」等）。名称は実在。★ただし当サイトが紐づけている URL は環境省「グリーンローンガイドライン（2026年版）」のページで、GLP 本体（LMA/APLMA/LSTA 発行）ではない。発行元表記「LMA 等」とリンク先（環境省）が食い違っている。

### 電力広域的運営推進機関「電源接続案件募集プロセス」 — 実在

- 所在: glossary/interconnection-cost-burden.detail
- 根拠: 取得URL: https://www.occto.or.jp/access/process/tokyo/ / HTTP 200 / <title>「＜東京電力管内＞電源接続案件募集プロセス 完了済案件の情報｜電力広域的運営推進機関」・<h1>「＜東京電力管内＞電源接続案件募集プロセス 完了済案件の情報」で「電源接続案件募集プロセス」が逐語で存在。WebSearch（occto.or.jp 限定）でも「東北北部エリア 電源接続案件募集プロセス ／ 系統アクセス」「電源接続案件募集プロセスの基本的な進め方について 電力広域的運営推進機関」（https://www.occto.or.jp/assets/access/process/files/171025_process_susumekata.pdf）等、同名のページ・資料が多数実在。

### 資源エネルギー庁「発電等設備の設置に伴う電力系統の増強及び事業者の費用負担等の在り方に関する指針」 — 実在

- 所在: glossary/interconnection-cost-burden.detail
- 根拠: 指定 URL https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/pdf/hiyoufutangl_2024.pdf は curl で HTTP 403（meti 系の bot 判定のため生死は未確定）。ブラウザで発行元の掲載ページ https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/ を取得（<title> 逐語「関係法令・ガイドライン等｜資源エネルギー庁」）、「ガイドライン等」欄にリンクテキスト逐語「発電等設備の設置に伴う電力系統の増強及び事業者の費用負担等の在り方に関する指針（費用負担ガイドライン）（令和6年5月15日改定）（PDF形式：945KB）」を確認。資料名は完全一致で実在。★付帯：同ページの href は .../pdf/hiyoufutangl_20240515.pdf であり、当サイトが張る .../pdf/hiyoufutangl_2024.pdf とは異なる。リンク切れの可能性があるため URL の確認を推奨。

### 資源エネルギー庁「なるほど！グリッド 出力制御について」 — 実在

- 所在: glossary/n-1-densei.detail
- 根拠: curl は HTTP 202（bot判定・本文0字）のためブラウザで取得 https://www.enecho.meti.go.jp/category/saving_and_new/saiene/grid/08_syuturyokuseigyo.html。<title> 逐語「出力制御について／なるほど！グリッド｜資源エネルギー庁」、パンくず「…新エネルギー> なるほど！グリッド> 出力制御について」、本文見出し「なるほど！グリッド／出力制御について／1．出力制御について」。特設コンテンツ名＋ページ名として逐語一致。

### 電力広域的運営推進機関「N-1電制の基本的な考え方について」 — 実在

- 所在: glossary/n-1-densei.detail
- 根拠: 取得URL https://www.occto.or.jp/news/access_oshirase_2018_181001_n-1densei_shiryou.html / HTTP 200 / <title>「N-1電制の基本的な考え方について｜電力広域的運営推進機関」、<h1>「N-1電制の基本的な考え方について」、本文「更新日：2025年01月23日」「このN-1電制の基本的な考え方や具体的手法をとりまとめましたので、公表します。適用開始日：2018年10月1日 変更日：2025年1月23日」。完全一致。

### 電力広域的運営推進機関（OCCTO）「容量市場 メインオークション約定結果」 — 実在

- 所在: glossary/power-market-price-trend.detail
- 根拠: url なし → WebSearch「OCCTO 容量市場 メインオークション約定結果 公表」。公式ドメイン occto.or.jp に逐語一致の資料が多数実在：PDF 表題「容量市場メインオークション約定結果 （対象実需給年度：2028年度） 2025年1月29日 電力広域的運営推進機関」（https://www.occto.or.jp/assets/market-board/market/oshirase/2024/files/250129_mainauction_youryouyakujokekka_kouhyou_jitsujukyu2028.pdf ）、ページ名「容量市場メインオークション約定結果（対象実需給年度：2029年度）の公表について」（https://www.occto.or.jp/news/010680.html ）。当サイトの「容量市場 メインオークション約定結果」は発行元表記（間に空白なし）との差が空白のみで、逐語相当と判断。

### 電力需給調整力取引所「取引実績の取りまとめ結果」 — 実在

- 所在: glossary/power-market-price-trend.detail
- 根拠: GET https://www.eprx.or.jp/information/summary.php → HTTP 200。<title>取引実績の取りまとめ結果 ／ 取引情報 ／ 一般社団法人 電力需給調整力取引所、<h1>取引実績の取りまとめ結果、本文「需給調整市場における取引実績のとりまとめ結果を公表いたします。」。当サイトの表記と逐語一致（背景に挙がっていた旧・誤称の是正が効いている）。

### 電力需給調整力取引所「需給調整市場のΔkW上限価格について」 — 実在

- 所在: glossary/power-market-price-trend.detail, explainer/balancing-market-fcr-detail.body, explainer/balancing-market-cap-cut-2026.body
- 根拠: 取得URL: https://www.eprx.or.jp/information/post.php / HTTP 200 (14,796 bytes) / <title>「上限価格 ／ 取引情報 ／ 一般社団法人 電力需給調整力取引所」・<h1>「上限価格」。本文に資料名が逐語で 2 箇所: 「需給調整市場の各商品区分に適用する上限価格およびその期間は，本ページに掲載する資料「需給調整市場のΔkW上限価格について」を以って公開しております。」および掲載リンク行「需給調整市場のΔkW上限価格について［212.6 KB］ ※2026/7/30更新」。HTML 全文の 'ΔkW上限価格' ヒットあり。同ページは根拠審議会も明記（「※１ 第96回制度検討作業部会 (2024年9月27日) 資料3 スライド45参照」「※２ 第4回電力安定供給ワーキンググループ（2026年7月14日）資料6 スライド22参照」）。

### 日本インタラクティブ広告協会（JIAA）「インターネット広告倫理綱領」 — 実在

- 所在: glossary/pr-article.detail
- 根拠: url 指定なし→ 検索で公式ページを特定し取得 https://www.jiaa.org/jiaa/rinrikoryo/ → HTTP 200。<title>／<h1> は「広告倫理綱領」だが、本文中に逐語「インターネット広告倫理綱領」が存在（綱領そのものの正式名称）。発行元（一般社団法人 日本インタラクティブ広告協会）も一致。

### 環境省「ストレージパリティの達成に向けた太陽光発電設備等の価格低減促進事業」 — 実在

- 所在: news/news-weekly-2026-09-w1.body
- 根拠: GET https://www.env.go.jp/press/press_05272.html → HTTP 200。<title>／<h1>「令和８年度予算『ストレージパリティの達成に向けた太陽光発電設備等の価格低減促進事業』の公募について ／ 報道発表資料 ／ 環境省」。事業名は逐語一致（他に press_03858.html 令和7年度補正、press/110821.html 等でも同一名称）。

### 電力・ガス取引監視等委員会／経済産業省「適正な電力取引についての指針」 — 実在

- 所在: policy-events/balancing-market-reform-2026-03.description
- 根拠: 取得URL: https://www.egc.meti.go.jp/info/guideline/pdf/20250131001.pdf / HTTP 200 (application/pdf) / pdfplumber で 1ページ目を抽出、表題が逐語で「適正な電力取引についての指針」、続けて「令和７年１月３１日」「公正取引委員会」「経 済 産 業 省」。WebSearch でも複数改定版（令和8年3月13日版 https://www.jftc.go.jp/hourei_files/denki.pdf、令和6年11月22日版など）が実在。★資料名は完全一致で問題なしだが、発行元表記が不正確: 正しくは「公正取引委員会・経済産業省」の連名であり、電力・ガス取引監視等委員会（egc.meti.go.jp）は掲載・所管部局であって発行名義ではない。

### 電力広域的運営推進機関「長期脱炭素電源オークション 容量確保契約約款」 — 実在

- 所在: policy-events/ltdc-2026-boshuyoukou-kouhyou-2026-09.description
- 根拠: url 指定なし。WebSearch（allowed_domains: occto.or.jp）で公式ドメインに逐語一致を確認: ページ表題「長期脱炭素電源オークション 容量確保契約約款」（https://www.occto.or.jp/various/capacity-market/jitsujukyukanren/yakkan_long.html）、PDF 表題「長期脱炭素電源オークション 容量確保契約約款 2025 年9 月3 日 電力広域的運営推進機関」（https://www.occto.or.jp/assets/market-board/market/jitsujukyukanren/files/250903_kakuhokeiyaku_long.pdf）、お知らせ「容量市場 長期脱炭素電源オークション募集要綱（応札年度：2025年度）及び長期脱炭素電源オークション 容量確保契約約款の公表」。完全一致。

### 電力広域的運営推進機関「容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）」 — 実在

- 所在: policy-events/ltdc-2026-boshuyoukou-kouhyou-2026-09.description
- 根拠: GET https://www.occto.or.jp/news/013102.html → HTTP 200。<title>／<h1>「『容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）』及び『長期脱炭素電源オークション 容量確保契約約款』の公表について」（掲載開始日 2026年09月02日）。当サイトの資料名は鉤括弧内と逐語一致（ページ内 5 hit）。

### 経済産業省「蓄電池・電源産業戦略」 — 実在

- 所在: policy-events/meti-next-gen-battery-rd-plan-pubcomm-2026-07.description
- 根拠: curl は HTTP 202（bot判定・本文0字）のためブラウザで取得 https://www.meti.go.jp/press/2026/06/20260602001/20260602001.html。<title> 逐語「「蓄電池産業戦略」を「蓄電池・電源産業戦略」に改訂しました（METI/経済産業省）」、公表日 2026年6月2日、関連資料名も逐語「蓄電池・電源産業戦略（PDF形式：2.0MB）」「蓄電池・電源産業戦略 参考資料（PDF形式：8.1MB）」。発行元は経済産業省（商務情報政策局 電池産業課）。本体 PDF 表題も「蓄電池・電源産業戦略 2026年６月２日 蓄電池産業戦略推進会議」。

### OCCTO「容量確保契約約款」 — 実在

- 所在: policy-events/meti-stable-supply-wg6-ltdc-round4-final-2026-08.description
- 根拠: 取得URL: https://www.occto.or.jp/market-board/market/jitsujukyukanren/jitsujukyu_kyoutsu.html / HTTP 200 / <title>「容量確保契約約款｜電力広域的運営推進機関」・<h1>「容量確保契約約款」で逐語一致（HTML 全文にも '容量確保契約約款' のヒットあり）。本体 PDF も複数版が実在: 「容量確保契約約款 2025 年1 月 電力広域的運営推進機関」（https://www.occto.or.jp/assets/market-board/market/jitsujukyukanren/files/250130_kakuhokeiyaku.pdf）、長期脱炭素電源オークション向けの「長期脱炭素電源オークション 容量確保契約約款 2023 年 9 月」。※長期脱炭素電源オークション（LTDC）の文脈で引くなら、後者の「長期脱炭素電源オークション 容量確保契約約款」と区別して書くのが正確。

### 東京電力パワーグリッド「当社における系統情報について」 — 実在

- 所在: src/app/grid/tokyo/status/page.tsx:149, explainer/tepco-pg-grid-info-suspension-2026.sources
- 根拠: 取得 https://www.tepco.co.jp/pg/consignment/system/ → HTTP 200。<title>「当社における系統情報について｜系統情報｜東京電力パワーグリッド株式会社」、<h1>「当社における系統情報について」で逐語一致。

### JEPX「利用する場合は、出所を明示した上でご利用下さい（著作権条項の逐語）」 — 実在

- 所在: src/app/industry/page.tsx:263, src/lib/eic-license.ts:146
- 根拠: GET https://www.jepx.jp/ → HTTP 200（トップに当該文言は 0 hit。「免責事項・著作権」→ /disclaimer/ のリンクのみ）。GET https://www.jepx.jp/disclaimer/ → HTTP 200、本文に「著作権 当ウェブサイトに掲載されている内容に関する著作権は本所にあります。利用する場合は、出所を明示した上でご利用下さい。」を逐語で確認。条項の引用は正しい。★注意: 当サイトが示す URL は jepx.jp トップで、条文そのものは /disclaimer/ にある（JEPX はトップ以外へのリンクを制限しているため現状の運用は妥当だが、読者が条文に辿れない点は要判断）。

### JEPX「リンクについて」 — 実在

- 所在: src/app/industry/page.tsx:266
- 根拠: 当サイトが書いている url https://www.jepx.jp/ / HTTP 200 では「リンク」の語はヒット0。同サイトのリンク一覧から /disclaimer/ を特定し取得: https://www.jepx.jp/disclaimer/ / HTTP 200 / <title>「免責事項・著作権 ／ JEPX」、見出しに逐語「リンクについて」、本文「このホームページへのリンクは、原則として自由です。但し以下に該当するリンク元ウェブサイトやリンクの設定方法はお断りいたします。」。名称は実在（親ページ名は「免責事項・著作権」）。src/app/industry/page.tsx:266 のコメントが参照している但書もこのページのもの。

### 九州電力送配電「蓄電池等の低圧電線路への連系申込みについて」 — 実在

- 所在: src/app/lv/entry-guide/page.tsx:159
- 根拠: 取得URL https://www.kyuden.co.jp/td/service/application/interconnection.html / HTTP 200 / <title>「九州電力送配電 蓄電池等の低圧電線路への連系申込みについて」、<h1>「蓄電池等の低圧電線路への連系申込みについて」。本文にも逐語「蓄電池等の低圧電線路への連系申込みについて」。完全一致。

### 資源エネルギー庁「系統用蓄電池の迅速な系統連系に向けて」 — 実在

- 所在: src/app/lv/entry-guide/page.tsx:165
- 根拠: 取得 https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/smart_power_grid_wg/pdf/002_02_00.pdf → HTTP 200（3,128,399 bytes・33頁）。pdfplumber で1頁目を抽出、逐語「資料2／系統⽤蓄電池の迅速な系統連系に向けて／2025年3月17日／資源エネルギー庁」。表題・発行元とも一致（「⽤」は PDF 埋込フォントの異体字グリフで文字は同一）。

### GridWatch「太陽光・蓄電池、JC-STAR★1が連系条件へ」 — 実在

- 所在: src/app/lv/regulation-subsidy/page.tsx:191, src/app/lv/entry-guide/page.tsx:171
- 根拠: GET https://www.gridwatch.jp/policy/der-cybersecurity-jc-star-grid-connection-february-2026 → HTTP 200。<title>太陽光・蓄電池、JC-STAR★1が連系条件へ ／ Gridwatch Policy Desk、<h1>太陽光・蓄電池、JC-STAR★1が連系条件へ。当サイトの表記と逐語一致。

### OCCTO「第57回需給調整市場検討小委員会資料」 — 実在

- 所在: src/app/lv/regulation-subsidy/page.tsx:95
- 根拠: 取得 URL: https://www.occto.or.jp/iinkai/jukyuchousei/57.html ／ HTTP 200。<title> および <h1> 逐語「第57回 需給調整市場検討小委員会（第74回 調整力の細分化及び広域調達の技術的検討に関する作業会と合同開催）」。回次「第57回」も一致（本文中に 5 箇所出現）。手順 5 により会議名＋回次一致で実在。

### OCCTO（電力広域的運営推進機関）「第57回 需給調整市場検討小委員会 資料3」 — 実在

- 所在: src/app/lv/revenue-model/page.tsx:162 / src/app/lv/regulation-subsidy/page.tsx:167
- 根拠: 取得URL https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_57_03.pdf / HTTP 200 / 3,654,261 bytes / pdfplumber で1ページ目表題を読み取り、逐語「第５７回需給調整市場検討小委員会・第７４回調整力の細分化及び広域調達の技術的検討に関する作業会 資料３」「需給調整市場における機器個別計測・低圧リソース導入について（2026年度からの制度開始に向けた整理）」「２０２５年９月２６日」。回次(第57回)・資料番号(資料3)とも一致。

### 経済産業省「第4回 電力安定供給ワーキンググループ」 — 実在

- 所在: src/app/lv/revenue-model/page.tsx:168, src/app/lv/regulation-subsidy/page.tsx:173, src/app/lv/buying-guide/page.tsx:161, src/app/lv/risks/page.tsx:149
- 根拠: 取得 https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/004.html → HTTP 200。<title>／<h1> 逐語「総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会 電力安定供給ワーキンググループ（第4回）」。回次「第4回」一致。開催資料一覧も取得（資料1〜資料6、参考資料1〜4）。手順5により会議名の実在を確認。

### 電力需給調整力取引所（EPRX）「需給調整市場のΔkW上限価格について」 — 実在

- 所在: src/app/lv/revenue-model/page.tsx:90 / glossary/power-market-price-trend.detail / explainer/balancing-market-cap-cut-2026.body / policy-events/balancing-market-price-cap-10yen-2026-09.description / policy-events/meti-stable-supply-wg4-balancing-cap-2026-07.description
- 根拠: 取得URL https://www.eprx.or.jp/ / HTTP 200（当サイトが書いている url はトップ）。トップには当該資料名の逐語なし（メニューに「上限価格」項目のみ）。実体は https://www.eprx.or.jp/information/post.php / HTTP 200 で、<title>「上限価格 ／ 取引情報 ／ 一般社団法人 電力需給調整力取引所」、本文に逐語「本ページに掲載する資料「需給調整市場のΔkW上限価格について」を以って公開しております。」および「需給調整市場のΔkW上限価格について［212.6 KB］ ※2026/7/30更新」。名称は実在。ただし url をトップではなく上限価格ページに向けるのが正確。

### OCCTO「第57回需給調整市場検討小委員会 資料」 — 実在

- 所在: src/app/lv/what-is/page.tsx:120, src/app/lv/revenue-model/page.tsx:86
- 根拠: 取得URL: https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_57_03.pdf / HTTP 200 / 同 PDF 1ページ目の冒頭に会議名が逐語で存在: 「第５７回需給調整市場検討小委員会・第７４回調整力の細分化及び広域調達の技術的検討に関する作業会 資料３」。回次（第57回）も一致するため手順5の基準で「実在」。※資料番号まで書くなら「資料3」と特定するとより正確（/lv/what-is:154 は既に特定済み、revenue-model:86・what-is:120 は「資料」止まり）。

### 関西電力「高圧電力とは？低圧電力や特別高圧電力との違い」 — 実在

- 所在: src/app/lv/what-is/page.tsx:147
- 根拠: 取得 URL: https://sol.kepco.jp/useful/aircontrol/w/koatsudenryokui/ ／ HTTP 200 (text/html)。<title> 逐語「高圧電力とは？低圧電力や特別高圧電力との違い、契約の注意点を解説｜役に立つコラム｜【全国対応】関西電力／公式　-　法人向けソリューションサイト」、<h1> 逐語「高圧電力とは？低圧電力や特別高圧電力との違い、契約の注意点を解説」。当サイトの表記はこの正式タイトルの前半の逐語一致（「、契約の注意点を解説」を省略した短縮形）。

### OCCTO（電力広域的運営推進機関）「需給調整市場における機器個別計測・低圧リソース導入について」 — 実在

- 所在: src/app/lv/what-is/page.tsx:153
- 根拠: 取得URL: https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_57_03.pdf / HTTP 200 (application/pdf, 3,654,261 bytes) / pdfplumber で 1ページ目を抽出。表題が逐語一致: 「需給調整市場における機器個別計測・低圧リソース導入について」（直前に「第５７回需給調整市場検討小委員会・第７４回調整力の細分化及び広域調達の技術的検討に関する作業会 資料３」、直後に「（2026年度からの制度開始に向けた整理）」「２０２５年９月２６日」）。当サイト側の書き方（src/app/lv/what-is/page.tsx:154「OCCTO 第57回 需給調整市場検討小委員会 資料3「需給調整市場における機器個別計測・低圧リソース導入について」」）は資料番号（資料3）まで一致。

### EPRX「summary_2024.pdf ／ summary_2025.pdf（公表元ファイル名）」 — 実在

- 所在: src/app/tools/balancing-revenue/page.tsx:484
- 根拠: GET https://www.eprx.or.jp/information/summary.php → HTTP 200。ページ内のリンクに /information/docs/summary_2024.pdf（リンク文言「2024年度の取引実績について［7.6 MB］」）、/information/summary_2025.pdf（同「2025年度の取引実績について［4.4 MB］」）が逐語で存在。当サイトは pdfFileNameOf() でファイル名のみを表示し URL を組み立てていない（src/lib/eprx-monthly）ため、2024 年度だけ /docs/ 配下という配置差はリンク切れにならない。

### NREL「NREL ATB 2024（Annual Technology Baseline）」 — 実在

- 所在: src/app/tools/lcoe-lcos/page.tsx:150
- 根拠: 指定 URL https://atb.nrel.gov/ は当環境から取得不可（curl exit 000 / WebFetch は getaddrinfo ENOTFOUND atb.nrel.gov、代替の www.osti.gov も curl exit 000＝当環境のネットワーク制約で名前解決できず）。そのため WebSearch で公式ドメインの結果のみを採用し逐語照合：atb.nrel.gov のページタイトル「About the 2024 Electricity ATB - Annual Technology Baseline」（https://atb.nrel.gov/electricity/2024/about ）、「2024 Electricity ATB Technologies and Data Overview」（https://atb.nrel.gov/electricity/2024/index ）、DOE OSTI のデータセット名「2024 Annual Technology Baseline (ATB) Cost and Performance Data for Electricity Generation Technologies」。「Annual Technology Baseline」「ATB」「2024」がいずれも公式ドメインで逐語一致するため実在と判定（ただし当方からの直接 HTTP 取得は未達である旨を明記）。

### 一般社団法人 電力需給調整力取引所（EPRX）「取引実績の取りまとめ結果」 — 実在

- 所在: src/app/tracker/imbalance/page.tsx:190, src/data/eprx-monthly-battery.json:_meta.source_name
- 根拠: 取得 https://www.eprx.or.jp/ → HTTP 200。本文中に逐語「取引実績の取りまとめ結果」が2箇所（ナビゲーション「取引情報」配下）。リンク先は /information/summary.php。★背景に挙がった EPRX「調整力の取引結果まとめ」という誤名称は、現在の当サイト表記では既に正しい「取引実績の取りまとめ結果」に是正済みであることを確認。

### 電力需給調整力取引所（EPRX）「取引実績の取りまとめ結果」 — 実在

- 所在: src/app/tracker/imbalance/page.tsx:251 / src/app/tools/balancing-revenue/page.tsx:461 / src/components/BalancingSourceComparison.tsx:243 / glossary/power-market-price-trend.detail
- 根拠: 取得 URL: https://www.eprx.or.jp/ ／ HTTP 200。<title>「一般社団法人 電力需給調整力取引所」。ページ本文（取引情報ナビゲーション）に逐語「取引実績の取りまとめ結果」が 2 箇所出現（「…上限価格 調整力必要量 取引実績の取りまとめ結果 系統作業等による取引の制約…」）。なお誤記例の「調整力の取引結果まとめ」は同ページに 0 件で、現在の表記は正しい。

### EPRX「取引実績の取りまとめ結果」 — 実在

- 所在: src/app/tracker/imbalance/page.tsx:290, src/data/milestones.ts:175
- 根拠: 取得URL: https://www.eprx.or.jp/ / HTTP 200 (text/html, 18,626 bytes) / <title>「一般社団法人 電力需給調整力取引所」。グローバルナビ「取引情報」配下に逐語で「取引実績の取りまとめ結果」が存在（リンク先 /information/summary.php）。同ナビの並び: 取引実績／取引実績（グラフ表示）／三次調整力②の使用率等／上限価格／調整力必要量／取引実績の取りまとめ結果／系統作業等による取引の制約。

### 電力需給調整力取引所（EPRX）／経済産業省「需給調整市場のΔkW上限価格について ／ 第 4 回 電力安定供給ワーキンググループ 資料 6」 — 実在

- 所在: src/components/BalancingRevenueEstimator.tsx:187
- 根拠: 取得 https://www.eprx.or.jp/information/post.php → HTTP 200。<title>「上限価格 ／ 取引情報 ／ 一般社団法人 電力需給調整力取引所」。本文に逐語「需給調整市場の各商品区分に適用する上限価格およびその期間は，本ページに掲載する資料『需給調整市場のΔkW上限価格について』を以って公開しております。」、掲載ファイル名も逐語「需給調整市場のΔkW上限価格について［212.6 KB］ ※2026/7/30更新」。根拠の回次も同ページ逐語「※２ 第4回電力安定供給ワーキンググループ（2026年7月14日）資料6 スライド22参照」で一致。なお当該 資料6 自体の表題は METI 004.html の開催資料一覧で「資料6　需給調整市場について」だが、当サイトは資料番号での参照であり表題の誤記ではない。

### 電力需給調整力取引所（EPRX）／経済産業省「需給調整市場のΔkW上限価格について ／ 第4回 電力安定供給ワーキンググループ 資料6」 — 実在

- 所在: src/components/BalancingSourceComparison.tsx:249
- 正しい名称: （正式名）総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会 電力安定供給ワーキンググループ（第4回）資料6「需給調整市場について」
- 根拠: (1) EPRX側: https://www.eprx.or.jp/information/post.php / HTTP 200 / 逐語「需給調整市場のΔkW上限価格について」を確認（上記項目と同じ）。同ページ注記に逐語「※２ 第4回電力安定供給ワーキンググループ（2026年7月14日）資料6 スライド22参照」。(2) 経産省側: 取得URL https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/004.html / HTTP 200 / <title>「総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会 電力安定供給ワーキンググループ（第4回）（METI/経済産業省）」、開催日「2026年7月14日」、開催資料に逐語「資料6 需給調整市場について（PDF形式：2,127KB）」。会議名・回次・資料番号すべて一致。

### 国土交通省「不動産情報ライブラリ(reinfolib) ／ 国土数値情報」 — 実在

- 所在: src/components/HazardRiskCard.tsx:191
- 根拠: GET https://www.reinfolib.mlit.go.jp/ → HTTP 200、<title>不動産情報ライブラリ。同ページの関連リンク内に「国土数値情報」が逐語で存在（1 hit）。いずれも国土交通省の提供サービス名として実在し、当サイトの表記と一致。

### JEPX「スポット市場（JEPX_SPOT_PAGE_NAME 参照）」 — 実在

- 所在: src/components/JEPXDashboard.tsx:182, src/app/market/jepx/page.tsx:130
- 根拠: 定数の実値を確認: src/lib/eic-license.ts:143 `export const JEPX_SPOT_PAGE_NAME = 'スポット市場';`。発行元照合 — 取得URL https://www.jepx.jp/ / HTTP 200 に「スポット市場 インデックス」が逐語で存在。さらに取得URL https://www.jepx.jp/electricpower/market-data/spot/ / HTTP 200 の <title>「スポット市場 ／ 市場情報 ／ 電力取引 ／ JEPX」。JEPX トップのグローバルナビでは当該ページの掲出名は「市場情報」（/electricpower/market-data/spot/）で、その下層ページ名が「スポット市場」。→ 先行是正（スポット市場取引結果→スポット市場）は正しく着地している。

### PVeye／経済産業省 電力安全課「蓄電池設備における爆発・火災事故及びその対応」 — 実在

- 所在: src/components/Report2026Body.tsx:169
- 根拠: curl は HTTP 202・本文0字（meti.go.jp の bot 判定）、WebFetch は 403 のため、Browser で https://www.meti.go.jp/shingikai/sankoshin/hoan_shohi/denryoku_anzen/denki_setsubi/021.html を取得。「第21回 産業構造審議会 保安・消費生活用製品安全分科会 電力安全小委員会 電気設備自然災害等対策ワーキンググループ」（開催日 2024年9月10日）の開催資料に「資料3　蓄電池設備における爆発・火災事故及びその対応について（事務局資料）（PDF形式：1,494KB）」を逐語で確認。問合せ先は「大臣官房 産業保安・安全グループ 電力安全課」。当サイトの名称は公式表題の逐語部分（末尾「について」のみ差）。なお併記の「PVeye」側は記事名が示されておらず、その部分は照合できない。

### 資源エネルギー庁「系統用蓄電池の現状と課題」 — 実在

- 所在: src/components/Report2026Body.tsx:239
- 根拠: url 指定なしのため WebSearch（allowed_domains: meti.go.jp / enecho.meti.go.jp）で特定。公式ドメインの PDF 表題が逐語一致: 「系統用蓄電池の現状と課題 資料５ 2024年5月29日 資源エネルギー庁」（https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/pdf/062_05_00.pdf）、同「系統⽤蓄電池の現状と課題 資料３ 2024年5⽉24⽇ 資源エネルギー庁」（.../keito_wg/pdf/051_03_00.pdf）。当サイト src/components/Report2026Body.tsx:239 の表記「資源エネルギー庁『系統用蓄電池の現状と課題』（2024-05-29）」は日付まで一致。PDF 本体の再取得はサイト負荷抑制のため省略（検索結果の表題は PDF 本文由来）。

### PVeye WEB「脱炭素電源競売で蓄電池1GW強落札 ／ 鹿児島で大型蓄電池が全焼」 — 実在

- 所在: src/components/Report2026Body.tsx:242
- 根拠: 2本とも逐語一致。(1) 取得URL https://www.pveye.jp/eye_sight/view/5151/ / HTTP 200 / <title>「脱炭素電源競売で蓄電池1GW強落札 ／ 再生可能エネルギーの専門メディア PVeyeWEB」・<h1>「脱炭素電源競売で蓄電池1GW強落札」。(2) 取得URL https://www.pveye.jp/eye_sight/view/5101/ / HTTP 200 / <title>「鹿児島で大型蓄電池が全焼 ／ 再生可能エネルギーの専門メディア PVeyeWEB」・<h1>「鹿児島で大型蓄電池が全焼」。当サイトの記載（Report2026Body.tsx:242「PVeye WEB「脱炭素電源競売で蓄電池1GW強落札」「鹿児島で大型蓄電池が全焼」」）と完全一致。

### 経済産業省 産業保安・安全グループ 電力安全課「蓄電池設備における爆発・火災事故及びその対応」 — 実在

- 所在: src/components/Report2026Body.tsx:243
- 根拠: 同上（Browser 取得、https://www.meti.go.jp/shingikai/sankoshin/hoan_shohi/denryoku_anzen/denki_setsubi/021.html）。逐語「資料3　蓄電池設備における爆発・火災事故及びその対応について（事務局資料）」。発行元表記「産業保安・安全グループ 電力安全課」もページ記載の問合せ先（大臣官房 産業保安・安全グループ 電力安全課）と一致。PDF 実体は .../denki_setsubi/pdf/021_03_00.pdf（curl は 202 で取得不可・METI の bot ゲート）。

### OCCTO「容量市場メインオークション約定結果」 — 実在

- 所在: src/data/capacity-market-history.ts:120 / src/app/tools/capacity-market-bid/page.tsx:351
- 根拠: url 指定なしのため WebSearch（allowed_domains: occto.or.jp）で特定。公式ドメインで逐語一致を複数確認: PDF 表題「容量市場メインオークション約定結果 （対象実需給年度：2029年度） 2026年1月20日 2026年1月23日訂正 電力広域的運営推進機関」（https://www.occto.or.jp/assets/various/capacity-market/jitsujukyukanren/2029_jitsujukyu_kanren/260123_mainauction_youryouyakujokekka_kouhyou_jitsujukyu2029.pdf）、お知らせページ表題「容量市場メインオークション約定結果（対象実需給年度：2029年度）の公表について」（https://www.occto.or.jp/news/010680.html）。名称は逐語で実在（実務上は「（対象実需給年度：XXXX年度）」が付く）。

### 豪政府DCCEEW／AEMO／Energy-Storage.News「AEMO 2026 ISP（統合系統計画）」 — 実在

- 所在: src/data/global-markets.ts:195
- 根拠: 直接取得は不可（GET https://www.aemo.com.au/energy-systems/major-publications/integrated-system-plan-isp/2026-integrated-system-plan-isp → HTTP 403、WebFetch も 403、ブラウザ遷移は拒否）。aemo.com.au に限定した検索で公式ページ「AEMO ／ 2026 Integrated System Plan (ISP)」（同 URL）および公表 PDF .../isp/2026/2026-integrated-system-plan-isp.pdf を確認。刊行物名は「2026 Integrated System Plan (ISP)」で、当サイトの「AEMO 2026 ISP（統合系統計画）」は同一物の和訳併記。★HTTP 200 での逐語確認までは取れていない点は申し添える。

### SEIA／財務省・IRS／EIA「SEIA Energy Storage Market Outlook Q1 2026 ／ IRS Notice 2026-15 (FEOC) ／ EIA」 — 実在

- 所在: src/data/global-markets.ts:55
- 正しい名称: （IRS の正式表題）Notice 2026-15 "Guidance to Apply Interim Safe Harbors for Purposes of Determining a Taxpayer's Material Assistance from a Prohibited Foreign Entity; Other Prohibited Foreign Entity Guidance"
- 根拠: (1) SEIA: 取得URL https://seia.org/research-resources/energy-storage-market-outlook-q1-2026/ / HTTP 403（curl を bot 判定・本文取得不可）。WebSearch で公式ドメイン seia.org のページ表題「Energy Storage Market Outlook Q1 2026 – SEIA」を確認、シリーズ親ページ「Energy Storage Market Outlook – SEIA」も存在。名称は実在と判断。(2) IRS: 取得URL https://www.irs.gov/pub/irs-drop/n-26-15.pdf / HTTP 200 / 528,627 bytes / pdfplumber で1ページ目・PDFメタ Title を読み取り、逐語「Notice 2026-15」「Guidance to Apply Interim Safe Harbors for Purposes of Determining a Taxpayer's Material Assistance from a Prohibited Foreign Entity; Other Prohibited Foreign Entity Guidance」。★本文の用語は FEOC ではなく "prohibited foreign entity (PFE)" で統一されているため、「(FEOC)」の併記は厳密には通知の用語と異なる。また発行は米国財務省（Treasury）・IRS で、当サイトの「財務省」は日本の財務省と紛らわしい。(3) EIA: 機関名のみで資料名がなく、この部分は手順4により未確認。

### SolarPower Europe／Terna／S&P Global「SolarPower Europe European Battery Market Outlook 2026-2030 ／ Terna (MACSE)」 — 実在

- 所在: src/data/global-markets.ts:90
- 根拠: url 指定なし→ 検索で公式ページを特定し取得 https://www.solarpowereurope.org/insights/outlooks/european-battery-market-outlook-2026-2030-1 → HTTP 200。<h1> 逐語「European Battery Market Outlook 2026-2030」、<h2>「23 June 2026」（公表日）。SolarPower Europe 部分は表題・発行元とも一致。併記の「Terna (MACSE)」は Terna が運営する蓄電容量調達メカニズムの名称であって資料名ではない（当サイトも発行元併記の体裁なので誤記ではない）。

### 一般社団法人 日本卸電力取引所（JEPX）「スポット市場」 — 実在

- 所在: src/lib/eic-license.ts:143 / glossary/power-market-price-trend.detail（2 箇所）
- 根拠: 取得 URL: https://www.jepx.jp/ ／ HTTP 200。<title>「JEPX」、<h1>「Japan Electric Power eXchange」。本文に発行元名の逐語「一般社団法人 日本卸電力取引所」、および逐語「スポット市場」（「…Japan Electric Power eXchange スポット市場 インデックス DA-24…」）を確認。誤記例の「スポット市場取引結果」は 0 件で、現在の表記は正しい。

