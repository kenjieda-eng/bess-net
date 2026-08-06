import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import GlossaryBrowser from '@/components/GlossaryBrowser';
import { getGlossaryHubList } from '@/lib/microcms';
import { GLOSSARY_DISPLAY_EXCLUDED_SLUGS } from '@/lib/glossary-301';
import { GLOSSARY_TOP20_SLUGS } from '@/lib/glossary-next-step';

export const revalidate = 300; // 5分ごとに再生成

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）
  title: '系統用蓄電池 用語集｜1,500語超の業界辞典',
  description:
    '系統用蓄電池および低圧リソース事業に関わる1,500+の業界用語を、12 カテゴリ・116 サブカテゴリの階層フィルタで検索可能な辞典。BESS、容量市場、需給調整市場、JEPX、託送、SOC、SOHなど、専門用語を一言定義と詳細解説で整備。',
  alternates: { canonical: '/glossary' },
  openGraph: {
    title: '系統用蓄電池 用語集｜1,500語超の業界辞典 | bess-net',
    description: '系統用蓄電池・低圧リソース事業の1,500+業界用語を12カテゴリ・116サブカテゴリで検索。BESS・容量市場・需給調整市場・JEPX・SOC/SOH等を一言定義と詳細解説で整備。',
    type: 'website',
    url: 'https://bess-net.jp/glossary',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default async function GlossaryListPage() {
  // Stage5: 表示系完全除外slug（低圧リソース重複解消）を一覧からも除去（定数1箇所管理）
  // C軽量化(2026-08-07): Browser使用フィールドのみのLite取得（detail等の未使用長文をflightから排除・#103全語DOMは不変）
  const items = (await getGlossaryHubList()).filter((g) => !GLOSSARY_DISPLAY_EXCLUDED_SLUGS.has(g.slug));

  // G2: よく引かれる用語（TOP20・定数順。GA4上位で四半期ごとに glossary-next-step.ts を手動更新）
  const bySlug = new Map(items.map((g) => [g.slug, g]));
  const topTerms = GLOSSARY_TOP20_SLUGS.map((s) => bySlug.get(s)).filter(
    (g): g is NonNullable<typeof g> => Boolean(g)
  );
  const topShelf =
    topTerms.length > 0 ? (
      <section className="page-section news-shelf" style={{ margin: '16px 0 20px' }}>
        <h2 className="news-shelf-title" style={{ fontSize: 17 }}>よく引かれる用語</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {topTerms.map((g) => (
            <Link
              key={g.slug}
              href={`/glossary/${g.slug}`}
              style={{ padding: '4px 10px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 15, color: 'var(--color-accent, #0066cc)', textDecoration: 'none' }}
            >
              {g.term}
            </Link>
          ))}
        </div>
      </section>
    ) : null;

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
            蓄電所事業に関わる業界用語 <strong>{items.length}語</strong> を、
            12 カテゴリ ＋ 116 サブカテゴリの階層フィルタで検索できます。
            URL パラメータでブックマーク・SNS 共有可能です。
          </p>

          {items.length === 0 ? (
            <p>用語はまだ準備中です。</p>
          ) : (
            // SSR で全 1,516 件描画 (SEO 上重要)、
            // URL params は GlossaryBrowser の mount 時に window.location から復元
            <GlossaryBrowser items={items} topShelf={topShelf} />
          )}

          <p className="back-link" style={{ marginTop: 48 }}>
            <Link href="/">← トップへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
