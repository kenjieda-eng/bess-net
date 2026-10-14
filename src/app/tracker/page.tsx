/**
 * /tracker — トラッカーハブ (依頼BF、4種類の業界トラッカー入口)
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '蓄電池業界トラッカー（補助金 × 系統 × 事業者 × 案件）',
  description: '蓄電所事業の最新動向を 4 軸 (補助金/系統空き容量/事業者/プロジェクト) でタイムライン表示。当サイト独自の更新トラッカー、無料公開・登録不要。',
  alternates: { canonical: '/tracker' },
  openGraph: {
    title: '蓄電池業界トラッカー（補助金 × 系統 × 事業者 × 案件）',
    description: '4軸タイムラインで蓄電所事業の最新動向を一望',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const TRACKERS = [
  {
    href: '/tracker/subsidy',
    title: '補助金トラッカー',
    desc: '蓄電池関連の補助金・公募情報の最新更新タイムライン',
    label: 'BF-1',
  },
  {
    href: '/tracker/grid',
    title: '系統トラッカー',
    desc: '変電所空き容量データの更新タイムライン (8,200+ 件)',
    label: 'BF-2',
  },
  {
    href: '/tracker/ag',
    title: '事業者トラッカー',
    desc: '事業者ナビ (540+社) の追加/更新タイムライン',
    label: 'BF-3',
  },
  {
    href: '/tracker/pf',
    title: 'プロジェクトトラッカー',
    desc: 'プロジェクトDB の追加/更新タイムライン',
    label: 'BF-4',
  },
];

export default function TrackerHubPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '業界トラッカーハブ',
    description: '蓄電所事業の最新動向を 4 軸でタイムライン化',
    numberOfItems: TRACKERS.length,
    itemListElement: TRACKERS.map((t, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: t.title,
      description: t.desc,
      url: `https://bess-net.jp${t.href}`,
    })),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '業界トラッカー', item: 'https://bess-net.jp/tracker' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 業界トラッカー
          </p>
          <div className="section-label">当サイト独自 · 更新タイムライン</div>
          <h1 className="section-title">業界トラッカー</h1>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            蓄電所事業の最新動向を <strong>4 軸</strong>(補助金 / 系統空き容量 / 事業者 / プロジェクト)
            でタイムライン表示。情報源は当サイトの全エントリで、定期更新を一覧。
            当サイト独自の更新トラッカー、無料公開・登録不要。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 24 }}>
            {TRACKERS.map((t) => (
              <Link key={t.href} href={t.href} style={{
                display: 'block', padding: 16,
                border: '1px solid var(--color-border)', borderRadius: 8,
                textDecoration: 'none', color: 'inherit', background: 'white',
              }}>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{t.title}</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: 'var(--color-text)' }}>{t.desc}</p>
                <div style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 8 }}>タイムラインを見る →</div>
              </Link>
            ))}
          </div>

          <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 24 }}>
            ※ 上の 4 つのトラッカーのデータは microCMS / 当サイト DB から取得。各ページは 1 時間ごとに更新。
          </p>

          {/* T8 実装便（2026-10-14）: 上の 4 軸（当サイトの更新タイムライン）とは別の種類＝制度の改定の一覧。見出しを分けて「4 軸」の文を保つ */}
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '32px 0 8px' }}>{'制度の改定'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16, marginTop: 12 }}>
            <Link href="/tracker/balancing-rules" style={{
              display: 'block', padding: 16,
              border: '1px solid var(--color-border)', borderRadius: 8,
              textDecoration: 'none', color: 'inherit', background: 'white',
            }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{'需給調整市場 制度変更トラッカー'}</div>
              <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: 'var(--color-text)' }}>
                {'上限価格・募集量・商品仕様・ガイドライン・蓄電池に関わる要件の改定のうち一次が取れたものを、公表日と適用日（実需給日）を分けて一次の逐語つきで並べた一覧（網羅ではありません）'}
              </p>
              <div style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 8 }}>改定の一覧を見る →</div>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
