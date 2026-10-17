'use client';

/**
 * src/components/ContactClickTracker.tsx — 相談のリンクのクリックを GA4 で数える（全ページ共通・root layout に 1 つ）
 *
 * 入口の掃除と計測便（2026-10-17）:
 *   - eic-jp.org/contact へのリンクがクリックされたら gtag('event', 'contact_click', { cta_campaign, cta_position, link_url })。
 *     cta_campaign・cta_position は href の utm_campaign・utm_content（src/lib/contact-link.ts の contactUrl が付ける）。
 *     パラメータ名に cta_ を付けるのは、GA4 がキャンペーンの判定に使う campaign などと混ぜないため。
 *   - ページの場所は GA4 が自動で持つ（page_location）ので送らない。
 *   - 中クリック（auxclick の button 1）も数える。gtag が無いとき（GA の ID が未設定）は何もしない。
 *   - /anken の anken_contact_click（AnkenContactCTA）は残す。名前が違うので二重には数えない。
 *   - 何も描画しない（document に listener を 1 つ置くだけ）。
 */

import { useEffect } from 'react';
import { isContactHref } from '@/lib/contact-link';

type Gtag = (...a: unknown[]) => void;

function onActivate(e: MouseEvent): void {
  if (e.type === 'auxclick' && e.button !== 1) return;
  const target = e.target as Element | null;
  const a = target?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.href;
  if (!isContactHref(href)) return;
  const w = window as { gtag?: Gtag };
  if (!w.gtag) return;
  let campaign = '';
  let position = '';
  try {
    const u = new URL(href);
    campaign = u.searchParams.get('utm_campaign') ?? '';
    position = u.searchParams.get('utm_content') ?? '';
  } catch {
    // URL として読めなければ空のまま送る
  }
  w.gtag('event', 'contact_click', { cta_campaign: campaign, cta_position: position, link_url: href });
}

export default function ContactClickTracker() {
  useEffect(() => {
    document.addEventListener('click', onActivate, true);
    document.addEventListener('auxclick', onActivate, true);
    return () => {
      document.removeEventListener('click', onActivate, true);
      document.removeEventListener('auxclick', onActivate, true);
    };
  }, []);
  return null;
}
