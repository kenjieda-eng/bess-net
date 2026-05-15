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
    return <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>表示できる更新がありません。</p>;
  }

  return (
    <div>
      {dates.map((date) => (
        <section key={date} style={{ marginBottom: 20 }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-muted)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 4,
            marginBottom: 8,
          }}>{date} ({byDate[date].length} 件)</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {byDate[date].map((item) => (
              <li key={item.id} style={{
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border-light, #f0f0f0)',
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {item.category && (
                    <span style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      color: 'var(--color-muted)',
                    }}>{item.category}</span>
                  )}
                  {item.href ? (
                    <Link href={item.href} style={{ fontWeight: 600 }}>{item.title}</Link>
                  ) : (
                    <span style={{ fontWeight: 600 }}>{item.title}</span>
                  )}
                  {item.tags && item.tags.map((t) => (
                    <span key={t} style={{
                      fontSize: 10, padding: '1px 5px', background: '#eef',
                      borderRadius: 3, color: '#446',
                    }}>{t}</span>
                  ))}
                </div>
                {item.description && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    {item.description.slice(0, 120)}
                    {item.description.length > 120 ? '…' : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 16 }}>
        上位 {Math.min(limit, sorted.length)} 件を表示。全件: {items.length} 件。
      </p>
    </div>
  );
}
