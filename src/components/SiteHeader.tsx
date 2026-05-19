// 全ページ共通のヘッダー（ナビゲーション付き）
// L-EIC-010 動線確認: Sprint X1 完走後の 8 LandingPage 入口確保のため
//   nav に「導入検討」「業界事業者向け」ドロップダウン追加 (Server Component 維持)
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

const BUYER_DROPDOWN = [
  { label: '工場・商業施設', href: '/buyer/factory-commercial' },
  { label: '容量市場参加検討', href: '/buyer/capacity-market' },
  { label: '需給調整市場参加検討', href: '/buyer/balancing-market' },
  { label: 'PPA・オフテイク契約', href: '/buyer/ppa-offtake' },
];

const SELLER_DROPDOWN = [
  { label: 'メーカー', href: '/seller/manufacturer' },
  { label: 'EPC 事業者', href: '/seller/epc' },
  { label: 'プロジェクトデベロッパー', href: '/seller/developer' },
  { label: '中古売買・リユース', href: '/seller/reuse-secondhand' },
];

function NavDropdown({
  label,
  items,
  accent,
}: {
  label: string;
  items: { label: string; href: string }[];
  accent: 'buyer' | 'seller';
}) {
  const accentColor = accent === 'buyer' ? '#1e40af' : '#a16207';
  return (
    <li style={{ position: 'relative' }}>
      <details style={{ display: 'inline-block' }}>
        <summary
          style={{
            cursor: 'pointer',
            listStyle: 'none',
            padding: '0',
            display: 'inline-block',
          }}
        >
          {label} ▾
        </summary>
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            minWidth: 240,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: 8,
            margin: 0,
            listStyle: 'none',
            zIndex: 50,
          }}
        >
          {items.map((item) => (
            <li key={item.href} style={{ margin: 0 }}>
              <Link
                href={item.href}
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  borderRadius: 4,
                  fontSize: 14,
                  color: accentColor,
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

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
            {/* Sprint X1 完走後の 8 LandingPage 動線確保 (L-EIC-010) */}
            <NavDropdown label="導入検討" items={BUYER_DROPDOWN} accent="buyer" />
            <NavDropdown label="業界事業者向け" items={SELLER_DROPDOWN} accent="seller" />
          </ul>
        </nav>
      </div>
    </header>
  );
}
