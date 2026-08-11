'use client';
// SubstationsBrowser - エリアページ用：変電所のクライアント側 検索/フィルタ/ページネーション
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Substation } from '@/lib/microcms';
// Gr10(2026-08-11): 都道府県欄に系統区分・設備区分を出さない（原値は設備区分として別表示）
import { normalizeSubstationPlace } from '@/lib/grid-prefecture';

const PAGE_SIZE = 20;

const VOLTAGE_OPTIONS = [
  '500kV系',
  '275kV系',
  '187kV系',
  '154kV系',
  '110kV系',
  '77kV系',
  '66kV系',
  '22kV系',
  '13.8kV系',
  'その他',
];

type Props = { items: Substation[] };

export default function SubstationsBrowser({ items }: Props) {
  const [query, setQuery] = useState('');
  const [voltageClass, setVoltageClass] = useState<string>('すべて');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [n1Only, setN1Only] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((s) => {
      if (q) {
        const hay = `${s.name} ${s.prefecture ?? ''} ${
          s.external_id ?? ''
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (voltageClass !== 'すべて') {
        const vc = (s.voltage_class && s.voltage_class[0]) || '';
        if (vc !== voltageClass) return false;
      }
      if (availableOnly) {
        if (!(typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0)) return false;
      }
      if (n1Only) {
        if (s.n1_eligible !== true) return false;
      }
      return true;
    });
  }, [items, query, voltageClass, availableOnly, n1Only]);

  // フィルタ条件変更時に visible をリセット
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, voltageClass, availableOnly, n1Only]);

  const visibleItems = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <div className="grid-browser">
      <div className="grid-browser-controls">
        <input
          type="search"
          className="grid-browser-search"
          placeholder="変電所名・都道府県で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="検索"
        />
        <select
          className="grid-browser-select"
          value={voltageClass}
          onChange={(e) => setVoltageClass(e.target.value)}
          aria-label="電圧階級"
        >
          <option value="すべて">電圧階級：すべて</option>
          {VOLTAGE_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <label className="grid-browser-check">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          空容量プラスのみ
        </label>
        <label className="grid-browser-check">
          <input
            type="checkbox"
            checked={n1Only}
            onChange={(e) => setN1Only(e.target.checked)}
          />
          N-1電制適用可のみ
        </label>
      </div>

      <p className="grid-browser-summary">
        {filtered.length === 0
          ? '該当する変電所がありません。フィルタを調整してください。'
          : `該当 ${filtered.length}件 / 全 ${items.length}件 を表示中（${Math.min(
              visible,
              filtered.length
            )}件まで）`}
      </p>

      {filtered.length > 0 && (
        <div className="grid-table-wrap">
          <table className="grid-table">
            <thead>
              <tr>
                <th>変電所名</th>
                <th>都道府県／設備区分</th>
                <th>電圧階級</th>
                <th className="num">台数</th>
                <th className="num">空容量(MW)</th>
                <th>N-1電制</th>
                <th>出力制御</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((s) => {
                const vc = (s.voltage_class && s.voltage_class[0]) || '';
                const oc = (s.oc_possibility && s.oc_possibility[0]) || '';
                const avail =
                  typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : null;
                return (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/grid/${s.slug}`}>{s.name}</Link>
                    </td>
                    <td>
                      {(() => {
                        const place = normalizeSubstationPlace(
                          s.prefecture,
                          Array.isArray(s.area) ? s.area[0] : (s.area as unknown as string | undefined)
                        );
                        if (place.prefecture) return place.prefecture;
                        if (place.facilityClass) return `設備区分: ${place.facilityClass}`;
                        return '—';
                      })()}
                    </td>
                    <td>{vc || '—'}</td>
                    <td className="num">
                      {typeof s.units === 'number' ? s.units : '—'}
                    </td>
                    <td className="num">
                      {avail !== null ? (
                        <span className={avail > 0 ? 'pos' : 'zero'}>
                          {avail}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {s.n1_eligible === true ? (
                        <span className="grid-badge grid-badge-ok">可</span>
                      ) : s.n1_eligible === false ? (
                        <span className="grid-badge grid-badge-info">不可</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {oc === '有り' ? (
                        <span className="grid-badge grid-badge-warn">有り</span>
                      ) : oc ? (
                        oc
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="grid-browser-more">
          <button
            type="button"
            className="grid-browser-more-btn"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            もっと見る（残り {filtered.length - visible} 件）
          </button>
        </div>
      )}
    </div>
  );
}
