#!/usr/bin/env tsx
/**
 * scripts/verify-balancing-benchmark.ts — 需給調整 入札ベンチマークの否定テスト（T1 実装便・2026-10-08）
 *
 * 設計書 reports/tool-balancing-benchmark-plan-2026-10-08.md (5) の表のうち、ビルド前に機械で確かめられるもの:
 *   I-1 恒等式①（単価に市場平均を入れると差 0・ビット一致）
 *   I-2 恒等式②（12 か月に年平均・約定率 100 → /tools/balancing-revenue の年値と一致。ベンチ側は一致しない）
 *   I-3 日数（12 か月の窓が 365 日。2/29 を含む窓が出たら WARN）
 *   N   null 月（蓄電池ベンチは null・差・上限比・印は出ない・実績と全電源ベンチは出る）
 *   B   期間の境界　E 入力なし・不完全　R 約定率 0・容量 0・範囲外・MW 換算
 *   C   上限（三次②は上限なし・二次②／三次①は印なし・閾値ちょうど・印の件数＝データが変わったら気づく）
 *   M   月内の改定（日数加重）　V CSV の往復
 * D（初期 DOM に事業者名欄・順位・良し悪しの語が無い）はビルド後の HTML で確かめる（報告に記録）。
 *
 * #119: 計算は src/lib/balancing-benchmark-calc.ts・市場データは src/lib/balancing-benchmark-data.ts（画面と同じ関数）。
 * 警告のみ（exit 0）。実行: npm run verify:balancing-benchmark（prebuild でも走る）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const ROOT = process.cwd();
const EIC_DIR = path.join(ROOT, 'src', 'data', 'eic');
const PRODUCTS = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'] as const;
const CAPS = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'composite'] as const;
/** 印の件数（θ＝0.90・R3 案 a・範囲 2024-04〜2026-03 の蓄電池・商品別）。データが変わったら WARN＝表示の印が変わった合図 */
const EXPECTED_NEAR_CAP_MARKS: Record<string, number> = { primary: 5, 'secondary-1': 3, composite: 4 };

const problems: string[] = [];
const passed: string[] = [];
const ok = (name: string, cond: boolean, detail: string) => (cond ? passed.push(name) : problems.push(`${name}: ${detail}`));
const rel = (a: number, b: number) => (a === b ? 0 : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)));

async function main(): Promise<void> {
  console.log('[verify:balancing-benchmark] 入札ベンチマークの否定テスト');
  const need = [
    ...PRODUCTS.flatMap((p) => [`balancing-price-monthly-${p}`, `balancing-price-monthly-${p}-battery`, `balancing-price-${p}-battery`]),
    ...CAPS.map((p) => `balancing-price-cap-${p}`),
  ];
  const missing = need.filter((id) => !fs.existsSync(path.join(EIC_DIR, `${id}.json`)));
  if (missing.length > 0) {
    problems.push(`検査を飛ばした: カタログ ${missing.length} 本が無い（${missing.slice(0, 6).join(', ')}…）。precompute-eic-data の取得失敗の可能性`);
    return;
  }
  const calc = await import('../src/lib/balancing-benchmark-calc');
  const rev = await import('../src/lib/balancing-revenue-calc');
  const data = await import('../src/lib/balancing-benchmark-data');
  const months = data.buildBenchMonths();
  const yms = months.map((m) => m.ym);
  const E = calc.EMPTY_ROW;
  const row = (price: string, rate: string, cap = '') => ({ price, rate, cap });
  const monthly = await import('../src/lib/eprx-monthly');

  // ── 全電源の月次の自己ガード（便 §2: 点の数・null なし・値の範囲。蓄電池のような「月次平均＝年平均」は成り立たない）
  for (const p of PRODUCTS) {
    const all = monthly.getMonthlyPoints('all', p);
    const bat = monthly.getMonthlyPoints('battery', p);
    const allYmSet = new Set(all.map((x) => x.ym));
    const batYmSet = new Set(bat.map((x) => x.ym));
    const onlyAll = [...allYmSet].filter((ym) => !batYmSet.has(ym));
    const onlyBat = [...batYmSet].filter((ym) => !allYmSet.has(ym));
    ok(
      `全電源 ${p} 点の数`,
      all.length === bat.length && onlyAll.length === 0 && onlyBat.length === 0,
      `全電源 ${all.length} 点・蓄電池 ${bat.length} 点（全電源だけ: ${onlyAll.join('・') || 'なし'}／蓄電池だけ: ${onlyBat.join('・') || 'なし'}）`,
    );
    // 上限の無い商品（三次②）の上界: 同じ系列の中央値の 10 倍（実データの全電源 三次②は 0.59〜6.03。外れ値の検出用の目安）
    const vals = all.map((x) => x.value).filter((v): v is number => v !== null).sort((a, b) => a - b);
    const median = vals.length ? vals[Math.floor(vals.length / 2)] : null;
    const nulls = all.filter((x) => x.value === null).map((x) => x.ym);
    ok(`全電源 ${p} null なし`, nulls.length === 0, `null の月 ${nulls.join('・')}`);
    for (const m of months) {
      const v = m.all[p];
      if (v === null) continue;
      // 二次②・三次①は複合の約定が混ざりうる（内訳は資料に無い）ので、単独と複合の上限の大きい方を上界にする。
      // 月内に改定がある月（2026-03）は改定前の上限で約定した日もあるので、日数加重ではなく月内の最大（start と end の大きい方）
      const caps = [m.cap[p], calc.SINGLE_AND_COMPOSITE_CAP_PRODUCTS.includes(p) ? m.cap.composite : null].filter((c): c is NonNullable<typeof c> => c !== null);
      const bound = caps.length > 0 ? Math.max(...caps.map((c) => Math.max(c.start, c.end))) : null;
      const outlier = bound === null && median !== null ? median * 10 : null;
      const inRange = v > 0 && (bound === null || v <= bound) && (outlier === null || v <= outlier);
      if (!inRange) {
        problems.push(
          `全電源 ${p} ${m.ym}: 値 ${v} が範囲外（0 より大きく、${bound !== null ? `その月の上限 ${bound.toFixed(2)}` : `上限が無いので同じ系列の中央値の 10 倍 ${outlier?.toFixed(2)}`} 以下のはず）`,
        );
      }
      else passed.push(`全電源 ${p} ${m.ym} 範囲`);
    }
  }
  // 範囲の月が暦で連続しているか（欠けた月があると期間の選択肢に穴が開き、直近 12 か月が 13 か月にまたがる）
  const gaps: string[] = [];
  for (let i = 1; i < yms.length; i++) {
    const [y0, m0_] = [Number(yms[i - 1].slice(0, 4)), Number(yms[i - 1].slice(5, 7))];
    const expectNext = m0_ === 12 ? `${y0 + 1}-01` : `${y0}-${String(m0_ + 1).padStart(2, '0')}`;
    if (yms[i] !== expectNext) gaps.push(`${yms[i - 1]}→${yms[i]}`);
  }
  ok('範囲の月が連続', gaps.length === 0, `欠けた月がある（${gaps.join('・')}）＝全電源か蓄電池の月次に点の抜け`);

  // ── I-1 恒等式①: 単価に市場平均を入れると差 0（同じ関数・同じ掛け算の並び＝ビット一致）
  let i1 = 0;
  let i1bad = 0;
  for (const p of PRODUCTS) {
    for (const m of months) {
      for (const kind of ['all', 'battery'] as const) {
        const v = kind === 'all' ? m.all[p] : m.battery[p];
        if (v === null) continue;
        const r = calc.computeMonth(p, m, row(String(v), '37', '2000.5'), null);
        const d = kind === 'all' ? r.diffAll : r.diffBattery;
        i1++;
        if (d !== 0) i1bad++;
      }
    }
  }
  ok('I-1 恒等式①（差 0）', i1 > 0 && i1bad === 0, `${i1} セル中 ${i1bad} セルで差が 0 でない（計算の経路が二重の疑い）`);
  // 期間合計でも差 0（設計書 (5) I-1）
  for (const p of PRODUCTS) {
    for (const kind of ['all', 'battery'] as const) {
      const rows = months.map((m) => {
        const v = kind === 'all' ? m.all[p] : m.battery[p];
        return calc.computeMonth(p, m, v === null ? E : row(String(v), '37', '2000.5'), null);
      });
      const t = calc.computeTotals(rows);
      const d = kind === 'all' ? t.diffAll : t.diffBattery;
      ok(`I-1 ${p} ${kind} 期間合計の差 0`, d.diff === 0 && d.months > 0, `期間合計の差 ${d.diff}（${d.months} か月）`);
    }
  }

  // ── 設計書 2-2 の例（固定値）: 向き（Δ÷B）・符号・月の揃え方（両方がある月だけ）・式の絶対値をまとめて確かめる
  {
    const fyYms = yms.filter((ym) => data.fiscalYearOfYm(ym) === 'FY2024');
    const rows = fyYms.map((ym) => calc.computeMonth('secondary-1', months.find((m) => m.ym === ym)!, row('7.71', '100'), 10000));
    const t = calc.computeTotals(rows);
    const near = (a: number | null, b: number) => a !== null && rel(a, b) <= 1e-12;
    ok('例 二次① FY2024 実績（12 か月）', near(t.actual.sum, 1350792000) && t.actual.months === 12, `実績 ${t.actual.sum}（${t.actual.months} か月）`);
    ok('例 二次① FY2024 蓄電池ベンチ（8 か月）', near(t.benchBattery.sum, 897523200) && t.benchBattery.months === 8, `ベンチ ${t.benchBattery.sum}（${t.benchBattery.months} か月）`);
    ok('例 二次① FY2024 対象月の実績の小計', near(t.diffBattery.actual, 895593600) && t.diffBattery.months === 8, `小計 ${t.diffBattery.actual}`);
    ok('例 二次① FY2024 差（実績 − 蓄電池）', near(t.diffBattery.diff, -1929600), `差 ${t.diffBattery.diff}`);
    ok('例 二次① FY2024 差 %（Δ÷B）', near(t.diffBattery.pct, -1929600 / 897523200), `差 % ${t.diffBattery.pct}（期待 ${-1929600 / 897523200}）`);
  }
  // 月単位の差と差 % の向き（表の「差」の列。期間合計とは別の経路なので 1 セルずつ見る）
  {
    const m = months.find((x) => x.battery['secondary-1'] !== null && x.all['secondary-1'] !== null);
    if (m) {
      const r = calc.computeMonth('secondary-1', m, row('7.71', '100'), 10000);
      const K = rev.daysInMonth(m.ym) * 48;
      const A = 7.71 * 10000 * K;
      const Bb = (m.battery['secondary-1'] as number) * 10000 * K;
      const Ba = (m.all['secondary-1'] as number) * 10000 * K;
      const near = (a: number | null, b: number) => a !== null && rel(a, b) <= 1e-12;
      ok(`月の差 蓄電池（${m.ym}）`, near(r.diffBattery, A - Bb) && near(r.diffBatteryPct, (A - Bb) / Bb), `差 ${r.diffBattery}（期待 ${A - Bb}）・差 % ${r.diffBatteryPct}（期待 ${(A - Bb) / Bb}）`);
      ok(`月の差 全電源（${m.ym}）`, near(r.diffAll, A - Ba) && near(r.diffAllPct, (A - Ba) / Ba), `差 ${r.diffAll}（期待 ${A - Ba}）・差 % ${r.diffAllPct}（期待 ${(A - Ba) / Ba}）`);
    } else {
      problems.push('月の差: 二次①に蓄電池と全電源の両方がある月が無いので未検査');
    }
  }
  // 手で計算した 1 セル（式の絶対値: 12.34 円 × 1000 kW × その月の日数×48 × 37%）
  {
    const m = months[months.length - 1];
    const r = calc.computeMonth('primary', m, row('12.34', '37'), 1000);
    const hand = 12.34 * 1000 * rev.daysInMonth(m.ym) * 48 * 0.37;
    ok('手計算の 1 セル', r.actual !== null && rel(r.actual, hand) <= 1e-12, `${r.actual} ≠ ${hand}`);
  }

  // ── I-2 恒等式②: 年度の 12 か月に年平均・約定率 100・10,000kW → 収益シナリオの年値と一致（実績側だけ）
  const fys = [...new Set(yms.map(data.fiscalYearOfYm))];
  let i2 = 0;
  const benchGaps: string[] = [];
  for (const fy of fys) {
    const fyYms = yms.filter((ym) => data.fiscalYearOfYm(ym) === fy);
    if (fyYms.length !== 12) continue;
    const date = `${fy.slice(2)}-04-01`;
    for (const p of PRODUCTS) {
      const annual = JSON.parse(fs.readFileSync(path.join(EIC_DIR, `balancing-price-${p}-battery.json`), 'utf8')) as { points: { date: string; value: number | null }[] };
      const A = annual.points.find((x) => x.date === date)?.value;
      if (typeof A !== 'number') continue;
      const rows = fyYms.map((ym) => calc.computeMonth(p, months.find((m) => m.ym === ym)!, row(String(A), '100'), 10000));
      const t = calc.computeTotals(rows);
      const target = rev.balancingRevenueYen(A, 10000, rev.BLOCKS_PER_YEAR, 100);
      i2++;
      ok(`I-2 ${fy} ${p}（実績＝年値）`, t.actual.sum !== null && rel(t.actual.sum, target) <= 1e-12, `実績 ${t.actual.sum} ≠ 年値 ${target}`);
      // 対になる否定: 蓄電池ベンチ（月次×日数）は年平均×17,520 と一致しない
      const benchGap = t.benchBattery.sum === null ? null : (t.benchBattery.sum - target) / target;
      benchGaps.push(`${fy} ${p} ${benchGap === null ? '—' : `${(benchGap * 100).toFixed(3)}%`}`);
      ok(`I-2 ${fy} ${p}（ベンチは年値と別物）`, benchGap !== null && Math.abs(benchGap) > 1e-6, `蓄電池ベンチが年値と一致した（${benchGap}）＝前提が変わった`);
    }
  }
  ok('I-2 件数', i2 >= 12, `検査できた組が ${i2}（12 以上のはず）`);

  // ── I-3 日数: 12 か月の窓
  // 月が欠けていると 12 か月の窓が 13 暦月にまたがるので、連続のときだけ見る（欠けは上の「範囲の月が連続」が WARN）
  if (gaps.length === 0) {
    const leapWindows: string[] = [];
    for (let i = 0; i + 12 <= yms.length; i++) {
      const days = yms.slice(i, i + 12).reduce((s, ym) => s + rev.daysInMonth(ym), 0);
      if (days !== 365) leapWindows.push(`${yms[i]}〜${yms[i + 11]}=${days}日`);
    }
    ok('I-3 12 か月の窓は 365 日', leapWindows.length === 0, `うるう日を含む窓がある（${leapWindows.slice(0, 3).join('・')}）。/tools/balancing-revenue の 365×48 固定と 0.274% ずれる＝どちらに寄せるか判断する`);
  } else {
    problems.push('I-3 12 か月の窓: 範囲の月が連続でないので未検査');
  }
  ok('I-3 月のコマ数', rev.blocksInMonth('2025-02') === 28 * 48 && rev.blocksInMonth('2028-02') === 29 * 48 && rev.blocksInMonth('2025-03') === 31 * 48, 'blocksInMonth が日数×48 でない');

  // ── N: 蓄電池の null 月
  let nullCells = 0;
  for (const p of PRODUCTS) {
    for (const m of months) {
      if (m.battery[p] !== null) continue;
      nullCells++;
      const r = calc.computeMonth(p, m, row('5', '50'), 1000);
      ok(
        `N ${p} ${m.ym}`,
        r.benchBattery === null && r.diffBattery === null && r.ratioBattery === null && !r.nearCap && r.actual !== null && r.benchAll !== null,
        `null 月の扱いが違う（ベンチ ${r.benchBattery}・差 ${r.diffBattery}・上限比 ${r.ratioBattery}・印 ${r.nearCap}・実績 ${r.actual}・全電源 ${r.benchAll}）`,
      );
    }
  }
  ok('N 件数', nullCells > 0, '蓄電池の null 月が 0（データが変わった）');

  // ── B: 期間の境界
  const first = yms[0];
  const last = yms[yms.length - 1];
  const prev = (ym: string) => { const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 2, 1)); return d.toISOString().slice(0, 7); };
  const next = (ym: string) => { const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 1)); return d.toISOString().slice(0, 7); };
  ok('B 範囲全体', calc.periodError(yms, first, last) === null, '範囲の最初〜最後がエラー');
  ok('B 範囲の前', calc.periodError(yms, prev(first), last) !== null, `${prev(first)} を受け付けた`);
  ok('B 範囲の後', calc.periodError(yms, first, next(last)) !== null, `${next(last)} を受け付けた`);
  ok('B 開始 > 終了', calc.periodError(yms, last, first) !== null, '開始 > 終了を受け付けた');
  ok('B 1 か月', calc.periodError(yms, last, last) === null, '1 か月の期間がエラー');
  const dp = calc.defaultPeriod(yms);
  ok('B 既定の期間', dp.end === last && calc.monthsInRange(yms, dp.start, dp.end).length === Math.min(12, yms.length), `既定 ${dp.start}〜${dp.end}`);

  // ── E: 入力なし・不完全・0
  const m0 = months[months.length - 1];
  const tBlank = calc.computeTotals([calc.computeMonth('primary', m0, E, 1000)]);
  ok('E 全部空欄', tBlank.actual.sum === null && tBlank.actual.months === 0 && tBlank.incompleteMonths === 0, '空欄が 0 として数えられた');
  const rPart = calc.computeMonth('primary', m0, row('10', ''), 1000);
  ok('E 単価だけ', !rPart.complete && rPart.incomplete && rPart.actual === null, '不完全の月が計算に入った');
  const rNoCap = calc.computeMonth('primary', m0, row('10', '50'), null);
  ok('E 容量なし', !rNoCap.complete && rNoCap.incomplete, '容量が無い月が計算に入った');
  const rZero = calc.computeMonth('primary', m0, row('0', '50'), 1000);
  ok('E 0 は 0', rZero.complete && rZero.actual === 0, '0 を入れた月が 0 として数えられない');

  // ── R: 約定率 0・容量 0・範囲外・MW 換算
  const rRate0 = calc.computeMonth('primary', m0, row('10', '0'), 1000);
  ok('R 約定率 0', rRate0.actual === 0 && rRate0.benchAll === 0 && rRate0.diffAllPct === null, `約定率 0 の扱い（差 % ${rRate0.diffAllPct}）`);
  const rCap0 = calc.computeMonth('primary', m0, row('10', '50', '0'), 1000);
  ok('R 容量 0（上書き）', rCap0.actual === 0 && rCap0.benchAll === 0 && rCap0.diffAllPct === null, '容量 0 の扱い');
  ok('R 約定率 100 超', calc.computeMonth('primary', m0, row('10', '101'), 1000).invalidFields.includes('約定率'), '101% を受け付けた');
  ok('R 負の単価', calc.computeMonth('primary', m0, row('-1', '50'), 1000).invalidFields.includes('単価'), '負の単価を受け付けた');
  ok('R 負の容量', calc.computeMonth('primary', m0, row('10', '50', '-5'), 1000).invalidFields.includes('容量'), '負の容量を受け付けた');
  for (const [mw, kw] of [['10', 10000], ['1.005', 1005], ['2.0005', 2000.5], ['0.5', 500]] as const) {
    ok(`R MW ${mw}`, calc.capacityKwOf(mw, 'MW') === kw, `${mw} MW → ${calc.capacityKwOf(mw, 'MW')} kW（期待 ${kw}）`);
    const a = calc.computeMonth('primary', m0, row('12.34', '37'), calc.capacityKwOf(mw, 'MW')).actual;
    const b = calc.computeMonth('primary', m0, row('12.34', '37'), kw).actual;
    ok(`R MW ${mw} と kW ${kw} が同じ結果`, a !== null && b !== null && rel(a, b) <= 1e-12, `${a} ≠ ${b}`);
  }
  ok('R MW の不正', Number.isNaN(calc.capacityKwOf('abc', 'MW') as number), '不正な MW を受け付けた');
  // 数の読み取り（3 桁区切りだけ・有限・-0 は 0・'.5' と '5.' は受ける）
  const pn = calc.parseNumberText;
  for (const [t, want] of [['12,34', 'invalid'], [',', 'invalid'], ['0,500', 'invalid'], ['9'.repeat(400), 'invalid'], ['1,234', 1234], ['１，２３４', 1234], ['-0', 0], ['.5', 0.5], ['5.', 5]] as const) {
    const r = pn(t);
    const good = want === 'invalid' ? r.invalid : !r.invalid && Object.is(r.value, want);
    ok(`R 数の読み取り「${t.slice(0, 8)}」`, good, `${JSON.stringify(r)}（期待 ${want}）`);
  }

  // ── C: 上限
  let marks = 0;
  const marksBy: Record<string, number> = {};
  const markYms: Record<string, string[]> = {};
  for (const p of PRODUCTS) {
    for (const m of months) {
      const r = calc.computeMonth(p, m, E, null);
      if (p === 'tertiary-2') ok(`C 三次② ${m.ym}`, r.cap === null && r.ratioBattery === null && !r.nearCap, '三次②に上限・比率・印が出た');
      if (calc.SINGLE_AND_COMPOSITE_CAP_PRODUCTS.includes(p)) ok(`C ${p} ${m.ym} 印なし`, !r.nearCap && r.compositeCap !== null, '二次②・三次①に印が付いたか複合の上限が無い');
      if (r.nearCap) {
        marks++;
        marksBy[p] = (marksBy[p] ?? 0) + 1;
        (markYms[p] ??= []).push(m.ym);
      }
    }
  }
  for (const [p, n] of Object.entries(EXPECTED_NEAR_CAP_MARKS)) {
    ok(`C 印の件数 ${p}`, (marksBy[p] ?? 0) === n, `${p} の印 ${marksBy[p] ?? 0} 件（期待 ${n}・印の月 ${(markYms[p] ?? []).join('・') || 'なし'}）＝データか規則が変わった。表示の印が変わるので確かめる`);
  }
  // 上限比の分母は日数加重の effective（月初・月末ではない）・全電源の比は全電源の平均・複合の比は複合の上限
  {
    const mar = months.find((m) => m.ym === '2026-03');
    if (mar) {
      const r1 = calc.computeMonth('primary', mar, E, null);
      const c1 = mar.cap.primary;
      ok('C 上限比の分母（日数加重）', c1 !== null && r1.ratioBattery !== null && mar.battery.primary !== null && r1.ratioBattery === mar.battery.primary / c1.effective, `ratioBattery ${r1.ratioBattery}`);
      ok('C 全電源の上限比', c1 !== null && r1.ratioAll !== null && mar.all.primary !== null && r1.ratioAll === mar.all.primary / c1.effective, `ratioAll ${r1.ratioAll}`);
      const r2 = calc.computeMonth('secondary-2', mar, E, null);
      const cc = mar.cap.composite;
      ok('C 複合の上限比（二次②）', cc !== null && r2.ratioBatteryComposite !== null && mar.battery['secondary-2'] !== null && r2.ratioBatteryComposite === mar.battery['secondary-2'] / cc.effective, `ratioBatteryComposite ${r2.ratioBatteryComposite}`);
    } else {
      problems.push('C 上限比の分母: 2026-03（月内改定の月）が範囲に無いので未検査＝範囲が変わった。検査の月を選び直す');
    }
  }
  ok('C 閾値ちょうど（90%）', calc.isNearCap(calc.capRatio(9, { start: 10, end: 10, changedOn: null, effective: 10 })), '9/10 に印が付かない');
  ok('C 閾値ちょうど（98%・閾値を渡す）', calc.isNearCap(calc.capRatio(14.7, { start: 15, end: 15, changedOn: null, effective: 15 }), 0.98), '14.70/15 が 0.98 以上と判定されない');
  ok('C 閾値の手前', !calc.isNearCap(calc.capRatio(8.99, { start: 10, end: 10, changedOn: null, effective: 10 })), '8.99/10 に印が付いた');
  const expectedTotal = Object.values(EXPECTED_NEAR_CAP_MARKS).reduce((a, b) => a + b, 0);
  ok(`C 印の件数 合計（θ＝${calc.CAP_NEAR_RATIO}・案 a）`, marks === expectedTotal, `印 ${marks} 件（期待 ${expectedTotal}）＝データか規則が変わった。表示の印が変わるので確かめる`);

  // ── M: 月内の改定（日数加重）
  let changed = 0;
  for (const p of CAPS) {
    // 上限のある商品で、範囲内に上限が null の月と値のある月が混ざる＝月の途中から上限が始まる（表に「上限なし」と出る）
    const nullYms = months.filter((m) => m.cap[p] === null).map((m) => m.ym);
    ok(`M ${p} 上限の欠け`, nullYms.length === 0 || nullYms.length === months.length, `範囲内で上限が無い月がある（${nullYms.join('・')}）＝月の途中から始まる上限か、カタログの点の欠け`);
    for (const m of months) {
      const c = m.cap[p];
      if (!c) continue;
      const days = rev.daysInMonth(m.ym);
      if ((c.changeCount ?? 0) > 1) {
        // 1 か月に 2 回以上の改定は今のデータに無い。表示は「ほか」付きで出るが、ここの式（1 回の改定）では確かめられない
        problems.push(`M ${p} ${m.ym}: 月内の改定が ${c.changeCount} 回（1 回を前提にした検査では確かめられない。表示「${calc.formatCap(c)}」を目で確かめる）`);
        continue;
      }
      if (c.changedOn) {
        changed++;
        const k = Number(c.changedOn.slice(8, 10)) - 1; // 改定前の日数
        const expect = (c.start * k + c.end * (days - k)) / days;
        ok(`M ${p} ${m.ym}`, Math.abs(c.effective - expect) < 1e-9 && calc.formatCap(c).includes('→'), `日数加重 ${c.effective}（期待 ${expect}）・表示 ${calc.formatCap(c)}`);
      } else {
        ok(`M ${p} ${m.ym} 改定なし`, c.start === c.end && c.effective === c.start, '改定の無い月で start・end・effective が揃わない');
      }
    }
  }
  ok('M 月内改定の件数', changed === 3, `月内改定 ${changed} 件（期待 3＝2026-03 の一次・二次①・複合）＝データか範囲が変わった`);
  const mar = months.find((m) => m.ym === '2026-03')?.cap.primary;
  if (mar) ok('M 2026-03 一次（既知の値）', Math.abs(mar.effective - 16.8913) < 1e-4 && mar.changedOn === '2026-03-14', `2026-03 の一次の上限 ${JSON.stringify(mar)}`);
  else problems.push('M 2026-03 一次（既知の値）: 2026-03 が範囲に無いので未検査＝範囲が変わった');

  // ── V: CSV の往復
  const vYms = yms.slice(-4);
  const vRows = { [vYms[0]]: row('12.5', '', '0'), [vYms[1]]: row('0', '30', ''), [vYms[2]]: row('', '', '') };
  const csv = calc.serializeCsv(vYms, vRows);
  const back = calc.parseCsv(csv, yms);
  const same = vYms.every((ym) => {
    const a = vRows[ym] ?? E;
    const b = back.rows[ym] ?? E;
    return a.price === b.price && a.rate === b.rate && a.cap === b.cap;
  });
  ok('V 往復で空欄と 0 が保たれる', same && back.rejected.length === 0, `往復で値が変わった（${JSON.stringify(back.rows)}）`);
  const extra = calc.parseCsv(`${calc.CSV_HEADER.join(',')},事業者名\n${vYms[0]},10,50,,株式会社サンプル`, yms);
  ok('V 余計な列は無視', extra.accepted === 1 && JSON.stringify(extra.rows[vYms[0]]) === JSON.stringify(row('10', '50', '')), '5 列目を読んだ');
  const bad = calc.parseCsv(
    [calc.CSV_HEADER.join(','), `${prev(first)},10,50,`, `${vYms[0]},10,50,`, `${vYms[0]},11,50,`, `${vYms[1]},abc,50,`, `${vYms[2]},-1,50,`, `${vYms[3]},10,150,`].join('\n'),
    yms,
  );
  ok('V 拒否（範囲外・重複・数値でない・負・100 超）', bad.accepted === 1 && bad.rejected.length === 5, `受け付け ${bad.accepted}・拒否 ${bad.rejected.length}（${bad.rejected.map((r) => r.reason).join('／')}）`);

  console.log(`[verify:balancing-benchmark] 範囲 ${first}〜${last}（${yms.length} か月）・恒等式① ${i1} セル・恒等式② ${i2} 組・蓄電池の null 月 ${nullCells}・印 ${marks} 件・月内改定 ${changed}`);
  console.log(`[verify:balancing-benchmark] 参考: 蓄電池ベンチ ÷ 年値 − 1: ${benchGaps.join('・')}`);
}

main()
  .catch((e) => problems.push(`検査が例外で途中で止まった: ${(e as Error).message}`))
  .finally(() => {
    if (problems.length === 0) {
      console.log(`[verify:balancing-benchmark] ok   ${passed.length} 件すべて期待どおり`);
    } else {
      console.warn('');
      console.warn(`[verify:balancing-benchmark] ★★★ WARN ${problems.length} 件が期待と違う（${passed.length} 件は ok） ★★★`);
      for (const p of problems.slice(0, 40)) console.warn(`   - ${p}`);
      if (problems.length > 40) console.warn(`   …ほか ${problems.length - 40} 件`);
      console.warn('');
    }
    process.exit(0);
  });
