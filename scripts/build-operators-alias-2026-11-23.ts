#!/usr/bin/env tsx
/**
 * scripts/build-operators-alias-2026-11-23.ts — 九電工の事業者ページに別名「クラフティア」を足す便（_QUEUE.md 140 行）の書込計画を作る（読むだけ）
 *
 * 計画: reports/projects-plan-2026-11-23-G_ユウ.json（sha256 先頭 16 桁 921782dad1fa4a16）の operator_alias＝OneDrive の正本の写し。
 * やること（microCMS は GET だけ・書込 0）:
 *   1. operators を slug で GET し、name が計画の operator_name_now と同じか確かめる。
 *   2. aliases の今の値（改行区切り）の末尾に add_aliases を足す（今の行は消さない・既にある行は足さない）。
 *      今の値が空なら「配列・JSON 値モード」（old "null"）、空でなければ生の置換（old は GET の値）。expect_final は最終状態の digest。
 *   3. ほかの事業者の name・aliases に同じ語があれば止める（同じ別名を 2 社が持つと自動リンクが曖昧になる＝落とし穴 #77）。
 * applier: scripts/apply-projects-2026-11-23.ts --plan=reports/operators-alias-kyudenko-2026-11-23.json（runApplier・既定 dry run・本実行は --apply）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/build-operators-alias-2026-11-23.ts
 */
import * as fs from 'node:fs';
import { digest } from './lib/microcms-applier';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const PLAN_IN = 'reports/projects-plan-2026-11-23-G_ユウ.json';
const OUT = 'reports/operators-alias-kyudenko-2026-11-23.json';
const EP = `https://${DOMAIN}.microcms.io/api/v1/operators`;
type Rec = Record<string, unknown> & { id: string; slug: string; name: string; aliases?: string | null };
const yu = JSON.parse(fs.readFileSync(PLAN_IN, 'utf8')) as { operator_alias: { operator_slug: string; operator_name_now: string; add_aliases: string[] } };
const A = yu.operator_alias;
let gets = 0;
async function get<T>(url: string): Promise<T> {
  gets++;
  const r = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
  if (!r.ok) throw new Error(`GET ${url.replace(/\?.*/, '')} → HTTP ${r.status}`);
  await new Promise((x) => setTimeout(x, 300));
  return r.json() as T;
}

async function main(): Promise<void> {
  const problems: string[] = [];
  const hit = await get<{ contents: Rec[]; totalCount: number }>(`${EP}?filters=slug[equals]${encodeURIComponent(A.operator_slug)}&limit=5&depth=0`);
  if (hit.totalCount !== 1) throw new Error(`slug ${A.operator_slug} の件数 ${hit.totalCount}`);
  const rec = await get<Rec>(`${EP}/${hit.contents[0].id}?depth=0`);
  if (rec.name !== A.operator_name_now) problems.push(`name が計画と違う: GET ${rec.name} ／ 計画 ${A.operator_name_now}`);
  // ほかの事業者が同じ語を持っていないか（全件を 1 回ずつ GET）
  const others: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await get<{ contents: Rec[]; totalCount: number }>(`${EP}?limit=100&offset=${offset}&depth=0&fields=id,slug,name,aliases&orders=-publishedAt,id`);
    for (const o of page.contents) {
      if (o.slug === rec.slug) continue;
      const words = [o.name, ...String(o.aliases ?? '').split(/\r?\n/)].map((s) => s.trim());
      for (const w of A.add_aliases) if (words.includes(w)) others.push(`${o.slug}（${o.name}）が「${w}」を持つ`);
    }
    if (offset + 100 >= page.totalCount) { console.log(`[operators] 全 ${page.totalCount} 社を見た`); break; }
  }
  problems.push(...others);
  const cur = typeof rec.aliases === 'string' ? rec.aliases : '';
  const lines = cur.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const add = A.add_aliases.filter((a) => !lines.includes(a));
  const next = [...lines, ...add].join('\n');
  const op = cur === ''
    ? { field: 'aliases', old: 'null', new: JSON.stringify(next), row_ids: ['A1'], note: '配列・JSON 値モード。今は空の aliases に改行区切りで入れる' }
    : { field: 'aliases', old: cur, new: cur.replace(/\s+$/, '') + '\n' + add.join('\n'), row_ids: ['A1'], note: '末尾に足す（old は GET の値）' };
  const patches = problems.length || !add.length ? [] : [{ ep: 'operators', slug: rec.slug, row_id: 'A1', order: 1, id: rec.id, updatedAt: rec.updatedAt, ops: [op], expect_final: { aliases: digest(next) } }];
  const out = {
    note: `九電工の別名の便（_QUEUE.md 140 行）。ユウの計画（${PLAN_IN}）の operator_alias を、書込直前の GET で確かめて applier の形にしたもの。`,
    generated: new Date().toISOString(),
    checks: { problems, name: rec.name, aliases_now: rec.aliases ?? null, add, final: next },
    plan: { posts: [], patches },
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`[計画] PATCH ${patches.length}・aliases ${JSON.stringify(rec.aliases ?? null)} → ${JSON.stringify(next)} → ${OUT}`);
  console.log(`[problems] ${problems.length}${problems.length ? `: ${problems.join(' ／ ')}` : ''}`);
  console.log(`[microCMS] GET ${gets}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
