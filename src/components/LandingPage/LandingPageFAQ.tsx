/**
 * LandingPageFAQ — アコーディオン式 FAQ
 * Server Component で <details>/<summary> ネイティブ実装 (Client 化不要)
 */

import type { LandingPageFAQ } from '@/data/landing-page-configs';

export default function LandingPageFAQ({ faqs }: { faqs: LandingPageFAQ[] }) {
  if (faqs.length === 0) return null;

  // JSON-LD FAQPage (SEO)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <section style={{ padding: '64px 24px', background: 'white' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: 40,
            marginTop: 0,
          }}
        >
          よくあるご質問
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <details
              key={i}
              style={{
                background: '#f8fafc',
                padding: '16px 20px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              <summary
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  lineHeight: 1.5,
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ flexGrow: 1 }}>Q. {faq.question}</span>
                <span style={{ flexShrink: 0, color: '#1d4ed8', fontSize: 20 }} aria-hidden="true">
                  +
                </span>
              </summary>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: '#475569',
                  marginTop: 12,
                  marginBottom: 0,
                  paddingTop: 12,
                  borderTop: '1px solid #e2e8f0',
                }}
                className="text-base lg:text-lg"
              >
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
