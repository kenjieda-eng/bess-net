'use client';

/**
 * src/components/GridPrintButton.tsx — Gr11-⑤ 印刷・PDF 保存
 *
 * window.print() を呼ぶボタン＋GA4 イベント grid_print（page パラメータ付き。
 * /anken の anken_contact_click と同じ実装様式）。
 * 印刷ヘッダの「印刷日時」はブラウザ側でしか決まらないため、beforeprint と
 * クリック時に .grid-print-datetime へ書き込む（サーバは器だけ描画＝ハイドレーション不一致を作らない）。
 */

import { useEffect } from 'react';

function stampDatetime() {
  const el = document.querySelectorAll<HTMLElement>('.grid-print-datetime');
  const now = new Date();
  const s = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  el.forEach((e) => { e.textContent = s; });
}

export default function GridPrintButton({ page }: { page: string }) {
  useEffect(() => {
    // Ctrl+P 等ボタン以外の印刷経路でも日時を最新化する
    window.addEventListener('beforeprint', stampDatetime);
    return () => window.removeEventListener('beforeprint', stampDatetime);
  }, []);

  const onClick = () => {
    const w = window as { gtag?: (...a: unknown[]) => void };
    if (typeof window !== 'undefined' && w.gtag) {
      w.gtag('event', 'grid_print', { page });
    }
    stampDatetime();
    window.print();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="no-print"
      style={{ cursor: 'pointer', border: '1px solid var(--color-border,#d1d5db)', borderRadius: 6, padding: '4px 10px', background: '#fff', fontSize: 13 }}
      aria-label="このページを印刷またはPDF保存"
    >
      🖨 印刷・PDF 保存
    </button>
  );
}
