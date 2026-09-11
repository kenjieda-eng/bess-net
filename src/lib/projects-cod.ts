/**
 * src/lib/projects-cod.ts — projects の cod（運転開始日／運転開始予定日）の判定を一箇所に置く（#119・#121）
 *
 * 金曜#6 追修便 ■2（2026-09-11）: 詳細ページが稼働中の案件にも「運転開始予定 2025-12-01」と出していた
 *   （本文は「2025年12月から商業運転を開始」）。保存値は触らず、ラベルだけを status から導出する。
 *
 * ★「実現済み（＝運転開始）」の根拠は status＝稼働中 だけに置く。cod の日付では決めない。
 *   cod が今日より過去でも status が稼働中でなければ、それは「予定日超過」（projects-maintenance の overdue）であって
 *   運転開始の証拠ではない。掲載 253 件の実測（2026-09-11）で、計画中・建設中なのに cod が過去のものが 42 件あり、
 *   多くは PR 配信日の混入（Pj2-H 4(b)）だった。ここを日付で「運転開始」にすると、同じページの status バッジ（計画中）と
 *   矛盾し、maintenance の予定日超過判定とも二重になる（status と cod の関係を二重に持たない）。
 *   status が空（「その他」）の 8 件も同じ扱い（maintenance では予定日超過に数えている）。
 *
 * 消費側: src/app/projects/[slug]/page.tsx（dt ラベル）・src/app/projects/page.tsx（一覧の運転開始列）・
 *         scripts/precompute-projects-maintenance.ts（予定日超過リスト）。
 */

type StatusLike = { status?: string[] | string | null };
type CodLike = StatusLike & { cod?: string | null };

const firstStatus = (s: StatusLike['status']): string => (Array.isArray(s) ? s[0] ?? '' : s ?? '');

/** JST の今日（YYYY-MM-DD） */
export function jstTodayISO(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * cod の表記ゆれを ISO 日付に寄せる。解釈できないものは null（＝予定日超過の判定対象外）。
 * cod は 'YYYY-MM-DD' が主だが '2026年8月' '2028年度' 等の自由記述も混在するため、
 * 「確実に過ぎている」と言える形にだけ寄せる（月のみは月末、年度のみは年度末＝甘めに倒す）。
 * （2026-09-11 に scripts/precompute-projects-maintenance.ts から移設。判定は不変）
 */
export function normalizeCod(cod?: string | null): string | null {
  if (!cod) return null;
  const s = cod.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(s);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  m = /^(\d{4})年(\d{1,2})月/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const last = new Date(Date.UTC(y, mo, 0)).getUTCDate(); // 当月末日
    return `${y}-${String(mo).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  }
  m = /^(\d{4})年度/.exec(s);
  if (m) return `${Number(m[1]) + 1}-03-31`;
  return null;
}

/** 運転開始が実現済みか（根拠は status＝稼働中 のみ） */
export function isCodRealized(p: StatusLike): boolean {
  return firstStatus(p.status) === '稼働中';
}

/** 運開予定日超過: cod（解釈可能なもの）が今日より前、かつ実現済みでない */
export function isCodOverdue(p: CodLike, today: string = jstTodayISO()): boolean {
  const d = normalizeCod(p.cod);
  return !!d && d < today && !isCodRealized(p);
}

/** 詳細ページの見出しラベル */
export function codLabel(p: StatusLike): '運転開始' | '運転開始予定' {
  return isCodRealized(p) ? '運転開始' : '運転開始予定';
}

/** 一覧表の「運転開始」列のセル。未実現の日付には「（予定）」を付ける（cod 自体が「予定」を含むなら重ねない） */
export function codCellText(p: CodLike): string {
  const cod = (p.cod ?? '').trim();
  if (!cod) return '—';
  if (isCodRealized(p) || cod.includes('予定')) return cod;
  return `${cod}（予定）`;
}
