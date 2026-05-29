/**
 * /contact/[type] — お問い合わせ 区分別ページ (動的ルート)
 *
 * 設計:
 *   - Server Component (revalidate = 86400)
 *   - generateStaticParams: 5区分すべて build 時生成
 *   - JSON-LD: ContactPage
 *   - 外部 API 呼び出しなし（鉄則 #2 遵守）
 *   - ContactPageLayout が UI 描画を担当
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ContactPageLayout from '@/components/ContactPage/ContactPageLayout';
import {
  CONTACT_PAGES_CONFIGS,
  ALL_PLAYER_TYPES,
  type PlayerType,
} from '@/data/contact-pages-configs';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 86400;

/** build 時に 5区分すべてを静的生成 */
export function generateStaticParams() {
  return ALL_PLAYER_TYPES.map((type) => ({ type }));
}

type Props = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const config = CONTACT_PAGES_CONFIGS[type as PlayerType];
  if (!config) return { title: 'お問い合わせ | 蓄電所ネット' };

  return {
    title: config.title,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${siteConfig.url}/contact/${config.slug}`,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: 'website',
    },
    alternates: {
      canonical: `${siteConfig.url}/contact/${config.slug}`,
    },
  };
}

export default async function ContactTypePage({ params }: Props) {
  const { type } = await params;
  const config = CONTACT_PAGES_CONFIGS[type as PlayerType];

  if (!config) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: config.heroH1,
    description: config.description,
    url: `${siteConfig.url}/contact/${config.slug}`,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactPageLayout config={config} />
    </>
  );
}
