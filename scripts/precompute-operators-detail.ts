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
// 2026-08-09: 構造化フィールド（事業者欄・sourceName）はマスタ完全一致で解決し、本文向け厳格ルールと和を取る
import {
  mentionsOperator,
  projectOperatorMatches,
  buildEntityIndex,
  resolveStructuredEntities,
  findStructuredFalseNegatives,
} from '../src/lib/operator-match';
import { LIST_EXCLUDED_PROJECT_SLUGS } from '../src/lib/projects-excluded';
// 表示対象外のニュース（off-topic PR / 主題ゲート）は関連に含めない＝404リンクを作らない（2026-08-08 実測42件）
import { isExcludedNews } from '../src/lib/news-excluded';
import { isTopicExcludedNews } from '../src/lib/news-topic-gate';
// Op8/Op9(2026-08-09): 関連解説はカテゴリ・ルーティング、関与案件は役割ラベル必須で抽出
import {
  explainerSlugsForOperator,
  OPERATOR_EXPLAINER_LIMIT,
} from '../src/lib/operator-explainer-routing';
import { detectInvolvementRoles, type InvolvementRole } from '../src/lib/project-involvement';
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
// Op9: 関与案件（保有ではない）。役割ラベルを必ず伴う。
type InvolvedProjectRef = ProjectRef & { roles: InvolvementRole[] };

type OperatorDetailEntry = {
  operator: Record<string, any>;   // page が描画する素フィールド
  bodyHtml: string;                // linkify 済本文
  relatedNews: NewsRef[];
  relatedProjects: ProjectRef[];
  involvedProjects: InvolvedProjectRef[];
  relatedExplainers: ExplainerRef[];
  sameCategoryOperators: OperatorLite[];
  gridArea: { area: string; areaJp: string } | null;
};

// news を relatedOperators（operator 関連）込みで取得（getAllNews は relatedOperators 非含）
// ※ sourceName を出力に載せ忘れると発信元突合が無言で死ぬ（2026-08-09 実測: 常に undefined だった）
async function fetchAllNewsWithOperators(): Promise<
  (NewsRef & { relatedOperatorIds: string[]; sourceName: string })[]
> {
  const out: (NewsRef & { relatedOperatorIds: string[]; sourceName: string })[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    const data = await client.getList<any>({
      endpoint: 'news',
      queries: { limit, offset, fields: 'id,title,slug,category,publishedAt,relatedOperators,sourceName', depth: 0, orders: '-publishedAt' },
    });
    for (const n of data.contents) {
      const rel = Array.isArray(n.relatedOperators) ? n.relatedOperators : [];
      const ids = rel.map((r: any) => (typeof r === 'string' ? r : r?.id)).filter(Boolean);
      out.push({ id: n.id, slug: n.slug, title: n.title, publishedAt: n.publishedAt ?? '', category: n.category ?? [], relatedOperatorIds: ids, sourceName: n.sourceName ?? '' });
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

  // ---- 構造化フィールドの事前解決（2026-08-09 偽陰性是正） --------------------
  // 事業者欄 / sourceName は「事業者名そのもの」が入る欄。本文向けの厳格ルール
  // （法人格つき完全形 or コア名4字以上）だけでは 3字以下の略称を落とし、
  // 実測で 株式会社レノバ=0件（実在6件）／丸紅株式会社=0件（実在2件）となっていた。
  // マスタとの完全一致で解決し（前方一致は東急⊂東急不動産 等 35組の誤マッチ余地があるため不採用）、
  // 既存のテキスト突合と **和集合** を取って既存の紐付けを一切落とさない。
  const entityIndex = buildEntityIndex(operators.map((o) => o.name));
  const projectsVisible = projects.filter((p) => !LIST_EXCLUDED_PROJECT_SLUGS.has(p.slug));
  const structProjectsByOp = new Map<string, Set<string>>(); // operator.name → project slug
  for (const p of projectsVisible) {
    for (const name of resolveStructuredEntities(p.operator ?? '', entityIndex)) {
      const set = structProjectsByOp.get(name) ?? new Set<string>();
      set.add(p.slug);
      structProjectsByOp.set(name, set);
    }
  }
  const structNewsByOp = new Map<string, Set<string>>(); // operator.name → news slug
  for (const n of news) {
    for (const name of resolveStructuredEntities(n.sourceName, entityIndex)) {
      const set = structNewsByOp.get(name) ?? new Set<string>();
      set.add(n.slug);
      structNewsByOp.set(name, set);
    }
  }
  const newsBySlug = new Map(news.map((n) => [n.slug, n]));
  console.log(`  構造化解決: projects=${structProjectsByOp.size}社 news(sourceName)=${structNewsByOp.size}社`);

  // 回帰検査は「表示上位10件」ではなく突合の**全件**で判定する（10件超の社を偽陰性と誤検出しないため）
  const allMatchedProjects = new Map<string, Set<string>>();
  const allMatchedNews = new Map<string, Set<string>>();
  // Op4(2026-08-12): 関与件数の全件カウント（表示は10件でsliceするため別持ち）
  const involvedCountByOp = new Map<string, number>();

  // Op8: 解説の slug 索引＋ルーティング先の実在検証（欠けたら警告＝リンク切れを作らない）
  const explainerBySlug = new Map(explainers.map((e) => [e.slug, e]));
  const routedAll = new Set<string>();
  for (const op of operators) for (const s of explainerSlugsForOperator(op.category)) routedAll.add(s);
  const missingRoutes = [...routedAll].filter((s) => !explainerBySlug.has(s));
  console.log(`  Op8 ルーティング先: ${routedAll.size}本 / 実在しない slug: ${missingRoutes.length}${missingRoutes.length ? ' ⚠ ' + missingRoutes.join(', ') : ''}`);
  const explainerEmpty: string[] = [];

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
    // ④ 発信元(sourceName)の構造化解決（「A株式会社／B株式会社」等の連名も分割して拾う）
    for (const slug of structNewsByOp.get(op.name) ?? []) {
      const n = newsBySlug.get(slug);
      if (!n || newsSeen.has(slug) || !visible(slug)) continue;
      newsSeen.add(slug);
      relatedNews.push({ id: n.id, slug: n.slug, title: n.title, publishedAt: n.publishedAt, category: n.category });
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
    allMatchedNews.set(op.name, new Set(relatedNews.map((n) => n.slug)));

    // Op1(2026-08-08) relatedProjects: 語境界＋法人格つきの厳格突合（素の部分一致は暴発するため不採用）
    //  ∪ 事業者欄のマスタ完全一致（2026-08-09 偽陰性是正）。
    // 一覧除外（非プロジェクト・301元）は掲載対象から外す＝404/301 になるリンクを作らない。
    const structProjects = structProjectsByOp.get(op.name) ?? new Set<string>();
    const matchedProjects = projectsVisible.filter(
      (p) => structProjects.has(p.slug) || projectOperatorMatches(p.operator ?? '', op.name)
    );
    allMatchedProjects.set(op.name, new Set(matchedProjects.map((p) => p.slug)));
    const relatedProjects: ProjectRef[] = matchedProjects
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      .slice(0, 10)
      .map((p) => ({ id: p.id, slug: p.slug, name: p.name, prefecture: p.prefecture, outputMw: p.outputMw, capacityMwh: p.capacityMwh }));

    // Op9(2026-08-09) involvedProjects: 保有ではない「関与」案件。
    // 役割語と社名が同一文にあるものだけを採用し、役割ラベルを必ず伴う。
    // 保有側（relatedProjects）に既に出ている案件は重複させない。
    const ownedSlugs = allMatchedProjects.get(op.name) ?? new Set<string>();
    const involvedAll = projectsVisible
      .filter((p) => !ownedSlugs.has(p.slug))
      .map((p) => ({ p, roles: detectInvolvementRoles(p.name ?? '', (p as any).body, op.name) }))
      .filter((x) => x.roles.length > 0);
    involvedCountByOp.set(op.name, involvedAll.length);
    const involvedProjects: InvolvedProjectRef[] = involvedAll
      .sort((a, b) => (b.p.publishedAt ?? '').localeCompare(a.p.publishedAt ?? ''))
      .slice(0, 10)
      .map(({ p, roles }) => ({
        id: p.id, slug: p.slug, name: p.name, prefecture: p.prefecture,
        outputMw: p.outputMw, capacityMwh: p.capacityMwh, roles,
      }));

    // Op8(2026-08-09) relatedExplainers: カテゴリ・ルーティング（全社に必ず付く）。
    // 本文一致（従来条件）は「加点」として先頭に寄せるだけで、必須条件にはしない。
    // ※従来はタイトル完全一致を必須にしていたため 544社すべて 0件だった。
    const haystack = `${op.name} ${op.description ?? ''} ${op.body ?? ''}`;
    const bonusSlugs = explainers
      .filter((e) => e.title && e.title.length >= 6 && haystack.includes(e.title) && e.slug !== op.slug)
      .sort((a, b) => b.title.length - a.title.length)
      .map((e) => e.slug);
    const routedSlugs = explainerSlugsForOperator(op.category);
    const explainerOrder: string[] = [];
    for (const s of [...bonusSlugs, ...routedSlugs]) {
      if (!explainerOrder.includes(s) && s !== op.slug) explainerOrder.push(s);
    }
    const relatedExplainers: ExplainerRef[] = explainerOrder
      .map((s) => explainerBySlug.get(s))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .slice(0, OPERATOR_EXPLAINER_LIMIT)
      .map((e) => ({ id: e.id, slug: e.slug, title: e.title, lead: (e as any).lead }));
    if (relatedExplainers.length === 0) explainerEmpty.push(op.slug);

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
      involvedProjects,
      relatedExplainers,
      sameCategoryOperators,
      gridArea,
    };
  }
  console.log(`  → ${Object.keys(index).length} entries (${Date.now() - t1}ms)`);

  const outDir = path.join(process.cwd(), 'src', 'lib', 'generated');
  fs.mkdirSync(outDir, { recursive: true });

  // Op4①②(2026-08-12): カテゴリ別一覧ページ用の軽量索引。
  // ★件数は表示上位10件（relatedProjects/involvedProjects のslice後）ではなく**突合の全件**を数える
  //   （日本蓄電池は32件・表示は10件のため、sliceを数えると過少になる）。
  const categoryIndex = operators.map((op) => {
    const entry = index[op.slug];
    return {
      slug: op.slug,
      name: op.name,
      category: op.category ?? [],
      projects: allMatchedProjects.get(op.name)?.size ?? 0,
      involved: involvedCountByOp.get(op.name) ?? 0,
    };
  });
  fs.writeFileSync(
    path.join(outDir, 'operators-category-index.json'),
    JSON.stringify(categoryIndex)
  );
  console.log(`  カテゴリ索引: ${categoryIndex.length}社 → operators-category-index.json`);

  const outPath = path.join(outDir, 'operators-detail-index.json');
  const json = JSON.stringify(index);
  fs.writeFileSync(outPath, json);
  const sizeMB = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);

  // ---- 回帰検査用の監査データを書き出す（2026-08-09） -------------------------
  // 「詳細ページで 0件表示になる社なのに、構造化フィールドに社名が現れる」組を機械抽出する。
  // 検査本体は scripts/verify-operator-matching.ts（本 JSON を読むだけ＝microCMS 不要）。
  const operatorNames = operators.map((o) => o.name);
  const fnProjects = findStructuredFalseNegatives(
    operatorNames,
    projectsVisible.map((p) => ({ key: p.slug, value: p.operator ?? '' })),
    entityIndex,
    allMatchedProjects
  );
  const fnNews = findStructuredFalseNegatives(
    operatorNames,
    news
      .filter((n) => !isExcludedNews(n.slug) && !isTopicExcludedNews(n.slug))
      .map((n) => ({ key: n.slug, value: n.sourceName })),
    entityIndex,
    allMatchedNews
  );
  // 暴発の常時監視（本文向け厳格ルールが短い社名で暴れていないか）
  const overreach: Record<string, { title: number; project: number }> = {};
  for (const name of ['ポート株式会社', 'パス株式会社', '株式会社テス', '東急株式会社']) {
    if (!operatorNames.includes(name)) continue;
    overreach[name] = {
      title: news.filter((n) => mentionsOperator(n.title ?? '', name)).length,
      project: projectsVisible.filter((p) => projectOperatorMatches(p.operator ?? '', name)).length,
    };
  }
  const auditPath = path.join(outDir, 'operators-match-audit.json');
  fs.writeFileSync(
    auditPath,
    JSON.stringify(
      {
        totals: {
          operators: operators.length,
          projectsVisible: projectsVisible.length,
          newsTotal: news.length,
          projectLinks: Object.values(index).reduce((a, e) => a + e.relatedProjects.length, 0),
          newsLinks: Object.values(index).reduce((a, e) => a + e.relatedNews.length, 0),
        },
        falseNegativeProjects: fnProjects,
        falseNegativeNews: fnNews,
        overreach,
      },
      null,
      2
    )
  );
  console.log(`  監査: ${auditPath} 偽陰性 projects=${fnProjects.length} news=${fnNews.length}`);
  if (fnProjects.length || fnNews.length) {
    for (const r of [...fnProjects, ...fnNews]) console.log(`    ★要確認 ${r.operator} ⇢ ${r.key}「${r.value}」`);
  }

  const withNews = Object.values(index).filter((e) => e.relatedNews.length > 0).length;
  const withProj = Object.values(index).filter((e) => e.relatedProjects.length > 0).length;
  const withExp = Object.values(index).filter((e) => e.relatedExplainers.length > 0).length;
  const withInv = Object.values(index).filter((e) => e.involvedProjects.length > 0).length;
  const invLinks = Object.values(index).reduce((a, e) => a + e.involvedProjects.length, 0);
  const roleCount: Record<string, number> = {};
  for (const e of Object.values(index)) {
    for (const p of e.involvedProjects) for (const r of p.roles) roleCount[r] = (roleCount[r] ?? 0) + 1;
  }
  console.log(`  Op8 関連解説: ${withExp}社（0件社=${explainerEmpty.length}）`);
  console.log(`  Op9 関与案件: ${withInv}社 / ${invLinks}件 役割内訳=${JSON.stringify(roleCount)}`);
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
