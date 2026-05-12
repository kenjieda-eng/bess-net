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
