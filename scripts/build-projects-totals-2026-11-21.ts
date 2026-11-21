#!/usr/bin/env tsx
/**
 * scripts/build-projects-totals-2026-11-21.ts — projects の合計を正す便（重複 6 組の統合・計画 4 件の除外・_QUEUE.md 129 行）の書込計画を作る（読むだけ）
 *
 * 計画: reports/projects-plan-2026-11-21_ユウ.json（OneDrive の正本の写し・sha256 先頭 16 桁 217c4563156a8a63）。
 * やること（microCMS は GET だけ・書込 0）:
 *   1. patches 7 件（V1〜V7）を slug で GET し、計画の old（空は null・[]・''・未設定を同じに扱う）・keep と照らす。
 *   2. V4（sparx-sapporo-351）は body の末尾が計画の seen の形（「出典」の見出しと PR TIMES 000004339.000032407 の 1 行）で、
 *      そのリンクがほかに無いことを確かめ、その塊だけを取り除いた本文を new にする。形が違えば書かない。
 *   3. applier（scripts/apply-projects-2026-11-21.ts → runApplier）の計画 reports/projects-totals-fix-2026-11-21.json を書く。
 *      文字列の欄は生の置換（old は GET の値）、数値・配列・空の欄は「配列・JSON 値モード」。expect_final は最終状態の digest。
 *   --a-only を付けると B（V6・V7）を計画に入れない（GO のメモが「A だけ」のとき）。
 * 照合が 1 つでも合わない件は計画に入れない（problems に書く）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/build-projects-totals-2026-11-21.ts [--a-only]
 */
import * as fs from 'node:fs';
import { digest } from './lib/microcms-applier';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const PLAN_IN = 'reports/projects-plan-2026-11-21_ユウ.json';
const OUT = 'reports/projects-totals-fix-2026-11-21.json';
const A_ONLY = process.argv.includes('--a-only');
const EP = `https://${DOMAIN}.microcms.io/api/v1/projects`;

type Rec = Record<string, unknown> & { id: string; slug: string };
type YOp = { field: string; old: unknown; new: unknown; kind?: string; remove_url?: string; seen?: string };
type YPatch = { key: string; slug: string; part?: string; ops: YOp[]; keep: Record<string, unknown> };
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
const SELECTS: Record<string, string[]> = { status: ['稼働中', '建設中', '計画中'] };
// V4 の seen（2026-11-21 15:56 の本番の本文の末尾）。見出しの id は richEditor が採番した値
const V4_BLOCK = '<h2 id="h1b9eb7c3a9">出典</h2><ul><li>📰 PR TIMES: <a href="https://prtimes.jp/main/html/rd/p/000004339.000032407.html" target="_blank" rel="noopener noreferrer">https://prtimes.jp/main/html/rd/p/000004339.000032407.html</a></li></ul>';

async function main(): Promise<void> {
  const problems: string[] = [];
  const oldCheck: Record<string, unknown>[] = [];
  const keepCheck: Record<string, unknown>[] = [];
  const patches: Record<string, unknown>[] = [];
  let order = 0;
  for (const p of yu.patches) {
    if (A_ONLY && p.part === 'B') { console.log(`[skip] ${p.key}（B・--a-only）`); continue; }
    const hit = await get<{ contents: Rec[]; totalCount: number }>(`${EP}?filters=slug[equals]${encodeURIComponent(p.slug)}&limit=5&depth=0`);
    if (hit.totalCount !== 1) { problems.push(`${p.key} ${p.slug}: slug の件数 ${hit.totalCount} → 書かない`); continue; }
    const rec = await get<Rec>(`${EP}/${hit.contents[0].id}?depth=0`);
    let bad = false;
    const ops: Record<string, unknown>[] = [];
    const finalVals: Record<string, unknown> = {};
    for (const op of p.ops) {
      if (op.field === 'body') {
        const body = String(rec.body ?? '');
        if (op.kind === 'remove-block') {
          const ok = body.endsWith(V4_BLOCK) && body.split(op.remove_url!).length - 1 === 2 && body.split('出典</h2>').length - 1 === 1;
          oldCheck.push({ key: p.key, field: 'body', check: '末尾が seen の形（出典の見出しと 1 行）・リンクはその塊の中だけ', ok, len: body.length });
          if (!ok) { bad = true; problems.push(`${p.key} body: 末尾が seen の形でない → 書かない（V4 の訂正履歴も足さない）`); continue; }
          const next = body.slice(0, body.length - V4_BLOCK.length);
          ops.push({ field: 'body', old: body, new: next, row_ids: [p.key], note: '全文の置換（old は GET の値・末尾の「出典」の見出しと箇条書きだけを外す）' });
          finalVals.body = next;
        } else {
          oldCheck.push({ key: p.key, field: 'body', check: 'GET の値を old に使う', len: body.length, ok: body.length > 0 });
          if (!body) { bad = true; problems.push(`${p.key} body: GET の本文が空 → 書かない`); continue; }
          ops.push({ field: 'body', old: body, new: String(op.new), row_ids: [p.key], note: '全文の置換（old は GET の値）' });
          finalVals.body = String(op.new);
        }
        continue;
      }
      const cur = rec[op.field];
      const ok = same(cur, op.old);
      oldCheck.push({ key: p.key, field: op.field, plan_old: op.old, get: cur ?? null, ok });
      if (!ok) { bad = true; problems.push(`${p.key} ${op.field}: GET ${JSON.stringify(cur ?? null)} が計画の old ${JSON.stringify(op.old)} と違う → 書かない`); continue; }
      const opts = SELECTS[op.field];
      if (opts && (!Array.isArray(op.new) || (op.new as unknown[]).some((x) => !opts.includes(String(x))))) { bad = true; problems.push(`${p.key} ${op.field} ${JSON.stringify(op.new)} が選択肢に無い`); continue; }
      if (typeof cur === 'string' && cur !== '' && typeof op.new === 'string') ops.push({ field: op.field, old: cur, new: op.new, row_ids: [p.key], note: '' });
      else ops.push({ field: op.field, old: JSON.stringify(cur === undefined || cur === '' ? null : cur), new: JSON.stringify(op.new), row_ids: [p.key], note: '配列・JSON 値モード。' });
      finalVals[op.field] = op.new;
    }
    for (const [f, v] of Object.entries(p.keep)) keepCheck.push({ key: p.key, field: f, keep: v, get: rec[f] ?? null, ok: same(rec[f], v) });
    if (bad) continue;
    order++;
    const expect_final = Object.fromEntries(Object.entries(finalVals).map(([k, v]) => [k, digest(v)]));
    patches.push({ ep: 'projects', slug: p.slug, row_id: p.key, order, id: rec.id, updatedAt: rec.updatedAt, ops, expect_final });
  }
  console.log(`[old] ${oldCheck.filter((x) => x.ok).length}/${oldCheck.length} 一致${oldCheck.some((x) => !x.ok) ? `・★不一致 ${JSON.stringify(oldCheck.filter((x) => !x.ok))}` : ''}`);
  console.log(`[keep] ${keepCheck.filter((x) => x.ok).length}/${keepCheck.length} 一致${keepCheck.some((x) => !x.ok) ? `・違い ${JSON.stringify(keepCheck.filter((x) => !x.ok))}` : ''}`);
  const out = {
    note: 'projects の合計を正す便（2026-11-21・_QUEUE.md 129 行）。ユウの計画（reports/projects-plan-2026-11-21_ユウ.json）の patches を、書込直前の GET で確かめて applier の形にしたもの。scripts/apply-projects-2026-11-21.ts（runApplier）が読む。既定 dry run・本実行は --apply。',
    generated: new Date().toISOString(),
    part: A_ONLY ? 'A だけ' : 'A と B',
    checks: { problems, old: oldCheck, keep: keepCheck },
    plan: { posts: [], patches },
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`[計画] PATCH ${patches.length}（op ${patches.reduce((s, p) => s + (p.ops as unknown[]).length, 0)}）→ ${OUT}`);
  console.log(`[problems] ${problems.length}${problems.length ? `: ${problems.join(' ／ ')}` : ''}`);
  console.log(`[microCMS] GET ${gets}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
