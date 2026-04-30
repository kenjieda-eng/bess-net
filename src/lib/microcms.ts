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
