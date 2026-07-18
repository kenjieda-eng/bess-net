#!/usr/bin/env tsx
/**
 * scripts/precompute-news-topic-gate.ts — news 主題ゲートの build 時事前計算（news分析2026-07-18 P0）
 *
 * 全 news を body 込みで取得し、「title または本文」に主題キーワードを含まないものを
 * src/lib/generated/news-topic-exclusions.json に出力する（#102 precompute 方式・runtime 0）。
 * - 既存除外（編集部カテゴリ・news-excluded）はここでは対象外＝表示中の集合のみ判定
 *   （news-excluded 済み slug はどのみち getIndustryNews で除外されるため二重管理しない）
 * - NEWS_TOPIC_ALLOWLIST の slug は除外しない（誤除外復帰・news-topic-gate.ts 側で管理）
 * - 出力は slug ソート済み・タイムスタンプなし＝データ不変なら差分ゼロ（drift 抑制）
 *
 * 実行: prebuild（build:related-news より前）。手動: npx tsx --env-file=.env.local scripts/precompute-news-topic-gate.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TOPIC_PATTERNS, NEWS_TOPIC_ALLOWLIST } from '../src/lib/news-topic-gate';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('[news-topic-gate] ERROR: MICROCMS env required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/news`;

type Row = { slug: string; title?: string; lead?: string; tags?: string; body?: string };

const hit = (text: string) => TOPIC_PATTERNS.some((re) => re.test(text));

async function main(): Promise<void> {
  const all: Row[] = [];
  for (let offset = 0; offset < 3000; offset += 50) {
    const r = await fetch(
      `${BASE}?limit=50&offset=${offset}&fields=slug,title,lead,tags,body&orders=-publishedAt`,
      { headers: { 'X-MICROCMS-API-KEY': API_KEY! } }
    );
    if (!r.ok) throw new Error(`GET news → HTTP ${r.status}`);
    const d = (await r.json()) as { totalCount: number; contents: Row[] };
    all.push(...d.contents);
    if (all.length >= d.totalCount) break;
  }

  const excludedSlugs = all
    .filter((n) => !NEWS_TOPIC_ALLOWLIST.includes(n.slug))
    .filter((n) => !hit(`${n.title ?? ''}\n${n.lead ?? ''}\n${n.tags ?? ''}\n${n.body ?? ''}`))
    .map((n) => n.slug)
    .sort();

  const outPath = path.join(process.cwd(), 'src/lib/generated/news-topic-exclusions.json');
  fs.writeFileSync(outPath, JSON.stringify({ excludedSlugs }, null, 2) + '\n');
  console.log(`[news-topic-gate] news ${all.length}件中 主題不適合 ${excludedSlugs.length}件 → ${outPath}`);
}
main().catch((e) => { console.error('[news-topic-gate] FATAL:', e); process.exit(1); });
