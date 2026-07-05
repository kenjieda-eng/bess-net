'use client';

import { useMemo, useState } from 'react';
import type { IndustryEvent } from '@/lib/microcms';
import { jstTodayISO, jstDateOf, deriveDisplayStatus } from '@/lib/policy-utils';

const EVENT_TYPE_COLORS: Record<string, string> = {
  展示会: '#0066cc',
  セミナー: '#cc6600',
  シンポジウム: '#006666',
  学会: '#cc0066',
  業界団体総会: '#666633',
};

const STATUS_COLORS: Record<string, string> = {
  予定: '#0066cc',
  進行中: '#cc6600',
  終了: '#888888',
};

function firstOf(arr: string[] | string | undefined): string {
  if (Array.isArray(arr)) return arr[0] ?? '';
  return arr ?? '';
}

function formatDateJa(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')} (${wd})`;
}

function formatDateRange(start: string, end?: string): string {
  if (!end || end === start) return formatDateJa(start);
  // Same month/year: show "2026-03-04 〜 06"
  const s = new Date(start);
  const e = new Date(end);
  if (
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth()
  ) {
    return `${formatDateJa(start)} 〜 ${String(e.getDate()).padStart(2, '0')}`;
  }
  return `${formatDateJa(start)} 〜 ${formatDateJa(end)}`;
}

function groupByYearMonth(items: IndustryEvent[]): Array<{ ym: string; items: IndustryEvent[] }> {
  const groups: Record<string, IndustryEvent[]> = {};
  for (const it of items) {
    const ym = it.eventDate ? it.eventDate.slice(0, 7) : 'unknown';
    if (!groups[ym]) groups[ym] = [];
    groups[ym].push(it);
  }
  return Object.entries(groups)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([ym, items]) => ({ ym, items }));
}

export default function EventsCalendarClient({ items }: { items: IndustryEvent[] }) {
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [organizerFilter, setOrganizerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const years = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) if (it.eventDate) s.add(it.eventDate.slice(0, 4));
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
  const organizers = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) if (it.organizer) s.add(it.organizer);
    return Array.from(s).sort();
  }, [items]);
  const statuses = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      // L-EIC-027: 表示・フィルタとも derive 後のステータスで統一（バッジと食い違わせない）
      const st = deriveDisplayStatus(it);
      if (st) s.add(st);
    }
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const year = it.eventDate?.slice(0, 4) ?? '';
      if (yearFilter !== 'all' && year !== yearFilter) return false;
      const t = firstOf(it.eventType);
      if (typeFilter !== 'all' && t !== typeFilter) return false;
      if (organizerFilter !== 'all' && it.organizer !== organizerFilter) return false;
      const st = deriveDisplayStatus(it); // L-EIC-027: フィルタもバッジと同じ derive 後の値で判定
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      return true;
    });
  }, [items, yearFilter, typeFilter, organizerFilter, statusFilter]);

  const grouped = useMemo(() => groupByYearMonth(filtered), [filtered]);

  // 直近ハイライト（status=予定、今日(JST)以降60日以内・開催日昇順=直近優先・最大5件）
  // 修正前は items が eventDate 降順のまま slice(0,3) しており、遠い日付が優先されて
  // 直近イベント（7/10・7/15 等）が隠れるバグがあった（2026-07-05 events分析）。
  const highlights = useMemo(() => {
    const today = jstTodayISO();
    const end = new Date(new Date(today).getTime() + 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return items
      .filter((it) => {
        if (!it.eventDate) return false;
        if (firstOf(it.status) !== '予定') return false;
        const d = jstDateOf(it.eventDate);
        return d >= today && d <= end;
      })
      .sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1))
      .slice(0, 5);
  }, [items]);

  return (
    <div>
      {/* 今月のハイライト */}
      {highlights.length > 0 && (
        <section
          style={{
            marginBottom: 28,
            padding: 16,
            background: 'linear-gradient(135deg, #fff8e6 0%, #fff5d4 100%)',
            border: '1px solid #f5d97d',
            borderRadius: 8,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>
            🎯 直近の主要イベント（60日以内）
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {highlights.map((it) => (
              <li key={it.id} style={{ marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--color-muted)', fontWeight: 600 }}>
                  {formatDateJa(it.eventDate)}
                </span>{' '}
                — <strong>{it.title}</strong>
                {it.venue ? `（${it.venue}）` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* フィルタ */}
      <section
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
          <label style={{ fontSize: 13 }}>
            年度:{' '}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 13 }}
            >
              <option value="all">全年</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            種別:{' '}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 13 }}
            >
              <option value="all">全種別</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            主催:{' '}
            <select
              value={organizerFilter}
              onChange={(e) => setOrganizerFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 13 }}
            >
              <option value="all">全主催</option>
              {organizers.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>
            ステータス:{' '}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 13 }}
            >
              <option value="all">全ステータス</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: 13, color: 'var(--color-muted)', marginLeft: 'auto' }}>
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
                // L-EIC-027: 「予定」の期日超過（endDateあれば最終日基準）のみ表示側で「終了」へ
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
                      <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 600 }}>
                        {formatDateRange(it.eventDate, it.endDate)}
                      </span>
                      {type && (
                        <span
                          style={{
                            fontSize: 11,
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
                            fontSize: 11,
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
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                        主催: <strong>{it.organizer}</strong>
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
                      {it.title}
                    </h3>
                    {(it.venue || it.location) && (
                      <p
                        style={{
                          fontSize: 13,
                          margin: '4px 0',
                          color: 'var(--color-muted)',
                        }}
                      >
                        📍 {it.venue}
                        {it.location && it.venue && it.location !== it.venue
                          ? `（${it.location}）`
                          : ''}
                        {!it.venue && it.location ? it.location : ''}
                      </p>
                    )}
                    {it.description && (
                      <p style={{ fontSize: 14, margin: '4px 0 8px', lineHeight: 1.6 }}>
                        {it.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {it.officialUrl && (
                        <a
                          href={it.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, color: 'var(--color-accent, #0066cc)' }}
                        >
                          公式サイト →
                        </a>
                      )}
                      {it.registrationDeadline && (
                        <span
                          style={{
                            fontSize: 12,
                            color: '#cc6600',
                            fontWeight: 600,
                          }}
                        >
                          申込締切: {formatDateJa(it.registrationDeadline)}
                        </span>
                      )}
                    </div>
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
