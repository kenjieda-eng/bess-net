# Ck-1b 小修正便 実行結果 — 2026-09-23

> 依頼: Ck-1b（/market/jepx の肥大・補助金 scheme の内部メモ・DBJ・FAQ の事実誤り・A11 同型・explainer の非表示・FIT 表示）。
> commit: ae5ae84（コード）＋本報告のコミット。microCMS は PATCH のみ（POST／PUT／DELETE なし）。webhook は EDAさんが停止 → PATCH をまとめて実行し、デプロイはコードの push 1 回だけ。
> 調査と PATCH 計画はワークフロー（計画 11 本＋反証 10 本＝21 エージェント）で並列に作り、反証役が 1 件ずつ live GET と一次で検証した。

## 要約

| 項目 | 結果 |
|---|---|
| §1 /market/jepx | 前方一致を `jepx-spot-` に限定 → HTML **10,490,675 → 2,821,594 bytes**・本文「10 系列・約 5,290 pt」で見出しと一致・派生系列 0。**「aggregation!==derived で除く」案は採れない**（同条件は /dashboard/market で表示中の meti-renewables-share も落とす） |
| §2 補助金 scheme | 内部メモ 28 件を一次の逐語で書き直し＋内部スタンプ 7 件を外科的に除去。走査の再実行で**内部メモの残存 0 件 / 85 レコード** |
| §3 DBJ | status（Ck-1a で是正済）に加え deadline・applicationStart・scheme を終了表現に。subsidy-match は「受付終了」を候補から除外（15 件が候補外に） |
| §4 FAQ | faq-hojokin-08 の「第1回認定（2024年9月）で GS ユアサ等4社」を一次（認定表 45 件）で全面是正。faq-jigyou-01・faq-seido-09 の「登録」→「届出」を書き分け |
| §5 A11 同型 | 6 件（glossary 2・operators 1・explainer 1・news 2）を EPRX／OCCTO の役割どおりに是正 |
| §6 explainer | `bess-depreciation-tax` を非表示（一覧・カテゴリ・関連・sitemap・トップ新着・詳細 404）。件数 263→262 |
| §7 FIT 表示 | **前提の訂正**: fit-price-* はサイトのどこにも表示されていない（0 箇所）。閾値だけの判定は正常な 111 系列を巻き込むため、「停止を確認した系列 AND 閾値」で /ops/freshness に注記（5/688 件・取得停止中（2026-09-05 時点）） |
| PATCH | 計画 48 件 → #106 ✓ 1 件・richEditor の id 採番替えで照合のみ NG 1 件（内容は反映済み・#122）。再実行で全件 skip＝二重適用なし |

## (1) /market/jepx の前後と `getIndicatorsByIdPrefix` の全呼び出し

| 項目 | 前 | 後 |
|---|---|---|
| 取得の前方一致 | `jepx-` | `jepx-spot-` |
| 系列数 | 40（スポット 10＋派生 30） | 10 |
| built HTML | 10,490,675 bytes | 2,821,594 bytes |
| 本文の表記 | 「40 系列、約 5,290 pt × 系列」（見出しは「10 系列」） | 「10 系列、約 5,290 pt × 系列」 |
| JSON-LD | name「JEPX スポット価格 (日次、10 系列)」／distribution「EIC Data JEPX 10 系列」 | 同じ（本文と一致） |

`getIndicatorsByIdPrefix` の呼び出しは 6 箇所。派生（aggregation: derived）を拾うのは JEPX だけだった（カタログ 688 系列中 derived は 45 件＝JEPX 派生 30・EIA CO2 12・LTDC 2・meti-renewables-share 1）。

| file:line | prefix | 該当系列 | 内訳 | 派生を拾うか |
|---|---|---|---|---|
| src/app/market/jepx/page.tsx:49 | `jepx-spot-` | 10 | daily_mean 10 | 拾わない（本便で是正） |
| src/app/dashboard/market/page.tsx:68 | `meti-` | 12 | monthly_sum 11・derived 1 | **derived 1 件を拾う（意図どおり）**＝`meti-renewables-share`（再エネ比率）。同ページの「再エネ比率」カードで表示中のため、derived の一律除外は不可 |
| src/app/dashboard/market/page.tsx:72 | `fuel-` | 7 | raw 7 | 拾わない |
| src/app/dashboard/market/page.tsx:76 | `jgb-` | 2 | raw 2 | 拾わない |
| src/app/dashboard/market/page.tsx:77 | `us-treasury-` | 4 | raw 4 | 拾わない |
| src/app/dashboard/market/page.tsx:78 | `fx-` | 6 | monthly_mean 3・monthly_end/high/low 各 1 | 拾わない |

## (2) 補助金 scheme の内部メモ — ヒット一覧と PATCH 前後

走査対象は subsidies 全 85 レコードの全文字列フィールド（scheme・body・subsidyRate・targetEntity・name・deadline ほか）。
検出語: 【・候補JSON・候補URL・S3・一次照合・CC確認・要注意・TODO・検証・メモ ほか。
ヒット 38 レコードを内容で 3 つに分けた。

| 型 | 件数 | 例 | 扱い |
|---|---|---|---|
| A: 検証プロセスの地の文＋「【2026-08-08 一次照合・S3都道府県拡張】」 | 28 | 「…needsRenewableCombo=true と判定。…補助率・上限・公募期間は候補JSONと一致。」 | 一次の逐語で scheme を書き直し（本便で実施） |
| B: 正規の本文に内部スタンプだけ混入 | 5 レコード 7 箇所 | 「【2026-08-03 ユウ週次巡回・…PDFで一次確認】」「【2026-09-08 是正】」「（2026年7月30日公表・PDF一次確認）」 | 混入部分だけを外科的に除去（本便で実施） |
| C: 正規表記 | 残り | 【対象】【要件】【厳守】【非FIT型】【補助率】等 | 触らない |

### A: 一次の逐語で書き直した 28 件（#106 件別）

| slug | 一次（URL / title 逐語） | 前（先頭 140 字） | 後 | 結果 |
|---|---|---|---|---|
| miyazaki-bess-2026 | https://www.pref.miyazaki.lg.jp/kankyoshinrin/kurashi/shizen/20260611164947.html<br>宮崎県：【住宅・事業所の脱炭素化支援】ひなたゼロカーボン加速化事業補助金のご案内（令和8年度） | 蓄電池導入　蓄電池の導入経費を支援　注意：太陽光発電設備と同時導入に限る 【対象】県内で再エネ・省エネ設備を導入する個人又は法人（個人事業主含む）。個人＝宮崎県内に現に居住し県内市町村の住民基本台帳に記録されている方／法人＝宮崎県内に事業所を置く法人その他の団体（国、市町村を除く… | 宮崎県は、2050年の脱炭素・ゼロカーボン社会実現に向け、温室効果ガス削減を目的として、再エネ・省エネ設備を導入する個人や法人に対し補助金による支援を行なっています。補助対象者は県内で再エネ・省エネ設備を導入する個人又は法人（個人事業主含む）です。蓄電池は事業区分により、「ひなた… | already |
| nagasaki-city-bess-2026 | https://www.city.nagasaki.lg.jp/page/52113.html<br>太陽光発電設備等導入補助金 - 長崎市ウェブサイト（ゼロカーボンシティ推進室） | 蓄電池（1Kwh以上で定置式および太陽光発電設備と同時設置であること）※蓄電池単独での設置は対象外です。（太陽光発電設備単独は可） 【対象】長崎市民（個人：自ら居住又は居住予定の戸建住宅の敷地内に設置する所有者）および長崎市内の事業所等に設置する長崎市内の中小企業者 【要件】再エ… | 「ゼロカーボンシティ長崎」の実現に向けて、長崎市内のCo2の6割を排出している家庭部門およびその他業務部門、運輸部門の排出量を削減するため、長崎市民および市内中小企業者を対象に太陽光発電設備および蓄電池の導入を支援します。補助対象設備は「太陽光発電設備（1Kw以上10Kw未満で自… | already |
| nagasaki-bess-2026 | https://www.pref.nagasaki.jp/doc/page-670825.html<br>自家消費型の太陽光発電等の補助金（再エネ交付金） -  長崎県ホームページ | 蓄電池のみの設置は補助対象外、太陽光発電補助で導入する設備の付帯設備として導入する場合のみ補助対象です。 【対象】県民、事業者（市町を通しての補助のため申請窓口は各市町） 【要件】再エネ発電設備との併設が条件 ★候補JSONとの差異あり：候補は status=受付終了だが、ページ… | 長崎県では、自家消費型の太陽光発電等の補助事業を令和6年度から令和10年度まで行うこととしています。市町を通しての補助となりますので、補助を受けようとする県民、事業者の方は各市町にお問い合わせください。蓄電池のみの設置は補助対象外、太陽光発電補助で導入する設備の付帯設備として導入… | already |
| saga-bess-2026 | https://ondanka-boushi.net/zc-hojo/<br>令和８年度SAGAゼロカーボン加速化事業（事業者向け）補助金 ｜ 佐賀県地球温暖化防止活動推進センター | (２) 蓄電池　補助対象経費の1／3（※家庭用（20kWh以下）は14.1万円/kWh、業務用（20kWh超）は16.0万円/kWhの1/3を上限）上限 265万円 【対象】佐賀県内に事業所（本社、本店、支店、営業所等）を有する法人その他団体（国、市町を除く）（設立の登記をしてお… | この補助金は、佐賀県全域で脱炭素の取組を促進することを目的として、県内事業者の再生可能エネルギー・省エネルギー設備の導入等に要する経費を支援するものです。本事業は、環境省の「地域脱炭素移行・再エネ推進交付金」を活用した佐賀県の補助事業であり、県から交付を受けた特定非営利活動法人 … | already |
| kochi-bess-2026 | https://www.pref.kochi.lg.jp/doc/2024011100113/<br>【募集開始のお知らせ】高知県太陽光発電設備等導入推進事業費補助金（令和８年度実施分：事業者用）  ｜ 高知県 | 「５キロワット以上の発電容量を持つ太陽光発電設備」及び「蓄電池設備」を備えるシステムを導入してください。 【対象】補助施設を所有又は管理している法人格をもつ事業者／県内に本社又は主たる事業所を有する法人／県税の滞納がないこと 【要件】再エネ発電設備との併設が条件 公開日2026年… | 対象となる事業は、耐震基準を満たす県内の事業所に自立運転機能を持つ太陽光発電設備及び蓄電池設備を導入する事業とします。「５キロワット以上の発電容量を持つ太陽光発電設備」及び「蓄電池設備」を備えるシステムを導入してください。補助事業により導入する太陽光発電設備により発電された電力は… | already |
| ehime-bess-2026 | https://www.pref.ehime.jp/page/144869.html<br>令和8年度愛媛県サイクル拠点施設再エネ設備等導入支援補助金の公募について - 愛媛県庁公式ホームページ（環境・ゼロカーボ | (2)蓄電池設備　※(2)のみでの設置は対象外 【対象】県内の補助対象エリア内※1のサイクル拠点施設※2に自家消費型太陽光発電設備及び蓄電池を導入する民間事業者。※1 県内市町のうち、八幡浜市、大洲市、伊予市、四国中央市、西予市、東温市、上島町、久万高原町、内子町、伊方町、愛南町… | 県は、2050年のゼロカーボン社会の実現に向けて、県内のサイクル拠点施設における脱炭素化を推進するため、同施設に太陽光発電設備及び蓄電池を導入する民間事業者に対し、その導入に要する経費について、予算の範囲内で補助金を交付します。補助対象事業は「サイクル拠点施設の脱炭素化に資する次… | already |
| tokushima-bess-2026 | https://www.pref.tokushima.lg.jp/ippannokata/kurashi/shizen/7312332/<br>令和8年度徳島県地域脱炭素移行・再エネ推進事業補助金（事業者向け太陽光発電設備・蓄電池補助事業）の募集について｜徳島県ホ | 太陽光発電設備と蓄電池をあわせて導入、または太陽光発電設備のみを導入する事業が対象です（蓄電池のみの導入は不可） 【対象】県内に事業所（事務所、工場、店舗等）を有する中小企業者等（中小企業基本法第2条第1項に規定する中小企業者、中小企業団体、社会福祉法人、医療法人、学校法人、一般… | 徳島県では、2050年カーボンニュートラルの実現及び2030年温室効果ガス排出削減目標の達成のため、中小企業者等を対象に、県内の事業所に「太陽光発電設備」や「蓄電池」を新たに導入する費用の補助制度を開始します。太陽光発電設備と蓄電池をあわせて導入、または太陽光発電設備のみを導入す… | already |
| yamaguchi-bess-2026 | https://www.pref.yamaguchi.lg.jp/soshiki/38/352398.html<br>山口県中小企業者等向け省・創・蓄エネ設備設置補助金（1次募集・受付終了） - 山口県ホームページ | (2) 蓄電池 [上限61kWh]　単価(円/kWh)の1/3　※【山口県産省・創・蓄エネ関連設備】+1.2万円/kWh(定額) 【対象】以下のいずれかに該当する者。(1) 県内に事業所を有する中小企業者等 (2) オンサイトPPAにより(1)に設備提供するPPA事業者 (3) … | 県では、県内産業の振興とエネルギーの地産地消を通じた地域脱炭素社会の実現を図ることを目的に、中小企業者等が省・創・蓄エネ設備を導入するために必要な経費の一部を補助します。蓄電池[上限61kWh]は区分1「屋根置きなど自家消費型太陽光発電」の補助対象設備で、区分1は「(1)太陽光発… | already |
| okayama-city-bess-2026 | https://www.city.okayama.jp/ondankataisaku/0000042083.html<br>令和8年度 岡山市事業所用スマートエネルギー導入促進補助事業 ｜ 岡山市 | 対象機器　太陽光発電設備、ガスコージェネレーションシステム、LED照明器具、高効率空調機器、太陽熱利用システム、蓄電池、エネルギー管理システム、温室効果ガス排出量見える化システム、ZEB 【対象】市内の事務所、営業所、商店、工場、集合住宅等にスマートエネルギー化に資する機器を導入… | 岡山市では、脱炭素社会の実現に向け、事業所においてエネルギーを創って、ためて、賢く使うことによるエネルギー利用の最適化・効率化を推進するため、市内の事務所、営業所、商店、工場、集合住宅等にスマートエネルギー化に資する機器を導入する法人又は個人事業者に対し、経費の一部を助成します。… | already |
| tottori-city-bess-2026 | https://www.city.tottori.lg.jp/page/30970.html<br>【受付終了】令和8年度鳥取市再エネ・省エネ設備導入補助金 - 鳥取市公式ウェブサイト（企業立地・支援課） | 蓄電池は再生可能エネルギーにより発生する余剰電力を蓄え、全量自家消費するものに限る 【対象】中小企業等経営強化法第2条第1項に該当する中小企業者（株式会社、有限会社、合名会社、合同会社、企業組合、個人事業主等）のうち、日本標準産業分類(中分類)による農業、林業、漁業及び水産養殖業… | 燃料費や電気代高騰の影響を受けている市内中小企業者による再生可能エネルギー発電による自家消費や省エネ設備への更新によるエネルギーコストやCo2排出量の削減を行う取組を支援します。補助対象設備のうち「蓄電池は再生可能エネルギーにより発生する余剰電力を蓄え、全量自家消費するものに限る… | already |
| tottori-bess-2026 | https://www.pref.tottori.lg.jp/320404.htm<br>鳥取県企業の省エネ・再エネ推進事業補助金/とりネット/鳥取県公式サイト | Q7）太陽光発電設備について、蓄電池は対象になりますか？　蓄電池は補助対象になります。 【対象】県内に事業所がある法人又は個人事業主であって、鳥取県地球温暖化対策条例第９条第１項に基づき、取組計画を提出した者（※独立行政法人、地方独立行政法人、国立大学法人及び鳥取県が資本金又は基… | 県内企業の省エネ、再エネ設備及び電気自動車等の商用車・充電設備の導入経費を支援することにより、本県が定める2030年の温室効果ガス削減目標の達成及び2050年のゼロカーボン社会実現に向けた取組の推進を図ることを目的としています。「太陽光発電設備導入支援事業」の【補助要件】は「完全… | already |
| wakayama-bess-2026 | https://www.pref.wakayama.lg.jp/prefg/032000/taiyoukouhojyo_jigyousya.html<br>【令和8年度】和歌山県事業者向け太陽光発電設備・蓄電池等導入支援事業補助金 ｜ 和歌山県 | 事業者向け蓄電池　蓄電池の価格（円/kWh）（※）×1／3（上限320万円） 【対象】自ら事業を行う県内の事業所に補助対象設備を設置する者 【要件】再エネ発電設備との併設が条件 蓄電池は受付中。予算残額表（令和8年8月5日時点）に「太陽光発電設備・蓄電池：予算額1,710万円／補… | 再生可能エネルギーの導入、省エネルギー化の促進により本県における脱炭素化を図ることを目的として、太陽光発電設備等を設置する者に対し、必要な経費の一部を補助します。蓄電池の要件は「本事業で導入される太陽光発電設備の付帯設備であること。※蓄電池のみの申請はできません。」「本県の区域内… | already |
| nara-bess-2026 | https://www.pref.nara.lg.jp/n092/33062.html<br>事業所エネルギー効率的利用推進事業補助金 / 奈良県 | 4.定置用蓄電池導入事業　(1)据置型（定置型）であること。(2)太陽光発電設備によって発電した電気を優先的に蓄電するものであること。(3)家庭用蓄電池の場合、一般社団法人 環境共創イニシアチブ（SII）により登録されている製品であること。／補助対象経費の2/3（上限額160万円… | 県内のエネルギー効率的利用の推進、及び緊急時のエネルギー対策を支援するため、県内事業者等に対し、効果的な省エネルギー・蓄エネルギー設備の導入に要する経費に必要な費用を補助します。補助対象事業「4.定置用蓄電池導入事業」の補助要件は「(1)据置型（定置型）であること。(2)太陽光発… | already |
| mie-bess-2026 | https://www.pref.mie.lg.jp/TOPICS/m0012300381.htm<br>三重県｜令和８年度三重県太陽光発電設備等設置費（事業者向け）補助金の募集を再開します | （２）蓄電池　蓄電池の価格（工事費込み・税抜き）の３分の１の額（容量上限２００kWh） 【対象】県内の自らが事業を営む建物を有する事務所又は事業所の屋根等に太陽光発電設備等を設置する事業者（発電した電力量の50パーセント以上を当該事務所又は事業所において自ら消費すること、FIT／… | 脱炭素社会の実現に向け、自家消費型太陽光発電設備の導入促進を図るため、事業者が太陽光発電設備及び蓄電池（以下「太陽光発電設備等」という。）を導入するために必要な経費の一部を補助する事業を募集します。補助対象及び補助金の額は「（１）太陽光発電設備 １kW当たり上限５万円（容量上限２… | already |
| okazaki-bess-2026 | https://www.city.okazaki.lg.jp/1100/1108/1156/p043395.html<br>地球温暖化対策設備設置費を補助します｜岡崎市公式ホームページ | （9）事業用定置用リチウムイオン蓄電システム（重点対策加速化事業活用型）…事業用太陽光発電設備（重点対策加速化事業活用型）の付帯設備であり同時に設置すること 【対象】個人（自ら居住し所有する市内の戸建住宅に設置する者）＋事業者（市内に主たる事務所又は事業所等を有している事業者で対… | この補助金は、地球温暖化対策設備を設置し、使用又は所有する者に対して、その経費の一部を補助することにより、再生可能エネルギーの普及拡大、省エネルギー化の推進及び災害時に活用可能な自立・分散型エネルギーの導入促進を図り、岡崎産再エネ電気の活用をはじめとした、エネルギーの地産地消及び… | already |
| aichi-bess-2026 | https://www.pref.aichi.jp/soshiki/ondanka/saiene-shoene-hojokin2026.html<br>再生可能エネルギー設備導入支援事業費補助金・省エネルギー設備等導入支援事業費補助金事業について(受付終了しました。) - | 補助対象設備　ア　再生可能エネルギー発電等設備【受付終了】　太陽光発電設備、蓄電池、風力発電設備 【対象】県内で事業を営む法人及び個人事業主（大企業は低炭素水素サプライチェーン構築の一環として低炭素水素製造の関連設備として設置する場合に限る） 受付終了。「交付申請総額が予算枠に達… | 愛知県では、「あいち地球温暖化防止戦略2030（改定版）」に掲げた2030年度の温室効果ガス削減目標（2013年度比で46％削減）の達成に向け、自家消費型の再生可能エネルギー設備や、省エネルギー設備等の導入を行う県内事業者を支援する2種類の補助金を交付します。うち再生可能エネルギ… | already |
| gifu-bess-2026 | https://www.pref.gifu.lg.jp/page/287442.html<br>岐阜県中小企業等脱炭素化促進事業費補助金（太陽光発電設備等導入事業） - 岐阜県公式ホームページ（省エネ・再エネ社会推進 | 産業用蓄電池（蓄電容量20kWh超）補助単価 6万3千円/kWh 上限20kWh【126万円】 【対象】県内の自らが事業を営む建物を有する事務所又は事業所に補助対象設備を設置する中小企業等（個人事業主を含む。リース・PPAの場合はリース・PPA事業者が申請者、需要家が共同申請者）… | 中小企業等が自家消費を目的として太陽光発電設備・蓄電池を導入する際に補助金を交付する事業です。蓄電池の設置は必須とせず、太陽光発電設備（太陽光パネル、パワーコンディショナー）のみの設置も可です。なお、蓄電池単体の補助は実施していません。蓄電池は太陽光発電設備と同時設置する場合に限… | already |
| fukui-bess-2026 | https://www.pref.fukui.lg.jp/doc/dengen/shin-energy/fukui-taiyokou.html<br>令和８年度企業の太陽光・蓄電池設備導入促進事業補助金について  ｜ 福井県ホームページ | 太陽光発電設備および蓄電池設備をセットで導入または太陽光発電設備を単独で導入すること 【対象】（１）県内に引き続いて１年以上事業所を有する民間事業者　（２）リースモデルにより（１）に提供するリース業者 【要件】再エネ発電設備との併設が条件 対象は民間事業者・リース業者で家庭用のみ… | 県内企業を対象に、太陽光発電および蓄電池設備の導入に係る経費を支援することにより、県内再エネの地産地消の取組みを加速化し、県内全域に再エネの普及を図ります。補助要件は「太陽光発電設備および蓄電池設備をセットで導入または太陽光発電設備を単独で導入すること」「FITまたはFIP制度の… | already |
| kanazawa-bess-2026 | https://www4.city.kanazawa.lg.jp/soshikikarasagasu/zeroc/ondankataisaku/jigyousyamukehojokin/28559.html<br>金沢市事業者用太陽光発電設備等重点対策加速化事業補助金／金沢市公式ホームページ いいね金沢 | 太陽光発電設備及び蓄電池を設置する者に補助金を交付します 【対象】「金沢市災害時防災活動協力協定」の締結又は「かなざわ災害時等協力事業所登録制度」に登録されている者／金沢エコ推進事業者ネットワークに入会し、その活動及び脱炭素経営塾に参加する者（事業者向け補助金） 【要件】再エネ発… | 金沢市が提案した事業計画「石川中央都市圏における「脱炭素推進×レジリエンス強化」のまちづくり」が環境省の「令和6年度地域脱炭素移行・再エネ推進交付金（重点対策加速化事業）」に採択されました。この交付金を活用し、事業者のエネルギー自給率及び使用効率の向上を図り、もって地球温暖化を防… | already |
| toyama-city-bess-2026 | https://www.city.toyama.lg.jp/kurashi/gomi/1010252/1013030.html<br>富山市太陽光発電設備及び蓄電池導入促進補助金について｜富山市公式ウェブサイト | 住宅・事業所に太陽光発電設備や蓄電池を設置する市民・事業者等を対象に、設備の設置に要した費用の一部を補助します。 【対象】住宅・事業所に太陽光発電設備や蓄電池を設置する市民・事業者等（(1)住宅向け（市民） (2)事業所向け（中小企業者等）の2区分） 【要件】再エネ発電設備との併… | 再生可能エネルギーの導入拡大と地産地消を推進するとともに、停電時における地域の防災機能の強化を図るため、住宅・事業所に太陽光発電設備や蓄電池を設置する市民・事業者等を対象に、設備の設置に要した費用の一部を補助します。事業所向け（中小企業者等）は「事業者は、太陽光発電設備のみの設置… | already |
| kanagawa-bess-2026 | https://www.pref.kanagawa.jp/docs/ap4/images/jikashouhi.html<br>令和8年度神奈川県自家消費型再生可能エネルギー導入費補助金 - 神奈川県ホームページ | 自家消費型再生可能エネルギー発電設備と併せて導入する場合、補助金額は、蓄電容量に1kWh当たり5万円を乗じた額です。（ただし、補助対象経費と500万円のいずれか低い方を上限とします。） 【対象】法人又は青色申告を行っている個人事業者。リース、PPAモデル等で実施する場合、補助金の… | 自家消費を目的とした再生可能エネルギー発電設備や当該設備と併せて導入する蓄電システムの導入に係る経費の一部を補助します。補助対象となる自家消費型再生可能エネルギー発電設備と併せて蓄電システムを設置する事業とします。蓄電システムだけの設置では、補助対象となりません。 | already |
| niigata-bess-2026 | https://www.pref.niigata.lg.jp/sec/sogyosuishin/1356915935143.html<br>【令和８年度の募集は終了しました】新潟県再生可能エネルギー設備導入促進事業補助金 - 新潟県ホームページ | 上記⑴～⑷の対象設備及び太陽光発電設備の新設（増設）に併せて導入する蓄電池 【対象】新潟県内に事業所を置く法人、団体（国、地方公共団体を除く。）、個人事業者又は県内に事業所を置く法人を構成員とする企業体 【要件】再エネ発電設備との併設が条件 ページタイトルが「【令和８年度の募集は… | 再生可能エネルギー設備の導入を促進し、地球温暖化の防止と県内産業の振興を図るため、自家消費を目的とした再生可能エネルギー発電設備・熱利用設備、蓄電池設備等を導入する事業者を補助する。対象設備の「(5)　上記(1)～(4)の対象設備および太陽光発電設備と併せて導入する蓄電池」の要件… | already |
| niigata-city-bess-2026 | https://www.city.niigata.lg.jp/kurashi/kankyo/datutanso/shien/zigyouyouhozyo.html<br>事業者用太陽光発電・蓄電池設備導入補助金　新潟市 | 蓄電池設備／補助対象経費×3分の1以内（上限：16万円×kWh×3分の1） 【対象】市内に本店、支店、営業所その他を有する中小企業、社会福祉法人、医療法人、私立学校法人、一般（公益）社団法人、一般（公益）財団法人、NPO法人など。令和9年3月1日（月曜）までに実績報告書を提出でき… | エネルギー価格高騰の影響緩和及び脱炭素経営の推進のため、市内中小企業者に対し太陽光発電設備等の導入費用の一部を補助します。対象設備は「太陽光発電設備（自家消費型）」と「蓄電池設備」で、蓄電池の要件は「kWhは初期実効容量とすること」「リチウムイオン蓄電池で、太陽光発電設備と接続さ… | already |
| yamanashi-bess-2026 | https://yamanashi-energy7.com/company/<br>中小企業者等分｜山梨県省エネ・再エネ設備導入補助金（第7次）特設サイト | 【再エネ設備】太陽光発電設備、蓄電池、太陽熱利用設備 【対象】山梨県内に事業所を有する中小企業者であって、県内で実質的に1年以上事業を行っていることなどの要件を全て満たす者 ページ上に「受付を終了しました」等の明示バナーはないが、受付期間が延長後の令和8年7月31日（金）までで検… | 本事業では、原油価格等の高騰に対応した賃上げに取り組む事業者のエネルギーコスト削減に資する取り組みを推進し、中長期的な経営体質の強化と持続的な賃上げを図ることを目的として、事業者が実施する省エネルギー設備、再生可能エネルギー設備の導入に要する経費の一部を補助します。補助対象設備は… | already |
| tochigi-bess-2026 | https://www.pref.tochigi.lg.jp/d02/kouhou/jikasyouhitaiyoukou_zigyousya.html<br>栃木県／事業者用太陽光発電設備等導入支援事業 | (2)対象設備　太陽光発電設備、蓄電池／※1 申請が可能な導入パターンは、次のとおり。太陽光発電設備（単独）〇、蓄電池（単独）×、太陽光発電設備+蓄電池〇 【対象】県内に事業所を有する中小企業者、中小企業団体、医療法人、社会福祉法人、学校法人、青色申告を行っている個人事業主等 【… | 県内の温室効果ガスの削減を図るため、県内に事業所を有する中小企業者等の自家消費型太陽光発電設備等の導入を支援します。対象設備は太陽光発電設備、蓄電池で、申請が可能な導入パターンは、太陽光発電設備（単独）〇、蓄電池（単独）×、太陽光発電設備+蓄電池〇。蓄電池の主な要件に「太陽光発電… | already |
| yamagata-bess-2026 | https://www.pref.yamagata.jp/050016/kurashi/kankyo/energy/saiseikanou/saiseikanou_hojo_h31.html<br>【エネルギー政策推進課】やまがた未来くるエネルギー補助金（山形県再生可能エネルギー等設備導入促進事業） ｜ 山形県 | 蓄電池設備（非FIT型 80件・卒FIT型 50件）／7万円/kWh又は3分の1いずれか低い額（40万円） 【対象】家庭・事業所（蓄電池設備【非FIT型】【卒FIT型】ともに「設置対象」欄は「住宅／事業所」） 【要件】再エネ発電設備との併設が条件 設置対象欄に「事業所」が明記され… | 家庭・事業所における再生可能エネルギー等設備の導入を促進し、温室効果ガス排出量の削減を図るため、再生可能エネルギー等設備の導入に対し、その経費の一部を補助します。蓄電池設備【非FIT型】は設備要件が「10kW未満の太陽光発電設備を新規同時導入すること」「国内メーカー（国外メーカー… | already |
| akita-bess-2026 | https://www.pref.akita.lg.jp/pages/archive/93708<br>再エネ導入促進事業補助金（物価高騰対策臨時交付金）について ｜ 美の国あきたネット | 設置する蓄電設備の容量（kWh）に10万円を乗じて算出した金額と補助対象経費の総額を比較していずれか低い金額 【対象】明示的な「補助対象者」欄の記載なし。冒頭に「県内企業のエネルギーコストの削減及び脱炭素による競争力強化を図るため」とあり、事業者向け（詳細は交付要領および事務処理… | 県内企業のエネルギーコストの削減及び脱炭素による競争力強化を図るため、再エネ設備、蓄電池、熱供給設備の整備等について補助を実施します。補助対象設備は（1）再生可能エネルギー発電設備・（2）蓄電設備・（3）再生可能エネルギー熱供給設備で、（2）蓄電設備の補助額は「設置する蓄電設備の… | already |
| miyagi-self-consumption-2026 | https://www.pref.miyagi.jp/soshiki/shinsan/r7zikasyouhigata.html<br>令和7年度宮城県ものづくり中小企業自家消費型発電設備導入支援事業費補助金の募集について - 宮城県公式ウェブサイト | なお、蓄電池の導入は、前述の発電設備と併せて導入する場合のみ補助対象とする。 【対象】（1）自己所有型：県内に生産施設を有する製造業者（中小企業者又は小規模企業者のうち「製造業」（「食料品製造業」「飲料・たばこ・飼料製造業」を除く）事業者）／（2）第三者所有型：オンサイトPPAモ… | 宮城県では、ものづくり中小企業がエネルギー価格の高止まりに対応するため、国の「物価高騰対応重点支援地方創生臨時交付金」を活用し、自らグリーン電力を作り出せる体制の整備として、太陽光発電設備等の導入に要する経費の一部を補助します。対象事業は「県内において新たに導入される、自家消費に… | already |

### B: 内部スタンプの除去 7 件

| id | 所在 | 前 | 後 | 結果 |
|---|---|---|---|---|
| ck1b-2b-occto-ltdc-2026 | occto-ltdc-2026.subsidyRate | 【2026-09-08 是正】【2026-09-08 是正2】 | （削除） | ? |
| ck1b-2b-sii-syoukibo | sii-syoukibo-gyousan-ess-07r.scheme | 【2026-08-03 ユウ週次巡回・SII公募情報＋概要資料PDFで一次確認】 | （削除） | ? |
| ck1b-2b-sii-daikibo-1 | sii-daikibo-gyousan-ess-07r.scheme | 【2026-08-03 ユウ週次巡回・SII公募情報＋概要パンフレットPDFで一次確認】 | （削除） | ? |
| ck1b-2b-sii-daikibo-2 | sii-daikibo-gyousan-ess-07r.scheme | （2026年7月30日公表・PDF一次確認） | （2026年7月30日公表） | ? |
| ck1b-2b-sii-saiene-1 | sii-saiene-heisetsu-ess-07r.scheme | 【2026-08-03 ユウ週次巡回・SII公募情報＋概要パンフレットPDFで一次確認】 | （削除） | ? |
| ck1b-2b-sii-saiene-2 | sii-saiene-heisetsu-ess-07r.scheme | （2026年7月30日公表・PDF一次確認） | （2026年7月30日公表） | ? |
| ck1b-2b-sii-chikudenchi07r | sii-chikudenchi07r.scheme | 【2026-09-07 更新】9月4日公募開始を公募要領PDF（R7r_kess_kouboyouryou.pdf）で一次確認し、補助率・上限・期限・対象者を充填。 | 【2026-09-07 更新】9月4日公募開始（公募要領 R7r_kess_kouboyouryou.pdf）。 | ? |

走査の再実行（PATCH 後・microCMS 全 85 件 GET）: **内部メモの残存 0 件**。残る「【】」は設備名・補助率・【非FIT型】【卒FIT型】・日付の更新ラベルなど正規表記のみ。

### #110 監査（precompute 再生成の前後）

| slug | applicable_prefs 前→後 | 一致 | applicable_entities 前→後 | 一致 |
|---|---|---|---|---|
| aichi-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| akita-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['corporate'] | ✗ |
| dbj-environmental-finance | 0→0 | ✓ | ['corporate']→['corporate'] | ✓ |
| ehime-bess-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |
| fukui-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['corporate'] | ✗ |
| gifu-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| kanagawa-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| kanazawa-bess-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |
| kochi-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['corporate'] | ✗ |
| mie-bess-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |
| miyagi-self-consumption-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |
| miyazaki-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate', 'municipal'] | ✓ |
| nagasaki-bess-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |
| nagasaki-city-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| nara-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| niigata-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate', 'municipal'] | ✓ |
| niigata-city-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['corporate'] | ✗ |
| okayama-city-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| okazaki-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| saga-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| tochigi-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| tokushima-bess-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |
| tottori-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate', 'municipal'] | ✓ |
| tottori-city-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| toyama-city-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| wakayama-bess-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |
| yamagata-bess-2026 | 1→1 | ✓ | ['individual', 'corporate', 'municipal']→['individual', 'corporate'] | ✗ |
| yamaguchi-bess-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |
| yamanashi-bess-2026 | 1→1 | ✓ | ['corporate', 'municipal']→['corporate'] | ✗ |

- **applicable_prefs は全件不変（✓）**。precompute は name・organization からのみ県名を導出する（#110 の是正どおり）ため、scheme を書き直しても地域は動かない。全国補助金の 47 県マッチも不変。
- **applicable_entities は 25 件で変化**した。内部メモに含まれていた「都道府県」「市町村」「個人事業主」等の語が消えたためで、いずれも一次に照らすと是正方向:
  - `municipal` が落ちた 21 件 … 事業者向け／県民向けの制度で自治体は対象外。メモの「S3都道府県拡張」「県内市町村の住民基本台帳」等が誤ヒットしていた。
  - `individual` も落ちた 4 件（akita・kochi・fukui・niigata-city） … 一次と targetEntity はいずれも事業者限定（「県内企業」「法人格をもつ事業者」「民間事業者」「市内中小企業者」）。
  - `applicable_use_cases` も 3 件で変化（akita は空に）。用途語（事業所・工場等）がメモ側にしか無かったため。**キーワード導出の弱さ**であり、Ck-2 で「entities・use_cases も name/organization/targetEntity から導出する」を検討候補として挙げる。

## (3) DBJ・FAQ・A11 同型の前後（一次の逐語つき）

### DBJ 環境格付融資（3 件）

| id | 所在 | 前 | 後 | 一次 | 結果 |
|---|---|---|---|---|---|
| ck1b-3-dbj-deadline | subsidies/dbj-environmental-finance.deadline | 随時 | 商品見直しに伴い、環境格付は新規申込受付を終了 | https://www.dbj.jp/service/sustainability_rating/enviro/ | already |
| ck1b-3-dbj-scheme | subsidies/dbj-environmental-finance.scheme | 政投銀の環境格付融資。蓄電所大型案件・PF組成の主要レンダー。 | ※商品見直しに伴い、環境格付は新規申込受付を終了しています（出典: 株式会社日本政策投資銀行（DBJ）公式サイト・2026-09-23 確認）。政投銀の環境格付融資。蓄電所大型案件・PF組成の主要レンダー。 | https://www.dbj.jp/service/sustainability_rating/enviro/ | already |
| ck1b-3-dbj-applicationStart | subsidies/dbj-environmental-finance.applicationStart | 随時 | 随時（新規申込受付を終了） | https://www.dbj.jp/service/sustainability_rating/enviro/ | already |

### FAQ の事実誤り（4 件）

| id | 所在 | 前 | 後 | 一次 | 結果 |
|---|---|---|---|---|---|
| Ck1b-4-1 | faq/faq-hojokin-08.answer | 蓄電池供給確保計画は、経済安全保障推進法に基づき METI が認定する国家プロジェクトで、国産蓄電池の量産体制構築を支援する制度。第1回認定（2024年9月）で GS ユアサ等4社が認定され、補助金総額は数百億円規模。G… | 蓄電池供給確保計画は、経済安全保障推進法に基づく制度です。経済産業省は「蓄電池の安定供給確保を図ろうとする者は、その実施しようとする蓄電池等の安定供給確保のための取組に関する計画（供給確保計画）を作成し、経済産業大臣に提出して、その認定を受けることができた場合、支援を受けることが可能です」と説明しています。認定は回を分… | https://www.meti.go.jp/policy/economy/economic_security/battery/index.html | already |
| Ck1b-4-2 | faq/faq-jigyou-01.answer | (2) METI 特定卸供給事業者登録（蓄電所所有なら必須） | (2) 必要な届出の確認（自らが維持し、及び運用する蓄電用の電気工作物を用いて小売電気事業等の用に供するための電気を放電する事業で、経済産業省令で定める要件（小売電気事業等の用に供する電力の合計が1万kW超 等）に該当する場合は「発電事業」の届出を事業実施前に。発電事業者以外の他の者から1MWを超えて電気を集約して供給… | https://www.enecho.meti.go.jp/category/electricity_and_gas/electricity_measures/004/ | already |
| Ck1b-4-4 | faq/faq-seido-09.answer | 特定卸供給事業者とは、2022年の電気事業法改正で新設された区分で、需給調整・取引等を主目的とする事業者を指します。METI（経済産業省）への登録が必要で、要件は事業計画書提出と一定の財務基盤等。登録後は系統用蓄電池の自… | 特定卸供給事業者は、電気事業法に位置づけられたアグリゲーターの区分です。資源エネルギー庁の事業者説明会資料は「改正電気事業法においてアグリゲーターを特定卸供給事業者として新たに位置付けることとした」とし、制度を新設した改正法は「強靱かつ持続可能な電気供給体制の確立を図るための電気事業法等の一部を改正する法律」（令和二年… | https://www.enecho.meti.go.jp/category/electricity_and_gas/electricity_measures/009/009.html | already |
| ck1b-4-5-faq-sonota-06 | faq/faq-sonota-06.answer | (7) 蓄電池供給確保認定企業：GS ユアサ等4社、国産化推進の中核 | (7) 蓄電池供給確保計画の認定企業：経済産業省が「認定供給確保計画」を公表（初回は令和5年4月28日の8件）、国産化推進の中核 | https://www.meti.go.jp/policy/economy/economic_security/battery/index.html | #106 ✓ |

### A11 の同型（6 件）

| id | 所在 | 前 | 後 | 一次 | 結果 |
|---|---|---|---|---|---|
| a11b-01 | glossary/organization-for-cross-regional-coordination-of-transmission-operators.detail | （4）需給調整市場の運営、 | （4）需給調整市場の制度検討・詳細設計、 | https://www.occto.or.jp/gyomusyokai/no3.html | already |
| a11b-02 | glossary/organization-for-cross-regional-coordination-of-transmission-operators.detail | 容量市場・需給調整市場・長期脱炭素電源オークションの運用高度化 | 容量市場・長期脱炭素電源オークションの運用高度化、需給調整市場の制度検討・詳細設計 | https://www.occto.or.jp/gyomusyokai/no3.html | already |
| a11b-03 | glossary/organization-for-cross-regional-coordination-of-transmission-operators.shortDef | 広域系統運用と各種市場（容量・需給調整）を運営する認可法人。 | 広域系統運用と容量市場の運営を担い、需給調整市場は制度検討・詳細設計を行う認可法人。 | https://www.occto.or.jp/gyomusyokai/no3.html | already |
| a11b-04 | operators/occto.body | 需給調整市場の運営、系統運用の広域連系、 | 需給調整市場の制度検討・詳細設計、系統運用の広域連系、 | https://www.occto.or.jp/gyomusyokai/no3.html | already |
| a11b-05 | explainer/tertiary-reserve-1-detail.body | OCCTOが公表する月次・四半期取引動向レポートで、各エリアの価格推移・約定容量を継続的にモニタリングできます。 | 需給調整市場の取引データは、市場を運営する一般社団法人 電力需給調整力取引所（EPRX）が「取引実績」および年度ごとの「取引実績の取りまとめ結果」として公表しており、市場動向を継続的にモニタリングできます。 | https://www.eprx.or.jp/information/summary.php | already |
| a11b-06 | news/news-2026-occto-deep-rewrite-2026-05.body | <h3 id="hb8ead859ae">容量市場・需給調整市場の運用</h3> | <h3 id="hb8ead859ae">容量市場の運営と需給調整市場の制度検討・詳細設計</h3> | https://www.occto.or.jp/gyomusyokai/no3.html | #122 正規化（内容は反映済み） |

補足:
- **DBJ**: 一次の逐語は「※商品見直しに伴い、環境格付は新規申込受付を終了しています」（https://www.dbj.jp/service/sustainability_rating/enviro/ ・title「DBJ環境格付融資｜DBJサステナブルソリューション」）。終了日は 3 ページとも記載が無いので日付は書いていない。applicationStart は反証役の指摘（表示が「applicationStart 〜 deadline」の範囲で、deadline だけ直すと左辺が随時受付を主張する）を受けて追加し、先例 env-decarbonization-leading-region に倣った。
- **subsidy-match**: `src/lib/subsidy-matcher.ts` に「受付終了は候補にしない」を追加。判定は表示側と同じ `deriveSubsidyStatus`（#121: 同じ意味の値を二箇所で算出しない）。2026-09-23 時点で 15 件が候補外（tottori-city・mie・aichi・yamanashi・niigata・miyagi-self-consumption・dbj-environmental-finance・meti-cev-r6h・tokyo-ev-promotion・tokyo-dannetsu-solar・tokyo-home-battery-r7・env-preceding-region-6・env-decarbonization-leading-region・sii-dr-r6h・sii-saiene06r）。
- **faq-hojokin-08**: 一次 https://www.meti.go.jp/policy/economy/economic_security/battery/index.html（title「蓄電池 （METI/経済産業省）」）の「４．認定供給確保計画」表を機械パース＝45 行。認定日別は 令和5年4月28日 8／令和5年6月16日 7／令和6年9月6日 12／令和6年12月20日 5／令和7年6月13日 5／令和8年2月17日 8。**旧本文の「第1回認定（2024年9月）で GS ユアサ等4社」は回次・日付・社名のいずれも一致しない**（令和6年9月6日の 12 件に GS ユアサは不在）。703億円・248億円・2GWh・2028年10月は No.38「２０２５蓄電池第６号－１ 株式会社ＧＳユアサ」（令和8年2月17日認定）の値で、認定回だけが誤っていた。
- **同じ誤りの波及を全文走査した**（faq・glossary・explainer・news・policy-events を全件 GET）。追加で 2 箇所見つかり、表示中の `faq/faq-sonota-06.answer`「(7) 蓄電池供給確保認定企業：GS ユアサ等4社、国産化推進の中核」を一次で確認できる内容（「経済産業省が「認定供給確保計画」を公表（初回は令和5年4月28日の8件）」）へ是正した（#106 ✓）。もう 1 件 `policy-events/battery-supply-plan-approved-2024-09.title`「第1回認定（GSユアサ等4社）」は Ck-1a で**非表示済みのレコード**なので触っていない（Ck-2）。
- **subsidy-match の Top10 の前後**（実データで再現。before は閉じた 15 件の status を公募中に差し替えた版）:

```
受付終了と判定（2026-09-23 時点）: 15 件 → tottori-city-bess-2026, mie-bess-2026, aichi-bess-2026, yamanashi-bess-2026, niigata-bess-2026, miyagi-self-consumption-2026, dbj-environmental-finance, meti-cev-r6h, tokyo-ev-promotion, tokyo-dannetsu-solar, tokyo-home-battery-r7, env-preceding-region-6, env-decarbonization-leading-region, sii-dr-r6h, sii-saiene06r

■ 東京都・系統用・法人
  前 Top10: sii-bess-electrolysis-grant-result-r6, tokyo-grid-battery-r8, sii-chikudenchi07r, tokyo-ev-promotion, occto-ltdc-auction-results, meti-battery-supply-plan-certification, sii-chikudenchi07, sii-daikibo-gyousan-ess-07r, sii-saiene-heisetsu-ess-07r, moe-storage-parity-result-r7
  後 Top10: sii-bess-electrolysis-grant-result-r6, tokyo-grid-battery-r8, sii-chikudenchi07r, occto-ltdc-auction-results, meti-battery-supply-plan-certification, sii-chikudenchi07, sii-daikibo-gyousan-ess-07r, sii-saiene-heisetsu-ess-07r, moe-storage-parity-result-r7, meti-charging-infra-r6h
  消えた(受付終了): tokyo-ev-promotion
  繰り上がり: meti-charging-infra-r6h

■ 全国・自家消費・法人
  前 Top10: moe-storage-parity-result-r7, kochi-bess-2026, aichi-bess-2026, tochigi-bess-2026, nara-bess-2026, nagasaki-bess-2026, sendai-self-consumption-2026, tottori-city-bess-2026, tokushima-bess-2026, fukushima-renewable-storage-2026
  後 Top10: moe-storage-parity-result-r7, kochi-bess-2026, tochigi-bess-2026, nara-bess-2026, nagasaki-bess-2026, sendai-self-consumption-2026, tokushima-bess-2026, fukushima-renewable-storage-2026, toyama-city-bess-2026, nagasaki-city-bess-2026
  消えた(受付終了): aichi-bess-2026, tottori-city-bess-2026
  繰り上がり: toyama-city-bess-2026, nagasaki-city-bess-2026

■ 愛知県・産業用・法人
  前 Top10: aichi-bess-2026, meti-charging-infra-r6h, sii-syoukibo-gyousan-ess-07r, sii-chikudenchi07r, okazaki-bess-2026, nev-portal, meti-cev-r6h, meti-cev-r7h, sii-daikibo-gyousan-ess-07r, sii-bess-electrolysis-grant-result-r6
  後 Top10: meti-charging-infra-r6h, sii-syoukibo-gyousan-ess-07r, sii-chikudenchi07r, okazaki-bess-2026, nev-portal, meti-cev-r7h, sii-daikibo-gyousan-ess-07r, sii-bess-electrolysis-grant-result-r6, moe-storage-parity-result-r7, sii-dr-r7h
  消えた(受付終了): aichi-bess-2026, meti-cev-r6h
  繰り上がり: moe-storage-parity-result-r7, sii-dr-r7h
```

- **faq-jigyou-01 の sourceUrl は据え置き（null）**: 反証役が「発電事業の届出ページは手順(2)しか裏付けない。回答全体に一次の権威を付けることになる」として drop。回答本体の全面改稿（Ck-2）まで空のままにした。

## (4) explainer の非表示と 404

`src/lib/explainer-excluded.ts`（新設）。取得の共通関数（getAllExplainer・getExplainerBySlug・getAllExplainerSlugs・getExplainersByTermName）と、独自 fetch の関連マップ生成（scripts/precompute-explainer-related.ts）の両方で外す。

| slug | 理由 | 非表示の確認（built HTML） |
|---|---|---|
| bess-depreciation-tax | Ck-1a の A13 監査で 誤り 3・古い 3・裏付けなし 4。全面改稿まで非表示 | /explainer 一覧 0・トップ新着 0・sitemap 0・関連マップ 0（175 entry 中に key 無し・被参照 0）・/faq 0・/events 0・詳細ページは生成されず 404 |

件数表示も一覧と同じ数に揃えた（263→**262**）: トップ「解説記事 262本」・/faq「解説記事（262本）」・/events「解説記事（市場制度・参入手順 262本）」。

## (5) FIT 表示の対象箇所（前提の訂正つき）

**前提の訂正**: 依頼は「サイトで FIT 価格を出している箇所を洗い、基準日を coverage.last から出しているものに注記」だが、**fit-price-* を表示している箇所は src/ に 0 件**だった（静的 import 0・`getIndicatorsByIdPrefix` 経由 0・`getSeriesMany` 経由 0）。唯一 catalog 全件を読む `/ops/freshness`（noindex・robots Disallow）にだけ現れる。

| file:line | 何を表示しているか | fit-price が到達するか |
|---|---|---|
| src/app/ops/freshness/page.tsx | catalog 688 系列の SLA 違反表・分母 | **する**（本便で「取得停止中」の節を追加） |
| src/lib/generated/glossary-detail-index.json（feed-in-tariff 等 8 slug） | microCMS 原稿の散文（例「住宅用太陽光（10kW未満）で42円/kWh」） | しない（catalog 由来ではない。数値の鮮度は Ck-2） |
| src/lib/edu-links.ts:32 / src/data/landing-page-configs.ts:100 | 教材リンク名・LP 文中の「買取価格」「再エネ賦課金」 | しない |
| src/components/IRRSimulator.tsx:948 / src/app/lv/risks/page.tsx:78 | 「調達価格」＝機器調達・需給調整市場の文脈 | しない |

**「updated_at が 7 日以上前」だけで判定してはいけない**: 2026-09-23 時点でそれに該当するのは 116/688 系列で、うち 111 件（balancing-price 46・edinet 45・capacity 20）は年次・四半期ゆえ古いのが正常。/tools/balancing-revenue・/tools/capacity-market-bid はその値を表示しているため、閾値だけだと誤った「取得停止中」を出す。
そこで `src/lib/eic-date.ts` に「**停止を確認した系列 ID（前方一致）AND 閾値**」を置き（STALLED_SERIES・FEED_STALL_THRESHOLD_DAYS=7）、/ops/freshness に注記の節を追加した。上流が復旧すれば updated_at が新しくなり注記は自動で消える。表示値は変えていない（FIT 価格は年度で決まる値。5 系列中 4 件は FY2026 まで取得済み）。WAF の回避はしていない（取得元は curl に 202・本文 0 バイト＝bot 判定で、ページが死んだ証拠ではない）。

catalog 実測（generated_at 2026-09-22T10:36:22+09:00）: fit-price-* 5 系列は updated_at 2026-09-05、status は 5 件とも `active`（停止を表すフィールドが無い）、observation_cutoff は geothermal のみ 2025-04-01 で他 4 件は 2026-04-01。

## (6) デプロイ後の素URL curl 出力

```
# 取得時刻 2026-09-23 09:59:00 UTC
## §1 /market/jepx（肥大の解消）
$ curl -s https://bess-net.jp/market/jepx  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 2821594 bytes
    「10 系列」: DOM 3 件 / JSON-LD 2 件
    「40 系列」: DOM 0 件 / JSON-LD 0 件
    raw「jepx-spread」: 0 件（HTML 全体）
    「日内スプレッド」: DOM 0 件 / JSON-LD 0 件
## §2 補助金 scheme の内部メモ（PATCH した 28 件から 5 件を抽出）
$ curl -s https://bess-net.jp/subsidies/miyazaki-bess-2026  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 49597 bytes
    「候補JSON」: DOM 0 件 / JSON-LD 0 件
    「一次照合」: DOM 0 件 / JSON-LD 0 件
    「と判定」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/okayama-city-bess-2026  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 50087 bytes
    「候補JSON」: DOM 0 件 / JSON-LD 0 件
    「一次照合」: DOM 0 件 / JSON-LD 0 件
    「と判定」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/toyama-city-bess-2026  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 49114 bytes
    「候補JSON」: DOM 0 件 / JSON-LD 0 件
    「一次照合」: DOM 0 件 / JSON-LD 0 件
    「と判定」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/niigata-city-bess-2026  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 48471 bytes
    「候補JSON」: DOM 0 件 / JSON-LD 0 件
    「一次照合」: DOM 0 件 / JSON-LD 0 件
    「と判定」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/yamagata-bess-2026  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 50069 bytes
    「候補JSON」: DOM 0 件 / JSON-LD 0 件
    「一次照合」: DOM 0 件 / JSON-LD 0 件
    「と判定」: DOM 0 件 / JSON-LD 0 件
## §2b 内部スタンプ（sii・occto-ltdc）
$ curl -s https://bess-net.jp/subsidies/sii-daikibo-gyousan-ess-07r  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 51939 bytes
    「ユウ週次巡回」: DOM 0 件 / JSON-LD 0 件
    「PDF一次確認」: DOM 0 件 / JSON-LD 0 件
    「是正】」: DOM 0 件 / JSON-LD 0 件
    「充填」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/sii-saiene-heisetsu-ess-07r  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 52939 bytes
    「ユウ週次巡回」: DOM 0 件 / JSON-LD 0 件
    「PDF一次確認」: DOM 0 件 / JSON-LD 0 件
    「是正】」: DOM 0 件 / JSON-LD 0 件
    「充填」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/sii-syoukibo-gyousan-ess-07r  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 47692 bytes
    「ユウ週次巡回」: DOM 0 件 / JSON-LD 0 件
    「PDF一次確認」: DOM 0 件 / JSON-LD 0 件
    「是正】」: DOM 0 件 / JSON-LD 0 件
    「充填」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/sii-chikudenchi07r  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 56747 bytes
    「ユウ週次巡回」: DOM 0 件 / JSON-LD 0 件
    「PDF一次確認」: DOM 0 件 / JSON-LD 0 件
    「是正】」: DOM 0 件 / JSON-LD 0 件
    「充填」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/subsidies/occto-ltdc-2026  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 52905 bytes
    「ユウ週次巡回」: DOM 0 件 / JSON-LD 0 件
    「PDF一次確認」: DOM 0 件 / JSON-LD 0 件
    「是正】」: DOM 0 件 / JSON-LD 0 件
    「充填」: DOM 0 件 / JSON-LD 0 件
## §3 DBJ
$ curl -s https://bess-net.jp/subsidies/dbj-environmental-finance  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 44682 bytes
    「随時 〜 随時」: DOM 0 件 / JSON-LD 0 件
    「随時（新規申込受付を終了）」: DOM 1 件 / JSON-LD 0 件
    「商品見直しに伴い、環境格付は新規申込受付を終了しています」: DOM 3 件 / JSON-LD 0 件
    「受付終了」: DOM 5 件 / JSON-LD 0 件
## §4 FAQ
$ curl -s https://bess-net.jp/faq  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 457329 bytes
    「第1回認定（2024年9月）」: DOM 0 件 / JSON-LD 0 件
    「GS ユアサ等4社」: DOM 1 件 / JSON-LD 1 件
    「令和5年4月28日」: DOM 1 件 / JSON-LD 1 件
    「特定卸供給事業者登録」: DOM 0 件 / JSON-LD 0 件
    「届出」: DOM 10 件 / JSON-LD 10 件
## §5 A11 同型
$ curl -s https://bess-net.jp/glossary/organization-for-cross-regional-coordination-of-transmission-operators  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 84053 bytes
    「需給調整市場の運営」: DOM 0 件 / JSON-LD 0 件
    「制度検討・詳細設計」: DOM 6 件 / JSON-LD 3 件
$ curl -s https://bess-net.jp/operators/occto  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 58925 bytes
    「需給調整市場の運営」: DOM 0 件 / JSON-LD 0 件
    「制度検討・詳細設計」: DOM 2 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/news/news-2026-occto-deep-rewrite-2026-05  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 61794 bytes
    「容量市場・需給調整市場の運用」: DOM 0 件 / JSON-LD 0 件
    「容量市場の運営と需給調整市場の制度検討・詳細設計」: DOM 2 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/explainer/tertiary-reserve-1-detail  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 67718 bytes
    「OCCTOが公表する月次・四半期取引動向レポート」: DOM 0 件 / JSON-LD 0 件
    「取引実績の取りまとめ結果」: DOM 1 件 / JSON-LD 0 件
## §6 explainer の非表示
$ curl -s https://bess-net.jp/explainer  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 1139658 bytes
    「bess-depreciation-tax」: DOM 0 件 / JSON-LD 0 件
    「減価償却」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/explainer/bess-depreciation-tax  → HTTP/1.1 404 Not Found | X-Vercel-Cache: MISS | Age: 0 | 19417 bytes
$ curl -s https://bess-net.jp/  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 96090 bytes
    「解説記事 262本」: DOM 1 件 / JSON-LD 0 件
    「bess-depreciation-tax」: DOM 0 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/sitemap.xml  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 2081540 bytes
    「bess-depreciation-tax」: DOM 0 件 / JSON-LD 0 件
## §7 FIT（/ops/freshness は noindex・運用者向け）
$ curl -s https://bess-net.jp/ops/freshness  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 289278 bytes
    「取得停止中の系列」: DOM 1 件 / JSON-LD 0 件
    「取得停止中（2026-09-05 時点）」: DOM 5 件 / JSON-LD 0 件
    「fit-price-」: DOM 5 件 / JSON-LD 0 件
## 参考: 補助金一覧・マッチの件数
$ curl -s https://bess-net.jp/subsidies  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 235527 bytes
    「67」: DOM 2 件 / JSON-LD 0 件
$ curl -s https://bess-net.jp/tools/subsidy-match  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0 | 83160 bytes
    「67 件の補助金」: DOM 1 件 / JSON-LD 0 件
```

### 追加デプロイ後の再確認（8249a52・Vercel success 2026-09-23 10:10:55Z）

上の (6) は commit ae5ae84 のデプロイ直後に取ったもので、`/faq` の「GS ユアサ等4社」が 1 件残っていた。
これは §4 の 3 件とは別のレコード（`faq/faq-sonota-06`）に同じ誤りが波及していたためで、一次を取り直して是正し、
本報告のコミット（8249a52）のビルドで反映された。素URL で再取得した結果:

```
$ curl -s https://bess-net.jp/faq  → HTTP/1.1 200 OK | X-Vercel-Cache: PRERENDER | Age: 0
    「GS ユアサ等4社」: 0 件
    「第1回認定（2024年9月）」: 0 件
    「初回は令和5年4月28日の8件」: 1 件
    「令和5年4月28日」: 2 件
```

## (7) 触らなかったもの（Ck-2 送り）

- **A11 の境界 3 件**（glossary の ffr・fast-frequency-response・adjustment-power-tender）… Ck-1a の反証で「取引規程に主題の語が 0 件」として保留したまま。
- **faq-jigyou-01 の回答本体**（準備期間 2-3 年・系統協議 1-2 年・PF 組成等の定量記述に一次の裏付けが無い）と sourceUrl（今回は空のまま）。
- **faq-hojokin-08 の関連フィールド**（relatedGlossary／relatedExplainer = national-battery-supply-plan）… 同じ誤り（第1回認定 2024年9月・GS ユアサ等4社）が glossary／explainer 側にも残っている可能性。未走査。
- **DBJ の body**（richEditor）… 「DBJ環境格付（A-D ランク）に基づく金利優遇」等が現行商品として書かれたまま。scheme と body が詳細ページで並ぶため、body も併せて改稿が要る。scheme 第2文「蓄電所大型案件・PF組成の主要レンダー。」も一次に裏付けなし。
- **explainer/bess-depreciation-tax の全面改稿**（非表示のまま）と、relatedTerms の「連結納税」「環境関連投資促進税制」（廃止済み制度）。glossary 側に同名項目があるかの監査も未実施。
- **precompute の導出キーワード**（#110 の延長）… applicable_entities・applicable_use_cases は scheme の散文からも導出している。今回 25 件が変化した（是正方向）ことが示すとおり、本文の書き換えで検索タグが動く。name／organization／targetEntity からの導出に寄せる案。
- **subsidy-match の「採択結果公表」14 件**… 申し込めない点は「受付終了」と同じだが、依頼が「受付終了」を指定したため今回は候補に残している。除外するかは裁定待ち。
- **/tools/subsidy-match の「全 67 件中」表記**… 受付終了 15 件を候補から外したので、実際の候補母数は 52 件。表記をどちらに合わせるかは裁定待ち。
- **jepx 派生 30 系列の活用**（Nv1a 予定）… /market/jepx からは外したが、カタログには残っている。
- **/ops/freshness の SLA 表**… fit-price-geothermal は observation_cutoff 2025-04-01 で経過がちょうど 540 日（SLA 540）。判定は `> sla` なので 2026-09-24 から違反表に載る（正しい挙動・抑止しない）。

## (8) 申告

- **削除操作なし**（rm／rmdir／Remove-Item を使っていない）。一時物は scratchpad の `ck1b/` 一式と `ck1b/agents/`（各エージェントの作業ファイル）に残している。`.next/cache/fetch-cache` は削除せず scratchpad へ退避（fetch-cache-ck1b-1〜3）。
- **webhook**: EDAさんに停止していただき、PATCH 47 件はビルドを起こさずに実行した。デプロイはコードの push 1 回だけ。**再開の合図をお願いします**。
- **PATCH の #106 照合で 1 件だけ NG 表示**（a11b-06・news.body）。原因は richEditor が保存時に見出しの id を採番し直すため（#122）で、再 GET して「旧見出し 0・新見出し 1（本文側の別文とあわせて 2 箇所）」を確認済み＝内容は意図どおり反映。二重適用なし。
- **依頼の字義から外れたもの**: (a) §1 の代替案「aggregation!==derived で除く」は採らなかった（/dashboard/market の meti-renewables-share を巻き込むため。`jepx-spot-` への限定で実装）。(b) §7 は「FIT 価格を出している箇所」が 0 件だったため、注記の実装先を /ops/freshness に置き、判定を「確認済み系列 AND 閾値」にした。(c) §2 で sourceUrl が死んでいた記録は 0 件、bot 判定で取得できなかった記録も 0 件（28 件すべて一次 200 で取得）。
- **エージェントの反証で計画を 13 件修正・1 件却下**した（逐語でない引用・情報欠落・帰属の取り違え）。採用した修正内容は各 op の why に残してある。
- **ブラウザは使っていない**（今回の一次取得はすべて curl。METI の蓄電池認定表・エネ庁の届出ページは curl 200 で取得できた）。特定卸供給事業者一覧（aguri-list.html）だけは bot 判定（202・0 バイト）で取得できず、社名は書かずに落とした。

