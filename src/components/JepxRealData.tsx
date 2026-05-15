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

// シンプル SVG sparkline (直近 30 日 推移)
function Sparkline({ points }: { points: { date: string; value: number | null }[] }) {
  const recent = points.slice(-30);
  if (recent.length === 0) return null;
  const vals = recent.map((p) => p.value).filter((v): v is number => v !== null);
  if (vals.length < 2) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 100, H = 24;
  const stride = W / (recent.length - 1);
  let d = '';
  recent.forEach((p, i) => {
    if (p.value === null) return;
    const x = i * stride;
    const y = H - ((p.value - min) / range) * H;
    d += `${d === '' ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: 80, height: 20, display: 'inline-block' }} role="img" aria-label="直近30日推移">
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
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📈 JEPX スポット価格 日次 (実データ、10 系列)</h2>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>最終更新: {latestUpdate} / 合計 {totalPoints.toLocaleString()} pt</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 0, marginBottom: 8 }}>
        出典: <a href="https://data.eic-jp.org/catalog?domain=power" target="_blank" rel="noopener noreferrer">EIC Data (data.eic-jp.org)</a>
        、原データは日本卸電力取引所 (JEPX) 公表値、
        <a href="https://www.jepx.jp/electricpower/index.html" target="_blank" rel="noopener noreferrer">jepx-terms</a> 準拠。
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              <th style={{ padding: 8, textAlign: 'left', border: '1px solid var(--color-border)' }}>系列</th>
              <th style={{ padding: 8, textAlign: 'left', border: '1px solid var(--color-border)' }}>最新日</th>
              <th style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>価格 (¥/kWh)</th>
              <th style={{ padding: 8, textAlign: 'center', border: '1px solid var(--color-border)' }}>直近30日</th>
              <th style={{ padding: 8, textAlign: 'left', border: '1px solid var(--color-border)' }}>引用 (APA)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const latest = latestValid(s.points);
              const apa = formatCitation(s.meta, 'apa');
              return (
                <tr key={s.id}>
                  <td style={{ padding: 8, border: '1px solid var(--color-border)' }}>{s.meta.name}</td>
                  <td style={{ padding: 8, border: '1px solid var(--color-border)', fontSize: 12 }}>{latest?.date ?? '—'}</td>
                  <td style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)', fontWeight: 600 }}>
                    {latest ? latest.value.toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: 4, textAlign: 'center', border: '1px solid var(--color-border)' }}>
                    <Sparkline points={s.points} />
                  </td>
                  <td style={{ padding: 8, border: '1px solid var(--color-border)', fontSize: 11 }}>
                    <details>
                      <summary style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>引用を開く</summary>
                      <pre style={{ marginTop: 4, padding: 6, background: 'var(--color-bg)', fontSize: 10, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{apa}</pre>
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
