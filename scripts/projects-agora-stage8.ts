/**
 * scripts/projects-agora-stage8.ts
 *
 * /projects ステージ8 — A/B/C/参考（PATCH のみ・DELETE/PUT/POST なし）。
 *   A: ota-bess SPC誤り訂正（上州太田蓄電所合同会社 → fantasista battery 1合同会社）。
 *      根拠: enehub「fantasistaの完全子会社NC MAX WORLD傘下の fantasista battery1 が運営」。
 *   B: pr-co16325-gunma（ポート太田）所在地二重バグ修正 + 2MW/8MWh補完 + title整合。
 *   C: pr-co16325-bess-2（ポート伊勢崎第二）所在地壊れ修正 + 2MW/8MWh補完 + title整合。
 *   参考: pr-co16325-gunma-2（伊勢崎第一）title整合 + 所在地二重バグ修正（任意・MWh等は不変）。
 *
 * ★PART D（城洋小角田 POST）は一次情報照合で spec 矛盾が判明したため本スクリプトに含めない（保留）。
 *   日経BP 03607: 太田市=「城洋」/桐生市=「城洋商事」/熊谷市=「光遊社」、いずれも 2MW/7MWh。
 *   かつ「小角田」は両出典に非掲載（既存 tohoku-kotsunoda=坂東1号/東北電力 が真の小角田蓄電所）。
 *
 * 安全: microCMS PATCH のみ。冪等（name 既達なら skip）。body は現本文 fetch→既知フレーズのみ .replace。
 *   出典: fantasista PR/enehub・ポート公式(theport 11497)・日経BP。捏造しない(L-EIC-019)。module化(#104)。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-agora-stage8.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;
const SRC_PORT = 'https://www.theport.jp/news/2025/11497';

async function patch(id: string, fields: Record<string, unknown>): Promise<void> {
  if (DRY_RUN) return;
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PATCH', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!r.ok) throw new Error(`PATCH ${id} HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
}

function rep(body: string | undefined, from: string, to: string, label: string): string {
  const out = (body || '').replace(from, to);
  console.log(`     body[${label}]: ${out !== body ? '適用' : '対象なし(要確認)'}`);
  return out;
}

async function main(): Promise<void> {
  console.log(`[agora-stage8] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const by = new Map(all.map((p) => [p.slug, p]));

  // ── PART A: ota-bess SPC訂正 ──
  console.log(`\n=== PART A: ota-bess SPC訂正（PATCH）===`);
  const a = by.get('ota-bess');
  if (!a) console.log('  [miss] ota-bess');
  else {
    const aOp = '株式会社fantasista（SPC: fantasista battery 1合同会社）';
    if (a.operator === aOp) console.log('  [skip-done] 既に訂正済');
    else {
      console.log(`  operator「${a.operator}」→「${aOp}」`);
      const nb = rep(a.body, '株式会社fantasista（上州太田蓄電所合同会社）', '株式会社fantasista（SPC: fantasista battery 1合同会社）', 'SPC');
      console.log(`  不変: title「${a.name}」/ MWh ${a.capacityMwh} / MW ${a.outputMw} / 所在地${a.prefecture}${a.city} / 出典 不変`);
      await patch(a.id, { operator: aOp, body: nb });
    }
  }

  // ── PART B: pr-co16325-gunma（ポート太田）──
  console.log(`\n=== PART B: pr-co16325-gunma（ポート太田）enrich（PATCH）===`);
  const b = by.get('pr-co16325-gunma');
  if (!b) console.log('  [miss] pr-co16325-gunma');
  else {
    const bName = '群馬太田蓄電所（ポート）';
    if (b.name === bName && b.outputMw === 2) console.log('  [skip-done] 既に補完済');
    else {
      console.log(`  city「${b.city}」→「太田市」（二重バグ修正）/ title「${b.name}」→「${bName}」`);
      console.log(`  MW ${b.outputMw}→2 / MWh ${b.capacityMwh}→8 / 出典→theport 11497`);
      console.log(`  不変: 事業者${b.operator} / status[${(b.status || []).join(',')}] / cod ${b.cod}`);
      const nb = rep(b.body, '<strong>群馬県太田市における系統用蓄電所</strong>', '<strong>群馬太田蓄電所（ポート）</strong>', 'title');
      await patch(b.id, { name: bName, city: '太田市', outputMw: 2, capacityMwh: 8, sourceUrl: SRC_PORT, body: nb });
    }
  }

  // ── PART C: pr-co16325-bess-2（ポート伊勢崎第二・壊れ修正）──
  console.log(`\n=== PART C: pr-co16325-bess-2（ポート伊勢崎第二）壊れ修正+enrich（PATCH）===`);
  const c = by.get('pr-co16325-bess-2');
  if (!c) console.log('  [miss] pr-co16325-bess-2');
  else {
    const cName = '群馬伊勢崎第二蓄電所（ポート）';
    if (c.name === cName && c.outputMw === 2) console.log('  [skip-done] 既に補完済');
    else {
      console.log(`  prefecture「${c.prefecture}」→「群馬県」/ city「${c.city}」→「伊勢崎市」（壊れ修正）`);
      console.log(`  title「${c.name}」→「${cName}」/ MW ${c.outputMw}→2 / MWh ${c.capacityMwh}→8 / 出典→theport 11497`);
      console.log(`  不変: 事業者${c.operator} / status[${(c.status || []).join(',')}]（計画中のまま） / cod ${c.cod}`);
      const nb = rep(c.body,
        '<strong>系統用蓄電所</strong>は、系統用蓄電所の需給調整市に立地する系統用蓄電所',
        '<strong>群馬伊勢崎第二蓄電所（ポート）</strong>は、群馬県伊勢崎市に立地する系統用蓄電所', 'title+所在地');
      await patch(c.id, { name: cName, prefecture: '群馬県', city: '伊勢崎市', outputMw: 2, capacityMwh: 8, sourceUrl: SRC_PORT, body: nb });
    }
  }

  // ── 参考: pr-co16325-gunma-2（ポート伊勢崎第一）title整合+二重バグ修正（任意）──
  console.log(`\n=== 参考: pr-co16325-gunma-2（ポート伊勢崎第一）title整合（PATCH・任意）===`);
  const g2 = by.get('pr-co16325-gunma-2');
  if (!g2) console.log('  [miss] pr-co16325-gunma-2');
  else {
    const g2Name = '群馬伊勢崎第一蓄電所（ポート）';
    if (g2.name === g2Name) console.log('  [skip-done] 既に整合済');
    else {
      console.log(`  title「${g2.name}」→「${g2Name}」/ city「${g2.city}」→「伊勢崎市」（二重バグ修正）`);
      console.log(`  不変: MW ${g2.outputMw} / MWh ${g2.capacityMwh}（要確認・本タスク外）/ status / cod / 出典`);
      const nb = rep(g2.body, '<strong>群馬県伊勢崎市における系統用蓄電所</strong>', '<strong>群馬伊勢崎第一蓄電所（ポート）</strong>', 'title');
      await patch(g2.id, { name: g2Name, city: '伊勢崎市', body: nb });
    }
  }

  console.log(`\n[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'} （PART D=城洋小角田は spec矛盾につき保留・別途確認）`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
