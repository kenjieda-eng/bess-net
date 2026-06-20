export type AnnouncementVariant = 'box' | 'bar';
export type AnnouncementType = 'seminar' | 'release' | 'notice';

export interface SiteAnnouncement {
  id: string;
  enabled: boolean;
  type: AnnouncementType;
  title: string;
  subtitle?: string;
  dateLabel?: string;
  href: string;
  ctaText: string;
  startAt: string; // YYYY-MM-DD JST (inclusive)
  endAt: string;   // YYYY-MM-DD JST (inclusive)
  variant: AnnouncementVariant;
  dismissible: boolean;
  priority: number;
}

// 次回告知: この配列に1エントリ追加するだけで全ページ上部に出る
export const SITE_ANNOUNCEMENTS: SiteAnnouncement[] = [
  {
    id: 'seminar-seetel-jc-star-2026-07-27',
    enabled: true,
    type: 'seminar',
    title: '【7/27(月) 無料セミナー】台湾SEETEL × JC-STAR ― 日本の系統用蓄電池市場へ',
    subtitle:
      '2027年4月の JC-STAR 対応を先取り。系統用蓄電池の2030政策動向・台湾VPP事例・日台スマートグリッドフォーラム。',
    dateLabel: '2026/7/27(月) 16:00〜20:00 ／ 東京・神保町 ／ 無料・定員140名',
    href: '/info/seminar-seetel-jc-star-2026-07-27',
    ctaText: '詳細・お申込み案内を見る →',
    startAt: '2026-06-20',
    endAt: '2026-07-27',
    variant: 'box',
    dismissible: false,
    priority: 10,
  },
];
