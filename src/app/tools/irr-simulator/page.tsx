/**
 * /tools/irr-simulator — 蓄電池IRRシミュレーター (依頼AM)
 *
 * 設計:
 *   - 単一 URL、動的ルートなし → 落とし穴 #79 #98 とは無関係 (静的扱い)
 *   - microCMS リクエストなし → 落とし穴 #95 とは無関係 (client-side 計算)
 *   - revalidate = 86400 (24h、デフォルト値が変更されたら再生成)
 *   - JSON-LD SoftwareApplication schema で SEO リッチリザルト対応
 *   - URL params 連動は IRRSimulator (Client) 側で window.location ベース (落とし穴 #92)
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import IRRSimulator from '@/components/IRRSimulator';
import { siteConfig } from '@/lib/site-config';
// NREL ATB CAPEX + FX（build 時プリコンピュート済み JSON、鉄則 #2/#4 準拠）
import atbCapexBatteryData from '@/data/eic/atb-capex-battery.json';
import fxUsdJpyData from '@/data/eic/fx-usdjpy-monthly-avg.json';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  // layout.tsx titleTemplate `%s | 蓄電所ネット` で自動付与 (落とし穴 #86)
  title: '蓄電池IRRシミュレーター (無料・登録不要)',
  description:
    '系統用蓄電池プロジェクトのIRR・NPV・ペイバック期間を業界標準ロジックで無料試算。容量市場・需給調整市場・スポットアービトラージの3市場併用前提、3シナリオ(楽観/標準/悲観)並列計算、感応度分析、CSVエクスポート対応。',
  alternates: { canonical: '/tools/irr-simulator' },
  openGraph: {
    title: '蓄電池IRRシミュレーター (無料・登録不要)',
    description:
      '系統用蓄電池の事業性をIRR/NPV/ペイバックで試算。3シナリオ並列・感応度分析・CSV出力対応。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function IrrSimulatorPage() {
  // NREL ATB 蓄電池CAPEX 3シナリオ（build 時事前計算、L-EIC-013/015/055 準拠）
  type EicPoints = { points?: { date: string; value: number }[] };
  const capexPts = (atbCapexBatteryData as EicPoints).points ?? [];
  const fxPts    = (fxUsdJpyData        as EicPoints).points ?? [];
  const capexUsdPerKw  = capexPts.length ? capexPts[capexPts.length - 1].value : 2101;
  const fxJpyPerUsd    = fxPts.length    ? fxPts[fxPts.length - 1].value       : 158.34;
  const capexUsdPerKwh = capexUsdPerKw / 4;                                              // 4h 構成
  const midJpyPerKwh   = Math.round(capexUsdPerKwh * fxJpyPerUsd / 1000) * 1000;        // ≒ 83,000
  const lowJpyPerKwh   = Math.round(midJpyPerKwh * 0.80 / 100) * 100;                   // ≒ 66,400
  const highJpyPerKwh  = Math.round(midJpyPerKwh * 1.20 / 100) * 100;                   // ≒ 99,600
  const capexNrel = {
    low:  lowJpyPerKwh,
    mid:  midJpyPerKwh,
    high: highJpyPerKwh,
    fxJpyPerUsd:    Math.round(fxJpyPerUsd    * 100) / 100,
    capexUsdPerKwh: Math.round(capexUsdPerKwh * 100) / 100,
  };

  // JSON-LD SoftwareApplication (SEO リッチリザルト)
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '蓄電池IRRシミュレーター',
    alternateName: 'BESS IRR Simulator',
    description:
      '系統用蓄電池プロジェクトのIRR・NPV・ペイバック期間を業界標準ロジックで無料試算するブラウザ完結型ツール。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    aggregateRating: undefined, // 評価データなしのため省略
    url: 'https://bess-net.jp/tools/irr-simulator',
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    featureList: [
      '3 シナリオ並列計算 (楽観/標準/悲観)',
      'IRR/NPV/ペイバック期間 同時算出',
      '年次累積キャッシュフロー チャート',
      '感応度分析 (スポット価格 ±10%, 容量市場 ±10%)',
      'CSV エクスポート (Excel UTF-8 BOM 対応)',
      '入力条件付き URL 共有',
      'モバイル対応 (768px 以下レスポンシブ)',
    ],
  };

  // BreadcrumbList (リッチリザルト効果)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: 'https://bess-net.jp/tools' },
      {
        '@type': 'ListItem',
        position: 3,
        name: '蓄電池IRRシミュレーター',
        item: 'https://bess-net.jp/tools/irr-simulator',
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
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 蓄電池IRRシミュレーター
          </p>
          <div className="section-label">無料・登録不要 · ブラウザ完結</div>
          <h1 className="section-title">蓄電池IRRシミュレーター</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            系統用蓄電池プロジェクトの <strong>IRR・NPV・ペイバック期間</strong> を業界標準ロジックで無料試算。
            <strong>容量市場・需給調整市場・スポットアービトラージ</strong> の 3 市場併用前提で、
            <strong>楽観・標準・悲観</strong> の 3 シナリオを並列計算します。
            ブラウザ完結 (ログイン不要)、入力データはサーバー送信なし、CSV エクスポート対応。
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
            ※ デフォルト値は 2026年5月時点の業界平均値。容量市場 ¥8,000/kW/年 (2025年度オークション結果反映)、
            需給調整市場 ¥1,500/kW/月、JEPX スポット ¥9-23/kWh (2024年度実績) 等を採用。
            蓄電池CAPEXの参考値（Step 2）は NREL ATB 2024版（米国前提、mid=実データ）を USD/JPY {capexNrel.fxJpyPerUsd} で円換算。
            出典: JEPX/OCCTO/SII 公表資料、業界EPC公表値、NREL ATB (CC BY 4.0)。
            均等化原価で比べたい場合は <Link href="/tools/lcoe-lcos">LCOE・LCOS計算機</Link> もご利用ください。
          </p>

          <IRRSimulator capexNrel={capexNrel} />

          {/* 計算ロジック説明 */}
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
              計算ロジック・前提
            </h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8 }}>
              <li>
                <strong>収益モデル</strong>: アービトラージ (放電 - 充電 × 効率) + 容量市場 (固定対価)
                + 需給調整 (月額固定) の単純加算
              </li>
              <li>
                <strong>劣化</strong>: 年 1% 容量低下 (下限 70%)、アービトラージ収益にのみ影響
              </li>
              <li>
                <strong>IRR 計算</strong>: 二分法 (bisection)、収束精度 1e-6 億円
              </li>
              <li>
                <strong>NPV 計算</strong>: 割引率 5% (デフォルト)、20 年間 DCF
              </li>
              <li>
                <strong>ペイバック</strong>: 累積CFが補助金控除後の初期投資を上回る年 (線形補間)
              </li>
              <li>
                <strong>OPEX</strong>: 出力 (MW) × 単価 (円/MW/年) で算定
              </li>
              <li>
                <strong>補助金</strong>: 初期投資から %で控除 (CAPEX 補助、運用補助は対象外)
              </li>
            </ul>
            <p
              style={{
                fontSize: 15,
                color: 'var(--color-muted)',
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              <strong>制約・想定</strong>: 本シミュレーターは「全市場併用可能」前提の単純加算モデル。
              実事業ではマルチユース時間配分の trade-off (例: 容量市場入札時間中はアービトラージ充電不可)
              で収益が下振れする可能性があります。投資判断には EPC/コンサル含めた精緻シミュレーションが必須です。
            </p>
          </section>

          {/* 使い方 アコーディオン形式 (シンプル) */}
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
              使い方
            </h2>
            <ol style={{ fontSize: 15, lineHeight: 1.8 }}>
              <li>
                <strong>シナリオ選択</strong>: 編集したいシナリオ (楽観/標準/悲観) を選択
              </li>
              <li>
                <strong>Step 1</strong>: 設備情報 (容量・出力・効率・耐用年数等) — 3 シナリオ共通
              </li>
              <li>
                <strong>Step 2</strong>: 投資情報 (CAPEX・OPEX・補助金率) — シナリオ別
              </li>
              <li>
                <strong>Step 3</strong>: 市場前提 (スポット価格・容量市場・需給調整) — シナリオ別
              </li>
              <li>
                <strong>結果確認</strong>: 入力変更で即座に再計算、IRR/NPV/Payback を 3 シナリオ並列で表示
              </li>
              <li>
                <strong>共有 / 出力</strong>: URL 共有 (入力条件付き) or CSV エクスポート (Excel 対応)
              </li>
            </ol>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
