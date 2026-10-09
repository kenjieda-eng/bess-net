'use client';

/**
 * src/components/LenderView.tsx — IRR シミュレーターの節「貸し手の見方（DSCR・借入）」（T4 レンダー視点便・2026-10-09）
 *
 * - 計算は src/lib/lender-view-calc.ts（純関数）。営業 CF・IRR は既存の irr-calculator.ts の関数を使う。
 * - 入力（文字列）は親の IRRSimulator が持ち、既存の URL 共有に乗せる（空欄の項目は書かない）。
 * - 上限価格の区間・出典の文はサーバ（page.tsx）が balancing-cap.ts から組み立てて渡す（カタログ JSON をクライアントに入れない）。
 * - 既存の 3 シナリオの結果は変えない。上限価格シナリオの置き換えもこの節の計算だけに使う。
 * - 当サイトは助言者ではない: 要求水準・保険料・金利に既定値も目安も置かない。評価の語・色を付けない。
 * - 3 シナリオの耐用年数・出力は URL の復元で標準だけ変わることがある（既存の挙動）ので、
 *   返済期間は 3 シナリオの最短の耐用年数で検査し、上限価格の年額はシナリオごとの出力で出す。
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { IRRInput } from '@/lib/irr-calculator';
import { calcIRR } from '@/lib/irr-calculator';
import { SCENARIO_COLORS, SCENARIO_LABELS, type ScenarioKey } from '@/lib/irr-defaults';
import { BLOCKS_PER_YEAR } from '@/lib/balancing-revenue-calc';
import { parseNumberText } from '@/lib/balancing-benchmark-calc';
import {
  REPAYMENT_METHOD_LABELS,
  capUpperRevenueYen,
  computeLenderView,
  minLifespanYears,
  parseLenderInput,
  withAncillaryAnnualYen,
  type CapSegmentView,
  type LenderResult,
  type LenderTextInput,
  type RepaymentMethod,
} from '@/lib/lender-view-calc';

const SCENARIO_KEYS: ScenarioKey[] = ['optimistic', 'standard', 'pessimistic'];

/** 上限価格シナリオで選べる商品（三次②は上限価格の設定が無い） */
const CAP_PRODUCT_ORDER = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'] as const;

// 単位は既存の結果カード（「億」・IRR は小数 1 桁）に合わせ、倍は小数 2 桁
const oku = (yen: number | null) => (yen === null || !Number.isFinite(yen) ? '—' : `${(yen / 1e8).toFixed(2)} 億`);
const yenText = (yen: number) => `${Math.round(yen).toLocaleString('ja-JP')} 円`;
const pct1 = (v: number | null) => (v === null || !Number.isFinite(v) ? '計算不可' : `${v.toFixed(1)}%`);
const times2 = (v: number | null) => (v === null || !Number.isFinite(v) ? '—' : `${v.toFixed(2)} 倍`);
const jaDate = (iso: string) => `${Number(iso.slice(0, 4))}年${Number(iso.slice(5, 7))}月${Number(iso.slice(8, 10))}日`;
const periodText = (s: CapSegmentView) => `${jaDate(s.from)}〜${s.to ? jaDate(s.to) : ''}`;

const EQUITY_IRR_ISSUE_TEXT: Record<NonNullable<LenderResult['equityIrrIssue']>, string> = {
  'no-equity': '計算不可（投下資本 0）',
  'non-unique': '一意に定まらない（エクイティへの CF の符号が 2 回以上変わる）',
  'no-root': '計算不可',
  'term-exceeds-life': '計算不可（返済期間が耐用年数を超える）',
};

const linkStyle = { color: 'var(--color-accent, #0066cc)' } as const;
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' };
const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 18,
  fontVariantNumeric: 'tabular-nums',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  fontFamily: 'inherit',
  background: '#fff',
};
const hintStyle: React.CSSProperties = { fontSize: 15, color: 'var(--color-muted)', marginTop: 6, marginBottom: 0, lineHeight: 1.5 };
const cell: React.CSSProperties = { padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--color-border)' };

function TextField({
  id,
  label,
  unit,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={fieldLabel}>
        {label}
        {unit && <span style={{ color: 'var(--color-muted)', marginLeft: 4, fontWeight: 400 }}>({unit})</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        style={fieldInput}
      />
      {hint && (
        <p id={`${id}-hint`} style={hintStyle}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function LenderView({
  inputs,
  lender,
  onLenderChange,
  capSegments,
  capSourceText,
  productLabels,
}: {
  inputs: Record<ScenarioKey, IRRInput>;
  lender: LenderTextInput;
  onLenderChange: (next: LenderTextInput) => void;
  capSegments: CapSegmentView[];
  /** 上限価格の出典（EPRX の資料名・ページ・改定の一次） */
  capSourceText: string;
  /** 商品名（カタログの名前） */
  productLabels: Record<string, string>;
}) {
  const set = (k: keyof LenderTextInput, v: string) => onLenderChange({ ...lender, [k]: v });

  // 上限価格シナリオ（この節の計算だけに使う・URL には書かない）
  const [capProduct, setCapProduct] = useState<string>('primary');
  const [capRateText, setCapRateText] = useState('100');
  const [appliedSeg, setAppliedSeg] = useState<number | null>(null);
  const capRate = parseNumberText(capRateText);
  const capRateOk = !capRate.invalid && capRate.value !== null && capRate.value >= 0 && capRate.value <= 100;
  const selected = appliedSeg !== null ? capSegments[appliedSeg] ?? null : null;
  const applied = selected && capRateOk ? selected : null;
  // 上限の年額はシナリオごとの出力（kW）で出す
  const capAnnual = useMemo<Record<ScenarioKey, number> | null>(() => {
    if (!applied) return null;
    const rate = capRate.value as number;
    return {
      optimistic: capUpperRevenueYen(applied.value, inputs.optimistic.output_mw * 1000, rate),
      standard: capUpperRevenueYen(applied.value, inputs.standard.output_mw * 1000, rate),
      pessimistic: capUpperRevenueYen(applied.value, inputs.pessimistic.output_mw * 1000, rate),
    };
  }, [applied, capRate.value, inputs]);

  const effective = useMemo<Record<ScenarioKey, IRRInput>>(() => {
    if (capAnnual === null) return inputs;
    return {
      optimistic: withAncillaryAnnualYen(inputs.optimistic, capAnnual.optimistic),
      standard: withAncillaryAnnualYen(inputs.standard, capAnnual.standard),
      pessimistic: withAncillaryAnnualYen(inputs.pessimistic, capAnnual.pessimistic),
    };
  }, [inputs, capAnnual]);

  // 返済期間は 3 シナリオの最短の耐用年数で検査する（URL の復元で標準だけ耐用年数が変わることがある）
  const lifespanMin = minLifespanYears(SCENARIO_KEYS.map((k) => inputs[k]));
  const parsed = useMemo(() => parseLenderInput(lender, lifespanMin), [lender, lifespanMin]);
  const results = useMemo<Record<ScenarioKey, LenderResult> | null>(() => {
    if (parsed.status !== 'ok') return null;
    return {
      optimistic: computeLenderView(effective.optimistic, parsed.params),
      standard: computeLenderView(effective.standard, parsed.params),
      pessimistic: computeLenderView(effective.pessimistic, parsed.params),
    };
  }, [effective, parsed]);
  const replacedProjectIrr = useMemo(
    () => (capAnnual === null ? null : SCENARIO_KEYS.map((k) => calcIRR(effective[k]))),
    [effective, capAnnual],
  );
  const params = parsed.status === 'ok' ? parsed.params : null;
  const kws = SCENARIO_KEYS.map((k) => inputs[k].output_mw * 1000);
  const sameKw = kws.every((v) => v === kws[0]);
  const earliestCapFrom = capSegments.length ? capSegments.map((s) => s.from).sort()[0] : null;

  return (
    <section
      aria-labelledby="lender-view-title"
      style={{
        padding: 16,
        background: 'var(--color-bg-card, #fff)',
        border: '1px solid var(--color-border)',
        borderRadius: 6,
        marginBottom: 24,
      }}
    >
      <h2 id="lender-view-title" style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
        貸し手の見方（DSCR・借入）
      </h2>
      {/* 便 §0: 冒頭 1 行（助言でない） */}
      <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 12px', padding: '8px 12px', background: '#fff8e1', border: '1px solid #f1c40f', borderRadius: 6 }}>
        融資の可否・条件は金融機関の判断です。この節は上の試算に借入を重ねた概算で、鑑定・格付けではありません。
      </p>
      <p style={{ fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.7, margin: '0 0 12px' }}>
        DSCR の要求水準・保険料・金利には既定値も目安も置いていません（公表された一次の目安が見つからず、案件と金融機関で異なるため）。LTV・金利・返済期間・返済方式の 4 つを入れると計算します（3 シナリオ共通の条件）。
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <TextField id="lender-ltv" label="借入比率（LTV）" unit="%" value={lender.ltv} onChange={(v) => set('ltv', v)} hint="CAPEX ×（1 − 補助率）に対する借入額の割合（0〜100）" />
        <TextField id="lender-rate" label="金利（固定）" unit="%/年" value={lender.rate} onChange={(v) => set('rate', v)} hint="既定値なし" />
        <TextField id="lender-term" label="返済期間" unit="年" value={lender.term} onChange={(v) => set('term', v)} hint={`据置期間を含む年数（設備耐用年数 ${lifespanMin} 年以内）`} />
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="lender-method" style={fieldLabel}>
            返済方式
          </label>
          <select id="lender-method" value={lender.method} onChange={(e) => set('method', e.target.value as '' | RepaymentMethod)} style={fieldInput}>
            <option value="">選んでください</option>
            {(Object.keys(REPAYMENT_METHOD_LABELS) as RepaymentMethod[]).map((m) => (
              <option key={m} value={m}>
                {REPAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <TextField id="lender-grace" label="据置期間（任意）" unit="年" value={lender.grace} onChange={(v) => set('grace', v)} hint="空欄は 0。据置の間は利息だけを払う" />
        <TextField id="lender-dscr" label="DSCR の要求水準（任意）" unit="倍" value={lender.dscrReq} onChange={(v) => set('dscrReq', v)} hint="入れると、下回る年と要求水準を満たす最大の借入額を出す" />
        <TextField id="lender-insurance" label="事業中断保険の年間保険料（任意）" unit="円/年" value={lender.insurance} onChange={(v) => set('insurance', v)} hint="入れると営業 CF から差し引く（DSCR・最大の借入額・エクイティ IRR）" />
      </div>

      {/* 上限価格シナリオで置き換えているとき（この節の計算だけ） */}
      {selected && (
        <p
          role="status"
          style={{ fontSize: 15, lineHeight: 1.7, margin: '4px 0 12px', padding: '8px 12px', background: '#eef6ff', border: '1px solid #b3d4f5', borderRadius: 6 }}
        >
          {applied && capAnnual
            ? sameKw
              ? `この節の計算は、需給調整収益を上限値に置き換えています: ${applied.value.toFixed(2)} 円/ΔkW・30分 × 出力 ${kws[0].toLocaleString('ja-JP')} kW × ${BLOCKS_PER_YEAR.toLocaleString('ja-JP')} コマ/年 × 落札率 ${capRate.value}% ＝ ${yenText(capAnnual.standard)}/年（耐用年数の全年に同じ値）。上の計算結果は変わりません。`
              : `この節の計算は、需給調整収益を上限値に置き換えています: ${applied.value.toFixed(2)} 円/ΔkW・30分 × 出力 × ${BLOCKS_PER_YEAR.toLocaleString('ja-JP')} コマ/年 × 落札率 ${capRate.value}%（${SCENARIO_KEYS.map((k, i) => `${SCENARIO_LABELS[k]} ${kws[i].toLocaleString('ja-JP')} kW → ${yenText(capAnnual[k])}/年`).join('・')}・耐用年数の全年に同じ値）。上の計算結果は変わりません。`
            : `${selected.value.toFixed(2)} 円/ΔkW・30分 を選んでいますが、落札率が正しくないため置き換えていません。`}{' '}
          <button type="button" onClick={() => setAppliedSeg(null)} style={{ padding: '2px 10px', fontSize: 15, border: '1px solid #1e3a5f', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>
            元に戻す
          </button>
        </p>
      )}

      {/* 結果（入力の不備と結果を読み上げる） */}
      <div aria-live="polite">
        {parsed.status === 'incomplete' && (
          <p style={{ fontSize: 15, color: '#475569', margin: '4px 0 12px' }}>{`未入力: ${parsed.missing.join('・')}（4 つが揃うと計算します）`}</p>
        )}
        {parsed.status === 'invalid' && (
          <ul style={{ fontSize: 15, color: '#b45309', margin: '4px 0 12px', paddingLeft: 20 }}>
            {parsed.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {results && params && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, margin: '4px 0 16px' }}>
              {SCENARIO_KEYS.map((k) => {
                const r = results[k];
                return (
                  <div key={k} style={{ padding: 14, border: `2px solid ${SCENARIO_COLORS[k]}`, borderRadius: 6, fontSize: 15, lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 700, color: SCENARIO_COLORS[k], marginBottom: 4 }}>{SCENARIO_LABELS[k]}</div>
                    <div>{`借入額 ${oku(r.debtYen)}（投下資本 ${oku(r.equityYen)}）`}</div>
                    <div>{`最小 DSCR ${r.minDscr ? `${times2(r.minDscr.value)}（${r.minDscr.year} 年目）` : '—（借入なし）'}`}</div>
                    {params.dscrReq !== null && (
                      <>
                        <div>{`要求水準 ${times2(params.dscrReq)}を下回る年: ${r.belowReqYears.length ? r.belowReqYears.map((y) => `${y}`).join('・') + ' 年目' : 'なし'}`}</div>
                        {r.maxDebt && (
                          <div>{`要求水準を満たす最大の借入額 ${oku(r.maxDebt.yen)}（LTV ${r.maxDebt.ltvPct.toFixed(1)}%${r.maxDebt.capped ? '・LTV 100% でも満たす' : ''}）`}</div>
                        )}
                      </>
                    )}
                    <div>{`エクイティ IRR ${r.equityIrrIssue ? EQUITY_IRR_ISSUE_TEXT[r.equityIrrIssue] : pct1(r.equityIrr)}`}</div>
                    <div>{`プロジェクト IRR ${pct1(r.projectIrr)}${capAnnual !== null ? '（上限値に置き換えた場合）' : '（上の計算結果と同じ）'}`}</div>
                    {params.insuranceYen > 0 && (
                      <div>{`保険料を差し引いたプロジェクト IRR ${r.projectIrrAfterInsuranceIssue ? EQUITY_IRR_ISSUE_TEXT[r.projectIrrAfterInsuranceIssue].replace('エクイティへの ', '') : pct1(r.projectIrrAfterInsurance)}`}</div>
                    )}
                    <div style={{ color: 'var(--color-muted)' }}>{`支払利息の合計 ${oku(r.totalInterestYen)}`}</div>
                  </div>
                );
              })}
            </div>
            {results.standard.minDscr && (
              <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 15, minWidth: 420 }}>
                  <caption style={{ textAlign: 'left', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    {`年次 DSCR（3 シナリオ・${REPAYMENT_METHOD_LABELS[params.method]}・返済期間 ${params.termYears} 年${params.graceYears ? `・うち据置 ${params.graceYears} 年` : ''}）`}
                  </caption>
                  <thead>
                    <tr>
                      <th style={{ ...cell, textAlign: 'left' }}>年</th>
                      {SCENARIO_KEYS.map((k) => (
                        <th key={k} style={{ ...cell, color: SCENARIO_COLORS[k] }}>
                          {SCENARIO_LABELS[k]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.standard.years
                      .filter((y) => y.debtServiceYen > 0)
                      .map((y) => (
                        <tr key={y.year}>
                          <td style={{ ...cell, textAlign: 'left' }}>{`${y.year} 年目`}</td>
                          {SCENARIO_KEYS.map((k) => (
                            <td key={k} style={cell}>
                              {times2(results[k].years[y.year - 1]?.dscr ?? null)}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* 上限価格シナリオ */}
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 6px' }}>上限価格シナリオ（需給調整収益の上限）</h3>
      <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, margin: '0 0 10px' }}>
        上限価格は約定単価の上限であり、収益の見込みではありません。市場平均で見るときは{' '}
        <Link href="/tools/balancing-revenue" style={linkStyle}>
          需給調整 収益シナリオ（蓄電池）
        </Link>
        {` を使ってください。ボタンを押すと、3 シナリオの需給調整収益をその上限価格で全コマ約定した場合（× 落札率）に置き換えて、この節の計算をやり直します（1 年＝${BLOCKS_PER_YEAR.toLocaleString('ja-JP')} コマ・各シナリオの出力をそのまま ΔkW とする・選んだ上限価格を耐用年数の全年に同じ値で当てはめる。ボタンの期間は、その上限が実際に有効だった期間です）。`}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 10 }}>
        <div>
          <label htmlFor="lender-cap-product" style={fieldLabel}>
            商品
          </label>
          <select
            id="lender-cap-product"
            value={capProduct}
            onChange={(e) => {
              setCapProduct(e.target.value);
              setAppliedSeg(null);
            }}
            style={{ ...fieldInput, width: 200 }}
          >
            {CAP_PRODUCT_ORDER.map((p) => (
              <option key={p} value={p}>
                {productLabels[p] ?? p}
              </option>
            ))}
          </select>
        </div>
        <div style={{ width: 260 }}>
          <TextField id="lender-cap-rate" label="落札率" unit="%" value={capRateText} onChange={setCapRateText} hint="100%＝全コマで約定（上限の定義）。下げるとその割合で計算します" />
        </div>
      </div>
      {!capRateOk && (
        <p id="lender-cap-rate-error" style={{ fontSize: 15, color: '#b45309', margin: '0 0 6px' }}>
          落札率は 0〜100 の数で入れてください
        </p>
      )}
      <p id="lender-cap-buttons-note" style={hintStyle}>
        {`選んだ商品に当てはまる上限価格だけを押せます（いま: ${productLabels[capProduct] ?? capProduct}）。`}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 8px' }}>
        {capSegments.map((s, i) => {
          const usable = s.products.includes(capProduct);
          const active = applied !== null && appliedSeg === i;
          return (
            <button
              key={`${s.value}-${s.from}`}
              type="button"
              disabled={!usable || !capRateOk}
              aria-pressed={active}
              aria-describedby={!capRateOk ? 'lender-cap-rate-error' : 'lender-cap-buttons-note'}
              onClick={() => setAppliedSeg(i)}
              style={{
                padding: '8px 12px',
                textAlign: 'left',
                fontSize: 15,
                lineHeight: 1.5,
                background: active ? '#0066cc' : '#fff',
                color: active ? '#fff' : usable ? '#1f2937' : '#9ca3af',
                border: `1px solid ${active ? '#0066cc' : '#cbd5e1'}`,
                borderRadius: 6,
                cursor: usable && capRateOk ? 'pointer' : 'not-allowed',
                minWidth: 220,
              }}
            >
              <span style={{ display: 'block', fontWeight: 700 }}>{`${s.value.toFixed(2)} 円/ΔkW・30分`}</span>
              <span style={{ display: 'block' }}>{`${periodText(s)}（実需給日）`}</span>
              <span style={{ display: 'block' }}>{s.products.map((p) => productLabels[p] ?? p).join('・')}</span>
            </button>
          );
        })}
      </div>
      {capSegments.every((s) => !s.products.includes(capProduct)) && (
        <p style={{ fontSize: 15, color: '#475569', margin: '0 0 8px' }}>{`${productLabels[capProduct] ?? capProduct}には上限価格の設定がありません。`}</p>
      )}
      {replacedProjectIrr && (
        <p role="status" style={{ fontSize: 15, margin: '0 0 8px' }}>
          {`上限値に置き換えたときのプロジェクト IRR: ${SCENARIO_KEYS.map((k, i) => `${SCENARIO_LABELS[k]} ${pct1(replacedProjectIrr[i])}`).join('・')}（上の計算結果は変わりません）`}
        </p>
      )}

      {/* 定義と出典（初期 DOM・#107） */}
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '14px 0 6px' }}>この節の定義</h3>
      <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: '0 0 10px' }}>
        <li>借入額 ＝ CAPEX ×（1 − 補助率）× LTV。投下資本（エクイティ）＝ CAPEX ×（1 − 補助率）− 借入額。</li>
        <li>
          営業 CF ＝ 上の計算結果と同じ年次キャッシュフロー（収益 − OPEX・税引前。上限価格シナリオで置き換えている間は、置き換えた収益で計算）。同じ出力を複数の収益源に同時に計上する簡易モデルの値なので、DSCR・最大の借入額・エクイティ IRR も実際より高く出る可能性があります。
        </li>
        <li>DSCR ＝（営業 CF − 保険料）÷ その年の元利払い。元利払いの無い年は出しません。</li>
        <li>返済期間は据置期間を含み、据置の間は利息だけを払います。元利均等は毎年同じ額（借入額 × 年金係数）、元金均等は毎年同じ元金と残高に対する利息を払います。返済期間は 3 シナリオの耐用年数のうち最も短い年数以内です。</li>
        <li>
          要求水準を満たす最大の借入額: 元利払いは借入額に比例するので、各年の（営業 CF − 保険料）÷（要求水準 × 借入額 1 円あたりの元利払い）の最小値です（どれかの年で営業 CF − 保険料が 0 以下なら 0。CAPEX ×（1 − 補助率）を上限とする）。
        </li>
        <li>エクイティ IRR ＝ 投下資本に対する（営業 CF − 保険料 − 元利払い）の IRR（上の IRR と同じ計算方法）。CF の符号が 2 回以上変わるときは IRR が一意に定まらないので出しません（保険料を差し引いたプロジェクト IRR も同じ）。</li>
        <li>税・減価償却・返済準備金（DSRA）・融資手数料・金利の変動は含みません。</li>
        <li>
          上限価格の出典: {capSourceText}。
          {earliestCapFrom ? `${jaDate(earliestCapFrom)}より前の上限価格はカタログに無いため出していません。` : ''}
        </li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}>
        用語:{' '}
        <Link href="/glossary/dscr" style={linkStyle}>
          DSCR
        </Link>
        ・
        <Link href="/glossary/project-finance" style={linkStyle}>
          プロジェクトファイナンス
        </Link>
        ・
        <Link href="/glossary/eirr-equity" style={linkStyle}>
          エクイティIRR（EIRR）
        </Link>
        ・
        <Link href="/glossary/business-interruption-insurance" style={linkStyle}>
          事業中断保険
        </Link>
      </p>
    </section>
  );
}
