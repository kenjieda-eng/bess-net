/**
 * src/lib/n1-status.ts — N-1電制適用可否の表示区分（三値化 段1・N1b・2026-10-03）
 *
 * ★なぜ要るか
 *   microCMS の n1_eligible は boolean（null 不可）のため、公表 CSV の N-1 欄が「－」「―」「-」（未算定）・空欄・
 *   列なし（沖縄）の設備が false＝「不可」と表示されていた（/grid/hokuriku の「不可」40 件のうち 39 件が実は未算定・
 *   空容量プラス TOP20 は 20/20）。段1 は microCMS を触らず、リポ側の一覧で表示を直す（裁定 2026-10-02 案C）。
 *
 * ★真実源は src/data/n1-status.json（TS と Python が同じ JSON を読む・#119）。生成は
 *   scripts/experimental/_common/build_n1_status.py。表示の全経路（precompute・個別ページ）がこの 1 か所を通る（#121・L-EIC-028）。
 *
 * 規則:
 *   - n1_eligible === true → 'ok'（一覧にあっても true が勝つ。矛盾は verify:grid-fields で 0 を要求）
 *   - 一覧にあり、as_of が microCMS の last_updated と一致 → reason に応じて 'undetermined'（undetermined・blank）／'no_column'
 *     （as_of がずれた＝再取込で値が更新された行には古い一覧を当てない → boolean に戻す）
 *   - それ以外 → 'ng'
 * 「可」の件数（isN1Ok）はこの区分の導入で変わらない（未算定は全件 false だったため）。
 * 「0MW可」は区分にしない（可能量 0 の「可」は可能量で表す・計画便の判断）。
 */
import n1StatusData from '../data/n1-status.json';
import type { N1Status } from './n1-status-label';

export type { N1Status } from './n1-status-label';
export { n1StatusLabel, isN1Ok, n1StatusBadgeClass, n1StatusFromRow } from './n1-status-label';

type N1Reason = 'undetermined' | 'blank' | 'no_column';
type N1Entry = { area: string | null; reason: N1Reason; as_of: string | null };

const ENTRIES = (n1StatusData as unknown as { entries: Record<string, N1Entry> }).entries;

/** 一覧に載っている slug（verify・precompute の件数照合用） */
export const N1_STATUS_SLUGS: ReadonlySet<string> = new Set(Object.keys(ENTRIES));

/** last_updated の表記揺れ（'2026-08-05T00:00:00.000Z' と '2026-08-05'）を吸収して比較する */
function sameDate(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a === b || a.slice(0, 10) === b.slice(0, 10);
}

export function n1StatusOf(s: {
  slug: string;
  n1_eligible?: boolean | null;
  last_updated?: string | null;
}): N1Status {
  if (s.n1_eligible === true) return 'ok';
  const e = ENTRIES[s.slug];
  if (e && sameDate(e.as_of, s.last_updated)) return e.reason === 'no_column' ? 'no_column' : 'undetermined';
  return 'ng';
}

/** 一覧にあるが as_of が microCMS と一致しない（＝再取込で更新された可能性）か。verify の WARN 用 */
export function n1StatusAsOfMismatch(s: { slug: string; last_updated?: string | null }): boolean {
  const e = ENTRIES[s.slug];
  return !!e && !sameDate(e.as_of, s.last_updated);
}
