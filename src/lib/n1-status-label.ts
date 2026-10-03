/**
 * src/lib/n1-status-label.ts — N-1電制の表示区分の型とラベル（データを持たない純粋な部品・N1b・2026-10-03）
 *
 * クライアントコンポーネント（SubstationsBrowser・GridConnectionChecker）からも読むので、一覧の JSON（130KB）を
 * 引き込まないよう、区分の判定（n1StatusOf・src/lib/n1-status.ts）とは分けて置く。
 */
export type N1Status = 'ok' | 'ng' | 'undetermined' | 'no_column';

export function n1StatusLabel(st: N1Status): string {
  switch (st) {
    case 'ok':
      return '可';
    case 'undetermined':
      return '未算定';
    case 'no_column':
      return '公表なし';
    default:
      return '不可';
  }
}

export function isN1Ok(st: N1Status | null | undefined): boolean {
  return st === 'ok';
}

/** バッジの CSS クラス（可＝grid-badge-ok・不可＝grid-badge-info・未算定／公表なし＝grid-badge-muted） */
export function n1StatusBadgeClass(st: N1Status): string {
  if (st === 'ok') return 'grid-badge grid-badge-ok';
  if (st === 'ng') return 'grid-badge grid-badge-info';
  return 'grid-badge grid-badge-muted';
}

/**
 * 静的リストの値（n1_status）が無い旧データでも表示できるよう、boolean から区分を作る（null は「—」扱い＝undefined）。
 * 一覧の行はこの関数を通して 1 か所で決める。
 */
export function n1StatusFromRow(s: { n1_status?: N1Status | null; n1_eligible?: boolean | null }): N1Status | undefined {
  if (s.n1_status) return s.n1_status;
  if (s.n1_eligible === true) return 'ok';
  if (s.n1_eligible === false) return 'ng';
  return undefined;
}
