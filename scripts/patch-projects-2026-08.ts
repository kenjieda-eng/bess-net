/**
 * scripts/patch-projects-2026-08.ts — /projects 差分PATCHランナー（plan駆動・調査中一斉補完 2026-08）
 *
 * 入力: --plan <path>（既定 scripts/projects-patch-plan-2026-08.json）
 *   [{ "slug": "...", "set": { "outputMw": 2, "capacityMwh": 8.146, "status": ["稼働中"], ... }, "note": "根拠1行" }, ...]
 *
 * 動作:
 *   --dry-run : 全対象の slug・フィールド・旧→新 を一覧出力（PATCHなし）
 *   本実行    : 差分のみ PATCH（現値==新値はskip）→ GET全field照合（#106）→ 逐次300ms
 * 制約: PATCHのみ（POST/PUT/DELETEなし）。set に含まれないフィールドは送らない＝不変。
 *       status/marketParticipation は実在 select 値ガード。キーは env のみ・値は出力しない。
 * 実行: npx tsx --env-file=.env.local scripts/patch-projects-2026-08.ts [--dry-run] [--plan path]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const VALID_STATUS = new Set(['計画中', '建設中', '稼働中']);
const VALID_MARKET = new Set(['JEPX', '需給調整市場', '容量市場', '長期脱炭素']);
const PATCHABLE = new Set([
  'name', 'outputMw', 'capacityMwh', 'prefecture', 'city', 'operator', 'epc',
  'cod', 'status', 'marketParticipation', 'sourceUrl', 'body',
]);

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const API_KEY = process.env.MICROCMS_API_KEY;
if (!API_KEY) { console.error('ERROR: MICROCMS_API_KEY required'); process.exit(1); }
const DRY_RUN = process.argv.includes('--dry-run');
function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}
const PLAN_PATH = argValue('--plan') ?? path.join(process.cwd(), 'scripts', 'projects-patch-plan-2026-08.json');
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;

type Plan = { slug: string; set: Record<string, unknown>; note?: string };

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
async function getBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const d = await api<{ contents: Record<string, unknown>[] }>(
    'GET', `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`);
  return d.contents[0] ?? null;
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const short = (v: unknown, n = 44) => {
  const s = JSON.stringify(v ?? null);
  return s.length > n ? s.slice(0, n) + '…' : s;
};

async function main(): Promise<void> {
  const plans: Plan[] = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
  // バリデーション（実在値・許可フィールドのみ）
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const p of plans) {
    if (seen.has(p.slug)) errs.push(`${p.slug}: plan内slug重複`);
    seen.add(p.slug);
    for (const [k, v] of Object.entries(p.set)) {
      if (!PATCHABLE.has(k)) errs.push(`${p.slug}: フィールド「${k}」はPATCH対象外`);
      if (k === 'status') for (const s of v as string[]) if (!VALID_STATUS.has(s)) errs.push(`${p.slug}: status「${s}」非実在値（#106）`);
      if (k === 'marketParticipation') for (const m of v as string[]) if (!VALID_MARKET.has(m)) errs.push(`${p.slug}: market「${m}」非実在値（#106）`);
    }
  }
  if (errs.length) { console.error('ERROR plan validation:'); errs.forEach((e) => console.error('  - ' + e)); process.exit(2); }

  console.log('━'.repeat(70));
  console.log(`[patch-projects] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}  plan=${plans.length}件  (${PLAN_PATH})`);
  console.log('━'.repeat(70));

  let patched = 0, skipped = 0, failed = 0;
  const diffsAll: string[] = [];
  for (const p of plans) {
    const cur = await getBySlug(p.slug);
    if (!cur) { console.error(`  [err] ${p.slug}: 見つからない`); failed++; continue; }
    // 差分抽出（現値==新値のフィールドは送らない）
    const diff: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(p.set)) if (!eq(cur[k], v)) diff[k] = v;
    if (Object.keys(diff).length === 0) {
      console.log(`  [skip] ${p.slug}: 全フィールド既に一致（冪等）`);
      skipped++;
      await new Promise((r) => setTimeout(r, 150));
      continue;
    }
    for (const [k, v] of Object.entries(diff)) {
      const line = `  ${p.slug} .${k}: ${short(cur[k])} → ${short(v)}`;
      console.log(line);
      diffsAll.push(line);
    }
    if (!DRY_RUN) {
      try {
        await api('PATCH', `${BASE}/${cur.id}`, diff);
        await new Promise((r) => setTimeout(r, 300));
        const after = await getBySlug(p.slug);
        const bad = Object.entries(diff).filter(([k, v]) => !eq(after?.[k], v));
        if (bad.length) {
          console.error(`  [err] ${p.slug}: GET照合不一致（#106?）: ${bad.map(([k]) => k).join(',')}`);
          failed++;
        } else {
          console.log(`  [ok+照合PASS] ${p.slug}`);
          patched++;
        }
      } catch (e) {
        console.error(`  [err] ${p.slug}: ${(e as Error).message}`);
        failed++;
      }
    } else {
      patched++;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log('━'.repeat(70));
  console.log(`[done] ${DRY_RUN ? 'patch予定' : 'patched'}=${patched}  skip=${skipped}  err=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
