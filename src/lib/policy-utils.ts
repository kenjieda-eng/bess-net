// 政策・法制度カレンダー 共有ユーティリティ（P1-P3・2026-07-05）
// - 表示ロジック（色・日付整形・firstOf）は PolicyCalendarClient から移設し、
//   一覧と詳細ページで共有（文言・判定の複製再実装をしない）。
// - POLICY_DETAIL_SLUGS: 詳細ページ化する充実エントリ9件（thin content 回避のハイブリッド設計）。
//   ユウ選定監査（policy-calendar分析_2026-07-05 §6）で確定。増減は週次政策チェックで運用。
// - POLICY_TIMELINES: 編集部指定の制度タイムライン4組。

export const EVENT_TYPE_COLORS: Record<string, string> = {
  オークション: '#0066cc',
  パブコメ: '#cc6600',
  法改正: '#cc0066',
  重要会議: '#006666',
  公表: '#666666',
};

export const STATUS_COLORS: Record<string, string> = {
  予定: '#0066cc',
  進行中: '#cc6600',
  終了: '#888888',
};

export function firstOf(arr: string[] | string | undefined): string {
  if (Array.isArray(arr)) return arr[0] ?? '';
  return arr ?? '';
}

export function formatDateJa(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')} (${wd})`;
}

/** JST の今日を YYYY-MM-DD で返す（トップの「今後の政策イベント」判定用） */
export function jstTodayISO(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** ISO日時 → JST の YYYY-MM-DD（microCMS date は UTC 格納のため +9h で日付化） */
export function jstDateOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return (iso || '').slice(0, 10);
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * 表示用ステータスの日付自動導出（L-EIC-027 横展開・2026-07-05。第2弾で events にも汎用化）。
 * policy-events（一覧・詳細）と industry-events（/events 一覧）の表示経路はこの関数を通す
 * （microCMS データは不変＝表示側 derive のみ）。
 * ルール（これ以外は変えない）:
 *  - 格納「予定」かつ 基準日 < 今日(JST) → 「終了」に自動補正（既存語彙のみ・新語彙は導入しない）
 *  - 基準日 = endDate（期間イベントの最終日）があればそれ、なければ eventDate
 *    → 開催中（6/30〜7/2 等）に「終了」と出さない
 *  - 例外: 種別「パブコメ」は対象外（policy用。日付=公示日・締切は description 内でコード判定不能）
 *  - 格納「進行中」「終了」は一切変更しない（人手判断の尊重）
 */
export function deriveDisplayStatus(ev: {
  eventDate: string;
  endDate?: string;
  eventType?: string[] | string;
  status?: string[] | string;
}): string {
  const stored = firstOf(ev.status);
  if (stored !== '予定') return stored;
  if (firstOf(ev.eventType) === 'パブコメ') return stored;
  const base = ev.endDate || ev.eventDate;
  if (jstDateOf(base) < jstTodayISO()) return '終了';
  return stored;
}

/** 詳細ページ化する対象10件（slug＝policy-events の slug フィールド） */
export const POLICY_DETAIL_SLUGS: readonly string[] = [
  'meti-connection-review-cap-2026-08',        // 2026-08-01 接続検討数の事業者別上限
  'capacity-outage-plan-briefing-2026-06',     // 2026-06-26 容量市場 実務説明会（容量停止計画）
  'meti-grid-wg11-bess-connection-2026-06',    // 2026-06-10 第11回 次世代電力系統WG（土地使用権原）
  'occto-balancing-committee-61-2026-06',      // 2026-06-09 第61回 需給調整市場検討小委員会
  'meti-reserve-capacity-bid-pubcomm-2026-06', // 2026-06-05 予備電源GL・容量市場入札GL パブコメ
  'meti-battery-power-industry-strategy-2026-06', // 2026-06-02 蓄電池産業戦略推進会議
  'occto-capacity-kentoukai-73-2026-05',       // 2026-05-27 第73回 容量市場検討会（週次2026-07-17 追加・ハイブリッド基準充足）
  'ltdc-3-auction-result-2026-05',             // 2026-05-13 LTDC第3回 約定結果
  'bess-grid-connection-quick-2026-04',        // 2026-04-01 接続検討早期化＋暫定空押さえ対策
  'balancing-market-reform-2026-03',           // 2026-03-13 需給調整市場 2026年度改革
];

export const POLICY_DETAIL_SLUG_SET: ReadonlySet<string> = new Set(POLICY_DETAIL_SLUGS);

/** 制度タイムライン（編集部指定4組）。slug 無しの項目は一覧（/policy-calendar）へリンク */
export type TimelineItem = { date: string; label: string; slug?: string };
export type PolicyTimeline = { key: string; title: string; items: TimelineItem[] };

export const POLICY_TIMELINES: Record<string, PolicyTimeline> = {
  karaosae: {
    key: 'karaosae',
    title: '空押さえ対策の段階施行',
    items: [
      { date: '2026-04-01', label: '接続検討の早期化運用＋暫定空押さえ対策', slug: 'bess-grid-connection-quick-2026-04' },
      { date: '2026-08-01', label: '接続検討数の事業者別上限 運用開始（予定）', slug: 'meti-connection-review-cap-2026-08' },
      { date: '2026-10-01', label: '土地使用権原の要件化（規程改正・予定／第11回 次世代電力系統WG）', slug: 'meti-grid-wg11-bess-connection-2026-06' },
    ],
  },
  ltdc3: {
    key: 'ltdc3',
    title: '長期脱炭素電源オークション 第3回',
    items: [
      { date: '2026-01-15', label: '第3回 応札開始' },
      { date: '2026-05-13', label: '約定結果公表', slug: 'ltdc-3-auction-result-2026-05' },
    ],
  },
  balancing2026: {
    key: 'balancing2026',
    title: '需給調整市場 2026年度の制度改定',
    items: [
      { date: '2026-03-13', label: '2026年度改革（全商品前日取引化ほか）', slug: 'balancing-market-reform-2026-03' },
      { date: '2026-04-01', label: '二次調整力①・② 2026年度商品 制度改定' },
      { date: '2026-06-09', label: '第61回 需給調整市場検討小委員会', slug: 'occto-balancing-committee-61-2026-06' },
    ],
  },
  strategy: {
    key: 'strategy',
    title: '蓄電池産業戦略の展開',
    items: [
      { date: '2024-11-15', label: '蓄電池産業戦略検討会 第1回' },
      { date: '2026-06-02', label: '「蓄電池・電源産業戦略」へ改訂（蓄電池産業戦略推進会議）', slug: 'meti-battery-power-industry-strategy-2026-06' },
    ],
  },
};

/** 詳細ページ slug → 表示するタイムライン key（編集部指定の対象ページのみ） */
export const SLUG_TO_TIMELINES: Record<string, string[]> = {
  'meti-connection-review-cap-2026-08': ['karaosae'],
  'meti-grid-wg11-bess-connection-2026-06': ['karaosae'],
  'bess-grid-connection-quick-2026-04': ['karaosae'],
  'ltdc-3-auction-result-2026-05': ['ltdc3'],
  'occto-balancing-committee-61-2026-06': ['balancing2026'],
  'balancing-market-reform-2026-03': ['balancing2026'],
  'meti-battery-power-industry-strategy-2026-06': ['strategy'],
};
