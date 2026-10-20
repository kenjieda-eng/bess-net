// ExplainerNextStepBlock — 解説記事末尾の文脈誘導ブロック「この解説の先へ」（E1・2026-08-05）
// NewsNextStepBlock と同型のサーバーコンポーネント（追加フェッチ 0・初期DOM #107・.lv-invest-rows 流用）。
// excludeHrefs: ページ上の既存CTA（/grid・ツール・政策カレンダー等）と行き先が重複する行を自動省略。
import Link from 'next/link';
import { explainerNextStepView, type RelatedExplainerEntry } from '@/lib/explainer-next-step';

export default function ExplainerNextStepBlock({
  slug,
  title,
  category,
  lead,
  body,
  related,
  excludeHrefs,
}: {
  slug: string;
  title: string;
  category?: string[] | null;
  lead?: string | null;
  body?: string | null;
  related: RelatedExplainerEntry[];
  excludeHrefs?: string[];
}) {
  // 行の組み立て（判定の文字・分類・スターCTA・重複の省略）は explainerNextStepView に 1 つだけ置く。
  // 運営元からのご案内（NextStepBox）の判定も同じ結果を使う（次の一歩便・2026-10-20）
  void body;
  const group = explainerNextStepView({ slug, title, category, lead, related, excludeHrefs });
  const links = group.links;
  if (links.length === 0) return null;

  return (
    <section className="page-section news-shelf">
      <h2 className="news-shelf-title">この解説の先へ</h2>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted, #666)', margin: '4px 0 8px' }}>
        {group.lead}
      </p>
      <ul className="lv-invest-rows">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.star ? `★ ${l.label}` : l.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
