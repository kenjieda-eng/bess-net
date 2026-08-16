/**
 * src/lib/grid-connection-checker.ts
 *
 * 系統連系診断 純粋ロジック (依頼AR)
 *
 * 機能:
 *   - haversine 距離計算 (km)
 *   - feasibility スコアリング (0-100)
 *   - Top 5 変電所抽出
 *   - レコメンデーション判定 (easy / moderate / difficult / requires_consultation)
 *
 * スコア構成 (max 100):
 *   - 空き容量 ≥ 出力 × 1.5: +30 (余裕)
 *   - 空き容量 ≥ 出力 × 1.0: +20 (適合)
 *   - 空き容量 ≥ 出力 × 0.5: +10 (タイト)
 *   - 距離 < 5 km: +25  | < 10 km: +15 | < 20 km: +5
 *   - N-1 電制適用可: +15
 *   - 電圧階級 (一次/二次双方 > 0): +10
 *   - 出力制御の可能性なし: +10
 *   - 同都道府県 (距離不明) フォールバック: +5
 */

import { isFrozenSubstation } from './substations-frozen';

export interface LiteSubstation {
  id: string;
  slug: string;
  name: string;
  prefecture: string | null;
  operator: string | null;
  area: string | null;
  voltage_primary_kv: number | null;
  voltage_secondary_kv: number | null;
  capacity_total_mw: number | null;
  cap_operational_mw: number | null;
  cap_avail_mw: number | null;
  n1_eligible: boolean;
  oc_possibility: string | null;
  latitude: number | null;
  longitude: number | null;
  last_updated: string | null;
}

export interface DiagnosisInput {
  /** 都道府県名 (例: "東京都", "福岡県") */
  prefecture: string;
  /** 緯度 (オプション、なければ同 prefecture 内空き容量降順) */
  latitude?: number;
  /** 経度 (オプション) */
  longitude?: number;
  /** 出力 (MW) */
  output_mw: number;
  /** 容量 (MWh、現状ロジックでは表示用) */
  capacity_mwh: number;
}

export interface ScoredSubstation {
  substation: LiteSubstation;
  distance_km: number | null;
  feasibility_score: number;
  reasons: string[];
}

export interface DiagnosisResult {
  /** Top 5 候補 */
  candidates: ScoredSubstation[];
  /** 連系難易度 */
  recommendation: 'easy' | 'moderate' | 'difficult' | 'requires_consultation';
  /** 数値表示 (UI 用) */
  recommendation_label: string;
  /** 候補数全体 (Top 5 以外も含む) */
  total_in_prefecture: number;
  /** 注意事項 */
  notes: string[];
}

// ──────────────────────────────────────
// 距離計算 (ハーバーサイン公式)
// ──────────────────────────────────────

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 2 点間の距離 (km、地球半径 6371km)
 * 既知精度: 東京駅 (35.6812, 139.7671) - 大阪駅 (34.7024, 135.4959) ≈ 397 km
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 地球半径 km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

// ──────────────────────────────────────
// スコアリング
// ──────────────────────────────────────

export function scoreSubstation(
  s: LiteSubstation,
  input: DiagnosisInput,
  distance_km: number | null
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 空き容量チェック
  if (typeof s.cap_avail_mw === 'number' && input.output_mw > 0) {
    const ratio = s.cap_avail_mw / input.output_mw;
    if (ratio >= 1.5) {
      score += 30;
      reasons.push(`空き容量 ${s.cap_avail_mw}MW (出力比 ${ratio.toFixed(1)}x、余裕)`);
    } else if (ratio >= 1.0) {
      score += 20;
      reasons.push(`空き容量 ${s.cap_avail_mw}MW (出力比 ${ratio.toFixed(1)}x、適合)`);
    } else if (ratio >= 0.5) {
      score += 10;
      reasons.push(`空き容量 ${s.cap_avail_mw}MW (出力比 ${ratio.toFixed(1)}x、タイト)`);
    } else {
      reasons.push(`空き容量 ${s.cap_avail_mw}MW (出力比 ${ratio.toFixed(1)}x、不足)`);
    }
  } else if (s.cap_avail_mw === null) {
    reasons.push('空き容量情報なし (要確認)');
  }

  // 距離評価
  if (distance_km !== null) {
    if (distance_km < 5) {
      score += 25;
      reasons.push(`${distance_km.toFixed(1)}km 至近`);
    } else if (distance_km < 10) {
      score += 15;
      reasons.push(`${distance_km.toFixed(1)}km 近距離`);
    } else if (distance_km < 20) {
      score += 5;
      reasons.push(`${distance_km.toFixed(1)}km`);
    }
  } else {
    // 距離不明 → 同 prefecture フォールバック
    score += 5;
    reasons.push('同都道府県内');
  }

  // N-1 電制適用可
  if (s.n1_eligible) {
    score += 15;
    reasons.push('N-1 電制適用可');
  }

  // 電圧階級 (一次/二次が両方利用可能)
  if (
    typeof s.voltage_primary_kv === 'number' &&
    s.voltage_primary_kv > 0 &&
    typeof s.voltage_secondary_kv === 'number' &&
    s.voltage_secondary_kv > 0
  ) {
    score += 10;
    reasons.push(`電圧 ${s.voltage_primary_kv}/${s.voltage_secondary_kv}kV`);
  }

  // 出力制御の可能性なし / 軽微
  if (!s.oc_possibility || s.oc_possibility === 'なし' || s.oc_possibility === '低') {
    score += 10;
    reasons.push('出力制御リスク低');
  } else if (s.oc_possibility) {
    reasons.push(`出力制御の可能性: ${s.oc_possibility}`);
  }

  return { score, reasons };
}

// ──────────────────────────────────────
// メイン診断ロジック
// ──────────────────────────────────────

/**
 * 系統連系診断
 *
 * 動作:
 *   1. 入力 prefecture の全 substations を取得済 (引数 substations、prefecture 別 JSON)
 *   2. 各 substation について距離 (座標あり) + スコア計算
 *   3. スコア降順で Top 5 抽出
 *   4. レコメンデーション判定
 */
export function diagnoseGridConnection(
  input: DiagnosisInput,
  substations: LiteSubstation[],
  limit = 5
): DiagnosisResult {
  // 凍結変電所（更新停止・substations-frozen.ts）は連系候補に出さない（2026-08-16裁定）
  const active = substations.filter((s) => !isFrozenSubstation(s.slug));
  // 各 substation スコアリング
  const scored: ScoredSubstation[] = active.map((s) => {
    let distance: number | null = null;
    if (
      input.latitude !== undefined &&
      input.longitude !== undefined &&
      s.latitude !== null &&
      s.longitude !== null
    ) {
      distance = haversineDistance(
        input.latitude,
        input.longitude,
        s.latitude,
        s.longitude
      );
    }
    const { score, reasons } = scoreSubstation(s, input, distance);
    return {
      substation: s,
      distance_km: distance,
      feasibility_score: score,
      reasons,
    };
  });

  // スコア降順 → 距離昇順 (近い順) → 名前 昇順
  scored.sort((a, b) => {
    if (a.feasibility_score !== b.feasibility_score) {
      return b.feasibility_score - a.feasibility_score;
    }
    if (a.distance_km !== null && b.distance_km !== null) {
      return a.distance_km - b.distance_km;
    }
    if (a.distance_km !== null) return -1;
    if (b.distance_km !== null) return 1;
    return a.substation.name.localeCompare(b.substation.name, 'ja');
  });

  const candidates = scored.slice(0, limit);

  // レコメンデーション判定
  const topScore = candidates[0]?.feasibility_score ?? 0;
  let recommendation: DiagnosisResult['recommendation'];
  let recommendation_label: string;
  if (topScore >= 70) {
    recommendation = 'easy';
    recommendation_label = '連系可能性高 (要詳細協議)';
  } else if (topScore >= 50) {
    recommendation = 'moderate';
    recommendation_label = '連系可能性あり (空き容量・距離要確認)';
  } else if (topScore >= 30) {
    recommendation = 'difficult';
    recommendation_label = '連系困難 (代替地点検討推奨)';
  } else {
    recommendation = 'requires_consultation';
    recommendation_label = '個別協議必須 (条件外、別都道府県検討)';
  }

  // 注意事項
  const notes: string[] = [];
  notes.push(
    '本診断は公表データ (microCMS) ベースの参考情報です。実際の連系可否は各送配電事業者への接続検討申請で確定します。'
  );
  const hasCoord = scored.some((s) => s.distance_km !== null);
  if (!hasCoord && input.latitude !== undefined) {
    notes.push(
      `この都道府県の変電所には緯度経度データが未登録です。同都道府県内全件を空き容量・スコアで評価しています (距離による絞り込み不可)。`
    );
  }
  if (substations.length === 0) {
    notes.push(`指定の都道府県には変電所データがありません。`);
  }

  return {
    candidates,
    recommendation,
    recommendation_label,
    total_in_prefecture: substations.length,
    notes,
  };
}
