#!/usr/bin/env tsx
/**
 * scripts/scout-w5-tsuishu-2026-09-05.ts — 金曜#5 追修便 読取専用スカウト（書込ゼロ）
 * ■1 policy-events 対象レコードの特定＋現値 / ■3■4 projects 2件＋西方町の全field / ■5 glossary 4語の全field＋updatedAt
 * ＋ projects.status の実在値分布（#85 enum 推定）
 */
import * as fs from 'node:fs';
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const ep = (e: string) => `https://${DOMAIN}.microcms.io/api/v1/${e}`;
async function get<T = unknown>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
  if (!r.ok) throw new Error(`GET ${url} → ${r.status}`);
  return r.json() as T;
}
type Rec = Record<string, unknown>;
const OUT = 'scripts/.scout-w5-tsuishu.json';
async function main(): Promise<void> {
  const out: Rec = {};
  // ■1
  const pe = await get<{ contents: Rec[] }>(`${ep('policy-events')}?filters=title[contains]${encodeURIComponent('メインオークション')}&limit=20`);
  out.policyEvents_main = pe.contents;
  console.log('■1 policy-events title[contains]メインオークション:');
  for (const r of pe.contents) console.log(`  slug=${r.slug} | ${r.title} | eventDate=${String(r.eventDate).slice(0, 10)} endDate=${r.endDate ? String(r.endDate).slice(0, 10) : 'null'} status=${JSON.stringify(r.status)} type=${JSON.stringify(r.eventType)} updatedAt=${r.updatedAt}`);
  // ■3■4
  const pj: Rec = {};
  for (const slug of ['pr-co92942-bess', 'pr-co149815-bess', 'glome-nishikata-kanai-2465-bess']) {
    const d = await get<{ contents: Rec[] }>(`${ep('projects')}?filters=slug[equals]${slug}&limit=1`);
    pj[slug] = d.contents[0] ?? null;
    console.log(`\n■3/4 projects ${slug}:`);
    if (!d.contents[0]) { console.log('  (不在)'); continue; }
    for (const [k, v] of Object.entries(d.contents[0])) console.log(`  ${k}: ${typeof v === 'string' && v.length > 300 ? v.slice(0, 300) + `…(${v.length}字)` : JSON.stringify(v)}`);
  }
  out.projects = pj;
  // status 分布
  const statusCount: Record<string, number> = {};
  let offset = 0; const limit = 100; let total = 0;
  do {
    const d = await get<{ totalCount: number; contents: Rec[] }>(`${ep('projects')}?fields=slug,status,cod&limit=${limit}&offset=${offset}`);
    total = d.totalCount;
    for (const r of d.contents) { const s = JSON.stringify(r.status ?? null); statusCount[s] = (statusCount[s] ?? 0) + 1; }
    offset += limit;
  } while (offset < total);
  out.projects_status_dist = statusCount;
  console.log(`\nprojects.status 実在値分布（全${total}件）: ${JSON.stringify(statusCount)}`);
  // ■5
  const gl: Rec = {};
  for (const slug of ['area-price', 'capacity-contribution', 'additional-auction', 'n-1-densei']) {
    const d = await get<{ contents: Rec[] }>(`${ep('glossary')}?filters=slug[equals]${slug}&limit=1`);
    gl[slug] = d.contents[0] ?? null;
    console.log(`\n■5 glossary ${slug}:`);
    if (!d.contents[0]) { console.log('  (不在)'); continue; }
    for (const [k, v] of Object.entries(d.contents[0])) console.log(`  ${k}: ${typeof v === 'string' && v.length > 200 ? v.slice(0, 200) + `…(${v.length}字)` : JSON.stringify(v)}`);
  }
  out.glossary = gl;
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\n→ 全文保存: ${OUT}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
