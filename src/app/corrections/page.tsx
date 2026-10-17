/**
 * /corrections — 訂正履歴（訂正履歴便・2026-10-16）
 *
 * 編集方針（/editorial-policy）の「何を、いつ訂正したかを記事末「訂正履歴」に残します」の一覧。
 * - データは src/data/corrections.json（src/lib/corrections.ts を通して読む）。force-static・外部取得 0。
 * - 新しい順。種類（訂正／表示の停止／表示の再開）と対象で絞り込み（client・URL は replaceState）。全件を初期 DOM に載せる（#107）。
 * - 対象が表示中ならリンク、止めているものは題名だけ。
 * - JSON-LD は付けない（便の指定）。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CorrectionsList, { type CorrectionRowView } from '@/components/CorrectionsList';
import { CORRECTIONS, CORRECTIONS_SINCE, CORRECTION_KINDS, CORRECTION_TARGETS, correctionDateLabel, isTargetShown, targetOf } from '@/lib/corrections';

export const dynamic = 'force-static';

const PAGE_PATH = '/corrections';
const LEAD = `当サイトの編集方針にもとづき、事実と異なる記述を訂正したもの・表示を止めたものを記録しています（${correctionDateLabel(CORRECTIONS_SINCE)}以降）。`;

export const metadata: Metadata = {
  title: '訂正履歴',
  description: '蓄電所ネットが事実と異なる記述を一次に合わせて訂正したもの・表示を止めたもの・表示を戻したものの記録。日付・直す前と後・一次の資料を載せています。',
  alternates: { canonical: PAGE_PATH },
};

export default function CorrectionsPage() {
  const rows: CorrectionRowView[] = CORRECTIONS.map((c) => ({
    id: c.id,
    dateLabel: correctionDateLabel(c.date),
    kind: c.kind,
    target: targetOf(c.path),
    path: c.path,
    title: c.targetTitle,
    linkable: c.kind !== '表示の停止' && isTargetShown(c),
    before: c.before,
    after: c.after,
    basis: c.basis,
  }));
  const counts = CORRECTION_KINDS.map((k) => `${k} ${CORRECTIONS.filter((c) => c.kind === k).length} 件`).join('・');
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/editorial-policy">編集方針</Link> / 訂正履歴
          </p>
          <h1 className="page-title">訂正履歴</h1>
          <p className="page-lead">{LEAD}</p>
          <p style={{ fontSize: 15, lineHeight: 1.8, margin: '0 0 12px' }}>
            {`載せているのは、当サイトの記述が一次の資料と異なっていて一次に合わせて直したもの（訂正）、表示を止めたもの（表示の停止）、止めていた表示を戻したもの（表示の再開）です。公表後の新しい情報による更新（締切や公募の情報の追随・新しいデータの取り込み）は載せていません。日付は本番のページに反映された日です。いま ${CORRECTIONS.length} 件（${counts}）。各ページの記事末にも、そのページの記録を「訂正履歴」として載せています。`}
          </p>
          <CorrectionsList rows={rows} kinds={CORRECTION_KINDS} targets={CORRECTION_TARGETS} />
          <p style={{ fontSize: 14, lineHeight: 1.8, marginTop: 20 }}>
            {'訂正の方針は '}
            <Link href="/editorial-policy" style={{ color: 'var(--color-accent)' }}>{'編集方針'}</Link>
            {' の「訂正・削除ポリシー」をご覧ください。'}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
