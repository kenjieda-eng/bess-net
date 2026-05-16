/**
 * /tools/capacity-market-bid — 容量市場応札試算 (依頼AT モック版)
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2: SSR 外部 API 0 (静的モックデータ)
 *   - 鉄則 #3: 単一 URL、動的ルートなし
 *   - 鉄則 #4: ピーク負荷 0 req/分
 *
 * AU 連携 (5/29):
 *   - データソース抽象化済 (src/lib/capacity-market-data.ts)
 *   - AU 公開後は getHistory() のみ実装差し替え、UI/lib は変更なし
 *
 * 編集方針 (モック版):
 *   - 警告バナー明示必須 (本ツールはモック版、5/29 精度UP予定)
 *   - 応札判断は OCCTO 公式・電気事業法を必ず確認
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CapacityMarketBidEstimator from '@/components/CapacityMarketBidEstimator';
import { siteConfig } from '@/lib/site-config';
import { HISTORY } from '@/data/capacity-market-history';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '容量市場応札試算 (業界唯一、5/29 精度UP予定)',
  description:
    '容量市場メインオークションの応札価格を 9 エリア × 区分別過去実績から推定。推奨応札レンジ + 落札確率 + 想定収入を即時試算。業界唯一の無料ツール、モック版 (AU 連携で精度UP予定)。',
  alternates: { canonical: '/tools/capacity-market-bid' },
  openGraph: {
    title: '容量市場応札試算 (業界唯一・無料・モック版)',
    description:
      '9 エリア × 新設/既設/経過措置 の過去 2 年実績から推奨応札価格 + 落札確率を試算。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function CapacityMarketBidPage() {
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '容量市場応札試算',
    alternateName: 'BESS Capacity Market Bid Estimator',
    description:
      '容量市場メインオークションの過去約定価格 (9 エリア × 区分別) から推奨応札価格 + 落札確率 + 想定収入を推定するブラウザ完結ツール。',
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
      '9 エリア × 3 区分 (新設/既設/経過措置) の過去 2 年実績',
      '推奨応札価格レンジ (下限/中央/上限)',
      '価格帯別 落札確率近似',
      'トレンド判定 (上昇/横ばい/下落)',
      '想定収入 (億円/年) 試算',
      '過去 2 年 SVG チャート',
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
          <div className="section-label">業界唯一 · モック版 · 5/29 精度UP予定</div>
          <h1 className="section-title">容量市場応札試算</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            容量市場メインオークションの応札価格を、<strong>9 エリア × 3 区分 (新設/既設/経過措置)</strong>{' '}
            の過去 {HISTORY.length} 件実績から推定。<strong>推奨応札レンジ (下限/中央/上限)</strong>{' '}
            と <strong>落札確率 + 想定収入</strong> を即時試算。業界唯一の無料・登録不要ツール。
          </p>
          <p
            className="page-meta"
            style={{
              marginTop: 0,
              marginBottom: 24,
              paddingTop: 0,
              borderTop: 'none',
              fontSize: 13,
              color: 'var(--color-muted)',
            }}
          >
            ※ 現在モック版 (OCCTO 2024-2025 年度約定結果ベース業界予測値)。<strong>AU 容量市場約定価格DB (5/29 公開予定)</strong>{' '}
            と連動後、microCMS から実値取得・精度大幅UPの予定。データソース抽象化済のため UI 変更なしで切替えます。
          </p>

          <CapacityMarketBidEstimator />

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
            <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
              <li>
                <strong>過去平均算出</strong>: 当該エリア・区分の 2024-2025 年度約定価格を、落札容量 (MW) で加重平均
              </li>
              <li>
                <strong>推奨応札レンジ</strong>: 下限 = max(自社コスト, 過去平均×0.8) / 中央 = 過去平均 / 上限 = 過去平均×1.3
              </li>
              <li>
                <strong>落札確率近似</strong>: 過去平均との価格比から線形補間 (×0.8 → 95% / ×1.0 → 65% / ×1.3 → 25%)
              </li>
              <li>
                <strong>トレンド判定</strong>: 直近 2 年比較で価格変動 ±5% 内 → 横ばい、それ以上 → 上昇/下落
              </li>
              <li>
                <strong>想定収入</strong>: 応札容量 (MW) × 1000 (kW) × 推奨中央応札価格 (円/kW/年) ÷ 10⁸ (億円換算)
              </li>
            </ul>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 12, marginBottom: 0 }}>
              <strong>警告ロジック</strong>: 自社コストが過去平均×1.5 超 → 採算性要確認、2027 年度以降 → 不確実性大、モック版 disclaimer 常時表示。
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
            <dl style={{ fontSize: 14, lineHeight: 1.7 }}>
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

          {/* AU 連携予告 */}
          <section
            style={{
              marginTop: 24,
              padding: 20,
              background: '#e8f4ff',
              border: '2px solid #0066cc',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12, color: '#0066cc' }}>
              AU 容量市場約定価格DB 連携予定 (5/29)
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, marginTop: 0 }}>
              本ツールは現在モック版ですが、業界唯一の独立 DB として「AU 容量市場約定価格DB」を 5/29 公開予定。
              連携後、本ツールは以下が大幅 UP:
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
              <li>過去約定価格 → OCCTO 公表値の正確な反映 (現モック値からの差し替え)</li>
              <li>履歴 → 2 年から 3-5 年に拡大 (より長期トレンド判定可能)</li>
              <li>応札容量分布 → 過去応札パターン分析で落札確率推定精度UP</li>
              <li>LTDC (長期脱炭素オークション) との併用シナリオ追加</li>
            </ul>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 12, marginBottom: 0 }}>
              ※ データソース抽象化済 (<code>src/lib/capacity-market-data.ts</code>) のため、AU 公開時の作業は最小化。
              UI / 試算ロジック / テストは無変更で実値ベースに切替可能。
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
