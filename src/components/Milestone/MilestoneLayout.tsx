/**
 * MilestoneLayout — 達成記念ページ共通レイアウト (Server Component)
 *
 * 設計:
 *   - L-JEPX-UI-001: inline style + className 併用
 *   - L-JEPX-UI-006: fontSize 16-18px 業界事業者向け
 *   - L-JEPX-UI-007: 共通コンポーネント効率性 (全 milestone ページで再利用)
 *   - L-JEPX-UI-010: page + component + library 3 層深掘り対応
 */

import Link from 'next/link';
import type { MilestoneData } from '@/data/milestones';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

function formatDateJa(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

function MilestoneHero({ milestone }: { milestone: MilestoneData }) {
  const isPlanned = milestone.status === 'planned';
  return (
    <section
      style={{
        padding: '64px 24px 56px',
        background: isPlanned
          ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
        color: 'white',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
        {milestone.heroBadge && (
          <span
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              background: '#fbbf24',
              color: '#0f172a',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            ★ {milestone.heroBadge}
          </span>
        )}
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: '#cbd5e1',
            marginBottom: 16,
            fontVariantNumeric: 'tabular-nums',
          }}
          className="tabular-nums"
        >
          {formatDateJa(milestone.date)}
          {milestone.status === 'upcoming' && ' (公開待ち)'}
          {milestone.status === 'planned' && ' (予定)'}
        </div>
        <h1
          style={{
            fontSize: 36,
            lineHeight: 1.3,
            fontWeight: 700,
            marginBottom: 20,
            color: 'white',
          }}
          className="text-3xl lg:text-4xl"
        >
          {milestone.heroTitle}
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.7,
            color: '#e2e8f0',
            maxWidth: 720,
            margin: '0 auto',
          }}
          className="text-base lg:text-lg"
        >
          {milestone.heroSubtitle}
        </p>
      </div>
    </section>
  );
}

function MilestoneAchievements({ achievements }: { achievements: MilestoneData['achievements'] }) {
  if (achievements.length === 0) {
    return (
      <section style={{ padding: '64px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7 }}>
            達成内容の詳細は公開後に追記予定です。
          </p>
        </div>
      </section>
    );
  }
  return (
    <section style={{ padding: '64px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          達成内容
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {achievements.map((ach, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                padding: 24,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    background: '#dbeafe',
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#1e40af',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  className="tabular-nums"
                >
                  {i + 1}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: 8,
                      marginTop: 0,
                    }}
                  >
                    {ach.label}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.7,
                      color: '#475569',
                      marginBottom: 12,
                      marginTop: 0,
                    }}
                    className="text-base lg:text-lg"
                  >
                    {ach.detail}
                  </p>
                  {ach.metric && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#eff6ff',
                        color: '#1e40af',
                        borderRadius: 4,
                        fontSize: 14,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      className="tabular-nums"
                    >
                      {ach.metric}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MilestoneRelatedLinks({ links }: { links: { label: string; url: string }[] }) {
  return (
    <section style={{ padding: '64px 24px', background: 'white' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          関連ページ
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {links.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              style={{
                display: 'block',
                padding: 16,
                background: '#f8fafc',
                color: '#0f172a',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: 500,
                textDecoration: 'none',
                lineHeight: 1.5,
              }}
              className="text-base"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MilestoneUpcoming({
  upcoming,
}: {
  upcoming: NonNullable<MilestoneData['upcomingMilestones']>;
}) {
  return (
    <section style={{ padding: '64px 24px 80px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          今後の達成予定
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upcoming.map((u, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                padding: 20,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1e40af',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  className="tabular-nums"
                >
                  {formatDateJa(u.date)}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#0f172a',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {u.label}
                </div>
              </div>
              {u.url && (
                <Link
                  href={u.url}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#1d4ed8',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  詳細を見る →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MilestoneLayout({ milestone }: { milestone: MilestoneData }) {
  return (
    <>
      <SiteHeader />
      <main>
        <MilestoneHero milestone={milestone} />
        <MilestoneAchievements achievements={milestone.achievements} />
        {milestone.relatedLinks && milestone.relatedLinks.length > 0 && (
          <MilestoneRelatedLinks links={milestone.relatedLinks} />
        )}
        {milestone.upcomingMilestones && milestone.upcomingMilestones.length > 0 && (
          <MilestoneUpcoming upcoming={milestone.upcomingMilestones} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
