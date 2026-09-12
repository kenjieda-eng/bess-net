#!/usr/bin/env tsx
/**
 * scripts/patch-friday6-followup2-2026-09-12.ts — 金曜#6 追修便②の microCMS PATCH（差分限定・件別提示・#106）
 *
 * 対象（依頼 ■1〜■5。■6 の TMEIC 5 件は patch-friday6-followup-2026-09-11.ts --include-held --only=TMEIC で実行済み）:
 *   ■2  和歌山メガパワー蓄電所（pr-co140317-bess）: 同定が一次で確定した場合のみ status・cod・name・body に逐語 1 文
 *   ■3  朝来（pr-co109041-hyogo）marketParticipation に「需給調整市場」（丹波と同値）
 *   ■4  ADW 鹿児島（adw-kagoshima-bess）: 最新の一次に合わせる。依頼は「最新＝8/6 決算説明資料 p.46（2026年12月）」の前提だったが、
 *       p.46 は「2026年2月12日公表資料 引用」の頁で、より新しい一次は 2026-08-31 付資料 p.9（3号「稼働準備中」「2027年稼働予定」）。
 *       恒久ルール（最新の一次を採る）に従い cod は null のまま（年精度）、sourceUrl を 8/31 資料へ、body を時点明示で是正
 *   ■5  capacity-additional-auction-2026-03: 同定＝対象実需給年度2026年度（反証も支持）→ eventDate を応札期間の開始日へ
 *
 * ★各行: 実行前に slug・field・前値・後値を表示（件別提示）→ 現在値が承認時の expect と違えば書かない →
 *   書込直前に一次の逐語（must）を取り直し、全部あるときだけ PATCH → GET で全 field 照合（#106）。
 *   本文の置換は old がちょうど 1 回だけ現れることを確認。冪等判定・書込後の照合はタグを外した本文の marker で行う（#122）。
 * ★DELETE/PUT/POST なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-friday6-followup2-2026-09-12.ts [--dry-run] [--only=<label の語>]
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
type Row = {
  label: string;
  endpoint: 'projects' | 'news' | 'policy-events' | 'explainer';
  slug: string;
  /** 変更する field の承認時の現在値（違えば書かない） */
  expect: Record<string, unknown>;
  /** 変更後の値 */
  set: Record<string, unknown>;
  /** 文字列 field の部分置換（old はちょうど 1 回）。冪等判定・照合はタグを外した本文の marker（#122） */
  replace?: { field: string; old: string; new: string; marker: string };
  must: Must[];
  why: string;
};

// ─────────────────────────────────────────────────────────────
// 一次照合（調査エージェント→反証エージェント→編集部の確認）で確定した行（手で書き換えない）
// ─────────────────────────────────────────────────────────────
const A = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const IR_0414_1 = 'https://kenep.co.jp/pdf/ir_20260414-1.pdf';
const IR_0414_2 = 'https://kenep.co.jp/pdf/ir_20260414-2.pdf';
const IR_0812_3 = 'https://kenep.co.jp/pdf/ir_20250812-3.pdf';
const IR_1014_3 = 'https://kenep.co.jp/pdf/ir_20251014-3.pdf';
const PR_JICN = 'https://prtimes.jp/main/html/rd/p/000000034.000140317.html';
const COD_QUOTE = '朝来メガパワー蓄電所及び丹波メガパワー蓄電所は2025年12月から、和歌山メガパワー蓄電所は2026年３月から商業運転を開始しております。';
const PR036 = 'https://prtimes.jp/main/html/rd/p/000000036.000160356.html';
const ADWG_0624 = 'https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf';
const ADWG_0806 = 'https://contents.xj-storage.jp/xcontents/32500/599513f5/3101/42ab/a276/cecaa9963f9d/140120260806512121.pdf';
const ADWG_0831 = 'https://contents.xj-storage.jp/xcontents/32500/4e70bc3a/61ad/4235/9598/07d55a68f006/140120260831528488.pdf';
const OCCTO_ADD_2026 = 'https://www.occto.or.jp/news/market-board_market_oshirase_2025_20250428_tsuikaauction_jitsujukyu2026_kaisai.html';

// ■2 和歌山: 既存 body は取込器テンプレ（「プロジェクト概要」見出し＋「発表企業：」）で、第1段落は表示時に field から再生成される
//   （src/lib/projects-body.ts）。そのため第1段落に 1 文を足しても表示されず、cod を入れると「ステータス：稼働中（発表日：2026-03-01）」と
//   運転開始日を発表日として誤表示する。朝来（金曜#6）と同じく、第1段落だけを一次に基づく文へ置き換える（出典ブロック以下は不変）。
const WAKA_OLD_P = '<p><strong>株式会社脱炭素化支援機構がエネルギーパワー株式会社の開発する系統用蓄電所</strong>は、に立地する系統用蓄電所。発表企業：脱炭素化支援機構。ステータス：計画中（発表日：2025-10-14）。</p>';
const WAKA_NEW_P =
  '<p><strong>和歌山メガパワー蓄電所</strong>は、エネルギーパワー株式会社が和歌山県和歌山市松江字仁嶋に整備・保有する系統用蓄電所。' +
  `同社は2025年8月12日に取得を決議したと開示し（${A(IR_0812_3, '固定資産の取得及び資金の借入に関するお知らせ（2025年8月12日）')}）、` +
  '2025年10月14日には株式会社脱炭素化支援機構が、同社が和歌山県和歌山市松江で計画する設備容量約8.2MWhの系統用蓄電所事業に3億円の支援を行うことを決定したと発表した' +
  `（同日の同社開示: ${A(IR_1014_3, '（開示事項の経過）資金借入に関するお知らせ（2025年10月14日）')}）。` +
  `「${COD_QUOTE}」（出典: ${A(IR_0414_1, 'エネルギーパワー「子会社設立に関するお知らせ」')}, 2026年4月14日）。` +
  '運転開始日は月精度（2026年3月）で、日付は開示資料に記載がない。</p>';
const WAKA_MARKER = '和歌山メガパワー蓄電所は2026年３月から商業運転を開始しております。」（出典: エネルギーパワー「子会社設立に関するお知らせ」, 2026年4月14日）。運転開始日は月精度（2026年3月）で';

// ■4 鹿児島: 6/24 付資料の段落を時点明示で是正（最新＝8/31 付資料）。8/6 決算説明資料 p.46 は「2026年2月12日公表資料 引用」の頁で食い違いとして残す（#123）。
//   sourceUrl を 8/31 資料へ移すため、2025-12-23 の発表（PR036）へのリンクを本文に残す。表示名は各資料の表題（■1(c) の表示名と href の一致）
const KAGO_OLD =
  '同社は2025年12月23日、鹿児島県鹿児島市において同社で「三拠点目」となる系統用蓄電所開発用地（6,756㎡）を取得したと発表し、同用地は「2026年12月に第三拠点として稼働開始を予定」としていた。' +
  `その後、親会社の株式会社ADワークスグループが2026年6月24日付で公表した資料（${A(ADWG_0624, '５．蓄電所保有状況／用地取得状況')}）では「3号」として掲載され、` +
  '出力／容量は約2MW／約8MWh（いずれも概数）、ステータスは「工事中」、稼働時期は「2027年稼働予定」と記載されている（年までの表記）。';
const KAGO_NEW =
  '同社は2025年12月23日、鹿児島県鹿児島市において同社で「三拠点目」となる系統用蓄電所開発用地（6,756㎡）を取得したと発表し' +
  `（${A(PR036, 'エー・ディー・ワークス 系統用蓄電所事業拡大に向け 鹿児島県鹿児島市で、三拠点目の用地を取得（2025年12月23日）')}）、同用地は「2026年12月に第三拠点として稼働開始を予定」としていた。` +
  `その後、親会社の株式会社ADワークスグループが2026年6月24日付で公表した資料（${A(ADWG_0624, 'エー・ディー・ワークス、系統用蓄電所事業拡大に向け、愛知県東浦町にて第９号開発用地を取得（2026年6月24日）')}）の` +
  '「５．蓄電所保有状況／用地取得状況」では「3号」として掲載され、出力／容量は約2MW／約8MWh（いずれも概数）、ステータスは「工事中」、稼働時期は「2027年稼働予定」と記載されていた。' +
  `最新の2026年8月31日付資料（${A(ADWG_0831, 'エー・ディー・ワークスの系統用蓄電所事業、第２号「ADW熊本益城町蓄電所」が竣工・稼働開始（2026年8月31日）')}）の同じ表では、` +
  '「3号」のステータスは「稼働準備中」、稼働時期は「2027年稼働予定」と記載されている（年までの表記）。' +
  `一方、同グループの2026年8月6日付「2026年12月期 第2四半期決算説明資料」（${A(ADWG_0806, '2026年12月期 第2四半期決算説明資料（2026年8月6日）')}）には` +
  '「第３号拠点 鹿児島県鹿児島市にて 2026年12月稼働開始予定」とあるが、同資料の該当部分は「2026年2月12日公表資料 引用」で、後の8月31日付資料と食い違う。';
const KAGO_MARKER = '最新の2026年8月31日付資料（エー・ディー・ワークスの系統用蓄電所事業、第２号「ADW熊本益城町蓄電所」が竣工・稼働開始（2026年8月31日））の同じ表では、「3号」のステータスは「稼働準備中」';

const ROWS: Row[] = [
  // ■2 和歌山メガパワー蓄電所（pr-co140317-bess）: 同定は一次で確定（反証も支持）
  {
    label: '■2 和歌山メガパワー蓄電所（同定確定）', endpoint: 'projects', slug: 'pr-co140317-bess',
    expect: { name: '和歌山県和歌山市松江蓄電所', status: ['計画中'], cod: null },
    set: { name: '和歌山メガパワー蓄電所', status: ['稼働中'], cod: '2026-03-01' },
    replace: { field: 'body', old: WAKA_OLD_P, new: WAKA_NEW_P, marker: WAKA_MARKER },
    must: [
      { url: IR_0414_1, text: COD_QUOTE },
      { url: IR_0812_3, text: '固定資産の取得及び資金の借入に関するお知らせ' },
      { url: IR_0812_3, text: '和歌山メガパワー蓄電所' },
      { url: IR_0812_3, text: '和歌山県和歌山市松江字仁嶋' },
      { url: IR_1014_3, text: '（開示事項の経過）資金借入に関するお知らせ' },
      { url: IR_1014_3, text: '和歌山メガパワー蓄電所の建設のための支援（資金借入）を受けることを決定しました' },
      { url: PR_JICN, text: '和歌山県和歌山市松江に設備容量約8.2MWhの系統用蓄電所を建設・運営する事業を計画しています。' },
      { url: PR_JICN, text: '3億円の支援を行うことを決定しました' },
    ],
    why: '同定: JICN の PR TIMES（2025-10-14・sourceUrl）と同日の EP 開示 ir_20251014-3 が、JICN の 300 百万円を「和歌山メガパワー蓄電所の建設のための支援」と明記。所在地（和歌山市松江）・事業者・融資元も一致し、EP の和歌山市の蓄電所はこの 1 基のみ。status・cod は ir_20260414-1 の「2026年３月から商業運転を開始」',
  },

  // ■3 朝来 marketParticipation: 中間決算短信 p.4（印刷 -2-）が両施設を名指しで「主に需給調整市場を通じた需給調整力の提供」。
  //   本文には既に同趣旨の文と ir_20260414-2.pdf への出典リンクがあるので追記しない。選択肢「需給調整市場」は丹波で実在（#106）。
  {
    label: '■3 朝来 marketParticipation', endpoint: 'projects', slug: 'pr-co109041-hyogo',
    expect: { marketParticipation: [] },
    set: { marketParticipation: ['需給調整市場'] },
    must: [{ url: IR_0414_2, text: '当中間会計期間から朝来メガパワー蓄電所及び丹波メガパワー蓄電所が商業運転を開始し、主に需給調整市場を通じた需給調整力の提供を始めました。' }],
    why: '中間決算短信 PDF p.4（印刷 -2-）が朝来・丹波を名指しで「主に需給調整市場を通じた需給調整力の提供を始めました」。丹波は既に [需給調整市場]',
  },
  // ■4 ADW 鹿児島: cod は null のまま（最新の一次は「2027年稼働予定」＝年精度）。sourceUrl を最新の一次へ、本文を時点明示で是正
  {
    label: '■4 ADW 鹿児島（最新の一次＝8/31 資料）', endpoint: 'projects', slug: 'adw-kagoshima-bess',
    expect: { sourceUrl: PR036 },
    set: { sourceUrl: ADWG_0831 },
    replace: { field: 'body', old: KAGO_OLD, new: KAGO_NEW, marker: KAGO_MARKER },
    must: [
      { url: ADWG_0831, text: 'エー・ディー・ワークスの系統用蓄電所事業、第２号「ADW熊本益城町蓄電所」が竣工・稼働開始' },
      { url: ADWG_0831, text: '〈更新〉2026年8月31日付' },
      { url: ADWG_0831, text: '鹿児島県鹿児島市' },
      { url: ADWG_0831, text: '稼働準備中' },
      { url: ADWG_0831, text: '（2027年稼働予定）' },
      { url: ADWG_0624, text: 'エー・ディー・ワークス、系統用蓄電所事業拡大に向け、愛知県東浦町にて第９号開発用地を取得' },
      { url: ADWG_0624, text: '５．蓄電所保有状況／用地取得状況' },
      { url: ADWG_0806, text: '2026年12月期 第2四半期 決算説明資料' },
      { url: ADWG_0806, text: '第３号拠点' },
      { url: ADWG_0806, text: '2026年12月稼働開始予定' },
      { url: ADWG_0806, text: '2026年2月12日公表資料 引用' },
      { url: PR036, text: 'エー・ディー・ワークス 系統用蓄電所事業拡大に向け 鹿児島県鹿児島市で、三拠点目の用地を取得' },
      { url: PR036, text: '2026年12月に第三拠点として稼働開始を予定' },
    ],
    why: '最新の一次は 2026-08-31 付 ADWG 資料 p.9（〈更新〉2026年8月31日付・3号「稼働準備中」「（2027年稼働予定）」。帰属は語座標と pdftotext -raw で確定）。8/6 決算説明資料 p.46 の「2026年12月」は p.25「（2026年2月12日公表資料 引用）」配下の再掲',
  },
  // ■5 追加オークション: 同定＝容量市場2025年度追加オークション（対象実需給年度：2026年度）。eventType「オークション」＝応札期間（同バッチ姉妹の規則）
  {
    label: '■5 追加オークション eventDate（応札期間の開始）', endpoint: 'policy-events', slug: 'capacity-additional-auction-2026-03',
    expect: { eventDate: '2026-03-15T00:00:00.000Z' },
    set: { eventDate: '2025-06-04T00:00:00.000Z' },
    must: [
      { url: OCCTO_ADD_2026, text: '容量市場2025年度追加オークション（対象実需給年度：2026年度）の実施を決定いたしました。' },
      { url: OCCTO_ADD_2026, text: '応札の受付期間（6月4日～16日）' },
    ],
    why: '題名「2026年度向け」＝OCCTO の「YYYY年度向け」用法（実需給年度）。eventType オークションは同バッチ姉妹 capacity-main-auction-2026-09 と同じく応札期間を指す → 応札受付開始 2025-06-04。2026-03-15 は生成ドラフトの仮置き（どの一次の工程日でもない）',
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
  if (DRY) { done++; return; }
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
  console.log(`[friday6 追修便② PATCH] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / ${rows.length} 行${ONLY ? `（--only=${ONLY}）` : ''}`);
  if (rows.length === 0) { console.error('対象行なし'); process.exit(1); }
  for (const row of rows) await runRow(row);
  console.log(`\n[done] 実行 ${done} / スキップ・見送り ${skipped} / 失敗 ${failed}`);
  if (changes.length) console.log(`  変更 field: ${changes.join(', ')}`);
  held.forEach((h) => console.log('  - ' + h));
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
