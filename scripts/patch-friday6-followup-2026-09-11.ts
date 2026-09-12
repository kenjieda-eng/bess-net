#!/usr/bin/env tsx
/**
 * scripts/patch-friday6-followup-2026-09-11.ts — 金曜#6 追修便の microCMS PATCH（差分限定・件別提示・#106）
 *
 * 対象（依頼 ■8: PATCH を伴うのは ■1(b)/(c)・■6(a)(c)。■6(b) は記事本文の言い回しの是正）:
 *   ■1  朝来・丹波の cod 2025-12-01 の根拠（事業者 IR の逐語）を本文に 1 文で引用
 *   ■6(a) policy-events capacity-additional-auction-2026-03 の出典 URL（404）の差し替え
 *   ■6(b) 公開済み本文の「TMEIC 製」を一次の表記「TMEIC（蓄電池は CATL）」に揃える
 *   ■6(c) 朝来の座標（加西市を指していた）の是正と丹波の座標の設定
 *
 * ★各行: 実行前に slug・field・前値・後値を表示（件別提示）→ 現在値が承認時の expect と違えば書かない →
 *   書込直前に一次の逐語（must）を取り直し、全部あるときだけ PATCH → GET で全 field 照合（#106）。
 *   本文の置換は old がちょうど 1 回だけ現れることを確認し、new あり・old なしで冪等スキップ（#122: richEditor は全文一致で判定しない）。
 * ★DELETE/PUT/POST なし。
 * ★group='hold' の行（■6(b) の本文 5 field・丹波の座標）は本便の PATCH 範囲（■1(b)/(c)・■6(a)(c)）の外のため、
 *   一次の再確認と前値・後値の提示までで止める。承認後に --include-held で書く（exec 行は冪等スキップされる）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-friday6-followup-2026-09-11.ts [--dry-run] [--include-held]
 */
import { execFileSync } from 'node:child_process';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const INCLUDE_HELD = process.argv.includes('--include-held');
/** --only=<語>: label に <語> を含む行だけを対象にする（承認された hold 行だけを書くため・追修便② ■6 で追加） */
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice('--only='.length);
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

type Rec = Record<string, unknown> & { id: string; slug: string };
type Must = { url: string; text: string };
type Row = {
  label: string;
  /** exec=本便で書く／hold=本便の PATCH 範囲外のため提示のみ（--include-held で書く＝承認後） */
  group: 'exec' | 'hold';
  endpoint: 'projects' | 'news' | 'policy-events' | 'explainer';
  slug: string;
  /** 変更する field の承認時の現在値（違えば書かない） */
  expect: Record<string, unknown>;
  /** 変更後の値 */
  set: Record<string, unknown>;
  /**
   * 文字列 field の部分置換（old はちょうど 1 回）。追記型は new ⊃ old になるため、
   * 冪等判定・書込後の照合は「タグを外した本文に marker（素の文言）がちょうど 1 回あるか」で行う（#122）
   */
  replace?: { field: string; old: string; new: string; marker: string };
  must: Must[];
  why: string;
};

// ─────────────────────────────────────────────────────────────
// 一次照合（調査エージェント→反証エージェント→編集部の確認）で確定した行（手で書き換えない）
// ─────────────────────────────────────────────────────────────
const A = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const IR_0414_1 = 'https://kenep.co.jp/pdf/ir_20260414-1.pdf';
const COD_QUOTE = '朝来メガパワー蓄電所及び丹波メガパワー蓄電所は2025年12月から、和歌山メガパワー蓄電所は2026年３月から商業運転を開始しております。';
const COD_ANCHOR = '主に需給調整市場を通じた需給調整力の提供を始めたとしている。';
const COD_SENTENCE = `「${COD_QUOTE}」（出典: ${A(IR_0414_1, 'エネルギーパワー「子会社設立に関するお知らせ」')}, 2026年4月14日）。`;
const COD_MARKER = `「${COD_QUOTE}」（出典: エネルギーパワー「子会社設立に関するお知らせ」, 2026年4月14日）。`;
const PR154 = 'https://prtimes.jp/main/html/rd/p/000000154.000109041.html';
const OCCTO_ADD_2026 = 'https://www.occto.or.jp/news/market-board_market_oshirase_2025_20250428_tsuikaauction_jitsujukyu2026_kaisai.html';
const GSI_FWD = (q: string) => `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`;
const GSI_REV = (lat: number, lon: number) => `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${lat}&lon=${lon}`;
const TMEIC_NEW = '蓄電池システムは TMEIC（蓄電池は CATL）';
const TMEIC_CELL = '蓄電池システム｜TMEIC（蓄電池：CATL）';
const tmeicMust = (url: string): Must[] => [{ url, text: 'TMEIC（蓄電池：CATL）' }, { url, text: '蓄電池システム' }];

const ROWS: Row[] = [
  // ■1(b) 朝来・丹波: cod 2025-12-01 の根拠＝事業者 IR が両施設を名指しで「2025年12月から…商業運転を開始」。本文の該当段落に逐語を 1 文
  ...(['pr-co109041-hyogo', 'tamba-megapower'] as const).map((slug): Row => ({
    label: '■1(b) cod 根拠の逐語を本文に 1 文', group: 'exec', endpoint: 'projects', slug, expect: {}, set: {},
    replace: { field: 'body', old: COD_ANCHOR, new: COD_ANCHOR + COD_SENTENCE, marker: COD_MARKER },
    must: [{ url: IR_0414_1, text: COD_QUOTE }],
    why: `IR（${IR_0414_1} p.1・2026-04-14）が朝来・丹波を名指しで「2025年12月から…商業運転を開始」。同文は中間決算短信 ir_20260414-2.pdf p.11（重要な後発事象）にもある`,
  })),
  // ■6(a) 出典 404 → 対象実需給年度 2026 年度の追加オークション開催告知（OCCTO 現行 URL）
  {
    label: '■6(a) 出典 URL 差し替え（404→現行）', group: 'exec', endpoint: 'policy-events', slug: 'capacity-additional-auction-2026-03',
    expect: { sourceUrl: 'https://www.occto.or.jp/market-board/market/jitsujukyu/' },
    set: { sourceUrl: OCCTO_ADD_2026 },
    must: [{ url: OCCTO_ADD_2026, text: '容量市場2025年度追加オークション（対象実需給年度：2026年度）の実施を決定いたしました。' }],
    why: '旧 URL は 404（Wayback にも捕捉なし）。題名「容量市場追加オークション（2026年度向け）」＝OCCTO「容量市場2025年度追加オークション（対象実需給年度：2026年度）」の開催告知（2025-04-28）',
  },
  // ■6(c) 朝来の座標: 旧値は加西市玉野町（逆ジオ muniCd 28220）。一次の所在地「朝来市和田山町東谷字大谷」を国土地理院で取り直し
  {
    label: '■6(c) 朝来の座標を一次所在地で取り直し', group: 'exec', endpoint: 'projects', slug: 'pr-co109041-hyogo',
    expect: { latitude: 34.914934, longitude: 134.860666 },
    set: { latitude: 35.337765, longitude: 134.850037 },
    must: [
      { url: PR154, text: '所在地：兵庫県朝来市和田山町東谷字大谷' },
      { url: GSI_FWD('兵庫県朝来市和田山町東谷大谷'), text: '"coordinates":[134.850037,35.337765]' },
      { url: GSI_REV(35.337765, 134.850037), text: '"muniCd":"28225"' },
    ],
    why: '国土地理院 住所検索「兵庫県朝来市和田山町東谷大谷」の代表点。逆ジオ muniCd 28225＝朝来市（旧座標は 28220＝加西市）',
  },
  // ── 以下 hold（本便の PATCH 範囲 ■1(b)/(c)・■6(a)(c) の外。提示のみ・承認後に --include-held）
  // ■6(b) 依頼上は「コード修正」だが、表示される「TMEIC 製」は src に無く microCMS の本文 5 field にある
  {
    label: '■6(b) TMEIC 表記を一次の表に揃える', group: 'hold', endpoint: 'news', slug: 'nc-iwami-juden-2026-08', expect: {}, set: {},
    replace: { field: 'body', old: '蓄電池システムは TMEIC 製（蓄電池は CATL 製）、', new: `${TMEIC_NEW}、`, marker: `${TMEIC_NEW}、` },
    must: tmeicMust('https://prtimes.jp/main/html/rd/p/000000103.000161802.html'), why: `一次の施設概要表「${TMEIC_CELL}」（「製」なし）`,
  },
  {
    label: '■6(b) TMEIC 表記を一次の表に揃える', group: 'hold', endpoint: 'news', slug: 'nc-tamana-aono-balancing-entry-2026-08', expect: {}, set: {},
    replace: { field: 'body', old: '蓄電池システムは TMEIC 製（蓄電池は CATL 製）を採用する。', new: `${TMEIC_NEW}を採用する。`, marker: `${TMEIC_NEW}を採用する。` },
    must: tmeicMust('https://prtimes.jp/main/html/rd/p/000000102.000161802.html'), why: `一次の施設概要表「${TMEIC_CELL}」（表のみ・PCS の記述なし）`,
  },
  {
    label: '■6(b) TMEIC 表記を一次の表に揃える', group: 'hold', endpoint: 'news', slug: 'nc-choshi-kasugacho-unten-2026-08', expect: {}, set: {},
    replace: { field: 'body', old: '蓄電池システムはTMEIC製（電池はCATL製）、', new: `${TMEIC_NEW}、`, marker: `${TMEIC_NEW}、` },
    must: tmeicMust('https://prtimes.jp/main/html/rd/p/000000097.000161802.html'), why: `一次の施設概要表「${TMEIC_CELL}」（括弧内は「電池」でなく「蓄電池」）`,
  },
  {
    label: '■6(b) TMEIC 表記を一次の表に揃える', group: 'hold', endpoint: 'projects', slug: 'nc-iwami-bess', expect: {}, set: {},
    replace: { field: 'body', old: '蓄電池システムは TMEIC 製（蓄電池は CATL 製）、', new: `${TMEIC_NEW}、`, marker: `${TMEIC_NEW}、` },
    must: tmeicMust('https://prtimes.jp/main/html/rd/p/000000103.000161802.html'), why: `一次の施設概要表「${TMEIC_CELL}」`,
  },
  {
    label: '■6(b) TMEIC 表記を一次の表に揃える', group: 'hold', endpoint: 'projects', slug: 'nc-choshi-kasugacho-bess', expect: {}, set: {},
    replace: { field: 'body', old: '蓄電池システムはTMEIC製（電池セルはCATL製）、', new: `${TMEIC_NEW}、`, marker: `${TMEIC_NEW}、` },
    must: tmeicMust('https://prtimes.jp/main/html/rd/p/000000097.000161802.html'), why: `一次の施設概要表「${TMEIC_CELL}」（「電池セル」は一次に無い語）`,
  },
  // ■6(c) 丹波: 検算の結果「座標なし」（金曜#6 の新規 12 件は全件座標なしで POST＝設計どおり）。設定は新規データの追加になるため提示のみ
  {
    label: '■6(c) 丹波の座標（検算結果: 未設定）', group: 'hold', endpoint: 'projects', slug: 'tamba-megapower',
    expect: { latitude: null, longitude: null },
    set: { latitude: 35.227734, longitude: 134.98851 },
    must: [
      { url: PR154, text: '所在地：兵庫県丹波市青垣町西芦田字藤渕' },
      { url: GSI_FWD('兵庫県丹波市青垣町西芦田'), text: '"coordinates":[134.98851,35.227734]' },
      { url: GSI_REV(35.227734, 134.98851), text: '"muniCd":"28223"' },
    ],
    why: '国土地理院 住所検索「兵庫県丹波市青垣町西芦田」（字藤渕は未収録のため大字の代表点）。逆ジオ muniCd 28223＝丹波市',
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
  const nd = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  let t = html;
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
  const presentOnly = DRY || (row.group === 'hold' && !INCLUDE_HELD);
  console.log(`\n■ ${row.label}  [${row.endpoint}] ${row.slug}${row.group === 'hold' ? '  〔hold: 本便の PATCH 範囲外・提示のみ〕' : ''}`);
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
    const { field, old, marker } = row.replace;
    const cur = String(b[field] ?? '');
    const nOld = count(cur, old), nMark = count(plain(cur), marker);
    if (nMark >= 1) console.log(`   ${field}: marker あり＝適用済み（冪等）`);
    else if (nOld !== 1) { console.log(`   [見送り] ${field}: 置換元が ${nOld} 箇所（一意でない）→ 書かない`); held.push(`${row.slug}.${field}: 置換元 ${nOld} 箇所`); skipped++; return; }
    else {
      payload[field] = cur.replace(old, row.replace.new);
      console.log(`   ${field}: 前「${old}」→ 後「${row.replace.new}」（${cur.length}→${String(payload[field]).length}字）`);
    }
  }
  if (Object.keys(payload).length === 0) { console.log('   [skip] 変更なし（冪等）'); skipped++; return; }
  const miss = await checkMust(row.must);
  console.log(`   一次再確認: 逐語片 ${row.must.length - miss.length}/${row.must.length}`);
  if (miss.length) { console.log(`   [見送り] 逐語が取れない: ${miss.join(' ／ ')}`); held.push(`${row.slug}: ${miss.join(' ／ ')}`); skipped++; return; }
  console.log(`   根拠: ${row.why}`);
  if (presentOnly) {
    if (row.group === 'hold' && !DRY) held.push(`${row.endpoint}/${row.slug}: hold（承認後に --include-held）`);
    done += DRY ? 1 : 0; skipped += DRY ? 0 : 1; return;
  }
  await api('PATCH', `${ep(row.endpoint)}/${b.id}`, payload);
  await sleep(900);
  const a = await bySlug(row.endpoint, row.slug);
  let bad = 0;
  for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {}), ...Object.keys(payload)])) {
    if (SYS.has(k)) continue;
    if (row.replace && k === row.replace.field && k in payload) {
      const av = String(a?.[k] ?? '');
      const nMark = count(plain(av), row.replace.marker);
      const oldGone = row.replace.new.includes(row.replace.old) || count(av, row.replace.old) === 0;
      if (nMark !== 1 || !oldGone) { bad++; console.log(`   ✗ ${k}: marker ${nMark} 回（1 回が正）／置換元の残存=${!oldGone}`); }
      else console.log(`   ✓ ${k}: marker 1 回・置換元なし（送信値と全文一致=${av === payload[k]}／richEditor の正規化で false でも失敗としない）`);
      continue;
    }
    const want = k in payload ? payload[k] : b[k];
    if (norm(a?.[k]) !== norm(want)) { bad++; console.log(`   ✗ ${k}: 期待=${norm(want)} 保存=${norm(a?.[k])}`); }
  }
  console.log(`   #106: ${bad === 0 ? `✓ 送信 ${Object.keys(payload).length} field 反映・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  if (bad === 0) { done++; for (const k of Object.keys(payload)) changes.push(`${row.endpoint}/${row.slug}.${k}`); } else failed++;
  await sleep(300);
}

async function main(): Promise<void> {
  const rows = ONLY ? ROWS.filter((r) => r.label.includes(ONLY)) : ROWS;
  const nHold = rows.filter((r) => r.group === 'hold').length;
  console.log(`[friday6 追修便 PATCH] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / ${rows.length} 行${ONLY ? `（--only=${ONLY}）` : ''}（exec ${rows.length - nHold}・hold ${nHold}${INCLUDE_HELD ? '＝書く' : '＝提示のみ'}）`);
  if (rows.length === 0) { console.error('対象行なし'); process.exit(1); }
  for (const row of rows) await runRow(row);
  console.log(`\n[done] 実行 ${done} / スキップ・見送り ${skipped} / 失敗 ${failed}`);
  if (changes.length) console.log(`  変更 field: ${changes.join(', ')}`);
  held.forEach((h) => console.log('  - ' + h));
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
