import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import GlossarySearch from '@/components/GlossarySearch';
import { getAllGlossary } from '@/lib/microcms';

export const revalidate = 300; // 5分ごとに再生成

export const metadata: Metadata = {
  title: '用語集（業界辞典）',
  description:
    '系統用蓄電池および低圧リソース事業に関わる業界用語の解説辞典。BESS、容量市場、需給調整市場、JEPX、託送、SOC、SOHなど、専門用語を一言定義と詳細解説で整備。',
};

export default async function GlossaryListPage() {
  const items = await getAllGlossary();

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
            蓄電所事業に関わる業界用語を、一言定義と詳細解説で整備しています。
          </p>

          {items.length === 0 ? (
            <p>用語はまだ準備中です。</p>
          ) : (
            <GlossarySearch items={items} />
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
