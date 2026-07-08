'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Faq } from '@/lib/microcms';

// 依頼BG: FAQ answer の auto-link 適用済 HTML を server から受け取る
// (server-side で linkifyTerms 済、glossaryLite を bundle 同梱せず安全)
// isNew はサーバー側（page.tsx）で publishedAt 90日以内を判定して付与（hydration差分回避）
type FaqWithLinkifiedAnswer = Faq & { answerHtml?: string; isNew?: boolean };

const CATEGORY_ORDER = ['制度', '技術', '事業', '補助金', 'その他'];

const CATEGORY_COLORS: Record<string, string> = {
  制度: '#0066cc',
  技術: '#006666',
  事業: '#cc6600',
  補助金: '#cc0066',
  その他: '#666666',
};

function firstOf(arr: string[] | string | undefined): string {
  if (Array.isArray(arr)) return arr[0] ?? '';
  return arr ?? '';
}

function parseSlugList(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function FaqClient({ items }: { items: FaqWithLinkifiedAnswer[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((it) => firstOf(it.category) === activeCategory);
  }, [items, activeCategory]);

  // カテゴリ別件数
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const it of items) {
      const c = firstOf(it.category);
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [items]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(filtered.map((it) => it.id)));
  };
  const collapseAll = () => {
    setOpenIds(new Set());
  };

  return (
    <div>
      {/* カテゴリタブ */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginBottom: 16,
          borderBottom: '2px solid var(--color-border)',
          paddingBottom: 8,
        }}
      >
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '6px 14px',
            fontSize: 14,
            fontWeight: 600,
            background: activeCategory === 'all' ? 'var(--color-accent, #0066cc)' : '#fff',
            color: activeCategory === 'all' ? '#fff' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          全て（{categoryCounts.all || 0}）
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            style={{
              padding: '6px 14px',
              fontSize: 14,
              fontWeight: 600,
              background:
                activeCategory === c ? CATEGORY_COLORS[c] || '#0066cc' : '#fff',
              color: activeCategory === c ? '#fff' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {c}（{categoryCounts[c] || 0}）
          </button>
        ))}
      </div>

      {/* 開閉トグル */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          alignItems: 'center',
          fontSize: 13,
        }}
      >
        <button
          onClick={expandAll}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          すべて開く
        </button>
        <button
          onClick={collapseAll}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          すべて閉じる
        </button>
        <span style={{ color: 'var(--color-muted)', marginLeft: 'auto' }}>
          {filtered.length} 件表示中
        </span>
      </div>

      {/* FAQ アコーディオン */}
      {filtered.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: 32,
            color: 'var(--color-muted)',
          }}
        >
          このカテゴリに該当する FAQ がありません。
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filtered.map((it) => {
            const isOpen = openIds.has(it.id);
            const category = firstOf(it.category);
            const glossarySlugs = parseSlugList(it.relatedGlossary);
            const explainerSlugs = parseSlugList(it.relatedExplainer);
            return (
              <li
                key={it.id}
                style={{
                  marginBottom: 10,
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  background: 'var(--color-bg-card, #fff)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => toggleOpen(it.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    fontFamily: 'inherit',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flex: 1,
                    }}
                  >
                    {category && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          color: '#fff',
                          background: CATEGORY_COLORS[category] || '#666',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {category}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        lineHeight: 1.45,
                      }}
                    >
                      Q. {it.question}
                    </span>
                    {it.isNew && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          color: '#fff',
                          background: '#e11d48',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      color: 'var(--color-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {/* P1: 回答は常時レンダリング（初期DOMに全56件掲載＝SEO）。開閉は display 切替のみ
                    （faq分析2026-07-08 案1。初期状態は全閉のまま＝hydration mismatch なし） */}
                <div
                  style={{
                    padding: '0 16px 16px 16px',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 12,
                    display: isOpen ? undefined : 'none',
                  }}
                >
                    {/* 依頼BG: server-side linkify 済 HTML があれば優先描画 */}
                    {it.answerHtml ? (
                      <p
                        style={{
                          fontSize: 14,
                          margin: '8px 0 12px',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <strong style={{ marginRight: 4 }}>A.</strong>
                        <span
                          dangerouslySetInnerHTML={{ __html: it.answerHtml }}
                        />
                      </p>
                    ) : (
                      <p
                        style={{
                          fontSize: 14,
                          margin: '8px 0 12px',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <strong style={{ marginRight: 4 }}>A.</strong>
                        {it.answer}
                      </p>
                    )}
                    {(glossarySlugs.length > 0 ||
                      explainerSlugs.length > 0 ||
                      it.sourceUrl) && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: '1px dashed var(--color-border)',
                          fontSize: 13,
                          lineHeight: 1.8,
                          color: 'var(--color-muted)',
                        }}
                      >
                        {glossarySlugs.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            ▶ 関連用語:{' '}
                            {glossarySlugs.map((s, i) => (
                              <span key={s}>
                                {i > 0 && ' / '}
                                <Link
                                  href={`/glossary/${s}`}
                                  style={{
                                    color: 'var(--color-accent, #0066cc)',
                                  }}
                                >
                                  {s}
                                </Link>
                              </span>
                            ))}
                          </div>
                        )}
                        {explainerSlugs.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            ▶ 関連解説:{' '}
                            {explainerSlugs.map((s, i) => (
                              <span key={s}>
                                {i > 0 && ' / '}
                                <Link
                                  href={`/explainer/${s}`}
                                  style={{
                                    color: 'var(--color-accent, #0066cc)',
                                  }}
                                >
                                  {s}
                                </Link>
                              </span>
                            ))}
                          </div>
                        )}
                        {it.sourceUrl && (
                          <div>
                            ▶ 出典:{' '}
                            <a
                              href={it.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--color-accent, #0066cc)',
                                wordBreak: 'break-all',
                              }}
                            >
                              {it.sourceUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
