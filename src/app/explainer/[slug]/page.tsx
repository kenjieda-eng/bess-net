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
import { toGroup } from '@/lib/explainer-utils';
import { GLOSSARY_301_SOURCE_SLUGS, canonicalGlossarySlug } from '@/lib/glossary-301';
import { linkifyHTML } from '@/lib/linkify';
import { getRelatedEntities, buildMentions } from '@/lib/related-cards';
import { siteConfig } from '@/lib/site-config';
import { TOOL_CTAS } from '@/lib/tools-cta';
import { EXPLAINER_EDU_LINKS } from '@/lib/edu-links';
import { isLvInvestExplainer } from '@/lib/lv-invest';
import ExplainerNextStepBlock from '@/components/ExplainerNextStepBlock';
import explainerRelatedMap from '@/lib/generated/explainer-related-map.json';

// E1⑤フォールバック用の precompute 済み関連マップ（同カテゴリ2本・自己除外・runtime 0）
const EXPLAINER_RELATED_MAP = explainerRelatedMap as Record<
  string,
  { slug: string; title: string }[]
>;

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
  // 低圧投資家ガイド記事は /lv/invest/[slug] が正（重複インデックス防止・canonical を向ける／redirect でなく
  // canonical 採用。直アクセスは 200 のまま・#88 二重サフィックスなし・W2）
  const isInvest = isLvInvestExplainer(exp);
  // E3 タイトル衛生（2026-08-05）: サフィックス区切りを半角「 | 」に統一（layout テンプレの
  // 「 | 蓄電所ネット」と整合＝全角半角混在の解消）。title 末尾が既に「解説」の記事（3件）は
  // 「解説 | 解説」の重複を避けサフィックス省略。CMS title 本文は不変（リライトは8/10 GSC後）。
  const metaTitle = exp.title.trimEnd().endsWith('解説')
    ? exp.title
    : `${exp.title} | 解説`;
  return {
    title: metaTitle,
    description: exp.lead,
    alternates: { canonical: isInvest ? `/lv/invest/${exp.slug}` : `/explainer/${exp.slug}` },
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
  // P4 B-3: 301元エントリの term/english は canonical slug へ解決して登録（L-EIC-022）。
  // B-1 の除外だと canonical と表記が違う term のバッジが消えるため、解決に昇格。
  // live エントリは後段で登録＝同名 term は live 優先（上書き）。
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
                本記事で解説した内容について、全国10社・8,225変電所（関東含む）の最新公表データを蓄電所ネットで一元化しています。
              </p>
              <Link href="/grid" className="cta-grid-button">
                系統空き容量データベースを見る →
              </Link>
            </section>
          )}

          {/* 文脈ツールCTA — grid CTA の勝ちパターン横展開（tools分析2026-07-09 変更4、対象 slug は tools-cta.ts） */}
          {TOOL_CTAS.filter((c) => c.explainerSlugs.has(exp.slug)).map((c) => (
            <section key={c.href} className="cta-grid-section">
              <h3>{c.label}</h3>
              <p>{c.text}</p>
              <Link href={c.href} className="cta-grid-button">
                {c.button} →
              </Link>
            </section>
          ))}

          {/* E1+E4: この解説の先へ（先勝ち5系統＋TOP10スターCTA・既存CTAと行き先重複時は自動省略・追加フェッチ0） */}
          <ExplainerNextStepBlock
            slug={exp.slug}
            title={exp.title}
            category={exp.category}
            lead={exp.lead}
            body={exp.body}
            related={EXPLAINER_RELATED_MAP[exp.slug] ?? []}
            excludeHrefs={[
              ...(GRID_RELATED_EXPLAINER_SLUGS.has(exp.slug) ? ['/grid'] : []),
              ...TOOL_CTAS.filter((c) => c.explainerSlugs.has(exp.slug)).map((c) => c.href),
              ...(toGroup(exp.category) === '制度・市場' ? ['/policy-calendar'] : []),
            ]}
          />

          {/* 低圧クラスタ Stage1（2026-07-18）: 低圧解説→/lv ガイドへの接続（対象1記事のみ・最小） */}
          {exp.slug === 'low-voltage-balancing-market-launch' && (
            <section className="article-section">
              <h3 className="related-h3">低圧蓄電所 総合ガイド</h3>
              <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
                <li><Link href="/lv">低圧蓄電所 総合ガイド ── 仕組み・収益・購入・参入</Link></li>
                <li><Link href="/lv/what-is">低圧蓄電所（低圧系統用蓄電池）とは？ ── 仕組みと高圧との違い</Link></li>
              </ul>
            </section>
          )}

          {/* 制度の仕組み（EIC Data 教材）— リン共有2026-07-18 */}
          {EXPLAINER_EDU_LINKS[exp.slug] && (
            <section className="article-section">
              <h3 className="related-h3">制度の仕組み（EIC Data 教材）</h3>
              <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
                {EXPLAINER_EDU_LINKS[exp.slug].map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>
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

          {/* P2: 制度・市場系記事に政策カレンダーCTA（コード側テンプレのみ・本文PATCHなし） */}
          {toGroup(exp.category) === '制度・市場' && (
            <section className="cta-grid-section">
              <h3>📅 政策・法制度カレンダー</h3>
              <p>
                本記事に関連する法改正・パブコメ・重要会議・オークション等の政策イベントを、
                蓄電所ネットが時系列で継続トラックしています。
              </p>
              <Link href="/policy-calendar" className="cta-grid-button">
                政策・法制度カレンダーを見る →
              </Link>
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
