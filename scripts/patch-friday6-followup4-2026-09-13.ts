#!/usr/bin/env tsx
/**
 * scripts/patch-friday6-followup4-2026-09-13.ts — 金曜#6 追修便④の microCMS PATCH（差分限定・件別提示・#106）
 *
 * 対象:
 *   ■2・■3 和歌山 pr-co140317-bess: 諸元を事業者自身の施設別の記載（発電所・事業一覧「定格出力1,979kW予定 定格容量8,226kWh予定」）で
 *          確定（outputMw null→1.979・capacityMwh null→8.226）＋本文の「設備容量約8.2MWh」を発表者（脱炭素化支援機構）の記載として
 *          明示し、事業者の記載と表記が違うこと・諸元欄がどちらを採ったかを 1 文で示す。
 *          ★フィールド 2 つと本文を 1 回の PATCH にまとめる（本文の「諸元欄は…を採っている」とフィールドが食い違う瞬間を作らない）。
 *   ■2 朝来 pr-co109041-hyogo・丹波 tamba-megapower: 照合のみ（現値 1.979／8.226 が一覧の施設別の行と一致すること＝書込なし）。
 *
 * 1,976 と 1,979（■2(a)）: 1,976 は EP 発行者情報の（注）「完成後の増加能力は、出力で1,976kW」（2025-05-30 版＝朝来・丹波、
 *   2025-11-28 版＝和歌山）にだけ現れる（訂正開示なし）。同じ定型文は 2026-05-29 版で「出力で1,979kW」（同じ 8,226kWh 構成の南あわじ）。
 *   1,979 はメーカー発表「PCS出力」・EP 一覧「定格出力」・EP 取得開示「（５）能力」。1,976 を別の量として書いた一次は無い＝同じ量の食い違い。
 *   どちらが正かを明言した資料は無く、1,979 を採るのは一次の大勢と (b) 一覧の施設別の記載による（反証 3 視点で確認・言い過ぎ 2 点は報告で訂正）。
 *
 * ★各行: 実行前に slug・field・前値・後値を表示（件別提示）→ 現在値が承認時の expect と違えば書かない →
 *   書込直前に一次の逐語（must）を取り直し、全部あるときだけ PATCH → GET で全 field 照合（#106）。
 *   本文の置換は old がちょうど 1 回だけ現れることを確認。冪等判定は marker（タグを外した本文の素の文言・#122）。
 *   発電所・事業一覧の数値は画像の alt 属性にあるため、一次照合は alt の文字列も対象に含める。
 * ★DELETE/PUT/POST なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-friday6-followup4-2026-09-13.ts [--dry-run] [--only=<label の語>]
 */
import { execFileSync } from 'node:child_process';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice('--only='.length);
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

type Rec = Record<string, unknown> & { id: string; slug: string };
type Must = { url: string; text: string };
type Replace = { field: string; old: string; new: string; marker: string };
type Row = {
  label: string;
  endpoint: 'projects';
  slug: string;
  /** 変更する field の承認時の現在値（違えば書かない） */
  expect: Record<string, unknown>;
  /** 変更後の値 */
  set: Record<string, unknown>;
  replace?: Replace;
  must: Must[];
  /** 書込が無くても must を照合して結果を出す（照合のみの行） */
  verifyOnly?: boolean;
  why: string;
};

// ─────────────────────────────────────────────────────────────
// 一次照合で確定した行（手で書き換えない）
// ─────────────────────────────────────────────────────────────
const A = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const KENEP_LIST = 'https://kenep.co.jp/denki/project/';
const IR_1127_2 = 'https://kenep.co.jp/pdf/ir_20241127-2.pdf';
const IR_0812_3 = 'https://kenep.co.jp/pdf/ir_20250812-3.pdf';
const IR_1014_3 = 'https://kenep.co.jp/pdf/ir_20251014-3.pdf';
const IR_0529_1 = 'https://kenep.co.jp/pdf/ir_20260529-1.pdf';
const PR_JICN = 'https://prtimes.jp/main/html/rd/p/000000034.000140317.html';
const PR154 = 'https://prtimes.jp/main/html/rd/p/000000154.000109041.html';

// ■3 和歌山: 本文の「設備容量約8.2MWh」を地の文から外し、発表者の記載として明示＋事業者の記載・諸元欄の根拠を示す（#123 時点明示）
const IR_1014_3_LINK = A(IR_1014_3, '（開示事項の経過）資金借入に関するお知らせ（2025年10月14日）');
const WAKA_OLD =
  `同社が和歌山県和歌山市松江で計画する設備容量約8.2MWhの系統用蓄電所事業に3億円の支援を行うことを決定したと発表した（同日の同社開示: ${IR_1014_3_LINK}）。`;
const WAKA_MARKER = '株式会社脱炭素化支援機構のリリースでは、この事業を「設備容量約8.2MWh」と記載している。';
const WAKA_NEW =
  `同社が和歌山県和歌山市松江で計画する系統用蓄電所事業に3億円の支援を行うことを決定したと発表した（同日の同社開示: ${IR_1014_3_LINK}）。` +
  WAKA_MARKER +
  `事業者エネルギーパワー自身の${A(KENEP_LIST, '発電所・事業一覧')}（2026年9月13日時点）の記載は「定格出力1,979kW予定 定格容量8,226kWh予定」で、` +
  '両者の表記は一致しない（支援機構の値は概数）。諸元欄は事業者自身の記載を採っている（出力1.979MW・容量8.226MWh）。';

const ROWS: Row[] = [
  {
    label: '■2・■3 和歌山 諸元の確定と本文の出所明示', endpoint: 'projects', slug: 'pr-co140317-bess',
    expect: { outputMw: null, capacityMwh: null }, set: { outputMw: 1.979, capacityMwh: 8.226 },
    replace: { field: 'body', old: WAKA_OLD, new: WAKA_NEW, marker: WAKA_MARKER },
    must: [
      { url: KENEP_LIST, text: '和歌山メガパワー蓄電所 定格出力1,979kW予定 定格容量8,226kWh予定' },
      { url: KENEP_LIST, text: '発電所・事業一覧' },
      { url: IR_0812_3, text: '（５）能力 出力：8,226kWh 容量：1,979kW' },
      { url: IR_0529_1, text: '完成後の増加能力は、出力で1,979kW、蓄電容量で8,226kWhを想定しております。' },
      { url: PR_JICN, text: '株式会社脱炭素化支援機構' },
      { url: PR_JICN, text: '設備容量約8.2MWh' },
    ],
    why: '■2(b) 事業者の発電所・事業一覧（和歌山県の画像・alt）に和歌山の記載があり「定格出力1,979kW予定 定格容量8,226kWh予定」（施設別）。取得開示 ir_20250812-3 も 1,979kW／8,226kWh（ラベルと単位が入れ替わった書式）。1,976 は発行者情報 2025-11-28 版の（注）だけ（同じ定型文を 2026-05-29 版は同構成の南あわじに 1,979 で使う・別の量として書いた一次は無い）。本文の 8.2 は脱炭素化支援機構の記載（概数）として明示',
  },
  {
    label: '■2 朝来（照合のみ）', endpoint: 'projects', slug: 'pr-co109041-hyogo', verifyOnly: true,
    expect: { outputMw: 1.979, capacityMwh: 8.226 }, set: { outputMw: 1.979, capacityMwh: 8.226 },
    must: [
      { url: KENEP_LIST, text: '朝来メガパワー蓄電所 定格出力1,979kW 定格容量8,226kWh' },
      { url: PR154, text: '名称：朝来メガパワー蓄電所' },
      { url: PR154, text: 'PCS出力：1,979kW' },
      { url: IR_1127_2, text: '（５）能力 出力：8,226kWh 容量：1,979kW' },
    ],
    why: '一覧の朝来の行「定格出力1,979kW 定格容量8,226kWh」と現値が一致（書込なし）',
  },
  {
    label: '■2 丹波（照合のみ）', endpoint: 'projects', slug: 'tamba-megapower', verifyOnly: true,
    expect: { outputMw: 1.979, capacityMwh: 8.226 }, set: { outputMw: 1.979, capacityMwh: 8.226 },
    must: [
      { url: KENEP_LIST, text: '丹波メガパワー蓄電所定格出力1,979kW 定格容量8,226kWh' },
      { url: PR154, text: '名称：丹波メガパワー蓄電所' },
    ],
    why: '一覧の丹波の行「定格出力1,979kW 定格容量8,226kWh」と現値が一致（書込なし）',
  },
];

const ep = (e: string) => `https://${DOMAIN}.microcms.io/api/v1/${e}`;
async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const bySlug = async (e: string, slug: string): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${ep(e)}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const squash = (s: string) => s.replace(/[\s　]+/g, '');
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);
const plain = (s: string) => s.replace(/<[^>]+>/g, '');

const cache = new Map<string, string>();
function pdfText(url: string): string {
  const py = [
    'import sys,io,urllib.request,pdfplumber',
    `r=urllib.request.urlopen(urllib.request.Request(sys.argv[1],headers={'User-Agent':${JSON.stringify(UA)}}),timeout=60).read()`,
    "print('\\n'.join((p.extract_text() or '') for p in pdfplumber.open(io.BytesIO(r)).pages))",
  ].join('\n');
  return execFileSync('python', ['-c', py, url], { maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).toString('utf-8');
}
async function primaryText(url: string): Promise<string> {
  if (cache.has(url)) return cache.get(url)!;
  if (/\.pdf($|\?)/i.test(url)) { cache.set(url, squash(pdfText(url))); return cache.get(url)!; }
  let html = '';
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8', 'Accept-Language': 'ja,en;q=0.8' } }).catch(() => null);
  if (r && r.ok) html = await r.text();
  else {
    const out = execFileSync('curl', ['-sL', '-A', UA, '-w', '\n%{http_code}', url], { maxBuffer: 32 * 1024 * 1024 }).toString('utf-8');
    const nl = out.lastIndexOf('\n');
    if (out.slice(nl + 1).trim() !== '200') throw new Error(`GET ${url} → ${r?.status ?? 'fetch失敗'} / curl ${out.slice(nl + 1).trim()}`);
    html = out.slice(0, nl);
  }
  // 画像で掲げた表（EP の発電所・事業一覧）は数値が alt 属性にしか無いため、alt の文字列も照合対象に足す
  const alts = [...html.matchAll(/\balt="([^"]*)"/g)].map((m) => m[1]).join(' ');
  const nd = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  let t = html + ' ' + alts;
  if (nd) { try { t += ' ' + JSON.stringify(JSON.parse(nd[1])); } catch { t += ' ' + nd[1]; } }
  t = t.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\n/g, ' ').replace(/\\"/g, '"')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  cache.set(url, squash(t));
  return cache.get(url)!;
}
async function checkMust(must: Must[]): Promise<string[]> {
  const miss: string[] = [];
  for (const m of must) {
    try { if (!(await primaryText(m.url)).includes(squash(m.text))) miss.push(`「${m.text}」@${m.url}`); }
    catch (e) { miss.push(`取得失敗 ${m.url}: ${(e as Error).message}`); }
  }
  return miss;
}

let done = 0, skipped = 0, failed = 0;
const held: string[] = [];
const changes: string[] = [];

async function runRow(row: Row): Promise<void> {
  console.log(`\n■ ${row.label}  [${row.endpoint}] ${row.slug}`);
  const b = await bySlug(row.endpoint, row.slug);
  if (!b) { console.log('   ★NG 不在'); failed++; return; }
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row.set)) {
    if (norm(b[k]) === norm(v)) { console.log(`   ${k}: ${norm(v)} [同値]`); continue; }
    if (k in row.expect && norm(b[k]) !== norm(row.expect[k])) {
      console.log(`   [見送り] ${k} の現在値 ${norm(b[k])} が承認時 ${norm(row.expect[k])} と違う → この行は書かない`);
      held.push(`${row.slug}.${k}: 現在値不一致`); skipped++; return;
    }
    payload[k] = v;
    console.log(`   ${k}: 前 ${norm(b[k])} → 後 ${norm(v)}`);
  }
  if (row.replace) {
    const rp = row.replace;
    const cur = String(b[rp.field] ?? '');
    const nOld = count(cur, rp.old);
    const applied = count(plain(cur), rp.marker) >= 1;
    if (applied) console.log(`   ${rp.field}: 適用済み（冪等）`);
    else if (nOld !== 1) { console.log(`   [見送り] ${rp.field}: 置換元が ${nOld} 箇所（一意でない）→ 書かない`); held.push(`${row.slug}.${rp.field}: 置換元 ${nOld} 箇所`); skipped++; return; }
    else {
      payload[rp.field] = cur.replace(rp.old, rp.new);
      console.log(`   ${rp.field}: 前「${rp.old}」→ 後「${rp.new}」（${cur.length}→${String(payload[rp.field]).length}字）`);
    }
  }
  if (Object.keys(payload).length === 0) {
    if (row.verifyOnly) {
      const miss = await checkMust(row.must);
      console.log(`   照合のみ: 一次の逐語片 ${row.must.length - miss.length}/${row.must.length}${miss.length ? ` ★不一致: ${miss.join(' ／ ')}` : '（現値＝一次の施設別の記載）'}`);
      if (miss.length) held.push(`${row.slug}: 照合不一致 ${miss.join(' ／ ')}`);
    }
    console.log('   [skip] 変更なし（冪等）'); skipped++; return;
  }
  const miss = await checkMust(row.must);
  console.log(`   一次再確認: 逐語片 ${row.must.length - miss.length}/${row.must.length}`);
  if (miss.length) { console.log(`   [見送り] 逐語が取れない: ${miss.join(' ／ ')}`); held.push(`${row.slug}: ${miss.join(' ／ ')}`); skipped++; return; }
  console.log(`   根拠: ${row.why}`);
  if (DRY) { done++; return; }
  await api('PATCH', `${ep(row.endpoint)}/${b.id}`, payload);
  await sleep(900);
  const a = await bySlug(row.endpoint, row.slug);
  let bad = 0;
  for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {}), ...Object.keys(payload)])) {
    if (SYS.has(k)) continue;
    const rp = row.replace;
    if (rp && k === rp.field && k in payload) {
      const av = String(a?.[k] ?? '');
      const nMark = count(plain(av), rp.marker);
      const oldGone = count(av, rp.old) === 0;
      const ok = nMark === 1 && oldGone;
      const note = `marker ${nMark} 回・置換元の残存=${!oldGone}`;
      if (!ok) { bad++; console.log(`   ✗ ${k}: ${note}`); }
      else console.log(`   ✓ ${k}: ${note}（送信値と全文一致=${av === payload[k]}／richEditor の正規化で false でも失敗としない）`);
      continue;
    }
    const want = k in payload ? payload[k] : b[k];
    if (norm(a?.[k]) !== norm(want)) { bad++; console.log(`   ✗ ${k}: 期待=${norm(want)} 保存=${norm(a?.[k])}`); }
    else if (k in payload) console.log(`   ✓ ${k}: 保存=${norm(a?.[k])}`);
  }
  console.log(`   #106: ${bad === 0 ? `✓ 送信 ${Object.keys(payload).length} field 反映・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  if (bad === 0) { done++; for (const k of Object.keys(payload)) changes.push(`${row.endpoint}/${row.slug}.${k}`); } else failed++;
  await sleep(300);
}

async function main(): Promise<void> {
  const rows = ONLY ? ROWS.filter((r) => r.label.includes(ONLY)) : ROWS;
  console.log(`[friday6 追修便④ PATCH] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / ${rows.length} 行${ONLY ? `（--only=${ONLY}）` : ''}`);
  if (rows.length === 0) { console.error('対象行なし'); process.exit(1); }
  for (const row of rows) await runRow(row);
  console.log(`\n[done] 実行 ${done} / スキップ・見送り ${skipped} / 失敗 ${failed}`);
  if (changes.length) console.log(`  変更 field: ${changes.join(', ')}`);
  held.forEach((h) => console.log('  - ' + h));
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
