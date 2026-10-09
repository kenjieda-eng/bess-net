/**
 * src/lib/lender-view-calc.ts — IRR シミュレーターの「貸し手の見方」（借入・DSCR・最大借入額・エクイティ IRR・上限価格シナリオ）
 * （T4 レンダー視点便・2026-10-09）
 *
 * ★当サイトは助言者ではない: 融資の可否・条件は金融機関の判断。DSCR の要求水準・保険料・金利に既定値を置かない
 *   （空欄＝入力を促す。用語集 DSCR の「典型的に 1.2〜1.5」は出典が無いので既定にしない）。
 * ★既存の 3 シナリオの結果は変えない: 営業 CF は src/lib/irr-calculator.ts の annualCashflowYen（収益 − OPEX・税引前）を
 *   そのまま使い、IRR は同じファイルの irrFromCashflowsYen（calcIRR と同じ探索区間・同じ二分法）で出す。
 * ★JSON を import しない（クライアントのコンポーネントから値で import してよい）。上限価格の履歴はサーバ（page.tsx）が
 *   src/lib/balancing-cap.ts の capSegments() で組み立てて props で渡す。
 *
 * 定義（画面の注記と同じ）:
 *   CAPEX_net ＝ CAPEX × (1 − 補助率)（irr-calculator.ts の初期投資と同じ式）
 *   借入額 D ＝ CAPEX_net × LTV
 *   返済: 返済期間 n 年（据置期間 g 年を含む）。据置の間は利息だけ、残り m＝n−g 年で元金を返す。
 *         元利均等＝毎年 D × 年金係数（r ÷ (1 − (1+r)^−m)。r＝0 なら 1/m）・元金均等＝毎年 D/m ＋ 残高 × r。
 *   DSCR_t ＝（営業 CF_t − 保険料）÷ 元利払い_t（元利払いが 0 の年は出さない）
 *   エクイティ IRR: 投下資本 CAPEX_net − D・CF_t ＝ 営業 CF_t − 保険料 − 元利払い_t
 *   要求水準を満たす最大借入額: 元利払いは借入額に比例する（D 円の元利払い＝D × 1 円あたりの元利払い k_t）ので、
 *         D_max ＝ min_t（営業 CF_t − 保険料）÷（要求水準 × k_t）（k_t ＞ 0 の年）。二分探索と同じ答えを閉じた式で出す。
 * 税・減価償却・DSRA（返済準備金）・手数料・金利の変動は含まない。
 */
import { annualCashflowYen, calcIRR, irrFromCashflowsYen, type IRRInput } from './irr-calculator';
import { BLOCKS_PER_YEAR, balancingRevenueYen } from './balancing-revenue-calc';
import { parseNumberText } from './balancing-benchmark-calc';

export type RepaymentMethod = 'annuity' | 'equal-principal';

export const REPAYMENT_METHOD_LABELS: Record<RepaymentMethod, string> = {
  annuity: '元利均等',
  'equal-principal': '元金均等',
};

/** 画面の入力（文字列のまま持つ＝空欄と 0 を分ける） */
export type LenderTextInput = {
  ltv: string;
  rate: string;
  term: string;
  method: '' | RepaymentMethod;
  grace: string;
  dscrReq: string;
  insurance: string;
};

/** 初期値はすべて空欄（便 §1: LTV・金利・期間・方式とも空欄。計算は 4 つが揃ったときだけ） */
export const EMPTY_LENDER_INPUT: LenderTextInput = { ltv: '', rate: '', term: '', method: '', grace: '', dscrReq: '', insurance: '' };

export type LenderParams = {
  ltvPct: number;
  ratePct: number;
  termYears: number;
  method: RepaymentMethod;
  graceYears: number;
  /** DSCR の要求水準（倍）。空欄なら null（最大借入額と下回る年は出さない） */
  dscrReq: number | null;
  /** 事業中断保険の年間保険料（円/年）。空欄は 0 */
  insuranceYen: number;
};

export type ParsedLender =
  | { status: 'incomplete'; missing: string[] }
  | { status: 'invalid'; problems: string[] }
  | { status: 'ok'; params: LenderParams };

/** 入力の読み取り。4 つ（LTV・金利・返済期間・返済方式）が揃わなければ incomplete、範囲外は invalid（理由つき） */
export function parseLenderInput(t: LenderTextInput, lifespanYears: number): ParsedLender {
  const ltv = parseNumberText(t.ltv);
  const rate = parseNumberText(t.rate);
  const term = parseNumberText(t.term);
  const grace = parseNumberText(t.grace);
  const req = parseNumberText(t.dscrReq);
  const ins = parseNumberText(t.insurance);
  const problems: string[] = [];
  if (ltv.invalid || (ltv.value !== null && (ltv.value < 0 || ltv.value > 100))) problems.push('LTV は 0〜100 の数で入れてください');
  if (rate.invalid || (rate.value !== null && (rate.value < 0 || rate.value >= 100))) problems.push('金利は 0 以上 100 未満の数で入れてください');
  if (term.invalid || (term.value !== null && (!Number.isInteger(term.value) || term.value < 1))) problems.push('返済期間は 1 以上の整数（年）で入れてください');
  if (term.value !== null && Number.isInteger(term.value) && term.value > lifespanYears) {
    problems.push(`返済期間（${term.value} 年）が設備耐用年数（${lifespanYears} 年）を超えています。この試算は耐用年数の中で返し終える前提です`);
  }
  if (grace.invalid || (grace.value !== null && (!Number.isInteger(grace.value) || grace.value < 0))) problems.push('据置期間は 0 以上の整数（年）で入れてください');
  if (grace.value !== null && term.value !== null && Number.isInteger(grace.value) && Number.isInteger(term.value) && grace.value >= term.value) {
    problems.push('据置期間は返済期間より短くしてください（据置期間は返済期間に含みます）');
  }
  if (req.invalid || (req.value !== null && req.value <= 0)) problems.push('DSCR の要求水準は 0 より大きい数（倍）で入れてください');
  if (ins.invalid || (ins.value !== null && ins.value < 0)) problems.push('保険料は 0 以上の数（円/年）で入れてください');
  if (problems.length > 0) return { status: 'invalid', problems };
  const missing: string[] = [];
  if (ltv.value === null) missing.push('LTV');
  if (rate.value === null) missing.push('金利');
  if (term.value === null) missing.push('返済期間');
  if (t.method === '') missing.push('返済方式');
  if (missing.length > 0) return { status: 'incomplete', missing };
  return {
    status: 'ok',
    params: {
      ltvPct: ltv.value as number,
      ratePct: rate.value as number,
      termYears: term.value as number,
      method: t.method as RepaymentMethod,
      graceYears: grace.value ?? 0,
      dscrReq: req.value,
      insuranceYen: ins.value ?? 0,
    },
  };
}

/**
 * 年金係数（元利均等の 1 円あたりの年払い）＝ r ÷ (1 − (1+r)^−m)。r＝0 なら 1/m。
 * 極小の金利で 1 − (1+r)^−m が桁落ちしないよう、expm1・log1p で同じ式を計算する（T4 レビュー）。
 */
export function annuityFactor(ratePct: number, years: number): number {
  const r = ratePct / 100;
  if (r === 0) return 1 / years;
  return -r / Math.expm1(-years * Math.log1p(r));
}

export type DebtYear = { year: number; interestYen: number; principalYen: number; paymentYen: number; balanceEndYen: number };

/** 返済表（年 1..返済期間）。据置の間は利息だけ。元利均等の年払いは D × 年金係数そのもの（最終年も同じ額） */
export function debtSchedule(debtYen: number, ratePct: number, termYears: number, graceYears: number, method: RepaymentMethod): DebtYear[] {
  const r = ratePct / 100;
  const m = termYears - graceYears;
  const out: DebtYear[] = [];
  let bal = debtYen;
  const annuity = debtYen * annuityFactor(ratePct, m);
  const principalEach = debtYen / m;
  for (let t = 1; t <= termYears; t++) {
    const interest = bal * r;
    let principal = 0;
    let payment = interest;
    if (t > graceYears) {
      if (method === 'annuity') {
        payment = annuity;
        principal = annuity - interest;
      } else {
        principal = principalEach;
        payment = principalEach + interest;
      }
    }
    bal = bal - principal;
    out.push({ year: t, interestYen: interest, principalYen: principal, paymentYen: payment, balanceEndYen: bal });
  }
  return out;
}

export type LenderYear = {
  year: number;
  /** 営業 CF（円・既存モデルの年次 CF＝収益 − OPEX・税引前） */
  cfYen: number;
  /** 元利払い（円） */
  debtServiceYen: number;
  /** DSCR（元利払いが 0 の年は null） */
  dscr: number | null;
  /** エクイティへの CF（円） */
  equityCfYen: number;
};

export type LenderResult = {
  capexNetYen: number;
  debtYen: number;
  equityYen: number;
  totalInterestYen: number;
  years: LenderYear[];
  /** 最小 DSCR とその年（元利払いのある年が無ければ null＝LTV 0% のとき） */
  minDscr: { value: number; year: number } | null;
  /** 要求水準を下回る年（要求水準が空欄なら空） */
  belowReqYears: number[];
  /** 要求水準を満たす最大の借入額（円・要求水準が空欄なら null）。CAPEX_net を超えるときは capped＝true */
  maxDebt: { yen: number; ltvPct: number; capped: boolean } | null;
  /** エクイティ IRR（%・出せないときは null で、理由は equityIrrIssue） */
  equityIrr: number | null;
  /**
   * エクイティ IRR を出さない理由。'no-equity'＝投下資本が 0 以下／'non-unique'＝CF の符号が 2 回以上変わり IRR が一意に定まらない
   * （据置が長い・後年に元利払いが営業 CF を上回る など）／'no-root'＝探索区間に解が無い／'term-exceeds-life'＝返済期間が耐用年数を超える
   */
  equityIrrIssue: 'no-equity' | 'non-unique' | 'no-root' | 'term-exceeds-life' | null;
  /** 返済期間がこのシナリオの耐用年数を超えるとき、耐用年数の終わりに残る借入残高（円）。超えなければ 0 */
  balanceAtLifeEndYen: number;
  /** プロジェクト IRR（%・calcIRR そのもの＝上の計算結果と同じ値） */
  projectIrr: number | null;
  /** 保険料を差し引いたプロジェクト IRR（保険料 0 なら projectIrr と同じ）。出せないときは null で、理由は projectIrrAfterInsuranceIssue */
  projectIrrAfterInsurance: number | null;
  projectIrrAfterInsuranceIssue: 'non-unique' | 'no-root' | null;
};

/** CF 列（[0] を含む）の符号が変わる回数（0 は数えない）。2 回以上なら IRR は一意に定まらない */
export function signChanges(cfs: readonly number[]): number {
  let n = 0;
  let prev = 0;
  for (const v of cfs) {
    if (v === 0) continue;
    const s = v > 0 ? 1 : -1;
    if (prev !== 0 && s !== prev) n++;
    prev = s;
  }
  return n;
}

/** IRR を出してよいか（符号の変化が 1 回のときだけ）と、その値 */
function irrIfUnique(cfs: readonly number[]): { irr: number | null; issue: 'non-unique' | 'no-root' | null } {
  if (signChanges(cfs) !== 1) return { irr: null, issue: signChanges(cfs) > 1 ? 'non-unique' : 'no-root' };
  const v = irrFromCashflowsYen(cfs);
  return v === null ? { irr: null, issue: 'no-root' } : { irr: v, issue: null };
}

/** CAPEX_net（円）＝ irr-calculator.ts の初期投資と同じ式 */
export function capexNetYen(input: IRRInput): number {
  return input.capex_oku * 1e8 * (1 - input.subsidy_rate / 100);
}

/** 1 シナリオ分の貸し手の見方 */
export function computeLenderView(input: IRRInput, p: LenderParams): LenderResult {
  const capexNet = capexNetYen(input);
  const debt = capexNet * (p.ltvPct / 100);
  const equity = capexNet - debt;
  const life = input.lifespan_years;
  const schedule = debtSchedule(debt, p.ratePct, p.termYears, p.graceYears, p.method);
  // 1 円あたりの元利払い（最大借入額の閉じた式に使う）
  const unit = debtSchedule(1, p.ratePct, p.termYears, p.graceYears, p.method);
  const years: LenderYear[] = [];
  const equityCfs: number[] = [-equity];
  const netCfs: number[] = [-capexNet];
  let minDscr: { value: number; year: number } | null = null;
  for (let t = 1; t <= life; t++) {
    const cf = annualCashflowYen(input, t);
    const ds = schedule[t - 1]?.paymentYen ?? 0;
    const net = cf - p.insuranceYen;
    const dscr = ds > 0 ? net / ds : null;
    if (dscr !== null && (minDscr === null || dscr < minDscr.value)) minDscr = { value: dscr, year: t };
    const eq = net - ds;
    years.push({ year: t, cfYen: cf, debtServiceYen: ds, dscr, equityCfYen: eq });
    equityCfs.push(eq);
    netCfs.push(net);
  }
  const belowReqYears = p.dscrReq === null ? [] : years.filter((y) => y.dscr !== null && y.dscr < (p.dscrReq as number)).map((y) => y.year);
  let maxDebt: LenderResult['maxDebt'] = null;
  if (p.dscrReq !== null) {
    let dmax = Infinity;
    for (let t = 1; t <= Math.min(life, unit.length); t++) {
      const k = unit[t - 1].paymentYen;
      if (k <= 0) continue;
      const net = years[t - 1].cfYen - p.insuranceYen;
      dmax = net <= 0 ? 0 : Math.min(dmax, net / (p.dscrReq * k));
    }
    if (!Number.isFinite(dmax)) dmax = 0;
    const capped = dmax > capexNet;
    const yen = capped ? capexNet : dmax;
    maxDebt = { yen, ltvPct: capexNet > 0 ? (yen / capexNet) * 100 : 0, capped };
  }
  const projectIrr = calcIRR(input);
  // 返済期間が耐用年数を超えるとき（画面は parseLenderInput で 3 シナリオの最短の耐用年数に揃えて止める。ここは関数単体の守り）:
  // 耐用年数の後の元利払いが CF に入らず、エクイティ IRR と最大借入額が良く出るので出さない
  const exceeds = p.termYears > life;
  const balanceAtLifeEndYen = exceeds ? schedule[life - 1]?.balanceEndYen ?? debt : 0;
  const eq = equity <= 0 ? { irr: null, issue: 'no-equity' as const } : exceeds ? { irr: null, issue: 'term-exceeds-life' as const } : irrIfUnique(equityCfs);
  const afterIns = p.insuranceYen > 0 ? irrIfUnique(netCfs) : { irr: projectIrr, issue: null };
  return {
    capexNetYen: capexNet,
    debtYen: debt,
    equityYen: equity,
    totalInterestYen: schedule.reduce((s, y) => s + y.interestYen, 0),
    years,
    minDscr,
    belowReqYears,
    maxDebt: exceeds ? null : maxDebt,
    equityIrr: eq.irr,
    equityIrrIssue: eq.issue,
    balanceAtLifeEndYen,
    projectIrr,
    // 保険料を差し引いたプロジェクト IRR も、CF の符号が 2 回以上変わるなら出さない
    projectIrrAfterInsurance: afterIns.irr,
    projectIrrAfterInsuranceIssue: afterIns.issue,
  };
}

/** 3 シナリオの最短の耐用年数（返済期間の上限。URL の復元で標準だけ耐用年数が変わることがあるため・T4 レビュー） */
export function minLifespanYears(inputs: readonly IRRInput[]): number {
  return Math.min(...inputs.map((i) => i.lifespan_years));
}

// ─── 上限価格シナリオ（需給調整収益の上限）───

/**
 * 上限価格の区間（サーバが src/lib/balancing-cap.ts の capSegments() で組み立てて渡す・値は焼き込まない）。
 * 型は balancing-cap.ts の CapSegment と同じ形（JSON を読むモジュールから値を import しないため、ここにも型だけ置く）。
 */
export type CapSegmentView = {
  value: number;
  from: string;
  /** 適用の最終日（null＝継続中） */
  to: string | null;
  products: string[];
};

/**
 * 需給調整収益の上限（円/年）＝その上限価格で全コマ約定した場合（落札率 100%）。落札率を下げるとその割合。
 * T1 で切り出した収益の式（balancingRevenueYen・1 年＝BLOCKS_PER_YEAR コマ）をそのまま使う。kW はシナリオごとの出力。
 * 選んだ上限価格は耐用年数の全年に同じ値で当てはめる（ボタンの適用期間は、その上限が実際に有効だった期間）。
 */
export function capUpperRevenueYen(capYenPerKwBlock: number, kw: number, ratePct: number): number {
  return balancingRevenueYen(capYenPerKwBlock, kw, BLOCKS_PER_YEAR, ratePct);
}

/**
 * 需給調整収益を年額 annualYen に置き換えた入力（既存モデルの需給調整対価＝円/kW/月 に換算して入れる）。
 * 計算の経路は既存の calculateAll／annualCashflowYen のまま（ancillaryRevenueYen ＝ kW × 円/kW/月 × 12）。
 */
export function withAncillaryAnnualYen(input: IRRInput, annualYen: number): IRRInput {
  const kw = input.output_mw * 1000;
  return { ...input, ancillary_yen_per_kw_month: kw > 0 ? annualYen / kw / 12 : 0 };
}

// ─── URL（既存の URL 共有に乗せる・空欄の項目は書かない）───

const URL_KEYS: Record<keyof LenderTextInput, string> = {
  ltv: 'lv',
  rate: 'ir',
  term: 'tn',
  method: 'rm',
  grace: 'gp',
  dscrReq: 'dr',
  insurance: 'ip',
};

export function appendLenderParams(sp: URLSearchParams, t: LenderTextInput): URLSearchParams {
  for (const [k, key] of Object.entries(URL_KEYS) as [keyof LenderTextInput, string][]) {
    const v = t[k].trim();
    if (v !== '') sp.set(key, v);
  }
  return sp;
}

export function lenderFromParams(sp: URLSearchParams): LenderTextInput {
  const out: LenderTextInput = { ...EMPTY_LENDER_INPUT };
  for (const [k, key] of Object.entries(URL_KEYS) as [keyof LenderTextInput, string][]) {
    const v = sp.get(key);
    if (v === null) continue;
    if (k === 'method') out.method = v === 'annuity' || v === 'equal-principal' ? v : '';
    else out[k] = v.slice(0, 40);
  }
  return out;
}
