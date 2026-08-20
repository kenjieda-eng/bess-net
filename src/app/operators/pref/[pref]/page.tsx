// /operators/pref/[pref] — 都道府県別 事業者一覧（Op4④・2026-08-20）
// データは precompute（operators-category-index.json）のみ＝runtime fetch 0（鉄則 #2/#3）。
// ★実データがある県のみ generateStaticParams で生成し、それ以外は 404（dynamicParams=false）。
//   非ASCII パラメータは「生値」を返す（#101: encodeURIComponent すると二重エンコードで全件404）。
//   「海外」「情報非公開」等の非県値はページ化しない（実在47都道府県のみ・#119 と同型の教訓）。
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import OperatorCategoryList, {
  sortCategoryRows,
  type CategoryRow,
} from '@/components/OperatorCategoryList';
import { siteConfig } from '@/lib/site-config';
import { REAL_PREFECTURES } from '@/lib/grid-prefecture';
import categoryIndex from '@/lib/generated/operators-category-index.json';

type IndexRow = CategoryRow & { category: string[]; prefecture: string | null };

const ALL = categoryIndex as IndexRow[];

function rowsForPref(pref: string): CategoryRow[] {
  if (!REAL_PREFECTURES.has(pref)) return [];
  return sortCategoryRows(ALL.filter((o) => o.prefecture === pref));
}

export const dynamicParams = false;

export function generateStaticParams() {
  // 実データがある実在都道府県のみ（生値・#101）
  const prefs = new Set<string>();
  for (const o of ALL) {
    if (o.prefecture && REAL_PREFECTURES.has(o.prefecture)) prefs.add(o.prefecture);
  }
  return [...prefs].map((pref) => ({ pref }));
}

export async function generateMetadata({
  params,
}: {
  params: { pref: string };
}): Promise<Metadata> {
  const pref = decodeURIComponent(params.pref);
  const rows = rowsForPref(pref);
  if (rows.length === 0) return {};
  const title = `${pref}の蓄電池関連事業者 ── 掲載${rows.length}社`;
  const description = `${pref}に本社を置く系統用蓄電池（BESS）・低圧リソース関連の事業者${rows.length}社を一覧掲載。各社の掲載案件数・関与件数から詳細ページへ。`;
  return {
    title,
    description,
    alternates: { canonical: `/operators/pref/${pref}` },
    openGraph: { title, description, type: 'website' },
  };
}

export default function OperatorPrefPage({ params }: { params: { pref: string } }) {
  const pref = decodeURIComponent(params.pref);
  const rows = rowsForPref(pref);
  if (rows.length === 0) notFound();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '事業者ナビ', item: 'https://bess-net.jp/operators' },
      { '@type': 'ListItem', position: 3, name: '都道府県別', item: 'https://bess-net.jp/operators/pref' },
      { '@type': 'ListItem', position: 4, name: `${pref}の蓄電池関連事業者`, item: `https://bess-net.jp/operators/pref/${encodeURIComponent(pref)}` },
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
            <Link href="/operators">事業者ナビ</Link> /{' '}
            <Link href="/operators/pref">都道府県別</Link> / {pref}
          </p>
          <h1 className="section-title">{pref}の蓄電池関連事業者</h1>
          <p className="section-description">
            {pref}に本社を置く、系統用蓄電池（BESS）・低圧リソース事業に関わる事業者{rows.length}社です。本社所在地は各社の公開情報にもとづきます。
          </p>
          <OperatorCategoryList rows={rows} />
          <p className="grid-source-note" style={{ marginTop: 16 }}>
            <Link href="/operators/pref">← 都道府県別インデックス</Link>
            {' / '}
            <Link href="/operators">事業者ナビ（カテゴリ・キーワード絞り込み）</Link>
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
