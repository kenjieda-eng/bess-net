/**
 * EIC Data build 時データ読み込みヘルパー
 * SSR 時は src/data/eic/*.json から import で読むのみ（外部 fetch 0）
 */
import type { SeriesData, Indicator, Catalog } from '@/types/eic';

// catalog は build 時に precompute スクリプトが書き出す
// 存在しない場合は空 catalog を返すフォールバック
let _catalog: Catalog | null = null;
async function loadCatalogSafe(): Promise<Catalog> {
  if (_catalog) return _catalog;
  try {
    const mod = await import('@/data/eic/catalog.json');
    _catalog = (mod.default ?? mod) as Catalog;
  } catch {
    _catalog = { indicators: [], indicator_count: 0 };
  }
  return _catalog;
}

export async function getCatalog(): Promise<Catalog> {
  return loadCatalogSafe();
}

export async function getIndicator(id: string): Promise<Indicator | undefined> {
  const cat = await loadCatalogSafe();
  return cat.indicators.find((ind) => ind.id === id);
}

export async function getIndicatorsByDomain(domain: string): Promise<Indicator[]> {
  const cat = await loadCatalogSafe();
  return cat.indicators.filter((ind) => ind.domain === domain);
}

export async function getIndicatorsByIdPrefix(prefix: string): Promise<Indicator[]> {
  const cat = await loadCatalogSafe();
  return cat.indicators.filter((ind) => ind.id.startsWith(prefix));
}

/**
 * 個別系列のデータを取得 (build 時 import 解決)
 * SSR 時は読み込み済みデータのみアクセス可能
 * 失敗時 null を返す (フォールバック責任は呼び出し側)
 */
export async function getSeries(id: string): Promise<SeriesData | null> {
  try {
    const data = await import(`@/data/eic/${id}.json`);
    return (data.default ?? data) as SeriesData;
  } catch {
    return null;
  }
}

/**
 * 複数系列を並列読み込み (null を除外)
 */
export async function getSeriesMany(ids: string[]): Promise<SeriesData[]> {
  const results = await Promise.all(ids.map((id) => getSeries(id)));
  return results.filter((r): r is SeriesData => r !== null);
}
