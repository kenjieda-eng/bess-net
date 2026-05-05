// /news/[slug] 詳細ページ (Server Component) - patch_v11
// 用語自動リンク・関連用語バッジ・関連事業者バッジを追加
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import RelatedOperatorBadges from '@/components/RelatedOperatorBadges';
import {
  getNewsBySlugWithRelations,
  getIndustryNewsSlugs,
} from '@/lib/microcms';
import { linkifyTerms } from '@/lib/term-linker';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return await getIndustryNewsSlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const news = await getNewsBySlugWithRelations(params.slug);
  if (!news) return {};
  return {
    title: `${news.title}｜業界ニュース`,
    description: news.lead,
    alternates: { canonical: `/news/${news.slug}` },
    openGraph: {
      title: news.title,
      description: news.lead,
      type: 'article',
      publishedTime: news.publishedAt,
      modifiedTime: news.revisedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description: news.lead,
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const news = await getNewsBySlugWithRelations(params.slug);
  if (!news) notFound();

  // 関連用語（Glossary[]）
  const relatedTerms = (news.relatedTerms ?? []).map((g) => ({
    term: g.term,
    slug: g.slug,
  }));

  // 関連事業者（Operator[]）
  const relatedOperators = (news.relatedOperators ?? []).map((o) => ({
    name: o.name,
    slug: o.slug,
  }));

  // 本文中の用語自動リンク化
  const bodyHtml = linkifyTerms(news.body || '', relatedTerms);

  const cat = (news.category && news.category[0]) || '';
  const dateStr = news.publishedAt
    ? new Date(news.publishedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title,
    description: news.lead,
    datePublished: news.publishedAt,
    dateModified: news.revisedAt,
    author: { '@type': 'Organization', name: '蓄電所ネット' },
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
            <Link href="/">トップ</Link> / <Link href="/news">ニュース</Link>
            {cat && ` / ${cat}`}
          </p>
          {cat && <span className="article-category">{cat}</span>}
          <h1 className="article-title">{news.title}</h1>
          <p className="article-meta">
            公開日：{dateStr}
            {news.revisedAt && (
              <>
                {' '}/ 最終更新：
                {new Date(news.revisedAt).toLocaleDateString('ja-JP')}
              </>
            )}
          </p>
          <p className="article-lead">{news.lead}</p>
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {/* 関連事業者バッジ */}
          {relatedOperators.length > 0 && (
            <RelatedOperatorBadges operators={relatedOperators} />
          )}

          {/* 関連用語バッジ */}
          {relatedTerms.length > 0 && <RelatedTermBadges terms={relatedTerms} />}

          {/* 出典 */}
          {news.sourceUrl && (
            <section className="article-sources">
              <h3>出典</h3>
              <p>
                {news.sourceName && <span>{news.sourceName}</span>}
                {news.sourceName && <span> ／ </span>}
                <a
                  href={news.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {news.sourceUrl}
                </a>
              </p>
            </section>
          )}

          {/* タグ */}
          {news.tags && (
            <section className="article-tags">
              <h3>タグ</h3>
              <p>{news.tags}</p>
            </section>
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
