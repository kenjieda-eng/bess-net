#!/usr/bin/env tsx
/**
 * scripts/build-projects-write-2026-11-16b.ts — projects の小さな直し便（ADW の益城町と松阪・PATCH 2 件 5 op）の書込計画を作る（読むだけ）
 *
 * 計画: reports/projects-plan-2026-11-15b_ユウ.json（OneDrive の正本の写し・sha256 先頭 16 桁 a0a5a604c6fd8d56）。
 * やること（microCMS は GET だけ・書込 0）:
 *   1. 対象 2 件を slug で GET（id を確かめる）。
 *   2. 計画の old と GET の値の照合（「空」は null・[]・''・未設定を同じに扱う）・keep と GET の照合。body の old は GET の値。
 *   3. applier（scripts/apply-projects-2026-11-16b.ts → runApplier）の計画 reports/projects-write-2026-11-16b.json を書く。
 *      文字列の欄は生の置換（old は GET の値）。cod を空にするのは new ''（11/8 の揖斐川・長野と同じ）。expect_final は最終状態の digest。
 * 照合が 1 つでも合わない op は計画に入れない（problems に書く・そのレコードは丸ごと入れない）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/build-projects-write-2026-11-16b.ts
 */
import * as fs from 'node:fs';
import { digest } from './lib/microcms-applier';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const PLAN_IN = 'reports/projects-plan-2026-11-15b_ユウ.json';
const OUT = 'reports/projects-write-2026-11-16b.json';
const EP = `https://${DOMAIN}.microcms.io/api/v1/projects`;

type Rec = Record<string, unknown> & { id: string; slug: string };
type YOp = { field: string; old: unknown; new: unknown };
type YPatch = { key: string; slug: string; ops: YOp[]; keep: Record<string, unknown> };
const yu = JSON.parse(fs.readFileSync(PLAN_IN, 'utf8')) as { patches: YPatch[] };

let gets = 0;
async function get<T>(url: string): Promise<T> {
  gets++;
  const r = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
  if (!r.ok) throw new Error(`GET ${url.replace(/\?.*/, '')} → HTTP ${r.status}`);
  return r.json() as T;
}
const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const same = (a: unknown, b: unknown) => (isEmpty(a) && isEmpty(b)) || JSON.stringify(a) === JSON.stringify(b);

async function main(): Promise<void> {
  const fetchedAt = new Date().toISOString();
  const total = (await get<{ totalCount: number }>(`${EP}?limit=0`)).totalCount;
  console.log(`[projects] totalCount ${total}（${fetchedAt}）`);
  const problems: string[] = [];
  const oldCheck: Record<string, unknown>[] = [];
  const keepCheck: Record<string, unknown>[] = [];
  const records: Record<string, unknown>[] = [];
  const patches: Record<string, unknown>[] = [];
  for (const [i, p] of yu.patches.entries()) {
    const found = (await get<{ contents: Rec[] }>(`${EP}?filters=slug[equals]${encodeURIComponent(p.slug)}&limit=1&depth=0`)).contents[0];
    if (!found) { problems.push(`${p.key} ${p.slug}: slug が無い → 書かない`); continue; }
    const rec = await get<Rec>(`${EP}/${found.id}?depth=0`);
    records.push({ key: p.key, slug: p.slug, id: rec.id, updatedAt: rec.updatedAt, before: Object.fromEntries(p.ops.map((o) => [o.field, rec[o.field] ?? null])) });
    let bad = false;
    for (const op of p.ops) {
      if (op.field === 'body') {
        const body = String(rec.body ?? '');
        oldCheck.push({ key: p.key, field: 'body', check: 'GET の値を old に使う', len: body.length, ok: body.length > 0 });
        if (!body) { bad = true; problems.push(`${p.key} body: GET の本文が空`); }
        continue;
      }
      const ok = same(rec[op.field], op.old);
      oldCheck.push({ key: p.key, field: op.field, plan_old: op.old, get: rec[op.field] ?? null, ok });
      if (!ok) { bad = true; problems.push(`${p.key} ${op.field}: GET ${JSON.stringify(rec[op.field] ?? null)} が計画の old ${JSON.stringify(op.old)} と違う → 書かない`); }
    }
    for (const [f, v] of Object.entries(p.keep)) keepCheck.push({ key: p.key, field: f, keep: v, get: rec[f] ?? null, ok: same(rec[f], v) });
    if (bad) continue;
    const ops = p.ops.map((op) => {
      if (op.field === 'body') return { field: 'body', old: String(rec.body), new: String(op.new), row_ids: [p.key], note: '全文の置換（old は GET の値）' };
      return { field: op.field, old: String(rec[op.field]), new: String(op.new), row_ids: [p.key], note: op.new === '' ? '空にする（11/8 の揖斐川・長野と同じ new ""）' : '' };
    });
    const expect_final = Object.fromEntries(p.ops.map((op) => [op.field, digest(op.new === '' ? null : op.new)]));
    patches.push({ ep: 'projects', slug: p.slug, row_id: p.key, order: i + 1, ops, expect_final });
  }
  console.log(`[old] ${oldCheck.filter((x) => x.ok).length}/${oldCheck.length} 一致${oldCheck.some((x) => !x.ok) ? ` ★${JSON.stringify(oldCheck.filter((x) => !x.ok))}` : ''}`);
  console.log(`[keep] ${keepCheck.filter((x) => x.ok).length}/${keepCheck.length} 一致${keepCheck.some((x) => !x.ok) ? ` 違い ${JSON.stringify(keepCheck.filter((x) => !x.ok))}` : ''}`);
  for (const r of records) console.log(`[GET] ${r.key} ${r.slug} id=${r.id} updatedAt=${r.updatedAt}`);
  fs.writeFileSync(OUT, JSON.stringify({
    note: 'projects の小さな直し便（2026-11-16・_QUEUE.md 116 行）。ユウの計画（reports/projects-plan-2026-11-15b_ユウ.json）を書込直前の GET で確かめて applier の形にしたもの。scripts/apply-projects-2026-11-16b.ts（runApplier）が読む。既定 dry run・本実行は --apply。',
    generated: new Date().toISOString(),
    baseline: { totalCount: total, fetched_at: fetchedAt, records },
    checks: { problems, old: oldCheck, keep: keepCheck },
    plan: { posts: [], patches },
  }, null, 1));
  console.log(`[計画] PATCH ${patches.length}（op ${patches.reduce((s, p) => s + (p.ops as unknown[]).length, 0)}）→ ${OUT}`);
  console.log(`[problems] ${problems.length}${problems.length ? `: ${problems.join(' ／ ')}` : ''}`);
  console.log(`[microCMS] GET ${gets}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
