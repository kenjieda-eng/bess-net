/**
 * JEPX 実データ表示 (Server Component)
 * EIC Data (data.eic-jp.org) 経由で日次平均を 9 エリア + システムプライス表示
 *
 * 設計:
 *   - Server Component、build 時 import で読み込み
 *   - 鉄則 #2 完全準拠: SSR 外部 fetch 0
 */

import type { SeriesData } from '@/types/eic';
import { formatCitation } from '@/lib/cite-helpers';

interface Props {
  series: SeriesData[];
}

// SVG sparkline (直近 30 日 推移、Tier 1 UI 改善で 60×20 → 120×40 に拡大)
// 業界標準サイズ、視認性向上 + min/max 補助線追加
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
      {/* 最高値・最低値の薄い補助線 */}
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
  if (series.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
        EIC Data のキャッシュが見つかりませんでした (build 時の precompute エラー)。次回 build で復旧します。
      </p>
    );
  }
  // 表示順: システム → 9 エリア (北海道〜九州)
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
    // Tier 1 UI 改善: 全体本文サイズ拡大 (responsive: text-base lg:text-lg)
    <section className="text-base lg:text-lg" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📈 JEPX スポット価格 日次 (実データ、10 系列)</h2>
        <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>最終更新: {latestUpdate} / 合計 {totalPoints.toLocaleString()} pt</span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12, lineHeight: 1.6 }}>
        出典: <a href="https://data.eic-jp.org/catalog?domain=power" target="_blank" rel="noopener noreferrer">EIC Data (data.eic-jp.org)</a>
        、原データは日本卸電力取引所 (JEPX) 公表値、
        <a href="https://www.jepx.jp/electricpower/index.html" target="_blank" rel="noopener noreferrer">jepx-terms</a> 準拠。
      </p>

      <div style={{ overflowX: 'auto' }}>
        {/* Tier 1 UI 改善: fontSize 13 → 16 (text-base 相当)、row padding 8 → 12 (py-3 相当) */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>系列</th>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>最新日</th>
              <th style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontWeight: 600 }}>価格 (¥/kWh)</th>
              <th style={{ padding: 12, textAlign: 'center', border: '1px solid var(--color-border)', fontWeight: 600 }}>直近 30 日</th>
              <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>引用 (APA)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const latest = latestValid(s.points);
              const apa = formatCitation(s.meta, 'apa');
              return (
                <tr key={s.id}>
                  <td style={{ padding: 12, border: '1px solid var(--color-border)' }}>{s.meta.name}</td>
                  <td style={{ padding: 12, border: '1px solid var(--color-border)', fontSize: 14, color: 'var(--color-muted)' }}>{latest?.date ?? '—'}</td>
                  {/* Tier 1 UI 改善 #3: 価格カラム強調 (text-2xl + font-bold + tabular-nums) */}
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
                  <td style={{ padding: 12, border: '1px solid var(--color-border)', fontSize: 12 }}>
                    <details>
                      <summary style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>引用を開く</summary>
                      <pre style={{ marginTop: 4, padding: 6, background: 'var(--color-bg)', fontSize: 11, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{apa}</pre>
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
