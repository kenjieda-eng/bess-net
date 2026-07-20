/**
 * トラッカー Timeline 表示用 Server Component
 * (依頼BF-1〜4 共通テンプレート)
 *
 * 受け取った items を updatedAt desc でソート、上位 N を timeline 表示
 */

import Link from 'next/link';

export interface TimelineItem {
  id: string;
  title: string;
  href?: string;
  updatedAt: string;
  category?: string;
  description?: string;
  tags?: string[]; // 表示用バッジ
}

export default function TrackerTimeline({ items, limit = 100 }: { items: TimelineItem[]; limit?: number }) {
  const sorted = [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, limit);

  // 日付ごとにグルーピング
  const byDate: Record<string, TimelineItem[]> = {};
  for (const item of sorted) {
    const dateStr = item.updatedAt.slice(0, 10);
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(item);
  }
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  if (sorted.length === 0) {
    return <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>表示できる更新がありません。</p>;
  }

  return (
    <div>
      {/* EDA #2 (依頼36): TrackerTimeline depth 2/3 深掘り、各要素フォント拡大 + tabular-nums + padding 拡張 */}
      {dates.map((date) => (
        <section key={date} style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--color-muted)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 6,
            marginBottom: 10,
          }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }} className="tabular-nums">{date}</span>
            {' '}
            <span style={{ fontWeight: 500 }}>({byDate[date].length} 件)</span>
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {byDate[date].map((item) => (
              <li key={item.id} style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--color-border-light, #f0f0f0)',
                fontSize: 16,
                lineHeight: 1.6,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {item.category && (
                    <span style={{
                      fontSize: 15,
                      padding: '3px 8px',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: 'var(--color-muted)',
                    }}>{item.category}</span>
                  )}
                  {item.href ? (
                    <Link href={item.href} style={{ fontWeight: 600, fontSize: 16 }}>{item.title}</Link>
                  ) : (
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{item.title}</span>
                  )}
                  {item.tags && item.tags.map((t) => (
                    <span key={t} style={{
                      fontSize: 15, padding: '2px 7px', background: '#eef',
                      borderRadius: 3, color: '#446',
                    }}>{t}</span>
                  ))}
                </div>
                {item.description && (
                  <p style={{ margin: '6px 0 0 0', fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                    {item.description.slice(0, 120)}
                    {item.description.length > 120 ? '…' : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 16 }}>
        上位{' '}
        <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {Math.min(limit, sorted.length)}
        </span>
        {' '}件を表示。全件:{' '}
        <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {items.length}
        </span>
        {' '}件。
      </p>
    </div>
  );
}
