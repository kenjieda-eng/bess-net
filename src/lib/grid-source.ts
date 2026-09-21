/**
 * src/lib/grid-source.ts
 *
 * /grid の出典表示: 公表ファイルへの直リンクをやめ、各社の公表ページへリンクする（Ck-1 A2・2026-09-21）
 *
 * ★なぜ要るか
 *   変電所レコードの source_url は、取り込んだ公表ファイル（CSV・ZIP）そのものの URL を持つ。
 *   各社はこのファイルを月次で差し替え、名前を変える（九州 ZIP は td_{ランダム}.zip、四国・東北 CSV は年月つき）。
 *   直リンクすると翌月には 404 になる（2026-09-21 の走査で 7 URL・1,275 レコード分が 404）。
 *   → 画面のリンク先は各社の公表ページ（area-meta.ts の landingUrl）にする。
 *     どのファイルから取り込んだかは「ファイル名＋取得日」を本文に文字で残す（出所の正確な所在として）。
 *   ★source_url 自体は書き換えない（microCMS の原値＝取り込んだファイルの記録。L-EIC-028）。
 *     表示だけをここで導出する（#119: 取得側・表示側で二重に加工しない。加工は表示の 1 箇所だけ）。
 */

/**
 * 公表ファイルの URL からファイル名（末尾のパス要素）を取り出す。ファイルでなければ null。
 * ★source_url の形は社によって違う（2026-09-21 の静的データで確認）:
 *   CSV/ZIP のファイル URL 5,520 件／公表ページそのもの（東京 …/consignment/system/）1,718 件／
 *   中部の地図アプリ内の一覧 ID（…KRSIH010〜016）1,107 件。
 *   ファイル名として意味があるのは拡張子つきの 1 つ目だけなので、それ以外は null（表示しない）。
 */
export function sourceFileName(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    if (!last || !/\.(csv|zip|xlsx?|pdf)$/i.test(last)) return null;
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  } catch {
    return null;
  }
}
