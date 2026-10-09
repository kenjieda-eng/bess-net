#!/usr/bin/env tsx
/**
 * scripts/verify-lender-view.ts — IRR シミュレーターの「貸し手の見方」の否定テスト（T4 レンダー視点便・2026-10-09）
 *
 * 便 §2 の検証のうち、ビルド前に機械で確かめられるもの:
 *   L0  恒等式: LTV 0%（借入 0）→ DSCR 表なし・保険料 0 ならエクイティ IRR ＝ プロジェクト IRR（ビット一致）
 *   A   元利均等の年払い ＝ 借入額 × 年金係数（既知の値・Decimal で別に計算）・最終年の残高 0・r＝0 は D/m
 *   P   元金均等の総支払利息 ＝ 公式値（D×r×(m+1)/2 ＋ 据置 g 年の利息 D×r×g）
 *   M   要求水準を満たす最大借入額を入れたとき、最小 DSCR ＝ 要求水準（相対 1e-9）・上限 LTV 100% の扱い
 *   C   上限価格シナリオの区間（capSegments）の値と期間が capTimeline と一致・区間の数（今は 4）
 *   R   上限値の置き換え: 置き換えた需給調整収益（既存の式の経路）＝ 上限 × kW × 17,520 × 落札率（相対 1e-12）
 *   E   エクイティ IRR（借入あり・保険料あり）: 検査側で組んだ CF 列の NPV がその IRR で 0／符号が 2 回以上変わる CF は「一意に定まらない」
 *   B   最大借入額の境目（×(1−1e-6) で下回る年なし・×(1+1e-6) であり）・LTV 換算・上限 100%・営業 CF が 0 を跨ぐ案件で独立の二分探索と一致
 *   V   入力の判定（返済期間＞耐用年数・LTV 120・金利 −1・据置＝返済期間 などは invalid）・返済期間が耐用年数を超える計算は出さない
 *   N   入力が揃わない・範囲外・極端な値（極小の金利を含む）でも NaN・Infinity を出さない
 *   U   URL の往復（空欄は書かない・方式の不正値は捨てる）
 * 既存の 3 シナリオの結果の不変は、ビルド済み HTML の見える本文（新しい節の外）で確かめる（報告に記録）。
 *
 * #119: 計算は src/lib/lender-view-calc.ts・営業 CF と IRR は src/lib/irr-calculator.ts（画面と同じ関数）。
 * 警告のみ（exit 0）。実行: npm run verify:lender-view（prebuild でも走る）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const ROOT = process.cwd();
const EIC_DIR = path.join(ROOT, 'src', 'data', 'eic');
/** 上限価格の区間の数（19.51・15.00・10.00＝一次・二次①・複合／7.21＝二次②・三次①）。データが変わったら WARN＝ボタンが変わる合図 */
const EXPECTED_CAP_SEGMENTS = 4;

const problems: string[] = [];
const passed: string[] = [];
const ok = (name: string, cond: boolean, detail: string) => (cond ? passed.push(name) : problems.push(`${name}: ${detail}`));
const rel = (a: number, b: number) => (a === b ? 0 : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)));
const finiteOrNull = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v));

async function main(): Promise<void> {
  console.log('[verify:lender-view] 貸し手の見方の否定テスト');
  const caps = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'composite'].map((p) => `balancing-price-cap-${p}`);
  const missing = caps.filter((id) => !fs.existsSync(path.join(EIC_DIR, `${id}.json`)));
  const lv = await import('../src/lib/lender-view-calc');
  const irr = await import('../src/lib/irr-calculator');
  const defs = await import('../src/lib/irr-defaults');
  const rev = await import('../src/lib/balancing-revenue-calc');
  const SCEN = ['optimistic', 'standard', 'pessimistic'] as const;
  const inputsOf = (preset: 'large-scale' | 'high-voltage') => defs.applyPreset(preset);
  const T = (o: Partial<import('../src/lib/lender-view-calc').LenderTextInput>) => ({ ...lv.EMPTY_LENDER_INPUT, ...o });
  const paramsOf = (o: Partial<import('../src/lib/lender-view-calc').LenderTextInput>, life: number) => {
    const p = lv.parseLenderInput(T(o), life);
    if (p.status !== 'ok') throw new Error(`入力が ok にならない: ${JSON.stringify(o)} → ${JSON.stringify(p)}`);
    return p.params;
  };

  // ── L0: 借入 0 の恒等式（2 プリセット × 3 シナリオ・2 方式）
  let l0 = 0;
  for (const preset of ['large-scale', 'high-voltage'] as const) {
    const ins = inputsOf(preset);
    for (const k of SCEN) {
      for (const method of ['annuity', 'equal-principal'] as const) {
        const r = lv.computeLenderView(ins[k], paramsOf({ ltv: '0', rate: '2', term: '10', method }, ins[k].lifespan_years));
        const base = irr.calcIRR(ins[k]);
        l0++;
        ok(`L0 ${preset} ${k} ${method} DSCR 表なし`, r.minDscr === null && r.years.every((y) => y.dscr === null && y.debtServiceYen === 0), `借入 0 なのに元利払いか DSCR がある（最小 ${JSON.stringify(r.minDscr)}）`);
        ok(`L0 ${preset} ${k} ${method} エクイティ IRR ＝ プロジェクト IRR`, r.equityIrr === base && r.projectIrr === base, `エクイティ ${r.equityIrr}・プロジェクト ${r.projectIrr}・calcIRR ${base}`);
      }
    }
  }
  // 既存の IRR と同じ計算の経路（初期投資と年次 CF をそのまま入れるとビット一致）
  for (const k of SCEN) {
    const inp = defs.getScenarioInput(k);
    const cfs = [-lv.capexNetYen(inp), ...Array.from({ length: inp.lifespan_years }, (_, i) => irr.annualCashflowYen(inp, i + 1))];
    ok(`L0 irrFromCashflowsYen ＝ calcIRR（${k}）`, irr.irrFromCashflowsYen(cfs) === irr.calcIRR(inp), `${irr.irrFromCashflowsYen(cfs)} ≠ ${irr.calcIRR(inp)}`);
    ok(`L0 npvFromCashflowsYen ＝ calcNPV（${k}）`, irr.npvFromCashflowsYen(cfs, 0.05) === irr.calcNPV(inp, 0.05), `${irr.npvFromCashflowsYen(cfs, 0.05)} ≠ ${irr.calcNPV(inp, 0.05)}`);
  }

  // ── A: 元利均等（Decimal で別に計算した値）
  {
    const s = lv.debtSchedule(1e9, 2, 10, 0, 'annuity');
    ok('A 年金係数 2%・10 年', rel(lv.annuityFactor(2, 10), 0.1113265278653164454657377340699503) <= 1e-12, `${lv.annuityFactor(2, 10)}`);
    ok('A 年払い 10 億円・2%・10 年', s.length === 10 && s.every((y) => rel(y.paymentYen, 111326527.8653164454657) <= 1e-12), `年払い ${s.map((y) => y.paymentYen).join(',')}`);
    ok('A 最終年の残高 0', Math.abs(s[9].balanceEndYen) <= 1e-6, `残高 ${s[9].balanceEndYen}`);
    ok('A 年金係数 1.5%・15 年', rel(lv.annuityFactor(1.5, 15), 0.0749443556557385357375679267915) <= 1e-12, `${lv.annuityFactor(1.5, 15)}`);
    const z = lv.debtSchedule(1.2e9, 0, 12, 0, 'annuity');
    ok('A 金利 0 は D/m', z.every((y) => y.paymentYen === 1e8 && y.interestYen === 0), `${z.map((y) => y.paymentYen).join(',')}`);
    const g = lv.debtSchedule(1e9, 2, 12, 2, 'annuity');
    ok('A 据置 2 年は利息だけ', g[0].paymentYen === 2e7 && g[1].paymentYen === 2e7 && g[0].principalYen === 0, `${g[0].paymentYen}・${g[1].paymentYen}`);
    ok('A 据置の後は残り 10 年の元利均等', g.slice(2).every((y) => rel(y.paymentYen, 111326527.8653164454657) <= 1e-12) && Math.abs(g[11].balanceEndYen) <= 1e-6, `${g[2].paymentYen}・残高 ${g[11].balanceEndYen}`);
  }

  // ── P: 元金均等の総支払利息
  {
    const s = lv.debtSchedule(1e9, 2, 10, 0, 'equal-principal');
    const ti = s.reduce((a, y) => a + y.interestYen, 0);
    ok('P 総支払利息 10 億円・2%・10 年 ＝ 1.1 億円', rel(ti, 1.1e8) <= 1e-12, `${ti}`);
    ok('P 元金は毎年 D/m・最終残高 0', s.every((y) => rel(y.principalYen, 1e8) <= 1e-12) && Math.abs(s[9].balanceEndYen) <= 1e-6, `元金 ${s[0].principalYen}・残高 ${s[9].balanceEndYen}`);
    const g = lv.debtSchedule(1e9, 2, 12, 2, 'equal-principal');
    const tg = g.reduce((a, y) => a + y.interestYen, 0);
    ok('P 据置 2 年つきの総支払利息 ＝ 1.5 億円', rel(tg, 1.5e8) <= 1e-12, `${tg}`);
  }

  // ── M: 最大借入額を入れると最小 DSCR ＝ 要求水準
  let m = 0;
  for (const preset of ['large-scale', 'high-voltage'] as const) {
    const ins = inputsOf(preset);
    for (const k of SCEN) {
      for (const method of ['annuity', 'equal-principal'] as const) {
        for (const [req, grace, insurance] of [['1.3', '', ''], ['1.2', '1', '5000000'], ['2.5', '0', '']] as const) {
          const life = ins[k].lifespan_years;
          const p = paramsOf({ ltv: '50', rate: '2.5', term: String(life - 2), method, dscrReq: req, grace, insurance }, life);
          const r = lv.computeLenderView(ins[k], p);
          if (!r.maxDebt) {
            problems.push(`M ${preset} ${k} ${method} req ${req}: 最大借入額が出ない`);
            continue;
          }
          m++;
          const ltvMax = (r.maxDebt.yen / r.capexNetYen) * 100;
          const r2 = lv.computeLenderView(ins[k], { ...p, ltvPct: ltvMax });
          if (r.maxDebt.capped) {
            ok(`M ${preset} ${k} ${method} req ${req}（LTV 100% でも満たす）`, r2.minDscr !== null && r2.minDscr.value >= Number(req) - 1e-9, `LTV 100% の最小 DSCR ${r2.minDscr?.value}`);
          } else if (r.maxDebt.yen === 0) {
            ok(`M ${preset} ${k} ${method} req ${req}（借入できない）`, r.years.some((y) => y.cfYen - p.insuranceYen <= 0), '最大借入額 0 なのに営業 CF − 保険料が全年で正');
          } else {
            ok(`M ${preset} ${k} ${method} req ${req} 最小 DSCR ＝ 要求水準`, r2.minDscr !== null && rel(r2.minDscr.value, Number(req)) <= 1e-9, `最小 DSCR ${r2.minDscr?.value}（要求 ${req}・借入 ${r.maxDebt.yen}）`);
            // 少しでも多く借りると要求水準を下回る（最大であること）
            const r3 = lv.computeLenderView(ins[k], { ...p, ltvPct: ltvMax * (1 + 1e-6) });
            ok(`M ${preset} ${k} ${method} req ${req} それより多いと下回る`, r3.minDscr !== null && r3.minDscr.value < Number(req), `最小 DSCR ${r3.minDscr?.value}`);
          }
        }
      }
    }
  }
  ok('M 件数', m >= 30, `検査できた組が ${m}（36 のはず）`);

  // ── C: 上限価格の区間（サーバが渡す値）＝ capTimeline
  if (missing.length > 0) {
    problems.push(`C を飛ばした: カタログ ${missing.length} 本が無い（${missing.join(', ')}）。precompute-eic-data の取得失敗の可能性`);
  } else {
    const cap = await import('../src/lib/balancing-cap');
    const segs = cap.capSegments();
    ok('C 区間の数', segs.length === EXPECTED_CAP_SEGMENTS, `区間 ${segs.length}（期待 ${EXPECTED_CAP_SEGMENTS}）＝データが変わった。ボタンの数と期間が変わるので確かめる（${segs.map((s) => `${s.value}@${s.from}〜${s.to ?? ''}`).join('・')}）`);
    const dayAfter = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    for (const s of segs) {
      for (const p of s.products) {
        ok(`C ${s.value} ${p} 開始日`, cap.capAt(p, s.from) === s.value, `capAt(${p}, ${s.from}) ＝ ${cap.capAt(p, s.from)}`);
        if (s.to) {
          ok(`C ${s.value} ${p} 最終日`, cap.capAt(p, s.to) === s.value && cap.capAt(p, dayAfter(s.to)) !== s.value, `capAt(${p}, ${s.to}) ＝ ${cap.capAt(p, s.to)}・翌日 ${cap.capAt(p, dayAfter(s.to))}`);
        } else {
          const last = cap.capTimeline(p).slice(-1)[0];
          ok(`C ${s.value} ${p} 継続中＝最後の点の値`, last?.value === s.value, `最後の点 ${JSON.stringify(last)}`);
        }
      }
    }
    // capTimeline に出る値はすべてどれかの区間にある（取りこぼしなし）
    for (const p of cap.CAP_PRODUCT_KEYS) {
      for (const pt of cap.capTimeline(p)) {
        ok(`C 点 ${p} ${pt.date}`, segs.some((s) => s.products.includes(p) && s.value === pt.value && s.from <= pt.date && (s.to === null || pt.date <= s.to)), `capTimeline の ${pt.date}=${pt.value} がどの区間にも入らない`);
      }
    }
    const order = segs.map((s) => s.value);
    ok('C 並び（値の大きい順）', order.every((v, i) => i === 0 || order[i - 1] >= v), `${order.join('・')}`);
  }

  // ── R: 上限値の置き換え（既存の式の経路で同じ年額になる）
  for (const [capV, rate] of [[19.51, 100], [15, 37], [10, 100], [7.21, 0]] as const) {
    for (const k of SCEN) {
      const inp = defs.getScenarioInput(k);
      const kw = inp.output_mw * 1000;
      const annual = lv.capUpperRevenueYen(capV, kw, rate);
      const hand = capV * kw * rev.BLOCKS_PER_YEAR * (rate / 100);
      const viaModel = irr.ancillaryRevenueYen(lv.withAncillaryAnnualYen(inp, annual));
      ok(`R ${capV}×${rate}% ${k}`, rel(annual, hand) <= 1e-12 && (annual === 0 ? viaModel === 0 : rel(viaModel, annual) <= 1e-12), `上限 ${annual}・手計算 ${hand}・既存の式の経路 ${viaModel}`);
    }
  }
  ok('R 1 年のコマ数', rev.BLOCKS_PER_YEAR === 17520, `${rev.BLOCKS_PER_YEAR}`);

  // ── E: エクイティ IRR（借入あり・保険料あり）。検査側で CF 列を組み直し、その IRR で NPV が 0 になることを見る
  let eCount = 0;
  for (const k of SCEN) {
    const inp = defs.getScenarioInput(k);
    const life = inp.lifespan_years;
    for (const [method, grace] of [['annuity', '0'], ['annuity', '2'], ['equal-principal', '1']] as const) {
      const p = paramsOf({ ltv: '60', rate: '2', term: String(life - 3), method, grace, insurance: '10000000' }, life);
      const r = lv.computeLenderView(inp, p);
      const capexNet = inp.capex_oku * 1e8 * (1 - inp.subsidy_rate / 100);
      const debt = capexNet * 0.6;
      const sched = lv.debtSchedule(debt, 2, life - 3, Number(grace), method);
      const eqCfs = [-(capexNet - debt), ...Array.from({ length: life }, (_, i) => irr.annualCashflowYen(inp, i + 1) - 1e7 - (sched[i]?.paymentYen ?? 0))];
      const netCfs = [-capexNet, ...Array.from({ length: life }, (_, i) => irr.annualCashflowYen(inp, i + 1) - 1e7)];
      eCount++;
      if (lv.signChanges(eqCfs) === 1) {
        ok(`E ${k} ${method} 据置 ${grace} エクイティ IRR で NPV 0`, r.equityIrr !== null && Math.abs(irr.npvFromCashflowsYen(eqCfs, r.equityIrr / 100)) <= 1e-5, `IRR ${r.equityIrr}・NPV ${r.equityIrr === null ? '—' : irr.npvFromCashflowsYen(eqCfs, r.equityIrr / 100)}`);
      } else {
        ok(`E ${k} ${method} 据置 ${grace} 一意でない`, r.equityIrr === null && r.equityIrrIssue === 'non-unique', `符号の変化 ${lv.signChanges(eqCfs)} 回なのに ${r.equityIrr}／${r.equityIrrIssue}`);
      }
      ok(`E ${k} ${method} 据置 ${grace} 保険料を差し引いたプロジェクト IRR で NPV 0`, r.projectIrrAfterInsurance !== null && Math.abs(irr.npvFromCashflowsYen(netCfs, r.projectIrrAfterInsurance / 100)) <= 1e-5, `${r.projectIrrAfterInsurance}`);
      ok(`E ${k} ${method} 据置 ${grace} 投下資本・借入額・支払利息`, rel(r.equityYen, capexNet - debt) <= 1e-12 && rel(r.debtYen, debt) <= 1e-12 && rel(r.totalInterestYen, sched.reduce((a, y) => a + y.interestYen, 0)) <= 1e-12, `${r.equityYen}・${r.debtYen}・${r.totalInterestYen}`);
      ok(`E ${k} ${method} 据置 ${grace} 元利払いを引いた CF`, r.years.every((y, i) => y.equityCfYen === eqCfs[i + 1] || rel(y.equityCfYen, eqCfs[i + 1]) <= 1e-12), 'エクイティへの CF が検査側の組み立てと違う');
      // 最小 DSCR の値と年（同じ値の年があれば最初の年）を検査側の列で確かめる
      const dscrs = sched.map((y, i) => (y.paymentYen > 0 && i < life ? (irr.annualCashflowYen(inp, i + 1) - 1e7) / y.paymentYen : Infinity));
      const minV = Math.min(...dscrs);
      const minY = dscrs.indexOf(minV) + 1;
      ok(`E ${k} ${method} 据置 ${grace} 最小 DSCR の値と年`, r.minDscr !== null && r.minDscr.year === minY && rel(r.minDscr.value, minV) <= 1e-12, `${JSON.stringify(r.minDscr)}（期待 ${minV}・${minY} 年目）`);
    }
  }
  // 符号が 2 回以上変わる例（高圧・標準・LTV 63.8・金利 1.5・返済 15 年・据置 12 年＝後年の元利払いが営業 CF を上回る）
  {
    const inp = inputsOf('high-voltage').standard;
    const p = paramsOf({ ltv: '63.8', rate: '1.5', term: '15', grace: '12', method: 'annuity' }, inp.lifespan_years);
    const r = lv.computeLenderView(inp, p);
    const eq = [-r.equityYen, ...r.years.map((y) => y.equityCfYen)];
    ok('E 符号が 2 回以上変わる例は「一意に定まらない」', lv.signChanges(eq) >= 2 && r.equityIrr === null && r.equityIrrIssue === 'non-unique', `符号の変化 ${lv.signChanges(eq)} 回・${r.equityIrr}／${r.equityIrrIssue}（データが変わって例が成り立たなくなったら例を選び直す）`);
  }
  ok('E 件数', eCount === 9, `${eCount}`);
  // 保険料で営業 CF − 保険料が最終年だけ負になる（符号が 2 回変わる）→ 保険料を差し引いたプロジェクト IRR は「一意に定まらない」
  {
    const inp = defs.getScenarioInput('optimistic');
    const life = inp.lifespan_years;
    const ins = Math.round(irr.annualCashflowYen(inp, life) + 1e6);
    const r = lv.computeLenderView(inp, paramsOf({ ltv: '0', rate: '2', term: '10', method: 'annuity', insurance: String(ins) }, life));
    const net = [-lv.capexNetYen(inp), ...Array.from({ length: life }, (_, i) => irr.annualCashflowYen(inp, i + 1) - ins)];
    ok('E 保険料を差し引いた CF の符号が 2 回以上変わる → 一意に定まらない', lv.signChanges(net) >= 2 && r.projectIrrAfterInsurance === null && r.projectIrrAfterInsuranceIssue === 'non-unique', `符号の変化 ${lv.signChanges(net)} 回・${r.projectIrrAfterInsurance}／${r.projectIrrAfterInsuranceIssue}`);
  }

  // ── B: 最大借入額の境目・LTV 換算・上限・営業 CF が 0 を跨ぐ案件
  for (const k of SCEN) {
    const inp = defs.getScenarioInput(k);
    const life = inp.lifespan_years;
    const p = paramsOf({ ltv: '50', rate: '3', term: String(life - 1), method: 'annuity', dscrReq: '1.6', insurance: '5000000' }, life);
    const r = lv.computeLenderView(inp, p);
    if (!r.maxDebt || r.maxDebt.capped || r.maxDebt.yen === 0) {
      ok(`B ${k} 境目（上限・0 の組）`, !!r.maxDebt && (r.maxDebt.capped ? r.maxDebt.yen === r.capexNetYen && r.maxDebt.ltvPct === 100 : true), `${JSON.stringify(r.maxDebt)}`);
      continue;
    }
    const ltv = (r.maxDebt.yen / r.capexNetYen) * 100;
    ok(`B ${k} LTV 換算`, rel(r.maxDebt.ltvPct, ltv) <= 1e-12 && r.maxDebt.yen <= r.capexNetYen, `${r.maxDebt.ltvPct}・${ltv}`);
    const lo = lv.computeLenderView(inp, { ...p, ltvPct: ltv * (1 - 1e-6) });
    const hi = lv.computeLenderView(inp, { ...p, ltvPct: ltv * (1 + 1e-6) });
    ok(`B ${k} 境目`, lo.belowReqYears.length === 0 && hi.belowReqYears.length > 0, `少なめ ${lo.belowReqYears.join(',')}／多め ${hi.belowReqYears.join(',')}`);
  }
  {
    // OPEX を上げて 8 年目の営業 CF がほぼ 0 になる案件（裁定収益の劣化で営業 CF が年とともに減る）
    const base = defs.getScenarioInput('standard');
    const life = base.lifespan_years;
    const opexCross = (irr.annualCashflowYen(base, 8) + irr.opexYen(base)) / base.output_mw;
    const inp = { ...base, opex_yen_per_mw_year: opexCross };
    const cf = Array.from({ length: life }, (_, i) => irr.annualCashflowYen(inp, i + 1));
    const bisect = (term: number) => {
      const feasible = (d: number) => lv.debtSchedule(d, 2, term, 0, 'equal-principal').every((y, i) => y.paymentYen <= 0 || cf[i] >= 1.2 * y.paymentYen);
      if (!feasible(1)) return 0;
      let a = 0;
      let b = 1e13;
      for (let i = 0; i < 300; i++) {
        const mid = (a + b) / 2;
        if (feasible(mid)) a = mid;
        else b = mid;
      }
      return a;
    };
    for (const term of [5, 12]) {
      const r = lv.computeLenderView(inp, paramsOf({ ltv: '10', rate: '2', term: String(term), method: 'equal-principal', dscrReq: '1.2' }, life));
      const indep = bisect(term);
      const got = r.maxDebt?.capped ? Infinity : r.maxDebt?.yen ?? NaN;
      ok(`B 営業 CF が 0 を跨ぐ案件・返済 ${term} 年 ＝ 独立の二分探索`, (indep === 0 && got === 0) || rel(got, indep) <= 1e-9, `閉じた式 ${got}・二分探索 ${indep}（営業 CF ${cf.map((v) => Math.round(v / 1e6)).join(',')} 百万円）`);
    }
  }

  // ── V: 入力の判定と、返済期間が耐用年数を超える計算
  {
    const life = defs.getScenarioInput('standard').lifespan_years;
    const expectInvalid: Partial<import('../src/lib/lender-view-calc').LenderTextInput>[] = [
      { ltv: '70', rate: '2', term: String(life + 1), method: 'annuity' },
      { ltv: '120', rate: '2', term: '10', method: 'annuity' },
      { ltv: '-1', rate: '2', term: '10', method: 'annuity' },
      { ltv: '70', rate: '-1', term: '10', method: 'annuity' },
      { ltv: '70', rate: '100', term: '10', method: 'annuity' },
      { ltv: '70', rate: '2', term: '10', grace: '10', method: 'annuity' },
      { ltv: '70', rate: '2', term: '10', grace: '-1', method: 'annuity' },
      { ltv: '70', rate: '2', term: '0', method: 'annuity' },
      { ltv: '70', rate: '2', term: '10', dscrReq: '0', method: 'annuity' },
      { ltv: '70', rate: '2', term: '10', insurance: '-5', method: 'annuity' },
    ];
    for (const c of expectInvalid) ok(`V invalid ${JSON.stringify(c)}`, lv.parseLenderInput(T(c), life).status === 'invalid', `${lv.parseLenderInput(T(c), life).status}`);
    // 画面と同じ関数（minLifespanYears）で 3 シナリオの最短を出し、それで判定する（標準だけ耐用年数が長い共有 URL の状態）
    const three = [{ ...defs.getScenarioInput('optimistic'), lifespan_years: 12 }, { ...defs.getScenarioInput('standard'), lifespan_years: 20 }, defs.getScenarioInput('pessimistic')];
    const lmin = lv.minLifespanYears(three);
    ok('V 3 シナリオの最短の耐用年数', lmin === 12, `${lmin}`);
    ok('V 最短の耐用年数で判定（12 年なら 13 年は invalid・12 年は ok）', lv.parseLenderInput(T({ ltv: '70', rate: '2', term: '13', method: 'annuity' }), lmin).status === 'invalid' && lv.parseLenderInput(T({ ltv: '70', rate: '2', term: '12', method: 'annuity' }), lmin).status === 'ok', '最短の耐用年数を超える返済期間を受け付けた');
    const inp = { ...defs.getScenarioInput('optimistic'), lifespan_years: 12 };
    const r = lv.computeLenderView(inp, { ltvPct: 70, ratePct: 2, termYears: 15, method: 'annuity', graceYears: 0, dscrReq: 1.3, insuranceYen: 0 });
    ok('V 返済期間＞耐用年数の計算はエクイティ IRR・最大借入額を出さない', r.equityIrr === null && r.equityIrrIssue === 'term-exceeds-life' && r.maxDebt === null && r.balanceAtLifeEndYen > 0, `${r.equityIrr}／${r.equityIrrIssue}・${JSON.stringify(r.maxDebt)}・残高 ${r.balanceAtLifeEndYen}`);
  }

  // ── N: NaN・Infinity を出さない
  const life = defs.getScenarioInput('standard').lifespan_years;
  const cases: Partial<import('../src/lib/lender-view-calc').LenderTextInput>[] = [
    {},
    { ltv: '70' },
    { ltv: '70', rate: '2', term: '10' },
    { ltv: 'abc', rate: '2', term: '10', method: 'annuity' },
    { ltv: '120', rate: '2', term: '10', method: 'annuity' },
    { ltv: '70', rate: '2', term: '10.5', method: 'annuity' },
    { ltv: '70', rate: '2', term: String(life + 1), method: 'annuity' },
    { ltv: '70', rate: '2', term: '10', grace: '10', method: 'annuity' },
    { ltv: '70', rate: '2', term: '10', dscrReq: '0', method: 'annuity' },
    { ltv: '70', rate: '-1', term: '10', method: 'annuity' },
    { ltv: '70', rate: '0', term: '10', grace: '3', method: 'annuity', dscrReq: '1.3' },
    { ltv: '100', rate: '2', term: '10', method: 'equal-principal', dscrReq: '1.3' },
    { ltv: '0', rate: '0', term: '1', method: 'annuity', dscrReq: '1.3' },
    { ltv: '70', rate: '2', term: String(life), grace: String(life - 1), method: 'equal-principal', dscrReq: '1.3', insurance: '1,000,000,000,000' },
    { ltv: '70', rate: '99', term: '10', method: 'annuity', dscrReq: '99', insurance: '12,000,000' },
    { ltv: '70', rate: '0.0000000000001', term: '10', method: 'annuity', dscrReq: '1.3' },
    { ltv: '70', rate: '0.00000000000001', term: '10', method: 'annuity', dscrReq: '1.3' },
  ];
  // 極小の金利でも年金係数が 1/m に近い（桁落ちで Infinity・0.09 にならない）
  ok('N 極小の金利の年金係数', rel(lv.annuityFactor(1e-13, 10), 0.1) <= 1e-9 && rel(lv.annuityFactor(1e-14, 10), 0.1) <= 1e-9, `${lv.annuityFactor(1e-13, 10)}・${lv.annuityFactor(1e-14, 10)}`);
  let nOk = 0;
  for (const c of cases) {
    const parsed = lv.parseLenderInput(T(c), life);
    if (parsed.status !== 'ok') {
      ok(`N 入力 ${JSON.stringify(c)}（${parsed.status}）`, parsed.status === 'incomplete' ? parsed.missing.length > 0 : parsed.problems.length > 0, '理由が空');
      continue;
    }
    for (const k of SCEN) {
      const r = lv.computeLenderView(defs.getScenarioInput(k), parsed.params);
      const nums: unknown[] = [r.capexNetYen, r.debtYen, r.equityYen, r.totalInterestYen, r.equityIrr, r.projectIrr, r.projectIrrAfterInsurance, r.minDscr?.value ?? null, r.maxDebt?.yen ?? null, r.maxDebt?.ltvPct ?? null];
      for (const y of r.years) nums.push(y.cfYen, y.debtServiceYen, y.dscr, y.equityCfYen);
      const bad = nums.filter((v) => !finiteOrNull(v));
      nOk++;
      ok(`N ${JSON.stringify(c)} ${k}`, bad.length === 0, `NaN／Infinity が ${bad.length} 個（${bad.slice(0, 3).join(',')}）`);
    }
  }
  ok('N 計算まで進んだ組', nOk >= 21, `${nOk}`);
  ok('N 空欄は incomplete', lv.parseLenderInput(lv.EMPTY_LENDER_INPUT, life).status === 'incomplete', '空欄で計算に進んだ');

  // ── U: URL の往復
  {
    const t = T({ ltv: '70', rate: '2.25', term: '12', method: 'equal-principal', grace: '1', dscrReq: '1.3', insurance: '12,000,000' });
    const back = lv.lenderFromParams(lv.appendLenderParams(new URLSearchParams(), t));
    ok('U 往復', JSON.stringify(back) === JSON.stringify(t), `${JSON.stringify(back)}`);
    ok('U 空欄は書かない', lv.appendLenderParams(new URLSearchParams(), lv.EMPTY_LENDER_INPUT).toString() === '', '空欄で URL に何か書いた');
    ok('U 方式の不正値は捨てる', lv.lenderFromParams(new URLSearchParams('rm=evil')).method === '', '不正な方式を受け付けた');
  }

  console.log(`[verify:lender-view] 借入 0 の恒等式 ${l0} 組・最大借入額 ${m} 組・エクイティ IRR ${eCount} 組・NaN 検査 ${nOk} 組`);
}

main()
  .catch((e) => problems.push(`検査が例外で途中で止まった: ${(e as Error).message}`))
  .finally(() => {
    if (problems.length === 0) {
      console.log(`[verify:lender-view] ok   ${passed.length} 件すべて期待どおり`);
    } else {
      console.warn('');
      console.warn(`[verify:lender-view] ★★★ WARN ${problems.length} 件が期待と違う（${passed.length} 件は ok） ★★★`);
      for (const p of problems.slice(0, 40)) console.warn(`   - ${p}`);
      if (problems.length > 40) console.warn(`   …ほか ${problems.length - 40} 件`);
      console.warn('');
    }
    process.exit(0);
  });
