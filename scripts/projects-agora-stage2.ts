/**
 * scripts/projects-agora-stage2.ts
 *
 * /projects × agora(Electrical Japan/NII) ステージ2。
 *   PART A（適用）: 出力MW補完8件＋仙台PS名称修正1（outputMw / title のみ PATCH・冪等・非破壊）。
 *   PART B（dry-run のみ・★POSTしない）: 未掲載11件の slug案＋項目案＋重複チェック提示。
 *
 * 出典(agora=正): https://agora.ex.nii.ac.jp/earthquake/201103-eastjapan/energy/electrical-japan/type/9.html.ja
 * 安全: getAllProjects 1スキャン。microCMS は outputMw/title のみ PATCH（DELETE/PUT/POST なし）。
 *   既に値があれば skip。捏造しない（不明は空）。落とし穴#104（module化）。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-agora-stage2.ts [--dry-run]
 */
export {};
import { getAllProjects, type Project } from '../src/lib/microcms';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;
const AGORA_URL = 'https://agora.ex.nii.ac.jp/earthquake/201103-eastjapan/energy/electrical-japan/type/9.html.ja';

async function patch(id: string, fields: Record<string, unknown>): Promise<void> {
  if (DRY_RUN) return;
  const resp = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!resp.ok) throw new Error(`PATCH ${id} HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
}
const emptyMw = (v: unknown) => v === undefined || v === null || v === 0;

// PART A: 出力MW補完（slug→MW）
const MW_FIXES: Record<string, number> = {
  'eneos-muroran': 50, 'pr-co173123-fukuoka': 29.97, 'sumitomo-nissan-chitose': 6,
  'pr-co16325-gunma-2': 2, 'tepco-ntt-tsumagoi': 2, 'kuriharant-kimitsu': 1.999,
  'tokyu-higashimatsuyama': 1.799, 'pr-co53091-chiba': 1,
};
// PART A: 名称修正（title のみ・slug不変）
const TITLE_FIX = { slug: 'pr-co43349-bess', cur: 'テスラ系統用蓄電池', next: '仙台パワーステーション系統用蓄電所' };

// PART B: 未掲載11件（dry-run提示のみ）— name/operator/MW/所在地（不明は空）
type NewEntry = { slug: string; name: string; operator: string; outputMw: number; prefecture: string; city: string };
const NEW_ENTRIES: NewEntry[] = [
  { slug: 'kita-toyotomi-bess',        name: '北豊富変電所蓄電池設備',                operator: '北海道北部風力送電',                       outputMw: 240,    prefecture: '北海道', city: '豊富町' },
  { slug: 'shinkawa-dax-bess',         name: 'しんかわ蓄電所',                        operator: '合同会社DAX',                             outputMw: 50,     prefecture: '',     city: '' },
  { slug: 'okiden-miyako-2-bess',      name: '宮古第二発電所供給用蓄電池',            operator: '沖縄電力',                                 outputMw: 12,     prefecture: '沖縄県', city: '宮古島市' },
  { slug: 'teras-nagasaki-koyagi-bess', name: 'テラスエナジー長崎香焼エナジーストレージ', operator: 'テラスエナジー',                           outputMw: 2,      prefecture: '長崎県', city: '長崎市香焼' },
  { slug: 'nakagawa-daiichi-bess',     name: '第一系統用蓄電所',                      operator: '中川商事',                                 outputMw: 2,      prefecture: '',     city: '' },
  { slug: 'sakaino-johyo-bess',        name: '境野蓄電所',                            operator: '株式会社城洋商事',                         outputMw: 2,      prefecture: '',     city: '' },
  { slug: 'sagamihara-tokyu-bess',     name: '相模原蓄電所',                          operator: '東急建設',                                 outputMw: 1.999,  prefecture: '神奈川県', city: '相模原市' },
  { slug: 'oly-powerstorage-midorimachi', name: 'OLYPowerstorage緑町',               operator: 'オリンピア',                               outputMw: 1.998,  prefecture: '',     city: '' },
  { slug: 'oly-powerstorage-mimurocho',   name: 'OLYPowerstorage三室町',             operator: 'オリンピア',                               outputMw: 1.998,  prefecture: '',     city: '' },
  { slug: 'noval-power-c3-bess',       name: 'ノーバル・パワーC3',                    operator: '合同会社ノーバル・ソーラー',               outputMw: 1.9272, prefecture: '',     city: '' },
  { slug: 'tagawa-ntt-kyuden-bess',    name: '田川蓄電所',                            operator: 'NTTアノードエナジー／九州電力／三菱商事', outputMw: 1.4,    prefecture: '福岡県', city: '田川市' },
];

async function main(): Promise<void> {
  console.log(`[agora-stage2] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const by = new Map(all.map((p) => [p.slug, p]));
  const allSlugs = new Set(all.map((p) => p.slug));
  const allTitles = new Map<string, string[]>();
  for (const p of all) { const t = (p.name || '').trim(); (allTitles.get(t) ?? allTitles.set(t, []).get(t)!).push(p.slug); }

  // ── PART A-1: 出力MW補完 ──
  console.log(`\n=== PART A-1: 出力MW補完（8件・outputMw のみ）===`);
  let mwOk = 0, mwSkip = 0, mwMiss = 0;
  for (const [slug, mw] of Object.entries(MW_FIXES)) {
    const p = by.get(slug);
    if (!p) { console.log(`  [miss] ${slug}: 見つからない`); mwMiss++; continue; }
    if (!emptyMw(p.outputMw)) { console.log(`  [skip] ${slug}: 既に outputMw=${p.outputMw}（補完しない）`); mwSkip++; continue; }
    console.log(`  ${slug}: outputMw ${p.outputMw ?? '空'} → ${mw}`);
    await patch(p.id, { outputMw: mw });
    mwOk++;
  }
  // ── PART A-2: 名称修正 ──
  console.log(`\n=== PART A-2: 名称修正（仙台PS・title のみ）===`);
  let titleOk = 0;
  const tp = by.get(TITLE_FIX.slug);
  if (!tp) console.log(`  [miss] ${TITLE_FIX.slug}`);
  else if (tp.name === TITLE_FIX.next) console.log(`  [skip-done] ${TITLE_FIX.slug}: 既に「${TITLE_FIX.next}」`);
  else if (tp.name !== TITLE_FIX.cur) console.log(`  [skip-mismatch] ${TITLE_FIX.slug}: 現値「${tp.name}」≠「${TITLE_FIX.cur}」`);
  else { console.log(`  ${TITLE_FIX.slug}: title「${tp.name}」→「${TITLE_FIX.next}」（outputMw=${tp.outputMw} は不変）`); await patch(tp.id, { name: TITLE_FIX.next }); titleOk++; }

  console.log(`\n[PART A done] MW補完 ${DRY_RUN ? '(対象)' : 'PATCH'}=${mwOk} skip=${mwSkip} miss=${mwMiss} / 名称修正=${titleOk}`);

  // ── PART B: 未掲載11件 dry-run提示（★POSTしない）──
  console.log(`\n=== PART B: 未掲載11件 新規作成案（dry-run のみ・POSTしない）===`);
  for (const e of NEW_ENTRIES) {
    const slugClash = allSlugs.has(e.slug);
    const titleClash = allTitles.get(e.name.trim()) ?? [];
    console.log(`  ◆ slug案: ${e.slug}${slugClash ? '  ⚠slug既存衝突' : '  (slug衝突なし)'}`);
    console.log(`     title=${e.name} / operator=${e.operator} / 出力MW=${e.outputMw} / 所在地=${e.prefecture || '（空）'}${e.city || ''}`);
    console.log(`     容量MWh=空 / status=空 / 運開=空 / sourceUrl=${AGORA_URL} / noindex=false`);
    console.log(`     既存title重複: ${titleClash.length ? '⚠ 同名 ' + titleClash.join(',') : 'なし'}`);
  }
  console.log(`\n[PART B] ${NEW_ENTRIES.length}件 提示のみ・microCMS POST なし。`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
