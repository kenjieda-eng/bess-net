/**
 * src/lib/fire-risk-checker.ts
 *
 * 火災リスク自己診断 純粋ロジック (依頼AS、純粋関数のみ)
 *
 * 計算モデル:
 *   1. 各問の選択肢から score (0-10) を取得
 *   2. weight (1-3) で加重平均 → カテゴリスコア (0-100 正規化)
 *   3. 5 カテゴリの加重平均 → 総合スコア (0-100)
 *   4. リスクレベル: low (80+) / moderate (60-79) / high (40-59) / critical (<40)
 *   5. priority_actions: スコア低い回答 (raw < 5) を weight 降順で Top 5 抽出
 *
 * 啓発ツール disclaimer (UI 側で必ず表示):
 *   - 啓発・自己評価用、法的判断・専門助言の代替ではない
 *   - UL9540A 等は参考、最終判断は消防署/専門家
 */

import {
  CHECKLIST,
  CATEGORY_LABELS,
  type ChecklistItem,
  type CategoryKey,
} from '@/data/fire-risk-checklist';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface FireRiskInput {
  /** 回答マップ: { 'cell-1': option_index, 'cell-2': option_index, ... } */
  answers: Record<string, number>;
}

export interface CategoryResult {
  category: CategoryKey;
  category_label: string;
  score: number; // 0-100 正規化
  risk_level: RiskLevel;
  answered_count: number;
  total_count: number;
  /** カテゴリ内推奨改善 (option.risk_note の low score 抽出) */
  recommendations: string[];
}

export interface PriorityAction {
  item_id: string;
  category: CategoryKey;
  question: string;
  current_choice: string;
  score: number;
  weight: number;
  severity: 'critical' | 'high' | 'medium';
  risk_note: string | undefined;
  reference?: string;
}

export interface FireRiskResult {
  /** 0-100 加重平均 */
  total_score: number;
  risk_level: RiskLevel;
  risk_level_label: string;
  by_category: CategoryResult[];
  priority_actions: PriorityAction[];
  /** 回答済問数 / 25 */
  answered_count: number;
  total_questions: number;
}

// リスクレベル境界値
function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'high';
  return 'critical';
}

const RISK_LABEL: Record<RiskLevel, string> = {
  low: '低リスク (LOW)',
  moderate: '中リスク (MODERATE)',
  high: '高リスク (HIGH)',
  critical: '緊急対応必要 (CRITICAL)',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#006666',
  moderate: '#0066cc',
  high: '#cc6600',
  critical: '#cc0066',
};

/**
 * weight 加重平均 → 0-100 正規化
 * 各 score は 0-10、重み weight。
 * 全 score が 10 なら 100、全 0 なら 0。
 */
function weightedAvgPercent(
  scoresWithWeights: Array<{ score: number; weight: number }>
): number {
  if (scoresWithWeights.length === 0) return 0;
  const sumWS = scoresWithWeights.reduce((s, x) => s + x.score * x.weight, 0);
  const sumW = scoresWithWeights.reduce((s, x) => s + x.weight, 0);
  if (sumW === 0) return 0;
  const avg10 = sumWS / sumW; // 0-10
  return Math.round((avg10 / 10) * 100); // 0-100
}

/**
 * メイン: 入力 → 結果
 */
export function calculateFireRisk(input: FireRiskInput): FireRiskResult {
  // 回答済 only を集計、未回答は無視
  const answered = CHECKLIST.filter(
    (item) => input.answers[item.id] !== undefined &&
              input.answers[item.id] >= 0 &&
              input.answers[item.id] < item.options.length
  );

  // カテゴリ別集計
  const byCategoryMap: Record<CategoryKey, CategoryResult> = {} as Record<
    CategoryKey,
    CategoryResult
  >;
  const allCategories: CategoryKey[] = ['cell', 'pcs', 'building', 'operation', 'emergency'];

  for (const cat of allCategories) {
    const itemsInCat = CHECKLIST.filter((i) => i.category === cat);
    const answeredInCat = itemsInCat.filter((i) => input.answers[i.id] !== undefined);
    const scoresWithWeights = answeredInCat.map((i) => {
      const opt = i.options[input.answers[i.id]];
      return { score: opt.score, weight: i.weight };
    });
    const catScore = weightedAvgPercent(scoresWithWeights);
    const risk = deriveRiskLevel(catScore);

    // 推奨改善 (低スコア回答の risk_note)
    const recs: string[] = [];
    for (const item of answeredInCat) {
      const opt = item.options[input.answers[item.id]];
      if (opt.score <= 4 && opt.risk_note) {
        recs.push(`[${item.id}] ${opt.risk_note}`);
      }
    }

    byCategoryMap[cat] = {
      category: cat,
      category_label: CATEGORY_LABELS[cat],
      score: catScore,
      risk_level: risk,
      answered_count: answeredInCat.length,
      total_count: itemsInCat.length,
      recommendations: recs,
    };
  }

  // 総合スコア (5 カテゴリの加重平均、各 カテゴリ平均 weight = 平均 weight 反映)
  // 単純に全回答の weighted average で算出 (カテゴリ無視) — 重要な問が引っ張る
  const allScored = answered.map((i) => {
    const opt = i.options[input.answers[i.id]];
    return { score: opt.score, weight: i.weight };
  });
  const totalScore = weightedAvgPercent(allScored);
  const totalRisk = deriveRiskLevel(totalScore);

  // priority_actions: score ≤ 5 の回答を weight 降順 → score 昇順 で Top 5
  const lowScored = answered
    .map((item) => {
      const optIdx = input.answers[item.id];
      const opt = item.options[optIdx];
      return { item, opt };
    })
    .filter(({ opt }) => opt.score <= 5)
    .sort((a, b) => {
      if (a.item.weight !== b.item.weight) return b.item.weight - a.item.weight;
      return a.opt.score - b.opt.score;
    });

  const priority_actions: PriorityAction[] = lowScored.slice(0, 5).map(({ item, opt }) => {
    const severity: PriorityAction['severity'] =
      item.weight === 3 && opt.score <= 2
        ? 'critical'
        : item.weight >= 2 && opt.score <= 3
          ? 'high'
          : 'medium';
    return {
      item_id: item.id,
      category: item.category,
      question: item.question,
      current_choice: opt.label,
      score: opt.score,
      weight: item.weight,
      severity,
      risk_note: opt.risk_note,
      reference: item.reference,
    };
  });

  return {
    total_score: totalScore,
    risk_level: totalRisk,
    risk_level_label: RISK_LABEL[totalRisk],
    by_category: allCategories.map((c) => byCategoryMap[c]),
    priority_actions,
    answered_count: answered.length,
    total_questions: CHECKLIST.length,
  };
}
