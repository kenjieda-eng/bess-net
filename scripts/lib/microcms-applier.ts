/**
 * scripts/lib/microcms-applier.ts — 計画 JSON を microCMS に当てる applier の共通部分（Ck2d ■2・2026-10-03）
 *
 * Ck-2 実行便②（scripts/apply-ck2-exec2-2026-09-29.ts）と ATB2025 追随便（scripts/apply-atb2025-2026-10-02.ts）が
 * 同じ中身を 2 本持っていたので 1 か所に切り出した（挙動は不変）。各 applier は runApplier() を呼ぶだけ。
 *
 * ★既定は dry run。本実行は --apply を明示したときだけ（R32・落とし穴に追記）。
 *   2026-09-29 の Ck-2 ②で、冪等確認のつもりで --dry-run を付け忘れて本実行し、用語集 3 レコードに意図しない PATCH が入った
 *   （即復元・本番未露出）。--dry-run は受け付けて無視する（既定と同じ）。
 *
 * 計画 JSON（`plan`）:
 *   plan.patches[]: { ep, slug, order, ops: [{ field, old, new, row_ids, note }], expect_final? }
 *   plan.posts[]  : { ep, slug, row_id, order, payload }
 * PATCH の規則:
 *   - slug から id を解決し、各 field に ops を順に当てる。old はその時点でちょうど 1 回現れること（#87）。
 *   - 追記型（old が new に含まれる）は new が既にあれば適用済み（再実行で二重に入れない）。
 *   - old が 0 回で、new の本文が既に在り old の本文が無いなら「適用済み」。それ以外の 0 回・2 回以上はそのレコードを丸ごと中止。
 *   - expect_final（適用後の各 field の正規化テキストの sha256 先頭 16 桁）と一致するレコードは skip（冪等の本判定）。
 *   - PATCH 後に GET し、送った field は送信値と一致（richEditor は #122 の正規化テキストで照合）、送っていない field は変化 0（#106）。
 * POST の規則: slug が既存なら skip。POST 後に GET して全 field 照合。
 * DELETE / PUT は無い。microCMS 呼び出しはメソッド別に数えて最後に出す。
 */
import * as fs from 'node:fs';
import { createHash } from 'node:crypto';

export type Op = { field: string; old: string; new: string; row_ids: string[]; note?: string };
export type Patch = { ep: string; slug: string; order: number; ops: Op[]; expect_final?: Record<string, string> };
export type Post = { ep: string; slug: string; row_id: string; order: number; payload: Record<string, unknown> };
type Rec = Record<string, unknown> & { id: string; slug: string };

export type ApplierConfig = {
  /** ログの見出し（例「Ck-2 実行便② applier」） */
  label: string;
  /** --plan= が無いときの計画 JSON のパス */
  defaultPlanPath: string;
};

/** microCMS は空文字を送ると空欄（null・キー無し）として保存する。照合では '' と null を同じに扱う */
const norm = (v: unknown) => JSON.stringify(v === undefined || v === '' ? null : v);
/** 本文の正規化テキスト（#122: richEditor の見出し id 再採番・&apos; 等の正規化を吸収する） */
export const plain = (s: string) =>
  s.replace(/<[^>]+>/g, '')
    .replace(/&apos;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .normalize('NFKC').replace(/\s+/g, '');
/** expect_final の計算（配列・オブジェクトは JSON、文字列は正規化テキストの sha256 先頭 16 桁） */
export const digest = (v: unknown) =>
  createHash('sha256').update(Array.isArray(v) || (typeof v === 'object' && v !== null) ? JSON.stringify(v) : plain(String(v ?? ''))).digest('hex').slice(0, 16);
const isArrayField = (v: unknown) => Array.isArray(v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** 照合用の同値判定。microCMS の保存形式の差を吸収する:
 *   日付 '2026-08-31' → '2026-08-31T00:00:00.000Z'／関連（relation）の ID 配列 ['a'] → [{ id: 'a' }]／'' → null。 */
function sameValue(sent: unknown, got: unknown): boolean {
  if (typeof sent === 'string' && typeof got === 'string') {
    if (sent === got || plain(sent) === plain(got)) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(sent) && got.startsWith(sent + 'T')) return true;
    return false;
  }
  if (Array.isArray(sent) && Array.isArray(got) && sent.every((x) => typeof x === 'string')
      && got.every((x) => x && typeof x === 'object' && 'id' in (x as object))) {
    return norm(sent) === norm(got.map((x) => (x as { id: string }).id));
  }
  return norm(sent) === norm(got);
}
const SKIP_CMP = new Set(['updatedAt', 'revisedAt', 'publishedAt', 'createdAt']);
function pick(r: Record<string, unknown>, ks: string[]) { const o: Record<string, unknown> = {}; for (const k of ks) o[k] = r[k]; return o; }

function applyOps(rec: Rec, ops: Op[]): { payload: Record<string, unknown>; already: number; problems: string[] } {
  const cur: Record<string, unknown> = {};
  const problems: string[] = [];
  let already = 0;
  for (const op of ops) {
    const base = op.field in cur ? cur[op.field] : rec[op.field];
    if (isArrayField(base) || op.note?.includes('配列')) {
      const want = JSON.parse(op.new);
      if (norm(base) === norm(want)) { already++; continue; }
      if (norm(base) !== norm(JSON.parse(op.old))) { problems.push(`${op.field}: 配列の現在値 ${norm(base)} が old と不一致`); continue; }
      cur[op.field] = want;
      continue;
    }
    const s = typeof base === 'string' ? base : base == null ? '' : String(base);
    const n = count(s, op.old);
    const oldP = plain(op.old), newP = plain(op.new);
    // ★追記型（old が new に含まれる）は、置換後にも old が残る。n===1 だけで判定すると再実行で二重に入る
    //   （Ck-2 ②の検証役が再実行シミュレーションで検出）。先に「new が既に在るか」を見る。
    //   richEditor は保存時に & → &amp;・' → &apos;・見出し id 再採番があるので、生の一致に加えて正規化テキストでも見る（#122）。
    const appendType = op.new !== '' && (op.new.includes(op.old) || (oldP !== '' && newP.includes(oldP)));
    const newPresent = op.new !== '' && (s.includes(op.new) || (newP.length >= 6 && plain(s).includes(newP)));
    if (appendType && newPresent) { already++; continue; }
    if (n === 1) { cur[op.field] = s.replace(op.old, () => op.new); continue; }
    if (n === 0) {
      const done = op.new === '' ? (oldP === '' || !plain(s).includes(oldP)) : (newPresent && (oldP === '' || !plain(s).includes(oldP) || newP.includes(oldP)));
      if (done) { already++; continue; }
      problems.push(`${op.field}: old が 0 回（rows ${op.row_ids.join(',')}）`);
      continue;
    }
    problems.push(`${op.field}: old が ${n} 回（一意でない・rows ${op.row_ids.join(',')}）`);
  }
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cur)) if (norm(v) !== norm(rec[k])) payload[k] = v;
  return { payload, already, problems };
}

export async function runApplier(cfg: ApplierConfig, argv: string[] = process.argv): Promise<void> {
  const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
  const KEY = process.env.MICROCMS_API_KEY;
  if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
  // R32: 既定は dry run。本実行は --apply を明示したときだけ（--dry-run は受け付けて無視＝既定と同じ）
  const DRY = !argv.includes('--apply');
  const ONLY = (argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
  const ORDERS = (argv.find((a) => a.startsWith('--orders=')) ?? '').slice(9).split(',').filter(Boolean).map(Number);
  const PLAN_PATH = argv.find((a) => a.startsWith('--plan='))?.slice(7) ?? cfg.defaultPlanPath;
  const LOG_PATH = argv.find((a) => a.startsWith('--log='))?.slice(6);

  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8')).plan as { patches: Patch[]; posts: Post[] };
  const calls: Record<string, number> = {};
  const log: Record<string, unknown>[] = [];
  let patched = 0, posted = 0, skipped = 0, aborted = 0, failed = 0;

  async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
    calls[method] = (calls[method] ?? 0) + 1;
    const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    for (let attempt = 0; ; attempt++) {
      const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      if (r.status === 429 && attempt < 4) { await sleep(2000 * (attempt + 1)); continue; }
      if (!r.ok) throw new Error(`${method} ${url.replace(/\?.*/, '')} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
      return r.json() as T;
    }
  }
  const ep = (e: string) => `https://${DOMAIN}.microcms.io/api/v1/${e}`;
  const bySlug = async (e: string, slug: string): Promise<Rec | null> =>
    (await api<{ contents: Rec[] }>('GET', `${ep(e)}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1&depth=0`)).contents[0] ?? null;
  const byId = (e: string, id: string) => api<Rec>('GET', `${ep(e)}/${id}?depth=0`);

  async function runPatch(p: Patch): Promise<void> {
    const tag = `${p.ep}/${p.slug}`;
    const found = await bySlug(p.ep, p.slug);
    if (!found) { console.log(`■ PATCH ${tag} [中止] slug が存在しない`); aborted++; log.push({ kind: 'patch', target: tag, result: 'aborted', reason: 'no record' }); return; }
    const before = await byId(p.ep, found.id);
    // ★冪等の本判定: レコードが「適用完了後の最終状態」（plan の expect_final＝正規化テキストの sha256）と一致すれば skip。
    //   op 単位の判定だけでは、重複段落の切除（old＝隣り合う2回分＋後続）が再実行で残した側まで削る（2026-09-29 実測・復元済み）。
    if (p.expect_final && Object.entries(p.expect_final).every(([k, hx]) => digest(before[k] ?? null) === hx)) {
      console.log(`■ PATCH ${tag}（${found.id}）[skip] 最終状態と一致（expect_final ${Object.keys(p.expect_final).length} field）`);
      skipped++; log.push({ kind: 'patch', target: tag, id: found.id, result: 'skip_final_state' }); return;
    }
    const { payload, already, problems } = applyOps(before, p.ops);
    if (problems.length) {
      console.log(`■ PATCH ${tag}（${found.id}）[中止] ${problems.join(' / ')}`);
      aborted++; log.push({ kind: 'patch', target: tag, id: found.id, result: 'aborted', problems }); return;
    }
    const fields = Object.keys(payload);
    if (fields.length === 0) {
      console.log(`■ PATCH ${tag}（${found.id}）[skip] 全 ${p.ops.length} op 適用済み（冪等）`);
      skipped++; log.push({ kind: 'patch', target: tag, id: found.id, result: 'skip_idempotent' }); return;
    }
    const lens = fields.map((f) => `${f} ${String(before[f] ?? '').length}→${String(payload[f] ?? '').length}字`).join('・');
    console.log(`■ PATCH ${tag}（${found.id}）ops ${p.ops.length}（適用済み ${already}）→ ${lens}`);
    if (DRY) { patched++; log.push({ kind: 'patch', target: tag, id: found.id, result: 'dry', fields, before: pick(before, fields), after: payload }); return; }
    await api('PATCH', `${ep(p.ep)}/${found.id}`, payload);
    await sleep(700);
    const after = await byId(p.ep, found.id);
    const bad: string[] = [];
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (SKIP_CMP.has(k)) continue;
      if (k in payload) {
        if (!sameValue(payload[k], after[k])) bad.push(`${k}: 送信値と不一致`);
      } else if (norm(before[k]) !== norm(after[k])) bad.push(`${k}: 送っていないのに変化`);
    }
    console.log(`   #106/#122: ${bad.length === 0 ? `✓ 送信 ${fields.length} field 一致・他 field 変化 0` : `★NG ${bad.join(' / ')}`}`);
    if (bad.length === 0) patched++; else failed++;
    log.push({ kind: 'patch', target: tag, id: found.id, result: bad.length ? 'failed' : 'patched', fields, check: bad, before: pick(before, fields), after: pick(after, fields) });
  }

  async function runPost(p: Post): Promise<void> {
    const tag = `${p.ep}/${p.slug}`;
    const cur = await bySlug(p.ep, p.slug);
    if (cur) { console.log(`■ POST ${tag} [skip] 既存あり（id=${cur.id}）`); skipped++; log.push({ kind: 'post', target: tag, row_id: p.row_id, result: 'skip_exists', id: cur.id }); return; }
    console.log(`■ POST ${tag}（${p.row_id}）${Object.keys(p.payload).length} field`);
    if (DRY) { posted++; log.push({ kind: 'post', target: tag, row_id: p.row_id, result: 'dry', payload: p.payload }); return; }
    const res = await api<{ id: string }>('POST', ep(p.ep), p.payload);
    await sleep(700);
    const after = await byId(p.ep, res.id);
    const bad: string[] = [];
    for (const [k, v] of Object.entries(p.payload)) {
      const got = after[k];
      if (!sameValue(v, got)) bad.push(`${k}: 送信=${norm(v).slice(0, 50)} 保存=${norm(got).slice(0, 50)}`);
    }
    console.log(`   #106: ${bad.length === 0 ? `✓ 全 ${Object.keys(p.payload).length} field 一致（id=${res.id}）` : `★NG ${bad.join(' / ')}`}`);
    if (bad.length === 0) posted++; else failed++;
    log.push({ kind: 'post', target: tag, row_id: p.row_id, id: res.id, result: bad.length ? 'failed' : 'posted', check: bad });
  }

  console.log(`[${cfg.label}] mode=${DRY ? 'DRY-RUN' : '本実行'} plan=${PLAN_PATH}${ONLY.length ? ` only=${ONLY.join(',')}` : ''}${ORDERS.length ? ` orders=${ORDERS.join(',')}` : ''}`);
  const items: ({ t: 'patch'; p: Patch } | { t: 'post'; p: Post })[] = [
    ...plan.patches.map((p) => ({ t: 'patch' as const, p })),
    ...plan.posts.map((p) => ({ t: 'post' as const, p })),
  ].filter((x) => (!ONLY.length || ONLY.includes(`${x.p.ep}/${x.p.slug}`)) && (!ORDERS.length || ORDERS.includes(x.p.order)))
    .sort((a, b) => a.p.order - b.p.order);
  for (const x of items) {
    try { if (x.t === 'patch') await runPatch(x.p); else await runPost(x.p); }
    catch (e) { failed++; console.log(`   ★例外 ${(e as Error).message}`); log.push({ kind: x.t, target: `${x.p.ep}/${x.p.slug}`, result: 'error', error: (e as Error).message }); }
    await sleep(250);
  }
  console.log(`\n[done] PATCH ${patched} / POST ${posted} / skip ${skipped} / 中止 ${aborted} / 失敗 ${failed}`);
  console.log(`[microCMS 呼び出し] ${Object.entries(calls).map(([m, n]) => `${m} ${n}`).join('・')}`);
  if (LOG_PATH) fs.writeFileSync(LOG_PATH, JSON.stringify({ mode: DRY ? 'dry' : 'apply', calls, counts: { patched, posted, skipped, aborted, failed }, log }, null, 1));
  if (aborted || failed) process.exitCode = 2;
}
