import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  getNewsBySlug,
  getAllNewsSlugs,
  getGlossaryTermSlugMap,
} from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    return await getAllNewsSlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getNewsBySlug(params.slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.lead,
    openGraph: {
      title: article.title,
      description: article.lead,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: article.ogImage ? [{ url: article.ogImage.url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.lead,
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getNewsBySlug(params.slug);
  if (!article) notFound();

  const category = (article.category && article.category[0]) || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.lead,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Organization', name: siteConfig.name },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    inLanguage: 'ja-JP',
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
            <Link href="/news">ニュース</Link>
            {category && ` / ${category}`}
          </p>
          {category && <span className="article-category">{category}</span>}
          <h1 className="article-title">{article.title}</h1>
          <p className="article-meta">
            公開日：{new Date(article.publishedAt).toLocaleDateString('ja-JP')}
            {article.updatedAt && article.updatedAt !== article.publishedAt &&
              ` / 最終更新：${new Date(article.updatedAt).toLocaleDateString('ja-JP')}`}
          </p>
          <p className="article-lead">{article.lead}</p>
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
          {article.sources && (
            <section className="article-sources">
              <h3>出典</h3>
              <p>{article.sources}</p>
            </section>
          )}
          {article.relatedTerms && (
            <RelatedTermsSection relatedTerms={article.relatedTerms} />
          )}
          <p className="back-link">
            <Link href="/news">← ニュース一覧へ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

async function RelatedTermsSection({ relatedTerms }: { relatedTerms: string }) {
  const termMap = await getGlossaryTermSlugMap();
  const terms = relatedTerms.split(/[,、，]/).map((t) => t.trim()).filter(Boolean);
  return (
    <section className="article-related">
      <h3>関連用語</h3>
      <ul className="related-term-list">
        {terms.map((term, i) => {
          const slug = termMap.get(term) || termMap.get(term.toLowerCase());
          return (
            <li key={i}>
              {slug ? (
                <Link href={`/glossary/${slug}`} className="related-term-link">
                  {term}
                </Link>
              ) : (
                <span className="related-term-text">{term}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
