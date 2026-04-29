// サイト全体の定数を一元管理
// 名称・URL・メタ情報をここで定義し、各ページから参照する

export type RoadmapItem = {
  phase: string;
  period: string;
  title: string;
  description: string;
  isCurrent?: boolean;
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
  contactEmail: 'contact@bess-net.jp',
  locale: 'ja_JP',

  // ナビゲーション（Phase 1で順次有効化）
  nav: [
    { label: 'ニュース', href: '/news', enabled: false },
    { label: 'プロジェクトDB', href: '/projects', enabled: false },
    { label: '市場・制度', href: '/markets', enabled: false },
    { label: '事業者・サービス', href: '/operators', enabled: false },
    { label: 'データ', href: '/data', enabled: false },
    { label: '用語集', href: '/glossary', enabled: false },
  ],

  // ロードマップ（トップページ表示用）
  roadmap: [
    {
      phase: 'Phase 1',
      period: '0〜2ヶ月',
      title: 'サイト基盤公開',
      description:
        '解説記事5本、ニュース週1〜3本、用語集150語、プロジェクトDB初期版、補助金カレンダー初期版を順次公開。',
      isCurrent: true,
    },
    {
      phase: 'Phase 1',
      period: '3〜4ヶ月',
      title: '変電所別 系統空き容量公開',
      description:
        'キラーコンテンツ第1弾。10電力会社の公開情報を集約した変電所単位のデータベース。週次更新。',
      isCurrent: false,
    },
    {
      phase: 'Phase 1',
      period: '5〜6ヶ月',
      title: '日本の蓄電所マップ公開',
      description:
        'キラーコンテンツ第2弾。プロジェクトDBと系統情報をレイヤー連動した地図ベースの体験。',
      isCurrent: false,
    },
    {
      phase: 'Phase 1',
      period: '9〜10ヶ月',
      title: '火災・トラブル事例DB公開',
      description:
        'キラーコンテンツ第3弾。国内の蓄電池トラブル事例を公開資料に基づき整理した、業界の安全文化向上に資する情報基盤。',
      isCurrent: false,
    },
  ] as RoadmapItem[],
} as const;

export type SiteConfig = typeof siteConfig;
