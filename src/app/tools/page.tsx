/**
 * /tools — ツール一覧 HUB ページ
 *
 * 現在: IRR シミュレーター (依頼AM)
 * 将来: 補助金マッチ、系統連系チェック等のツールを追加予定
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ツール一覧 — 蓄電所事業の実務ツール',
  description:
    '系統用蓄電池プロジェクトの IRR シミュレーター等、業界事業者向けの実務ツールを無料・登録不要で提供。',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'ツール一覧 — 蓄電所事業の実務ツール',
    description: '蓄電池IRRシミュレーター等、業界事業者向けの実務ツール集',
    type: 'website',
  },
};

const tools = [
  {
    slug: 'balancing-revenue',
    title: '需給調整 収益シナリオ（蓄電池）',
    badge: '業界唯一',
    available: true,
    description:
      '需給調整市場 6 商品（一次〜三次②・複合）の蓄電池落札単価（EPRX 実績）に落札率・容量を掛けた概算年間収益を試算。前提次第で大きく変わる感応度ツール（L-EIC-018）。Phase 2 で実落札量対応予定。',
  },
  {
    slug: 'fire-risk-check',
    title: '蓄電池火災リスク自己診断',
    badge: '業界唯一・教育型',
    available: true,
    description:
      'UL9540A / NFPA 855 / 消防法 観点で 25 問セルフチェック。セル選定・PCS・建屋・運用・緊急対応の 5 カテゴリで総合スコア + 優先改善 Top 5 を即時算出。',
  },
  {
    slug: 'capacity-market-bid',
    title: '容量市場応札試算',
    badge: '業界唯一・モック版',
    available: true,
    description:
      '容量市場メインオークションの応札価格を 9 エリア × 区分別過去実績から推定。推奨応札レンジ + 落札確率 + 想定収入を即時試算。5/29 AU 公開時に精度大幅UP予定。',
  },
  {
    slug: 'irr-simulator',
    title: '蓄電池IRRシミュレーター',
    badge: '業界唯一',
    available: true,
    description:
      '系統用蓄電池プロジェクトの IRR・NPV・ペイバック期間を業界標準ロジックで無料試算。3 シナリオ (楽観/標準/悲観) 並列計算、感応度分析、CSV エクスポート対応。',
  },
  {
    slug: 'subsidy-match',
    title: '蓄電池補助金マッチング',
    badge: '業界唯一',
    available: true,
    description:
      '所在地・用途・容量・事業者種別で 50 件の補助金から Top 10 を即時マッチング。SII・自治体・民間ローン横断、スコアリング型で透明性も担保。CSV エクスポート / URL 共有対応。',
  },
  {
    slug: 'grid-connection-check',
    title: '系統連系診断',
    badge: '業界唯一',
    available: true,
    description:
      '日本全国 8,225 変電所の公表データから、希望地点・出力に最適な連系候補を Top 5 即時抽出。haversine 距離計算 + 空き容量・N-1 電制・出力制御リスクの総合スコアリング。CSV エクスポート / URL 共有対応。',
  },
];

export default function ToolsHubPage() {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'ツール一覧',
    description: '蓄電所事業の実務ツール集',
    url: 'https://bess-net.jp/tools',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        {/* Tier 2/3 UI 統一: max-w 1320 (L-JEPX-UI-002) */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / ツール
          </p>
          <div className="section-label">Tools — 実務ツール</div>
          <h1 className="section-title">ツール一覧</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 32, lineHeight: 1.7 }}>
            系統用蓄電池プロジェクトの事業性検討・補助金マッチング等、業界事業者向けの
            <strong>実務ツール</strong> を無料・登録不要で提供します。すべてブラウザ完結、データ送信なし。
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {tools.map((t) => {
              const card = (
                <div
                  style={{
                    padding: 20,
                    background: 'var(--color-bg-card, #fff)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    opacity: t.available ? 1 : 0.6,
                    cursor: t.available ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    height: '100%',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 4,
                      background: t.available ? 'var(--color-accent, #0066cc)' : '#888',
                      color: '#fff',
                      marginBottom: 10,
                    }}
                  >
                    {t.badge}
                  </span>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      marginTop: 0,
                      marginBottom: 8,
                    }}
                  >
                    {t.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--color-text)',
                      margin: 0,
                    }}
                  >
                    {t.description}
                  </p>
                  {t.available && (
                    <p
                      style={{
                        marginTop: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-accent, #0066cc)',
                      }}
                    >
                      使ってみる →
                    </p>
                  )}
                </div>
              );
              return t.available ? (
                <Link key={t.slug} href={`/tools/${t.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {card}
                </Link>
              ) : (
                <div key={t.slug}>{card}</div>
              );
            })}
          </div>

          <section
            style={{
              padding: 16,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--color-muted)',
            }}
          >
            <p style={{ margin: 0 }}>
              ※ ツール群は Sprint 3 以降で順次拡充予定。リクエストは{' '}
              <a
                href={siteConfig.organization.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                編集部
              </a>{' '}
              までお気軽にどうぞ。
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
