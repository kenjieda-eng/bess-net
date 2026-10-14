#!/usr/bin/env tsx
/**
 * scripts/gen-balancing-rules.ts — /tracker/balancing-rules の改定の定義を、T8 研究便の data.json と実装便の追補 JSON から生成する（T8 実装便・2026-10-14）
 *
 * 入力:
 *   reports/tool-balancing-rules-plan-2026-10-12.data.json （研究便・行 49・watch 1。★書き換えない＝sha256 f620df2f…）
 *   reports/tool-balancing-rules-2026-10-13.addendum.json  （実装便の追補: 裁定 T8-R1 の areas・group、R2 の status、R3 の新しい行、
 *                                                         R4 の dateBasis と各出典の資料の日付 date／dateFrom、表題の逐語）
 * 出力: src/data/balancing-rules.ts（★手で編集しない。直すときは追補 JSON かこのスクリプトを直して再生成する）
 *
 * 生成の規則（裁定）
 *   - R1: 揚水発電機の随意契約の行は group 'pumped-hydro-contract' と areas（公式の呼び方「北海道エリア」等）を持つ。
 *   - R2: C-9（未決定）・B-28（予定・開始日は未公表）・watch D-4b（注視・改定ではない）は pending に分け、タイムライン本体に入れない。
 *   - R4: announcedOn・effectiveFrom の根拠（dateBasis）と、各出典の資料の日付（date・dateFrom）を持つ。
 *   - 商品は公式呼称 → キー（primary 等）に置き換える。研究の記録（verification・ccEdits）は出力に入れない（data.json に残る）。
 *
 * 実行: npx tsx scripts/gen-balancing-rules.ts          （書き出す）
 *       npx tsx scripts/gen-balancing-rules.ts --check  （書き出さずに、既存の出力と一致するかだけ見る。不一致なら exit 1）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { isExcludedExplainer } from '../src/lib/explainer-excluded';
import { isExcludedEvent } from '../src/lib/events-excluded';
export {};

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'reports', 'tool-balancing-rules-plan-2026-10-12.data.json');
const ADD = path.join(ROOT, 'reports', 'tool-balancing-rules-2026-10-13.addendum.json');
const OUT = path.join(ROOT, 'src', 'data', 'balancing-rules.ts');
const CHECK = process.argv.includes('--check');

type Src = { name: string; publisher: string; url: string; where: string; quote: string; title_verbatim?: string };
type Row = {
  id: string; kind: string; title: string; announcedOn: string; effectiveFrom: string; products: string[];
  before: string; after: string; reasonQuote: string; sources: Src[];
  related: { policyEvent: string[]; explainer: string[]; catalogSeries: string[] };
  benchmarkWindow: { products: string[]; before: [string, string]; after: [string, string] } | null;
  batteryNote: string; note: string;
};
type DateRef = { source: number; quote: string };
type RowPatch = {
  /** title の上書き（略称・因果の語を直すとき。研究便の data.json は書き換えない） */
  title?: string;
  /** batteryNote の上書き（同） */
  batteryNote?: string;
  areas?: string[]; group?: string; status?: 'effective' | 'scheduled' | 'undecided' | 'watch'; pendingQuote?: string;
  /** pendingQuote が載っている出典の添字（その出典の quote に pendingQuote が含まれること＝verify で見る） */
  pendingQuoteSource?: number;
  dateBasis?: { announced: DateRef; effective?: DateRef }; dateException?: string;
  effectiveFrom?: string | null;
  /** 出典を足す（公表日の一次が行の出典に無かったとき。添字は既存の出典の後ろに続く） */
  sourcesAppend?: (Src & { date?: string; dateFrom?: string })[];
  /** 出典の逐語の置き換え（添字 → 逐語。研究便の quote に編集で付けた括弧書きが混じっていたとき） */
  sourceQuote?: Record<string, string>;
  /** 出典の該当箇所の置き換え（添字 → 該当箇所。該当箇所の書き方が出典の資料名と読み違えられるとき） */
  sourceWhere?: Record<string, string>;
  /** 出典の資料の日付をこの行に限って与える（ページ全体に日付の無い一覧の、該当の行の掲載表示など） */
  sourceDate?: Record<string, { date: string; dateFrom: string }>;
  /**
   * 変更前・変更後・理由の逐語の置き換え（レビュー役の照合で、研究便の値に編集の括弧書き・欠字・別資料の逐語が混じっていたとき）。
   * 当サイトの補足は〔〕で囲む（画面の見出しも「〔〕内は当サイトの補足」）。
   */
  before?: string;
  after?: string;
  reasonQuote?: string;
  /** 公表日の置き換え（同じ取引規程改定の行で公表日の取り方をそろえるとき。dateBasis.announced も合わせて与える） */
  announcedOn?: string;
};
/** 出典 1 本の取り直しの結果（url ごと）。name があれば資料名をそれに置き換える（一次の表題と研究便の資料名が違ったとき） */
type SourceMeta = { date: string; dateFrom: string; dateQuote: string; title_verbatim: string; http: string; name?: string };
type Addendum = {
  rowPatch: Record<string, RowPatch>;
  rowsAdd: (Row & RowPatch & { sources: (Src & { date?: string; dateFrom?: string })[] })[];
  sourceMeta: Record<string, SourceMeta>;
  /**
   * 関連の題名（研究便の microCMS GET＝scratchpad t8/cms.json・2026-10-12 の写し）。表示中かどうかの判定は画面側
   * （isExcludedExplainer・isExcludedEvent をビルド時に通す）。kind が「業界」の policy-events は getAllPolicyEvents に
   * 無い（/events 側）ので、ここで外して relatedDropped に理由を残す（裁定 T8-R7）。
   */
  relatedTitles: { explainer: Record<string, string>; policyEvent: Record<string, { title: string; kind: string[] }> };
};

const PRODUCT_KEY: Record<string, string> = {
  一次調整力: 'primary', '二次調整力①': 'secondary-1', '二次調整力②': 'secondary-2',
  '三次調整力①': 'tertiary-1', '三次調整力②': 'tertiary-2', 複合商品: 'composite',
};

const data = JSON.parse(fs.readFileSync(DATA, 'utf8')) as { rows: Row[]; watch: Row[] };
const add = JSON.parse(fs.readFileSync(ADD, 'utf8')) as Addendum;

const problems: string[] = [];
const relatedDropped: string[] = [];
/**
 * 該当箇所（where）から研究の照合記録（sha256・バイト数・「台帳と一致」）を外す。読者に出すのは頁・スライド・欄だけ。
 * 研究便の data.json には残る（照合の記録はそちらが正）。
 */
function cleanWhere(w: string): string {
  const out = w
    .replace(/（[^（）]*sha256[^（）]*）/g, '')
    .replace(/[／。]\s*(?:[\d,]+ bytes・)?sha256 [0-9a-f…]+(?:＝[^・。／]*)?(?:・\d+ 頁)?/g, '')
    .replace(/[。、]\s*[\d,]+ bytes/g, '')
    .replace(/(?:HTML|PDF)?\s*[\d,]+ bytes・/g, '')
    .trim();
  if (/sha256|bytes|台帳/.test(out)) problems.push(`該当箇所に照合の記録が残る: ${out}`);
  return out;
}
function shape(r: Row, p: RowPatch, extraSources?: (Src & { date?: string; dateFrom?: string })[]) {
  const products = r.products.map((x) => {
    const k = PRODUCT_KEY[x];
    if (!k) problems.push(`${r.id}: 商品「${x}」が公式呼称 6 つに無い`);
    return k ?? x;
  });
  const sources = [...(extraSources ?? r.sources), ...(p.sourcesAppend ?? [])].map((s0, i) => {
    const q = p.sourceQuote?.[String(i)];
    const w = p.sourceWhere?.[String(i)];
    const s = { ...s0, ...(q !== undefined ? { quote: q } : {}), ...(w !== undefined ? { where: w } : {}) };
    const m = add.sourceMeta[s.url];
    const sd = p.sourceDate?.[String(i)];
    const ds = sd?.date ?? (s as { date?: string }).date ?? m?.date ?? '';
    const df = sd?.dateFrom ?? (s as { dateFrom?: string }).dateFrom ?? m?.dateFrom ?? '';
    if (!m && !(s as { date?: string }).date) problems.push(`${r.id}: 出典 ${s.url} の取り直しの結果（sourceMeta）が無い`);
    return {
      name: m?.name ?? s.name, publisher: s.publisher, url: s.url, where: cleanWhere(s.where), quote: s.quote,
      date: ds || null, dateFrom: df || null,
    };
  });
  // 裁定 T8-R7: 非表示（explainer-excluded・events-excluded）は生成の時点で外す（画面でも外す＝二重の守り）。
  //   生成後に非表示が増えたら verify がデータ側で WARN を出す（再生成の合図）。
  const relEx = (r.related?.explainer ?? []).flatMap((slug) => {
    if (isExcludedExplainer(slug)) {
      relatedDropped.push(`${r.id}: 解説 ${slug}（非表示＝explainer-excluded）`);
      return [];
    }
    const title = add.relatedTitles.explainer[slug];
    if (!title) problems.push(`${r.id}: 関連の解説 ${slug} の題名が relatedTitles に無い`);
    return [{ slug, title: title ?? '' }];
  });
  const relPe = (r.related?.policyEvent ?? []).flatMap((slug) => {
    if (isExcludedEvent(slug)) {
      relatedDropped.push(`${r.id}: 政策イベント ${slug}（非表示＝events-excluded）`);
      return [];
    }
    const pe = add.relatedTitles.policyEvent[slug];
    if (!pe) {
      problems.push(`${r.id}: 関連の政策イベント ${slug} の題名が relatedTitles に無い`);
      return [];
    }
    if (pe.kind.includes('業界')) {
      relatedDropped.push(`${r.id}: ${slug}（kind「業界」＝getAllPolicyEvents に無い・/events 側）`);
      return [];
    }
    return [{ slug, title: pe.title }];
  });
  const effectiveFrom = p.effectiveFrom !== undefined ? p.effectiveFrom : r.effectiveFrom || null;
  return {
    id: r.id,
    kind: r.kind,
    status: p.status ?? 'effective',
    title: p.title ?? r.title,
    announcedOn: p.announcedOn ?? r.announcedOn,
    effectiveFrom: effectiveFrom || null,
    products,
    areas: p.areas ?? [],
    group: p.group ?? null,
    before: p.before ?? r.before,
    after: p.after ?? r.after,
    reasonQuote: (p.reasonQuote !== undefined ? p.reasonQuote : r.reasonQuote) || null,
    pendingQuote: p.pendingQuote ?? null,
    pendingQuoteSource: p.pendingQuoteSource ?? null,
    batteryNote: (p.batteryNote !== undefined ? p.batteryNote : r.batteryNote) || null,
    sources,
    related: { explainer: relEx, policyEvent: relPe, catalogSeries: r.related?.catalogSeries ?? [] },
    // 適用日を追補で null にした行は、適用日から決めた前後の窓も持たない（日付の無い窓を出さない）
    benchmarkWindow: r.benchmarkWindow && effectiveFrom ? { products: r.benchmarkWindow.products, before: r.benchmarkWindow.before, after: r.benchmarkWindow.after } : null,
    dateBasis: p.dateBasis ?? null,
    dateException: p.dateException ?? null,
  };
}

const rows = [
  ...data.rows.map((r) => shape(r, add.rowPatch[r.id] ?? {})),
  ...data.watch.map((r) => shape(r, { status: 'watch', ...(add.rowPatch[r.id] ?? {}) })),
  ...add.rowsAdd.map((r) => shape(r as Row, r, r.sources)),
];
const ids = rows.map((r) => r.id);
if (new Set(ids).size !== ids.length) problems.push('id が重複している');
if (problems.length) {
  console.error('[gen-balancing-rules] 生成を止めた:\n - ' + problems.join('\n - '));
  process.exit(1);
}
const timeline = rows.filter((r) => r.status === 'effective');
const pending = rows.filter((r) => r.status !== 'effective');
if (relatedDropped.length) console.log(`[gen-balancing-rules] 関連から外した政策イベント:\n - ${relatedDropped.join('\n - ')}`);

const header = `/**
 * src/data/balancing-rules.ts — 需給調整市場 制度変更トラッカー（/tracker/balancing-rules）の改定の定義
 * ★生成物（scripts/gen-balancing-rules.ts が reports/tool-balancing-rules-plan-2026-10-12.data.json と
 *   reports/tool-balancing-rules-2026-10-13.addendum.json から作る）。手で編集しない。
 * 一次が取れた改定だけ（網羅ではない）。日付は公表日（一次の日付）と適用日（実需給日）を分ける。
 */
`;
const types = `export type BalancingRuleKind = 'cap' | 'procurement' | 'product' | 'guideline' | 'battery';
export type BalancingProduct = 'primary' | 'secondary-1' | 'secondary-2' | 'tertiary-1' | 'tertiary-2' | 'composite';
export type BalancingRuleStatus = 'effective' | 'scheduled' | 'undecided' | 'watch';
export interface BalancingRuleSource { name: string; publisher: string; url: string; where: string; quote: string; date: string | null; dateFrom: string | null }
export interface BalancingRule {
  id: string;
  kind: BalancingRuleKind;
  status: BalancingRuleStatus;
  title: string;
  /** 公表日（一次の日付）YYYY-MM-DD */
  announcedOn: string;
  /** 適用日（実需給日・受渡日）。一次で日単位が取れないものは null */
  effectiveFrom: string | null;
  products: BalancingProduct[];
  /** 揚水発電機の随意契約の行のエリア（公式の呼び方） */
  areas: string[];
  group: 'pumped-hydro-contract' | null;
  before: string;
  after: string;
  reasonQuote: string | null;
  /** 予定・未決定・注視の行の一次の書きぶり（逐語） */
  pendingQuote: string | null;
  /** pendingQuote が載っている出典の添字 */
  pendingQuoteSource: number | null;
  batteryNote: string | null;
  sources: BalancingRuleSource[];
  /** 関連（題名は生成時の写し。表示中かどうかは画面がビルド時に isExcludedExplainer・isExcludedEvent で判定する） */
  related: { explainer: { slug: string; title: string }[]; policyEvent: { slug: string; title: string }[]; catalogSeries: string[] };
  benchmarkWindow: { products: BalancingProduct[]; before: [string, string]; after: [string, string] } | null;
  dateBasis: { announced: { source: number; quote: string }; effective?: { source: number; quote: string } } | null;
  dateException: string | null;
}
`;
// 一次を取った日の範囲（研究便の fetched_at の最小 〜 追補の generated）。画面の出典欄が使う（焼き込まない＝#121）
const fetchedDays = [...data.rows, ...data.watch].flatMap((r) => r.sources.map((s) => (s as { fetched_at?: string }).fetched_at ?? '')).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
const checked = { from: fetchedDays[0] ?? (add as unknown as { generated: string }).generated, to: (add as unknown as { generated: string }).generated };
const body = `${header}${types}
/** 一次を取った日の範囲（研究便の取得日 〜 実装便の取り直し日） */
export const BALANCING_RULES_CHECKED = ${JSON.stringify(checked)} as const;

/** タイムライン本体（適用済み・適用日が一次に無いものを含む） */
export const BALANCING_RULES: readonly BalancingRule[] = ${JSON.stringify(timeline, null, 2)} as BalancingRule[];

/** 予定・検討中・注視（改定ではないもの・裁定 T8-R2） */
export const BALANCING_RULES_PENDING: readonly BalancingRule[] = ${JSON.stringify(pending, null, 2)} as BalancingRule[];
`;
if (CHECK) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur.replace(/\r\n/g, '\n') !== body) {
    console.error('[gen-balancing-rules] 出力が data.json＋追補 JSON からの生成結果と一致しない（再生成が要る）');
    process.exit(1);
  }
  console.log(`[gen-balancing-rules] ok  出力は生成結果と一致（タイムライン ${timeline.length} 行・予定など ${pending.length} 行）`);
} else {
  fs.writeFileSync(OUT, body);
  console.log(`[gen-balancing-rules] 書き出し: ${path.relative(ROOT, OUT)}（タイムライン ${timeline.length} 行・予定など ${pending.length} 行）`);
}
