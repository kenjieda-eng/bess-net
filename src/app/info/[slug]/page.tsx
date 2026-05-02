import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  getNewsBySlug,
  getSiteInfoSlugs,
} from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    return await getSiteInfoSlugs();
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

export default async function InfoDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getNewsBySlug(params.slug);
  if (!article) notFound();

  // 編集部カテゴリ以外がここで表示されないようガード
  const isEditorial =
    article.category && article.category.includes('編集部');
  if (!isEditorial) notFound();

  const category = (article.category && article.category[0]) || 'お知らせ';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
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
            <Link href="/info">お知らせ</Link>
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
          {(article.sourceName || article.sourceUrl) && (
            <section className="article-sources">
              <h3>出典</h3>
              <p>
                {article.sourceName && <span>{article.sourceName}</span>}
                {article.sourceName && article.sourceUrl && <span> ／ </span>}
                {article.sourceUrl && (
                  <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {article.sourceUrl}
                  </a>
                )}
              </p>
            </section>
          )}
          {article.tags && (
            <section className="article-tags">
              <h3>タグ</h3>
              <p>{article.tags}</p>
            </section>
          )}
          <p className="back-link">
            <Link href="/info">← お知らせ一覧へ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
