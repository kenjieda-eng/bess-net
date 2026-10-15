/**
 * src/lib/residual-value-calc.ts — 蓄電所 残存価値の試算（/tools/residual-value・T7 実装便・2026-10-15）
 *
 * ★当サイトは評価者・鑑定者・助言者ではない: 利用者が入れた前提で、残りの運転期間のキャッシュフローを割り引いた値を並べるだけ。
 *   資産の価格・売買の可否・融資の可否・良し悪しは言わない（ラベル・文に評価の語を入れない）。
 * ★既定値を置かない（T4 と同じ）: 残りの年数・収入・費用・容量の減り・割引率はすべて利用者が入れる。入力例も置かない。
 *   上限価格などカタログの値は画面の参考欄に出すだけで、計算の入力には入れない。
 * ★入力は保存も送信もしない（URL・localStorage 等にも書かない）。このファイルは純関数だけ（JSON を import しない）。
 * ★欄の読み取りと範囲の判定は readField の 1 か所（画面の欄ごとの注意と計算の判定が同じ関数を通る・#119）。
 *
 * 式（t＝1..N。画面の「計算のしかたと前提」と同じ）:
 *   容量係数 k_t ＝ (1 − d)^t                     d＝使える容量の年あたりの減り
 *   収入_t ＝ 収入₀ × (1 + g)^t × k_t             g＝収入の年あたりの変化（容量の減りが収入にそのまま効く前提）
 *   費用_t ＝ 費用₀ × (1 + c)^t                   c＝費用の年あたりの変化
 *   CF_t ＝ 収入_t − 費用_t − その年の任意の支出（t＝N のときは撤去・原状回復の費用も引く）
 *   PV ＝ Σ CF_t ÷ (1 + r)^t                      r＝割引率
 * PV の足し算は src/lib/irr-calculator.ts の npvFromCashflowsYen（[0]＝0・戻り値は億円）をそのまま使い、円に戻す。
 * 丸めは表示だけ（計算の関数は丸めない）。
 *
 * 容量の保証の照合（参考・計算に使わない）: 保証書の「運転開始から Y 年目に初期の P％」と比べるため、
 *   運転開始からの年数 e と、いまの使える容量（初期に対する割合）s₀ を利用者が入れる（既定値は置かない）。
 *   照合値 ＝ s₀ × (1 − d)^(Y − e)（Y ＞ e のときだけ。Y ≦ e は保証の年が過ぎているので照合しない）。
 */
import { npvFromCashflowsYen } from './irr-calculator';
import { parseNumberText } from './balancing-benchmark-calc';

// ─── 式の一次（2026-10-15 に PDF を取り直して逐語と頁を確かめた・台帳 src/data/source-documents.json に登録） ───

/**
 * 割引現在価値の式の一次の逐語（表2-1 の記号の説明・第３項の基準時点）。2026-10-15 に PDF の本文（pdfplumber）で確かめた写し。
 * verify:residual-value --fetch は PDF の sha256 が登録時と同じことと掲載ページの <title> を確かめる（本文の逐語の照合まではしない）。
 */
export const PV_FORMULA_VERBATIM = {
  symbols: 'ただし、n：評価期間、Bt：t年次の便益、Ct：t年次の費用、i：社会的割引率',
  basePoint: '現在価値化の基準時点は、評価を実施する年度とする。',
} as const;

export const PV_FORMULA_SOURCE = {
  publisher: '国土交通省',
  name: '公共事業評価の費用便益分析に関する技術指針（共通編）',
  href: 'https://www.mlit.go.jp/tec/hyouka/public/250918_shishin/shishin/shishin250918.pdf',
  detail:
    `（令和7年9月18日改定）p.4 表2-1 の純現在価値 Σ(Bt − Ct)／(1 + i)^(t−1)（「${PV_FORMULA_VERBATIM.symbols}」）と、p.11「${PV_FORMULA_VERBATIM.basePoint}」。` +
    'このツールは費用・便益の代わりに CF_t を置き、直近 12 か月の後の 1 年目を t＝1 として 1 年分割り引く（指数 t）。時点の取り方は当サイトの前提。',
} as const;

// ─── 入力の範囲（これを外れた値は計算に入れず、画面に注意を出す） ───

export const LIMITS = {
  /** 残りの運転年数（整数） */
  years: { min: 1, max: 40 },
  /** 円の欄（収入・費用・内訳・任意の支出・撤去費用）。上限は桁あふれを避けるための当サイトの扱い（1,000 兆円） */
  yen: { min: 0, max: 1e15 },
  /** 収入・費用の年あたりの変化（%/年） */
  changePct: { min: -100, max: 100 },
  /** 使える容量の年あたりの減り（%/年） */
  fadePct: { min: 0, max: 100 },
  /** 割引率（%/年） */
  discountPct: { min: 0, max: 100 },
  /** 容量の保証の年（運転開始から数えた何年目・整数） */
  warrantyYear: { min: 1, max: 60 },
  /** 運転開始からの年数（小数も可） */
  elapsedYears: { min: 0, max: 60 },
  /** 容量の割合（保証の値・いまの使える容量。初期に対する %） */
  capacityPct: { min: 0, max: 100 },
  /** 任意の支出の行数 */
  extraRows: 10,
} as const;

/** 欄の種類（読み取りと範囲の判定の規則） */
export type FieldKind = 'years' | 'yen' | 'change' | 'fade' | 'discount' | 'extraYear' | 'warrantyYear' | 'elapsed' | 'capacity';

const FIELD_RULES: Readonly<Record<FieldKind, { min: number; max: number; integer: boolean; unit: string }>> = {
  years: { ...LIMITS.years, integer: true, unit: '年' },
  yen: { ...LIMITS.yen, integer: false, unit: '円' },
  change: { ...LIMITS.changePct, integer: false, unit: '%/年' },
  fade: { ...LIMITS.fadePct, integer: false, unit: '%/年' },
  discount: { ...LIMITS.discountPct, integer: false, unit: '%/年' },
  extraYear: { min: 1, max: LIMITS.years.max, integer: true, unit: '年目' },
  warrantyYear: { ...LIMITS.warrantyYear, integer: true, unit: '年目' },
  elapsed: { ...LIMITS.elapsedYears, integer: false, unit: '年' },
  capacity: { ...LIMITS.capacityPct, integer: false, unit: '%' },
};

/** 数を文に埋め込む書き方（桁区切り・指数表記にしない・負の数は「−」） */
export function numText(v: number): string {
  if (Math.abs(v) >= 1e12 && v % 1e12 === 0) return `${(v / 1e12).toLocaleString('ja-JP')} 兆`;
  return v.toLocaleString('ja-JP', { maximumFractionDigits: 6 }).replace(/^-/, '−');
}

/** 範囲の文（例: 「1〜40 の整数（年）」「0〜1,000 兆円の数」「−100〜100 の数（%/年）」）。画面の説明・欄の注意が同じ文を使う */
export function rangeText(kind: FieldKind): string {
  const r = FIELD_RULES[kind];
  if (kind === 'yen') return `${numText(r.min)}〜${numText(r.max)}円の数`;
  return `${numText(r.min)}〜${numText(r.max)} の${r.integer ? '整数' : '数'}（${r.unit}）`;
}

// ─── 数の読み取り ───

/**
 * 数の欄の読み取り。src/lib/balancing-benchmark-calc.ts の parseNumberText（NFKC で全角を半角に・3 桁区切りのカンマだけ可・
 * 単位つきや数として読めないものは invalid）の前に、先頭の 1 文字だけを直す: ハイフン類・長音符（IME で出やすい「ー」）・
 * マイナス記号（U+2212）は「-」に、先頭の「+」は外す。数の途中の記号はこれまでどおり読めない扱い。
 */
export function readNumber(text: string): { value: number | null; invalid: boolean } {
  const t = text
    .normalize('NFKC')
    .trim()
    .replace(/^[‐-―−ー﹣]/, '-')
    .replace(/^\+(?=[\d.])/, '');
  return parseNumberText(t);
}

export type FieldRead = { state: 'blank' } | { state: 'bad'; message: string } | { state: 'num'; value: number };

/** 欄を読み、範囲を確かめる（画面の欄の注意と計算の判定が同じ文を使う） */
export function readField(text: string, kind: FieldKind): FieldRead {
  const p = readNumber(text);
  if (p.invalid) {
    return { state: 'bad', message: kind === 'change' ? '数として読めません（数字で入れてください。負の数は先頭に -）' : '数として読めません（数字だけで入れてください）' };
  }
  if (p.value === null) return { state: 'blank' };
  const r = FIELD_RULES[kind];
  if (p.value < r.min || p.value > r.max || (r.integer && !Number.isInteger(p.value))) return { state: 'bad', message: `${rangeText(kind)}で入れてください` };
  return { state: 'num', value: p.value };
}

/** 小数の桁数（入れた文字のまま数える・保証の値の比べる桁に使う） */
function decimalsOf(text: string): number {
  const m = text.normalize('NFKC').trim().match(/\.(\d+)$/);
  return m ? m[1].length : 0;
}

// ─── 入力（画面の文字列のまま持つ＝空欄と 0 を分ける） ───

export const SCENARIO_KEYS = ['a', 'b', 'c'] as const;
export type ScenarioKey = (typeof SCENARIO_KEYS)[number];
/** 列の名前。楽観・標準・悲観とは呼ばない（どれが良いかを当サイトが決めない） */
export const SCENARIO_LABELS: Readonly<Record<ScenarioKey, string>> = { a: 'シナリオ A', b: 'シナリオ B', c: 'シナリオ C' };

export type ScenarioField = 'revenueChange' | 'capacityFade' | 'costChange' | 'discount';
export const SCENARIO_FIELDS: readonly { key: ScenarioField; label: string; unit: string; kind: FieldKind }[] = [
  { key: 'revenueChange', label: '収入の年あたりの変化', unit: '%/年', kind: 'change' },
  { key: 'capacityFade', label: '使える容量の年あたりの減り', unit: '%/年', kind: 'fade' },
  { key: 'costChange', label: '費用の年あたりの変化', unit: '%/年', kind: 'change' },
  { key: 'discount', label: '割引率', unit: '%/年', kind: 'discount' },
];
export type ScenarioText = Record<ScenarioField, string>;

export type CostItemKey = 'om' | 'insurance' | 'land' | 'grid' | 'aggregator' | 'other';
/** 費用の内訳（任意）。入れた額は「まとめた額」の欄に足すだけ */
export const COST_ITEMS: readonly { key: CostItemKey; label: string }[] = [
  { key: 'om', label: 'O&M（運転・保守）' },
  { key: 'insurance', label: '保険' },
  { key: 'land', label: '土地（賃料など）' },
  { key: 'grid', label: '系統の利用料' },
  { key: 'aggregator', label: 'アグリゲーターの手数料' },
  { key: 'other', label: 'その他' },
];

export type ExtraRowText = { year: string; amount: string };

export type ResidualTextInput = {
  years: string;
  revenue: string;
  cost: string;
  costItems: Record<CostItemKey, string>;
  scenarios: Record<ScenarioKey, ScenarioText>;
  extras: ExtraRowText[];
  removal: string;
  warrantyYear: string;
  warrantyPct: string;
  /** 運転開始からの年数（保証の照合に使う） */
  elapsedYears: string;
  /** いまの使える容量（初期に対する %・保証の照合に使う） */
  currentCapacityPct: string;
};

const emptyScenario = (): ScenarioText => ({ revenueChange: '', capacityFade: '', costChange: '', discount: '' });

/** 初期値はすべて空欄（便 §0: 入力欄は空で始める・入力例も置かない） */
export function emptyResidualInput(): ResidualTextInput {
  return {
    years: '',
    revenue: '',
    cost: '',
    costItems: { om: '', insurance: '', land: '', grid: '', aggregator: '', other: '' },
    scenarios: { a: emptyScenario(), b: emptyScenario(), c: emptyScenario() },
    extras: [{ year: '', amount: '' }],
    removal: '',
    warrantyYear: '',
    warrantyPct: '',
    elapsedYears: '',
    currentCapacityPct: '',
  };
}

// ─── 解析 ───

export type ExtraCost = { year: number; amountYen: number };

export type BaseParams = {
  years: number;
  revenueYen: number;
  /** 費用₀＝まとめた額＋内訳の合計 */
  costYen: number;
  extras: ExtraCost[];
  removalYen: number;
};

export type ScenarioParams = Record<ScenarioField, number>;

export type ScenarioParse =
  | { status: 'empty' }
  | { status: 'incomplete'; missing: string[] }
  | { status: 'invalid'; problems: string[] }
  | { status: 'ok'; params: ScenarioParams };

export type BaseParse =
  | { status: 'incomplete'; missing: string[] }
  | { status: 'invalid'; problems: string[] }
  | { status: 'ok'; params: BaseParams };

export type WarrantyParse =
  | { status: 'empty' }
  | { status: 'incomplete'; missing: string[] }
  | { status: 'invalid'; problems: string[] }
  | { status: 'ok'; year: number; pct: number; elapsed: number; current: number; pctDecimals: number };

export type ParsedResidual = {
  base: BaseParse;
  scenarios: Record<ScenarioKey, ScenarioParse>;
  /** 計算に入れなかった任意の欄（撤去費用・任意の支出）の理由。基本の欄が揃っていても出る */
  extraNotices: string[];
  warranty: WarrantyParse;
};

function parseScenario(t: ScenarioText): ScenarioParse {
  const problems: string[] = [];
  const missing: string[] = [];
  const values: Partial<ScenarioParams> = {};
  for (const f of SCENARIO_FIELDS) {
    const r = readField(t[f.key], f.kind);
    if (r.state === 'bad') problems.push(`${f.label}: ${r.message}`);
    else if (r.state === 'blank') missing.push(f.label);
    else values[f.key] = r.value;
  }
  if (missing.length === SCENARIO_FIELDS.length) return { status: 'empty' };
  if (problems.length > 0) return { status: 'invalid', problems };
  if (missing.length > 0) return { status: 'incomplete', missing };
  return { status: 'ok', params: values as ScenarioParams };
}

/** 入力の読み取り。範囲外・読めない値は計算に入れず、理由を返す */
export function parseResidualInput(t: ResidualTextInput): ParsedResidual {
  const problems: string[] = [];
  const missing: string[] = [];
  const req = (label: string, text: string, kind: FieldKind): number | 'blank' | 'bad' => {
    const r = readField(text, kind);
    if (r.state === 'bad') {
      problems.push(`${label}: ${r.message}`);
      return 'bad';
    }
    return r.state === 'blank' ? 'blank' : r.value;
  };
  const years = req('残りの運転年数', t.years, 'years');
  if (years === 'blank') missing.push('残りの運転年数');
  const revenue = req('直近 12 か月の収入', t.revenue, 'yen');
  if (revenue === 'blank') missing.push('直近 12 か月の収入');
  // 費用₀＝まとめた額＋内訳（内訳は任意で、入れた額を足すだけ）。どれか 1 つ入っていれば「費用を入れた」とする。
  // 内訳が読めない・範囲外なら計算しない（費用を黙って少なく数えない）
  const costTotal = req('直近 12 か月の費用（まとめた額）', t.cost, 'yen');
  const items = COST_ITEMS.map((it) => req(`費用の内訳（${it.label}）`, t.costItems[it.key], 'yen'));
  if (costTotal === 'blank' && items.every((v) => v === 'blank')) missing.push('直近 12 か月の費用');
  const costYen = [costTotal, ...items].reduce<number>((sum, v) => (typeof v === 'number' ? sum + v : sum), 0);
  if (costYen > LIMITS.yen.max) problems.push(`直近 12 か月の費用（まとめた額と内訳の合計）: ${rangeText('yen')}で入れてください`);

  // 任意の欄（撤去費用・任意の支出）は、読めない・範囲外ならその欄だけ計算に入れず注意を出す（基本の欄は揃っていれば計算する）
  const extraNotices: string[] = [];
  const removal = readField(t.removal, 'yen');
  if (removal.state === 'bad') extraNotices.push(`撤去・原状回復の費用: ${removal.message}（計算に入れていません）`);
  const removalYen = removal.state === 'num' ? removal.value : 0;

  // 任意の支出（何年目と金額の両方が揃い、範囲内の行だけ計算に入れる）
  const extras: ExtraCost[] = [];
  const n = typeof years === 'number' ? years : null;
  t.extras.slice(0, LIMITS.extraRows).forEach((row, i) => {
    const y = readField(row.year, 'extraYear');
    const a = readField(row.amount, 'yen');
    const name = `任意の支出 ${i + 1} 行目`;
    let reason: string | null = null;
    if (y.state === 'blank' && a.state === 'blank') return; // 空の行
    if (y.state === 'bad') reason = `支出の年: ${y.message}`;
    else if (a.state === 'bad') reason = `金額: ${a.message}`;
    else if (y.state === 'blank' || a.state === 'blank') reason = '支出の年と金額の両方を入れてください';
    else if (n !== null && y.value > n) reason = `${numText(y.value)} 年目は残りの運転年数（${n} 年）より後です`;
    if (reason !== null) extraNotices.push(`${name}: ${reason}（計算に入れていません）`);
    else if (y.state === 'num' && a.state === 'num') extras.push({ year: y.value, amountYen: a.value });
  });
  if (t.extras.length > LIMITS.extraRows) extraNotices.push(`任意の支出は ${LIMITS.extraRows} 行までを計算に入れます`);

  const scenarios = Object.fromEntries(SCENARIO_KEYS.map((k) => [k, parseScenario(t.scenarios[k])])) as Record<ScenarioKey, ScenarioParse>;

  // 容量の保証（参考の照合だけ・計算に使わない）。4 つの欄がそろったときだけ照合する
  let warranty: WarrantyParse = { status: 'empty' };
  const wFields: [string, string, FieldKind][] = [
    ['保証の年', t.warrantyYear, 'warrantyYear'],
    ['保証の値', t.warrantyPct, 'capacity'],
    ['運転開始からの年数', t.elapsedYears, 'elapsed'],
    ['いまの使える容量', t.currentCapacityPct, 'capacity'],
  ];
  const wReads = wFields.map(([label, text, kind]) => ({ label, r: readField(text, kind) }));
  if (wReads.some((w) => w.r.state !== 'blank')) {
    const bad = wReads.filter((w) => w.r.state === 'bad');
    const blank = wReads.filter((w) => w.r.state === 'blank');
    if (bad.length > 0) warranty = { status: 'invalid', problems: bad.map((w) => `${w.label}: ${(w.r as { message: string }).message}`) };
    else if (blank.length > 0) warranty = { status: 'incomplete', missing: blank.map((w) => w.label) };
    else {
      const v = wReads.map((w) => (w.r as { value: number }).value);
      warranty = { status: 'ok', year: v[0], pct: v[1], elapsed: v[2], current: v[3], pctDecimals: decimalsOf(t.warrantyPct) };
    }
  }

  let base: BaseParse;
  if (problems.length > 0) base = { status: 'invalid', problems };
  else if (missing.length > 0) base = { status: 'incomplete', missing };
  else base = { status: 'ok', params: { years: n as number, revenueYen: revenue as number, costYen, extras, removalYen } };
  return { base, scenarios, extraNotices, warranty };
}

// ─── 計算 ───

export type YearRow = {
  year: number;
  /** 容量係数 k_t＝(1 − d)^t */
  capacityFactor: number;
  revenueYen: number;
  costYen: number;
  /** その年の任意の支出（増設・交換など）の合計 */
  extraYen: number;
  /** 撤去・原状回復の費用（t＝N の年だけ） */
  removalYen: number;
  cfYen: number;
  /** CF_t ÷ (1 + r)^t */
  discountedYen: number;
};

export type ScenarioResult = {
  rows: YearRow[];
  /** [0]＝0・[t]＝CF_t（npvFromCashflowsYen に渡した列） */
  cashflowsYen: number[];
  /** 割引現在価値（円・丸めない） */
  pvYen: number;
};

/** 1 シナリオ分の計算（式は冒頭のコメントのとおり） */
export function computeScenario(base: BaseParams, s: ScenarioParams): ScenarioResult {
  const d = s.capacityFade / 100;
  const g = s.revenueChange / 100;
  const c = s.costChange / 100;
  const r = s.discount / 100;
  const cashflowsYen: number[] = [0];
  const rows: YearRow[] = [];
  for (let t = 1; t <= base.years; t++) {
    const k = Math.pow(1 - d, t);
    const revenueYen = base.revenueYen * Math.pow(1 + g, t) * k;
    const costYen = base.costYen * Math.pow(1 + c, t);
    const extraYen = base.extras.filter((e) => e.year === t).reduce((sum, e) => sum + e.amountYen, 0);
    const removalYen = t === base.years ? base.removalYen : 0;
    const cfYen = revenueYen - costYen - extraYen - removalYen;
    cashflowsYen.push(cfYen);
    rows.push({ year: t, capacityFactor: k, revenueYen, costYen, extraYen, removalYen, cfYen, discountedYen: cfYen / Math.pow(1 + r, t) });
  }
  // 足し算は IRR シミュレーターと同じ関数（億円で返る）。表示は円
  const pvYen = npvFromCashflowsYen(cashflowsYen, r) * 1e8;
  return { rows, cashflowsYen, pvYen };
}

// ─── 容量の保証の照合（参考・計算に使わない） ───

export type WarrantyCompare = {
  key: ScenarioKey;
  /** 保証の年の使える容量（初期に対する %・丸めない） */
  capacityPct: number;
  relation: 'above' | 'below' | 'equal';
  /** 比べた桁（小数の桁数） */
  digits: number;
};

export const WARRANTY_RELATION_LABEL: Readonly<Record<WarrantyCompare['relation'], string>> = {
  above: '保証の値より上',
  below: '保証の値より下',
  equal: '保証の値と同じ',
};

/**
 * 保証の年の容量（初期に対する %）＝ いまの容量 × (1 − d)^(保証の年 − 運転開始からの年数)。
 * 上／下は、画面に出す桁（小数第 2 位、保証の値をそれより細かく入れたらその桁・最大 6 桁）に丸めた値で決める（表示と判定を食い違わせない）。
 */
export function warrantyCompare(w: { year: number; pct: number; elapsed: number; current: number; pctDecimals: number }, key: ScenarioKey, capacityFadePct: number): WarrantyCompare {
  const capacityPct = w.current * Math.pow(1 - capacityFadePct / 100, w.year - w.elapsed);
  const digits = Math.min(6, Math.max(2, w.pctDecimals));
  const f = 10 ** digits;
  const shown = Math.round(capacityPct * f) / f;
  const relation = shown > w.pct ? 'above' : shown < w.pct ? 'below' : 'equal';
  return { key, capacityPct, relation, digits };
}

export type WarrantyOutcome =
  | { status: 'none' }
  /** 保証の年が運転開始からの年数までに過ぎている */
  | { status: 'past' }
  /** 容量の減りの欄が読める列がまだ無い */
  | { status: 'no-fade' }
  /** horizonYears＝いまから保証の年までの年数・beyondRemaining＝残りの運転年数より後（残りの年数が未入力なら null） */
  | { status: 'ok'; rows: WarrantyCompare[]; horizonYears: number; beyondRemaining: boolean | null };

export type ScenarioOutcome = { key: ScenarioKey; parse: ScenarioParse; result: ScenarioResult | null };

export type ResidualOutcome = {
  parsed: ParsedResidual;
  /** 入力の順（A・B・C）のまま。並べ替えない */
  scenarios: ScenarioOutcome[];
  /** 計算できた列の最小〜最大（円・丸めない）。計算できた列が無ければ null */
  range: { minYen: number; maxYen: number; count: number } | null;
  warranty: WarrantyOutcome;
};

/** 入力の文字列から結果まで（画面と verify が同じ関数を通る） */
export function computeResidual(t: ResidualTextInput): ResidualOutcome {
  const parsed = parseResidualInput(t);
  const base = parsed.base.status === 'ok' ? parsed.base.params : null;
  const scenarios: ScenarioOutcome[] = SCENARIO_KEYS.map((key) => {
    const p = parsed.scenarios[key];
    return { key, parse: p, result: base && p.status === 'ok' ? computeScenario(base, p.params) : null };
  });
  const pvs = scenarios.map((s) => s.result?.pvYen).filter((v): v is number => typeof v === 'number');
  const range = pvs.length > 0 ? { minYen: Math.min(...pvs), maxYen: Math.max(...pvs), count: pvs.length } : null;
  // 保証の照合は容量の減りの欄だけを使う（列の他の欄が空でも、減りが読めれば照合する）
  let warranty: WarrantyOutcome = { status: 'none' };
  const w = parsed.warranty;
  if (w.status === 'ok') {
    if (w.year <= w.elapsed) warranty = { status: 'past' };
    else {
      const rows = SCENARIO_KEYS.flatMap((key) => {
        const fade = readField(t.scenarios[key].capacityFade, 'fade');
        return fade.state === 'num' ? [warrantyCompare(w, key, fade.value)] : [];
      });
      const years = readField(t.years, 'years');
      const horizonYears = w.year - w.elapsed;
      warranty = rows.length === 0 ? { status: 'no-fade' } : { status: 'ok', rows, horizonYears, beyondRemaining: years.state === 'num' ? horizonYears > years.value : null };
    }
  }
  return { parsed, scenarios, range, warranty };
}

// ─── 表示（丸めは表示だけ） ───

/** 千円単位に丸めた数（絶対値で四捨五入＝正負で対称）。−0 は 0 */
function thousands(yen: number): number {
  const k = Math.sign(yen) * Math.round(Math.abs(yen) / 1000);
  return k === 0 ? 0 : k;
}

/** 円を千円単位で丸めた文字列（例: 123,457,000 円） */
export function yenRoundedText(yen: number): string {
  return `${(thousands(yen) * 1000).toLocaleString('ja-JP')} 円`;
}

/** 千円単位の数（表の値・例: 123,457） */
export function thousandYenText(yen: number): string {
  return thousands(yen).toLocaleString('ja-JP');
}

/** 「計算できた列の最小〜最大」の文（画面と verify が同じ関数を使う） */
export function rangeSummaryText(range: ResidualOutcome['range']): string {
  if (range === null) return '—';
  if (range.count === 1) return `${yenRoundedText(range.minYen)}（計算できた列は 1 つ）`;
  return `${yenRoundedText(range.minYen)}〜${yenRoundedText(range.maxYen)}（${range.count} 列）`;
}
