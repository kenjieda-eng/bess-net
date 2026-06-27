'use client';

/**
 * src/components/AnkenContactCTA.tsx
 *
 * /anken 系の「相談・問い合わせ」CTA。外部の eic-jp.org/contact へ誘導し、
 * クリックで GA4 イベント 'anken_contact_click'（location 別）を発火。
 * サーバーコンポーネントのページから差し込める唯一の client 部品。
 *
 * 法務: 蓄電所ネット（一般社団法人エネルギー情報センター）は中立的な
 *       情報提供／取り次ぎ／コンサル。媒介・代理はしない（本文は各ページ免責に記載）。
 */

import type { CSSProperties, ReactNode } from 'react';

const CONTACT_URL = 'https://eic-jp.org/contact';

export default function AnkenContactCTA({
  location,
  children,
  kind = 'primary',
  style,
}: {
  location: string; // 'hero' | 'buy' | 'sell' | 'flow' | 'faq' | 'footer' | ...
  children: ReactNode;
  kind?: 'primary' | 'light' | 'inline';
  style?: CSSProperties;
}) {
  const handleClick = () => {
    const w = window as { gtag?: (...a: unknown[]) => void };
    if (typeof window !== 'undefined' && w.gtag) {
      w.gtag('event', 'anken_contact_click', { location, link_url: CONTACT_URL });
    }
  };

  const base: CSSProperties =
    kind === 'inline'
      ? { color: 'var(--color-accent,#00B5A5)', fontWeight: 700, textDecoration: 'underline' }
      : {
          display: 'inline-block',
          padding: '12px 28px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          textDecoration: 'none',
          background: kind === 'primary' ? 'var(--color-accent,#00B5A5)' : '#fff',
          color: kind === 'primary' ? '#fff' : 'var(--color-navy,#0F2D4F)',
          border: kind === 'light' ? '1px solid var(--color-border)' : 'none',
        };

  return (
    <a
      href={CONTACT_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      style={{ ...base, ...style }}
    >
      {children}
    </a>
  );
}
