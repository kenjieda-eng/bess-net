// /policy-calendar/[slug] — 政策・法制度イベント詳細（充実9件のみ SSG・P1）
// 設計: 鉄則#4/#98/#102（SSG・runtime microCMS 0＝build時 getAllPolicyEvents 1回 memoize #93）・
//       #100（dynamicParams=false＝対象9件以外は routing 層 404・500を出さない）・
//       #103（本文・タイムライン等 全コンテンツを初期HTMLに）・#88（titleTemplate 二重付与なし）・
//       L-EIC-019（本文＝既存 description 全文・一字も改変しない）・
//       鉄則#1/#105（関連リンクはメモリ内照合・q/contains 不使用＝related-cards / linkable-targets 流用）。
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import { getAllPolicyEvents, getLinkableTargets } from '@/lib/microcms';
import { getRelatedEntities } from '@/lib/related-cards';
import {
  POLICY_DETAIL_SLUGS,
  POLICY_DETAIL_SLUG_SET,
  POLICY_TIMELINES,
  SLUG_TO_TIMELINES,
  EVENT_TYPE_COLORS,
  STATUS_COLORS,
  firstOf,
  formatDateJa,
  deriveDisplayStatus,
} from '@/lib/policy-utils';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;
export const dynamicParams = false; // 対象9件以外は routing 層で 404（#100）

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const events = await getAllPolicyEvents(); // 失敗時は [] → 0ページ（graceful）
  const present = new Set(events.map((e) => e.slug));
  return POLICY_DETAIL_SLUGS.filter((s) => present.has(s)).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const events = await getAllPolicyEvents();
  const ev = events.find((e) => e.slug === params.slug);
  if (!ev) return {};
  const desc = (ev.description || '').replace(/\s+/g, ' ').slice(0, 120);
  return {
    // layout.tsx titleTemplate `%s | 蓄電所ネット` が自動付与（落とし穴#88: 手動で付けない）
    title: ev.title,
    description: desc,
    alternates: { canonical: `/policy-calendar/${ev.slug}` },
    openGraph: {
      title: ev.title,
      description: desc,
      type: 'article',
    },
  };
}

export default async function PolicyEventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!POLICY_DETAIL_SLUG_SET.has(params.slug)) notFound();
  const events = await getAllPolicyEvents();
  const ev = events.find((e) => e.slug === params.slug);
  if (!ev) notFound();

  const type = firstOf(ev.eventType);
  // L-EIC-027: 「予定」の期日超過のみ表示側で「終了」へ自動補正（パブコメ除外・進行中/終了不変）
  const status = deriveDisplayStatus(ev);
  const canonicalUrl = `${siteConfig.url}/policy-calendar/${ev.slug}`;

  // 関連用語（glossary）: linkable-targets（GLOSSARY_301 元除外済の共有基盤）をメモリ内照合
  const glossaryTargets = (await getLinkableTargets()).filter(
    (t) => t.type === 'glossary'
  );
  const hay = `${ev.title} ${ev.description || ''}`;
  const seenUrl = new Set<string>();
  const relatedTerms: { term: string; slug: string }[] = [];
  for (const t of glossaryTargets) {
    if (relatedTerms.length >= 6) break;
    if (!t.text || t.text.length < 3) continue;
    if (seenUrl.has(t.url)) continue;
    if (hay.includes(t.text)) {
      seenUrl.add(t.url);
      relatedTerms.push({ term: t.text, slug: t.url.replace('/glossary/', '') });
    }
  }

  // 関連解説（explainer）: related-cards のメモリ内照合を流用（q/contains 不使用）
  const related = await getRelatedEntities({
    baseSlug: ev.slug,
    baseType: 'news',
    baseBodyHtml: ev.description || '',
    baseTitle: ev.title,
    wantTypes: ['explainer'],
    limit: { explainer: 3 },
  });

  const timelines = (SLUG_TO_TIMELINES[ev.slug] || [])
    .map((k) => POLICY_TIMELINES[k])
    .filter(Boolean);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: '政策・法制度カレンダー',
        item: `${siteConfig.url}/policy-calendar`,
      },
      { '@type': 'ListItem', position: 3, name: ev.title, item: canonicalUrl },
    ],
  };
  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    startDate: (ev.eventDate || '').slice(0, 10),
    organizer: { '@type': 'Organization', name: ev.issuer },
    description: ev.description,
    url: canonicalUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/policy-calendar">政策・法制度カレンダー</Link> /{' '}
            {ev.title}
          </p>
          <div className="section-label">Policy & Regulation</div>
          <h1 className="article-title">{ev.title}</h1>

          {/* メタ行（一覧と同じ表示ロジック＝policy-utils 共有） */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
              margin: '12px 0 20px',
            }}
          >
            <span style={{ fontSize: 15, color: 'var(--color-muted)', fontWeight: 600 }}>
              {formatDateJa(ev.eventDate)}
            </span>
            {type && (
              <span
                style={{
                  fontSize: 15,
                  padding: '2px 10px',
                  borderRadius: 4,
                  color: '#fff',
                  background: EVENT_TYPE_COLORS[type] || '#666',
                  fontWeight: 600,
                }}
              >
                {type}
              </span>
            )}
            {status && (
              <span
                style={{
                  fontSize: 15,
                  padding: '2px 10px',
                  borderRadius: 4,
                  color: '#fff',
                  background: STATUS_COLORS[status] || '#888',
                  fontWeight: 600,
                }}
              >
                {status}
              </span>
            )}
            <span style={{ fontSize: 15, color: 'var(--color-muted)' }}>
              発行元: <strong>{ev.issuer}</strong>
            </span>
          </div>

          {/* 本文＝既存 description 全文（一字も改変しない・L-EIC-019） */}
          <p
            className="article-lead"
            style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}
          >
            {ev.description}
          </p>

          {/* 📅 制度タイムライン（編集部指定・該当ページのみ） */}
          {timelines.map((tl) => (
            <section key={tl.key} className="page-section" style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                📅 制度タイムライン: {tl.title}
              </h2>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tl.items.map((item) => {
                  const isSelf = item.slug === ev.slug;
                  const href = item.slug
                    ? `/policy-calendar/${item.slug}`
                    : '/policy-calendar';
                  return (
                    <li
                      key={`${item.date}-${item.label}`}
                      style={{
                        padding: '10px 14px',
                        marginBottom: 8,
                        border: '1px solid var(--color-border)',
                        borderLeft: isSelf
                          ? '4px solid var(--color-accent, #0066cc)'
                          : '4px solid var(--color-border)',
                        borderRadius: 6,
                        background: 'var(--color-bg-card, #fff)',
                        fontSize: 15,
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--color-muted)',
                          marginRight: 10,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {item.date}
                      </span>
                      {isSelf ? (
                        <strong>{item.label}（本ページ）</strong>
                      ) : (
                        <Link href={href}>{item.label}</Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}

          {/* 関連用語（glossary・メモリ内照合） */}
          {relatedTerms.length > 0 && <RelatedTermBadges terms={relatedTerms} />}

          {/* 関連解説（explainer・related-cards 流用） */}
          {related.explainers.length > 0 && (
            <section className="page-section related-explainers-section">
              <h3 className="related-h3">関連解説</h3>
              <ul className="related-explainer-list">
                {related.explainers.map((e) => (
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

          {/* 公式情報源＋第三者発信注記（一覧の既存文言を踏襲） */}
          <section className="article-sources">
            <h3>公式情報源</h3>
            {ev.sourceUrl ? (
              <p>
                <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {ev.sourceUrl}
                </a>
              </p>
            ) : (
              <p>出典URLは一覧ページをご参照ください。</p>
            )}
            <p className="page-meta" style={{ fontSize: 15 }}>
              ※ 各イベントの公式情報は出典 URL（経済産業省・OCCTO・環境省・NEDO・SII 等）をご参照ください。
              ※ 当サイトは公開情報を整理した第三者発信であり、各機関の公式情報とは独立しています。
            </p>
          </section>

          <p className="back-link">
            <Link href="/policy-calendar">← 政策・法制度カレンダーへ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
