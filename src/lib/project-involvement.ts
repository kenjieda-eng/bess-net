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
import {
  coreName,
  findOperatorMentions,
  normalizeForMatch,
  projectOperatorMatches,
  resolveStructuredEntities,
} from './operator-match';

export type InvolvementRole =
  | 'オフテイク'
  | '運用・最適化'
  | 'EPC・施工'
  | '機器供給'
  | '出資';

/** 役割の表示順（ページ・索引とも同じ順） */
export const INVOLVEMENT_ROLE_ORDER: readonly InvolvementRole[] = [
  'オフテイク',
  '運用・最適化',
  'EPC・施工',
  '機器供給',
  '出資',
];

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
  // Ck2h §6: findOperatorMentions の位置は正規化後（NFKC）の文字列上なので、unit も同じ関数で正規化してから位置を使う
  // （plainBody・splitSentences の後で掛ける＝全角「＜」が「<」になってタグ扱いで消える事故を避ける）
  const units = [String(projectName || ''), ...splitSentences(plainBody(projectBody))].map(normalizeForMatch);
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
  return INVOLVEMENT_ROLE_ORDER.filter((r) => roles.has(r));
}

/* ------------------------------------------------------------------------ *
 * 案件の EPC の欄（projects.epc）を使う（2026-11-22・_QUEUE.md 136 行）
 *
 * 本文だけで判定していたため、(1) 事業者の欄を持ち主に直した案件が、建設した会社のページから消えた
 * （実測: 御前崎＝サンヴィレッジ・和光＝TAOKE ENERGY）。(2) 表の引用を 1 つの文として書いた本文で、
 * 隣の欄の「EPC」の語が別の会社に付いた（実測: tokuman-saga-bess の「EMS デジタルグリッド株式会社／EPC契約日」）。
 *   ① EPC の欄が結び付く事業者に「EPC・施工」を付ける。
 *   ② EPC の欄に値がある案件では、本文からの「EPC・施工」を、欄が結び付く事業者だけに残す。
 *   EPC の欄が空の案件は、本文からの判定をそのまま使う。
 *   ①は、事業者の欄が空の案件（所有者が一次に無い）では足さない。この節のページの文は「◯◯はこれらの案件を保有していません」で、
 *   所有者が分からない案件を足すと、裏づけの無い断定になるため（実測: GRITZ の 3 件・NC真庭＝開発・設計・施工をした会社だけが一次にある）。
 * ------------------------------------------------------------------------ */

/** 欄の値（空・文字列の "null" は空として扱う） */
export function fieldText(raw: string | null | undefined): string {
  const t = normalizeForMatch(raw).trim();
  return t === 'null' || t === 'undefined' ? '' : t;
}

/**
 * EPC の欄がその事業者に結び付くか。保有の判定と同じ厳しさ＝
 * 構造化欄のマスタ完全一致（entityIndex に入れた正式名・別名）か、projectOperatorMatches。素の部分一致は使わない。
 */
export function epcFieldMatches(
  epc: string | null | undefined,
  operatorName: string,
  entityIndex: Map<string, string[]>
): boolean {
  const t = fieldText(epc);
  if (!t) return false;
  return resolveStructuredEntities(t, entityIndex).includes(operatorName) || projectOperatorMatches(t, operatorName);
}

/** 本文からの役割に EPC の欄を合わせる（上の ①②）。ownerKnown＝事業者の欄に値がある。順は INVOLVEMENT_ROLE_ORDER */
export function applyEpcField(
  bodyRoles: Iterable<InvolvementRole>,
  epc: string | null | undefined,
  matchesEpc: boolean,
  ownerKnown: boolean
): InvolvementRole[] {
  const roles = new Set<InvolvementRole>(bodyRoles);
  if (fieldText(epc)) {
    if (!matchesEpc) roles.delete('EPC・施工');
    else if (ownerKnown) roles.add('EPC・施工');
  }
  return INVOLVEMENT_ROLE_ORDER.filter((r) => roles.has(r));
}

/**
 * 案件とその事業者の「関与」の役割（1 つも無ければ空＝載せない）。
 * 保有している事業者（owned）には付けない＝保有と関与を重ねない。
 */
export function involvementRolesFor(
  project: { name?: string | null; body?: string; epc?: string | null; operator?: string | null },
  operatorName: string,
  nameVariants: readonly string[],
  entityIndex: Map<string, string[]>,
  owned: boolean
): InvolvementRole[] {
  if (owned) return [];
  const bodyRoles = nameVariants.flatMap((nv) => detectInvolvementRoles(project.name ?? '', project.body, nv));
  return applyEpcField(
    bodyRoles,
    project.epc,
    epcFieldMatches(project.epc, operatorName, entityIndex),
    fieldText(project.operator) !== ''
  );
}
