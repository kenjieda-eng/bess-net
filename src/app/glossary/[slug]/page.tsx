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
