/**
 * LvContactCta — 低圧蓄電所クラスタ共通CTA（Stage1・2026-07-18）
 * variant: buy（購入・投資検討者向け）| entry（事業参入検討者向け）
 * /start 系LPの承認済みトーンを踏襲（誇張ゼロ・無料明記・運営実績数値の追加なし）
 */

const VARIANTS = {
  buy: {
    heading: '低圧蓄電所の購入・投資を検討中の方へ',
    body: '販売者ではない中立の立場で、購入前の疑問点の整理やセカンドオピニオンのご相談を無料でお受けしています。',
    button: '購入・投資について相談する（無料）',
    href: 'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_lv_buy',
  },
  entry: {
    heading: '低圧蓄電所事業への参入を検討中の方へ',
    body: '事業化の進め方・市場動向・パートナー選定の考え方など、検討段階のご相談を無料でお受けしています。',
    button: '事業参入について相談する（無料）',
    href: 'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_lv_entry',
  },
} as const;

export default function LvContactCta({ variant }: { variant: 'buy' | 'entry' }) {
  const v = VARIANTS[variant];
  return (
    <div
      style={{
        margin: '24px 0',
        padding: 24,
        background: '#f8fafc',
        border: '2px solid #0F2D4F',
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, marginTop: 0, color: '#0F2D4F' }}>
        {v.heading}
      </p>
      <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 0, marginBottom: 16, lineHeight: 1.7 }}>
        {v.body}
      </p>
      <a
        href={v.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          background: '#0F2D4F',
          color: '#fff',
          padding: '12px 28px',
          borderRadius: 4,
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        {v.button} →
      </a>
    </div>
  );
}
