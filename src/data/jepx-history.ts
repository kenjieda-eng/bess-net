/**
 * JEPX スポット価格 履歴データ (モック版)
 *
 * 注: 本データは JEPX 公表値をベースに編集部が作成したモックデータです。
 *     構造は本物の JEPX スポット結果に準拠 (30分単位 × 48 slot × 9エリア)。
 *     最新は必ず https://www.jepx.jp/ で確認してください。
 *
 * 設計:
 *   - 過去 30日 × 48 slot × 9 エリア の詳細
 *   - 過去 12ヶ月 × 9 エリア の月次集計
 *   - 値は固定 seed から決定論的に生成（毎 build で同一）
 */

export type AreaKey = 'hokkaido' | 'tohoku' | 'tokyo' | 'chubu' | 'hokuriku' | 'kansai' | 'chugoku' | 'shikoku' | 'kyushu';

export const AREA_LABELS: Record<AreaKey, string> = {
  hokkaido: '北海道',
  tohoku: '東北',
  tokyo: '東京',
  chubu: '中部',
  hokuriku: '北陸',
  kansai: '関西',
  chugoku: '中国',
  shikoku: '四国',
  kyushu: '九州',
};

export const AREAS: AreaKey[] = ['hokkaido', 'tohoku', 'tokyo', 'chubu', 'hokuriku', 'kansai', 'chugoku', 'shikoku', 'kyushu'];

// 30分slot ベース価格 (円/kWh) — 標準的な需要パターン
// 0=00:00, 12=06:00, 18=09:00, 24=12:00, 36=18:00, 47=23:30
const BASE_PRICE_BY_SLOT: number[] = [
  // 00:00 - 05:30 (深夜、安い) slots 0-11
  6.5, 6.2, 5.9, 5.7, 5.5, 5.4, 5.3, 5.2, 5.3, 5.4, 5.6, 5.9,
  // 06:00 - 11:30 (朝、上昇) slots 12-23
  6.5, 7.2, 8.5, 9.8, 11.0, 12.2, 13.0, 13.5, 13.0, 12.5, 12.0, 11.5,
  // 12:00 - 17:30 (昼、低下〜夕方) slots 24-35
  10.8, 10.0, 9.5, 9.2, 9.0, 8.8, 8.5, 9.0, 10.5, 12.5, 14.0, 15.5,
  // 18:00 - 23:30 (夕方ピーク → 深夜低下) slots 36-47
  17.0, 18.5, 19.0, 18.0, 16.5, 14.5, 12.5, 10.5, 9.0, 8.0, 7.2, 6.8,
];

// エリア別乗数 (相対価格)
const AREA_MULTIPLIER: Record<AreaKey, number> = {
  hokkaido: 1.05,
  tohoku: 1.02,
  tokyo: 1.10,
  chubu: 1.00,
  hokuriku: 0.92,
  kansai: 1.03,
  chugoku: 0.95,
  shikoku: 0.93,
  kyushu: 0.88, // 九州は太陽光多くて昼安い傾向
};

// 月別乗数 (季節性)
const MONTH_MULTIPLIER: number[] = [
  1.15, // 1月 冬ピーク
  1.10, // 2月
  0.95, // 3月
  0.85, // 4月 春
  0.80, // 5月
  0.92, // 6月 梅雨
  1.20, // 7月 夏ピーク
  1.25, // 8月
  1.05, // 9月
  0.88, // 10月
  0.92, // 11月
  1.08, // 12月
];

// 曜日乗数 (0=日, 1=月 ... 6=土)
const DOW_MULTIPLIER: number[] = [0.85, 1.05, 1.05, 1.05, 1.05, 1.05, 0.90];

// 決定論的擬似乱数 (seed ベース)
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// 単一 slot の価格を計算 (円/kWh)
export function computePrice(daysAgo: number, slot: number, area: AreaKey, refDate: Date = new Date('2026-05-15')): number {
  const date = new Date(refDate);
  date.setDate(date.getDate() - daysAgo);
  const month = date.getMonth(); // 0-11
  const dow = date.getDay(); // 0-6

  const base = BASE_PRICE_BY_SLOT[slot] ?? 10;
  const areaMul = AREA_MULTIPLIER[area];
  const monthMul = MONTH_MULTIPLIER[month];
  const dowMul = DOW_MULTIPLIER[dow];
  // ノイズ ±15% (決定論)
  const seed = daysAgo * 1000 + slot * 10 + AREAS.indexOf(area);
  const noise = 0.85 + pseudoRandom(seed) * 0.30;

  const price = base * areaMul * monthMul * dowMul * noise;
  return Math.round(price * 100) / 100;
}

export interface DailyRecord {
  daysAgo: number; // 0 = 今日, 1 = 昨日 ...
  dateStr: string; // YYYY-MM-DD
  area: AreaKey;
  slots: number[]; // 48 値 (円/kWh)
  avg: number;
  max: number;
  min: number;
}

// 過去 30日 × 9エリア = 270レコード
export const DAILY_DATA: DailyRecord[] = (() => {
  const records: DailyRecord[] = [];
  const refDate = new Date('2026-05-15');
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date(refDate);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().slice(0, 10);
    for (const area of AREAS) {
      const slots: number[] = [];
      for (let s = 0; s < 48; s++) {
        slots.push(computePrice(daysAgo, s, area, refDate));
      }
      const avg = slots.reduce((a, b) => a + b, 0) / slots.length;
      const max = Math.max(...slots);
      const min = Math.min(...slots);
      records.push({
        daysAgo,
        dateStr,
        area,
        slots,
        avg: Math.round(avg * 100) / 100,
        max: Math.round(max * 100) / 100,
        min: Math.round(min * 100) / 100,
      });
    }
  }
  return records;
})();

export interface MonthlyRecord {
  monthsAgo: number;
  yearMonth: string; // YYYY-MM
  area: AreaKey;
  avg: number;
  max: number;
  min: number;
}

// 過去 12ヶ月 × 9エリア = 108レコード
export const MONTHLY_DATA: MonthlyRecord[] = (() => {
  const records: MonthlyRecord[] = [];
  const refDate = new Date('2026-05-15');
  for (let monthsAgo = 0; monthsAgo < 12; monthsAgo++) {
    const date = new Date(refDate);
    date.setMonth(date.getMonth() - monthsAgo);
    const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    for (const area of AREAS) {
      // ある月の代表値: 月内の各日 × 各slot 平均 (簡略化のため30日 × 48 = 1440点)
      let sum = 0, max = -Infinity, min = Infinity, count = 0;
      for (let d = 0; d < 30; d++) {
        for (let s = 0; s < 48; s++) {
          const p = computePrice(monthsAgo * 30 + d, s, area, refDate);
          sum += p;
          if (p > max) max = p;
          if (p < min) min = p;
          count++;
        }
      }
      records.push({
        monthsAgo,
        yearMonth: ym,
        area,
        avg: Math.round((sum / count) * 100) / 100,
        max: Math.round(max * 100) / 100,
        min: Math.round(min * 100) / 100,
      });
    }
  }
  return records;
})();
