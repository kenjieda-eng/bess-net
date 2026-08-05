#!/usr/bin/env tsx
/**
 * scripts/precompute-explainer-related.ts — 「この解説の先へ」⑤技術・設備フォールバックの関連2本（E1・2026-08-05）
 *
 * 全 explainer を 1回取得し、各記事（低圧投資を除く）に同カテゴリ（先頭 category 一致）の
 * 関連解説を最大2本（自己除外・低圧投資除外・publishedAt 降順）を事前計算して
 * src/lib/generated/explainer-related-map.json に出力する（#102 precompute 方式・runtime 0）。
 * - カテゴリ空の記事は「その他」同士でマッチ
 * - 出力は slug ソート・タイムスタンプなし＝データ不変なら差分ゼロ（drift 抑制）
 *
 * 実行: prebuild（build:related-news と同列）。手動: npx tsx --env-file=.env.local scripts/precompute-explainer-related.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('[explainer-related] ERROR: MICROCMS env required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/explainer`;

type Row = { slug: string; title: string; category?: string[]; publishedAt?: string };

async function main(): Promise<void> {
  const all: Row[] = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const r = await fetch(
      `${BASE}?limit=100&offset=${offset}&fields=slug,title,category,publishedAt&orders=-publishedAt`,
      { headers: { 'X-MICROCMS-API-KEY': API_KEY! } }
    );
    if (!r.ok) throw new Error(`GET explainer → HTTP ${r.status}`);
    const d = (await r.json()) as { totalCount: number; contents: Row[] };
    all.push(...d.contents);
    if (all.length >= d.totalCount) break;
  }

  // 低圧投資（/lv/invest 専用）は対象外（src/lib/lv-invest.ts と同判定: category に 低圧投資）
  const pool = all.filter((a) => !(a.category || []).includes('低圧投資'));
  const catOf = (a: Row) => (a.category && a.category[0]) || 'その他';

  const map: Record<string, { slug: string; title: string }[]> = {};
  for (const a of pool) {
    const c = catOf(a);
    map[a.slug] = pool
      .filter((b) => b.slug !== a.slug && catOf(b) === c)
      .slice(0, 2)
      .map((b) => ({ slug: b.slug, title: b.title }));
  }

  const sorted: typeof map = {};
  for (const k of Object.keys(map).sort()) sorted[k] = map[k];

  const outPath = path.join(process.cwd(), 'src/lib/generated/explainer-related-map.json');
  fs.writeFileSync(outPath, JSON.stringify(sorted, null, 1) + '\n');
  console.log(`[explainer-related] explainer ${all.length}件（非lv ${pool.length}）→ 関連マップ ${Object.keys(sorted).length}entry → ${outPath}`);
}
main().catch((e) => { console.error('[explainer-related] FATAL:', e); process.exit(1); });
