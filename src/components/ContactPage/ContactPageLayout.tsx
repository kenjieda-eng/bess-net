/**
 * ContactPageLayout — /contact/[type] 共通レイアウト
 *
 * 設計:
 *   - Server Component (client directive なし)
 *   - SiteHeader/SiteFooter で既存サイト統一感
 *   - ContactPageConfig を props に受け取り、全 5 区分ページに適用
 *   - CTA は https://eic-jp.org/contact への外部リンク（target="_blank"）
 */

import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Link from 'next/link';
import type { ContactPageConfig } from '@/data/contact-pages-configs';

export default function ContactPageLayout({ config }: { config: ContactPageConfig }) {
  return (
    <>
      <SiteHeader />
      <main className="contact-page">

        {/* ─── Hero ─────────────────────────────────────── */}
        <section className="contact-hero">
          <div className="contact-hero-inner">
            <p className="contact-hero-breadcrumb">
              <Link href="/contact">お問い合わせ</Link>
              <span aria-hidden="true"> › </span>
              <span>{config.heroH1}</span>
            </p>
            <h1 className="contact-hero-h1">{config.heroH1}</h1>
            <p className="contact-hero-subcopy">{config.heroSubcopy}</p>
          </div>
        </section>

        {/* ─── Guidance Cards ───────────────────────────── */}
        <section className="contact-guidances">
          <div className="contact-section-inner">
            <h2 className="contact-section-title">どのようなことでもご相談ください</h2>
            <ul className="contact-guidance-list">
              {config.guidances.map((g) => (
                <li key={g.title} className="contact-guidance-card">
                  <span className="contact-guidance-icon" aria-hidden="true">{g.icon}</span>
                  <div>
                    <h3 className="contact-guidance-card-title">{g.title}</h3>
                    <p className="contact-guidance-card-desc">{g.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── CTA ──────────────────────────────────────── */}
        <section className="contact-cta-section">
          <div className="contact-section-inner">
            <p className="contact-cta-note">
              お問い合わせフォームはエネルギー情報センター（eic-jp.org）が管理・運営しています。
              内容確認後、担当者よりご連絡いたします（平日 10:00–18:00 目安）。
            </p>
            <a
              href={config.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-cta-button"
            >
              {config.ctaLabel}
              <span aria-hidden="true"> ↗</span>
            </a>
            <p className="contact-cta-sub">
              ※ フォームは一般社団法人エネルギー情報センターの外部サイト（eic-jp.org）に移動します。
            </p>
          </div>
        </section>

        {/* ─── Related Links ────────────────────────────── */}
        <section className="contact-related">
          <div className="contact-section-inner">
            <h2 className="contact-section-title">関連するページ</h2>
            <ul className="contact-related-list">
              {config.relatedLinks.map((link) => (
                <li key={link.url}>
                  <Link href={link.url} className="contact-related-link">
                    {link.label}
                    <span aria-hidden="true"> →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
