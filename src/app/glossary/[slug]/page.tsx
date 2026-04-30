import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getGlossaryBySlug, getAllGlossarySlugs } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 300;

export async function generateStaticParams() {
  return await getAllGlossarySlugs();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const item = await getGlossaryBySlug(params.slug);
  if (!item) return {};
  return {
    title: `${item.term}とは | 用語集`,
    description: item.shortDef,
    openGraph: {
      title: `${item.term}とは`,
      description: item.shortDef,
      type: 'article',
    },
  };
}

export default async function GlossaryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await getGlossaryBySlug(params.slug);
  if (!item) notFound();

  const category = (item.category && item.category[0]) || '';

  // 関連用語をカンマ区切りからリスト化
  const relatedTerms = item.relatedTerms
    ? item.relatedTerms.split(/[,、，]/).map((t) => t.trim()).filter(Boolean)
    : [];

  // 構造化データ（DefinedTerm）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: item.term,
    description: item.shortDef,
    inDefinedTermSet: `${siteConfig.url}/glossary`,
    url: `${siteConfig.url}/glossary/${item.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <article className="section-inner glossary-detail">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/glossary">用語集</Link>
            {category && ` / ${category}`}
          </p>

          <h1 className="glossary-term">{item.term}</h1>
          <div className="glossary-meta">
            {item.reading && <span>読み：{item.reading}</span>}
            {item.english && <span>英：{item.english}</span>}
            {category && <span>カテゴリ：{category}</span>}
          </div>

          <div className="glossary-short-def">{item.shortDef}</div>

          {item.detail && (
            <section className="glossary-detail-section">
              <h2>詳細解説</h2>
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: item.detail }}
              />
            </section>
          )}

          {relatedTerms.length > 0 && (
            <section className="glossary-detail-section">
              <h2>関連用語</h2>
              <ul className="glossary-related-list">
                {relatedTerms.map((term, i) => (
                  <li key={i}>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 8 }}>
                ※ 関連用語のリンク化は今後対応予定です
              </p>
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
