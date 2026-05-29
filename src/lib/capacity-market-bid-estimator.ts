/**
 * src/lib/capacity-market-bid-estimator.ts
 *
 * 容量市場応札試算 純粋関数 (依頼AT モック版)
 *
 * 試算モデル:
 *   1. 過去 (2024-2025) 当該エリア・区分の約定価格を取得
 *   2. trend 判定: 直近 2 年比較で rising / flat / falling
 *   3. 推奨応札価格レンジ:
 *      - low: max(自社コスト, 過去平均 × 0.8)
 *      - mid: 過去平均
 *      - high: 過去平均 × 1.3
 *   4. 落札確率近似: 過去価格との乖離から logistic 様で推定
 *      - bid ≤ 過去平均 × 0.8 → 95%
 *      - bid = 過去平均 → 65%
 *      - bid ≥ 過去平均 × 1.3 → 25%
 *   5. 警告:
 *      - 自社コスト > 過去平均 × 1.5 → 採算性要確認
 *      - 過去データ不足 (< 2 件) → 結果信頼性低い
 *      - モック版 disclaimer
 */

import {
  filterHistory,
  filterHistoryByArea,
  type Area,
  type Category,
  type CapacityMarketRecord,
} from './capacity-market-data';

export interface BidEstimateInput {
  area: Area;
  category: Category;
  /** 応札容量 (MW) */
  capacity_mw: number;
  /** 対象年度 (2026 or 2027) */
  target_fiscal_year: number;
  /** 自社コスト (円/kW/年) */
  cost_yen_per_kw_year: number;
}

export interface BidEstimateResult {
  /** 推奨応札価格 下限 (円/kW/年) */
  recommended_bid_low: number;
  recommended_bid_mid: number;
  recommended_bid_high: number;
  /** 落札確率推定 (各価格帯、%) */
  cleared_probability: {
    low_bid: number;
    mid_bid: number;
    high_bid: number;
  };
  /** 過去実績統計 */
  historical_context: {
    /** 直近 2 年平均 (円/kW/年) */
    area_avg: number;
    /** 直近 2 年合計 cleared MW */
    area_total_capacity_mw: number;
    /** トレンド: rising (上昇) / flat / falling (下落) */
    area_trend: 'rising' | 'flat' | 'falling';
    /** 参照レコード数 */
    sample_size: number;
    /** 最新年度の価格 */
    latest_price?: number;
    /** 前年度の価格 */
    prior_price?: number;
  };
  /** 想定収入 (億円/年、応札容量 × 推奨 mid 価格) */
  estimated_annual_revenue_oku: number;
  warnings: string[];
}

const TRENDS = ['rising', 'flat', 'falling'] as const;

/**
 * トレンド判定: 価格変動 ±5% 内 → flat
 *  > +5% → rising
 *  < -5% → falling
 */
function deriveTrend(
  latest?: number,
  prior?: number
): (typeof TRENDS)[number] {
  if (latest === undefined || prior === undefined || prior === 0) return 'flat';
  const ratio = (latest - prior) / prior;
  if (ratio > 0.05) return 'rising';
  if (ratio < -0.05) return 'falling';
  return 'flat';
}

export const TREND_LABELS: Record<(typeof TRENDS)[number], string> = {
  rising: '上昇',
  flat: '横ばい',
  falling: '下落',
};

/**
 * メイン: 入力 → 試算結果
 */
export function estimateBid(input: BidEstimateInput): BidEstimateResult {
  const records: CapacityMarketRecord[] = filterHistory(input.area, input.category);
  const warnings: string[] = [];

  // 過去平均 (cleared_capacity_mw による加重平均、より正確)
  let area_avg = 0;
  let area_total_capacity_mw = 0;
  let weightedSum = 0;
  for (const r of records) {
    weightedSum += r.clearing_price_yen_per_kw_year * r.cleared_capacity_mw;
    area_total_capacity_mw += r.cleared_capacity_mw;
  }
  if (area_total_capacity_mw > 0) {
    area_avg = weightedSum / area_total_capacity_mw;
  }

  // 最新年度 / 前年度の価格
  const sorted = [...records].sort((a, b) => b.fiscal_year - a.fiscal_year);
  const latest_price = sorted[0]?.clearing_price_yen_per_kw_year;
  const prior_price = sorted[1]?.clearing_price_yen_per_kw_year;
  const area_trend = deriveTrend(latest_price, prior_price);

  // 推奨応札価格 (mid = 過去平均、low = max(コスト, mid×0.8)、high = mid×1.3)
  const mid = Math.round(area_avg);
  const lowBase = Math.round(mid * 0.8);
  const recommended_bid_low = Math.max(input.cost_yen_per_kw_year, lowBase);
  const recommended_bid_mid = Math.max(input.cost_yen_per_kw_year, mid);
  const recommended_bid_high = Math.max(input.cost_yen_per_kw_year, Math.round(mid * 1.3));

  // 落札確率: bid 価格に対する logistic 近似
  // bid = mid × 0.8 → 95%、mid → 65%、mid × 1.3 → 25%
  function probabilityFor(bid: number, ref_mid: number): number {
    if (ref_mid === 0) return 50;
    const r = bid / ref_mid;
    // 単純線形補間 (実運用では実データから fit)
    if (r <= 0.8) return 95;
    if (r >= 1.3) return 25;
    // 0.8 → 95、1.0 → 65、1.3 → 25
    if (r <= 1.0) {
      // 0.8〜1.0 で 95〜65 線形
      return Math.round(95 - (r - 0.8) * 150);
    }
    // 1.0〜1.3 で 65〜25 線形
    return Math.round(65 - (r - 1.0) * 133);
  }

  const cleared_probability = {
    low_bid: probabilityFor(recommended_bid_low, mid),
    mid_bid: probabilityFor(recommended_bid_mid, mid),
    high_bid: probabilityFor(recommended_bid_high, mid),
  };

  // 想定収入: 応札容量 × 推奨 mid 価格 / 1e8 (億円換算)
  // capacity_mw × 1000 kW × 円/kW/年 = 円/年 → ÷1e8 = 億円/年
  const estimated_annual_revenue_oku =
    (input.capacity_mw * 1000 * recommended_bid_mid) / 1e8;

  // 警告
  if (input.cost_yen_per_kw_year > area_avg * 1.5 && area_avg > 0) {
    warnings.push(
      `自社コスト ${input.cost_yen_per_kw_year.toLocaleString()} 円/kW/年 が過去平均の 1.5 倍超。採算性要確認。`
    );
  }
  if (records.length < 2) {
    warnings.push('該当エリア・区分の過去データが 2 件未満。結果信頼性に注意。');
  }
  if (input.target_fiscal_year > 2026) {
    warnings.push(
      `${input.target_fiscal_year} 年度応札は予測の不確実性が大きい (現在モック値)。AU 容量市場約定価格DB (5/29 公開) で精度UP予定。`
    );
  }
  warnings.push(
    '⚠️ 本試算はモック版です。応札の最終判断は OCCTO 公式情報・電気事業法を必ずご確認ください。'
  );

  return {
    recommended_bid_low,
    recommended_bid_mid,
    recommended_bid_high,
    cleared_probability,
    historical_context: {
      area_avg: Math.round(area_avg),
      area_total_capacity_mw,
      area_trend,
      sample_size: records.length,
      latest_price,
      prior_price,
    },
    estimated_annual_revenue_oku,
    warnings,
  };
}

/**
 * live data 版 estimateBid
 *  - allRecords: Server Component から props 注入された実データ
 *  - 区分非依存（filterHistoryByArea でエリアのみフィルタ）
 *  - モック disclaimer なし、target_fiscal_year 範囲警告なし（FY2024-2029 カバー済み）
 */
export function estimateBidWithHistory(
  input: BidEstimateInput,
  allRecords: CapacityMarketRecord[]
): BidEstimateResult {
  // エリアのみでフィルタ（OCCTO 約定価格は区分非依存）
  const records: CapacityMarketRecord[] = filterHistoryByArea(allRecords, input.area);
  const warnings: string[] = [];

  let area_avg = 0;
  let area_total_capacity_mw = 0;
  let weightedSum = 0;
  for (const r of records) {
    weightedSum += r.clearing_price_yen_per_kw_year * r.cleared_capacity_mw;
    area_total_capacity_mw += r.cleared_capacity_mw;
  }
  if (area_total_capacity_mw > 0) {
    area_avg = weightedSum / area_total_capacity_mw;
  }

  const sorted = [...records].sort((a, b) => b.fiscal_year - a.fiscal_year);
  const latest_price = sorted[0]?.clearing_price_yen_per_kw_year;
  const prior_price = sorted[1]?.clearing_price_yen_per_kw_year;
  const area_trend = deriveTrend(latest_price, prior_price);

  const mid = Math.round(area_avg);
  const lowBase = Math.round(mid * 0.8);
  const recommended_bid_low = Math.max(input.cost_yen_per_kw_year, lowBase);
  const recommended_bid_mid = Math.max(input.cost_yen_per_kw_year, mid);
  const recommended_bid_high = Math.max(input.cost_yen_per_kw_year, Math.round(mid * 1.3));

  function probabilityFor(bid: number, ref_mid: number): number {
    if (ref_mid === 0) return 50;
    const r = bid / ref_mid;
    if (r <= 0.8) return 95;
    if (r >= 1.3) return 25;
    if (r <= 1.0) return Math.round(95 - (r - 0.8) * 150);
    return Math.round(65 - (r - 1.0) * 133);
  }

  const cleared_probability = {
    low_bid: probabilityFor(recommended_bid_low, mid),
    mid_bid: probabilityFor(recommended_bid_mid, mid),
    high_bid: probabilityFor(recommended_bid_high, mid),
  };

  const estimated_annual_revenue_oku =
    (input.capacity_mw * 1000 * recommended_bid_mid) / 1e8;

  if (input.cost_yen_per_kw_year > area_avg * 1.5 && area_avg > 0) {
    warnings.push(
      `自社コスト ${input.cost_yen_per_kw_year.toLocaleString()} 円/kW/年 が過去平均の 1.5 倍超。採算性要確認。`
    );
  }
  if (records.length < 2) {
    warnings.push('該当エリアの過去データが 2 件未満。結果信頼性に注意。');
  }
  // 本試算の性質上の注記（モック免責ではなく一般的注意）
  warnings.push(
    '本試算は OCCTO 公表過去実績ベースの推定です。応札の最終判断は OCCTO 公式情報・電気事業法を必ずご確認ください。'
  );

  return {
    recommended_bid_low,
    recommended_bid_mid,
    recommended_bid_high,
    cleared_probability,
    historical_context: {
      area_avg: Math.round(area_avg),
      area_total_capacity_mw,
      area_trend,
      sample_size: records.length,
      latest_price,
      prior_price,
    },
    estimated_annual_revenue_oku,
    warnings,
  };
}
