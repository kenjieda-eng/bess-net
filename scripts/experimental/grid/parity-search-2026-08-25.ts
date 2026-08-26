/**
 * scripts/experimental/grid/parity-search-2026-08-25.ts
 *
 * Gr11 A案の切り替え前突合（読取専用・microCMS GET のみ）。
 * 現行 searchSubstationsByFilters（runtime microCMS）と新 grid-search-core（precompute）を
 * 同一クエリ集合で実行し、件数と上位20行を比較して reports/ に保存する。
 *
 * 既知の説明可能な差分（レポートで定量化する）:
 *   凍結変電所7件（substations-frozen.json）は precompute 母集団に存在しない。
 *   現行は totalCount に凍結を数えつつ表示行からは隠す（自己不整合）ため、
 *   凍結にマッチするクエリでは totalCount が新実装の方が小さくなる。
 *   → 凍結7件の実フィールドを microCMS から取得し、クエリごとの期待差分を厳密に計算して照合する。
 *
 * 実行: npx tsx --env-file=.env.local scripts/experimental/grid/parity-search-2026-08-25.ts
 */
export {};
import fs from 'node:fs';
import path from 'node:path';
import { searchSubstationsByFilters, type SubstationSearchFilters } from '../../../src/lib/microcms';
import { searchGridStatic, getSearchPopulationTotal, type GridSearchFilters } from '../../../src/lib/grid-search-core';
import { FROZEN_SUBSTATION_SLUGS } from '../../../src/lib/substations-frozen';

const d = process.env.MICROCMS_SERVICE_DOMAIN;
const k = process.env.MICROCMS_API_KEY;
if (!d || !k) { console.error('ERROR: env required'); process.exit(1); }

const OPERATORS = [
  '北海道電力ネットワーク', '東北電力ネットワーク', '東京電力パワーグリッド', '中部電力パワーグリッド',
  '北陸電力送配電', '関西電力送配電', '中国電力ネットワーク', '四国電力送配電', '九州電力送配電', '沖縄電力',
];
const AREAS = ['北海道', '東北', '東京', '中部', '北陸', '関西', '中国', '四国', '九州', '沖縄'];
const VOLTS = ['22', '66', '77', '110', '154', '275', '500'];
const NAMES = ['賑橋', '新地', '宮の下', '富士見', '御坊', '柏台', '築地', '佐世保', '大久保', '日宇',
  '山田', '大野', '新庄', '久留米', '川崎'];

type Q = { label: string; f: SubstationSearchFilters & GridSearchFilters };
const QUERIES: Q[] = [];
for (const op of OPERATORS) {
  for (const cap of ['', '0', '10', '50', '100']) {
    QUERIES.push({ label: `op=${op}${cap ? ` cap>=${cap}` : ''}`, f: { operator: op, ...(cap ? { cap_avail_min: cap } : {}) } });
  }
}
for (const a of AREAS) QUERIES.push({ label: `area=${a}`, f: { area: a } });
for (const v of VOLTS) QUERIES.push({ label: `voltage>=${v}`, f: { voltage_min: v } });
QUERIES.push({ label: 'n1=true', f: { n1_eligible: 'true' } });
QUERIES.push({ label: 'cap 10〜20', f: { cap_avail_min: '10', cap_avail_max: '20' } });
QUERIES.push({ label: 'cap>=22', f: { cap_avail_min: '22' } });
QUERIES.push({ label: 'cap>=100', f: { cap_avail_min: '100' } });
for (const n of NAMES) QUERIES.push({ label: `q=${n}`, f: { q: n } });

/** 凍結7件の実フィールド（クエリごとの期待差分の厳密計算用） */
async function fetchFrozen(): Promise<Array<Record<string, unknown>>> {
  const out: Array<Record<string, unknown>> = [];
  for (const slug of FROZEN_SUBSTATION_SLUGS) {
    const r = await fetch(
      `https://${d}.microcms.io/api/v1/substations?limit=1&filters=slug[equals]${encodeURIComponent(slug)}&fields=slug,name,operator,area,prefecture,voltage_primary_kv,cap_avail_mw,n1_capacity_mw,n1_eligible`,
      { headers: { 'X-MICROCMS-API-KEY': k! } },
    );
    const j = (await r.json()) as { contents: Array<Record<string, unknown>> };
    if (j.contents[0]) out.push(j.contents[0]);
    await new Promise((x) => setTimeout(x, 300));
  }
  return out;
}

function frozenMatches(fz: Array<Record<string, unknown>>, f: SubstationSearchFilters): number {
  const q = (f.q || '').trim(); const area = (f.area || '').trim();
  const vMin = (f.voltage_min || '').trim(); const cMin = (f.cap_avail_min || '').trim();
  const cMax = (f.cap_avail_max || '').trim(); const wantN1 = (f.n1_eligible || '').trim() === 'true';
  const op = (f.operator || '').trim();
  return fz.filter((s) => {
    const name = String(s.name ?? ''); const sop = Array.isArray(s.operator) ? String(s.operator[0] ?? '') : String(s.operator ?? '');
    const sarea = Array.isArray(s.area) ? String(s.area[0] ?? '') : String(s.area ?? '');
    const vp = typeof s.voltage_primary_kv === 'number' ? s.voltage_primary_kv : null;
    const cap = wantN1 ? (typeof s.n1_capacity_mw === 'number' ? s.n1_capacity_mw : null)
      : (typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : null);
    if (q && !name.includes(q)) return false;
    if (area && !sarea.includes(area)) return false;
    if (op && !sop.includes(op)) return false;
    if (vMin) { const v = Number(vMin); if (vp === null || !(vp > v - 0.001)) return false; }
    if (wantN1 && s.n1_eligible !== true) return false;
    if (cMin) { const v = Number(cMin); if (cap === null || !(cap > v - 0.001)) return false; }
    if (cMax) { const v = Number(cMax); if (cap === null || !(cap < v + 0.001)) return false; }
    return true;
  }).length;
}

(async () => {
  console.log(`母集団: precompute=${getSearchPopulationTotal()}件 / クエリ ${QUERIES.length}本`);
  const fz = await fetchFrozen();
  console.log(`凍結: ${fz.length}件を microCMS から取得（期待差分の計算用）`);

  const rows: Array<{ label: string; live: number; core: number; frozenExpected: number; ok: boolean;
    top20Same: boolean; firstDiff: string }> = [];
  let liveFails = 0;

  for (const [idx, qq] of QUERIES.entries()) {
    const live = await searchSubstationsByFilters(qq.f);
    if (live.failed) { liveFails++; console.log(`  [${idx + 1}/${QUERIES.length}] ${qq.label}: ★live取得失敗（再試行）`);
      await new Promise((x) => setTimeout(x, 2000));
      const retry = await searchSubstationsByFilters(qq.f);
      if (!retry.failed) Object.assign(live, retry);
    }
    const core = searchGridStatic(qq.f);
    const fzn = frozenMatches(fz, qq.f);
    const ok = live.totalCount - fzn === core.totalCount;
    // 上位20行（現行は凍結を隠した後の items、新は items）
    const liveTop = live.items.filter((r) => !FROZEN_SUBSTATION_SLUGS.has(r.slug)).slice(0, 20).map((r) => r.slug);
    const coreTop = core.items.slice(0, 20).map((r) => r.slug);
    const top20Same = JSON.stringify(liveTop) === JSON.stringify(coreTop);
    let firstDiff = '';
    if (!top20Same) {
      for (let i = 0; i < Math.max(liveTop.length, coreTop.length); i++) {
        if (liveTop[i] !== coreTop[i]) { firstDiff = `位置${i + 1}: live=${liveTop[i] ?? '-'} core=${coreTop[i] ?? '-'}`; break; }
      }
    }
    rows.push({ label: qq.label, live: live.totalCount, core: core.totalCount, frozenExpected: fzn, ok, top20Same, firstDiff });
    if (!ok) console.log(`  [${idx + 1}] ✗ ${qq.label}: live=${live.totalCount} core=${core.totalCount} 凍結期待差=${fzn}`);
    else if ((idx + 1) % 20 === 0) console.log(`  [${idx + 1}/${QUERIES.length}] ...`);
    await new Promise((x) => setTimeout(x, 400));
  }

  const bad = rows.filter((r) => !r.ok);
  const sameOrder = rows.filter((r) => r.top20Same).length;
  const lines: string[] = [];
  lines.push('# /grid/search 切替前突合（現行 runtime microCMS vs 新 precompute コア）', '');
  lines.push(`実施: 2026-08-25 ／ クエリ ${QUERIES.length}本 ／ 母集団 precompute=${getSearchPopulationTotal()}件`, '');
  lines.push('## 一致条件と結果', '');
  lines.push(`- 件数（凍結期待差分を考慮）: **${rows.length - bad.length} / ${rows.length} 一致**${bad.length ? `（不一致 ${bad.length}）` : ''}`);
  lines.push(`- 上位20行の並び一致: **${sameOrder} / ${rows.length}**（tie の並びは microCMS 内部順に依存していたため「空容量降順 → 名称 → slug」へ固定。差分は tie のみか個別確認）`);
  lines.push(`- live 取得失敗（再試行で回復）: ${liveFails}回`, '');
  lines.push('## 凍結7件による説明可能な差分');
  lines.push('現行は totalCount に凍結を数えつつ表示行からは隠す（自己不整合）。新実装は母集団から凍結を除外し件数と表示が一貫する。', '');
  lines.push('| クエリ | 現行 totalCount | 新 totalCount | 凍結期待差 | 件数一致 | 上位20一致 | 最初の差 |');
  lines.push('|---|---:|---:|---:|:-:|:-:|---|');
  for (const r of rows) {
    lines.push(`| ${r.label} | ${r.live} | ${r.core} | ${r.frozenExpected} | ${r.ok ? '✓' : '✗'} | ${r.top20Same ? '✓' : 'tie差'} | ${r.firstDiff} |`);
  }
  fs.mkdirSync('reports', { recursive: true });
  const out = path.join('reports', 'grid-search-parity-2026-08-25.md');
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`\n件数一致: ${rows.length - bad.length}/${rows.length}（凍結期待差分考慮）/ 上位20一致: ${sameOrder}/${rows.length}`);
  if (bad.length) { console.log('★不一致あり — 切替を止めて報告:'); for (const b of bad) console.log(`   ${b.label}: live=${b.live} core=${b.core} 凍結=${b.frozenExpected}`); }
  console.log(`→ ${out}`);
  process.exitCode = bad.length ? 1 : 0;
})();
