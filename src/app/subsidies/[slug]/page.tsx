import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  getSubsidyBySlug,
  getAllSubsidySlugs,
} from '@/lib/microcms';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return await getAllSubsidySlugs();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const item = await getSubsidyBySlug(params.slug);
  if (!item) return {};
  return {
    title: item.name,
    description: `${item.organization}が執行する蓄電池関連補助金「${item.name}」の概要。${item.targetEntity ?? ''}`,
  };
}

export default async function SubsidyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await getSubsidyBySlug(params.slug);
  if (!item) notFound();

  const status = (item.status && item.status[0]) || 'その他';
  const category = (item.category && item.category[0]) || '';

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/subsidies">補助金カレンダー</Link>
            {category && ` / ${category}`}
          </p>

          <h1 className="page-title">{item.name}</h1>

          <div className="subsidy-status-badges">
            <span className={`badge badge-status-${status === '公募中' ? 'open' : status === '予告' ? 'upcoming' : 'closed'}`}>
              {status}
            </span>
            {category && <span className="badge badge-category">{category}</span>}
          </div>

          <dl className="info-list" style={{ marginBottom: 32 }}>
            <dt>執行機関</dt>
            <dd>{item.organization}</dd>
            {item.targetEntity && (<>
              <dt>対象事業者</dt>
              <dd>{item.targetEntity}</dd>
            </>)}
            {item.subsidyRate && (<>
              <dt>補助率</dt>
              <dd>{item.subsidyRate}</dd>
            </>)}
            {item.upperLimit && (<>
              <dt>上限額</dt>
              <dd>{item.upperLimit}</dd>
            </>)}
            {(item.applicationStart || item.deadline) && (<>
              <dt>公募期間</dt>
              <dd>
                {item.applicationStart || '—'} 〜 {item.deadline || '—'}
              </dd>
            </>)}
            {item.fiscalYear && (<>
              <dt>年度</dt>
              <dd>{item.fiscalYear}</dd>
            </>)}
            {item.sourceUrl && (<>
              <dt>出典URL</dt>
              <dd>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {item.sourceUrl}
                </a>
              </dd>
            </>)}
          </dl>

          {item.scheme && (
            <section className="page-section">
              <h2>仕組み概要</h2>
              <p>{item.scheme}</p>
            </section>
          )}

          {item.body && (
            <section className="page-section">
              <h2>詳細</h2>
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: item.body }}
              />
            </section>
          )}

          <div className="page-section" style={{ background: '#FFF8E1', padding: 16, borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
              ⚠️ 公募期間・補助率・対象は変更される場合があります。応募前に必ず公式サイトで最新情報をご確認ください。
            </p>
          </div>

          <p className="back-link">
            <Link href="/subsidies">← 補助金カレンダーへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
