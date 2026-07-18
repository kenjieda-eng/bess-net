// /glossary/[slug] 詳細ページ
// P0 (Vercel 6/23 rate-limit 500 恒久対策):
//  - 全 1,522 語を build 時 SSG（generateStaticParams が全 slug を返す）。
//  - 用語本体＋全関連リレーションは build 時事前計算済 JSON を参照（runtime microCMS = 0）。
//    生成: scripts/precompute-glossary-detail.ts（prebuild で自動）。
//  - 未知 slug（index 未収録の新規語）のみ getGlossaryBySlug に graceful fallback。
//    429 等で throw しても try/catch → notFound にし、500 を出さない。
//  - 鉄則 #2/#3 / 落とし穴 #93/#94/#98 準拠。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedNewsList from '@/components/RelatedNewsList';
import RelatedExplainersList from '@/components/RelatedExplainersList';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import type { News, Explainer } from '@/lib/microcms';
// fallback 専用（index 未収録 slug のときのみ呼ぶ。try/catch で 500 回避）
import { getGlossaryBySlug } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';
import { GLOSSARY_EDU_LINKS } from '@/lib/edu-links';

// build 時事前計算: 用語本体＋全関連リレーション（microCMS runtime ゼロ）
import glossaryDetailIndex from '@/lib/generated/glossary-detail-index.json';
// build 時事前計算: 関連 FAQ（落とし穴 #98 恒久対策、従来どおり）
import glossaryFaqIndex from '@/lib/generated/glossary-faq-index.json';

// /grid 系統空き容量データベースへの導線を表示する用語ページ slug 一覧（Phase 5 D-4）
const GRID_RELATED_GLOSSARY_SLUGS = new Set<string>([
  'curtailment', 'distribution-substation', 'ehv-substation', 'extra-high-voltage',
  'extra-high-voltage-grid', 'extra-hv-bess', 'grid-available-capacity', 'grid-interconnection',
  'grid-interconnection-code', 'grid-interconnection-contract', 'interconnection-line',
  'inter-regional-interconnection', 'jeac-9701', 'non-firm-connection', 'non-firm-detail',
  'output-control', 'point-of-interconnection', 'substation', 'substation-capacity', 'substation-detail',
]);

// ── 事前計算 index の型 ──────────────────────────────────────────────
type TermLite = { term: string; slug: string };
type NewsRef = { id: string; slug: string; title: string; publishedAt: string; category: string[] };
type ExplainerRef = { id: string; slug: string; title: string; lead: string };
type OperatorRef = { id: string; slug: string; name: string; bessRelation?: string };
type ProjectRef = { id: string; slug: string; name: string; prefecture?: string; outputMw?: number; capacityMwh?: number };
type GlossaryDetailEntry = {
  term: {
    id: string; term: string; slug: string; english?: string; reading?: string;
    shortDef: string; detail?: string; category: string[]; subcategory?: string;
  };
  relatedNews: NewsRef[];
  relatedExplainers: ExplainerRef[];
  relatedOperators: OperatorRef[];
  relatedProjects: ProjectRef[];
  sameCategoryTerms: TermLite[];
  useCategoryFallback: boolean;
  relatedTerms: TermLite[];
};
// microCMS 由来の null（prefecture 等）を含むため unknown 経由でキャスト（shape は一致）
const detailIndex: Record<string, GlossaryDetailEntry> = glossaryDetailIndex as unknown as Record<string, GlossaryDetailEntry>;

type FaqRef = { id: string; slug: string; question: string; category?: string };
const faqIndexTyped: Record<string, FaqRef[]> = glossaryFaqIndex as Record<string, FaqRef[]>;

function isGenericSubcategory(sub?: string): boolean {
  return !!sub && /_一般$/.test(sub);
}
function subcategoryDisplayLabel(sub?: string): string {
  if (!sub) return '';
  if (isGenericSubcategory(sub)) return '未分類（一般）';
  return sub;
}

export const revalidate = 86400; // 1日（事前計算JSON参照のため revalidate でも microCMS は呼ばれない）
export const dynamicParams = true; // 未知 slug は on-demand fallback（getGlossaryBySlug、try/catch）

// 全 1,522 語を build 時 SSG（事前計算 index の全 slug）。
// → 冷ページでも runtime microCMS をゼロにし、クローラ集中時の 429/500 を解消。
export async function generateStaticParams() {
  return Object.keys(detailIndex).map((slug) => ({ slug }));
}

// index 未収録 slug のための fallback（最小エントリ、関連は空）。429 等は呼び出し側 try/catch。
function entryFromTerm(t: NonNullable<Awaited<ReturnType<typeof getGlossaryBySlug>>>): GlossaryDetailEntry {
  return {
    term: {
      id: t.id, term: t.term, slug: t.slug, english: t.english, reading: t.reading,
      shortDef: t.shortDef, detail: t.detail, category: t.category ?? [], subcategory: t.subcategory,
    },
    relatedNews: [], relatedExplainers: [], relatedOperators: [], relatedProjects: [],
    sameCategoryTerms: [], useCategoryFallback: isGenericSubcategory(t.subcategory), relatedTerms: [],
  };
}

// 事前計算 index 優先、無ければ fallback（try/catch で 500 回避）
async function loadEntry(slug: string): Promise<GlossaryDetailEntry | null> {
  const pre = detailIndex[slug];
  if (pre) return pre;
  try {
    const t = await getGlossaryBySlug(slug);
    return t ? entryFromTerm(t) : null;
  } catch {
    return null; // rate limit 等 → notFound 扱い（500 を出さない）
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const entry = await loadEntry(params.slug);
  if (!entry) return {};
  const { term } = entry;
  return {
    title: `${term.term}とは？意味・解説｜蓄電池・エネルギー用語集`,
    description: term.shortDef,
    alternates: { canonical: `/glossary/${term.slug}` },
    openGraph: {
      title: `${term.term}とは？意味・解説｜蓄電池・エネルギー用語集`,
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
  const entry = await loadEntry(params.slug);
  if (!entry) notFound();

  const { term } = entry;
  const cat = (term.category && term.category[0]) || '';
  const sub = term.subcategory || '';
  const useCategoryFallback = entry.useCategoryFallback;

  const relatedNews = entry.relatedNews;
  const relatedExplainers = entry.relatedExplainers;
  const relatedOperators = entry.relatedOperators;
  const relatedProjects = entry.relatedProjects;
  const sameCategoryTerms = entry.sameCategoryTerms;
  const relatedTermsFiltered = entry.relatedTerms;
  const relatedFaqs: FaqRef[] = faqIndexTyped[term.slug] ?? [];

  // DefinedTerm schema + BreadcrumbList（従来どおり）
  const definedTermJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    alternateName: term.english,
    description: term.shortDef ?? (term.detail ? term.detail.replace(/<[^>]+>/g, '').slice(0, 300) : ''),
    termCode: term.slug,
    url: `https://bess-net.jp/glossary/${term.slug}`,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: '蓄電所ネット 業界用語辞典',
      url: 'https://bess-net.jp/glossary',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
  };

  const breadcrumbItems: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
    { '@type': 'ListItem', position: 2, name: '用語集', item: 'https://bess-net.jp/glossary' },
  ];
  let pos = 3;
  if (cat) {
    breadcrumbItems.push({ '@type': 'ListItem', position: pos++, name: cat, item: `https://bess-net.jp/glossary?cat=${encodeURIComponent(cat)}` });
  }
  if (sub && !useCategoryFallback) {
    breadcrumbItems.push({ '@type': 'ListItem', position: pos++, name: sub, item: `https://bess-net.jp/glossary?cat=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}` });
  }
  breadcrumbItems.push({ '@type': 'ListItem', position: pos, name: term.term, item: `https://bess-net.jp/glossary/${term.slug}` });
  const breadcrumbJsonLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbItems };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/glossary">用語集</Link>
            {cat && (
              <>
                {' / '}
                <Link href={`/glossary?cat=${encodeURIComponent(cat)}`}>{cat}</Link>
              </>
            )}
            {sub && !useCategoryFallback && (
              <>
                {' / '}
                <Link href={`/glossary?cat=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}`}>
                  {subcategoryDisplayLabel(sub)}
                </Link>
              </>
            )}
            {sub && useCategoryFallback && (
              <span style={{ color: 'var(--color-muted)' }}>{' / 未分類（一般）'}</span>
            )}
          </p>
          {cat && <span className="article-category">{cat}</span>}
          <h1 className="article-title">{term.term}</h1>
          {term.english && <p className="glossary-en">英: {term.english}</p>}
          {term.reading && <p className="glossary-reading">読み: {term.reading}</p>}
          <p className="article-lead">{term.shortDef}</p>

          {term.detail && (
            <div className="article-body" dangerouslySetInnerHTML={{ __html: term.detail }} />
          )}

          {/* 関連用語バッジ */}
          {relatedTermsFiltered.length > 0 && (
            <RelatedTermBadges terms={relatedTermsFiltered} />
          )}

          {/* 関連ニュース */}
          {relatedNews.length > 0 && (
            <RelatedNewsList
              news={relatedNews as unknown as News[]}
              title={`「${term.term}」が登場するニュース`}
            />
          )}

          {/* 実データを確認 — /grid 系統空き容量DB への導線（Phase 5 D-4） */}
          {GRID_RELATED_GLOSSARY_SLUGS.has(term.slug) && (
            <section className="related-grid-section">
              <h3 className="related-h3">実データを確認</h3>
              <p>
                {term.term} に関連する変電所別の系統空き容量データを蓄電所ネットで確認できます。
                北海道・東北・東京・中部・北陸・関西・中国・四国・九州・沖縄の10社・8,225変電所の予想潮流・空容量・N-1電制適用可否を一元化しています。
              </p>
              <Link href="/grid" className="related-grid-button">
                系統空き容量データベースを見る →
              </Link>
            </section>
          )}

          {/* 制度の仕組み（EIC Data 教材）— リン共有2026-07-18・build時静的マップ結合＝runtime 0 */}
          {GLOSSARY_EDU_LINKS[term.slug] && (
            <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>制度の仕組み（EIC Data 教材）</h3>
              <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
                {GLOSSARY_EDU_LINKS[term.slug].map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 関連解説 */}
          {relatedExplainers.length > 0 && (
            <RelatedExplainersList
              explainers={relatedExplainers as unknown as Explainer[]}
              title={`「${term.term}」関連の解説記事`}
            />
          )}

          {/* 関連事業者 */}
          {relatedOperators.length > 0 && (
            <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
                🏢 「{term.term}」関連の事業者（{relatedOperators.length}社）
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {relatedOperators.map((op) => (
                  <li key={op.id} style={{ marginBottom: 8, fontSize: 14 }}>
                    <Link href={`/operators/${op.slug}`} style={{ color: 'var(--color-accent, #0066cc)', fontWeight: 600 }}>
                      {op.name}
                    </Link>
                    {op.bessRelation && (
                      <span style={{ color: 'var(--color-muted)', marginLeft: 8, fontSize: 12 }}>
                        — {op.bessRelation.slice(0, 60)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 関連プロジェクト */}
          {relatedProjects.length > 0 && (
            <section style={{ marginTop: 24, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
                ⚡ 「{term.term}」関連の蓄電所プロジェクト（{relatedProjects.length}件）
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {relatedProjects.map((p) => (
                  <li key={p.id} style={{ marginBottom: 8, fontSize: 14 }}>
                    <Link href={`/projects/${p.slug}`} style={{ color: 'var(--color-accent, #0066cc)', fontWeight: 600 }}>
                      {p.name}
                    </Link>
                    <span style={{ color: 'var(--color-muted)', marginLeft: 8, fontSize: 12 }}>
                      {p.prefecture && `${p.prefecture} / `}
                      {p.outputMw && `${p.outputMw}MW`}
                      {p.capacityMwh && ` / ${p.capacityMwh}MWh`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 関連 FAQ（build 時事前計算 JSON、microCMS リクエストゼロ） */}
          {relatedFaqs.length > 0 && (
            <section style={{ marginTop: 24, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
                ❓ 「{term.term}」関連のよくある質問（{relatedFaqs.length}件）
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {relatedFaqs.map((faq) => (
                  <li key={faq.id} style={{ marginBottom: 10, fontSize: 14 }}>
                    <Link href={`/faq#${faq.slug}`} style={{ color: 'var(--color-accent, #0066cc)', fontWeight: 600 }}>
                      Q. {faq.question}
                    </Link>
                    {faq.category && (
                      <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 4, color: 'var(--color-muted)' }}>
                        {faq.category}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: 10, fontSize: 12 }}>
                <Link href="/faq" style={{ color: 'var(--color-accent, #0066cc)' }}>
                  業界用語よくある質問（FAQ）一覧 →
                </Link>
              </p>
            </section>
          )}

          {/* 同じ subcategory (or category fallback) の用語 */}
          {sameCategoryTerms.length > 0 && (
            <section style={{ marginTop: 24, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
                🔗{' '}
                {useCategoryFallback
                  ? `同じカテゴリ「${cat}」の用語`
                  : `同じサブカテゴリ「${subcategoryDisplayLabel(sub)}」の用語`}
                （{sameCategoryTerms.length}件）
              </h3>
              {useCategoryFallback && (
                <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 12px' }}>
                  ※ この用語は &quot;{sub}&quot; (一般用語)に分類されているため、カテゴリ単位の類似用語を表示しています。
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sameCategoryTerms.map((t) => (
                  <Link key={t.slug} href={`/glossary/${t.slug}`} style={{ padding: '4px 10px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 13, color: 'var(--color-accent, #0066cc)', textDecoration: 'none' }}>
                    {t.term}
                  </Link>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 12 }}>
                <Link
                  href={useCategoryFallback ? `/glossary?cat=${encodeURIComponent(cat)}` : `/glossary?cat=${encodeURIComponent(cat)}&sub=${encodeURIComponent(sub)}`}
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
