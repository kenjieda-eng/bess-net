#!/usr/bin/env tsx
/**
 * scripts/precompute-projects-pref-count.ts — 県別プロジェクト件数（Gr4・2026-08-08）
 *
 * 全 projects を 1回取得し、一覧除外（非プロジェクト＋301元 = isListExcludedProject と同集合）を
 * 除いた「都道府県別の件数」を src/lib/generated/projects-pref-count.json に出力する
 * （#102 precompute 方式・runtime microCMS 0）。/grid の県ページ・変電所詳細の
 * 「この県の蓄電所案件 ◯件 → /projects」導線に使用。0件の県はキー自体を出力しない。
 * 出力は県名ソート・タイムスタンプなし＝データ不変なら差分ゼロ（drift 抑制）。
 *
 * 実行: prebuild（build:projects-pref-count）。手動: npx tsx --env-file=.env.local scripts/precompute-projects-pref-count.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('[projects-pref-count] ERROR: MICROCMS env required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;

// 一覧除外集合はコード SSOT（src/lib/projects-excluded.ts）と同じ定義を re-export できないため
// （tsx から src/lib の import は可能）直接 import する。
import { LIST_EXCLUDED_PROJECT_SLUGS } from '../src/lib/projects-excluded';

type Row = { slug: string; prefecture?: string };

async function main(): Promise<void> {
  const all: Row[] = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const r = await fetch(`${BASE}?limit=100&offset=${offset}&fields=slug,prefecture`, {
      headers: { 'X-MICROCMS-API-KEY': API_KEY! },
    });
    if (!r.ok) throw new Error(`GET projects → HTTP ${r.status}`);
    const d = (await r.json()) as { totalCount: number; contents: Row[] };
    all.push(...d.contents);
    if (all.length >= d.totalCount) break;
  }
  const visible = all.filter((p) => !LIST_EXCLUDED_PROJECT_SLUGS.has(p.slug));

  const counts: Record<string, number> = {};
  for (const p of visible) {
    const pref = (p.prefecture || '').trim();
    // 「宮城県」「東京都・兵庫県…（複数）」等の表記に対応: 単一都道府県のみ計上（複数県・空は対象外）
    const m = pref.match(/^(.{2,3}?[都道府県])$/);
    if (!m) continue;
    counts[m[1]] = (counts[m[1]] || 0) + 1;
  }
  const sorted: Record<string, number> = {};
  for (const k of Object.keys(counts).sort()) sorted[k] = counts[k];

  const outPath = path.join(process.cwd(), 'src/lib/generated/projects-pref-count.json');
  fs.writeFileSync(outPath, JSON.stringify(sorted, null, 1) + '\n');
  console.log(`[projects-pref-count] projects ${all.length}件（可視 ${visible.length}）→ ${Object.keys(sorted).length}都道府県 → ${outPath}`);
}
main().catch((e) => { console.error('[projects-pref-count] FATAL:', e); process.exit(1); });
