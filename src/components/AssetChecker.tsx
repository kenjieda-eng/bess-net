'use client';

/**
 * src/components/AssetChecker.tsx — /tools/asset-check の画面（T2 実装便・2026-10-10）
 *
 * - 設問は props（サーバー側で src/data/asset-check-questions.ts から渡す）。40 問の文・なぜ・一次・次にやることを全部描く（#107 初期 DOM）。
 *   軸ごとの畳み込みは <details>（中身は DOM に残る＝表示切替）。答え方に関わる注記（D4・D5・D7・C2 など）は開閉欄の外に出す。
 * - 入力は画面の中だけ（保存しない・送らない・URL にも載せない）。
 * - 値は「整備済みの割合」で良し悪しではない。順位・格付けの語を出さない。
 * - 採点・前提の質問・一覧の計算は src/lib/asset-check.ts（純関数）。
 */
import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AssetCheckAxisKey, AssetCheckQuestion } from '@/data/asset-check-questions';
import {
  ANSWER_LABEL,
  PREMISES,
  QUESTION_NOTES,
  answerOptions,
  autoNotApplicable,
  effectiveAnswers,
  formatAxisValue,
  listByAnswer,
  summarizeAxes,
  type AssetCheckAnswer,
  type AxisSummary,
  type PremiseAnswers,
  type PremiseKey,
} from '@/lib/asset-check';

type Props = {
  axes: { key: AssetCheckAxisKey; label: string }[];
  questions: AssetCheckQuestion[];
};

const linkStyle = { color: 'var(--color-accent)' } as const;
const box = {
  padding: 16,
  marginBottom: 20,
  background: 'var(--color-bg-card, #fff)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  overflowWrap: 'anywhere',
} as const;

/** 文の中の URL と当サイトのページ（/tools/…・/grid）をリンクにする（長い URL は折り返す） */
const LINK_RE = /(https?:\/\/[^\s）」、。]+|\/(?:tools|grid)(?:\/[a-z0-9-]+)*)/g;
function LinkText({ text }: { text: string }) {
  const parts = text.split(LINK_RE);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{p}</Fragment>;
        return p.startsWith('http') ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, overflowWrap: 'anywhere' }}>{p}</a>
        ) : (
          <Link key={i} href={p} style={linkStyle}>{p}</Link>
        );
      })}
    </>
  );
}

function PrimaryLink({ q }: { q: AssetCheckQuestion }) {
  const p = q.primary;
  if (p.siteDefinition) {
    return (
      <>
        <Link href={p.href} style={linkStyle}>当サイトの資産台帳テンプレートの定義</Link>
        {'（当サイトの想定）'}
      </>
    );
  }
  return (
    <>
      <a href={p.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{p.name}</a>
      {`（${p.issuer}${p.where ? `・${p.where}` : ''}）`}
    </>
  );
}

/**
 * 軸のレーダー（SVG・依存なし）。値の無い軸（対象外・未回答）には点を打たず、灰色で状態を書く。
 * 線は隣り合う 2 軸がどちらも値を持つ区間だけ結ぶ（値の無い軸を横切る線で、値があるように見せない）。全軸に値があるときだけ塗る。
 */
function Radar({ axes, summaries }: { axes: Props['axes']; summaries: AxisSummary[] }) {
  const size = 420;
  const c = size / 2;
  const R = 120;
  const n = axes.length;
  const pt = (i: number, r: number) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [c + r * Math.cos(a), c + r * Math.sin(a)] as const;
  };
  const has = (i: number) => summaries[i].status === 'value';
  const vpt = (i: number) => pt(i, (R * (summaries[i].percent as number)) / 100);
  const allValued = summaries.every((s) => s.status === 'value');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 460, display: 'block', margin: '0 auto' }} role="img" aria-label={`${n} 軸の整備済みの割合（良し悪しではありません）`}>
      {[25, 50, 75, 100].map((p) => (
        <polygon key={p} points={axes.map((_, i) => pt(i, (R * p) / 100).join(',')).join(' ')} fill="none" stroke="var(--color-border, #ddd)" strokeWidth={p === 100 ? 1.5 : 1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--color-border, #ddd)" />;
      })}
      {allValued && <polygon points={axes.map((_, i) => vpt(i).join(',')).join(' ')} fill="rgba(0,102,204,0.15)" stroke="none" />}
      {axes.map((_, i) => {
        const j = (i + 1) % n;
        if (!has(i) || !has(j)) return null;
        const [x1, y1] = vpt(i);
        const [x2, y2] = vpt(j);
        return <line key={`s${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0066cc" strokeWidth={2} />;
      })}
      {axes.map((_, i) => {
        if (!has(i)) return null;
        const [x, y] = vpt(i);
        return <circle key={`p${i}`} cx={x} cy={y} r={4} fill="#0066cc" />;
      })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, R + 42);
        const s = summaries[i];
        const gray = s.status !== 'value';
        return (
          <text key={a.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={14} style={{ fill: gray ? 'var(--color-muted, #6b7280)' : 'currentColor' }}>
            <tspan x={x} dy="-1.1em">{`${a.key} ${a.label}`}</tspan>
            <tspan x={x} dy="1.2em" fontWeight={700}>{formatAxisValue(s)}</tspan>
            <tspan x={x} dy="1.2em" fontSize={12}>{s.status === 'notApplicable' ? '' : `回答 ${s.answered}／該当 ${s.applicable}`}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

export default function AssetChecker({ axes, questions }: Props) {
  const [premises, setPremises] = useState<PremiseAnswers>({});
  const [user, setUser] = useState<Record<string, AssetCheckAnswer | undefined>>({});

  const auto = useMemo(() => autoNotApplicable(premises), [premises]);
  const answers = useMemo(() => effectiveAnswers(questions, user, premises), [questions, user, premises]);
  const summaries = useMemo(() => summarizeAxes(axes, questions, answers), [axes, questions, answers]);
  const naCount = questions.filter((q) => answers[q.id] === 'na').length;
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== 'na').length;
  const autoCount = questions.filter((q) => auto.has(q.id) && q.allowsNotApplicable && !user[q.id]).length;

  const setAnswer = (id: string, a: AssetCheckAnswer) => setUser((prev) => ({ ...prev, [id]: a }));
  const setPremise = (k: PremiseKey, v: string) =>
    setPremises((prev) => {
      const next = { ...prev };
      if (v) next[k] = v;
      else delete next[k];
      return next;
    });
  const resetAll = () => {
    setPremises({});
    setUser({});
  };

  const noList = listByAnswer(questions, answers, 'no');
  const unknownList = listByAnswer(questions, answers, 'unknown');
  const naList = listByAnswer(questions, answers, 'na');

  return (
    <div>
      {/* 前提の質問（採点しない・R2） */}
      <section style={box} aria-labelledby="asset-check-premises">
        <h2 id="asset-check-premises" style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 6 }}>
          {`はじめに: 前提の質問（${PREMISES.length} 問・採点しません）`}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12, lineHeight: 1.7 }}>
          {'答えると、当てはまらない問いを「該当しない」にします（各問で選び直せます）。分からない前提は空欄のままにしてください。'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12 }}>
          {PREMISES.map((p) => (
            <label key={p.key} style={{ display: 'block', fontSize: 15, lineHeight: 1.6 }}>
              <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>{p.question}</span>
              <select
                value={premises[p.key] ?? ''}
                onChange={(e) => setPremise(p.key, e.target.value)}
                style={{ width: '100%', padding: '6px 8px', fontSize: 15, border: '1px solid var(--color-border)', borderRadius: 4 }}
              >
                <option value="">（答えない）</option>
                {p.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p style={{ fontSize: 14, margin: '12px 0 0' }} aria-live="polite">
          {`前提の答えから「該当しない」にした問い: ${autoCount} 問`}
        </p>
      </section>

      {/* 進捗（「該当しない」は回答と分けて数える） */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12, fontSize: 15 }}>
        <span aria-live="polite">{`${questions.length} 問のうち 回答 ${answeredCount} 問・「該当しない」${naCount} 問・残り ${questions.length - answeredCount - naCount} 問`}</span>
        <button
          type="button"
          onClick={resetAll}
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 15, background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer' }}
        >
          最初からやり直す
        </button>
      </div>

      {/* 設問（軸ごと・#107 で全問を初期 DOM に） */}
      {axes.map((ax) => {
        const qs = questions.filter((q) => q.axis === ax.key);
        const s = summaries.find((x) => x.axis === ax.key) as AxisSummary;
        return (
          <details key={ax.key} open style={{ ...box, padding: '12px 16px' }}>
            <summary style={{ cursor: 'pointer', fontSize: 17, fontWeight: 700 }}>
              {`${ax.key} ${ax.label}（${qs.length} 問・回答 ${s.answered}／該当 ${s.applicable}）`}
            </summary>
            {qs.map((q) => {
              const a = answers[q.id];
              const isAuto = a === 'na' && !user[q.id];
              const userOverridesAuto = auto.has(q.id) && q.allowsNotApplicable && !!user[q.id] && user[q.id] !== 'na';
              const notes = QUESTION_NOTES[q.id] ?? [];
              const legendId = `q-${q.id}-legend`;
              return (
                <fieldset
                  key={q.id}
                  id={`q-${q.id}`}
                  style={{ margin: '14px 0 0', padding: 12, minWidth: 0, border: '1px solid var(--color-border)', borderRadius: 6, background: '#fafafa', overflowWrap: 'anywhere', scrollMarginTop: 260 }}
                >
                  <legend id={legendId} style={{ padding: '0 6px', fontSize: 16, fontWeight: 600, lineHeight: 1.6 }}>{`${q.id}　${q.question}`}</legend>
                  {q.allowsNotApplicable ? (
                    <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '4px 0', lineHeight: 1.6 }}>{`当てはまる条件: ${q.appliesWhen}`}</p>
                  ) : (
                    q.appliesWhen !== '全サイト' && (
                      <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '4px 0', lineHeight: 1.6 }}>{`対象・答え方: ${q.appliesWhen}`}</p>
                    )
                  )}
                  {q.answerNote && <p style={{ fontSize: 14, margin: '4px 0', lineHeight: 1.6 }}>{`答え方: ${q.answerNote}`}</p>}
                  <div role="radiogroup" aria-labelledby={legendId} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0' }}>
                    {answerOptions(q).map((o) => (
                      <label
                        key={o}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 4,
                          background: a === o ? '#e7f3ff' : '#fff',
                          cursor: 'pointer',
                          fontSize: 15,
                        }}
                      >
                        <input type="radio" name={`asset-${q.id}`} checked={a === o} onChange={() => setAnswer(q.id, o)} />
                        {ANSWER_LABEL[o]}
                      </label>
                    ))}
                  </div>
                  {isAuto && (
                    <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '0 0 6px' }}>
                      {'前提の質問の答えから「該当しない」にしています（ほかを選べば変わります）。'}
                    </p>
                  )}
                  {userOverridesAuto && (
                    <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '0 0 6px' }}>
                      {'前提の質問の答えからは「該当しない」に当たる問いです（いまは選んだ答えを使っています）。'}
                    </p>
                  )}
                  {notes.map((nt, i) => (
                    <p key={i} style={{ margin: '6px 0', fontSize: 14, lineHeight: 1.7 }}>
                      {nt.text}
                      {nt.href && (
                        <>
                          {' → '}
                          <Link href={nt.href} style={linkStyle}>{nt.linkLabel ?? nt.href}</Link>
                        </>
                      )}
                    </p>
                  ))}
                  <details style={{ fontSize: 15, lineHeight: 1.7 }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>なぜ確かめられるか・一次・次にやること</summary>
                    <p style={{ margin: '8px 0' }}><LinkText text={q.why} /></p>
                    <p style={{ margin: '8px 0' }}>
                      {'一次: '}
                      <PrimaryLink q={q} />
                    </p>
                    {q.primary.quote && (
                      <blockquote style={{ margin: '0 0 8px', padding: '6px 12px', borderLeft: '3px solid var(--color-border)', color: 'var(--color-muted)', fontSize: 14 }}>
                        {`「${q.primary.quote}」`}
                      </blockquote>
                    )}
                    {q.others.length > 0 && (
                      <p style={{ margin: '8px 0', fontSize: 14 }}>
                        {'ほかの一次: '}
                        {q.others.map((o, i) => (
                          <span key={`${o.href}-${i}`}>
                            {i > 0 && '／'}
                            <a href={o.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{o.name}</a>
                          </span>
                        ))}
                      </p>
                    )}
                    <p style={{ margin: '8px 0' }}>
                      {'未整備・不明のとき次にやること: '}
                      <LinkText text={q.nextAction} />
                    </p>
                    <p style={{ margin: '8px 0', fontSize: 14, color: 'var(--color-muted)' }}>{`主の一次の種類: ${q.strength}`}</p>
                  </details>
                </fieldset>
              );
            })}
          </details>
        );
      })}

      {/* 結果 */}
      <section style={box} aria-labelledby="asset-check-result">
        <h2 id="asset-check-result" style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 6 }}>
          {`${axes.length} 軸の整備済みの割合`}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, lineHeight: 1.7 }}>
          {'値は整備済みの割合で、良し悪しではありません。はい＝1・不明＝0.5・いいえ＝0 の合計を、該当する問いの数で割っています（「該当しない」は数えません。まだ答えていない問いは 0 として数えるので、全問に答えるまでは途中経過です）。1 問も答えていない軸は「未回答」、全問が「該当しない」の軸は「対象外」と出ます。'}
        </p>
        <Radar axes={axes} summaries={summaries} />
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['軸', '整備済みの割合', '回答／該当', 'はい', '不明', 'いいえ', '該当しない'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => {
                const label = axes.find((a) => a.key === s.axis)?.label ?? '';
                return (
                  <tr key={s.axis}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{`${s.axis} ${label}`}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>{formatAxisValue(s)}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>{`${s.answered} / ${s.applicable}`}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>{s.yes}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>{s.unknown}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>{s.no}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>{s.notApplicable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={box} aria-labelledby="asset-check-lists">
        <h2 id="asset-check-lists" style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 6 }}>
          未整備・不明の一覧（次にやること）
        </h2>
        {noList.length + unknownList.length === 0 ? (
          <p style={{ fontSize: 15, margin: 0 }}>{'「いいえ」「不明」と答えた問いはまだありません。'}</p>
        ) : (
          <ul style={{ fontSize: 15, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
            {[...noList, ...unknownList].map((q) => (
              <li key={q.id} style={{ marginBottom: 8 }}>
                <a href={`#q-${q.id}`} style={linkStyle}>{`${q.id}（${ANSWER_LABEL[answers[q.id] as AssetCheckAnswer]}）`}</a>
                {'　'}
                <LinkText text={q.nextAction} />
                {'　一次: '}
                <PrimaryLink q={q} />
              </li>
            ))}
          </ul>
        )}
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 6px' }}>「該当しない」とした問い</h3>
        {naList.length === 0 ? (
          <p style={{ fontSize: 15, margin: 0 }}>{'まだありません。'}</p>
        ) : (
          <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
            {naList.map((q) => (
              <li key={q.id}>
                <a href={`#q-${q.id}`} style={linkStyle}>{q.id}</a>
                {`（${user[q.id] ? '自分で選択' : '前提の質問から'}）当てはまる条件: ${q.appliesWhen}`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
