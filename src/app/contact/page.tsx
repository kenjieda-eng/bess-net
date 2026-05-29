/**
 * /contact — お問い合わせ インデックスページ
 *
 * 設計:
 *   - Server Component (revalidate = 86400)
 *   - 5区分カードから /contact/[type] へ誘導
 *   - JSON-LD: ContactPage
 *   - 外部 API 呼び出しなし（鉄則 #2 遵守）
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { CONTACT_INDEX_CONFIG } from '@/data/contact-pages-configs';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: CONTACT_INDEX_CONFIG.title,
  description: CONTACT_INDEX_CONFIG.description,
  openGraph: {
    title: CONTACT_INDEX_CONFIG.title,
    description: CONTACT_INDEX_CONFIG.description,
    url: `${siteConfig.url}/contact`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
  },
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: CONTACT_INDEX_CONFIG.heroH1,
  description: CONTACT_INDEX_CONFIG.description,
  url: `${siteConfig.url}/contact`,
  provider: {
    '@type': 'Organization',
    name: siteConfig.organization.name,
    url: siteConfig.organization.url,
  },
};

export default function ContactIndexPage() {
  const config = CONTACT_INDEX_CONFIG;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="contact-page contact-index-page">

        {/* ─── Hero ─────────────────────────────────────── */}
        <section className="contact-hero">
          <div className="contact-hero-inner">
            <h1 className="contact-hero-h1">{config.heroH1}</h1>
            <p className="contact-hero-subcopy">{config.heroSubcopy}</p>
          </div>
        </section>

        {/* ─── Category Cards ───────────────────────────── */}
        <section className="contact-categories">
          <div className="contact-section-inner">
            <h2 className="contact-section-title">お客様の属性をお選びください</h2>
            <ul className="contact-category-list">
              {config.categories.map((cat) => (
                <li key={cat.type}>
                  <Link href={cat.url} className="contact-category-card">
                    <span className="contact-category-icon" aria-hidden="true">{cat.icon}</span>
                    <div>
                      <span className="contact-category-label">{cat.label}</span>
                      <span className="contact-category-desc">{cat.description}</span>
                    </div>
                    <span className="contact-category-arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── General Note ─────────────────────────────── */}
        <section className="contact-general-note">
          <div className="contact-section-inner">
            <h2 className="contact-section-title">お問い合わせにあたって</h2>
            <ul className="contact-note-list">
              <li>お問い合わせフォームは運営元の一般社団法人エネルギー情報センター（eic-jp.org）にて管理しています。</li>
              <li>ご回答は平日 10:00〜18:00 を目安にしています。内容によっては回答にお時間をいただく場合があります。</li>
              <li>個別の補助金申請代行・法律相談・投資助言は行っておりません。</li>
              <li>プレスリリース・情報提供のご連絡もこちらから受け付けています。</li>
            </ul>
            <div className="contact-general-cta">
              <a
                href={siteConfig.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-cta-button"
              >
                お問い合わせフォームへ（eic-jp.org）
                <span aria-hidden="true"> ↗</span>
              </a>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
