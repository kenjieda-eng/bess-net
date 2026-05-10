// /operators/[slug] 詳細ページ - patch_v11
// patch_v10 の機能を維持しつつ、関連ニュース＋関連プロジェクトのセクションを追加
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedNewsList from '@/components/RelatedNewsList';
import RelatedProjectsList from '@/components/RelatedProjectsList';
import {
  getOperatorBySlug,
  getAllOperatorSlugs,
  getAllOperators,
  getNewsByOperatorId,
  getProjectsByOperatorName,
  getLinkableTargets,
} from '@/lib/microcms';
import { linkifyHTML } from '@/lib/linkify';
import { getRelatedEntities, buildMentions } from '@/lib/related-cards';
import {
  OPERATOR_CATEGORY_COLOR,
  parseProducts,
  listedLabel,
  foundedLabel,
} from '@/lib/operators-utils';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return await getAllOperatorSlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const operator = await getOperatorBySlug(params.slug);
  if (!operator) return {};
  return {
    title: `${operator.name}｜事業者ナビ`,
    description: operator.description,
    alternates: { canonical: `/operators/${operator.slug}` },
    openGraph: {
      title: `${operator.name}｜事業者ナビ`,
      description: operator.description,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${operator.name}｜事業者ナビ`,
      description: operator.description,
    },
  };
}

export default async function OperatorDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const operator = await getOperatorBySlug(params.slug);
  if (!operator) notFound();

  // 並列で関連データ取得 + 自動リンク target 取得
  const [allOperators, relatedNews, relatedProjects, linkableTargets] =
    await Promise.all([
      getAllOperators().catch(() => []),
      getNewsByOperatorId(operator.id, 10).catch(() => []),
      getProjectsByOperatorName(operator.name, 10).catch(() => []),
      getLinkableTargets().catch(() => []),
    ]);

  // 依頼W.6: operators 本文は glossary + operator にリンク許可（projects は除外維持、Phase 3 サイドバー）
  // 3重 safety net (NG_TERMS / 最小文字数 / linkedRanges) でネスト再発は論理的に不可能
  const operatorScopedTargets = linkableTargets.filter(
    (t) => t.type === 'glossary' || t.type === 'operator'
  );
  const bodyHtml = linkifyHTML(operator.body || '', operatorScopedTargets, {
    firstOnly: true,
    selfUrl: `/operators/${operator.slug}`,
  });

  // 依頼Y: 本文＋name から関連エンティティ（operators / news / explainer）を抽出
  // 関連 projects は既存 getProjectsByOperatorName で取得済（重複しないよう除外）
  const relatedEntities = await getRelatedEntities({
    baseSlug: operator.slug,
    baseType: 'operator',
    baseBodyHtml: operator.body || '',
    baseTitle: operator.name,
    baseName: operator.name,
    wantTypes: ['operator', 'news', 'explainer'],
    limit: { operator: 8, news: 5, explainer: 3 },
  });

  // 既存 RelatedNewsList と重複しないようフィルタ（既存リレーション側にすでにあるものは除外）
  const existingNewsSlugs = new Set(relatedNews.map((n) => n.slug));
  const additionalNews = relatedEntities.news.filter(
    (n) => !existingNewsSlugs.has(n.slug)
  );

  // 関連事業者：同じカテゴリで上位5社（自分以外）
  const primaryCategory = (operator.category && operator.category[0]) || '';
  const related = allOperators
    .filter(
      (o) =>
        o.slug !== operator.slug &&
        primaryCategory &&
        (o.category || []).includes(primaryCategory)
    )
    .slice(0, 6);

  const products = parseProducts(operator.products);
  const listed = listedLabel(operator);
  const founded = foundedLabel(operator.foundedYear);

  // PoC 期間中：3 送配電事業者は所管エリアの系統空き容量ページへリンク
  const GRID_AREA_BY_OPERATOR_SLUG: Record<string, { area: string; areaJp: string }> = {
    'tohoku-epco-nw': { area: 'tohoku', areaJp: '東北' },
    'rikuden-tdgc': { area: 'hokuriku', areaJp: '北陸' },
    'yonden-nw': { area: 'shikoku', areaJp: '四国' },
  };
  const gridArea = GRID_AREA_BY_OPERATOR_SLUG[operator.slug];

  // 依頼Y: JSON-LD mentions に関連エンティティを追加
  const mentions = buildMentions({
    operators: relatedEntities.operators,
    projects: relatedProjects.map((p) => ({ slug: p.slug, name: p.name })),
    news: relatedEntities.news,
    explainers: relatedEntities.explainers,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: operator.name,
    alternateName: operator.nameEn,
    description: operator.description,
    url: operator.websiteUrl,
    foundingDate: operator.foundedYear ? `${operator.foundedYear}` : undefined,
    address:
      operator.prefecture || operator.city
        ? {
            '@type': 'PostalAddress',
            addressRegion: operator.prefecture,
            addressLocality: operator.city,
            addressCountry: 'JP',
          }
        : undefined,
    mentions: mentions.length > 0 ? mentions : undefined,
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
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/operators">事業者ナビ</Link> / {operator.name}
          </p>

          {/* ヘッダー */}
          <div className="op-detail-header">
            <div className="op-detail-badges">
              {(operator.category || []).map((c) => (
                <span
                  key={c}
                  className={`op-card-badge ${OPERATOR_CATEGORY_COLOR[c] || 'bg-gray-100 text-gray-700'}`}
                >
                  {c}
                </span>
              ))}
            </div>
            <h1 className="op-detail-title">{operator.name}</h1>
            {operator.nameEn && (
              <p className="op-detail-en">{operator.nameEn}</p>
            )}
            <p className="op-detail-lead">{operator.description}</p>
          </div>

          {/* 基本情報 */}
          <section className="op-detail-section">
            <h2 className="op-detail-h2">基本情報</h2>
            <dl className="op-detail-table">
              {operator.corporateType && (
                <>
                  <dt>法人形態</dt>
                  <dd>{operator.corporateType}</dd>
                </>
              )}
              {(operator.prefecture || operator.city) && (
                <>
                  <dt>本社所在地</dt>
                  <dd>
                    {operator.prefecture || ''}
                    {operator.city ? ` ${operator.city}` : ''}
                  </dd>
                </>
              )}
              {founded && (
                <>
                  <dt>設立</dt>
                  <dd>{founded}</dd>
                </>
              )}
              {listed && (
                <>
                  <dt>上場市場</dt>
                  <dd>{listed}</dd>
                </>
              )}
              {operator.websiteUrl && (
                <>
                  <dt>公式サイト</dt>
                  <dd>
                    <a
                      href={operator.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {operator.websiteUrl}
                    </a>
                  </dd>
                </>
              )}
              {products.length > 0 && (
                <>
                  <dt>取扱製品</dt>
                  <dd>
                    <ul className="op-detail-products">
                      {products.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
            </dl>
          </section>

          {/* 蓄電所事業との関係 */}
          {operator.bessRelation && (
            <section className="op-detail-section">
              <h2 className="op-detail-h2">蓄電所事業との関係</h2>
              <p className="op-detail-relation">{operator.bessRelation}</p>
            </section>
          )}

          {/* 詳細本文 */}
          {operator.body && (
            <section className="op-detail-section">
              <h2 className="op-detail-h2">詳細</h2>
              <div
                className="op-detail-body"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </section>
          )}

          {/* 関連ニュース（patch_v11 新規）*/}
          {relatedNews.length > 0 && (
            <section className="op-detail-section">
              <RelatedNewsList
                news={relatedNews}
                title={`${operator.name}の最新ニュース`}
              />
            </section>
          )}

          {/* 依頼Y: 本文中で言及された関連ニュース（q 全文検索） */}
          {additionalNews.length > 0 && (
            <section className="op-detail-section related-news-section">
              <h3 className="related-h3">
                {operator.name}に関連するニュース
              </h3>
              <ul className="related-news-list">
                {additionalNews.map((n) => {
                  const dateStr = n.publishedAt
                    ? new Date(n.publishedAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                      })
                    : '';
                  const c = (n.category && n.category[0]) || '';
                  return (
                    <li key={n.id} className="related-news-item">
                      <Link href={`/news/${n.slug}`}>
                        <span className="related-news-meta">
                          {c && <span className="related-news-cat">{c}</span>}
                          <span className="related-news-date">{dateStr}</span>
                        </span>
                        <span className="related-news-title">{n.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 関連プロジェクト（patch_v11 新規）*/}
          {relatedProjects.length > 0 && (
            <section className="op-detail-section">
              <RelatedProjectsList
                projects={relatedProjects}
                title={`${operator.name}の関連プロジェクト`}
              />
            </section>
          )}

          {/* 依頼Y: 本文中で言及された関連事業者（テキストマッチで抽出） */}
          {relatedEntities.operators.length > 0 && (
            <section className="op-detail-section">
              <h3 className="related-h3">{operator.name}の関連事業者</h3>
              <ul className="related-operator-badges">
                {relatedEntities.operators.map((o) => (
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

          {/* 依頼Y: 関連解説 */}
          {relatedEntities.explainers.length > 0 && (
            <section className="op-detail-section">
              <h3 className="related-h3">関連解説</h3>
              <ul className="related-explainer-list">
                {relatedEntities.explainers.map((e) => (
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

          {/* 系統空き容量 (PoC: 3社のみ) */}
          {gridArea && (
            <section className="op-detail-section">
              <h2 className="op-detail-h2">
                {gridArea.areaJp}エリアの系統空き容量
              </h2>
              <p>
                <Link
                  href={`/grid/${gridArea.area}`}
                  className="op-related-more"
                >
                  → {gridArea.areaJp}エリアの変電所別 系統空き容量を見る
                </Link>
              </p>
            </section>
          )}

          {/* 出典 */}
          {operator.sourceUrl && (
            <section className="op-detail-section">
              <h2 className="op-detail-h2">出典</h2>
              <p>
                <a
                  href={operator.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {operator.sourceUrl}
                </a>
              </p>
            </section>
          )}

          {/* 関連事業者 */}
          {related.length > 0 && (
            <section className="op-detail-section">
              <h2 className="op-detail-h2">
                同カテゴリ「{primaryCategory}」の他事業者
              </h2>
              <ul className="op-related-list">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/operators/${r.slug}`}>
                      <span className="op-related-name">{r.name}</span>
                      <span className="op-related-desc">{r.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="op-related-more">
                <Link
                  href={`/operators?c=${encodeURIComponent(primaryCategory)}`}
                >
                  →「{primaryCategory}」カテゴリ一覧をすべて見る
                </Link>
              </p>
            </section>
          )}

          <p className="back-link">
            <Link href="/operators">← 事業者ナビ一覧へ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
