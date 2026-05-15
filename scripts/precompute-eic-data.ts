#!/usr/bin/env node
/**
 * EIC Data 統合 build 時 fetch スクリプト
 * 用途: bess-net build 前に data.eic-jp.org の全 113 系列を取得 → JSON 正規化 → src/data/eic/ に保存
 * 実行: npm run precompute-eic-data (prebuild hook で自動実行)
 *
 * CLAUDE.md §0 鉄則 #2 遵守: SSR で外部 API リクエスト 0
 *   → build 時のみ fetch、SSR では src/data/eic/*.json を import
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const EIC_PIPELINE_REPO = 'kenjieda-eng/eic-data-pipeline';
const EIC_PIPELINE_BRANCH = 'main';
const EIC_RAW_BASE = `https://raw.githubusercontent.com/${EIC_PIPELINE_REPO}/${EIC_PIPELINE_BRANCH}`;
const CATALOG_URL = `${EIC_RAW_BASE}/data/catalog/indicators.json`;

const GITHUB_PAT = process.env.GITHUB_PAT;
const OUT_DIR = resolve(process.cwd(), 'src/data/eic');

const DIR_MAP: Record<string, string> = {
  jepx: 'jepx',
  meti: 'meti',
  jma: 'jma',
  fuel: 'fuel',
  fx: 'fx',
  jgb: 'jgb',
  us: 'us',
  tankan: 'tankan',
};

interface Indicator {
  id: string;
  name: string;
  domain: string;
  frequency: string;
  unit: string;
  source_name: string;
  source_url: string;
  license: string;
  license_url?: string;
  license_notice?: string;
  observation_cutoff: string;
  updated_at: string;
  freshness_sla_days?: number;
  publisher?: string;
  depends_on?: string[];
  [key: string]: unknown;
}

interface DataPoint {
  date: string;
  value: number | null;
}

interface SeriesData {
  id: string;
  meta: Indicator;
  points: DataPoint[];
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'User-Agent': 'bess-net-build-script' };
  if (GITHUB_PAT) headers['Authorization'] = `Bearer ${GITHUB_PAT}`;
  return headers;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (HTTP ${res.status})`);
  return res.json() as Promise<T>;
}

async function fetchCsv(url: string): Promise<DataPoint[]> {
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (HTTP ${res.status})`);
  const text = await res.text();
  const records = parse(text, { columns: true, skip_empty_lines: true }) as Array<Record<string, string>>;
  return records.map((r) => ({
    date: r.date,
    value:
      r.value === '' || r.value === 'NaN' || r.value === 'null' || r.value == null
        ? null
        : Number.parseFloat(r.value),
  }));
}

function deriveCsvPath(ind: Indicator): string {
  const prefix = ind.id.split('-')[0];
  const dir = DIR_MAP[prefix] ?? ind.domain;
  return `data/processed/${dir}/${ind.id}.csv`;
}

async function main() {
  console.log('[eic-data] Starting precompute...');
  if (!GITHUB_PAT) {
    console.warn('[eic-data] ⚠ GITHUB_PAT not set, using unauthenticated 60 req/h limit');
  }

  // catalog 取得
  console.log('[eic-data] Fetching catalog...');
  let catalog: { indicators: Indicator[] };
  try {
    catalog = await fetchJson<{ indicators: Indicator[] }>(CATALOG_URL);
  } catch (err) {
    console.error('[eic-data] FATAL: cannot fetch catalog:', err);
    // ★ Soft-fail: catalog がまだ作られていない/repo が無い場合は空 catalog で続行
    //   src/data/eic/catalog.json は空配列で書き出し → eic-data.ts の getCatalog() は空を返す
    //   既存ページがフォールバックロジックを持つ前提
    if (process.env.EIC_ALLOW_EMPTY === '1') {
      console.warn('[eic-data] EIC_ALLOW_EMPTY=1 → writing empty catalog and exiting 0');
      mkdirSync(OUT_DIR, { recursive: true });
      writeFileSync(
        resolve(OUT_DIR, 'catalog.json'),
        JSON.stringify({ indicators: [], generated_at: new Date().toISOString(), indicator_count: 0 }, null, 2),
      );
      process.exit(0);
    }
    process.exit(1);
  }
  console.log(`[eic-data] Catalog loaded: ${catalog.indicators.length} indicators`);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2));

  // 各系列を 10 並列 fetch
  const concurrency = 10;
  let totalSucceeded = 0;
  let totalFailed = 0;
  const failedIds: string[] = [];

  for (let i = 0; i < catalog.indicators.length; i += concurrency) {
    const batch = catalog.indicators.slice(i, i + concurrency);
    // ★ 修正: results は batch と同じ順序・長さなので batch[idx] が正しく対応 (旧版は failed の idx と batch の idx が一致しないバグ)
    const results = await Promise.allSettled(
      batch.map(async (ind) => {
        const csvPath = deriveCsvPath(ind);
        const url = `${EIC_RAW_BASE}/${csvPath}`;
        const points = await fetchCsv(url);
        const data: SeriesData = { id: ind.id, meta: ind, points };
        writeFileSync(resolve(OUT_DIR, `${ind.id}.json`), JSON.stringify(data));
        return ind.id;
      }),
    );
    let succeeded = 0;
    let failedBatch = 0;
    results.forEach((r, idx) => {
      const ind = batch[idx];
      if (r.status === 'fulfilled') {
        succeeded++;
      } else {
        failedBatch++;
        const failedId = ind?.id ?? 'unknown';
        failedIds.push(failedId);
        console.warn(`[eic-data] FAILED: ${failedId} → ${r.reason}`);
      }
    });
    totalSucceeded += succeeded;
    totalFailed += failedBatch;

    console.log(
      `[eic-data] Batch ${Math.floor(i / concurrency) + 1}: ${succeeded}/${batch.length} OK`,
    );
  }

  console.log(
    `[eic-data] Done: ${totalSucceeded} succeeded, ${totalFailed} failed (failed ids: ${failedIds.join(', ') || 'none'})`,
  );

  // 失敗率閾値: デフォルト 30% (pipeline 側の系列拡充に合わせて環境変数で調整可)
  // 厳格運用に戻すには EIC_MAX_FAILURE_RATE=0.10 を設定
  const maxFailureRate = Number.parseFloat(process.env.EIC_MAX_FAILURE_RATE ?? '0.30');
  if (catalog.indicators.length > 0 && totalFailed > catalog.indicators.length * maxFailureRate) {
    console.error(`[eic-data] FATAL: failure rate ${(totalFailed / catalog.indicators.length * 100).toFixed(1)}% > ${(maxFailureRate * 100).toFixed(0)}%, aborting build`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[eic-data] Fatal error:', err);
  process.exit(1);
});
