#!/usr/bin/env tsx
/**
 * scripts/post-policy-events-2026-10-09.ts — 週次政策 2026-10-09 実施分（policy-events POST 10／PATCH 9）
 *
 * 原稿: OneDrive 03_5月13日朝_実行/週次政策_policy-calendar投入_2026-10-09.md（§2 POST・§3 PATCH）。
 * 値の正: 同名 .data.json（post[]・patch[]）。リポには reports/weekly-policy-2026-10-09.data.json として写し、
 *   投入直前の一次照合で是正した箇所はその写しに入れる（原稿からの変更点は報告 reports/weekly-policy-2026-10-09.md に逐語）。
 *
 * ★R32（落とし穴 #125）: 既定は dry run。本実行は --apply を明示したときだけ（--dry-run は受け付けて無視＝既定と同じ）。
 *   9/28 便までの post-policy-events-*.ts は「--dry-run を付けると dry run」の型だった（#125 より前）。
 * ★id は slug から解決する。原稿の id と違えば解決結果を正とし、ログに併記する（原稿 §4 の指示）。
 * ★冪等: POST は slug 既存なら skip。PATCH は現在値が原稿の期待値（status・sourceUrl・description の文字数・I は title）と
 *   違えば中止（時間差の別便の書込みを上書きしない）。ただし set・置換が既に当たっている状態なら skip。
 * ★#106: eventType / status / category は配列で送り、v4 スキーマの選択肢に実在する値だけ。kind / relatedTopics / eventTopics は []。
 *   endDate は JSON にある行だけ。registrationDeadline は送らない。
 * ★#122: description は textArea。置換は置換元が description 内でちょうど 1 回出現するときだけ。追記型（置換後の文が置換元を含む）は
 *   置換後の文が既にあれば適用済み。I の全文置換は現在値が from と完全一致のときだけ。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/post-policy-events-2026-10-09.ts [--apply] [--skip-optional] [--i-title-only] [--data=…] [--log=…]
 */
import * as fs from 'node:fs';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const ARGV = process.argv;
const DRY = !ARGV.includes('--apply');
const SKIP_OPTIONAL = ARGV.includes('--skip-optional');
const I_TITLE_ONLY = ARGV.includes('--i-title-only');
const DATA_PATH = ARGV.find((a) => a.startsWith('--data='))?.slice(7) ?? 'reports/weekly-policy-2026-10-09.data.json';
const LOG_PATH = ARGV.find((a) => a.startsWith('--log='))?.slice(6);
const EP = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;

type Rec = Record<string, unknown> & { id: string; slug: string };
type PostRow = Record<string, unknown> & { slug: string; _no: string; optional: boolean };
type Patch = {
  key: string;
  required: boolean;
  slug: string;
  id: string;
  updatedAt: string;
  expected: { status: string[]; sourceUrl: string; descLen: number; title?: string };
  set: Record<string, unknown>;
  replace: { from: string; to: string }[];
  fullDescription?: { from: string; to: string };
};
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as { post: PostRow[]; patch: Patch[] };

const calls: Record<string, number> = {};
const log: Record<string, unknown>[] = [];
async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  calls[method] = (calls[method] ?? 0) + 1;
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    if (r.status === 429 && attempt < 4) { await sleep(2000 * (attempt + 1)); continue; }
    if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return r.json() as T;
  }
}
const bySlug = async (slug: string): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${EP}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const byId = (id: string) => api<Rec>('GET', `${EP}/${id}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (v: unknown) => JSON.stringify(v === undefined || v === '' ? null : v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);

// v4 スキーマの選択肢（scripts/microcms-schema-policy-events-v4-2026-08-27.json）＝ #106 の実在確認
const SELECTS: Record<string, string[]> = {
  eventType: ['法改正', 'パブコメ', '重要会議', 'オークション', '公表', '展示会', 'セミナー', 'シンポジウム', '学会', '業界団体総会'],
  status: ['予定', '進行中', '終了'],
  category: ['容量市場', '需給調整市場', '長期脱炭素オークション', 'パブコメ', '重要会議', '補助金', '法改正', '公表'],
};
const POST_FIELDS = ['slug', 'title', 'eventDate', 'endDate', 'eventType', 'issuer', 'description', 'sourceUrl', 'status', 'category', 'kind', 'relatedTopics', 'eventTopics'];

let posted = 0, patched = 0, skipped = 0, failed = 0, aborted = 0;

function payloadOf(row: PostRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of POST_FIELDS) if (k in row) out[k] = row[k];
  return out;
}
function checkSelects(row: Record<string, unknown>, tag: string): string[] {
  const bad: string[] = [];
  for (const [k, opts] of Object.entries(SELECTS)) {
    if (!(k in row)) continue;
    const v = row[k];
    if (!Array.isArray(v)) { bad.push(`${tag}.${k} が配列でない`); continue; }
    for (const x of v) if (!opts.includes(String(x))) bad.push(`${tag}.${k}「${x}」は選択肢に無い`);
  }
  return bad;
}
const sameDate = (got: unknown, sent: unknown) => {
  const g = String(got ?? '');
  return g.slice(0, 10) === String(sent) || (g !== '' && new Date(g).toISOString().slice(0, 10) === String(sent));
};

async function tally(label: string): Promise<{ total: number; seisaku: number; gyokai: number }> {
  const all: Rec[] = [];
  for (let off = 0; ; off += 100) {
    const r = await api<{ contents: Rec[] }>('GET', `${EP}?limit=100&offset=${off}&fields=id,slug,kind&orders=-publishedAt`);
    all.push(...r.contents);
    if (r.contents.length < 100) break;
  }
  const gyokai = all.filter((x) => Array.isArray(x.kind) && (x.kind as string[]).includes('業界')).length;
  const out = { total: all.length, seisaku: all.length - gyokai, gyokai };
  console.log(`[${label}] policy-events 全 ${out.total} 件（kind 未設定 ${out.seisaku}・業界 ${out.gyokai}）`);
  return out;
}

async function runPost(row: PostRow): Promise<void> {
  console.log(`\n■ POST ${row._no} ${row.slug}${row.optional ? '（任意）' : ''}`);
  const cur = await bySlug(row.slug);
  if (cur) { console.log(`   [skip] 既存あり（id=${cur.id}）`); skipped++; log.push({ kind: 'post', slug: row.slug, result: 'skip_exists', id: cur.id }); return; }
  const payload = payloadOf(row);
  console.log(`   title: ${payload.title}`);
  console.log(`   eventDate: ${payload.eventDate}${payload.endDate ? `／endDate: ${payload.endDate}` : ''}・status ${norm(payload.status)}・description ${String(payload.description).length} 字`);
  if (DRY) { posted++; log.push({ kind: 'post', slug: row.slug, result: 'dry', payload }); return; }
  const res = await api<{ id: string }>('POST', EP, payload);
  await sleep(900);
  const after = await byId(res.id);
  const diffs: string[] = [];
  for (const [k, v] of Object.entries(payload)) {
    const got = after[k];
    const same = k === 'eventDate' || k === 'endDate' ? sameDate(got, v) : norm(got) === norm(v);
    if (!same) diffs.push(`${k}: 送信=${norm(v).slice(0, 60)} 保存=${norm(got).slice(0, 60)}`);
  }
  console.log(diffs.length === 0 ? `   #106: ✓ 全 ${Object.keys(payload).length} field 一致（id=${res.id}）` : `   #106: ★差分 ${diffs.length} 件 → ${diffs.join(' / ')}`);
  if (diffs.length === 0) posted++; else failed++;
  log.push({ kind: 'post', slug: row.slug, id: res.id, result: diffs.length ? 'failed' : 'posted', diffs, after });
}

async function runPatch(p: Patch): Promise<void> {
  console.log(`\n■ PATCH ${p.key} ${p.slug}${p.required ? '' : '（任意）'}`);
  const found = await bySlug(p.slug);
  if (!found) { console.log('   [中止] slug が存在しない'); aborted++; log.push({ kind: 'patch', key: p.key, result: 'aborted', reason: 'no slug' }); return; }
  if (found.id !== p.id) console.log(`   ★slug→id の解決結果（${found.id}）が原稿の id（${p.id}）と違う → 解決結果を正とする`);
  else console.log(`   id: ${found.id}（slug から解決・原稿の id と一致）`);
  const before = await byId(found.id);
  const desc = String(before.description ?? '');
  const fullFrom = p.fullDescription && !I_TITLE_ONLY ? p.fullDescription : undefined;

  // 既に適用済みか（set の値・置換後の文・全文置換の to が揃っている）
  const setDone = Object.entries(p.set).every(([k, v]) => norm(before[k]) === norm(v));
  const repDone = p.replace.every((r) => desc.includes(r.to) && (r.to.includes(r.from) || !desc.includes(r.from)));
  const fullDone = !fullFrom || desc === fullFrom.to;
  if (setDone && repDone && fullDone) { console.log('   [skip] 全項目が適用済み（冪等）'); skipped++; log.push({ kind: 'patch', key: p.key, id: found.id, result: 'skip_idempotent' }); return; }

  // 期待値（原稿の GET 時点）との照合。updatedAt が同じなら照合は通るはず。違えば値で比べる
  if (before.updatedAt !== p.updatedAt) console.log(`   updatedAt が原稿（${p.updatedAt}）と違う（現在 ${before.updatedAt}）→ 値で照合`);
  const e = p.expected;
  const mism: string[] = [];
  if (norm(before.status) !== norm(e.status) && !(p.set.status && norm(before.status) === norm(p.set.status))) mism.push(`status 現在=${norm(before.status)} 期待=${norm(e.status)}`);
  if (before.sourceUrl !== e.sourceUrl && !(p.set.sourceUrl && before.sourceUrl === p.set.sourceUrl)) mism.push(`sourceUrl 現在=${before.sourceUrl}`);
  if (desc.length !== e.descLen && !repDone) mism.push(`description ${desc.length} 字（期待 ${e.descLen} 字）`);
  if (e.title !== undefined && before.title !== e.title && !(p.set.title && before.title === p.set.title)) mism.push(`title 現在=${before.title}`);
  if (mism.length) { console.log(`   [中止] 現在値が原稿の期待値と違う: ${mism.join(' / ')}`); aborted++; log.push({ kind: 'patch', key: p.key, id: found.id, result: 'aborted', mism }); return; }

  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p.set)) {
    if (norm(before[k]) === norm(v)) { console.log(`   ${k}: ${norm(v)} [同値・skip]`); continue; }
    payload[k] = v;
    console.log(`   ${k}: 前 ${norm(before[k])} → 後 ${norm(v)}`);
  }
  let next = desc;
  if (fullFrom) {
    if (next === fullFrom.to) console.log('   description: 全文置換は適用済み');
    else if (next !== fullFrom.from) { console.log('   [中止] description が全文置換の from と一致しない'); aborted++; log.push({ kind: 'patch', key: p.key, id: found.id, result: 'aborted', reason: 'full from mismatch' }); return; }
    else { next = fullFrom.to; console.log(`   description: 全文置換（${desc.length}→${next.length}字）`); }
  } else if (p.fullDescription && I_TITLE_ONLY) console.log('   description: --i-title-only のため全文置換を skip');
  for (const [i, r] of p.replace.entries()) {
    if (next.includes(r.to) && (r.to.includes(r.from) || !next.includes(r.from))) { console.log(`   置換${i + 1}: 適用済み（冪等）`); continue; }
    const n = count(next, r.from);
    if (n !== 1) { console.log(`   [中止] 置換${i + 1}: 置換元が ${n} 回（一意でない）`); aborted++; log.push({ kind: 'patch', key: p.key, id: found.id, result: 'aborted', reason: `replace${i + 1} count ${n}` }); return; }
    next = next.replace(r.from, () => r.to);
    console.log(`   置換${i + 1}: 置換元 1 回 → 置換`);
  }
  if (next !== desc) payload.description = next;
  if (Object.keys(payload).length === 0) { console.log('   [skip] 変更なし（冪等）'); skipped++; log.push({ kind: 'patch', key: p.key, id: found.id, result: 'skip_idempotent' }); return; }
  console.log(`   送る field: ${Object.keys(payload).join('・')}${payload.description ? `（description ${desc.length}→${String(payload.description).length}字）` : ''}`);
  if (DRY) { patched++; log.push({ kind: 'patch', key: p.key, id: found.id, result: 'dry', payload, before: Object.fromEntries(Object.keys(payload).map((k) => [k, before[k]])) }); return; }
  await api('PATCH', `${EP}/${found.id}`, payload);
  await sleep(900);
  const after = await byId(found.id);
  const bad: string[] = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (['updatedAt', 'revisedAt'].includes(k)) continue;
    if (k in payload) { if (norm(after[k]) !== norm(payload[k])) bad.push(`${k}: 送信値と不一致`); }
    else if (norm(before[k]) !== norm(after[k])) bad.push(`${k}: 送っていないのに変化`);
  }
  console.log(`   #106/#122: ${bad.length === 0 ? `✓ 送信 ${Object.keys(payload).length} field 一致・他 field 変化 0` : `★NG ${bad.join(' / ')}`}`);
  if (bad.length === 0) patched++; else failed++;
  log.push({ kind: 'patch', key: p.key, id: found.id, result: bad.length ? 'failed' : 'patched', check: bad, before: Object.fromEntries(Object.keys(payload).map((k) => [k, before[k]])), after: Object.fromEntries(Object.keys(payload).map((k) => [k, after[k]])) });
}

async function main(): Promise<void> {
  console.log(`[週次政策 2026-10-09 policy-events] mode=${DRY ? 'DRY-RUN' : '本実行'}${SKIP_OPTIONAL ? '・任意は skip' : ''}${I_TITLE_ONLY ? '・I は title だけ' : ''} data=${DATA_PATH}`);
  const posts = data.post.filter((r) => !(SKIP_OPTIONAL && r.optional));
  const patches = data.patch.filter((p) => !(SKIP_OPTIONAL && !p.required));
  const bad = [...posts.flatMap((r) => checkSelects(r, r.slug)), ...patches.flatMap((p) => checkSelects(p.set, p.key))];
  if (bad.length) { console.log(`[中止] #106 選択肢の不実在: ${bad.join(' / ')}`); process.exit(1); }
  console.log(`#106: POST ${posts.length} 件・PATCH ${patches.length} 件の select はすべて v4 の選択肢に実在・配列`);
  await tally('前');
  for (const r of posts) await runPost(r);
  for (const p of patches) await runPatch(p);
  if (!DRY) await tally('後');
  console.log(`\n[done] POST ${posted} / PATCH ${patched} / skip ${skipped} / 中止 ${aborted} / 失敗 ${failed}`);
  console.log(`[microCMS 呼び出し] ${Object.entries(calls).map(([m, n]) => `${m} ${n}`).join('・')}`);
  if (LOG_PATH) fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  if (aborted || failed) process.exit(2);
}
main().catch((e) => { console.error(e); process.exit(1); });
