'use client';

// 全ページ共通のヘッダー（ナビゲーション付き）
// L-EIC-010 動線確認: Sprint X1 完走後の 8 LandingPage 入口確保のため
//   nav に「導入検討」「業界事業者向け」ドロップダウン追加
// モバイル（md未満）: ハンバーガーメニューで開閉（aria-expanded 対応）
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { useState, useEffect, useRef } from 'react';

const BUYER_DROPDOWN = [
  { label: 'これから参入する事業者', href: '/buyer/new-entry' },
  { label: '投資家・ファンド', href: '/buyer/investor' },
  { label: '土地保有者・地主', href: '/buyer/landowner' },
  { label: '工場・商業施設（自家消費）', href: '/buyer/factory-commercial' },
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
  onLinkClick,
}: {
  label: string;
  items: { label: string; href: string }[];
  accent: 'buyer' | 'seller';
  onLinkClick?: () => void;
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
                onClick={onLinkClick}
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
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Escape キーで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // メニュー外タップ/クリックで閉じる
  useEffect(() => {
    if (!menuOpen) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="site-header-inner">
        <Link href="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark"></span>
          蓄電所ネット
          <span className="brand-en">BESS NET / bess-net.jp</span>
        </Link>

        {/* ハンバーガーボタン（md未満のみ表示） */}
        <button
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav-menu"
          aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav
          id="site-nav-menu"
          className={`site-nav${menuOpen ? ' site-nav--open' : ''}`}
          aria-label="グローバルナビゲーション"
        >
          <ul>
            {siteConfig.nav
              .filter((item) => item.enabled)
              .map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={closeMenu}>
                    {item.label}
                    {item.href === '/anken' && (
                      <span style={{
                        marginLeft: 5,
                        fontSize: 10,
                        background: 'var(--color-accent,#00B5A5)',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: 3,
                        fontWeight: 700,
                        verticalAlign: 'middle',
                      }}>NEW</span>
                    )}
                  </Link>
                </li>
              ))}
            {/* Sprint X1 完走後の 8 LandingPage 動線確保 (L-EIC-010) */}
            <NavDropdown label="導入検討" items={BUYER_DROPDOWN} accent="buyer" onLinkClick={closeMenu} />
            <NavDropdown label="業界事業者向け" items={SELLER_DROPDOWN} accent="seller" onLinkClick={closeMenu} />
          </ul>
        </nav>
      </div>
    </header>
  );
}
