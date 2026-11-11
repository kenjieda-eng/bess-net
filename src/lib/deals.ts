/**
 * src/lib/deals.ts — 蓄電所の売買・出資 公表事例（/tracker/deals）の型と表示用の純関数（売買事例の一覧便・2026-11-10）
 *
 * - 真実源は src/data/deals.json（corrections.json 型・直接足していく）。初版は研究便
 *   reports/deals-research-2026-10-20.data.json の rows を、ユウの裁定（原則 R1〜R15・81 行の判定）で 1 回だけ変換した。
 * - 並び・ラベル・絞り込み・見出しの組み立ては、画面・JSON-LD・scripts/verify-deals.ts が同じこの関数を使う（#119・#124）。
 * - 当サイトは仲介しない・評価しない。見出しは欄から組み立てる中立の文で、一次の題名は出典の欄に逐語で載せる。
 */
import dealsFile from '@/data/deals.json';
import { AREA_LABEL, AREA_ORDER, type AreaKey } from '@/lib/pref-area';

/** 種類は 5 つ（裁定 R9: 「成約の支援」は作らない）。定義の順＝表示の順 */
export type DealKind = 'acquisition' | 'transfer' | 'investment' | 'fund' | 'site-rights';
/** 段階は発表の時点（一次の語だけ・裁定 R5）。/projects の status（いまの値）とは別物で、同期しない */
export type DealStage = 'operating' | 'construction' | 'development' | 'site-rights' | 'unknown';
export type DealMark = 'overseas' | 'lv-lots' | 'co-located';
export type DealArea = AreaKey | 'overseas' | 'unknown';

export interface DealQuote {
  /** どの欄の根拠か。key は研究便が一次から抜き出した要の欄の逐語（公表日・種類・段階・場所・規模・当事者・価格の根拠をまとめたもの） */
  field: 'key' | 'announcedOn' | 'kind' | 'stage' | 'place' | 'scale' | 'parties' | 'price' | 'note';
  where: string;
  text: string;
}
export interface DealSource {
  /** 一次の題名（<title> か PDF の表題の逐語） */
  title: string;
  /** 画面に出す題名（題名の中の利回りの表示「【…】」を 1 か所省いたもの）。無ければ title をそのまま出す。データの title は逐語のまま持つ（2026-11-11 直し便） */
  displayTitle?: string;
  publisher: string;
  url: string;
  type: 'press' | 'prtimes' | 'disclosure' | 'securities-report' | 'other';
  /** 行の出典（最初に取引を公表した一次）か、関連の発表か（裁定 R7） */
  role: 'primary' | 'related';
  publishedOn: string | null;
  modifiedOn: string | null;
  /** 取得日（YYYY-MM-DD・JST） */
  fetchedOn: string;
  /** 取得した本文の sha256。研究便（2026-10-17〜20）の取得では記録していないので null（この便で取り直した一次だけ値がある） */
  sha256: string | null;
  quotes: DealQuote[];
}
export interface Deal {
  /** 'D-YYYYMMDD-NN'（公表日と連番・振り直さない） */
  id: string;
  /** 公表日（行の出典の一次の日付） */
  announcedOn: string;
  publisher: string;
  kinds: DealKind[];
  stages: DealStage[];
  places: { text: string; pref: string; city: string }[];
  /** 一次 > 共通ヘルパ（県） > 手で（エリアが分かれる県） */
  areas: DealArea[];
  scale: string;
  parties: string[];
  price: { label: string; text: string } | null;
  marks: DealMark[];
  newsSlug: string | null;
  projectSlugs: string[];
  sources: DealSource[];
  /** 当サイトの補足（〔〕で表示）。無ければ '' */
  note: string;
  /** 供給エリアが分かれる県（pref-area.ts の SPLIT_PREFS）の areas の決め方（内部用・画面に出さない）。無ければ '' */
  areaBasis: string;
  /** 研究便の行番号（内部用・画面に出さない） */
  researchCids: string[];
}
export interface DealsFile {
  _comment: string;
  /** 一次を確かめた日の範囲（ページの出典の節に出す） */
  checked: { from: string; to: string };
  /** 取りこぼしを探したニュースの窓の終わり（次の月次はこの翌日から） */
  newsCheckedThrough: string;
  items: Deal[];
}

export const DEALS_FILE = dealsFile as unknown as DealsFile;

export const KIND_ORDER: readonly DealKind[] = ['acquisition', 'transfer', 'investment', 'fund', 'site-rights'];
export const KIND_LABEL: Record<DealKind, string> = {
  acquisition: '取得',
  transfer: '譲渡',
  investment: '出資・参画',
  fund: 'ファンドの組成',
  'site-rights': '接続権・用地の取得',
};
export const STAGE_ORDER: readonly DealStage[] = ['operating', 'construction', 'development', 'site-rights', 'unknown'];
export const STAGE_LABEL: Record<DealStage, string> = {
  operating: '稼働中',
  construction: '建設中',
  development: '開発中',
  'site-rights': '用地・接続権',
  unknown: '不明',
};
export const MARK_ORDER: readonly DealMark[] = ['overseas', 'lv-lots', 'co-located'];
export const MARK_LABEL: Record<DealMark, string> = {
  overseas: '海外',
  'lv-lots': '低圧の区画販売',
  'co-located': '併設',
};
export const DEAL_AREA_ORDER: readonly DealArea[] = [...AREA_ORDER, 'overseas', 'unknown'];
export const DEAL_AREA_LABEL: Record<DealArea, string> = { ...AREA_LABEL, overseas: '海外', unknown: '不明' };

/** 種類を定義の順に「／」でつなぐ（「出資・参画」の「・」と区別する） */
export function kindsLabel(kinds: readonly DealKind[]): string {
  return KIND_ORDER.filter((k) => kinds.includes(k)).map((k) => KIND_LABEL[k]).join('／');
}

/** 「2026年9月24日」 */
export function dealDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

/** 並び（#124: 決定的なタイブレーク）: 公表日の降順 → 発表者（ja）→ id */
export function compareDealsForDisplay(a: Deal, b: Deal): number {
  if (a.announcedOn !== b.announcedOn) return a.announcedOn < b.announcedOn ? 1 : -1;
  const p = a.publisher.localeCompare(b.publisher, 'ja');
  if (p !== 0) return p;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function sortDeals(items: readonly Deal[]): Deal[] {
  return [...items].sort(compareDealsForDisplay);
}

/** 場所の短い書き方（見出し用）: 1 か所は「県市区町村」、複数は「〈1 か所目〉ほか」（場所の数と設備の数は一致しないので数は書かない）、海外・不明は一次の書きぶり */
export function placeShort(d: Pick<Deal, 'places'>): string {
  const ps = d.places.filter((p) => p.text);
  if (ps.length === 0) return '';
  const first = ps[0].pref ? `${ps[0].pref}${ps[0].city}` : ps[0].text;
  return ps.length === 1 ? first : `${first}ほか`;
}

/** 見出し（中立の文・当サイトが欄から組み立てる）: 「〈発表者〉— 〈場所〉の蓄電所の〈種類〉」 */
export function dealHeading(d: Pick<Deal, 'publisher' | 'places' | 'kinds'>): string {
  const place = placeShort(d);
  const kinds = kindsLabel(d.kinds);
  return `${d.publisher} — ${place ? `${place}の` : ''}蓄電所の${kinds}`;
}

export type DealFilter = {
  year: string;
  kind: DealKind | '';
  stage: DealStage | '';
  area: DealArea | '';
  /** '' すべて／'none' 印なし／印の鍵 */
  mark: DealMark | 'none' | '';
  price: boolean;
};
export const EMPTY_DEAL_FILTER: DealFilter = { year: '', kind: '', stage: '', area: '', mark: '', price: false };

export type DealFilterTarget = { year: string; kinds: DealKind[]; stages: DealStage[]; areas: DealArea[]; marks: DealMark[]; hasPrice: boolean };

export function matchesDealFilter(t: DealFilterTarget, f: DealFilter): boolean {
  if (f.year && t.year !== f.year) return false;
  if (f.kind && !t.kinds.includes(f.kind)) return false;
  if (f.stage && !t.stages.includes(f.stage)) return false;
  if (f.area && !t.areas.includes(f.area)) return false;
  if (f.mark === 'none' && t.marks.length > 0) return false;
  if (f.mark && f.mark !== 'none' && !t.marks.includes(f.mark)) return false;
  if (f.price && !t.hasPrice) return false;
  return true;
}

/** 行の出典（role primary）。無ければ先頭 */
export function primarySource(d: Pick<Deal, 'sources'>): DealSource {
  return d.sources.find((s) => s.role === 'primary') ?? d.sources[0];
}
