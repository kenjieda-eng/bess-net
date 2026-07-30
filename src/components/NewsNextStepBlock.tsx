/**
 * NewsNextStepBlock — /news 記事末尾の文脈誘導「このニュースの先へ」（N1・2026-07-30）。
 *
 * サーバーコンポーネント（初期DOMに載る・#107）。記事の既存データ（title＋本文＋タグ）から
 * カテゴリを判定し、サイト内の受け皿へ内部リンク2〜3本を行アイテムUI（.lv-invest-rows 流用）で描画。
 * 追加fetchなし・関連カード/linkify は不変。リンクは内部のみ（UTM不要）。
 */
import Link from 'next/link';
import { classifyNewsNextStep } from '@/lib/news-next-step';

export default function NewsNextStepBlock({
  title,
  body,
  tags,
}: {
  title: string;
  body?: string;
  tags?: string;
}) {
  const group = classifyNewsNextStep(`${title}\n${tags ?? ''}\n${body ?? ''}`);
  return (
    <section className="page-section news-next-step">
      <h3 className="related-h3">このニュースの先へ</h3>
      <p className="news-next-step-cat">{group.heading}</p>
      <ul className="lv-invest-rows">
        {group.links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
