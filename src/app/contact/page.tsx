/**
 * /contact — お問い合わせ インデックスページ
 *
 * 設計（v2、2026-05-29 修正）:
 *   - Server Component (revalidate = 86400)
 *   - 5区分カードから /contact/[type] へ誘導
 *   - JSON-LD: ContactPage
 *   - 外部 API 呼び出しなし（鉄則 #2 遵守）
 *   - ★ globals.css 既存標準クラス（section / section-inner / section-title / section-label /
 *     article-breadcrumb / btn-primary）と inline style のみで構成（独自クラス追加なし）
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
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1024 }}>

          {/* ─── Hero ─── */}
          <div className="section-label">お問い合わせ</div>
          <h1 className="section-title">{config.heroH1}</h1>
          <p className="section-desc" style={{ marginBottom: 32, lineHeight: 1.7 }}>
            {config.heroSubcopy}
          </p>

          {/* ─── Category Cards ─── */}
          <section style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-navy, #0F2D4F)',
                marginBottom: 16,
              }}
            >
              お客様の属性をお選びください
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {config.categories.map((cat) => (
                <li key={cat.type}>
                  <Link
                    href={cat.url}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '16px 18px',
                      border: '1px solid var(--color-border, #e5e7eb)',
                      borderRadius: 8,
                      background: '#fff',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'box-shadow 0.15s',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, paddingTop: 2 }}
                    >
                      {cat.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--color-navy, #0F2D4F)',
                          marginBottom: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        {cat.label}
                      </div>
                      <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                        {cat.description}
                      </div>
                    </div>
                    <span
                      aria-hidden="true"
                      style={{
                        color: 'var(--color-accent, #00B5A5)',
                        fontSize: 18,
                        flexShrink: 0,
                        alignSelf: 'center',
                      }}
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* ─── General Note ─── */}
          <section
            style={{
              padding: '20px 20px',
              background: '#f0f4f8',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--color-navy, #0F2D4F)',
                marginBottom: 12,
              }}
            >
              お問い合わせにあたって
            </h2>
            <ul
              style={{
                paddingLeft: 20,
                margin: '0 0 20px 0',
                lineHeight: 1.8,
                fontSize: 14,
                color: '#374151',
              }}
            >
              <li>お問い合わせフォームは運営元の一般社団法人エネルギー情報センター（eic-jp.org）にて管理しています。</li>
              <li>ご回答は平日 10:00〜18:00 を目安にしています。内容によっては回答にお時間をいただく場合があります。</li>
              <li>個別の補助金申請代行・法律相談・投資助言は行っておりません。</li>
              <li>プレスリリース・情報提供のご連絡もこちらから受け付けています。</li>
            </ul>
            <div style={{ textAlign: 'center' }}>
              <a
                href={siteConfig.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: 'inline-block' }}
              >
                お問い合わせフォームへ（eic-jp.org）
                <span aria-hidden="true"> ↗</span>
              </a>
            </div>
          </section>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
