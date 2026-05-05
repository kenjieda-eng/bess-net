/**
 * RelatedTermBadges.tsx
 * 関連用語のバッジ一覧表示。
 *
 * 入力：terms = [{ term, slug }]
 * 出力：用語バッジのリスト（クリックで /glossary/[slug] へ）
 */
import Link from 'next/link';

type TermLike = { term: string; slug: string };

export default function RelatedTermBadges({
  terms,
  title = '関連用語',
}: {
  terms: TermLike[];
  title?: string;
}) {
  if (!terms || terms.length === 0) return null;
  return (
    <section className="related-terms-section">
      <h3 className="related-h3">{title}</h3>
      <ul className="related-term-badges">
        {terms.map((t) => (
          <li key={t.slug}>
            <Link href={`/glossary/${t.slug}`} className="related-term-badge">
              {t.term}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
