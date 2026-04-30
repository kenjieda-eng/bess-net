import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';
import {
  getAllExplainer,
  getAllGlossary,
  getAllSubsidies,
  getAllProjects,
  getAllNews,
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
    { url: `${siteConfig.url}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/editorial-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteConfig.url}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteConfig.url}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const safeFetch = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
    try { return await fn(); } catch { return []; }
  };

  const [explainer, glossary, subsidies, projects, news] = await Promise.all([
    safeFetch(getAllExplainer),
    safeFetch(getAllGlossary),
    safeFetch(getAllSubsidies),
    safeFetch(getAllProjects),
    safeFetch(getAllNews),
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

  return [
    ...staticUrls,
    ...newsUrls,
    ...explainerUrls,
    ...glossaryUrls,
    ...subsidyUrls,
    ...projectUrls,
  ];
}
