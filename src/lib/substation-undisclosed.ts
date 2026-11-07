/**
 * src/lib/substation-undisclosed.ts — 名称非公開の変電所の判定と表示名（小さな直し便・2026-11-05）
 *
 * 公表元が名前を伏せている設備（23 件: 関西 1・北陸 21・中国 1）。取込のときに北陸・中国は名前を「(名称非公開) {内部の番号}」、
 * 関西の ＢＵ は一次の名前の欄のまま「変電所」とした。そのため題名に内部の番号が出たり、h1 が「変電所」だけになったりしていた。
 * 関西電力送配電の空容量一覧（154kV以上）の備考「◇」は、個々の電源の運転状況や需要者の電力使用状況が推測可能な電源線や
 * 専用線等で、設備容量などを公表していない設備（同社の PDF の注記 (13)）。
 *
 * ★判定はここ 1 か所（#121）。題名・h1・一覧・県のページ・検索・noindex・サイトマップがこの関数を通る。
 *   件数は verify:grid-pages が 23 件ちょうどで固定する（IndexNow の NO_SUBMIT_SLUGS と同じ集合）。
 * ★DB の name は一次の表記のまま（書き換えない）。推測の名前・位置は書かない。
 * ブラウザの部品からも読むので、生成物や大きな JSON を import しない。
 */

/** 送配電事業者の短い名（/grid の出典欄の表記と同じ）。表に無い名前はそのまま返す */
const OPERATOR_SHORT: Record<string, string> = {
  北海道電力ネットワーク: '北海道電力NW',
  東北電力ネットワーク: '東北電力NW',
  東京電力パワーグリッド: '東京電力PG',
  中部電力パワーグリッド: '中部電力PG',
  中国電力ネットワーク: '中国電力NW',
};
export function operatorShortName(operator: string): string {
  return OPERATOR_SHORT[operator] ?? operator;
}

type UndisclosedInput = {
  name?: string | null;
  external_id?: string | null;
  operator?: string | string[] | null;
};

const UNDISCLOSED_PREFIX = '(名称非公開)';

/** 名称非公開の変電所か。北陸・中国は名前が「(名称非公開)」で始まる 22 件、関西は名前が「変電所」だけの 1 件（ＢＵ・備考「◇」） */
export function isUndisclosedSubstation(s: UndisclosedInput): boolean {
  const name = (s.name ?? '').trim();
  return name.startsWith(UNDISCLOSED_PREFIX) || name === '変電所';
}

/**
 * 公表元の No.（社名などの前置き「rikuden_local01_」「energia_kikan_」「kansai_kikan_」を外した部分）。
 * 北陸・中国は名前の「(名称非公開)」の後ろから採る。external_id は使わない＝rkd-toyama-tss0076 だけ external_id が slug と同じ値で、
 * そこから採ると「No.rkd-toyama-tss0076」になる（495b246 の本番で出た・同じ日に直した）。関西の ＢＵ は名前が「変電所」だけなので external_id から。
 */
function officialNoOf(s: UndisclosedInput): string {
  const name = (s.name ?? '').trim();
  const src = (name.startsWith(UNDISCLOSED_PREFIX) ? name.slice(UNDISCLOSED_PREFIX.length) : s.external_id ?? '').trim();
  return src.slice(src.lastIndexOf('_') + 1).trim();
}

/**
 * 「名称非公開の変電所（{事業者の短い名}・No.{公表元の No.}）」。
 * 府県を渡すと、詳細の題名・h1・OG・JSON-LD 用に括弧を 1 つにまとめる（小さな直し便・2026-11-07）:
 * 「名称非公開の変電所（福井県・北陸電力送配電・No.FSS062）」。以前の題名は府県つきの題名の形（{名前}（{県}・{事業者}））を
 * そのまま重ねていたので「…（北陸電力送配電・No.FSS062）（福井県・北陸電力送配電）」と事業者が 2 回出ていた（北陸の 20 件）。
 * 一覧・県のページ・検索は府県の列が別にあるので、府県を渡さない（今のまま）。
 */
export function undisclosedDisplayName(s: UndisclosedInput, prefecture: string | null = null): string {
  const operator = Array.isArray(s.operator) ? s.operator[0] : s.operator;
  const no = officialNoOf(s);
  const parts = [prefecture ?? '', operator ? operatorShortName(operator) : '', no && no !== '変電所' ? `No.${no}` : ''].filter(Boolean);
  return parts.length ? `名称非公開の変電所（${parts.join('・')}）` : '名称非公開の変電所';
}

/** 一覧・県のページ・検索に出す名前（名称非公開だけ表示名に置き換える。ほかは一次の名前のまま） */
export function substationShownName<T extends UndisclosedInput & { name: string }>(s: T): string {
  return isUndisclosedSubstation(s) ? undisclosedDisplayName(s) : s.name;
}

/** 詳細の冒頭に出す理由（共通） */
export const UNDISCLOSED_REASON = '公表元の資料で名称が公開されていない設備です。';
/** 関西の 1 件だけ続けて出す理由（関西電力送配電の空容量一覧〔154kV以上〕の備考「◇」と注記 (13)） */
export const UNDISCLOSED_REASON_KANSAI =
  '関西電力送配電は、個々の電源の運転状況や需要者の電力使用状況が推測可能な電源線や専用線等について、設備容量などを公表していません（公表資料の備考「◇」）。';

/** 詳細の冒頭の理由の文（関西電力送配電の設備だけ 2 文目を足す） */
export function undisclosedReason(s: UndisclosedInput): string {
  const operator = Array.isArray(s.operator) ? s.operator[0] : s.operator;
  return operator === '関西電力送配電' ? `${UNDISCLOSED_REASON}${UNDISCLOSED_REASON_KANSAI}` : UNDISCLOSED_REASON;
}
