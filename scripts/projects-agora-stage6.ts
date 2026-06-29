/**
 * scripts/projects-agora-stage6.ts
 *
 * /projects × agora ステージ6 — 既存エントリ補完（PATCH のみ・新規作成しない）。
 *   PART A: kyuden-omuta-reuse（大牟田・九電/NExT-e/リユース）1MW/3MWh補完＋body 1文補正。
 *   PART B: jfe-takeo（武雄・4社）2MW/8MWh・稼働中補完＋九州精工→九州製鋼 誤記修正＋body補正。
 * （PART C の pr-co85927-bess→jfe-takeo 301 は src/lib/projects-301.ts 側で対応・別編集）
 *
 * 出典: 九州電力/NExT-e/JFEエンジ公式・日経BP。捏造しない＝記載値は一次情報のみ(L-EIC-019)。
 * 安全: microCMS は PATCH のみ（DELETE/PUT/POST なし）。冪等。body は現本文を fetch して
 *   既知フレーズのみ .replace（他本文は不変）。module化(#104)。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-agora-stage6.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;
const SRC_KYUDEN = 'https://www.kyuden.co.jp/press_h220805-1.html';
const SRC_JFE = 'https://www.jfe-eng.co.jp/news/2025/20251127.html';

async function patch(id: string, fields: Record<string, unknown>): Promise<void> {
  if (DRY_RUN) return;
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PATCH', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!r.ok) throw new Error(`PATCH ${id} HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
}

async function main(): Promise<void> {
  console.log(`[agora-stage6] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const by = new Map(all.map((p) => [p.slug, p]));

  // ── PART A: kyuden-omuta-reuse ──
  console.log(`\n=== PART A: kyuden-omuta-reuse（大牟田）補完（PATCH）===`);
  const a = by.get('kyuden-omuta-reuse');
  if (!a) console.log('  [miss] kyuden-omuta-reuse');
  else {
    const aName = '大牟田蓄電所（九州電力・NExT-e Solutions・リユース電池）';
    if (a.name === aName && a.outputMw === 1) console.log('  [skip-done] 既に補完済');
    else {
      const newBody = (a.body || '').replace('九州電力らによる', '九州電力とNExT-e Solutionsによる');
      console.log(`  outputMw ${a.outputMw}→1 / MWh ${a.capacityMwh}→3 / op「${a.operator}」→「九州電力・NExT-e Solutions（リユース電池）」`);
      console.log(`  title「${a.name}」→「${aName}」 / body 1文補正(九州電力ら→九州電力とNExT-e Solutions: ${a.body !== newBody ? '適用' : '対象なし'})`);
      await patch(a.id, { name: aName, outputMw: 1, capacityMwh: 3, operator: '九州電力・NExT-e Solutions（リユース電池）', sourceUrl: SRC_KYUDEN, body: newBody });
    }
  }

  // ── PART B: jfe-takeo ──
  console.log(`\n=== PART B: jfe-takeo（武雄）補完＋九州製鋼 誤記修正（PATCH）===`);
  const b = by.get('jfe-takeo');
  if (!b) console.log('  [miss] jfe-takeo');
  else {
    const bName = '武雄市蓄電所（JFEエンジ・大阪ガス・みずほリース・九州製鋼）';
    if (b.name === bName && b.outputMw === 2) console.log('  [skip-done] 既に補完済');
    else {
      let newBody = (b.body || '').split('九州精工').join('九州製鋼');
      newBody = newBody.replace(
        '佐賀県武雄市に立地予定です。2025年度の事業開始を目指しています。',
        '佐賀県武雄市に立地します。2025年11月27日に商業運転を開始しました（出力2MW・容量8MWh・LFP）。',
      );
      console.log(`  outputMw ${b.outputMw}→2 / MWh ${b.capacityMwh}→8 / status[${(b.status || []).join(',')}]→[稼働中] / cod「${b.cod}」→「2025-11-27」`);
      console.log(`  op「${b.operator}」→ 九州精工→九州製鋼 / title→「${bName}」`);
      console.log(`  body: 九州精工→九州製鋼(${(b.body || '').includes('九州精工') ? '適用' : '対象なし'}) / 稼働文補正(${newBody.includes('2025年11月27日に商業運転') ? '適用' : '対象なし'})`);
      await patch(b.id, {
        name: bName, outputMw: 2, capacityMwh: 8, status: ['稼働中'], cod: '2025-11-27',
        operator: 'JFEエンジ・大阪ガス・みずほリース・九州製鋼', sourceUrl: SRC_JFE, body: newBody,
      });
    }
  }

  // ── PART C: 確認のみ（301は projects-301.ts 側）──
  console.log(`\n=== PART C: pr-co85927-bess 重複確認 ===`);
  const c = by.get('pr-co85927-bess');
  if (!c) console.log('  pr-co85927-bess: 存在しない（301不要）');
  else console.log(`  pr-co85927-bess: 「${c.name}」 op=${c.operator} → 武雄/みずほリース重複＝jfe-takeo へ 301（projects-301.ts で対応）`);

  console.log(`\n[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
