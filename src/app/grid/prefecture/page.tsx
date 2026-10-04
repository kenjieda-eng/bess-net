// /grid/prefecture — 都道府県インデックス（v25）
// 全都道府県を件数の多い順にリスト表示。
import type { Metadata } from 'next';
import { AREA_META } from '../[slug]/area-meta';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import substationsIndex from '@/data/substations/index.json';
import { KANSAI_PREFECTURES } from '@/lib/grid-prefecture';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

// Ck2f ■3（2026-10-04）: 県別の件数と関西の件数は /grid・県ページと同じ index.json の summary から（凍結除外・#121）。
// 以前は runtime に microCMS の inventory（約 84 リクエスト・凍結込み）を数えており、静岡県が一覧 252・県ページ 251 と食い違っていた。
const SUMMARY = (substationsIndex as unknown as {
  summary: { by_prefecture: Record<string, number>; by_area_slug: Record<string, number> };
}).summary;

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）
  title: '都道府県別 変電所一覧｜蓄電池 系統空き容量DB',
  description:
    '全国10送配電事業者の変電所を都道府県別に一覧。各都道府県の件数・空容量・N-1電制適用可否を一画面で。蓄電所連系検討の地域絞り込みに。',
  alternates: { canonical: '/grid/prefecture' },
  openGraph: {
    title: '都道府県別 変電所一覧｜蓄電池 系統空き容量DB',
    description: `全国${Object.keys(AREA_META).length}社・都道府県別の変電所件数を一覧表示`,
    type: 'website',
  },
};

export default function PrefectureIndexPage() {
  // 件数の多い順。同数は県名で決める（並びを取得順に依存させない・#124）
  const sorted = Object.entries(SUMMARY.by_prefecture).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'));
  const total = sorted.reduce((acc, [, n]) => acc + n, 0);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: '系統空き容量',
        item: 'https://bess-net.jp/grid',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: '都道府県別',
        item: 'https://bess-net.jp/grid/prefecture',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/grid">系統空き容量</Link> / 都道府県別
          </p>

          <h1 className="page-title">都道府県別 変電所一覧</h1>
          <p className="page-lead">
            データのある {sorted.length} 都道府県・合計 {total.toLocaleString()}{' '}
            変電所を一覧表示。各都道府県をクリックすると該当変電所の一覧へ遷移します。
          </p>

          {/* Gr10(2026-08-11): 掲載が無い府県について、無いことを黙らずに理由を書く。
              関西電力送配電の公表データには変電所の府県の記載がないため個別ページを作れない。*/}
          <p className="grid-source-note" style={{ margin: '-8px 0 16px' }}>
            {Array.from(KANSAI_PREFECTURES).join('・')}
            は、関西電力送配電の公表データに変電所の府県の記載がないため個別ページがありません。{' '}
            <Link href="/grid/kansai">関西エリアの一覧（変電所{(SUMMARY.by_area_slug.kansai ?? 0).toLocaleString('en-US')}件）へ</Link>
          </p>

          <section className="grid-section">
            <h2 className="grid-section-h2">都道府県一覧（件数の多い順）</h2>
            <ul className="grid-prefecture-grid">
              {sorted.map(([pref, count]) => (
                <li key={pref} className="grid-prefecture-cell">
                  <Link
                    href={`/grid/prefecture/${encodeURIComponent(pref)}`}
                    className="grid-prefecture-link"
                  >
                    <strong>{pref}</strong>
                    <span className="grid-prefecture-count">
                      {count.toLocaleString()} 件
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="grid-source-note">
            データソース: {siteConfig.organization.name}{' '}
            編集部が、10送配電事業者の公開情報を整理。地区を跨ぐ変電所は最初にマッチした都道府県を採用。
          </p>

          <p className="back-link">
            <Link href="/grid">← 系統空き容量データベースへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
