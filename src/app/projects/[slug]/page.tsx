import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  getProjectBySlug,
  getAllProjectSlugs,
  getLinkableTargets,
} from '@/lib/microcms';
import { linkifyHTML } from '@/lib/linkify';
import {
  getRelatedEntities,
  buildMentions,
  getNearbySubstations,
} from '@/lib/related-cards';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return await getAllProjectSlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const item = await getProjectBySlug(params.slug);
  if (!item) return {};
  return {
    title: item.name,
    description: `${item.prefecture}${item.city || ''}に所在する系統用蓄電池プロジェクト「${item.name}」の概要。出力${item.outputMw ?? '—'}MW・容量${item.capacityMwh ?? '—'}MWh。`,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await getProjectBySlug(params.slug);
  if (!item) notFound();

  const status = (item.status && item.status[0]) || 'その他';

  // 依頼W.5: projects 本文は glossary + operators のみリンク（他 projects 除外、汎用 name の連鎖防止）
  const linkableTargets = (await getLinkableTargets()).filter(
    (t) => t.type === 'operator' || t.type === 'glossary'
  );
  const bodyHtml = linkifyHTML(item.body || '', linkableTargets, {
    firstOnly: true,
    selfUrl: `/projects/${item.slug}`,
  });

  // 依頼Y: 関連エンティティ抽出
  const related = await getRelatedEntities({
    baseSlug: item.slug,
    baseType: 'project',
    baseBodyHtml: item.body || '',
    baseTitle: item.name,
    baseName: item.operator || item.name,
    wantTypes: ['operator', 'news', 'explainer'],
    limit: { operator: 5, news: 3, explainer: 2 },
  });

  // 依頼AA Phase 4: 半径10km以内の substations（緯度経度なし project は早期return で空配列）
  const nearbySubstations = await getNearbySubstations({
    origin: { latitude: item.latitude, longitude: item.longitude },
    radiusKm: 10,
    limit: 5,
  }).catch(() => []);

  const mentions = buildMentions(related);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: item.name,
    description: `${item.prefecture}${item.city || ''}に所在する系統用蓄電池プロジェクト「${item.name}」。`,
    url: `https://bess-net.jp/projects/${item.slug}`,
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
      <main className="page">
        <div className="page-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/projects">プロジェクトDB</Link>
            {item.prefecture && ` / ${item.prefecture}`}
          </p>

          <h1 className="page-title">{item.name}</h1>

          <div className="subsidy-status-badges">
            <span className={`badge badge-status-${status === '稼働中' ? 'open' : status === '建設中' ? 'upcoming' : 'closed'}`}>
              {status}
            </span>
            {item.outputMw != null && (
              <span className="badge badge-category">出力 {item.outputMw} MW</span>
            )}
            {item.capacityMwh != null && (
              <span className="badge badge-category">容量 {item.capacityMwh} MWh</span>
            )}
          </div>

          <dl className="info-list" style={{ marginBottom: 32 }}>
            {(item.prefecture || item.city) && (<>
              <dt>所在地</dt>
              <dd>{item.prefecture}{item.city && ` ${item.city}`}</dd>
            </>)}
            {item.operator && (<>
              <dt>事業者</dt>
              <dd>{item.operator}</dd>
            </>)}
            {item.epc && (<>
              <dt>EPC</dt>
              <dd>{item.epc}</dd>
            </>)}
            {item.cod && (<>
              <dt>運転開始予定</dt>
              <dd>{item.cod}</dd>
            </>)}
            {item.marketParticipation && item.marketParticipation.length > 0 && (<>
              <dt>市場参加</dt>
              <dd>{item.marketParticipation.join(' / ')}</dd>
            </>)}
            {item.sourceUrl && (<>
              <dt>出典</dt>
              <dd>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {item.sourceUrl}
                </a>
              </dd>
            </>)}
          </dl>

          {item.body && (
            <section className="page-section">
              <h2>プロジェクト詳細</h2>
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </section>
          )}

          {/* 依頼Y: 関連事業者 */}
          {related.operators.length > 0 && (
            <section className="page-section">
              <h3 className="related-h3">関連事業者</h3>
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

          {/* 依頼Y: 関連ニュース */}
          {related.news.length > 0 && (
            <section className="page-section related-news-section">
              <h3 className="related-h3">関連ニュース</h3>
              <ul className="related-news-list">
                {related.news.map((n) => {
                  const dateStr = n.publishedAt
                    ? new Date(n.publishedAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                      })
                    : '';
                  const cat = (n.category && n.category[0]) || '';
                  return (
                    <li key={n.id} className="related-news-item">
                      <Link href={`/news/${n.slug}`}>
                        <span className="related-news-meta">
                          {cat && (
                            <span className="related-news-cat">{cat}</span>
                          )}
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

          {/* 依頼Y: 関連解説 */}
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

          {/* 依頼AA Phase 4: 接続変電所候補（半径10km、最大5件）
              緯度経度なし project または周辺に substation が無い場合 h3 ごと非表示 */}
          {nearbySubstations.length > 0 && (
            <section className="page-section">
              <h3 className="related-h3">接続変電所候補</h3>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 12 }}>
                {item.name} の半径 10km 以内に位置する変電所（距離が近い順、最大 5件）。
                ※ 緯度経度データがある変電所のみ表示しています。
              </p>
              <ul className="related-project-list">
                {nearbySubstations.map((s) => {
                  const meta: string[] = [];
                  if (s.voltage_primary_kv != null) meta.push(`${s.voltage_primary_kv}kV`);
                  if (s.cap_avail_mw != null) meta.push(`空容量 ${s.cap_avail_mw}MW`);
                  if (s.prefecture) meta.push(s.prefecture);
                  return (
                    <li key={s.slug} className="related-project-item">
                      <Link href={`/grid/${s.slug}`}>
                        <span className="related-project-name">{s.name}</span>
                        <span className="related-project-meta">
                          約 {s.distanceKm.toFixed(1)}km
                          {meta.length > 0 ? ' / ' + meta.join(' / ') : ''}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="page-section" style={{ background: 'var(--color-bg)', padding: 16, borderRadius: 8, fontSize: 13, color: 'var(--color-muted)' }}>
            <p style={{ margin: 0 }}>
              本ページは公開情報を構造化したものです。掲載企業の公式情報とは独立した情報として発信しています。
              掲載内容に関するご指摘は{' '}
              <a href="https://eic-jp.org/contact" target="_blank" rel="noopener noreferrer">
                お問い合わせ
              </a>{' '}
              よりご連絡ください。
            </p>
          </div>

          <p className="back-link">
            <Link href="/projects">← プロジェクトDBへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
