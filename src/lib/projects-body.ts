/**
 * src/lib/projects-body.ts
 *
 * projects の body に焼き込まれた「取込器テンプレ」を、表示時に field から再生成する。
 * 2026-05 の一括取込が body を機械生成して固定保存したため、field を PATCH しても
 * 本文が追随せず「所在地欄は正しいのに本文は旧値」という食い違いが残っていた。
 * 本モジュールは microCMS に書き戻さず、描画の直前に field を正として本文を作り直す。
 *
 * 承認: 02_計画・運営/検証記録_Pj2D_裁定_2026-09-03_ユウ.md §2 裁定A（案B＝第1文全体を再生成）
 * 実査: reports/projects-body-template-rootcause-2026-09-03.md
 *
 * ■ 対象の判定（テンプレ指紋・ユウ裁定Aの条件① により逐語で持つ）
 *   ① body が固定見出し `<h2 id="h3af4d147a9">プロジェクト概要</h2>` で **始まる**
 *   ② body が `発表企業：` を含む
 *   実測: ①②は 175 件で完全に一致し、キュレーション済み body の誤検出は 0 件。
 *   richEditor は見出しテキストから id を採番するため、同一テキストの見出しは同一 id になる。
 *   これが機械生成本文の指紋として機能する（#122 で確認した挙動の副産物）。
 *
 * ■ テンプレ原型（実データから確定・175件）
 *   <h2 id="h3af4d147a9">プロジェクト概要</h2>
 *   <p><strong>{name}</strong>は、{prefecture}{city}に立地する系統用蓄電所。{SPEC}
 *      発表企業：{operator}。ステータス：{status}（発表日：{cod}）。</p>
 *   [<p>{リリースのリード文}</p>]            ← field に対応物が無いので触らない
 *   <h2 id="h1b9eb7c3a9">出典</h2><ul>…</ul>
 *   <p>※本ページは公開情報を構造化したものです。…</p>
 *
 *   SPEC の実測バリエーション: ''(135) / '出力 N MW 規模。'(16) /
 *                              '容量 N MWh 規模。'(14) / '出力 N MW、容量 N MWh 規模。'(10)
 *
 * ■ 設計上の性質
 *   - **冪等**: 再適用しても結果が変わらない。原値を退避しないので #119 の二重正規化事故は起きない
 *   - **非破壊**: 第1段落と出典ブロックの PR TIMES URL 以外は 1 文字も触らない
 *   - **保守的**: 指紋に一致しない body は原文をそのまま返す（キュレーション本文を守る）
 *
 * ■ 呼び出し箇所は 1 つだけ（#119: 正規化は一箇所で掛ける）
 *   src/app/projects/[slug]/page.tsx の先頭で 1 回。表示・linkify・関連エンティティ抽出は
 *   すべて同じ戻り値を使う。取得側（getProjectBySlug）には置かない。
 */
import type { Project } from './microcms';

/** テンプレ指紋①: プロジェクト概要の見出し（richEditor の固定採番 id つき） */
export const TEMPLATE_HEAD = '<h2 id="h3af4d147a9">プロジェクト概要</h2>';
/** テンプレ指紋②: 第1段落に必ず含まれる語 */
export const TEMPLATE_MARK = '発表企業：';

/** 第1段落（プロジェクト概要の本文）。テンプレは必ず HEAD 直後に <p>…</p> を持つ */
const FIRST_PARAGRAPH = /^<h2 id="h3af4d147a9">プロジェクト概要<\/h2><p>([\s\S]*?)<\/p>/;

/** 出典ブロックの PR TIMES 行（href と表示テキストの両方に同じ URL が入る） */
const PRTIMES_LINE =
  /(<li>PR TIMES: <a href=")https:\/\/prtimes\.jp\/[^"]*("[^>]*>)https:\/\/prtimes\.jp\/[^<]*(<\/a><\/li>)/;

/** HTML エスケープ（field 値を本文に差し込むため。実測では特殊文字を含む name は 0 件だが防御的に） */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** テンプレの数値表記（整数はそのまま・小数はそのまま。1,000 区切りは使わない＝原型に合わせる） */
function numText(v: number): string {
  return String(v);
}

/**
 * 出力・容量の句を組み立てる。0 / null / undefined は「調査中」扱いで句自体を出さない
 * （/projects の investigatingCount と同じ扱い。誤情報を出さない）。
 */
function specSentence(outputMw?: number | null, capacityMwh?: number | null): string {
  const o = typeof outputMw === 'number' && outputMw > 0 ? outputMw : null;
  const c = typeof capacityMwh === 'number' && capacityMwh > 0 ? capacityMwh : null;
  if (o !== null && c !== null) return `出力 ${numText(o)} MW、容量 ${numText(c)} MWh 規模。`;
  if (o !== null) return `出力 ${numText(o)} MW 規模。`;
  if (c !== null) return `容量 ${numText(c)} MWh 規模。`;
  return '';
}

type BodySource = Pick<
  Project,
  'body' | 'name' | 'prefecture' | 'city' | 'operator' | 'status' | 'cod' | 'outputMw' | 'capacityMwh' | 'sourceUrl'
>;

/** body がテンプレ指紋に一致するか（呼び出し側の検査・レポート用に export） */
export function isTemplateBody(body?: string | null): boolean {
  const b = body ?? '';
  return b.startsWith(TEMPLATE_HEAD) && b.includes(TEMPLATE_MARK);
}

/** テンプレの第1段落を field から組み立てる */
function buildFirstParagraph(p: BodySource): string {
  const name = esc((p.name ?? '').trim());
  const loc = esc(`${p.prefecture ?? ''}${p.city ?? ''}`.trim());
  const operator = esc((p.operator ?? '').trim());
  const status = esc(((p.status ?? [])[0] ?? '').trim());
  const cod = esc((p.cod ?? '').trim());

  // 所在地が無いときは「〜は、に立地する」という壊れた日本語にせず、句ごと落とす
  const head = loc
    ? `<strong>${name}</strong>は、${loc}に立地する系統用蓄電所。`
    : `<strong>${name}</strong>は系統用蓄電所。`;

  const spec = specSentence(p.outputMw, p.capacityMwh);
  const org = operator ? `発表企業：${operator}。` : '';
  // ステータスと発表日は片方だけでも出せるようにする（実測では 175 件とも両方あり）
  const st = status && cod ? `ステータス：${status}（発表日：${cod}）。`
    : status ? `ステータス：${status}。`
    : cod ? `（発表日：${cod}）。`
    : '';

  return `${head}${spec}${org}${st}`;
}

/**
 * 表示用に body を再構成する。
 * テンプレ指紋に一致しない body は原文をそのまま返す。
 */
export function reconstructProjectBody(p: BodySource): string {
  const body = p.body ?? '';
  if (!isTemplateBody(body)) return body;

  let out = body;

  // (1) 第1段落を field から再生成
  const m = FIRST_PARAGRAPH.exec(out);
  if (m) {
    out = `${TEMPLATE_HEAD}<p>${buildFirstParagraph(p)}</p>${out.slice(m[0].length)}`;
  }

  // (2) 出典ブロックが sourceUrl をどこにも載せていない場合だけ、PR TIMES 行を sourceUrl に揃える
  //     （ユウ裁定B条件①: 175件中1件だけの sourceUrl 食い違いを解消する）
  //
  //     ★「sourceUrl が出典ブロックに既に存在するなら何もしない」条件が要る。
  //       出典ブロックは「🎯 企業元リリース」「企業公式サイト」「PR TIMES」の3行構成があり、
  //       sourceUrl が 🎯 企業元リリース行に載っていて PR TIMES 行が**同社の別リリース**、
  //       という正常なレコードが実在する（pr-co55631-hokkaido・pr-co76147-bess）。
  //       無条件に置換すると、その別リリースへの参照を消してしまう＝情報を減らす。
  //       この条件により、実際に置換されるのは pr-co160356-bess-2 の1件のみ。
  const src = (p.sourceUrl ?? '').trim();
  if (src.startsWith('https://prtimes.jp/') && !out.includes(`href="${src}"`)) {
    out = out.replace(PRTIMES_LINE, `$1${src}$2${src}$3`);
  }

  return out;
}
