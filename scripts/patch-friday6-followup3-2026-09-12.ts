#!/usr/bin/env tsx
/**
 * scripts/patch-friday6-followup3-2026-09-12.ts — 金曜#6 追修便③の microCMS PATCH（差分限定・件別提示・#106）
 *
 * 対象:
 *   ■1  news/pr-2025-06-09-co156400-2: オンラインカジノ化した ict2025.jp へのリンクだけを解除（学会名の文言は残す・URL 平文も残さない）
 *       ★リンク先は開かない（依頼どおり。must に入れない）
 *   ■2  和歌山 pr-co140317-bess: 出典ブロックの「企業公式サイト」を事業者（エネルギーパワー）の公式サイトへ／capacityMwh 8.2 を保留（null）
 *   ■3  adw-kagoshima-bess: 8/6 決算説明資料の「2026年12月」が 2/12 資料の再掲であることを 1 文で明示
 *   ■4  adw-imari-bess: 最新の一次（8/31 付・年精度「2028年稼働予定」）に合わせ cod null・sourceUrl を 8/31 へ・本文を時点明示（鹿児島と同じ形）
 *   ■5  tamba-megapower: 座標（9/12 朝に承認済み）。逆ジオが一次所在地の町名（青垣町西芦田）まで一致することを確認してから
 *   ■6  glossary/capacity-contribution.detail: 301 元を固定で参照している本文リンクを 301 の宛先へ付け替え
 *
 * ★各行: 実行前に slug・field・前値・後値を表示（件別提示）→ 現在値が承認時の expect と違えば書かない →
 *   書込直前に一次の逐語（must）を取り直し、全部あるときだけ PATCH → GET で全 field 照合（#106）。
 *   本文の置換は old がちょうど 1 回だけ現れることを確認。冪等判定は mode で分ける（#122）:
 *     marker   … タグを外した本文に marker（素の文言）があれば適用済み（追記・書き換え）
 *     oldAbsent … old（元のリンク）が無く after があれば適用済み（リンク解除・href 付け替え＝素の文言が前後で同じもの）
 * ★DELETE/PUT/POST なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-friday6-followup3-2026-09-12.ts [--dry-run] [--only=<label の語>]
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
type Replace =
  | { mode?: 'marker'; field: string; old: string; new: string; marker: string }
  | { mode: 'oldAbsent'; field: string; old: string; new: string; after: string; forbid?: string };
type Row = {
  label: string;
  endpoint: 'projects' | 'news' | 'policy-events' | 'explainer' | 'glossary';
  slug: string;
  /** 変更する field の承認時の現在値（違えば書かない） */
  expect: Record<string, unknown>;
  /** 変更後の値 */
  set: Record<string, unknown>;
  replace?: Replace;
  must: Must[];
  why: string;
};

// ─────────────────────────────────────────────────────────────
// 一次照合で確定した行（手で書き換えない）
// ─────────────────────────────────────────────────────────────
const A = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const IR_0414_1 = 'https://kenep.co.jp/pdf/ir_20260414-1.pdf';
const IR_1128_4 = 'https://kenep.co.jp/pdf/ir_20251128-4.pdf';
const KENEP_TOP = 'https://kenep.co.jp/';
const PR_JICN = 'https://prtimes.jp/main/html/rd/p/000000034.000140317.html';
const PR077 = 'https://prtimes.jp/main/html/rd/p/000000077.000160356.html';
const PR154 = 'https://prtimes.jp/main/html/rd/p/000000154.000109041.html';
const ADWG_0624 = 'https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf';
const ADWG_0806 = 'https://contents.xj-storage.jp/xcontents/32500/599513f5/3101/42ab/a276/cecaa9963f9d/140120260806512121.pdf';
const ADWG_0831 = 'https://contents.xj-storage.jp/xcontents/32500/4e70bc3a/61ad/4235/9598/07d55a68f006/140120260831528488.pdf';
const GSI_FWD = (q: string) => `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`;
const GSI_REV = (lat: number, lon: number) => `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${lat}&lon=${lon}`;
const T_0624 = 'エー・ディー・ワークス、系統用蓄電所事業拡大に向け、愛知県東浦町にて第９号開発用地を取得';
const T_0831 = 'エー・ディー・ワークスの系統用蓄電所事業、第２号「ADW熊本益城町蓄電所」が竣工・稼働開始';
const T_PR077 = 'エー・ディー・ワークス、系統用蓄電所事業拡大に向け 第７号・第８号開発用地の取得契約を締結';

// ■1 ict2025.jp（カジノ化）: リンクだけ外す
const ICT_TEXT = 'The 41st International and 7th Asian Conference on Thermo-electronics (ICT/ACT 2025)';
const ICT_OLD = `<a href="https://ict2025.jp/" target="_blank" rel="noopener noreferrer nofollow">${ICT_TEXT}</a>`;

// ■2(b) 和歌山: 出典ブロックの「企業公式サイト」が別会社（JICN）のトップ → 事業者エネルギーパワーの公式サイト
const WAKA_SITE_OLD = '<li>企業公式サイト: <a href="https://www.jicn.co.jp/" target="_blank" rel="noopener noreferrer">https://www.jicn.co.jp/</a></li>';
const WAKA_SITE_NEW = `<li>企業公式サイト: ${A(KENEP_TOP, KENEP_TOP)}</li>`;

// ■3 鹿児島: 既存の節「同資料の該当部分は「…引用」で」を、再掲であることを明示する 1 文に置き換える（重複させない）
const KAGO_OLD = 'とあるが、同資料の該当部分は「2026年2月12日公表資料 引用」で、後の8月31日付資料と食い違う。';
const KAGO_NEW =
  'とあるが、後の8月31日付資料と食い違う。なお 2026年8月6日付の決算説明資料に残る 2026年12月 の記載は、同年2月12日付資料の再掲である' +
  '（同資料 p.25「企業価値向上に向けた成長戦略 （2026年2月12日公表資料 引用）」）。';
const KAGO_MARKER = 'なお 2026年8月6日付の決算説明資料に残る 2026年12月 の記載は、同年2月12日付資料の再掲である';

// ■4 伊万里（7号）: 6/22 発表（2027年5月予定）→ 6/24 資料（2027年稼働予定）→ 最新 8/31 資料（2028年稼働予定）を順に示す
const IMARI_OLD =
  '同社は2026年6月22日、第７号（佐賀県伊万里市）となる系統用蓄電所開発用地の取得契約を締結したと発表した。' +
  '出力は約2MW、容量は約8MWh（一次の表記は「約２MW／約８MWh」で、いずれも概数）、稼働開始時期は2027年5月（予定・月精度）。' +
  '発表では、今後、各用地における蓄電所の開発工事及び系統接続手続きを経て稼働開始を予定するとし、稼働開始時期は工事進捗、系統接続手続きその他の状況により変動する可能性があるとしている。' +
  '取得契約は系統連系に係る工事等諸条件の確定を停止条件としている。' +
  `親会社ADワークスグループの2026年6月24日付資料（${A(ADWG_0624, '５．蓄電所保有状況／用地取得状況')}）ではステータスを「用地取得契約締結」としている。`;
const IMARI_NEW =
  `同社は2026年6月22日、第７号（佐賀県伊万里市）となる系統用蓄電所開発用地の取得契約を締結したと発表した（${A(PR077, `${T_PR077}（2026年6月22日）`)}）。` +
  '出力は約2MW、容量は約8MWh（一次の表記は「約２MW／約８MWh」で、いずれも概数）、稼働開始時期は2027年5月（予定・月精度）としていた。' +
  '発表では、今後、各用地における蓄電所の開発工事及び系統接続手続きを経て稼働開始を予定するとし、稼働開始時期は工事進捗、系統接続手続きその他の状況により変動する可能性があるとしている。' +
  '取得契約は系統連系に係る工事等諸条件の確定を停止条件としている。' +
  `親会社ADワークスグループの2026年6月24日付資料（${A(ADWG_0624, `${T_0624}（2026年6月24日）`)}）の「５．蓄電所保有状況／用地取得状況」では「7号」として掲載され、` +
  'ステータスは「用地取得契約締結」、稼働時期は「2027年稼働予定」と記載されていた。' +
  `最新の2026年8月31日付資料（${A(ADWG_0831, `${T_0831}（2026年8月31日）`)}）の同じ表では、「7号」のステータスは「稼働準備中」、稼働時期は「2028年稼働予定」と記載されている（年までの表記）。`;
const IMARI_MARKER = `最新の2026年8月31日付資料（${T_0831}（2026年8月31日））の同じ表では、「7号」のステータスは「稼働準備中」、稼働時期は「2028年稼働予定」`;

// ■6 glossary/capacity-contribution: 本文の固定リンクが 301 元（capacity-procurement-contract-amount → capacity-contract-payment）
const CAP_OLD = '<a href="/glossary/capacity-procurement-contract-amount">容量確保契約（容量確保契約金額）</a>';
const CAP_NEW = '<a href="/glossary/capacity-contract-payment">容量確保契約（容量確保契約金額）</a>';

const ROWS: Row[] = [
  {
    label: '■1 カジノ化ドメインのリンク解除', endpoint: 'news', slug: 'pr-2025-06-09-co156400-2', expect: {}, set: {},
    replace: { mode: 'oldAbsent', field: 'body', old: ICT_OLD, new: ICT_TEXT, after: ICT_TEXT, forbid: 'ict2025' },
    must: [],
    why: 'ict2025.jp はオンラインカジノ誘導サイトに変質（■1(c) の判定・反証済み。依頼どおり開かない）。学会名の文言は残し、リンクと URL を本文から外す（全件 grep で参照はこの 1 件のみ）',
  },
  {
    label: '■2(b) 和歌山 企業公式サイト', endpoint: 'projects', slug: 'pr-co140317-bess', expect: {}, set: {},
    replace: { field: 'body', old: WAKA_SITE_OLD, new: WAKA_SITE_NEW, marker: '企業公式サイト: https://kenep.co.jp/' },
    must: [
      { url: IR_0414_1, text: 'URL https://kenep.co.jp/' },
      { url: KENEP_TOP, text: 'エネルギーパワー株式会社' },
    ],
    why: '事業者はエネルギーパワー株式会社。同社の開示（ir_20260414-1 ほか各 IR の表紙）の URL 欄は https://kenep.co.jp/、同サイトの題名も「エネルギーパワー株式会社」。jicn.co.jp は支援機構（別会社）のサイト',
  },
  {
    label: '■2(c) 和歌山 容量を保留', endpoint: 'projects', slug: 'pr-co140317-bess',
    expect: { capacityMwh: 8.2 }, set: { capacityMwh: null },
    must: [
      { url: PR_JICN, text: '設備容量約8.2MWh' },
      { url: IR_1128_4, text: '出力で1,976kW、蓄電容量で8,226kWh' },
    ],
    why: '8.2 は JICN の PR TIMES の概数「設備容量約8.2MWh」（対になる出力はスキーム図の「1.9MW」＝不採用）で、出力を保留した不確かな出所と同じ。事業者の一次は 8,226kWh だが、同じ一次の出力が 1,976kW／1,979kW で食い違うため、対の諸元が確定するまで容量も保留',
  },
  {
    label: '■3 鹿児島 再掲の明示', endpoint: 'projects', slug: 'adw-kagoshima-bess', expect: {}, set: {},
    replace: { field: 'body', old: KAGO_OLD, new: KAGO_NEW, marker: KAGO_MARKER },
    must: [
      { url: ADWG_0806, text: '2026年2月12日公表資料 引用' },
      { url: ADWG_0806, text: '企業価値向上に向けた成長戦略' },
      { url: ADWG_0806, text: '第３号拠点' },
      { url: ADWG_0806, text: '2026年12月稼働開始予定' },
    ],
    why: '8/6 決算説明資料 p.25 は「企業価値向上に向けた成長戦略 （2026年2月12日公表資料 引用）」の扉で、p.46 の「第３号拠点 … 2026年12月稼働開始予定」はその引用区間（2/12 原本 p.21 と図の座標まで一致）',
  },
  {
    label: '■4 伊万里 最新の一次に合わせる', endpoint: 'projects', slug: 'adw-imari-bess',
    expect: { cod: '2027-05-01', sourceUrl: PR077 }, set: { cod: null, sourceUrl: ADWG_0831 },
    replace: { field: 'body', old: IMARI_OLD, new: IMARI_NEW, marker: IMARI_MARKER },
    must: [
      { url: PR077, text: T_PR077 },
      { url: PR077, text: '2027年５月（予定）' },
      { url: ADWG_0624, text: T_0624 },
      { url: ADWG_0624, text: '用地取得契約締結' },
      { url: ADWG_0831, text: T_0831 },
      { url: ADWG_0831, text: '〈更新〉2026年8月31日付' },
      { url: ADWG_0831, text: '佐賀県伊万里市' },
      { url: ADWG_0831, text: '稼働準備中' },
      { url: ADWG_0831, text: '（2028年稼働予定）' },
    ],
    why: '最新の一次 2026-08-31 付 ADWG 資料 p.9「7号 佐賀県伊万里市 約2MW／約8MWh 稼働準備中 （2028年稼働予定）」（年精度・pdftotext -raw と語座標で行の帰属を確定）。6/22 発表の「2027年５月（予定）」と食い違うため、鹿児島と同じく cod は null・sourceUrl を最新の一次へ・本文で時系列を示す',
  },
  {
    label: '■5 丹波の座標', endpoint: 'projects', slug: 'tamba-megapower',
    expect: { latitude: null, longitude: null }, set: { latitude: 35.227734, longitude: 134.98851 },
    must: [
      { url: PR154, text: '所在地：兵庫県丹波市青垣町西芦田字藤渕' },
      { url: GSI_FWD('兵庫県丹波市青垣町西芦田'), text: '"coordinates":[134.98851,35.227734]' },
      { url: GSI_REV(35.227734, 134.98851), text: '"muniCd":"28223"' },
      { url: GSI_REV(35.227734, 134.98851), text: '"lv01Nm":"青垣町西芦田"' },
    ],
    why: '一次所在地「兵庫県丹波市青垣町西芦田字藤渕」→ 国土地理院 住所検索（字藤渕は未収録のため大字の代表点）。逆ジオは muniCd 28223（丹波市）・町名「青垣町西芦田」まで一致',
  },
  {
    label: '■6 固定参照の付け替え（用語本文）', endpoint: 'glossary', slug: 'capacity-contribution', expect: {}, set: {},
    replace: { mode: 'oldAbsent', field: 'detail', old: CAP_OLD, new: CAP_NEW, after: 'href="/glossary/capacity-contract-payment"', forbid: 'capacity-procurement-contract-amount' },
    must: [{ url: 'https://bess-net.jp/glossary/capacity-contract-payment', text: '容量確保契約金額（kW価値）' }],
    why: 'src/lib/glossary-301.ts で /glossary/capacity-procurement-contract-amount → /glossary/capacity-contract-payment。人が書いた本文の固定リンクなので宛先へ付け替える（表示語は不変）',
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
    const applied = rp.mode === 'oldAbsent' ? nOld === 0 && cur.includes(rp.after) : count(plain(cur), rp.marker) >= 1;
    if (applied) console.log(`   ${rp.field}: 適用済み（冪等）`);
    else if (nOld !== 1) { console.log(`   [見送り] ${rp.field}: 置換元が ${nOld} 箇所（一意でない）→ 書かない`); held.push(`${row.slug}.${rp.field}: 置換元 ${nOld} 箇所`); skipped++; return; }
    else {
      payload[rp.field] = cur.replace(rp.old, rp.new);
      console.log(`   ${rp.field}: 前「${rp.old}」→ 後「${rp.new}」（${cur.length}→${String(payload[rp.field]).length}字）`);
    }
  }
  if (Object.keys(payload).length === 0) { console.log('   [skip] 変更なし（冪等）'); skipped++; return; }
  const miss = await checkMust(row.must);
  console.log(`   一次再確認: 逐語片 ${row.must.length - miss.length}/${row.must.length}${row.must.length === 0 ? '（リンク先は開かない行）' : ''}`);
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
      let ok: boolean; let note: string;
      if (rp.mode === 'oldAbsent') {
        ok = count(av, rp.old) === 0 && av.includes(rp.after) && (!rp.forbid || !av.includes(rp.forbid));
        note = `置換元なし・${JSON.stringify(rp.after).slice(0, 60)} あり${rp.forbid ? `・「${rp.forbid}」0 件` : ''}`;
      } else {
        const nMark = count(plain(av), rp.marker);
        const oldGone = rp.new.includes(rp.old) || count(av, rp.old) === 0;
        ok = nMark === 1 && oldGone;
        note = `marker ${nMark} 回・置換元の残存=${!oldGone}`;
      }
      if (!ok) { bad++; console.log(`   ✗ ${k}: ${note}`); }
      else console.log(`   ✓ ${k}: ${note}（送信値と全文一致=${av === payload[k]}／richEditor の正規化で false でも失敗としない）`);
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
  console.log(`[friday6 追修便③ PATCH] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / ${rows.length} 行${ONLY ? `（--only=${ONLY}）` : ''}`);
  if (rows.length === 0) { console.error('対象行なし'); process.exit(1); }
  for (const row of rows) await runRow(row);
  console.log(`\n[done] 実行 ${done} / スキップ・見送り ${skipped} / 失敗 ${failed}`);
  if (changes.length) console.log(`  変更 field: ${changes.join(', ')}`);
  held.forEach((h) => console.log('  - ' + h));
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
