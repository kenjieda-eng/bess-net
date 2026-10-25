/**
 * 詳細ページの「公開日・更新日」（日付表示便・2026-10-25）。題名の下に 1 行で出す。
 * 日付の作り方（publishedAt／revisedAt・JST の暦日・同じ日なら更新日を出さない）は src/lib/page-dates.ts。
 * そのページに訂正履歴の記録があれば、行末に記事末の訂正履歴（CorrectionHistory の #correction-history）へのページ内リンクを付ける。
 */
import { correctionsForPath } from '@/lib/corrections';
import { jaDayLabel, pageDateDays } from '@/lib/page-dates';

export default function PageDates({ publishedAt, revisedAt, path }: { publishedAt?: string | null; revisedAt?: string | null; path: string }) {
  const { published, revised } = pageDateDays(publishedAt, revisedAt);
  const hasCorrections = correctionsForPath(path).length > 0;
  if (!published && !revised && !hasCorrections) return null;
  return (
    <p className="page-dates" style={{ fontSize: 13, color: 'var(--color-muted)', margin: '4px 0 12px', lineHeight: 1.7, display: 'flex', flexWrap: 'wrap', columnGap: 12 }}>
      {published && <span>{`公開日 ${jaDayLabel(published)}`}</span>}
      {revised && <span>{`更新日 ${jaDayLabel(revised)}`}</span>}
      {hasCorrections && (
        <a href="#correction-history" style={{ color: 'var(--color-accent)' }}>{'訂正履歴を見る'}</a>
      )}
    </p>
  );
}
