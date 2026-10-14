/**
 * src/lib/balancing-rules.ts — 需給調整市場 制度変更トラッカー（/tracker/balancing-rules）の表示用の純関数（T8 実装便・2026-10-14）
 *
 * - 定義は src/data/balancing-rules.ts（生成物）。このファイルは並べ方・絞り込み・前後比較の導線・ラベルだけ。
 * - 当サイトは改定の良し悪しや収益への影響を評価しない（ラベル・文に評価語を入れない）。
 * - 前後比較（裁定 T8-R6）: 範囲内かどうかは build 時に monthlyCoverageYms() で判定する（研究便の固定値を使わない）。
 */
import type { BalancingProduct, BalancingRule, BalancingRuleKind, BalancingRuleStatus } from '@/data/balancing-rules';

export const KIND_LABEL: Readonly<Record<BalancingRuleKind, string>> = {
  cap: 'A 上限価格',
  procurement: 'B 募集量・調達量',
  product: 'C 商品仕様',
  guideline: 'D ガイドライン・監視',
  battery: 'E 蓄電池に関わる要件',
};
export const KIND_ORDER: readonly BalancingRuleKind[] = ['cap', 'procurement', 'product', 'guideline', 'battery'];

/** 商品の公式呼称 */
export const PRODUCT_LABEL: Readonly<Record<BalancingProduct, string>> = {
  primary: '一次調整力',
  'secondary-1': '二次調整力①',
  'secondary-2': '二次調整力②',
  'tertiary-1': '三次調整力①',
  'tertiary-2': '三次調整力②',
  composite: '複合商品',
};
export const PRODUCT_ORDER: readonly BalancingProduct[] = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'];

export const STATUS_LABEL: Readonly<Record<Exclude<BalancingRuleStatus, 'effective'>, string>> = {
  undecided: '未決定',
  scheduled: '予定（開始日は未公表）',
  watch: '注視（改定ではない）',
};

export const PUMPED_HYDRO_GROUP = 'pumped-hydro-contract' as const;

/** エリアの並び（北から。選択肢はデータにあるエリアだけをこの順で出す＝#124 の決定的な並び） */
export const AREA_ORDER: readonly string[] = ['北海道エリア', '東北エリア', '東京エリア', '中部エリア', '北陸エリア', '関西エリア', '中国エリア', '四国エリア', '九州エリア', '沖縄エリア'];
export const sortAreas = (areas: Iterable<string>): string[] =>
  [...new Set(areas)].sort((a, b) => {
    const ia = AREA_ORDER.indexOf(a);
    const ib = AREA_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'ja');
  });

/**
 * 出典の発行者の名前を、出典欄の一覧のためにそろえる（法人格・会議の事務局名・括弧書きを外す）。
 * 例: 「一般社団法人 電力需給調整力取引所（EPRX）」→「電力需給調整力取引所」、「電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第42回 資料３）」→「電力広域的運営推進機関」
 */
export function publisherShort(p: string): string {
  return p
    .replace(/（.*$/, '')
    .replace(/^一般社団法人\s*/, '')
    .replace(/株式会社$/, '')
    .replace(/\s.*$/, '')
    .trim();
}

/** 並べる日付: 適用日、無ければ公表日 */
export const sortDate = (r: Pick<BalancingRule, 'effectiveFrom' | 'announcedOn'>): string => r.effectiveFrom ?? r.announcedOn;

/** タイムラインの並び（新しい順・同じ日付は id の順で決まる＝#124 のタイブレーク） */
export function sortTimeline<T extends Pick<BalancingRule, 'effectiveFrom' | 'announcedOn' | 'id'>>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => (sortDate(a) < sortDate(b) ? 1 : sortDate(a) > sortDate(b) ? -1 : a.id.localeCompare(b.id, 'ja')));
}

/** 年度（4 月始まり）。YYYY-MM-DD → 2026 など */
export function fiscalYearOf(date: string): number {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return m >= 4 ? y : y - 1;
}

export type TimelineItem<T> = { type: 'row'; row: T } | { type: 'group'; key: string; fiscalYear: number; rows: T[] };

/**
 * タイムラインの項目（裁定 T8-R1）: 揚水発電機の随意契約の行は、年度ごとに 1 つの開閉欄にまとめる。
 * 開閉欄の位置は、その年度の行のいちばん新しい日付。並びは sortTimeline と同じ規則。
 */
export function buildTimelineItems<T extends Pick<BalancingRule, 'effectiveFrom' | 'announcedOn' | 'id' | 'group'>>(rows: readonly T[]): TimelineItem<T>[] {
  const sorted = sortTimeline(rows);
  const groups = new Map<number, T[]>();
  const items: TimelineItem<T>[] = [];
  for (const r of sorted) {
    if (r.group === PUMPED_HYDRO_GROUP) {
      const fy = fiscalYearOf(sortDate(r));
      if (!groups.has(fy)) {
        groups.set(fy, []);
        items.push({ type: 'group', key: `${PUMPED_HYDRO_GROUP}-${fy}`, fiscalYear: fy, rows: groups.get(fy) as T[] });
      }
      (groups.get(fy) as T[]).push(r);
    } else {
      items.push({ type: 'row', row: r });
    }
  }
  return items;
}

export const pumpedHydroGroupTitle = (fy: number, n: number) => `揚水発電機の随意契約に伴う募集量の見直し（${fy}年度・${n} 件）`;

export type RuleFilter = { kind: BalancingRuleKind | ''; product: BalancingProduct | ''; area: string; battery: boolean };
export const EMPTY_FILTER: RuleFilter = { kind: '', product: '', area: '', battery: false };

/**
 * 絞り込み。エリア: エリアを持つ行（揚水発電機の随意契約＝裁定 T8-R1 の 12 行だけ）はそのエリアの行だけを残し、
 * エリアを持たない行（揚水随契以外の改定。B-27 の東エリア3社のようにエリアが限られるものも含む）は残す。
 * 蓄電池: batteryNote がある行か、区分 E の行。
 */
export function matchesFilter(r: Pick<BalancingRule, 'kind' | 'products' | 'areas' | 'batteryNote'>, f: RuleFilter): boolean {
  if (f.kind && r.kind !== f.kind) return false;
  if (f.product && !r.products.includes(f.product)) return false;
  if (f.area && r.areas.length > 0 && !r.areas.includes(f.area)) return false;
  if (f.battery && !(r.batteryNote || r.kind === 'battery')) return false;
  return true;
}

export type BenchmarkLink =
  | { kind: 'link'; href: string; productLabel: string; multiProduct: boolean; windowText: string }
  /** 後の期間が月次の範囲の後ろにはみ出す＝月次の公表を待つ */
  | { kind: 'wait'; lastYm: string }
  /** 前の期間が月次の範囲の始まりより前＝この先も比べられない（月次は 2024年4月から） */
  | { kind: 'before-coverage'; firstYm: string }
  | { kind: 'none' };

/**
 * 前後比較の導線（裁定 T8-R6）。前後の月がすべて月次の範囲（coverage）に入るときだけリンクを出す（R6＝商品と期間だけ）。
 * coverage は build 時の monthlyCoverageYms()（YYYY-MM の配列・昇順）。
 */
export function benchmarkLinkOf(r: Pick<BalancingRule, 'benchmarkWindow'>, coverage: readonly string[]): BenchmarkLink {
  const w = r.benchmarkWindow;
  if (!w || w.products.length === 0 || coverage.length === 0) return { kind: 'none' };
  const first = coverage[0];
  const last = coverage[coverage.length - 1];
  if (w.before[0] < first) return { kind: 'before-coverage', firstYm: first };
  if (w.after[1] > last) return { kind: 'wait', lastYm: last };
  const p = w.products[0];
  return {
    kind: 'link',
    href: `/tools/balancing-benchmark?product=${p}&from=${w.before[0]}&to=${w.after[1]}`,
    productLabel: PRODUCT_LABEL[p],
    multiProduct: w.products.length > 1,
    windowText: windowLabel(w),
  };
}

/** 前後比較の窓の月の表示（例「前 2025年12月〜2026年2月／後 2026年4月〜6月」） */
export function windowLabel(w: NonNullable<BalancingRule['benchmarkWindow']>): string {
  const range = ([a, b]: [string, string]) => `${ymLabel(a)}〜${a.slice(0, 4) === b.slice(0, 4) ? `${Number(b.slice(5, 7))}月` : ymLabel(b)}`;
  return `前 ${range(w.before)}／後 ${range(w.after)}`;
}

export const ymLabel = (ym: string) => `${Number(ym.slice(0, 4))}年${Number(ym.slice(5, 7))}月`;
export const dateLabel = (d: string) => `${Number(d.slice(0, 4))}年${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;
