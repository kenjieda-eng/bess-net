/**
 * src/components/NextStepBox.tsx — 本文の後に置く「運営元からのご案内」（次の一歩便・2026-10-17）
 *
 * - server component。リンクはサイトの中の入口ページだけ（外のフォームへ直接は行かない）。
 * - 文は便（OneDrive 03_5月13日朝_実行/次の一歩便_…_2026-10-17起草_ユウ.md §1）のとおり（言い換えない・足さない）。
 * - リンクに data-next-step="<種類>" を付け、root layout の ContactClickTracker が GA4 の next_step_click
 *   （step_variant・step_to）を送る。
 * - 置く所・置かない所の判定は src/lib/next-step.ts と src/data/next-step-explainers.ts。
 */
import Link from 'next/link';
import type { NextStepVariant } from '@/lib/next-step';

const VARIANTS: Record<NextStepVariant, { heading: string; body: string; links: { text: string; href: string }[] }> = {
  introduce: {
    heading: '蓄電所の取得を検討している方へ',
    body: '稼働中の蓄電所の取得をご検討の方へ、条件に合う案件のご紹介を、蓄電所ネットの運営元（一般社団法人エネルギー情報センター）が承ります。開発段階の案件は、流通案件のページでご案内しています。',
    links: [
      { text: '稼働中蓄電所のご紹介', href: '/info/operating-bess-introduction' },
      { text: '流通案件（開発段階）', href: '/anken' },
    ],
  },
  asset: {
    heading: '売却・借入、または取得の検討を進めたい方へ',
    body: '売る側の方には買い手候補のご紹介や進め方のご相談を、取得を検討している方には条件に合う案件のご紹介を、蓄電所ネットの運営元（一般社団法人エネルギー情報センター）が承ります。',
    links: [
      { text: '売りたい方の入口', href: '/start/sell' },
      { text: '稼働中蓄電所のご紹介', href: '/info/operating-bess-introduction' },
    ],
  },
  sell: {
    heading: '売却・借換えの進め方を相談したい方へ',
    body: '買い手候補のご紹介や、売却の進め方のご相談を、蓄電所ネットの運営元（一般社団法人エネルギー情報センター）が承ります。',
    links: [
      { text: '売りたい方の入口', href: '/start/sell' },
      { text: '運営している方の入口', href: '/start/operate' },
    ],
  },
  operate: {
    heading: '蓄電所を運営している方へ',
    body: '売却・譲渡、収益と運用の見直し、2 機目以降の計画のご相談を、蓄電所ネットの運営元（一般社団法人エネルギー情報センター）が承ります。',
    links: [{ text: '運営している方の入口', href: '/start/operate' }],
  },
  land: {
    heading: 'この地域で用地・開発案件の売買を考えている方へ',
    body: '連系枠の確保が進む開発案件を匿名でご紹介し、中立的に案件元へお取り次ぎしています。宅地建物取引の媒介・代理は行いません。',
    links: [{ text: '流通案件', href: '/anken' }],
  },
  buy: {
    heading: '蓄電池の導入・参入を相談したい方へ',
    body: '目的に合わせて、蓄電所ネットの運営元（一般社団法人エネルギー情報センター）の専門家チームがご相談に応じます。',
    links: [{ text: '買いたい・導入したい方の入口', href: '/start/buy' }],
  },
};

const TOOL_NOTE = 'ツールの結果は、評価や査定ではありません。';
const OTHERS_NOTE = 'このページの案件の売買を仲介・紹介するものではありません。';
const COMMON_NOTE = 'ご相談は無料です。ご相談によって契約・購入・売却の義務が生じることはありません。';

export default function NextStepBox({
  variant,
  tool = false,
  othersProject = false,
}: {
  variant: NextStepVariant;
  /** ツールのページ: 本文の最後に「ツールの結果は、評価や査定ではありません。」 */
  tool?: boolean;
  /** 他社の案件を扱うページ（プロジェクトの詳細・ニュース）: 共通の 1 行の前に「このページの案件の売買を仲介・紹介するものではありません。」 */
  othersProject?: boolean;
}) {
  const v = VARIANTS[variant];
  return (
    <aside
      aria-label="運営元からのご案内"
      data-next-step-box={variant}
      style={{
        margin: '32px 0',
        padding: '16px 20px',
        background: '#f8fafc',
        border: '1px solid var(--color-line, #E5E7EB)',
        borderRadius: 8,
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <p style={{ fontSize: 13, color: 'var(--color-muted, #64748b)', margin: '0 0 6px', fontWeight: 600 }}>運営元からのご案内</p>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.5 }}>{v.heading}</h2>
      <p style={{ fontSize: 15, lineHeight: 1.8, margin: '0 0 12px' }}>
        {tool ? `${v.body}${TOOL_NOTE}` : v.body}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
        {v.links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} data-next-step={variant} style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-accent, #0066cc)' }}>
              {l.text}
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 13, color: 'var(--color-muted, #64748b)', margin: 0, lineHeight: 1.7 }}>
        {othersProject ? `${OTHERS_NOTE}${COMMON_NOTE}` : COMMON_NOTE}
      </p>
    </aside>
  );
}
