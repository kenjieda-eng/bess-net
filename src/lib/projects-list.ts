/**
 * src/lib/projects-list.ts — 蓄電所一覧（/projects）の判定・並べ替え・URL・CSV（蓄電所一覧の検索便・2026-11-21）
 *
 * React を含まない 1 つのファイル。サーバーの page.tsx・ブラウザの ProjectsBrowser.tsx・ビルドの precompute が同じ関数を使う（#119）。
 * ★ブラウザの部品から読まれるので、microcms.ts・grid-prefecture.ts（関西・九州の対応表が付いてくる）・projects-excluded.ts・
 *   page-dates.ts を import しない（型も含めて）。import してよいのは projects-cod.ts だけ。
 * 検査: scripts/verify-projects-list.ts（npm run verify:projects-list）。
 */
import { normalizeCod } from './projects-cod';

// ───────────────────────── 行（ブラウザへ渡す軽い形） ─────────────────────────

/** ブラウザへ渡す 1 行（body・緯度経度・市場・id は渡さない） */
export type ListRow = {
  /** slug */ s: string;
  /** 名前 */ n: string;
  /** 状態（status[0]・無ければ空） */ st: string;
  /** 都道府県の欄（そのまま） */ p: string;
  /** 市町村の欄（そのまま） */ c: string;
  /** 出力 MW（欄が無ければ null） */ mw: number | null;
  /** 容量 MWh（欄が無ければ null） */ mwh: number | null;
  /** 事業者 */ op: string;
  /** EPC */ epc: string;
  /** 運転開始の欄（そのまま） */ cod: string;
  /** 出典 URL */ src: string;
  /** 公開日（publishedAt の JST の日・YYYY-MM-DD・無ければ空） */ pd: string;
  /** 更新日（revisedAt の JST の日・YYYY-MM-DD・無ければ空） */ rd: string;
};

/** サーバーの projects の 1 件（microcms.ts の Project と同じ形の一部。型も import しない＝ブラウザの部品に付いてこないように） */
export type ProjectLike = {
  slug: string; name: string; status?: string[] | null; prefecture?: string | null; city?: string | null;
  outputMw?: number | null; capacityMwh?: number | null; operator?: string | null; epc?: string | null; cod?: string | null;
  sourceUrl?: string | null; publishedAt?: string | null; revisedAt?: string | null;
};
/** 1 件 → ブラウザへ渡す軽い形。day は日付の関数（サーバーでは page-dates.ts の jstDay＝詳細ページの「公開日」「更新日」と同じ） */
export function toListRow(p: ProjectLike, day: (iso: string | null | undefined) => string | null): ListRow {
  return {
    s: p.slug,
    n: p.name,
    st: (p.status && p.status[0]) || '',
    p: p.prefecture ?? '',
    c: p.city ?? '',
    mw: p.outputMw ?? null,
    mwh: p.capacityMwh ?? null,
    op: p.operator ?? '',
    epc: p.epc ?? '',
    cod: p.cod ?? '',
    src: p.sourceUrl ?? '',
    pd: day(p.publishedAt) ?? '',
    rd: day(p.revisedAt) ?? '',
  };
}

// ───────────────────────── 状態 ─────────────────────────

/** 表の並び（今の /projects と同じ）。この外の状態は、出てきた順で後ろに並ぶ */
export const STATUS_ORDER = ['稼働中', '建設中', '接続検討中', '計画中', '廃止'] as const;
/** 状態 ↔ URL の鍵・h2 の id（id は `status-` ＋鍵） */
const STATUS_KEY: Record<string, string> = {
  稼働中: 'operating', 建設中: 'construction', 接続検討中: 'grid-study', 計画中: 'planned', 廃止: 'retired', その他: 'other',
};
/** 行の状態の表示名（状態が空なら「その他」） */
export const statusLabel = (st: string | null | undefined): string => st || 'その他';
/** 状態の URL の鍵。知らない状態は、表の並びの番号（1 始まり） */
export function statusKey(label: string, index: number): string {
  return STATUS_KEY[label] ?? String(index + 1);
}
/** 表の見出し（h2）の id */
export const statusAnchor = (label: string, index: number): string => `status-${statusKey(label, index)}`;

/** 状態ごとにまとめる（サーバーで使う。状態の中の並びは「調査中」を最後・出力の大きい順＝今の /projects と同じ） */
export function groupByStatus<T extends { status?: string[] | null; outputMw?: number | null; capacityMwh?: number | null }>(items: T[]): Array<{ status: string; items: T[] }> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const status = (item.status && item.status[0]) || 'その他';
    (groups[status] ??= []).push(item);
  }
  for (const s of Object.keys(groups)) {
    groups[s] = [...groups[s]].sort((a, b) => {
      const ai = isInvestigating(a.outputMw, a.capacityMwh) ? 1 : 0;
      const bi = isInvestigating(b.outputMw, b.capacityMwh) ? 1 : 0;
      if (ai !== bi) return ai - bi;
      return (b.outputMw ?? 0) - (a.outputMw ?? 0);
    });
  }
  const ordered: Array<{ status: string; items: T[] }> = [];
  for (const s of STATUS_ORDER) {
    if (groups[s]) { ordered.push({ status: s, items: groups[s] }); delete groups[s]; }
  }
  for (const s of Object.keys(groups)) ordered.push({ status: s, items: groups[s] });
  return ordered;
}

/** 渡された行（サーバーの並び）を、状態ごとのかたまりに戻す（並べ直さない） */
export function groupRows(rows: ListRow[]): Array<{ status: string; key: string; rows: ListRow[] }> {
  const out: Array<{ status: string; key: string; rows: ListRow[] }> = [];
  for (const r of rows) {
    const label = statusLabel(r.st);
    let g = out.find((x) => x.status === label);
    if (!g) { g = { status: label, key: '', rows: [] }; out.push(g); }
    g.rows.push(r);
  }
  out.forEach((g, i) => { g.key = statusKey(g.status, i); });
  return out;
}

// ───────────────────────── 調査中・合計・数字 ─────────────────────────

/** 調査中＝出力が 0 か容量が 0（今の /projects・projects-maintenance と同じ式） */
export function isInvestigating(mw: number | null | undefined, mwh: number | null | undefined): boolean {
  return mw === 0 || mwh === 0;
}
/** 合計（0 と空は数えない） */
export function sumReliable(values: Array<number | null | undefined>): number {
  return values.reduce<number>((s, v) => (v != null && v > 0 ? s + v : s), 0);
}
export function reliableCount(values: Array<number | null | undefined>): number {
  return values.filter((v) => v != null && (v as number) > 0).length;
}
/** 合計の表示（小数 1 桁・ロケール固定） */
export function fmtTotal(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
/** 表の出力・容量の欄（空は「—」・0 は「調査中」・ロケール固定＝初めの HTML とブラウザで同じ文字） */
export function fmtMW(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n === 0) return '調査中';
  return `${n.toLocaleString('en-US')} MW`;
}
export function fmtMWh(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n === 0) return '調査中';
  return `${n.toLocaleString('en-US')} MWh`;
}
/** YYYY-MM-DD → 「2026年11月15日」（page-dates.ts の jaDayLabel と同じ書き方。ブラウザから page-dates を読まないため複製） */
export function jaDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

// ───────────────────────── 都道府県・地方 ─────────────────────────

/** 47 都道府県（JIS の並び。grid-prefecture.ts の REAL_PREFECTURES と同じ集合・同じ順＝verify で比べる） */
export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;
const PREF_SET: ReadonlySet<string> = new Set(PREFECTURES);
/** 都道府県の決め方: 欄（前後の空白を除く）が 47 都道府県の名前とぴったり同じときだけその県。ほかは null（所在地が未記載・確認中） */
export function prefOf(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  return PREF_SET.has(s) ? s : null;
}

/** 一般の 8 地方区分（電力エリアではない） */
export const REGIONS: ReadonlyArray<{ key: string; label: string; prefs: readonly string[] }> = [
  { key: 'hokkaido', label: '北海道', prefs: ['北海道'] },
  { key: 'tohoku', label: '東北', prefs: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { key: 'kanto', label: '関東', prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  { key: 'chubu', label: '中部', prefs: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'] },
  { key: 'kinki', label: '近畿', prefs: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { key: 'chugoku', label: '中国', prefs: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
  { key: 'shikoku', label: '四国', prefs: ['徳島県', '香川県', '愛媛県', '高知県'] },
  { key: 'kyushu', label: '九州・沖縄', prefs: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] },
];

// ───────────────────────── 出力の帯・運転開始 ─────────────────────────

export const MW_BANDS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'le2', label: '2MW 以下' },
  { key: '2-10', label: '2〜10MW' },
  { key: '10-50', label: '10〜50MW' },
  { key: 'ge50', label: '50MW 以上' },
  { key: 'na', label: '未確認' },
];
/** 出力の帯: 0 < MW ≤ 2／2 < MW < 10／10 ≤ MW < 50／50 ≤ MW／空か 0 */
export function mwBand(mw: number | null | undefined): string {
  if (mw == null || mw <= 0) return 'na';
  if (mw <= 2) return 'le2';
  if (mw < 10) return '2-10';
  if (mw < 50) return '10-50';
  return 'ge50';
}
/** 運転開始の年: 欄の先頭の 4 桁（「2027年度（予定）」「2027年（予定）」は 2027）。無ければ null */
export function codYear(cod: string | null | undefined): number | null {
  const m = /^(\d{4})/.exec((cod ?? '').trim());
  return m ? Number(m[1]) : null;
}
/** 運転開始の並べ替えの鍵（YYYY-MM-DD）。normalizeCod（月だけは月末・年度は翌年 3/31）を使い、
 *  それが読めない年だけの書き方（「2028年（予定）」）は 12/31。読めないもの・空は null。normalizeCod そのものは変えない */
export function codSortKey(cod: string | null | undefined): string | null {
  const n = normalizeCod(cod);
  if (n) return n;
  const m = /^(\d{4})年/.exec((cod ?? '').trim());
  return m ? `${m[1]}-12-31` : null;
}

// ───────────────────────── 絞り込み・並べ替えの状態と URL ─────────────────────────

export const SORTS: ReadonlyArray<{ key: string; label: string }> = [
  { key: '', label: '状態ごと（初めの並び）' },
  { key: 'mw', label: '出力の大きい順' },
  { key: 'mwh', label: '容量の大きい順' },
  { key: 'cod-desc', label: '運転開始の新しい順' },
  { key: 'cod-asc', label: '運転開始の古い順' },
  { key: 'new', label: '新しく載った順' },
];
export const INV_OPTIONS: ReadonlyArray<{ key: string; label: string }> = [
  { key: '', label: '調査中を含む' },
  { key: 'exclude', label: '調査中を除く' },
  { key: 'only', label: '調査中だけ' },
];

export type ListState = {
  q: string;
  /** 都道府県の名前・'none'（所在地が未記載・確認中）・'' */
  pref: string;
  /** 地方の鍵・''（pref があるときは使わない） */
  region: string;
  /** 状態の鍵（表の並び） */
  status: string[];
  /** 出力の帯の鍵（MW_BANDS の並び） */
  mw: string[];
  /** 4 桁の年・'none'・'' */
  year: string;
  /** 'exclude' | 'only' | '' */
  inv: string;
  /** SORTS の鍵（'' は初めの並び） */
  sort: string;
};
export const EMPTY_STATE: ListState = { q: '', pref: '', region: '', status: [], mw: [], year: '', inv: '', sort: '' };

/** 条件か並べ替えを 1 つでも選んでいるか */
export function isActive(s: ListState): boolean {
  return countConditions(s) > 0;
}
/** 選んでいる条件の数（並べ替えも 1 つに数える） */
export function countConditions(s: ListState): number {
  return (s.q.trim() ? 1 : 0) + (s.pref || s.region ? 1 : 0) + (s.status.length ? 1 : 0) + (s.mw.length ? 1 : 0) + (s.year ? 1 : 0) + (s.inv ? 1 : 0) + (s.sort ? 1 : 0);
}

/** URL の検索部分 → 状態。知らない鍵と値は捨てる。例外を出さない。statusKeys は今の表の状態の鍵（並び順）・years はデータにある年（渡せばその外の年は捨てる） */
export function parseState(search: string, statusKeys: readonly string[], years?: readonly string[]): ListState {
  const s: ListState = { ...EMPTY_STATE, status: [], mw: [] };
  let sp: URLSearchParams;
  try { sp = new URLSearchParams(search); } catch { return s; }
  const get = (k: string) => { try { return sp.get(k) ?? ''; } catch { return ''; } };
  const q = get('q').slice(0, 100);
  if (q.trim()) s.q = q;
  const pref = get('pref');
  if (pref === 'none' || PREF_SET.has(pref)) s.pref = pref;
  const region = get('region');
  if (!s.pref && REGIONS.some((r) => r.key === region)) s.region = region;
  const status = get('status').split(',').filter(Boolean);
  s.status = statusKeys.filter((k) => status.includes(k));
  const mw = get('mw').split(',').filter(Boolean);
  s.mw = MW_BANDS.map((b) => b.key).filter((k) => mw.includes(k));
  const year = get('year');
  if (year === 'none' || (/^\d{4}$/.test(year) && (!years || years.includes(year)))) s.year = year;
  const inv = get('inv');
  if (inv === 'exclude' || inv === 'only') s.inv = inv;
  const sort = get('sort');
  if (SORTS.some((x) => x.key === sort && x.key !== '')) s.sort = sort;
  return s;
}
/** 状態 → URL の検索部分（初めの値は書かない・鍵の並びは固定）。先頭の「?」は付けない。
 *  値は encodeURIComponent（区切りのカンマだけはそのまま＝`status=operating,planned`。読むのは URLSearchParams） */
export function serializeState(s: ListState): string {
  const parts: Array<[string, string]> = [];
  if (s.q.trim()) parts.push(['q', s.q.slice(0, 100)]);
  if (s.pref) parts.push(['pref', s.pref]);
  else if (s.region) parts.push(['region', s.region]);
  if (s.status.length) parts.push(['status', s.status.join(',')]);
  if (s.mw.length) parts.push(['mw', s.mw.join(',')]);
  if (s.year) parts.push(['year', s.year]);
  if (s.inv) parts.push(['inv', s.inv]);
  if (s.sort) parts.push(['sort', s.sort]);
  return parts.map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%2C/g, ',')}`).join('&');
}

// ───────────────────────── キーワード・絞り込み・並べ替え ─────────────────────────

const norm = (v: string) => v.normalize('NFKC').toLowerCase();
/** キーワードを空白で区切る（NFKC・小文字） */
export function tokens(q: string): string[] {
  return norm(q).split(/\s+/).filter(Boolean);
}
/** キーワードの当たり: 名前・事業者・EPC・都道府県・市町村（本文・slug には当てない）。空白区切りは AND。
 *  epcOnly＝どれかの語が EPC にだけ当たった（事業者の欄の下に「EPC: …」を出す） */
export function matchKeyword(r: ListRow, ts: string[]): { hit: boolean; epcOnly: boolean } {
  if (ts.length === 0) return { hit: true, epcOnly: false };
  const base = norm([r.n, r.op, r.p, r.c].join(' '));
  const epc = norm(r.epc);
  let epcOnly = false;
  for (const t of ts) {
    if (base.includes(t)) continue;
    if (epc.includes(t)) { epcOnly = true; continue; }
    return { hit: false, epcOnly: false };
  }
  return { hit: true, epcOnly };
}

/** 絞り込み（並びは渡した順のまま） */
export function filterRows(rows: ListRow[], s: ListState, statusKeyOf: (r: ListRow) => string): ListRow[] {
  const ts = tokens(s.q);
  const region = REGIONS.find((x) => x.key === s.region);
  return rows.filter((r) => {
    if (!matchKeyword(r, ts).hit) return false;
    const p = prefOf(r.p);
    if (s.pref === 'none' ? p !== null : s.pref ? p !== s.pref : region ? !(p && region.prefs.includes(p)) : false) return false;
    if (s.status.length && !s.status.includes(statusKeyOf(r))) return false;
    if (s.mw.length && !s.mw.includes(mwBand(r.mw))) return false;
    if (s.year) {
      const y = codYear(r.cod);
      if (s.year === 'none' ? y !== null : y !== Number(s.year)) return false;
    }
    const inv = isInvestigating(r.mw, r.mwh);
    if (s.inv === 'exclude' && inv) return false;
    if (s.inv === 'only' && !inv) return false;
    return true;
  });
}

/** 同着は 名前 → slug（#124） */
function tie(a: ListRow, b: ListRow): number {
  return a.n.localeCompare(b.n, 'ja') || (a.s < b.s ? -1 : a.s > b.s ? 1 : 0);
}
/** 並べ替え。'' は渡した順のまま（サーバーの並び）。空と 0 は、どの向きでも最後 */
export function sortRows(rows: ListRow[], sort: string): ListRow[] {
  if (!sort) return rows;
  const desc = (key: (r: ListRow) => number | null) => (a: ListRow, b: ListRow) => {
    const x = key(a), y = key(b);
    const xn = x == null || x <= 0, yn = y == null || y <= 0;
    if (xn !== yn) return xn ? 1 : -1;
    if (!xn && !yn && x !== y) return (y as number) - (x as number);
    return tie(a, b);
  };
  const byStr = (key: (r: ListRow) => string | null, dir: 1 | -1) => (a: ListRow, b: ListRow) => {
    const x = key(a), y = key(b);
    if (!x !== !y) return !x ? 1 : -1;
    if (x && y && x !== y) return (x < y ? -1 : 1) * dir;
    return tie(a, b);
  };
  const cmp = sort === 'mw' ? desc((r) => r.mw)
    : sort === 'mwh' ? desc((r) => r.mwh)
      : sort === 'cod-desc' ? byStr((r) => codSortKey(r.cod), -1)
        : sort === 'cod-asc' ? byStr((r) => codSortKey(r.cod), 1)
          : sort === 'new' ? byStr((r) => r.pd || null, -1)
            : null;
  return cmp ? [...rows].sort(cmp) : rows;
}

// ───────────────────────── CSV ─────────────────────────

export const CSV_HEADER = '蓄電所名,状態,都道府県,市町村,出力(MW),容量(MWh),事業者,EPC,運転開始,出典URL,詳細ページURL,公開日,更新日';
export const CSV_NOTE =
  '注意: 各社の発表などの公開情報にもとづく一覧です。最新の情報は事業者の公式の発表でご確認ください。出力・容量の空欄は未確認です。再配布は事前に運営元の許諾を得てください。商業目的でのご利用はお問い合わせください（利用規約 https://bess-net.jp/terms）。';

/** 文字の欄: `"` で囲み中の `"` を 2 つに。先頭が = + - @ なら頭に `'`（表計算ソフトが式として読まないように） */
export function csvText(v: string | null | undefined): string {
  let s = v ?? '';
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
/** 数字の欄: 単位・桁区切りなし。空と 0 は空欄 */
export function csvNum(v: number | null | undefined): string {
  return v != null && v > 0 ? String(v) : '';
}
/** 選んだ条件の説明（CSV の 3 行目） */
export function describeState(s: ListState, statusLabelOf: (key: string) => string): string[] {
  const out: string[] = [];
  if (s.q.trim()) out.push(`キーワード=${s.q.trim()}`);
  if (s.pref) out.push(`地域=${s.pref === 'none' ? '所在地が未記載・確認中' : s.pref}`);
  else if (s.region) out.push(`地域=${REGIONS.find((r) => r.key === s.region)?.label ?? ''} 全体`);
  if (s.status.length) out.push(`状態=${s.status.map(statusLabelOf).join('・')}`);
  if (s.mw.length) out.push(`出力=${s.mw.map((k) => MW_BANDS.find((b) => b.key === k)?.label ?? k).join('・')}`);
  if (s.year) out.push(`運転開始の年=${s.year === 'none' ? '記載なし' : s.year}`);
  if (s.inv) out.push(`調査中=${s.inv === 'exclude' ? '除く' : 'だけ'}`);
  if (s.sort) out.push(`並べ替え=${SORTS.find((x) => x.key === s.sort)?.label ?? s.sort}`);
  return out;
}
/** CSV の文字列（BOM なし・CRLF。BOM はダウンロードのときに付ける）。stamp は「YYYY-MM-DD HH:MM」 */
export function buildCsv(rows: ListRow[], s: ListState, total: number, stamp: string, statusLabelOf: (key: string) => string, codText: (r: ListRow) => string): string {
  const conds = describeState(s, statusLabelOf);
  // 1〜3 行目も " で囲む（キーワードに , や " があっても 3 行目が割れない。小さな直し便 ②・2026-11-22）。運転開始は cod が空の行では空欄（画面の表の「—」は変えない・①）
  const lines = [
    csvText(`出典: 蓄電所ネット bess-net.jp（取得日時: ${stamp}）`),
    csvText(CSV_NOTE),
    csvText(conds.length ? `条件: ${conds.join('／')}（該当 ${rows.length} 件）` : `条件: なし（全 ${total} 件）`),
    CSV_HEADER,
    ...rows.map((r) => [
      csvText(r.n), csvText(statusLabel(r.st)), csvText(r.p), csvText(r.c), csvNum(r.mw), csvNum(r.mwh), csvText(r.op), csvText(r.epc),
      csvText(r.cod.trim() ? codText(r) : ''), csvText(r.src), csvText(`https://bess-net.jp/projects/${r.s}`), csvText(r.pd), csvText(r.rd),
    ].join(',')),
  ];
  return lines.join('\r\n') + '\r\n';
}
/** JST の「YYYY-MM-DD HH:MM」と「YYYYMMDD」 */
export function jstStamp(now: Date = new Date()): { stamp: string; ymd: string } {
  const j = new Date(now.getTime() + 9 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  const ymd = `${j.getUTCFullYear()}${p(j.getUTCMonth() + 1)}${p(j.getUTCDate())}`;
  return { stamp: `${j.getUTCFullYear()}-${p(j.getUTCMonth() + 1)}-${p(j.getUTCDate())} ${p(j.getUTCHours())}:${p(j.getUTCMinutes())}`, ymd };
}
