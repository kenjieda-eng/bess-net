// /links/[slug] 詳細ページ - patch_v14
// 1900字級の充実したdescriptionを段落表示するように改修
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
  // メタディスクリプション用に短い抜粋を生成（最初の段落の冒頭）
  const firstPara = (link.description || '').split('\n\n')[0].replace(/^【[^】]*】/, '').trim();
  const metaDesc = firstPara.substring(0, 160);
  return {
    title: `${link.title}｜お役立ちサイト一覧`,
    description: metaDesc,
    alternates: { canonical: `/links/${link.slug}` },
    openGraph: {
      title: `${link.title}｜お役立ちサイト一覧`,
      description: metaDesc,
      type: 'website',
    },
  };
}

/**
 * description を段落分割してHTML化
 * 「【見出し】\n\n本文\n\n【次の見出し】...」の形式を想定
 */
function renderDescription(desc: string): JSX.Element[] {
  const blocks = desc.split('\n\n').filter((b) => b.trim());
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    // 「【...】」で始まる行は見出し
    const headingMatch = trimmed.match(/^【([^】]+)】(.*)$/s);
    if (headingMatch) {
      const heading = headingMatch[1];
      const rest = headingMatch[2].trim();
      return (
        <div key={i} className="link-desc-block">
          <h3 className="link-desc-h3">{heading}</h3>
          {rest && <p className="link-desc-p">{rest}</p>}
        </div>
      );
    }
    return <p key={i} className="link-desc-p">{trimmed}</p>;
  });
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

  // メタ用の短い抜粋
  const firstPara = (link.description || '').split('\n\n')[0].replace(/^【[^】]*】/, '').trim();
  const shortLead = firstPara.substring(0, 200);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: link.title,
    alternateName: link.siteNameEn,
    description: shortLead,
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

          {/* 拡充された詳細説明（段落分割表示）*/}
          <div className="link-description-detail">
            {renderDescription(link.description || '')}
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

          {/* 関連用語バッジ */}
          {relatedTerms.length > 0 && (
            <RelatedTermBadges terms={relatedTerms} />
          )}

          {/* 関連事業者バッジ */}
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
