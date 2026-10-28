/**
 * src/data/site-history.ts — 更新履歴（/milestones）のデータ（サイトの歩み便 第 2 版・2026-10-26）
 *
 * 文案 `更新履歴_文案59項目_R-36反映_2026-10-26_ユウ.md` の表をスクリプトで読み取って作った（題・文・リンクの名前は逐語）。
 * - date は本番に最初に出た日（デプロイ成功・JST）。id は文案の番号（Y-37 別紙の 1〜57 と、足した N1・N2）。
 * - ref は内部用（commit・デプロイの記録）。画面には出さない。
 * - 書き方の約束: 事実だけ・未来の予定は書かない・件数を手で書かない・社内の語と比べる根拠の無い最上級は使わない。
 *   新しいページ・データベース・ツールを公開する便は、ここに 1 件足す（日付は本番に出た日）。検査: scripts/verify-site-history.ts
 */

export type SiteHistoryCategory = 'ページ' | 'ツール' | 'データベース' | 'トラッカー' | 'レポート' | 'その他';
export type SiteHistoryLink = { label: string; url: string };
export type SiteHistoryItem = {
  id: string;
  date: string; // YYYY-MM-DD（JST）
  category: SiteHistoryCategory;
  title: string;
  summary: string;
  links: SiteHistoryLink[];
  ref: string; // 内部用・画面に出さない
};

export const SITE_HISTORY_CATEGORIES: readonly SiteHistoryCategory[] = ['ページ', 'ツール', 'データベース', 'トラッカー', 'レポート', 'その他'];

/** 新しい順（文案の並び） */
export const SITE_HISTORY: readonly SiteHistoryItem[] = [
  {
    id: "N2",
    date: "2026-10-25",
    category: "ページ",
    title: "各ページに公開日と更新日を表示",
    summary: "解説・用語集・補助金・事業者・案件・政策カレンダーの各ページで、公開した日と更新した日を見られるようになりました。訂正のあるページでは、ページ末尾の訂正履歴へすぐ移れます。",
    links: [
      { label: "解説記事", url: "/explainer" },
      { label: "訂正履歴", url: "/corrections" },
    ],
    ref: "5fadc32（デプロイ 2026-10-25 18:23 JST）",
  },
  {
    id: "N1",
    date: "2026-10-20",
    category: "ページ",
    title: "蓄電所を運営している方向けのページを公開",
    summary: "稼働中の蓄電所の売却・譲渡、収益と運用の見直し、2 機目以降の計画などの相談の窓口と、相談の前にそろえるとよい情報をまとめました。ヘッダーの「運営している」から開けます。",
    links: [
      { label: "蓄電所を運営している方へ", url: "/start/operate" },
    ],
    ref: "1c5538f（デプロイ 2026-10-20 09:18 JST）",
  },
  {
    id: "1",
    date: "2026-10-17",
    category: "ページ",
    title: "訂正履歴",
    summary: "事実と異なっていた記述を直したもの、表示を止めた・戻したものを、直す前と後・根拠の資料つきで一覧できるようになりました。該当するページの末尾にも載せています。",
    links: [
      { label: "訂正履歴", url: "/corrections" },
    ],
    ref: "b00ce67（報告 reports/corrections-2026-10-17.md）",
  },
  {
    id: "2",
    date: "2026-10-15",
    category: "ツール",
    title: "蓄電所 残存価値の試算",
    summary: "残りの運転年数・直近の収支・シナリオの前提を入れると、その間のキャッシュフローを割り引いた値の幅を見られるようになりました。鑑定・売買価格の目安ではありません。",
    links: [
      { label: "残存価値の試算", url: "/tools/residual-value" },
    ],
    ref: "ed2c45e（報告 reports/tool-residual-value-2026-10-15.md）",
  },
  {
    id: "3",
    date: "2026-10-14",
    category: "トラッカー",
    title: "需給調整市場 制度変更トラッカー",
    summary: "上限価格・募集量・商品仕様・ガイドライン・蓄電池に関わる要件の改定を、公表日と適用日を分けて追えるようになりました。各改定に一次資料の該当箇所を添えています。",
    links: [
      { label: "需給調整市場 制度変更トラッカー", url: "/tracker/balancing-rules" },
    ],
    ref: "c96d62e（報告 reports/tool-balancing-rules-2026-10-14.md）",
  },
  {
    id: "4",
    date: "2026-10-12",
    category: "ツール",
    title: "騒音・離隔の目安チェッカー",
    summary: "PCS・変圧器などの騒音と距離から敷地境界の合成レベルを概算し、騒音規制法の基準の範囲と並べられるようになりました。設計・測定・自治体確認の代わりになりません。",
    links: [
      { label: "騒音・離隔の目安チェッカー", url: "/tools/noise-check" },
    ],
    ref: "cad7f8c（報告 reports/tool-noise-check-2026-10-12.md）",
  },
  {
    id: "5",
    date: "2026-10-10",
    category: "ツール",
    title: "蓄電所 評価軸セルフチェック",
    summary: "買い手・貸し手・保険者が確かめる項目を、評価の軸ごとの問いで棚卸しできるようになりました。各問に根拠と次にやることを添えています（評価・格付けではありません）。",
    links: [
      { label: "評価軸セルフチェック", url: "/tools/asset-check" },
    ],
    ref: "b98e486（報告 reports/tool-asset-check-2026-10-10.md）",
  },
  {
    id: "6",
    date: "2026-10-09",
    category: "ツール",
    title: "IRRシミュレーターに「貸し手の見方」を追加",
    summary: "借入比率・金利・返済期間から、DSCR、要求水準を満たす最大の借入額、エクイティ IRR を見られるようになりました。融資の可否・条件は金融機関の判断です。",
    links: [
      { label: "IRRシミュレーター（貸し手の見方）", url: "/tools/irr-simulator#lender-view-title" },
    ],
    ref: "aa38bd0（報告 reports/tool-lender-view-2026-10-09.md）",
  },
  {
    id: "7",
    date: "2026-10-08",
    category: "ツール",
    title: "需給調整 入札ベンチマーク",
    summary: "自社の月ごとの平均落札単価と約定率から、EPRX 公表の月次平均で計算した場合との差を、月別と期間合計で比べられるようになりました。入力はサイトに残りません。",
    links: [
      { label: "需給調整 入札ベンチマーク", url: "/tools/balancing-benchmark" },
    ],
    ref: "067dd7e（報告 reports/tool-balancing-benchmark-2026-10-08.md）",
  },
  {
    id: "8",
    date: "2026-10-08",
    category: "ツール",
    title: "系統用蓄電所 資産台帳テンプレート（xlsx）",
    summary: "運用の記録をひとつにまとめる Excel の台帳を、無料・登録不要で公開しました。売却や借入の相談で確かめられそうな項目の一覧も付いています。",
    links: [
      { label: "資産台帳テンプレート", url: "/tools/asset-ledger" },
    ],
    ref: "64cb75f（報告 reports/tool-asset-ledger-2026-10-08.md）",
  },
  {
    id: "9",
    date: "2026-08-20",
    category: "データベース",
    title: "EPC 事業者の一覧と都道府県別の事業者一覧",
    summary: "蓄電池の EPC（設計・調達・建設）を担う事業者を一覧でき、事業者を本社の都道府県から探せるようになりました。絞り込んだ事業者一覧は CSV で保存できます。",
    links: [
      { label: "蓄電池 EPC の一覧", url: "/operators/epc" },
      { label: "都道府県別の事業者一覧", url: "/operators/pref" },
      { label: "蓄電所事業者ナビ（CSV 保存）", url: "/operators" },
    ],
    ref: "f0a77f8",
  },
  {
    id: "10",
    date: "2026-08-11",
    category: "データベース",
    title: "蓄電池メーカーとアグリゲーターの一覧",
    summary: "事業者データベースに、系統用蓄電池メーカーの一覧と蓄電池アグリゲーターの一覧を加えました。",
    links: [
      { label: "系統用蓄電池メーカーの一覧", url: "/operators/makers" },
      { label: "蓄電池アグリゲーターの一覧", url: "/operators/aggregators" },
    ],
    ref: "c928007",
  },
  {
    id: "11",
    date: "2026-08-10",
    category: "データベース",
    title: "事業者ページに関わった案件の欄",
    summary: "事業者のページで、保有・開発する案件とは別に、出資・EPC・運用などの役割で関わった案件が見られるようになりました。",
    links: [
      { label: "蓄電所事業者ナビ", url: "/operators" },
    ],
    ref: "a7d15ce",
  },
  {
    id: "12",
    date: "2026-08-07",
    category: "データベース",
    title: "補助金を都道府県・対象者で絞り込み",
    summary: "補助金カレンダーに都道府県の事業者向け補助金を加え、公募中かどうかやキーワードでも絞り込めるようになりました。公募中の制度は締切が近い順に、残り日数つきで並びます。",
    links: [
      { label: "補助金カレンダー", url: "/subsidies" },
    ],
    ref: "253c726, 8169a41, 91f9e19",
  },
  {
    id: "13",
    date: "2026-08-02",
    category: "その他",
    title: "ニュースの編集部まとめ",
    summary: "一定の期間の主なニュースから編集部が数本を選び、注目する理由を添えてまとめる記事を始めました。ニュース一覧の「今週のまとめ」から最新号を読めます。",
    links: [
      { label: "編集部まとめ（初回）", url: "/news/news-weekly-2026-07" },
      { label: "業界ニュース", url: "/news" },
    ],
    ref: "c9a3b55",
  },
  {
    id: "14",
    date: "2026-07-25",
    category: "ページ",
    title: "低圧系統用蓄電池の投資ガイド",
    summary: "「まず知りたい」「買うか迷っている」「営業資料を受け取った」など、今の段階から読み進められるようになりました。登録なしで開ける確認用の PDF もあります。",
    links: [
      { label: "低圧系統用蓄電池の投資ガイド", url: "/lv/invest" },
    ],
    ref: "61950fc（入口ページ）＋412fb91（記事 /lv/invest/[slug] と PDF の第一弾）〜2cf4d5b（07-29 まで段階的に追加）",
  },
  {
    id: "15",
    date: "2026-07-18",
    category: "ページ",
    title: "低圧蓄電所の総合ガイド",
    summary: "契約電力 50kW 未満で系統につなぐ蓄電所の仕組みと収益の考え方を解説しました。翌日には購入時の確認点・リスク・参入の手順・制度と補助金の解説も加えました。",
    links: [
      { label: "低圧系統用蓄電池・低圧蓄電所 総合ガイド", url: "/lv" },
      { label: "低圧蓄電所（低圧系統用蓄電池）とは？", url: "/lv/what-is" },
    ],
    ref: "4f589f5（ハブ・とは・収益モデル）＋0508951・44c35c4・f6c28ef・1b18c1e（07-19 の追加分）",
  },
  {
    id: "16",
    date: "2026-07-15",
    category: "ページ",
    title: "はじめての方向けの目的別ページ",
    summary: "「買いたい・導入したい」「売りたい・案件をお持ち」「蓄電池ビジネスに関わりたい」ごとに、読むとよいページと無料相談の窓口をまとめました。ヘッダーから開けます。",
    links: [
      { label: "蓄電所を買いたい・導入したい方へ", url: "/start/buy" },
      { label: "蓄電所を売りたい・案件をお持ちの方へ", url: "/start/sell" },
      { label: "蓄電池ビジネスに関わりたい方へ", url: "/start/partner" },
    ],
    ref: "5e496a9＋3b86df1（相談の流れ・相談前のよくある質問の追記）",
  },
  {
    id: "17",
    date: "2026-07-11",
    category: "ページ",
    title: "稼働中の蓄電所のご紹介ページを公開",
    summary: "稼働中の系統用蓄電所の取得を考えている方と、売却を考えているオーナーからの相談を受け付けるページを設けました。",
    links: [
      { label: "稼働中の蓄電所のご紹介", url: "/info/operating-bess-introduction" },
    ],
    ref: "b4141c4",
  },
  {
    id: "18",
    date: "2026-07-05",
    category: "ページ",
    title: "政策カレンダーの詳細ページ",
    summary: "主な項目ごとに内容をまとめて読めるようになりました。一部には、関連する制度の流れを時系列でたどれるタイムラインも付いています。",
    links: [
      { label: "政策・法制度カレンダー", url: "/policy-calendar" },
      { label: "詳細ページの例（蓄電池産業戦略）", url: "/policy-calendar/meti-battery-power-industry-strategy-2026-06" },
    ],
    ref: "0e504c8",
  },
  {
    id: "19",
    date: "2026-07-03",
    category: "ページ",
    title: "解説記事のカテゴリ別一覧",
    summary: "解説記事を「制度・市場」「技術」「基礎・入門」などのカテゴリごとに一覧できるページを公開しました。",
    links: [
      { label: "解説記事", url: "/explainer" },
      { label: "制度・市場の解説記事一覧", url: "/explainer/category/%E5%88%B6%E5%BA%A6%E3%83%BB%E5%B8%82%E5%A0%B4" },
      { label: "技術の解説記事一覧", url: "/explainer/category/%E6%8A%80%E8%A1%93" },
    ],
    ref: "0d55f44",
  },
  {
    id: "20",
    date: "2026-07-02",
    category: "レポート",
    title: "業界レポート2026 本編",
    summary: "市場概況・政策・主要プレイヤー・系統・補助金・火災・海外・展望を章立てでまとめた本編を公開しました（5月15日にプレビュー版を先に公開）。冒頭の主な数値は、当サイトのデータから自動で集計しています。",
    links: [
      { label: "業界レポート2026", url: "/reports/2026" },
    ],
    ref: "0f95ec7",
  },
  {
    id: "21",
    date: "2026-07-02",
    category: "ページ",
    title: "ニュースのカテゴリ別・年別一覧",
    summary: "業界ニュースを「連系」「投資」「制度」などのカテゴリごとに、また掲載年ごとにたどれる一覧ページを公開しました。",
    links: [
      { label: "業界ニュース", url: "/news" },
      { label: "連系のニュース一覧", url: "/news/category/%E9%80%A3%E7%B3%BB" },
      { label: "2026年のニュース一覧", url: "/news/archive/2026" },
    ],
    ref: "a20958d",
  },
  {
    id: "22",
    date: "2026-06-27",
    category: "ページ",
    title: "流通案件に購入・売却の案内とよくある質問を追加",
    summary: "蓄電所の案件や用地を取得したい方・売却したい方それぞれの案内と、お取り次ぎの流れ、よくある質問のページを公開しました。",
    links: [
      { label: "開発案件・用地を購入・取得したい方へ", url: "/anken/buy" },
      { label: "用地・開発案件を売却・譲渡したい方へ", url: "/anken/sell" },
      { label: "お取り次ぎの流れ", url: "/anken/flow" },
      { label: "流通案件のよくある質問", url: "/anken/faq" },
    ],
    ref: "460b6e8",
  },
  {
    id: "23",
    date: "2026-06-27",
    category: "ツール",
    title: "LCOE・LCOS 計算機を公開",
    summary: "蓄電池の均等化蓄電原価（LCOS）を設備費・充電費・運転維持費から試算し、電源別の均等化発電原価（LCOE）の参考値と並べて見られるようになりました。",
    links: [
      { label: "LCOE・LCOS 計算機", url: "/tools/lcoe-lcos" },
    ],
    ref: "eaad29d",
  },
  {
    id: "24",
    date: "2026-06-22",
    category: "データベース",
    title: "系統空き容量に東京エリアを追加",
    summary: "東京電力パワーグリッドが公表する変電所ごとの空き容量を収録し、東京エリアの一覧を他のエリアと同じ形で見られるようになりました。",
    links: [
      { label: "東京エリアの系統空き容量", url: "/grid/tokyo" },
    ],
    ref: "d0ff5bd",
  },
  {
    id: "25",
    date: "2026-06-19",
    category: "ページ",
    title: "系統用蓄電池の事業者ランキングを公開",
    summary: "プロジェクトデータベースの案件の蓄電容量（MWh）を事業者ごとに合計した、順位の一覧を公開しました。",
    links: [
      { label: "系統用蓄電池 事業者ランキング", url: "/industry/top50" },
    ],
    ref: "64fc926",
  },
  {
    id: "26",
    date: "2026-06-15",
    category: "データベース",
    title: "中部エリアの変電所ページに災害リスクの参考情報を追加",
    summary: "中部エリアの変電所の詳細ページで、所在地が洪水・土砂災害・高潮・津波の想定区域に入るかを、国土交通省のデータをもとに確かめられるようになりました。",
    links: [
      { label: "中部エリアの系統空き容量", url: "/grid/chubu" },
    ],
    ref: "87a683e",
  },
  {
    id: "27",
    date: "2026-06-10",
    category: "ページ",
    title: "蓄電所の流通案件ページを公開",
    summary: "連系枠を確保済みの蓄電所案件の売買について、匿名の案件情報と市場動向を載せたページを公開し、案件元へお取り次ぎする窓口を設けました。",
    links: [
      { label: "蓄電所の流通案件", url: "/anken" },
    ],
    ref: "1e30629, 7a6c141",
  },
  {
    id: "28",
    date: "2026-05-27",
    category: "トラッカー",
    title: "需給調整市場の約定価格トラッカーを公開",
    summary: "需給調整市場の商品ごとの落札単価と不足率を、年度ごとの推移で見られるようになりました。蓄電池の落札単価も商品ごとに確かめられます。",
    links: [
      { label: "需給調整市場 約定価格トラッカー", url: "/tracker/imbalance" },
    ],
    ref: "87a106a",
  },
  {
    id: "29",
    date: "2026-05-24",
    category: "ツール",
    title: "需給調整市場の収益シナリオを公開",
    summary: "蓄電池の落札単価の実績をもとに、提供する容量と商品ごとの落札率を入れて、需給調整市場での年間収益の目安を試算できるようになりました。",
    links: [
      { label: "需給調整 収益シナリオ", url: "/tools/balancing-revenue" },
    ],
    ref: "895cc23",
  },
  {
    id: "30",
    date: "2026-05-19",
    category: "ページ",
    title: "立場・目的別の案内ページを公開",
    summary: "工場・商業施設での導入、容量市場や需給調整市場への参加、メーカー・EPC・開発事業者など、立場ごとに関係するデータとツールをまとめたページを公開しました。",
    links: [
      { label: "工場・商業施設の蓄電池導入", url: "/buyer/factory-commercial" },
      { label: "容量市場", url: "/buyer/capacity-market" },
      { label: "需給調整市場", url: "/buyer/balancing-market" },
      { label: "PPA・オフテイク", url: "/buyer/ppa-offtake" },
      { label: "メーカー向け", url: "/seller/manufacturer" },
      { label: "EPC 事業者向け", url: "/seller/epc" },
      { label: "開発事業者向け", url: "/seller/developer" },
      { label: "中古売買・リユース", url: "/seller/reuse-secondhand" },
    ],
    ref: "785046a / 75d9676 / 0cef90d",
  },
  {
    id: "31",
    date: "2026-05-16",
    category: "データベース",
    title: "JEPX 価格と電源構成・燃料・金利のデータを公開",
    summary: "運営元のエネルギー情報センターが公開する「EIC Data」（data.eic-jp.org）のデータを使い、JEPX スポット価格の日次の推移と、電源構成・燃料価格・金利・為替の推移を見られるようになりました。",
    links: [
      { label: "JEPX スポット価格ハブ", url: "/market/jepx" },
      { label: "電源構成・燃料価格・金利ダッシュボード", url: "/dashboard/market" },
      { label: "EIC Data", url: "https://data.eic-jp.org" },
    ],
    ref: "136dd88 / 76e94bc（JEPX ページの枠は 9c8b841）",
  },
  {
    id: "32",
    date: "2026-05-15",
    category: "ツール",
    title: "蓄電池補助金マッチングを公開",
    summary: "所在地・用途・容量・事業者の種類を入れると、当てはまりそうな蓄電池関連の補助金を絞り込めるようになりました。",
    links: [
      { label: "蓄電池補助金マッチング", url: "/tools/subsidy-match" },
    ],
    ref: "5344540",
  },
  {
    id: "33",
    date: "2026-05-15",
    category: "ページ",
    title: "蓄電池業界カオスマップを公開",
    summary: "蓄電池業界の主な事業者を分野別に並べ、出資・EPC・セル供給などの関係も図で示しました。",
    links: [
      { label: "蓄電池業界カオスマップ", url: "/map/industry-chaos" },
    ],
    ref: "9c8b841",
  },
  {
    id: "34",
    date: "2026-05-15",
    category: "ツール",
    title: "蓄電池 IRR シミュレーターを公開",
    summary: "系統用蓄電池の IRR・NPV・投資回収年数を、楽観・標準・悲観のシナリオで試算できるようになりました。",
    links: [
      { label: "蓄電池IRRシミュレーター", url: "/tools/irr-simulator" },
      { label: "ツール一覧", url: "/tools" },
    ],
    ref: "882429b",
  },
  {
    id: "35",
    date: "2026-05-15",
    category: "ツール",
    title: "系統連系診断を公開",
    summary: "希望する地点と出力を入れると、変電所の公表データから連系先の候補を示すツールを公開しました。連系できるかどうかは、送配電事業者の検討で決まります。",
    links: [
      { label: "系統連系診断", url: "/tools/grid-connection-check" },
    ],
    ref: "adc2247",
  },
  {
    id: "36",
    date: "2026-05-15",
    category: "データベース",
    title: "火災・トラブル事例データベースを公開",
    summary: "国内外の蓄電池の火災・トラブル事例を、公開情報と出典つきでまとめました。原因の分類と学びも事例ごとに載せています。",
    links: [
      { label: "火災・トラブル事例DB", url: "/incidents" },
    ],
    ref: "70e8a45",
  },
  {
    id: "37",
    date: "2026-05-15",
    category: "ツール",
    title: "火災リスク自己診断を公開",
    summary: "セル・PCS・建屋・運用・緊急時対応の設問に答えて、蓄電池の火災リスクの目安と、先に見直すべき点を確かめられるようになりました。",
    links: [
      { label: "火災リスク自己診断", url: "/tools/fire-risk-check" },
    ],
    ref: "294c304",
  },
  {
    id: "38",
    date: "2026-05-15",
    category: "ページ",
    title: "海外の蓄電池市場のページを公開",
    summary: "米国・EU・中国・インド・豪州の蓄電池市場の規模・政策・主な事業者を、日本と比べながら読めるようになりました。",
    links: [
      { label: "海外市場ハブ", url: "/global" },
      { label: "米国", url: "/global/us" },
      { label: "EU", url: "/global/eu" },
      { label: "中国", url: "/global/cn" },
      { label: "インド", url: "/global/in" },
      { label: "豪州", url: "/global/au" },
    ],
    ref: "9c8b841",
  },
  {
    id: "39",
    date: "2026-05-15",
    category: "ページ",
    title: "業界分析のまとめページを公開",
    summary: "業界カオスマップ・JEPX・海外の市場・業界トラッカーへの入口を、ひとつのページにまとめました。",
    links: [
      { label: "業界分析", url: "/industry" },
    ],
    ref: "70e8a45",
  },
  {
    id: "40",
    date: "2026-05-15",
    category: "トラッカー",
    title: "業界トラッカーを公開",
    summary: "補助金・系統・事業者・プロジェクトの更新を、日付順のタイムラインで追えるようになりました。",
    links: [
      { label: "業界トラッカー", url: "/tracker" },
      { label: "補助金トラッカー", url: "/tracker/subsidy" },
      { label: "系統トラッカー", url: "/tracker/grid" },
      { label: "事業者トラッカー", url: "/tracker/ag" },
      { label: "プロジェクトトラッカー", url: "/tracker/pf" },
    ],
    ref: "9c8b841",
  },
  {
    id: "41",
    date: "2026-05-15",
    category: "ツール",
    title: "容量市場の応札試算を公開",
    summary: "エリアと応札容量を入れて、容量市場の応札価格の目安と想定収入を試算できるツールを公開しました。5月29日からは容量市場の約定実績をもとに試算しています。",
    links: [
      { label: "容量市場応札試算", url: "/tools/capacity-market-bid" },
    ],
    ref: "9556c6d / 4478e7c",
  },
  {
    id: "42",
    date: "2026-05-12",
    category: "ページ",
    title: "業界イベント・展示会カレンダーを公開",
    summary: "蓄電池・再エネ関連の展示会・セミナー・業界団体の催しを、月ごとに一覧できるようになりました。",
    links: [
      { label: "業界イベント・展示会カレンダー", url: "/events" },
    ],
    ref: "1afdba9",
  },
  {
    id: "43",
    date: "2026-05-12",
    category: "ページ",
    title: "よくある質問（FAQ）を公開",
    summary: "制度・技術・事業・補助金などの分野ごとに、系統用蓄電池・蓄電所事業のよくある質問と回答をまとめました。",
    links: [
      { label: "よくある質問（FAQ）", url: "/faq" },
    ],
    ref: "d168afb",
  },
  {
    id: "44",
    date: "2026-05-11",
    category: "ページ",
    title: "政策・法制度カレンダーを公開",
    summary: "経済産業省・OCCTO などの法改正・パブリックコメント・審議会・オークションの予定と結果を、時系列で一覧できるようになりました。",
    links: [
      { label: "政策・法制度カレンダー", url: "/policy-calendar" },
    ],
    ref: "e2987f9 / 607efe3",
  },
  {
    id: "45",
    date: "2026-05-11",
    category: "データベース",
    title: "中部エリアで変電所とプロジェクトを行き来できるように",
    summary: "中部エリアでは、変電所のページから周辺の蓄電所プロジェクトへ、プロジェクトのページから近くの変電所へたどれるようになりました。",
    links: [
      { label: "系統空き容量（中部）", url: "/grid/chubu" },
    ],
    ref: "10ef5ce",
  },
  {
    id: "46",
    date: "2026-05-08",
    category: "データベース",
    title: "系統空き容量に九州エリアを追加",
    summary: "九州電力送配電が公表する変電所の空き容量を、エリアのページと変電所ごとのページで見られるようになりました。",
    links: [
      { label: "九州エリア", url: "/grid/kyushu" },
    ],
    ref: "8640451",
  },
  {
    id: "47",
    date: "2026-05-08",
    category: "データベース",
    title: "変電所を名前・条件・都道府県から探せるように",
    summary: "変電所名での検索、エリア・電圧・空き容量などの条件での絞り込み、都道府県ごとの一覧が使えるようになりました。",
    links: [
      { label: "変電所詳細検索", url: "/grid/search" },
      { label: "都道府県別 変電所一覧", url: "/grid/prefecture" },
    ],
    ref: "0c51e60 / 6702f83",
  },
  {
    id: "48",
    date: "2026-05-08",
    category: "データベース",
    title: "中部エリアの変電所を地図で見られるように",
    summary: "中部電力パワーグリッドの変電所を地図上に表示し、空き容量の有無を色分けで確かめられるようになりました。",
    links: [
      { label: "中部電力パワーグリッドの空き容量マップ", url: "/grid/chubu/map" },
    ],
    ref: "af73538",
  },
  {
    id: "49",
    date: "2026-05-07",
    category: "データベース",
    title: "変電所ごとの系統空き容量データベースを公開",
    summary: "送配電各社が公表する空き容量を、エリア一覧と変電所のページで見られるようになりました。東北・北陸・四国に続き、同日に関西・中国・沖縄・北海道・中部を加えました。",
    links: [
      { label: "系統空き容量データベース", url: "/grid" },
      { label: "東北エリア", url: "/grid/tohoku" },
      { label: "北陸エリア", url: "/grid/hokuriku" },
      { label: "四国エリア", url: "/grid/shikoku" },
      { label: "関西エリア", url: "/grid/kansai" },
      { label: "中国エリア", url: "/grid/chugoku" },
      { label: "沖縄エリア", url: "/grid/okinawa" },
      { label: "北海道エリア", url: "/grid/hokkaido" },
      { label: "中部エリア", url: "/grid/chubu" },
    ],
    ref: "9600054 / aa0d9a9 / b8188bc / 47540e1 / 2ec11cc",
  },
  {
    id: "50",
    date: "2026-05-06",
    category: "ページ",
    title: "お役立ちサイト一覧を公開",
    summary: "蓄電池・電力業界の調べものに役立つ公式サイトや情報源を、分野別にまとめた一覧を公開しました。",
    links: [
      { label: "お役立ちサイト一覧", url: "/links" },
    ],
    ref: "5ff6114",
  },
  {
    id: "51",
    date: "2026-05-04",
    category: "データベース",
    title: "蓄電所事業者ナビを公開",
    summary: "蓄電所の開発・運営、EPC、メーカー、アグリゲーターなど、蓄電池事業に関わる事業者を分野別に探せるようになりました。",
    links: [
      { label: "蓄電所事業者ナビ", url: "/operators" },
    ],
    ref: "ed3ee5a",
  },
  {
    id: "52",
    date: "2026-05-03",
    category: "ページ",
    title: "お知らせのページを公開",
    summary: "運営からのお知らせを、業界ニュースとは分けて載せるページを設けました。",
    links: [
      { label: "お知らせ", url: "/info" },
    ],
    ref: "1174257 / 26fd29f",
  },
  {
    id: "53",
    date: "2026-05-02",
    category: "データベース",
    title: "補助金カレンダーを公開",
    summary: "蓄電池の事業に使える補助金を、実施機関と公募の状況で整理し、一覧できるようになりました。",
    links: [
      { label: "補助金カレンダー", url: "/subsidies" },
    ],
    ref: "8775491 / ccb83d1",
  },
  {
    id: "54",
    date: "2026-05-02",
    category: "データベース",
    title: "蓄電所プロジェクトのデータベースを公開",
    summary: "国内の系統用蓄電池・蓄電所の案件を、出力・容量・所在地・事業者・稼働状況とあわせて一覧で見られるようになりました。",
    links: [
      { label: "蓄電所プロジェクト一覧", url: "/projects" },
    ],
    ref: "8775491 / ccb83d1",
  },
  {
    id: "55",
    date: "2026-05-02",
    category: "ページ",
    title: "業界ニュースの掲載を開始",
    summary: "蓄電池・蓄電所に関わる業界のニュースを、一覧と記事のページで読めるようになりました。",
    links: [
      { label: "業界ニュース", url: "/news" },
    ],
    ref: "8775491 / ccb83d1",
  },
  {
    id: "56",
    date: "2026-04-30",
    category: "ページ",
    title: "用語集を公開",
    summary: "系統用蓄電池・蓄電所事業で使う用語を、分野別に引ける用語集を公開しました。",
    links: [
      { label: "用語集", url: "/glossary" },
    ],
    ref: "68c6b8e / ee94db2",
  },
  {
    id: "57",
    date: "2026-04-29",
    category: "ページ",
    title: "蓄電所ネットを公開し、解説記事の掲載を開始",
    summary: "系統用蓄電池・低圧リソース事業の制度・市場・技術を解説する記事の掲載を始めました。",
    links: [
      { label: "解説記事一覧", url: "/explainer" },
      { label: "トップページ", url: "/" },
    ],
    ref: "8f6ac48 / 6f6c70b",
  },
];
