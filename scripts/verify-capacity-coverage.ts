#!/usr/bin/env tsx
/**
 * scripts/verify-capacity-coverage.ts — Cm1 の回帰検査
 *
 * 1. 実データ（src/data/eic/capacity-main-auction-price-*.json 9本）で
 *    coverage 経路と points 経路の値が一致することを検査する。
 *    不一致＝上流異常のシグナル（設計上の不変条件 coverage.last == observation_cutoff が崩れている）。
 * 2. coverage を欠いた fixture で fallback 経路（系列データからの導出）が動くことを検査する。
 * 3. FY ラベルのガード（cutoff_semantics=delivery × frequency=annual 以外に FY を付けない）を検査する。
 *
 * 使い方: npx tsx scripts/verify-capacity-coverage.ts
 */
export {};
import {
  summarizeSeriesCoverage,
  summarizeAreaSeries,
  fiscalYearOf,
  canLabelFiscalYear,
  unionObservedDates,
  type EicSeries,
} from '../src/lib/capacity-market-coverage';

import pHokkaido from '../src/data/eic/capacity-main-auction-price-hokkaido.json';
import pTohoku from '../src/data/eic/capacity-main-auction-price-tohoku.json';
import pTokyo from '../src/data/eic/capacity-main-auction-price-tokyo.json';
import pChubu from '../src/data/eic/capacity-main-auction-price-chubu.json';
import pHokuriku from '../src/data/eic/capacity-main-auction-price-hokuriku.json';
import pKansai from '../src/data/eic/capacity-main-auction-price-kansai.json';
import pChugoku from '../src/data/eic/capacity-main-auction-price-chugoku.json';
import pShikoku from '../src/data/eic/capacity-main-auction-price-shikoku.json';
import pKyushu from '../src/data/eic/capacity-main-auction-price-kyushu.json';

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean, detail = ''): void {
  if (cond) { pass++; console.log(`  OK  ${label}${detail ? ` — ${detail}` : ''}`); }
  else { fail++; console.log(`  NG  ${label}${detail ? ` — ${detail}` : ''}`); }
}

const SERIES = [pHokkaido, pTohoku, pTokyo, pChubu, pHokuriku, pKansai, pChugoku, pShikoku, pKyushu] as unknown as EicSeries[];

console.log('=== 1. 実データ: coverage 経路 と points 経路の一致 ===');
for (const s of SERIES) {
  const sum = summarizeSeriesCoverage(s);
  const id = s.meta?.id ?? s.id ?? '?';
  check(
    `${id}`,
    sum.source === 'coverage' && sum.agrees === true && sum.cutoffMatches === true,
    `${sum.labelFirst}-${sum.labelLast}/${sum.count} source=${sum.source} agrees=${sum.agrees} cutoffMatches=${sum.cutoffMatches}`
  );
  if (sum.warnings.length) sum.warnings.forEach((w) => console.log(`      ⚠ ${w}`));
}

console.log('\n=== 2. エリア集計（見出しに出る値） ===');
const area = summarizeAreaSeries(SERIES);
console.log(`  rangeLabel=${area.rangeLabel} / yearCount=${area.count} / areaCount=${area.areaCount} / recordCount=${area.recordCount}`);
check('rangeLabel が導出できる', !!area.rangeLabel);
check('areaCount が系列数と一致', area.areaCount === SERIES.length, `${area.areaCount}/${SERIES.length}`);
check('recordCount = areaCount × count', area.recordCount === area.areaCount * area.count);
check('coverage と points が一致（不一致は上流異常）', area.agrees === true);
check('不変条件 coverage.last == observation_cutoff', area.cutoffMatches === true);
check('警告なし', area.warnings.length === 0, area.warnings.join(' / '));

console.log('\n=== 3. fallback 経路: coverage を欠いた fixture ===');
const noCoverage: EicSeries = {
  id: 'fixture-no-coverage',
  meta: {
    id: 'fixture-no-coverage',
    frequency: 'annual',
    cutoff_semantics: 'delivery',
    observation_cutoff: '2029-04-01',
    // coverage を意図的に持たせない
  },
  points: [
    { date: '2024-04-01', value: 100 },
    { date: '2025-04-01', value: 110 },
    { date: '2026-04-01', value: 120 },
  ],
};
const fb = summarizeSeriesCoverage(noCoverage);
check('source=points（fallback が動く）', fb.source === 'points', `source=${fb.source}`);
check('labelFirst=FY2024', fb.labelFirst === 'FY2024', String(fb.labelFirst));
check('labelLast=FY2026', fb.labelLast === 'FY2026', String(fb.labelLast));
check('count=3', fb.count === 3, String(fb.count));
check('agrees は null（比較対象なし）', fb.agrees === null);

console.log('\n=== 4. 新年度が着地した場合（FY2030 追加）の自動追従 ===');
const withNewFy: EicSeries = {
  ...noCoverage,
  points: [...(noCoverage.points ?? []), { date: '2027-04-01', value: 130 }, { date: '2028-04-01', value: 140 }, { date: '2029-04-01', value: 150 }, { date: '2030-04-01', value: 160 }],
};
const nf = summarizeSeriesCoverage(withNewFy);
check('FY2030 まで自動で伸びる', nf.labelLast === 'FY2030' && nf.count === 7, `${nf.labelFirst}-${nf.labelLast}/${nf.count}`);
check('観測日の union も 7 点', unionObservedDates([withNewFy]).length === 7);

console.log('\n=== 5. coverage と points が食い違う fixture（上流異常の検出） ===');
const mismatch: EicSeries = {
  id: 'fixture-mismatch',
  meta: {
    id: 'fixture-mismatch',
    frequency: 'annual',
    cutoff_semantics: 'delivery',
    observation_cutoff: '2029-04-01',
    coverage: { first: '2024-04-01', last: '2030-04-01', count: 7, label_first: 'FY2024', label_last: 'FY2030' },
  },
  points: [
    { date: '2024-04-01', value: 1 },
    { date: '2025-04-01', value: 2 },
  ],
};
const mm = summarizeSeriesCoverage(mismatch);
check('表示は coverage を優先', mm.source === 'coverage' && mm.labelLast === 'FY2030');
check('agrees=false を返す', mm.agrees === false);
check('不変条件違反を検出（coverage.last ≠ observation_cutoff）', mm.cutoffMatches === false);
check('警告が2件出る', mm.warnings.length === 2, `${mm.warnings.length}件`);

console.log('\n=== 6. FY ラベルのガード（原資料の保証範囲を超えない） ===');
check('delivery×annual は FY 可', canLabelFiscalYear({ cutoff_semantics: 'delivery', frequency: 'annual' }) === true);
check('observation×annual は FY 不可', canLabelFiscalYear({ cutoff_semantics: 'observation', frequency: 'annual' }) === false);
check('delivery×monthly は FY 不可', canLabelFiscalYear({ cutoff_semantics: 'delivery', frequency: 'monthly' }) === false);
const nonFy = summarizeSeriesCoverage({
  meta: { id: 'fixture-monthly', frequency: 'monthly', cutoff_semantics: 'observation' },
  points: [{ date: '2026-01-01', value: 1 }, { date: '2026-02-01', value: 2 }],
});
check('FY 不可の系列にはラベルを付けない', nonFy.labelFirst === null && nonFy.labelLast === null, `count=${nonFy.count} は数える`);

console.log('\n=== 7. fiscalYearOf（4月始まり） ===');
check("'2024-04-01' → 2024", fiscalYearOf('2024-04-01') === 2024);
check("'2025-03-31' → 2024", fiscalYearOf('2025-03-31') === 2024);
check("'2025-04-01' → 2025", fiscalYearOf('2025-04-01') === 2025);
check("不正な値は null", fiscalYearOf('not-a-date') === null);

console.log(`\n[verify-capacity-coverage] PASS ${pass} / FAIL ${fail}`);
process.exit(fail > 0 ? 1 : 0);
