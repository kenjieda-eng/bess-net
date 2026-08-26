'use client';

/**
 * src/components/GridSearchUrlCopy.tsx — Gr11-④ 条件 URL のコピー
 *
 * 検索結果件数の横に置く「この条件の URL をコピー」ボタン。
 *  - navigator.clipboard.writeText を試み、失敗時（非対応/権限）は URL を表示して選択状態にする
 *  - GA4 イベント grid_search_url_copy（/anken の anken_contact_click と同じ実装様式。
 *    パラメータに条件数 conditions を載せる）
 * URL はサーバ側で組み立てた確定値を受け取る（クライアントで location を読まない＝SSR と一致）。
 */

import { useRef, useState } from 'react';

export default function GridSearchUrlCopy({ url, conditions }: { url: string; conditions: number }) {
  const [state, setState] = useState<'idle' | 'copied' | 'fallback'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const fire = () => {
    const w = window as { gtag?: (...a: unknown[]) => void };
    if (typeof window !== 'undefined' && w.gtag) {
      w.gtag('event', 'grid_search_url_copy', { conditions, link_url: url });
    }
  };

  const onCopy = async () => {
    fire();
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      // クリップボード API が使えない環境: URL を出して選択状態にするフォールバック
      setState('fallback');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  };

  return (
    <span className="grid-urlcopy no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={onCopy}
        className="grid-search-clear"
        style={{ cursor: 'pointer', border: '1px solid var(--color-border,#d1d5db)', borderRadius: 6, padding: '4px 10px', background: '#fff', fontSize: 13 }}
        aria-label="この条件のURLをコピー"
      >
        {state === 'copied' ? '✓ コピーしました' : '🔗 この条件の URL をコピー'}
      </button>
      {state === 'fallback' && (
        <input
          ref={inputRef}
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, minWidth: 260 }}
          aria-label="検索条件のURL（コピーしてください）"
        />
      )}
    </span>
  );
}
