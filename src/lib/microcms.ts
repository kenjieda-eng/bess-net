// microCMS APIクライアント（patch_v6_fix 完全版）
// 環境変数 MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY が必要

import { createClient, type MicroCMSQueries } from 'microcms-js-sdk';

if (!process.env.MICROCMS_SERVICE_DOMAIN) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is not defined');
}
if (!process.env.MICROCMS_API_KEY) {
  throw new Error('MICROCMS_API_KEY is not defined');
}

export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

// ===== 解説記事（explainer）の型定義 =====
export type Explainer = {
  id: string;
  title: string;
  slug: string;
  category: string[]; // microCMS multi-select 仕様（配列）
  lead: string;
  body: string;
  ogImage?: { url: string; height: number; width: number };
  sources?: string;
  relatedTerms?: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

export const getExplainerList = async (queries?: MicroCMSQueries) => {
  return await client.getList<Explainer>({ endpoint: 'explainer', queries });
};
export const getExplainerBySlug = async (
  slug: string
): Promise<Explainer | null> => {
  const data = await client.getList<Explainer>({
    endpoint: 'explainer',
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return data.contents[0] ?? null;
};

// ===== 用語集（glossary）の型定義 =====
export type Glossary = {
  id: string;
  term: string;
  slug: string;
  reading?: string;
  english?: string;
  category: string[];
  shortDef: string;
  detail?: string;
  relatedTerms?: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

export const getGlossaryList = async (queries?: MicroCMSQueries) => {
  return await client.getList<Glossary>({ endpoint: 'glossary', queries });
};

export const getGlossaryBySlug = async (
  slug: string
): Promise<Glossary | null> => {
  const data = await client.getList<Glossary>({
    endpoint: 'glossary',
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return data.contents[0] ?? null;
};

export const getAllGlossary = async (): Promise<Glossary[]> => {
  const all: Glossary[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Glossary>({
      endpoint: 'glossary',
      queries: { limit, offset, orders: 'term' },
    });
    all.push(...data.contents);
    if (data.contents.length < limit) break;
  }
  return all;
};

export const getAllExplainer = async (): Promise<Explainer[]> => {
  const all: Explainer[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Explainer>({
      endpoint: 'explainer',
      queries: { limit, offset },
    });
    all.push(...data.contents);
    if (data.contents.length < limit) break;
  }
  return all;
};

export const getAllGlossarySlugs = async (): Promise<{ slug: string }[]> => {
  const slugs: { slug: string }[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Glossary>({
      endpoint: 'glossary',
      queries: { limit, offset, fields: 'slug' },
    });
    slugs.push(...data.contents.map((g) => ({ slug: g.slug })));
    if (data.contents.length < limit) break;
  }
  return slugs;
};

export const getAllExplainerSlugs = async (): Promise<{ slug: string }[]> => {
  const slugs: { slug: string }[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Explainer>({
      endpoint: 'explainer',
      queries: { limit, offset, fields: 'slug' },
    });
    slugs.push(...data.contents.map((e) => ({ slug: e.slug })));
    if (data.contents.length < limit) break;
  }
  return slugs;
};

export const getGlossaryTermSlugMap = async (): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Glossary>({
      endpoint: 'glossary',
      queries: { limit, offset, fields: 'term,slug,english' },
    });
    for (const g of data.contents) {
      map.set(g.term, g.slug);
      if (g.english) map.set(g.english.toLowerCase(), g.slug);
    }
    if (data.contents.length < limit) break;
  }
  return map;
};

// ===== 補助金（subsidies） =====
export type Subsidy = {
  id: string;
  name: string;
  slug: string;
  organization: string;
  category: string[];
  status: string[];
  subsidyRate?: string;
  upperLimit?: string;
  targetEntity?: string;
  applicationStart?: string;
  deadline?: string;
  fiscalYear?: string;
  sourceUrl?: string;
  scheme?: string;
  body?: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

export const getSubsidyList = async (queries?: MicroCMSQueries) => {
  return await client.getList<Subsidy>({ endpoint: 'subsidies', queries });
};
export const getAllSubsidies = async (): Promise<Subsidy[]> => {
  const all: Subsidy[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Subsidy>({
      endpoint: 'subsidies',
      queries: { limit, offset, orders: 'applicationEnd' },
    });
    all.push(...data.contents);
    if (data.contents.length < limit) break;
  }
  return all;
};
export const getSubsidyBySlug = async (slug: string): Promise<Subsidy | null> => {
  const data = await client.getList<Subsidy>({
    endpoint: 'subsidies',
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return data.contents[0] ?? null;
};
export const getAllSubsidySlugs = async (): Promise<{ slug: string }[]> => {
  const slugs: { slug: string }[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Subsidy>({
      endpoint: 'subsidies',
      queries: { limit, offset, fields: 'slug' },
    });
    slugs.push(...data.contents.map((s) => ({ slug: s.slug })));
    if (data.contents.length < limit) break;
  }
  return slugs;
};

// ===== プロジェクト（projects） =====
export type Project = {
  id: string;
  name: string;
  slug: string;
  status: string[];
  outputMw?: number;
  capacityMwh?: number;
  prefecture?: string;
  city?: string;
  operator?: string;
  epc?: string;
  cod?: string;
  marketParticipation?: string[];
  sourceUrl?: string;
  body?: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

export const getProjectList = async (queries?: MicroCMSQueries) => {
  return await client.getList<Project>({ endpoint: 'projects', queries });
};
export const getAllProjects = async (): Promise<Project[]> => {
  const all: Project[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Project>({
      endpoint: 'projects',
      queries: { limit, offset, orders: '-publishedAt' },
    });
    all.push(...data.contents);
    if (data.contents.length < limit) break;
  }
  return all;
};
export const getProjectBySlug = async (slug: string): Promise<Project | null> => {
  const data = await client.getList<Project>({
    endpoint: 'projects',
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return data.contents[0] ?? null;
};
export const getAllProjectSlugs = async (): Promise<{ slug: string }[]> => {
  const slugs: { slug: string }[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<Project>({
      endpoint: 'projects',
      queries: { limit, offset, fields: 'slug' },
    });
    slugs.push(...data.contents.map((p) => ({ slug: p.slug })));
    if (data.contents.length < limit) break;
  }
  return slugs;
};

// ===== ニュース（news） =====
export type News = {
  id: string;
  title: string;
  slug: string;
  category: string[]; // 配列形式（'編集部', '連系', '投資' 等）
  lead: string;
  body: string;
  sourceName?: string;
  sourceUrl?: string;
  tags?: string;
  ogImage?: { url: string; height: number; width: number };
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

export const getNewsList = async (queries?: MicroCMSQueries) => {
  return await client.getList<News>({ endpoint: 'news', queries });
};

export const getAllNews = async (): Promise<News[]> => {
  const all: News[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<News>({
      endpoint: 'news',
      queries: { limit, offset, orders: '-publishedAt' },
    });
    all.push(...data.contents);
    if (data.contents.length < limit) break;
  }
  return all;
};

export const getNewsBySlug = async (slug: string): Promise<News | null> => {
  const data = await client.getList<News>({
    endpoint: 'news',
    queries: { filters: `slug[equals]${slug}`, limit: 1 },
  });
  return data.contents[0] ?? null;
};

export const getAllNewsSlugs = async (): Promise<{ slug: string }[]> => {
  const slugs: { slug: string }[] = [];
  const limit = 100;
  for (let offset = 0; offset < 1000; offset += limit) {
    const data = await client.getList<News>({
      endpoint: 'news',
      queries: { limit, offset, fields: 'slug' },
    });
    slugs.push(...data.contents.map((n) => ({ slug: n.slug })));
    if (data.contents.length < limit) break;
  }
  return slugs;
};

// =================================================================
// patch_v6_fix : 業界ニュース と 編集部お知らせ の分離関数
// =================================================================

/** 業界ニュースのみ取得（'編集部' カテゴリを除外） → /news で使用 */
export const getIndustryNews = async (): Promise<News[]> => {
  const all = await getAllNews();
  return all.filter(
    (n) => !(n.category && n.category.includes('編集部'))
  );
};

/** お知らせのみ取得（'編集部' カテゴリのみ） → /info で使用 */
export const getSiteInfo = async (): Promise<News[]> => {
  const all = await getAllNews();
  return all.filter(
    (n) => n.category && n.category.includes('編集部')
  );
};

/** お知らせの slug 一覧 → /info/[slug] の generateStaticParams 用 */
export const getSiteInfoSlugs = async (): Promise<{ slug: string }[]> => {
  const all = await getSiteInfo();
  return all.map((n) => ({ slug: n.slug }));
};

/** /news/[slug] の generateStaticParams 用：業界ニュースの slug 一覧 */
export const getIndustryNewsSlugs = async (): Promise<{ slug: string }[]> => {
  const all = await getIndustryNews();
  return all.map((n) => ({ slug: n.slug }));
};
