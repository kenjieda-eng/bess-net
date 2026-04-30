// 全ページ共通のヘッダー（ナビゲーション付き）
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark"></span>
          蓄電所ネット
          <span className="brand-en">BESS NET / bess-net.jp</span>
        </Link>
        <nav className="site-nav" aria-label="グローバルナビゲーション">
          <ul>
            {siteConfig.nav
              .filter((item) => item.enabled)
              .map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
