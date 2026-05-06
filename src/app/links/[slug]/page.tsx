// /links/[slug] 詳細ページ - patch_v15
// 「関連タグ」をCSV文字列表示から、用語集ページへのリンク付きバッジに変更
// （patch_v12 で用語集詳細ページに適用したのと同じパターン）
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import RelatedOperatorBadges from '@/components/RelatedOperatorBadges';
import {
  getLinkBySlug,
  getAllLinkSlugs,
  getGlossaryLiteList,
} from '@/lib/microcms';
import { csvTermsToTermList } from '@/lib/term-linker';
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
  // 並列でデータ取得（patch_v15: glossaryLite を追加して関連タグもリンク化）
  const [link, glossaryLite] = await Promise.all([
    getLinkBySlug(params.slug),
    getGlossaryLiteList().catch(() => []),
  ]);
  if (!link) notFound();

  const relatedTerms = (link.relatedTerms ?? []).map((g) => ({
    term: g.term,
    slug: g.slug,
  }));
  const relatedOperators = (link.relatedOperators ?? []).map((o) => ({
    name: o.name,
    slug: o.slug,
  }));

  // 関連タグ（CSV文字列）→ TermLike[] にリンク化（patch_v15 新規）
  // 既に relatedTerms に含まれているものは除外して重複を回避
  const termSlugMap = new Map<string, string>();
  for (const g of glossaryLite) {
    termSlugMap.set(g.term, g.slug);
    if (g.english) termSlugMap.set(g.english, g.slug);
  }
  const existingTermSlugs = new Set(relatedTerms.map((t) => t.slug));
  const allTagBadges = csvTermsToTermList(link.tags || '', termSlugMap);
  // 関連用語と重複しないタグだけリンク化、用語集に存在しないタグはプレーン文字列で残す
  const tagBadges = allTagBadges.filter((t) => !existingTermSlugs.has(t.slug));
  // CSV元の各タグについて、用語集にマッチしなかったものをリスト化
  const tagsRaw = (link.tags || '').split(',').map((s) => s.trim()).filter(Boolean);
  const matchedTagTerms = new Set(allTagBadges.map((t) => t.term));
  const unlinkedTags = tagsRaw.filter((t) => !matchedTagTerms.has(t));

  const primaryCategory = (link.category && link.category[0]) || '';
  const importance = (link.importance && link.importance[0]) || '';
  const country = (link.country && link.country[0]) || '';
  const language = (link.language && link.language[0]) || '';
  const accessType = (link.accessType && link.accessType[0]) || '';

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

          {/* 関連タグ（patch_v15 修正：CSV文字列→リンク付きバッジ）*/}
          {(tagBadges.length > 0 || unlinkedTags.length > 0) && (
            <section className="link-section">
              <h3 className="link-section-h3">関連タグ</h3>
              <ul className="link-tag-badges">
                {tagBadges.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/glossary/${t.slug}`} className="link-tag-badge link-tag-badge-linked">
                      {t.term}
                    </Link>
                  </li>
                ))}
                {unlinkedTags.map((t) => (
                  <li key={`u-${t}`}>
                    <span className="link-tag-badge link-tag-badge-plain">{t}</span>
                  </li>
                ))}
              </ul>
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
