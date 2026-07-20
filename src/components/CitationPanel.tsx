/**
 * CitationPanel — 4タブ × コピー × ライセンス × データDL の引用 panel
 * Client Component (useState で format 切替 + copied 状態)
 *
 * 設計:
 *   - L-JEPX-UI-001 inline style + className 両指定
 *   - clipboard API は try-catch、フォールバックで textarea 経由
 *   - Toast は 2 秒で消える
 */

'use client';

import { useState } from 'react';
import type { Indicator } from '@/types/eic';
import { formatCitation } from '@/lib/cite-helpers';

interface CitationPanelProps {
  indicator: Indicator;
  /** GitHub raw CSV URL (Optional, 表示時のみ) */
  csvUrl?: string;
  /** カタログ詳細 URL (Optional) */
  catalogUrl?: string;
}

type CitationFormat = 'apa' | 'bibtex' | 'chicago' | 'short';

const FORMAT_LABELS: Record<CitationFormat, string> = {
  apa: 'APA',
  bibtex: 'BibTeX',
  chicago: 'Chicago',
  short: '短縮',
};

function formatShort(ind: Indicator): string {
  const publisher = ind.publisher ?? ind.source_name;
  const accessDate = ind.observation_cutoff ?? new Date().toISOString().slice(0, 10);
  return `出典: ${publisher}, via EIC Data (${accessDate}). https://data.eic-jp.org/catalog/${ind.id}`;
}

// fallback clipboard copy (古い Safari 等で navigator.clipboard が無い場合)
function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function CitationPanel({ indicator, csvUrl, catalogUrl }: CitationPanelProps) {
  const [format, setFormat] = useState<CitationFormat>('apa');
  const [copied, setCopied] = useState(false);

  const citation =
    format === 'short' ? formatShort(indicator) : formatCitation(indicator, format);

  const copyToClipboard = async () => {
    let ok = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(citation);
        ok = true;
      } catch {
        ok = fallbackCopy(citation);
      }
    } else {
      ok = fallbackCopy(citation);
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: 15,
    fontWeight: active ? 600 : 400,
    backgroundColor: active ? 'var(--color-accent, #0066cc)' : 'transparent',
    color: active ? 'white' : 'var(--color-text, #475569)',
    border: active
      ? '1px solid var(--color-accent, #0066cc)'
      : '1px solid var(--color-border, #cbd5e1)',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        marginTop: 8,
      }}
    >
      {/* タブ + コピーボタン */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div role="tablist" aria-label="引用形式" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(FORMAT_LABELS) as CitationFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={format === f}
              style={tabButtonStyle(format === f)}
              onClick={() => setFormat(f)}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copyToClipboard}
          aria-live="polite"
          style={{
            padding: '6px 14px',
            fontSize: 15,
            fontWeight: 600,
            backgroundColor: copied ? '#10b981' : 'var(--color-accent, #0066cc)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
        >
          {copied ? '✓ コピーしました' : '📋 コピー'}
        </button>
      </div>

      {/* 引用文 */}
      <pre
        style={{
          padding: 12,
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: 15,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          margin: 0,
        }}
      >
        {citation}
      </pre>

      {/* ライセンス + DL リンク */}
      <div
        style={{
          marginTop: 12,
          fontSize: 15,
          color: '#64748b',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <span>
          <strong style={{ color: '#475569' }}>ライセンス:</strong>{' '}
          {indicator.license_url ? (
            <a
              href={indicator.license_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent, #0066cc)', textDecoration: 'underline' }}
            >
              {indicator.license}
            </a>
          ) : (
            indicator.license
          )}
        </span>
        {csvUrl && (
          <span>
            <strong style={{ color: '#475569' }}>データ DL:</strong>{' '}
            <a
              href={csvUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent, #0066cc)', textDecoration: 'underline' }}
            >
              CSV
            </a>
          </span>
        )}
        {catalogUrl && (
          <a
            href={catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-accent, #0066cc)', textDecoration: 'underline' }}
          >
            → EIC Data カタログで詳細
          </a>
        )}
      </div>
    </div>
  );
}
