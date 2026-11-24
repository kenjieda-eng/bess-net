#!/usr/bin/env tsx
/**
 * scripts/build-projects-2026-11-24.ts — projects の掃除便その 5（_QUEUE.md 141 行・--part=H）の書込計画を作る（読むだけ）。scripts/build-projects-2026-11-22.ts の写し（表だけ替えた）
 *
 * 計画: reports/projects-plan-2026-11-24-H_ユウ.json（sha256 先頭 16 桁 91c44a3f67ea2713）＝OneDrive の正本の写し。
 * やること（microCMS は GET だけ・書込 0）:
 *   1. patches を slug で GET し、計画の old（空は null・[]・''・未設定を同じに扱う）・keep と照らす。old が違う op は、その op だけ計画に入れない（problems に書く）。
 *   2. applier（scripts/apply-projects-2026-11-24.ts → runApplier）の計画を書く。
 *      文字列の欄は生の置換（old は GET の値）、数値・配列・空の欄は「配列・JSON 値モード」。欄を空にする op（H4 の epc）は new が ''。expect_final は最終状態の digest。
 *   --skip=<key,…> で一次が合わなかった件を、--skip-op=<key:field,…> で op だけを外せる。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/build-projects-2026-11-24.ts --part=H
 */
import * as fs from 'node:fs';
import { digest } from './lib/microcms-applier';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const arg = (k: string) => process.argv.find((x) => x.startsWith(`--${k}=`))?.slice(k.length + 3);
const PART = arg('part') ?? '';
const PARTS: Record<string, [out: string, label: string]> = {
  H: ['reports/projects-cleanup5-2026-11-24.json', 'projects の掃除便その 5（_QUEUE.md 141 行）'],
};
if (!PARTS[PART]) { console.error(`--part=${Object.keys(PARTS).join('|')}`); process.exit(1); }
const PLAN_IN = `reports/projects-plan-2026-11-24-${PART}_ユウ.json`;
const [OUT, LABEL] = PARTS[PART];
const SKIP = new Set((arg('skip') ?? '').split(',').filter(Boolean));
const SKIP_OP = new Set((arg('skip-op') ?? '').split(',').filter(Boolean));
const EP = `https://${DOMAIN}.microcms.io/api/v1/projects`;

type Rec = Record<string, unknown> & { id: string; slug: string };
type YOp = { field: string; old: unknown; new: unknown };
type YPatch = { key: string; slug: string; ops: YOp[]; keep: Record<string, unknown> };
const yu = JSON.parse(fs.readFileSync(PLAN_IN, 'utf8')) as { patches: YPatch[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let gets = 0;
async function get<T>(url: string): Promise<T> {
  for (let a = 0; ; a++) {
    gets++;
    const r = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
    if (r.status === 429 && a < 4) { await sleep(2000 * (a + 1)); continue; }
    if (!r.ok) throw new Error(`GET ${url.replace(/\?.*/, '')} → HTTP ${r.status}`);
    return r.json() as T;
  }
}
const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const same = (a: unknown, b: unknown) => (isEmpty(a) && isEmpty(b)) || JSON.stringify(a) === JSON.stringify(b);
// 使ってよい選択肢（select は未定義の値を黙って捨てる＝#106。PATCH の後に GET で照合する）
const SELECTS: Record<string, string[]> = { status: ['稼働中', '建設中', '計画中'], marketParticipation: ['JEPX', '需給調整市場', '容量市場'] };

async function main(): Promise<void> {
  const problems: string[] = [];
  const oldCheck: Record<string, unknown>[] = [];
  const keepCheck: Record<string, unknown>[] = [];
  const patches: Record<string, unknown>[] = [];
  let order = 0;
  for (const p of yu.patches) {
    if (SKIP.has(p.key)) { problems.push(`${p.key}: --skip（一次が合わない件は書かない）`); continue; }
    const hit = await get<{ contents: Rec[]; totalCount: number }>(`${EP}?filters=slug[equals]${encodeURIComponent(p.slug)}&limit=5&depth=0`);
    if (hit.totalCount !== 1) { problems.push(`${p.key} ${p.slug}: slug の件数 ${hit.totalCount} → 書かない`); continue; }
    const rec = await get<Rec>(`${EP}/${hit.contents[0].id}?depth=0`);
    const ops: Record<string, unknown>[] = [];
    const finalVals: Record<string, unknown> = {};
    for (const op of p.ops) {
      if (SKIP_OP.has(`${p.key}:${op.field}`)) { problems.push(`${p.key} ${op.field}: --skip-op → この op は書かない`); continue; }
      const cur = rec[op.field];
      if (op.field === 'body') {
        oldCheck.push({ key: p.key, field: 'body', check: 'GET の値を old に使う', len: String(cur ?? '').length, ok: true });
        if (isEmpty(cur)) ops.push({ field: 'body', old: 'null', new: JSON.stringify(String(op.new)), row_ids: [p.key], note: '配列・JSON 値モード。今は空の本文に全文を入れる' });
        else ops.push({ field: 'body', old: String(cur), new: String(op.new), row_ids: [p.key], note: '全文の置換（old は GET の値）' });
        finalVals.body = String(op.new);
        continue;
      }
      const ok = same(cur, op.old);
      oldCheck.push({ key: p.key, field: op.field, plan_old: op.old, get: cur ?? null, ok });
      if (!ok) { problems.push(`${p.key} ${op.field}: GET ${JSON.stringify(cur ?? null)} が計画の old ${JSON.stringify(op.old)} と違う → この op は書かない`); continue; }
      const opts = SELECTS[op.field];
      if (opts && (!Array.isArray(op.new) || (op.new as unknown[]).some((x) => !opts.includes(String(x))))) { problems.push(`${p.key} ${op.field} ${JSON.stringify(op.new)} が選択肢に無い → この op は書かない`); continue; }
      if (typeof cur === 'string' && cur !== '' && typeof op.new === 'string') ops.push({ field: op.field, old: cur, new: op.new, row_ids: [p.key], note: '' });
      else ops.push({ field: op.field, old: JSON.stringify(cur === undefined || cur === '' ? null : cur), new: JSON.stringify(op.new), row_ids: [p.key], note: '配列・JSON 値モード。' });
      finalVals[op.field] = op.new;
    }
    for (const [f, v] of Object.entries(p.keep)) keepCheck.push({ key: p.key, field: f, keep: v, get: rec[f] ?? null, ok: same(rec[f], v) });
    if (!ops.length) continue;
    order++;
    const expect_final = Object.fromEntries(Object.entries(finalVals).map(([k, v]) => [k, digest(v)]));
    patches.push({ ep: 'projects', slug: p.slug, row_id: p.key, order, id: rec.id, updatedAt: rec.updatedAt, ops, expect_final });
  }
  console.log(`[old] ${oldCheck.filter((x) => x.ok).length}/${oldCheck.length} 一致${oldCheck.some((x) => !x.ok) ? `・★不一致 ${JSON.stringify(oldCheck.filter((x) => !x.ok))}` : ''}`);
  console.log(`[keep] ${keepCheck.filter((x) => x.ok).length}/${keepCheck.length} 一致${keepCheck.some((x) => !x.ok) ? `・違い ${JSON.stringify(keepCheck.filter((x) => !x.ok))}` : ''}`);
  const out = {
    note: `${LABEL}。ユウの計画（${PLAN_IN}）の patches を、書込直前の GET で確かめて applier の形にしたもの。scripts/apply-projects-2026-11-24.ts（runApplier）が読む。既定 dry run・本実行は --apply。`,
    generated: new Date().toISOString(),
    part: PART,
    checks: { problems, old: oldCheck, keep: keepCheck },
    plan: { posts: [], patches },
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`[計画] PATCH ${patches.length}（op ${patches.reduce((s, p) => s + (p.ops as unknown[]).length, 0)}）→ ${OUT}`);
  console.log(`[problems] ${problems.length}${problems.length ? `: ${problems.join(' ／ ')}` : ''}`);
  console.log(`[microCMS] GET ${gets}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
