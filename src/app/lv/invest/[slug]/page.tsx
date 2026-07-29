/**
 * /lv/invest/[slug] — 低圧投資家ガイド 記事詳細（W2 Stage1・2026-07-25）
 * microCMS explainer の category:["低圧投資"] 記事を表示。/explainer/[slug] のレンダリングを流用しつつ、
 * パンくず・末尾（LvInvestTrustBlock＋CTA）・canonical(/lv/invest/slug) を投資家ガイド仕様に。
 * gsp は「低圧投資」記事の slug 全件（#100/#102・runtime microCMS 0）。revalidate は explainer と同値。
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import LvInvestTrustBlock from '@/components/LvInvestTrustBlock';
import LvInvestEduLinks from '@/components/LvInvestEduLinks';
import {
  getExplainerBySlug,
  getAllExplainer,
  getGlossaryLiteList,
  getLinkableTargets,
} from '@/lib/microcms';
import { csvTermsToTermList } from '@/lib/term-linker';
import { GLOSSARY_301_SOURCE_SLUGS, canonicalGlossarySlug } from '@/lib/glossary-301';
import { linkifyHTML } from '@/lib/linkify';
import { getRelatedEntities, buildMentions } from '@/lib/related-cards';
import { siteConfig } from '@/lib/site-config';
import { isLvInvestExplainer, LV_INVEST_SEO_MAP } from '@/lib/lv-invest';

export const revalidate = 600;

const CONTACT_URL =
  'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_lv_invest';

export async function generateStaticParams() {
  try {
    const all = await getAllExplainer();
    return all.filter(isLvInvestExplainer).map((e) => ({ slug: e.slug }));
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
  if (!exp || !isLvInvestExplainer(exp)) return {};
  const seo = LV_INVEST_SEO_MAP[exp.slug];
  return {
    // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88 二重回避）
    title: seo?.seoTitle ?? exp.title,
    description: seo?.meta ?? exp.lead,
    alternates: { canonical: `/lv/invest/${exp.slug}` },
    openGraph: {
      title: seo?.seoTitle ?? exp.title,
      description: seo?.meta ?? exp.lead,
      type: 'article',
      publishedTime: exp.publishedAt,
      modifiedTime: exp.revisedAt,
    },
  };
}

export default async function LvInvestArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const exp = await getExplainerBySlug(params.slug);
  if (!exp || !isLvInvestExplainer(exp)) notFound();

  // 関連用語（CSV）→ TermLike[]（/explainer と同方式・301 canonical 解決）
  const glossaryLite = await getGlossaryLiteList().catch(() => []);
  const termSlugMap = new Map<string, string>();
  for (const g of glossaryLite) {
    if (!GLOSSARY_301_SOURCE_SLUGS.has(g.slug)) continue;
    const canonical = canonicalGlossarySlug(g.slug);
    termSlugMap.set(g.term, canonical);
    if (g.english) termSlugMap.set(g.english, canonical);
  }
  for (const g of glossaryLite) {
    if (GLOSSARY_301_SOURCE_SLUGS.has(g.slug)) continue;
    termSlugMap.set(g.term, g.slug);
    if (g.english) termSlugMap.set(g.english, g.slug);
  }
  const relatedTerms = csvTermsToTermList(exp.relatedTerms, termSlugMap);

  // 本文は glossary のみ auto-link（/explainer と同方針）
  const linkableTargets = (await getLinkableTargets()).filter((t) => t.type === 'glossary');
  const bodyHtml = linkifyHTML(exp.body || '', linkableTargets, {
    firstOnly: true,
    selfUrl: `/lv/invest/${exp.slug}`,
  });

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

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: exp.title,
    description: exp.lead,
    datePublished: exp.publishedAt,
    dateModified: exp.revisedAt,
    author: { '@type': 'Organization', name: '蓄電所ネット' },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteConfig.url}/lv/invest/${exp.slug}` },
    mentions: mentions.length > 0 ? mentions : undefined,
    inLanguage: 'ja-JP',
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所 総合ガイド', item: 'https://bess-net.jp/lv' },
      { '@type': 'ListItem', position: 3, name: '投資家のための低圧蓄電所ガイド', item: 'https://bess-net.jp/lv/invest' },
      { '@type': 'ListItem', position: 4, name: exp.title, item: `https://bess-net.jp/lv/invest/${exp.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/lv">低圧蓄電所 総合ガイド</Link> /{' '}
            <Link href="/lv/invest">投資家ガイド</Link>
          </p>
          <span className="article-category">投資家ガイド</span>
          <h1 className="article-title">{exp.title}</h1>
          <p className="article-lead">{exp.lead}</p>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

          {/* 本文「次に読む」の後段: EIC Data 教材への発リンク（相互リンク・リン連携） */}
          <LvInvestEduLinks links={LV_INVEST_SEO_MAP[exp.slug]?.externalLinks} />

          {relatedTerms.length > 0 && <RelatedTermBadges terms={relatedTerms} />}

          {related.operators.length > 0 && (
            <section className="article-section">
              <h3 className="related-h3">本文で言及された事業者</h3>
              <ul className="related-operator-badges">
                {related.operators.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/operators/${o.slug}`} className="related-operator-badge">{o.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 出典 */}
          {exp.sources && (
            <section className="article-sources">
              <h3>出典</h3>
              <div dangerouslySetInnerHTML={{ __html: exp.sources }} />
            </section>
          )}

          {/* 投資家ガイド共通: トラストブロック＋CTA */}
          <LvInvestTrustBlock />
          <div style={{ margin: '24px 0 0', textAlign: 'center' }}>
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#0F2D4F',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 4,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              無料で相談する（何かを買う必要はありません） →
            </a>
          </div>

          <p className="back-link">
            <Link href="/lv/invest">← 投資家のための低圧蓄電所ガイドへ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
