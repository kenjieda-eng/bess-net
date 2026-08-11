/**
 * OperatorCategoryList.tsx — Op4①②（2026-08-12）
 * 事業者カテゴリ別一覧（/operators/makers・/operators/aggregators）の共通描画。
 *
 * - データは precompute（operators-category-index.json）のみ＝実行時 fetch ゼロ（鉄則 #2/#3）
 * - 並び順は掲載案件数の降順 → 五十音（事実指標のみ。「ランキング」という語は使わない
 *   ＝editorial 判断を含む序列を名乗らない）
 * - 網羅を主張しない（冒頭の1文で明示）
 * - 有料掲載・広告枠は設けない（恒久方針）
 */
import Link from 'next/link';

export type CategoryRow = {
  slug: string;
  name: string;
  projects: number;
  involved: number;
};

export default function OperatorCategoryList({ rows }: { rows: CategoryRow[] }) {
  return (
    <>
      <p className="grid-source-note" style={{ margin: '0 0 16px' }}>
        蓄電所ネットのニュース・プロジェクトDBに登場した事業者を、編集部がカテゴリ整理して掲載しています（網羅を保証するものではありません）。
      </p>
      <div className="grid-table-wrap">
        <table className="grid-table">
          <thead>
            <tr>
              <th>社名</th>
              <th className="num">掲載案件数（保有・開発）</th>
              <th className="num">関与件数</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td>
                  <Link href={`/operators/${r.slug}`}>{r.name}</Link>
                </td>
                <td className="num">{r.projects > 0 ? `${r.projects}件` : '—'}</td>
                <td className="num">{r.involved > 0 ? `${r.involved}件` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="grid-source-note" style={{ marginTop: 12 }}>
        掲載案件数＝プロジェクトDBで事業者欄に登場する件数（保有・開発）。関与件数＝オフテイク・運用受託・EPC・機器供給・出資などの役割が一次情報から特定できた件数。詳細は各社ページをご覧ください。
      </p>
    </>
  );
}

/** 掲載案件数の降順 → 五十音（日本語ロケール） */
export function sortCategoryRows(rows: CategoryRow[]): CategoryRow[] {
  return [...rows].sort(
    (a, b) => b.projects - a.projects || a.name.localeCompare(b.name, 'ja')
  );
}
