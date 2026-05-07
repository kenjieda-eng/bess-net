'use client';

// Phase 4-pre: 中部地方 1,081 箇所変電所マップ (Leaflet クライアントコンポーネント)
// - SSR 非対応のため page.tsx 側で next/dynamic + ssr:false で読み込む
// - Leaflet デフォルトアイコン問題: Next.js の bundler が画像 path を解決できないので
//   _getIconUrl を削除し CDN URL に差し替え
// - クラスタ CSS は leaflet.markercluster の dist から直接 import
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

type Props = { substations: SubstationGeoPoint[] };

export default function ChubuMap({ substations }: Props) {
  // hydration mismatch 回避：マウント後に描画
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 中部地方の中心（名古屋〜松本の中間あたり）
  const center: [number, number] = [35.5, 137.3];

  if (!mounted) {
    return (
      <div
        style={{
          height: '70vh',
          minHeight: '500px',
          width: '100%',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '14px',
        }}
      >
        マップを読み込み中…
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={8}
      scrollWheelZoom={true}
      style={{ height: '70vh', width: '100%', minHeight: '500px' }}
      attributionControl={true}
    >
      <TileLayer
        url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">地理院タイル</a>'
        maxZoom={18}
      />
      <MarkerClusterGroup chunkedLoading>
        {substations.map((s) => (
          <Marker
            key={s.slug}
            position={[s.latitude, s.longitude]}
            icon={chooseIcon(s)}
          >
            <Popup>
              <div style={{ minWidth: '220px' }}>
                <strong style={{ fontSize: '14px' }}>{s.name}</strong>
                {s.prefecture && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {s.prefecture}
                  </div>
                )}
                <ul
                  style={{
                    margin: '8px 0',
                    padding: '0',
                    listStyle: 'none',
                    fontSize: '12px',
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
                    padding: '4px 8px',
                    background: '#0066cc',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '12px',
                    borderRadius: '3px',
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
