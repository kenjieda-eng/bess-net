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
    title: 'メーカー向けハブ - 蓄電所ネット',
    description: 'セル・PCS・統合システムメーカー向け (5/21 投入文面 43 で本実装予定)',
    heroH1: '【5/21 本実装予定】メーカー向けハブ',
    heroSubcopy: '5/21 朝の投入文面 43 で詳細追記予定。',
    heroCtaLabel: '掲載・取材のご相談はこちら',
    heroCtaUrl: '/contact/seller',
    painPoints: [],
    dataReferences: [],
    dataSectionTitle: '業界の現状を数字で見る',
    tools: [],
    insightSlugs: [],
    faqs: [],
    ctaPrimary: { label: '掲載・取材のご相談はこちら', url: '/contact/seller' },
  },
  'seller/epc': {
    slug: 'seller/epc',
    type: 'seller',
    title: 'EPC 事業者向けハブ - 蓄電所ネット',
    description: 'EPC 事業者向け (5/21 投入文面 43 で本実装予定)',
    heroH1: '【5/21 本実装予定】EPC 事業者向けハブ',
    heroSubcopy: '5/21 朝の投入文面 43 で詳細追記予定。',
    heroCtaLabel: '掲載・取材のご相談はこちら',
    heroCtaUrl: '/contact/seller',
    painPoints: [],
    dataReferences: [],
    dataSectionTitle: '業界の現状を数字で見る',
    tools: [],
    insightSlugs: [],
    faqs: [],
    ctaPrimary: { label: '掲載・取材のご相談はこちら', url: '/contact/seller' },
  },
  'seller/developer': {
    slug: 'seller/developer',
    type: 'seller',
    title: 'プロジェクトデベロッパー向けハブ - 蓄電所ネット',
    description: 'プロジェクトデベロッパー向け (5/21 投入文面 43 で本実装予定)',
    heroH1: '【5/21 本実装予定】プロジェクトデベロッパー向けハブ',
    heroSubcopy: '5/21 朝の投入文面 43 で詳細追記予定。',
    heroCtaLabel: '掲載・取材のご相談はこちら',
    heroCtaUrl: '/contact/seller',
    painPoints: [],
    dataReferences: [],
    dataSectionTitle: '業界の現状を数字で見る',
    tools: [],
    insightSlugs: [],
    faqs: [],
    ctaPrimary: { label: '掲載・取材のご相談はこちら', url: '/contact/seller' },
  },
  'seller/reuse-secondhand': {
    slug: 'seller/reuse-secondhand',
    type: 'seller',
    title: '中古売買・リユース事業者向けハブ - 蓄電所ネット',
    description: '中古売買・リユース事業者向け (5/21 投入文面 43 で本実装予定)',
    heroH1: '【5/21 本実装予定】中古売買・リユース事業者向けハブ',
    heroSubcopy: '5/21 朝の投入文面 43 で詳細追記予定。',
    heroCtaLabel: '掲載・取材のご相談はこちら',
    heroCtaUrl: '/contact/seller',
    painPoints: [],
    dataReferences: [],
    dataSectionTitle: '業界の現状を数字で見る',
    tools: [],
    insightSlugs: [],
    faqs: [],
    ctaPrimary: { label: '掲載・取材のご相談はこちら', url: '/contact/seller' },
  },
};
