/**
 * src/lib/inline-links.tsx — 設定の文字列の中の `[文](/行き先)` をサイト内リンクにする（入口の掃除と計測便・2026-10-17）
 *
 * 入口ページの設定（src/data/landing-page-configs.ts の FAQ の答え・課題の説明）は文字列で描画している。
 * 過ぎた「公開予定」を、実在するページへの普通のリンクの文に直すために、最小の書き方を 1 つだけ足した。
 *   - 行き先は `/` で始まるサイト内の道だけ（外のリンクは書かない）。
 *   - JSON-LD（FAQPage）や meta には stripInlineLinks で文だけを渡す。
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

const INLINE_LINK = /\[([^\]\n]+)\]\((\/[^)\s]*)\)/g;

export function renderInlineLinks(text: string): ReactNode {
  if (!text.includes('](/')) return text;
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE_LINK)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <Link key={`l${i++}`} href={m[2]}>
        {m[1]}
      </Link>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function stripInlineLinks(text: string): string {
  return text.replace(INLINE_LINK, '$1');
}
