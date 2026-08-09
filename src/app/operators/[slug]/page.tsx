// /operators/[slug] 詳細ページ
// rate-limit hygiene（P0 監査）＋ P3 厚み ＋ P4 送配電→/grid 相互リンク:
//  - 事業者本体＋関連リレーション＋自動リンク済本文を build 時事前計算 JSON で参照（runtime microCMS=0）。
//    生成: scripts/precompute-operators-detail.ts（prebuild）。
//  - generateStaticParams=全 slug で SSG。未知 slug のみ getOperatorBySlug fallback（guarded、500回避）。
//  - 送配電10社は所管 /grid エリアへの導線を表示。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedNewsList from '@/components/RelatedNewsList';
import RelatedProjectsList from '@/components/RelatedProjectsList';
import type { News, Project } from '@/lib/microcms';
import { getOperatorBySlug } from '@/lib/microcms'; // fallback 専用（未知 slug、guarded）
import { buildMentions } from '@/lib/related-cards';
import {
  OPERATOR_CATEGORY_COLOR,
  parseProducts,
  listedLabel,
  foundedLabel,
} from '@/lib/operators-utils';
import { siteConfig } from '@/lib/site-config';

import operatorsDetailIndex from '@/lib/generated/operators-detail-index.json';

type NewsRef = { id: string; slug: string; title: string; publishedAt: string; category: string[] };
type ProjectRef = { id: string; slug: string; name: string; prefecture?: string; outputMw?: number; capacityMwh?: number };
type ExplainerRef = { id: string; slug: string; title: string; lead?: string };
type OperatorLite = { id: string; slug: string; name: string; description?: string };
type OperatorRaw = {
  id: string; name: string; slug: string; nameEn?: string; category: string[];
  corporateType?: string; prefecture?: string; city?: string; foundedYear?: number;
  listedMarket?: string; ticker?: string; description?: string; products?: string;
  bessRelation?: string; websiteUrl?: string; sourceUrl?: string;
};
type OperatorDetailEntry = {
  operator: OperatorRaw;
  bodyHtml: string;
  relatedNews: NewsRef[];
  relatedProjects: ProjectRef[];
  relatedExplainers: ExplainerRef[];
  sameCategoryOperators: OperatorLite[];
  gridArea: { area: string; areaJp: string } | null;
};
const detailIndex: Record<string, OperatorDetailEntry> =
  operatorsDetailIndex as unknown as Record<string, OperatorDetailEntry>;

export const revalidate = 86400; // 事前計算JSON参照のため revalidate でも microCMS は呼ばれない
export const dynamicParams = true; // 未知 slug は getOperatorBySlug fallback

export async function generateStaticParams() {
  return Object.keys(detailIndex).map((slug) => ({ slug }));
}

// 未知 slug 用の最小エントリ（関連は空）。getOperatorBySlug は guarded（429→null→notFound）。
async function loadEntry(slug: string): Promise<OperatorDetailEntry | null> {
  const pre = detailIndex[slug];
  if (pre) return pre;
  const op = await getOperatorBySlug(slug);
  if (!op) return null;
  return {
    operator: {
      id: op.id, name: op.name, slug: op.slug, nameEn: op.nameEn, category: op.category ?? [],
      corporateType: op.corporateType, prefecture: op.prefecture, city: op.city, foundedYear: op.foundedYear,
      listedMarket: op.listedMarket, ticker: op.ticker, description: op.description, products: op.products,
      bessRelation: op.bessRelation, websiteUrl: op.websiteUrl, sourceUrl: op.sourceUrl,
    },
    bodyHtml: op.body ?? '',
    relatedNews: [], relatedProjects: [], relatedExplainers: [], sameCategoryOperators: [], gridArea: null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const entry = await loadEntry(params.slug);
  if (!entry) return {};
  const o = entry.operator;
  // Op5(2026-08-08): その社ならではの手札（実案件・関連ニュース）の件数を title に載せる。
  // 0件の要素は省略し、両方0なら従来どおり社名のみ（誇張しない）。
  const nProjects = entry.relatedProjects?.length ?? 0;
  const mNews = entry.relatedNews?.length ?? 0;
  const facts: string[] = [];
  if (nProjects > 0) facts.push(`案件${nProjects}件`);
  if (mNews > 0) facts.push(`関連ニュース${mNews}本`);
  const factSuffix = facts.length > 0 ? ` — ${facts.join('・')}` : '';
  const title = `${o.name}の蓄電所事業${factSuffix}｜蓄電所事業者ナビ`;
  const description = facts.length > 0
    ? `${o.name}の蓄電所・系統用蓄電池に関する${facts.join('・')}を掲載。${o.description ?? ''}`.trim()
    : o.description;
  return {
    title,
    description,
    alternates: { canonical: `/operators/${o.slug}` },
    openGraph: { title, description, type: 'profile' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function OperatorDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const entry = await loadEntry(params.slug);
  if (!entry) notFound();

  const operator = entry.operator;
  const { bodyHtml, relatedNews, relatedProjects, sameCategoryOperators, gridArea } = entry;

  const products = parseProducts(operator.products);
  const listed = listedLabel(operator as any);
  const founded = foundedLabel(operator.foundedYear);
  const primaryCategory = (operator.category && operator.category[0]) || '';

  const mentions = buildMentions({
    operators: sameCategoryOperators.map((o) => ({ slug: o.slug, name: o.name })),
    projects: relatedProjects.map((p) => ({ slug: p.slug, name: p.name })),
    news: relatedNews,
    explainers: [],
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
        ? { '@type': 'PostalAddress', addressRegion: operator.prefecture, addressLocality: operator.city, addressCountry: 'JP' }
        : undefined,
    mentions: mentions.length > 0 ? mentions : undefined,
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
                <span key={c} className={`op-card-badge ${OPERATOR_CATEGORY_COLOR[c] || 'bg-gray-100 text-gray-700'}`}>
                  {c}
                </span>
              ))}
            </div>
            <h1 className="op-detail-title">{operator.name}</h1>
            {operator.nameEn && <p className="op-detail-en">{operator.nameEn}</p>}
            <p className="op-detail-lead">{operator.description}</p>
          </div>

          {/* 系統空き容量データ（送配電10社 → /grid 該当エリア、P4 相互リンク）*/}
          {gridArea && (
            <section className="op-detail-section" style={{ margin: '8px 0 16px', padding: '14px 18px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '2px solid #2563eb', borderRadius: 8 }}>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e40af' }}>
                ⚡ {operator.name} 管内の系統空き容量データ
              </p>
              <p style={{ margin: '0 0 8px', fontSize: 15, color: '#4b5563', lineHeight: 1.6 }}>
                {gridArea.areaJp}エリアの変電所別 系統空き容量・予想潮流・N-1電制適用可否を一元化しています。
              </p>
              <Link href={`/grid/${gridArea.area}`} className="op-related-more" style={{ fontWeight: 700, color: '#2563eb' }}>
                → {gridArea.areaJp}エリアの系統空き容量データベースを見る
              </Link>
            </section>
          )}

          {/* 基本情報 */}
          <section className="op-detail-section">
            <h2 className="op-detail-h2">基本情報</h2>
            <dl className="op-detail-table">
              {operator.corporateType && (<><dt>法人形態</dt><dd>{operator.corporateType}</dd></>)}
              {(operator.prefecture || operator.city) && (
                <><dt>本社所在地</dt><dd>{operator.prefecture || ''}{operator.city ? ` ${operator.city}` : ''}</dd></>
              )}
              {founded && (<><dt>設立</dt><dd>{founded}</dd></>)}
              {listed && (<><dt>上場市場</dt><dd>{listed}</dd></>)}
              {operator.websiteUrl && (
                <><dt>公式サイト</dt><dd><a href={operator.websiteUrl} target="_blank" rel="noopener noreferrer">{operator.websiteUrl}</a></dd></>
              )}
              {products.length > 0 && (
                <><dt>取扱製品</dt><dd><ul className="op-detail-products">{products.map((p) => (<li key={p}>{p}</li>))}</ul></dd></>
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

          {/* 詳細本文（事前リンク済）*/}
          {bodyHtml && (
            <section className="op-detail-section">
              <h2 className="op-detail-h2">詳細</h2>
              <div className="op-detail-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </section>
          )}

          {/* 関連ニュース */}
          {relatedNews.length > 0 && (
            <section className="op-detail-section">
              <RelatedNewsList news={relatedNews as unknown as News[]} title={`${operator.name}のニュース`} />
            </section>
          )}

          {/* 関連プロジェクト */}
          {relatedProjects.length > 0 && (
            <section className="op-detail-section">
              <RelatedProjectsList projects={relatedProjects as unknown as Project[]} title={`${operator.name}の実案件`} />
            </section>
          )}

          {/* 出典 */}
          {operator.sourceUrl && (
            <section className="op-detail-section">
              <h2 className="op-detail-h2">出典</h2>
              <p><a href={operator.sourceUrl} target="_blank" rel="noopener noreferrer">{operator.sourceUrl}</a></p>
            </section>
          )}

          {/* 同カテゴリの他事業者 */}
          {sameCategoryOperators.length > 0 && (
            <section className="op-detail-section">
              <h2 className="op-detail-h2">同カテゴリ「{primaryCategory}」の他事業者</h2>
              <ul className="op-related-list">
                {sameCategoryOperators.map((r) => (
                  <li key={r.id}>
                    <Link href={`/operators/${r.slug}`}>
                      <span className="op-related-name">{r.name}</span>
                      <span className="op-related-desc">{r.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="op-related-more">
                <Link href={`/operators?c=${encodeURIComponent(primaryCategory)}`}>
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
