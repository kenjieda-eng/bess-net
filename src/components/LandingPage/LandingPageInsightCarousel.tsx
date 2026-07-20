/**
 * LandingPageInsightCarousel — 関連 Insight カード
 *
 * 注: Insight slug は data.eic-jp.org/insight/{slug} へのリンクとして表示
 *     bess-net 内 Insight ページは現状未実装 (Sprint X1 後の Phase D で実装予定)
 */

interface Props {
  insightSlugs: string[];
}

// 暫定ラベル (slug → 表示名マッピング、Phase D で data 経由に置換予定)
const INSIGHT_LABELS: Record<string, string> = {
  'temp-vs-price': '気温と JEPX 価格の相関 (夏季ピーク)',
  'lng-vs-price-tokyo': 'LNG 輸入価格 vs 東京 JEPX',
  'fx-decomp-lng-jepx-tokyo': '為替が LNG・JEPX に与える影響分解',
  'jgb-vs-yen-lng': 'JGB 利回り vs 円安 vs LNG 連動',
  'temp-max-tokyo-summer': '東京の最高気温 (夏季ピーク需要相関)',
};

export default function LandingPageInsightCarousel({ insightSlugs }: Props) {
  if (insightSlugs.length === 0) return null;
  return (
    <section style={{ padding: '64px 24px', background: '#f8fafc' }}>
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
          業界の関連 Insight
        </h2>
        <p
          style={{
            fontSize: 15,
            color: '#64748b',
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 1.7,
          }}
        >
          data.eic-jp.org の業界中立 Insight。引用可能・常時更新。
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {insightSlugs.map((slug) => (
            <a
              key={slug}
              href={`https://data.eic-jp.org/insight/${slug}`}
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
                  fontSize: 13,
                  color: '#a16207',
                  fontWeight: 700,
                  marginBottom: 8,
                  letterSpacing: '0.05em',
                }}
              >
                Insight
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                {INSIGHT_LABELS[slug] ?? slug}
              </div>
              <div style={{ fontSize: 15, color: '#1d4ed8' }}>EIC Data で読む →</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
