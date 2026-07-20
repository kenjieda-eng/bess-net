'use client';

/**
 * src/components/BalancingRevenueEstimator.tsx
 *
 * 需給調整 収益シナリオ（蓄電池） — Phase 1 v2
 *
 * 設計:
 *  - microCMS リクエストなし (client-side 計算のみ)
 *  - 単価は pricesByFy props 経由（server page が catalog JSON から注入）
 *  - FY セレクタ: FY2024（通年・確定）既定 / FY2025 上期(暫定) トグル
 *  - L-EIC-018: 単価は「約定時水準・volume 非加重」+ 期間非対称の明示
 *  - 三次②の高単価は約定が稀（デフォルト落札率 2%）
 *  - 複合はデフォルトで除外（個別と二重計上し得る）
 *
 * v2 変更点 (2026-05-24, リン回答反映):
 *  - props: pricesByFy + defaultFy（旧 prices/fyLabel を置換）
 *  - FY ラジオセレクタ追加、既定 FY2024
 *  - L-EIC-018 注記に期間非対称の一文を追加
 */

import { useState } from 'react';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type ProductKey =
  | 'primary'
  | 'secondary-1'
  | 'secondary-2'
  | 'tertiary-1'
  | 'tertiary-2'
  | 'composite';

export type FyKey = 'FY2024' | 'FY2025H1';

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const PRODUCTS: { key: ProductKey; label: string; defRate: number }[] = [
  { key: 'primary',     label: '一次調整力',   defRate: 5  },
  { key: 'secondary-1', label: '二次調整力①', defRate: 5  },
  { key: 'secondary-2', label: '二次調整力②', defRate: 5  },
  { key: 'tertiary-1',  label: '三次調整力①', defRate: 10 },
  { key: 'tertiary-2',  label: '三次調整力②', defRate: 2  }, // 高単価＝約定が稀（L-EIC-018）
  { key: 'composite',   label: '複合調整力',   defRate: 0  }, // 既定で除外（個別と重複し得る）
];

/** FY セレクタ選択肢 */
const FY_OPTIONS: { key: FyKey; label: string; note: string }[] = [
  {
    key: 'FY2024',
    label: 'FY2024（通年・確定）',
    note: '2024/4〜2025/3 通年 — EPRX 2025年3月公表',
  },
  {
    key: 'FY2025H1',
    label: 'FY2025 上期(暫定・2025/4〜9のみ)',
    note: '2025/4〜9 上期のみ — EPRX 2025年12月公表。通年は 2026 年 6 月頃見込み',
  },
];

/** FY2024 fallback（出典: data.eic-jp.org catalog 2026-05-24、EPRX） */
const FALLBACK_BY_FY: Record<FyKey, Record<ProductKey, number>> = {
  FY2024: {
    'primary':     15.99,
    'secondary-1':  7.71,
    'secondary-2': 12.61,
    'tertiary-1':  10.60,
    'tertiary-2': 109.43,
    'composite':   15.80,
  },
  FY2025H1: {
    'primary':     11.41,
    'secondary-1': 14.13,
    'secondary-2': 14.33,
    'tertiary-1':  13.83,
    'tertiary-2':  33.52,
    'composite':   11.39,
  },
};

const BLOCKS_PER_YEAR = 365 * 48; // 17,520 コマ/年

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function fmtYen(v: number): string {
  if (v >= 1e8) return `約 ${(v / 1e8).toFixed(2)} 億円`;
  return `約 ${Math.round(v / 1e4).toLocaleString()} 万円`;
}

// ─── スタイル定数 ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '6px 10px',
  border: '1px solid var(--color-border, #ccc)',
  borderRadius: 4,
  fontSize: 15,
  background: '#fff',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 15,
};

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: 'var(--color-navy, #0F2D4F)',
  color: '#fff',
  fontWeight: 600,
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderBottom: '1px solid var(--color-border, #e5e7eb)',
  verticalAlign: 'middle',
};

// ─── コンポーネント ───────────────────────────────────────────────────────────

export function BalancingRevenueEstimator({
  pricesByFy,
  defaultFy = 'FY2024',
}: {
  pricesByFy?: Record<FyKey, Record<ProductKey, number>>;
  defaultFy?: FyKey;
}) {
  const [selectedFy, setSelectedFy] = useState<FyKey>(defaultFy);
  const [capacityKw, setCapacityKw] = useState(10000);
  const [blocks, setBlocks] = useState(BLOCKS_PER_YEAR);
  const [rates, setRates] = useState<Record<ProductKey, number>>(
    Object.fromEntries(PRODUCTS.map((p) => [p.key, p.defRate])) as Record<ProductKey, number>
  );
  const [includeComposite, setIncludeComposite] = useState(false);

  // 選択中 FY の単価マップ（props → fallback の順で解決）
  const activePrices: Record<ProductKey, number> =
    pricesByFy?.[selectedFy] ?? FALLBACK_BY_FY[selectedFy];

  const activeFyOption = FY_OPTIONS.find((o) => o.key === selectedFy)!;

  const rows = PRODUCTS.filter(
    (p) => p.key !== 'composite' || includeComposite
  ).map((p) => {
    const price = activePrices[p.key] ?? 0;
    const rate = rates[p.key] ?? 0;
    const revenue = price * capacityKw * blocks * (rate / 100);
    return { ...p, price, rate, revenue };
  });

  const total = rows.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="space-y-6">
      {/* ─── L-EIC-018 注記（必須・上部固定） ─── */}
      <div
        style={{
          borderLeft: '4px solid var(--color-accent, #00B5A5)',
          background: '#fffbeb',
          padding: '14px 16px',
          borderRadius: '0 6px 6px 0',
          fontSize: 15,
          lineHeight: 1.7,
          color: '#374151',
        }}
      >
        <strong style={{ fontSize: 15 }}>
          ⚠️ これは前提次第で大きく変わる「概算シナリオ」です。
        </strong>
        <br />
        ・単価は「蓄電池が約定したときの単価水準」（EPRX・volume 非加重）。
        <strong>総収益 = 単価 × 全量ではありません</strong>。<br />
        ・三次②の高単価は約定が稀（FY2024: 50 円超の落札量が全体の 2.3% で調達費の 61%）。落札率は保守的に。<br />
        ・エネルギー制約上、蓄電池が全コマ（年 17,520）で同容量を提供することはできません。コマ数・落札率は実態に合わせて下げてください。<br />
        ・<strong>FY2024（通年）と FY2025（上期のみ）は対象期間が非対称です。比較は通年同士で。</strong>FY2025 通年は EPRX 公表後（2026 年 6 月頃見込み）に更新します。<br />
        ・出典: 電力需給調整力取引所（EPRX）／ data.eic-jp.org catalog 2026-05-24。
      </div>

      {/* ─── FY セレクタ ─── */}
      <section>
        <h2
          style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 10 }}
        >
          単価の年度
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {FY_OPTIONS.map((opt) => (
            <label
              key={opt.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                cursor: 'pointer',
                padding: '10px 14px',
                border: `2px solid ${selectedFy === opt.key ? 'var(--color-accent, #00B5A5)' : 'var(--color-border, #e5e7eb)'}`,
                borderRadius: 6,
                background: selectedFy === opt.key ? '#f0fffe' : '#fff',
                transition: 'all 0.15s',
                flex: '1 1 260px',
              }}
            >
              <input
                type="radio"
                name="fy-selector"
                value={opt.key}
                checked={selectedFy === opt.key}
                onChange={() => setSelectedFy(opt.key)}
                style={{ marginTop: 2, accentColor: 'var(--color-accent, #00B5A5)' }}
                aria-label={opt.label}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-navy)' }}>
                  {opt.label}
                  {opt.key === 'FY2024' && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 15,
                        padding: '1px 6px',
                        background: 'var(--color-accent, #00B5A5)',
                        color: '#fff',
                        borderRadius: 3,
                        verticalAlign: 'middle',
                      }}
                    >
                      既定
                    </span>
                  )}
                  {opt.key === 'FY2025H1' && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 15,
                        padding: '1px 6px',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: 3,
                        verticalAlign: 'middle',
                      }}
                    >
                      上期のみ・暫定
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{opt.note}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* ─── 基本入力 ─── */}
      <section>
        <h2
          style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 12 }}
        >
          基本前提
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          <label style={{ fontSize: 15, fontWeight: 600, display: 'block' }}>
            提供容量 [kW]
            <input
              type="number"
              min={0}
              step={100}
              value={capacityKw}
              onChange={(e) => setCapacityKw(Number(e.target.value))}
              style={inputStyle}
              aria-label="提供容量（kW）"
            />
            <span style={{ fontSize: 15, color: '#6b7280', marginTop: 2, display: 'block' }}>
              応札・調達に充てる容量
            </span>
          </label>

          <label style={{ fontSize: 15, fontWeight: 600, display: 'block' }}>
            年間提供コマ数 [30 分]
            <input
              type="number"
              min={0}
              max={BLOCKS_PER_YEAR}
              step={100}
              value={blocks}
              onChange={(e) => setBlocks(Number(e.target.value))}
              style={inputStyle}
              aria-label="年間提供コマ数"
            />
            <span style={{ fontSize: 15, color: '#6b7280', marginTop: 2, display: 'block' }}>
              最大 {BLOCKS_PER_YEAR.toLocaleString()}（365×48）。エネルギー制約で実際は下回ります。
            </span>
          </label>

          <div style={{ fontSize: 15 }}>
            <span style={{ fontWeight: 600 }}>複合調整力</span>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeComposite}
                  onChange={(e) => setIncludeComposite(e.target.checked)}
                  aria-label="複合調整力を含める"
                />
                <span>複合を含める（二重計上注意）</span>
              </label>
              <span style={{ fontSize: 15, color: '#6b7280', marginTop: 4, display: 'block' }}>
                個別商品と重複し得るため既定で除外
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 商品別 落札率 + 収益 ─── */}
      <section>
        <h2
          style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 12 }}
        >
          商品別 落札率・期待年間収益
        </h2>
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 8 }}>
          落札率は保守的なプレースホルダ（保証値ではありません）。実態に合わせて調整してください。
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>商品</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>
                  単価（{activeFyOption.label}）
                </th>
                <th style={{ ...thStyle, textAlign: 'center' }}>落札率 [%]</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>期待年間収益</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600 }}>{r.label}</span>
                    {r.key === 'tertiary-2' && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 15,
                          padding: '1px 5px',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: 3,
                        }}
                      >
                        高単価・約定稀
                      </span>
                    )}
                    {r.key === 'composite' && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 15,
                          padding: '1px 5px',
                          background: '#ede9fe',
                          color: '#5b21b6',
                          borderRadius: 3,
                        }}
                      >
                        重複注意
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {r.price.toFixed(2)}{' '}
                    <span style={{ fontSize: 15, color: '#9ca3af' }}>円/ΔkW・30分</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="number"
                      value={r.rate}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(e) =>
                        setRates((s) => ({ ...s, [r.key]: Number(e.target.value) }))
                      }
                      style={{ ...inputStyle, width: 72, textAlign: 'right', margin: '0 auto' }}
                      aria-label={`${r.label} 落札率`}
                    />
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      fontWeight: r.revenue > 0 ? 600 : 400,
                      color: r.revenue > 0 ? 'var(--color-navy)' : '#9ca3af',
                    }}
                  >
                    {r.revenue > 0 ? fmtYen(r.revenue) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={3}
                  style={{
                    ...tdStyle,
                    fontWeight: 700,
                    borderTop: '2px solid var(--color-navy)',
                    borderBottom: 'none',
                  }}
                >
                  合計（概算レンジ）
                </td>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: 16,
                    borderTop: '2px solid var(--color-navy)',
                    borderBottom: 'none',
                    color: 'var(--color-accent)',
                  }}
                >
                  {fmtYen(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ─── 計算式の明示（透明性） ─── */}
      <section
        style={{
          padding: '12px 14px',
          background: 'var(--color-bg, #f9fafb)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: 6,
          fontSize: 15,
          color: '#6b7280',
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: '#374151' }}>計算式（透明性のため明示）</strong>
        <br />
        期待年間収益[円] = 単価[円/ΔkW・30分] × 提供容量[kW] × 年間提供コマ数 × (落札率[%] ÷ 100)
        <br />
        ※ 落札率に「約定の希少性（L-EIC-018）」を反映させてください。三次②の高単価は小ボリューム約定に帰因します。
      </section>
    </div>
  );
}
