/**
 * src/lib/subsidy-matcher.ts
 *
 * 補助金マッチングロジック (依頼AO、純粋関数のみ)
 *
 * スコアリング方式:
 *   - 都道府県一致: +30 (全国対応含む)
 *   - 用途一致: +25
 *   - 事業者種別一致: +20
 *   - 期限有効性: +15 (有効) / 0 (期限切れ)
 *   - 補助率明示: +10 (rate_max_pct あり)
 *   - 合計最大: 100点
 *
 * 設計思想:
 *   - microCMS subsidies の自由文字列 schema を踏まえ、厳密 filter ではなく scoring
 *   - 無関連 (どのタグも一致しない) 補助金は除外
 *   - Top 10 を返却
 */

import type { PrecomputedSubsidy } from '../../scripts/precompute-subsidies';

export type UseCase = 'grid' | 'self_consumption' | 'industrial';
export type EntityType = 'individual' | 'corporate' | 'municipal';

export interface MatchInput {
  /** 都道府県名 (日本語、e.g., "東京", "大阪"、空文字で「全国検索」) */
  pref: string;
  use_case: UseCase;
  entity_type: EntityType;
  /** 蓄電池容量 (kWh、現状ロジックでは scoring 対象外、表示用) */
  capacity_kwh: number;
  /** 出力 (kW) */
  output_kw: number;
  /** 設置予定年月 (期限チェック用、YYYY-MM-DD) */
  install_target_date: string;
}

export interface MatchResult {
  subsidy: PrecomputedSubsidy;
  match_score: number; // 0-100
  /** 補助金額試算 (億円、rate_max_pct × capex 想定値 / 100、capex は output 1MW あたり 1.5 億円仮定で算出) */
  estimated_amount_oku: number | null;
  reasons: string[];
}

// 都道府県名の表記揺れ吸収 ("東京" → "東京都" 等)
const PREF_ALIAS: Record<string, string> = {
  東京: '東京',
  東京都: '東京',
  大阪: '大阪',
  大阪府: '大阪',
  京都: '京都',
  京都府: '京都',
  北海道: '北海道',
};

function normalizePref(p: string): string {
  if (!p) return '';
  const t = p.trim();
  if (PREF_ALIAS[t]) return PREF_ALIAS[t];
  // 末尾の県/府/都/道 を除く
  return t.replace(/[県府都道]$/, '');
}

function isPrefMatch(input_pref: string, subsidy_prefs: string[]): boolean {
  if (!input_pref) return subsidy_prefs.length > 0; // 全国検索: pref タグ付きの補助金は全てマッチ
  const np = normalizePref(input_pref);
  return subsidy_prefs.some((sp) => normalizePref(sp) === np);
}

function isDeadlineValid(s: PrecomputedSubsidy, target_iso: string): boolean {
  if (s.is_rolling) return true; // 随時
  if (!s.deadline_iso) return true; // 期限不明は除外しない (情報不足、減点扱い)
  // target_iso < deadline_iso なら有効
  return target_iso <= s.deadline_iso;
}

/**
 * マッチングメイン
 */
export function matchSubsidies(
  input: MatchInput,
  subsidies: PrecomputedSubsidy[],
  limit = 10
): MatchResult[] {
  const target = input.install_target_date || new Date().toISOString().slice(0, 10);

  const results: MatchResult[] = [];

  for (const s of subsidies) {
    let score = 0;
    const reasons: string[] = [];

    // 都道府県一致 (+30)
    const prefMatch = isPrefMatch(input.pref, s.applicable_prefs);
    if (prefMatch) {
      score += 30;
      const np = normalizePref(input.pref);
      if (!input.pref) {
        reasons.push('地域対応');
      } else if (s.applicable_prefs.length >= 40) {
        reasons.push('全国対象');
      } else {
        reasons.push(`${np} 対象`);
      }
    }

    // 用途一致 (+25)
    const useCaseMatch = s.applicable_use_cases.includes(input.use_case);
    if (useCaseMatch) {
      score += 25;
      const label =
        input.use_case === 'grid'
          ? '系統用 BESS'
          : input.use_case === 'self_consumption'
            ? '自家消費'
            : '産業用';
      reasons.push(`${label} 対応`);
    }

    // 事業者種別一致 (+20)
    const entityMatch = s.applicable_entities.includes(input.entity_type);
    if (entityMatch) {
      score += 20;
      const label =
        input.entity_type === 'individual'
          ? '個人事業者'
          : input.entity_type === 'corporate'
            ? '法人'
            : '自治体';
      reasons.push(`${label} 対象`);
    }

    // 期限有効 (+15)
    const deadlineOk = isDeadlineValid(s, target);
    if (deadlineOk) {
      score += 15;
      if (s.is_rolling) {
        reasons.push('随時受付');
      } else if (s.deadline_iso) {
        reasons.push(`期限 ${s.deadline_iso} 内`);
      } else {
        reasons.push('期限要確認');
      }
    }

    // 補助率明示 (+10)
    if (s.subsidyRate_max_pct !== undefined && s.subsidyRate_max_pct > 0) {
      score += 10;
      reasons.push(`補助率最大 ${s.subsidyRate_max_pct.toFixed(0)}%`);
    }

    // 完全無マッチ (score < 30) は除外
    if (score < 30) continue;

    // 補助金額試算 (rate_max_pct × 想定 CAPEX)
    // 想定 CAPEX = output_kw / 1000 × 1.5 億円 (1MW あたり 1.5億円の業界目安)
    let estimated_amount_oku: number | null = null;
    if (s.subsidyRate_max_pct !== undefined && s.subsidyRate_max_pct > 0) {
      const capex_oku = (input.output_kw / 1000) * 1.5;
      estimated_amount_oku = capex_oku * (s.subsidyRate_max_pct / 100);
    }

    results.push({
      subsidy: s,
      match_score: score,
      estimated_amount_oku,
      reasons,
    });
  }

  // スコア降順、同点なら deadline 早い順 → name 昇順
  results.sort((a, b) => {
    if (a.match_score !== b.match_score) return b.match_score - a.match_score;
    if (a.subsidy.deadline_iso && b.subsidy.deadline_iso) {
      return a.subsidy.deadline_iso.localeCompare(b.subsidy.deadline_iso);
    }
    return a.subsidy.name.localeCompare(b.subsidy.name, 'ja');
  });

  return results.slice(0, limit);
}

export const USE_CASE_LABELS: Record<UseCase, string> = {
  grid: '系統用 BESS',
  self_consumption: '自家消費 (PPA / 建物併設)',
  industrial: '産業用 / 中小企業',
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  individual: '個人 / 住宅',
  corporate: '法人 / SPC',
  municipal: '自治体 / 行政',
};
