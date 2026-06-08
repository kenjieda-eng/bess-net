/**
 * SOP 頻度マップ ＋ 次回更新予定日計算
 *
 * 設計（D-018、SOP 設計 v1 2026-05-30）:
 *   - 5 リズム: 週次月曜 / 週次金曜 / 月次1日 / 四半期初頭1日 / 半期末日
 *   - 事例時即時 (/incidents) は別軸（ニュース取込中に検知）
 */

export type SopFrequency =
  | 'weekly-monday'
  | 'weekly-friday'
  | 'monthly-1st'
  | 'quarterly-1st'    // 1/4/7/10 月 1 日
  | 'semi-annual-end'  // 6/30 と 12/31
  | 'yearly'
  | 'ad-hoc';          // 事例時即時など

export interface SopEntry {
  id: string;          // 'subsidies' / 'policy-calendar' / ...
  url: string;         // '/subsidies'
  label: string;       // '補助金'
  frequency: SopFrequency;
  persona: string;     // 'セイ' / 'ノブ' / ...
  sopDocPath?: string; // SOP doc への参照（オプション）
  notes?: string;
}

export const SOP_ENTRIES: SopEntry[] = [
  // 週次 月曜
  { id: 'subsidies', url: '/subsidies', label: '補助金', frequency: 'weekly-monday', persona: 'セイ',
    notes: 'SII/NEDO/環境省/METI の公募チェック' },
  { id: 'freshness-check', url: '/ops/freshness', label: 'データ鮮度チェック', frequency: 'weekly-monday', persona: 'モリ',
    notes: 'catalog SLA 違反検知' },
  // 週次 金曜
  { id: 'policy-calendar-weekly', url: '/policy-calendar', label: '政策・パブコメ予定', frequency: 'weekly-friday', persona: 'セイ',
    notes: 'METI/OCCTO 審議会・パブコメ' },
  // 月次 毎月 1 日
  { id: 'news', url: '/news', label: 'ニュース取込', frequency: 'monthly-1st', persona: 'ノブ',
    sopDocPath: '02_計画・運営/ニュース月次キュレーション_標準手順SOP_2026-05-23.md',
    notes: 'PR TIMES「系統用蓄電池」前月分' },
  { id: 'explainer', url: '/explainer', label: '解説 新規 2-4 本', frequency: 'monthly-1st', persona: 'ノブ/セイ' },
  { id: 'glossary', url: '/glossary', label: '用語集 新語 5-10 語', frequency: 'monthly-1st', persona: 'ノブ' },
  { id: 'events', url: '/events', label: 'イベント', frequency: 'monthly-1st', persona: 'チサ' },
  { id: 'projects', url: '/projects', label: 'プロジェクト DB', frequency: 'monthly-1st', persona: 'チサ' },
  { id: 'policy-calendar-monthly', url: '/policy-calendar', label: '政策カレンダー 月次総括', frequency: 'monthly-1st', persona: 'セイ' },
  // 四半期 初頭
  { id: 'grid', url: '/grid', label: '系統空き容量 9 社', frequency: 'quarterly-1st', persona: 'チサ/モリ',
    notes: '東電 PG は月次再開チェックを monthly-1st に統合' },
  { id: 'operators', url: '/operators', label: '事業者ナビ', frequency: 'quarterly-1st', persona: 'チサ' },
  { id: 'industry-chaos', url: '/map/industry-chaos', label: '業界カオスマップ', frequency: 'quarterly-1st', persona: 'チサ' },
  { id: 'incidents-review', url: '/incidents', label: '火災事例 DB 四半期レビュー', frequency: 'quarterly-1st', persona: '山口/加藤/斎藤' },
  { id: 'explainer-review', url: '/explainer', label: '解説 改訂レビュー', frequency: 'quarterly-1st', persona: 'セイ/ノブ' },
  // 半期 末日
  { id: 'global', url: '/global', label: '海外 5 市場', frequency: 'semi-annual-end', persona: 'ジン' },
  { id: 'faq', url: '/faq', label: 'FAQ', frequency: 'semi-annual-end', persona: 'ノブ' },
  // 年次
  { id: 'reports-2026', url: '/reports/2026', label: '業界レポート 2026 本編', frequency: 'yearly', persona: 'ノブ/セイ/リン',
    notes: '7/5/2026 公開予定' },
];

/** 与えられた日付から次の指定曜日の日付を返す（JST 想定） */
function nextWeekday(from: Date, targetDay: number): Date {
  const result = new Date(from);
  const diff = (targetDay - result.getDay() + 7) % 7 || 7;
  result.setDate(result.getDate() + diff);
  return result;
}

/** 次の月初 1 日 */
function nextFirstOfMonth(from: Date): Date {
  const r = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  return r;
}

/** 次の四半期初頭 1 日（1/4/7/10 月） */
function nextQuarterFirst(from: Date): Date {
  const m = from.getMonth(); // 0-11
  const nextQuarterMonth = [3, 6, 9, 0][Math.floor(m / 3)];  // 0→3, 3→6, 6→9, 9→0
  const nextYear = m >= 9 ? from.getFullYear() + 1 : from.getFullYear();
  const candidate = new Date(nextYear, nextQuarterMonth, 1);
  return candidate > from ? candidate : new Date(nextYear, 3, 1);
}

/** 次の半期末日（6/30 or 12/31） */
function nextSemiAnnualEnd(from: Date): Date {
  const y = from.getFullYear();
  const jun30 = new Date(y, 5, 30);
  const dec31 = new Date(y, 11, 31);
  if (from < jun30) return jun30;
  if (from < dec31) return dec31;
  return new Date(y + 1, 5, 30);
}

/** 次の年末（暫定 = 12/25 業界レポート2027 想定） */
function nextYearReport(from: Date): Date {
  const y = from.getFullYear();
  const target = new Date(y, 11, 25);
  return from < target ? target : new Date(y + 1, 11, 25);
}

/** 次回更新予定日 ISO 文字列を返す */
export function nextScheduledAt(entry: SopEntry, now: Date = new Date()): string | null {
  switch (entry.frequency) {
    case 'weekly-monday':    return nextWeekday(now, 1).toISOString();   // 月=1
    case 'weekly-friday':    return nextWeekday(now, 5).toISOString();   // 金=5
    case 'monthly-1st':      return nextFirstOfMonth(now).toISOString();
    case 'quarterly-1st':    return nextQuarterFirst(now).toISOString();
    case 'semi-annual-end':  return nextSemiAnnualEnd(now).toISOString();
    case 'yearly':           return nextYearReport(now).toISOString();
    case 'ad-hoc':           return null;
  }
}

/** 表示用日本語ラベル */
export const FREQ_LABEL: Record<SopFrequency, string> = {
  'weekly-monday':   '週次（月曜）',
  'weekly-friday':   '週次（金曜）',
  'monthly-1st':     '月次（毎月 1 日）',
  'quarterly-1st':   '四半期（初頭 1 日）',
  'semi-annual-end': '半期（末日）',
  'yearly':          '年次',
  'ad-hoc':          '随時（事例発生時）',
};
