/**
 * src/lib/asset-check.ts — /tools/asset-check（蓄電所 評価軸セルフチェック）の純関数（T2 実装便・2026-10-10）
 *
 * 仕様: reports/tool-asset-check-questions-2026-10-10.md の (2)「配点案と画面の構成案」と裁定 R1・R2・R7。
 *   - 回答は はい（整備済み＝1）／不明（0.5）／いいえ（未整備＝0）／該当しない（分子・分母から除く）。
 *   - 「該当しない」は当てはまる条件がある問い（allowsNotApplicable）にだけ出す。
 *   - 軸の値＝（該当する問いの点の和）÷（該当する問いの数）× 100（報告 (2) のとおり）。重み付けは置かない。
 *     未回答の問いは点 0 で分母に入る（全問に答えるまでは途中経過）。軸ごとに「回答 k／該当 n」を出し、途中経過だと分かるようにする。
 *   - 全問が「該当しない」の軸は「対象外」（0% でも 100% でもない）。
 *     該当する問いがあって 1 問も答えていない軸は、0% と出すと「未整備」と読まれるので「未回答」と出す（表示だけの扱い・報告に申告）。
 *   - 前提の質問（採点しない・R2）の答えから「該当しない」を自動で決める。利用者が問いに答えれば、そちらを優先する（手で変えられる）。
 *
 * 当サイトは評価者ではない: 値は「整備済みの割合」で良し悪しではない。順位・格付けの語は出さない（verify:asset-check が検査）。
 * 入力は保存しない・送らない（このファイルは計算だけ。保存の API を使わない）。
 */
import type { AssetCheckAxisKey, AssetCheckQuestion } from '@/data/asset-check-questions';
import { CHECKLIST as FIRE_RISK_CHECKLIST, CATEGORY_LABELS as FIRE_RISK_CATEGORY_LABELS } from '@/data/fire-risk-checklist';

export type AssetCheckAnswer = 'yes' | 'unknown' | 'no' | 'na';

export const ANSWER_LABEL: Record<AssetCheckAnswer, string> = {
  yes: 'はい',
  no: 'いいえ',
  unknown: '不明',
  na: '該当しない',
};

/** 点（「該当しない」は点を持たない＝分子・分母から除く） */
export const ANSWER_POINTS: Record<Exclude<AssetCheckAnswer, 'na'>, number> = { yes: 1, unknown: 0.5, no: 0 };

/** 問いの選択肢（「該当しない」は条件がある問いだけ） */
export function answerOptions(q: Pick<AssetCheckQuestion, 'allowsNotApplicable'>): AssetCheckAnswer[] {
  return q.allowsNotApplicable ? ['yes', 'no', 'unknown', 'na'] : ['yes', 'no', 'unknown'];
}

// ─── 前提の質問（採点しない・R2） ───

export type PremiseKey = 'operating' | 'voltage' | 'land' | 'aggregator' | 'om' | 'markets' | 'insurance' | 'generationBusiness' | 'ltdcOrSii';
export type PremiseAnswers = Partial<Record<PremiseKey, string>>;

export type Premise = {
  key: PremiseKey;
  question: string;
  options: { value: string; label: string }[];
  /** この前提の答えで「該当しない」になる問い（答え → 問い id の一覧） */
  notApplicable: Record<string, string[]>;
};

/**
 * 前提の質問 9 つ（報告 (2) 画面の構成 2）。「該当しない」の自動判定は各問の applies_when に合わせる。
 * 迷ったときは答えずに置けばよい（自動判定をしない＝各問で選ぶ）。
 */
export const PREMISES: Premise[] = [
  {
    key: 'operating',
    question: '蓄電所は運転を始めていますか',
    options: [
      { value: 'yes', label: '始めている' },
      { value: 'no', label: 'まだ始めていない' },
    ],
    // E7 は外す: 容量確保契約は運転開始前でも持てる（E7 の条件は「需給調整市場に参加している、または容量確保契約がある」）。E7 は参加市場の前提で判定
    notApplicable: { no: ['E1', 'E3', 'E4', 'E6'] },
  },
  {
    key: 'voltage',
    question: '系統に連系する電圧は',
    options: [
      { value: 'lv_small', label: '低圧（出力 10kW 未満）' },
      { value: 'lv', label: '低圧（出力 10kW 以上）' },
      { value: 'hv', label: '高圧' },
      { value: 'ehv', label: '特別高圧' },
    ],
    // D1: 接続検討の申込みが要るのは高圧・特別高圧／D4: N-1 電制は特別高圧だけ／D5: ノンファーム型接続は 10kW 未満の低圧を除く
    notApplicable: { lv_small: ['D1', 'D4', 'D5'], lv: ['D1', 'D4'], hv: ['D4'] },
  },
  {
    key: 'land',
    question: '敷地の権利は（進入路などの一部でも賃借していれば「賃借」）',
    options: [
      { value: 'own', label: '所有' },
      { value: 'lease', label: '賃借' },
      { value: 'superficies', label: '地上権' },
      { value: 'other', label: 'その他' },
    ],
    // F7: 賃借権の譲渡の定め（賃借だけ）／F8: 土地の契約の終了日・撤去（借りている場合）。
    // 「その他」は賃借が混じっていることがあるので F7・F8 とも自動にしない
    notApplicable: { own: ['F7', 'F8'], superficies: ['F7'] },
  },
  {
    key: 'aggregator',
    question: '市場での運用をアグリゲーターに委託していますか',
    options: [
      { value: 'yes', label: '委託している' },
      { value: 'no', label: '委託していない' },
    ],
    notApplicable: { no: ['F1', 'F3', 'H3'] },
  },
  {
    key: 'om',
    question: 'O&M（運転・保守）を外部に委託していますか',
    options: [
      { value: 'yes', label: '委託している' },
      { value: 'no', label: 'すべて自社で行っている' },
    ],
    notApplicable: { no: ['F5'] },
  },
  {
    key: 'markets',
    // E3 の条件は「需給調整市場に参加している（いた）」＝過去の参加も含むので、問いも「（いた）」にする。
    // E7 は容量確保契約があれば当てはまる（運転開始前の長期脱炭素電源オークションの落札も）ので、問いに契約を明記する
    question: '参加している（いた）市場と、容量市場の容量確保契約は',
    options: [
      { value: 'balancing', label: '需給調整市場だけ' },
      { value: 'capacity', label: '容量確保契約だけ（長期脱炭素電源オークションを含む）' },
      { value: 'both', label: '需給調整市場と容量確保契約' },
      { value: 'none', label: 'どちらも無い（参加も契約もしていない）' },
    ],
    notApplicable: { capacity: ['E3'], none: ['E3', 'E7'] },
  },
  {
    key: 'insurance',
    question: '加入している保険は',
    options: [
      { value: 'both', label: '財物（火災保険など）と事業中断（利益）' },
      { value: 'property', label: '財物だけ' },
      { value: 'bi', label: '事業中断（利益）だけ' },
      { value: 'none', label: 'どちらも加入していない' },
    ],
    notApplicable: { property: ['G5'], none: ['G2', 'G3', 'G4', 'G5'] },
  },
  {
    key: 'generationBusiness',
    question: '発電事業の届出（電気事業法第27条の27）をしていますか',
    options: [
      { value: 'yes', label: '届け出ている' },
      { value: 'no', label: '届け出ていない' },
    ],
    // 特定卸供給は「発電事業者を除く」者から集約するもの（電気事業法第2条第1項第15号の2）
    notApplicable: { yes: ['H3'] },
  },
  {
    key: 'ltdcOrSii',
    question: '長期脱炭素電源オークションへの応札、または SII の系統用蓄電システム等導入支援事業（令和7年度補正）の補助（申請中・申請予定を含む）がありますか',
    options: [
      { value: 'yes', label: 'ある' },
      { value: 'no', label: 'どちらもない' },
    ],
    notApplicable: { no: ['A2'] },
  },
];

/** 前提の答えから「該当しない」になる問い id の集合 */
export function autoNotApplicable(premises: PremiseAnswers): Set<string> {
  const s = new Set<string>();
  for (const p of PREMISES) {
    const v = premises[p.key];
    if (v) for (const id of p.notApplicable[v] ?? []) s.add(id);
  }
  return s;
}

/** 利用者の答え（優先）と前提からの自動判定を合わせた、各問の答え。答えが無ければ undefined */
export function effectiveAnswers(
  questions: Pick<AssetCheckQuestion, 'id' | 'allowsNotApplicable'>[],
  user: Record<string, AssetCheckAnswer | undefined>,
  premises: PremiseAnswers,
): Record<string, AssetCheckAnswer | undefined> {
  const auto = autoNotApplicable(premises);
  const out: Record<string, AssetCheckAnswer | undefined> = {};
  for (const q of questions) {
    const u = user[q.id];
    if (u && (u !== 'na' || q.allowsNotApplicable)) out[q.id] = u;
    else if (auto.has(q.id) && q.allowsNotApplicable) out[q.id] = 'na';
    else out[q.id] = undefined;
  }
  return out;
}

// ─── 集計 ───

export type AxisStatus = 'value' | 'notApplicable' | 'unanswered';

export type AxisSummary = {
  axis: AssetCheckAxisKey;
  /** 軸の問い数 */
  total: number;
  /** 該当する問いの数（「該当しない」を除く。未回答は含む） */
  applicable: number;
  /** 回答した該当する問いの数 */
  answered: number;
  /** 整備済みの割合（0〜100・小数あり・分母は該当する問いの数）。status が value のときだけ */
  percent: number | null;
  status: AxisStatus;
  yes: number;
  unknown: number;
  no: number;
  notApplicable: number;
};

export function summarizeAxes(
  axes: { key: AssetCheckAxisKey }[],
  questions: Pick<AssetCheckQuestion, 'id' | 'axis'>[],
  answers: Record<string, AssetCheckAnswer | undefined>,
): AxisSummary[] {
  return axes.map(({ key }) => {
    const qs = questions.filter((q) => q.axis === key);
    let yes = 0, unknown = 0, no = 0, na = 0, points = 0;
    for (const q of qs) {
      const a = answers[q.id];
      if (a === 'na') na++;
      else if (a === 'yes') { yes++; points += ANSWER_POINTS.yes; }
      else if (a === 'unknown') { unknown++; points += ANSWER_POINTS.unknown; }
      else if (a === 'no') { no++; points += ANSWER_POINTS.no; }
    }
    const applicable = qs.length - na;
    const answered = yes + unknown + no;
    const status: AxisStatus = applicable === 0 ? 'notApplicable' : answered === 0 ? 'unanswered' : 'value';
    return {
      axis: key,
      total: qs.length,
      applicable,
      answered,
      // 分母は該当する問いの数（未回答は点 0）＝報告 (2) の式
      percent: status === 'value' ? (points / applicable) * 100 : null,
      status,
      yes,
      unknown,
      no,
      notApplicable: na,
    };
  });
}

/** 一覧（未整備・不明・該当しない）。並びは設問の順 */
export function listByAnswer<Q extends Pick<AssetCheckQuestion, 'id'>>(
  questions: Q[],
  answers: Record<string, AssetCheckAnswer | undefined>,
  answer: AssetCheckAnswer,
): Q[] {
  return questions.filter((q) => answers[q.id] === answer);
}

// ─── 画面の注記（報告 (2) 画面の構成 7・8・裁定 R5・R8） ───

export type QuestionNote = { text: string; href?: string; linkLabel?: string };

/** fire-risk-check へのリンクの断り（R8）。リンク先は点数を付けるツールで、この棚卸しとは別 */
export const FIRE_RISK_DISCLAIMER = 'リンク先は火災リスクを点数で見る別のツールで、この棚卸しとは別です（点数はこのページに持ち込みません）。';

/**
 * fire-risk-check の設問の位置（「緊急対応 Q4」など）と問いの文は、その定義（src/data/fire-risk-checklist.ts）から引く。
 * 手で書くと、向こうの並びや見出しが変わったときに食い違う（#121＝同じ意味の値を 2 か所に置かない）。
 */
export function fireRiskRef(id: string): { label: string; question: string } {
  const item = FIRE_RISK_CHECKLIST.find((i) => i.id === id);
  if (!item) throw new Error(`fire-risk-check に無い設問 id: ${id}`);
  const n = FIRE_RISK_CHECKLIST.filter((i) => i.category === item.category).findIndex((i) => i.id === id) + 1;
  return { label: `${FIRE_RISK_CATEGORY_LABELS[item.category]} Q${n}`, question: item.question };
}

const fireNote = (fireId: string, thisAsks: string): QuestionNote => {
  const r = fireRiskRef(fireId);
  // 英数字で始まるときは前に半角スペース（「この問いは SOH の…」。サイトの書き方に合わせる）
  const sep = /^[A-Za-z0-9]/.test(thisAsks) ? ' ' : '';
  return {
    text: `「${r.question}」は火災リスク自己診断（${r.label}）で聞いています。この問いは${sep}${thisAsks}だけを問います。${FIRE_RISK_DISCLAIMER}`,
    href: '/tools/fire-risk-check',
    linkLabel: '蓄電池火災リスク自己診断',
  };
};

export const QUESTION_NOTES: Record<string, QuestionNote[]> = {
  B7: [{ text: '系統の軸の D1（接続検討の回答書）と組で揃えると確かめやすい書類です。' }],
  C2: [{ text: '「区域外」は浸水の危険が無いという意味ではありません。浸水想定区域は、指定された河川・下水道などごとに定められます。' }],
  D4: [{ text: '自設備の接続条件を問う問いです。D7 の変電所ごとの公表値（N-1 電制の適用可否）とは別のものです。' }],
  D5: [{ text: '自設備の接続条件を問う問いです。D7 の変電所ごとの公表値（ノンファーム接続の適用可否）とは別のものです。' }],
  D7: [
    {
      text: '変電所ごとの公表値で、自設備の接続条件（D4・D5）とは別のものです。当サイトの変電所データベースで「N-1 電制」が「未算定」「公表なし」の変電所は、「不可」という意味ではありません。',
      href: '/grid',
      linkLabel: '変電所 系統空き容量データベース',
    },
  ],
  E4: [fireNote('cell-5', 'SOH の値を測り方つきで記録しているか')],
  F5: [fireNote('operation-4', 'O&M 契約書の写しと、その範囲・SLA・終了日を確かめたか')],
  G1: [fireNote('emergency-4', '加入している保険の証券・約款が手元にあり一覧になっているか')],
};

/** fire-risk-check に任せる項目（この棚卸しでは聞かない・報告 (2) 画面の構成 7）。表示は定義から引く */
export const DELEGATED_FIRE_RISK_IDS = ['cell-1', 'emergency-4', 'operation-5', 'emergency-2', 'building-1'] as const;
export const DELEGATED_TO_FIRE_RISK_CHECK: { label: string; question: string }[] = DELEGATED_FIRE_RISK_IDS.map((id) => fireRiskRef(id));

/** 割合の表示（整数に丸める。値が無いときは状態の語） */
export function formatAxisValue(s: Pick<AxisSummary, 'status' | 'percent'>): string {
  if (s.status === 'notApplicable') return '対象外';
  if (s.status === 'unanswered') return '未回答';
  return `${Math.round(s.percent as number)}%`;
}
