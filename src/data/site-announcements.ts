export type AnnouncementVariant = 'box' | 'bar';
export type AnnouncementType = 'seminar' | 'release' | 'notice';

export interface SiteAnnouncement {
  id: string;
  enabled: boolean;
  type: AnnouncementType;
  title: string;
  /** モバイル用の短縮文言（bar 型のみ使用・未指定なら title） */
  titleShort?: string;
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
    // 稼働中蓄電所ご紹介の常設PR導線（2026-07-11 EDAさん発案・バナー文言A案）
    // 常設のため endAt=2099-12-31（4週後 2026-08上旬に GA4 ファネルレビュー予定）。
    // イベント告知バナーが発生した場合は priority で上書き可（その都度 EDAさん判断）
    id: 'operating-bess-introduction',
    enabled: true,
    type: 'notice',
    title: '【ご案内】稼働中の系統用蓄電池（蓄電所）のご紹介が可能です →',
    titleShort: '稼働中蓄電所のご紹介が可能です →',
    href: '/info/operating-bess-introduction',
    ctaText: '',
    startAt: '2026-07-11',
    endAt: '2099-12-31',
    variant: 'bar',
    // 2026-07-12 EDAさん指示: ×で閉じられる（sessionStorage＝そのセッション中のみ非表示）
    dismissible: true,
    priority: 5,
  },
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
    // 2026-07-09 募集締切につき前日日付で即時非表示化（判定は jstDate <= endAt の当日含む比較）
    endAt: '2026-07-08',
    variant: 'box',
    dismissible: false,
    priority: 10,
  },
];
