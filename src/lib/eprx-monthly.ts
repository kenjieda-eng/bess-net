/**
 * src/lib/eprx-monthly.ts — EPRX 月次落札単価（蓄電池）の参照ヘルパ（Lc-2 ■4 → EPRX 月次置換便 2026-10-07）
 *
 * なぜ要るか
 * ----------
 * 需給調整市場の落札単価は年度内の振れが大きく、三次調整力② FY2024 は 9.81〜234.89（24 倍）動く。
 * 年平均の単独表示は「その水準が年間を通じて続く」と読まれるため、年平均と年度内の幅を必ず同じ視野に出す。
 *
 * ★出どころ（2026-10-07 EPRX 月次置換便）
 *   月次はカタログの `balancing-price-monthly-{product}-battery`（R-28 §1・2026-10-06 catalog に着地・
 *   各 24 点 2024-04〜2026-03・「ー」（落札なし）の月は null）から読む。以前は EPRX 年次 PDF からの手転記
 *   （src/data/eprx-monthly-battery.json）を読んでいた。手転記 JSON は 1 サイクルは残し、
 *   scripts/verify-eprx-monthly.ts の軸4（カタログ月次 ＝ 手転記の 144 セル全一致）の片側にだけ使う（撤去は別便）。
 *
 * 落とし穴 #119（定義は一箇所）に従い、幅の算出も「カタログ年平均との一致判定」も**このファイルだけ**に置く。
 * 表示側（page / コンポーネント）でも検査側（scripts/verify-eprx-monthly.ts）でも同じ関数を通す。
 *
 * ★自己ガード（案B の肝・出どころがカタログになっても残す）
 *   月次（丸めた単純平均）と表示中の年平均がずれたら、幅を出さない（null を返す）。
 *   月次と年次は同じカタログでも別の系列として改訂されうる。build 時には scripts/verify-eprx-monthly.ts が
 *   同じ判定で警告を出すが、警告は見落とされうる。「警告が見落とされても、矛盾した数値は読者に出ない」ところまでを設計に入れる。
 */
// ★相対 import（@/ ではない）。このモジュールは scripts/verify-eprx-monthly.ts からも tsx で読まれるため、
//   src/lib/substations-frozen.ts と同じく「アプリとスクリプトの両方が読むファイル」の作法に合わせる。
// ★src/data/eic/ は prebuild（precompute-eic-data）が作る生成物。verify-eprx-monthly は存在を確かめてから本モジュールを読む。
import primaryMonthly from '../data/eic/balancing-price-monthly-primary-battery.json';
import secondary1Monthly from '../data/eic/balancing-price-monthly-secondary-1-battery.json';
import secondary2Monthly from '../data/eic/balancing-price-monthly-secondary-2-battery.json';
import tertiary1Monthly from '../data/eic/balancing-price-monthly-tertiary-1-battery.json';
import tertiary2Monthly from '../data/eic/balancing-price-monthly-tertiary-2-battery.json';
import compositeMonthly from '../data/eic/balancing-price-monthly-composite-battery.json';
// T1 実装便（2026-10-08）: 全電源の月次 6 本（/tools/balancing-benchmark の全電源ベンチ）。
// ★全電源の月次は「EPRX 公表の月次平均・算出方法は資料に明記なし」で、月次 12 値の単純平均は年次と一致しない（notes）。
//   蓄電池側の自己ガード（matchesCatalogAnnual）は使えない＝点の数・null なし・値の範囲・範囲の月の連続を scripts/verify-balancing-benchmark.ts が見る。
import primaryMonthlyAll from '../data/eic/balancing-price-monthly-primary.json';
import secondary1MonthlyAll from '../data/eic/balancing-price-monthly-secondary-1.json';
import secondary2MonthlyAll from '../data/eic/balancing-price-monthly-secondary-2.json';
import tertiary1MonthlyAll from '../data/eic/balancing-price-monthly-tertiary-1.json';
import tertiary2MonthlyAll from '../data/eic/balancing-price-monthly-tertiary-2.json';
import compositeMonthlyAll from '../data/eic/balancing-price-monthly-composite.json';

export type BalancingProductKey =
  | 'primary'
  | 'secondary-1'
  | 'secondary-2'
  | 'tertiary-1'
  | 'tertiary-2'
  | 'composite';

export type MonthlyStats = {
  /** 約定月の最小値 */
  min: number;
  /** 約定月の最大値 */
  max: number;
  /** 約定した月数（未約定＝PDF 上の「ー」・カタログの null は数えない） */
  awardedMonths: number;
  /** 約定月の単純平均（カタログの年平均と同じ定義） */
  mean: number;
  /** 出典 PDF のページ番号（カタログ notes の「p.NN」・依頼者が後から検算するため） */
  pdfPage: number;
  /** 出典の資料名（カタログ notes の「「2024年度の取引実績について」（2025年6月19日）」等） */
  pageHeading: string;
};

type CatalogMeta = {
  id?: string;
  name?: string;
  notes?: string;
  source_name?: string;
  source_url?: string;
  license_notice?: string;
  license_url?: string;
};
type CatalogSeries = { id: string; meta: CatalogMeta; points: { date: string; value: number | null }[] };

/** 商品の並び（表示・検査とも同じ順） */
const PRODUCTS: readonly BalancingProductKey[] = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'];

const MONTHLY: Record<BalancingProductKey, CatalogSeries> = {
  primary: primaryMonthly as unknown as CatalogSeries,
  'secondary-1': secondary1Monthly as unknown as CatalogSeries,
  'secondary-2': secondary2Monthly as unknown as CatalogSeries,
  'tertiary-1': tertiary1Monthly as unknown as CatalogSeries,
  'tertiary-2': tertiary2Monthly as unknown as CatalogSeries,
  composite: compositeMonthly as unknown as CatalogSeries,
};

/** 全電源の月次（T1 実装便） */
const MONTHLY_ALL: Record<BalancingProductKey, CatalogSeries> = {
  primary: primaryMonthlyAll as unknown as CatalogSeries,
  'secondary-1': secondary1MonthlyAll as unknown as CatalogSeries,
  'secondary-2': secondary2MonthlyAll as unknown as CatalogSeries,
  'tertiary-1': tertiary1MonthlyAll as unknown as CatalogSeries,
  'tertiary-2': tertiary2MonthlyAll as unknown as CatalogSeries,
  composite: compositeMonthlyAll as unknown as CatalogSeries,
};

/** 月次の種類: 全電源（all）か蓄電池（battery） */
export type MonthlyKind = 'all' | 'battery';
const seriesOf = (kind: MonthlyKind): Record<BalancingProductKey, CatalogSeries> => (kind === 'all' ? MONTHLY_ALL : MONTHLY);

/**
 * 月次系列の出所表記（カタログの source_name。6 系列とも同一＝代表として一次調整力から読む）。
 * license_notice（3 行）・license_url は表示中の年次系列と同一文字列なので、ページは年次の 3 行を 1 回だけ出す
 * （同一であることは scripts/verify-eprx-monthly.ts の軸6 が毎ビルド検査）。
 */
export const EPRX_MONTHLY_SOURCE = {
  sourceName: MONTHLY.primary.meta.source_name ?? null,
} as const;

/** 小数第 2 位で丸める（カタログの公表値と同じ桁） */
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** 日付（YYYY-MM-DD）→ 年度キー（4〜翌 3 月で切る。例 2025-03-01 → FY2024） */
function fiscalYearOf(date: string): string {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return `FY${m >= 4 ? y : y - 1}`;
}

/** 年度キー → その年度の取りまとめ資料の西暦（FY2024 → 2024） */
function fyYear(fy: string): string {
  return fy.replace(/^FY/, '');
}

/**
 * notes の出典部分から、年度の資料名とページを読む。
 * 例: 「出典: …（「2024年度の取引実績について」（2025年6月19日）p.14／「2025年度の取引実績について」（2026年6月18日）p.14）…」
 */
function sourceOfFy(notes: string | undefined, fy: string): { title: string; page: number } | null {
  if (!notes) return null;
  const re = new RegExp(`(「${fyYear(fy)}年度の取引実績について」（[^）]*）)p\\.(\\d+)`);
  const m = notes.match(re);
  return m ? { title: m[1], page: Number(m[2]) } : null;
}

/**
 * カタログ月次から統計を出す。データが無ければ null。
 * ★ここではカタログ年平均との突合をしない（月次の生値を返す）。突合は getVerifiedMonthlyStats で行う。
 */
export function getMonthlyStats(fy: string, product: BalancingProductKey): MonthlyStats | null {
  const s = MONTHLY[product];
  if (!s) return null;
  // null 月は約定なし＝平均にも幅にも含めない（awardedMonths は非 null の数）
  const values = s.points
    .filter((p) => fiscalYearOf(p.date) === fy)
    .map((p) => p.value)
    .filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  const src = sourceOfFy(s.meta.notes, fy);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    awardedMonths: values.length,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    pdfPage: src?.page ?? 0,
    pageHeading: src?.title ?? '',
  };
}

/**
 * 月次の単純平均（小数第 2 位に丸め）がカタログの年平均と一致するか。
 * 2026-09-20（手転記）・2026-10-07（カタログ月次）とも FY2024・FY2025 × 6 商品の 12 組すべてで一致した
 * （カタログ月次の notes にも「年次系列と一致することを恒等式で検算済み」とある）。
 * したがって「丸めて一致」を満たさない＝月次か年次のどちらかが動いた合図として扱ってよい。
 */
export function matchesCatalogAnnual(stats: MonthlyStats, catalogAnnual: number): boolean {
  return round2(stats.mean) === round2(catalogAnnual);
}

/**
 * 表示用。カタログ年平均と一致したときだけ幅を返す。
 * 一致しなければ null＝「年平均だけを出す（幅は出さない）」に縮退する。
 */
export function getVerifiedMonthlyStats(
  fy: string,
  product: BalancingProductKey,
  catalogAnnual: number | undefined,
): MonthlyStats | null {
  if (typeof catalogAnnual !== 'number') return null;
  const stats = getMonthlyStats(fy, product);
  if (!stats) return null;
  return matchesCatalogAnnual(stats, catalogAnnual) ? stats : null;
}

/** 年度に収録がある product キー一覧（検査スクリプト用） */
export function listProducts(fy: string): BalancingProductKey[] {
  return PRODUCTS.filter((p) => MONTHLY[p].points.some((pt) => fiscalYearOf(pt.date) === fy));
}

/** 収録年度一覧（検査スクリプト用。カタログ月次の点がある年度・昇順） */
export function listFiscalYears(): string[] {
  const set = new Set<string>();
  for (const p of PRODUCTS) for (const pt of MONTHLY[p].points) set.add(fiscalYearOf(pt.date));
  return [...set].sort();
}

/** 突合相手の年次系列 id（検査スクリプトがカタログ年平均を引くため） */
export function catalogSeriesOf(fy: string, product: BalancingProductKey): string | null {
  return listProducts(fy).includes(product) ? `balancing-price-${product}-battery` : null;
}

/** 月次系列 id */
export function monthlySeriesOf(product: BalancingProductKey): string {
  return MONTHLY[product].id;
}

/** 商品の日本語名（カタログの name「需給調整市場 一次調整力 蓄電池 月次平均落札単価 (月次)」の商品部分） */
export function productJaOf(fy: string, product: BalancingProductKey): string | null {
  if (!listProducts(fy).includes(product)) return null;
  const m = (MONTHLY[product].meta.name ?? '').match(/^需給調整市場\s+(\S+)\s+蓄電池/);
  return m ? m[1] : null;
}

/**
 * 出典欄に書く月次の出所（年度ごとの資料名とページ・カタログ notes の「出典: …p.NN」から組み立てる）。
 * 例: 「2024年度の取引実績について」（2025年6月19日）p.14・p.22・p.30・p.38・p.46・p.54
 * 年度を足しても書き換え漏れが起きないよう、データ側から組み立てる（Lc-2 ■4(d)）。
 */
export function monthlySourceLinesOf(fys: readonly string[], kind: MonthlyKind = 'battery'): string[] {
  const series = seriesOf(kind);
  return fys
    .map((fy) => {
      const srcs = PRODUCTS.map((p) => sourceOfFy(series[p].meta.notes, fy)).filter(
        (s): s is { title: string; page: number } => s !== null,
      );
      if (srcs.length === 0) return null;
      const pages = [...new Set(srcs.map((s) => s.page))].sort((a, b) => a - b);
      return `${srcs[0].title}p.${pages.join('・p.')}`;
    })
    .filter((s): s is string => s !== null);
}

/**
 * 月次の生の点（年月 YYYY-MM → 値・落札なしは null・日付の昇順）。T1 実装便（/tools/balancing-benchmark）。
 * サーバ側だけで使う（このファイルはカタログ JSON を import する＝クライアントに入れない）。
 */
export function getMonthlyPoints(kind: MonthlyKind, product: BalancingProductKey): { ym: string; value: number | null }[] {
  return [...seriesOf(kind)[product].points]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((p) => ({ ym: p.date.slice(0, 7), value: typeof p.value === 'number' ? p.value : null }));
}

/** 全電源・蓄電池の月次 12 本に共通する年月（昇順）。ベンチの範囲（summary）はここから＝焼き込まない */
export function monthlyCoverageYms(): string[] {
  const sets = (['all', 'battery'] as const).flatMap((k) => PRODUCTS.map((p) => new Set(getMonthlyPoints(k, p).map((x) => x.ym))));
  const first = sets[0] ? [...sets[0]] : [];
  return first.filter((ym) => sets.every((s) => s.has(ym))).sort();
}

/** 月次系列 id（種類つき） */
export function monthlySeriesIdOf(kind: MonthlyKind, product: BalancingProductKey): string {
  return seriesOf(kind)[product].id;
}

/**
 * 1 商品・1 年度の出所（資料名とページ）。読めなければ null。T1 実装便: scripts/verify-eprx-monthly.ts の軸5 が
 * 全電源・蓄電池の全組（年度 × 商品）で、読めるか・資料名が商品間で揃うかを見るため。
 */
export function monthlySourceOf(kind: MonthlyKind, fy: string, product: BalancingProductKey): { title: string; page: number } | null {
  return sourceOfFy(seriesOf(kind)[product].meta.notes, fy);
}
