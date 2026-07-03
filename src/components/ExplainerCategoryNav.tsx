// 解説記事 カテゴリ別SSRハブへのクロスリンク（Server Component）
// /explainer 一覧・各ハブページ共用。全リンクが SSR HTML に含まれる（クローラが辿れる）。
// NewsArchiveNav（/news ハブ・commit a20958d）の explainer 版。スタイルは汎用ハブ用を再利用。
import Link from 'next/link';

type GroupCount = { name: string; count: number };

type Props = {
  groups: GroupCount[];
  currentGroup?: string;
};

export default function ExplainerCategoryNav({ groups, currentGroup }: Props) {
  return (
    <nav
      className="news-archive-nav"
      aria-label="解説記事カテゴリ別アーカイブ"
    >
      <div className="news-archive-nav-group">
        <span className="news-archive-nav-label">カテゴリ別</span>
        {groups.map((g) =>
          g.name === currentGroup ? (
            <span
              key={g.name}
              className="news-hub-chip is-current"
              aria-current="page"
            >
              {g.name}（{g.count}）
            </span>
          ) : (
            <Link
              key={g.name}
              href={`/explainer/category/${encodeURIComponent(g.name)}`}
              className="news-hub-chip"
            >
              {g.name}（{g.count}）
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
