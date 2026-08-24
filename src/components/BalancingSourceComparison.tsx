'use client';

/**
 * src/components/BalancingSourceComparison.tsx
 *
 * 需給調整 電源種別比較（蓄電池・VPP・揚水・火力・水力 — 5種完結）— 二極構造
 *
 * 設計:
 *  - microCMS リクエストなし (client-side 表示のみ)
 *  - pricesBySourceFy props 経由（server page が catalog JSON から注入）、無ければ fallback
 *  - FY セレクタ: FY2024（通年・確定）既定 / FY2025（通年・確定）トグル
 *  - 2026-08-24: FY2025 が上期暫定 → 通年確報に差し替わった（EPRX 2026-06-18 公表）。
 *    同時に水力・揚水が PDF 上で統合されたため、FY2025 は hydroPumped 行で表示する
 *    （hydro / pumped は FY2024 で終端。統合値を水力または揚水の値として出さない＝意味が変わる）。
 *  - 二極構造: 新型（蓄電池・VPP ≒ 各年度当時の上限価格）vs 従来型（火力・水力・揚水 ≒ 1〜5円基準線）
 *  - 上限価格は 2026/8/31 実需給分まで 15.00円、2026/9/1 実需給分から 10.00円（一次・二次①・複合）。
 *    表示単価は引下げ前の FY 実績なので、注記⑦で時点を明示する（値は EPRX 実績のため書き換えない）
 *  - VPP 注記必須: 二次①②は系列なし、一次FY2024は約定ゼロ、全般的に約定月数が少ない
 *  - L-EIC-018: 単価は「約定時水準・volume 非加重」+ 期間非対称
 *  - 出典: EPRX / data.eic-jp.org catalog 2026-05-26（balancing 系 39）
 *
 * v4 (2026-05-26): 電源種別 5種完結（+火力6+水力5）。balancing 系 39。
 */

import { useState } from 'react';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type CompProduct = '一次' | '二次①' | '二次②' | '三次①' | '三次②' | '複合';
export type CompSource  = 'battery' | 'vpp' | 'thermal' | 'hydro' | 'pumped' | 'hydroPumped';
export type CompFyKey   = 'FY2024' | 'FY2025';

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
  // 2026-08-24: FY2025 の EPRX PDF で水力と揚水が統合されたため新設（FY2025 のみ）
  hydroPumped: { label: '水力・揚水（従来型・合算）', color: '#1d4ed8',          bg: '#dbeafe' },
};

/** FY ごとに表示する電源種別（FY2025 は水力・揚水が統合され、個別系列は FY2024 で終端） */
const SOURCES_BY_FY: Record<CompFyKey, CompSource[]> = {
  FY2024: ['battery', 'vpp', 'thermal', 'hydro', 'pumped'],
  FY2025: ['battery', 'vpp', 'thermal', 'hydroPumped'],
};

const FY_OPTIONS: { key: CompFyKey; label: string; note: string }[] = [
  {
    key:   'FY2024',
    label: 'FY2024（通年・確定）',
    note:  '2024/4〜2025/3 — EPRX 2025年3月公表',
  },
  {
    key:   'FY2025',
    label: 'FY2025（通年・確定）',
    note:  '2025/4〜2026/3 — EPRX 2026年6月公表。水力・揚水は合算値',
  },
];

/**
 * Fallback 単価（出典: EPRX ／ data.eic-jp.org catalog 2026-08-24）
 * null = 系列なし / 約定ゼロ
 * ★catalog が読めた場合は page.tsx が実データで上書きするため、ここは保険値。
 *   値を変えるときは catalog の実値と一致させること（#121 の二重管理を残さない）。
 */
const FALLBACK: PricesBySourceFy = {
  battery: {
    FY2024:   { '一次': 15.99, '二次①':  7.71, '二次②': 12.61, '三次①': 10.60, '三次②': 109.43, '複合': 15.80 },
    FY2025:   { '一次': 11.52, '二次①': 12.51, '二次②': 12.81, '三次①': 12.28, '三次②':  19.31, '複合': 11.50 },
  },
  vpp: {
    FY2024:   { '一次': null,  '二次①': null, '二次②': null,  '三次①':  7.21, '三次②':  46.24, '複合':  7.21 },
    FY2025:   { '一次': 19.12, '二次①': null, '二次②': 14.74, '三次①':  7.09, '三次②':  53.59, '複合': 17.07 },
  },
  thermal: {
    FY2024:   { '一次': 2.29, '二次①': 3.17, '二次②': 3.02, '三次①': 2.90, '三次②': 4.90, '複合': 2.89 },
    FY2025:   { '一次': 2.61, '二次①': 2.89, '二次②': 2.75, '三次①': 2.65, '三次②': 1.34, '複合': 2.63 },
  },
  // hydro / pumped は FY2024 で終端（FY2025 は hydroPumped に統合された）
  hydro: {
    FY2024:   { '一次': 2.28, '二次①': 2.24, '二次②': 1.82, '三次①': 1.82, '三次②': null, '複合': 1.82 },
    FY2025:   {},
  },
  pumped: {
    FY2024:   { '一次': 4.17, '二次①': 3.70, '二次②': 1.84, '三次①': 1.90, '三次②': 0.72, '複合': 2.12 },
    FY2025:   {},
  },
  // FY2025 のみ（FY2024 は水力・揚水が別系列で公表されていた）
  hydroPumped: {
    FY2024:   {},
    FY2025:   { '一次': 1.49, '二次①': 1.73, '二次②': 1.81, '三次①': 1.68, '三次②': 0.64, '複合': 1.67 },
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
  for (const src of SOURCES_BY_FY[fy]) {
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
        <span style={{ color: '#6b7280', fontSize: 15 }}>（水力は三次②約定なし）</span>
        {' '}
        <span
          style={{
            display: 'inline-block',
            background: 'var(--color-navy)',
            color: '#fff',
            fontSize: 15,
            padding: '1px 6px',
            borderRadius: 3,
          }}
        >
          約 {Math.round(t2b / t2p)} 倍差
        </span>
        <br />
        <strong>新型（蓄電池・VPP）＝各年度当時の上限価格付近に集中</strong>、
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
          fontSize: 15,
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
        ④ <strong>FY2024・FY2025 とも通年（各年度 4月〜翌3月）の確定値です。</strong>
        FY2025 は EPRX が 2026 年 6 月 18 日に公表した通年確報で、旧・上期暫定値から改訂されています。<br />
        ④-2 <strong>FY2025 は水力と揚水が EPRX 側で合算公表に変わりました</strong>。
        本表では FY2025 を「水力・揚水（合算）」の 1 行で表示し、FY2024 は従来どおり水力・揚水を
        別行で表示します（合算値を水力または揚水の値として出すと系列の意味が変わるため）。<br />
        ⑤ 出典: 電力需給調整力取引所（EPRX）「取引実績の取りまとめ結果」より転記・編集 ／ data.eic-jp.org catalog 2026-05-26（balancing 系 39）。<br />
        ⑥ 火力・水力の単価は大口・代表的落札水準（複数年契約 / 発電コスト連動が多い）。蓄電池・VPP と直接比較する際は入札戦略の違いにも留意。<br />
        ⑦ <strong>ΔkW 上限価格の改定</strong>: 一次調整力・二次調整力①・複合商品の上限価格は、
        <strong>2026年8月31日実需給分まで 15.00 円/ΔkW・30分、2026年9月1日実需給分から 10.00 円/ΔkW・30分</strong>
        （適用終了は「当面の間」）。二次調整力②・三次調整力①は 7.21 円/ΔkW・30分を当面継続、三次調整力②は上限なし。
        本表の FY2024・FY2025 は<strong>引下げ前の実績</strong>で、2026年9月以降の上限のある商品の単価水準はこれより低くなります
        （出典: 電力需給調整力取引所（EPRX）2026年7月30日公表「需給調整市場のΔkW上限価格について」、根拠: 第4回 電力安定供給ワーキンググループ 資料6）。
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
                        marginLeft: 6, fontSize: 15, padding: '1px 5px',
                        background: 'var(--color-accent)', color: '#fff', borderRadius: 3,
                      }}
                    >
                      既定
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 1 }}>{opt.note}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* ─── 比較テーブル ─── */}
      {/*
        #107 / #103(2026-08-24): FY2025 が上期暫定 → 通年確報になり、隠れている値の価値が変わったため、
        **両FYを初期DOMに描画し hidden で表示切替**する（DOM の生成/破棄ではない）。
        operators(0011c09) / ChubuMap(8b93864) で確立した「先頭N可視＋残りhidden」と同じ方式。
        hidden 属性は display:none 相当なのでレイアウトを押し広げず CLS を増やさない。
        データ量は 5電源 × 6商品 × 2FY = 60値で、両方描画してもコストは無視できる。
      */}
      {FY_OPTIONS.map((fyOption) => {
        const fy = fyOption.key;
        const fyMaxVal = maxPrice(data, fy);
        // hidden 属性だけで十分（display:none 相当＝支援技術からも外れる）。
        // aria-hidden の併記は冗長で、可視側に aria-hidden="false" が出るため付けない。
        return (
          <section key={fy} hidden={fy !== selectedFy}>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>
          落札単価 比較表 — {fyOption.label}
          <span style={{ fontSize: 15, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
            （円/ΔkW・30分）
          </span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>商品</th>
                {SOURCES_BY_FY[fy].map((src) => (
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
                            marginLeft: 6, fontSize: 15, padding: '1px 5px',
                            background: '#fef3c7', color: '#92400e', borderRadius: 3,
                          }}
                        >
                          ← 二極構造
                        </span>
                      )}
                    </td>
                    {SOURCES_BY_FY[fy].map((src) => {
                      const v = getPrice(data, src, fy, prod);
                      const isNull = v === null || v === undefined;
                      const barPct = isNull || v === null ? 0 : Math.round((v / fyMaxVal) * 100);
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
                            <span style={{ color: '#9ca3af', fontSize: 15 }}>
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
        <p style={{ fontSize: 15, color: '#6b7280', marginTop: 6 }}>
          ※ バーは同 FY・全商品の最大値（{fyMaxVal.toFixed(2)} 円）を 100% として正規化。
          「系列なし / 約定ゼロ」は EPRX での公表データなし。
        </p>
          </section>
        );
      })}

      {/* ─── VPP 補足注記 ─── */}
      <section
        style={{
          padding: '12px 14px',
          background: '#f0fffe',
          border: '1px solid var(--color-accent, #00B5A5)',
          borderRadius: 6,
          fontSize: 15,
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
