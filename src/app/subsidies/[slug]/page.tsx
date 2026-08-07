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
    alternates: { canonical: `/subsidies/${params.slug}` },
  };
}

// S2②（2026-08-08）: EV系2ページに事業用・系統用への分岐導線を上部表示
const EV_BRANCH_SLUGS = new Set<string>(['meti-cev-r7h', 'nev-portal']);

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

          {/* S2②: EV系ページの分岐導線（既存 page-meta パターン・1行） */}
          {EV_BRANCH_SLUGS.has(params.slug) && (
            <p className="page-meta" style={{ marginTop: 0, marginBottom: 12, paddingTop: 0, borderTop: 'none' }}>
              事業用・系統用蓄電池の補助金一覧はこちら →{' '}
              <Link href="/subsidies">補助金カレンダー</Link>
            </p>
          )}

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
            <p style={{ fontSize: 15, color: 'var(--color-muted)', margin: 0 }}>
              ⚠️ 公募期間・補助率・対象は変更される場合があります。応募前に必ず公式サイトで最新情報をご確認ください。
            </p>
          </div>

          {/* S2①: この制度の先へ（E1資産流用・静的リンクのみ＝ゼロfetch・行き先実在確認済 2026-08-08） */}
          <section className="page-section news-shelf">
            <h2 className="news-shelf-title">この制度の先へ</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted, #666)', margin: '4px 0 8px' }}>
              補助金の活用は、費用の内訳と収益構造をセットで確認すると判断しやすくなります。
            </p>
            <ul className="lv-invest-rows">
              <li><Link href="/explainer/subsidies-guide">解説: 蓄電池の補助金完全ガイド（経産省・エネ庁・自治体）</Link></li>
              <li><Link href="/lv/invest/missing-costs">低圧投資ガイド: シミュレーションに入っていないことが多い費用</Link></li>
              <li><Link href="/lv/invest/revenue-400-math">低圧投資ガイド: 年間400万円の売上なら、手元にいくら残る？</Link></li>
              <li><Link href="/tools/subsidy-match">補助金マッチング（事業条件から自動判定）</Link></li>
            </ul>
          </section>

          <p className="back-link">
            <Link href="/subsidies">← 補助金カレンダーへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
