#!/usr/bin/env tsx
/**
 * scripts/precompute-glossary-detail.ts
 *
 * P0 (Vercel 6/23 rate-limit 500 恒久対策): /glossary/[slug] の
 * 「用語本体＋全関連リレーション」を build 時に事前計算 → JSON 化。
 * ページは本 JSON のみを読み、runtime の microCMS 呼び出しを 0 にする。
 *
 * 鉄則 #2/#3 / 落とし穴 #93/#94/#98 準拠:
 *  - microCMS は build 時に各 endpoint 1 回ずつ bulk 取得（getAll*）のみ。
 *  - 関連の contains 検索（operators/projects/explainer）は メモリ内で再現。
 *  - 既存 helper（buildContainsFilter / getOperatorsByTermName 等）のロジックを忠実に複製。
 *
 * 出力: src/lib/generated/glossary-detail-index.json  （slug をキーにした dict）
 * 実行: prebuild（package.json）で自動。手動は
 *   MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net npx tsx scripts/precompute-glossary-detail.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  client,
  getAllGlossary,
  getAllExplainer,
  getAllOperators,
  getAllProjects,
} from '../src/lib/microcms';
import { MICROCMS_PAGE_LIMIT, MICROCMS_MAX_OFFSET } from '../src/lib/constants';
import { GLOSSARY_301_SOURCE_SLUGS } from '../src/lib/glossary-301';

// ── 出力型（ページが必要とする最小フィールドのみ）──────────────────
type TermLite = { term: string; slug: string };
type NewsRef = { id: string; slug: string; title: string; publishedAt: string; category: string[] };
type ExplainerRef = { id: string; slug: string; title: string; lead: string };
type OperatorRef = { id: string; slug: string; name: string; bessRelation?: string };
type ProjectRef = { id: string; slug: string; name: string; prefecture?: string; outputMw?: number; capacityMwh?: number };

type GlossaryDetailEntry = {
  term: {
    id: string; term: string; slug: string; english?: string; reading?: string;
    shortDef: string; detail?: string; category: string[]; subcategory?: string;
  };
  relatedNews: NewsRef[];
  relatedExplainers: ExplainerRef[];
  relatedOperators: OperatorRef[];
  relatedProjects: ProjectRef[];
  sameCategoryTerms: TermLite[];
  useCategoryFallback: boolean;
  relatedTerms: TermLite[];
};

// ── searchKeywords（page.tsx と同一ロジック）─────────────────────────
function buildSearchKeywords(term: string | undefined, english: string | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const raw: string[] = [];
  if (term) raw.push(term);
  if (english) for (const part of english.split(/[\/,、]/)) raw.push(part);
  for (const r of raw) {
    if (!r) continue;
    const t = r.trim();
    if (t.length < 3 || t.length > 40) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.slice(0, 4);
}

function isGenericSubcategory(sub?: string): boolean {
  return !!sub && /_一般$/.test(sub);
}

// ── 導線ブロックの旧値正規化（2026-07-06 恒久化バッチ）──────────────
// microCMS glossary detail に焼き込まれた「関連：実データで確認」等の導線ブロックの
// 旧値（9社6,507件・関東を除く・業界初）を build 時に現行値へ正規化する。
// 件数は src/data/substations（/grid の真実源）から動的算出＝今後のデータ更新に自動追随。
// 完全一致の文脈付き置換のみ（「業界初心者」等の正当な本文・証券コード6507 を誤置換しない）。
function loadGridStats(): { operators: number; total: string; n1: number } {
  const dir = path.join(process.cwd(), 'src', 'data', 'substations');
  const ops = new Set<string>();
  let total = 0;
  let n1 = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const items: Array<{ operator?: string; n1_eligible?: boolean }> = Array.isArray(arr) ? arr : arr.items ?? [];
    for (const it of items) {
      if (!it) continue;
      total++;
      if (it.operator) ops.add(it.operator);
      if (it.n1_eligible === true) n1++;
    }
  }
  return { operators: ops.size, total: total.toLocaleString('en-US'), n1 };
}

function buildGridCtaReplacers(): Array<[string, string]> {
  const s = loadGridStats();
  const db = `${s.operators}社${s.total}変電所`;
  return [
    // 件数系（順序重要: 長い文脈から先に）
    ['系統空き容量データベース（9社6,507件、関東を除く全国カバー）', `系統空き容量データベース（${db}）`],
    ['9社6,507件', db],
    ['全国9社・6,507変電所', `全国${s.operators}社・${s.total}変電所`],
    ['N-1電制適用可 約536件', `N-1電制適用可 約${s.n1}件`],
    ['N-1電制可 約536件', `N-1電制可 約${s.n1}件`],
    // 「業界初」→「当サイト独自」（L-EIC-019・7/3 explainer T4 と同方針）
    ['中部地方マップ（業界初）', '中部地方マップ（当サイト独自）'],
    ['中部地方マップ（業界初の', '中部地方マップ（当サイト独自の'],
    ['、業界初の地図検索）', '、当サイト独自の地図検索）'],
    ['（青枠 = N-1電制適用可、業界初）', '（青枠 = N-1電制適用可、当サイト独自）'],
    ['変電所名フリーテキスト検索（業界初）', '変電所名フリーテキスト検索（当サイト独自）'],
  ];
}

function normalizeGridCta(text: string | undefined, replacers: Array<[string, string]>): string | undefined {
  if (!text) return text;
  let out = text;
  for (const [from, to] of replacers) out = out.split(from).join(to);
  return out;
}

// ── news を relatedTerms（glossary 関連）込みで取得 ─────────────────
// getAllNews は NEWS_LIST_FIELDS で relatedTerms を含まないため独自取得。
type NewsWithRel = NewsRef & { relatedTermIds: string[] };
async function fetchAllNewsWithRel(): Promise<NewsWithRel[]> {
  const all: NewsWithRel[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    const data = await client.getList<any>({
      endpoint: 'news',
      queries: { limit, offset, fields: 'id,title,slug,category,publishedAt,relatedTerms', depth: 0, orders: '-publishedAt' },
    });
    for (const n of data.contents) {
      const rel = Array.isArray(n.relatedTerms) ? n.relatedTerms : [];
      const ids = rel.map((r: any) => (typeof r === 'string' ? r : r?.id)).filter(Boolean);
      all.push({
        id: n.id, slug: n.slug, title: n.title,
        publishedAt: n.publishedAt ?? '', category: n.category ?? [],
        relatedTermIds: ids,
      });
    }
    if (data.contents.length < limit) break;
  }
  return all;
}

async function main(): Promise<void> {
  console.log('[precompute-glossary-detail] microCMS bulk 取得...');
  const t0 = Date.now();
  const [glossary, explainers, operators, projects, news] = await Promise.all([
    getAllGlossary(),
    getAllExplainer(),
    getAllOperators(),
    getAllProjects(),
    fetchAllNewsWithRel(),
  ]);
  console.log(
    `  glossary=${glossary.length} explainer=${explainers.length} operators=${operators.length} ` +
    `projects=${projects.length} news=${news.length} (${Date.now() - t0}ms)`
  );

  // term/english → slug マップ（relatedTerms CSV 解決用）
  // stage-2A: 301元slug（重複/旧entry）はマップから除外し、同名は canonical のみ解決させる
  // → relatedTerms の 301-hop（A:同名718件）を撲滅（落とし穴#102）。
  const termSlugMap = new Map<string, string>();
  for (const g of glossary) {
    if (GLOSSARY_301_SOURCE_SLUGS.has(g.slug)) continue;
    termSlugMap.set(g.term, g.slug);
    if (g.english) termSlugMap.set(g.english, g.slug);
  }

  // news を termId で逆引き（-publishedAt 済み）
  const newsByTermId = new Map<string, NewsRef[]>();
  for (const n of news) {
    for (const tid of n.relatedTermIds) {
      const arr = newsByTermId.get(tid) ?? [];
      arr.push({ id: n.id, slug: n.slug, title: n.title, publishedAt: n.publishedAt, category: n.category });
      newsByTermId.set(tid, arr);
    }
  }

  console.log('[precompute-glossary-detail] メモリ内リレーション計算...');
  const t1 = Date.now();
  const index: Record<string, GlossaryDetailEntry> = {};
  const ctaReplacers = buildGridCtaReplacers();
  let normalizedCount = 0;

  for (const g of glossary) {
    const cat = (g.category && g.category[0]) || '';
    const sub = g.subcategory || '';
    const useCategoryFallback = isGenericSubcategory(sub);
    const keywords = buildSearchKeywords(g.term, g.english);

    // relatedNews: term.id 一致、-publishedAt 済み、limit 10
    const relatedNews = (newsByTermId.get(g.id) ?? []).slice(0, 10);

    // relatedExplainers: explainer.relatedTerms(CSV) に g.term を含む、-publishedAt、limit 10
    const relatedExplainers: ExplainerRef[] = explainers
      .filter((e) => (e.relatedTerms ?? '').includes(g.term))
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      .slice(0, 10)
      .map((e) => ({ id: e.id, slug: e.slug, title: e.title, lead: e.lead }));

    // relatedOperators: body/description に keyword を含む（buildContainsFilter 相当）、order name、limit 5
    const relatedOperators: OperatorRef[] = keywords.length === 0 ? [] : operators
      .filter((op) => keywords.some((kw) => (op.body ?? '').includes(kw) || (op.description ?? '').includes(kw)))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
      .slice(0, 5)
      .map((op) => ({ id: op.id, slug: op.slug, name: op.name, bessRelation: op.bessRelation }));

    // relatedProjects: body/name に keyword を含む、-publishedAt、limit 5
    const relatedProjects: ProjectRef[] = keywords.length === 0 ? [] : projects
      .filter((p) => keywords.some((kw) => (p.body ?? '').includes(kw) || (p.name ?? '').includes(kw)))
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      .slice(0, 5)
      .map((p) => ({ id: p.id, slug: p.slug, name: p.name, prefecture: p.prefecture, outputMw: p.outputMw, capacityMwh: p.capacityMwh }));

    // sameCategoryTerms: subcategory[equals] or category[contains]、self 除外、order term、limit 8
    let sameCategoryTerms: TermLite[] = [];
    // stage-2A: 301元slug は同カテゴリ候補からも除外（301-hop リンク防止）
    if (useCategoryFallback) {
      if (cat) {
        sameCategoryTerms = glossary
          .filter((x) => x.slug !== g.slug && !GLOSSARY_301_SOURCE_SLUGS.has(x.slug) && (x.category ?? []).includes(cat))
          .sort((a, b) => (a.term ?? '').localeCompare(b.term ?? ''))
          .slice(0, 8)
          .map((x) => ({ term: x.term, slug: x.slug }));
      }
    } else if (sub) {
      sameCategoryTerms = glossary
        .filter((x) => x.slug !== g.slug && !GLOSSARY_301_SOURCE_SLUGS.has(x.slug) && (x.subcategory ?? '') === sub)
        .sort((a, b) => (a.term ?? '').localeCompare(b.term ?? ''))
        .slice(0, 8)
        .map((x) => ({ term: x.term, slug: x.slug }));
    }

    // relatedTerms: CSV → term/english→slug 解決、self 除外
    const relatedTerms: TermLite[] = (g.relatedTerms ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((term) => ({ term, slug: termSlugMap.get(term) ?? '' }))
      .filter((t) => t.slug.length > 0 && t.slug !== g.slug);

    const detailNorm = normalizeGridCta(g.detail, ctaReplacers);
    const shortDefNorm = normalizeGridCta(g.shortDef, ctaReplacers) ?? g.shortDef;
    if (detailNorm !== g.detail || shortDefNorm !== g.shortDef) normalizedCount++;

    index[g.slug] = {
      term: {
        id: g.id, term: g.term, slug: g.slug, english: g.english, reading: g.reading,
        shortDef: shortDefNorm, detail: detailNorm, category: g.category ?? [], subcategory: g.subcategory,
      },
      relatedNews, relatedExplainers, relatedOperators, relatedProjects,
      sameCategoryTerms, useCategoryFallback, relatedTerms,
    };
  }
  console.log(`  → ${Object.keys(index).length} entries (${Date.now() - t1}ms)`);
  console.log(`  導線ブロック正規化: ${normalizedCount} entries（旧値 9社6,507/関東を除く/業界初 → 現行値）`);

  const outDir = path.join(process.cwd(), 'src', 'lib', 'generated');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'glossary-detail-index.json');
  const json = JSON.stringify(index);
  fs.writeFileSync(outPath, json);
  const sizeMB = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);

  // 統計
  const withNews = Object.values(index).filter((e) => e.relatedNews.length > 0).length;
  const withExp = Object.values(index).filter((e) => e.relatedExplainers.length > 0).length;
  const withOps = Object.values(index).filter((e) => e.relatedOperators.length > 0).length;
  const withProj = Object.values(index).filter((e) => e.relatedProjects.length > 0).length;
  const withSame = Object.values(index).filter((e) => e.sameCategoryTerms.length > 0).length;
  const withRel = Object.values(index).filter((e) => e.relatedTerms.length > 0).length;
  console.log(`[precompute-glossary-detail] 書き出し完了: ${outPath} (${sizeMB} MB)`);
  console.log(`  entries=${Object.keys(index).length}`);
  console.log(`  関連あり: news=${withNews} explainer=${withExp} operator=${withOps} project=${withProj} 同カテゴリ=${withSame} relatedTerms=${withRel}`);
}

main().catch((err) => {
  console.error('[precompute-glossary-detail] ERROR:', err);
  process.exit(1);
});
