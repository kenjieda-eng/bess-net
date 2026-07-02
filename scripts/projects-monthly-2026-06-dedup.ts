/**
 * scripts/projects-monthly-2026-06-dedup.ts （読み取り専用・GET先行dedup）
 * 2026年6月分7案件が既存projectsに在るかを name/所在地/事業者で照合。microCMS GET のみ。
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

// 各候補の探索キー（city は必須、name/operator トークンで絞り込み）
const CANDS = [
  { no: 1, label: '筑前町67MW',   city: ['筑前町', '朝倉'], toks: ['筑前', '伊藤忠', '三菱地所', '東京センチュリー'] },
  { no: 2, label: 'ウィル紀の川', city: ['紀の川'],         toks: ['ウィル', 'RE100', '紀の川'] },
  { no: 3, label: 'ウィル山鹿',   city: ['山鹿'],           toks: ['ウィル', 'RE100', '山鹿'] },
  { no: 4, label: 'ウィル豊後大野', city: ['豊後大野'],      toks: ['ウィル', 'RE100', '豊後大野'] },
  { no: 5, label: 'NC口春(嘉麻)', city: ['嘉麻'],           toks: ['口春', '日本蓄電池', 'NC', 'リミックス'] },
  { no: 6, label: 'NC長浜三川町', city: ['長浜'],           toks: ['三川', '長浜', '日本蓄電池', 'NC'] },
  { no: 7, label: 'NC久々野(高山)', city: ['高山'],         toks: ['久々野', '高山', '日本蓄電池', 'NC'] },
];

function hit(p: any, c: typeof CANDS[number]): boolean {
  const hay = `${p.name || ''} ${p.prefecture || ''} ${p.city || ''} ${p.operator || ''} ${p.body || ''}`;
  const cityHit = c.city.some((k) => hay.includes(k));
  const tokHit = c.toks.some((k) => hay.includes(k));
  return cityHit || tokHit;
}

async function main(): Promise<void> {
  const all = await getAllProjects();
  console.log(`projects total=${all.length}`);
  // 参考: 日本蓄電池/ウィル 系の既存operatorを俯瞰
  const opHits = all.filter((p) => /日本蓄電池|ウィル|リミックス|伊藤忠|RE100/.test(`${p.operator || ''}`));
  console.log(`\n[参考] operator に 日本蓄電池/ウィル/リミックス/伊藤忠/RE100 を含む既存: ${opHits.length}件`);
  for (const p of opHits) console.log(`   [${p.slug}] 「${p.name}」 op=${p.operator} 所在=${p.prefecture}/${p.city} MW=${p.outputMw} MWh=${p.capacityMwh} status=[${(p.status||[]).join(',')}]`);

  for (const c of CANDS) {
    const ms = all.filter((p) => hit(p, c));
    console.log(`\n==== #${c.no} ${c.label} : マッチ ${ms.length}件 ====`);
    for (const p of ms) {
      console.log(`   [${p.slug}] id=${p.id} 「${p.name}」`);
      console.log(`       op=「${p.operator}」 所在=「${p.prefecture}」/「${p.city}」 MW=${p.outputMw} MWh=${p.capacityMwh} status=[${(p.status||[]).join(',')}] cod=「${p.cod}」 epc=「${(p as any).epc ?? ''}」`);
      console.log(`       src=${p.sourceUrl}`);
    }
  }
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
