import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getExplainerBySlug, getExplainerList } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const revalidate = 60;

// ビルド時に全記事のスラッグを取得し、静的ページを生成
export async function generateStaticParams() {
  const data = await getExplainerList({ limit: 100, fields: 'slug' });
  return data.contents.map((article) => ({ slug: article.slug }));
}

// 各記事のメタデータ（タイトル・description・OGP）を動的に生成
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getExplainerBySlug(params.slug);
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

export default async function ExplainerDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getExplainerBySlug(params.slug);
  if (!article) notFound();

  // 構造化データ（Article schema）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.lead,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Organization', name: siteConfig.name },
    publisher: { '@type': 'Organization', name: siteConfig.name },
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
            <Link href="/explainer">解説記事</Link> / {article.category}
          </p>
          <span className="article-category">{article.category}</span>
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
            <section className="article-related">
              <h3>関連用語</h3>
              <p>{article.relatedTerms}</p>
            </section>
          )}
          <p className="back-link">
            <Link href="/explainer">← 解説記事一覧へ戻る</Link>
          </p>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
