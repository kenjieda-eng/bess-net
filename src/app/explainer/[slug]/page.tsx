// /explainer/[slug] 詳細ページ - patch_v11
// 本文中の用語自動リンク + 関連用語バッジ
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import {
  getExplainerBySlug,
  getAllExplainerSlugs,
  getGlossaryLiteList,
} from '@/lib/microcms';
import { linkifyTerms, csvTermsToTermList } from '@/lib/term-linker';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return await getAllExplainerSlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const exp = await getExplainerBySlug(params.slug);
  if (!exp) return {};
  return {
    title: `${exp.title}｜解説`,
    description: exp.lead,
    alternates: { canonical: `/explainer/${exp.slug}` },
    openGraph: {
      title: exp.title,
      description: exp.lead,
      type: 'article',
    },
  };
}

export default async function ExplainerDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const exp = await getExplainerBySlug(params.slug);
  if (!exp) notFound();

  // 関連用語（CSV文字列）→ TermLike[] 変換
  const glossaryLite = await getGlossaryLiteList().catch(() => []);
  const termSlugMap = new Map<string, string>();
  for (const g of glossaryLite) {
    termSlugMap.set(g.term, g.slug);
    if (g.english) termSlugMap.set(g.english, g.slug);
  }
  const relatedTerms = csvTermsToTermList(exp.relatedTerms, termSlugMap);

  // 本文中の用語自動リンク化
  const bodyHtml = linkifyTerms(exp.body || '', relatedTerms);

  const cat = (exp.category && exp.category[0]) || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: exp.title,
    description: exp.lead,
    datePublished: exp.publishedAt,
    dateModified: exp.revisedAt,
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
            <Link href="/">トップ</Link> /{' '}
            <Link href="/explainer">解説</Link>
            {cat && ` / ${cat}`}
          </p>
          {cat && <span className="article-category">{cat}</span>}
          <h1 className="article-title">{exp.title}</h1>
          <p className="article-lead">{exp.lead}</p>
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {/* 関連用語バッジ */}
          {relatedTerms.length > 0 && <RelatedTermBadges terms={relatedTerms} />}

          {/* 出典 */}
          {exp.sources && (
            <section className="article-sources">
              <h3>出典</h3>
              <div dangerouslySetInnerHTML={{ __html: exp.sources }} />
            </section>
          )}

          <p className="back-link">
            <Link href="/explainer">← 解説一覧へ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
