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
  for (let offset = 0; offset < 5000; offset += limit) {
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
  for (let offset = 0; offset < 5000; offset += limit) {
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
  for (let offset = 0; offset < 5000; offset += limit) {
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
  for (let offset = 0; offset < 5000; offset += limit) {
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
  for (let offset = 0; offset < 5000; offset += limit) {
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
  for (let offset = 0; offset < 5000; offset += limit) {
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
  for (let offset = 0; offset < 5000; offset += limit) {
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
  for (let offset = 0; offset < 5000; offset += limit) {
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
  for (let offset = 0; offset < 5000; offset += limit) {
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

// 一覧ページ用の軽量フィールド（body は除外して ISR fallback サイズを抑制）
const NEWS_LIST_FIELDS =
  'id,title,slug,category,lead,sourceName,sourceUrl,tags,ogImage,publishedAt,updatedAt,createdAt,revisedAt';

export const getAllNews = async (): Promise<News[]> => {
  const all: News[] = [];
  const limit = 100;
  for (let offset = 0; offset < 2000; offset += limit) {
    const data = await client.getList<News>({
      endpoint: 'news',
      queries: {
        limit,
        offset,
        orders: '-publishedAt',
        fields: NEWS_LIST_FIELDS,
      },
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
  for (let offset = 0; offset < 5000; offset += limit) {
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

// =================================================================
// patch_v10_operators_frontend : 事業者ナビ（operators）
// 既存の src/lib/microcms.ts の末尾に追記してください
// =================================================================

// ===== 事業者（operators）の型定義 =====
export type Operator = {
  id: string;
  name: string;
  slug: string;
  nameEn?: string;
  category: string[]; // 複数選択（20カテゴリ）
  corporateType?: string;
  websiteUrl?: string;
  prefecture?: string;
  city?: string;
  foundedYear?: number;
  listedMarket?: string;
  ticker?: string;
  description: string;
  products?: string;
  bessRelation: string;
  body?: string;
  sourceUrl?: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

export const getOperatorList = async (queries?: MicroCMSQueries) => {
  return await client.getList<Operator>({ endpoint: 'operators', queries });
};

export const getAllOperators = async (): Promise<Operator[]> => {
  const all: Operator[] = [];
  const limit = 100;
  // 403件想定 → 余裕を持って 1000 件まで対応
  for (let offset = 0; offset < 2000; offset += limit) {
    const data = await client.getList<Operator>({
      endpoint: 'operators',
      queries: { limit, offset, orders: 'name' },
    });
    all.push(...data.contents);
    if (data.contents.length < limit) break;
  }
  return all;
};

export const getOperatorBySlug = async (
  slug: string
): Promise<Operator | null> => {
  // microCMS では PUT で content-id を指定したため id == slug
  // ただし安全のため filters でも検索可能にする
  try {
    const data = await client.get<Operator>({
      endpoint: 'operators',
      contentId: slug,
    });
    return data;
  } catch {
    // フォールバック：filters で検索
    const data = await client.getList<Operator>({
      endpoint: 'operators',
      queries: { filters: `slug[equals]${slug}`, limit: 1 },
    });
    return data.contents[0] ?? null;
  }
};

export const getAllOperatorSlugs = async (): Promise<{ slug: string }[]> => {
  const slugs: { slug: string }[] = [];
  const limit = 100;
  for (let offset = 0; offset < 2000; offset += limit) {
    const data = await client.getList<Operator>({
      endpoint: 'operators',
      queries: { limit, offset, fields: 'slug' },
    });
    slugs.push(...data.contents.map((o) => ({ slug: o.slug })));
    if (data.contents.length < limit) break;
  }
  return slugs;
};

// =================================================================
// patch_v11_cross_links : クロスリンク連携の追加関数
// 既存の src/lib/microcms.ts の末尾に追記してください
// =================================================================

// ===== relatedOperators / relatedTerms 型拡張 =====
// 既存の News 型は src/lib/microcms.ts に定義済み。
// microCMS は depth=1 でレスポンスに参照先データを展開して返す。
export type NewsWithRelations = News & {
  relatedOperators?: Operator[];
  relatedTerms?: Glossary[];
};

// 用語名 → slug の正規化用に軽量な Map を作るヘルパ
export type TermLite = { term: string; slug: string; english?: string };

export const getGlossaryLiteList = async (): Promise<TermLite[]> => {
  const all: TermLite[] = [];
  const limit = 100;
  for (let offset = 0; offset < 5000; offset += limit) {
    const data = await client.getList<Glossary>({
      endpoint: 'glossary',
      queries: { limit, offset, fields: 'term,slug,english' },
    });
    all.push(
      ...data.contents.map((g) => ({
        term: g.term,
        slug: g.slug,
        english: g.english,
      }))
    );
    if (data.contents.length < limit) break;
  }
  return all;
};

// =================================================================
// 用語集 → ニュース・解説 の逆引き
// =================================================================

/**
 * 指定 glossary id を含むニュースを取得（最新順、limit指定可）
 * microCMS filter: relatedTerms[contains]={glossaryId}
 */
export const getNewsByTermId = async (
  glossaryId: string,
  limit = 10
): Promise<News[]> => {
  try {
    const data = await client.getList<News>({
      endpoint: 'news',
      queries: {
        filters: `relatedTerms[contains]${glossaryId}`,
        orders: '-publishedAt',
        limit,
      },
    });
    return data.contents;
  } catch {
    return [];
  }
};

/**
 * 指定用語名を含む解説を取得（CSV文字列の relatedTerms をフィルタ）
 * microCMS filter: relatedTerms[contains]={termName}
 */
export const getExplainersByTermName = async (
  termName: string,
  limit = 5
): Promise<Explainer[]> => {
  try {
    const data = await client.getList<Explainer>({
      endpoint: 'explainer',
      queries: {
        filters: `relatedTerms[contains]${termName}`,
        orders: '-publishedAt',
        limit,
      },
    });
    return data.contents;
  } catch {
    return [];
  }
};

// =================================================================
// 事業者 → ニュース の逆引き
// =================================================================

/**
 * 指定 operator id を含むニュースを取得
 * microCMS filter: relatedOperators[contains]={operatorId}
 */
export const getNewsByOperatorId = async (
  operatorId: string,
  limit = 10
): Promise<News[]> => {
  try {
    const data = await client.getList<News>({
      endpoint: 'news',
      queries: {
        filters: `relatedOperators[contains]${operatorId}`,
        orders: '-publishedAt',
        limit,
      },
    });
    return data.contents;
  } catch {
    return [];
  }
};

// =================================================================
// 事業者 → プロジェクト の逆引き
// =================================================================

/**
 * 指定事業者名（部分一致）でプロジェクトを取得
 * Project.operator は文字列フィールド。完全一致でなく contains で絞る。
 */
export const getProjectsByOperatorName = async (
  operatorName: string,
  limit = 10
): Promise<Project[]> => {
  if (!operatorName) return [];
  try {
    // 株式会社等を除いた短縮名で検索（例:「株式会社レノバ」→「レノバ」）
    const shortName = operatorName
      .replace(/(株式会社|合同会社|有限会社|（株）|\(株\)|ホールディングス)/g, '')
      .trim();
    const searchName = shortName.length >= 3 ? shortName : operatorName;
    const data = await client.getList<Project>({
      endpoint: 'projects',
      queries: {
        filters: `operator[contains]${searchName}`,
        orders: '-publishedAt',
        limit,
      },
    });
    return data.contents;
  } catch {
    return [];
  }
};

// =================================================================
// 詳細ページ用：関連付き News 取得
// =================================================================

/**
 * News をslugで取得（depth=1で relatedOperators/relatedTerms を展開）
 */
export const getNewsBySlugWithRelations = async (
  slug: string
): Promise<NewsWithRelations | null> => {
  try {
    const data = await client.getList<NewsWithRelations>({
      endpoint: 'news',
      queries: {
        filters: `slug[equals]${slug}`,
        depth: 1,
        limit: 1,
      },
    });
    return data.contents[0] ?? null;
  } catch {
    return null;
  }
};

/* =================================================================
   patch_v13_links_page : お役立ちサイトAPI連携の追加関数
   既存の src/lib/microcms.ts の末尾に追記してください
   ================================================================= */

/* 型定義 */
export type LinkSite = {
  id: string;
  slug: string;
  title: string;
  url: string;
  siteNameEn?: string;
  description: string;
  category: string[];
  country?: string[];
  language?: string[];
  importance?: string[];
  accessType?: string[];
  contentTypes?: string[];
  tags?: string;
  iconUrl?: string;
  lastChecked?: string;
  displayOrder?: number;
  relatedTerms?: Glossary[];
  relatedOperators?: Operator[];
  publishedAt?: string;
  updatedAt?: string;
};

export type LinkSiteLite = {
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string;
  category: string[];
  country?: string[];
  importance?: string[];
  contentTypes?: string[];
  tags?: string;
  displayOrder?: number;
};

const LINK_LIST_FIELDS =
  'id,slug,title,url,description,category,country,importance,contentTypes,tags,displayOrder';

export const getAllLinks = async (): Promise<LinkSiteLite[]> => {
  try {
    const all: LinkSiteLite[] = [];
    let offset = 0;
    while (true) {
      const data = await client.getList<LinkSiteLite>({
        endpoint: 'links',
        queries: { fields: LINK_LIST_FIELDS, limit: 100, offset, orders: 'displayOrder' },
      });
      all.push(...data.contents);
      if (data.contents.length < 100) break;
      offset += 100;
      if (offset >= 1000) break;
    }
    return all;
  } catch {
    return [];
  }
};

export const getLinkBySlug = async (slug: string): Promise<LinkSite | null> => {
  try {
    const data = await client.getList<LinkSite>({
      endpoint: 'links',
      queries: { filters: `slug[equals]${slug}`, depth: 1, limit: 1 },
    });
    return data.contents[0] ?? null;
  } catch {
    return null;
  }
};

export const getAllLinkSlugs = async (): Promise<{ slug: string }[]> => {
  try {
    const links = await getAllLinks();
    return links.map((l) => ({ slug: l.slug }));
  } catch {
    return [];
  }
};
