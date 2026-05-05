/**
 * RelatedOperatorBadges.tsx
 * 関連事業者のバッジ一覧表示。
 *
 * 入力：operators = [{ name, slug }]
 * 出力：事業者バッジのリスト（クリックで /operators/[slug] へ）
 */
import Link from 'next/link';

type OperatorLike = { name: string; slug: string };

export default function RelatedOperatorBadges({
  operators,
  title = '関連事業者',
}: {
  operators: OperatorLike[];
  title?: string;
}) {
  if (!operators || operators.length === 0) return null;
  return (
    <section className="related-operators-section">
      <h3 className="related-h3">{title}</h3>
      <ul className="related-operator-badges">
        {operators.map((o) => (
          <li key={o.slug}>
            <Link href={`/operators/${o.slug}`} className="related-operator-badge">
              {o.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
