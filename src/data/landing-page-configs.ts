/**
 * Sprint X1 LandingPage 設定 (Buyer × 4 + Seller × 4 = 8 ページ)
 *
 * 設計 (L-JEPX-UI-007 共通コンポーネント効率性):
 *   - 1 ファイル編集 → 8 ページ反映
 *   - Day 1 (5/19): 共通基盤 + Buyer 1 ページ完成 (本ファイル)
 *   - Day 2 (5/20): Buyer 残り 3 ページ詳細追記 (投入文面 41)
 *   - Day 3 (5/21): Seller 4 ページ詳細追記 (投入文面 43)
 */

export type LandingPageType = 'buyer' | 'seller';

export interface LandingPagePainPoint {
  icon: string;
  title: string;
  description: string;
}

export interface LandingPageDataReference {
  label: string;
  dataUrl: string;
  indicatorIds: string[];
  insightSlugs?: string[];
  latestValueLabel?: string;
}

export interface LandingPageTool {
  label: string;
  url: string;
  description: string;
}

export interface LandingPageFAQ {
  question: string;
  answer: string;
}

export interface LandingPageConfig {
  slug: string;
  type: LandingPageType;
  title: string;
  description: string;
  ogImage?: string;
  heroH1: string;
  heroSubcopy: string;
  heroCtaLabel: string;
  heroCtaUrl: string;
  painPoints: LandingPagePainPoint[];
  dataReferences: LandingPageDataReference[];
  dataSectionTitle: string;
  tools: LandingPageTool[];
  insightSlugs: string[];
  faqs: LandingPageFAQ[];
  ctaPrimary: { label: string; url: string };
  ctaSecondary?: { label: string; url: string };
}

// 8 ページ設定 (Buyer 1 完全データ + 雛形 7)
export const LANDING_PAGE_CONFIGS: Record<string, LandingPageConfig> = {
  // ★ Buyer 1 完全データ (5/19 Day 1 完成例、本投入文面)
  'buyer/factory-commercial': {
    slug: 'buyer/factory-commercial',
    type: 'buyer',
    title: '工場・商業施設の蓄電池導入｜電気代削減・BCP・ピークカット - 蓄電所ネット',
    description:
      '工場や商業施設での蓄電池導入を検討中の事業者向け。電気代削減 (自家消費)、ピークカット、BCP (停電対策) の費用対効果を実データで比較。容量市場・需給調整市場の参入も解説。無料相談受付中。',
    ogImage: '/og/buyer-factory-commercial.png',
    heroH1: '工場・商業施設の電気代を、蓄電池で 20-30% 削減する',
    heroSubcopy:
      '自家消費＋ピークカット＋BCP の 3 つの効果を実データで比較。容量市場・需給調整市場参入で追加収益も可能。エネルギー情報センターの 10 年運営実績で、業界事業者を中立的に支援します。',
    heroCtaLabel: '無料相談はこちら',
    heroCtaUrl: '/contact/buyer',
    painPoints: [
      {
        icon: '💸',
        title: '電気代が年々上昇、原価圧迫',
        description:
          '燃料価格・容量市場・再エネ賦課金で電気代は上昇基調。蓄電池で自家消費＋ピークカットによる削減効果を実データで試算。',
      },
      {
        icon: '⚡',
        title: '停電リスク、BCP 体制が不十分',
        description:
          '台風・地震・系統障害による停電リスク増大。蓄電池で重要負荷の継続運転を確保、事業継続を強化。',
      },
      {
        icon: '💼',
        title: '容量市場・需給調整市場参入の知識不足',
        description:
          'kW 価値 (容量市場) + kWh+kW 価値 (需給調整市場) + JEPX スポット = 3 階建て収益。最新の市場情報と参入ガイダンス。',
      },
      {
        icon: '🌱',
        title: 'カーボンニュートラル目標達成',
        description:
          'Scope 2 削減 + 再エネ自家消費率向上で、CDP・SBTi 評価を改善。投資家・取引先からの ESG 評価向上。',
      },
    ],
    dataReferences: [
      {
        label: '全国 JEPX 平均価格',
        dataUrl: 'https://data.eic-jp.org/catalog/jepx-spot-tokyo',
        indicatorIds: ['jepx-spot-tokyo'],
      },
      {
        label: '日本 LNG 輸入価格',
        dataUrl: 'https://data.eic-jp.org/catalog/fuel-lng-jp-cif',
        indicatorIds: ['fuel-lng-jp-cif'],
      },
      {
        label: 'USD/JPY 為替',
        dataUrl: 'https://data.eic-jp.org/catalog/fx-usdjpy-monthly-avg',
        indicatorIds: ['fx-usdjpy-monthly-avg'],
      },
      {
        label: '東京の最高気温 (夏季ピーク需要相関)',
        dataUrl: 'https://data.eic-jp.org/catalog/jma-temp-max-tokyo',
        indicatorIds: ['jma-temp-max-tokyo'],
      },
    ],
    dataSectionTitle: '業界の現状を数字で見る (data.eic-jp.org 提供)',
    tools: [
      {
        label: 'IRR シミュレーター',
        url: '/tools/irr-simulator',
        description:
          '蓄電池プロジェクトの IRR を試算。容量市場・需給調整・JEPX の 3 階建て収益モデル。',
      },
      {
        label: '火災リスク自己診断',
        url: '/tools/fire-risk-check',
        description: '設置検討中の蓄電池の火災リスクを自己診断。UL9540A / NFPA855 準拠。',
      },
      {
        label: '容量市場入札ツール',
        url: '/tools/capacity-market-bid',
        description: '容量市場の入札価格を試算。最新の約定価格・落札枠を反映。',
      },
    ],
    insightSlugs: [
      'temp-vs-price',
      'lng-vs-price-tokyo',
      'fx-decomp-lng-jepx-tokyo',
      'jgb-vs-yen-lng',
    ],
    faqs: [
      {
        question: '工場・商業施設で蓄電池を導入するメリットは何ですか?',
        answer:
          '主に 3 つあります。①電気代削減 (自家消費＋ピークカット)、②BCP (停電時の重要負荷継続運転)、③追加収益 (容量市場・需給調整市場参入)。最新の事例では年間 20-30% の電気代削減 + 容量市場収益が報告されています。',
      },
      {
        question: '初期費用と回収期間はどれくらいですか?',
        answer:
          '規模・用途により異なりますが、500kWh クラスで初期費用 8,000-12,000 万円、補助金活用後の回収期間は 7-12 年が目安です。IRR シミュレーターで具体的な試算が可能です。',
      },
      {
        question: '容量市場と需給調整市場、両方参加できますか?',
        answer:
          '可能です。容量市場 (kW 価値) と需給調整市場 (kWh+kW 価値) は併用可能で、JEPX スポット市場の収益と合わせて 3 階建ての収益モデルが組めます。詳細は容量市場・需給調整市場の専門ページをご覧ください。',
      },
      {
        question: 'カーボンニュートラル目標 (CDP/SBTi) への貢献は?',
        answer:
          '蓄電池の自家消費による Scope 2 排出量削減 + 再エネ自家消費率向上が直接 CDP/SBTi 評価に反映されます。投資家・取引先・サプライチェーンからの ESG 評価向上にも寄与します。',
      },
      {
        question: '相談・問い合わせの流れは?',
        answer:
          '「無料相談はこちら」ボタンから、エネルギー情報センターのお問い合わせフォームへ進めます。10 年運営の実績で、業界中立の立場から導入検討を支援します。',
      },
    ],
    ctaPrimary: { label: '無料相談はこちら', url: '/contact/buyer' },
    ctaSecondary: { label: '業界レポート 2026 を見る', url: '/reports/2026' },
  },
  // ★★ 雛形 7 件 (5/20-5/21 で投入文面 41/43 で本実装)
  'buyer/capacity-market': {
    slug: 'buyer/capacity-market',
    type: 'buyer',
    title: '容量市場参加検討｜kW 価値で安定収益｜蓄電所ネット',
    description:
      '容量市場参加を検討中の蓄電池事業者向け。OCCTO 運営の容量市場で kW 価値による安定収益を確保。最新の約定価格、落札枠、参入条件を実データで解説。エネルギー情報センターが業界中立で支援。',
    ogImage: '/og/buyer-capacity-market.png',
    heroH1: '容量市場で kW 価値による安定収益を確保する',
    heroSubcopy:
      'OCCTO 運営の容量市場は蓄電池事業者にとって kW 価値 (容量提供) による安定収益源。最新の約定価格・落札枠・参入条件をリアルタイムで把握、IRR シミュレーションで投資判断を支援します。',
    heroCtaLabel: '容量市場参入相談はこちら',
    heroCtaUrl: '/contact/buyer',
    painPoints: [
      {
        icon: '📊',
        title: '容量市場の最新動向が把握しづらい',
        description:
          '約定価格・落札枠・メインオークション結果・追加オークションの動向を毎月追うのは負担。データ可視化で意思決定を加速。',
      },
      {
        icon: '💰',
        title: 'kW 価値の安定収益化が難しい',
        description:
          '蓄電池の kW 価値を最大化するには容量市場参入が有効。但し参入条件・実需給期間・ペナルティ制度の理解が必須。',
      },
      {
        icon: '🔢',
        title: 'IRR への寄与度が見えにくい',
        description:
          '容量市場収益 (kW) + JEPX スポット (kWh) + 需給調整市場 (kWh+kW) = 3 階建て収益モデル。IRR シミュレーションで詳細試算。',
      },
      {
        icon: '⚖️',
        title: '需給調整市場との並行参加判断',
        description:
          '同一蓄電池で容量市場 + 需給調整市場の両方参加可能。優先順位の設計、停止リスクの管理が複雑。',
      },
    ],
    dataReferences: [
      {
        label: '容量市場 約定価格 (メインオークション)',
        dataUrl: 'https://data.eic-jp.org/catalog/capacity-market-clearing-price',
        indicatorIds: ['capacity-market-clearing-price'],
      },
      {
        label: '容量市場 落札枠',
        dataUrl: 'https://data.eic-jp.org/catalog/capacity-market-volume',
        indicatorIds: ['capacity-market-volume'],
      },
      {
        label: 'JEPX 東京エリア価格',
        dataUrl: 'https://data.eic-jp.org/catalog/jepx-spot-tokyo',
        indicatorIds: ['jepx-spot-tokyo'],
      },
      {
        label: '日本 LNG 輸入価格 (火力燃料コスト)',
        dataUrl: 'https://data.eic-jp.org/catalog/fuel-lng-jp-cif',
        indicatorIds: ['fuel-lng-jp-cif'],
      },
    ],
    dataSectionTitle: '容量市場の最新動向 (data.eic-jp.org 提供)',
    tools: [
      {
        label: '容量市場入札ツール',
        url: '/tools/capacity-market-bid',
        description:
          '容量市場の入札価格を試算。最新の約定価格・落札枠を反映、Backfill 5 年分データで傾向分析。',
      },
      {
        label: 'IRR シミュレーター',
        url: '/tools/irr-simulator',
        description:
          '蓄電池プロジェクトの IRR を試算。容量市場 + JEPX + 需給調整の 3 階建て収益モデル対応。',
      },
      {
        label: '需給調整市場参加検討',
        url: '/buyer/balancing-market',
        description:
          '需給調整市場 (5 商品 × 10 エリア) への参加検討ガイド。容量市場との並行参加可能性も解説。',
      },
    ],
    insightSlugs: [
      'capacity-market-trend',
      'temp-vs-price',
      'lng-vs-price-tokyo',
      'fx-decomp-lng-jepx-tokyo',
    ],
    faqs: [
      {
        question: '容量市場参加の最低要件は?',
        answer:
          '蓄電池の場合、出力 1MW 以上、安定運転実績、OCCTO 認定が主要要件です。詳細は OCCTO 公式 + 当社の容量市場入札ツールで条件チェック可能です。',
      },
      {
        question: 'メインオークションと追加オークションの違いは?',
        answer:
          'メインオークション = 4 年後の実需給期間向け、追加オークション = 1 年前の補完。蓄電池新設プロジェクトは通常メインオークションで参加、稼働中既存資産は追加オークションで参加します。',
      },
      {
        question: '容量市場収益と需給調整市場収益は両立可能?',
        answer:
          '可能です。同一蓄電池で kW 価値 (容量市場) + kWh+kW 価値 (需給調整市場) + JEPX スポット収益の 3 階建てが組めます。但し制約条件があるため IRR シミュレーターで詳細検証が必要です。',
      },
      {
        question: '実需給期間に kW 価値を提供できなかった場合のペナルティは?',
        answer:
          'OCCTO 規定により、未提供分の容量に対してペナルティが課されます。蓄電池の SoC (充電状態) 管理、運転計画の最適化が重要。当社の容量市場入札ツールで稼働率シミュレーションが可能です。',
      },
      {
        question: '容量市場の今後の見通しは?',
        answer:
          '日本のエネルギー基本計画では 2030 年までに蓄電池容量を大幅拡大予定。容量市場の枠も連動して拡大見込み。最新動向は当ページのデータセクションで継続更新します。',
      },
    ],
    ctaPrimary: { label: '容量市場参入相談はこちら', url: '/contact/buyer' },
    ctaSecondary: { label: '容量市場入札ツールを使う', url: '/tools/capacity-market-bid' },
  },
  'buyer/balancing-market': {
    slug: 'buyer/balancing-market',
    type: 'buyer',
    title: '需給調整市場参加検討｜kWh+kW 価値で複合収益｜蓄電所ネット',
    description:
      '需給調整市場 (5 商品 × 10 エリア) への参加を検討中の蓄電池事業者向け。一次・二次・三次調整力の最新動向、収益試算、参入条件を実データで解説。エネルギー情報センターが業界中立で支援。',
    ogImage: '/og/buyer-balancing-market.png',
    heroH1: '需給調整市場で kWh+kW 複合収益を最大化する',
    heroSubcopy:
      '需給調整市場は一次・二次・三次調整力の 5 商品 × 10 エリア構成。蓄電池の応答速度・容量を最大活用、kWh と kW の複合収益で安定運用を実現。最新の入札動向と参入条件を解説します。',
    heroCtaLabel: '需給調整市場参入相談はこちら',
    heroCtaUrl: '/contact/buyer',
    painPoints: [
      {
        icon: '🔄',
        title: '5 商品 × 10 エリアの選択が複雑',
        description:
          '一次調整力 / 二次調整力①② / 三次調整力①② の特性比較、北海道〜九州の 10 エリア別需要・約定価格分析、複合的な最適化判断が必要。',
      },
      {
        icon: '⚡',
        title: '応答速度要件への対応',
        description:
          '一次調整力は 10 秒以内、三次調整力①は 5-15 分応答。蓄電池の制御システム・通信遅延の最適化が参入成功の鍵。',
      },
      {
        icon: '💹',
        title: '約定価格の変動把握',
        description:
          '需給調整市場の約定価格は日々変動。5 商品 × 10 エリア = 50 系列のリアルタイム把握が業界事業者にとって負担。',
      },
      {
        icon: '🎯',
        title: '容量市場との並行参加最適化',
        description:
          '同一蓄電池で容量市場 + 需給調整 + JEPX の 3 階建て収益が可能。但し同時参加制約、優先順位、停止リスク管理が複雑。',
      },
    ],
    dataReferences: [
      {
        label: '需給調整市場 一次調整力 約定価格',
        dataUrl: 'https://data.eic-jp.org/catalog/balancing-primary-clearing',
        indicatorIds: ['balancing-primary-clearing'],
      },
      {
        label: '需給調整市場 三次調整力② 約定価格',
        dataUrl: 'https://data.eic-jp.org/catalog/balancing-tertiary2-clearing',
        indicatorIds: ['balancing-tertiary2-clearing'],
      },
      {
        label: 'JEPX 東京エリア価格 (スポット参考)',
        dataUrl: 'https://data.eic-jp.org/catalog/jepx-spot-tokyo',
        indicatorIds: ['jepx-spot-tokyo'],
      },
      {
        label: '日本 LNG 輸入価格 (火力燃料コスト)',
        dataUrl: 'https://data.eic-jp.org/catalog/fuel-lng-jp-cif',
        indicatorIds: ['fuel-lng-jp-cif'],
      },
    ],
    dataSectionTitle: '需給調整市場 5 商品 × 10 エリアの最新動向',
    tools: [
      {
        label: 'IRR シミュレーター',
        url: '/tools/irr-simulator',
        description:
          '需給調整 + 容量市場 + JEPX の 3 階建て収益モデルで IRR 試算。蓄電池プロジェクトの投資判断を支援。',
      },
      {
        label: '容量市場入札ツール',
        url: '/tools/capacity-market-bid',
        description: '容量市場との並行参加検討。実需給期間の運転計画最適化に活用。',
      },
      {
        label: '火災リスク自己診断',
        url: '/tools/fire-risk-check',
        description:
          '需給調整市場参加に向けて設置検討中の蓄電池の火災リスクを自己診断。UL9540A / NFPA855 準拠。',
      },
    ],
    insightSlugs: [
      'balancing-tertiary2-vs-jepx',
      'temp-vs-price',
      'lng-vs-price-tokyo',
      'fx-decomp-lng-jepx-tokyo',
    ],
    faqs: [
      {
        question: '需給調整市場の 5 商品の違いは?',
        answer:
          '一次調整力 (10 秒以内応答)、二次調整力① (5 分以内)、二次調整力② (5 分以内)、三次調整力① (15 分以内)、三次調整力② (45 分以内)。蓄電池は応答速度に優位性があり、特に一次・二次調整力で高収益化可能です。',
      },
      {
        question: '10 エリア別の参加判断は?',
        answer:
          'エリア別に需要規模・約定価格・電源構成が異なります。北海道・東北は再エネ変動が大きく調整力需要高、九州は太陽光抑制対応で調整力需要急増。最新動向は当ページデータセクションで継続更新。',
      },
      {
        question: '容量市場との並行参加は可能?',
        answer:
          '可能です。同一蓄電池で kW 価値 (容量市場) + kWh+kW 価値 (需給調整) + JEPX スポット = 3 階建て収益モデル。但し優先順位・停止リスク管理が複雑、IRR シミュレーターで詳細試算推奨。',
      },
      {
        question: '蓄電池の応答速度要件への対応は?',
        answer:
          '一次調整力 10 秒以内応答にはバッテリー制御システム + 通信遅延の最適化が必須。リチウムイオン蓄電池は応答速度に優位性、PCS (パワーコンディショナ) の選定が鍵。',
      },
      {
        question: '今後の需給調整市場の見通しは?',
        answer:
          '再エネ大量導入に伴い調整力需要は拡大基調。特に蓄電池は応答速度・容量制御の柔軟性で参入優位性が大きい。最新の市場動向は当ページデータセクション + Insight 記事で継続更新します。',
      },
    ],
    ctaPrimary: { label: '需給調整市場参入相談はこちら', url: '/contact/buyer' },
    ctaSecondary: { label: 'IRR シミュレーターを試す', url: '/tools/irr-simulator' },
  },
  'buyer/ppa-offtake': {
    slug: 'buyer/ppa-offtake',
    type: 'buyer',
    title: 'PPA・オフテイク契約検討｜長期安定収益と金融リスク管理｜蓄電所ネット',
    description:
      'PPA・オフテイク契約による長期安定収益化を検討中の蓄電池事業者向け。為替リスク、金利リスク、燃料コスト変動への対応、契約構造設計を実データで解説。エネルギー情報センターが業界中立で支援。',
    ogImage: '/og/buyer-ppa-offtake.png',
    heroH1: 'PPA・オフテイク契約で長期安定収益と金融リスク管理を両立',
    heroSubcopy:
      '蓄電池プロジェクトの PPA・オフテイク契約設計には、為替・金利・燃料コストの長期変動リスク管理が不可欠。日米金利差・円建て LNG・JGB 等のマクロ指標と連動した契約構造設計を支援します。',
    heroCtaLabel: 'PPA・オフテイク契約相談はこちら',
    heroCtaUrl: '/contact/buyer',
    painPoints: [
      {
        icon: '💱',
        title: '為替リスク (円安局面の燃料コスト上昇)',
        description:
          '蓄電池プロジェクトの長期契約 (10-20 年) 期間中の為替変動は IRR に直結。円建て LNG・USD/JPY の連動分析、ヘッジ戦略の組み込みが必須。',
      },
      {
        icon: '📈',
        title: '金利リスク (プロジェクトファイナンスへの影響)',
        description:
          '日米金利差の拡大はプロジェクトファイナンス・SPC スキームに直接影響。JGB 10y + 米 10y + イールドカーブの動向把握が判断材料。',
      },
      {
        icon: '⛽',
        title: '燃料コスト変動 (オフテイカー側の電気代影響)',
        description:
          'PPA・オフテイク契約の長期固定価格 vs 燃料コスト変動。LNG/原油/石炭の価格動向と燃料費調整制度の理解で契約価格の最適化。',
      },
      {
        icon: '📜',
        title: '契約構造設計 (リスク分担の最適化)',
        description:
          'Fixed Price / Floating Price / Hybrid / Tolling 等の契約形態選択、為替・金利・燃料リスクの売り手 vs 買い手分担設計。',
      },
    ],
    dataReferences: [
      {
        label: 'USD/JPY 月中平均 (為替リスク指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/fx-usdjpy-monthly-avg',
        indicatorIds: ['fx-usdjpy-monthly-avg'],
      },
      {
        label: '日本国債 10y 金利 (金利リスク指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/jgb-10y-yield',
        indicatorIds: ['jgb-10y-yield'],
      },
      {
        label: '米国国債 10y 金利 (日米金利差)',
        dataUrl: 'https://data.eic-jp.org/catalog/us-treasury-10y',
        indicatorIds: ['us-treasury-10y'],
      },
      {
        label: '日本 LNG 輸入価格 CIF (燃料コスト指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/fuel-lng-jp-cif',
        indicatorIds: ['fuel-lng-jp-cif'],
      },
    ],
    dataSectionTitle: '長期契約設計に必要なマクロ指標 (data.eic-jp.org 提供)',
    tools: [
      {
        label: 'IRR シミュレーター',
        url: '/tools/irr-simulator',
        description:
          'PPA・オフテイク契約価格を入力、為替・金利・燃料コスト変動シナリオでの IRR 感度分析。',
      },
      {
        label: '容量市場入札ツール',
        url: '/tools/capacity-market-bid',
        description:
          'PPA + 容量市場の併用収益モデル試算。長期契約と短期市場収益のバランス最適化。',
      },
      {
        label: '需給調整市場参加検討',
        url: '/buyer/balancing-market',
        description:
          'PPA + 容量市場 + 需給調整 = 3 階建て収益モデルの一翼。詳細は需給調整市場ページで。',
      },
    ],
    insightSlugs: [
      'jgb-vs-yen-lng',
      'fx-decomp-lng-jepx-tokyo',
      'us-jp-rate-vs-usdjpy',
      'lng-vs-price-tokyo',
    ],
    faqs: [
      {
        question: 'PPA と オフテイク契約の違いは?',
        answer:
          'PPA (Power Purchase Agreement) = 長期売電契約、オフテイク契約 = 蓄電池の容量・出力の長期利用契約。蓄電池プロジェクトでは両者の組み合わせが一般的、契約構造の理解が IRR 最適化の鍵。',
      },
      {
        question: '為替リスクへの対応は?',
        answer:
          '①為替ヘッジ (Forward / Option)、②円建て契約への構造変更、③燃料費調整連動 (USD ベース)。当ページの USD/JPY + 円建て LNG データで影響度試算可能。',
      },
      {
        question: '金利リスクのプロジェクトファイナンス影響は?',
        answer:
          '日米金利差拡大時はプロジェクトファイナンスのコスト上昇 + SPC スキームの IRR 低下リスク。JGB 10y + 米 10y の連動分析、固定金利 vs 変動金利の選択が重要。',
      },
      {
        question: '契約期間中の燃料コスト変動への対応は?',
        answer:
          '燃料費調整制度 (fuel adjustment clause) の契約への組み込み、LNG/原油/石炭インデックスへの連動、固定価格 + 燃料サーチャージ等の選択肢。当社で契約設計支援可能。',
      },
      {
        question: '蓄電池プロジェクトの典型的な契約構造は?',
        answer:
          'Tolling Agreement (容量提供、燃料リスクなし)、Fixed Price PPA (長期固定、為替・金利リスクあり)、Hybrid (部分連動) 等が代表的。プロジェクト規模・オフテイカー業種・地域特性で最適選択が異なります。',
      },
    ],
    ctaPrimary: { label: 'PPA・オフテイク契約相談はこちら', url: '/contact/buyer' },
    ctaSecondary: { label: 'IRR シミュレーターを試す', url: '/tools/irr-simulator' },
  },
  'seller/manufacturer': {
    slug: 'seller/manufacturer',
    type: 'seller',
    title: 'セル・PCS・統合システムメーカー向け｜国内市場規模・競合分布・技術トレンド｜蓄電所ネット',
    description:
      '蓄電池セル・PCS・統合システムメーカー向けハブ。国内市場規模、競合分布、技術トレンド、業界レポート引用機会を提供。エネルギー情報センターが業界中立で支援。',
    ogImage: '/og/seller-manufacturer.png',
    heroH1: '蓄電池メーカーの国内市場戦略を支援する',
    heroSubcopy:
      '日本の蓄電池市場は急成長中。セル・PCS・統合システムメーカー向けに、最新の市場規模、競合分布、技術トレンド、業界レポート引用機会を業界中立で提供します。',
    heroCtaLabel: 'メーカー掲載・取材のご相談',
    heroCtaUrl: '/contact/seller',
    painPoints: [
      {
        icon: '📈',
        title: '国内市場規模・成長率の把握',
        description:
          '蓄電池容量市場、需給調整市場、自家消費市場の規模・成長率を把握する一次情報が散在。業界横断のデータ集約が必須。',
      },
      {
        icon: '🏭',
        title: '競合メーカーの動向追跡',
        description:
          '国内外メーカーの新規参入、技術ロードマップ、価格動向の把握。業界レポート + メーカー DB (8 月公開予定) で詳細分析支援。',
      },
      {
        icon: '🔬',
        title: '技術トレンドへのキャッチアップ',
        description:
          'LFP / NMC / Na イオン / 全固体等の技術トレンド、UL9540A / NFPA855 等の規格動向。AJ 火災事例 DB (5/28 公開) + B-4 消火比較 (9 月) で技術品質向上支援。',
      },
      {
        icon: '📰',
        title: '業界メディアでの可視性確保',
        description:
          '蓄電所ネットの業界レポート 2026 (5/24) + 業界レポート 2027 (12/25) でのメーカー引用機会。技術仕様・実績データの中立的な可視化。',
      },
    ],
    dataReferences: [
      {
        label: '容量市場 約定価格 (メーカー製品需要の指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/capacity-market-clearing-price',
        indicatorIds: ['capacity-market-clearing-price'],
      },
      {
        label: 'JEPX 東京エリア価格 (需要動向)',
        dataUrl: 'https://data.eic-jp.org/catalog/jepx-spot-tokyo',
        indicatorIds: ['jepx-spot-tokyo'],
      },
      {
        label: 'USD/JPY 為替 (輸入セル・PCS のコスト指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/fx-usdjpy-monthly-avg',
        indicatorIds: ['fx-usdjpy-monthly-avg'],
      },
      {
        label: '日本 LNG 輸入価格 (火力代替市場規模指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/fuel-lng-jp-cif',
        indicatorIds: ['fuel-lng-jp-cif'],
      },
    ],
    dataSectionTitle: '蓄電池市場の最新動向 (メーカー意思決定の基礎データ)',
    tools: [
      {
        label: '火災リスク自己診断 (製品安全性確認)',
        url: '/tools/fire-risk-check',
        description: 'メーカー製品の火災リスクを自己診断。UL9540A / NFPA855 準拠の自己評価ツール。',
      },
      {
        label: 'IRR シミュレーター (顧客提案支援)',
        url: '/tools/irr-simulator',
        description:
          'メーカーがエンドユーザーへの提案資料に IRR シミュレーション結果を活用。3 階建て収益モデル対応。',
      },
      {
        label: 'EPC 事業者向けページ',
        url: '/seller/epc',
        description: 'メーカー製品を EPC 事業者へ供給する観点での連携情報。',
      },
    ],
    insightSlugs: ['temp-vs-price', 'lng-vs-price-tokyo', 'fx-decomp-lng-jepx-tokyo'],
    faqs: [
      {
        question: 'メーカー製品の蓄電所ネット掲載基準は?',
        answer:
          'セル・PCS・統合システム製品で UL9540A / IEC 62619 / JIS C 8715-2 等の規格認証を有する製品が対象。技術仕様・実績データの透明性が重要。掲載依頼時に詳細をご相談ください。',
      },
      {
        question: '業界レポートでの製品引用機会は?',
        answer:
          '業界レポート 2026 (5/24 公開) + 業界レポート 2027 (12/25 公開) で、メーカー製品の引用枠あり。技術仕様・市場シェア・実績数値の中立的な引用、メーカー側の事前確認可能。',
      },
      {
        question: 'メーカー DB (8 月公開予定) への登録方法は?',
        answer:
          'メーカー DB は 8/15 頃公開予定 (B-1 機能、業界唯一性 22 達成)。製品スペック・価格レンジ・実績案件の登録枠を準備中。8 月初旬にメーカー向け登録案内を予定。',
      },
      {
        question: '蓄電所ネットの業界メディアとしての位置づけは?',
        answer:
          'エネルギー情報センター (10 年運営) の事業として、業界中立の立場から蓄電池業界の情報インフラを提供。メーカー、EPC、デベロッパー、エンドユーザーすべてに公平な情報提供を方針とします。',
      },
      {
        question: '取材・寄稿の機会は?',
        answer:
          '業界レポート企画、Insight 記事、AJ 火災事例 DB 等で取材機会あり。技術担当者・経営層へのインタビュー、技術論文寄稿の枠を準備中。お問い合わせフォームからご相談ください。',
      },
    ],
    ctaPrimary: { label: 'メーカー掲載・取材のご相談', url: '/contact/seller' },
    ctaSecondary: { label: '業界レポート 2026 を見る', url: '/reports/2026' },
  },
  'seller/epc': {
    slug: 'seller/epc',
    type: 'seller',
    title: 'EPC 事業者向け｜案件規模・地理分布・容量市場/需給調整連動需要｜蓄電所ネット',
    description:
      '蓄電池 EPC 事業者向けハブ。案件規模、地理分布、容量市場・需給調整市場連動の需要動向、実績データ。業界中立で支援。',
    ogImage: '/og/seller-epc.png',
    heroH1: 'EPC 事業者の案件獲得を、業界データで支援する',
    heroSubcopy:
      '蓄電池 EPC 事業者向けに、最新の案件規模・地理分布・容量市場/需給調整市場連動の需要動向を業界中立で提供。掲載・取材・案件マッチング機会も提供します。',
    heroCtaLabel: 'EPC 事業者掲載のご相談',
    heroCtaUrl: '/contact/seller',
    painPoints: [
      {
        icon: '📍',
        title: '案件の地理分布・規模感の把握',
        description:
          '全国の蓄電池プロジェクト案件の地理分布 (10 エリア別)、規模 (MW 級)、稼働時期、オーナー業種の把握が散在情報で困難。',
      },
      {
        icon: '⚡',
        title: '容量市場/需給調整市場連動の需要動向',
        description:
          '容量市場の入札枠拡大、需給調整市場の参入条件変化は EPC 案件数に直結。最新の市場動向を業界中立で提供。',
      },
      {
        icon: '🏗',
        title: '実績・施工事例の中立的な可視化',
        description:
          'EPC 事業者の施工実績・案件規模・技術ノウハウを業界レポート 2026/2027 + 案件 DB (C-3 アグリゲーター、8 月公開) で可視化機会。',
      },
      {
        icon: '🔧',
        title: 'O&M ベンチマーク',
        description:
          'F-4 O&M ベンチマーク (9 月公開予定) で運用保守の業界水準を比較可能、サービス差別化に活用。',
      },
    ],
    dataReferences: [
      {
        label: '容量市場 落札枠 (案件需要指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/capacity-market-volume',
        indicatorIds: ['capacity-market-volume'],
      },
      {
        label: '需給調整市場 約定価格 (参入需要指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/balancing-tertiary2-clearing',
        indicatorIds: ['balancing-tertiary2-clearing'],
      },
      {
        label: 'JEPX 各エリア価格 (地域別需要分布)',
        dataUrl: 'https://data.eic-jp.org/catalog/jepx-spot-tokyo',
        indicatorIds: ['jepx-spot-tokyo', 'jepx-spot-kansai', 'jepx-spot-kyushu'],
      },
      {
        label: '日本 LNG 輸入価格 (火力代替案件需要指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/fuel-lng-jp-cif',
        indicatorIds: ['fuel-lng-jp-cif'],
      },
    ],
    dataSectionTitle: '案件需要動向の最新データ',
    tools: [
      {
        label: '火災リスク自己診断 (提案時の安全性検証)',
        url: '/tools/fire-risk-check',
        description: '施工提案時の火災リスク評価。エンドユーザーへの安全性訴求材料として活用可能。',
      },
      {
        label: '容量市場入札ツール (顧客提案支援)',
        url: '/tools/capacity-market-bid',
        description: 'EPC 事業者が顧客への提案資料に容量市場収益シミュレーションを活用。',
      },
      {
        label: 'IRR シミュレーター',
        url: '/tools/irr-simulator',
        description: '顧客向け IRR 試算、3 階建て収益モデルでの投資判断支援。',
      },
    ],
    insightSlugs: [
      'capacity-market-trend',
      'temp-vs-price',
      'lng-vs-price-tokyo',
      'balancing-tertiary2-vs-jepx',
    ],
    faqs: [
      {
        question: 'EPC 事業者の蓄電所ネット掲載基準は?',
        answer:
          '蓄電池プロジェクトの設計・調達・建設実績を有する EPC 事業者が対象。実績規模、技術ノウハウ、安全管理体制等の情報提供で掲載検討。',
      },
      {
        question: '案件マッチング機能は提供されるか?',
        answer:
          '当面は業界中立の情報提供に注力、案件マッチングは将来検討。但しお問い合わせフォーム経由でエンドユーザーとの接点機会あり。',
      },
      {
        question: '取材・寄稿の機会は?',
        answer:
          '業界レポート、Insight 記事、AJ 火災事例 DB 等で取材機会あり。EPC 視点での技術ノウハウ、施工事例の寄稿枠を準備中。',
      },
      {
        question: 'F-4 O&M ベンチマーク (9 月公開) への参加方法は?',
        answer:
          'F-4 機能は 9/17-9/23 公開予定、業界唯一性 23 達成 (D-4 LCOS 分析と並ぶ)。EPC 事業者の O&M データ提供枠を準備中、8 月後半に案内予定。',
      },
      {
        question: 'メーカー製品の比較情報は?',
        answer:
          'メーカー DB (B-1、8/15 頃公開) + メーカー別スペック比較 (B-1 機能内) で、EPC 事業者の機材選定支援。',
      },
    ],
    ctaPrimary: { label: 'EPC 事業者掲載のご相談', url: '/contact/seller' },
    ctaSecondary: { label: '業界レポート 2026 を見る', url: '/reports/2026' },
  },
  'seller/developer': {
    slug: 'seller/developer',
    type: 'seller',
    title: 'プロジェクトデベロッパー向け｜SPC スキーム・補助金・土地確保｜蓄電所ネット',
    description:
      '蓄電所プロジェクトデベロッパー向けハブ。SPC スキーム、IRR シミュレーション、補助金活用、土地確保、PPA 設計支援。エネルギー情報センターが業界中立で支援。',
    ogImage: '/og/seller-developer.png',
    heroH1: 'プロジェクトデベロッパーの SPC 設計を、業界データで支援',
    heroSubcopy:
      '蓄電所プロジェクトの SPC スキーム設計、IRR シミュレーション、補助金活用、土地確保、PPA 設計まで業界中立で支援。最新のマクロ指標 (為替・金利・燃料) も提供します。',
    heroCtaLabel: 'デベロッパー連携のご相談',
    heroCtaUrl: '/contact/seller',
    painPoints: [
      {
        icon: '🏢',
        title: 'SPC スキーム設計の複雑性',
        description:
          '蓄電池プロジェクトの SPC (特別目的会社) 設計はファイナンス・税務・契約構造が複雑。マクロリスク管理込みの最適化が必須。',
      },
      {
        icon: '💴',
        title: 'プロジェクトファイナンスの金利感応度',
        description:
          '日米金利差・JGB 10y の動向がプロジェクトファイナンスコストに直結。最新のマクロ指標を継続把握。',
      },
      {
        icon: '🏞',
        title: '土地確保・地域連携',
        description:
          '蓄電所立地の土地確保、地元自治体との連携、E-3 自治体条例 (11/21 公開予定、業界唯一性 25 達成) 情報の把握。',
      },
      {
        icon: '💼',
        title: '補助金・優遇税制の活用',
        description:
          '蓄電池導入補助金、再エネ特措法、固定資産税優遇等の最新動向。業界レポート 2026/2027 で詳細解説予定。',
      },
    ],
    dataReferences: [
      {
        label: 'JGB 10y 金利 (プロジェクトファイナンス指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/jgb-10y-yield',
        indicatorIds: ['jgb-10y-yield'],
      },
      {
        label: '米国 10y 金利 (日米金利差)',
        dataUrl: 'https://data.eic-jp.org/catalog/us-treasury-10y',
        indicatorIds: ['us-treasury-10y'],
      },
      {
        label: 'USD/JPY 為替',
        dataUrl: 'https://data.eic-jp.org/catalog/fx-usdjpy-monthly-avg',
        indicatorIds: ['fx-usdjpy-monthly-avg'],
      },
      {
        label: '容量市場 約定価格 (事業性指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/capacity-market-clearing-price',
        indicatorIds: ['capacity-market-clearing-price'],
      },
    ],
    dataSectionTitle: 'プロジェクト開発のマクロ指標 (data.eic-jp.org 提供)',
    tools: [
      {
        label: 'IRR シミュレーター',
        url: '/tools/irr-simulator',
        description:
          'プロジェクトデベロッパーが SPC 設計・投資判断に使用。3 階建て収益モデル + マクロリスク感度分析。',
      },
      {
        label: '容量市場入札ツール',
        url: '/tools/capacity-market-bid',
        description: '容量市場参入を前提とした収益モデル試算。',
      },
      {
        label: 'PPA・オフテイク契約検討 (Buyer Landing)',
        url: '/buyer/ppa-offtake',
        description:
          'PPA・オフテイク契約相手 (Buyer 視点) の検討材料。デベロッパー視点での契約設計支援。',
      },
    ],
    insightSlugs: [
      'jgb-vs-yen-lng',
      'us-jp-rate-vs-usdjpy',
      'fx-decomp-lng-jepx-tokyo',
      'capacity-market-trend',
    ],
    faqs: [
      {
        question: 'プロジェクトデベロッパー向けの主な支援内容は?',
        answer:
          'マクロ指標 (為替・金利・燃料) の最新動向提供、IRR シミュレーション、業界レポートでの事業性データ引用、E-3 自治体条例 (11/21 公開) 情報。SPC スキーム設計の助言は弊社顧問チーム (公認会計士、リク等) でご相談可能。',
      },
      {
        question: 'プロジェクトファイナンスへの金利影響をどう試算するか?',
        answer:
          'JGB 10y + 米 10y の最新動向を IRR シミュレーターに入力、感度分析で金利上昇シナリオの IRR 低下を可視化。マクロリスクヘッジの基礎データ提供。',
      },
      {
        question: '土地確保・自治体連携の支援はあるか?',
        answer:
          'E-3 自治体条例 (11/21 公開予定、業界唯一性 25 達成) で全国の自治体条例情報を集約予定。土地確保時の地元自治体折衝の基礎情報。',
      },
      {
        question: '補助金・税制優遇の最新情報は?',
        answer:
          '業界レポート 2026 (5/24) + 業界レポート 2027 (12/25) で補助金・優遇税制の最新動向を解説予定。緊急性高い場合はお問い合わせフォームから個別相談。',
      },
      {
        question: 'デベロッパー実績の業界メディア掲載機会は?',
        answer:
          '業界レポート、Insight 記事、案件 DB (C-3 アグリゲーター、8 月公開) でデベロッパー実績の掲載枠あり。お問い合わせフォームから掲載相談可能。',
      },
    ],
    ctaPrimary: { label: 'デベロッパー連携のご相談', url: '/contact/seller' },
    ctaSecondary: { label: 'IRR シミュレーターを試す', url: '/tools/irr-simulator' },
  },
  'seller/reuse-secondhand': {
    slug: 'seller/reuse-secondhand',
    type: 'seller',
    title: '中古売買・リユース事業者向け｜EV 2 次利用・劣化曲線・市場規模｜蓄電所ネット',
    description:
      '蓄電池中古売買・リユース事業者向けハブ。EV → 蓄電池 2 次利用、劣化曲線、市場規模、リユース事業の収益モデル。エネルギー情報センターが業界中立で支援。',
    ogImage: '/og/seller-reuse-secondhand.png',
    heroH1: '蓄電池リユース市場の急成長を、業界データで支援',
    heroSubcopy:
      'EV 普及に伴い蓄電池の 2 次利用市場が急成長中。中古売買・リユース事業者向けに、市場規模、劣化曲線、収益モデル、品質基準を業界中立で提供します。',
    heroCtaLabel: 'リユース事業者掲載のご相談',
    heroCtaUrl: '/contact/seller',
    painPoints: [
      {
        icon: '🔋',
        title: 'EV → 蓄電池 2 次利用の市場規模把握',
        description:
          '日本国内の EV 普及台数、退役予定の電池容量、2 次利用転換率の把握が散在情報で困難。業界中立のデータ集約。',
      },
      {
        icon: '📉',
        title: '劣化曲線の実測データ不足',
        description:
          'G-1 劣化曲線実測データ (9/24 公開予定) で、メーカー別・使用条件別の劣化曲線を可視化。リユース価格設定の基礎データ。',
      },
      {
        icon: '💰',
        title: 'リユース事業の収益モデル設計',
        description:
          '中古セルの調達コスト、再生検査・組み直し費用、販売価格、保証期間設計の最適化。業界実例集も提供。',
      },
      {
        icon: '✅',
        title: '品質基準・安全性保証',
        description:
          'UL9540A / IEC 62619 等の規格準拠、火災リスク評価。AJ 火災事例 DB (5/28 公開) で安全性ガイダンス + リユース固有のリスク管理。',
      },
    ],
    dataReferences: [
      {
        label: 'EV 関連市場規模指標 (参考)',
        dataUrl: 'https://data.eic-jp.org/catalog/jepx-spot-tokyo',
        indicatorIds: ['jepx-spot-tokyo'],
      },
      {
        label: 'USD/JPY 為替 (輸入中古セルのコスト指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/fx-usdjpy-monthly-avg',
        indicatorIds: ['fx-usdjpy-monthly-avg'],
      },
      {
        label: '容量市場 約定価格 (リユース蓄電池の参入可能性指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/capacity-market-clearing-price',
        indicatorIds: ['capacity-market-clearing-price'],
      },
      {
        label: '日本 LNG 輸入価格 (自家消費代替市場指標)',
        dataUrl: 'https://data.eic-jp.org/catalog/fuel-lng-jp-cif',
        indicatorIds: ['fuel-lng-jp-cif'],
      },
    ],
    dataSectionTitle: 'リユース市場の関連データ',
    tools: [
      {
        label: '火災リスク自己診断 (リユース蓄電池の安全性検証)',
        url: '/tools/fire-risk-check',
        description:
          'リユース蓄電池の火災リスクを自己診断。UL9540A / NFPA855 準拠、リユース固有のリスク評価項目あり。',
      },
      {
        label: 'IRR シミュレーター (リユース事業の収益試算)',
        url: '/tools/irr-simulator',
        description:
          'リユース蓄電池を用いた自家消費・容量市場参入の収益試算。劣化曲線を考慮したライフサイクル分析。',
      },
      {
        label: 'メーカー向けページ (新品メーカーとの連携)',
        url: '/seller/manufacturer',
        description: '新品メーカーとの連携、技術仕様情報の取得。',
      },
    ],
    insightSlugs: ['temp-vs-price', 'fx-decomp-lng-jepx-tokyo', 'lng-vs-price-tokyo'],
    faqs: [
      {
        question: 'リユース蓄電池事業の市場規模は?',
        answer:
          '日本の EV 普及に伴い、退役 EV 電池の蓄電池 2 次利用市場が 2026 年以降本格化見込み。G-1 劣化曲線実測データ (9/24 公開) + 業界レポート 2027 (12/25) で市場規模・成長率の詳細解説予定。',
      },
      {
        question: '劣化曲線の実測データはいつ公開されるか?',
        answer:
          'G-1 劣化曲線実測データは 9/24 公開予定 (業界唯一性 23 達成タイミング)。メーカー別・使用条件別の劣化曲線データを業界中立で提供、リユース価格設定の基礎データ。',
      },
      {
        question: 'リユース蓄電池の容量市場参入は可能?',
        answer:
          '可能性あり、但し OCCTO 認定基準への適合確認が必須。リユース固有の劣化評価、保証期間の扱いが論点。容量市場入札ツールで参入可能性試算可能。',
      },
      {
        question: '中古セル調達の海外輸入リスクは?',
        answer:
          'USD/JPY 為替変動、輸入規制、品質保証の確保が主要リスク。為替リスクは当ページデータセクションの USD/JPY 動向で継続把握、ヘッジ戦略の検討材料。',
      },
      {
        question: 'リユース事業者の業界メディア掲載機会は?',
        answer:
          '業界レポート 2026/2027、AJ 火災事例 DB、Insight 記事でリユース事業者の事例掲載機会あり。リユース事業者の技術ノウハウ、市場戦略の中立的な可視化。',
      },
    ],
    ctaPrimary: { label: 'リユース事業者掲載のご相談', url: '/contact/seller' },
    ctaSecondary: { label: '火災リスク自己診断を試す', url: '/tools/fire-risk-check' },
  },
};
