import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="not-found">
        <div className="not-found-inner">
          <div className="not-found-code">404</div>
          <h1 className="not-found-title">お探しのページは見つかりませんでした</h1>
          <p className="not-found-desc">
            URLが変更されたか、削除された可能性があります。以下から目的のページへお進みください。
          </p>
          <div className="not-found-links">
            <Link href="/" className="btn-primary">
              トップへ戻る
            </Link>
            <Link href="/explainer" className="btn-secondary">
              解説記事を見る
            </Link>
            <Link href="/glossary" className="btn-secondary">
              用語集を見る
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
