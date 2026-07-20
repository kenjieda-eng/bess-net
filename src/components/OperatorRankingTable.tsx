// 依頼65: 事業者ランキング表コンポーネント
// Server Component（ランタイム不要、'use client' なし）
import Link from 'next/link';

export type RankingEntry = {
  rank: number;
  operator: string;
  operatorSlug: string | null;
  isJv?: boolean;
  mergedFrom?: string[];
  totalCapacityMwh: number;
  totalOutputMw: number;
  projectCount: number;
  prefectures: number;
  capacityKnownCount: number;
};

type Props = { ranking: RankingEntry[] };

const RANK_BADGE: Record<number, { label: string; bg: string; color: string }> = {
  1: { label: '1位', bg: '#fef3c7', color: '#92400e' },
  2: { label: '2位', bg: '#f3f4f6', color: '#374151' },
  3: { label: '3位', bg: '#fde8d8', color: '#7c2d12' },
};

export default function OperatorRankingTable({ ranking }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
        <thead>
          <tr style={{ background: '#f0f4ff', textAlign: 'left' }}>
            {['順位', '事業者', '総容量 (MWh)', '総出力 (MW)', '件数', '展開都道府県数'].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '2px solid #c7d8ff',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {ranking.map((r) => {
            const badge = RANK_BADGE[r.rank];
            const coveragePct =
              r.projectCount > 0
                ? Math.round((r.capacityKnownCount / r.projectCount) * 100)
                : 0;
            return (
              <tr
                key={r.operator}
                style={{
                  background: r.rank <= 3 ? '#fffef0' : undefined,
                  borderBottom: '1px solid #e8e8e8',
                }}
              >
                {/* 順位 */}
                <td style={{ padding: '10px 12px', textAlign: 'center', minWidth: 52 }}>
                  {badge ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {badge.label}
                    </span>
                  ) : (
                    <span style={{ fontWeight: 600, color: '#555' }}>{r.rank}</span>
                  )}
                </td>

                {/* 事業者名（slug があれば /operators リンク） */}
                <td
                  style={{
                    padding: '10px 12px',
                    fontWeight: r.rank <= 3 ? 700 : undefined,
                  }}
                >
                  {r.operatorSlug ? (
                    <Link
                      href={`/operators/${r.operatorSlug}`}
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {r.operator}
                    </Link>
                  ) : (
                    r.operator
                  )}
                  {r.isJv && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginLeft: 6,
                        padding: '1px 5px',
                        fontSize: 12,
                        background: '#e0e7ff',
                        color: '#3730a3',
                        borderRadius: 3,
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      共同
                    </span>
                  )}
                </td>

                {/* 総容量 */}
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.totalCapacityMwh.toLocaleString('ja-JP')}
                  <span
                    style={{
                      fontSize: 12,
                      color: '#888',
                      marginLeft: 4,
                      display: 'block',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ({coveragePct}% / {r.capacityKnownCount}件)
                  </span>
                </td>

                {/* 総出力 */}
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.totalOutputMw > 0 ? r.totalOutputMw.toLocaleString('ja-JP') : '—'}
                </td>

                {/* 件数 */}
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>{r.projectCount}</td>

                {/* 展開都道府県数 */}
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>{r.prefectures}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ fontSize: 15, color: '#888', marginTop: 8 }}>
        ※ <span style={{ display: 'inline-block', padding: '1px 5px', fontSize: 12, background: '#e0e7ff', color: '#3730a3', borderRadius: 3 }}>共同</span>{' '}
        は「○○・△△」「○○他」等の共同出資/コンソーシアム。登録名どおりに計上し、構成各社へは分解していません。
      </p>
    </div>
  );
}
