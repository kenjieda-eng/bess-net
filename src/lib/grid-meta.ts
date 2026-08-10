/**
 * src/lib/grid-meta.ts — Gr6（2026-08-09）/grid のエリア・県ページの title / description
 *
 * 背景（GSC 2026-05-08〜08-07）:
 *  「◯◯電力 空き容量」で上位に出ているのに CTR がほぼ 0 だった。
 *   中部電力 空き容量 220表示・8.7位・CTR 0% ／ 関西電力 空き容量 139・8.0位・0%
 *   東北電力 空き容量 135・7.1位・0.7% ／ 中国電力 空き容量 90・7.3位・1.0%
 *  実査したところ、エリアページの title は「{エリア}エリア｜蓄電池 系統空き容量DB」で、
 *  **検索語に含まれる「◯◯電力」が1文字も入っていなかった**（10エリアすべて）。
 *
 * ★県ページについての実測（重要・誤解を避けるために記録）:
 *  47県の title は**すべて同一テンプレート**「{県}の変電所一覧｜蓄電池 系統空き容量DB」であり、
 *  三重県 3.16% と 静岡県 0.82% の CTR 差は **title では説明できない**。
 *  高CTR群(≥2.5%)と低CTR群(<1.5%)を比べると平均掲載順位は 6.57 vs 6.56 でほぼ同一、
 *  唯一の相関は**変電所数（123件 vs 271件）**だった＝大きい県ほどクエリの意図が散っていると考えられる。
 *  よって本変更は「titleを直せばCTR差が埋まる」ものではなく、
 *  「事業者名という検索語を title に入れて当たり判定を増やす」ものである。
 *
 * 規律は S1（用語集）・S4（補助金）と同じ:
 *  - 既存データからの組み立てのみ。誇張しない
 *  - **自前で切り詰めない**。収まらなければ後ろの要素から落とす
 *  - サイト名は1回だけ
 */

import subsidiesData from '@/data/subsidies.json';

const SITE_SUFFIX = '｜蓄電所ネット';
/** エリアページの目安上限（全角）。事業者名が先頭に来るので短くできる */
const TITLE_MAX = 36;
/**
 * 県ページの上限。事業者名が「中部電力パワーグリッド」のように長く、
 * 36字だと**事業者名が丸ごと落ちる**（＝Gr6 の目的そのものが達成できない）ため緩める。
 *
 * ★S4（補助金）では「その長さでは検索結果に出ないから伸ばさない」と判断したが、ここは事情が違う:
 *   検索語との**マッチ判定は title の全文**に対して行われ、表示上の切り詰めとは別。
 *   「◯◯電力 空き容量」に当てるのが目的なので、表示外になっても入れる価値がある。
 */
const PREF_TITLE_MAX = 42;

/** 事業者名を「◯◯電力」で始まる検索語に当てやすい形にそろえる（正式名をそのまま使う） */
export function operatorLabel(operators: string[]): string {
  return operators[0] ?? '';
}

/** 複数事業者にまたがる県の表記（2社目以降は「ほか」でまとめる＝誤解を生まない） */
export function operatorLabelMulti(operators: string[]): string {
  if (operators.length === 0) return '';
  if (operators.length === 1) return operators[0];
  return `${operators[0]}ほか${operators.length - 1}社`;
}

/**
 * エリアページの title。
 * 「{事業者名}の系統空き容量 — 変電所{n}件（{エリア}エリア）｜蓄電所ネット」
 * 優先度は 事業者名+空き容量 → 件数 → エリア名。
 */
export function buildAreaTitle(areaJp: string, operator: string, count: number | null): string {
  let out = operator ? `${operator}の系統空き容量` : `${areaJp}エリアの系統空き容量`;
  if (count && (out + ` — 変電所${count.toLocaleString()}件` + SITE_SUFFIX).length <= TITLE_MAX) {
    out += ` — 変電所${count.toLocaleString()}件`;
  }
  if (operator && (out + `（${areaJp}エリア）` + SITE_SUFFIX).length <= TITLE_MAX) {
    out += `（${areaJp}エリア）`;
  }
  return `${out}${SITE_SUFFIX}`;
}

export function buildAreaDescription(
  areaJp: string,
  operator: string,
  count: number | null,
  dataDateLabel: string | null,
  base: string
): string {
  const head = [
    operator ? `${operator}管内（${areaJp}エリア）` : `${areaJp}エリア`,
    count ? `の変電所${count.toLocaleString()}件` : 'の変電所',
    'の系統空き容量・予想潮流・N-1電制適用可否を一覧化。',
  ].join('');
  const date = dataDateLabel ? `${dataDateLabel}。` : '';
  return `${head}${date}${base}`.slice(0, 200);
}

/**
 * 県ページの title。
 * 「{県}の変電所 系統空き容量 — {事業者名}管内{n}件｜蓄電所ネット」
 * 優先度は 県名+空き容量 → 事業者名 → 件数。
 */
export function buildPrefTitle(pref: string, operators: string[], count: number | null): string {
  let out = `${pref}の変電所 系統空き容量`;
  const op = operatorLabelMulti(operators);
  const cnt = count ? `${count.toLocaleString()}件` : '';
  // 優先度: 事業者名 ＞ 件数（Gr6 の目的は「◯◯電力」という検索語を title に入れること）
  if (op) {
    const withOp = `${out} — ${op}管内${cnt}`;
    if ((withOp + SITE_SUFFIX).length <= PREF_TITLE_MAX) return `${withOp}${SITE_SUFFIX}`;
    const withOpNoCount = `${out} — ${op}管内`;
    if ((withOpNoCount + SITE_SUFFIX).length <= PREF_TITLE_MAX) return `${withOpNoCount}${SITE_SUFFIX}`;
  }
  if (cnt && (out + ` — ${cnt}` + SITE_SUFFIX).length <= PREF_TITLE_MAX) out += ` — ${cnt}`;
  return `${out}${SITE_SUFFIX}`;
}

export function buildPrefDescription(
  pref: string,
  operators: string[],
  count: number | null,
  dataDateLabel: string | null
): string {
  const op = operatorLabelMulti(operators);
  const who = op ? `${op}管内の` : '';
  const head = `${pref}にある${who}変電所${count ? count.toLocaleString() + '件' : ''}の系統空き容量を、空容量の大きい順に一覧表示。`;
  const date = dataDateLabel ? `${dataDateLabel}。` : '';
  return `${head}${date}N-1電制適用可否・電圧階級もあわせて確認でき、蓄電所の連系検討の初期スクリーニングに使えます。`;
}

/* ------------------------------------------------------------------ *
 * Gr8（2026-08-09）: 県からの導線に使う件数
 * ------------------------------------------------------------------ */

/**
 * この県で使える補助金の件数。
 * applicable_prefs は「東京」「長崎」等の**短縮表記**（落とし穴 #110 の派生元ルール）なので、
 * 県ページ側の「東京都」「長崎県」から接尾辞を落として突合する。
 */
const PREF_SUBSIDY_COUNT: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const s of subsidiesData as Array<{ applicable_prefs?: string[] }>) {
    for (const p of s.applicable_prefs ?? []) out[p] = (out[p] ?? 0) + 1;
  }
  return out;
})();

export function subsidyCountForPref(pref: string): number {
  const short = pref.replace(/[都道府県]$/, '');
  return PREF_SUBSIDY_COUNT[short] ?? PREF_SUBSIDY_COUNT[pref] ?? 0;
}
