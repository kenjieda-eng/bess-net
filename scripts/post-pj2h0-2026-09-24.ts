#!/usr/bin/env tsx
/**
 * scripts/post-pj2h0-2026-09-24.ts — Pj2-H-0 構造便 ■4(c)(d) の POST
 *
 * 計画: scripts/pj2h0-post-plan-2026-09-24.json（journal の検証済み出力から機械生成。転記ミス防止）
 *   policy-events 1 件: occto-ltdc2026-shousai-setsumeikai-2026-09（9/17 LTDC 制度詳細説明会・開催済み）
 *   projects 3 件: minamiawaji-megapower / arida-yuasa-megapower / kitagifu-megapower（エネルギーパワー）
 *
 * ★#106: select は live で使用実績のある値のみ（status 終了64件 / 計画中・空も実在、
 *        category 容量市場15・長期脱炭素オークション10、marketParticipation 容量市場37・需給調整市場73）。
 *        POST 後に GET して送信した全 field を照合する。
 * ★R2: 年度精度（「2026年8月期中」等）の運開見通しは cod に入れない（null）。
 * ★R3: 物件引渡日・着工予定日・受電日は cod ではない。
 * ★冪等: slug 既存なら skip（重複 POST しない）。PUT / DELETE なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/post-pj2h0-2026-09-24.ts [--dry-run]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const PLAN = path.join(process.cwd(), 'scripts', 'pj2h0-post-plan-2026-09-24.json');
const LOG = path.join(process.cwd(), 'scripts', 'pj2h0-post-log-2026-09-24.json');

type Row = Record<string, unknown> & { slug: string };
type Plan = { note: string; policyEvents: Row[]; projects: Row[] };

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const ep = (e: string) => `https://${DOMAIN}.microcms.io/api/v1/${e}`;
const bySlug = async (e: string, slug: string): Promise<Row | null> =>
  (await api<{ contents: Row[] }>('GET', `${ep(e)}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);

const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as Plan;
const log: unknown[] = [];
let posted = 0, skipped = 0, failed = 0;

async function run(endpoint: string, row: Row): Promise<void> {
  console.log(`\n■ POST ${endpoint}/${row.slug}`);
  const cur = await bySlug(endpoint, row.slug);
  if (cur) {
    console.log(`   [skip] 既存あり（id=${cur.id}）＝重複 POST しない`);
    skipped++; log.push({ endpoint, slug: row.slug, result: 'skip-exists', id: cur.id });
    return;
  }
  for (const [k, v] of Object.entries(row)) {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    console.log(`   ${k}: ${s.length > 110 ? `${s.slice(0, 110)}…（${s.length}字）` : s}`);
  }
  if (DRY) { posted++; log.push({ endpoint, slug: row.slug, result: 'dry-run' }); return; }
  const res = await api<{ id: string }>('POST', ep(endpoint), row);
  await sleep(900);
  const after = await bySlug(endpoint, row.slug);
  const diffs: string[] = [];
  for (const [k, v] of Object.entries(row)) {
    if (norm(after?.[k]) !== norm(v)) diffs.push(`${k}: 送信=${norm(v).slice(0, 80)} 保存=${norm(after?.[k]).slice(0, 80)}`);
  }
  if (diffs.length === 0) {
    console.log(`   #106: ✓ 全 ${Object.keys(row).length} field 一致（id=${res.id}）`);
    posted++;
  } else {
    console.log(`   #106: ★NG 不一致 ${diffs.length} 件`);
    diffs.forEach((d) => console.log(`      ${d}`));
    failed++;
  }
  log.push({ endpoint, slug: row.slug, result: diffs.length === 0 ? 'ok' : 'mismatch', id: res.id, diffs });
  fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
  await sleep(400);
}

async function main(): Promise<void> {
  console.log(`[Pj2-H-0 POST] mode=${DRY ? 'DRY-RUN' : '本実行'} / policy-events ${plan.policyEvents.length} 件 + projects ${plan.projects.length} 件`);
  for (const r of plan.policyEvents) await run('policy-events', r);
  for (const r of plan.projects) await run('projects', r);
  console.log(`\n[done] POST ${posted} / skip ${skipped} / 失敗 ${failed}`);
  if (!DRY) fs.writeFileSync(LOG, JSON.stringify(log, null, 1));
}
main().catch((e) => { console.error(e); process.exit(1); });
