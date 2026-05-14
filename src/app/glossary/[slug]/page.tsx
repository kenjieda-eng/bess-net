// /glossary/[slug] 詳細ページ - patch_v12
// 用語集詳細の関連用語をCSV文字列表示から、リンク付きバッジ表示に修正
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedNewsList from '@/components/RelatedNewsList';
import RelatedExplainersList from '@/components/RelatedExplainersList';
import RelatedTermBadges from '@/components/RelatedTermBadges';

// /grid 系統空き容量データベースへの導線を表示する用語ページ slug 一覧（Phase 5 D-4）
const GRID_RELATED_GLOSSARY_SLUGS = new Set<string>([
  'curtailment',
  'distribution-substation',
  'ehv-substation',
  'extra-high-voltage',
  'extra-high-voltage-grid',
  'extra-hv-bess',
  'grid-available-capacity',
  'grid-interconnection',
  'grid-interconnection-code',
  'grid-interconnection-contract',
  'interconnection-line',
  'inter-regional-interconnection',
  'jeac-9701',
  'non-firm-connection',
  'non-firm-detail',
  'output-control',
  'point-of-interconnection',
  'substation',
  'substation-capacity',
  'substation-detail',
]);
import {
  getGlossaryBySlug,
  getAllGlossarySlugs,
  getNewsByTermId,
  getExplainersByTermName,
  getGlossaryLiteList,
  getOperatorsByTermName,
  getProjectsByTermName,
  getGlossaryBySubcategory,
  getGlossaryByCategory,
} from '@/lib/microcms';
import { csvTermsToTermList } from '@/lib/term-linker';
import { siteConfig } from '@/lib/site-config';

// subcategory が `*_一般` でフォールバック分類かどうか
function isGenericSubcategory(sub?: string): boolean {
  return !!sub && /_一般$/.test(sub);
}

// 「未分類（一般）」表示用ラベル
function subcategoryDisplayLabel(sub?: string): string {
  if (!sub) return '';
  if (isGenericSubcategory(sub)) return '未分類（一般）';
  return sub;
}

export const revalidate = 600;
// 落とし穴 #79 Option B (依頼AI で再発): /glossary/[slug] 1,516 ページ × 5 並列 API
// = build 中 7,580 calls で Vercel 45min timeout に到達。
// generateStaticParams を空にし、全 1,516 ページを on-demand ISR (revalidate=600)
// で初回アクセス時に SSR + キャッシュ。dynamicParams=true (default) で 404 にならない。
export const dynamicParams = true;

export async function generateStaticParams() {
  // build 時 0 ページ、全件 on-demand。初回アクセス時に SSR + ISR キャッシュ。
  return [];
}

// 開発時/sitemap 生成時に使う slug 一覧は API 経由で取得可能 (getAllGlossarySlugs は維持)
void getAllGlossarySlugs;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const term = await getGlossaryBySlug(params.slug);
  if (!term) return {};
  return {
    title: `${term.term}｜用語集`,
    description: term.shortDef,
    alternates: { canonical: `/glossary/${term.slug}` },
    openGraph: {
      title: `${term.term}｜用語集`,
      description: term.shortDef,
      type: 'article',
    },
  };
}

export default async function GlossaryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const term = await getGlossaryBySlug(params.slug);
  if (!term) notFound();

  const cat = (term.category && term.category[0]) || '';
  const sub = term.subcategory || '';
  const useCategoryFallback = isGenericSubcategory(sub);

  // 検索キーワード: term + english (依頼AI、aliases フィールドは glossary 未保有のため未使用)
  const searchKeywords = [term.term, term.english].filter(
    (s): s is string => !!s && s.trim().length >= 2
  );

  // 関連データを並列取得 (依頼AI: 6 並列 — operators/projects/同類用語 追加)
  const [
    relatedNews,
    relatedExplainers,
    glossaryLite,
    relatedOperators,
    relatedProjects,
    sameCategoryTerms,
  ] = await Promise.all([
    getNewsByTermId(term.id, 10).catch(() => []),
    getExplainersByTermName(term.term, 10).catch(() => []),
    getGlossaryLiteList().catch(() => []),
    getOperatorsByTermName(searchKeywords, 5).catch(() => []),
    getProjectsByTermName(searchKeywords, 5).catch(() => []),
    // subcategory が _一般 系なら category fallback
    useCategoryFallback
      ? getGlossaryByCategory(cat, term.slug, 8).catch(() => [])
      : getGlossaryBySubcategory(sub, term.slug, 8).catch(() => []),
  ]);

  // CSV文字列の関連用語 → TermLike[] へ変換（patch_v12 新規）
  const termSlugMap = new Map<string, string>();
  for (const g of glossaryLite) {
    termSlugMap.set(g.term, g.slug);
    if (g.english) termSlugMap.set(g.english, g.slug);
  }
  const relatedTerms = csvTermsToTermList(term.relatedTerms || '', termSlugMap);

  // 自分自身を関連用語から除外
  const relatedTermsFiltered = relatedTerms.filter((t) => t.slug !== term.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    alternateName: term.english,
    description: term.shortDef,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: '蓄電所ネット用語集',
      url: 'https://bess-net.jp/glossary',
    },
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
          {/* パンくず (依頼AI 拡張): トップ / 用語集 / category / subcategory / term */}
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/glossary">用語集</Link>
            {cat && (
              <>
                {' / '}
                <Link href={`/glossary?cat=${encodeURIComponent(cat)}`}>
                  {cat}
                </Link>
              </>
            )}
            {sub && !useCategoryFallback && (
              <>
                {' / '}
                <Link
                  href={`/glossary?cat=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}`}
                >
                  {subcategoryDisplayLabel(sub)}
                </Link>
              </>
            )}
            {sub && useCategoryFallback && (
              <span style={{ color: 'var(--color-muted)' }}>
                {' / 未分類（一般）'}
              </span>
            )}
          </p>
          {cat && <span className="article-category">{cat}</span>}
          <h1 className="article-title">{term.term}</h1>
          {term.english && (
            <p className="glossary-en">英: {term.english}</p>
          )}
          {term.reading && (
            <p className="glossary-reading">読み: {term.reading}</p>
          )}
          <p className="article-lead">{term.shortDef}</p>

          {term.detail && (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: term.detail }}
            />
          )}

          {/* 関連用語バッジ（patch_v12 修正：CSV→リンク付きバッジ）*/}
          {relatedTermsFiltered.length > 0 && (
            <RelatedTermBadges terms={relatedTermsFiltered} />
          )}

          {/* 関連ニュース（patch_v11）*/}
          {relatedNews.length > 0 && (
            <RelatedNewsList
              news={relatedNews}
              title={`「${term.term}」が登場するニュース`}
            />
          )}

          {/* 実データを確認 — /grid 系統空き容量DB への導線（Phase 5 D-4） */}
          {GRID_RELATED_GLOSSARY_SLUGS.has(term.slug) && (
            <section className="related-grid-section">
              <h3 className="related-h3">実データを確認</h3>
              <p>
                {term.term} に関連する変電所別の系統空き容量データを蓄電所ネットで確認できます。
                東北電力NW・北陸電力送配電・四国電力送配電の3社・1,449変電所の予想潮流・空容量・N-1電制適用可否を一元化しています。
              </p>
              <Link href="/grid" className="related-grid-button">
                系統空き容量データベースを見る →
              </Link>
            </section>
          )}

          {/* 関連解説（patch_v11、依頼AI で 5→10 件に拡張）*/}
          {relatedExplainers.length > 0 && (
            <RelatedExplainersList
              explainers={relatedExplainers}
              title={`「${term.term}」関連の解説記事`}
            />
          )}

          {/* 関連事業者 (依頼AI 新規) */}
          {relatedOperators.length > 0 && (
            <section
              style={{
                marginTop: 32,
                padding: 16,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                🏢 「{term.term}」関連の事業者（{relatedOperators.length}社）
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {relatedOperators.map((op) => (
                  <li key={op.id} style={{ marginBottom: 8, fontSize: 14 }}>
                    <Link
                      href={`/operators/${op.slug}`}
                      style={{
                        color: 'var(--color-accent, #0066cc)',
                        fontWeight: 600,
                      }}
                    >
                      {op.name}
                    </Link>
                    {op.bessRelation && (
                      <span
                        style={{
                          color: 'var(--color-muted)',
                          marginLeft: 8,
                          fontSize: 12,
                        }}
                      >
                        — {op.bessRelation.slice(0, 60)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 関連プロジェクト (依頼AI 新規) */}
          {relatedProjects.length > 0 && (
            <section
              style={{
                marginTop: 24,
                padding: 16,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 12,
                }}
              >
                ⚡ 「{term.term}」関連の蓄電所プロジェクト（{relatedProjects.length}件）
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {relatedProjects.map((p) => (
                  <li key={p.id} style={{ marginBottom: 8, fontSize: 14 }}>
                    <Link
                      href={`/projects/${p.slug}`}
                      style={{
                        color: 'var(--color-accent, #0066cc)',
                        fontWeight: 600,
                      }}
                    >
                      {p.name}
                    </Link>
                    <span
                      style={{
                        color: 'var(--color-muted)',
                        marginLeft: 8,
                        fontSize: 12,
                      }}
                    >
                      {p.prefecture && `${p.prefecture} / `}
                      {p.outputMw && `${p.outputMw}MW`}
                      {p.capacityMwh && ` / ${p.capacityMwh}MWh`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 同じ subcategory (or category fallback) の用語 (依頼AI 新規) */}
          {sameCategoryTerms.length > 0 && (
            <section
              style={{
                marginTop: 24,
                padding: 16,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                🔗{' '}
                {useCategoryFallback
                  ? `同じカテゴリ「${cat}」の用語`
                  : `同じサブカテゴリ「${subcategoryDisplayLabel(sub)}」の用語`}
                （{sameCategoryTerms.length}件）
              </h3>
              {useCategoryFallback && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--color-muted)',
                    margin: '0 0 12px',
                  }}
                >
                  ※ この用語は &quot;{sub}&quot; (一般用語)に分類されているため、
                  カテゴリ単位の類似用語を表示しています。
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sameCategoryTerms.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/glossary/${t.slug}`}
                    style={{
                      padding: '4px 10px',
                      background: '#fff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      fontSize: 13,
                      color: 'var(--color-accent, #0066cc)',
                      textDecoration: 'none',
                    }}
                  >
                    {t.term}
                  </Link>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 12 }}>
                <Link
                  href={
                    useCategoryFallback
                      ? `/glossary?cat=${encodeURIComponent(cat)}`
                      : `/glossary?cat=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}`
                  }
                  style={{ color: 'var(--color-accent, #0066cc)' }}
                >
                  すべて見る →
                </Link>
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
