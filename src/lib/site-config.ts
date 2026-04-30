// サイト全体の定数を一元管理
// 名称・URL・メタ情報をここで定義し、各ページから参照する

export type RoadmapItem = {
  phase: string;
  period: string;
  title: string;
  description: string;
  isCurrent?: boolean;
};

export type NavItem = {
  label: string;
  href: string;
  enabled: boolean;
};

export const siteConfig = {
  name: '蓄電所ネット',
  nameEn: 'BESS NET',
  shortName: 'bess-net',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://bess-net.jp',
  description:
    '系統用蓄電池および低圧リソース事業の情報ポータル。業界ニュース、プロジェクトデータベース、市場制度解説、補助金カレンダー、変電所別 系統空き容量、事業者一覧、用語集を一元化。',
  ogImage: '/og-image.png',
  twitter: '',
  contactUrl: 'https://eic-jp.org/contact',
  locale: 'ja_JP',

  // 運営者情報（公式）
  organization: {
    name: '一般社団法人エネルギー情報センター',
    nameShort: 'エネルギー情報センター',
    url: 'https://eic-jp.org/',
    representative: '理事 江田 健二',
    address: '〒160-0022 東京都新宿区新宿2丁目9-22 多摩川新宿ビル3F',
    contactUrl: 'https://eic-jp.org/contact',
  },

  // ナビゲーション（Phase 1で順次有効化）
  nav: [
    { label: 'ニュース', href: '/news', enabled: true },
    { label: '解説', href: '/explainer', enabled: true },
    { label: '用語集', href: '/glossary', enabled: true },
    { label: '補助金', href: '/subsidies', enabled: true },
    { label: 'プロジェクト', href: '/projects', enabled: true },
    { label: '事業者', href: '/operators', enabled: false },
  ] as NavItem[],

  // フッターのリンク群
  footerLinks: [
    { label: '蓄電所ネットについて', href: '/about' },
    { label: '編集方針', href: '/editorial-policy' },
    { label: 'プライバシーポリシー', href: '/privacy' },
    { label: '利用規約', href: '/terms' },
  ],

  // ロードマップ（トップページ表示用）
  roadmap: [
    {
      phase: 'Sprint 1',
      period: '基盤整備',
      title: '解説記事・用語集・規約',
      description:
        '解説記事5本、用語集150語、About/編集方針/規約/プライバシーポリシー。順次拡充中。',
      isCurrent: true,
    },
    {
      phase: 'Sprint 1',
      period: '〜2ヶ月',
      title: 'プロジェクトDB初期版・補助金カレンダー',
      description:
        '国内蓄電所プロジェクト情報の構造化掲載と、補助金の公募スケジュール集約。',
      isCurrent: false,
    },
    {
      phase: 'Sprint 2',
      period: '3〜4ヶ月',
      title: '変電所別 系統空き容量公開',
      description:
        'キラーコンテンツ第1弾。10電力会社の公開情報を集約した変電所単位のデータベース。週次更新。',
      isCurrent: false,
    },
    {
      phase: 'Sprint 3',
      period: '5〜6ヶ月',
      title: '日本の蓄電所マップ公開',
      description:
        'キラーコンテンツ第2弾。プロジェクトDBと系統情報をレイヤー連動した地図ベースの体験。',
      isCurrent: false,
    },
    {
      phase: 'Sprint 5',
      period: '9〜10ヶ月',
      title: '火災・トラブル事例DB公開',
      description:
        'キラーコンテンツ第3弾。国内の蓄電池トラブル事例を公開資料に基づき整理した、業界の安全文化向上に資する情報基盤。',
      isCurrent: false,
    },
  ] as RoadmapItem[],
} as const;

export type SiteConfig = typeof siteConfig;
