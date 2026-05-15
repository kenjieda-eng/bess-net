/**
 * JEPX アービトラージ計算ロジック (簡易版)
 *
 * 設計:
 *   - 純関数のみ
 *   - 1日 48slot から最適な充放電タイミングを抽出
 *   - 蓄電池容量 / 充放電効率 / サイクル数で日次粗利益を試算
 */

import { DAILY_DATA, AREAS, type AreaKey, type DailyRecord } from '@/data/jepx-history';

export interface ArbitrageInput {
  area: AreaKey;
  daysAgo: number;
  capacityMWh: number; // 蓄電池容量
  roundTripEfficiency: number; // 0-1, 例 0.85
  cycles: number; // 1日あたりサイクル数 (1 or 2)
}

export interface ArbitrageResult {
  date: string;
  area: AreaKey;
  buySlots: number[]; // 安値 slot indices
  sellSlots: number[]; // 高値 slot indices
  avgBuyPrice: number;
  avgSellPrice: number;
  spread: number;
  grossRevenue: number; // 円
  efficiencyLoss: number; // 円
  netRevenue: number; // 円
}

export function findDailyRecord(area: AreaKey, daysAgo: number): DailyRecord | null {
  return DAILY_DATA.find((r) => r.area === area && r.daysAgo === daysAgo) ?? null;
}

/**
 * 1日のアービトラージ最大利益を試算
 * - 安値 N slot で充電、高値 N slot で放電 (cycles ベース)
 * - 効率損失は売電側で控除
 */
export function calcArbitrage(input: ArbitrageInput): ArbitrageResult | null {
  const rec = findDailyRecord(input.area, input.daysAgo);
  if (!rec) return null;

  // 蓄電池 1サイクル = 1回フル充放電
  // 1サイクルあたり 充電 8 slot (4h) + 放電 8 slot (4h) を想定
  const slotsPerCycle = 8;
  const totalSlots = slotsPerCycle * input.cycles;

  // 価格 + slot index 配列
  const priceIdx = rec.slots.map((p, idx) => ({ p, idx }));
  const sortedAsc = [...priceIdx].sort((a, b) => a.p - b.p);
  const sortedDesc = [...priceIdx].sort((a, b) => b.p - a.p);

  const buySlots = sortedAsc.slice(0, totalSlots).map((x) => x.idx).sort((a, b) => a - b);
  const sellSlots = sortedDesc.slice(0, totalSlots).map((x) => x.idx).sort((a, b) => a - b);

  const buyPrices = buySlots.map((i) => rec.slots[i]);
  const sellPrices = sellSlots.map((i) => rec.slots[i]);

  const avgBuyPrice = buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length;
  const avgSellPrice = sellPrices.reduce((a, b) => a + b, 0) / sellPrices.length;
  const spread = avgSellPrice - avgBuyPrice;

  // 1サイクルあたり放電量 = capacityMWh (フル放電)
  // cycles 回数分
  const dischargeMWh = input.capacityMWh * input.cycles;
  // 充電量 = 放電量 / 効率
  const chargeMWh = dischargeMWh / input.roundTripEfficiency;

  // 円換算 (1 MWh = 1000 kWh, 価格は 円/kWh)
  const buyCost = chargeMWh * 1000 * avgBuyPrice;
  const sellRevenue = dischargeMWh * 1000 * avgSellPrice;
  const grossRevenue = sellRevenue - buyCost;
  // 効率損失額 (参考表示用) = 失われた kWh × 平均価格
  const efficiencyLoss = (chargeMWh - dischargeMWh) * 1000 * ((avgBuyPrice + avgSellPrice) / 2);

  return {
    date: rec.dateStr,
    area: input.area,
    buySlots,
    sellSlots,
    avgBuyPrice: Math.round(avgBuyPrice * 100) / 100,
    avgSellPrice: Math.round(avgSellPrice * 100) / 100,
    spread: Math.round(spread * 100) / 100,
    grossRevenue: Math.round(grossRevenue),
    efficiencyLoss: Math.round(efficiencyLoss),
    netRevenue: Math.round(grossRevenue),
  };
}

/**
 * 過去 N 日の平均日次粗利益
 */
export function calcAvgArbitrage(area: AreaKey, days: number, capacityMWh: number, eff: number, cycles: number): {
  avgNetRevenue: number;
  totalRevenue: number;
  bestDay: ArbitrageResult | null;
  worstDay: ArbitrageResult | null;
} {
  const results: ArbitrageResult[] = [];
  for (let d = 0; d < days; d++) {
    const r = calcArbitrage({ area, daysAgo: d, capacityMWh, roundTripEfficiency: eff, cycles });
    if (r) results.push(r);
  }
  if (results.length === 0) {
    return { avgNetRevenue: 0, totalRevenue: 0, bestDay: null, worstDay: null };
  }
  const total = results.reduce((sum, r) => sum + r.netRevenue, 0);
  const avg = total / results.length;
  const sorted = [...results].sort((a, b) => b.netRevenue - a.netRevenue);
  return {
    avgNetRevenue: Math.round(avg),
    totalRevenue: Math.round(total),
    bestDay: sorted[0] ?? null,
    worstDay: sorted[sorted.length - 1] ?? null,
  };
}

/**
 * エリア間 spread 比較 (過去 N日 平均)
 */
export function compareAreas(days: number, capacityMWh: number, eff: number, cycles: number): Array<{
  area: AreaKey;
  avgNetRevenue: number;
  avgSpread: number;
}> {
  return AREAS.map((area) => {
    const result = calcAvgArbitrage(area, days, capacityMWh, eff, cycles);
    const results: number[] = [];
    for (let d = 0; d < days; d++) {
      const r = calcArbitrage({ area, daysAgo: d, capacityMWh, roundTripEfficiency: eff, cycles });
      if (r) results.push(r.spread);
    }
    const avgSpread = results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0;
    return {
      area,
      avgNetRevenue: result.avgNetRevenue,
      avgSpread: Math.round(avgSpread * 100) / 100,
    };
  }).sort((a, b) => b.avgNetRevenue - a.avgNetRevenue);
}
