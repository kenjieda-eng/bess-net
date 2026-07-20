/**
 * ContactPageLayout — /contact/[type] 共通レイアウト
 *
 * 設計（v2、2026-05-29 修正）:
 *   - Server Component (client directive なし)
 *   - SiteHeader/SiteFooter で既存サイト統一感
 *   - ★ globals.css 既存標準クラス（section / section-inner / section-title / section-label /
 *     article-breadcrumb / btn-primary）と inline style のみで構成（独自クラス追加なし）
 *   - balancing-revenue / capacity-market-bid と同じ構造パターンを踏襲
 */

import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import Link from 'next/link';
import type { ContactPageConfig } from '@/data/contact-pages-configs';

export default function ContactPageLayout({ config }: { config: ContactPageConfig }) {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1024 }}>

          {/* ─── パンくず ─── */}
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/contact">お問い合わせ</Link> /{' '}
            {config.heroH1}
          </p>

          {/* ─── Hero ─── */}
          <div className="section-label">お問い合わせ</div>
          <h1 className="section-title">{config.heroH1}</h1>
          <p
            className="section-desc"
            style={{ marginBottom: 32, lineHeight: 1.7 }}
          >
            {config.heroSubcopy}
          </p>

          {/* ─── Guidance Cards ─── */}
          <section style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-navy, #0F2D4F)',
                marginBottom: 16,
              }}
            >
              どのようなことでもご相談ください
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {config.guidances.map((g) => (
                <li
                  key={g.title}
                  style={{
                    padding: '18px 18px',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: 8,
                    background: '#fff',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{ fontSize: 24, lineHeight: 1, marginBottom: 8 }}
                  >
                    {g.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--color-navy, #0F2D4F)',
                      marginBottom: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    {g.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: '#4b5563',
                      margin: 0,
                    }}
                  >
                    {g.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* ─── CTA ─── */}
          <section
            style={{
              padding: '24px 20px',
              background: '#f0f4f8',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: '#374151',
                marginBottom: 16,
              }}
            >
              お問い合わせフォームはエネルギー情報センター（eic-jp.org）が管理・運営しています。
              内容確認後、担当者よりご連絡いたします（平日 10:00–18:00 目安）。
            </p>
            <a
              href={config.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'inline-block' }}
            >
              {config.ctaLabel}
              <span aria-hidden="true"> ↗</span>
            </a>
            <p
              style={{
                fontSize: 12,
                color: '#6b7280',
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              ※ フォームは一般社団法人エネルギー情報センターの外部サイト（eic-jp.org）に移動します。
            </p>
          </section>

          {/* ─── Related Links ─── */}
          <section style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--color-navy, #0F2D4F)',
                marginBottom: 12,
              }}
            >
              関連するページ
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {config.relatedLinks.map((link) => (
                <li key={link.url}>
                  <Link
                    href={link.url}
                    style={{
                      color: 'var(--color-accent, #00B5A5)',
                      textDecoration: 'none',
                      fontSize: 15,
                    }}
                  >
                    {link.label}
                    <span aria-hidden="true"> →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
