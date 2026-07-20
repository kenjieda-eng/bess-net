'use client';

// Phase 4-pre: 中部地方 1,081 箇所変電所マップ (Leaflet クライアントコンポーネント)
// - SSR 非対応のため page.tsx 側で next/dynamic + ssr:false で読み込む
// - Leaflet デフォルトアイコン問題: Next.js の bundler が画像 path を解決できないので
//   _getIconUrl を削除し CDN URL に差し替え
// - クラスタ CSS は leaflet.markercluster の dist から直接 import
// - v21: モバイル UX 改善（min-height 400px, max 600px）+ ?focus=slug でマーカー自動センター/ポップアップ
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import Link from 'next/link';
import type { SubstationGeoPoint } from '@/lib/microcms';

// Leaflet デフォルトアイコン問題の回避（Next.js では img path がズレる）
// 型エラー回避のため any キャスト
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// マーカーアイコン（4色）
function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'substation-marker',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const ICON_GREEN = makeIcon('#16a34a'); // 緑: 空容量+ & N-1可
const ICON_BLUE = makeIcon('#2563eb'); // 青: 空容量+
const ICON_ORANGE = makeIcon('#ea580c'); // オレンジ: 空容量0以下
const ICON_GRAY = makeIcon('#6b7280'); // グレー: データなし

function chooseIcon(s: SubstationGeoPoint): L.DivIcon {
  if (s.cap_avail_mw === null || s.cap_avail_mw === undefined) return ICON_GRAY;
  if (s.cap_avail_mw > 0) {
    return s.n1_eligible ? ICON_GREEN : ICON_BLUE;
  }
  return ICON_ORANGE;
}

// マップサイズスタイル — モバイル(< 640px)で 60vh / min 400px、デスクトップで 70vh / min 500px / max 600px
// inline style で動的計算は CSS clamp/min を活用
const MAP_STYLE: React.CSSProperties = {
  height: 'clamp(400px, 70vh, 600px)',
  width: '100%',
  borderRadius: '6px',
};

const LOADING_STYLE: React.CSSProperties = {
  ...MAP_STYLE,
  background: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  fontSize: '15px',
};

type Props = { substations: SubstationGeoPoint[] };

/**
 * 内部コンポーネント: ?focus=cb-XXX が指定されている場合、該当マーカーへ flyTo + openPopup
 * - useMap は MapContainer の子要素でのみ利用可
 */
function FocusController({
  focusSlug,
  substations,
  markerRefs,
}: {
  focusSlug: string | null;
  substations: SubstationGeoPoint[];
  markerRefs: React.MutableRefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusSlug) return;
    const target = substations.find((s) => s.slug === focusSlug);
    if (!target) return;
    // 少し遅延させて Cluster の展開を待つ
    const t = setTimeout(() => {
      map.flyTo([target.latitude, target.longitude], 13, { duration: 1.2 });
      // flyTo 完了後にポップアップを開く
      const after = setTimeout(() => {
        const marker = markerRefs.current.get(focusSlug);
        if (marker) marker.openPopup();
      }, 1300);
      return () => clearTimeout(after);
    }, 200);
    return () => clearTimeout(t);
  }, [focusSlug, substations, map, markerRefs]);
  return null;
}

export default function ChubuMap({ substations }: Props) {
  // hydration mismatch 回避：マウント後に描画
  // ?focus= は useSearchParams を使わず mount 時に window.location から取得
  // （落とし穴#92: useSearchParams はルートを dynamic 化する。本コンポーネントは
  //  next/dynamic ssr:false で client-only のため window.location で十分）
  const [mounted, setMounted] = useState(false);
  const [focusSlug, setFocusSlug] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
    const sp = new URLSearchParams(window.location.search);
    setFocusSlug(sp.get('focus'));
  }, []);

  // マーカーの実体 ref（focus 時 openPopup 用）
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  // 中部地方の中心（名古屋〜松本の中間あたり）
  const center: [number, number] = [35.5, 137.3];

  if (!mounted) {
    return (
      <div style={LOADING_STYLE} aria-label="マップ読み込み中">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺</div>
          <div>マップを読み込み中…</div>
          <div style={{ fontSize: '15px', marginTop: '4px', color: '#9ca3af' }}>
            {substations.length} 箇所の変電所データを準備しています
          </div>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={8}
      scrollWheelZoom={true}
      style={MAP_STYLE}
      attributionControl={true}
    >
      <TileLayer
        url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">地理院タイル</a>'
        maxZoom={18}
      />
      <FocusController
        focusSlug={focusSlug}
        substations={substations}
        markerRefs={markerRefs}
      />
      <MarkerClusterGroup chunkedLoading>
        {substations.map((s) => (
          <Marker
            key={s.slug}
            position={[s.latitude, s.longitude]}
            icon={chooseIcon(s)}
            ref={(ref) => {
              if (ref) markerRefs.current.set(s.slug, ref);
              else markerRefs.current.delete(s.slug);
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px', maxWidth: '260px' }}>
                <strong style={{ fontSize: '15px', lineHeight: 1.3 }}>
                  {s.name}
                </strong>
                {s.prefecture && (
                  <div style={{ fontSize: '15px', color: '#666' }}>
                    {s.prefecture}
                  </div>
                )}
                <ul
                  style={{
                    margin: '8px 0',
                    padding: '0',
                    listStyle: 'none',
                    fontSize: '15px',
                    lineHeight: 1.5,
                  }}
                >
                  <li>
                    電圧: {s.voltage_primary_kv ?? '—'}/
                    {s.voltage_secondary_kv ?? '—'} kV
                  </li>
                  <li>
                    空容量:{' '}
                    {s.cap_avail_mw != null ? `${s.cap_avail_mw} MW` : '—'}
                  </li>
                  <li>N-1電制適用可: {s.n1_eligible ? '可' : '不可'}</li>
                  <li>出力制御: {s.oc_possibility ?? '—'}</li>
                </ul>
                <Link
                  href={`/grid/${s.slug}`}
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: '#0066cc',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '15px',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  詳細を見る →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
