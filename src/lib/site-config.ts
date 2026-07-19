// サイト全体の定数を一元管理
// 名称・URL・メタ情報をここで定義し、各ページから参照する

// 低圧クラスタ公開日（2026-07-18）: ナビ・トップの NEW バッジ30日コード導出のSSOT（#108・Stage5でここへ集約）
export const LV_NAV_LAUNCH_DATE = '2026-07-18';

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
    // Sprint 6: 流通案件サンプルページ（EDAさん依頼、全国対応・index公開 2026-06-10）
    { label: '流通案件', href: '/anken', enabled: true },
    { label: 'お役立ちサイト', href: '/links', enabled: true },
    { label: 'お知らせ', href: '/info', enabled: true },
    // Sprint 2 追加 (依頼AB/AC/AD)
    { label: '政策カレンダー', href: '/policy-calendar', enabled: true },
    { label: 'イベント', href: '/events', enabled: true },
    { label: 'FAQ', href: '/faq', enabled: true },
    // Sprint 3 追加 (依頼AM、業界唯一 IRR シミュレーター)
    { label: 'ツール', href: '/tools', enabled: true },
    // EIC Data 統合 (29 系列マーケットダッシュボード、業界唯一)
    { label: 'マーケット', href: '/dashboard/market', enabled: true },
    // Sprint 4 後半 (業界唯一 4ハブの集約 index)
    { label: '業界分析', href: '/industry', enabled: true },
    // 低圧クラスタ Stage1（2026-07-18・NEWバッジは SiteHeader で30日コード導出 #108）
    { label: '低圧蓄電所', href: '/lv', enabled: true },
  ] as NavItem[],

  // フッターのリンク群（主要コーナーへの導線 + サイト情報）
  footerLinks: [
    // Sprint 2 追加コーナー
    { label: '政策・法制度カレンダー', href: '/policy-calendar' },
    { label: '業界イベント・展示会', href: '/events' },
    { label: '業界用語よくある質問', href: '/faq' },
    // Sprint 3 追加 (業界唯一 IRR シミュレーター)
    { label: '蓄電池IRRシミュレーター', href: '/tools/irr-simulator' },
    // 66番 (業界唯一 LCOE/LCOS 計算機)
    { label: 'LCOE・LCOS計算機', href: '/tools/lcoe-lcos' },
    // Sprint 4 追加 (業界唯一 補助金マッチング)
    { label: '蓄電池補助金マッチング', href: '/tools/subsidy-match' },
    // Sprint 4 Day 2 (業界唯一 系統連系診断)
    { label: '系統連系診断', href: '/tools/grid-connection-check' },
    // Sprint 4 Day 3 (業界唯一 火災リスク自己診断、教育型)
    { label: '火災リスク自己診断', href: '/tools/fire-risk-check' },
    // Sprint 4 Day 4 (業界唯一 容量市場応札試算、モック版)
    { label: '容量市場応札試算', href: '/tools/capacity-market-bid' },
    // Sprint 4 後半 (業界唯一 業界構造可視化)
    { label: '業界分析ハブ', href: '/industry' },
    { label: '業界カオスマップ', href: '/map/industry-chaos' },
    { label: 'JEPXハブ', href: '/market/jepx' },
    { label: 'マーケットデータ (29 系列)', href: '/dashboard/market' },
    { label: '海外5市場ハブ', href: '/global' },
    { label: '業界トラッカー', href: '/tracker' },
    // Sprint 5 開始準備
    { label: '業界レポート2026', href: '/reports/2026' },
    { label: '火災・トラブル事例DB', href: '/incidents' },
    // L-029 先回り起草: 5/22 機能完全形達成記念ページ
    { label: '達成記念', href: '/milestones' },
    // Buyer プレイヤー別 (2026-05-25 再設計)
    { label: 'これから参入する事業者', href: '/buyer/new-entry' },
    { label: '投資家・ファンド', href: '/buyer/investor' },
    { label: '土地保有者・地主', href: '/buyer/landowner' },
    { label: '工場・商業施設（自家消費）', href: '/buyer/factory-commercial' },
    // Buyer 収益深掘り (市場別、残置)
    { label: '容量市場 収益解説', href: '/buyer/capacity-market' },
    { label: '需給調整市場 収益解説', href: '/buyer/balancing-market' },
    { label: 'PPA・オフテイク契約', href: '/buyer/ppa-offtake' },
    { label: 'メーカー向け (Seller)', href: '/seller/manufacturer' },
    { label: 'EPC 事業者向け (Seller)', href: '/seller/epc' },
    { label: 'プロジェクトデベロッパー向け (Seller)', href: '/seller/developer' },
    { label: '中古売買・リユース (Seller)', href: '/seller/reuse-secondhand' },
    // Sprint 6 追加: 流通案件サンプルページ（EDAさん依頼、全国対応）
    { label: '流通案件（全国対応）', href: '/anken' },
    // お問い合わせ (Task 51)
    { label: 'お問い合わせ', href: '/contact' },
    // サイト情報
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
        '北海道電力NW（PDF）・東北電力NW・東京電力PG（予想潮流PDF、13都県＋基幹系）・中部電力PG（CSV+GeoJSON、緯度経度付き）・北陸電力送配電・関西電力送配電・中国電力NW・四国電力送配電・九州電力送配電・沖縄電力 の計10社・約{substations}件を公開中。東京電力PG は2026年6月の公開再開を受け収録済み。',
      isCurrent: false,
      status: 'done',
    },
    {
      phase: 'Sprint 3',
      period: '5〜6ヶ月',
      title: '日本の蓄電所マップ公開',
      description:
        '中部地方マップを先行公開（中部電力PG 配下 約1,081箇所、緯度経度付き／当サイト独自の検索可能・地図ベース変電所空き容量DB）。地図対応は現状この1社のみで、残る9社は緯度経度補完を進めつつ Leaflet レイヤーへ順次展開予定。',
      isCurrent: false,
      status: 'in-progress',
    },
    {
      phase: 'Sprint 4',
      period: '7〜8ヶ月',
      title: '当サイト独自機能 17/17 達成（圧倒的日本一基盤完了）',
      description:
        '蓄電池IRRシミュレーター・補助金マッチング・系統連系診断・火災リスク自己診断・容量市場応札試算（Sprint 4 前半 5ツール）に加え、業界カオスマップ・JEPXハブ・海外5市場ハブ・業界トラッカー4種（Sprint 4 後半 4ハブ）を順次公開。当初目標 7/18 を 2ヶ月前倒しで達成、業界の構造可視化フェーズ完了。',
      isCurrent: true,
      status: 'done',
    },
    {
      phase: 'Sprint 5',
      period: '9〜10ヶ月',
      title: '業界レポート2026 公開 + 火災・トラブル事例DB',
      description:
        '当サイト独自機能の蓄積データを編集統合した「業界レポート2026」を公開予定。同時並行で国内蓄電池トラブル事例DBを公開資料に基づき整理、業界の安全文化向上に資する情報基盤を構築。',
      isCurrent: false,
      status: 'planned',
    },
  ] as RoadmapItem[],
} as const;

export type SiteConfig = typeof siteConfig;
