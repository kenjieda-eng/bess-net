/**
 * MarketDataPanel — /dashboard/market の各セクション (電源構成/燃料/金融) で再利用
 *
 * 設計 (B 案パターン、L-JEPX-UI-005 継続):
 *   - Client Component ('use client'、useState で expandedId 管理)
 *   - 各行は Fragment 内 2 つの <tr>: 主行 + (条件付き) 引用行 colSpan=5
 *   - <details> 撤廃 (cell 内オーバーフロー問題回避、対象行の上に表示されるバグ修正)
 *   - 鉄則 #2: SSR 外部 API 0 (build 時 import 済データのみ、ランタイム fetch 0)
 *   - Tier 1 UI 規約: text-base lg:text-lg / py-3 相当 (12px) / tabular-nums
 */

'use client';

import { Fragment, useState } from 'react';
import type { SeriesData } from '@/types/eic';
import CitationPanel from '../CitationPanel';

interface PanelProps {
  title: string;
  description: string;
  series: SeriesData[];
  /** 既定単位 (各系列の meta.unit が優先) */
  defaultUnit: string;
  sourceUrl: string;
  sourceName: string;
  /** CSV パス導出用 (sourceDir 配下) */
  csvDir: string;
  /** anchor for SEO (Dataset schema URL fragment) */
  anchorId: string;
  /** データ最新月バッジ（YYYY-MM。page 側で系列実値からコード導出・焼き込み禁止 L-EIC-027） */
  latestDataMonth?: string;
  /** 蓄電所文脈の「読み方」2〜3文（dashboard-market分析2026-07-12 P2） */
  readingGuide?: string;
  /** 鮮度・供給元状況の注記（※…。P1c） */
  freshnessNote?: string;
}

function latestValid(points: { date: string; value: number | null }[]): { date: string; value: number } | null {
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].value !== null) {
      return { date: points[i].date, value: points[i].value as number };
    }
  }
  return null;
}

export default function MarketDataPanel({
  title,
  description,
  series,
  defaultUnit,
  sourceUrl,
  sourceName,
  csvDir,
  anchorId,
  latestDataMonth,
  readingGuide,
  freshnessNote,
}: PanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (series.length === 0) {
    return (
      <section
        id={anchorId}
        aria-labelledby={`${anchorId}-title`}
        style={{
          border: '1px solid #fde68a',
          background: 'rgba(255, 240, 200, 0.4)',
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 id={`${anchorId}-title`} style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#92400e' }}>
          ⚠ {title}
        </h2>
        <p style={{ fontSize: 15, color: '#92400e', lineHeight: 1.7, margin: 0 }}>
          このセクションのデータは EIC Data pipeline 側で整備中です。次回 build で自動反映されます。
        </p>
      </section>
    );
  }

  return (
    <section
      id={anchorId}
      aria-labelledby={`${anchorId}-title`}
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: 24,
        marginBottom: 32,
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <h2 id={`${anchorId}-title`} style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
          {title}
          {latestDataMonth && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 13,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 4,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)',
                verticalAlign: 'middle',
                whiteSpace: 'nowrap',
              }}
            >
              データ最新月: {latestDataMonth}
            </span>
          )}
        </h2>
        <p className="text-base lg:text-lg" style={{ color: 'var(--color-text)', lineHeight: 1.7, margin: 0 }}>
          {description}
        </p>
        {readingGuide && (
          <p style={{ fontSize: 15, color: 'var(--color-text)', lineHeight: 1.7, marginTop: 8, marginBottom: 0 }}>
            <strong>読み方:</strong> {readingGuide}
          </p>
        )}
        {freshnessNote && (
          <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 8, marginBottom: 0 }}>
            {freshnessNote}
          </p>
        )}
        <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 8 }}>
          出典:{' '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceName}</a>
          、<a href="https://data.eic-jp.org/" target="_blank" rel="noopener noreferrer">EIC Data (data.eic-jp.org)</a> 経由
        </p>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>系列</th>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>最新日</th>
              <th style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontWeight: 600 }}>値</th>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>単位</th>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>引用</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const latest = latestValid(s.points);
              const unit = s.meta.unit || defaultUnit;
              const isExpanded = expandedId === s.id;
              const csvUrl = `https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/processed/${csvDir}/${s.id}.csv`;
              const catalogUrl = `https://data.eic-jp.org/catalog/${s.id}`;
              return (
                <Fragment key={s.id}>
                  <tr style={{ verticalAlign: 'middle' }}>
                    <td style={{ padding: 12, border: '1px solid var(--color-border)' }}>{s.meta.name}</td>
                    <td style={{ padding: 12, border: '1px solid var(--color-border)', fontSize: 15, color: 'var(--color-muted)' }}>{latest?.date ?? '—'}</td>
                    {/* 数値カラム: Tier 1 規約 (fontSize 22 + tabular-nums + bold) */}
                    <td
                      className="tabular-nums"
                      style={{
                        padding: 12,
                        textAlign: 'right',
                        border: '1px solid var(--color-border)',
                        fontSize: 22,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: 'var(--color-navy, #1e293b)',
                      }}
                    >
                      {latest ? latest.value.toFixed(2) : '—'}
                    </td>
                    <td style={{ padding: 12, border: '1px solid var(--color-border)', fontSize: 15, color: 'var(--color-muted)' }}>{unit}</td>
                    <td style={{ padding: 12, border: '1px solid var(--color-border)' }}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`citation-${s.id}`}
                        style={{
                          background: 'none',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-accent, #0066cc)',
                          fontSize: 15,
                          padding: '4px 10px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isExpanded ? '▼ 閉じる' : '▶ 引用を開く'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      {/* B 案: 行下 full-width 展開 (colSpan=5) */}
                      <td colSpan={5} id={`citation-${s.id}`} style={{ padding: 0, border: 'none' }}>
                        <CitationPanel indicator={s.meta} csvUrl={csvUrl} catalogUrl={catalogUrl} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
