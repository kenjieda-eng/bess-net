/**
 * src/data/contact-pages-configs.ts
 *
 * /contact ディレクトリ 6ページ (index + 5 区分) の設定
 *
 * 設計:
 *   - Server Component のみ（'use client' 不使用）
 *   - CTA は全て https://eic-jp.org/contact へ外部リンク
 *   - ContactPageLayout が本設定ファイルを参照してページ生成
 *   - JSON-LD ContactPage は page.tsx で出力
 */

export type PlayerType = 'buyer' | 'seller' | 'media' | 'investor' | 'advisor';

export interface ContactPageGuidance {
  /** アイコン（emoji） */
  icon: string;
  title: string;
  description: string;
}

export interface ContactPageConfig {
  type: PlayerType;
  /** URL スラグ: /contact/[type] */
  slug: string;
  /** <title> / OGP */
  title: string;
  description: string;
  heroH1: string;
  heroSubcopy: string;
  /** お問い合わせ内容の案内 (3〜4件) */
  guidances: ContactPageGuidance[];
  ctaLabel: string;
  ctaUrl: string;
  /** 関連ページリンク (2〜4件) */
  relatedLinks: { label: string; url: string }[];
}

export interface ContactIndexConfig {
  title: string;
  description: string;
  heroH1: string;
  heroSubcopy: string;
  /** 5区分カード */
  categories: {
    type: PlayerType;
    label: string;
    description: string;
    url: string;
    icon: string;
  }[];
}

// ─────────────────────────────────────
// 5 区分 個別ページ設定
// ─────────────────────────────────────

export const CONTACT_PAGES_CONFIGS: Record<PlayerType, ContactPageConfig> = {
  buyer: {
    type: 'buyer',
    slug: 'buyer',
    title: '蓄電池導入・参入検討者のお問い合わせ | 蓄電所ネット',
    description:
      '系統用蓄電池や低圧蓄電池の導入・参入を検討されている事業者様向けのお問い合わせページ。補助金・IRR試算・系統連系など、事業化に向けた情報提供をサポートします。',
    heroH1: '蓄電池導入・参入を検討されている方へ',
    heroSubcopy:
      '系統用蓄電池・低圧蓄電池の事業参入、補助金活用、IRR試算、系統連系など、蓄電所ネットの情報・ツールに関するご質問・ご相談を受け付けています。',
    guidances: [
      {
        icon: '🔋',
        title: 'IRR試算・事業性評価に関するご相談',
        description:
          'IRRシミュレーターの使い方、試算結果の読み方、事業性評価の前提条件などについてご質問いただけます。',
      },
      {
        icon: '📋',
        title: '補助金・助成金に関するご質問',
        description:
          '補助金マッチングツールの結果や補助金申請に関する情報整理のご相談を承ります。個別の申請代行は行っておりません。',
      },
      {
        icon: '⚡',
        title: '系統連系・変電所情報に関するご質問',
        description:
          '系統連系診断ツールの結果解釈や、変電所別系統空き容量データの見方についてお問い合わせいただけます。',
      },
      {
        icon: '📊',
        title: 'データ提供・掲載内容の確認',
        description:
          '掲載プロジェクトデータの更新依頼、事業者情報の修正・追加申請もこちらから承ります。',
      },
    ],
    ctaLabel: 'お問い合わせフォームへ（エネルギー情報センター）',
    ctaUrl: 'https://eic-jp.org/contact',
    relatedLinks: [
      { label: '蓄電池IRRシミュレーター', url: '/tools/irr-simulator' },
      { label: '蓄電池補助金マッチング', url: '/tools/subsidy-match' },
      { label: '系統連系診断', url: '/tools/grid-connection-check' },
      { label: 'これから参入する事業者向け', url: '/buyer/new-entry' },
    ],
  },

  seller: {
    type: 'seller',
    slug: 'seller',
    title: 'メーカー・EPC・デベロッパーのお問い合わせ | 蓄電所ネット',
    description:
      '蓄電池メーカー・EPC事業者・プロジェクトデベロッパー向けのお問い合わせページ。事業者掲載、プロジェクト登録、データ連携についてご相談いただけます。',
    heroH1: 'メーカー・EPC・デベロッパーの方へ',
    heroSubcopy:
      '蓄電池メーカー、EPC事業者、プロジェクトデベロッパーの皆様。事業者ナビへの掲載、プロジェクトDBへの登録、データ連携のご要望はこちらからご連絡ください。',
    guidances: [
      {
        icon: '🏭',
        title: '事業者ナビへの掲載・情報更新',
        description:
          '事業者ナビ（403社掲載）への新規掲載申請、既存掲載情報の修正・更新依頼を承ります。',
      },
      {
        icon: '🗂️',
        title: 'プロジェクトDBへの登録',
        description:
          '国内蓄電所プロジェクトDBへのプロジェクト情報の新規登録・更新をご依頼いただけます。',
      },
      {
        icon: '🤝',
        title: 'データ連携・API提供に関するご相談',
        description:
          '自社データや公開情報を蓄電所ネットと連携したい場合のご相談を受け付けています。',
      },
      {
        icon: '📢',
        title: '補助金・入札情報の提供依頼',
        description:
          '補助金カレンダーや政策カレンダーへの情報提供・掲載依頼もこちらからご連絡ください。',
      },
    ],
    ctaLabel: 'お問い合わせフォームへ（エネルギー情報センター）',
    ctaUrl: 'https://eic-jp.org/contact',
    relatedLinks: [
      { label: '事業者ナビ', url: '/operators' },
      { label: 'プロジェクトDB', url: '/projects' },
      { label: 'メーカー向け情報', url: '/seller/manufacturer' },
      { label: 'EPC事業者向け情報', url: '/seller/epc' },
    ],
  },

  media: {
    type: 'media',
    slug: 'media',
    title: 'メディア・報道機関のお問い合わせ | 蓄電所ネット',
    description:
      'メディア・報道機関・研究機関向けのお問い合わせページ。取材対応、資料提供、コメント依頼はこちらから受け付けています。',
    heroH1: 'メディア・報道機関の方へ',
    heroSubcopy:
      '蓄電所ネット／エネルギー情報センターへの取材申込み、資料提供依頼、データ利用許諾に関するお問い合わせを受け付けています。迅速に対応いたします。',
    guidances: [
      {
        icon: '📰',
        title: '取材・インタビュー申込み',
        description:
          '系統用蓄電池市場、再エネ業界の動向、蓄電所ネットの取り組みに関する取材・インタビューのご依頼を受け付けています。',
      },
      {
        icon: '📊',
        title: 'データ・統計資料の提供依頼',
        description:
          '掲載データ（プロジェクト数、市場規模推計、補助金実績など）の詳細資料や、記事・レポートへの引用許諾についてお問い合わせください。',
      },
      {
        icon: '📝',
        title: 'プレスリリース・情報提供',
        description:
          '業界関連のプレスリリース、新規サービス・プロジェクトの情報提供はこちらからお送りください。掲載可否を検討します。',
      },
      {
        icon: '🔬',
        title: '学術・研究利用のご相談',
        description:
          '大学・研究機関による学術目的のデータ利用、共同研究の提案もお問い合わせいただけます。',
      },
    ],
    ctaLabel: '取材・報道お問い合わせフォームへ（エネルギー情報センター）',
    ctaUrl: 'https://eic-jp.org/contact',
    relatedLinks: [
      { label: '業界レポート2026', url: '/reports/2026' },
      { label: '蓄電所ネットについて', url: '/about' },
      { label: '編集方針', url: '/editorial-policy' },
      { label: '業界分析ハブ', url: '/industry' },
    ],
  },

  investor: {
    type: 'investor',
    slug: 'investor',
    title: '投資家・ファンドのお問い合わせ | 蓄電所ネット',
    description:
      '機関投資家・ベンチャーキャピタル・インフラファンド向けのお問い合わせページ。市場データ提供、業界レポート、投資判断支援情報についてご相談いただけます。',
    heroH1: '投資家・ファンドの方へ',
    heroSubcopy:
      '系統用蓄電池市場への投資を検討されている機関投資家・ファンドの皆様。市場データ、業界レポート、投資判断支援に関するご相談を受け付けています。',
    guidances: [
      {
        icon: '💹',
        title: '市場データ・統計のご要望',
        description:
          'IRR試算データ、容量市場約定価格推移、補助金実績など、投資判断に資する市場データの提供・詳細解説についてお問い合わせください。',
      },
      {
        icon: '📈',
        title: '業界レポートへのアクセス',
        description:
          '業界レポート2026を含む詳細分析資料、エリア別の事業性試算など、機関投資家向けの情報提供についてご相談いただけます。',
      },
      {
        icon: '🔎',
        title: 'プロジェクト情報・デューデリジェンス支援',
        description:
          '特定プロジェクトの詳細情報確認、プロジェクトデータベースの有効活用方法についてお問い合わせいただけます。',
      },
      {
        icon: '🤝',
        title: '情報パートナーシップ・連携',
        description:
          '貴社サービスとのデータ連携、共同レポート作成、情報パートナーシップに関するご提案を受け付けています。',
      },
    ],
    ctaLabel: 'お問い合わせフォームへ（エネルギー情報センター）',
    ctaUrl: 'https://eic-jp.org/contact',
    relatedLinks: [
      { label: '業界レポート2026', url: '/reports/2026' },
      { label: 'マーケットデータダッシュボード', url: '/dashboard/market' },
      { label: '容量市場応札試算ツール', url: '/tools/capacity-market-bid' },
      { label: '投資家・ファンド向け情報', url: '/buyer/investor' },
    ],
  },

  advisor: {
    type: 'advisor',
    slug: 'advisor',
    title: 'コンサルタント・専門家のお問い合わせ | 蓄電所ネット',
    description:
      'エネルギーコンサルタント・法律・財務専門家・行政関係者向けのお問い合わせページ。情報連携、コンテンツ協力、専門家ネットワークへの参加についてご相談いただけます。',
    heroH1: 'コンサルタント・専門家の方へ',
    heroSubcopy:
      'エネルギーコンサルタント、弁護士・会計士・技術士など専門家の皆様。蓄電所ネットとの情報連携、コンテンツ監修協力、専門知識の提供についてご相談ください。',
    guidances: [
      {
        icon: '🎓',
        title: 'コンテンツ監修・専門知識の提供',
        description:
          '解説記事・用語集・ツールの内容監修、専門的観点からのレビュー協力についてお問い合わせいただけます。',
      },
      {
        icon: '🔗',
        title: '情報連携・共同プロジェクト',
        description:
          '業界団体、行政機関、コンサルティングファームとの情報連携や共同コンテンツ制作についてご相談を受け付けています。',
      },
      {
        icon: '📚',
        title: '研修・セミナー資料の活用',
        description:
          '蓄電所ネットのデータ・解説記事を研修・セミナーに活用したい場合の利用許諾・協力依頼をお問い合わせください。',
      },
      {
        icon: '🏛️',
        title: '政策・制度情報の提供・修正依頼',
        description:
          '政策カレンダー・補助金情報の内容に関するご指摘、行政機関からの公式情報提供のご連絡はこちらからお願いします。',
      },
    ],
    ctaLabel: 'お問い合わせフォームへ（エネルギー情報センター）',
    ctaUrl: 'https://eic-jp.org/contact',
    relatedLinks: [
      { label: '業界分析ハブ', url: '/industry' },
      { label: '蓄電池用語集', url: '/glossary' },
      { label: '業界解説', url: '/explainer' },
      { label: '政策・法制度カレンダー', url: '/policy-calendar' },
    ],
  },
};

// ─────────────────────────────────────
// /contact インデックスページ設定
// ─────────────────────────────────────

export const CONTACT_INDEX_CONFIG: ContactIndexConfig = {
  title: 'お問い合わせ | 蓄電所ネット',
  description:
    '蓄電所ネット（運営：一般社団法人エネルギー情報センター）へのお問い合わせ。蓄電池導入・参入検討、メーカー・EPC事業者、メディア、投資家、専門家の方それぞれの窓口をご案内します。',
  heroH1: 'お問い合わせ',
  heroSubcopy:
    '蓄電所ネット、および運営元である一般社団法人エネルギー情報センターへのお問い合わせは、お客様の属性に合わせた窓口よりご連絡ください。',
  categories: [
    {
      type: 'buyer',
      label: '蓄電池導入・参入検討者',
      description:
        '補助金、IRR試算、系統連系など導入・参入に関するご質問',
      url: '/contact/buyer',
      icon: '🔋',
    },
    {
      type: 'seller',
      label: 'メーカー・EPC・デベロッパー',
      description:
        '事業者掲載、プロジェクト登録、データ連携のご依頼',
      url: '/contact/seller',
      icon: '🏭',
    },
    {
      type: 'media',
      label: 'メディア・報道機関',
      description:
        '取材申込み、資料提供、データ引用許諾のご相談',
      url: '/contact/media',
      icon: '📰',
    },
    {
      type: 'investor',
      label: '投資家・ファンド',
      description:
        '市場データ、業界レポート、投資判断支援のご相談',
      url: '/contact/investor',
      icon: '💹',
    },
    {
      type: 'advisor',
      label: 'コンサルタント・専門家',
      description:
        'コンテンツ監修、情報連携、専門知識提供のご相談',
      url: '/contact/advisor',
      icon: '🎓',
    },
  ],
};

/** 全 PlayerType の slug 一覧 */
export const ALL_PLAYER_TYPES: PlayerType[] = [
  'buyer',
  'seller',
  'media',
  'investor',
  'advisor',
];
