import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';
import {
  NEWS_HUB_CATEGORIES,
  newsCountByCategory,
  newsYearList,
} from '@/lib/news-utils';
import {
  EXPLAINER_HUB_GROUPS,
  countByGroupUnion,
} from '@/lib/explainer-utils';
import { GLOSSARY_301_SOURCE_SLUGS, GLOSSARY_DISPLAY_EXCLUDED_SLUGS } from '@/lib/glossary-301';
import { isListExcludedProject } from '@/lib/projects-excluded';
import { POLICY_DETAIL_SLUGS } from '@/lib/policy-utils';
import { isLvInvestExplainer } from '@/lib/lv-invest';
import {
  getAllExplainer,
  getAllGlossary,
  getAllSubsidies,
  getAllProjects,
  getIndustryNews,
  getSiteInfo,
  getAllOperators,
  getAllLinks,
  getAllSubstations,
  getAvailablePrefectures,
} from '@/lib/microcms';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteConfig.url}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteConfig.url}/explainer`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/glossary`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/subsidies`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/operators`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/links`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/grid`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/grid/tohoku`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/grid/hokuriku`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/grid/shikoku`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // Phase 2A 追加
    { url: `${siteConfig.url}/grid/kansai`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/grid/chugoku`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/grid/okinawa`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // Phase 2B 追加
    { url: `${siteConfig.url}/grid/hokkaido`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // Phase 2-C-1 追加
    { url: `${siteConfig.url}/grid/chubu`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // Phase 3 追加: 九州エリアページ
    { url: `${siteConfig.url}/grid/kyushu`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // v24 追加: 変電所名フリーテキスト検索ページ
    { url: `${siteConfig.url}/grid/search`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // v25 追加: 都道府県インデックス
    { url: `${siteConfig.url}/grid/prefecture`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Phase 4-pre 追加: 中部Leafletマップページ
    { url: `${siteConfig.url}/grid/chubu/map`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    // 東京電力PG エリアデータページ（2026/6 収録）＋ 公開停止・再開の経緯ページ
    { url: `${siteConfig.url}/grid/tokyo`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/grid/tokyo/status`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteConfig.url}/info`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    // 稼働中蓄電所ご紹介（静的1枚ページ・/info 一覧は microCMS 由来のため明示追加、2026-07-11）
    { url: `${siteConfig.url}/info/operating-bess-introduction`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    // 入口再設計 3分岐LP（2026-07-15）
    { url: `${siteConfig.url}/start/buy`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteConfig.url}/start/sell`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteConfig.url}/start/partner`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // 低圧クラスタ Stage1（2026-07-18）
    { url: `${siteConfig.url}/lv`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/lv/what-is`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/lv/revenue-model`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // 低圧クラスタ Stage2（2026-07-19）
    { url: `${siteConfig.url}/lv/buying-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/lv/risks`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // 低圧クラスタ Stage3（2026-07-19・シリーズ6本完結）
    { url: `${siteConfig.url}/lv/entry-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/lv/regulation-subsidy`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // 低圧投資家ガイド W1（2026-07-20・入口ハブ）
    { url: `${siteConfig.url}/lv/invest`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    // Sprint 2 追加コーナー（依頼AB/AC/AD）
    { url: `${siteConfig.url}/policy-calendar`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    // P1: 政策イベント詳細（充実9件のみ SSG・POLICY_DETAIL_SLUGS と同期）
    ...POLICY_DETAIL_SLUGS.map((s) => ({
      url: `${siteConfig.url}/policy-calendar/${s}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    { url: `${siteConfig.url}/events`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    // Sprint 3 追加 (依頼AM、業界唯一 IRR シミュレーター)
    { url: `${siteConfig.url}/tools`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteConfig.url}/tools/irr-simulator`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // Sprint 4 追加 (依頼AO、業界唯一 補助金マッチング)
    { url: `${siteConfig.url}/tools/subsidy-match`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    // Sprint 4 Day 2 (依頼AR、業界唯一 系統連系診断)
    { url: `${siteConfig.url}/tools/grid-connection-check`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    // Sprint 4 Day 3 (依頼AS、業界唯一 火災リスク自己診断、教育型)
    { url: `${siteConfig.url}/tools/fire-risk-check`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // Sprint 4 Day 4 (依頼AT、業界唯一 容量市場応札試算、モック版)
    { url: `${siteConfig.url}/tools/capacity-market-bid`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // Sprint 4 後半 (業界分析 4ハブ集約 index)
    { url: `${siteConfig.url}/industry`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // Sprint 5 開始準備 (業界レポート2026 プレビュー版)
    { url: `${siteConfig.url}/reports`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/reports/2026`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // Sprint 5 開始準備 (火災・トラブル事例DB シード版)
    { url: `${siteConfig.url}/incidents`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // Buyer プレイヤー別 4ページ (2026-05-25 再設計、priority 0.9)
    { url: `${siteConfig.url}/buyer/new-entry`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/buyer/investor`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/buyer/landowner`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/buyer/factory-commercial`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    // Buyer 収益深掘り (市場別、残置 priority 0.7)
    { url: `${siteConfig.url}/buyer/capacity-market`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/buyer/balancing-market`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/buyer/ppa-offtake`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/seller/manufacturer`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/seller/epc`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/seller/developer`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/seller/reuse-secondhand`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    // 達成記念ページ (5/22 機能完全形達成準備、L-029 先回り起草)
    { url: `${siteConfig.url}/milestones`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/milestones/2026-05-22-feature-complete`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteConfig.url}/milestones/2026-05-24-industry-report-2026`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/milestones/2026-05-28-aj-fire-database`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/milestones/2026-06-11-vip-citation`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Sprint 4 後半 (依頼AP、業界唯一 業界カオスマップ)
    { url: `${siteConfig.url}/map/industry-chaos`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // Sprint 4 後半 (依頼AN、業界唯一 JEPX ハブ)
    { url: `${siteConfig.url}/market/jepx`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    // EIC Data 統合 (マーケットデータダッシュボード、29 系列)
    { url: `${siteConfig.url}/dashboard/market`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    // Sprint 4 後半 (依頼BC、業界唯一 海外5市場ハブ)
    { url: `${siteConfig.url}/global`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteConfig.url}/global/us`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/global/eu`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/global/cn`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/global/in`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/global/au`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // Sprint 4 後半 (依頼BF、業界唯一 トラッカー4種)
    { url: `${siteConfig.url}/tracker`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteConfig.url}/tracker/subsidy`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteConfig.url}/tracker/grid`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteConfig.url}/tracker/ag`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteConfig.url}/tracker/pf`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    // 2026-05-28 需給調整 約定価格トラッカー (業界唯一性 #15)
    { url: `${siteConfig.url}/tracker/imbalance`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    // Task 51 追加: /contact 6ページ (index + 5区分)
    { url: `${siteConfig.url}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/contact/buyer`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/contact/seller`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/contact/media`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/contact/investor`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/contact/advisor`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Sprint 6 追加: /anken 流通案件サンプルページ（2026-06-10 index公開）
    { url: `${siteConfig.url}/anken`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteConfig.url}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/editorial-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteConfig.url}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const safeFetch = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
    try { return await fn(); } catch { return []; }
  };

  const [explainer, glossary, subsidies, projects, news, info, operators, links, substations, prefectures] = await Promise.all([
    safeFetch(getAllExplainer),
    safeFetch(getAllGlossary),
    safeFetch(getAllSubsidies),
    safeFetch(getAllProjects),
    safeFetch(getIndustryNews),
    safeFetch(getSiteInfo),
    safeFetch(getAllOperators),
    safeFetch(getAllLinks),
    safeFetch(() => getAllSubstations()),
    safeFetch(getAvailablePrefectures),
  ]);

  // 低圧投資家ガイド記事は /explainer には出さず /lv/invest/[slug] を正とする（W2・canonical と整合）
  const explainerPublic = explainer.filter((a) => !isLvInvestExplainer(a));
  const explainerUrls: MetadataRoute.Sitemap = explainerPublic.map((a) => ({
    url: `${siteConfig.url}/explainer/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  // 低圧投資家ガイド 記事（/lv/invest/[slug]・W2）
  const lvInvestUrls: MetadataRoute.Sitemap = explainer
    .filter((a) => isLvInvestExplainer(a))
    .map((a) => ({
      url: `${siteConfig.url}/lv/invest/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  // カテゴリ別 SSRハブ（/explainer/category/[category]・件数>0のみ・/news ハブと同方式）
  const explainerGroupCounts = countByGroupUnion(explainerPublic);
  const explainerCategoryUrls: MetadataRoute.Sitemap = EXPLAINER_HUB_GROUPS.filter(
    (g) => (explainerGroupCounts[g] || 0) > 0
  ).map((g) => ({
    url: `${siteConfig.url}/explainer/category/${encodeURIComponent(g)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  // 301統合済スラッグは sitemap から除外（L-EIC-021）
  // P1 batch1 追加（2026-06-19）: Rule A 30件 + Rule B 100件 + 既存 2件 = 132件
  const GLOSSARY_SITEMAP_DENYLIST = new Set([
    // 低圧クラスタ Stage5（2026-07-19）: 低圧リソース重複解消（301→low-voltage-resource-term）
    'low-voltage-resource',
    // 既存（§3.5 炭素価格クラスタ）
    'eu-ets-detail', 'carbon-pricing-detail',
    // Rule A: -detail スタブ
    'capex-detail', 'ccs-detail', 'curtailment-detail', 'c-rate-detail', 'dscr-detail',
    'eu-battery-regulation-detail', 'iec-detail', 'ieee-detail', 'iot-detail',
    'mezzanine-detail', 'npv-detail', 'opex-detail', 'ppa-detail', 're100-detail',
    'scada-detail', 'spinning-reserve-detail', 'v2l-detail', 'aggregator-detail',
    'operating-lease-detail', 'green-bond-detail', 'container-bess-detail',
    'corporate-ppa-detail', 'finance-lease-detail', 'microgrid-detail', 'substation-detail',
    'tokyo-subsidy-detail', 'offshore-wind-detail', 'grid-scale-battery-detail',
    'decarbonization-leading-region-detail', 'battery-passport-detail',
    // Rule B: term 正規化重複
    'ah-detail',
    'bcp-detail', 'bcp-business-continuity-plan',
    'bems',
    'bess-battery-energy-storage-system', 'bess-detail-2',
    'bms-detail', 'bms-battery-management-system',
    'blackstart-detail',
    'bloomberg-nef',
    'caiso-california',
    'derms-detail',
    'dod-depth-of-discharge',
    'dr-demand-response', 'dr-detail',
    'ems-detail', 'ems-energy-management-system',
    'ercot-texas',
    'ess-detail',
    'enerc-catl-product',
    'ferc-usa',
    'ffr',
    'frt',
    'gwh-detail',
    'hems',
    'iea-international',
    'ira-usa-detail',
    'irr',
    'j-credit-japan',
    'jera-japan',
    'lfp-battery-detail',
    'mtbf-mean-time-between-failures',
    'mttr-mean-time-to-repair',
    'mwh-detail',
    'nedo',
    'om-operation-maintenance',
    'occto-japan-org', 'occto',
    'pbt',
    'pcs-detail',
    'pjm-interconnection',
    'powertitan-sungrow',
    'repower-eu',
    'rul-remaining-life',
    'sii',
    'sla-detail',
    'soc-state-of-charge',
    'soh-state-of-health',
    'spc', 'spc-special-purpose',
    'sustech-japan-ems',
    'tcfd-disclosure',
    'tensor-energy-ems',
    'ul-9540a-standard',
    'ul-9540-standard',
    'v2g-detail',
    'v2h-detail',
    'v2x-vehicle-to-x',
    'vpp-detail', 'vpp-virtual-power-plant',
    'kwh-unit-detail',
    'imbalance-fee-detail',
    'infra-fund',
    'gas-venting',
    'cobalt-resource',
    'day-ahead-market',          // #93 反転: spot-market が canonical
    'nickel-resource',
    'peak-cutting',
    'peak-shifting',
    'main-auction-jp',
    'lithium-resource',
    'tso-japan-detail',
    'mitsubishi-corporation',
    'marubeni-japan',
    'itochu-corporation',
    'sumitomo-corporation',
    'renewable-special-law',
    'renewable-surcharge',
    'fc-frequency-conv',
    'capacity-procurement-contract-amount',
    'performance-warranty',
    'fire-service-law',
    'specified-wholesale-supply-business',
    'ministry-of-environment',
    'dispatch-resource',         // #112 反転: dispatch-command-source が canonical
    'power-generation-business',
    'availability-rate',
    'jeac-9701',
    'meti',
    'earthquake-resistant-design',
    'local-subsidy',
    'chikudensho',
    'trial-operation',
    'additional-auction-jp',
    'kansai-electric',
    'setback-distance', 'separation-distance', // #123 反転: fire-separation-distance が canonical
    'chief-engineer-elec',
    'electricity-business-law',
    'non-fossil-value-market',
    // P1 batch2: Rule C — english 正規化重複統合（2026-06-21）
    // 除外: lfp / transformer-ai
    'cbi-standard-2',
    'fit-feed-in-tariff',
    'tesla-megapack-product',
    're100-detail-2', 're100-japan',
    'non-firm-detail',
    'multi-use-detail',
  ]);
  const glossaryUrls: MetadataRoute.Sitemap = glossary
    // P4 B-3: GLOSSARY_301 元slugは自動除外（手動DENYLISTとのunion・追補時の反映漏れ防止 L-EIC-021）
    .filter((g) => !GLOSSARY_SITEMAP_DENYLIST.has(g.slug) && !GLOSSARY_301_SOURCE_SLUGS.has(g.slug) && !GLOSSARY_DISPLAY_EXCLUDED_SLUGS.has(g.slug))
    .map((g) => ({
      url: `${siteConfig.url}/glossary/${g.slug}`,
      lastModified: new Date(g.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  const subsidyUrls: MetadataRoute.Sitemap = subsidies.map((s) => ({
    url: `${siteConfig.url}/subsidies/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
  // B-1 sitemap衛生（#109拡張・2026-08-07）: 301統合元（middlewareが301）と noindex（EXCLUDED）を除外
  const projectUrls: MetadataRoute.Sitemap = projects
    .filter((p) => !isListExcludedProject(p.slug))
    .map((p) => ({
      url: `${siteConfig.url}/projects/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  const newsUrls: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${siteConfig.url}/news/${n.slug}`,
    lastModified: new Date(n.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  // カテゴリ別・年別 SSRハブ（/news/category/[category], /news/archive/[year]）
  // 件数>0 のみ収録。非ASCIIカテゴリは encodeURIComponent（sitemap の URL は実 URL）。
  const newsCatCounts = newsCountByCategory(news);
  const newsCategoryUrls: MetadataRoute.Sitemap = NEWS_HUB_CATEGORIES.filter(
    (c) => (newsCatCounts[c] || 0) > 0
  ).map((c) => ({
    url: `${siteConfig.url}/news/category/${encodeURIComponent(c)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  const newsYearUrls: MetadataRoute.Sitemap = newsYearList(news).map((y) => ({
    url: `${siteConfig.url}/news/archive/${y.year}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
  const infoUrls: MetadataRoute.Sitemap = info.map((n) => ({
    url: `${siteConfig.url}/info/${n.slug}`,
    lastModified: new Date(n.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));
  const operatorUrls: MetadataRoute.Sitemap = operators.map((o) => ({
    url: `${siteConfig.url}/operators/${o.slug}`,
    lastModified: new Date(o.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  const linkUrls: MetadataRoute.Sitemap = links.map((l) => ({
    url: `${siteConfig.url}/links/${l.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  const substationUrls: MetadataRoute.Sitemap = substations.map((s) => ({
    url: `${siteConfig.url}/grid/${s.slug}`,
    lastModified: s.last_updated ? new Date(s.last_updated) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  // v25: 都道府県別ページ
  const prefectureUrls: MetadataRoute.Sitemap = prefectures.map((p) => ({
    url: `${siteConfig.url}/grid/prefecture/${encodeURIComponent(p)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticUrls,
    ...newsCategoryUrls,
    ...newsYearUrls,
    ...newsUrls,
    ...infoUrls,
    ...explainerCategoryUrls,
    ...explainerUrls,
    ...lvInvestUrls,
    ...glossaryUrls,
    ...subsidyUrls,
    ...projectUrls,
    ...operatorUrls,
    ...linkUrls,
    ...substationUrls,
    ...prefectureUrls,
  ];
}
