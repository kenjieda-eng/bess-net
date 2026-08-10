/**
 * src/lib/glossary-meta.ts — S1（2026-08-09）用語ページの title / description
 *
 * 背景（GSC 2026-05-08〜08-07）: 順位4〜15位にいるのに CTR 3%未満の語が63語・表示8,322回。
 * 用語集の「◯◯とは」系に CTR 0% が集中していた（離隔距離とは 325表示/11.0位/0%、
 * 予備力とは 235/7.5位/0% など）。順位は既にあるので title で取りに行く。
 *
 * 実測した現行の問題: title は 1,527語**すべてが30字超**（中央値36・最大71）。
 *   「{用語}とは？意味・解説｜蓄電池・エネルギー用語集 | 蓄電所ネット」＝サフィックスだけで30字。
 *   検索結果では肝心の定義が1文字も見えていなかった。
 *
 * 方針:
 *  - 骨格を「{用語}とは — {定義の要点}｜蓄電所ネット」に変更（サイト名は1回だけ・中間サフィックス削除）
 *  - 定義の要点は **shortDef からの抽出のみ**。新規の文章生成はしない（G3 と同じ規律）
 *  - ★自前では**一切切り詰めない**。機械的な「…」切りは
 *    「予備力とは — 需給ひっ迫時等のために確保される予備電…」のような読めない title を作るため。
 *    収まらない語は素直にフォールバックし、切るのは検索エンジンに任せる。
 */

const SITE_SUFFIX = '｜蓄電所ネット';
/** 「◯◯とは — 」の分（と/は/空白/—/空白） */
const JOIN_WIDTH = 4;
/** 通常はここに収める */
const TITLE_SOFT_MAX = 36;
/** ここまでは許容（超えるならフォールバック） */
const TITLE_HARD_MAX = 40;
/** これ未満の要点は情報にならないので使わない */
const GIST_MIN = 6;

/** 助詞始まりの断片は読めないので要点に採らない */
const LEADING_PARTICLES = new Set(['の', 'が', 'を', 'に', 'で', 'は', 'と', 'も', 'や', 'へ']);

/**
 * shortDef から「定義の要点」候補を抽出する（生成はしない）。
 * 和文の定義は述語＝定義核が末尾に来るため、読点で切った**末尾節**を最優先にする。
 */
export function extractGistCandidates(shortDef: string): string[] {
  const sd = String(shortDef || '').trim().replace(/。+$/, '');
  if (!sd) return [];
  const first = sd.split('。')[0].trim();
  const clauses = first.split('、').map((s) => s.trim()).filter(Boolean);

  // ★優先順位つき（この順序に意味がある）。返り値の順序＝優先順位。
  //   ① 末尾節（和文の定義は述語＝定義核が末尾に来る）
  //   ② 第1文まるごと
  //   ③ 括弧の後ろ（「…（注記）の◯◯」の実体部分）
  // **先頭の従属節は候補にしない**。「電気事業法に基づき、〜」の前半だけを採ると
  // 「使用前自主検査とは — 電気事業法に基づき｜蓄電所ネット」のように文が切れて読めなくなる
  //  （2026-08-09 本番照合で7語の実害を確認して是正）。
  const raw: string[] = [];
  if (clauses.length > 0) raw.push(clauses[clauses.length - 1]);
  raw.push(first);
  const paren = [...first.matchAll(/[）)]/g)];
  if (paren.length > 0) raw.push(first.slice(paren[paren.length - 1].index! + 1).trim());

  const seen = new Set<string>();
  const out: string[] = [];
  for (const c0 of raw) {
    const c = c0.replace(/^[・（(\s]+|[・（()）\s]+$/g, '').trim();
    if (!c || seen.has(c)) continue;
    if (LEADING_PARTICLES.has(c[0])) continue;
    if (c.length < GIST_MIN) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

/** 用語ページの title。定義の要点を載せられない語はサフィックス短縮版にフォールバックする。 */
export function buildGlossaryTitle(term: string, shortDef: string): string {
  const name = String(term || '').trim();
  const fallback = `${name}とは？意味・解説${SITE_SUFFIX}`;
  if (!name) return fallback;

  const base = name.length + JOIN_WIDTH + SITE_SUFFIX.length;
  const candidates = extractGistCandidates(shortDef);
  // ★長さではなく**優先順位**で選ぶ。最長を選ぶと、定義核より長い先頭の従属節が勝ってしまう。
  const gist =
    candidates.find((c) => base + c.length <= TITLE_SOFT_MAX) ??
    candidates.find((c) => base + c.length <= TITLE_HARD_MAX);
  return gist ? `${name}とは — ${gist}${SITE_SUFFIX}` : fallback;
}

/**
 * description。shortDef を先頭に置く（実査したところ現行も shortDef のみで定型文は先頭に無い）。
 * 短すぎる語（shortDef 最短3字）のときだけ、ページに実在する要素を事実として補う。
 */
export function buildGlossaryDescription(
  term: string,
  shortDef: string,
  opts: { english?: string; category?: string } = {}
): string {
  const sd = String(shortDef || '').trim();
  const name = String(term || '').trim();
  let out = sd || `${name}の意味と関連情報。`;
  if (opts.english && !out.includes(opts.english)) out += `（英: ${opts.english}）`;
  if (out.length < 70) {
    const cat = opts.category ? `分類: ${opts.category}。` : '';
    out += `｜${cat}関連用語・関連ニュース・よくある質問もあわせて掲載。`;
  }
  return out;
}
