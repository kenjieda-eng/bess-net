#!/usr/bin/env tsx
/**
 * scripts/patch-ck1-2026-09-21.ts — Ck-1 ■A の microCMS PATCH（差分限定・件別）
 *
 * 計画ファイル scripts/ck1-patch-plan-2026-09-21.json（件ごとに根拠つき）を読み、1 件ずつ PATCH する。
 *   op "set"     : フィールドをまるごと置き換える（URL 欄など）。現在値が from と一致するときだけ実行
 *   op "replace" : フィールド内の文字列 from を to に 1 回だけ置き換える（from が 1 回だけ出現するときだけ）
 *
 * ★#106: PATCH 前後で GET し、対象フィールド以外の変化が 0 であることを確かめる。
 * ★#122: richEditor（explainer.body・glossary.detail）は保存時に正規化されるため、送信値との全文一致では判定しない。
 *        置換後は「to の素の文字列が含まれ、from が含まれない」で判定する（replace の to は from を含まない前提で作る）。
 * ★冪等: 既に適用済み（set: 現在値＝to ／ replace: from 無し・to 有り）なら skip。
 * ★POST / PUT / DELETE なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-ck1-2026-09-21.ts [--dry-run] [--only <id>]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;
const PLAN = path.join(process.cwd(), 'scripts', 'ck1-patch-plan-2026-09-21.json');
const LOG = path.join(process.cwd(), 'scripts', 'ck1-patch-log-2026-09-21.json');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

type Op = {
  id: string;
  endpoint: string;
  slug: string;
  field: string;
  op: 'set' | 'replace';
  from: string;
  to: string;
  why: string;
  evidence?: string;
};
type Rec = Record<string, unknown> & { id: string; slug: string };

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const ep = (e: string) => `https://${DOMAIN}.microcms.io/api/v1/${e}`;
const bySlug = async (e: string, slug: string): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${ep(e)}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);
const RICH = new Set(['explainer.body', 'glossary.detail']);

type LogRow = { id: string; endpoint: string; slug: string; field: string; result: string; before?: string; after?: string; otherFieldChanges?: number; note?: string };

async function main() {
  const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as { ops: Op[] };
  const ops = plan.ops.filter((o) => !ONLY || o.id === ONLY);
  console.log(`[Ck-1 PATCH] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / ${ops.length} 件`);
  const log: LogRow[] = [];
  let ok = 0, skipped = 0, failed = 0;
  for (const o of ops) {
    const tag = `${o.id} ${o.endpoint}/${o.slug}.${o.field}`;
    const b = await bySlug(o.endpoint, o.slug);
    if (!b) { console.log(`✗ ${tag}: レコード不在`); failed++; log.push({ ...o, result: 'not-found' }); continue; }
    const cur = typeof b[o.field] === 'string' ? (b[o.field] as string) : b[o.field] === undefined ? '' : String(b[o.field]);
    let next: string;
    if (o.op === 'set') {
      if (cur === o.to) { console.log(`- ${tag}: 適用済み（skip）`); skipped++; log.push({ ...o, result: 'already' }); continue; }
      if (cur !== o.from) { console.log(`✗ ${tag}: 現在値が計画の from と違う（中止）\n    現在: ${cur}\n    計画: ${o.from}`); failed++; log.push({ ...o, result: 'from-mismatch', before: cur }); continue; }
      next = o.to;
    } else {
      const n = count(cur, o.from);
      // ★#122: 挿入型の置換（to が from を含む。例「2030年度の…」→「対象実需給年度2030年度の…」）は、
      //   適用後も from が残るため「from があれば未適用」と判定すると再実行で二重に挿入する。
      //   適用済みの判定は「to（素の文字列）が既にある」で行う。
      if (cur.includes(o.to)) { console.log(`- ${tag}: 適用済み（skip）`); skipped++; log.push({ ...o, result: 'already' }); continue; }
      if (n !== 1) { console.log(`✗ ${tag}: from の出現が ${n} 回（1 回でないので中止）`); failed++; log.push({ ...o, result: `from-count-${n}` }); continue; }
      next = cur.replace(o.from, o.to);
    }
    console.log(`■ ${tag}\n    前: ${o.op === 'set' ? cur : o.from}\n    後: ${o.to}\n    理由: ${o.why}`);
    if (DRY) { ok++; log.push({ ...o, result: 'dry-run', before: cur }); continue; }
    await api('PATCH', `${ep(o.endpoint)}/${b.id}`, { [o.field]: next });
    await sleep(900);
    const a = await bySlug(o.endpoint, o.slug);
    let other = 0;
    for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {})])) {
      if (SYS.has(k) || k === o.field) continue;
      if (norm(a?.[k]) !== norm(b[k])) { other++; console.log(`    ✗ 対象外フィールドが変化: ${k}`); }
    }
    const av = String(a?.[o.field] ?? '');
    const rich = RICH.has(`${o.endpoint}.${o.field}`);
    const fieldOk = rich || o.op === 'replace'
      ? av.includes(o.to) && (o.to.includes(o.from) || count(av, o.from) === 0)
      : av === next;
    console.log(`    #106: ${fieldOk && other === 0 ? `✓ 対象 ${o.field} 反映${rich ? '（richEditor: 素の文字列で判定）' : ''}・他フィールド変化 0` : '★NG'}`);
    if (fieldOk && other === 0) ok++; else failed++;
    log.push({ ...o, result: fieldOk && other === 0 ? 'ok' : 'verify-ng', before: cur, after: av, otherFieldChanges: other });
    await sleep(300);
  }
  if (!DRY) fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
  console.log(`\n[done] 適用 ${ok} / skip ${skipped} / 失敗 ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
