// /operators/makers — 系統用蓄電池メーカー一覧（Op4①・2026-08-12）
// 狙いのクエリ: 「系統用蓄電池メーカー」590/月 ／「蓄電池の会社」320/月。
// データは precompute（operators-category-index.json）のみ＝runtime fetch 0（鉄則 #2/#3）。
// ★title は「掲載◯社の案件実績」としない: 実測で電池メーカー31社は掲載案件0社
//   （機器供給側のため事業者欄に出ない）。実績を name に掲げるのは誇張になる。
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import OperatorCategoryList, {
  sortCategoryRows,
  type CategoryRow,
} from '@/components/OperatorCategoryList';
import { siteConfig } from '@/lib/site-config';
import categoryIndex from '@/lib/generated/operators-category-index.json';

const CATEGORY = '電池メーカー';

const ROWS: CategoryRow[] = sortCategoryRows(
  (categoryIndex as Array<CategoryRow & { category: string[] }>).filter((o) =>
    o.category.includes(CATEGORY)
  )
);

// 件数は焼き込まず実データから（CLAUDE.md 受け入れ基準）
const TITLE = `系統用蓄電池メーカー一覧 ── 掲載${ROWS.length}社`;
const DESCRIPTION = `系統用蓄電池（BESS）の電池メーカー${ROWS.length}社を一覧掲載。各社の掲載案件数・関与件数（EPC・機器供給等）から詳細ページへ。蓄電所ネットのニュース・プロジェクトDBに登場した事業者を編集部がカテゴリ整理しています。`;

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/operators/makers' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
};

export default function MakersPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '事業者ナビ', item: 'https://bess-net.jp/operators' },
      { '@type': 'ListItem', position: 3, name: '系統用蓄電池メーカー一覧', item: 'https://bess-net.jp/operators/makers' },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/operators">事業者ナビ</Link> / 系統用蓄電池メーカー一覧
          </p>
          <h1 className="section-title">系統用蓄電池メーカー一覧</h1>
          <p className="section-description">
            系統用蓄電池（BESS）の電池メーカー{ROWS.length}社。メーカーは機器の供給側のため、プロジェクトDBの事業者欄（保有・開発）には通常登場しません。EPC・機器供給などの関与が一次情報から特定できた場合のみ関与件数に表示されます。
          </p>
          <OperatorCategoryList rows={ROWS} />
          <p className="grid-source-note" style={{ marginTop: 16 }}>
            <Link href="/operators/aggregators">蓄電池アグリゲーター一覧</Link>
            {' / '}
            <Link href="/operators">← 事業者ナビ（全{(categoryIndex as unknown[]).length}社・カテゴリ絞り込み）</Link>
          </p>
          <p className="grid-source-note">
            データソース: {siteConfig.organization.name} 編集部
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
