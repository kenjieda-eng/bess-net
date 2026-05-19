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
    title: '容量市場参加検討｜kW 価値で安定収益 - 蓄電所ネット',
    description: '容量市場参加を検討中の事業者向け (5/20 投入文面 41 で本実装予定)',
    heroH1: '【5/20 本実装予定】容量市場参加で安定収益',
    heroSubcopy: '5/20 朝の投入文面 41 で詳細追記予定。',
    heroCtaLabel: '無料相談はこちら',
    heroCtaUrl: '/contact/buyer',
    painPoints: [],
    dataReferences: [],
    dataSectionTitle: '業界の現状を数字で見る',
    tools: [],
    insightSlugs: [],
    faqs: [],
    ctaPrimary: { label: '無料相談はこちら', url: '/contact/buyer' },
  },
  'buyer/balancing-market': {
    slug: 'buyer/balancing-market',
    type: 'buyer',
    title: '需給調整市場参加検討 - 蓄電所ネット',
    description: '需給調整市場参加を検討中の事業者向け (5/20 投入文面 41 で本実装予定)',
    heroH1: '【5/20 本実装予定】需給調整市場参加',
    heroSubcopy: '5/20 朝の投入文面 41 で詳細追記予定。',
    heroCtaLabel: '無料相談はこちら',
    heroCtaUrl: '/contact/buyer',
    painPoints: [],
    dataReferences: [],
    dataSectionTitle: '業界の現状を数字で見る',
    tools: [],
    insightSlugs: [],
    faqs: [],
    ctaPrimary: { label: '無料相談はこちら', url: '/contact/buyer' },
  },
  'buyer/ppa-offtake': {
    slug: 'buyer/ppa-offtake',
    type: 'buyer',
    title: 'PPA・オフテイク契約検討 - 蓄電所ネット',
    description: 'PPA・オフテイク契約を検討中の事業者向け (5/20 投入文面 41 で本実装予定)',
    heroH1: '【5/20 本実装予定】PPA・オフテイク契約',
    heroSubcopy: '5/20 朝の投入文面 41 で詳細追記予定。',
    heroCtaLabel: '無料相談はこちら',
    heroCtaUrl: '/contact/buyer',
    painPoints: [],
    dataReferences: [],
    dataSectionTitle: '業界の現状を数字で見る',
    tools: [],
    insightSlugs: [],
    faqs: [],
    ctaPrimary: { label: '無料相談はこちら', url: '/contact/buyer' },
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
