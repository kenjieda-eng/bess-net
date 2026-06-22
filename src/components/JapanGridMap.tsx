'use client';

// JapanGridMap.tsx (v25)
// 簡易日本地図 SVG — 送配電10エリアを矩形で配置、件数バッジ、クリックで /grid/[area] へ
// - 'use client' で Link プレフェッチを有効化
// - viewBox=0 0 460 510 でレスポンシブ（max-width 600px）
// - 落とし穴 #57: クリッカブル領域は `<a>` (Next/Link) で SVG 内 navigation
import Link from 'next/link';

export type JapanAreaInfo = {
  slug: string;
  fullName: string;
  count: number;
  hasMap?: boolean;
  isSuspended?: boolean;
};

type Props = {
  areas: JapanAreaInfo[];
};

// 各送配電エリアの位置・サイズ (viewBox 0 0 460 510)
const AREA_BOX: Record<
  string,
  { x: number; y: number; w: number; h: number; color: string }
> = {
  hokkaido: { x: 320, y: 30, w: 120, h: 90, color: '#0ea5e9' },
  tohoku: { x: 290, y: 130, w: 110, h: 130, color: '#22c55e' },
  tokyo: { x: 280, y: 270, w: 120, h: 80, color: '#6366f1' }, // 東京PG：収録済み
  chubu: { x: 200, y: 230, w: 90, h: 100, color: '#f59e0b' }, // 中部：地図対応
  hokuriku: { x: 180, y: 180, w: 80, h: 60, color: '#06b6d4' },
  kansai: { x: 130, y: 250, w: 80, h: 80, color: '#ef4444' },
  chugoku: { x: 50, y: 240, w: 90, h: 70, color: '#8b5cf6' },
  shikoku: { x: 90, y: 320, w: 90, h: 50, color: '#ec4899' },
  kyushu: { x: 0, y: 320, w: 80, h: 110, color: '#f43f5e' },
  okinawa: { x: 30, y: 450, w: 60, h: 40, color: '#14b8a6' },
};

export default function JapanGridMap({ areas }: Props) {
  return (
    <section className="grid-japan-map">
      <h2 className="grid-japan-map-title">🗾 全国の系統空き容量を地図で探す</h2>
      <p className="grid-japan-map-sub">
        各エリアをクリックすると詳細ページへ遷移します。中部は緯度経度付きの地図検索にも対応。
      </p>
      <svg
        viewBox="0 0 460 510"
        className="grid-japan-map-svg"
        role="img"
        aria-label="日本の送配電エリア地図"
      >
        {areas.map((area) => {
          const box = AREA_BOX[area.slug];
          if (!box) return null;
          const labelX = box.x + box.w / 2;
          const labelY = box.y + box.h / 2;
          // 公開停止 (tokyo) は /grid/tokyo へ、それ以外はエリアページへ
          const href = area.isSuspended ? '/grid/tokyo' : `/grid/${area.slug}`;

          return (
            <Link key={area.slug} href={href}>
              <g
                style={{
                  cursor: 'pointer',
                }}
                className="grid-japan-map-area"
              >
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  fill={box.color}
                  fillOpacity={area.isSuspended ? 0.4 : 0.85}
                  stroke="white"
                  strokeWidth="2"
                  rx="6"
                />
                <text
                  x={labelX}
                  y={labelY - 6}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {area.fullName}
                </text>
                <text
                  x={labelX}
                  y={labelY + 12}
                  textAnchor="middle"
                  fill="white"
                  fontSize="13"
                  style={{ pointerEvents: 'none' }}
                >
                  {area.isSuspended
                    ? '公開停止中'
                    : `${area.count.toLocaleString()}件`}
                </text>
                {area.hasMap && !area.isSuspended && (
                  <text
                    x={labelX}
                    y={labelY + 28}
                    textAnchor="middle"
                    fontSize="14"
                    style={{ pointerEvents: 'none' }}
                  >
                    🗺
                  </text>
                )}
              </g>
            </Link>
          );
        })}
      </svg>

      <p className="grid-japan-map-legend">
        🗾 簡易レイアウト図　🗺 = マップ対応（中部）　全10エリア稼働中
      </p>
    </section>
  );
}
