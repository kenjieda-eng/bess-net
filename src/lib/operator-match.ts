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
 * projects.operator（「A（SPC名・100%出資）」「A×B」等の複合値）に対する突合。
 * 区切りで分割し、各要素に mentionsOperator を適用する。
 */
export function projectOperatorMatches(projectOperator: string, operatorName: string): boolean {
  if (!projectOperator || !operatorName) return false;
  if (mentionsOperator(projectOperator, operatorName)) return true;
  const parts = String(projectOperator)
    .replace(/（[^）]*）|\([^)]*\)/g, ' ')
    .split(/[×／/、,・]| と | および /);
  return parts.some((p) => mentionsOperator(p.trim(), operatorName));
}
