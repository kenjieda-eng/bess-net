/**
 * RelatedProjectsList.tsx
 * 関連プロジェクトのリスト表示。
 */
import Link from 'next/link';
import type { Project } from '@/lib/microcms';

export default function RelatedProjectsList({
  projects,
  title = '関連プロジェクト',
}: {
  projects: Project[];
  title?: string;
}) {
  if (!projects || projects.length === 0) return null;
  return (
    <section className="related-projects-section">
      <h3 className="related-h3">{title}</h3>
      <ul className="related-project-list">
        {projects.map((p) => {
          const meta: string[] = [];
          if (p.outputMw) meta.push(`${p.outputMw}MW`);
          if (p.capacityMwh) meta.push(`${p.capacityMwh}MWh`);
          if (p.prefecture) meta.push(p.prefecture);
          return (
            <li key={p.id} className="related-project-item">
              <Link href={`/projects/${p.slug}`}>
                <span className="related-project-name">{p.name}</span>
                {meta.length > 0 && (
                  <span className="related-project-meta">{meta.join(' / ')}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
