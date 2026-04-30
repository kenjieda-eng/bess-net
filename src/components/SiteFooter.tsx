// 全ページ共通のフッター
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-org">
          <div className="site-footer-org-name">{siteConfig.organization.name}</div>
          <div className="site-footer-org-meta">
            運営：
            <a
              href={siteConfig.organization.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {siteConfig.organization.url}
            </a>
          </div>
        </div>

        <nav className="site-footer-nav" aria-label="フッターナビゲーション">
          <ul>
            {siteConfig.footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            <li>
              <a
                href={siteConfig.organization.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                お問い合わせ
              </a>
            </li>
          </ul>
        </nav>

        <div className="site-footer-bottom">
          <div>© 2026 {siteConfig.name}（bess-net.jp）</div>
          <div className="site-footer-meta">
            運営：{siteConfig.organization.name}
          </div>
        </div>
      </div>
    </footer>
  );
}
