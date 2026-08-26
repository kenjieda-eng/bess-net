/**
 * 上位20行の並び不一致が「同値（tie）内の入れ替えだけ」かを検証する（読取専用）。
 * 判定: live と core の上位20を「ソートキー値の列」に写像して比較。
 *   値の列が一致していれば、差は tie の中の順序だけ＝宣言済みの変更（名称→slug 固定）で説明できる。
 *   値の列が異なれば、絞り込み・ソートの意味が違う＝実装バグなので停止。
 */
export {};
import fs from 'node:fs';
import { searchSubstationsByFilters, type SubstationSearchFilters } from '../../../src/lib/microcms';
import { searchGridStatic, type GridSearchFilters } from '../../../src/lib/grid-search-core';
import { FROZEN_SUBSTATION_SLUGS } from '../../../src/lib/substations-frozen';

const OPERATORS = ['北海道電力ネットワーク', '東北電力ネットワーク', '東京電力パワーグリッド', '中部電力パワーグリッド',
  '北陸電力送配電', '関西電力送配電', '中国電力ネットワーク', '四国電力送配電', '九州電力送配電', '沖縄電力'];
const AREAS = ['北海道', '東北', '東京', '中部', '北陸', '関西', '中国', '四国', '九州', '沖縄'];
const VOLTS = ['22', '66', '77', '110', '154', '275', '500'];
const NAMES = ['賑橋', '新地', '宮の下', '富士見', '御坊', '柏台', '築地', '佐世保', '大久保', '日宇', '山田', '大野', '新庄', '久留米', '川崎'];

type Q = { label: string; f: SubstationSearchFilters & GridSearchFilters };
const QUERIES: Q[] = [];
for (const op of OPERATORS) for (const cap of ['', '0', '10', '50', '100'])
  QUERIES.push({ label: `op=${op}${cap ? ` cap>=${cap}` : ''}`, f: { operator: op, ...(cap ? { cap_avail_min: cap } : {}) } });
for (const a of AREAS) QUERIES.push({ label: `area=${a}`, f: { area: a } });
for (const v of VOLTS) QUERIES.push({ label: `voltage>=${v}`, f: { voltage_min: v } });
QUERIES.push({ label: 'n1=true', f: { n1_eligible: 'true' } });
QUERIES.push({ label: 'cap 10〜20', f: { cap_avail_min: '10', cap_avail_max: '20' } });
QUERIES.push({ label: 'cap>=22', f: { cap_avail_min: '22' } });
QUERIES.push({ label: 'cap>=100', f: { cap_avail_min: '100' } });
for (const n of NAMES) QUERIES.push({ label: `q=${n}`, f: { q: n } });

(async () => {
  let tieOnly = 0, semantic = 0, same = 0;
  const bad: string[] = [];
  for (const [idx, qq] of QUERIES.entries()) {
    const live = await searchSubstationsByFilters(qq.f);
    const core = searchGridStatic(qq.f);
    const wantN1 = (qq.f.n1_eligible || '') === 'true';
    const keyOf = (r: { cap_avail_mw?: number | null; n1_capacity_mw?: number | null }) =>
      wantN1 ? r.n1_capacity_mw ?? null : r.cap_avail_mw ?? null;
    const liveKeys = live.items.filter((r) => !FROZEN_SUBSTATION_SLUGS.has(r.slug)).slice(0, 20).map((r) => String(keyOf(r)));
    const coreKeys = core.items.slice(0, 20).map((r) => String(keyOf(r)));
    const liveSlugs = live.items.filter((r) => !FROZEN_SUBSTATION_SLUGS.has(r.slug)).slice(0, 20).map((r) => r.slug);
    const coreSlugs = core.items.slice(0, 20).map((r) => r.slug);
    if (JSON.stringify(liveSlugs) === JSON.stringify(coreSlugs)) same++;
    else if (JSON.stringify(liveKeys) === JSON.stringify(coreKeys)) tieOnly++;
    else { semantic++; bad.push(`${qq.label}: liveKeys=${liveKeys.slice(0, 8)} coreKeys=${coreKeys.slice(0, 8)}`); }
    if ((idx + 1) % 20 === 0) console.log(`  [${idx + 1}/${QUERIES.length}] ...`);
    await new Promise((x) => setTimeout(x, 400));
  }
  console.log(`\n完全一致 ${same} / tie内の入替のみ ${tieOnly} / ★意味の差 ${semantic}`);
  for (const b of bad) console.log('  ✗', b);
  // レポートに追記
  const p = 'reports/grid-search-parity-2026-08-25.md';
  const add = [`\n## 並び不一致の内訳（tie 検証）`, '',
    `- 上位20行が完全一致: **${same} / ${QUERIES.length}**`,
    `- ソートキー値の列は同一で tie 内の順序だけが異なる: **${tieOnly}**（宣言済みの変更＝「空容量降順 → 名称 → slug」に固定した影響。microCMS の tie 順は内部順で未定義だった）`,
    `- ソートキー値の列まで異なる（意味の差）: **${semantic}**${semantic ? ' ★要調査' : ''}`, ''].join('\n');
  fs.appendFileSync(p, add);
  console.log(`→ ${p} に追記`);
  process.exitCode = semantic ? 1 : 0;
})();
