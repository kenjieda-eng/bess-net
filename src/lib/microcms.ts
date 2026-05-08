// microCMS APIクライアント（patch_v6_fix 完全版）
// 環境変数 MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY が必要

import { createClient, type MicroCMSQueries } from 'microcms-js-sdk';
import { MICROCMS_MAX_OFFSET, MICROCMS_PAGE_LIMIT } from './constants';

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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  // 403件想定 → 余裕を持って 1000 件まで対応
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
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
        queries: { fields: LINK_LIST_FIELDS, limit: MICROCMS_PAGE_LIMIT, offset, orders: 'displayOrder' },
      });
      all.push(...data.contents);
      if (data.contents.length < MICROCMS_PAGE_LIMIT) break;
      offset += MICROCMS_PAGE_LIMIT;
      if (offset >= MICROCMS_MAX_OFFSET) break;
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

/* =================================================================
   Phase 1: 系統空き容量DB (substations) — 1,449件
   - microCMS フィールドは 20字制限のショートキー (cap_*, op_*, oc_*)
   - select 系は配列 (operator/area/voltage_class/oc_possibility/data_source_format)
   - relation は空配列で初期投入済み
   ================================================================= */

export type Substation = {
  id: string;
  slug: string;
  name: string;
  operator: string[];
  area: string[];
  prefecture?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  voltage_primary_kv?: number;
  voltage_secondary_kv?: number;
  voltage_class?: string[];
  units?: number;
  capacity_total_mw?: number;
  cap_operational_mw?: number;
  op_constraint?: string;
  forecast_flow_mw?: number;
  cap_avail_mw?: number;
  cap_avail_upper_mw?: number;
  n1_eligible?: boolean;
  n1_capacity_mw?: number;
  oc_possibility?: string[];
  oc_target_self?: string;
  oc_target_upper?: string;
  external_id?: string;
  non_firm_eligible?: boolean;
  reinforcement_plan?: string;
  conn_cost_typical?: string;
  control_frequency?: number;
  notes?: string;
  source_url: string;
  data_source_format?: string[];
  last_updated?: string;
  fetched_at?: string;
  relatedOperators?: Operator[];
  relatedNews?: News[];
  relatedTerms?: Glossary[];
  relatedSubsidies?: Subsidy[];
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

const SUBSTATION_LIST_FIELDS =
  'id,slug,name,operator,area,prefecture,voltage_primary_kv,voltage_secondary_kv,voltage_class,units,capacity_total_mw,cap_operational_mw,cap_avail_mw,cap_avail_upper_mw,n1_eligible,n1_capacity_mw,oc_possibility,non_firm_eligible,source_url,last_updated,fetched_at';

type SubstationListOpts = {
  limit?: number;
  offset?: number;
  area?: string;
  operator?: string;
  fields?: string;
  orders?: string;
};

export const getSubstationList = async (
  opts: SubstationListOpts = {}
): Promise<{ contents: Substation[]; totalCount: number }> => {
  const queries: MicroCMSQueries = {
    limit: opts.limit ?? 100,
    offset: opts.offset ?? 0,
    fields: opts.fields ?? SUBSTATION_LIST_FIELDS,
    orders: opts.orders ?? 'name',
  };
  const filters: string[] = [];
  if (opts.area) filters.push(`area[contains]${opts.area}`);
  if (opts.operator) filters.push(`operator[contains]${opts.operator}`);
  if (filters.length) queries.filters = filters.join('[and]');
  try {
    const data = await client.getList<Substation>({
      endpoint: 'substations',
      queries,
    });
    return { contents: data.contents, totalCount: data.totalCount ?? 0 };
  } catch {
    return { contents: [], totalCount: 0 };
  }
};

export const getAllSubstations = async (
  opts: { area?: string; operator?: string } = {}
): Promise<Substation[]> => {
  const all: Substation[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  // 落とし穴 #48: offset 上限は MICROCMS_MAX_OFFSET（共通定数）で一元管理
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    const { contents } = await getSubstationList({
      limit,
      offset,
      area: opts.area,
      operator: opts.operator,
    });
    all.push(...contents);
    if (contents.length < limit) break;
  }
  return all;
};

export const getSubstationBySlug = async (
  slug: string
): Promise<Substation | null> => {
  try {
    const data = await client.get<Substation>({
      endpoint: 'substations',
      contentId: slug,
      queries: { depth: 1 },
    });
    return data;
  } catch {
    // Fallback: filter
    try {
      const data = await client.getList<Substation>({
        endpoint: 'substations',
        queries: { filters: `slug[equals]${slug}`, depth: 1, limit: 1 },
      });
      return data.contents[0] ?? null;
    } catch {
      return null;
    }
  }
};

export const getAllSubstationSlugs = async (): Promise<{ slug: string }[]> => {
  const slugs: { slug: string }[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  // 落とし穴 #48: offset 上限は MICROCMS_MAX_OFFSET（共通定数）で一元管理
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    try {
      const data = await client.getList<Substation>({
        endpoint: 'substations',
        queries: { limit, offset, fields: 'slug' },
      });
      slugs.push(...data.contents.map((s) => ({ slug: s.slug })));
      if (data.contents.length < limit) break;
    } catch {
      break;
    }
  }
  return slugs;
};

export const getSubstationsByArea = async (
  area: string,
  limit = 100
): Promise<Substation[]> => {
  const { contents } = await getSubstationList({ area, limit });
  return contents;
};

export const getSubstationsByOperator = async (
  operator: string,
  limit = 100
): Promise<Substation[]> => {
  const { contents } = await getSubstationList({ operator, limit });
  return contents;
};

/** 関連事業者の自動マッチ：operator フィールドにマッチする事業者を上位 N 社 */
export const getRelatedOperatorsForSubstation = async (
  operatorName: string,
  limit = 5
): Promise<Operator[]> => {
  if (!operatorName) return [];
  try {
    const data = await client.getList<Operator>({
      endpoint: 'operators',
      queries: {
        filters: `name[contains]${operatorName}`,
        limit,
        fields: 'id,slug,name,description,category,prefecture',
      },
    });
    return data.contents;
  } catch {
    return [];
  }
};

/* =================================================================
   Phase 4-pre: 中部地方 Leaflet 地図ページ用ライト型
   - 既存 SUBSTATION_LIST_FIELDS は latitude/longitude を含まない（list 派生最小化用）
   - マップ専用の細い fields で list 取得 → 緯度経度 null を除外
   ================================================================= */

export type SubstationGeoPoint = {
  slug: string;
  name: string;
  prefecture: string | null;
  voltage_primary_kv: number | null;
  voltage_secondary_kv: number | null;
  cap_avail_mw: number | null;
  n1_eligible: boolean;
  oc_possibility: string | null;
  latitude: number;
  longitude: number;
};

const SUBSTATION_MAP_FIELDS =
  'slug,name,prefecture,voltage_primary_kv,voltage_secondary_kv,cap_avail_mw,n1_eligible,oc_possibility,latitude,longitude';

/**
 * 中部エリアの緯度経度付き変電所のみを取得（Leaflet マップ用）
 * - area = 中部 で絞り込み（中部電力PG 配下のみ）
 * - latitude/longitude が null/undefined のレコードは除外
 * - 落とし穴 #48: offset cap は 20,000 で安全側
 */
export const getChubuSubstationsForMap = async (): Promise<
  SubstationGeoPoint[]
> => {
  const all: Substation[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    try {
      const data = await client.getList<Substation>({
        endpoint: 'substations',
        queries: {
          limit,
          offset,
          fields: SUBSTATION_MAP_FIELDS,
          filters: 'area[contains]中部',
          orders: 'name',
        },
      });
      all.push(...data.contents);
      if (data.contents.length < limit) break;
    } catch {
      break;
    }
  }
  return all
    .filter(
      (s) =>
        typeof s.latitude === 'number' &&
        typeof s.longitude === 'number' &&
        !Number.isNaN(s.latitude) &&
        !Number.isNaN(s.longitude)
    )
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      prefecture: s.prefecture ?? null,
      voltage_primary_kv:
        typeof s.voltage_primary_kv === 'number' ? s.voltage_primary_kv : null,
      voltage_secondary_kv:
        typeof s.voltage_secondary_kv === 'number'
          ? s.voltage_secondary_kv
          : null,
      cap_avail_mw:
        typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : null,
      n1_eligible: s.n1_eligible === true,
      oc_possibility:
        s.oc_possibility && s.oc_possibility.length > 0
          ? s.oc_possibility[0]
          : null,
      latitude: s.latitude as number,
      longitude: s.longitude as number,
    }));
};

/* =================================================================
   v24: 変電所名フリーテキスト検索（部分一致 / 名称順序）
   - microCMS の filters[name][contains] を使い 6,500 件超から検索
   - 表示は最大 100 件（UI 性能保護）、空容量大きい順
   ================================================================= */

export type SubstationSearchResult = {
  slug: string;
  name: string;
  operator: string;
  area: string;
  prefecture: string | null;
  voltage_primary_kv: number | null;
  cap_avail_mw: number | null;
  n1_eligible?: boolean;
};

/* =================================================================
   v25: 多角的検索フィルタ
   ================================================================= */
export type SubstationSearchFilters = {
  q?: string;            // 変電所名 部分一致
  area?: string;         // エリア（北海道/東北/...九州/沖縄）
  voltage_min?: string;  // 一次電圧 >= (kV)
  cap_avail_min?: string;// 空容量 >= (MW)
  n1_eligible?: string;  // 'true' のみ受付
  operator?: string;     // 送配電事業者 部分一致
};

const SUBSTATION_SEARCH_FIELDS =
  'slug,name,operator,area,prefecture,voltage_primary_kv,cap_avail_mw';

const SEARCH_DISPLAY_LIMIT = 100;

/**
 * 変電所名フリーテキスト検索（部分一致）
 * - 落とし穴 #48: MICROCMS_MAX_OFFSET / MICROCMS_PAGE_LIMIT を参照
 */
export const searchSubstationsByName = async (
  query: string
): Promise<SubstationSearchResult[]> => {
  const q = (query || '').trim();
  if (!q) return [];

  const all: SubstationSearchResult[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    try {
      const data = await client.getList<Substation>({
        endpoint: 'substations',
        queries: {
          limit,
          offset,
          filters: `name[contains]${q}`,
          fields: SUBSTATION_SEARCH_FIELDS,
          orders: '-cap_avail_mw',
        },
      });
      for (const c of data.contents) {
        all.push({
          slug: c.slug,
          name: c.name,
          operator: Array.isArray(c.operator) ? c.operator[0] ?? '' : c.operator ?? '',
          area: Array.isArray(c.area) ? c.area[0] ?? '' : c.area ?? '',
          prefecture: c.prefecture ?? null,
          voltage_primary_kv:
            typeof c.voltage_primary_kv === 'number' ? c.voltage_primary_kv : null,
          cap_avail_mw:
            typeof c.cap_avail_mw === 'number' ? c.cap_avail_mw : null,
        });
        if (all.length >= SEARCH_DISPLAY_LIMIT) break;
      }
      if (all.length >= SEARCH_DISPLAY_LIMIT) break;
      if (data.contents.length < limit) break;
    } catch {
      break;
    }
  }
  return all;
};

/** 関連ニュースの自動マッチ：本文に変電所名 or 都道府県を含むニュース上位 N 件 */
export const getRelatedNewsForSubstation = async (
  query: string,
  limit = 5
): Promise<News[]> => {
  if (!query) return [];
  try {
    const data = await client.getList<News>({
      endpoint: 'news',
      queries: {
        q: query,
        limit,
        orders: '-publishedAt',
        fields: 'id,slug,title,lead,category,publishedAt',
      },
    });
    return data.contents;
  } catch {
    return [];
  }
};

/* =================================================================
   v25: 多角的検索（searchSubstationsByFilters）
   - q + area + voltage_min + cap_avail_min + n1_eligible + operator を [and] 結合
   - 表示上限 200 件
   ================================================================= */
const SEARCH_FILTER_FIELDS =
  'slug,name,operator,area,prefecture,voltage_primary_kv,cap_avail_mw,n1_eligible';
const SEARCH_FILTER_LIMIT = 200;

export const searchSubstationsByFilters = async (
  filters: SubstationSearchFilters
): Promise<SubstationSearchResult[]> => {
  const conditions: string[] = [];
  const q = (filters.q || '').trim();
  const area = (filters.area || '').trim();
  const voltageMin = (filters.voltage_min || '').trim();
  const capMin = (filters.cap_avail_min || '').trim();
  const n1 = (filters.n1_eligible || '').trim();
  const operator = (filters.operator || '').trim();

  if (q) conditions.push(`name[contains]${q}`);
  if (area) conditions.push(`area[contains]${area}`);
  if (voltageMin) {
    const v = Number(voltageMin);
    if (!Number.isNaN(v))
      conditions.push(`voltage_primary_kv[greater_than]${v - 0.001}`);
  }
  if (capMin) {
    const v = Number(capMin);
    if (!Number.isNaN(v))
      conditions.push(`cap_avail_mw[greater_than]${v - 0.001}`);
  }
  // 落とし穴 #61 (v25 発見): microCMS の filters で
  //   `cap_avail_mw[greater_than]X [and] n1_eligible[equals]true`
  // を組み合わせると 0件返却される（API バグ）。
  // → n1_eligible[equals]true は API filter には含めず、JS 側で post-filter。
  const wantN1 = n1 === 'true';
  if (wantN1 && capMin === '' && conditions.length > 0) {
    // cap_avail_min なし時のみ API 側で n1 を絞ってよい（area / voltage / operator / name とは正常動作）
    conditions.push(`n1_eligible[equals]true`);
  } else if (wantN1 && capMin === '') {
    // 他フィルタゼロ + n1=true 単独のとき
    conditions.push(`n1_eligible[equals]true`);
  }
  if (operator) conditions.push(`operator[contains]${operator}`);

  if (conditions.length === 0) return [];

  const filterStr = conditions.join('[and]');
  const all: SubstationSearchResult[] = [];
  const limit = MICROCMS_PAGE_LIMIT;

  // n1+cap 同時指定時は post-filter のため少し多めに fetch（最大 SEARCH_FILTER_LIMIT * 5）
  const needPostFilter = wantN1 && capMin !== '';
  const fetchCap = needPostFilter
    ? SEARCH_FILTER_LIMIT * 5
    : SEARCH_FILTER_LIMIT;

  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    try {
      const data = await client.getList<Substation>({
        endpoint: 'substations',
        queries: {
          limit,
          offset,
          filters: filterStr,
          fields: SEARCH_FILTER_FIELDS,
          orders: '-cap_avail_mw',
        },
      });
      for (const c of data.contents) {
        // post-filter: n1_eligible[equals]true を JS 側で適用（API bug 回避）
        if (needPostFilter && c.n1_eligible !== true) continue;
        all.push({
          slug: c.slug,
          name: c.name,
          operator: Array.isArray(c.operator) ? c.operator[0] ?? '' : c.operator ?? '',
          area: Array.isArray(c.area) ? c.area[0] ?? '' : c.area ?? '',
          prefecture: c.prefecture ?? null,
          voltage_primary_kv:
            typeof c.voltage_primary_kv === 'number' ? c.voltage_primary_kv : null,
          cap_avail_mw:
            typeof c.cap_avail_mw === 'number' ? c.cap_avail_mw : null,
          n1_eligible: c.n1_eligible === true,
        });
        if (all.length >= SEARCH_FILTER_LIMIT) break;
      }
      if (all.length >= SEARCH_FILTER_LIMIT) break;
      if (data.contents.length < limit) break;
      // post-filter モードで API 側の総数が fetchCap を超過したら打ち切り
      if (needPostFilter && offset + limit >= fetchCap) break;
    } catch {
      break;
    }
  }
  return all;
};

/* =================================================================
   v25: 都道府県ディレクトリ用ヘルパー
   - 単一の inventory 取得で prefecture リスト + 件数集計を導出（API 節約）
   ================================================================= */
type SubstationInventoryRow = {
  slug: string;
  name?: string;
  operator?: string[];
  area?: string[];
  prefecture?: string;
  voltage_primary_kv?: number;
  cap_avail_mw?: number;
  n1_eligible?: boolean;
};

const INVENTORY_FIELDS =
  'slug,name,operator,area,prefecture,voltage_primary_kv,cap_avail_mw,n1_eligible';

let _inventoryCache: SubstationInventoryRow[] | null = null;

const fetchSubstationInventory = async (): Promise<SubstationInventoryRow[]> => {
  if (_inventoryCache) return _inventoryCache;
  const all: SubstationInventoryRow[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    try {
      const data = await client.getList<SubstationInventoryRow>({
        endpoint: 'substations',
        queries: { limit, offset, fields: INVENTORY_FIELDS },
      });
      all.push(...data.contents);
      if (data.contents.length < limit) break;
    } catch {
      break;
    }
  }
  _inventoryCache = all;
  return all;
};

/** distinct な都道府県名を 50音順で返す */
export const getAvailablePrefectures = async (): Promise<string[]> => {
  const inv = await fetchSubstationInventory();
  const set = new Set<string>();
  for (const r of inv) {
    const p = (r.prefecture || '').trim();
    if (p) set.add(p);
  }
  return Array.from(set).sort();
};

/** 都道府県 → 件数 マップ */
export const getPrefectureCountMap = async (): Promise<Record<string, number>> => {
  const inv = await fetchSubstationInventory();
  const result: Record<string, number> = {};
  for (const r of inv) {
    const p = (r.prefecture || '').trim();
    if (!p) continue;
    result[p] = (result[p] || 0) + 1;
  }
  return result;
};

/** エリア (slug) → 件数 マップ */
export const getAreaCountMap = async (): Promise<Record<string, number>> => {
  const inv = await fetchSubstationInventory();
  const AREA_JP_TO_SLUG: Record<string, string> = {
    北海道: 'hokkaido',
    東北: 'tohoku',
    中部: 'chubu',
    北陸: 'hokuriku',
    関西: 'kansai',
    中国: 'chugoku',
    四国: 'shikoku',
    九州: 'kyushu',
    沖縄: 'okinawa',
  };
  const result: Record<string, number> = {};
  for (const r of inv) {
    const ja = Array.isArray(r.area) ? r.area[0] : r.area;
    if (!ja) continue;
    const slug = AREA_JP_TO_SLUG[ja];
    if (!slug) continue;
    result[slug] = (result[slug] || 0) + 1;
  }
  return result;
};

/** 指定都道府県の変電所一覧（空容量大きい順） */
export const getSubstationsByPrefecture = async (
  prefecture: string
): Promise<SubstationSearchResult[]> => {
  if (!prefecture) return [];
  const all: SubstationSearchResult[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    try {
      const data = await client.getList<Substation>({
        endpoint: 'substations',
        queries: {
          limit,
          offset,
          filters: `prefecture[equals]${prefecture}`,
          fields: SEARCH_FILTER_FIELDS,
          orders: '-cap_avail_mw',
        },
      });
      for (const c of data.contents) {
        all.push({
          slug: c.slug,
          name: c.name,
          operator: Array.isArray(c.operator) ? c.operator[0] ?? '' : c.operator ?? '',
          area: Array.isArray(c.area) ? c.area[0] ?? '' : c.area ?? '',
          prefecture: c.prefecture ?? null,
          voltage_primary_kv:
            typeof c.voltage_primary_kv === 'number' ? c.voltage_primary_kv : null,
          cap_avail_mw:
            typeof c.cap_avail_mw === 'number' ? c.cap_avail_mw : null,
          n1_eligible: c.n1_eligible === true,
        });
      }
      if (data.contents.length < limit) break;
    } catch {
      break;
    }
  }
  return all;
};
