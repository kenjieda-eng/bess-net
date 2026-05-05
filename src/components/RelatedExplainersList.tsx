/**
 * RelatedExplainersList.tsx
 * 関連解説のリスト表示。
 */
import Link from 'next/link';
import type { Explainer } from '@/lib/microcms';

export default function RelatedExplainersList({
  explainers,
  title = '関連解説',
}: {
  explainers: Explainer[];
  title?: string;
}) {
  if (!explainers || explainers.length === 0) return null;
  return (
    <section className="related-explainers-section">
      <h3 className="related-h3">{title}</h3>
      <ul className="related-explainer-list">
        {explainers.map((e) => (
          <li key={e.id} className="related-explainer-item">
            <Link href={`/explainer/${e.slug}`}>
              <span className="related-explainer-title">{e.title}</span>
              {e.lead && (
                <span className="related-explainer-lead">{e.lead}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
