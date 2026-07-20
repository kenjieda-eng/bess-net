'use client';

/**
 * src/components/BalancingSourceComparison.tsx
 *
 * 需給調整 電源種別比較（蓄電池・VPP・揚水・火力・水力 — 5種完結）— 二極構造
 *
 * 設計:
 *  - microCMS リクエストなし (client-side 表示のみ)
 *  - pricesBySourceFy props 経由（server page が catalog JSON から注入）、無ければ fallback
 *  - FY セレクタ: FY2024（通年・確定）既定 / FY2025 上期(暫定) トグル
 *  - 二極構造: 新型（蓄電池・VPP ≒ 上限価格）vs 従来型（火力・水力・揚水 ≒ 1〜5円基準線）
 *  - VPP 注記必須: 二次①②は系列なし、一次FY2024は約定ゼロ、全般的に約定月数が少ない
 *  - L-EIC-018: 単価は「約定時水準・volume 非加重」+ 期間非対称
 *  - 出典: EPRX / data.eic-jp.org catalog 2026-05-26（balancing 系 39）
 *
 * v4 (2026-05-26): 電源種別 5種完結（+火力6+水力5）。balancing 系 39。
 */

import { useState } from 'react';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type CompProduct = '一次' | '二次①' | '二次②' | '三次①' | '三次②' | '複合';
export type CompSource  = 'battery' | 'vpp' | 'thermal' | 'hydro' | 'pumped';
export type CompFyKey   = 'FY2024' | 'FY2025H1';

export type PricesBySourceFy = Record<
  CompSource,
  Record<CompFyKey, Partial<Record<CompProduct, number | null>>>
>;

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const PRODUCTS: CompProduct[] = ['一次', '二次①', '二次②', '三次①', '三次②', '複合'];

const SOURCE_META: Record<CompSource, { label: string; color: string; bg: string }> = {
  battery: { label: '蓄電池（新型）',  color: 'var(--color-navy, #0F2D4F)',    bg: '#e8f0f8' },
  vpp:     { label: 'VPP（新型）',     color: 'var(--color-accent, #00B5A5)', bg: '#e0faf8' },
  thermal: { label: '火力（従来型）',  color: '#b91c1c',                       bg: '#fee2e2' },
  hydro:   { label: '水力（従来型）',  color: '#1d4ed8',                       bg: '#dbeafe' },
  pumped:  { label: '揚水（従来型）',  color: '#92400e',                       bg: '#fef3c7' },
};

const FY_OPTIONS: { key: CompFyKey; label: string; note: string }[] = [
  {
    key:   'FY2024',
    label: 'FY2024（通年・確定）',
    note:  '2024/4〜2025/3 — EPRX 2025年3月公表',
  },
  {
    key:   'FY2025H1',
    label: 'FY2025 上期(暫定・2025/4〜9のみ)',
    note:  '2025/4〜9 上期のみ — EPRX 2025年12月公表。通年は 2026年6月頃見込み',
  },
];

/**
 * Fallback 単価（出典: EPRX catalog 2026-05-25）
 * null = 系列なし / 約定ゼロ
 */
const FALLBACK: PricesBySourceFy = {
  battery: {
    FY2024:   { '一次': 15.99, '二次①':  7.71, '二次②': 12.61, '三次①': 10.60, '三次②': 109.43, '複合': 15.80 },
    FY2025H1: { '一次': 11.41, '二次①': 14.13, '二次②': 14.33, '三次①': 13.83, '三次②':  33.52, '複合': 11.39 },
  },
  vpp: {
    FY2024:   { '一次': null,  '二次①': null, '二次②': null,  '三次①':  7.21, '三次②':  46.24, '複合':  7.21 },
    FY2025H1: { '一次': 19.35, '二次①': null, '二次②': null,  '三次①':  4.92, '三次②':  62.47, '複合': 15.26 },
  },
  thermal: {
    FY2024:   { '一次': 2.29, '二次①': 3.17, '二次②': 3.02, '三次①': 2.90, '三次②': 4.90, '複合': 2.89 },
    FY2025H1: { '一次': 2.81, '二次①': 3.06, '二次②': 2.90, '三次①': 2.87, '三次②': 1.42, '複合': 2.86 },
  },
  hydro: {
    FY2024:   { '一次': 2.28, '二次①': 2.24, '二次②': 1.82, '三次①': 1.82, '三次②': null, '複合': 1.82 },
    FY2025H1: { '一次': 1.65, '二次①': 1.66, '二次②': 1.66, '三次①': 1.66, '三次②': null, '複合': 1.65 },
  },
  pumped: {
    FY2024:   { '一次': 4.17, '二次①': 3.70, '二次②': 1.84, '三次①': 1.90, '三次②': 0.72, '複合': 2.12 },
    FY2025H1: { '一次': 1.85, '二次①': 1.89, '二次②': 2.38, '三次①': 2.26, '三次②': 0.69, '複合': 2.24 },
  },
};

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function getPrice(
  data: PricesBySourceFy,
  source: CompSource,
  fy: CompFyKey,
  product: CompProduct
): number | null | undefined {
  return data[source]?.[fy]?.[product];
}

/** 選択中 FY の全5電源種別の最大値（バーチャート正規化用） */
function maxPrice(data: PricesBySourceFy, fy: CompFyKey): number {
  let max = 0;
  for (const src of ['battery', 'vpp', 'thermal', 'hydro', 'pumped'] as CompSource[]) {
    for (const prod of PRODUCTS) {
      const v = getPrice(data, src, fy, prod);
      if (v != null && v > max) max = v;
    }
  }
  return max || 1;
}

// ─── スタイル ─────────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: 'var(--color-navy, #0F2D4F)',
  color: '#fff',
  fontWeight: 600,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  fontSize: 15,
};

const tdStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderBottom: '1px solid var(--color-border, #e5e7eb)',
  verticalAlign: 'middle',
  textAlign: 'center',
  fontSize: 15,
};

// ─── コンポーネント ───────────────────────────────────────────────────────────

export function BalancingSourceComparison({
  pricesBySourceFy,
  defaultFy = 'FY2024',
}: {
  pricesBySourceFy?: PricesBySourceFy;
  defaultFy?: CompFyKey;
}) {
  const [selectedFy, setSelectedFy] = useState<CompFyKey>(defaultFy);

  const data: PricesBySourceFy = pricesBySourceFy ?? FALLBACK;
  const activeFyOption = FY_OPTIONS.find((o) => o.key === selectedFy)!;
  const maxVal = maxPrice(data, selectedFy);

  // 三次② FY2024 の代表値（callout 用）
  const t2b  = FALLBACK.battery.FY2024['三次②']!;
  const t2v  = FALLBACK.vpp.FY2024['三次②']!;
  const t2th = FALLBACK.thermal.FY2024['三次②']!;
  const t2p  = FALLBACK.pumped.FY2024['三次②']!;

  return (
    <div className="space-y-6">
      {/* ─── 二極構造 callout ─── */}
      <div
        style={{
          borderLeft: '4px solid var(--color-navy, #0F2D4F)',
          background: '#f0f4f8',
          padding: '14px 16px',
          borderRadius: '0 6px 6px 0',
          fontSize: 15,
          lineHeight: 1.8,
          color: '#1e3a5f',
        }}
      >
        <strong style={{ fontSize: 15 }}>⚡ 需給調整市場の「二極構造」（5電源種別）</strong>
        <br />
        三次調整力②（FY2024 代表値）
        <br />
        　<span style={{ fontWeight: 700 }}>新型</span>：蓄電池{' '}
        <strong style={{ color: 'var(--color-navy)' }}>{t2b} 円</strong> ／ VPP{' '}
        <strong style={{ color: 'var(--color-accent)' }}>{t2v} 円</strong>
        <br />
        　<span style={{ fontWeight: 700 }}>従来型</span>：火力{' '}
        <strong style={{ color: '#b91c1c' }}>{t2th} 円</strong> ／ 揚水{' '}
        <strong style={{ color: '#92400e' }}>{t2p} 円</strong>
        <span style={{ color: '#6b7280', fontSize: 13 }}>（水力は三次②約定なし）</span>
        {' '}
        <span
          style={{
            display: 'inline-block',
            background: 'var(--color-navy)',
            color: '#fff',
            fontSize: 12,
            padding: '1px 6px',
            borderRadius: 3,
          }}
        >
          約 {Math.round(t2b / t2p)} 倍差
        </span>
        <br />
        <strong>新型（蓄電池・VPP）＝上限価格付近に集中</strong>、
        <strong>従来型（火力・水力・揚水）＝1〜5 円の基準線</strong>。
        高速応動の希少価値が新型の高単価を形成しています。
      </div>

      {/* ─── L-EIC-018 注記 ─── */}
      <div
        style={{
          borderLeft: '4px solid var(--color-accent, #00B5A5)',
          background: '#fffbeb',
          padding: '12px 16px',
          borderRadius: '0 6px 6px 0',
          fontSize: 13,
          lineHeight: 1.7,
          color: '#374151',
        }}
      >
        <strong>⚠️ 注意事項（L-EIC-018）</strong>
        <br />
        ① 蓄電池・VPP の単価は「約定したときの水準」（volume 非加重）。
        <strong>総収益 = 単価 × 全量ではありません</strong>。<br />
        ② <strong>VPP は約定月数が少なく、値が荒い傾向があります</strong>（二次①②は系列なし・約定ゼロ、一次 FY2024 は約定ゼロ）。<br />
        ③ 揚水・火力・水力は従来電源の基準線（低単価・安定）。<br />
        ④ <strong>FY2024（通年）と FY2025（上期のみ）は期間が非対称。比較は通年同士で。</strong>
        FY2025 通年は 2026 年 6 月頃 EPRX 公表後に更新予定。<br />
        ⑤ 出典: 電力需給調整力取引所（EPRX）「取引実績の取りまとめ結果」より転記・編集 ／ data.eic-jp.org catalog 2026-05-26（balancing 系 39）。<br />
        ⑥ 火力・水力の単価は大口・代表的落札水準（複数年契約 / 発電コスト連動が多い）。蓄電池・VPP と直接比較する際は入札戦略の違いにも留意。
      </div>

      {/* ─── FY セレクタ ─── */}
      <section>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 10 }}>
          表示年度
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {FY_OPTIONS.map((opt) => (
            <label
              key={opt.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                cursor: 'pointer',
                padding: '8px 14px',
                border: `2px solid ${selectedFy === opt.key ? 'var(--color-accent, #00B5A5)' : 'var(--color-border, #e5e7eb)'}`,
                borderRadius: 6,
                background: selectedFy === opt.key ? '#f0fffe' : '#fff',
                flex: '1 1 240px',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="comp-fy-selector"
                value={opt.key}
                checked={selectedFy === opt.key}
                onChange={() => setSelectedFy(opt.key)}
                style={{ marginTop: 2, accentColor: 'var(--color-accent, #00B5A5)' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-navy)' }}>
                  {opt.label}
                  {opt.key === 'FY2024' && (
                    <span
                      style={{
                        marginLeft: 6, fontSize: 12, padding: '1px 5px',
                        background: 'var(--color-accent)', color: '#fff', borderRadius: 3,
                      }}
                    >
                      既定
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{opt.note}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* ─── 比較テーブル ─── */}
      <section>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>
          落札単価 比較表 — {activeFyOption.label}
          <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
            （円/ΔkW・30分）
          </span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>商品</th>
                {(['battery', 'vpp', 'thermal', 'hydro', 'pumped'] as CompSource[]).map((src) => (
                  <th
                    key={src}
                    style={{
                      ...thStyle,
                      background: SOURCE_META[src].color,
                      minWidth: 110,
                    }}
                  >
                    {SOURCE_META[src].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((prod) => {
                const isTertiary2 = prod === '三次②';
                const rowBg = isTertiary2 ? '#fef9e7' : undefined;

                return (
                  <tr key={prod} style={{ background: rowBg }}>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'left',
                        fontWeight: isTertiary2 ? 700 : 500,
                        color: isTertiary2 ? 'var(--color-navy)' : undefined,
                      }}
                    >
                      {prod}
                      {isTertiary2 && (
                        <span
                          style={{
                            marginLeft: 6, fontSize: 12, padding: '1px 5px',
                            background: '#fef3c7', color: '#92400e', borderRadius: 3,
                          }}
                        >
                          ← 二極構造
                        </span>
                      )}
                    </td>
                    {(['battery', 'vpp', 'thermal', 'hydro', 'pumped'] as CompSource[]).map((src) => {
                      const v = getPrice(data, src, selectedFy, prod);
                      const isNull = v === null || v === undefined;
                      const barPct = isNull || v === null ? 0 : Math.round((v / maxVal) * 100);
                      const isHighVal = !isNull && v !== null && v > 10;

                      return (
                        <td
                          key={src}
                          style={{
                            ...tdStyle,
                            background: SOURCE_META[src].bg,
                            fontWeight: isTertiary2 ? 700 : 400,
                          }}
                        >
                          {isNull ? (
                            <span style={{ color: '#9ca3af', fontSize: 13 }}>
                              {(src === 'vpp' || src === 'hydro') ? '系列なし / 約定ゼロ' : '―'}
                            </span>
                          ) : (
                            <div>
                              <div
                                style={{
                                  fontWeight: isHighVal ? 700 : 400,
                                  color: isHighVal ? SOURCE_META[src].color : undefined,
                                }}
                              >
                                {(v as number).toFixed(2)}
                              </div>
                              {/* 簡易バー */}
                              <div
                                style={{
                                  marginTop: 3,
                                  height: 4,
                                  borderRadius: 2,
                                  background: '#e5e7eb',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${barPct}%`,
                                    background: SOURCE_META[src].color,
                                    borderRadius: 2,
                                    transition: 'width 0.3s',
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
          ※ バーは同 FY・全商品の最大値（{maxVal.toFixed(2)} 円）を 100% として正規化。
          「系列なし / 約定ゼロ」は EPRX での公表データなし。
        </p>
      </section>

      {/* ─── VPP 補足注記 ─── */}
      <section
        style={{
          padding: '12px 14px',
          background: '#f0fffe',
          border: '1px solid var(--color-accent, #00B5A5)',
          borderRadius: 6,
          fontSize: 13,
          color: '#374151',
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: 'var(--color-accent)' }}>
          🔋 VPP（仮想電源）の位置づけ（6/19 品川セミナーのテーマ）
        </strong>
        <br />
        VPP は蓄電池・EV・ヒートポンプ等の分散リソースを束ね、需給調整市場に参加します。
        三次②で蓄電池（109.43 円）に次ぐ 46.24 円（FY2024）を記録しており、
        <strong>次世代アグリゲーターとして運用収益と資産価値の両立</strong>を狙う電源種別です。
        一次・二次①② は約定月数が少なく参考値。落札量は EPRX 非公開（図のみ）のため、不足率を落札しやすさの代理として併用。
      </section>
    </div>
  );
}
