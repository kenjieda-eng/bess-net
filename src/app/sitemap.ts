import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';
import { getAllExplainer, getAllGlossary } from '@/lib/microcms';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteConfig.url}/explainer`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/glossary`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/editorial-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteConfig.url}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  // 解説記事
  let explainerUrls: MetadataRoute.Sitemap = [];
  try {
    const items = await getAllExplainer();
    explainerUrls = items.map((a) => ({
      url: `${siteConfig.url}/explainer/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    // microCMS取得失敗時は空のまま
  }

  // 用語集
  let glossaryUrls: MetadataRoute.Sitemap = [];
  try {
    const items = await getAllGlossary();
    glossaryUrls = items.map((g) => ({
      url: `${siteConfig.url}/glossary/${g.slug}`,
      lastModified: new Date(g.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (e) {
    // microCMS未設定時は空のまま
  }

  return [...staticUrls, ...explainerUrls, ...glossaryUrls];
}
