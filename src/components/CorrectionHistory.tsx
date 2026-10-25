/**
 * 記事末の「訂正履歴」（訂正履歴便・2026-10-16）。
 * サーバ側で src/data/corrections.json を読む（runtime の外部取得 0）。記録が無いページには何も出さない。
 * 編集方針の約束「何を、いつ訂正したかを記事末「訂正履歴」に残します」の実装。一覧は /corrections。
 */
import Link from 'next/link';
import CorrectionItemBody from '@/components/CorrectionItemBody';
import { correctionDateLabel, correctionsForPath } from '@/lib/corrections';

export default function CorrectionHistory({ path }: { path: string }) {
  const list = correctionsForPath(path);
  if (list.length === 0) return null;
  return (
    <section id="correction-history" aria-labelledby="correction-history-title" className="correction-history" style={{ borderTop: '1px solid var(--color-border, #cbd5e1)', marginTop: 28, paddingTop: 16, scrollMarginTop: 110 /* 題名の下の「訂正履歴を見る」で飛んだとき、固定ヘッダの下に隠れないように */ }}>
      <h3 id="correction-history-title" style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>{'訂正履歴'}</h3>
      {list.map((c) => (
        <div key={c.id} id={`correction-${c.id}`} style={{ fontSize: 14, lineHeight: 1.8, margin: '0 0 12px', overflowWrap: 'anywhere' }}>
          <strong>{`${correctionDateLabel(c.date)}　${c.kind}`}</strong>
          <CorrectionItemBody kind={c.kind} before={c.before} after={c.after} basis={c.basis} />
        </div>
      ))}
      <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
        {'当サイトの訂正・表示の停止の記録は '}
        <Link href="/corrections" style={{ color: 'var(--color-accent)' }}>{'訂正履歴'}</Link>
        {' にまとめています。'}
      </p>
    </section>
  );
}
