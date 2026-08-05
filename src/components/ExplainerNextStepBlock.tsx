// ExplainerNextStepBlock — 解説記事末尾の文脈誘導ブロック「この解説の先へ」（E1・2026-08-05）
// NewsNextStepBlock と同型のサーバーコンポーネント（追加フェッチ 0・初期DOM #107・.lv-invest-rows 流用）。
// excludeHrefs: ページ上の既存CTA（/grid・ツール・政策カレンダー等）と行き先が重複する行を自動省略。
import Link from 'next/link';
import {
  classifyExplainerNextStep,
  EXPLAINER_STAR_CTAS,
  type RelatedExplainerEntry,
} from '@/lib/explainer-next-step';

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
  // 判定は title＋category＋lead のみ（主題を表す部分）。長文 body まで含めると
  // 教科書型記事は必ずどこかで市場/制度語に触れるため ⑤技術が発火しなくなる（2026-08-05 実測で調整）。
  const text = `${title}\n${(category || []).join(' ')}\n${lead ?? ''}`;
  void body;
  const group = classifyExplainerNextStep(text, related);
  const exclude = new Set(excludeHrefs ?? []);

  // E4 スターCTA（TOP10・1本）— E1系統の行き先・既存CTAと重複しない場合のみ先頭に追加
  const star = EXPLAINER_STAR_CTAS[slug];
  const groupHrefs = new Set(group.links.map((l) => l.href));
  const links = [
    ...(star && !exclude.has(star.href) && !groupHrefs.has(star.href) ? [{ ...star, star: true }] : []),
    ...group.links.filter((l) => !exclude.has(l.href)).map((l) => ({ ...l, star: false })),
  ];
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
