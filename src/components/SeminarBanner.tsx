'use client';

import { useEffect, useState } from 'react';

// ── 次回セミナー掲載時: ACTIVE = true にして URL/END/コピーを更新 ──
const ACTIVE = false; // 6/19 pps-net セミナー終了（2026-06-20 撤去）

// UTM: pps-net 側アクセス解析で bess-net 経由の到達を識別
const SEMINAR_URL =
  'https://pps-net.org/seminar/160365?utm_source=bess-net&utm_medium=banner&utm_campaign=seminar_aggregator_20260619';
const END = new Date('2026-06-20T00:00:00+09:00');

export function SeminarBanner() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (new Date() >= END) setHidden(true);
  }, []);

  if (!ACTIVE || hidden) return null;

  const handleClick = () => {
    const w = window as { gtag?: (...a: unknown[]) => void };
    if (typeof window !== 'undefined' && w.gtag) {
      w.gtag('event', 'seminar_banner_click', { seminar: '160365', link_url: SEMINAR_URL });
    }
  };

  return (
    <div role="region" aria-label="セミナー告知"
         style={{ background: 'var(--color-navy)' }}
         className="w-full text-white text-sm">
      <a href={SEMINAR_URL} target="_blank" rel="noopener noreferrer"
         onClick={handleClick}
         className="mx-auto block max-w-6xl px-4 py-2 text-center text-white no-underline hover:underline">
        <span className="hidden sm:inline">
          <span style={{ color: 'var(--color-accent)' }} className="font-bold">【無料セミナー｜6/19(金) 品川】</span>
          系統用蓄電池を変える"次世代アグリゲーター" ― 運用収益と資産価値の両立（主催: グローシップ／協力: エネルギー情報センター）　▶ 詳細・お申込み
        </span>
        <span className="sm:hidden">
          <span style={{ color: 'var(--color-accent)' }} className="font-bold">【6/19(金) 無料】</span>
          次世代アグリゲーター・セミナー ▶ 詳細
        </span>
      </a>
    </div>
  );
}
