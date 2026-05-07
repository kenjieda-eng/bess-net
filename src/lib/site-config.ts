// サイト全体の定数を一元管理
// 名称・URL・メタ情報をここで定義し、各ページから参照する

export type RoadmapStatus = 'done' | 'in-progress' | 'planned';

export type RoadmapItem = {
  phase: string;
  period: string;
  title: string;
  description: string;
  isCurrent?: boolean;
  status: RoadmapStatus;
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
    { label: '系統空き容量', href: '/grid', enabled: true },
    { label: '事業者ナビ', href: '/operators', enabled: true },
    { label: 'プロジェクト', href: '/projects', enabled: true },
    { label: 'お役立ちサイト', href: '/links', enabled: true },
    { label: 'お知らせ', href: '/info', enabled: true },
  ] as NavItem[],

  // フッターのリンク群
  footerLinks: [
    { label: '蓄電所ネットについて', href: '/about' },
    { label: '編集方針', href: '/editorial-policy' },
    { label: 'プライバシーポリシー', href: '/privacy' },
    { label: '利用規約', href: '/terms' },
  ],

  // ロードマップ（トップページ表示用）
  // description 中の `{substations}` プレースホルダーは page.tsx 側で実際の件数に置換
  roadmap: [
    {
      phase: 'Sprint 1',
      period: '基盤整備',
      title: '解説記事・用語集・規約',
      description:
        '解説記事125本、用語集1,516語、編集方針・規約・プライバシーポリシー、お役立ちサイト210件、事業者ナビ403社など、業界知識基盤が整備済み。',
      isCurrent: false,
      status: 'done',
    },
    {
      phase: 'Sprint 1〜2',
      period: '1〜2ヶ月',
      title: 'プロジェクトDB初期版・補助金カレンダー',
      description:
        '国内蓄電所プロジェクトDB稼働中、補助金カレンダーも公開中。',
      isCurrent: false,
      status: 'done',
    },
    {
      phase: 'Sprint 2',
      period: '3〜4ヶ月',
      title: '変電所別 系統空き容量公開',
      description:
        '東北電力NW・北陸電力送配電・四国電力送配電・関西電力送配電・中国電力NW・沖縄電力・北海道電力NW（PDF抽出）の計7社・約{substations}件を公開中。東京PG・中部PG・九州電力送配電を Phase 2 後半で順次追加予定。',
      isCurrent: true,
      status: 'done',
    },
    {
      phase: 'Sprint 3',
      period: '5〜6ヶ月',
      title: '日本の蓄電所マップ公開',
      description:
        '緯度経度補完＋Leaflet 地図ベースのインタラクティブビュー、プロジェクトDB×系統情報のレイヤー連動を準備中。',
      isCurrent: false,
      status: 'in-progress',
    },
    {
      phase: 'Sprint 5',
      period: '9〜10ヶ月',
      title: '火災・トラブル事例DB公開',
      description:
        '国内の蓄電池トラブル事例を公開資料に基づき整理。業界の安全文化向上に資する情報基盤を計画中。',
      isCurrent: false,
      status: 'planned',
    },
  ] as RoadmapItem[],
} as const;

export type SiteConfig = typeof siteConfig;
