// GlossaryNextStepBlock — 用語ページ末尾の文脈誘導ブロック「この用語の先へ」（G1/G4・2026-08-05）
// E1/N1 と同型のサーバーコンポーネント。データは既存 precompute index の値をそのまま受け取る
// （追加フェッチ 0・SSG）。関連用語は curated（手作業 relatedTerms）優先＋sameCategoryTerms で
// 4〜6件に補完（自己除外・ブロック内 dedup）。G4 ★CTA は G1 ルーティングと href 重複時に自動省略。
import Link from 'next/link';
import {
  glossaryRouteFor,
  GLOSSARY_STAR_CTAS,
  type GlossaryNextStepLink,
} from '@/lib/glossary-next-step';

type TermLite = { term: string; slug: string };

export default function GlossaryNextStepBlock({
  slug,
  category,
  curatedTerms,
  sameCategoryTerms,
  firstExplainer,
}: {
  slug: string;
  category?: string[];
  curatedTerms: TermLite[];
  sameCategoryTerms: TermLite[];
  firstExplainer?: { slug: string; title: string };
}) {
  // 関連用語 4〜6: curated（手作業）優先 → sameCategory で補完。自己・重複除外、上限6。
  const seen = new Set<string>([slug]);
  const terms: TermLite[] = [];
  for (const t of [...curatedTerms, ...sameCategoryTerms]) {
    if (seen.has(t.slug)) continue;
    seen.add(t.slug);
    terms.push(t);
    if (terms.length >= 6) break;
  }

  const route = glossaryRouteFor(category, firstExplainer);
  const star = GLOSSARY_STAR_CTAS[slug];
  const routeHrefs = new Set(route.links.map((l) => l.href));
  const links: (GlossaryNextStepLink & { star?: boolean })[] = [
    ...(star && !routeHrefs.has(star.href) ? [{ ...star, star: true }] : []),
    ...route.links,
  ];

  if (terms.length === 0 && links.length === 0) return null;

  return (
    <section className="page-section news-shelf">
      <h2 className="news-shelf-title">この用語の先へ</h2>
      {terms.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 12px' }}>
          {terms.map((t) => (
            <Link
              key={t.slug}
              href={`/glossary/${t.slug}`}
              style={{ padding: '4px 10px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 15, color: 'var(--color-accent, #0066cc)', textDecoration: 'none' }}
            >
              {t.term}
            </Link>
          ))}
        </div>
      )}
      <p style={{ fontSize: 14, color: 'var(--color-text-muted, #666)', margin: '4px 0 8px' }}>
        {route.lead}
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
