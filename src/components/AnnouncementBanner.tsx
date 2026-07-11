'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_ANNOUNCEMENTS, type SiteAnnouncement } from '@/data/site-announcements';

function getActiveAnnouncement(): SiteAnnouncement | null {
  // JST (UTC+9) の日付文字列と比較
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const active = SITE_ANNOUNCEMENTS
    .filter((a) => a.enabled && a.startAt <= jstDate && jstDate <= a.endAt)
    .sort((a, b) => b.priority - a.priority);
  return active[0] ?? null;
}

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const announcement = getActiveAnnouncement();
  const announcementId = announcement?.id ?? null;

  // hooks は必ず条件分岐の前に置く
  useEffect(() => {
    setMounted(true);
    // ×で閉じたら sessionStorage でそのセッション中のみ非表示（翌訪問では再表示・2026-07-12）。
    // SSR/初回クライアント描画は常に表示＝hydration mismatch なし（mounted ガード）
    if (!announcementId || !announcement?.dismissible) return;
    if (sessionStorage.getItem(`bess-banner-dismissed-${announcementId}`) === '1') {
      setDismissed(true);
    }
  }, [announcementId, announcement?.dismissible]);

  if (!announcement) return null;
  if (announcement.dismissible && mounted && dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(`bess-banner-dismissed-${announcement.id}`, '1');
  };

  if (announcement.variant === 'bar') {
    return (
      <div
        role="region"
        aria-label="お知らせ"
        // sticky: スクロール中も最上部に表示（文書フロー内＝CLS なし）。
        // zIndex 45 = 本文より上・SiteHeader のメニューオーバーレイ(50)より下
        style={{ background: 'var(--color-navy)', position: 'sticky', top: 0, zIndex: 45 }}
        className="w-full text-white text-sm"
      >
        <Link
          href={announcement.href}
          className="mx-auto block max-w-6xl px-4 py-1.5 text-center text-white no-underline hover:underline"
          style={{ paddingRight: announcement.dismissible ? '48px' : undefined }}
        >
          <span className="font-bold" style={{ color: 'var(--color-accent)' }}>
            <span className="hidden sm:inline">{announcement.title}</span>
            <span className="sm:hidden">{announcement.titleShort ?? announcement.title}</span>
          </span>
          {announcement.ctaText && <span>　{announcement.ctaText}</span>}
        </Link>
        {announcement.dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="告知を閉じる"
            style={{
              position: 'absolute',
              top: '50%',
              right: 12,
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.65)',
              fontSize: 20,
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  }

  // variant === 'box'（既定）
  return (
    <div
      role="region"
      aria-label="お知らせ"
      style={{
        background: '#0F2D4F',
        borderBottom: '2px solid #F59E0B',
        padding: '14px 16px',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          paddingRight: announcement.dismissible ? 40 : 0,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.5,
            marginBottom: 4,
          }}
        >
          {announcement.title}
        </div>
        {announcement.subtitle && (
          <div
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
              marginBottom: 4,
            }}
          >
            {announcement.subtitle}
          </div>
        )}
        {announcement.dateLabel && (
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              marginBottom: 12,
            }}
          >
            {announcement.dateLabel}
          </div>
        )}
        <Link
          href={announcement.href}
          style={{
            display: 'inline-block',
            background: '#F59E0B',
            color: '#0F2D4F',
            padding: '8px 20px',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {announcement.ctaText}
        </Link>
      </div>
      {announcement.dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="告知を閉じる"
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.65)',
            fontSize: 24,
            lineHeight: 1,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
