'use client';

// 全ページ共通のヘッダー（ナビゲーション付き）
// L-EIC-010 動線確認: Sprint X1 完走後の 8 LandingPage 入口確保のため
//   nav に「導入検討」「業界事業者向け」ドロップダウン追加
// モバイル（md未満）: ハンバーガーメニューで開閉（aria-expanded 対応）
import Link from 'next/link';
import { siteConfig, LV_NAV_LAUNCH_DATE } from '@/lib/site-config';
import { useState, useEffect, useRef } from 'react';

// 低圧クラスタ Stage1（2026-07-18）: /lv ナビの NEW バッジは公開日から30日のみコード導出（#108・手動撤去不要）
// Stage5: LV_NAV_LAUNCH_DATE はトップと共用のため site-config へ SSOT 化
const LV_NAV_IS_NEW = Date.now() - new Date(LV_NAV_LAUNCH_DATE).getTime() < 30 * 24 * 60 * 60 * 1000;

// 入口再設計2026-07-15: 「導入検討」「業界事業者向け」2メニュー→「はじめての方へ」1メニューへ統合
// （既存 buyer/seller 8ページは各LPの「さらに詳しく」経由に降格・ページ自体は存置）
const START_DROPDOWN = [
  // 8/12便C（2026-08-12）: 「蓄電所とは」導線1本のみ追加（手数据え置き）
  { label: '蓄電所とは', href: '/glossary/battery-storage-site' },
  { label: '買いたい・導入したい', href: '/start/buy' },
  { label: '売りたい・案件がある', href: '/start/sell' },
  { label: '事業として関わりたい', href: '/start/partner' },
  { label: '稼働中蓄電所のご紹介', href: '/info/operating-bess-introduction' },
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
                    {(item.href === '/anken' || (item.href === '/lv' && LV_NAV_IS_NEW)) && (
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
            {/* 入口再設計2026-07-15: 3分岐LP＋稼働中蓄電所ご紹介の統合メニュー */}
            <NavDropdown label="はじめての方へ" items={START_DROPDOWN} accent="buyer" onLinkClick={closeMenu} />
          </ul>
        </nav>
      </div>
    </header>
  );
}
