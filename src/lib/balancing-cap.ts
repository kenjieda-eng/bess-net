/**
 * src/lib/balancing-cap.ts — 需給調整市場の ΔkW 上限価格の履歴（EPRX 月次置換便 §3・2026-10-07）
 *
 * 出どころ:
 *   - 過去の上限（適用開始日に点）… EIC カタログ `balancing-price-cap-{product}`（R-28 §2）。
 *     2024-04-01（FY2024）・2025-04-01（FY2025）・2026-03-14（改定・19.51→15.00。二次②・三次①は 7.21 のまま）。
 *   - カタログにまだ点が無い改定（2026-09-01 からの 10.00 円・一次・二次①・複合）… 下の CAP_REVISIONS_NOT_IN_CATALOG の 1 か所だけ。
 *     一次は EPRX 2026-07-30 公表「需給調整市場のΔkW上限価格について」（解説記事 balancing-price-cap-10yen-explainer と同じ一次）。
 *     ★カタログが改定日ちょうどの点を持った商品では、この定数の値は使われなくなる（capTimeline が自動でカタログを正とする）。
 *       定数の行は消さない（capNote が注記の改定日と一次の拠り所として読む・型でも空にできない）。
 * 三次調整力②は上限価格の設定が無い（系列なし）。
 *
 * 「その日に有効な上限」＝その日付以下で最後の点（capAt）。
 * #119/#121: /tools/balancing-revenue の注記・出典欄の上限の値の出どころはこのファイルだけ
 * （/lv 系の各ページは 15.00／10.00／7.21 を直書きのまま＝この便の範囲外）。
 * ★サーバ側（page.tsx）で capNote() を 1 回だけ求め、結果を props でクライアントコンポーネントに渡す
 *   （カタログ JSON をクライアントのバンドルに入れない・WARN はビルドのログにだけ出る）。
 *   scripts/verify-eprx-monthly.ts も capNoteProblems() を呼ぶので、相対 import にしている。
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
 * カタログが改定日（from）ちょうどの点を持った商品では値は使われない。行は消さない（先頭は capNote の改定日の拠り所）。
 */
export const CAP_REVISIONS_NOT_IN_CATALOG: readonly [CapRevision, ...CapRevision[]] = [
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

function catalogPoints(product: CapProductKey): CapPoint[] {
  return (CAP[product]?.points ?? [])
    .filter((p): p is { date: string; value: number } => typeof p.value === 'number')
    .map((p) => ({ date: p.date.slice(0, 10), value: p.value, source: 'catalog' as const }));
}

/**
 * 商品の上限価格の履歴（カタログの点＋カタログに無い改定・日付昇順）。
 * 改定はカタログに同じ日付の点が無いときだけ足す（カタログに後の日付の点があっても、改定日の点はカタログが持つまで定数で補う）。
 */
export function capTimeline(product: CapProductKey): CapPoint[] {
  const pts = catalogPoints(product);
  for (const r of CAP_REVISIONS_NOT_IN_CATALOG) {
    if (!r.products.includes(product)) continue;
    if (pts.some((p) => p.source === 'catalog' && p.date === r.from)) continue;
    pts.push({ date: r.from, value: r.value, source: 'revision' });
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

/** 注記の「改定される商品」（一次・二次①・複合）と「継続する商品」（二次②・三次①） */
const GROUP: readonly CapProductKey[] = ['primary', 'secondary-1', 'composite'];
const KEEP_GROUP: readonly CapProductKey[] = ['secondary-2', 'tertiary-1'];

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
  /** 改定後の値の出どころ。一次・二次①・複合のどれか 1 つでも定数を使っていれば 'revision' */
  afterSource: 'catalog' | 'revision';
  /** 改定の一次（CAP_REVISIONS_NOT_IN_CATALOG の先頭・常に入る。出典欄に出すのは afterSource が 'revision' のとき） */
  revision: CapRevision;
};

/**
 * 注記「ΔkW 上限価格の改定」の文が成り立つかの検査（空配列＝問題なし）。
 * capNote() は問題があれば console.warn し、scripts/verify-eprx-monthly.ts は同じ配列を WARN の一覧に積む（#119: 判定は 1 か所）。
 */
export function capNoteProblems(): string[] {
  const rev = CAP_REVISIONS_NOT_IN_CATALOG[0];
  const until = dayBefore(rev.from);
  const out: string[] = [];
  const before = GROUP.map((p) => capAt(p, until));
  const after = GROUP.map((p) => capAt(p, rev.from));
  const keepUntil = KEEP_GROUP.map((p) => capAt(p, until));
  const keepFrom = KEEP_GROUP.map((p) => capAt(p, rev.from));
  const one = (xs: (number | null)[]) => new Set(xs).size === 1 && xs[0] !== null;
  if (!one(before)) out.push(`改定前日 ${until} の上限が一次・二次①・複合で揃わない（${before.join('/')}）`);
  if (!one(after)) out.push(`改定日 ${rev.from} の上限が一次・二次①・複合で揃わない（${after.join('/')}）`);
  if (!one(keepFrom)) out.push(`改定日 ${rev.from} の上限が二次②・三次①で揃わない（${keepFrom.join('/')}）`);
  if (one(before) && one(after) && before[0] === after[0]) {
    out.push(`改定日の前後で上限が同じ（${before[0]}）＝「…まで A 円、…から B 円」の文が成り立たない`);
  }
  if (keepUntil.some((v, i) => v !== keepFrom[i])) {
    out.push(`二次②・三次①の上限が改定日の前後で変わる（${keepUntil.join('/')} → ${keepFrom.join('/')}）＝「当面継続」の文が成り立たない`);
  }
  for (const p of [...GROUP, ...KEEP_GROUP]) {
    const later = catalogPoints(p).filter((x) => x.date > rev.from);
    if (later.length > 0) {
      out.push(`${p}: カタログに改定日より後の点がある（${later.map((x) => `${x.date}=${x.value}`).join('・')}）＝注記の「当面の間」「当面継続」を見直す`);
    }
  }
  return out;
}

/**
 * /tools/balancing-revenue の注記「ΔkW 上限価格の改定」の数値（一次・二次①・複合／二次②・三次①）。
 * 改定日は CAP_REVISIONS_NOT_IN_CATALOG の先頭（カタログに入った後も日付の拠り所として残す）。
 * ★サーバ（page.tsx）で 1 回だけ呼び、props で渡す。
 */
export function capNote(): CapNote {
  const rev = CAP_REVISIONS_NOT_IN_CATALOG[0];
  const until = dayBefore(rev.from);
  for (const p of capNoteProblems()) console.warn(`[balancing-cap] WARN ${p}`);
  const afterSource = GROUP.some((p) => capTimeline(p).find((x) => x.date === rev.from)?.source === 'revision')
    ? 'revision'
    : 'catalog';
  return {
    before: (capAt('primary', until) ?? 0).toFixed(2),
    after: (capAt('primary', rev.from) ?? 0).toFixed(2),
    keep: (capAt('secondary-2', rev.from) ?? 0).toFixed(2),
    until: ymd(until),
    from: ymd(rev.from),
    afterSource,
    revision: rev,
  };
}

/**
 * 出典欄に書く上限価格の出所（カタログ notes の「出典: …（「資料名」（公表日）p.NN／…）」から・資料ごと）。
 * 例: 「2024年度の取引実績について」（2025年6月19日）p.13・p.21・p.29・p.37・p.45
 * 年度を固定せず notes に現れる資料をすべて拾う（カタログに新しい年度の資料が載れば自動で行が増える）。
 */
export function capSourceLines(): string[] {
  const docs = new Map<string, Set<number>>();
  for (const p of Object.keys(CAP) as CapProductKey[]) {
    for (const m of (CAP[p].meta.notes ?? '').matchAll(/(「[^「」]+」（[^（）「」]+）)p\.(\d+)/g)) {
      if (!docs.has(m[1])) docs.set(m[1], new Set());
      docs.get(m[1])!.add(Number(m[2]));
    }
  }
  return [...docs].map(([doc, pages]) => `${doc}p.${[...pages].sort((a, b) => a - b).join('・p.')}`);
}

/** 出典欄に書く系列の source_name（5 系列とも同一＝一次調整力から読む） */
export const CAP_SOURCE_NAME = CAP.primary.meta.source_name ?? null;
