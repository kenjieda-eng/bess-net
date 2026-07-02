// ニュース アーカイブ導線（カテゴリ別・年別ハブへの SSR クロスリンク）
// /news 一覧・各ハブページ 共通の Server Component。全リンクが SSR HTML に含まれる。
// 非ASCIIカテゴリのみ encodeURIComponent（href は Next のルート照合で二重エンコードされない）。
import Link from 'next/link';

type CatCount = { name: string; count: number };
type YearCount = { year: string; count: number };

type Props = {
  categories: CatCount[];
  years: YearCount[];
  currentCategory?: string;
  currentYear?: string;
};

export default function NewsArchiveNav({
  categories,
  years,
  currentCategory,
  currentYear,
}: Props) {
  return (
    <nav
      className="news-archive-nav"
      aria-label="ニュースアーカイブ（カテゴリ・年別）"
    >
      <div className="news-archive-nav-group">
        <span className="news-archive-nav-label">カテゴリ別</span>
        {categories.map((c) =>
          c.name === currentCategory ? (
            <span
              key={c.name}
              className="news-hub-chip is-current"
              aria-current="page"
            >
              {c.name}（{c.count}）
            </span>
          ) : (
            <Link
              key={c.name}
              href={`/news/category/${encodeURIComponent(c.name)}`}
              className="news-hub-chip"
            >
              {c.name}（{c.count}）
            </Link>
          )
        )}
      </div>
      <div className="news-archive-nav-group">
        <span className="news-archive-nav-label">年別</span>
        {years.map((y) =>
          y.year === currentYear ? (
            <span
              key={y.year}
              className="news-hub-chip is-current"
              aria-current="page"
            >
              {y.year}年（{y.count}）
            </span>
          ) : (
            <Link
              key={y.year}
              href={`/news/archive/${y.year}`}
              className="news-hub-chip"
            >
              {y.year}年（{y.count}）
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
