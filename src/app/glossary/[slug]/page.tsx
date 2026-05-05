// /glossary/[slug] 詳細ページ - patch_v11
// 既存の用語定義表示に加え、関連ニュース・関連解説のセクションを追加
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedNewsList from '@/components/RelatedNewsList';
import RelatedExplainersList from '@/components/RelatedExplainersList';
import {
  getGlossaryBySlug,
  getAllGlossarySlugs,
  getNewsByTermId,
  getExplainersByTermName,
} from '@/lib/microcms';
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

  // 関連データを並列取得
  const [relatedNews, relatedExplainers] = await Promise.all([
    getNewsByTermId(term.id, 10).catch(() => []),
    getExplainersByTermName(term.term, 5).catch(() => []),
  ]);

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

          {/* 関連ニュース（patch_v11 新規）*/}
          {relatedNews.length > 0 && (
            <RelatedNewsList
              news={relatedNews}
              title={`「${term.term}」が登場するニュース`}
            />
          )}

          {/* 関連解説（patch_v11 新規）*/}
          {relatedExplainers.length > 0 && (
            <RelatedExplainersList
              explainers={relatedExplainers}
              title={`「${term.term}」関連の解説記事`}
            />
          )}

          {/* 既存の relatedTerms（CSV文字列）表示 - 互換維持 */}
          {term.relatedTerms && (
            <section className="article-tags">
              <h3>関連用語</h3>
              <p>{term.relatedTerms}</p>
            </section>
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
