/**
 * scripts/projects-agora-stage5.ts
 *
 * /projects × agora ステージ5。一次情報で坂東クラスタの所在地誤り(宮城→群馬)を修正。
 *   PART A（PATCH 2）: tohoku-niratsuka / tohoku-kotsunoda（所在地・MW・容量・事業者・title・body・出典）。
 *   PART B（POST 3）: yatogo-bess / tsu-tohogas-bess / oyama-au-bess（status空・冪等）。
 *   PART C（PATCH 1）: pr-energy-bess-2（壊れ title/所在地 修正）。
 *
 * 出典: 東北電力公式(1247227/1246259)・日経BP・agora。捏造しない＝記載値は一次情報のみ(L-EIC-019)。
 * 安全: microCMS は PATCH/POST のみ（DELETE/PUT なし）。冪等。module化(#104)。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-agora-stage5.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;
const SRC_TOHOKU_A = 'https://www.tohoku-epco.co.jp/news/normal/1247227_2558.html';
const SRC_TOHOKU_YATOGO = 'https://www.tohoku-epco.co.jp/news/normal/1246259_2558.html';
const SRC_AGORA = 'https://agora.ex.nii.ac.jp/earthquake/201103-eastjapan/energy/electrical-japan/type/9.html.ja';
const OP_BANDO = '坂東蓄電所1号合同会社（ML Power・東北電力）';

async function api(method: string, url: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

// PART A: PATCH 2件（slug → 更新フィールド）
const A_FIXES: { slug: string; name: string; prefecture: string; city: string; outputMw: number; capacityMwh: number; sourceUrl: string; body: string }[] = [
  {
    slug: 'tohoku-niratsuka', name: '韮塚蓄電所（坂東蓄電所1号・東北電力）',
    prefecture: '群馬県', city: '伊勢崎市', outputMw: 1.96, capacityMwh: 7.46, sourceUrl: SRC_TOHOKU_A,
    body: '<p><strong>韮塚蓄電所</strong>は、ML Power（エムエル・パワー）と東北電力が共同出資する坂東蓄電所1号合同会社が運営する系統用蓄電池プロジェクトで、群馬県伊勢崎市に立地します。出力1.96MW・容量7.46MWh級で、GSユアサ製リチウムイオン電池とダイヘン製システムを採用し、2025年6月に営業運転を開始しました。同社は小角田蓄電所（群馬県太田市）・弥藤吾蓄電所（埼玉県熊谷市）も展開し、みずほリースが事業に参画しています。詳細は東北電力・みずほリースの公式発表をご参照ください。</p>',
  },
  {
    slug: 'tohoku-kotsunoda', name: '小角田蓄電所（坂東蓄電所1号・東北電力）',
    prefecture: '群馬県', city: '太田市', outputMw: 1.99, capacityMwh: 7.40, sourceUrl: SRC_TOHOKU_A,
    body: '<p><strong>小角田蓄電所</strong>は、ML Power（エムエル・パワー）と東北電力が共同出資する坂東蓄電所1号合同会社が運営する系統用蓄電池プロジェクトで、群馬県太田市に立地します。出力1.99MW・容量7.40MWh級で、パワーエックス製「Mega Power」（リン酸鉄リチウム/LFP）を採用し、2025年4月に営業運転を開始しました。同社は韮塚蓄電所（群馬県伊勢崎市）・弥藤吾蓄電所（埼玉県熊谷市）も展開し、みずほリースが事業に参画しています。</p>',
  },
];

// PART B: POST 3件
const B_NEW: { slug: string; name: string; operator: string; outputMw: number; capacityMwh?: number; prefecture: string; city: string; sourceUrl: string; body?: string }[] = [
  {
    slug: 'yatogo-bess', name: '弥藤吾蓄電所（坂東蓄電所1号・東北電力）', operator: OP_BANDO,
    outputMw: 1.96, capacityMwh: 7.46, prefecture: '埼玉県', city: '熊谷市', sourceUrl: SRC_TOHOKU_YATOGO,
    body: '<p><strong>弥藤吾蓄電所</strong>は、ML Power（エムエル・パワー）と東北電力が共同出資する坂東蓄電所1号合同会社が運営する系統用蓄電池プロジェクトで、埼玉県熊谷市に立地します。出力1.96MW・容量7.46MWh級で、GSユアサ製リチウムイオン電池とダイヘン製システムを採用し、2025年2月に営業運転を開始しました。みずほリースが事業に参画しています。</p>',
  },
  { slug: 'tsu-tohogas-bess', name: '津蓄電所（東邦ガス）', operator: '東邦ガス', outputMw: 11.4, prefecture: '三重県', city: '津市', sourceUrl: SRC_AGORA },
  { slug: 'oyama-au-bess', name: '小山市蓄電所（auリニューアブルエナジー）', operator: 'auリニューアブルエナジー', outputMw: 1.999, prefecture: '栃木県', city: '小山市', sourceUrl: SRC_AGORA },
];

// PART C: PATCH 1件
const C_FIX = { slug: 'pr-energy-bess-2', cur: 'ENERGY初の運営案件となる栃木県小山市蓄電所', name: '小山市蓄電所（TAOKE ENERGY）', city: '小山市' };

async function main(): Promise<void> {
  console.log(`[agora-stage5] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const by = new Map(all.map((p) => [p.slug, p]));
  const slugs = new Set(all.map((p) => p.slug));
  const before = all.length;

  // ── PART A ──
  console.log(`\n=== PART A: 坂東クラスタ 所在地誤り修正（PATCH 2）===`);
  let aOk = 0;
  for (const f of A_FIXES) {
    const p = by.get(f.slug);
    if (!p) { console.log(`  [miss] ${f.slug}`); continue; }
    if (p.name === f.name && p.prefecture === f.prefecture) { console.log(`  [skip-done] ${f.slug}: 既に修正済`); continue; }
    console.log(`  ${f.slug}:`);
    console.log(`     所在地「${p.prefecture}${p.city || ''}」→「${f.prefecture}${f.city}」 / MW ${p.outputMw}→${f.outputMw} / MWh ${p.capacityMwh}→${f.capacityMwh}`);
    console.log(`     事業者「${p.operator}」→「${OP_BANDO}」 / title「${p.name}」→「${f.name}」 / body差替(${f.body.length}字) / 出典→tohoku 1247227`);
    await patchOnly(p.id, { name: f.name, prefecture: f.prefecture, city: f.city, outputMw: f.outputMw, capacityMwh: f.capacityMwh, operator: OP_BANDO, sourceUrl: f.sourceUrl, body: f.body });
    aOk++;
  }

  // ── PART C ──
  console.log(`\n=== PART C: 小山(TAOKE) 壊れタイトル修正（PATCH 1）===`);
  let cOk = 0;
  const cp = by.get(C_FIX.slug);
  if (!cp) console.log(`  [miss] ${C_FIX.slug}`);
  else if (cp.name === C_FIX.name) console.log(`  [skip-done] ${C_FIX.slug}: 既に「${C_FIX.name}」`);
  else {
    console.log(`  ${C_FIX.slug}: title「${cp.name}」→「${C_FIX.name}」 / city「${cp.city}」→「${C_FIX.city}」（pref=栃木県/status/cod/op 不変）`);
    await patchOnly(cp.id, { name: C_FIX.name, city: C_FIX.city });
    cOk++;
  }

  // ── PART B ──
  console.log(`\n=== PART B: 新規追加（POST 3・status空・slug衝突チェック）===`);
  let bOk = 0, bSkip = 0;
  for (const e of B_NEW) {
    if (slugs.has(e.slug)) { console.log(`  [skip-dup] ${e.slug}: slug既存`); bSkip++; continue; }
    const titleClash = all.filter((p) => (p.name || '').trim() === e.name.trim()).map((p) => p.slug);
    if (titleClash.length) console.log(`  [warn] ${e.slug}: 同名title既存(${titleClash.join(',')})`);
    const body: Record<string, unknown> = { slug: e.slug, name: e.name, operator: e.operator, outputMw: e.outputMw, prefecture: e.prefecture, city: e.city, sourceUrl: e.sourceUrl };
    if (e.capacityMwh !== undefined) body.capacityMwh = e.capacityMwh;
    if (e.body) body.body = e.body;
    console.log(`  POST ${e.slug}: ${e.name} / ${e.operator} / ${e.outputMw}MW${e.capacityMwh ? '/' + e.capacityMwh + 'MWh' : ''} / ${e.prefecture}${e.city} / body=${e.body ? e.body.length + '字' : '空'} / status=空`);
    if (!DRY_RUN) { const r = await api('POST', BASE, body); console.log(`     created id=${r.id}`); }
    bOk++;
  }

  console.log(`\n[done] PART A=${aOk} / C=${cOk} / B(POST)=${bOk} skip=${bSkip}  mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  if (!DRY_RUN) { const after = (await getAllProjects()).length; console.log(`  projects(microCMS全件): ${before} → ${after}`); }
}

async function patchOnly(id: string, fields: Record<string, unknown>): Promise<void> {
  if (DRY_RUN) return;
  await api('PATCH', `${BASE}/${id}`, fields);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
