// /operators/aggregators — 蓄電池アグリゲーター一覧（Op4②・2026-08-12）
// 狙いのクエリ: 「アグリゲーター一覧」140/月。
// データは precompute（operators-category-index.json）のみ＝runtime fetch 0（鉄則 #2/#3）。
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

const CATEGORY = 'アグリゲーター';

const ROWS: CategoryRow[] = sortCategoryRows(
  (categoryIndex as Array<CategoryRow & { category: string[] }>).filter((o) =>
    o.category.includes(CATEGORY)
  )
);
const TOTAL_PROJECTS = ROWS.reduce((a, r) => a + r.projects, 0);

// 件数は焼き込まず実データから（CLAUDE.md 受け入れ基準）
const TITLE = `蓄電池アグリゲーター一覧 ── 掲載${ROWS.length}社・案件${TOTAL_PROJECTS}件`;
const DESCRIPTION = `蓄電池・系統用蓄電池のアグリゲーター（特定卸供給事業者等）${ROWS.length}社を一覧掲載。掲載案件数の多い順に、各社の保有・開発案件${TOTAL_PROJECTS}件と関与実績から詳細ページへ。蓄電所ネットのニュース・プロジェクトDBに登場した事業者を編集部がカテゴリ整理しています。`;

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/operators/aggregators' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
};

export default function AggregatorsPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '事業者ナビ', item: 'https://bess-net.jp/operators' },
      { '@type': 'ListItem', position: 3, name: '蓄電池アグリゲーター一覧', item: 'https://bess-net.jp/operators/aggregators' },
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
            <Link href="/operators">事業者ナビ</Link> / 蓄電池アグリゲーター一覧
          </p>
          <h1 className="section-title">蓄電池アグリゲーター一覧</h1>
          <p className="section-description">
            蓄電池・低圧リソースのアグリゲーター（特定卸供給事業者等）{ROWS.length}社。掲載案件数（保有・開発）の多い順に並べています。需給調整市場・VPPでの運用を委ねる相手を探す際の出発点としてご利用ください。
          </p>
          <OperatorCategoryList rows={ROWS} />
          <p className="grid-source-note" style={{ marginTop: 16 }}>
            <Link href="/operators/makers">系統用蓄電池メーカー一覧</Link>
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
