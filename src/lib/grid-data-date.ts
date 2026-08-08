/**
 * src/lib/grid-data-date.ts — /grid の「データ基準日」表示（Gr2是正・2026-08-08）
 *
 * 表示値は microCMS substations の実値から precompute で集計したもの（src/data/substations/index.json の
 * area_dates）。last_updated=各社の公表時点 / fetched_at=当サイトの取込日。
 * area-meta.ts のハードコードは廃止（9/10エリアで実値とズレていたため）。
 * エリア内で公表時点がばらつく場合（東北=3種）は最大値（最新）を採用し、注記を添える。
 */
import substationsIndex from '@/data/substations/index.json';

export type AreaDates = {
  last_updated: string | null;
  fetched_at: string | null;
  last_updated_variants: number;
  count: number;
};

const AREA_DATES = (substationsIndex as { area_dates?: Record<string, AreaDates> }).area_dates ?? {};

/** エリア日本語名（例: 東北）→ 日付メタ。未知エリアは undefined（呼び出し側で非表示） */
export function getAreaDates(areaJp: string): AreaDates | undefined {
  return AREA_DATES[areaJp];
}

/**
 * 「公表 2026/04/01 時点（当サイト取込 2026/05/06）」形式の文言を返す。
 * 値が無い場合は null（＝表示しない・縮退フォールバック）。
 */
export function formatDataDateLabel(areaJp: string): string | null {
  const d = AREA_DATES[areaJp];
  if (!d || (!d.last_updated && !d.fetched_at)) return null;
  const slash = (s: string) => s.replace(/-/g, '/');
  const pub = d.last_updated ? `公表 ${slash(d.last_updated)} 時点` : '公表時点不明';
  const got = d.fetched_at ? `当サイト取込 ${slash(d.fetched_at)}` : null;
  const note = d.last_updated_variants > 1 ? `／エリア内に複数時点のデータを含む（最新を表示・${d.last_updated_variants}種）` : '';
  return `${pub}${got ? `（${got}）` : ''}${note}`;
}

/** 複数エリアが混在する県ページ用: 最新の公表時点を持つエリアの文言を返す */
export function formatDataDateLabelForAreas(areasJp: string[]): string | null {
  const uniq = [...new Set(areasJp.filter(Boolean))];
  const picked = uniq
    .map((a) => ({ a, d: AREA_DATES[a] }))
    .filter((x) => x.d)
    .sort((x, y) => (y.d!.last_updated || '').localeCompare(x.d!.last_updated || ''));
  if (picked.length === 0) return null;
  const label = formatDataDateLabel(picked[0].a);
  if (!label) return null;
  return uniq.length > 1 ? `${label}／複数エリアのデータを含む（最新を表示）` : label;
}
