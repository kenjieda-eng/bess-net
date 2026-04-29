import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Phase 1で追加：
    // { url: `${siteConfig.url}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    // { url: `${siteConfig.url}/glossary`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
