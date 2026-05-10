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
  getLinkableTargets,
} from '@/lib/microcms';
import { linkifyHTML } from '@/lib/linkify';
import { getRelatedEntities, buildMentions } from '@/lib/related-cards';
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

  // 依頼W.5: news 本文は glossary + operators のみリンク（projects 除外、汎用 name の連鎖防止）
  const linkableTargets = (await getLinkableTargets()).filter(
    (t) => t.type === 'operator' || t.type === 'glossary'
  );
  const bodyHtml = linkifyHTML(news.body || '', linkableTargets, {
    firstOnly: true,
    selfUrl: `/news/${news.slug}`,
  });

  // 依頼Y: 関連エンティティ抽出（operators / projects / explainer）
  const related = await getRelatedEntities({
    baseSlug: news.slug,
    baseType: 'news',
    baseBodyHtml: news.body || '',
    baseTitle: news.title,
    wantTypes: ['operator', 'project', 'explainer'],
    limit: { operator: 5, project: 5, explainer: 2 },
  });

  const cat = (news.category && news.category[0]) || '';
  const dateStr = news.publishedAt
    ? new Date(news.publishedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
    : '';

  // 依頼Y: JSON-LD mentions
  const mentions = buildMentions({
    operators: related.operators,
    projects: related.projects,
    news: [],
    explainers: related.explainers,
  });

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
    mentions: mentions.length > 0 ? mentions : undefined,
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

          {/* 関連事業者バッジ（既存：microCMS リレーション） */}
          {relatedOperators.length > 0 && (
            <RelatedOperatorBadges operators={relatedOperators} />
          )}

          {/* 関連用語バッジ（既存：microCMS リレーション） */}
          {relatedTerms.length > 0 && <RelatedTermBadges terms={relatedTerms} />}

          {/* 依頼Y: 本文中で言及された関連事業者（テキストマッチで抽出） */}
          {related.operators.length > 0 && (
            <section className="page-section">
              <h3 className="related-h3">本文で言及された事業者</h3>
              <ul className="related-operator-badges">
                {related.operators.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/operators/${o.slug}`}
                      className="related-operator-badge"
                    >
                      {o.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 依頼Y: 関連プロジェクト */}
          {related.projects.length > 0 && (
            <section className="page-section">
              <h3 className="related-h3">関連プロジェクト</h3>
              <ul className="related-operator-badges">
                {related.projects.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/projects/${p.slug}`}
                      className="related-operator-badge"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 依頼Y: 関連解説 */}
          {related.explainers.length > 0 && (
            <section className="page-section related-explainers-section">
              <h3 className="related-h3">関連解説</h3>
              <ul className="related-explainer-list">
                {related.explainers.map((e) => (
                  <li key={e.id} className="related-explainer-item">
                    <Link href={`/explainer/${e.slug}`}>
                      <span className="related-explainer-title">{e.title}</span>
                      {e.lead && (
                        <span className="related-explainer-lead">{e.lead}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

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
