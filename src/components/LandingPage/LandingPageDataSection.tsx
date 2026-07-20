/**
 * LandingPageDataSection — data.eic-jp.org 引用
 *
 * L-EIC-008 §2: 数値は実体確認後に追記 (build 時 precompute 経由)
 * 現状: 引用ラベル + 外部リンクのみ、latestValueLabel は future enhancement
 */

import type { LandingPageDataReference } from '@/data/landing-page-configs';

export default function LandingPageDataSection({
  title,
  references,
}: {
  title: string;
  references: LandingPageDataReference[];
}) {
  if (references.length === 0) return null;
  return (
    <section
      id="data-section"
      style={{ padding: '64px 24px', background: '#f8fafc' }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 15,
            color: '#64748b',
            textAlign: 'center',
            marginBottom: 40,
            lineHeight: 1.7,
          }}
        >
          すべて{' '}
          <a
            href="https://data.eic-jp.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1d4ed8', textDecoration: 'underline' }}
          >
            EIC Data (data.eic-jp.org)
          </a>{' '}
          経由、引用可能 (APA/BibTeX/Chicago)、業界中立データ
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {references.map((ref, i) => (
            <a
              key={i}
              href={ref.dataUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: 20,
                background: 'white',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1d4ed8',
                  marginBottom: 8,
                }}
              >
                データ出典
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.4,
                  marginBottom: 8,
                }}
                className="text-base"
              >
                {ref.label}
              </div>
              {ref.latestValueLabel && (
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#0f172a',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  className="tabular-nums"
                >
                  {ref.latestValueLabel}
                </div>
              )}
              <div
                style={{
                  fontSize: 15,
                  color: '#1d4ed8',
                  marginTop: 8,
                }}
              >
                → EIC Data で詳細
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
