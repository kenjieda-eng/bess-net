/**
 * LandingPageToolsLinks — 関連ツールリンクカード
 */

import Link from 'next/link';
import type { LandingPageTool } from '@/data/landing-page-configs';

export default function LandingPageToolsLinks({ tools }: { tools: LandingPageTool[] }) {
  if (tools.length === 0) return null;
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
          関連ツール (無料・登録不要)
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {tools.map((t, i) => (
            <Link
              key={i}
              href={t.url}
              style={{
                display: 'block',
                padding: 24,
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#1d4ed8',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                ★ 当サイト独自・無料
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
                {t.label}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: '#475569',
                  marginBottom: 12,
                  marginTop: 0,
                }}
              >
                {t.description}
              </p>
              <div style={{ fontSize: 14, color: '#1d4ed8', fontWeight: 600 }}>
                使ってみる →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
