#!/usr/bin/env tsx
/**
 * scripts/precompute-operators-detail.ts
 *
 * /operators/[slug] の「事業者本体＋関連リレーション＋自動リンク済本文」を build 時に
 * 事前計算して JSON 化。ページは本 JSON のみを読み、runtime microCMS を 0 にする。
 * （P0 監査の rate-limit hygiene ＋ P3 厚み ＋ P4 送配電→/grid 相互リンク）
 *
 * 鉄則 #2/#3 / 落とし穴 #93/#98 準拠。helper(linkifyHTML/getLinkableTargets)を再利用。
 * microCMS は build 時に各 endpoint 1 回ずつ bulk のみ（per-operator の q 検索はしない）。
 *
 * 出力: src/lib/generated/operators-detail-index.json（slug キー）
 * 実行: prebuild。手動は MICROCMS_API_KEY=... MICROCMS_SERVICE_DOMAIN=bess-net npx tsx scripts/precompute-operators-detail.ts
 */
import * as fs from 'node:fs';
// Op1/Op2(2026-08-08): 事業者名の突合は精度優先の共有ロジックに一本化（誤掲載防止）
import { mentionsOperator, projectOperatorMatches } from '../src/lib/operator-match';
import { LIST_EXCLUDED_PROJECT_SLUGS } from '../src/lib/projects-excluded';
// 表示対象外のニュース（off-topic PR / 主題ゲート）は関連に含めない＝404リンクを作らない（2026-08-08 実測42件）
import { isExcludedNews } from '../src/lib/news-excluded';
import { isTopicExcludedNews } from '../src/lib/news-topic-gate';
import * as path from 'node:path';
import {
  client,
  getAllOperators,
  getAllProjects,
  getAllExplainer,
  getAllGlossary,
  getLinkableTargets,
} from '../src/lib/microcms';
import { MICROCMS_PAGE_LIMIT, MICROCMS_MAX_OFFSET } from '../src/lib/constants';
import { linkifyHTML } from '../src/lib/linkify';

// 送配電事業者 slug → /grid エリア（P4 相互リンク、10社）
const GRID_AREA_BY_OPERATOR_SLUG: Record<string, { area: string; areaJp: string }> = {
  'tepco-pg':       { area: 'tokyo',    areaJp: '東京' },
  'chuden-pg':      { area: 'chubu',    areaJp: '中部' },
  'kepco-tdgc':     { area: 'kansai',   areaJp: '関西' },
  'tohoku-epco-nw': { area: 'tohoku',   areaJp: '東北' },
  'hepco-network':  { area: 'hokkaido', areaJp: '北海道' },
  'energia-nw':     { area: 'chugoku',  areaJp: '中国' },
  'yonden-nw':      { area: 'shikoku',  areaJp: '四国' },
  'kyuden-pg':      { area: 'kyushu',   areaJp: '九州' },
  'rikuden-tdgc':   { area: 'hokuriku', areaJp: '北陸' },
  'okiden':         { area: 'okinawa',  areaJp: '沖縄' },
};

// 出力型
type NewsRef = { id: string; slug: string; title: string; publishedAt: string; category: string[] };
type ProjectRef = { id: string; slug: string; name: string; prefecture?: string; outputMw?: number; capacityMwh?: number };
type ExplainerRef = { id: string; slug: string; title: string; lead?: string };
type OperatorLite = { id: string; slug: string; name: string; description?: string };

type OperatorDetailEntry = {
  operator: Record<string, any>;   // page が描画する素フィールド
  bodyHtml: string;                // linkify 済本文
  relatedNews: NewsRef[];
  relatedProjects: ProjectRef[];
  relatedExplainers: ExplainerRef[];
  sameCategoryOperators: OperatorLite[];
  gridArea: { area: string; areaJp: string } | null;
};

// news を relatedOperators（operator 関連）込みで取得（getAllNews は relatedOperators 非含）
async function fetchAllNewsWithOperators(): Promise<(NewsRef & { relatedOperatorIds: string[] })[]> {
  const out: (NewsRef & { relatedOperatorIds: string[] })[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    const data = await client.getList<any>({
      endpoint: 'news',
      queries: { limit, offset, fields: 'id,title,slug,category,publishedAt,relatedOperators,sourceName', depth: 0, orders: '-publishedAt' },
    });
    for (const n of data.contents) {
      const rel = Array.isArray(n.relatedOperators) ? n.relatedOperators : [];
      const ids = rel.map((r: any) => (typeof r === 'string' ? r : r?.id)).filter(Boolean);
      out.push({ id: n.id, slug: n.slug, title: n.title, publishedAt: n.publishedAt ?? '', category: n.category ?? [], relatedOperatorIds: ids });
    }
    if (data.contents.length < limit) break;
  }
  return out;
}

async function main(): Promise<void> {
  console.log('[precompute-operators-detail] microCMS bulk 取得...');
  const t0 = Date.now();
  const [operators, projects, explainers, glossary, news, linkable] = await Promise.all([
    getAllOperators(),
    getAllProjects(),
    getAllExplainer(),
    getAllGlossary(),
    fetchAllNewsWithOperators(),
    getLinkableTargets(),
  ]);
  console.log(`  operators=${operators.length} projects=${projects.length} explainer=${explainers.length} glossary=${glossary.length} news=${news.length} linkable=${linkable.length} (${Date.now() - t0}ms)`);

  // operator 本文 linkify 用 target（依頼W.6: glossary + operator のみ）
  const operatorScopedTargets = linkable.filter((t: any) => t.type === 'glossary' || t.type === 'operator');

  // news を operatorId で逆引き（-publishedAt 済み）
  const newsByOpId = new Map<string, NewsRef[]>();
  for (const n of news) {
    for (const oid of n.relatedOperatorIds) {
      const arr = newsByOpId.get(oid) ?? [];
      arr.push({ id: n.id, slug: n.slug, title: n.title, publishedAt: n.publishedAt, category: n.category });
      newsByOpId.set(oid, arr);
    }
  }

  console.log('[precompute-operators-detail] メモリ内リレーション計算...');
  const t1 = Date.now();
  const index: Record<string, OperatorDetailEntry> = {};
  const gridMatched: string[] = [];

  for (const op of operators) {
    const cat0 = (op.category && op.category[0]) || '';

    // Op2(2026-08-08) relatedNews: ①microCMSリレーション（手動・最優先） ∪ ②タイトル一致 ∪ ③発信元(sourceName)一致。
    // 本文のみの一致は「登壇者として言及」等が混じり根拠が弱いため不採用（2026-08-08 実測: 本文のみ1,348件は玉石混交）。
    const newsSeen = new Set<string>();
    const relatedNews: NewsRef[] = [];
    // /news 一覧と同じ除外（isExcludedNews / isTopicExcludedNews）を適用。
    // 詳細ページが 404 になる記事を関連として出さないため（誤掲載＝信頼毀損の防止）。
    const visible = (slug: string) => !isExcludedNews(slug) && !isTopicExcludedNews(slug);
    for (const n of newsByOpId.get(op.id) ?? []) {
      if (newsSeen.has(n.slug) || !visible(n.slug)) continue;
      newsSeen.add(n.slug);
      relatedNews.push(n);
    }
    for (const n of news) {
      if (newsSeen.has(n.slug) || !visible(n.slug)) continue;
      const byTitle = mentionsOperator(n.title ?? '', op.name);
      const bySource = mentionsOperator((n as unknown as { sourceName?: string }).sourceName ?? '', op.name);
      if (!byTitle && !bySource) continue;
      newsSeen.add(n.slug);
      relatedNews.push({ id: n.id, slug: n.slug, title: n.title, publishedAt: n.publishedAt, category: n.category });
    }
    relatedNews.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    const relatedNewsTop = relatedNews.slice(0, 10);

    // Op1(2026-08-08) relatedProjects: 語境界＋法人格つきの厳格突合（素の部分一致は暴発するため不採用）。
    // 一覧除外（非プロジェクト・301元）は掲載対象から外す。
    const relatedProjects: ProjectRef[] = projects
      .filter((p) => !LIST_EXCLUDED_PROJECT_SLUGS.has(p.slug))
      .filter((p) => projectOperatorMatches(p.operator ?? '', op.name))
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      .slice(0, 10)
      .map((p) => ({ id: p.id, slug: p.slug, name: p.name, prefecture: p.prefecture, outputMw: p.outputMw, capacityMwh: p.capacityMwh }));

    // relatedExplainers: 本文/説明に explainer.title を含む（高精度 Step1、limit 3）
    const haystack = `${op.name} ${op.description ?? ''} ${op.body ?? ''}`;
    const relatedExplainers: ExplainerRef[] = explainers
      .filter((e) => e.title && e.title.length >= 4 && haystack.includes(e.title) && e.slug !== op.slug)
      .sort((a, b) => (b.title.length - a.title.length))
      .slice(0, 3)
      .map((e) => ({ id: e.id, slug: e.slug, title: e.title, lead: (e as any).lead }));

    // sameCategoryOperators: 同カテゴリ top 6（自分除外）
    const sameCategoryOperators: OperatorLite[] = cat0
      ? operators
          .filter((o) => o.slug !== op.slug && (o.category ?? []).includes(cat0))
          .slice(0, 6)
          .map((o) => ({ id: o.id, slug: o.slug, name: o.name, description: o.description }))
      : [];

    // bodyHtml: 自動リンク（既存 helper を再利用）
    const bodyHtml = op.body
      ? linkifyHTML(op.body, operatorScopedTargets as any, { firstOnly: true, selfUrl: `/operators/${op.slug}` })
      : '';

    const gridArea = GRID_AREA_BY_OPERATOR_SLUG[op.slug] ?? null;
    if (gridArea) gridMatched.push(`${op.slug}→${gridArea.area}`);

    index[op.slug] = {
      operator: {
        id: op.id, name: op.name, slug: op.slug, nameEn: op.nameEn, category: op.category ?? [],
        corporateType: op.corporateType, prefecture: op.prefecture, city: op.city, foundedYear: op.foundedYear,
        listedMarket: op.listedMarket, ticker: op.ticker, description: op.description, products: op.products,
        bessRelation: op.bessRelation, websiteUrl: op.websiteUrl, sourceUrl: op.sourceUrl,
      },
      bodyHtml,
      relatedNews: relatedNewsTop,
      relatedProjects,
      relatedExplainers,
      sameCategoryOperators,
      gridArea,
    };
  }
  console.log(`  → ${Object.keys(index).length} entries (${Date.now() - t1}ms)`);

  const outDir = path.join(process.cwd(), 'src', 'lib', 'generated');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'operators-detail-index.json');
  const json = JSON.stringify(index);
  fs.writeFileSync(outPath, json);
  const sizeMB = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);

  const withNews = Object.values(index).filter((e) => e.relatedNews.length > 0).length;
  const withProj = Object.values(index).filter((e) => e.relatedProjects.length > 0).length;
  const withExp = Object.values(index).filter((e) => e.relatedExplainers.length > 0).length;
  console.log(`[precompute-operators-detail] 書き出し完了: ${outPath} (${sizeMB} MB)`);
  console.log(`  entries=${Object.keys(index).length}`);
  console.log(`  関連あり: news=${withNews} project=${withProj} explainer=${withExp}`);
  console.log(`  送配電→/grid マップ適用: ${gridMatched.length}社 [${gridMatched.join(', ')}]`);
  // マップに定義したが operator が存在しない slug を警告
  const missing = Object.keys(GRID_AREA_BY_OPERATOR_SLUG).filter((s) => !index[s]);
  if (missing.length) console.log(`  ⚠ 未存在 operator slug（要確認）: ${missing.join(', ')}`);
}

main().catch((err) => {
  console.error('[precompute-operators-detail] ERROR:', err);
  process.exit(1);
});
