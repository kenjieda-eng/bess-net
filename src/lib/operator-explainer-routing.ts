/**
 * src/lib/operator-explainer-routing.ts — Op8（2026-08-09）
 *
 * 事業者カテゴリ → 「その立場の相手と付き合ううえで読むべき解説」のルーティング。
 *
 * 背景: 従来の relatedExplainers は「operator.body に explainer のタイトルが**完全一致**で
 * 含まれること」を条件にしており、544社すべてで 0件＝解説261本への導線が完全に死んでいた
 * （さらにページ側で描画すらされていなかった）。タイトル完全一致は事実上発火しない条件のため、
 * E1「この解説の先へ」と同じ**カテゴリ・ルーティング方式**に切り替える。
 *
 * 方針:
 *  - 全社に必ず 2〜3本が付く（カテゴリ未設定139社にはフォールバックを用意）
 *  - 行き先はすべて実在 slug（build 時に実在検証し、欠けたら警告）
 *  - 本文一致は「補助的な加点」として先頭に寄せるだけで、必須条件にはしない
 */

/** カテゴリ → 解説 slug（優先順）。実在検証は precompute 側で行う。 */
export const OPERATOR_CATEGORY_EXPLAINERS: Record<string, string[]> = {
  アグリゲーター: ['aggregator-business', 'balancing-market-practical', 'multi-use-operation-strategy'],
  EPC: ['bess-epc-selection', 'epc-contract-key-clauses', 'pcs-selection-guide'],
  開発事業者: ['grid-scale-bess', 'grid-connection-process', 'long-term-decarbonization-auction'],
  電池メーカー: ['battery-types-and-specs', 'lithium-cell-module-pack', 'container-bess-comparison'],
  電力会社: ['jepx-arbitrage', 'capacity-market', 'integrated-market-2026'],
  金融: ['bess-irr-sensitivity', 'dscr-llcr-bess-pf', 'bess-pf-merchant-vs-multiuse'],
  PCS: ['pcs-selection-guide', 'pcs-topology-comparison', 'frt-test-certificate'],
  自治体: ['local-ordinance-and-resident-consultation', 'decarbonization-leading-regions-detail', 'bess-site-acquisition'],
  研究機関: ['solid-state-battery-grid-deployment', 'sodium-ion-battery-grid-deployment', 'battery-degradation-diagnostics'],
  土地: ['bess-site-acquisition', 'grid-capacity-map-reading', 'local-ordinance-and-resident-consultation'],
  業界団体: ['grid-scale-bess', 'bess-stakeholder-map', 'integrated-market-2026'],
  コンサル: ['bess-business-decision-tree', 'bess-revenue-simulation', 'bess-irr-sensitivity'],
  商社: ['bess-ma-valuation', 'bess-investment-funds', 'fx-risk-battery-procurement'],
  電気主任: ['chief-electrical-engineer', 'bess-safety-regulations-implementation', 'bess-annual-inspection-procedures'],
  送配電: ['grid-capacity-map-reading', 'non-firm-connection-bess', 'grid-interconnection-negotiation-process'],
  法務: ['epc-contract-key-clauses', 'ppa-wholesale-contract', 'interconnection-contract-fit-law'],
  保険: ['bess-insurance-guide', 'bess-safety-and-fire', 'global-bess-fire-cases'],
  'O&M': ['om-service-selection', 'bess-daily-inspection-checklist', 'bess-degradation-monitoring-operations'],
  監視: ['remote-monitoring-selection', 'bms-vs-ems', 'bess-cybersecurity-strategy'],
  消防: ['bess-safety-and-fire', 'bess-emergency-response-manual', 'global-bess-fire-cases'],
};

/** カテゴリ未設定（実測139社）・未知カテゴリ向けのフォールバック */
export const OPERATOR_EXPLAINER_FALLBACK: string[] = [
  'grid-scale-bess',
  'bess-stakeholder-map',
  'bess-business-decision-tree',
];

/** 表示上限 */
export const OPERATOR_EXPLAINER_LIMIT = 3;

/** その事業者に割り当てる解説 slug（優先順・重複なし） */
export function explainerSlugsForOperator(categories: string[] | undefined): string[] {
  const out: string[] = [];
  for (const c of categories ?? []) {
    for (const s of OPERATOR_CATEGORY_EXPLAINERS[c] ?? []) {
      if (!out.includes(s)) out.push(s);
    }
  }
  if (out.length === 0) return [...OPERATOR_EXPLAINER_FALLBACK];
  return out;
}
