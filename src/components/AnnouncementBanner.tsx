'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_ANNOUNCEMENTS } from '@/data/site-announcements';
import { selectActiveAnnouncement, toJstDate } from '@/lib/announcement-schedule';

/**
 * @param renderedJstDate サーバがこのページを描画した日（JST・YYYY-MM-DD）。layout が渡す。
 *   静的ページの HTML はビルド時に焼かれ、次のビルドまで同じものが配られる。初回のクライアント描画を
 *   この日で選べば HTML と一致する（hydration 失敗を起こさない）。閲覧日での選び直しはマウント後に行う。
 *   ★これが無いと、startAt・endAt を跨いだ閲覧（例: 10/14 ビルドの HTML を 10/15 に閲覧）で
 *     サーバとクライアントの選ぶ告知が食い違う（An-1・2026-09-21）。
 */
export function AnnouncementBanner({ renderedJstDate }: { renderedJstDate?: string }) {
  const [jstDate, setJstDate] = useState<string>(() => renderedJstDate ?? toJstDate(new Date()));
  // 閉じた告知の id（真偽値でなく id で持つ: 告知が入れ替わった直後に前の告知の「閉じた」を引き継がない）
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const announcement = selectActiveAnnouncement(SITE_ANNOUNCEMENTS, jstDate);
  const announcementId = announcement?.id ?? null;

  // hooks は必ず条件分岐の前に置く
  useEffect(() => {
    // 閲覧日で選び直す（サーバの描画日と同じなら変化なし）
    setJstDate(toJstDate(new Date()));
    setMounted(true);
  }, []);

  useEffect(() => {
    // ×で閉じたら sessionStorage でそのセッション中のみ非表示（翌訪問では再表示・2026-07-12）。
    // SSR/初回クライアント描画は常に表示＝hydration mismatch なし（mounted ガード）。
    // ★storage はプライベートモード・サイトデータのブロック等で例外を投げうる。root layout の部品が
    //   投げるとサイト全体がエラー画面になるため、読めなければ「閉じていない」とみなす。
    if (!announcementId || !announcement?.dismissible) return;
    try {
      if (sessionStorage.getItem(`bess-banner-dismissed-${announcementId}`) === '1') {
        setDismissedId(announcementId);
      }
    } catch {
      /* 読めなければ表示する */
    }
  }, [announcementId, announcement?.dismissible]);

  if (!announcement) return null;
  if (announcement.dismissible && mounted && dismissedId === announcement.id) return null;

  const handleDismiss = () => {
    setDismissedId(announcement.id);
    try {
      sessionStorage.setItem(`bess-banner-dismissed-${announcement.id}`, '1');
    } catch {
      /* 保存できなくても、このページ表示中は閉じたままにする */
    }
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
