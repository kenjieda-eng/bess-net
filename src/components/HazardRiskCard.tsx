/**
 * HazardRiskCard.tsx
 *
 * 変電所別 災害リスク参考情報カード（Server Component）
 * src/data/hazard-risk-map.json を build 時 import — SSR 追加リクエストなし（鉄則#2）
 *
 * 表示ルール:
 *   inside  → "区域内"（洪水は浸水深ラベルも付与）
 *   nearby  → "周辺に区域あり（所在地点は区域外）"
 *   none    → "区域外"
 *   error   → "取得不可"
 *   slug 未登録（座標未保有）→ "座標未確認のため災害リスク情報なし"
 *
 * データソース: 国土交通省 不動産情報ライブラリ (reinfolib) XKT026/027/028/029
 *   @turf/boolean-point-in-polygon で変電所座標のポイント判定済み
 */

import hazardRiskMapRaw from '@/data/hazard-risk-map.json';

type HazardStatus = 'inside' | 'nearby' | 'none' | 'error';

interface FloodRisk {
  status: HazardStatus;
  depthCat: number | null;
  scale: string;
}

interface SimpleRisk {
  status: HazardStatus;
}

interface HazardEntry {
  flood: FloodRisk;
  landslide: SimpleRisk;
  stormSurge: SimpleRisk;
  tsunami: SimpleRisk;
  generatedAt: string;
}

const hazardRiskMap = hazardRiskMapRaw as Record<string, HazardEntry>;

// 浸水深区分コード → 表示ラベル（XKT026 A31a_205）
const DEPTH_CAT_LABEL: Record<number, string> = {
  1: '0.5m未満',
  2: '0.5m以上3m未満',
  3: '3m以上5m未満',
  4: '5m以上10m未満',
  5: '10m以上20m未満',
  6: '20m以上',
};

function StatusBadge({ status }: { status: HazardStatus }) {
  if (status === 'inside') {
    return (
      <span className="grid-badge grid-badge-warn" style={{ fontSize: '15px' }}>
        区域内
      </span>
    );
  }
  if (status === 'nearby') {
    return (
      <span
        className="grid-badge"
        style={{
          background: '#fffbeb',
          color: '#92400e',
          border: '1px solid #fde68a',
          fontSize: '15px',
          fontWeight: 500,
        }}
      >
        周辺に区域あり（所在地点は区域外）
      </span>
    );
  }
  if (status === 'none') {
    return (
      <span className="grid-badge grid-badge-info" style={{ fontSize: '15px' }}>
        区域外
      </span>
    );
  }
  return (
    <span className="grid-badge grid-badge-info" style={{ fontSize: '15px', color: '#9ca3af' }}>
      取得不可
    </span>
  );
}

function HazardRow({
  label,
  status,
  note,
}: {
  label: string;
  status: HazardStatus;
  note?: string;
}) {
  return (
    <>
      <dt style={{ color: '#6b7280', fontWeight: 500 }}>{label}</dt>
      <dd style={{ margin: 0 }}>
        <StatusBadge status={status} />
        {note && (
          <span className="grid-note" style={{ marginLeft: 8 }}>
            {note}
          </span>
        )}
      </dd>
    </>
  );
}

function MultipleRiskWarning({ entry }: { entry: HazardEntry }) {
  const insideCount = [
    entry.flood.status,
    entry.landslide.status,
    entry.stormSurge.status,
    entry.tsunami.status,
  ].filter((s) => s === 'inside').length;

  if (insideCount < 2) return null;

  return (
    <p
      style={{
        marginTop: 10,
        fontSize: '15px',
        color: '#92400e',
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 6,
        padding: '6px 12px',
      }}
    >
      ⚠ 複数の浸水・災害リスク区域が重複しています（参考情報）。
      詳細は各自治体のハザードマップでご確認ください。
    </p>
  );
}

interface HazardRiskCardProps {
  slug: string;
}

export default function HazardRiskCard({ slug }: HazardRiskCardProps) {
  const entry = hazardRiskMap[slug] as HazardEntry | undefined;

  const floodNote =
    entry?.flood.status === 'inside' && entry.flood.depthCat != null
      ? `想定最大規模 浸水深 ${DEPTH_CAT_LABEL[entry.flood.depthCat] ?? `区分${entry.flood.depthCat}`}`
      : entry?.flood.status === 'inside'
      ? '想定最大規模'
      : undefined;

  return (
    <section className="grid-section">
      <h2 className="grid-section-h2">災害リスク参考情報</h2>

      {!entry ? (
        <p style={{ fontSize: '15px', color: '#6b7280', margin: '8px 0 0' }}>
          座標未確認のため災害リスク情報なし（位置情報が登録されると自動反映されます）
        </p>
      ) : (
        <>
          <dl className="grid-info-table">
            <HazardRow
              label="洪水浸水（想定最大規模）"
              status={entry.flood.status}
              note={floodNote}
            />
            <HazardRow
              label="土砂災害警戒区域"
              status={entry.landslide.status}
            />
            <HazardRow
              label="高潮浸水想定区域"
              status={entry.stormSurge.status}
            />
            <HazardRow
              label="津波浸水想定"
              status={entry.tsunami.status}
            />
          </dl>

          <MultipleRiskWarning entry={entry} />
        </>
      )}

      <p className="grid-source-note" style={{ marginTop: 14 }}>
        出典: 国土交通省 不動産情報ライブラリ(reinfolib)／国土数値情報（都道府県別の利用条件あり）。
        編集部がAPIを加工・集計。想定最大規模の区域図に基づく参考情報であり、
        実際の被災を保証・否定するものではありません。
        詳細は各自治体のハザードマップ・公式情報をご確認ください。
        {entry && (
          <> データ更新: {entry.generatedAt.slice(0, 10)}</>
        )}
      </p>
    </section>
  );
}
