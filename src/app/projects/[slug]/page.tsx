import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getProjectBySlug, getAllProjectSlugs } from '@/lib/microcms';

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

  return (
    <>
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
                dangerouslySetInnerHTML={{ __html: item.body }}
              />
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
