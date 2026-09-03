# projects「調査中」43件 全件再調査レポート（Pj2-A・2026-09-03）

本便は**調査のみ**。microCMS への書込（POST/PATCH/DELETE）は一切行っていない。

(a) の各行はユウが一次照合して**行ごとに承認**し、承認行のみ実行便 B（差分限定 PATCH・#106）で反映する。

## 0. 対象の基準値（実行日 2026-09-03 実測）

- projects 全 331 件 / 一覧掲載 **246 件**（非プロジェクト・301元を除外後）
- **調査中 43 件**（定義: `outputMw === 0 || capacityMwh === 0`。/projects の investigatingCount と同一式）← ユウ 9/3 実測の43件と一致
- **運開予定日超過 × status≠稼働中: 56 件**（判定日 2026-09-03。うち調査中と重複 10 件）

## 1. 調査結果サマリ

| 区分 | 件数 |
|---|---:|
| 一次情報にたどり着き、差分提案あり | 36 |
| 一次にたどり着いたが差分なし（現行値が正／一次に該当記載なし） | -1 |
| 二次のみ（一次未到達・将来の再訪候補） | 4 |
| 収穫ゼロ | 4 |
| **合計** | **43** |

提案行数: **55 行**（フィールド別: sourceUrl 24 / cod 15 / city 9 / prefecture 4 / capacityMwh 2 / outputMw 1）

## (a) 差分 PATCH 案（承認用・1行ずつ可否をご判断ください）

| # | slug | フィールド | 現状値 | 提案値（逐語） | 一次URL | 原文の該当箇所 |
|---:|---|---|---|---|---|---|
| 1 | `pr-co12501-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000380.000012501.html | https://prtimes.jp/main/html/rd/p/000000380.000012501.html | 2026年末までに整備する蓄電所容量は180MWh |
| 2 | `pr-co76147-bess-2` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000212.000076147.html | https://prtimes.jp/main/html/rd/p/000000212.000076147.html | 栃木県那須塩原市 30,000 kW / 112,665 kWh（2028年度）ほか計4案件・合計定格出力101MW |
| 3 | `pr-co21766-bess` | sourceUrl | （なし） | https://www.tokyo-gas.co.jp/news/press/20250306-01.html | https://www.tokyo-gas.co.jp/news/press/20250306-01.html | 苫小牧蓄電所（北海道苫小牧市）出力90MW、森町睦実蓄電所（静岡県周智郡森町睦実）出力75MW、いずれも2028年度運転開始予定 |
| 4 | `pr-co110152-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000008.000110152.html | https://prtimes.jp/main/html/rd/p/000000008.000110152.html | 対象案件(全国で6か所・合計出力約174MW) |
| 5 | `pr-co55631-tokyo-4mw` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000129.000055631.html | https://prtimes.jp/main/html/rd/p/000000129.000055631.html | 太田市小角田町蓄電システム 出力2MW／桐生市境野町蓄電システム 出力2MW |
| 6 | `pr-co55631-gunma` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000146.000055631.html | https://prtimes.jp/main/html/rd/p/000000146.000055631.html | 太田市亀岡町蓄電システム／太田市新田赤堀町蓄電システム／足利市堀込町字中島蓄電システム、出力2MW、2025年9月1日運転開始 |
| 7 | `pr-co160356-bess-2` | prefecture | （市欠落） | 熊本県 | https://prtimes.jp/main/html/rd/p/000000085.000160356.html | ADW熊本益城町蓄電所（熊本県益城町） |
| 8 | `pr-co160356-bess-2` | city | （市欠落） | 益城町 | https://prtimes.jp/main/html/rd/p/000000085.000160356.html | ADW熊本益城町蓄電所（熊本県益城町） |
| 9 | `pr-co160356-bess-2` | outputMw | 0MW | 約2MW | https://prtimes.jp/main/html/rd/p/000000085.000160356.html | 出力 約2MW |
| 10 | `pr-co160356-bess-2` | capacityMwh | 0MWh | 約8MWh | https://prtimes.jp/main/html/rd/p/000000085.000160356.html | 容量 約8MWh |
| 11 | `pr-co160356-bess-2` | cod | （不明） | 2026年8月31日 | https://prtimes.jp/main/html/rd/p/000000085.000160356.html | 2026年8月31日に竣工・引渡し、稼働開始 |
| 12 | `pr-co160356-bess-2` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000085.000160356.html | https://prtimes.jp/main/html/rd/p/000000085.000160356.html | エー・ディー・ワークスの系統用蓄電所事業 第2号「ADW熊本益城町蓄電所」 |
| 13 | `pr-co164583-bess` | sourceUrl | （なし） | https://hp-renewenergy.com/2026/04/28/低圧系統用蓄電所プロジェクト始動/ | https://hp-renewenergy.com/2026/04/28/%E4%BD%8E%E5%9C%A7%E7%B3%BB%E7%B5%B1%E7%94%A8%E8%93%84%E9%9B%BB%E6%89%80%E3%83%97%E3%83%AD%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%E5%A7%8B%E5%8B%95/ | 年間210区画（合計10MW相当）の開発を計画 |
| 14 | `pr-co143072-bess` | city | （市欠落） | 菊川市 | https://prtimes.jp/main/html/rd/p/000000060.000143072.html | 静岡県菊川市 |
| 15 | `pr-co143072-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000060.000143072.html | https://prtimes.jp/main/html/rd/p/000000060.000143072.html | TESSグループ、静岡菊川蓄電所（約30MW）の建設工事に着手 |
| 16 | `pr-co109041-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000142.000109041.html | https://prtimes.jp/main/html/rd/p/000000142.000109041.html | 26年3月までに10拠点の高圧蓄電所を運転開始へ |
| 17 | `pr-co55631-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000148.000055631.html | https://prtimes.jp/main/html/rd/p/000000148.000055631.html | しろくま電力はヘキサ・エネルギーサービスと、全国10カ所の系統用蓄電所を開発中。第一号案件は2025年秋に運転開始予定 |
| 18 | `pr-co33609-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000186.000033609.html | https://prtimes.jp/main/html/rd/p/000000186.000033609.html | 下記の７か所の系統用蓄電所 |
| 19 | `pr-co154894-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000011.000154894.html | https://prtimes.jp/main/html/rd/p/000000011.000154894.html | ヒューリック株式会社・芙蓉総合リース株式会社・伊藤忠商事株式会社との系統用蓄電所事業の共同開発について（RSアセットアドバイザーズ発 PR TIMES） |
| 20 | `pr-tecra-miyagi` | city | （空欄・都道府県のみ） | 宮城県角田市 | https://prtimes.jp/main/html/rd/p/000000143.000061009.html | 宮城県角田市の系統用蓄電池発電所用地を対象とするファンド |
| 21 | `pr-tecra-miyagi` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000143.000061009.html | https://prtimes.jp/main/html/rd/p/000000143.000061009.html | TECRA株式会社 発 PR TIMES『TECROWD73号 宮城県 系統用蓄電池発電所用地ファンド』 |
| 22 | `pr-co176308-bess` | prefecture | （空欄） | 広島県 | https://prtimes.jp/main/html/rd/p/000000002.000176308.html | 納入先：日本蓄電池株式会社／設置場所：広島県庄原市 |
| 23 | `pr-co176308-bess` | city | （空欄） | 庄原市 | https://prtimes.jp/main/html/rd/p/000000002.000176308.html | 納入先：日本蓄電池株式会社／設置場所：広島県庄原市 |
| 24 | `pr-co176308-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000002.000176308.html | https://prtimes.jp/main/html/rd/p/000000002.000176308.html | NExT-e Solutions、東京電力グループと共同開発。日本市場に最適化した『13ft系統用蓄電池システム』初出荷 |
| 25 | `mikimori-nishimorokata-bess` | cod | (未設定) | 2027年2月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 宮崎県西諸県郡蓄電所／九州電力／運転開始予定 2027年2月 |
| 26 | `mikimori-tamana-gun-bess` | cod | (未設定) | 2026年12月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 熊本県玉名郡蓄電所／九州電力／運転開始予定 2026年12月 |
| 27 | `mikimori-kuma-bess` | cod | (未設定) | 2026年12月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 熊本県球磨郡蓄電所／九州電力／運転開始予定 2026年12月 |
| 28 | `mikimori-yame-bess` | cod | (未設定) | 2027年3月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 福岡県八女市蓄電所：2027年3月（九州電力管轄） |
| 29 | `mikimori-kamimashiki-bess` | cod | (未設定) | 2027年2月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 熊本県上益城郡蓄電所：2027年2月（九州電力管轄） |
| 30 | `mikimori-otawara-bess` | cod | (未設定) | 2027年2月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 栃木県大田原市蓄電所：2027年2月（東京電力管轄） |
| 31 | `pr-co173175-shiga-4mwh` | city | （欠落） | 愛荘町 | https://prtimes.jp/main/html/rd/p/000000001.000173175.html | 滋賀県愛荘町 |
| 32 | `pr-co173175-shiga-4mwh` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000001.000173175.html | https://prtimes.jp/main/html/rd/p/000000001.000173175.html | 日本蓄電開発機構、滋賀県で4MWh規模の系統用蓄電池を受電開始 |
| 33 | `ota-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000027.000093934.html | https://prtimes.jp/main/html/rd/p/000000027.000093934.html | （経過開示）系統用蓄電池事業「群馬太田蓄電所」 |
| 34 | `mikimori-katta-bess` | cod | (未設定) | 2026年12月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 宮城県刈田郡蓄電所（東北電力管内）運転開始予定：2026年12月 |
| 35 | `mikimori-kakogawa-bess` | cod | (未設定) | 2026年11月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 兵庫県加古川市蓄電所（関西電力管内）運転開始予定：2026年11月 |
| 36 | `mikimori-hachioji-bess` | cod | (未設定) | 2026年10月 | https://prtimes.jp/main/html/rd/p/000000032.000099599.html | 東京都八王子市蓄電所（東京電力管内）運転開始予定：2026年10月 |
| 37 | `naganuma-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000121.000055631.html | https://prtimes.jp/main/html/rd/p/000000121.000055631.html | 株式会社城洋商事は、電力広域的運営推進機関による長期脱炭素電源オークションで北海道夕張郡長沼町の系統用蓄電所37,515kWを落札 |
| 38 | `naganuma-bess` | cod | （なし） | 2027年度の完工予定 | https://prtimes.jp/main/html/rd/p/000000121.000055631.html | 2027年度の完工予定 |
| 39 | `naganuma-bess` | city | 北海道長沼町 | 北海道夕張郡長沼町 | https://prtimes.jp/main/html/rd/p/000000121.000055631.html | 北海道夕張郡長沼町 |
| 40 | `pr-looop-saitama` | city | （なし） | 比企郡小川町 | https://looop.co.jp/info/4923_20250403 | 所在地：埼玉県比企郡小川町 |
| 41 | `pr-looop-saitama` | capacityMwh | 7.684MWh | 7,683.8kWh | https://looop.co.jp/info/4923_20250403 | 蓄電容量：7,683.8kWh |
| 42 | `pr-looop-saitama` | cod | （なし） | 2025年2月21日 | https://looop.co.jp/info/4923_20250403 | 運転開始日：2025年2月21日 |
| 43 | `pr-looop-saitama` | sourceUrl | （なし） | https://looop.co.jp/info/4923_20250403 | https://looop.co.jp/info/4923_20250403 | 「埼玉県比企郡蓄電ステーション」の運転を開始 |
| 44 | `pr-co88876-bess-3` | prefecture | （なし） | 和歌山県 | https://prtimes.jp/main/html/rd/p/000000044.000088876.html | 和歌山県和歌山市 |
| 45 | `pr-co88876-bess-3` | city | （なし） | 和歌山市 | https://prtimes.jp/main/html/rd/p/000000044.000088876.html | 和歌山県和歌山市 |
| 46 | `pr-co88876-bess-3` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000044.000088876.html | https://prtimes.jp/main/html/rd/p/000000044.000088876.html | 系統用蓄電池事業３基目 地域共生型蓄電所の開発 |
| 47 | `pr-co140317-bess` | prefecture | （なし） | 和歌山県 | https://prtimes.jp/main/html/rd/p/000000034.000140317.html | 和歌山県和歌山市松江 |
| 48 | `pr-co140317-bess` | city | （なし） | 和歌山市 | https://prtimes.jp/main/html/rd/p/000000034.000140317.html | 和歌山県和歌山市松江 |
| 49 | `pr-co140317-bess` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000034.000140317.html | https://prtimes.jp/main/html/rd/p/000000034.000140317.html | 株式会社脱炭素化支援機構がエネルギーパワー株式会社の開発する系統用蓄電所事業へ出資 |
| 50 | `jpn-gifu-sendai` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000056.000161802.html | https://prtimes.jp/main/html/rd/p/000000056.000161802.html | 「NC仙台市上愛子B蓄電所」／定格出力 1,988kW／定格容量 8,146kWh／2026年4月1日 受電開始（日本蓄電池株式会社） |
| 51 | `namie-redox-flow` | sourceUrl | （なし） | https://prtimes.jp/main/html/rd/p/000000007.000110789.html | https://prtimes.jp/main/html/rd/p/000000007.000110789.html | 「浪江第一蓄電所」／所在地「福島県双葉郡浪江町大字川添字中上ノ原161（LEシステム敷地内）」（株式会社 RS Technologies） |
| 52 | `olympia-ota-isesaki` | sourceUrl | （なし） | https://oly.co.jp/news/gunma-ota-start-of-operation/ | https://oly.co.jp/news/gunma-ota-start-of-operation/ | OLYPowerstorage緑町／定格容量 2,468kWh×3台＝7,404kWh／2,100kVAを出力1,998kWに制御／群馬県太田市緑町／2025年4月17日運転開始 |
| 53 | `starseeds-wakayama-inokuchi` | cod | (未設定) | 2026年1月に完工（2025年11月着工） | https://prtimes.jp/main/html/rd/p/000000044.000088876.html | 和歌山県和歌山市において、系統用蓄電池事業の３基目となる「和歌山井ノ口蓄電所」を2025年11月に着工、2026年１月に完工するべく、開発に着手いたしました |
| 54 | `nc-nagano-city` | cod | (未設定) | 2026年10月（受電開始見込み） | https://prtimes.jp/main/html/rd/p/000000201.000033609.html | 岐阜県揖斐郡揖斐川町および長野県長野市の系統用蓄電所が同年10月を見込んでいます |
| 55 | `nc-ibigawa` | cod | (未設定) | 2026年10月（受電開始見込み） | https://prtimes.jp/main/html/rd/p/000000201.000033609.html | 岐阜県揖斐郡揖斐川町および長野県長野市の系統用蓄電所が同年10月を見込んでいます |

## (b) 収穫ゼロ一覧（次回は「前回確認日から N か月」で再訪判定）

| slug | 蓄電所名 | 試した検索語 | 確認日 |
|---|---|---|---|
| `pr-co160356-bess` | エー・ディー・ワークスの系統用蓄電所 | ADワークスグループ 系統用蓄電所 プレスリリース ／ エー・ディー・ワークス 系統用蓄電所 第一拠点 ／ prtimes 160356 系統用蓄電所 | 2026-09-03 |
| `pr-co161802-bess` | 日本蓄電池 | 日本蓄電池株式会社 系統用蓄電所 プレスリリース ／ prtimes 日本蓄電池 系統用蓄電池施設の運用開始 ／ 日本蓄電池 春日井西尾蓄電所 | 2026-09-03 |
| `pr-co160356-bess-3` | 系統用蓄電所（ADワークスグループ） | ADワークスグループ 系統用蓄電所 プレスリリース ／ prtimes 000000043.000160356（ADW三重松阪蓄電所） ／ prtimes 000000085.000160356（ADW熊本益城町蓄電所） | 2026-09-03 |
| `marubeni-2400mwh` | 丸紅新電力2.4GWh共同開発計画 | 丸紅新電力 2.4GWh 系統用蓄電池 共同開発 ／ 丸紅新電力 CATL サンヴィレッジ 2.4GWh 出力 ／ denki.marubeni.co.jp 20251120_01 | 2026-09-03 |

## (c) 二次のみ一覧（一次未到達・手掛かりあり＝将来の再訪候補）

| slug | 蓄電所名 | メモ（何が二次にあったか／次に見るべき先） | 確認日 |
|---|---|---|---|
| `pr-co164583-bess` | 低圧系統用蓄電所（HPリニューエナジー株式会社） | 一次（自社サイト＋PR TIMES 000000004.000164583）を確認したが、所在地は「全国開発」のみで具体的な県市の記載なし。蓄電容量(kWh)の記載も一切なし。現状値10MWは「合計10MW相当」と整合し差分なし。sourceUrl のみ一次URLを提案（公式サイト記事）。これは案件というより全国区画販売プロジェクトで、単一所在地は原理的に存在しない可能性が高い。 | 2026-09-03 |
| `pr-co109041-bess` | ヘキサ・エネルギーサービスと系統蓄電所 | 一次＝PR TIMES（パワーエックス公式配信・企業ID 109041、slug と一致）を確認。ただし内容は業務提携の発表で、個別拠点の所在地・出力(MW)・蓄電容量(MWh)・運転開始時期はいずれも未記載（「高圧2MW未満の系統接続回答書付き」「広さ500平米超」「全国」は用地募集条件であり案件諸元ではない）。よって数値・所在地の提案は不可。sourceUrl のみ一次URLを提案。この行は単 | 2026-09-03 |
| `nc-kainan` | 和歌山県海南市の系統用蓄電所（NCパイオニア） | 既存sourceUrl（PR TIMES／リミックスポイント一次）には海南市案件の出力・容量の記載がなく、あるのは「和歌山県海南市の系統用蓄電所が2026年9月」（受電開始予定）のみ。出力2MWという情報は検索サマリ／二次媒体（infrato・日経BP等）由来で一次確認できず、提案に含めない。cod も既存値が不明で差分判定できないため提案なし（一次原文は「2026年9月」受電開始予定）。 | 2026-09-03 |
| `mikimori-ise-bess` | 三重県伊勢市蓄電所（三木森HD） | 一次2本（PR TIMES自社リリース・三木森エナジー公式）を確認したが、いずれも案件別の出力・容量の内訳がない。PR TIMESは10案件合計で「総出力 19.8MW／総容量 81MWh」、公式サイトは全国23拠点計「184MWh」と拠点別の運転開始予定のみ（三重県は No.7=2026.12、No.20=2027.03 の2件あり、伊勢市がどちらかも特定不能）。合計値からの按分（1.98MW/ | 2026-09-03 |

## (d) 一次到達・差分なしの案件（記録）

同一リリースに当該フィールドの記載が無いことを確認した、または現行値が既に一次と一致していたもの。

| slug | メモ |
|---|---|
| `mimasaka-bess` | 一次2本（東京ガス公式・同社PR TIMES）を確認。記載は「蓄電池出力 2.9万kW」「商業運転開始 2028年度予定」「蓄電池事業者：合同会社バッテリーファーム」「開発支援：Kingdom BESS」。出力は現状29MWと同値のため差分なし。★蓄電容量(kWh/MWh)は一次に記載が存在しない（出力のみ公表）ため capacityMwh は埋められない＝推測しない。cod は現状値未提示のため |

## 2. 運開予定日超過 × status≠稼働中（56件・参考）

調査中43件より優先度は下。次便以降の対象候補として一覧のみ残す。

| slug | 蓄電所名 | cod | status |
|---|---|---|---|
| `taoke-tahara-mutsure` | 愛知県田原市六連町2MW高圧蓄電所（TAOKE ENERGY） | 2026-07-31 |  |
| `taoke-kakamigahara-no2` | 岐阜県各務原市②号2MW高圧蓄電所（TAOKE ENERGY） | 2026-07-07 |  |
| `nc-sendai-kamiayashi` | NC仙台市青葉区上愛子蓄電所（日本蓄電池） | 2026-04-01 |  |
| `nc-nagahama-mikawacho` | NC長浜市三川町蓄電所（日本蓄電池） | 2026-05-22 |  |
| `nc-kama-kuchiharu` | NC口春蓄電所（日本蓄電池） | 2026-06-01 |  |
| `will-bungoono` | 豊後大野蓄電所（ウィル） | 2026年6月（予定） | 建設中 |
| `will-yamaga` | 山鹿蓄電所（ウィル） | 2026年7月（予定） | 建設中 |
| `nanahongi-bess` | 七本木蓄電所（HOBE ENERGY） | 2026-03-31 |  |
| `nc-shirakawa-omotegou` | NC白河市表郷番沢蓄電所 | 2026-04-28 |  |
| `nc-shunan-yuno` | NC周南市湯野蓄電所 | 2026-04-01 |  |
| `pr-co168657-bess` | ヒューリックグループの系統用蓄電池 | 2026-04-15 | 計画中 |
| `pr-co70816-bess-3` | ミツウロコ愛知県田原蓄電所 | 2022-02-09 | 計画中 |
| `pr-co40055-bess` | 再エネ併設型蓄電所（株式会社サーラコーポレーション） | 2024-10-06 | 計画中 |
| `pr-co154894-bess-2` | RSアセットアドバイザーズと前田建設工業が系統用蓄電池 | 2025-02-25 | 計画中 |
| `pr-co16325-bess-2` | 群馬伊勢崎第二蓄電所（ポート） | 2025-10-16 | 計画中 |
| `pr-co169202-bess-2` | 系統用蓄電池（野村屋グループ） | 2025-12-01 | 計画中 |
| `pr-co166651-bess` | パワーエックスと蓄電池 | 2026-04-20 | 計画中 |
| `pr-matsuo-okayama-8mwh` | 岡山県で8MWhの系統用蓄電池 | 2026-03-12 | 計画中 |
| `pr-matsuo-toyama-8mwh` | 富山県富山市にて8MWhの系統用蓄電池 | 2026-01-09 | 計画中 |
| `pr-co173175-saitama-5mwh-2` | 埼玉県上里町で5MWh規模の系統用蓄電池 | 2026-03-31 | 計画中 |
| `pr-co86244-bess-7` | 系統蓄電所（株式会社サンヴィレッジ） | 2024-09-20 | 計画中 |
| `pr-co86244-bess-4` | キャピタルエナジーとサンヴィレッジフルマーチャントでの系統用蓄電所 | 2025-02-04 | 計画中 |
| `pr-co89612-bess-2` | 系統用蓄電池（マーチャントバンカーズ株式会社） | 2025-09-02 | 計画中 |
| `pr-co88876-bess-3` | 系統用蓄電池（スターシーズ株式会社） ★調査中と重複 | 2025-09-19 | 計画中 |
| `pr-co113700-bess-3` | エレビスタ株式会社の系統用蓄電所 | 2025-09-26 | 計画中 |
| `pr-co140317-bess` | 株式会社脱炭素化支援機構がエネルギーパワー株式会社の開発する系統用蓄 ★調査中と重複 | 2025-10-14 | 計画中 |
| `pr-co67590-bess` | 特別高圧系統用蓄電池 | 2026-02-10 | 計画中 |
| `pr-co13775-bess` | 低圧系統用蓄電池（株式会社テクノロジーズ） | 2026-03-14 | 計画中 |
| `pr-co154894-bess` | ヒューリック株式会社・芙蓉総合リース株式会社・伊藤忠商事株式会社との ★調査中と重複 | 2026-03-19 | 計画中 |
| `pr-japan-bess` | 系統用蓄電池（ブルースカイエナジー） | 2026-03-23 | 計画中 |
| `pr-co28193-bess` | 防災型低圧蓄電所 | 2026-04-02 | 計画中 |
| `pr-co18049-bess` | 琵琶湖蓄電所 | 2026-04-02 | 計画中 |
| `pr-tecra-miyagi` | 系統用蓄電池（TECRA株式会社） ★調査中と重複 | 2024-12-19 | 計画中 |
| `pr-co76147-hokkaido` | 北海道電力ネットワーク北芽室変電所隣地における特別高圧系統用蓄電池 | 2025-03-17 | 計画中 |
| `pr-co96742-mie` | 三重県松阪市に初の系統用蓄電所 | 2025-12-03 | 計画中 |
| `pr-energy-bess-2` | 小山市蓄電所（TAOKE ENERGY） | 2025-12-18 | 計画中 |
| `pr-co176308-bess` | 13ft系統用蓄電池 ★調査中と重複 | 2026-01-30 | 計画中 |
| `pr-co12501-bess` | 系統用蓄電所（株式会社エコスタイル） ★調査中と重複 | 2024-02-07 | 計画中 |
| `pr-co76147-bess-2` | 自社単独開発による特別高圧系統用蓄電池 ★調査中と重複 | 2025-12-12 | 計画中 |
| `pr-co21766-bess` | 系統用蓄電池（東京ガス株式会社） ★調査中と重複 | 2025-03-12 | 計画中 |
| `pr-co164583-bess` | 低圧系統用蓄電所（HPリニューエナジー株式会社） ★調査中と重複 | 2026-04-28 | 計画中 |
| `pr-co86244-tochigi-8mwh` | 8MWhの自社蓄電所 | 2025-10-17 | 計画中 |
| `pr-219mwh-bess` | バンプージャパンから合計219MWhの系統用蓄電システムを受注 | 2025-06-05 | 建設中 |
| `pr-co164154-bess` | 札幌で国内最大級の蓄電プロジェクト蓄電所 | 2025-06-10 | 建設中 |
| `pr-co88876-bess-2` | 系統用蓄電池（スターシーズ株式会社） | 2025-09-04 | 建設中 |
| `pr-co88876-bess` | 系統用蓄電池（スターシーズ株式会社） | 2025-09-17 | 建設中 |
| `pr-co113700-bess-2` | 系統用蓄電池（日本エネルギー総合システム株式会社） | 2025-11-19 | 建設中 |
| `pr-co143072-bess-2` | 系統用蓄電所（テスホールディングス株式会社） | 2025-12-15 | 建設中 |
| `pr-co161802-kumamoto-2` | NC宇城市豊野町蓄電所 | 2025-12-18 | 建設中 |
| `pr-daigas-hokkaido` | 北海道千歳市の系統用蓄電池 | 2025-06-20 | 建設中 |
| `pr-co143072-bess` | 静岡菊川蓄電所 ★調査中と重複 | 2025-04-30 | 建設中 |
| `pr-co72482-miyagi-264mwh` | 宮城県で農業資材店を展開する株式会社おてんとさんが系統用蓄電所 | 2026-02-26 | 建設中 |
| `nec-omuta` | RED大牟田蓄電所（NECキャピタル系・九電みらい） | 2025年10月 | 計画中 |
| `marubeni-kitahiroshima` | 北広島蓄電所（丸紅） | 2025年度 | 建設中 |
| `kasai-megapower` | 加西メガパワー蓄電所 | 2026年2月 | 計画中 |
| `itochu-otoku` | 御徳蓄電所（伊藤忠商事・東急不動産他） | 2025年度 | 建設中 |

## 3. 対象抽出の自動化

`scripts/precompute-projects-maintenance.ts` を新設し prebuild に接続した。
build 時に `src/lib/generated/projects-maintenance.json` へ「調査中リスト」と「運開予定日超過フラグ」を出力する。
**ページ表示には一切使わない**（消費側コードなし）。判定式は /projects の実装と同一。
出力にタイムスタンプを持たせず（判定日は `overdueAsOf` に保持）、データ不変なら差分ゼロになる設計。
