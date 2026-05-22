/**
 * src/data/milestones.ts — 達成記念ページ用データ定義
 *
 * 設計:
 *   - /milestones/[slug] 動的ルートのデータソース
 *   - status: 'upcoming' (準備中、公開待ち) / 'achieved' (達成済) / 'planned' (詳細未定)
 *   - L-029: 先回り起草で運用効率最大化
 *
 * 5/22 朝のアクション:
 *   feature-complete エントリの status を 'upcoming' → 'achieved' に変更、commit + push
 */

export type MilestoneCategory =
  | 'feature-complete' // 機能完全形達成
  | 'industry-report' // 業界レポート公開
  | 'industry-uniqueness' // 業界唯一性達成
  | 'database-launch' // データベース公開
  | 'partnership' // 連携・パートナーシップ
  | 'other'; // その他

export interface MilestoneAchievement {
  label: string;
  detail: string;
  metric?: string; // 数値で表せる達成 (commit 数 / catalog 系列数 等)
}

export interface MilestoneData {
  slug: string; // パス末尾 (例: '2026-05-22-feature-complete')
  date: string; // ISO 8601 (YYYY-MM-DD)
  category: MilestoneCategory;
  status: 'achieved' | 'upcoming' | 'planned';
  // メタ (SEO)
  title: string;
  description: string;
  ogImage?: string;
  // ヒーロー
  heroTitle: string;
  heroSubtitle: string;
  heroBadge?: string;
  // 達成内容
  achievements: MilestoneAchievement[];
  // 関連リンク
  relatedLinks?: { label: string; url: string }[];
  // 今後の予告
  upcomingMilestones?: { date: string; label: string; url?: string }[];
}

export const MILESTONES: MilestoneData[] = [
  {
    slug: '2026-05-22-feature-complete',
    date: '2026-05-22',
    category: 'feature-complete',
    status: 'achieved', // ✨ 2026-05-22 機能完全形達成日に正式公開
    title: '機能完全形達成 - 蓄電所ネット | 2026年5月22日',
    description:
      '蓄電所ネット (bess-net) が 2026 年 5 月 22 日に機能完全形を達成。Sprint X1 完走 (Buyer/Seller 8 LandingPage 実装)、D-017 ACCEPTED 正式化、業界唯一性 13/17 達成。一般社団法人エネルギー情報センターが業界中立で運営。',
    ogImage: '/og-image.png',
    heroTitle: '機能完全形達成 — 蓄電池業界の引用インフラ確立',
    heroSubtitle:
      '2026 年 5 月 22 日、蓄電所ネット (bess-net) は機能完全形達成。業界事業者向けの Buyer/Seller 8 LandingPage、火災リスク自己診断、IRR シミュレーター、容量市場入札ツール、業界レポート 2026、AJ 火災事例 DB、VIP 引用、データ品質基盤を完成。',
    heroBadge: '業界唯一性 13/17 達成',
    achievements: [
      {
        label: 'Sprint X1 完走 (5/19-5/21)',
        detail:
          'Buyer Landing 4 ページ (工場・商業施設 / 容量市場 / 需給調整市場 / PPA・オフテイク) + Seller Landing 4 ページ (メーカー / EPC / 開発事業者 / 中古売買・リユース) = 計 8 ページ稼働、業界事業者向け接触点完成',
        metric: '8 LandingPage',
      },
      {
        label: 'D-017 ACCEPTED 正式化',
        detail:
          'data.eic-jp.org の catalog.csv_path フィールド導入により、bess-net 側 DIR_MAP 撤廃、catalog 自己記述化を実現。L-EIC-005 恒久解決、両側 Cowork セッション間連携品質向上',
        metric: 'L-EIC-005 恒久解決',
      },
      {
        label: '業界唯一性 13/17 達成',
        detail:
          '蓄電所ネット独自機能 13 項目を確立: SOC 設計、容量市場入札ツール、IRR シミュレーター、火災リスク自己診断、プロジェクト案件 DB、ダッシュボード市場、JEPX 連動分析、ニュース、用語集、インシデント、Methodology、データ引用規約、本記念ページ',
        metric: '13/17 (76%)',
      },
      {
        label: 'FireRiskChecker UI 品質完成',
        detail:
          '5/18 朝の 37a 投入で 32 箇所の fontSize を一括 bump、業界事業者の読みやすさ大幅向上。font-size:16px が本文・label に 50 箇所出現。L-JEPX-UI-014/016/017 確立',
        metric: '32 箇所一括 bump',
      },
      {
        label: 'data.eic-jp.org 連携稼働',
        detail:
          'リン (data.eic-jp.org 編集長) との Phase D 第 1 期連動。catalog 約 133 系列引用 (5/22 機能完全形達成日 + Phase D Day 1-3 容量市場 11 系列追加完了時想定値、リン case A 準拠、L-EIC-008 §1 で 5/22 朝の実体確認で確定)。JEPX 10 + JMA 気象 (気温・降水量・日照・風速・積雪・風向) + 燃料 7 + FX 4 + JGB 1 + METI 12 + 米 Treasury 4 + 容量市場 11 系列 + その他の業界中立データ提供基盤',
        metric: 'catalog 約 133 系列',
      },
      {
        label: 'EIC グループ 3 層エコシステム稼働',
        detail:
          'bess-net.jp (業界専門ハブ) + eic-jp.org (運営窓口、10 年実績) + data.eic-jp.org (データ基盤) の 3 層連携完成。お問い合わせ動線は 5/22-8/31 期は EIC 本体に集約、9/2 以降は独自フォーム稼働予定',
        metric: '3 層連携',
      },
      {
        label: 'L 教訓 33 件体系化',
        detail:
          'L-001〜L-024 基礎教訓 + L-EIC-DASH 系 6 件 + L-JEPX-UI 系 17 件 + L-EIC 系 7 件 + L-MCMS-AUTO 系 3 件。特に L-EIC-008 = 異なる Cowork セッション間認識乖離予防策で品質基盤強化',
        metric: '33 件',
      },
    ],
    relatedLinks: [
      { label: '火災リスク自己診断', url: '/tools/fire-risk-check' },
      { label: 'IRR シミュレーター', url: '/tools/irr-simulator' },
      { label: '容量市場入札ツール', url: '/tools/capacity-market-bid' },
      { label: '補助金マッチング', url: '/tools/subsidy-match' },
      { label: '系統連系診断', url: '/tools/grid-connection-check' },
      { label: 'マーケットデータダッシュボード', url: '/dashboard/market' },
    ],
    upcomingMilestones: [
      {
        date: '2026-05-24',
        label: '業界レポート 2026 公開 (業界唯一性 14/17 達成)',
        url: '/milestones/2026-05-24-industry-report-2026',
      },
      {
        date: '2026-05-28',
        label: 'AJ 火災事例 DB 公開 (業界唯一性 16/17 達成)',
        url: '/milestones/2026-05-28-aj-fire-database',
      },
      {
        date: '2026-06-11',
        label: 'VIP 引用公開 → 業界唯一性 17/17 完全達成 ✨',
        url: '/milestones/2026-06-11-vip-citation',
      },
      {
        date: '2026-11-21',
        label: '業界唯一性 25/25 達成 (予定) ✨',
      },
      {
        date: '2026-12-25',
        label: '業界レポート 2027 公開 (予定)',
      },
    ],
  },
  // 雛形のみ — 各達成日に詳細追記予定
  {
    slug: '2026-05-24-industry-report-2026',
    date: '2026-05-24',
    category: 'industry-report',
    status: 'planned',
    title: '業界レポート 2026 公開 - 蓄電所ネット',
    description: '【5/24 公開後に詳細追記】業界レポート 2026 公開予定。',
    heroTitle: '業界レポート 2026 公開 (準備中)',
    heroSubtitle: '5/24 公開後に詳細追記予定。蓄電所ネット (bess-net) の年次業界レポート。',
    achievements: [],
  },
  {
    slug: '2026-05-28-aj-fire-database',
    date: '2026-05-28',
    category: 'database-launch',
    status: 'planned',
    title: 'AJ 火災事例 DB 公開 - 蓄電所ネット',
    description: '【5/28 公開後に詳細追記】AJ 火災事例 DB 公開予定。',
    heroTitle: 'AJ 火災事例 DB 公開 (準備中)',
    heroSubtitle: '5/28 公開後に詳細追記予定。蓄電池火災事例の体系化 DB。',
    achievements: [],
  },
  {
    slug: '2026-06-11-vip-citation',
    date: '2026-06-11',
    category: 'industry-uniqueness',
    status: 'planned',
    title: 'VIP 引用公開 → 業界唯一性 17/17 完全達成 - 蓄電所ネット',
    description: '【6/11 公開後に詳細追記】VIP 引用公開予定、業界唯一性 17/17 完全達成。',
    heroTitle: '業界唯一性 17/17 完全達成 (準備中)',
    heroSubtitle: '6/11 公開後に詳細追記予定。VIP 引用基盤稼働、業界唯一性 17 項目すべて達成。',
    achievements: [],
  },
];

// ユーティリティ関数
export function getMilestoneBySlug(slug: string): MilestoneData | undefined {
  return MILESTONES.find((m) => m.slug === slug);
}

export function getAchievedMilestones(): MilestoneData[] {
  return MILESTONES.filter((m) => m.status === 'achieved').sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function getUpcomingMilestones(): MilestoneData[] {
  return MILESTONES.filter((m) => m.status === 'upcoming' || m.status === 'planned').sort(
    (a, b) => a.date.localeCompare(b.date),
  );
}
