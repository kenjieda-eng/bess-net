import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllGlossary, type Glossary } from '@/lib/microcms';

export const revalidate = 300; // 5分ごとに再生成

export const metadata: Metadata = {
  title: '用語集（業界辞典）',
  description:
    '系統用蓄電池および低圧リソース事業に関わる業界用語の解説辞典。BESS、容量市場、需給調整市場、JEPX、託送、SOC、SOHなど、専門用語を一言定義と詳細解説で整備。',
};

// カテゴリの表示順
const CATEGORY_ORDER = [
  '基礎',
  '市場制度',
  '系統連系',
  '技術',
  'EPC',
  'O&M',
  '事業',
  '土地',
  '安全',
  '法務',
  '補助金',
  '海外',
  'その他',
];

function groupByCategory(items: Glossary[]) {
  const groups: Record<string, Glossary[]> = {};
  for (const item of items) {
    const cat = (item.category && item.category[0]) || 'その他';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  // カテゴリ順 → 残りを後ろに
  const ordered: Array<{ category: string; items: Glossary[] }> = [];
  for (const cat of CATEGORY_ORDER) {
    if (groups[cat]) {
      ordered.push({ category: cat, items: groups[cat] });
      delete groups[cat];
    }
  }
  for (const cat of Object.keys(groups)) {
    ordered.push({ category: cat, items: groups[cat] });
  }
  return ordered;
}

export default async function GlossaryListPage() {
  const items = await getAllGlossary();
  const grouped = groupByCategory(items);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 用語集
          </p>
          <div className="section-label">Glossary</div>
          <h1 className="section-title">用語集（業界辞典）</h1>
          <p className="section-desc" style={{ marginBottom: 32 }}>
            蓄電所事業に関わる業界用語を、一言定義と詳細解説で整備しています。掲載：{items.length}語
          </p>

          {/* カテゴリ目次 */}
          {grouped.length > 1 && (
            <div className="glossary-toc">
              {grouped.map((g) => (
                <a key={g.category} href={`#cat-${encodeURIComponent(g.category)}`}>
                  {g.category}
                  <span className="glossary-toc-count">（{g.items.length}）</span>
                </a>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <p>用語はまだ準備中です。</p>
          ) : (
            grouped.map((g) => (
              <section
                key={g.category}
                id={`cat-${encodeURIComponent(g.category)}`}
                className="glossary-category-section"
              >
                <h2 className="glossary-category-title">
                  {g.category}（{g.items.length}）
                </h2>
                <ul className="glossary-list">
                  {g.items.map((item) => (
                    <li key={item.id}>
                      <Link href={`/glossary/${item.slug}`} className="glossary-card">
                        <div className="glossary-card-term">{item.term}</div>
                        {item.reading && (
                          <div className="glossary-card-reading">{item.reading}</div>
                        )}
                        <div className="glossary-card-def">{item.shortDef}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          <p className="back-link">
            <Link href="/">← トップへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
