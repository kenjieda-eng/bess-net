'use client';

import { useEffect, useState } from 'react';

const SEMINAR_URL = 'https://pps-net.org/seminar/160365';
const DISMISS_KEY = 'seminar-160365-dismissed';
/** 6/20 00:00 JST 以降は自動非表示 */
const END = new Date('2026-06-20T00:00:00+09:00');

export function SeminarBanner() {
  // 初期値 false → SSR で必ずバーを描画（curl/SEO で文言が見える）
  // useEffect でクライアント側に「閉じた / 開催後」を判定して隠す
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
      const expired = new Date() >= END;
      if (dismissed || expired) setHidden(true);
    } catch {
      // localStorage が使えない環境は無視
    }
  }, []);

  if (hidden) return null;

  const handleClose = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setHidden(true);
  };

  const handleClick = () => {
    if (typeof window !== 'undefined') {
      const w = window as { gtag?: (...args: unknown[]) => void };
      if (w.gtag) {
        w.gtag('event', 'seminar_banner_click', {
          seminar: '160365',
          url: SEMINAR_URL,
        });
      }
    }
  };

  return (
    <div
      role="region"
      aria-label="セミナー告知"
      style={{ background: 'var(--color-navy)' }}
      className="w-full text-white text-sm"
    >
      <div className="mx-auto max-w-6xl flex items-center gap-3 px-4 py-2">
        <a
          href={SEMINAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex-1 min-w-0 text-white no-underline hover:underline"
        >
          {/* PC: 詳細コピー */}
          <span className="hidden sm:inline">
            <span
              style={{ color: 'var(--color-accent)' }}
              className="font-bold"
            >
              【無料セミナー｜6/19(金) 品川】
            </span>
            {' '}系統用蓄電池を変える"次世代アグリゲーター" ― 運用収益と資産価値の両立（主催: グローシップ／協力: エネルギー情報センター）　▶ 詳細・お申込み
          </span>
          {/* モバイル: 短縮コピー */}
          <span className="sm:hidden">
            <span
              style={{ color: 'var(--color-accent)' }}
              className="font-bold"
            >
              【6/19(金) 無料】
            </span>
            {' '}次世代アグリゲーター・セミナー ▶ 詳細
          </span>
        </a>

        <button
          type="button"
          onClick={handleClose}
          aria-label="告知を閉じる"
          className="shrink-0 px-1 text-lg leading-none text-white/80 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
