// /links/[slug] 詳細ページ - patch_v13
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import RelatedOperatorBadges from '@/components/RelatedOperatorBadges';
import { getLinkBySlug, getAllLinkSlugs } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return await getAllLinkSlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const link = await getLinkBySlug(params.slug);
  if (!link) return {};
  return {
    title: `${link.title}｜お役立ちサイト一覧`,
    description: link.description,
    alternates: { canonical: `/links/${link.slug}` },
    openGraph: {
      title: `${link.title}｜お役立ちサイト一覧`,
      description: link.description,
      type: 'website',
    },
  };
}

export default async function LinkDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const link = await getLinkBySlug(params.slug);
  if (!link) notFound();

  const relatedTerms = (link.relatedTerms ?? []).map((g) => ({
    term: g.term,
    slug: g.slug,
  }));
  const relatedOperators = (link.relatedOperators ?? []).map((o) => ({
    name: o.name,
    slug: o.slug,
  }));

  const primaryCategory = (link.category && link.category[0]) || '';
  const importance = (link.importance && link.importance[0]) || '';
  const country = (link.country && link.country[0]) || '';
  const language = (link.language && link.language[0]) || '';
  const accessType = (link.accessType && link.accessType[0]) || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: link.title,
    alternateName: link.siteNameEn,
    description: link.description,
    url: link.url,
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
            <Link href="/links">お役立ちサイト一覧</Link>
            {primaryCategory && ` / ${primaryCategory}`}
          </p>
          {primaryCategory && (
            <span className="article-category">{primaryCategory}</span>
          )}
          <h1 className="article-title">{link.title}</h1>
          {link.siteNameEn && (
            <p className="glossary-en">英: {link.siteNameEn}</p>
          )}

          <div className="link-meta-row">
            {importance && (
              <span className={`link-imp imp-${importance.length}`}>{importance}</span>
            )}
            {country && <span className="link-country">{country}</span>}
            {language && <span className="link-lang">{language}</span>}
            {accessType && <span className="link-access">{accessType}</span>}
          </div>

          <p className="article-lead">{link.description}</p>

          <div className="link-cta">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-cta-btn"
            >
              公式サイトを開く →
            </a>
            <p className="link-url">{link.url}</p>
          </div>

          {link.contentTypes && link.contentTypes.length > 0 && (
            <section className="link-section">
              <h3 className="link-section-h3">提供コンテンツ</h3>
              <ul className="link-content-types">
                {link.contentTypes.map((t) => (
                  <li key={t} className="link-content-tag">{t}</li>
                ))}
              </ul>
            </section>
          )}

          {link.tags && (
            <section className="link-section">
              <h3 className="link-section-h3">関連タグ</h3>
              <p className="link-tags">{link.tags}</p>
            </section>
          )}

          {link.category && link.category.length > 1 && (
            <section className="link-section">
              <h3 className="link-section-h3">カテゴリ</h3>
              <ul className="link-cat-list">
                {link.category.map((c) => (
                  <li key={c} className="link-cat-tag">{c}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 関連用語バッジ（patch_v13）*/}
          {relatedTerms.length > 0 && (
            <RelatedTermBadges terms={relatedTerms} />
          )}

          {/* 関連事業者バッジ（patch_v13）*/}
          {relatedOperators.length > 0 && (
            <RelatedOperatorBadges operators={relatedOperators} />
          )}

          <p className="back-link">
            <Link href="/links">← お役立ちサイト一覧へ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
