import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  getSubsidyBySlug,
  getAllSubsidySlugs,
} from '@/lib/microcms';
import subsidiesData from '@/data/subsidies.json';
import {
  getTodayJST,
  deriveSubsidyStatus,
  buildSubsidyTitle,
  buildSubsidyDescription,
  subsidyDisplayName,
  hasNoSchedule,
  SUBSIDY_POINTER_SLUGS,
  type SubsidyDateFacts,
} from '@/lib/subsidies-meta';

export const revalidate = 600;

/**
 * 状態の判定に使う日付は precompute 済みの subsidies.json から取る（S4・2026-08-09）。
 * runtime の microCMS レコードは deadline_iso / is_rolling を持たないため、
 * 生 status をそのまま出すと「締切超過なのに公募中」になり得る（L-EIC-027）。
 */
const DATE_FACTS: Record<string, SubsidyDateFacts> = Object.fromEntries(
  (subsidiesData as Array<Record<string, unknown>>).map((s) => [
    s.slug as string,
    {
      status: (s.status as string[]) ?? [],
      deadline_iso: (s.deadline_iso as string | null) ?? null,
      start_iso: (s.start_iso as string | null) ?? null,
      is_rolling: Boolean(s.is_rolling),
      deadline_raw: (s.deadline_raw as string | null) ?? null,
    },
  ])
);

function factsFor(slug: string, raw: { status?: string[] }): SubsidyDateFacts {
  return DATE_FACTS[slug] ?? { status: raw.status ?? [], deadline_iso: null, start_iso: null, is_rolling: false };
}

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
  // S4/S5(2026-08-09): 制度名を前に出し、状態（公募中・締切）を載せる。
  // サイト名は title 内に1回だけ入れるため titleTemplate を absolute で回避する。
  const today = getTodayJST();
  const facts = factsFor(params.slug, item);
  const title = buildSubsidyTitle(params.slug, item.name, facts, today);
  const description = buildSubsidyDescription(params.slug, item, facts, today);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/subsidies/${params.slug}` },
    openGraph: { title, description, type: 'article' },
  };
}

// S2②（2026-08-08）: EV系2ページに事業用・系統用への分岐導線を上部表示
// ⑦-3(2026-08-14): tokyo-ev-promotion も車両のみ（定置用蓄電池は対象外）のため分岐導線を表示
const EV_BRANCH_SLUGS = new Set<string>(['meti-cev-r7h', 'nev-portal', 'tokyo-ev-promotion']);

export default async function SubsidyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await getSubsidyBySlug(params.slug);
  if (!item) notFound();

  // 状態は日付から導出する（生 status は drift する・L-EIC-027）
  const today = getTodayJST();
  const facts = factsFor(params.slug, item);
  // Gr10-⑤(2026-08-11): 期日を一切持たないレコード（執行団体の紹介ページ等）は状態バッジを出さない。
  // 「随時〜事業により異なる」に「公募中」を付けるのは誤り。
  const noSchedule = hasNoSchedule(item, facts);
  const status = noSchedule ? '' : deriveSubsidyStatus(facts, today);
  const category = (item.category && item.category[0]) || '';
  // S5: 当サイトは公式サイトではないため、H1 の「◯◯公式サイト」表記を是正する
  const displayName = subsidyDisplayName(params.slug, item.name);
  const isPointer = SUBSIDY_POINTER_SLUGS.has(params.slug);

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

          <h1 className="page-title">{displayName}</h1>

          {/* S5: 出典が主のページは「当サイトは公式サイトではない」ことを本文で明示する */}
          {isPointer && (
            <p className="page-meta" style={{ marginTop: 0, marginBottom: 12 }}>
              本ページは蓄電所ネットによる制度メモです。申請要領・最新の公募情報は、下記の出典URL（運営団体の公式サイト）をご確認ください。
            </p>
          )}

          <div className="subsidy-status-badges">
            {status && (
              <span className={`badge badge-status-${status === '公募中' ? 'open' : status === '予告' ? 'upcoming' : 'closed'}`}>
                {status}
              </span>
            )}
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
