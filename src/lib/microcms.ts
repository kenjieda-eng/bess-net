// microCMS APIクライアント
// 環境変数 MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY が必要
// Vercelの環境変数に登録済みであること

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
  category: string;
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

// ===== 解説記事の取得関数 =====

/** 解説記事一覧を取得 */
export const getExplainerList = async (queries?: MicroCMSQueries) => {
  return await client.getList<Explainer>({
    endpoint: 'explainer',
    queries,
  });
};

/** スラッグで個別の解説記事を取得 */
export const getExplainerBySlug = async (
  slug: string
): Promise<Explainer | null> => {
  const data = await client.getList<Explainer>({
    endpoint: 'explainer',
    queries: {
      filters: `slug[equals]${slug}`,
      limit: 1,
    },
  });
  return data.contents[0] ?? null;
};

// ===== 用語集（glossary）の型定義 =====
export type Glossary = {
  id: string;
  term: string;        // 用語（例: 系統用蓄電池）
  slug: string;        // URLスラッグ（例: grid-scale-bess）
  reading?: string;    // 読み（例: けいとうようちくでんち）
  english?: string;    // 英語（例: Grid-Scale Battery）
  category: string[];  // カテゴリ（基礎/市場制度/技術/事業/法務/その他 など）
  shortDef: string;    // 一言定義（30〜60字）
  detail?: string;     // 詳細解説（HTML）
  relatedTerms?: string; // 関連用語（カンマ区切りまたはslug配列）
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

// ===== 用語集の取得関数 =====

/** 用語集一覧を取得 */
export const getGlossaryList = async (queries?: MicroCMSQueries) => {
  return await client.getList<Glossary>({
    endpoint: 'glossary',
    queries,
  });
};

/** スラッグで個別の用語を取得 */
export const getGlossaryBySlug = async (
  slug: string
): Promise<Glossary | null> => {
  const data = await client.getList<Glossary>({
    endpoint: 'glossary',
    queries: {
      filters: `slug[equals]${slug}`,
      limit: 1,
    },
  });
  return data.contents[0] ?? null;
};

/** 全用語を取得（ページング対応・最大1000件） */
export const getAllGlossary = async (): Promise<Glossary[]> => {
  const all: Glossary[] = [];
  const limit = 100; // microCMSの上限
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

/** 全解説記事を取得（ページング対応） */
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

/** 全用語のslugを取得（generateStaticParams用、軽量） */
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

/** 全解説記事のslugを取得 */
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

/** 用語名→slugのマッピングを取得（関連用語リンク化用） */
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
      if (g.english) {
        map.set(g.english.toLowerCase(), g.slug);
      }
    }
    if (data.contents.length < limit) break;
  }
  return map;
};

// ===== 補助金（subsidies）の型定義 =====
export type Subsidy = {
  id: string;
  name: string;            // 補助金名
  slug: string;            // URL用slug
  organization: string;    // 執行機関
  category: string[];      // ['国・経産省系'/'SII'/'NEDO'/'環境省'/'自治体']
  target?: string;         // 対象
  subsidyRate?: string;    // 補助率
  maxAmount?: number;      // 上限額（円）
  applicationStart?: string; // 公募開始 YYYY-MM-DD
  applicationEnd?: string;   // 公募終了
  status: string[];        // ['公募中'/'予告'/'採択済'/'終了']
  officialUrl?: string;    // 公式URL
  detail?: string;         // 詳細解説（HTML）
  note?: string;           // 備考
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

/** 補助金一覧を取得（公募中優先） */
export const getSubsidyList = async (queries?: MicroCMSQueries) => {
  return await client.getList<Subsidy>({
    endpoint: 'subsidies',
    queries,
  });
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

// ===== プロジェクト（projects）の型定義 =====
export type Project = {
  id: string;
  name: string;            // プロジェクト名
  slug: string;            // URL用slug
  status: string[];        // ['計画中'/'接続検討中'/'建設中'/'稼働中'/'廃止']
  outputMw?: number;       // 定格出力 MW
  capacityMwh?: number;    // 容量 MWh
  prefecture?: string;     // 都道府県
  city?: string;           // 市町村
  operator?: string;       // 事業者
  epc?: string;            // EPC
  commercialOperationDate?: string; // 運転開始予定
  marketParticipation?: string[];   // ['容量'/'需給調整'/'JEPX']
  sourceUrl?: string;      // 出典URL
  fetchedDate?: string;    // 取得日
  detail?: string;         // 詳細（HTML）
  note?: string;
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

// ===== ニュース（news）の型定義 =====
export type News = {
  id: string;
  title: string;
  slug: string;
  category: string[];      // ['連系'/'補助金'/'制度'/'事故'/'人事'/'投資'/'編集部']
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
