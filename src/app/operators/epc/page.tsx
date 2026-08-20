// /operators/epc — 蓄電池EPC一覧（Op4③・2026-08-20）
// makers/aggregators の器（OperatorCategoryList）を流用。
// データは precompute（operators-category-index.json）のみ＝runtime fetch 0（鉄則 #2/#3）。
// 規律: 実数title（誇張なし）・掲載案件数降順→五十音・「ランキング」不使用・
//       網羅非保証の1文（OperatorCategoryList 冒頭）・広告枠なし。
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

const CATEGORY = 'EPC';

const ROWS: CategoryRow[] = sortCategoryRows(
  (categoryIndex as Array<CategoryRow & { category: string[] }>).filter((o) =>
    o.category.includes(CATEGORY)
  )
);

// 件数は焼き込まず実データから（CLAUDE.md 受け入れ基準）
const TITLE = `蓄電池EPC一覧 ── 掲載${ROWS.length}社`;
const DESCRIPTION = `系統用蓄電池（BESS）のEPC（設計・調達・建設）${ROWS.length}社を一覧掲載。各社の掲載案件数・関与件数（EPC・機器供給等）から詳細ページへ。蓄電所ネットのニュース・プロジェクトDBに登場した事業者を編集部がカテゴリ整理しています。`;

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/operators/epc' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
};

export default function EpcPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '事業者ナビ', item: 'https://bess-net.jp/operators' },
      { '@type': 'ListItem', position: 3, name: '蓄電池EPC一覧', item: 'https://bess-net.jp/operators/epc' },
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
            <Link href="/operators">事業者ナビ</Link> / 蓄電池EPC一覧
          </p>
          <h1 className="section-title">蓄電池EPC一覧</h1>
          <p className="section-description">
            系統用蓄電池（BESS）のEPC（設計・調達・建設）{ROWS.length}社。EPCは発注者から蓄電所の建設を請け負う立場のため、プロジェクトDBの事業者欄（保有・開発）には登場しない場合があります。EPC・機器供給などの関与が一次情報から特定できた場合は関与件数に表示されます。
          </p>
          <OperatorCategoryList rows={ROWS} />
          <p className="grid-source-note" style={{ marginTop: 16 }}>
            <Link href="/operators/makers">系統用蓄電池メーカー一覧</Link>
            {' / '}
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
