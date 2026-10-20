/**
 * src/data/next-step-explainers.ts — 「運営元からのご案内」を置く解説の表と、置かずに保留した記事（次の一歩便・2026-10-17）
 *
 * 表は便 §2 の「解説（slug → 種類）」のとおり（13 本）。非表示の解説（explainer-excluded）は 404 になるので、
 * ここに残っていても描画されない。
 * 保留（NEXT_STEP_HELD）は、置く前に本文を確かめて置かなかったもの（便 §2「置かなかった slug と理由を報告に」）。
 * 本文・関連カードの EPRX の数値は src/lib/next-step.ts の hasEprxNumbers でも描画時に判定するので、
 * ここに書くのは確かめた記録（3 件）。描画時の判定で外れるもの（関連カードが理由のニュース・案件など）と、
 * 規則で外れるもの（編集部・noindex）はここに書かない。全部の一覧は報告 reports/next-step-box-2026-10-20.md の (2)。
 */
import type { NextStepVariant } from '@/lib/next-step';

export const NEXT_STEP_EXPLAINERS: Readonly<Record<string, NextStepVariant>> = {
  'bess-ma-valuation': 'asset',
  'bess-investment-funds': 'introduce',
  'dscr-llcr-bess-pf': 'introduce',
  'bess-pf-merchant-vs-multiuse': 'introduce',
  'debt-service-reserve-account': 'introduce',
  'pf-sponsor-guarantee': 'introduce',
  'bess-irr-sensitivity': 'introduce',
  'bess-business-decision-tree': 'buy',
  'om-service-selection': 'operate',
  'bess-degradation-monitoring-operations': 'operate',
  'bess-insurance-guide': 'operate',
  'bess-depreciation-tax': 'operate',
  'multi-use-operation-strategy': 'operate',
};

/** 置かずに保留したもの（slug → 理由）。解説とニュースの両方 */
export const NEXT_STEP_HELD: Readonly<Record<string, string>> = {
  'multi-use-operation-strategy': '本文が EPRX の ΔkW 上限価格の金額を出している（第2節「15.00円/ΔkW・30分」「10.00円/ΔkW・30分」「7.21円/ΔkW・30分」）',
  'bess-depreciation-tax': '本文には EPRX の数値は無いが、本文の後の「この解説の先へ」の関連カードの題に上限価格の数（「19.51円→15円→10円」）が出る',
  'pr-2026-04-22-co30719-100': '本文が需給調整市場の価格を具体の数で出している（「15円/ΔkW」）',
};
