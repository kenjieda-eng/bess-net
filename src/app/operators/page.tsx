// /operators 一覧ページ (Server Component)
// - microCMS から事業者全件取得（403件想定）
// - クライアントの OperatorBrowser でカテゴリタブ/検索/都道府県絞り/ページング

import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllOperators, getOperatorList } from '@/lib/microcms';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import OperatorBrowser from './OperatorBrowser';

export const revalidate = 600;

// 件数は totalCount 動的参照（title総仕上げ2026-07-15。+1req/600s・faq確立パターン #93）
export async function generateMetadata(): Promise<Metadata> {
  let n = 544;
  try {
    const r = await getOperatorList({ limit: 1, fields: 'id' });
    if (r.totalCount > 0) n = r.totalCount;
  } catch {
    // 縮退時はフォールバック値
  }
  return {
    title: `蓄電所事業者ナビ（全国${n}社）`,
    description:
      '系統用蓄電池(BESS)・低圧リソース事業に関わる主要事業者を 20カテゴリ・400社超で網羅。電池メーカー / PCS / EPC / O&M / 開発事業者 / アグリゲーター / 送配電 / 電力会社 / 商社 / 金融 / 法務 等から検索・絞り込み可能。',
    alternates: { canonical: '/operators' },
  };
}

export default async function OperatorListPage() {
  const items = await getAllOperators();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '蓄電所事業者ナビ',
    description:
      '系統用蓄電池(BESS)・低圧リソース事業に関わる主要事業者一覧',
    numberOfItems: items.length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 事業者ナビ
          </p>
          <div className="section-label">Operators</div>
          <h1 className="section-title">事業者ナビ</h1>
          <p className="section-description">
            系統用蓄電池(BESS)・低圧リソース事業に関わる主要事業者を 20カテゴリ・
            {items.length}社で網羅。カテゴリ・キーワード・都道府県で絞り込み可能です。
          </p>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>事業者情報はまだ準備中です。</p>
            </div>
          ) : (
            // 落とし穴 #92 対応: OperatorBrowser は useSearchParams を使わないため
            // Suspense 不要。全 operator を SSR 描画した上に client-side フィルタを重ねる（SEO維持）。
            <OperatorBrowser items={items} />
          )}

          <section style={{
            marginTop: 32, padding: 16,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)', borderRadius: 6,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連 (当サイト独自機能)</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/industry/top50">事業者ランキング Top50</Link> — 総蓄電容量（MWh）順の国内勢力図</li>
              <li><Link href="/map/industry-chaos">業界カオスマップ</Link> — 主要 50+ 社を 11 カテゴリで構造化</li>
              <li><Link href="/tracker/ag">事業者トラッカー</Link> — 事業者ナビの追加・更新タイムライン</li>
              <li><Link href="/industry">業界分析ハブ</Link> — 4機能を一覧</li>
            </ul>
          </section>

          <p className="back-link">
            <Link href="/">← トップへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
