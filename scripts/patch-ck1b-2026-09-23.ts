#!/usr/bin/env tsx
/**
 * scripts/patch-ck1b-2026-09-23.ts — Ck-1b の microCMS PATCH（差分限定・件別）
 *
 * Ck-1 の scripts/patch-ck1-2026-09-21.ts と同じ方式。計画ファイル scripts/ck1a-patch-plan-2026-09-22.json
 * （件ごとに根拠つき）を読み、1 件ずつ PATCH する。
 *   op "set"        : フィールドをまるごと置き換える（URL 欄など）。現在値が from と一致するときだけ実行
 *   op "replace"    : フィールド内の文字列 from を to に 1 回だけ置き換える（from がちょうど 1 回出現するときだけ）
 *   op "replaceAll" : from を to にすべて置き換える（from の出現回数が計画の count と一致するときだけ）。
 *                     本文中の同じ URL（href と表示文字列）をまとめて差し替える用途
 *
 * 同じレコード・同じフィールドに複数の op があるときは、計画の順に 1 件ずつ適用する（毎回 GET し直す）。
 *
 * ★#106: PATCH 前後で GET し、対象フィールド以外の変化が 0 であることを確かめる。
 * ★#122: richEditor（explainer.body・glossary.detail）は保存時に正規化されるため、送信値との全文一致では判定しない。
 *        「to の素の文字列が含まれ、from が（to に含まれない限り）残っていない」で判定する。
 * ★冪等: 既に適用済み（set: 現在値＝to ／ replace・replaceAll: to があり from が無い、または挿入型で to がある）なら skip。
 * ★POST / PUT / DELETE なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-ck1b-2026-09-23.ts [--dry-run] [--only <id>] [--prefix <id-prefix>] [--skip <id,id,...>]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const arg = (name: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const ONLY = arg('--only');
const PREFIX = arg('--prefix');
const SKIP = new Set((arg('--skip') ?? '').split(',').filter(Boolean));
const PLAN = path.join(process.cwd(), 'scripts', 'ck1b-patch-plan-2026-09-23.json');
const LOG = path.join(process.cwd(), 'scripts', `ck1b-patch-log-2026-09-23${PREFIX ? `-${PREFIX}` : ''}.json`);
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

type Op = {
  id: string;
  endpoint: string;
  slug: string;
  field: string;
  op: 'set' | 'replace' | 'replaceAll';
  from: string;
  to: string;
  count?: number;
  why: string;
  evidence?: string;
};
type Rec = Record<string, unknown> & { id: string; slug?: string };

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const ep = (e: string) => `https://${DOMAIN}.microcms.io/api/v1/${e}`;
/** slug で引く。slug 欄の無い endpoint もあるので、見つからなければ id（content id）で引く */
async function getRec(e: string, slug: string): Promise<Rec | null> {
  const bySlug = (await api<{ contents: Rec[] }>('GET', `${ep(e)}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0];
  if (bySlug) return bySlug;
  try { return await api<Rec>('GET', `${ep(e)}/${encodeURIComponent(slug)}`); } catch { return null; }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);
const RICH = new Set(['explainer.body', 'glossary.detail', 'news.body']);
/** richEditor は保存時に ' → &apos; 等へ正規化する（#122）。照合前に引用符の実体参照だけ戻す。
 *  &lt; &gt; &amp; は戻さない（本文に書かれた「<」等の文字を、送り返すときにタグへ化けさせないため） */
const decode = (s: string) => s.replace(/&apos;|&#39;|&#x27;/g, "'").replace(/&quot;/g, '"');

type LogRow = Op & { result: string; before?: string; after?: string; otherFieldChanges?: number; note?: string };

async function main() {
  const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as { ops: Op[] };
  const ops = plan.ops.filter((o) => (!ONLY || o.id === ONLY) && (!PREFIX || o.id.startsWith(PREFIX)) && !SKIP.has(o.id));
  console.log(`[Ck-1b PATCH] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / ${ops.length} 件`);
  const log: LogRow[] = [];
  let ok = 0, skipped = 0, failed = 0;
  for (const o of ops) {
    const tag = `${o.id} ${o.endpoint}/${o.slug}.${o.field}`;
    const b = await getRec(o.endpoint, o.slug);
    if (!b) { console.log(`✗ ${tag}: レコード不在`); failed++; log.push({ ...o, result: 'not-found' }); continue; }
    const raw = b[o.field];
    // select（配列）等の非文字列フィールドは JSON 文字列で比較し、送信は JSON.parse した値にする（例: status ["受付終了"]）
    const isJson = Array.isArray(raw) || (raw !== null && typeof raw === 'object');
    const curRaw = isJson ? JSON.stringify(raw) : typeof raw === 'string' ? raw : raw === undefined || raw === null ? '' : String(raw);
    // richEditor は正規化済みの本文を返すので、照合は実体参照を戻した素の文字列で行う（送信も素の文字列からの置換）
    const cur = RICH.has(`${o.endpoint}.${o.field}`) ? decode(curRaw) : curRaw;
    if (isJson && o.op !== 'set') { console.log(`✗ ${tag}: 非文字列フィールドは set のみ`); failed++; log.push({ ...o, result: 'non-string-field' }); continue; }
    let next: string;
    if (o.op === 'set') {
      if (cur === o.to) { console.log(`- ${tag}: 適用済み（skip）`); skipped++; log.push({ ...o, result: 'already' }); continue; }
      if (cur !== o.from) { console.log(`✗ ${tag}: 現在値が計画の from と違う（中止）\n    現在: ${cur.slice(0, 200)}\n    計画: ${o.from.slice(0, 200)}`); failed++; log.push({ ...o, result: 'from-mismatch', before: cur }); continue; }
      next = o.to;
    } else {
      const n = count(cur, o.from);
      const insertion = o.to !== '' && o.to.includes(o.from);
      // ★#122: 挿入型（to が from を含む）は適用後も from が残る。適用済みの判定は「to（素の文字列）が既にある」
      if (o.to !== '' && cur.includes(o.to) && (insertion || n === 0)) { console.log(`- ${tag}: 適用済み（skip）`); skipped++; log.push({ ...o, result: 'already' }); continue; }
      const want = o.op === 'replace' ? 1 : o.count ?? -1;
      if (n !== want) {
        if (o.to === '' && n === 0) { console.log(`- ${tag}: 適用済み（削除済み・skip）`); skipped++; log.push({ ...o, result: 'already' }); continue; }
        console.log(`✗ ${tag}: from の出現が ${n} 回（計画 ${want} 回と違うので中止）`); failed++; log.push({ ...o, result: `from-count-${n}` }); continue;
      }
      next = o.op === 'replace' ? cur.replace(o.from, () => o.to) : cur.split(o.from).join(o.to);
    }
    console.log(`■ ${tag}\n    前: ${(o.op === 'set' ? cur : o.from).slice(0, 300)}\n    後: ${o.to.slice(0, 300)}\n    理由: ${o.why}`);
    if (DRY) { ok++; log.push({ ...o, result: 'dry-run', before: cur }); continue; }
    try {
      await api('PATCH', `${ep(o.endpoint)}/${b.id}`, { [o.field]: isJson ? JSON.parse(next) : next });
    } catch (e) {
      // 例: links.url は必須項目のため "" は HTTP 400（変更なし）。1 件の失敗で全体を止めず記録して続ける
      console.log(`✗ ${tag}: PATCH 失敗（変更なし） ${String(e).slice(0, 200)}`); failed++;
      log.push({ ...o, result: 'patch-error', before: cur, note: String(e).slice(0, 300) }); continue;
    }
    await sleep(900);
    const a = await getRec(o.endpoint, o.slug);
    let other = 0;
    for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {})])) {
      if (SYS.has(k) || k === o.field) continue;
      if (norm(a?.[k]) !== norm(b[k])) { other++; console.log(`    ✗ 対象外フィールドが変化: ${k}`); }
    }
    const avRaw = a?.[o.field];
    const avStr = isJson ? JSON.stringify(avRaw ?? null) : typeof avRaw === 'string' ? avRaw : avRaw === undefined || avRaw === null ? '' : String(avRaw);
    const rich = RICH.has(`${o.endpoint}.${o.field}`);
    const av = rich ? decode(avStr) : avStr;
    let fieldOk: boolean;
    if (o.op === 'set' && !rich) fieldOk = av === next;
    else if (o.to === '') fieldOk = count(av, o.from) === 0 || (o.op === 'set' && av === '');
    else fieldOk = av.includes(o.to) && (o.to.includes(o.from) || count(av, o.from) === 0);
    console.log(`    #106: ${fieldOk && other === 0 ? `✓ 対象 ${o.field} 反映${rich ? '（richEditor: 素の文字列で判定）' : ''}・他フィールド変化 0` : '★NG'}`);
    if (fieldOk && other === 0) ok++; else failed++;
    log.push({ ...o, result: fieldOk && other === 0 ? 'ok' : 'verify-ng', before: cur, after: avStr, otherFieldChanges: other, ...(rich && avStr !== av ? { note: 'richEditor が実体参照に正規化（#122）。素の文字列で照合' } : {}) });
    await sleep(300);
  }
  if (!DRY) {
    // 既存ログがあれば追記（段階実行で上書きしない）
    const prev: LogRow[] = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : [];
    fs.writeFileSync(LOG, JSON.stringify([...prev, ...log], null, 1));
  }
  console.log(`\n[done] 適用 ${ok} / skip ${skipped} / 失敗 ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
