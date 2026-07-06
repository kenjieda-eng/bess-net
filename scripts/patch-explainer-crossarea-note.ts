/**
 * scripts/patch-explainer-crossarea-note.ts
 *
 * explainer substation-availability-cross-area-analysis のリード初出「6,507件」直後に
 * 時点注記を1箇所追記（2026-07-06 ハードコード数値恒久化バッチ 修正3）。
 *
 * - 本文（body）は「9社6,507件」時点の分析として数値整合しているため一切変更しない（L-EIC-019）。
 * - lead のみ PATCH 1件。冪等: 注記が既にあれば skip。
 *
 * 実行: npx tsx --env-file=.env.local scripts/patch-explainer-crossarea-note.ts [--dry-run]
 */
export {};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }

const ID = 'substation-availability-cross-area-analysis';
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/explainer`;
const ANCHOR = '統合した結果、6,507件';
const NOTE = '（2026年5月時点の集計。現在は関東を含む10社・8,225変電所を収録）';

async function apiFetch(method: string, url: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text.slice(0, 400)}`);
  }
  return resp.json();
}

async function main(): Promise<void> {
  const e = (await apiFetch('GET', `${BASE}/${ID}?fields=id,slug,lead,body`)) as { slug: string; lead: string; body: string };
  if (e.slug !== ID) throw new Error(`ABORT: slug mismatch (${e.slug})`);
  if (e.lead.includes(NOTE)) { console.log('SKIP: 注記は既に存在（冪等）'); return; }
  if (!e.lead.includes(ANCHOR)) throw new Error(`ABORT: lead にアンカー「${ANCHOR}」が見つからない。lead=${e.lead.slice(0, 200)}`);

  const newLead = e.lead.replace(ANCHOR, `${ANCHOR}${NOTE}`);
  console.log('--- new lead ---');
  console.log(newLead);
  if (DRY_RUN) { console.log('--dry-run: PATCH しません'); return; }

  const bodyBefore = e.body;
  await apiFetch('PATCH', `${BASE}/${ID}`, { lead: newLead });
  const after = (await apiFetch('GET', `${BASE}/${ID}?fields=lead,body`)) as { lead: string; body: string };
  const leadOk = after.lead === newLead;
  const bodyOk = after.body === bodyBefore;
  console.log(`verify: lead=${leadOk ? 'OK' : 'NG'} body不変=${bodyOk ? 'OK' : 'NG'}`);
  if (!leadOk || !bodyOk) { console.error('VERIFY FAILED'); process.exit(2); }
  console.log('PATCH OK（lead のみ・1件）');
}

main().catch((e) => { console.error(e); process.exit(1); });
