// Phase 4-pre: 中部地方 変電所空き容量マップ
// /grid/chubu/map — 中部電力PG 配下の緯度経度付き変電所を Leaflet 地図で可視化
// - SSR 非対応の Leaflet コンポーネントは next/dynamic で ssr:false で読み込む
// - データは getChubuSubstationsForMap で 100 件単位 list 取得
// - 落とし穴 #57 対応: /grid/[slug] と /grid/chubu/map はセグメント数が異なるため共存可
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getChubuSubstationsForMap } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

const ChubuMap = dynamic(() => import('@/components/ChubuMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 'clamp(400px, 70vh, 600px)',
        width: '100%',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
      }}
      aria-label="マップ初期化中"
    >
      <div style={{ textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺</div>
        <div style={{ fontSize: '14px' }}>マップを初期化中…</div>
        <div style={{ fontSize: '12px', marginTop: '4px', color: '#9ca3af' }}>
          1,081 箇所の変電所データを準備しています
        </div>
      </div>
    </div>
  ),
});

export const revalidate = 3600;

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）
  title: '中部地方 変電所空き容量マップ｜蓄電池 系統空き容量DB',
  description:
    '中部電力パワーグリッド管内の変電所を地図上で可視化。系統空き容量・N-1電制適用可否・出力制御の可能性を地理院タイル淡色地図に重ねて表示。蓄電所事業者の連系検討に。',
  alternates: { canonical: '/grid/chubu/map' },
  openGraph: {
    title: '中部地方 変電所空き容量マップ｜蓄電池 系統空き容量DB',
    description:
      '中部電力PG 管内の地図ベース系統情報。マーカー色で空容量・N-1電制可否を直感的に把握。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default async function ChubuMapPage() {
  const substations = await getChubuSubstationsForMap();

  // サマリ件数
  const cnt = substations.length;
  const cntPositive = substations.filter(
    (s) => (s.cap_avail_mw ?? 0) > 0
  ).length;
  const cntN1 = substations.filter((s) => s.n1_eligible).length;
  const cntGreen = substations.filter(
    (s) => (s.cap_avail_mw ?? 0) > 0 && s.n1_eligible
  ).length;

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'トップ',
        item: 'https://bess-net.jp/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '系統空き容量',
        item: 'https://bess-net.jp/grid',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: '中部エリア',
        item: 'https://bess-net.jp/grid/chubu',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'マップ',
        item: 'https://bess-net.jp/grid/chubu/map',
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '中部地方 変電所空き容量マップ',
    description: `中部電力PG 管内の${cnt}箇所の変電所を地図表示`,
    url: 'https://bess-net.jp/grid/chubu/map',
    numberOfItems: cnt,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/grid">系統空き容量</Link> /{' '}
            <Link href="/grid/chubu">中部エリア</Link> / マップ
          </p>

          <h1 className="page-title">中部地方 変電所空き容量マップ</h1>
          <p className="page-lead">
            中部電力パワーグリッド管内の <strong>{cnt}</strong>{' '}
            箇所の変電所を地図上で可視化。空容量プラス{' '}
            <strong>{cntPositive}</strong> 件、N-1電制適用可{' '}
            <strong>{cntN1}</strong> 件、両条件を満たす連系候補{' '}
            <strong>{cntGreen}</strong>{' '}
            件。地理院タイル（淡色地図）ベース。マーカーをクリックすると個別変電所ページに遷移します。
          </p>

          {/* 凡例 */}
          <section
            className="grid-section"
            aria-label="マーカー凡例"
            style={{ marginBottom: '12px' }}
          >
            <ul
              className="grid-map-legend"
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                margin: '12px 0',
                fontSize: '13px',
                listStyle: 'none',
                padding: 0,
              }}
            >
              <li>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    background: '#16a34a',
                    borderRadius: '50%',
                    verticalAlign: 'middle',
                    marginRight: '4px',
                  }}
                />
                空容量+ &amp; N-1可（連系候補）
              </li>
              <li>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    background: '#2563eb',
                    borderRadius: '50%',
                    verticalAlign: 'middle',
                    marginRight: '4px',
                  }}
                />
                空容量+
              </li>
              <li>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    background: '#ea580c',
                    borderRadius: '50%',
                    verticalAlign: 'middle',
                    marginRight: '4px',
                  }}
                />
                空容量0以下
              </li>
              <li>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    background: '#6b7280',
                    borderRadius: '50%',
                    verticalAlign: 'middle',
                    marginRight: '4px',
                  }}
                />
                データなし
              </li>
            </ul>
          </section>

          <ChubuMap substations={substations} />

          {/* 出典・注記 */}
          <section
            className="grid-section grid-source-section"
            style={{ marginTop: '16px' }}
          >
            <h2 className="grid-section-h2">出典・利用条件</h2>
            <p>
              本マップの変電所データは{' '}
              <strong>中部電力パワーグリッド</strong> が公開する{' '}
              <a
                href="https://gridmap.powergrid.chuden.co.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="grid-source-link"
              >
                系統予想潮流・空容量マッピング
              </a>{' '}
              の CSV / GeoJSON
              データを蓄電所ネット編集部で再構成したものです。最新情報・利用条件は中部電力PG
              の公式サイトでご確認ください。
            </p>
            <p>
              地図表示には{' '}
              <a
                href="https://maps.gsi.go.jp/development/ichiran.html"
                target="_blank"
                rel="noopener noreferrer"
                className="grid-source-link"
              >
                地理院タイル（淡色地図）
              </a>{' '}
              を利用しています。
            </p>
            <p className="grid-source-note">
              ※ 本マップは公開データを再構成したものであり、最終的な接続検討は
              中部電力PG への直接照会が必要です。
            </p>
          </section>

          <p className="back-link">
            <Link href="/grid/chubu">← 中部エリア統計に戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
