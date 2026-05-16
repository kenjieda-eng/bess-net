'use client';

/**
 * src/components/FireRiskChecker.tsx
 *
 * 火災リスク自己診断 UI (依頼AS、教育型ツール)
 *
 * 機能:
 *   - 5 ステップ (カテゴリ別) チェックリスト 25 問
 *   - 結果: 総合スコア + リスクレベル + カテゴリスコアバー + Top 5 priority_actions
 *   - CSV エクスポート
 *   - URL share (window.location + history.replaceState、落とし穴 #92 対応)
 *   - ARIA + aria-live + キーボード操作
 *
 * 落とし穴対応:
 *   - #92: useSearchParams 不使用
 *   - #95-98: microCMS リクエスト 0 (チェックリストは静的データ)
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CHECKLIST,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_COLORS,
  type CategoryKey,
} from '@/data/fire-risk-checklist';
import {
  calculateFireRisk,
  RISK_COLORS,
  type FireRiskResult,
} from '@/lib/fire-risk-checker';

const CATEGORY_ORDER: CategoryKey[] = ['cell', 'pcs', 'building', 'operation', 'emergency'];

// ─────────────────────────────────────
// URL params (落とし穴 #92)
// ─────────────────────────────────────

function answersToParams(answers: Record<string, number>): URLSearchParams {
  const sp = new URLSearchParams();
  // 短縮: a=cell-1:2,cell-2:0,...
  const pairs = Object.entries(answers).map(([k, v]) => `${k}:${v}`).join(',');
  if (pairs) sp.set('a', pairs);
  return sp;
}

function paramsToAnswers(sp: URLSearchParams): Record<string, number> {
  const out: Record<string, number> = {};
  const a = sp.get('a');
  if (!a) return out;
  for (const pair of a.split(',')) {
    const [id, v] = pair.split(':');
    if (id && v !== undefined) {
      const n = parseInt(v, 10);
      if (Number.isFinite(n) && n >= 0) out[id] = n;
    }
  }
  return out;
}

// ─────────────────────────────────────
// CSV エクスポート
// ─────────────────────────────────────

function buildCsv(answers: Record<string, number>, result: FireRiskResult): string {
  const lines: string[] = [];
  lines.push('# 火災リスク自己診断 結果出力 (bess-net.jp/tools/fire-risk-check)');
  lines.push(`# 生成日時: ${new Date().toISOString()}`);
  lines.push('# ⚠️ 啓発・自己評価用、法的判断・専門助言の代替ではない');
  lines.push('');
  lines.push('## サマリ');
  lines.push(`総合スコア,${result.total_score}/100`);
  lines.push(`リスクレベル,${result.risk_level_label}`);
  lines.push(`回答数,${result.answered_count} / ${result.total_questions}`);
  lines.push('');
  lines.push('## カテゴリ別');
  lines.push('カテゴリ,スコア,リスクレベル,回答数');
  for (const c of result.by_category) {
    lines.push(`${c.category_label},${c.score}/100,${c.risk_level},${c.answered_count}/${c.total_count}`);
  }
  lines.push('');
  lines.push('## 優先改善 Top 5');
  lines.push('順位,カテゴリ,問,現選択肢,スコア,重要度,severity,推奨,参考規格');
  result.priority_actions.forEach((a, i) => {
    const cells = [
      String(i + 1),
      a.category,
      `"${a.question.replace(/"/g, '""')}"`,
      `"${a.current_choice.replace(/"/g, '""')}"`,
      `${a.score}/10`,
      String(a.weight),
      a.severity,
      `"${(a.risk_note ?? '').replace(/"/g, '""')}"`,
      a.reference ?? '',
    ];
    lines.push(cells.join(','));
  });
  lines.push('');
  lines.push('## 全回答 (参考)');
  lines.push('id,カテゴリ,問,現選択肢,score');
  for (const item of CHECKLIST) {
    const idx = answers[item.id];
    if (idx === undefined) continue;
    const opt = item.options[idx];
    const cells = [
      item.id,
      item.category,
      `"${item.question.replace(/"/g, '""')}"`,
      `"${opt.label.replace(/"/g, '""')}"`,
      String(opt.score),
    ];
    lines.push(cells.join(','));
  }
  return lines.join('\n');
}

function downloadCsv(content: string, filename: string) {
  const bom = '﻿';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────
// メイン
// ─────────────────────────────────────

export default function FireRiskChecker() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState<CategoryKey>('cell');
  const [hydrated, setHydrated] = useState(false);

  // mount 時に URL から復元
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.toString().length > 0) {
      setAnswers(paramsToAnswers(sp));
    }
    setHydrated(true);
  }, []);

  // 入力 → URL replace
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const sp = answersToParams(answers);
    const newUrl = sp.toString()
      ? `${window.location.pathname}?${sp.toString()}`
      : window.location.pathname;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [answers, hydrated]);

  const result = useMemo<FireRiskResult>(() => calculateFireRisk({ answers }), [answers]);

  const setAnswer = (id: string, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [id]: optIdx }));
  };

  const resetAll = () => setAnswers({});

  const handleCsvExport = () => {
    downloadCsv(
      buildCsv(answers, result),
      `bess-fire-risk-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const handleShareUrl = async () => {
    const sp = answersToParams(answers);
    const url = `${window.location.origin}${window.location.pathname}?${sp.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('回答付き URL をクリップボードにコピーしました\n' + url);
    } catch {
      prompt('URL をコピーしてください:', url);
    }
  };

  const itemsInStep = CHECKLIST.filter((i) => i.category === step);
  const answeredInStep = itemsInStep.filter((i) => answers[i.id] !== undefined).length;
  const currentStepIdx = CATEGORY_ORDER.indexOf(step);

  return (
    <div>
      {/* ★ Disclaimer (必須) */}
      <div
        role="note"
        style={{
          padding: 14,
          marginBottom: 16,
          background: '#fff4f4',
          border: '2px solid #cc0066',
          borderRadius: 6,
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        ⚠️ <strong>本診断は啓発・自己評価用です。</strong>法的判断・専門助言の代替にはなりません。最終的な火災対策の妥当性は{' '}
        <strong>消防署・電気主任技術者・蓄電池専門家との協議で確定</strong>してください。
        本ツールは UL9540A / NFPA 855 / 消防法 の主要観点を網羅した 25 問のセルフチェックです。
      </div>

      {/* 進捗バー */}
      <div
        style={{
          padding: 12,
          marginBottom: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>進捗:</span>
          <span aria-live="polite">
            {result.answered_count} / {result.total_questions} 回答済 (
            {Math.round((result.answered_count / result.total_questions) * 100)}%)
          </span>
          <button
            type="button"
            onClick={resetAll}
            disabled={result.answered_count === 0}
            style={{
              marginLeft: 'auto',
              padding: '4px 10px',
              fontSize: 12,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              cursor: result.answered_count === 0 ? 'not-allowed' : 'pointer',
              opacity: result.answered_count === 0 ? 0.5 : 1,
            }}
          >
            ↻ リセット
          </button>
        </div>
        <div
          style={{
            height: 6,
            background: '#eee',
            borderRadius: 3,
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <div
            style={{
              width: `${(result.answered_count / result.total_questions) * 100}%`,
              height: '100%',
              background: 'var(--color-accent, #0066cc)',
              transition: 'width 0.2s',
            }}
          />
        </div>
      </div>

      {/* ステップタブ (5 カテゴリ) */}
      <div
        role="tablist"
        aria-label="チェック対象カテゴリ"
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          marginBottom: 12,
          borderBottom: '2px solid var(--color-border)',
        }}
      >
        {CATEGORY_ORDER.map((cat, idx) => {
          const items = CHECKLIST.filter((i) => i.category === cat);
          const answered = items.filter((i) => answers[i.id] !== undefined).length;
          return (
            <button
              key={cat}
              role="tab"
              type="button"
              aria-selected={step === cat}
              onClick={() => setStep(cat)}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                background: step === cat ? CATEGORY_COLORS[cat] : '#fff',
                color: step === cat ? '#fff' : 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderBottom: 'none',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
              }}
            >
              Step {idx + 1}/5 {CATEGORY_LABELS[cat]} ({answered}/{items.length})
            </button>
          );
        })}
      </div>

      {/* 質問リスト (現ステップのみ) */}
      <section
        style={{
          padding: 16,
          marginBottom: 20,
          background: 'var(--color-bg-card, #fff)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>
            {CATEGORY_LABELS[step]} ({answeredInStep}/{itemsInStep.length} 回答済)
          </h3>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>
            {CATEGORY_DESCRIPTIONS[step]}
          </p>
        </div>

        {itemsInStep.map((item, qIdx) => (
          <fieldset
            key={item.id}
            style={{
              padding: 12,
              marginBottom: 12,
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: '#fafafa',
            }}
          >
            <legend
              style={{
                padding: '0 6px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Q{qIdx + 1}. {item.question}
              {item.weight === 3 && (
                <span style={{ marginLeft: 6, fontSize: 11, color: '#cc0066', fontWeight: 700 }}>
                  ★重要
                </span>
              )}
              {item.reference && (
                <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--color-muted)' }}>
                  ({item.reference})
                </span>
              )}
            </legend>
            <div role="radiogroup" aria-labelledby={`${item.id}-legend`} style={{ marginTop: 6 }}>
              {item.options.map((opt, oi) => {
                const checked = answers[item.id] === oi;
                return (
                  <label
                    key={oi}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '6px 8px',
                      marginBottom: 4,
                      background: checked ? '#e7f3ff' : 'transparent',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    <input
                      type="radio"
                      name={item.id}
                      checked={checked}
                      onChange={() => setAnswer(item.id, oi)}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <span style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>{opt.label}</span>
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: opt.score >= 8 ? '#006666' : opt.score >= 5 ? '#cc6600' : '#cc0066',
                          fontWeight: 700,
                        }}
                      >
                        ({opt.score}/10)
                      </span>
                      {opt.risk_note && (
                        <span
                          style={{
                            display: 'block',
                            marginTop: 2,
                            fontSize: 11,
                            color: 'var(--color-muted)',
                          }}
                        >
                          {opt.risk_note}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            {item.hint && (
              <p
                style={{
                  marginTop: 6,
                  marginBottom: 0,
                  fontSize: 11,
                  color: 'var(--color-muted)',
                  fontStyle: 'italic',
                }}
              >
                💡 {item.hint}
              </p>
            )}
          </fieldset>
        ))}

        {/* ステップ ナビ */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {currentStepIdx > 0 && (
            <button
              type="button"
              onClick={() => setStep(CATEGORY_ORDER[currentStepIdx - 1])}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              ← 前のステップ
            </button>
          )}
          {currentStepIdx < CATEGORY_ORDER.length - 1 && (
            <button
              type="button"
              onClick={() => setStep(CATEGORY_ORDER[currentStepIdx + 1])}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                background: 'var(--color-accent, #0066cc)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              次のステップ →
            </button>
          )}
        </div>
      </section>

      {/* 結果サマリ */}
      <section
        style={{
          padding: 16,
          marginBottom: 16,
          background: 'var(--color-bg-card, #fff)',
          border: `2px solid ${RISK_COLORS[result.risk_level]}`,
          borderRadius: 6,
        }}
        aria-live="polite"
        aria-label="診断結果サマリ"
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
          診断結果サマリ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>総合スコア</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: RISK_COLORS[result.risk_level] }}>
              {result.total_score}
              <span style={{ fontSize: 16, color: 'var(--color-muted)' }}> / 100</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>リスクレベル</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: RISK_COLORS[result.risk_level],
              }}
            >
              {result.risk_level_label}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>回答進捗</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {result.answered_count} / {result.total_questions}
            </div>
          </div>
        </div>
      </section>

      {/* カテゴリ別スコアバー */}
      <section
        style={{
          padding: 16,
          marginBottom: 16,
          background: 'var(--color-bg-card, #fff)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
          カテゴリ別 スコア
        </h3>
        {result.by_category.map((c) => (
          <div key={c.category} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: CATEGORY_COLORS[c.category] }}>
                {c.category_label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                ({c.answered_count}/{c.total_count} 回答)
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: RISK_COLORS[c.risk_level] }}>
                {c.score}/100
              </span>
            </div>
            <div
              style={{
                height: 10,
                background: '#eee',
                borderRadius: 5,
                overflow: 'hidden',
              }}
              aria-hidden="true"
            >
              <div
                style={{
                  width: `${c.score}%`,
                  height: '100%',
                  background: RISK_COLORS[c.risk_level],
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
        ))}
      </section>

      {/* 優先改善 Top 5 */}
      {result.priority_actions.length > 0 && (
        <section
          style={{
            padding: 16,
            marginBottom: 16,
            background: '#fff4f4',
            border: '1px solid #cc0066',
            borderRadius: 6,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 12, color: '#cc0066' }}>
            優先改善 Top {result.priority_actions.length}
          </h3>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {result.priority_actions.map((a, i) => {
              const sevColor = a.severity === 'critical' ? '#cc0066' : a.severity === 'high' ? '#cc6600' : '#0066cc';
              return (
                <li
                  key={a.item_id}
                  style={{
                    marginBottom: 10,
                    padding: 12,
                    background: '#fff',
                    border: `1px solid ${sevColor}`,
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        background: sevColor,
                        color: '#fff',
                        borderRadius: 3,
                      }}
                    >
                      #{i + 1} {a.severity.toUpperCase()}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#f0f0f0',
                        borderRadius: 3,
                      }}
                    >
                      {CATEGORY_LABELS[a.category]}
                    </span>
                    {a.reference && (
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                        参考: {a.reference}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{a.question}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                    現選択: 「{a.current_choice}」 (score {a.score}/10)
                  </div>
                  {a.risk_note && (
                    <div style={{ marginTop: 6, fontSize: 13, color: sevColor }}>{a.risk_note}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* エクスポート */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          type="button"
          onClick={handleCsvExport}
          disabled={result.answered_count === 0}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            background: 'var(--color-accent, #0066cc)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: result.answered_count === 0 ? 'not-allowed' : 'pointer',
            opacity: result.answered_count === 0 ? 0.5 : 1,
          }}
        >
          📥 CSV エクスポート (改善計画書)
        </button>
        <button
          type="button"
          onClick={handleShareUrl}
          disabled={result.answered_count === 0}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            background: '#fff',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            cursor: result.answered_count === 0 ? 'not-allowed' : 'pointer',
            opacity: result.answered_count === 0 ? 0.5 : 1,
          }}
        >
          🔗 回答付き URL をコピー
        </button>
      </div>

      {/* 参考文献 + 関連リンク */}
      <section
        style={{
          padding: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
          参考文献・関連情報
        </h3>
        <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          <li>
            <a
              href="https://www.ul.com/services/ul-9540a-test-method"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent, #0066cc)' }}
            >
              UL9540A 試験方法
            </a>{' '}
            (UL公式、英語) — 蓄電池の熱暴走伝播試験
          </li>
          <li>
            <a
              href="https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=855"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent, #0066cc)' }}
            >
              NFPA 855
            </a>{' '}
            (米国国家防火協会) — 蓄電池設置の防火基準
          </li>
          <li>
            <a
              href="https://www.fdma.go.jp/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent, #0066cc)' }}
            >
              総務省 消防庁
            </a>{' '}
            — 国内消防法・関連通達
          </li>
          <li>
            <Link href="/glossary?cat=安全" style={{ color: 'var(--color-accent, #0066cc)' }}>
              用語集: 安全カテゴリ
            </Link>{' '}
            — 熱暴走・UL9540A・防爆等の解説
          </li>
          <li>
            <Link href="/explainer/grid-scale-bess" style={{ color: 'var(--color-accent, #0066cc)' }}>
              解説記事: 系統用蓄電池
            </Link>{' '}
            — 安全設計の体系解説
          </li>
        </ul>
      </section>
    </div>
  );
}
