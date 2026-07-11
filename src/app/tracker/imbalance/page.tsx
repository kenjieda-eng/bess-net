/**
 * /tracker/imbalance — 需給調整市場 約定価格トラッカー（商品別・年次）
 *
 * 設計:
 *   - Server Component、外部 API リクエスト 0（CLAUDE.md 鉄則 #2）
 *   - catalog JSON 直読み（build 時 precompute 済み）
 *   - revalidate = 86400（catalog 更新に追従）
 *   - 業界唯一性 #15 達成 (2026-05-28)
 *
 * 注意:
 *   - 本トラッカーは「調整力 約定価格」（EPRX 公表値）。
 *     「インバランス料金」（実需給差分）とは別データ。
 *   - L-EIC-018: 蓄電池・VPP の単価は「約定時の単価水準（volume 非加重）」。
 *     総収益 ≠ 単価 × 全量（高値は小ボリュームに乗る）。
 *
 * データ構成 (18 系列):
 *   ① balancing-price-{6商品}           全体 落札単価（年次）
 *   ② balancing-price-{6商品}-battery   蓄電池 落札単価（FY2024〜）
 *   ③ balancing-shortage-{6商品}        不足率（FY2024〜）
 *   ※ 三次② 全体は FY2021〜の 5 年トレンド表示
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 86400;

// ─── catalog JSON 直読み（18 系列） ────────────────────────────────────────────
// ① 全体 落札単価 (6)
import priceOverallPrimary    from '@/data/eic/balancing-price-primary.json';
import priceOverallSec1       from '@/data/eic/balancing-price-secondary-1.json';
import priceOverallSec2       from '@/data/eic/balancing-price-secondary-2.json';
import priceOverallTer1       from '@/data/eic/balancing-price-tertiary-1.json';
import priceOverallTer2       from '@/data/eic/balancing-price-tertiary-2.json';
import priceOverallComposite  from '@/data/eic/balancing-price-composite.json';
// ② 蓄電池 落札単価 (6)
import priceBatteryPrimary    from '@/data/eic/balancing-price-primary-battery.json';
import priceBatterySec1       from '@/data/eic/balancing-price-secondary-1-battery.json';
import priceBatterySec2       from '@/data/eic/balancing-price-secondary-2-battery.json';
import priceBatteryTer1       from '@/data/eic/balancing-price-tertiary-1-battery.json';
import priceBatteryTer2       from '@/data/eic/balancing-price-tertiary-2-battery.json';
import priceBatteryComposite  from '@/data/eic/balancing-price-composite-battery.json';
// ③ 不足率 (6)
import shortagePrimary        from '@/data/eic/balancing-shortage-primary.json';
import shortageSec1           from '@/data/eic/balancing-shortage-secondary-1.json';
import shortageSec2           from '@/data/eic/balancing-shortage-secondary-2.json';
import shortageTer1           from '@/data/eic/balancing-shortage-tertiary-1.json';
import shortageTer2           from '@/data/eic/balancing-shortage-tertiary-2.json';
import shortageComposite      from '@/data/eic/balancing-shortage-composite.json';

export const metadata: Metadata = {
  title: '需給調整市場 約定価格トラッカー（商品別・年次）| 蓄電所ネット',
  description:
    '需給調整市場（調整力）の商品別・年次約定価格を業界中立で可視化。① 6商品 全体落札単価 ② 蓄電池の商品別落札単価（三次② FY2024=109.43 円/ΔkW・30分）③ 6商品 不足率。出典: EPRX（電力需給調整力取引所）。',
  alternates: { canonical: '/tracker/imbalance' },
  openGraph: {
    title: '需給調整市場 約定価格トラッカー | 蓄電所ネット',
    description: 'EPRX 公表の調整力 約定価格（商品別・年次）を可視化。蓄電池三次② FY2024=109.43 円/ΔkW・30分。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─── 型定義 ────────────────────────────────────────────────────────────────────
type DataPoint = { date: string; value: number | null };
type CatalogJson = { id: string; meta: Record<string, unknown>; points: DataPoint[] };

type Product = 'primary' | 'secondary-1' | 'secondary-2' | 'tertiary-1' | 'tertiary-2' | 'composite';
const PRODUCTS: Product[] = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'];
const PRODUCT_LABELS: Record<Product, string> = {
  'primary':     '一次調整力',
  'secondary-1': '二次調整力①',
  'secondary-2': '二次調整力②',
  'tertiary-1':  '三次調整力①',
  'tertiary-2':  '三次調整力②',
  'composite':   '複合',
};
const PRODUCT_SHORT: Record<Product, string> = {
  'primary':     '一次',
  'secondary-1': '二次①',
  'secondary-2': '二次②',
  'tertiary-1':  '三次①',
  'tertiary-2':  '三次②',
  'composite':   '複合',
};

function getPoint(json: CatalogJson, datePrefix: string): number | null {
  const pt = json.points.find((p) => p.date.startsWith(datePrefix));
  return pt?.value ?? null;
}

// ─── FY ラベル変換 ─────────────────────────────────────────────────────────────
function fyLabel(dateStr: string): string {
  // "2024-04-01" → "FY2024"
  const year = parseInt(dateStr.slice(0, 4), 10);
  return `FY${year}`;
}

export default function BalancingTrackerPage() {
  // ── データ準備 ──────────────────────────────────────────────────────────────

  // 全体 落札単価
  const overallSeries: Record<Product, CatalogJson> = {
    'primary':     priceOverallPrimary    as unknown as CatalogJson,
    'secondary-1': priceOverallSec1       as unknown as CatalogJson,
    'secondary-2': priceOverallSec2       as unknown as CatalogJson,
    'tertiary-1':  priceOverallTer1       as unknown as CatalogJson,
    'tertiary-2':  priceOverallTer2       as unknown as CatalogJson,
    'composite':   priceOverallComposite  as unknown as CatalogJson,
  };

  // 蓄電池 落札単価
  const batterySeries: Record<Product, CatalogJson> = {
    'primary':     priceBatteryPrimary    as unknown as CatalogJson,
    'secondary-1': priceBatterySec1       as unknown as CatalogJson,
    'secondary-2': priceBatterySec2       as unknown as CatalogJson,
    'tertiary-1':  priceBatteryTer1       as unknown as CatalogJson,
    'tertiary-2':  priceBatteryTer2       as unknown as CatalogJson,
    'composite':   priceBatteryComposite  as unknown as CatalogJson,
  };

  // 不足率
  const shortageSeries: Record<Product, CatalogJson> = {
    'primary':     shortagePrimary   as unknown as CatalogJson,
    'secondary-1': shortageSec1      as unknown as CatalogJson,
    'secondary-2': shortageSec2      as unknown as CatalogJson,
    'tertiary-1':  shortageTer1      as unknown as CatalogJson,
    'tertiary-2':  shortageTer2      as unknown as CatalogJson,
    'composite':   shortageComposite as unknown as CatalogJson,
  };

  const updatedAt = (priceOverallTer2 as unknown as CatalogJson).meta?.updated_at as string | undefined;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '業界トラッカー', item: 'https://bess-net.jp/tracker' },
      { '@type': 'ListItem', position: 3, name: '需給調整 約定価格', item: 'https://bess-net.jp/tracker/imbalance' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1080 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/tracker">業界トラッカー</Link> /{' '}
            需給調整 約定価格
          </p>
          <div className="section-label" style={{ color: '#0c6', fontWeight: 700 }}>★ 当サイト独自 · 商品別 年次トラッカー</div>
          <h1 className="section-title">需給調整市場 約定価格トラッカー</h1>
          <p className="section-desc" style={{ marginBottom: 8, lineHeight: 1.7 }}>
            電力需給調整力取引所 (EPRX) が公表する調整力の<strong>商品別・年次 約定価格</strong>と<strong>不足率</strong>を可視化。
            系統用蓄電池の収益源として注目される需給調整市場（三次調整力②）の動向を業界中立で追跡。
          </p>
          {updatedAt && (
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 16 }}>
              データ更新: {updatedAt.slice(0, 10)} ／ 出典: 一般社団法人 電力需給調整力取引所 (EPRX)「調整力の取引結果まとめ」を加工
            </p>
          )}

          {/* ─ L-EIC-018 重要注記 ─ */}
          <section style={{ padding: 14, marginBottom: 24, background: 'rgba(0,102,204,0.06)', border: '1px solid var(--color-accent)', borderRadius: 6 }}>
            <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              <strong>⚠ 読み方の注意（L-EIC-018）:</strong>{' '}
              蓄電池の落札単価は「<strong>約定したときの単価水準</strong>」（volume 非加重の約定時平均）であり、
              「単価 × 市場全量」で総収益を試算することはできません（高単価は小ボリュームの約定に乗る）。
              また本データは「<strong>調整力 約定価格</strong>」（EPRX 公表）です。
              実需給差分に基づく「インバランス料金」とは異なるデータです。
            </p>
          </section>

          {/* ─ Section 1: 全体 落札単価 ─ */}
          <Section1Overall overallSeries={overallSeries} />

          {/* ─ Section 2: 蓄電池 落札単価 ─ */}
          <Section2Battery batterySeries={batterySeries} />

          {/* ─ Section 3: 不足率 ─ */}
          <Section3Shortage shortageSeries={shortageSeries} />

          {/* ─ Section 4: 三次② 全体 5年トレンド ─ */}
          <Section4Ter2Trend ter2Overall={overallSeries['tertiary-2']} />

          {/* ─ 関連リンク ─ */}
          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/tools/balancing-revenue">需給調整 収益シナリオ（蓄電池 vs VPP vs 揚水 比較）</Link></li>
              <li><Link href="/buyer/balancing-market">需給調整市場 収益解説（Buyer 向け）</Link></li>
              <li><Link href="/dashboard/market">マーケットデータ ダッシュボード（29 系列）</Link></li>
              <li><Link href="/tracker">業界トラッカー（補助金 / 系統 / AG / PF）</Link></li>
              <li>
                <a href={siteConfig.organization.url} target="_blank" rel="noopener noreferrer">
                  一般社団法人エネルギー情報センター
                </a>
                ／ 出典:
                <a href="https://www.eprx.or.jp/information/summary.php" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>
                  EPRX「調整力の取引結果まとめ」
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

// ─── ヘルパー: 水平バー ────────────────────────────────────────────────────────
function HBar({ value, max, color, label }: { value: number | null; max: number; color: string; label?: string }) {
  if (value === null) return <span style={{ fontSize: 12, color: '#aaa' }}>—</span>;
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: '#eee', borderRadius: 3, height: 16, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, minWidth: 56, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {value.toFixed(2)}{label}
      </span>
    </div>
  );
}

// ─── Section 1: 全体 落札単価 ─────────────────────────────────────────────────
function Section1Overall({ overallSeries }: { overallSeries: Record<Product, CatalogJson> }) {
  const fy24vals = PRODUCTS.map((p) => getPoint(overallSeries[p], '2024'));
  const fy25vals = PRODUCTS.map((p) => getPoint(overallSeries[p], '2025'));
  const allVals = [...fy24vals, ...fy25vals].filter((v): v is number => v !== null);
  const maxVal = Math.max(...allVals, 1);

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>① 全体 落札単価（商品別・年次）</h2>
      <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>
        単位: 円/ΔkW・30min ／ 出典: EPRX「調整力の取引結果まとめ」年間まとめ PDF を転記・加工
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', width: 120 }}>商品</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', minWidth: 200 }}>FY2024（確定）</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', minWidth: 200 }}>FY2025（上期暫定）</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const v24 = getPoint(overallSeries[p], '2024');
              const v25 = getPoint(overallSeries[p], '2025');
              return (
                <tr key={p} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{PRODUCT_SHORT[p]}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <HBar value={v24} max={maxVal} color="#4a90d9" label=" 円" />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <HBar value={v25} max={maxVal} color="#7ab8f5" label=" 円" />
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

// ─── Section 2: 蓄電池 落札単価 ───────────────────────────────────────────────
function Section2Battery({ batterySeries }: { batterySeries: Record<Product, CatalogJson> }) {
  const fy24vals = PRODUCTS.map((p) => getPoint(batterySeries[p], '2024'));
  const fy25vals = PRODUCTS.map((p) => getPoint(batterySeries[p], '2025'));
  const allVals = [...fy24vals, ...fy25vals].filter((v): v is number => v !== null);
  const maxVal = Math.max(...allVals, 1);

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>② 蓄電池 落札単価（商品別・年次）</h2>
      <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 4 }}>
        単位: 円/ΔkW・30min ／ FY2024 以降のデータ（EPRX 公表値）
      </p>
      <p style={{ fontSize: 12, padding: '6px 10px', background: 'rgba(0,102,204,0.06)', borderLeft: '3px solid var(--color-accent)', marginBottom: 16 }}>
        ⚠ L-EIC-018: 蓄電池単価は約定時の単価水準（volume 非加重）。総収益 ≠ 単価 × 全量。
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', width: 120 }}>商品</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', minWidth: 220 }}>FY2024（確定）</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', minWidth: 220 }}>FY2025（上期暫定）</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', width: 80 }}>前年比</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const v24 = getPoint(batterySeries[p], '2024');
              const v25 = getPoint(batterySeries[p], '2025');
              const isTer2 = p === 'tertiary-2';
              const ratio = v24 && v25 ? (v25 / v24 - 1) * 100 : null;
              return (
                <tr key={p} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: isTer2 ? 'rgba(255,100,0,0.05)' : undefined,
                }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                    {PRODUCT_SHORT[p]}
                    {isTer2 && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 5px', background: '#f60', color: 'white', borderRadius: 3 }}>注目</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <HBar value={v24} max={maxVal} color={isTer2 ? '#e06020' : '#4a90d9'} label=" 円" />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <HBar value={v25} max={maxVal} color={isTer2 ? '#f09060' : '#7ab8f5'} label=" 円" />
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>
                    {ratio !== null ? (
                      <span style={{ color: ratio > 0 ? '#090' : '#c00', fontWeight: 600 }}>
                        {ratio > 0 ? '▲' : '▼'}{Math.abs(ratio).toFixed(0)}%
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, marginTop: 8, color: 'var(--color-muted)' }}>
        ※ 三次②（三次調整力②）FY2024=109.43 円 は他商品の 10〜15 倍水準。FY2025 上期（暫定）は 33.52 円に低下。
        蓄電池の単価優位は小ボリューム・高値での約定構造を反映しています（L-EIC-018）。
      </p>
    </section>
  );
}

// ─── Section 3: 不足率 ────────────────────────────────────────────────────────
function Section3Shortage({ shortageSeries }: { shortageSeries: Record<Product, CatalogJson> }) {
  const fy24vals = PRODUCTS.map((p) => getPoint(shortageSeries[p], '2024'));
  const fy25vals = PRODUCTS.map((p) => getPoint(shortageSeries[p], '2025'));
  const allVals = [...fy24vals, ...fy25vals].filter((v): v is number => v !== null);
  const maxVal = Math.max(...allVals, 1);

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>③ 不足率（商品別・年次）</h2>
      <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 4 }}>
        単位: % ／ 調達量が必要量を下回った割合。FY2024 以降（定義が 2023〜2024 で変更、FY2024 以降のみ収録）。
      </p>
      <p style={{ fontSize: 12, padding: '6px 10px', background: 'rgba(220,0,0,0.04)', borderLeft: '3px solid #c00', marginBottom: 16 }}>
        不足率が高い商品 = 調達不足が頻発 → 参入余地・高単価形成の背景。
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', width: 120 }}>商品</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', minWidth: 200 }}>FY2024（確定）</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', minWidth: 200 }}>FY2025（上期暫定）</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', width: 80 }}>YoY</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const v24 = getPoint(shortageSeries[p], '2024');
              const v25 = getPoint(shortageSeries[p], '2025');
              const high = v24 !== null && v24 >= 50;
              const ratio = v24 && v25 ? (v25 / v24 - 1) * 100 : null;
              return (
                <tr key={p} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: high ? 'rgba(200,0,0,0.04)' : undefined,
                }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                    {PRODUCT_SHORT[p]}
                    {high && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 5px', background: '#c00', color: 'white', borderRadius: 3 }}>高不足</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <HBar value={v24} max={maxVal} color={high ? '#c44' : '#4a90d9'} label="%" />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <HBar value={v25} max={maxVal} color={high ? '#d88' : '#7ab8f5'} label="%" />
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>
                    {ratio !== null ? (
                      <span style={{ color: ratio > 0 ? '#c00' : '#090', fontWeight: 600 }}>
                        {ratio > 0 ? '▲' : '▼'}{Math.abs(ratio).toFixed(0)}%
                      </span>
                    ) : '—'}
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

// ─── Section 4: 三次② 全体 5年トレンド ───────────────────────────────────────
function Section4Ter2Trend({ ter2Overall }: { ter2Overall: CatalogJson }) {
  const pts = ter2Overall.points.filter((p) => p.value !== null) as { date: string; value: number }[];
  if (pts.length === 0) return null;
  const maxVal = Math.max(...pts.map((p) => p.value), 1);

  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>④ 三次調整力② 全体 落札単価 — 5年トレンド</h2>
      <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>
        単位: 円/ΔkW・30min ／ 蓄電池参入前後の需給構造変化を可視化
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pts.map((pt) => (
          <div key={pt.date} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 70 }}>{fyLabel(pt.date)}</span>
            <div style={{ flex: 1, background: '#eee', borderRadius: 3, height: 22, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round((pt.value / maxVal) * 100)}%`,
                background: '#4a90d9',
                height: '100%',
                borderRadius: 3,
              }} />
            </div>
            <span style={{ fontSize: 13, minWidth: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {pt.value.toFixed(2)} 円
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
