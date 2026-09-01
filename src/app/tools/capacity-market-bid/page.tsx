/**
 * /tools/capacity-market-bid — 容量市場応札試算
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2: SSR 外部 API 0（prebuild 生成 catalog JSON を static import のみ）
 *   - 鉄則 #3: 単一 URL、動的ルートなし
 *   - 鉄則 #4: ピーク負荷 0 req/分
 *
 * v2 (2026-05-29): data.eic-jp.org 容量市場 20 系列 実データ連携
 *   - catalog 240（balancing 39 + capacity 20 含む）
 *   - 年度レンジ・年度数・件数・エリア数は catalog coverage / 系列データから導出（Cm1・焼き込みなし）
 *   - 区分非依存を正しく反映（OCCTO 約定価格は新設/既設/経過措置で同価格）
 *   - Server Component で liveHistory 構築 → props 注入（鉄則 #2）
 *   - フォールバック: precompute 欠落時はモック + バナー
 *   - L-EIC-005/008§9/011 準拠
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CapacityMarketBidEstimator from '@/components/CapacityMarketBidEstimator';
import { siteConfig } from '@/lib/site-config';
import type { Area, CapacityMarketRecord } from '@/lib/capacity-market-data';
import {
  summarizeAreaSeries,
  unionObservedDates,
  fiscalYearOf,
  latestUpdatedAt,
  type EicSeries,
} from '@/lib/capacity-market-coverage';

// ─── catalog JSON 直読み（server only、prebuild 生成）────────────────────────
// price 系列（9 エリア）
import priceHokkaidoData  from '@/data/eic/capacity-main-auction-price-hokkaido.json';
import priceTohokuData    from '@/data/eic/capacity-main-auction-price-tohoku.json';
import priceTokyoData     from '@/data/eic/capacity-main-auction-price-tokyo.json';
import priceChubuData     from '@/data/eic/capacity-main-auction-price-chubu.json';
import priceHokurikuData  from '@/data/eic/capacity-main-auction-price-hokuriku.json';
import priceKansaiData    from '@/data/eic/capacity-main-auction-price-kansai.json';
import priceChugokuData   from '@/data/eic/capacity-main-auction-price-chugoku.json';
import priceShikokuData   from '@/data/eic/capacity-main-auction-price-shikoku.json';
import priceKyushuData    from '@/data/eic/capacity-main-auction-price-kyushu.json';
// volume 系列（9 エリア）
import volumeHokkaidoData  from '@/data/eic/capacity-main-auction-volume-hokkaido.json';
import volumeTohokuData    from '@/data/eic/capacity-main-auction-volume-tohoku.json';
import volumeTokyoData     from '@/data/eic/capacity-main-auction-volume-tokyo.json';
import volumeChubuData     from '@/data/eic/capacity-main-auction-volume-chubu.json';
import volumeHokurikuData  from '@/data/eic/capacity-main-auction-volume-hokuriku.json';
import volumeKansaiData    from '@/data/eic/capacity-main-auction-volume-kansai.json';
import volumeChugokuData   from '@/data/eic/capacity-main-auction-volume-chugoku.json';
import volumeShikokuData   from '@/data/eic/capacity-main-auction-volume-shikoku.json';
import volumeKyushuData    from '@/data/eic/capacity-main-auction-volume-kyushu.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '容量市場応札試算（蓄電池・OCCTO実データ連携）',
  description:
    '容量市場メインオークションの応札価格を全国エリアの約定実績（OCCTO 公表値 / data.eic-jp.org）から推定。推奨応札レンジ + 落札確率 + 想定収入を即時試算。区分非依存を正しく反映。無料・登録不要。',
  alternates: { canonical: '/tools/capacity-market-bid' },
  openGraph: {
    title: '容量市場応札試算（蓄電池・OCCTO実データ連携）| 蓄電所ネット',
    description:
      '全国エリアの約定実績（OCCTO 公表値）から推奨応札価格 + 落札確率を試算。区分非依存（新設/既設/経過措置で同価格）を正しく反映。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─── live data 構築ヘルパー ──────────────────────────────────────────────────
type EicJson = EicSeries;

function valueAtDate(data: EicJson, isoDate: string): number | null {
  const pt = data.points?.find((p) => p.date === isoDate);
  return pt?.value ?? null;
}

// ★Cm1: FY_DATES の焼き込みを撤去。走査する年度は取得済み系列の観測日から導出する。
//   焼き込んだままだと FY2030（2026年度メインオークション）が catalog に着地しても
//   グラフにも件数にも入らず、表示は壊れないので気付けない。

const PRICE_BY_AREA: Record<Area, EicJson> = {
  hokkaido: priceHokkaidoData as EicJson,
  tohoku:   priceTohokuData   as EicJson,
  tokyo:    priceTokyoData    as EicJson,
  chubu:    priceChubuData    as EicJson,
  hokuriku: priceHokurikuData as EicJson,
  kansai:   priceKansaiData   as EicJson,
  chugoku:  priceChugokuData  as EicJson,
  shikoku:  priceShikokuData  as EicJson,
  kyushu:   priceKyushuData   as EicJson,
};

const VOLUME_BY_AREA: Record<Area, EicJson> = {
  hokkaido: volumeHokkaidoData  as EicJson,
  tohoku:   volumeTohokuData    as EicJson,
  tokyo:    volumeTokyoData     as EicJson,
  chubu:    volumeChubuData     as EicJson,
  hokuriku: volumeHokurikuData  as EicJson,
  kansai:   volumeKansaiData    as EicJson,
  chugoku:  volumeChugokuData   as EicJson,
  shikoku:  volumeShikokuData   as EicJson,
  kyushu:   volumeKyushuData    as EicJson,
};

const LIVE_AREAS: Area[] = ['hokkaido','tohoku','tokyo','chubu','hokuriku','kansai','chugoku','shikoku','kyushu'];

/** 実データ CapacityMarketRecord[] を構築（フォールバック: 空配列） */
function buildLiveHistory(): CapacityMarketRecord[] {
  const records: CapacityMarketRecord[] = [];
  // 走査対象の年度開始日は price 系列の観測日から導出（新年度が着地すれば自動で増える）
  const dates = unionObservedDates(LIVE_AREAS.map((a) => PRICE_BY_AREA[a]));
  for (const area of LIVE_AREAS) {
    for (const date of dates) {
      const fy = fiscalYearOf(date);
      if (fy === null) continue;
      const price = valueAtDate(PRICE_BY_AREA[area], date);
      const volumeKw = valueAtDate(VOLUME_BY_AREA[area], date);
      if (price !== null && volumeKw !== null) {
        records.push({
          fiscal_year: fy,
          area,
          category: 'existing', // OCCTO 約定価格は区分非依存、ダミー値
          clearing_price_yen_per_kw_year: price,
          cleared_capacity_mw: volumeKw / 1000, // kW → MW
        });
      }
    }
  }
  return records;
}

export default function CapacityMarketBidPage() {
  // live data 構築（prebuild 生成 JSON → CapacityMarketRecord[]）
  const liveHistory = buildLiveHistory();
  const isLive = liveHistory.length > 0;

  // ★Cm1: 年度レンジ・年度数・件数・エリア数を catalog coverage / 系列データから導出（焼き込みなし）
  const cov = summarizeAreaSeries(LIVE_AREAS.map((a) => PRICE_BY_AREA[a]));
  const rangeLabel = cov.rangeLabel ?? '実データ';       // 例 'FY2024-FY2029'
  const yearCount = cov.count;                            // 例 6
  const areaCount = cov.areaCount;                        // 例 9（欠けたら実数）
  const recordCount = liveHistory.length || cov.recordCount;
  const dataUpdatedAt = latestUpdatedAt(LIVE_AREAS.map((a) => PRICE_BY_AREA[a]));
  // 直近2年度のラベル（トレンド判定の説明用）
  const lastFy = cov.labelLast ? Number(cov.labelLast.replace('FY', '')) : null;
  const recentTwo = lastFy !== null && yearCount >= 2 ? `FY${lastFy - 1}-FY${lastFy}` : rangeLabel;
  // 上流異常（coverage と系列データの不一致・不変条件違反）は build ログに警告を出す
  if (cov.warnings.length > 0) {
    for (const w of cov.warnings) console.warn(`[capacity-market-bid] ${w}`);
  }

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '容量市場応札試算',
    alternateName: 'BESS Capacity Market Bid Estimator',
    description:
      '容量市場メインオークションの過去約定価格（全国エリア、OCCTO 公表値ベース）から推奨応札価格 + 落札確率 + 想定収入を推定するブラウザ完結ツール。区分非依存を正しく反映。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    url: 'https://bess-net.jp/tools/capacity-market-bid',
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    featureList: [
      '全国エリアの約定実データ（OCCTO 公表値、data.eic-jp.org 連携）',
      '区分非依存の正しい反映（新設/既設/経過措置で同価格）',
      '推奨応札価格レンジ (下限/中央/上限)',
      '価格帯別 落札確率近似',
      'トレンド判定 (上昇/横ばい/下落)',
      '想定収入 (億円/年) 試算',
      '年度別 SVG チャート',
      'CSV エクスポート (応札戦略メモ)',
      '入力条件付き URL 共有',
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: 'https://bess-net.jp/tools' },
      {
        '@type': 'ListItem',
        position: 3,
        name: '容量市場応札試算',
        item: 'https://bess-net.jp/tools/capacity-market-bid',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        {/* Tier 2/3 UI 統一: max-w 1320 */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 容量市場応札試算
          </p>
          <div className="section-label">OCCTO 実データ連携 · 無料・登録不要</div>
          <h1 className="section-title">容量市場応札試算（OCCTO実データ連携・無料）</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            容量市場メインオークションの応札価格を、<strong>{areaCount} エリア × {rangeLabel}（{yearCount} 年度・{recordCount} 件）</strong>の
            OCCTO 公表実績から推定。<strong>推奨応札レンジ (下限/中央/上限)</strong>{' '}
            と <strong>落札確率 + 想定収入</strong> を即時試算。無料・登録不要ツール。
          </p>
          <p
            className="page-meta"
            style={{
              marginTop: 0,
              marginBottom: 24,
              paddingTop: 0,
              borderTop: 'none',
              fontSize: 15,
              color: 'var(--color-muted)',
            }}
          >
            {isLive
              ? <>データ出典: <strong>data.eic-jp.org 容量市場メインオークション約定価格（OCCTO 公表値ベース、{rangeLabel}）</strong>。
                <strong>OCCTO 約定価格は区分非依存</strong>（同一エリアでは新設/既設/経過措置で同価格）を正しく反映。</>
              : <>⚠️ precompute データ未生成のためモック表示中。<code>npm run precompute-eic-data</code> を実行後に再ビルドしてください。</>
            }
          </p>

          <CapacityMarketBidEstimator initialHistory={liveHistory} />

          {/* 試算ロジック説明 */}
          <section
            style={{
              marginTop: 40,
              padding: 20,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              試算ロジック
            </h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8 }}>
              <li>
                <strong>過去平均算出</strong>: 当該エリア（区分非依存）の {rangeLabel} 約定価格を、落札容量 (MW) で加重平均
              </li>
              <li>
                <strong>推奨応札レンジ</strong>: 下限 = max(自社コスト, 過去平均×0.8) / 中央 = 過去平均 / 上限 = 過去平均×1.3
              </li>
              <li>
                <strong>落札確率近似</strong>: 過去平均との価格比から線形補間 (×0.8 → 95% / ×1.0 → 65% / ×1.3 → 25%)
              </li>
              <li>
                <strong>トレンド判定</strong>: 直近 2 年（{recentTwo}）比較で価格変動 ±5% 内 → 横ばい、それ以上 → 上昇/下落
              </li>
              <li>
                <strong>想定収入</strong>: 応札容量 (MW) × 1000 (kW) × 推奨中央応札価格 (円/kW/年) ÷ 10⁸ (億円換算)
              </li>
            </ul>
            <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 12, marginBottom: 0 }}>
              <strong>警告ロジック</strong>: 自社コストが過去平均×1.5 超 → 採算性要確認、データ 2 件未満 → 信頼性注意。
              出典: data.eic-jp.org / OCCTO 公表値。
            </p>
          </section>

          {/* 容量市場 基礎解説 */}
          <section
            style={{
              marginTop: 24,
              padding: 20,
              background: 'var(--color-bg-card, #fff)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              容量市場 基礎解説
            </h2>
            <dl style={{ fontSize: 15, lineHeight: 1.7 }}>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>容量市場 (Capacity Market)</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                OCCTO が運営する電力供給能力 (kW 価値) の取引市場。発電事業者は将来 4 年後の供給力を応札し、
                落札時は容量提供義務 (リクワイアメント) と引き換えに対価を得る。蓄電所も対象電源として参加可。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>メインオークション</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                毎年実施、4 年後実需要を対象。区分は新設/既設/経過措置。本ツールはメインオークションを対象。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>長期脱炭素オークション (LTDC)</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                メインオークションとは別に、脱炭素電源 (再エネ・原子力・蓄電池) 向けに 20 年契約を提供。
                本ツールでは対象外 (別途試算を予定)。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>区分</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                <strong>新設電源</strong>: 4 年後新規運開予定の電源。価格は既設より高め。<br />
                <strong>既設電源</strong>: 運転中の電源。容量市場の主流、毎年応札。<br />
                <strong>経過措置電源</strong>: 制度導入時の暫定区分、~2028 年度に新設・既設へ統合予定。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>2025 年度の特徴</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                既設価格が前年比 25-30% 下落 (東京 8,500→8,000 円/kW/年 等)。電源充実化と上限価格 (ネット CONE)
                引き下げの影響。AT のデフォルト値もこの実勢を反映。
              </dd>
            </dl>
          </section>

          {/* 実データ連携完了 + 将来拡張予告 */}
          <section
            style={{
              marginTop: 24,
              padding: 20,
              background: '#e8f5e9',
              border: '2px solid #2e7d32',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12, color: '#2e7d32' }}>
              ✅ data.eic-jp.org 実データ連携
              {dataUpdatedAt ? `（データ更新: ${dataUpdatedAt.slice(0, 10)}）` : ''}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, marginTop: 0 }}>
              容量市場メインオークション約定価格（OCCTO 公表値ベース）を{' '}
              <a href="https://data.eic-jp.org" target="_blank" rel="noopener noreferrer"
                style={{ color: '#2e7d32', fontWeight: 600 }}>data.eic-jp.org</a>{' '}
              （{siteConfig.organization.name} 運営）から連携。v6.3 統合エコシステム双方向連携の本格実装。
            </p>
            <ul style={{ fontSize: 15, lineHeight: 1.8 }}>
              <li>✅ 過去約定価格 → OCCTO 公表値の実データ（{rangeLabel}、{areaCount} エリア）</li>
              <li>✅ 区分非依存を正しく反映（新設/既設/経過措置で同価格）</li>
              <li>✅ 収録年度 → {yearCount} 年度（{rangeLabel}）</li>
              <li>📅 将来拡張: LTDC（長期脱炭素オークション）との併用シナリオ</li>
              <li>📅 将来拡張: 追加オークション結果の追加（Phase D 第2-3期）</li>
            </ul>
            <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 12, marginBottom: 0 }}>
              出典: OCCTO 容量市場メインオークション約定結果 / data.eic-jp.org catalog。
              連携開始 2026-05-29（記録）。年度レンジ・年度数・件数は catalog の coverage
              （無い場合は系列データの観測日）から導出しており、新年度の着地で自動更新されます。
              {dataUpdatedAt ? `系列データの更新: ${dataUpdatedAt.slice(0, 10)}。` : ''}
              catalog 自動更新対応（revalidate 86400）。
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
