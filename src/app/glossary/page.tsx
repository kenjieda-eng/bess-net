import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import GlossaryBrowser from '@/components/GlossaryBrowser';
import { getAllGlossary } from '@/lib/microcms';

export const revalidate = 300; // 5分ごとに再生成

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）
  title: '用語集（業界辞典）',
  description:
    '系統用蓄電池および低圧リソース事業に関わる1,500+の業界用語を、12 カテゴリ・116 サブカテゴリの階層フィルタで検索可能な辞典。BESS、容量市場、需給調整市場、JEPX、託送、SOC、SOHなど、専門用語を一言定義と詳細解説で整備。',
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
            蓄電所事業に関わる業界用語 <strong>{items.length}語</strong> を、
            12 カテゴリ ＋ 116 サブカテゴリの階層フィルタで検索できます。
            URL パラメータでブックマーク・SNS 共有可能です。
          </p>

          {items.length === 0 ? (
            <p>用語はまだ準備中です。</p>
          ) : (
            // useSearchParams は CSR でのみ動作 → Suspense でラップ
            <Suspense fallback={<p>読み込み中...</p>}>
              <GlossaryBrowser items={items} />
            </Suspense>
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
