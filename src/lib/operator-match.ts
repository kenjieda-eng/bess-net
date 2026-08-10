/**
 * src/lib/operator-match.ts — 事業者名の突合ロジック（Op1/Op2・2026-08-08）
 *
 * 目的: projects.operator / news(title+body) から「その会社の実案件・ニュース」を機械抽出する。
 * 誤掲載は信頼を損なうため、再現率より適合率（precision）を優先する。
 *
 * 実測した暴発（2026-08-08・news 1,340本）:
 *   「ポート」素の部分一致 174本 → うち172本が誤マッチ（"サポート"等）
 *   「テス」35本（"テスラ"・"テスグループ"混入）／「東急」45本（"東急不動産"＝別会社が混入）
 * → 素の includes は不採用。以下の2段構えとする。
 *
 *  ① 厳格形（全社に適用）: 法人格を伴う完全形（株式会社X／X株式会社／X合同会社／Xホールディングス 等）
 *  ② 語境界つき部分一致（コア名4字以上のみ）: 前後が漢字・カタカナ・英字なら社名が続いている
 *     可能性が高いとみなして不採用（"東急"→"東急不動産" を弾く）。3字以下は①のみ。
 */

const LEGAL_RE = /(株式会社|合同会社|有限会社|一般社団法人|一般財団法人|\(株\)|（株）|㈱|グループ|ホールディングス|ＨＤ)/g;

/** 社名から法人格・括弧注記を除いたコア名 */
export function coreName(name: string): string {
  return String(name || '')
    .replace(/（[^）]*）|\([^)]*\)/g, '')
    .replace(LEGAL_RE, '')
    .trim();
}

/** 法人格を伴う完全形（その社を一意に指す表記） */
function strictForms(name: string): string[] {
  const core = coreName(name);
  const forms = new Set<string>();
  if (name) forms.add(name.trim());
  if (core.length >= 2) {
    for (const suffix of ['株式会社', '合同会社', '有限会社', 'ホールディングス', 'グループ']) {
      forms.add(`${core}${suffix}`);
    }
    forms.add(`株式会社${core}`);
    forms.add(`合同会社${core}`);
    forms.add(`有限会社${core}`);
  }
  return [...forms].filter((f) => f.length >= 3);
}

/** 社名が続いている可能性のある文字（この文字が境界に来たら部分一致を採らない） */
const NAME_CHAR = /[一-龥ァ-ヶーA-Za-z0-9]/;

/**
 * text 中に op（社名）への確実な言及があるか。
 * strict=true になるのは①法人格つき完全形か、②4字以上のコア名が語境界を満たす場合のみ。
 */
export function mentionsOperator(text: string, operatorName: string): boolean {
  if (!text || !operatorName) return false;

  // ① 厳格形
  for (const form of strictForms(operatorName)) {
    if (text.includes(form)) return true;
  }

  // ② コア名 4字以上のみ、語境界チェック付き部分一致
  const core = coreName(operatorName);
  if (core.length < 4) return false;

  let from = 0;
  for (;;) {
    const i = text.indexOf(core, from);
    if (i === -1) return false;
    const before = i > 0 ? text[i - 1] : '';
    const after = i + core.length < text.length ? text[i + core.length] : '';
    const beforeOk = !before || !NAME_CHAR.test(before);
    // 直後が法人格の先頭文字（株/合/有/ホ/グ）なら社名の一部として正当
    const afterOk = !after || !NAME_CHAR.test(after) || /[株合有ホグ]/.test(after);
    if (beforeOk && afterOk) return true;
    from = i + 1;
  }
}

/**
 * mentionsOperator と同一の判定で、text 中の言及位置 [start, end) を返す。
 * 役割語との距離を測る用途（Op9）。判定基準がぶれないよう同じ規則を使う。
 */
export function findOperatorMentions(text: string, operatorName: string): [number, number][] {
  const out: [number, number][] = [];
  if (!text || !operatorName) return out;

  for (const form of strictForms(operatorName)) {
    let from = 0;
    for (;;) {
      const i = text.indexOf(form, from);
      if (i === -1) break;
      out.push([i, i + form.length]);
      from = i + 1;
    }
  }

  const core = coreName(operatorName);
  if (core.length >= 4) {
    let from = 0;
    for (;;) {
      const i = text.indexOf(core, from);
      if (i === -1) break;
      const before = i > 0 ? text[i - 1] : '';
      const after = i + core.length < text.length ? text[i + core.length] : '';
      const beforeOk = !before || !NAME_CHAR.test(before);
      const afterOk = !after || !NAME_CHAR.test(after) || /[株合有ホグ]/.test(after);
      if (beforeOk && afterOk) out.push([i, i + core.length]);
      from = i + 1;
    }
  }
  return out.sort((a, b) => a[0] - b[0]);
}

/**
 * projects.operator（「A（SPC名・100%出資）」「A×B」等の複合値）に対する突合。
 * 区切りで分割し、各要素に mentionsOperator を適用する。
 *
 * ※ 構造化フィールド（事業者欄）では resolveStructuredEntities を優先して使う。
 *   本関数は「マスタに載っていない社名表記」を拾う保険として併用する。
 */
export function projectOperatorMatches(projectOperator: string, operatorName: string): boolean {
  if (!projectOperator || !operatorName) return false;
  if (mentionsOperator(projectOperator, operatorName)) return true;
  const parts = String(projectOperator)
    .replace(/（[^）]*）|\([^)]*\)/g, ' ')
    .split(/[×／/、,・]| と | および /);
  return parts.some((p) => mentionsOperator(p.trim(), operatorName));
}

/* ------------------------------------------------------------------------ *
 * 構造化フィールド用の突合（2026-08-09・偽陰性是正）
 *
 * projects.operator / news.sourceName は「文章」ではなく事業者名そのものが入る欄。
 * 文脈的暴発（"ポート"→"サポート"）は起きないため、本文向けの厳格ルール
 * （法人格つき完全形 or コア名4字以上）は過剰で、実在の紐付けを落としていた。
 *   実測(2026-08-09): 事業者欄「レノバ」→ 株式会社レノバ が 0件（コア3字のため）、
 *   「丸紅」→ 丸紅株式会社 が 0件。合わせて 9案件が欠落していた。
 *
 * 一方、構造化フィールドでも「別法人の吸い上げ」は起きる。実測で事業者欄の分割要素に
 * 「東急」と「東急不動産」が併存し、コア名の前方一致は 35組の誤マッチ余地があった
 * （東急⊂東急不動産 / 丸紅⊂丸紅新電力 / 東京電力⊂東京電力パワーグリッド 等）。
 * → **前方一致は採らず、事業者マスタとの完全一致のみ**を採用する。
 *   マスタに実在する社名は必ず自分自身に解決されるため、親会社へ流れない。
 * ------------------------------------------------------------------------ */

/** 「他3社」「ほか」「等」など、複数社を示す接尾（社名ではない） */
const COLLECTIVE_SUFFIX = /(他\d*社?|ほか\d*社?|外\d*社?|など|等)$/;
/** 「SMFLみらいパートナーズ61%」のように出資比率が付く表記（実測: hasu-iiyama-bess） */
const OWNERSHIP_SUFFIX = /[0-9０-９]+(?:[.．][0-9０-９]+)?[%％]$/;

/** 構造化フィールドの要素を、マスタ照合用のキーへ正規化する */
export function normalizeEntityName(raw: string): string {
  return coreName(raw)
    .replace(/[\s　]/g, '')
    .replace(OWNERSHIP_SUFFIX, '')
    .replace(COLLECTIVE_SUFFIX, '')
    .trim();
}

/** 複数社を並べる区切り（「・」は社名内にも現れるため、全体一致を先に試す） */
const STRUCTURED_SPLIT = /[×／/、,・]|\s+と\s+|\s+および\s+/;

/** 事業者マスタ（正規化キー → 正式名の配列）を作る */
export function buildEntityIndex(operatorNames: string[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const name of operatorNames) {
    const key = normalizeEntityName(name);
    if (key.length < 2) continue;
    const arr = index.get(key) ?? [];
    arr.push(name);
    index.set(key, arr);
  }
  return index;
}

/**
 * 構造化フィールドの値から、事業者マスタに実在する社名を解決する。
 *
 * 事業者欄は「主体（括弧外）＋補足（括弧内に出資者・運用者の列挙）」の形を取ることが多い
 * （例: 「合同会社NCパイオニア（リミックスポイント×日本蓄電池）」）。
 * 括弧を落として主体だけ見ると出資者を取りこぼすため、**括弧外と括弧内を別々に解決**して和を取る。
 *
 * 各ブロックの解決は
 *   ① ブロック全体が1社を指すならそれで確定（「ヘキサ・エネルギーサービス合同会社」を分割しない）
 *   ② 解決しないときのみ区切り分割し、各要素をマスタ完全一致で解決する
 */
export function resolveStructuredEntities(
  fieldValue: string,
  index: Map<string, string[]>
): string[] {
  if (!fieldValue) return [];
  const raw = String(fieldValue).trim();
  // microCMS 由来の文字列 "null" 等は社名ではない（実測: tokyogas-tomakomai-75）
  if (!raw || raw === 'null' || raw === 'undefined') return [];

  const out = new Set<string>();
  const resolveBlock = (text: string): void => {
    const t = text.trim();
    if (!t) return;
    const whole = normalizeEntityName(t);
    const wholeHit = index.get(whole);
    if (wholeHit) {
      for (const name of wholeHit) out.add(name);
      return;
    }
    for (const part of t.split(STRUCTURED_SPLIT)) {
      const key = normalizeEntityName(part);
      if (key.length < 2) continue;
      for (const name of index.get(key) ?? []) out.add(name);
    }
  };

  resolveBlock(raw.replace(/（[^）]*）|\([^)]*\)/g, ' '));
  for (const m of raw.matchAll(/（([^）]*)）|\(([^)]*)\)/g)) resolveBlock(m[1] ?? m[2] ?? '');
  return [...out];
}

/* ------------------------------------------------------------------------ *
 * 回帰検査（2026-08-09）
 * 突合ロジックを変えるたびに「実在する紐付けを落としていないか」を機械検査する。
 * 検出は突合ロジックとは独立の“緩い網”（素の部分一致）で行い、
 * 紐付いていない組のうち「別法人に正しく解決されているもの」だけを除外する。
 * ------------------------------------------------------------------------ */

export type StructuredFalseNegative = {
  operator: string;
  key: string;
  value: string;
};

/**
 * 網に掛かるが紐付けないことが正しい組（理由つきで明示する）。
 * キーは `${事業者名}|${値の正規化キー}`＝**表記ベース**。
 * slug ではなく表記で持つことで、同じ表記の案件・ニュースが増えても効き続ける。
 */
export const STRUCTURED_MATCH_ALLOWLIST: ReadonlyMap<string, string> = new Map([
  [
    'SBIホールディングス株式会社|SBIマネープラザ',
    'SBIマネープラザ株式会社は子会社だが別法人。事業者マスタ未登録のため親会社へは寄せない（前方一致不採用の方針）',
  ],
]);

/** 網に使うコア名か（英数字のみの短い略号は偶発一致が多いので3字以上を要求） */
function isNetworthyCore(core: string): boolean {
  if (!core) return false;
  const asciiOnly = /^[A-Za-z0-9]+$/.test(core);
  return asciiOnly ? core.length >= 3 : core.length >= 2;
}

/**
 * 構造化フィールドの偽陰性を検出する。
 * @param linked 事業者名 → 紐付いているレコードkeyの集合（実際の突合結果）
 */
export function findStructuredFalseNegatives(
  operatorNames: string[],
  records: { key: string; value: string }[],
  index: Map<string, string[]>,
  linked: Map<string, Set<string>>
): StructuredFalseNegative[] {
  const out: StructuredFalseNegative[] = [];
  const resolvedCache = new Map<string, string[]>();
  const resolveOf = (value: string): string[] => {
    let r = resolvedCache.get(value);
    if (!r) {
      r = resolveStructuredEntities(value, index);
      resolvedCache.set(value, r);
    }
    return r;
  };

  for (const opName of operatorNames) {
    const core = normalizeEntityName(opName);
    if (!isNetworthyCore(core)) continue;
    const already = linked.get(opName);
    for (const rec of records) {
      const raw = (rec.value ?? '').replace(/[\s　]/g, '');
      if (!raw || raw === 'null' || !raw.includes(core)) continue;
      if (already?.has(rec.key)) continue;
      if (STRUCTURED_MATCH_ALLOWLIST.has(`${opName}|${normalizeEntityName(rec.value)}`)) continue;
      // その値がより具体的な別法人に解決されているなら、紐付けないのが正しい
      const explained = resolveOf(rec.value).some((other) => {
        if (other === opName) return false;
        const otherCore = normalizeEntityName(other);
        return otherCore !== core && otherCore.includes(core);
      });
      if (explained) continue;
      out.push({ operator: opName, key: rec.key, value: rec.value });
    }
  }
  return out;
}
