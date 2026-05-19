/**
 * LandingPagePainPoints — 課題セクション (3-5 項目グリッド)
 */

import type { LandingPagePainPoint } from '@/data/landing-page-configs';

export default function LandingPagePainPoints({
  painPoints,
}: {
  painPoints: LandingPagePainPoint[];
}) {
  if (painPoints.length === 0) return null;
  return (
    <section style={{ padding: '64px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
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
          こんな課題はありませんか?
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {painPoints.map((p, i) => (
            <div
              key={i}
              style={{
                background: '#f8fafc',
                padding: 24,
                borderRadius: 12,
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden="true">
                {p.icon}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: 8,
                  marginTop: 0,
                  lineHeight: 1.4,
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: '#475569',
                  marginBottom: 0,
                  marginTop: 0,
                }}
                className="text-base"
              >
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
