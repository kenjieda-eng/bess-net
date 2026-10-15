#!/usr/bin/env tsx
/**
 * scripts/verify-residual-value.ts — 蓄電所 残存価値の試算（/tools/residual-value・T7 実装便 2026-10-15）の否定テスト
 *
 * prebuild で走る（警告のみ・--strict で失敗終了）。外部アクセスは --fetch のときだけ。
 *   1. 計算: 一定の CF の PV が年金現価（lender-view-calc.ts の annuityFactor）と一致／割引率 0 で単純な合計／
 *      容量の減り 0・変化 0 で CF が一定／N＝1・N＝2・N＝3（g・d・c・r すべて 0 でない）の手計算／
 *      任意の支出・撤去費用が該当年だけに効く／列の入れ替えで結果も入れ替わるだけ（並べ替えない）／
 *      PV の足し算が npvFromCashflowsYen と同じ並び／表示の丸め（正負で対称）が計算に入らない
 *   2. 容量の保証の照合（参考）: いまの容量 ×（1 − 減り）^（保証の年 − 運転開始からの年数）／過ぎた保証の年は照合しない／
 *      容量の減りの欄だけで照合する／保証を入れても 3 列の PV・年ごとの値が変わらない（保証の値が曲線の上でも下でも）
 *   3. 入力: 初期値がすべて空欄／空欄・読めない・範囲外の扱い 20 通り以上で NaN・Infinity を出さない／
 *      先頭の記号（+・ー・–・−）の読み方／範囲の文の書き方
 *   4. 出典: 式の一次と上限価格の資料名が台帳 src/data/source-documents.json にあり、式の一次の URL が台帳と同じ
 *   5. ソース: 禁止語（「査定額」「保証違反」等）がソース・/tools のカードに無い（否定の文だけ可）／入力を保存・送信する API・
 *      URL の書込・form 送信が無い／placeholder は単位だけ（許可リスト）／初期値は emptyResidualInput／結果を並べ替えない・色を付けない
 *   6. --html <path>: 初期 DOM（冒頭 1 行・結果の近くの文・入力欄のラベルと入力欄の全数対応〔28 欄〕・前提の文・上限価格を掛けない理由・
 *      関連 5 本のリンク・出典欄〔EPRX はトップへのリンク〕・上限価格の表の行数・placeholder の許可リスト・入力の値が空・禁止語 0・
 *      title・JSON-LD）
 *   7. --fetch: 式の一次（国土交通省の PDF）の sha256 が登録時と同じことと、掲載ページの <title> を確かめる（手で回す。本文の逐語の照合はしない
 *      ＝逐語は 2026-10-15 に PDF の本文で確かめた写し）
 *
 * 実行: npx tsx scripts/verify-residual-value.ts [--html .next/server/app/tools/residual-value.html] [--fetch] [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  COST_ITEMS,
  LIMITS,
  PV_FORMULA_SOURCE,
  PV_FORMULA_VERBATIM,
  SCENARIO_FIELDS,
  SCENARIO_KEYS,
  SCENARIO_LABELS,
  computeResidual,
  computeScenario,
  emptyResidualInput,
  rangeSummaryText,
  rangeText,
  readNumber,
  thousandYenText,
  warrantyCompare,
  yenRoundedText,
  type BaseParams,
  type ResidualTextInput,
  type ScenarioParams,
  type ScenarioText,
} from '../src/lib/residual-value-calc';
import { npvFromCashflowsYen } from '../src/lib/irr-calculator';
import { annuityFactor } from '../src/lib/lender-view-calc';
import { capSegments } from '../src/lib/balancing-cap';

export {};

const ROOT = process.cwd();
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const FETCH = args.includes('--fetch');
const htmlIdx = args.indexOf('--html');
const HTML = htmlIdx >= 0 ? args[htmlIdx + 1] : null;

let checks = 0;
const problems: string[] = [];
const notes: string[] = [];
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) problems.push(msg);
};
/** 相対誤差（大きな円の値でも比べられるように） */
const close = (a: number | null | undefined, b: number, rel = 1e-12) =>
  typeof a === 'number' && Number.isFinite(a) && Math.abs(a - b) <= rel * Math.max(1, Math.abs(b));

const LEAD = '入力した前提で、残りの運転期間のキャッシュフローを割り引いた値の幅を並べる計算です。鑑定・査定・売買価格の目安ではありません。入力は保存も送信もしません。';
const RESULT_NOTE = 'この数字は入力した前提の計算結果です。実際の取引価格・融資額・鑑定額とは別のものです。';
const CAP_REASON = '上限価格は計算に掛けていません。約定価格は上限より下のことがあり、上限の変化が収入にどう効くかは一次に書かれていないためです。';
/** 便 §0 の禁止語（画面・metadata・JSON-LD）と、便 §1-6 で使わないとした語。否定の文（LEAD・RESULT_NOTE）の中だけは可 */
const BANNED = ['査定額', '鑑定額', '適正価格', '時価', '割安', '割高', '買い時', '売り時', 'おすすめ', '有利', '不利', '本便', '保証違反'];
const ALLOWED_SENTENCES = [LEAD, RESULT_NOTE];
/** placeholder に置いてよい単位（数値を書かない） */
const UNIT_ALLOW = new Set(['年', '円/年', '%/年', '年目', '円', '%']);
/** 関連のリンク（便 §1 画面の 5 本） */
const RELATED_HREFS = ['/tools/balancing-benchmark', '/tools/irr-simulator#lender-view-title', '/tracker/balancing-rules', '/tools/asset-ledger', '/tools/asset-check'];

const SC0: ScenarioParams = { revenueChange: 0, capacityFade: 0, costChange: 0, discount: 0 };
const base = (p: Partial<BaseParams>): BaseParams => ({ years: 10, revenueYen: 100_000_000, costYen: 40_000_000, extras: [], removalYen: 0, ...p });
const sct = (p: Partial<ScenarioText>): ScenarioText => ({ revenueChange: '', capacityFade: '', costChange: '', discount: '', ...p });
/** 文字列の入力（基本の欄は埋め、指定したシナリオだけ入れる） */
const textInput = (p: Partial<ResidualTextInput> & { a?: Partial<ScenarioText>; b?: Partial<ScenarioText>; c?: Partial<ScenarioText> }): ResidualTextInput => {
  const e = emptyResidualInput();
  const { a, b, c, ...rest } = p;
  return { ...e, years: '10', revenue: '100,000,000', cost: '40,000,000', ...rest, scenarios: { a: sct(a ?? {}), b: sct(b ?? {}), c: sct(c ?? {}) } };
};
const FULL = { revenueChange: '1', capacityFade: '2', costChange: '1.5', discount: '5' };
const W = (o: Partial<ResidualTextInput>) => ({ warrantyYear: '10', warrantyPct: '80', elapsedYears: '0', currentCapacityPct: '100', ...o });

// 1. 計算
{
  // 一定の CF（変化 0・減り 0）: PV ＝ CF ÷ 年金係数
  for (const [r, n] of [[5, 10], [0.5, 40], [12, 1], [3.25, 17]] as const) {
    const res = computeScenario(base({ years: n }), { ...SC0, discount: r });
    const cf = 60_000_000;
    ok(res.rows.every((row) => row.cfYen === cf), `変化 0・減り 0 で CF が一定でない（r=${r}, N=${n}）`);
    ok(close(res.pvYen, cf / annuityFactor(r, n), 1e-12), `一定の CF の PV が年金現価と一致しない（r=${r}, N=${n}: ${res.pvYen} vs ${cf / annuityFactor(r, n)}）`);
  }
  // 割引率 0 で単純な合計
  {
    const res = computeScenario(base({ years: 7 }), { revenueChange: 3, capacityFade: 1.2, costChange: 2, discount: 0 });
    const sum = res.rows.reduce((s, row) => s + row.cfYen, 0);
    ok(close(res.pvYen, sum, 1e-12), `割引率 0 の PV が CF の単純な合計と一致しない（${res.pvYen} vs ${sum}）`);
  }
  // N＝1 の手計算
  {
    const res = computeScenario(base({ years: 1 }), { revenueChange: 3, capacityFade: 2, costChange: 2, discount: 5 });
    const rev = 100_000_000 * 1.03 * 0.98;
    const cost = 40_000_000 * 1.02;
    ok(close(res.rows[0]?.revenueYen, rev) && close(res.rows[0]?.costYen, cost), 'N＝1 の収入・費用が手計算と一致しない');
    ok(close(res.pvYen, (rev - cost) / 1.05, 1e-12), `N＝1 の PV が手計算と一致しない（${res.pvYen} vs ${(rev - cost) / 1.05}）`);
    ok(res.rows.length === 1, 'N＝1 で行が 1 つでない');
  }
  // N＝2 の手計算（容量係数 (1−d)^t・割引の指数 t）
  {
    const res = computeScenario(base({ years: 2 }), { revenueChange: 0, capacityFade: 10, costChange: 0, discount: 10 });
    const cf1 = 100_000_000 * 0.9 - 40_000_000;
    const cf2 = 100_000_000 * 0.81 - 40_000_000;
    ok(close(res.rows[0]?.capacityFactor, 0.9) && close(res.rows[1]?.capacityFactor, 0.81), `容量係数が (1−d)^t でない（${res.rows.map((r) => r.capacityFactor).join(',')}）`);
    ok(close(res.pvYen, cf1 / 1.1 + cf2 / 1.21, 1e-12), `N＝2 の PV が手計算と一致しない（${res.pvYen} vs ${cf1 / 1.1 + cf2 / 1.21}）`);
    ok(close(res.rows[1]?.discountedYen, cf2 / 1.21), '割引後の列が CF_t ÷ (1+r)^t でない');
  }
  // N＝3 の手計算（g・d・c・r をすべて 0 でない値に＝収入と費用の変化が t 乗の複利か）
  {
    const res = computeScenario(base({ years: 3 }), { revenueChange: 3, capacityFade: 2, costChange: 2, discount: 5 });
    let pv = 0;
    for (let t = 1; t <= 3; t++) {
      const rev = 100_000_000 * 1.03 ** t * 0.98 ** t;
      const cost = 40_000_000 * 1.02 ** t;
      const row = res.rows[t - 1];
      ok(close(row?.revenueYen, rev) && close(row?.costYen, cost) && close(row?.capacityFactor, 0.98 ** t), `N＝3 の ${t} 年目の収入・費用・容量係数が手計算と一致しない`);
      ok(close(row?.discountedYen, (rev - cost) / 1.05 ** t), `N＝3 の ${t} 年目の割引後が手計算と一致しない`);
      pv += (rev - cost) / 1.05 ** t;
    }
    ok(close(res.pvYen, pv, 1e-12), `N＝3 の PV が手計算と一致しない（${res.pvYen} vs ${pv}）`);
  }
  // 任意の支出・撤去費用が該当年だけに効く
  {
    const plain = computeScenario(base({ years: 5 }), { ...SC0, discount: 4 });
    const withEx = computeScenario(base({ years: 5, extras: [{ year: 3, amountYen: 7_000_000 }, { year: 3, amountYen: 1_000_000 }], removalYen: 9_000_000 }), { ...SC0, discount: 4 });
    plain.rows.forEach((row, i) => {
      const t = row.year;
      const expect = row.cfYen - (t === 3 ? 8_000_000 : 0) - (t === 5 ? 9_000_000 : 0);
      ok(withEx.rows[i].cfYen === expect, `任意の支出・撤去費用が ${t} 年目に正しく効いていない（${withEx.rows[i].cfYen} vs ${expect}）`);
    });
    ok(withEx.rows.filter((r) => r.removalYen > 0).length === 1 && withEx.rows[4].removalYen === 9_000_000, '撤去費用が最後の年だけに入っていない');
    ok(close(withEx.pvYen, plain.pvYen - 8_000_000 / 1.04 ** 3 - 9_000_000 / 1.04 ** 5, 1e-12), '任意の支出・撤去費用の PV への効き方が手計算と一致しない');
  }
  // PV の足し算が npvFromCashflowsYen と同じ（[0]＝0・億円を円に戻す）
  {
    const res = computeScenario(base({ years: 23, extras: [{ year: 11, amountYen: 12_345_678 }] }), { revenueChange: -1.5, capacityFade: 2.5, costChange: 2, discount: 6.5 });
    ok(res.cashflowsYen[0] === 0 && res.cashflowsYen.length === 24, 'CF の列の [0] が 0 でない・長さが N＋1 でない');
    ok(res.pvYen === npvFromCashflowsYen(res.cashflowsYen, 0.065) * 1e8, 'PV が npvFromCashflowsYen と同じ値でない');
    const direct = res.rows.reduce((s, r) => s + r.discountedYen, 0);
    ok(close(res.pvYen, direct, 1e-10), `PV が割引後の列の合計と一致しない（${res.pvYen} vs ${direct}）`);
  }
  // 列の入れ替えで結果も入れ替わるだけ（並べ替えない）
  {
    const A = { revenueChange: '2', capacityFade: '1', costChange: '1', discount: '3' };
    const B = { revenueChange: '-3', capacityFade: '4', costChange: '2', discount: '8' };
    const C = { revenueChange: '0', capacityFade: '2.5', costChange: '0', discount: '5' };
    const o1 = computeResidual(textInput({ a: A, b: B, c: C }));
    const o2 = computeResidual(textInput({ a: C, b: A, c: B }));
    const pv = (o: ReturnType<typeof computeResidual>) => o.scenarios.map((s) => s.result?.pvYen ?? NaN);
    const [a1, b1, c1] = pv(o1);
    const [c2, a2, b2] = pv(o2);
    ok(a1 === a2 && b1 === b2 && c1 === c2, '列を入れ替えると結果の値が変わる');
    ok(o1.scenarios.map((s) => s.key).join() === SCENARIO_KEYS.join() && o2.scenarios.map((s) => s.key).join() === SCENARIO_KEYS.join(), '結果の列が入力の順（A・B・C）でない（並べ替えている）');
    ok(!(a1 >= b1 && b1 >= c1) && !(a1 <= b1 && b1 <= c1), '検査の前提: 3 列の値が単調に並んでいる（並べ替えを検出できない）');
    ok(o1.range !== null && o1.range.minYen === Math.min(a1, b1, c1) && o1.range.maxYen === Math.max(a1, b1, c1) && o1.range.count === 3, '最小〜最大の幅が 3 列の最小・最大でない');
    ok(rangeSummaryText(o1.range) === `${yenRoundedText(Math.min(a1, b1, c1))}〜${yenRoundedText(Math.max(a1, b1, c1))}（3 列）`, '幅の文が最小〜最大の順でない');
    const o3 = computeResidual(textInput({ a: A, c: C }));
    ok(o3.scenarios[1].parse.status === 'empty' && o3.scenarios[1].result === null && o3.range?.count === 2, '空の列が計算に入る・幅の列数が違う');
    ok(rangeSummaryText(null) === '—' && /（計算できた列は 1 つ）$/.test(rangeSummaryText(computeResidual(textInput({ a: A })).range)), '幅の文（列なし・1 列）が違う');
  }
  // 表示の丸めが計算に入らない・丸めは正負で対称
  {
    const z = { revenueChange: '0', capacityFade: '0', costChange: '0', discount: '0' };
    const o = computeResidual(textInput({ years: '1', revenue: '1,499', cost: '0', a: z }));
    ok(o.scenarios[0].result?.pvYen === 1499, `PV が丸められている（${o.scenarios[0].result?.pvYen}）`);
    const o2 = computeResidual(textInput({ years: '2', revenue: '1,499', cost: '0', a: z }));
    ok(o2.scenarios[0].result?.pvYen === 2998, `丸めた値で足している（${o2.scenarios[0].result?.pvYen}・丸めてから足すと 2,000）`);
    ok(yenRoundedText(1499) === '1,000 円' && yenRoundedText(1500) === '2,000 円' && yenRoundedText(-1500) === '-2,000 円' && yenRoundedText(-1499) === '-1,000 円', '表示の丸め（千円未満の四捨五入・正負で対称）が違う');
    ok(thousandYenText(-400) === '0' && yenRoundedText(-400) === '0 円' && thousandYenText(-500) === '-1' && thousandYenText(500) === '1', '表示の丸め（−0 は 0・±500 円）が違う');
  }
}

// 2. 容量の保証の照合（参考・計算に使わない）
{
  const wv = (o: Partial<{ year: number; pct: number; elapsed: number; current: number; pctDecimals: number }>) => ({ year: 10, pct: 80, elapsed: 0, current: 100, pctDecimals: 0, ...o });
  const a = warrantyCompare(wv({}), 'a', 2);
  ok(close(a.capacityPct, 0.98 ** 10 * 100) && a.relation === 'above', `保証の照合（新設時）が違う（${a.capacityPct}・${a.relation}）`);
  // 運転中の資産: 運転開始から 5 年・いま初期の 88%・保証は 10 年目に 80% → 88 × 0.98^5 ＝ 79.55%（下）
  const b = warrantyCompare(wv({ elapsed: 5, current: 88 }), 'a', 2);
  ok(close(b.capacityPct, 88 * 0.98 ** 5) && b.relation === 'below', `保証の照合（運転中）が いまの容量 ×（1−d）^（保証の年 − 経過年数）でない（${b.capacityPct}・${b.relation}）`);
  ok(warrantyCompare(wv({ year: 3, pct: 100 }), 'a', 0).relation === 'equal', '保証の「同じ」の判定が違う');
  // 比べる桁: 保証の値を小数第 3 位まで入れたら第 3 位で比べる
  const c = warrantyCompare(wv({ year: 1, pct: 81.714, pctDecimals: 3 }), 'a', 18.2855);
  ok(c.digits === 3 && c.relation === 'above', `保証の値の桁で比べていない（${c.digits}・${c.relation}）`);
  // 画面の経路: 過ぎた保証の年は照合しない・容量の減りの欄だけで照合する・4 つの欄がそろわなければ照合しない
  ok(computeResidual({ ...textInput({ a: FULL }), ...W({ elapsedYears: '12' }) }).warranty.status === 'past', '保証の年が過ぎていても照合する');
  const onlyFade = computeResidual({ ...textInput({ a: { capacityFade: '2' } }), ...W({}) });
  ok(onlyFade.warranty.status === 'ok' && onlyFade.warranty.rows.length === 1 && onlyFade.scenarios[0].parse.status === 'incomplete', '容量の減りだけを入れた列で照合しない');
  ok(computeResidual({ ...textInput({ a: { discount: '5' } }), ...W({}) }).warranty.status === 'no-fade', '容量の減りの無い列で照合する');
  ok(computeResidual({ ...textInput({ a: FULL }), warrantyYear: '10', warrantyPct: '80' }).parsed.warranty.status === 'incomplete', '保証の欄が 2 つだけで照合する（4 つ要る）');
  const beyond = computeResidual({ ...textInput({ years: '5', a: FULL }), ...W({ warrantyYear: '20', elapsedYears: '3' }) });
  ok(beyond.warranty.status === 'ok' && beyond.warranty.beyondRemaining === true && beyond.warranty.horizonYears === 17, '残りの運転年数より後の保証の年に注記が付かない');
  // 保証を入れても計算は変わらない（保証の値が曲線の上でも下でも・3 列とも・年ごとの値も）
  const all3 = { a: FULL, b: { revenueChange: '-1', capacityFade: '4', costChange: '0', discount: '7' }, c: { revenueChange: '0', capacityFade: '1', costChange: '2', discount: '3' } };
  const plain = computeResidual(textInput(all3));
  for (const pct of ['95', '50']) {
    const withW = computeResidual({ ...textInput(all3), ...W({ warrantyPct: pct }) });
    const same = plain.scenarios.every((s, i) => {
      const x = s.result;
      const y = withW.scenarios[i].result;
      return !!x && !!y && x.pvYen === y.pvYen && x.rows.every((r, j) => r.capacityFactor === y.rows[j].capacityFactor && r.revenueYen === y.rows[j].revenueYen);
    });
    ok(same, `容量の保証（${pct}%）を入れると計算結果が変わる（参考の照合だけのはず）`);
  }
}

// 3. 入力
const allFinite = (o: ReturnType<typeof computeResidual>): boolean => {
  const nums: number[] = [];
  for (const s of o.scenarios) {
    if (!s.result) continue;
    nums.push(s.result.pvYen, ...s.result.cashflowsYen);
    for (const r of s.result.rows) nums.push(r.capacityFactor, r.revenueYen, r.costYen, r.extraYen, r.removalYen, r.cfYen, r.discountedYen);
  }
  if (o.range) nums.push(o.range.minYen, o.range.maxYen);
  if (o.warranty.status === 'ok') for (const w of o.warranty.rows) nums.push(w.capacityPct);
  return nums.every(Number.isFinite);
};
{
  const e = emptyResidualInput();
  const allValues = [e.years, e.revenue, e.cost, e.removal, e.warrantyYear, e.warrantyPct, e.elapsedYears, e.currentCapacityPct, ...Object.values(e.costItems), ...e.extras.flatMap((r) => [r.year, r.amount]), ...SCENARIO_KEYS.flatMap((k) => Object.values(e.scenarios[k]))];
  ok(allValues.every((v) => v === ''), '初期値に空欄でない欄がある（既定値を置かない）');
  ok(Object.keys(e.costItems).join() === COST_ITEMS.map((c) => c.key).join(), '費用の内訳の欄と COST_ITEMS が合わない');
  const o0 = computeResidual(e);
  ok(o0.parsed.base.status === 'incomplete' && o0.scenarios.every((s) => s.result === null) && o0.range === null && o0.warranty.status === 'none', '空欄のまま計算される');

  const MAX = { revenueChange: '100', capacityFade: '0', costChange: '100', discount: '0' };
  type Case = [string, ResidualTextInput, (o: ReturnType<typeof computeResidual>) => boolean];
  const cases: Case[] = [
    ['すべて空欄', e, (o) => o.range === null],
    ['年数 0', textInput({ years: '0', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['年数 −1', textInput({ years: '-1', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['年数 41', textInput({ years: '41', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['年数 1.5', textInput({ years: '1.5', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['年数 1e3', textInput({ years: '1e3', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['年数 全角 ２０', textInput({ years: '２０', a: FULL }), (o) => o.parsed.base.status === 'ok' && o.scenarios[0].result?.rows.length === 20],
    ['収入 全角と桁区切り', textInput({ revenue: '１２３，４５６，７８９', a: FULL }), (o) => o.parsed.base.status === 'ok' && o.parsed.base.params.revenueYen === 123456789],
    ['収入 桁区切りの位置が違う', textInput({ revenue: '1,0', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['収入 単位つき', textInput({ revenue: '100円', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['収入 NaN', textInput({ revenue: 'NaN', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['収入 Infinity', textInput({ revenue: 'Infinity', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['収入 負', textInput({ revenue: '-1', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['収入 上限超', textInput({ revenue: '1,000,000,000,000,001', a: FULL }), (o) => o.parsed.base.status === 'invalid'],
    ['収入 上限・変化 100%・40 年', textInput({ years: '40', revenue: '1,000,000,000,000,000', cost: '1,000,000,000,000,000', a: MAX }), (o) => o.scenarios[0].result !== null],
    ['割引率 −1', textInput({ a: { ...FULL, discount: '-1' } }), (o) => o.scenarios[0].parse.status === 'invalid'],
    ['割引率 −100', textInput({ a: { ...FULL, discount: '-100' } }), (o) => o.scenarios[0].parse.status === 'invalid'],
    ['割引率 100・40 年', textInput({ years: '40', a: { ...FULL, discount: '100' } }), (o) => o.scenarios[0].result !== null],
    ['容量の減り 100', textInput({ a: { ...FULL, capacityFade: '100' } }), (o) => o.scenarios[0].result?.rows.every((r) => r.revenueYen === 0) === true],
    ['容量の減り −1', textInput({ a: { ...FULL, capacityFade: '-1' } }), (o) => o.scenarios[0].parse.status === 'invalid'],
    ['収入の変化 −100', textInput({ a: { ...FULL, revenueChange: '-100' } }), (o) => o.scenarios[0].result?.rows.every((r) => r.revenueYen === 0) === true],
    ['収入の変化 −101', textInput({ a: { ...FULL, revenueChange: '-101' } }), (o) => o.scenarios[0].parse.status === 'invalid'],
    ['U+2212 のマイナス', textInput({ a: { ...FULL, revenueChange: '−5' } }), (o) => o.scenarios[0].parse.status === 'ok'],
    ['全角マイナス', textInput({ a: { ...FULL, costChange: '－２' } }), (o) => o.scenarios[0].parse.status === 'ok'],
    ['長音のマイナス ー', textInput({ a: { ...FULL, costChange: 'ー２' } }), (o) => o.scenarios[0].parse.status === 'ok'],
    ['先頭の +', textInput({ a: { ...FULL, revenueChange: '+1.5' } }), (o) => o.scenarios[0].parse.status === 'ok'],
    ['% つき', textInput({ a: { ...FULL, discount: '5%' } }), (o) => o.scenarios[0].parse.status === 'invalid'],
    ['空白だけ', textInput({ a: { ...FULL, discount: '   ' } }), (o) => o.scenarios[0].parse.status === 'incomplete'],
    ['シナリオの一部だけ', textInput({ a: { discount: '5' } }), (o) => o.scenarios[0].parse.status === 'incomplete' && o.scenarios[0].result === null],
    ['".5" と "5."', textInput({ a: { revenueChange: '.5', capacityFade: '5.', costChange: '0', discount: '3' } }), (o) => o.scenarios[0].result !== null],
    ['任意の支出 0 年目・41 年目・負の金額', { ...textInput({ a: FULL }), extras: [{ year: '0', amount: '1' }, { year: '41', amount: '1' }, { year: '2', amount: '-5' }] }, (o) => o.parsed.extraNotices.length === 3 && o.scenarios[0].result !== null],
    ['任意の支出 年数より後', { ...textInput({ years: '5', a: FULL }), extras: [{ year: '6', amount: '1,000' }] }, (o) => o.parsed.extraNotices.length === 1 && o.parsed.base.status === 'ok' && o.parsed.base.params.extras.length === 0],
    ['任意の支出 片方だけ', { ...textInput({ a: FULL }), extras: [{ year: '3', amount: '' }] }, (o) => o.parsed.extraNotices.length === 1],
    ['任意の支出 11 行', { ...textInput({ a: FULL }), extras: Array.from({ length: 11 }, () => ({ year: '1', amount: '1' })) }, (o) => o.parsed.base.status === 'ok' && o.parsed.base.params.extras.length === LIMITS.extraRows],
    ['撤去費用 上限超', { ...textInput({ a: FULL }), removal: '10,000,000,000,000,000' }, (o) => o.parsed.extraNotices.length === 1 && o.parsed.base.status === 'ok' && o.parsed.base.params.removalYen === 0],
    ['撤去費用 読めない', { ...textInput({ a: FULL }), removal: 'abc' }, (o) => o.parsed.extraNotices.length === 1 && o.scenarios[0].result !== null],
    ['保証 0 年目・101%', { ...textInput({ a: FULL }), ...W({ warrantyYear: '0', warrantyPct: '101' }) }, (o) => o.parsed.warranty.status === 'invalid' && o.warranty.status === 'none'],
    ['保証 片方だけ', { ...textInput({ a: FULL }), warrantyYear: '10' }, (o) => o.parsed.warranty.status === 'incomplete' && o.warranty.status === 'none'],
    ['保証 経過年数 負', { ...textInput({ a: FULL }), ...W({ elapsedYears: '-1' }) }, (o) => o.parsed.warranty.status === 'invalid'],
    ['費用 内訳だけ', { ...textInput({ cost: '', a: FULL }), costItems: { ...emptyResidualInput().costItems, om: '10,000,000', insurance: '2,000,000' } }, (o) => o.parsed.base.status === 'ok' && o.parsed.base.params.costYen === 12_000_000],
    ['費用 まとめた額＋内訳', { ...textInput({ cost: '1,000', a: FULL }), costItems: { ...emptyResidualInput().costItems, land: '500' } }, (o) => o.parsed.base.status === 'ok' && o.parsed.base.params.costYen === 1500],
    ['費用 空欄（内訳も空）', textInput({ cost: '', a: FULL }), (o) => o.parsed.base.status === 'incomplete'],
    ['費用 内訳が読めない', { ...textInput({ a: FULL }), costItems: { ...emptyResidualInput().costItems, grid: '1万' } }, (o) => o.parsed.base.status === 'invalid'],
    ['費用 合計が上限超', { ...textInput({ cost: '1,000,000,000,000,000', a: FULL }), costItems: { ...emptyResidualInput().costItems, om: '1' } }, (o) => o.parsed.base.status === 'invalid'],
  ];
  ok(cases.length >= 20, `NaN・Infinity を出さない入力が 20 通り未満（${cases.length}）`);
  for (const [label, input, expect] of cases) {
    const o = computeResidual(input);
    ok(allFinite(o), `${label}: NaN／Infinity が出る`);
    ok(expect(o), `${label}: 扱いが想定と違う（base=${o.parsed.base.status}・A=${o.scenarios[0].parse.status}・注意 ${o.parsed.extraNotices.length}・保証 ${o.parsed.warranty.status}）`);
  }
  // 先頭の記号の読み方（数の途中の記号は読めない扱いのまま）
  const READ: [string, number | null][] = [['+2', 2], ['＋２', 2], ['ー2', -2], ['ｰ2', -2], ['–2', -2], ['‐2', -2], ['−2', -2], ['－２', -2], ['2ー', null], ['1-2', null], ['--2', null], ['+-2', null], ['ー', null], ['+', null]];
  for (const [s, v] of READ) {
    const r = readNumber(s);
    ok(v === null ? r.invalid : !r.invalid && r.value === v, `「${s}」の読み方が違う（${JSON.stringify(r)}）`);
  }
  // 範囲の文の書き方（指数表記にしない・負の数は −・兆の前に桁区切り）
  ok(rangeText('yen') === '0〜1,000 兆円の数' && rangeText('change') === '−100〜100 の数（%/年）' && rangeText('years') === '1〜40 の整数（年）', `範囲の文の書き方が違う（${rangeText('yen')}／${rangeText('change')}／${rangeText('years')}）`);
  notes.push(`入力 ${cases.length} 通り・読み方 ${READ.length} 通り`);
}

// 4. 出典が台帳にある
{
  const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'source-documents.json'), 'utf8')) as { documents: { name: string; aliases?: string[]; url: string }[] };
  const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, '');
  const known = new Map<string, string>();
  for (const d of ledger.documents) {
    known.set(norm(d.name), d.url);
    for (const a of d.aliases ?? []) known.set(norm(a), d.url);
  }
  ok(known.get(norm(PV_FORMULA_SOURCE.name)) === PV_FORMULA_SOURCE.href, `式の一次「${PV_FORMULA_SOURCE.name}」が台帳に無い・URL が台帳と違う`);
  ok(known.has(norm('取引実績の取りまとめ結果')), '上限価格の資料名「取引実績の取りまとめ結果」が台帳に無い');
  ok(/^https:\/\/www\.mlit\.go\.jp\//.test(PV_FORMULA_SOURCE.href), '式の一次の URL が国土交通省でない');
  ok(PV_FORMULA_SOURCE.detail.includes(PV_FORMULA_VERBATIM.symbols) && PV_FORMULA_SOURCE.detail.includes(PV_FORMULA_VERBATIM.basePoint), '出典の文に式の逐語（記号の説明・基準時点）が無い');
}

// 5. ソース: 禁止語・保存／送信・placeholder・初期値・並べ替え
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const dropAllowed = (s: string) => ALLOWED_SENTENCES.reduce((acc, a) => acc.split(a).join(''), s);
{
  const files = ['src/lib/residual-value-calc.ts', 'src/components/ResidualValueCalculator.tsx', 'src/app/tools/residual-value/page.tsx'];
  const RE = /localStorage|sessionStorage|indexedDB|document\.cookie|\bfetch\s*\(|sendBeacon|XMLHttpRequest|useSearchParams|URLSearchParams|location\.(search|hash|href)\s*=|location\.(assign|replace)\s*\(|\blocation\s*=|history\.(pushState|replaceState)|navigator\.(clipboard|share)|useRouter|\bredirect\s*\(|window\.open\s*\(|<form\b|\bname=\{/;
  for (const f of files) {
    const src = strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    ok(!RE.test(src), `${f}: 入力を保存・送信しうる API・URL の書込・form 送信を使っている（${(src.match(RE) ?? [''])[0]}）`);
    const body = dropAllowed(src);
    for (const w of BANNED) ok(!body.includes(w), `${f}: 禁止語「${w}」（コメントと否定の文を除いたソース全文）`);
    for (const m of src.matchAll(/placeholder\s*[=:]\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g)) ok(!/[0-9０-９〇一二三四五六七八九十百千]/.test(m[1]), `${f}: placeholder に数がある（${m[1]}）`);
    ok(!/入力例|例を入れる|サンプル|例で試す/.test(src), `${f}: 入力例のボタン・文がある`);
  }
  // 部品: placeholder は単位だけ（placeholder={unit} の 1 か所・unit は許可リスト）／初期値は emptyResidualInput／結果を並べ替えない・色を付けない
  const comp = strip(fs.readFileSync(path.join(ROOT, 'src/components/ResidualValueCalculator.tsx'), 'utf8'));
  const phs = [...comp.matchAll(/placeholder\s*[=:]/g)].length;
  ok(phs === 1 && comp.includes('placeholder={unit}'), `部品の placeholder が placeholder={unit} の 1 か所でない（${phs}）`);
  const units = [...comp.matchAll(/\bunit="([^"]*)"/g)].map((m) => m[1]);
  ok(units.length > 0 && units.every((u) => UNIT_ALLOW.has(u)), `部品の unit に許可リストに無い値（${units.filter((u) => !UNIT_ALLOW.has(u)).join('・')}）`);
  for (const f of SCENARIO_FIELDS) ok(UNIT_ALLOW.has(f.unit), `シナリオの欄の単位が許可リストに無い（${f.unit}）`);
  ok(/useState<ResidualTextInput>\(emptyResidualInput\)/.test(comp), '部品の初期値が emptyResidualInput でない');
  ok(!/\.(sort|reverse|toSorted|toReversed)\s*\(/.test(comp), '部品が結果を並べ替えている（sort・reverse）');
  ok(!/(color|background)\s*:[^,}\n]*(pvYen|range|relation)/.test(comp), '部品が結果の値で色を変えている');
  ok((comp.match(/out\.scenarios\.map\(/g) ?? []).length >= 2, '結果の表・年ごとの表が out.scenarios を入力の順に回していない');
  const comp0 = fs.readFileSync(path.join(ROOT, 'src/components/ResidualValueCalculator.tsx'), 'utf8');
  ok(comp0.includes(`export const RESULT_NOTE = '${RESULT_NOTE}'`), '結果の近くの文が便の文のままでない');
  ok(Object.values(SCENARIO_LABELS).join() === 'シナリオ A,シナリオ B,シナリオ C' && !/楽観|悲観|標準/.test(Object.values(SCENARIO_LABELS).join()), '列の名前が「シナリオ A／B／C」でない（楽観・標準・悲観は使わない）');
  const page = strip(fs.readFileSync(path.join(ROOT, 'src/app/tools/residual-value/page.tsx'), 'utf8'));
  ok(page.split(LEAD).length - 1 === 1, 'ページのソースに冒頭 1 行がちょうど 1 回でない');
  ok(page.includes("const TITLE = '蓄電所 残存価値の試算（入力した前提の割引現在価値の幅）'") && /title:\s*TITLE/.test(page), 'title が便の例と違う（「蓄電所」を含める）');
  // /tools のカード・sitemap
  const tools = strip(fs.readFileSync(path.join(ROOT, 'src', 'app', 'tools', 'page.tsx'), 'utf8'));
  const i = tools.indexOf("slug: 'residual-value'");
  ok(i >= 0, '/tools に residual-value のカードが無い');
  const card = i >= 0 ? tools.slice(i, tools.indexOf('},', i)) : '';
  for (const w of BANNED) ok(!dropAllowed(card).includes(w), `/tools のカードに禁止語「${w}」`);
  const sitemap = fs.readFileSync(path.join(ROOT, 'src', 'app', 'sitemap.ts'), 'utf8');
  ok(sitemap.split('/tools/residual-value`').length - 1 === 1, 'sitemap に /tools/residual-value がちょうど 1 つでない');
}

// 6. 初期 DOM（ビルド出力を渡したときだけ）
if (HTML) {
  const h = fs.readFileSync(HTML, 'utf8').replace(/<!-- -->/g, '');
  const main = (h.match(/<main[\s\S]*?<\/main>/) ?? [''])[0].replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  const unesc = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
  const flat = unesc(main.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, '');
  const f = (s: string) => s.replace(/\s+/g, '');
  ok(flat.split(f(LEAD)).length - 1 === 1, '初期 DOM に冒頭 1 行がちょうど 1 回でない');
  ok(flat.includes(f('鑑定・査定・売買価格の目安ではありません')), '初期 DOM に「鑑定・査定・売買価格の目安ではありません」が無い');
  ok(flat.includes(f(RESULT_NOTE)), '初期 DOM に結果の近くの文が無い');
  ok(flat.includes(f('容量の減りが収入にそのまま効くという前提')), '初期 DOM に「容量の減りが収入にそのまま効くという前提」が無い');
  ok(flat.includes(f(CAP_REASON)), '初期 DOM に上限価格を計算に掛けない理由の文が無い');
  // 入力欄のラベル（全数）と、label の for と input の id の対応
  const labels = [
    '残りの運転年数（年）', '直近12か月の収入（円/年）', '直近12か月の費用（まとめた額）（円/年）',
    ...COST_ITEMS.map((c) => `${c.label}（円/年）`),
    ...SCENARIO_FIELDS.map((x) => `${x.label}（${x.unit}）`),
    '支出の年（年目）', '金額（円）', '運転終了時の撤去・原状回復の費用（任意）（円）',
    '保証の年（運転開始から）（年目）', '保証の値（初期に対する割合）（%）', '運転開始からの年数（年）', 'いまの使える容量（初期に対する割合）（%）',
  ];
  const missing = labels.filter((l) => !flat.includes(f(l)));
  ok(missing.length === 0, `初期 DOM に無い入力欄のラベル: ${missing.join('・')}`);
  for (const x of SCENARIO_FIELDS) ok(flat.split(f(`${x.label}（${x.unit}）`)).length - 1 === SCENARIO_KEYS.length, `初期 DOM に ${x.label} の欄が ${SCENARIO_KEYS.length} 列分ない`);
  for (const k of SCENARIO_KEYS) ok(flat.includes(f(SCENARIO_LABELS[k])), `初期 DOM に ${SCENARIO_LABELS[k]} が無い`);
  const inputs = [...main.matchAll(/<input\b[^>]*>/g)].map((m) => m[0]);
  const inputIds = new Set(inputs.map((i) => (i.match(/\bid="([^"]+)"/) ?? [])[1]).filter(Boolean));
  const labelFors = [...main.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]);
  const EXPECT_INPUTS = 3 + COST_ITEMS.length + SCENARIO_KEYS.length * SCENARIO_FIELDS.length + 2 + 1 + 4;
  ok(inputs.length === EXPECT_INPUTS && inputIds.size === EXPECT_INPUTS, `初期 DOM の入力欄が ${EXPECT_INPUTS} でない（${inputs.length}・id ${inputIds.size}）`);
  ok(labelFors.length === EXPECT_INPUTS && labelFors.every((x) => inputIds.has(x)), `初期 DOM の label の for と input の id が全数で対応しない（label ${labelFors.length}）`);
  ok(inputs.every((i) => !/\bvalue="[^"]+"/.test(i)), '初期 DOM に値の入った入力欄がある（空で始める）');
  const placeholders = [...main.matchAll(/placeholder="([^"]*)"/g)].map((m) => unesc(m[1]));
  ok(placeholders.length === EXPECT_INPUTS && placeholders.every((p) => UNIT_ALLOW.has(p)), `初期 DOM の placeholder が単位の許可リストに無い（${placeholders.filter((p) => !UNIT_ALLOW.has(p)).join('・')}）`);
  // 関連 5 本・出典欄（EPRX はトップへのリンク＝出典リンク方針）
  for (const href of RELATED_HREFS) ok(main.includes(`href="${href}"`), `初期 DOM に関連のリンク ${href} が無い`);
  ok(/class="article-sources"/.test(main) && flat.includes(f(`「${PV_FORMULA_SOURCE.name}」`)), '初期 DOM の出典欄に式の一次が無い');
  ok(!/href="https:\/\/www\.eprx\.or\.jp\/[^"]+"/.test(main), '初期 DOM に EPRX の深い URL へのリンクがある（トップへ）');
  const capRows = ((main.match(/<table[\s\S]*?<\/table>/g) ?? []).find((t) => t.includes('ΔkW 上限価格（円/ΔkW・30分）と適用期間')) ?? '').match(/<tr[\s\S]*?<\/tr>/g) ?? [];
  ok(capRows.length - 1 === capSegments().length, `初期 DOM の上限価格の表の行数（${capRows.length - 1}）が capSegments（${capSegments().length}）と違う`);
  const body = dropAllowed(flat);
  for (const w of BANNED) ok(!body.includes(w), `初期 DOM（main・否定の文を除く）に禁止語「${w}」`);
  // metadata・OG・JSON-LD
  const head = unesc((h.match(/<head[\s\S]*?<\/head>/) ?? [''])[0]);
  const jsonlds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  ok(jsonlds.length >= 2, `JSON-LD が 2 つ（WebPage・BreadcrumbList）無い（${jsonlds.length}）`);
  for (const w of BANNED) ok(!dropAllowed(head).includes(w) && !jsonlds.join(' ').includes(w), `metadata・JSON-LD に禁止語「${w}」`);
  ok(/<title>[^<]*蓄電所[^<]*<\/title>/.test(head), 'title に「蓄電所」が無い');
  notes.push(`初期 DOM: ラベル ${labels.length - missing.length}/${labels.length}・入力欄 ${inputs.length}（placeholder は単位だけ）・上限価格の表 ${capRows.length - 1} 行`);
}

// 7. 一次の取り直し（手で回す）
async function fetchChecks() {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
  const pdf = await fetch(PV_FORMULA_SOURCE.href, { headers: { 'User-Agent': UA } });
  ok(pdf.status === 200, `式の一次の PDF が HTTP ${pdf.status}`);
  const buf = Buffer.from(await pdf.arrayBuffer());
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  // 2026-10-15 13:29 JST に取得した PDF（2,018,956 バイト）。違えば改定・差し替えの合図（逐語と頁を取り直す）
  ok(sha === '660bbad60629ab938f2bf926bc2f31a1c16ff5706c125f83ddbe5f97e9351962', `式の一次の PDF の sha256 が登録時と違う（${sha.slice(0, 16)}…・${buf.length} バイト）`);
  const page = await fetch('https://www.mlit.go.jp/tec/hyouka/public/250918_shishin/250918_shishin.html', { headers: { 'User-Agent': UA } });
  ok(page.status === 200, `掲載ページが HTTP ${page.status}`);
  const html = new TextDecoder('shift_jis').decode(await page.arrayBuffer());
  ok(/<title>\s*「公共事業評価の費用便益分析に関する技術指針（共通編）」の改定について\s*<\/title>/.test(html), '掲載ページの <title> が登録時と違う');
  ok(html.includes('shishin/shishin250918.pdf'), '掲載ページに PDF へのリンクが無い');
  notes.push(`一次の取り直し（PDF ${buf.length} バイト・掲載ページ）`);
}

(async () => {
  if (FETCH) await fetchChecks();
  console.log(`[verify:residual-value] 検査 ${checks} 件${notes.length ? '・' + notes.join('・') : ''}`);
  if (problems.length) {
    console.warn(`[verify:residual-value] WARN 問題 ${problems.length} 件`);
    problems.slice(0, 40).forEach((p) => console.warn(`   - ${p}`));
    if (STRICT) process.exit(1);
  } else {
    console.log('[verify:residual-value] ok   計算・保証の照合・入力の扱い・出典・禁止語・保存なし・placeholder');
  }
})();
