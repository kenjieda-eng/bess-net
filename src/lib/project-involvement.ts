/**
 * src/lib/project-involvement.ts — Op9（2026-08-09）
 *
 * 「保有・開発案件」と「関与案件」を分離する。
 *
 * 背景: 事業者欄（projects.operator）に載るのは保有・開発の主体だけで、
 * オフテイク・運用受託・EPC・機器供給といった**関与**は詳細ページに一切出ていなかった
 * （例: 東京ガスは美作蓄電所の最適運用、福島案件の20年オフテイクを担うが未表示）。
 *
 * ★絶対条件: 関与を「保有」と誤読させないこと。
 *   よって (1) 役割ラベルを特定できたものだけを載せる、(2) 各行に役割を明示する、
 *   (3) 役割語と社名が**同一文**にあることを要件にする、の3点を実装で担保する。
 *   単なる言及（「北海道電力ネットワーク管内の…」等）は役割語がないため採用されない。
 */
import { coreName, findOperatorMentions } from './operator-match';

export type InvolvementRole =
  | 'オフテイク'
  | '運用・最適化'
  | 'EPC・施工'
  | '機器供給'
  | '出資';

/**
 * 役割ラベル → その役割を示す語。
 * 曖昧語（「参画」「協業」「連携」等、立場が定まらないもの）は意図的に入れない。
 *
 * ★「機器供給」だけは語彙ではなく**社名に直結した形**でしか判定しない（下の companyAnchored）。
 *   実測の誤ラベル: 「PCSは独SMA…製を採用、システム構築は千代田化工建設が担当しています」で
 *   「製を採用」が千代田化工建設に誤って付いた。製造元を指す語は、社名に接していないと帰属できない。
 */
const ROLE_KEYWORDS: { role: InvolvementRole; words: string[] }[] = [
  { role: 'オフテイク', words: ['オフテイク', 'オフテーカー', 'トーリング', '長期利用契約', '利用対価'] },
  { role: '運用・最適化', words: ['最適運用', '運用受託', '運用権', '運用を受託', '運用を担', 'アグリゲーション', '市場取引を実施', '運用最適化', 'O&M'] },
  { role: 'EPC・施工', words: ['EPC', '設計・調達・建設', '施工を担', '建設工事を受注', 'EPC事業者', 'EPCを担', 'システム構築'] },
  { role: '出資', words: ['出資', '共同出資', '資本参画', '匿名組合出資'] },
];

/**
 * 「機器供給」は社名に直結した表現のみを採る。
 * 例: 「GSユアサ製」「◯◯が蓄電池を供給」「◯◯が納入」
 */
function companyAnchoredSupply(unit: string, operatorName: string): boolean {
  const core = coreName(operatorName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (core.length < 2) return false;
  const patterns = [
    // 「GSユアサ製」— 社名に**直結**した「製」のみ。間に文字を許すと
    // 「旧出光興産兵庫製油所跡地」を誤って拾う（2026-08-09 実測）。
    // 製油所・製鉄所・製作所・製造の類も除外する。
    new RegExp(`${core}製(?![油鉄作造薬紙糖鋼品])`),
    new RegExp(`${core}[^。、]{0,12}(を|の)?(供給|納入|提供)`),
  ];
  return patterns.some((re) => re.test(unit));
}

/**
 * 役割語と社名の**近接**を要件にする（同一文でも別社の役割が同居するため）。
 * 実測の正例は概ね 15文字以内だが、出資者の列挙
 * （「A株式会社、B株式会社、C、Dの4社が共同で設立した」）は社名から役割語まで
 * 50文字強離れるため 60 文字とする。誤帰属は「機器供給の社名直結化」で別途塞いでいる。
 */
const ROLE_PROXIMITY_CHARS = 60;

function nearRoleWord(unit: string, spans: [number, number][], word: string): boolean {
  let from = 0;
  for (;;) {
    const i = unit.indexOf(word, from);
    if (i === -1) return false;
    const j = i + word.length;
    for (const [s, e] of spans) {
      // 社名スパンと役割語スパンの隙間が近いこと（前後どちらでもよい）
      const gap = s >= j ? s - j : i >= e ? i - e : 0;
      if (gap > ROLE_PROXIMITY_CHARS) continue;
      // ★2026-08-20: 社名と役割語の**間に「製」がある場合は帰属しない**。
      //   機器構成の列挙文「蓄電池セルはA製、PCSはB製を採用し、システム構築はCが担当」で
      //   A/B にも proximity 内の「システム構築」が付く誤帰属を実測
      //   （ota-johyo の CATL・tsunokobaru の GSユアサ）。「製」を挟む＝その社は
      //   製造元として列挙されているだけで、後続の役割語は別社のもの。
      //   正例（「TMEICがシステム構築を担当」「システム構築は千代田化工建設」）は
      //   間に「製」が無いため影響しない。
      const between = s >= j ? unit.slice(j, s) : i >= e ? unit.slice(e, i) : '';
      if (between.includes('製')) continue;
      return true;
    }
    from = i + 1;
  }
}

/** 文末で分割（HTML除去済みテキスト向け）。役割語と社名の同一文性を担保するため。 */
function splitSentences(text: string): string[] {
  return String(text || '')
    .split(/[。\n]|<\/p>|<br\s*\/?>/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** HTML タグと出典セクションを落として本文テキストにする */
export function plainBody(html: string | undefined): string {
  let s = String(html || '');
  // 「出典」以降は URL 列挙で、社名が役割と無関係に並ぶため切り落とす
  const idx = s.search(/<h2[^>]*>\s*出典\s*<\/h2>/);
  if (idx >= 0) s = s.slice(0, idx);
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t　]+/g, ' ');
}

/**
 * 案件テキスト（name＋body）から、その事業者の役割を判定する。
 * 役割語と社名が同一文にある場合のみ採用し、特定できなければ null（＝載せない）。
 */
export function detectInvolvementRoles(
  projectName: string,
  projectBody: string | undefined,
  operatorName: string
): InvolvementRole[] {
  const units = [String(projectName || ''), ...splitSentences(plainBody(projectBody))];
  const roles = new Set<InvolvementRole>();
  for (const unit of units) {
    if (!unit) continue;
    const spans = findOperatorMentions(unit, operatorName);
    if (spans.length === 0) continue;
    for (const { role, words } of ROLE_KEYWORDS) {
      if (words.some((w) => nearRoleWord(unit, spans, w))) roles.add(role);
    }
    if (companyAnchoredSupply(unit, operatorName)) roles.add('機器供給');
  }
  // 役割の表示順を安定させる
  const order: InvolvementRole[] = ['オフテイク', '運用・最適化', 'EPC・施工', '機器供給', '出資'];
  return order.filter((r) => roles.has(r));
}
