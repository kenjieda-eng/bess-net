'use client';

/**
 * 蓄電所 残存価値の試算の部品（/tools/residual-value・T7 実装便 2026-10-15）
 * 入力は画面の中だけで使う（保存しない・送らない・URL にも書かない）。計算は src/lib/residual-value-calc.ts の純関数。
 * 欄はすべて空で始め、placeholder には単位だけを書く（数値を書かない・入力例のボタンも置かない）。
 * 結果は入力の順（シナリオ A・B・C）のまま並べる。大きい順に並べ替えたり、色で良し悪しを示したりしない。
 * 結果の欄の見出し・注意の文は初期 DOM から描き、値は入力後に入る（#107）。
 * 欄ごとの注意（読めない・範囲外）は lib の readField の文をそのまま出す（計算の判定と同じ関数）。
 */

import { useId, useRef, useState } from 'react';
import {
  COST_ITEMS,
  LIMITS,
  SCENARIO_FIELDS,
  SCENARIO_KEYS,
  SCENARIO_LABELS,
  WARRANTY_RELATION_LABEL,
  computeResidual,
  emptyResidualInput,
  numText,
  rangeSummaryText,
  rangeText,
  readField,
  thousandYenText,
  yenRoundedText,
  type CostItemKey,
  type FieldKind,
  type ResidualTextInput,
  type ScenarioField,
  type ScenarioKey,
  type ScenarioOutcome,
} from '@/lib/residual-value-calc';

/** 結果の近くに常に出す文（便 §1 画面・このまま） */
export const RESULT_NOTE = 'この数字は入力した前提の計算結果です。実際の取引価格・融資額・鑑定額とは別のものです。';

// 枠線の色は変数が無い環境でも見えるようにフォールバックを付ける（--color-border はサイトの CSS に定義が無い）
const BORDER = 'var(--color-border, #cbd5e1)';
const box = { border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' } as const;
// iOS Safari はフォーカス時に 16px 未満の入力欄を拡大するので 16px
const inputStyle = { width: '100%', padding: '6px 8px', fontSize: 16, border: '1px solid #94a3b8', borderRadius: 4, boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums' } as const;
const th = { textAlign: 'left', padding: '6px 8px', borderBottom: `2px solid ${BORDER}`, whiteSpace: 'nowrap', fontSize: 14 } as const;
const td = { padding: '6px 8px', borderBottom: `1px solid ${BORDER}`, fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;
const help = { display: 'block', marginTop: 4, color: 'var(--color-muted)', lineHeight: 1.6, fontSize: 14 } as const;
const h2 = { fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 6 } as const;
const btn = { padding: '4px 10px', fontSize: 14, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 4, cursor: 'pointer' } as const;
const srOnly = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 } as const;
const grid = (min: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap: 10 }) as const;

/** 欄の注意の文（読めない・範囲外）。空欄・範囲内なら null */
const issueOf = (text: string, kind: FieldKind): string | null => {
  const r = readField(text, kind);
  return r.state === 'bad' ? r.message : null;
};

/** 数の欄（ラベル・単位・placeholder は単位だけ・欄の下に注意） */
function NumField({
  id,
  label,
  unit,
  kind,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  unit: string;
  kind: FieldKind;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const issue = issueOf(value, kind);
  return (
    <div style={{ fontSize: 14, minWidth: 0 }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{`${label}（${unit}）`}</label>
      <input
        id={id}
        type="text"
        // 負の数を入れる欄は記号が打てるキーボードにする（数字だけのキーボードにはマイナスが無い端末がある）
        inputMode={kind === 'change' ? 'text' : 'decimal'}
        autoComplete="off"
        placeholder={unit}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        aria-invalid={issue !== null}
        aria-describedby={`${id}-issue ${id}-help`}
      />
      <span id={`${id}-issue`} style={{ display: issue ? 'block' : 'none', marginTop: 2, fontSize: 13, fontWeight: 600 }}>
        {issue ?? ''}
      </span>
      <span id={`${id}-help`} style={hint ? help : { display: 'none' }}>
        {hint ?? ''}
      </span>
    </div>
  );
}

const pctText = (v: number, digits: number) => `${(Math.round(v * 10 ** digits) / 10 ** digits).toFixed(digits)}%`;

/** 1 列分の状態の文（計算できない理由） */
function scenarioStatusText(s: ScenarioOutcome, baseOk: boolean): string {
  const p = s.parse;
  if (p.status === 'empty') return '—（この列は空欄です）';
  if (p.status === 'incomplete') return `—（未入力: ${p.missing.join('・')}）`;
  if (p.status === 'invalid') return `—（${p.problems.join('／')}）`;
  if (!baseOk) return '—（上の「いまの値」の欄が揃うと出ます）';
  return '—';
}

export default function ResidualValueCalculator() {
  const uid = useId();
  const [t, setT] = useState<ResidualTextInput>(emptyResidualInput);
  const addExtraRef = useRef<HTMLButtonElement>(null);
  const out = computeResidual(t);
  const base = out.parsed.base;
  const baseOk = base.status === 'ok';

  const set = (patch: Partial<ResidualTextInput>) => setT((cur) => ({ ...cur, ...patch }));
  const setScenario = (k: ScenarioKey, f: ScenarioField, v: string) =>
    setT((cur) => ({ ...cur, scenarios: { ...cur.scenarios, [k]: { ...cur.scenarios[k], [f]: v } } }));
  const setItem = (k: CostItemKey, v: string) => setT((cur) => ({ ...cur, costItems: { ...cur.costItems, [k]: v } }));
  const setExtra = (i: number, patch: Partial<{ year: string; amount: string }>) =>
    setT((cur) => ({ ...cur, extras: cur.extras.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const removeExtra = (i: number) => {
    setT((cur) => ({ ...cur, extras: cur.extras.filter((_, j) => j !== i) }));
    // 押したボタンが消えるので、フォーカスを「支出の行を足す」に移す
    addExtraRef.current?.focus();
  };

  // 読み上げは「計算できた列」が変わったときだけ変わる文にする（1 文字ごとに金額を読み上げない）
  const computedKeys = out.scenarios.filter((s) => s.result !== null).map((s) => SCENARIO_LABELS[s.key]);
  const statusText = computedKeys.length === 0 ? '割引現在価値はまだ出ていません。' : `計算できた列: ${computedKeys.join('・')}。値は結果の表にあります。`;
  const w = out.warranty;
  const wp = out.parsed.warranty;

  return (
    <div>
      <section style={box} aria-labelledby={`${uid}-base`}>
        <h2 id={`${uid}-base`} style={h2}>{'1. いまの値'}</h2>
        <div style={grid(220)}>
          <NumField
            id={`${uid}-years`}
            label="残りの運転年数"
            unit="年"
            kind="years"
            value={t.years}
            onChange={(v) => set({ years: v })}
            hint={`${rangeText('years')}。この年数の分だけ、1 年目から順に計算します。`}
          />
          <NumField
            id={`${uid}-revenue`}
            label="直近 12 か月の収入"
            unit="円/年"
            kind="yen"
            value={t.revenue}
            onChange={(v) => set({ revenue: v })}
            hint="市場・契約からの収入の合計。何を含めるかは入れた値のとおりに計算します。"
          />
          <NumField
            id={`${uid}-cost`}
            label="直近 12 か月の費用（まとめた額）"
            unit="円/年"
            kind="yen"
            value={t.cost}
            onChange={(v) => set({ cost: v })}
            hint="運営費（O&M・保険・土地・系統の利用料・アグリゲーターの手数料など）をまとめた額。下の内訳に入れた額はこの額に足します。"
          />
        </div>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>{'費用の内訳（任意・入れた額は上の「まとめた額」に足すだけ）'}</summary>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '8px 0', lineHeight: 1.7 }}>
            {'内訳だけで入れるときは「まとめた額」を空欄にしてください（両方に同じ費用を入れると二重に数えます）。'}
          </p>
          <div style={grid(200)}>
            {COST_ITEMS.map((it) => (
              <NumField key={it.key} id={`${uid}-ci-${it.key}`} label={it.label} unit="円/年" kind="yen" value={t.costItems[it.key]} onChange={(v) => setItem(it.key, v)} />
            ))}
          </div>
        </details>
        {base.status === 'ok' && (
          <p style={{ fontSize: 14, margin: '10px 0 0' }}>{`計算に使う費用（直近 12 か月・まとめた額と内訳の合計）: ${yenRoundedText(base.params.costYen)}`}</p>
        )}
      </section>

      <section style={box} aria-labelledby={`${uid}-scen`}>
        <h2 id={`${uid}-scen`} style={h2}>{'2. シナリオ A／B／C（3 列とも利用者が入れる）'}</h2>
        <p id={`${uid}-scen-note`} style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, lineHeight: 1.7 }}>
          {`列ごとに、収入の年あたりの変化・使える容量の年あたりの減り・費用の年あたりの変化・割引率を入れます。使う列だけでかまいません（空の列は計算しません）。使える容量の減りは収入に掛けます（容量の減りが収入にそのまま効くという前提です）。収入・費用の変化は ${rangeText('change')}、容量の減りは ${rangeText('fade')}、割引率は ${rangeText('discount')}で入れます（負の数は先頭に -）。`}
        </p>
        <div style={grid(230)}>
          {SCENARIO_KEYS.map((k) => (
            <fieldset key={k} style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: 12, margin: 0, minWidth: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 600, padding: '0 6px' }}>{SCENARIO_LABELS[k]}</legend>
              <div style={{ display: 'grid', gap: 10 }}>
                {SCENARIO_FIELDS.map((f) => (
                  <NumField key={f.key} id={`${uid}-${k}-${f.key}`} label={f.label} unit={f.unit} kind={f.kind} value={t.scenarios[k][f.key]} onChange={(v) => setScenario(k, f.key, v)} />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section style={box} aria-labelledby={`${uid}-extra`}>
        <h2 id={`${uid}-extra`} style={h2}>{`3. 任意の支出（増設・交換など・最大 ${LIMITS.extraRows} 行）と撤去の費用`}</h2>
        {t.extras.map((r, i) => (
          <fieldset key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: 12, margin: '10px 0', minWidth: 0 }}>
            <legend style={{ fontSize: 15, fontWeight: 600, padding: '0 6px' }}>{`支出 ${i + 1}`}</legend>
            <div style={grid(180)}>
              <NumField id={`${uid}-ex${i}-y`} label="支出の年" unit="年目" kind="extraYear" value={r.year} onChange={(v) => setExtra(i, { year: v })} />
              <NumField id={`${uid}-ex${i}-a`} label="金額" unit="円" kind="yen" value={r.amount} onChange={(v) => setExtra(i, { amount: v })} />
            </div>
            {t.extras.length > 1 && (
              <button type="button" onClick={() => removeExtra(i)} style={{ ...btn, marginTop: 8 }}>
                {`支出 ${i + 1} を外す`}
              </button>
            )}
          </fieldset>
        ))}
        <button
          ref={addExtraRef}
          type="button"
          disabled={t.extras.length >= LIMITS.extraRows}
          onClick={() => setT((cur) => (cur.extras.length >= LIMITS.extraRows ? cur : { ...cur, extras: [...cur.extras, { year: '', amount: '' }] }))}
          style={{ ...btn, padding: '6px 14px', fontSize: 15, cursor: t.extras.length >= LIMITS.extraRows ? 'not-allowed' : 'pointer' }}
        >
          {'支出の行を足す'}
        </button>
        <div style={{ ...grid(220), marginTop: 14 }}>
          <NumField
            id={`${uid}-removal`}
            label="運転終了時の撤去・原状回復の費用（任意）"
            unit="円"
            kind="yen"
            value={t.removal}
            onChange={(v) => set({ removal: v })}
            hint="最後の年（残りの運転年数の年）の CF から引きます。"
          />
        </div>
      </section>

      <section style={box} aria-labelledby={`${uid}-warranty`}>
        <h2 id={`${uid}-warranty`} style={h2}>{'4. 容量の保証（任意・参考の照合だけ・計算には使いません）'}</h2>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, lineHeight: 1.7 }}>
          {'保証書の「運転開始から何年目に、初期の何％」を、運転開始からの年数と、いまの使える容量（初期に対する割合）と一緒に入れると、各シナリオの容量の減りで保証の年の容量が何％になるかを並べます（いまの容量 ×（1 − 減り）^（保証の年 − 運転開始からの年数））。4 つの欄がそろったときだけ出します。'}
        </p>
        <div style={grid(200)}>
          <NumField id={`${uid}-wy`} label="保証の年（運転開始から）" unit="年目" kind="warrantyYear" value={t.warrantyYear} onChange={(v) => set({ warrantyYear: v })} />
          <NumField id={`${uid}-wp`} label="保証の値（初期に対する割合）" unit="%" kind="capacity" value={t.warrantyPct} onChange={(v) => set({ warrantyPct: v })} />
          <NumField id={`${uid}-we`} label="運転開始からの年数" unit="年" kind="elapsed" value={t.elapsedYears} onChange={(v) => set({ elapsedYears: v })} />
          <NumField id={`${uid}-wc`} label="いまの使える容量（初期に対する割合）" unit="%" kind="capacity" value={t.currentCapacityPct} onChange={(v) => set({ currentCapacityPct: v })} />
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.7, margin: '8px 0 0' }}>
          {wp.status === 'incomplete' && <p style={{ margin: 0 }}>{`照合には 4 つの欄が要ります（未入力: ${wp.missing.join('・')}）。`}</p>}
          {wp.status === 'invalid' && <p style={{ margin: 0 }}>{`${wp.problems.join('／')}（照合していません）`}</p>}
          {w.status === 'past' && <p style={{ margin: 0 }}>{'保証の年は、運転開始からの年数までに過ぎているため照合しません。'}</p>}
          {w.status === 'no-fade' && <p style={{ margin: 0 }}>{'使える容量の年あたりの減りを入れたシナリオがまだありません。'}</p>}
          {w.status === 'ok' && wp.status === 'ok' && (
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {w.rows.map((r) => (
                <li key={r.key}>{`${SCENARIO_LABELS[r.key]}の容量の減りでは、保証の年（運転開始から ${numText(wp.year)} 年目・いまから ${numText(w.horizonYears)} 年後）に ${pctText(r.capacityPct, r.digits)}（${WARRANTY_RELATION_LABEL[r.relation]}・保証の値 ${numText(wp.pct)}%）`}</li>
              ))}
              {w.beyondRemaining && <li>{'保証の年は残りの運転年数より後です。上の値は、運転期間の外まで容量の減りを延ばした値です。'}</li>}
            </ul>
          )}
        </div>
      </section>

      <section style={box} aria-labelledby={`${uid}-result`}>
        <h2 id={`${uid}-result`} style={{ ...h2, marginBottom: 8 }}>{'5. 結果（入力した前提の割引現在価値）'}</h2>
        <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.7, margin: '0 0 10px' }}>{RESULT_NOTE}</p>
        <p role="status" style={srOnly}>
          {statusText}
        </p>
        {base.status === 'incomplete' && <p style={{ fontSize: 14, margin: '0 0 8px' }}>{`未入力: ${base.missing.join('・')}`}</p>}
        {base.status === 'invalid' && (
          <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: '0 0 8px' }}>
            {base.problems.map((p) => (
              <li key={p}>{`${p}（計算していません）`}</li>
            ))}
          </ul>
        )}
        {out.parsed.extraNotices.length > 0 && (
          <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: '0 0 8px' }}>
            {out.parsed.extraNotices.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <p style={{ fontSize: 14, margin: '0 0 6px' }}>{'割引現在価値（千円未満を四捨五入して表示・入力の順のまま）'}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <caption style={srOnly}>{'割引現在価値'}</caption>
            <thead>
              <tr>
                <th scope="col" style={th}>{'列'}</th>
                <th scope="col" style={{ ...th, textAlign: 'right' }}>{'割引現在価値'}</th>
              </tr>
            </thead>
            <tbody>
              {out.scenarios.map((s) => (
                <tr key={s.key}>
                  <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 400 }}>{SCENARIO_LABELS[s.key]}</th>
                  <td style={s.result ? { ...td, whiteSpace: 'normal', overflowWrap: 'anywhere' } : { ...td, textAlign: 'left', whiteSpace: 'normal' }}>
                    {s.result ? yenRoundedText(s.result.pvYen) : scenarioStatusText(s, baseOk)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 15, margin: '10px 0 0', overflowWrap: 'anywhere' }}>{`計算できた列の最小〜最大: ${rangeSummaryText(out.range)}`}</p>

        <p style={{ fontSize: 14, margin: '14px 0 0' }}>{'年ごとの表（金額の単位: 千円・千円未満を四捨五入）'}</p>
        {out.scenarios.map((s) => (
          <details key={s.key} style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>{`${SCENARIO_LABELS[s.key]}の年ごとの表`}</summary>
            {s.result ? (
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <caption style={srOnly}>{`${SCENARIO_LABELS[s.key]}の年ごとの表（千円）`}</caption>
                  <thead>
                    <tr>
                      {['年', '容量係数', '収入', '費用', '任意の支出・撤去', 'CF', '割引後'].map((h, i) => (
                        <th key={h} scope="col" style={{ ...th, textAlign: i === 0 ? 'left' : 'right' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.result.rows.map((r) => (
                      <tr key={r.year}>
                        <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 400 }}>{`${r.year} 年目`}</th>
                        <td style={td}>{r.capacityFactor.toFixed(4)}</td>
                        <td style={td}>{thousandYenText(r.revenueYen)}</td>
                        <td style={td}>{thousandYenText(r.costYen)}</td>
                        <td style={td}>{thousandYenText(r.extraYen + r.removalYen)}</td>
                        <td style={td}>{thousandYenText(r.cfYen)}</td>
                        <td style={td}>{thousandYenText(r.discountedYen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: 14, margin: '8px 0 0' }}>{'この列はまだ計算できません。'}</p>
            )}
          </details>
        ))}
        <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: '12px 0 0' }}>
          <li>{'3 列は入力の順に並べています。当サイトはどの列を選ぶべきかを示しません。'}</li>
          <li>{'表示は千円未満を四捨五入しています。計算は丸める前の値で行います。'}</li>
        </ul>
      </section>
    </div>
  );
}
