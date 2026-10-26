/**
 * /milestones/[slug] — 達成記念ページ動的ルート (SSG)
 *
 * ★2026-10-26 から使わない（サイトの歩み便 第 2 版）: /milestones は更新履歴（src/data/site-history.ts）に作り直し、詳細 4 枚は next.config.js の redirects で 301。表示に使わない（消さずに残す）。
 *
 * 設計:
 *   - generateStaticParams で全 milestone を build 時に静的生成
 *   - 鉄則 #2 SSR 外部 API 0 (静的データのみ)
 *   - 鉄則 #3 動的ルート (件数 < 10、build 時事前計算)
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMilestoneBySlug } from '@/data/milestones';
import MilestoneLayout from '@/components/Milestone/MilestoneLayout';

interface Props {
  params: { slug: string };
}

// 2026-10-26 から 4 枚とも next.config.js の redirects で行き先へ飛ばすので、事前生成しない（src/data/milestones.ts のデータは残す）
export const dynamicParams = false;
export function generateStaticParams() {
  return [] as { slug: string }[];
}

export function generateMetadata({ params }: Props): Metadata {
  const milestone = getMilestoneBySlug(params.slug);
  if (!milestone) return {};
  return {
    title: milestone.title,
    description: milestone.description,
    alternates: { canonical: `/milestones/${milestone.slug}` },
    openGraph: {
      title: milestone.title,
      description: milestone.description,
      type: 'article',
      images: milestone.ogImage ? [milestone.ogImage] : ['/og-image.png'],
    },
  };
}

export default function MilestoneSlugPage({ params }: Props) {
  const milestone = getMilestoneBySlug(params.slug);
  if (!milestone) notFound();

  // JSON-LD Article
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: milestone.heroTitle,
    description: milestone.heroSubtitle,
    datePublished: milestone.date,
    dateModified: milestone.date,
    author: {
      '@type': 'Organization',
      name: '一般社団法人エネルギー情報センター',
      url: 'https://eic-jp.org/',
    },
    publisher: {
      '@type': 'Organization',
      name: '一般社団法人エネルギー情報センター',
      url: 'https://eic-jp.org/',
    },
    mainEntityOfPage: `https://bess-net.jp/milestones/${milestone.slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '達成記念', item: 'https://bess-net.jp/milestones' },
      {
        '@type': 'ListItem',
        position: 3,
        name: milestone.heroTitle,
        item: `https://bess-net.jp/milestones/${milestone.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <MilestoneLayout milestone={milestone} />
    </>
  );
}
