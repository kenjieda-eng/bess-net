/**
 * /milestones — 更新履歴（主な公開と更新）（サイトの歩み便 第 2 版・2026-10-26）
 *
 * 蓄電所ネットで公開した主なページ・データベース・ツールを、公開した日の新しい順に記録する。
 * - データは src/data/site-history.ts（文案の逐語）。force-static・外部取得 0（鉄則 #2）。全件を初期 DOM に載せる（#107）。
 * - 記述の訂正は /corrections（訂正履歴）に分ける。未来の予定・達成の演出・自称の最上級は載せない。
 * - 2026-10-26 まで: 達成記念ページ一覧（src/data/milestones.ts・site-config の roadmap）。旧データは残すが表示に使わない。
 *   達成記念の詳細 4 枚は next.config.js の redirects で 301。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { SITE_HISTORY, type SiteHistoryItem } from '@/data/site-history';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

const PAGE_PATH = '/milestones';
const PAGE_TITLE = '更新履歴（主な公開と更新）｜蓄電所ネット';
const DESCRIPTION = '蓄電所ネットで公開した主なページ・データベース・ツールを、公開した日の新しい順に記録しています。記述の訂正は、訂正履歴にまとめています。';

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: PAGE_TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}${PAGE_PATH}`,
    type: 'website',
    // openGraph を書くと layout の既定が丸ごと置き換わるので、画像・サイト名・言語も明示する
    images: [siteConfig.ogImage],
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
};

function formatDateJa(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

function HistoryLink({ label, url }: { label: string; url: string }) {
  if (/^https?:\/\//.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>
        {label}
      </a>
    );
  }
  return (
    <Link href={url} style={{ color: 'var(--color-accent)' }}>
      {label}
    </Link>
  );
}

export default function MilestonesPage() {
  // 年ごとに分ける（データは新しい順）
  const years: { year: string; items: SiteHistoryItem[] }[] = [];
  for (const it of SITE_HISTORY) {
    const y = it.date.slice(0, 4);
    const last = years[years.length - 1];
    if (last && last.year === y) last.items.push(it);
    else years.push({ year: y, items: [it] });
  }
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: '更新履歴',
      url: `${siteConfig.url}${PAGE_PATH}`,
      description: DESCRIPTION,
      publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
        { '@type': 'ListItem', position: 2, name: '更新履歴', item: `${siteConfig.url}${PAGE_PATH}` },
      ],
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="page">
        <div className="page-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 更新履歴
          </p>
          <h1 className="page-title">更新履歴</h1>
          <p className="page-lead">
            {'蓄電所ネットで公開した主なページ・データベース・ツールを、公開した日の新しい順に記録しています。記述の訂正は、'}
            <Link href="/corrections" style={{ color: 'var(--color-accent)' }}>{'訂正履歴'}</Link>
            {'にまとめています。'}
          </p>
          {years.map(({ year, items }) => (
            <section key={year} aria-labelledby={`site-history-${year}`} style={{ marginTop: 28 }}>
              <h2 id={`site-history-${year}`} style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>{`${year}年`}</h2>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((it) => (
                  <li
                    key={it.id}
                    id={`site-history-${it.id}`}
                    style={{ borderTop: '1px solid var(--color-border, #e2e8f0)', padding: '14px 0' }}
                  >
                    <div style={{ fontSize: 14, color: 'var(--color-text-sub, #475569)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <time dateTime={it.date} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDateJa(it.date)}</time>
                      <span style={{ border: '1px solid var(--color-border, #cbd5e1)', borderRadius: 4, padding: '0 6px', fontSize: 13 }}>{it.category}</span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '6px 0 4px', lineHeight: 1.5 }}>{it.title}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.8, margin: '0 0 6px' }}>{it.summary}</p>
                    <p style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                      {it.links.map((l, i) => (
                        <span key={`${l.url}-${i}`}>
                          {i > 0 && ' ／ '}
                          <HistoryLink label={l.label} url={l.url} />
                        </span>
                      ))}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
