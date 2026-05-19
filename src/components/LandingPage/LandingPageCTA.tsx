/**
 * LandingPageCTA — フッター CTA (Primary + Secondary)
 */

import Link from 'next/link';

interface Props {
  primary: { label: string; url: string };
  secondary?: { label: string; url: string };
}

export default function LandingPageCTA({ primary, secondary }: Props) {
  return (
    <section
      style={{
        padding: '64px 24px',
        background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
        color: 'white',
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'white',
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          まずはお気軽にご相談ください
        </h2>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: '#e0e7ff',
            marginBottom: 32,
            marginTop: 0,
          }}
          className="text-base lg:text-lg"
        >
          一般社団法人エネルギー情報センター (10 年運営実績) が、業界中立で対応いたします。
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          <Link
            href={primary.url}
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: '#fbbf24',
              color: '#0f172a',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {primary.label} →
          </Link>
          {secondary && (
            <Link
              href={secondary.url}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'transparent',
                color: 'white',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
                border: '2px solid #cbd5e1',
              }}
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
