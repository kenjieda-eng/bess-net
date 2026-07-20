'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PolicyEvent } from '@/lib/microcms';
// P1: 表示ロジックは policy-utils に移設して詳細ページと共有（複製再実装しない）
import {
  EVENT_TYPE_COLORS,
  STATUS_COLORS,
  firstOf,
  formatDateJa,
  deriveDisplayStatus,
  POLICY_DETAIL_SLUG_SET,
} from '@/lib/policy-utils';

function groupByYearMonth(items: PolicyEvent[]): Array<{ ym: string; items: PolicyEvent[] }> {
  const groups: Record<string, PolicyEvent[]> = {};
  for (const it of items) {
    const ym = it.eventDate ? it.eventDate.slice(0, 7) : 'unknown';
    if (!groups[ym]) groups[ym] = [];
    groups[ym].push(it);
  }
  return Object.entries(groups)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // descending
    .map(([ym, items]) => ({ ym, items }));
}

export default function PolicyCalendarClient({ items }: { items: PolicyEvent[] }) {
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [issuerFilter, setIssuerFilter] = useState<string>('all');

  // unique values for filters
  const years = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      if (it.eventDate) s.add(it.eventDate.slice(0, 4));
    }
    return Array.from(s).sort().reverse();
  }, [items]);
  const types = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      const t = firstOf(it.eventType);
      if (t) s.add(t);
    }
    return Array.from(s).sort();
  }, [items]);
  const issuers = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      if (it.issuer) s.add(it.issuer);
    }
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const year = it.eventDate?.slice(0, 4) ?? '';
      if (yearFilter !== 'all' && year !== yearFilter) return false;
      const t = firstOf(it.eventType);
      if (typeFilter !== 'all' && t !== typeFilter) return false;
      if (issuerFilter !== 'all' && it.issuer !== issuerFilter) return false;
      return true;
    });
  }, [items, yearFilter, typeFilter, issuerFilter]);

  const grouped = useMemo(() => groupByYearMonth(filtered), [filtered]);

  return (
    <div>
      {/* フィルタ */}
      <section
        className="page-section"
        style={{
          padding: 16,
          background: 'var(--color-bg)',
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: 15 }}>
            年度:{' '}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 15 }}
            >
              <option value="all">全年</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 15 }}>
            種別:{' '}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 15 }}
            >
              <option value="all">全種別</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 15 }}>
            発行元:{' '}
            <select
              value={issuerFilter}
              onChange={(e) => setIssuerFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 15 }}
            >
              <option value="all">全発行元</option>
              {issuers.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: 15, color: 'var(--color-muted)', marginLeft: 'auto' }}>
            {filtered.length} 件表示中 / 全 {items.length} 件
          </span>
        </div>
      </section>

      {/* 時系列リスト（月別グループ）*/}
      {grouped.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>
          条件に合致するイベントがありません。フィルタを調整してください。
        </p>
      ) : (
        grouped.map((g) => (
          <section key={g.ym} style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                paddingBottom: 8,
                borderBottom: '2px solid var(--color-accent, #0066cc)',
                marginBottom: 16,
              }}
            >
              {g.ym.replace(/^(\d{4})-(\d{2})$/, '$1 年 $2 月')}（{g.items.length} 件）
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {g.items.map((it) => {
                const type = firstOf(it.eventType);
                // L-EIC-027: 「予定」の期日超過のみ表示側で「終了」へ自動補正（パブコメ除外・進行中/終了不変）
                const status = deriveDisplayStatus(it);
                return (
                  <li
                    key={it.id}
                    style={{
                      padding: '14px 16px',
                      marginBottom: 12,
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      background: 'var(--color-bg-card, #fff)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        marginBottom: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: 15, color: 'var(--color-muted)', fontWeight: 600 }}>
                        {formatDateJa(it.eventDate)}
                      </span>
                      {type && (
                        <span
                          style={{
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 4,
                            color: '#fff',
                            background: EVENT_TYPE_COLORS[type] || '#666',
                            fontWeight: 600,
                          }}
                        >
                          {type}
                        </span>
                      )}
                      {status && (
                        <span
                          style={{
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 4,
                            color: '#fff',
                            background: STATUS_COLORS[status] || '#888',
                            fontWeight: 600,
                          }}
                        >
                          {status}
                        </span>
                      )}
                      <span style={{ fontSize: 15, color: 'var(--color-muted)' }}>
                        発行元: <strong>{it.issuer}</strong>
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        margin: '4px 0 8px',
                        lineHeight: 1.4,
                      }}
                    >
                      {POLICY_DETAIL_SLUG_SET.has(it.slug) ? (
                        <Link
                          href={`/policy-calendar/${it.slug}`}
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          {it.title}
                        </Link>
                      ) : (
                        it.title
                      )}
                    </h3>
                    {it.description && (
                      <p style={{ fontSize: 15, margin: '4px 0 8px', lineHeight: 1.6 }}>
                        {it.description}
                      </p>
                    )}
                    {it.sourceUrl && (
                      <a
                        href={it.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 15, color: 'var(--color-accent, #0066cc)' }}
                      >
                        公式情報源 →
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
