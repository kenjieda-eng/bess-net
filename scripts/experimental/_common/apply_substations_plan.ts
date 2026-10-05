#!/usr/bin/env tsx
/**
 * scripts/experimental/_common/apply_substations_plan.ts — 変電所（substations）再取込の計画 JSON を microCMS に当てる applier
 * （BS+BT 本実行便 2026-10-05 で新設。四国 scripts/experimental/shikoku/update_plan_202610.json・沖縄 okinawa/update_plan_202608.json）
 *
 * ★既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。本実行では --log が必須（1 件ごとに .jsonl に追記）。
 * 計画（parse_*.py --emit-plan の出力）:
 *   expected: { updates, creates, n1_ok_after }／endpoint: 'substations'／prefix
 *   updates[]: { slug, id, patch: {field: 値}, changed: [...], before: {dry-run 時の baseline のレコード全体（メタ除く）} }
 *   creates[]: { slug, content: {...} }
 * PATCH の規則:
 *   - 現在値（GET）が patch と全 field で同値なら skip（冪等）。
 *   - 現在のレコードが before（dry-run の baseline）と、patch で変える field 以外で 1 つでも違う
 *     ＝dry-run の後に誰かが書いた → そのレコードは skip（便 §0・§3-3）。patch の field が新値になっているのは「部分適用済み」として許す。
 *   - 送るのは現在値が patch と違う field だけ（差分限定）。null は「公表 CSV で『－』＝空にする」。
 *   - PATCH 後に GET し、送った field は送信値と同値・送っていない field は変化 0（#106）。本実行では NG・例外が 1 件でも出たら止める
 *     （以後の PATCH も POST も行わない）。
 * POST の規則（新規）: slug が既にあれば skip（中身を照合して報告）。microCMS の PUT（contentId 指定の作成）は使わない（停止条件）
 *   ＝ id は microCMS の自動採番になり slug と一致しない。詳細ページは getSubstationBySlug の slug フィルタ fallback で引ける。
 *   POST は冪等でないので 429 以外では再送しない（5xx の再送で同じ slug が 2 件できるのを防ぐ）。POST 後は slug の件数が 1 であることも照合する。
 * DELETE／PUT は無い。逐次・間隔 400ms・429（PATCH・GET は 5xx も）は backoff し、再送は数えてログに出す。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/experimental/_common/apply_substations_plan.ts --plan=<計画> [--apply --log=<出力>] [--only=slug,…]
 */
import * as fs from 'node:fs';
export {};

type Rec = Record<string, unknown> & { id: string; slug: string };
type Upd = { slug: string; id: string; patch: Record<string, unknown>; changed: string[]; before: Record<string, unknown> };
type Cre = { slug: string; content: Record<string, unknown> };
type Plan = { area: string; endpoint: string; prefix: string; expected: Record<string, number>; updates: Upd[]; creates: Cre[] };

const argv = process.argv;
const APPLY = argv.includes('--apply');
const PLAN_PATH = argv.find((a) => a.startsWith('--plan='))?.slice(7);
const ONLY = (argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
const LOG_PATH = argv.find((a) => a.startsWith('--log='))?.slice(6);
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
if (!PLAN_PATH) { console.error('--plan= が必要'); process.exit(1); }
if (APPLY && !LOG_PATH) { console.error('本実行（--apply）は --log= が必須'); process.exit(1); }
if (!DOMAIN || !KEY) { console.error('env 未設定（set -a && . ./.env.local && set +a）'); process.exit(1); }

const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8')) as Plan;
// ── 計画の見出しの検査（便 §0「可の件数が動いたら停止」の機械化を含む）──
{
  const errs: string[] = [];
  if (plan.endpoint !== 'substations') errs.push(`endpoint=${plan.endpoint}`);
  if (plan.updates.length !== plan.expected.updates) errs.push(`updates ${plan.updates.length}≠${plan.expected.updates}`);
  if (plan.creates.length !== plan.expected.creates) errs.push(`creates ${plan.creates.length}≠${plan.expected.creates}`);
  const all = [...plan.updates.map((u) => u.slug), ...plan.creates.map((c) => c.slug)];
  if (all.some((s) => !s.startsWith(plan.prefix))) errs.push('prefix 外の slug');
  if (new Set(all).size !== all.length) errs.push('slug 重複');
  const okAfter = plan.updates.filter((u) => ('n1_eligible' in u.patch ? u.patch.n1_eligible : u.before.n1_eligible) === true).length
    + plan.creates.filter((c) => c.content.n1_eligible === true).length;
  if (okAfter !== plan.expected.n1_ok_after) errs.push(`N-1 可 ${okAfter}≠${plan.expected.n1_ok_after}`);
  if (errs.length) { console.error(`計画の検査で停止: ${errs.join(' / ')}`); process.exit(1); }
}
const EP = `https://${DOMAIN}.microcms.io/api/v1/${plan.endpoint}`;
const META = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const calls: Record<string, number> = {};
const retries: string[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 同値判定: 数値は誤差吸収（187 と 187.0）・null／undefined／'' は同じ（GET は null の欄を省く）・配列は JSON（relation は id に寄せる） */
function norm(v: unknown): unknown {
  if (v === undefined || v === '') return null;
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' && 'id' in (x as object) ? (x as { id: string }).id : x));
  return v;
}
function same(a: unknown, b: unknown): boolean {
  const x = norm(a), y = norm(b);
  if (typeof x === 'number' && typeof y === 'number') return Math.abs(x - y) < 1e-9;
  return JSON.stringify(x) === JSON.stringify(y);
}

async function api<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  for (let attempt = 0; ; attempt++) {
    calls[method] = (calls[method] ?? 0) + 1;  // HTTP 送信の回数（再送も数える）
    const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const retryable = r.status === 429 || (method !== 'POST' && r.status >= 500);
    if (retryable && attempt < 5) {
      const msg = `再送 ${method} ${url.replace(/\?.*/, '').replace(/^.*\/api\/v1\//, '')} HTTP ${r.status} attempt ${attempt + 1}`;
      retries.push(msg); console.log(`  … ${msg}`);
      await sleep(800 * 2 ** attempt); continue;
    }
    if (!r.ok) throw new Error(`${method} ${url.replace(/\?.*/, '')} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return (await r.json()) as T;
  }
}
const getById = (id: string) => api<Rec>('GET', `${EP}/${encodeURIComponent(id)}?depth=0`);
const listBySlug = (slug: string) =>
  api<{ contents: Rec[]; totalCount: number }>('GET', `${EP}?filters=slug[equals]${encodeURIComponent(slug)}&limit=10&depth=0`);

function logLine(o: Record<string, unknown>) {
  if (LOG_PATH) fs.appendFileSync(`${LOG_PATH}l`, JSON.stringify(o) + '\n');  // <log>.jsonl に 1 件ずつ
}

async function main() {
  const log: Record<string, unknown>[] = [];
  const push = (o: Record<string, unknown>) => { log.push(o); logLine(o); };
  const cnt = { patched: 0, dry: 0, skip_done: 0, skip_changed: 0, failed: 0, posted: 0, post_dry: 0, post_skip: 0 };
  let aborted = false;
  console.log(`[apply-substations] ${plan.area} mode=${APPLY ? '本実行' : 'DRY-RUN'} plan=${PLAN_PATH}${ONLY.length ? ` only=${ONLY.join(',')}` : ''}`);
  const ups = plan.updates.filter((u) => !ONLY.length || ONLY.includes(u.slug));
  const cres = plan.creates.filter((c) => !ONLY.length || ONLY.includes(c.slug));

  for (const u of ups) {
    try {
      const cur = await getById(u.id);
      if (cur.slug !== u.slug) throw new Error(`id ${u.id} の slug が ${cur.slug}`);
      const keys = Object.keys(u.patch);
      if (keys.every((k) => same(cur[k], u.patch[k]))) { cnt.skip_done++; push({ slug: u.slug, result: 'skip_done' }); await sleep(250); continue; }
      // dry-run の後に誰かが書いたか: レコード全体（メタ除く）を before と比べる。patch の field が新値なのは部分適用済みとして許す
      const fields = new Set([...Object.keys(u.before), ...Object.keys(cur)].filter((k) => !META.has(k)));
      const foreign = [...fields].filter((k) => !same(cur[k], u.before[k]) && !(k in u.patch && same(cur[k], u.patch[k])));
      if (foreign.length) {
        cnt.skip_changed++;
        console.log(`  ★skip ${u.slug}: dry-run の後に変わった field ${foreign.map((k) => `${k}=${JSON.stringify(cur[k])}（dry-run 時 ${JSON.stringify(u.before[k])}）`).join(' / ')}`);
        push({ slug: u.slug, result: 'skip_changed_since_dryrun', foreign: Object.fromEntries(foreign.map((k) => [k, { now: cur[k] ?? null, before: u.before[k] ?? null }])) });
        await sleep(250); continue;
      }
      const payload: Record<string, unknown> = {};
      for (const k of keys) if (!same(cur[k], u.patch[k])) payload[k] = u.patch[k];
      if (!APPLY) { cnt.dry++; push({ slug: u.slug, result: 'dry', payload }); await sleep(250); continue; }
      await api('PATCH', `${EP}/${encodeURIComponent(u.id)}`, payload);
      await sleep(700);
      const verify = (after: Rec) => {
        const bad: string[] = [];
        for (const k of new Set([...Object.keys(cur), ...Object.keys(after), ...Object.keys(payload)])) {
          if (META.has(k)) continue;
          if (k in payload) { if (!same(after[k], payload[k])) bad.push(`${k}: 送信 ${JSON.stringify(payload[k])} 保存 ${JSON.stringify(after[k])}`); }
          else if (!same(cur[k], after[k])) bad.push(`${k}: 送っていないのに ${JSON.stringify(cur[k])}→${JSON.stringify(after[k])}`);
        }
        return bad;
      };
      let after = await getById(u.id);
      let bad = verify(after);
      let reread = false;
      if (bad.length) {
        // 2026-10-05 実測: PATCH の 0.7 秒後の GET が PATCH 前の値を返すことがある（ydn-kochi-0026・updatedAt は PATCH 時刻で値は新しかった）。
        // 3 秒待って 1 回だけ取り直し、それでも違えば NG（停止）。
        console.log(`  … ${u.slug}: 照合が合わない（${bad.length} field）→ 3 秒後に取り直す`);
        await sleep(3000);
        after = await getById(u.id);
        bad = verify(after);
        reread = true;
      }
      push({ slug: u.slug, result: bad.length ? 'failed' : 'patched', reread, payload, check: bad,
             before: Object.fromEntries(Object.keys(payload).map((k) => [k, cur[k] ?? null])),
             after: Object.fromEntries(Object.keys(payload).map((k) => [k, after[k] ?? null])) });
      if (bad.length) { cnt.failed++; console.log(`  ★NG ${u.slug}: ${bad.join(' / ')} → 停止`); aborted = true; break; }
      cnt.patched++;
      if (cnt.patched % 50 === 0) console.log(`  … ${cnt.patched}/${ups.length}`);
    } catch (e) {
      cnt.failed++; console.log(`  ★例外 ${u.slug}: ${(e as Error).message}`);
      push({ slug: u.slug, result: 'error', error: (e as Error).message });
      if (APPLY) { aborted = true; break; } // 本実行で例外が出たら止める（以後の PATCH も POST もしない）
    }
    await sleep(400);
  }

  for (const c of cres) {
    if (aborted) { console.log(`  POST ${c.slug}: 上の停止のため行わない`); push({ slug: c.slug, result: 'post_not_run_aborted' }); continue; }
    try {
      const ex = await listBySlug(c.slug);
      if (ex.totalCount > 0) {
        const r0 = ex.contents[0];
        const diff = Object.keys(c.content).filter((k) => !same(r0[k], c.content[k]));
        cnt.post_skip++;
        console.log(`  POST skip ${c.slug}: 既存 ${ex.totalCount} 件（id=${r0.id}）${diff.length ? `・計画と違う field ${diff.join(',')}` : '・計画と全 field 一致'}`);
        push({ slug: c.slug, result: 'post_skip_exists', id: r0.id, totalCount: ex.totalCount, diff });
        continue;
      }
      if (!APPLY) { cnt.post_dry++; push({ slug: c.slug, result: 'post_dry', content: c.content }); continue; }
      const res = await api<{ id: string }>('POST', EP, c.content);
      await sleep(700);
      const after = await getById(res.id);
      const bad = Object.keys(c.content).filter((k) => !same(after[k], c.content[k]))
        .map((k) => `${k}: 送信 ${JSON.stringify(c.content[k])} 保存 ${JSON.stringify(after[k])}`);
      const n = (await listBySlug(c.slug)).totalCount;
      if (n !== 1) bad.push(`slug ${c.slug} の件数が ${n}`);
      if (bad.length) { cnt.failed++; console.log(`  ★NG POST ${c.slug}: ${bad.join(' / ')}`); } else cnt.posted++;
      console.log(`  POST ${c.slug} → id=${res.id}（${bad.length ? 'NG' : `全 ${Object.keys(c.content).length} field 一致・slug 1 件`}）`);
      push({ slug: c.slug, result: bad.length ? 'post_failed' : 'posted', id: res.id, check: bad, saved: after });
      if (bad.length) { aborted = true; break; }
    } catch (e) {
      cnt.failed++; console.log(`  ★例外 POST ${c.slug}: ${(e as Error).message}`);
      push({ slug: c.slug, result: 'error', error: (e as Error).message });
      if (APPLY) { aborted = true; break; }
    }
  }

  console.log(`[done] ${JSON.stringify(cnt)}${aborted ? '（★停止あり）' : ''}`);
  console.log(`[microCMS 呼び出し（HTTP 送信・再送込み）] ${Object.entries(calls).map(([m, n]) => `${m} ${n}`).join('・')}・再送 ${retries.length}`);
  if (LOG_PATH) fs.writeFileSync(LOG_PATH, JSON.stringify({ mode: APPLY ? 'apply' : 'dry', area: plan.area, only: ONLY, counts: cnt, aborted, calls, retries, log }, null, 1));
  if (cnt.failed || cnt.skip_changed || aborted) process.exitCode = 2;
}

main().catch((e) => { console.error(e); process.exit(1); });
