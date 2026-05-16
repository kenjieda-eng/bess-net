/**
 * MarketDataPanel — /dashboard/market の各セクション (電源構成/燃料/金融) で再利用される共通テーブル
 * Server Component (内部の CitationPanel は Client)
 *
 * 設計:
 *   - Tier 1 UI 統一規約準拠 (text-base lg:text-lg / py-3 / tabular-nums / 数値強調)
 *   - <details>/<summary> で行内引用展開 (JS 不要、CitationPanel は展開時に hydrate)
 *   - 鉄則 #2: SSR 外部 API 0 (build 時 import 済データのみ)
 */

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
}: PanelProps) {
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
        <p style={{ fontSize: 14, color: '#92400e', lineHeight: 1.7, margin: 0 }}>
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
        <h2 id={`${anchorId}-title`} style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>{title}</h2>
        <p className="text-base lg:text-lg" style={{ color: 'var(--color-text)', lineHeight: 1.7, margin: 0 }}>
          {description}
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 8 }}>
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
              const csvUrl = `https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/processed/${csvDir}/${s.id}.csv`;
              const catalogUrl = `https://data.eic-jp.org/catalog/${s.id}`;
              return (
                <tr key={s.id}>
                  <td style={{ padding: 12, border: '1px solid var(--color-border)' }}>{s.meta.name}</td>
                  <td style={{ padding: 12, border: '1px solid var(--color-border)', fontSize: 14, color: 'var(--color-muted)' }}>{latest?.date ?? '—'}</td>
                  {/* 数値カラム: Tier 1 規約 (fontSize 24 + tabular-nums + bold) */}
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
                  <td style={{ padding: 12, border: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-muted)' }}>{unit}</td>
                  <td style={{ padding: 12, border: '1px solid var(--color-border)' }}>
                    <details>
                      <summary style={{ cursor: 'pointer', color: 'var(--color-accent)', fontSize: 13 }}>
                        引用を開く
                      </summary>
                      <CitationPanel indicator={s.meta} csvUrl={csvUrl} catalogUrl={catalogUrl} />
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
