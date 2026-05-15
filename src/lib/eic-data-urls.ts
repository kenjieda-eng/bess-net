/**
 * EIC Data GitHub raw URL 定数
 * data.eic-jp.org の元データ (eic-data-pipeline repo) を build 時に fetch する
 */

const EIC_PIPELINE_REPO = 'kenjieda-eng/eic-data-pipeline';
const EIC_PIPELINE_BRANCH = 'main';
export const EIC_RAW_BASE = `https://raw.githubusercontent.com/${EIC_PIPELINE_REPO}/${EIC_PIPELINE_BRANCH}`;

// catalog (113 系列メタデータ + D-011 19 項目スキーマ)
export const CATALOG_URL = `${EIC_RAW_BASE}/data/catalog/indicators.json`;

// 個別系列 CSV (date, value の 2 列)
export function seriesCsvUrl(domain: string, id: string): string {
  return `${EIC_RAW_BASE}/data/processed/${domain}/${id}.csv`;
}

// 個別系列メタデータ (D-011 19 項目)
export function seriesMetaUrl(domain: string, id: string): string {
  return `${EIC_RAW_BASE}/data/processed/${domain}/${id}.metadata.json`;
}

// id プレフィックス → 実際のディレクトリ名マッピング (L-008 対応)
// catalog の domain と実ディレクトリが完全一致しないケースに対応
export const DIR_MAP: Record<string, string> = {
  jepx: 'jepx',
  meti: 'meti',
  jma: 'jma',
  fuel: 'fuel',
  fx: 'fx',
  jgb: 'jgb',
  us: 'us',
  tankan: 'tankan',
};

export function deriveCsvDir(id: string, fallback: string): string {
  const prefix = id.split('-')[0];
  return DIR_MAP[prefix] ?? fallback;
}
