/**
 * /map/industry-chaos — 業界カオスマップ (依頼AP、業界唯一性 +1)
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2: SSR 外部 API 0 (静的 industry-map データ)
 *   - 鉄則 #3: 単一 URL
 *   - 鉄則 #4: ピーク負荷 0 req/分
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import IndustryChaosMap from '@/components/IndustryChaosMap';
import { siteConfig } from '@/lib/site-config';
import { PLAYERS, RELATIONS, CATEGORY_LABELS } from '@/data/industry-map';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '業界カオスマップ (主要事業者 + 関係構造)',
  description: `蓄電所事業の業界構造を可視化。${PLAYERS.length} 社の主要プレイヤーを 11 カテゴリで整理 + ${RELATIONS.length} 件の関係 (出資/EPC/セル供給/オフテイク等) を表示。当サイト独自の構造マップ、無料公開。`,
  alternates: { canonical: '/map/industry-chaos' },
  openGraph: {
    title: '業界カオスマップ (蓄電所事業 主要事業者 + 関係構造)',
    description: '11 カテゴリの主要事業者 + 関係 30+ 件で業界構造を可視化',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function IndustryChaosMapPage() {
  // JSON-LD ItemList (主要事業者)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '蓄電所事業 業界カオスマップ',
    description: '業界主要事業者の構造マップ',
    numberOfItems: PLAYERS.length,
    itemListElement: PLAYERS.slice(0, 30).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: p.name,
      description: `${CATEGORY_LABELS[p.category]}${p.note ? ` — ${p.note}` : ''}`,
      url: p.operator_slug ? `https://bess-net.jp/operators/${p.operator_slug}` : undefined,
    })),
  };

  // JSON-LD Dataset (業界構造データ)
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '蓄電所事業 業界カオスマップ データセット',
    description: `日本の蓄電所事業の業界構造データセット。主要 ${PLAYERS.length} 社を11カテゴリで整理し、出資・EPC・セル供給・オフテイク等 ${RELATIONS.length} 件の企業間関係を構造化して無料公開している。`,
    keywords: ['蓄電所', 'BESS', '業界マップ', '構造可視化', 'カオスマップ'],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    url: 'https://bess-net.jp/map/industry-chaos',
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: '業界カオスマップ',
        item: 'https://bess-net.jp/map/industry-chaos',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 業界カオスマップ
          </p>
          <div className="section-label">当サイト独自 · 構造可視化</div>
          <h1 className="section-title">蓄電所事業 業界カオスマップ</h1>
          {/* Tier 2/3 UI 統一: 分類 D 視覚重視、コンテナは既存維持、解説のみ text-base lg:text-lg (L-JEPX-UI-006 最小修正) */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            蓄電所事業の<strong>業界構造を可視化</strong>。主要 {PLAYERS.length} 社を{' '}
            <strong>11 カテゴリ</strong> (デベロッパー / EPC / O&M / セル / システム / PCS / EMS / 電力 / 金融 / 土地 / コンサル)
            で整理 + <strong>{RELATIONS.length} 件の関係</strong> (出資/EPC/セル供給/オフテイク等) を表示。
            当サイト独自の構造マップ、無料公開・登録不要。
          </p>
          <p className="page-meta" style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 0, marginBottom: 24 }}>
            ※ 主要事業者を抽出した「業界構造可視化」用ビュー。完全網羅は{' '}
            <Link href="/operators">事業者ナビ (544 社)</Link> を参照。
            関係データは公開情報・業界既知の事実に基づき編集部が整理。
          </p>

          <IndustryChaosMap />

          <section
            style={{
              marginTop: 32,
              padding: 16,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
              関連
            </h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>
                <Link href="/operators">事業者ナビ (544 社、完全リスト)</Link>
              </li>
              <li>
                <Link href="/projects">プロジェクトデータベース</Link>
              </li>
              <li>
                <Link href="/explainer/grid-scale-bess">解説: 系統用蓄電池とは</Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
