// /explainer/[slug] 詳細ページ - patch_v11
// 本文中の用語自動リンク + 関連用語バッジ
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedTermBadges from '@/components/RelatedTermBadges';

// /grid 系統空き容量データベースへの導線を表示する解説記事 slug 一覧（Phase 5 D-4）
const GRID_RELATED_EXPLAINER_SLUGS = new Set<string>([
  'non-firm-connection-bess',
  'grid-capacity-map-reading',
  'interconnection-contract-fit-law',
  'frt-test-certificate',
  'grid-connection-process',
]);
import {
  getExplainerBySlug,
  getAllExplainerSlugs,
  getGlossaryLiteList,
  getLinkableTargets,
} from '@/lib/microcms';
import { csvTermsToTermList } from '@/lib/term-linker';
import { linkifyHTML } from '@/lib/linkify';
import { getRelatedEntities, buildMentions } from '@/lib/related-cards';
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

  // 関連用語（CSV文字列）→ TermLike[] 変換 (RelatedTermBadges 用にも保持)
  const glossaryLite = await getGlossaryLiteList().catch(() => []);
  const termSlugMap = new Map<string, string>();
  for (const g of glossaryLite) {
    termSlugMap.set(g.term, g.slug);
    if (g.english) termSlugMap.set(g.english, g.slug);
  }
  const relatedTerms = csvTermsToTermList(exp.relatedTerms, termSlugMap);

  // 依頼W.5: explainer は glossary のみリンク（依頼W 前の状態に戻す）
  // 教科書として情報密度を保つため operators/projects は本文では扱わない（Phase 3 サイドバー）
  const linkableTargets = (await getLinkableTargets()).filter(
    (t) => t.type === 'glossary'
  );
  const bodyHtml = linkifyHTML(exp.body || '', linkableTargets, {
    firstOnly: true,
    selfUrl: `/explainer/${exp.slug}`,
  });

  const cat = (exp.category && exp.category[0]) || '';

  // 依頼Y: 関連エンティティ抽出（operators / projects のみ。glossary は relatedTerms バッジで既に維持）
  const related = await getRelatedEntities({
    baseSlug: exp.slug,
    baseType: 'explainer',
    baseBodyHtml: exp.body || '',
    baseTitle: exp.title,
    wantTypes: ['operator', 'project'],
    limit: { operator: 3, project: 3 },
  });
  const mentions = buildMentions({
    operators: related.operators,
    projects: related.projects,
    news: [],
    explainers: [],
  });

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
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/explainer/${exp.slug}`,
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

          {/* 関連用語バッジ（既存：microCMS リレーション） */}
          {relatedTerms.length > 0 && <RelatedTermBadges terms={relatedTerms} />}

          {/* 依頼Y: 本文中で言及された関連事業者 */}
          {related.operators.length > 0 && (
            <section className="article-section">
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
            <section className="article-section">
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

          {/* 実データを確認する CTA — /grid への導線（Phase 5 D-4） */}
          {GRID_RELATED_EXPLAINER_SLUGS.has(exp.slug) && (
            <section className="cta-grid-section">
              <h3>実データで確認する</h3>
              <p>
                本記事で解説した内容について、東北電力NW・北陸電力送配電・四国電力送配電の3社・1,449変電所の最新公表データを蓄電所ネットで一元化しています。
              </p>
              <Link href="/grid" className="cta-grid-button">
                系統空き容量データベースを見る →
              </Link>
            </section>
          )}

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
