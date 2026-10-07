/**
 * src/lib/balancing-cap.ts — 需給調整市場の ΔkW 上限価格の履歴（EPRX 月次置換便 §3・2026-10-07）
 *
 * 出どころ:
 *   - 過去の上限（適用開始日に点）… EIC カタログ `balancing-price-cap-{product}`（R-28 §2）。
 *     2024-04-01（FY2024）・2025-04-01（FY2025）・2026-03-14（改定・19.51→15.00。二次②・三次①は 7.21 のまま）。
 *   - カタログにまだ点が無い改定（2026-09-01 からの 10.00 円・一次・二次①・複合）… 下の CAP_REVISIONS_NOT_IN_CATALOG の 1 か所だけ。
 *     一次は EPRX 2026-07-30 公表「需給調整市場のΔkW上限価格について」（解説記事 balancing-price-cap-10yen-explainer と同じ一次）。
 *     ★カタログがこの日付以降の点を持ったら、この定数は使われなくなる（capTimeline が自動で無視）＝切替は定数を消すだけ。
 * 三次調整力②は上限価格の設定が無い（系列なし）。
 *
 * 「その日に有効な上限」＝その日付以下で最後の点（capAt）。#119/#121: 上限の値の出どころはこのファイルだけ。
 * ★相対 import（アプリの client／server の両方から読む）。値はビルド時に固定＝SSR とハイドレーションで同じ。
 */
import capPrimary from '../data/eic/balancing-price-cap-primary.json';
import capSecondary1 from '../data/eic/balancing-price-cap-secondary-1.json';
import capSecondary2 from '../data/eic/balancing-price-cap-secondary-2.json';
import capTertiary1 from '../data/eic/balancing-price-cap-tertiary-1.json';
import capComposite from '../data/eic/balancing-price-cap-composite.json';

export type CapProductKey = 'primary' | 'secondary-1' | 'secondary-2' | 'tertiary-1' | 'composite';

type CapSeries = { id: string; meta: { notes?: string; source_name?: string }; points: { date: string; value: number | null }[] };

const CAP: Record<CapProductKey, CapSeries> = {
  primary: capPrimary as unknown as CapSeries,
  'secondary-1': capSecondary1 as unknown as CapSeries,
  'secondary-2': capSecondary2 as unknown as CapSeries,
  'tertiary-1': capTertiary1 as unknown as CapSeries,
  composite: capComposite as unknown as CapSeries,
};

export type CapRevision = {
  products: readonly CapProductKey[];
  /** 適用開始日（実需給日・YYYY-MM-DD） */
  from: string;
  value: number;
  sourceTitle: string;
  publisher: string;
  publishedOn: string;
  url: string;
};

/**
 * カタログにまだ点が無い上限価格の改定（「カタログの最後の点より新しい焼き込み」を 1 か所に置く）。
 * カタログに from 以降の点が入った商品では使われない。全商品で使われなくなったら行ごと消す。
 */
export const CAP_REVISIONS_NOT_IN_CATALOG: readonly CapRevision[] = [
  {
    products: ['primary', 'secondary-1', 'composite'],
    from: '2026-09-01',
    value: 10,
    sourceTitle: '需給調整市場のΔkW上限価格について',
    publisher: '一般社団法人 電力需給調整力取引所（EPRX）',
    publishedOn: '2026-07-30',
    url: 'https://www.eprx.or.jp/information/post.php',
  },
];

export type CapPoint = { date: string; value: number; source: 'catalog' | 'revision' };

/** 商品の上限価格の履歴（カタログの点＋カタログより新しい改定・日付昇順） */
export function capTimeline(product: CapProductKey): CapPoint[] {
  const pts: CapPoint[] = (CAP[product]?.points ?? [])
    .filter((p): p is { date: string; value: number } => typeof p.value === 'number')
    .map((p) => ({ date: p.date.slice(0, 10), value: p.value, source: 'catalog' as const }));
  const last = pts.length ? pts[pts.length - 1].date : '';
  for (const r of CAP_REVISIONS_NOT_IN_CATALOG) {
    if (!r.products.includes(product)) continue;
    // カタログが改定日以降の点を持っていれば、カタログを正とする（定数は使わない）
    if (pts.some((p) => p.date >= r.from)) continue;
    if (r.from > last) pts.push({ date: r.from, value: r.value, source: 'revision' });
  }
  return pts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** その日に有効な上限（その日付以下で最後の点）。点が無ければ null */
export function capAt(product: CapProductKey, date: string): number | null {
  let v: number | null = null;
  for (const p of capTimeline(product)) if (p.date <= date) v = p.value;
  return v;
}

const dayBefore = (iso: string): string =>
  new Date(Date.parse(`${iso}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const ymd = (iso: string) => ({ y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });

export type CapNote = {
  /** 改定前の上限（一次・二次①・複合）・小数 2 桁の文字列 */
  before: string;
  /** 改定後の上限（同） */
  after: string;
  /** 二次②・三次①の上限（継続） */
  keep: string;
  /** 改定前の最終日（実需給日） */
  until: { y: number; m: number; d: number };
  /** 改定の適用開始日（実需給日） */
  from: { y: number; m: number; d: number };
  /** 改定値の出どころ（カタログの点か、カタログ未収載の改定か） */
  afterSource: 'catalog' | 'revision';
  /** 改定の一次（文言の出典・カタログ未収載のとき） */
  revision: CapRevision;
};

/**
 * /tools/balancing-revenue の注記「ΔkW 上限価格の改定」の数値（一次・二次①・複合／二次②・三次①）。
 * 改定日は CAP_REVISIONS_NOT_IN_CATALOG の先頭（カタログに入った後も日付の拠り所として残す）。
 * ★一次・二次①・複合は同じ値（2026-10-06 catalog・改定とも）。食い違ったら注記の文がまとめて書けないので WARN。
 */
export function capNote(): CapNote {
  const rev = CAP_REVISIONS_NOT_IN_CATALOG[0];
  const group: CapProductKey[] = ['primary', 'secondary-1', 'composite'];
  const keepGroup: CapProductKey[] = ['secondary-2', 'tertiary-1'];
  const until = dayBefore(rev.from);
  const before = group.map((p) => capAt(p, until));
  const after = group.map((p) => capAt(p, rev.from));
  const keep = keepGroup.map((p) => capAt(p, rev.from));
  if (new Set(before).size !== 1 || new Set(after).size !== 1 || new Set(keep).size !== 1 || before[0] === null || after[0] === null || keep[0] === null) {
    console.warn(`[balancing-cap] WARN 上限価格が商品間で食い違う（before ${before.join('/')}・after ${after.join('/')}・keep ${keep.join('/')}）`);
  }
  const afterPoint = capTimeline('primary').find((p) => p.date === rev.from);
  return {
    before: (before[0] ?? 0).toFixed(2),
    after: (after[0] ?? 0).toFixed(2),
    keep: (keep[0] ?? 0).toFixed(2),
    until: ymd(until),
    from: ymd(rev.from),
    afterSource: afterPoint?.source ?? 'catalog',
    revision: rev,
  };
}

/**
 * 出典欄に書く上限価格の出所（カタログ notes の「出典: …p.NN」から・年度ごと）。
 * 例: 「2024年度の取引実績について」（2025年6月19日）p.13・p.21・p.29・p.37・p.45
 */
export function capSourceLines(): string[] {
  const out: string[] = [];
  for (const fy of ['2024', '2025']) {
    const srcs = (Object.keys(CAP) as CapProductKey[])
      .map((p) => (CAP[p].meta.notes ?? '').match(new RegExp(`(「${fy}年度の取引実績について」（[^）]*）)p\\.(\\d+)`)))
      .filter((m): m is RegExpMatchArray => m !== null);
    if (srcs.length === 0) continue;
    const pages = [...new Set(srcs.map((m) => Number(m[2])))].sort((a, b) => a - b);
    out.push(`${srcs[0][1]}p.${pages.join('・p.')}`);
  }
  return out;
}

/** 出典欄に書く系列の source_name（5 系列とも同一＝一次調整力から読む） */
export const CAP_SOURCE_NAME = CAP.primary.meta.source_name ?? null;
