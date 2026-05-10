/**
 * related-cards.ts (依頼Y Phase 3)
 *
 * 各エンティティページの本文下に表示する「関連エンティティ」を抽出するヘルパー。
 *
 * - 既存 getLinkableTargets() の operators/projects target を流用してマッチング
 *   （NG_TERMS / 最小文字数 / 株式会社 等の suffix-strip alias がそのまま効く）
 * - 関連 explainer は別途キャッシュ
 * - 関連 news は microCMS の `q` パラメータで全文検索
 *
 * 戻り値はカード表示用に最小限のフィールドのみ。
 */

import {
  client,
  getLinkableTargets,
  type LinkifyTarget,
  type News,
  type Explainer,
} from './microcms';

/* ----------------------------- フィルタ条件 ----------------------------- */
// 依頼W.5/W.6 の linkify と同じ NG_TERMS / 最小文字数を使う（同期維持）
const NG_TERMS = new Set<string>([
  '蓄電所',
  '蓄電池',
  '系統用蓄電池',
  '系統用蓄電所',
  '系統蓄電所',
  '次世代蓄電池',
  '日本蓄電池',
  'BESS',
  'PCS',
  'MW',
  'MWh',
  'kW',
  'kWh',
  'リース',
  'リユース',
  '需給調整市場',
  '容量市場',
  '低圧系統用蓄電池',
  '系統用蓄電',
  'プロジェクト',
  '系統用',
  '低圧',
  '太陽光',
  '再エネ',
  '電力',
  '受電',
  '発電',
]);
const MIN_LEN = { operator: 4, project: 5, glossary: 5 } as const;

/* ----------------------------- 出力型 ----------------------------- */

export type RelatedOperator = {
  slug: string;
  name: string;
  description?: string;
};

export type RelatedProject = {
  slug: string;
  name: string;
  prefecture?: string;
  status?: string;
  outputMw?: number | null;
  capacityMwh?: number | null;
};

export type RelatedNewsItem = {
  id: string;
  slug: string;
  title: string;
  publishedAt?: string;
  category?: string[];
};

export type RelatedExplainerItem = {
  id: string;
  slug: string;
  title: string;
  lead?: string;
  category?: string[];
};

/* ----------------------------- explainer キャッシュ ----------------------------- */
type LiteExplainer = {
  id: string;
  slug: string;
  title: string;
  lead?: string;
  category?: string[];
};
let _explainerCache: LiteExplainer[] | null = null;
async function getAllExplainerLite(): Promise<LiteExplainer[]> {
  if (_explainerCache) return _explainerCache;
  try {
    const data = await client.getList<Explainer>({
      endpoint: 'explainer',
      queries: { limit: 200, fields: 'id,slug,title,lead,category' },
    });
    _explainerCache = data.contents.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      lead: (e as Explainer).lead,
      category: e.category,
    }));
  } catch {
    _explainerCache = [];
  }
  return _explainerCache;
}

/* ----------------------------- 抽出ロジック ----------------------------- */

/** body HTML を plaintext 化（タグ除去 + 連続空白を1つに） */
export function htmlToPlain(html: string): string {
  if (!html) return '';
  const noScript = html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '');
  const noTag = noScript.replace(/<[^>]+>/g, ' ');
  return noTag.replace(/\s+/g, ' ').trim();
}

/**
 * baseText (= title + body plaintext) 中で言及される operators を抽出。
 * - 自身 slug は除外
 * - 同 slug は1件のみ（最も長い text alias で表示）
 * - NG_TERMS / 最小文字数フィルタ
 * - 長い text 優先で limit 件まで採用
 */
async function findRelatedByLinkable(
  baseText: string,
  type: 'operator' | 'project',
  excludeSlug: string,
  limit: number
): Promise<Array<{ slug: string; name: string }>> {
  if (!baseText || limit <= 0) return [];
  const allTargets = (await getLinkableTargets()).filter(
    (t) => t.type === type
  );

  // slug → 表示用 name (最長のもの = 正式名)
  const slugToBestName = new Map<string, string>();
  for (const t of allTargets) {
    const slug = t.url.split('/').pop() || '';
    if (!slug) continue;
    const cur = slugToBestName.get(slug);
    if (!cur || t.text.length > cur.length) {
      slugToBestName.set(slug, t.text);
    }
  }

  // 長い text 優先（部分マッチ防止）
  const sorted = [...allTargets].sort((a, b) => b.text.length - a.text.length);

  const seen = new Set<string>();
  const matches: Array<{ slug: string; name: string }> = [];
  const minLen = MIN_LEN[type];

  for (const t of sorted) {
    if (matches.length >= limit) break;
    if (NG_TERMS.has(t.text)) continue;
    if (t.text.length < minLen) continue;
    const slug = t.url.split('/').pop() || '';
    if (!slug || slug === excludeSlug || seen.has(slug)) continue;
    if (baseText.indexOf(t.text) < 0) continue;
    matches.push({
      slug,
      name: slugToBestName.get(slug) || t.text,
    });
    seen.add(slug);
  }
  return matches;
}

/** baseText 中で言及される explainer を抽出（title マッチ） */
async function findRelatedExplainers(
  baseText: string,
  excludeSlug: string,
  limit: number
): Promise<RelatedExplainerItem[]> {
  if (!baseText || limit <= 0) return [];
  const all = await getAllExplainerLite();
  const matches: RelatedExplainerItem[] = [];
  // 長いタイトル優先
  const sorted = [...all].sort((a, b) => b.title.length - a.title.length);
  for (const e of sorted) {
    if (matches.length >= limit) break;
    if (e.slug === excludeSlug) continue;
    if (!e.title || e.title.length < 4) continue;
    if (baseText.indexOf(e.title) < 0) continue;
    matches.push(e);
  }
  return matches;
}

/** microCMS の q 検索で関連 news を取得 */
async function searchRelatedNews(
  query: string,
  excludeSlug: string,
  limit: number
): Promise<RelatedNewsItem[]> {
  const q = (query || '').trim();
  if (!q || limit <= 0) return [];
  try {
    const data = await client.getList<News>({
      endpoint: 'news',
      queries: {
        q,
        limit: limit + 5,
        orders: '-publishedAt',
        fields: 'id,slug,title,publishedAt,category',
      },
    });
    return data.contents
      .filter((n) => n.slug !== excludeSlug)
      .slice(0, limit)
      .map((n) => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        publishedAt: n.publishedAt,
        category: n.category,
      }));
  } catch {
    return [];
  }
}

/* ----------------------------- 公開 API ----------------------------- */

export type GetRelatedOptions = {
  baseSlug: string;
  baseType: 'operator' | 'project' | 'news' | 'explainer';
  /** body の HTML（タグ除去前） */
  baseBodyHtml?: string;
  /** title。これも検索対象に含める */
  baseTitle?: string;
  /** 自身の name（operator の場合の検索クエリに使う等） */
  baseName?: string;
  wantTypes: Array<'operator' | 'project' | 'news' | 'explainer'>;
  limit?: {
    operator?: number;
    project?: number;
    news?: number;
    explainer?: number;
  };
};

export type RelatedEntities = {
  operators: Array<{ slug: string; name: string }>;
  projects: Array<{ slug: string; name: string }>;
  news: RelatedNewsItem[];
  explainers: RelatedExplainerItem[];
};

export async function getRelatedEntities(
  opts: GetRelatedOptions
): Promise<RelatedEntities> {
  const baseText =
    (opts.baseTitle || '') +
    ' ' +
    (opts.baseName || '') +
    ' ' +
    htmlToPlain(opts.baseBodyHtml || '');

  const want = new Set(opts.wantTypes);
  const lim = {
    operator: opts.limit?.operator ?? 5,
    project: opts.limit?.project ?? 5,
    news: opts.limit?.news ?? 5,
    explainer: opts.limit?.explainer ?? 3,
  };

  // 並列実行
  const opsP = want.has('operator')
    ? findRelatedByLinkable(
        baseText,
        'operator',
        opts.baseType === 'operator' ? opts.baseSlug : '',
        lim.operator
      )
    : Promise.resolve([] as Array<{ slug: string; name: string }>);

  const pjsP = want.has('project')
    ? findRelatedByLinkable(
        baseText,
        'project',
        opts.baseType === 'project' ? opts.baseSlug : '',
        lim.project
      )
    : Promise.resolve([] as Array<{ slug: string; name: string }>);

  // news 検索クエリは baseName 優先（operator/project 名）、なければ title
  const newsQuery = (opts.baseName || opts.baseTitle || '').trim();
  const newsP = want.has('news')
    ? searchRelatedNews(
        newsQuery,
        opts.baseType === 'news' ? opts.baseSlug : '',
        lim.news
      )
    : Promise.resolve([] as RelatedNewsItem[]);

  const expP = want.has('explainer')
    ? findRelatedExplainers(
        baseText,
        opts.baseType === 'explainer' ? opts.baseSlug : '',
        lim.explainer
      )
    : Promise.resolve([] as RelatedExplainerItem[]);

  const [operators, projects, news, explainers] = await Promise.all([
    opsP,
    pjsP,
    newsP,
    expP,
  ]);

  return { operators, projects, news, explainers };
}

/**
 * JSON-LD `mentions` 配列を構築（SEO 構造化データ用）
 */
export function buildMentions(
  related: RelatedEntities
): Array<Record<string, unknown>> {
  const base = 'https://bess-net.jp';
  const mentions: Array<Record<string, unknown>> = [];
  for (const o of related.operators) {
    mentions.push({
      '@type': 'Organization',
      name: o.name,
      url: `${base}/operators/${o.slug}`,
    });
  }
  for (const p of related.projects) {
    mentions.push({
      '@type': 'CreativeWork',
      name: p.name,
      url: `${base}/projects/${p.slug}`,
    });
  }
  for (const e of related.explainers) {
    mentions.push({
      '@type': 'Article',
      name: e.title,
      url: `${base}/explainer/${e.slug}`,
    });
  }
  for (const n of related.news) {
    mentions.push({
      '@type': 'NewsArticle',
      name: n.title,
      url: `${base}/news/${n.slug}`,
    });
  }
  return mentions;
}
