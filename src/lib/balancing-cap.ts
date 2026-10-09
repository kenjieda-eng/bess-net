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

/** カタログの点（値が null の点は捨てる＝capNoteProblems が別に知らせる） */
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

/** 上限価格の区間（同じ値が続く間を 1 つにまとめ、同じ値・同じ期間の商品を束ねたもの）。T4 レンダー視点便 */
export type CapSegment = { value: number; from: string; to: string | null; products: CapProductKey[] };

/**
 * 上限価格の区間の一覧（/tools/irr-simulator の上限価格シナリオのボタン・値と適用期間はここから＝焼き込まない）。
 * capTimeline の点を、値が変わらない間はまとめ（FY2025 の 4/1 に同じ値を置き直す点は区切りにしない）、
 * 次に値が変わる日の前日を適用の最終日にする（最後の区間は null＝継続中）。今のデータでは 4 区間
 * （19.51・15.00・10.00＝一次・二次①・複合／7.21＝二次②・三次①）。
 */
export function capSegments(): CapSegment[] {
  const byKey = new Map<string, CapSegment>();
  for (const p of CAP_PRODUCT_KEYS) {
    const tl = capTimeline(p);
    const runs: { value: number; from: string }[] = [];
    for (const pt of tl) if (runs.length === 0 || runs[runs.length - 1].value !== pt.value) runs.push({ value: pt.value, from: pt.date });
    runs.forEach((run, i) => {
      const to = i + 1 < runs.length ? dayBefore(runs[i + 1].from) : null;
      const key = `${run.value}|${run.from}|${to ?? ''}`;
      const seg = byKey.get(key);
      if (seg) seg.products.push(p);
      else byKey.set(key, { value: run.value, from: run.from, to, products: [p] });
    });
  }
  // 並びは値の大きい順（便の 19.51／15.00／10.00／7.21）。同じ値は適用開始の早い順
  return [...byKey.values()].sort((a, b) => b.value - a.value || (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
}

/** その月の上限（月初・月末・月内の改定日・日数加重）。T1 実装便（/tools/balancing-benchmark・裁定 R4） */
export type MonthCapValue = { start: number; end: number; changedOn: string | null; effective: number; changeCount: number };

/**
 * 年月（YYYY-MM）の上限。月内に改定がある月（例: 2026-03 は 3/14 に 19.51→15.00）は、上限比の分母に日数加重
 * （(13×19.51＋18×15.00)/31＝16.8913）を使う＝コマごとの約定量はこのツールでは使わないので日数での近似。
 * どの日も上限が無ければ（三次②・範囲外）null。
 */
export function capForMonth(product: CapProductKey, ym: string): MonthCapValue | null {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const values: number[] = [];
  let changedOn: string | null = null;
  let changeCount = 0;
  for (let d = 1; d <= days; d++) {
    const date = `${ym}-${String(d).padStart(2, '0')}`;
    const v = capAt(product, date);
    if (v === null) return null;
    if (values.length > 0 && v !== values[values.length - 1]) {
      changeCount++;
      if (changedOn === null) changedOn = date;
    }
    values.push(v);
  }
  return {
    start: values[0],
    end: values[values.length - 1],
    changedOn,
    changeCount,
    // 改定の無い月はその値そのもの（同じ値を足して割ると浮動小数で 19.51 が 19.509999… になる）
    effective: changedOn === null ? values[0] : values.reduce((a, b) => a + b, 0) / values.length,
  };
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
  /** 改定の一次（CAP_REVISIONS_NOT_IN_CATALOG の先頭・常に入る。出典欄に出すかは revisionCitation） */
  revision: CapRevision;
  /**
   * 出典欄に改定の一次（EPRX 公表）を併記するか。
   *   'not-in-catalog' … カタログに改定日の点が無い（定数で補っている）
   *   'catalog-without-source' … カタログに改定日の点はあるが、系列の notes にその出所の記載が無い（2026-10-08 に実際に起きた:
   *      点だけ 2026-09-01=10 が入り、notes・coverage は 3 点のまま）。出所を書かないと 10.00 の根拠が出典欄から消えるので一次を併記する
   *   null … カタログの notes がこの点の出所を書いている＝カタログの出典行で足りる
   */
  revisionCitation: 'not-in-catalog' | 'catalog-without-source' | null;
};

/** 一次・二次①・複合の上限 notes が、改定日の点の出所を書いているか（改定日か資料名が notes に現れるか） */
function capNotesCoverRevision(rev: CapRevision): boolean {
  const jp = `${Number(rev.from.slice(0, 4))}年${Number(rev.from.slice(5, 7))}月${Number(rev.from.slice(8, 10))}日`;
  return GROUP.every((p) => {
    const n = CAP[p].meta.notes ?? '';
    return n.includes(rev.from) || n.includes(jp) || n.includes(rev.sourceTitle);
  });
}

/**
 * 注記「ΔkW 上限価格の改定」の文が成り立つかの検査（空配列＝問題なし）。
 * capNote() は問題があれば console.warn し、scripts/verify-eprx-monthly.ts は同じ配列を WARN の一覧に積む（#119: 判定は 1 か所）。
 * 注記は「引下げ」を前提にした固定の文（「引下げ前の実績」「新上限以下に読み替えて」）と並ぶので、向きも見る。
 */
export function capNoteProblems(): string[] {
  const rev = CAP_REVISIONS_NOT_IN_CATALOG[0];
  const until = dayBefore(rev.from);
  const out: string[] = [];
  const before = GROUP.map((p) => capAt(p, until));
  const after = GROUP.map((p) => capAt(p, rev.from));
  const keepUntil = KEEP_GROUP.map((p) => capAt(p, until));
  const keepFrom = KEEP_GROUP.map((p) => capAt(p, rev.from));
  const show = (xs: (number | null)[]) => xs.map((v) => v ?? 'null').join('/');
  const one = (xs: (number | null)[]) => new Set(xs).size === 1 && xs[0] !== null;
  if (!one(before)) out.push(`改定前日 ${until} の上限が一次・二次①・複合で揃わない（${show(before)}）`);
  if (!one(after)) out.push(`改定日 ${rev.from} の上限が一次・二次①・複合で揃わない（${show(after)}）`);
  if (!one(keepFrom)) out.push(`改定日 ${rev.from} の上限が二次②・三次①で揃わない（${show(keepFrom)}）`);
  if (one(before) && one(after) && (after[0] as number) >= (before[0] as number)) {
    out.push(`改定後の上限（${after[0]}）が改定前（${before[0]}）以上＝注記の「…まで A 円、…から B 円」と「引下げ前の実績」の文が成り立たない`);
  }
  if (keepUntil.some((v, i) => v !== keepFrom[i])) {
    out.push(`二次②・三次①の上限が改定日の前後で変わる（${show(keepUntil)} → ${show(keepFrom)}）＝「当面継続」の文が成り立たない`);
  }
  // カタログが改定日の点を持つなら、その値が EPRX 公表の値（定数の value）と同じか。違えば出典文の一次と値が合わない
  //（capNoteValues は一致するときだけ一次を併記する）
  for (const p of GROUP) {
    const fromCatalog = capTimeline(p).find((x) => x.date === rev.from && x.source === 'catalog');
    if (fromCatalog && fromCatalog.value !== rev.value) {
      out.push(`${p}: カタログの ${rev.from} の上限 ${fromCatalog.value} が、EPRX ${rev.publishedOn} 公表の値 ${rev.value} と違う＝出典の一次を併記できない（値か定数を確かめる）`);
    }
  }
  for (const p of [...GROUP, ...KEEP_GROUP]) {
    const raw = CAP[p]?.points ?? [];
    const nulls = raw.filter((x) => typeof x.value !== 'number');
    if (nulls.length > 0) {
      out.push(`${p}: カタログに値が null の点がある（${nulls.map((x) => x.date.slice(0, 10)).join('・')}）＝無視して直前の点か改定の定数を使っている`);
    }
    const byDate = new Map<string, Set<number>>();
    for (const x of catalogPoints(p)) {
      if (!byDate.has(x.date)) byDate.set(x.date, new Set());
      byDate.get(x.date)!.add(x.value);
    }
    for (const [d, vs] of byDate) if (vs.size > 1) out.push(`${p}: カタログの ${d} に値の違う点が ${vs.size} つある（${[...vs].join('/')}）`);
    // 改定日より後に「値が変わる」点があれば、注記の「当面の間」「当面継続」を見直す合図（年度初めに同じ値を置き直すだけの点では鳴らさない）
    const atRev = capAt(p, rev.from);
    const later = catalogPoints(p).filter((x) => x.date > rev.from && x.value !== atRev);
    if (later.length > 0) {
      out.push(`${p}: 改定日より後に上限が変わる点がある（${later.map((x) => `${x.date}=${x.value}`).join('・')}）＝注記の「当面の間」「当面継続」を見直す`);
    }
  }
  return out;
}

/**
 * /tools/balancing-revenue の注記「ΔkW 上限価格の改定」の数値（一次・二次①・複合／二次②・三次①）。WARN を出さない純粋な計算。
 * 改定日は CAP_REVISIONS_NOT_IN_CATALOG の先頭（カタログに入った後も日付の拠り所として残す）。
 * ★値は一次調整力（継続側は二次調整力②）から採る。商品間で食い違ったときも表示は止めず、capNoteProblems の WARN で知らせる
 *   （月次の幅のような自動の縮退は持たない: 縮退先の「正しい値」がこのファイルの中に無い＝カタログか EPRX の一次を人が確かめる。
 *    ビルドを止めると webhook の再ビルドまで全部止まるので、verify と同じく警告に留める）。
 */
export function capNoteValues(): CapNote {
  const rev = CAP_REVISIONS_NOT_IN_CATALOG[0];
  const until = dayBefore(rev.from);
  const afterSource = GROUP.some((p) => capTimeline(p).find((x) => x.date === rev.from)?.source === 'revision')
    ? 'revision'
    : 'catalog';
  // カタログの改定日の値が EPRX 公表の値と同じときだけ、その一次を併記する（違えば capNoteProblems が WARN）
  const catalogMatchesRevision = GROUP.every((p) => capAt(p, rev.from) === rev.value);
  return {
    before: (capAt('primary', until) ?? 0).toFixed(2),
    after: (capAt('primary', rev.from) ?? 0).toFixed(2),
    keep: (capAt('secondary-2', rev.from) ?? 0).toFixed(2),
    until: ymd(until),
    from: ymd(rev.from),
    afterSource,
    revision: rev,
    revisionCitation:
      afterSource === 'revision'
        ? 'not-in-catalog'
        : capNotesCoverRevision(rev) || !catalogMatchesRevision
          ? null
          : 'catalog-without-source',
  };
}

const jaDate = (iso: string) => `${Number(iso.slice(0, 4))}年${Number(iso.slice(5, 7))}月${Number(iso.slice(8, 10))}日`;

/**
 * 出典欄で上限価格表の後ろに続ける「と、…からの改定（EPRX 公表…）」の部分（revisionCitation が null なら空文字）。
 * /tools/balancing-revenue と /tools/balancing-benchmark が同じ文を使う（#119）。範囲で出すかどうかは呼び出し側が決める。
 */
export function capRevisionCitationText(note: CapNote): string {
  if (note.revisionCitation === null) return '';
  const r = note.revision;
  const head = `${note.revisionCitation === 'not-in-catalog' ? 'カタログ未収載の ' : ''}${jaDate(r.from)}実需給分からの改定`;
  const tail =
    note.revisionCitation === 'catalog-without-source'
      ? '。カタログの上限価格系列はこの日からの値を持つが、その出所の記載が無いため EPRX の公表資料を併記'
      : '';
  return `と、${head}（${r.publisher}${jaDate(r.publishedOn)}公表「${r.sourceTitle}」${tail}）`;
}

/**
 * capNoteValues() に、問題があればビルドのログへの WARN を足したもの。
 * ★サーバ（page.tsx）で 1 回だけ呼び、props で渡す。scripts/verify-eprx-monthly.ts は capNoteValues と capNoteProblems を別々に呼ぶ（WARN を二重に出さない）。
 */
export function capNote(): CapNote {
  for (const p of capNoteProblems()) console.warn(`[balancing-cap] WARN ${p}`);
  return capNoteValues();
}

/** 上限価格の商品 */
export const CAP_PRODUCT_KEYS = Object.keys(CAP) as CapProductKey[];

/**
 * 商品の上限価格 notes の「出典: …（「資料名」（公表日）p.NN／…）」から、資料とページを読む（notes に現れる順）。
 * 例: [{ doc: '「2024年度の取引実績について」（2025年6月19日）', page: 13 }, …]
 */
export function capSourcesOf(product: CapProductKey): { doc: string; page: number }[] {
  return [...(CAP[product]?.meta.notes ?? '').matchAll(/(「[^「」]+」（[^（）「」]+）)p\.(\d+)/g)].map((m) => ({ doc: m[1], page: Number(m[2]) }));
}

/**
 * 出典欄に書く上限価格の出所（資料ごとに全商品のページをまとめる）。
 * 例: 「2024年度の取引実績について」（2025年6月19日）p.13・p.21・p.29・p.37・p.45
 * 年度を固定せず notes に現れる資料をすべて拾う（カタログに新しい年度の資料が載れば自動で行が増える）。
 */
export function capSourceLines(): string[] {
  const docs = new Map<string, Set<number>>();
  for (const p of CAP_PRODUCT_KEYS) {
    for (const { doc, page } of capSourcesOf(p)) {
      if (!docs.has(doc)) docs.set(doc, new Set());
      docs.get(doc)!.add(page);
    }
  }
  return [...docs].map(([doc, pages]) => `${doc}p.${[...pages].sort((a, b) => a - b).join('・p.')}`);
}

/** 出典欄に書く系列の source_name（5 系列とも同一＝一次調整力から読む） */
export const CAP_SOURCE_NAME = CAP.primary.meta.source_name ?? null;
