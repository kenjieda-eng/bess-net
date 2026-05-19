import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';
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
    // v21 追加: 東京電力PG 公開停止解説ページ
    { url: `${siteConfig.url}/grid/tokyo`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteConfig.url}/info`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    // Sprint 2 追加コーナー（依頼AB/AC/AD）
    { url: `${siteConfig.url}/policy-calendar`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
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
    // Sprint X1 Day 1 (Buyer 1 ページ完成例、Day 2-3 で残り 7 ページ追加予定)
    { url: `${siteConfig.url}/buyer/factory-commercial`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
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

  const explainerUrls: MetadataRoute.Sitemap = explainer.map((a) => ({
    url: `${siteConfig.url}/explainer/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  const glossaryUrls: MetadataRoute.Sitemap = glossary.map((g) => ({
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
  const projectUrls: MetadataRoute.Sitemap = projects.map((p) => ({
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
    ...newsUrls,
    ...infoUrls,
    ...explainerUrls,
    ...glossaryUrls,
    ...subsidyUrls,
    ...projectUrls,
    ...operatorUrls,
    ...linkUrls,
    ...substationUrls,
    ...prefectureUrls,
  ];
}
