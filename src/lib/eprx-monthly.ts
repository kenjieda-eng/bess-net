/**
 * src/lib/eprx-monthly.ts — EPRX 月次落札単価（蓄電池）の参照ヘルパ（Lc-2 ■4）
 *
 * なぜ要るか
 * ----------
 * EIC カタログは年平均しか持たない（frequency: annual・points 2 点）。しかし需給調整市場の落札単価は
 * 年度内の振れが大きく、三次調整力② FY2024 は 9.81〜234.89（24 倍）動く。年平均の単独表示は
 * 「その水準が年間を通じて続く」と読まれるため、年平均と年度内の幅を必ず同じ視野に出す。
 *
 * 落とし穴 #119（定義は一箇所）に従い、幅の算出も「カタログ年平均との一致判定」も**このファイルだけ**に置く。
 * 表示側（page / コンポーネント）でも検査側（scripts/verify-eprx-monthly.ts）でも同じ関数を通す。
 *
 * ★自己ガード（案B の肝）
 *   転記データとカタログがずれたら、幅を出さない（null を返す）。
 *   build 時には scripts/verify-eprx-monthly.ts が同じ判定で警告を出すが、警告は見落とされうる。
 *   「警告が見落とされても、矛盾した数値は読者に出ない」ところまでを設計に入れる。
 */
// ★相対 import（@/ ではない）。このモジュールは scripts/verify-eprx-monthly.ts からも tsx で読まれるため、
//   src/lib/substations-frozen.ts と同じく「アプリとスクリプトの両方が読むファイル」の作法に合わせる。
import monthlyData from '../data/eprx-monthly-battery.json';

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
  /** 約定した月数（未約定＝PDF 上の「ー」は数えない） */
  awardedMonths: number;
  /** 約定月の単純平均（カタログの年平均と同じ定義） */
  mean: number;
  /** 転記元 PDF のページ番号（依頼者が後から検算するため） */
  pdfPage: number;
  /** 転記元 PDF の見出し */
  pageHeading: string;
};

type MonthlyProduct = {
  product_ja: string;
  catalog_series: string;
  pdf_page: number;
  page_heading: string;
  months: Record<string, number | null>;
  awarded_months: number;
};

type MonthlyFile = {
  _meta: Record<string, string>;
  fiscal_years: Record<string, { pdf: Record<string, string>; products: Record<string, MonthlyProduct> }>;
};

const DATA = monthlyData as unknown as MonthlyFile;

export const EPRX_MONTHLY_META = DATA._meta;

/** 小数第 2 位で丸める（カタログの公表値と同じ桁） */
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * 転記データから月次の統計を出す。データが無ければ null。
 * ★ここではカタログとの突合をしない（生の転記値を返す）。突合は getVerifiedMonthlyStats で行う。
 */
export function getMonthlyStats(fy: string, product: BalancingProductKey): MonthlyStats | null {
  const p = DATA.fiscal_years?.[fy]?.products?.[product];
  if (!p) return null;
  const values = Object.values(p.months).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    awardedMonths: values.length,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    pdfPage: p.pdf_page,
    pageHeading: p.page_heading,
  };
}

/**
 * 月次の単純平均（小数第 2 位に丸め）がカタログの年平均と一致するか。
 * 2026-09-20 実測では FY2024・FY2025 × 6 商品の 12 組すべてで厳密一致した（最大生差 0.0045）。
 * したがって「丸めて一致」を満たさない＝転記かカタログのどちらかが動いた合図として扱ってよい。
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
  return Object.keys(DATA.fiscal_years?.[fy]?.products ?? {}) as BalancingProductKey[];
}

/** 収録年度一覧（検査スクリプト用） */
export function listFiscalYears(): string[] {
  return Object.keys(DATA.fiscal_years ?? {});
}

/** 系列 id（検査スクリプトがカタログ側を引くため） */
export function catalogSeriesOf(fy: string, product: BalancingProductKey): string | null {
  return DATA.fiscal_years?.[fy]?.products?.[product]?.catalog_series ?? null;
}

/** 商品の日本語名 */
export function productJaOf(fy: string, product: BalancingProductKey): string | null {
  return DATA.fiscal_years?.[fy]?.products?.[product]?.product_ja ?? null;
}

/**
 * 転記元 PDF の「公表元でのファイル名」（出所表示用）。
 * ★手元の作業ファイル名（local_file_name）を出してはいけない。読者も依頼者も辿れない。
 */
export function pdfFileNameOf(fy: string): string | null {
  return DATA.fiscal_years?.[fy]?.pdf?.published_file_name ?? null;
}
