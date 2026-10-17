/**
 * src/lib/corrections.ts — 訂正履歴（訂正履歴便・2026-10-16）
 *
 * 編集方針（/editorial-policy）の「何を、いつ訂正したかを記事末「訂正履歴」に残します」「対応の内容と日付は…記事末の「訂正履歴」に残します」
 * を実装する。データは src/data/corrections.json（報告 reports/ と除外の一覧の理由から拾い出したもの・手で確認）。
 * - 載せるのは、一次と異なる記述を一次に合わせて直したもの（訂正）・表示を止めたもの（表示の停止）・止めていた表示を戻したもの（表示の再開）だけ。
 *   公表後の新しい情報による更新（締切の追随・新しい公募・採択結果・新しいデータの取込）は載せない。
 * - 日付は本番に反映された日（デプロイ成功の日付・JST）。2026-09-21 以降。
 * - internalRef（報告のパス）は検査用で、画面には出さない。
 * - 一覧（/corrections）と記事末（CorrectionHistory）は、このファイルの関数だけを通して読む（#119: 同じ判定を二か所で書かない）。
 */
import data from '@/data/corrections.json';
import { isExcludedExplainer } from '@/lib/explainer-excluded';
import { isExcludedEvent } from '@/lib/events-excluded';
import { isExcludedNews } from '@/lib/news-excluded';
import { isExcludedProject } from '@/lib/projects-excluded';
import { PROJECTS_301_SOURCE_SLUGS } from '@/lib/projects-301';
import { isExcludedOperator } from '@/lib/operators-excluded';
import { OPERATORS_301_SOURCE_SLUGS } from '@/lib/operators-301';
import { isExcludedSubsidy } from '@/data/subsidies-excluded';
import { isExcludedLink } from '@/lib/links-excluded';
import { isExcludedInfo } from '@/lib/info-excluded';
import { isGlossaryListExcluded } from '@/lib/glossary-301';
import { INCIDENTS } from '@/data/incidents';

export type CorrectionKind = '訂正' | '表示の停止' | '表示の再開';
export const CORRECTION_KINDS: readonly CorrectionKind[] = ['訂正', '表示の停止', '表示の再開'];
export type CorrectionBasis = { name: string; publisher: string; url: string };
export type Correction = {
  id: string;
  date: string; // YYYY-MM-DD（本番に反映された日・JST）
  kind: CorrectionKind;
  path: string; // 訂正した／止めたページのパス（止めたものは元のパス）
  record?: string; // microCMS のとき ep/slug、/incidents の事例は incidents/<id>（表示中かの判定用・画面には出さない）
  targetTitle: string;
  before: string;
  after: string;
  basis: CorrectionBasis[];
  internalRef: string; // 報告のパス（画面には出さない）
};

/** 記録の始まり（編集方針の約束を実装した時点より前の是正は、報告から拾える 2026-09-21 以降に限る） */
export const CORRECTIONS_SINCE = '2026-09-21';

const RAW = (data as { items: Correction[] }).items;

/** id の比較（連番を数として比べる。文字列比較だと 20260922-100 が -11 と -10 の間に入る） */
export const compareCorrectionIds = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });

/** 新しい順（同じ日は id の逆順＝後に足したものが上） */
export const CORRECTIONS: readonly Correction[] = [...RAW].sort((a, b) => (a.date === b.date ? compareCorrectionIds(b.id, a.id) : b.date.localeCompare(a.date)));

const normPath = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p).split('#')[0];

/** そのページの記録（記事末の「訂正履歴」用・新しい順） */
export function correctionsForPath(path: string): Correction[] {
  const p = normPath(path);
  return CORRECTIONS.filter((c) => normPath(c.path) === p);
}

/** 対象の区分（一覧の絞り込み用）。パスの先頭で決める */
export type CorrectionTarget = '解説' | '用語集' | '政策カレンダー' | '業界イベント' | '補助金' | '案件' | '事業者' | 'ニュース' | 'ツール' | 'FAQ' | 'リンク集' | 'お知らせ' | 'レポート・その他';
export const CORRECTION_TARGETS: readonly CorrectionTarget[] = ['解説', '用語集', '政策カレンダー', '業界イベント', '補助金', '案件', '事業者', 'ニュース', 'ツール', 'FAQ', 'リンク集', 'お知らせ', 'レポート・その他'];
export function targetOf(path: string): CorrectionTarget {
  const p = normPath(path);
  if (p.startsWith('/explainer')) return '解説';
  if (p.startsWith('/glossary')) return '用語集';
  if (p.startsWith('/policy-calendar')) return '政策カレンダー';
  if (p.startsWith('/events')) return '業界イベント';
  if (p.startsWith('/subsidies')) return '補助金';
  if (p.startsWith('/projects')) return '案件';
  if (p.startsWith('/operators')) return '事業者';
  if (p.startsWith('/news')) return 'ニュース';
  if (p.startsWith('/tools') || p.startsWith('/tracker')) return 'ツール';
  if (p.startsWith('/faq')) return 'FAQ';
  if (p.startsWith('/links')) return 'リンク集';
  if (p.startsWith('/info')) return 'お知らせ';
  return 'レポート・その他';
}

/** 記録の対象（ep/slug）がいま除外の一覧に入っているか（＝表示されていない） */
export function isRecordHidden(record: string | undefined): boolean {
  if (!record) return false;
  const i = record.indexOf('/');
  const ep = record.slice(0, i);
  const slug = record.slice(i + 1);
  switch (ep) {
    case 'explainer': return isExcludedExplainer(slug);
    case 'policy-events': return isExcludedEvent(slug);
    case 'news': return isExcludedNews(slug);
    case 'projects': return isExcludedProject(slug) || PROJECTS_301_SOURCE_SLUGS.has(slug);
    case 'operators': return isExcludedOperator(slug) || OPERATORS_301_SOURCE_SLUGS.has(slug);
    case 'subsidies': return isExcludedSubsidy(slug);
    case 'links': return isExcludedLink(slug);
    case 'info': return isExcludedInfo(slug);
    case 'glossary': return isGlossaryListExcluded(slug);
    case 'incidents': return INCIDENTS.some((x) => x.id === slug && x.hidden === true); // /incidents の事例（hidden で一覧から外す）
    default: return false;
  }
}

/** 一覧で対象にリンクするか（表示中のページだけリンク・止めているものは題名だけ） */
export function isTargetShown(c: Correction): boolean {
  return !isRecordHidden(c.record);
}

/** 2026-10-16 → 2026年10月16日 */
export function correctionDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => Number(s));
  return `${y}年${m}月${d}日`;
}
