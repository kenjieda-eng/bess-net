// /glossary/[slug] 詳細ページ - patch_v12
// 用語集詳細の関連用語をCSV文字列表示から、リンク付きバッジ表示に修正
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedNewsList from '@/components/RelatedNewsList';
import RelatedExplainersList from '@/components/RelatedExplainersList';
import RelatedTermBadges from '@/components/RelatedTermBadges';

// /grid 系統空き容量データベースへの導線を表示する用語ページ slug 一覧（Phase 5 D-4）
const GRID_RELATED_GLOSSARY_SLUGS = new Set<string>([
  'curtailment',
  'distribution-substation',
  'ehv-substation',
  'extra-high-voltage',
  'extra-high-voltage-grid',
  'extra-hv-bess',
  'grid-available-capacity',
  'grid-interconnection',
  'grid-interconnection-code',
  'grid-interconnection-contract',
  'interconnection-line',
  'inter-regional-interconnection',
  'jeac-9701',
  'non-firm-connection',
  'non-firm-detail',
  'output-control',
  'point-of-interconnection',
  'substation',
  'substation-capacity',
  'substation-detail',
]);
import {
  getGlossaryBySlug,
  getAllGlossarySlugs,
  getNewsByTermId,
  getExplainersByTermName,
  getGlossaryLiteList,
} from '@/lib/microcms';
import { csvTermsToTermList } from '@/lib/term-linker';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return await getAllGlossarySlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const term = await getGlossaryBySlug(params.slug);
  if (!term) return {};
  return {
    title: `${term.term}｜用語集`,
    description: term.shortDef,
    alternates: { canonical: `/glossary/${term.slug}` },
    openGraph: {
      title: `${term.term}｜用語集`,
      description: term.shortDef,
      type: 'article',
    },
  };
}

export default async function GlossaryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const term = await getGlossaryBySlug(params.slug);
  if (!term) notFound();

  // 関連データを並列取得（用語マップ含む）
  const [relatedNews, relatedExplainers, glossaryLite] = await Promise.all([
    getNewsByTermId(term.id, 10).catch(() => []),
    getExplainersByTermName(term.term, 5).catch(() => []),
    getGlossaryLiteList().catch(() => []),
  ]);

  // CSV文字列の関連用語 → TermLike[] へ変換（patch_v12 新規）
  const termSlugMap = new Map<string, string>();
  for (const g of glossaryLite) {
    termSlugMap.set(g.term, g.slug);
    if (g.english) termSlugMap.set(g.english, g.slug);
  }
  const relatedTerms = csvTermsToTermList(term.relatedTerms || '', termSlugMap);

  // 自分自身を関連用語から除外
  const relatedTermsFiltered = relatedTerms.filter((t) => t.slug !== term.slug);

  const cat = (term.category && term.category[0]) || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    alternateName: term.english,
    description: term.shortDef,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: '蓄電所ネット用語集',
      url: 'https://bess-net.jp/glossary',
    },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/glossary">用語集</Link>
            {cat && ` / ${cat}`}
          </p>
          {cat && <span className="article-category">{cat}</span>}
          <h1 className="article-title">{term.term}</h1>
          {term.english && (
            <p className="glossary-en">英: {term.english}</p>
          )}
          {term.reading && (
            <p className="glossary-reading">読み: {term.reading}</p>
          )}
          <p className="article-lead">{term.shortDef}</p>

          {term.detail && (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: term.detail }}
            />
          )}

          {/* 関連用語バッジ（patch_v12 修正：CSV→リンク付きバッジ）*/}
          {relatedTermsFiltered.length > 0 && (
            <RelatedTermBadges terms={relatedTermsFiltered} />
          )}

          {/* 関連ニュース（patch_v11）*/}
          {relatedNews.length > 0 && (
            <RelatedNewsList
              news={relatedNews}
              title={`「${term.term}」が登場するニュース`}
            />
          )}

          {/* 実データを確認 — /grid 系統空き容量DB への導線（Phase 5 D-4） */}
          {GRID_RELATED_GLOSSARY_SLUGS.has(term.slug) && (
            <section className="related-grid-section">
              <h3 className="related-h3">実データを確認</h3>
              <p>
                {term.term} に関連する変電所別の系統空き容量データを蓄電所ネットで確認できます。
                東北電力NW・北陸電力送配電・四国電力送配電の3社・1,449変電所の予想潮流・空容量・N-1電制適用可否を一元化しています。
              </p>
              <Link href="/grid" className="related-grid-button">
                系統空き容量データベースを見る →
              </Link>
            </section>
          )}

          {/* 関連解説（patch_v11）*/}
          {relatedExplainers.length > 0 && (
            <RelatedExplainersList
              explainers={relatedExplainers}
              title={`「${term.term}」関連の解説記事`}
            />
          )}

          <p className="back-link">
            <Link href="/glossary">← 用語集一覧へ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
