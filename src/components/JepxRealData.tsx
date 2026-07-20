/**
 * JEPX 実データ表示 (Client Component)
 * EIC Data (data.eic-jp.org) 経由で日次平均を 9 エリア + システムプライス表示
 *
 * 設計:
 *   - 'use client' (引用 panel の展開/折りたたみ state を React で管理)
 *   - 鉄則 #2 完全準拠: build 時 import で読み込み済み、ランタイム外部 fetch 0
 *   - Tier 1 UI 改善 + 引用ダイアログ拡張 (CitationPanel)
 */

'use client';

import { Fragment, useState } from 'react';
import type { SeriesData } from '@/types/eic';
import CitationPanel from './CitationPanel';

interface Props {
  series: SeriesData[];
}

// SVG sparkline (直近 30 日 推移、Tier 1 UI 改善で 120×40 + min/max 補助線)
function Sparkline({ points }: { points: { date: string; value: number | null }[] }) {
  const recent = points.slice(-30);
  if (recent.length === 0) return null;
  const vals = recent.map((p) => p.value).filter((v): v is number => v !== null);
  if (vals.length < 2) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 120, H = 40;
  const stride = W / (recent.length - 1);
  let d = '';
  recent.forEach((p, i) => {
    if (p.value === null) return;
    const x = i * stride;
    const y = H - ((p.value - min) / range) * H;
    d += `${d === '' ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  });
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: 120, height: 40, display: 'inline-block' }}
      role="img"
      aria-label={`直近 ${recent.length} 日価格推移 (¥${min.toFixed(2)}〜¥${max.toFixed(2)})`}
    >
      <line x1={0} y1={H} x2={W} y2={H} stroke="#e5e7eb" strokeWidth={0.5} />
      <line x1={0} y1={0} x2={W} y2={0} stroke="#e5e7eb" strokeWidth={0.5} />
      <path d={d} fill="none" stroke="#0066cc" strokeWidth={1.5} />
    </svg>
  );
}

function latestValid(points: { date: string; value: number | null }[]): { date: string; value: number } | null {
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].value !== null) {
      return { date: points[i].date, value: points[i].value as number };
    }
  }
  return null;
}

export default function JepxRealData({ series }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (series.length === 0) {
    return (
      <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>
        EIC Data のキャッシュが見つかりませんでした (build 時の precompute エラー)。次回 build で復旧します。
      </p>
    );
  }

  const order = [
    'jepx-spot-system',
    'jepx-spot-hokkaido',
    'jepx-spot-tohoku',
    'jepx-spot-tokyo',
    'jepx-spot-chubu',
    'jepx-spot-hokuriku',
    'jepx-spot-kansai',
    'jepx-spot-chugoku',
    'jepx-spot-shikoku',
    'jepx-spot-kyushu',
  ];
  const sorted = order
    .map((id) => series.find((s) => s.id === id))
    .filter((s): s is SeriesData => s !== undefined);
  const latestUpdate = sorted[0]?.meta.updated_at?.slice(0, 10) ?? '—';
  const totalPoints = sorted.reduce((acc, s) => acc + s.points.length, 0);

  return (
    <section className="text-base lg:text-lg" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📈 JEPX スポット価格 日次 (実データ、10 系列)</h2>
        <span style={{ fontSize: 15, color: 'var(--color-muted)' }}>最終更新: {latestUpdate} / 合計 {totalPoints.toLocaleString()} pt</span>
      </div>
      <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12, lineHeight: 1.6 }}>
        出典: <a href="https://data.eic-jp.org/catalog?domain=power" target="_blank" rel="noopener noreferrer">EIC Data (data.eic-jp.org)</a>
        、原データは日本卸電力取引所 (JEPX) 公表値、
        <a href="https://www.jepx.jp/electricpower/index.html" target="_blank" rel="noopener noreferrer">jepx-terms</a> 準拠。
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>系列</th>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>最新日</th>
              <th style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontWeight: 600 }}>価格 (¥/kWh)</th>
              <th style={{ padding: 12, textAlign: 'center', border: '1px solid var(--color-border)', fontWeight: 600 }}>直近 30 日</th>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>引用</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const latest = latestValid(s.points);
              const isExpanded = expandedId === s.id;
              const csvUrl = `https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/processed/jepx/${s.id}.csv`;
              const catalogUrl = `https://data.eic-jp.org/catalog/${s.id}`;
              return (
                <Fragment key={s.id}>
                  <tr>
                    <td style={{ padding: 12, border: '1px solid var(--color-border)' }}>{s.meta.name}</td>
                    <td style={{ padding: 12, border: '1px solid var(--color-border)', fontSize: 15, color: 'var(--color-muted)' }}>{latest?.date ?? '—'}</td>
                    {/* Tier 1 UI 改善 #3: 価格カラム (fontSize 24 + font-bold + tabular-nums) */}
                    <td
                      className="tabular-nums"
                      style={{
                        padding: 12,
                        textAlign: 'right',
                        border: '1px solid var(--color-border)',
                        fontSize: 24,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: 'var(--color-navy, #1e293b)',
                      }}
                    >
                      {latest ? latest.value.toFixed(2) : '—'}
                    </td>
                    <td style={{ padding: 8, textAlign: 'center', border: '1px solid var(--color-border)' }}>
                      <Sparkline points={s.points} />
                    </td>
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
