/**
 * scripts/projects-monthly-2026-06.ts
 * projects 月次投入 2026年6月分。GET先行dedup（projects-monthly-2026-06-dedup.ts）の結果:
 *   #7 NC久々野=既存 jpn-takayama（完備）＝スキップ。#1-#6 は新規＝POST。
 * microCMS POST のみ（DELETE/PUT/PATCH なし）。冪等（slug 既存なら skip）。捏造せず不明は空(L-EIC-019)。
 * status: 着工→建設中 / 受電→siblings(nc-shirakawa等)に倣い status空+cod受電日 / 運開予定→建設中 / 運開済→稼働中。
 * 実行: (env 読込後) npx tsx scripts/projects-monthly-2026-06.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;

type P = {
  slug: string; name: string; operator: string; outputMw: number; capacityMwh: number;
  prefecture: string; city: string; status: string[]; cod: string; epc: string; sourceUrl: string; body: string;
};

const ITEMS: P[] = [
  {
    slug: 'chikuzenmachi-bess',
    name: '福岡県筑前町蓄電所（伊藤忠商事・三菱地所・東京センチュリー）',
    operator: '福岡県筑前町蓄電所合同会社（出資：伊藤忠商事・三菱地所・東京センチュリー）',
    outputMw: 67, capacityMwh: 230.1, prefecture: '福岡県', city: '朝倉郡筑前町',
    status: ['建設中'], cod: '2028年1月（予定）', epc: '',
    sourceUrl: 'https://www.itochu.co.jp/ja/news/press/2026/260601.html',
    body: '<p><strong>福岡県筑前町蓄電所</strong>は、福岡県朝倉郡筑前町に建設される定格出力67MW・定格容量230.1MWhの系統用蓄電所。事業会社は福岡県筑前町蓄電所合同会社（2026年4月1日設立）で、伊藤忠商事・三菱地所・東京センチュリーが出資する。2026年6月1日に建設着手を発表し、運転開始は2028年1月を予定。</p><p>伊藤忠商事が蓄電池システムの販売・運用・保守およびAI最適運用、三菱地所が開発期間中のプロジェクトマネジメント・事業権利確保、東京センチュリーがSPC運営・アセットマネジメントを担う。容量市場・卸電力市場・需給調整市場の複数市場に対応し、敷地面積は約26,000㎡、電池方式はリチウムイオン電池。経済産業省「令和7年度再生可能エネルギー導入拡大・系統用蓄電池等電力貯蔵システム導入支援事業費補助金」に採択。</p>',
  },
  {
    slug: 'will-kinokawa',
    name: '紀の川蓄電所（ウィル）',
    operator: 'ウィル（アグリゲーション：RE100電力）',
    outputMw: 1.99, capacityMwh: 8.128, prefecture: '和歌山県', city: '紀の川市',
    status: ['稼働中'], cod: '2026年4月', epc: '',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000031.000107409.html',
    body: '<p><strong>紀の川蓄電所（ウィル）</strong>は、和歌山県紀の川市に立地する系統用蓄電所で、定格出力AC1.99MW・定格容量DC8.128MWh。事業者はウィル（大阪市）、アグリゲーション業務はRE100電力が代行する。2026年4月に運転を開始した。需給調整市場・容量市場等での最適運用に対応する。</p><p>※和歌山県紀の川市には別事業者（関西電力・オリックス）の紀の川蓄電所（48MW/113MWh）も立地するが、本案件はウィルの別案件。</p>',
  },
  {
    slug: 'will-yamaga',
    name: '山鹿蓄電所（ウィル）',
    operator: 'ウィル（アグリゲーション：RE100電力）',
    outputMw: 1.99, capacityMwh: 8.128, prefecture: '熊本県', city: '山鹿市',
    status: ['建設中'], cod: '2026年7月（予定）', epc: '',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000031.000107409.html',
    body: '<p><strong>山鹿蓄電所（ウィル）</strong>は、熊本県山鹿市に立地する系統用蓄電所で、定格出力AC1.99MW・定格容量DC8.128MWh。事業者はウィル、アグリゲーション業務はRE100電力が代行する。2026年7月の運転開始を予定。</p>',
  },
  {
    slug: 'will-bungoono',
    name: '豊後大野蓄電所（ウィル）',
    operator: 'ウィル（アグリゲーション：RE100電力）',
    outputMw: 1.99, capacityMwh: 8.128, prefecture: '大分県', city: '豊後大野市',
    status: ['建設中'], cod: '2026年6月（予定）', epc: '',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000031.000107409.html',
    body: '<p><strong>豊後大野蓄電所（ウィル）</strong>は、大分県豊後大野市に立地する系統用蓄電所で、定格出力AC1.99MW・定格容量DC8.128MWh。事業者はウィル、アグリゲーション業務はRE100電力が代行する。2026年6月の運転開始を予定（出典配信時点）。</p>',
  },
  {
    slug: 'nc-kama-kuchiharu',
    name: 'NC口春蓄電所（日本蓄電池）',
    operator: '日本蓄電池',
    outputMw: 1.975, capacityMwh: 8.146, prefecture: '福岡県', city: '嘉麻市',
    status: [], cod: '2026-06-01', epc: 'クラフティア',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000067.000161802.html',
    body: '<p><strong>NC口春蓄電所</strong>は、福岡県嘉麻市に立地する系統用蓄電所で、定格出力1,975kW・容量8,146kWh。日本蓄電池がリミックスポイントと共同組成したファンドで開発し、2026年6月1日に受電を開始した。蓄電池はCATL製、PCSはTMEIC製。設計・施工はクラフティア（福岡市）。需給調整市場・JEPX（卸売市場）・容量市場での運用と再エネ出力平準化に対応する。</p>',
  },
  {
    slug: 'nc-nagahama-mikawacho',
    name: 'NC長浜市三川町蓄電所（日本蓄電池）',
    operator: '日本蓄電池',
    outputMw: 1.988, capacityMwh: 8.146, prefecture: '滋賀県', city: '長浜市',
    status: [], cod: '2026-05-22', epc: 'カンドー',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000071.000161802.html',
    body: '<p><strong>NC長浜市三川町蓄電所</strong>は、滋賀県長浜市三川町に立地する系統用蓄電所で、定格出力1,988kW・容量8,146kWh。日本蓄電池が開発し、2026年5月22日に受電した（6月4日発表）。蓄電池はCATL製、PCSはTMEIC製。施工はカンドー。</p>',
  },
];

async function main(): Promise<void> {
  console.log(`[monthly-2026-06] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  let post = 0, skip = 0;
  for (const it of ITEMS) {
    if (bySlug.has(it.slug)) { console.log(`  [skip] ${it.slug} 既存 (id=${bySlug.get(it.slug)!.id})`); skip += 1; continue; }
    console.log(`  [POST] ${it.slug}`);
    console.log(`      name=「${it.name}」 op=「${it.operator}」`);
    console.log(`      MW=${it.outputMw} MWh=${it.capacityMwh} 所在=${it.prefecture}/${it.city} status=[${it.status.join(',')}] cod=「${it.cod}」 epc=「${it.epc}」`);
    console.log(`      src=${it.sourceUrl}`);
    if (!DRY_RUN) {
      const payload: Record<string, unknown> = {
        slug: it.slug, name: it.name, operator: it.operator, outputMw: it.outputMw, capacityMwh: it.capacityMwh,
        prefecture: it.prefecture, city: it.city, status: it.status, sourceUrl: it.sourceUrl, body: it.body,
      };
      if (it.cod) payload.cod = it.cod;
      if (it.epc) payload.epc = it.epc;
      const r = await fetch(BASE, { method: 'POST', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(`POST ${it.slug} HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
      const j = await r.json();
      console.log(`      -> created id=${j.id}`);
    }
    post += 1;
  }
  console.log(`\n[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'} POST=${post} skip=${skip}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
