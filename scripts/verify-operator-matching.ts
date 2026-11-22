#!/usr/bin/env tsx
/**
 * scripts/verify-operator-matching.ts
 *
 * /operators の突合（実案件・関連ニュース）の**回帰検査**。
 * 突合ロジックを変えるたびに走らせ、「実在する紐付けを落としていないか」を機械判定する。
 *
 * 背景（2026-08-09）: Op1/Op2 の厳格化が効きすぎ、事業者欄が「レノバ」「丸紅」のように
 * 略称で入っている案件を取りこぼしていた（株式会社レノバ=0件／実在6件）。
 * 以後は本検査で 0件 を維持する。
 *
 * 判定:
 *   ✅ falseNegativeProjects / falseNegativeNews が 0件
 *   ✅ 暴発の実測値が既知の上限を超えない（ポート/パス＝本文一致0本 を維持）
 *
 * 入力: src/lib/generated/operators-match-audit.json（precompute-operators-detail が生成）
 * 実行: npm run verify:operators   ※microCMS へのアクセスなし
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  mentionsCoreWithBoundary,
  mentionsOperator,
  normalizeEntityName,
  projectOperatorMatches,
  resolveStructuredEntities,
  buildEntityIndex,
} from '../src/lib/operator-match';
import { detectInvolvementRoles, involvementRolesFor } from '../src/lib/project-involvement';

/**
 * 偽陰性検出の境界判定 回帰ケース（2026-09-08 Pj2-G 追修便）。
 * 検出器が素の部分一致だったため 東急 ⊂ 東急不動産 を偽陰性として誤検出していた。
 * 境界判定へ直したうえで、**真の言及を隠していないこと**を毎回ここで担保する。
 */
const BOUNDARY_CASES: Array<{ raw: string; core: string; want: boolean; why: string }> = [
  // ── 真陽性（検出し続けなければならない）
  { raw: '日本蓄電池株式会社', core: '日本蓄電池', want: true, why: 'コア＋法人格＝同一社' },
  { raw: '株式会社テス', core: 'テス', want: true, why: '法人格＋コア＝同一社' },
  { raw: '宮城白石蓄電所合同会社（代表:IBeeT・東急が共同出資）', core: '東急', want: true, why: '区切り文字に挟まれた言及' },
  { raw: '九州電力・NExT-eSolutions（リユース電池）', core: '九州電力', want: true, why: '先頭＋区切り' },
  { raw: 'エネルギーパワー', core: 'エネルギーパワー', want: true, why: '完全一致' },
  // ── 偽陽性（拾ってはならない）
  { raw: '宮城白石蓄電所合同会社（代表:IBeeT・東急不動産が共同出資）', core: '東急', want: false, why: '★本件の実データ。東急 ⊂ 東急不動産 の前方一致' },
  { raw: '東急不動産株式会社', core: '東急', want: false, why: '前方一致（別法人）' },
  { raw: 'サステナブルホールディングス株式会社', core: 'テナブル', want: false, why: '語中一致' },
];

function runBoundaryRegression(): string[] {
  const problems: string[] = [];
  let ok = 0;
  for (const c of BOUNDARY_CASES) {
    const got = mentionsCoreWithBoundary(c.raw, c.core);
    if (got === c.want) { ok++; continue; }
    problems.push(`境界判定 ${c.core} ⇢「${c.raw}」期待=${c.want} 実際=${got}（${c.why}）`);
  }
  const tp = BOUNDARY_CASES.filter((c) => c.want).length;
  console.log(`  ${problems.length === 0 ? '✅' : '❌'} 境界判定の回帰: ${ok}/${BOUNDARY_CASES.length} PASS（真陽性ケース ${tp}件を含む）`);
  for (const p of problems) console.log(`      ${p}`);
  return problems;
}

/**
 * NFKC 正規化の回帰（Ck2h §6・2026-10-07）。全角/半角の違いで実在の紐付けを落とさず、前方一致（東急⊂東急不動産）も増やさないこと。
 * 正規化の前（10/6 まで）のコードでは上 5 件が期待と逆になる＝正規化を外すと FAIL する否定テスト。
 */
const NFKC_CASES: Array<{ got: () => unknown; want: unknown; why: string }> = [
  { got: () => mentionsOperator('三次蓄電所は、グリーンエナジー＆カンパニーのグループが保有する', '株式会社グリーンエナジー&カンパニー'), want: true, why: '全角＆⇔半角&' },
  { got: () => normalizeEntityName('株式会社ＩＢｅｅＴ') === normalizeEntityName('IBeeT'), want: true, why: '全角英字のマスタ（pr-co110152）' },
  { got: () => resolveStructuredEntities('合同会社クラダシ・インベストメント2号（グリーンエナジー＆カンパニー×クラダシ）', buildEntityIndex(['株式会社グリーンエナジー&カンパニー'])).length, want: 1, why: '括弧内の出資者（全角＆）' },
  { got: () => mentionsCoreWithBoundary('Ｊ＆Ｓ蓄電合同会社', normalizeEntityName('J&S蓄電合同会社')), want: true, why: '検出器も同じ正規化' },
  { got: () => detectInvolvementRoles('x', '<p>㈱ＧＲＥＥＮ ＡＣＴＩＯＮがアグリゲーションを担う</p>', '株式会社GREEN ACTION').join(), want: '運用・最適化', why: '全角の社名表記（㈱＋全角英字）を本文から検出する' },
  // ㈱ 10 個は正規化で 30 字（+20）。本当の距離 70 字（> 60）を、正規化していない文単位で測ると 50 字（≤ 60）に縮む＝位置がずれると誤って帰属する
  { got: () => detectInvolvementRoles('x', `<p>${'㈱'.repeat(10)}GREEN ACTION${'あ'.repeat(70)}アグリゲーション</p>`, '株式会社GREEN ACTION').join(), want: '', why: '㈱→(株) で長さが変わっても位置がずれない（文単位も同じ正規化）' },
  { got: () => mentionsOperator('東急不動産株式会社', '東急株式会社'), want: false, why: 'NFKC 後も前方一致は採らない' },
  { got: () => resolveStructuredEntities('東急不動産', buildEntityIndex(['東急株式会社'])).length, want: 0, why: '構造化欄の前方一致禁止' },
];

function runNfkcRegression(): string[] {
  const problems: string[] = [];
  for (const c of NFKC_CASES) {
    const got = c.got();
    if (got !== c.want) problems.push(`NFKC ${c.why} 期待=${String(c.want)} 実際=${String(got)}`);
  }
  console.log(`  ${problems.length === 0 ? '✅' : '❌'} NFKC 正規化の回帰: ${NFKC_CASES.length - problems.length}/${NFKC_CASES.length} PASS`);
  for (const p of problems) console.log(`      ${p}`);
  return problems;
}

/**
 * 案件の EPC の欄から「関与する案件（EPC・施工）」を決める判定の回帰（2026-11-22・_QUEUE.md 136 行）。
 * ① 欄が結び付く会社に付く／② 欄に値がある案件では、本文からの「EPC・施工」を欄の会社だけに残す。欄が空なら本文の判定のまま。
 */
type EpcCase = { operatorField: string | null; epc: string | null; body?: string; masters: string[]; op: string; want: string; why: string };
const TOKUMAN_BODY =
  '<p>同リリースの「本蓄電所の概要」は「事業者　合同会社佐賀とくまんパワー／EPC事業者　株式会社クローバー・テクノロジーズ／所在地　佐賀県佐賀市／PCS　HUAWEI／EMS　デジタルグリッド株式会社／EPC契約日　2026年7月1日」と記載している。</p>';
const SAKABE_BODY = '<p>株式会社パワーエックスが蓄電システムを提供、EPC（設置工事）は株式会社サンヴィレッジが担う。</p>';
const TOKYU = ['株式会社サンヴィレッジ', '株式会社東急パワーサプライ', '東急株式会社'];
const HITACHI = ['日立エナジー株式会社', '株式会社日立製作所', '株式会社日立産機システム'];
const TESS = ['テス・エンジニアリング株式会社', '株式会社テス', 'JFEエンジニアリング株式会社', '四電エンジニアリング株式会社'];
const TC_GROUP = '東京センチュリー株式会社のグループ企業';
const DG = ['デジタルグリッド株式会社', '株式会社クローバー・テクノロジーズ'];
const TOKUMAN = '合同会社佐賀とくまんパワー';
const EPC_CASES: EpcCase[] = [
  { operatorField: '東急パワーサプライ', epc: '株式会社サンヴィレッジ', masters: TOKYU, op: '株式会社サンヴィレッジ', want: 'EPC・施工', why: 'EPC の欄の会社に付く（御前崎）' },
  { operatorField: '東急パワーサプライ', epc: '株式会社サンヴィレッジ', masters: TOKYU, op: '株式会社東急パワーサプライ', want: '', why: '保有している会社には出ない' },
  { operatorField: '東急パワーサプライ', epc: '株式会社サンヴィレッジ', masters: TOKYU, op: '東急株式会社', want: '', why: '別の会社（東急⊂東急パワーサプライ）に付かない' },
  { operatorField: '株式会社サンヴィレッジ', epc: '株式会社サンヴィレッジ', masters: TOKYU, op: '株式会社サンヴィレッジ', want: '', why: '自社で建てて持つ会社には、関与を重ねない' },
  { operatorField: '四国電力', epc: '日立エナジー・日立製作所', masters: HITACHI, op: '日立エナジー株式会社', want: 'EPC・施工', why: '2 社を並べた欄（1 社目）' },
  { operatorField: '四国電力', epc: '日立エナジー・日立製作所', masters: HITACHI, op: '株式会社日立製作所', want: 'EPC・施工', why: '2 社を並べた欄（2 社目）' },
  { operatorField: '四国電力', epc: '日立エナジー・日立製作所', masters: HITACHI, op: '株式会社日立産機システム', want: '', why: '名前の一部が重なるだけの別の会社' },
  { operatorField: 'KG BESS合同会社', epc: 'サンヴィレッジ', masters: TOKYU, op: '株式会社サンヴィレッジ', want: 'EPC・施工', why: '法人格の無い欄' },
  { operatorField: TC_GROUP, epc: 'テス・エンジニアリング', masters: TESS, op: 'テス・エンジニアリング株式会社', want: 'EPC・施工', why: '名前に「・」がある会社' },
  { operatorField: TC_GROUP, epc: 'テス・エンジニアリング', masters: TESS, op: 'JFEエンジニアリング株式会社', want: '', why: '「エンジニアリング」が重なるだけの別の会社' },
  { operatorField: TC_GROUP, epc: 'テス・エンジニアリング', masters: TESS, op: '四電エンジニアリング株式会社', want: '', why: '「エンジニアリング」が重なるだけの別の会社' },
  { operatorField: TC_GROUP, epc: 'テス・エンジニアリング', masters: TESS, op: '株式会社テス', want: '', why: '「テス」が重なるだけの別の会社' },
  { operatorField: TOKUMAN, epc: 'クローバー・テクノロジーズ', body: TOKUMAN_BODY, masters: DG, op: 'デジタルグリッド株式会社', want: '', why: '② 隣の欄の「EPC契約日」で付いた役割を外す' },
  { operatorField: TOKUMAN, epc: 'クローバー・テクノロジーズ', body: TOKUMAN_BODY, masters: DG, op: '株式会社クローバー・テクノロジーズ', want: 'EPC・施工', why: '② EPC の欄の会社には付く' },
  { operatorField: TOKUMAN, epc: '', body: TOKUMAN_BODY, masters: DG, op: 'デジタルグリッド株式会社', want: 'EPC・施工', why: 'EPC の欄が空なら、本文の判定のまま（変えない）' },
  { operatorField: TOKUMAN, epc: 'null', body: TOKUMAN_BODY, masters: DG, op: 'デジタルグリッド株式会社', want: 'EPC・施工', why: '文字列の "null" は空として扱う' },
  { operatorField: 'JMES BESS ONE合同会社', epc: 'サンヴィレッジ', body: SAKABE_BODY, masters: ['株式会社パワーエックス', '株式会社サンヴィレッジ'], op: '株式会社パワーエックス', want: '機器供給', why: '② ほかの役割（機器供給）は残す' },
  { operatorField: 'JMES BESS ONE合同会社', epc: 'パワーエックス', body: '<p>株式会社パワーエックスが蓄電システムを提供する。</p>', masters: ['株式会社パワーエックス'], op: '株式会社パワーエックス', want: 'EPC・施工・機器供給', why: '本文の役割と合わせ、順は決まりのまま' },
  { operatorField: null, epc: '株式会社GRITZ', masters: ['株式会社ＧＲＩＴＺ'], op: '株式会社ＧＲＩＴＺ', want: '', why: '事業者の欄が空の案件には足さない（ページの文が「保有していません」のため）' },
  { operatorField: '日本蓄電池', epc: '株式会社GRITZ', masters: ['株式会社ＧＲＩＴＺ'], op: '株式会社ＧＲＩＴＺ', want: 'EPC・施工', why: '全角のマスタ名（事業者の欄に値があるとき）' },
];

function runEpcRegression(): string[] {
  const problems: string[] = [];
  for (const c of EPC_CASES) {
    const index = buildEntityIndex(c.masters);
    // 保有の判定は precompute-operators-detail と同じ（構造化の完全一致 ∪ projectOperatorMatches）
    const owner = c.operatorField ?? '';
    const owned = resolveStructuredEntities(owner, index).includes(c.op) || projectOperatorMatches(owner, c.op);
    const got = involvementRolesFor({ name: 'x', body: c.body ?? '', epc: c.epc, operator: c.operatorField }, c.op, [c.op], index, owned).join('・');
    if (got !== c.want) problems.push(`EPC の欄 ${c.op} ⇢ epc「${c.epc}」期待=${c.want || '（なし）'} 実際=${got || '（なし）'}（${c.why}）`);
    // EPC の欄が空の案件は、本文の判定と同じ
    if (!c.epc && !owned) {
      const body = detectInvolvementRoles('x', c.body, c.op).join('・');
      if (got !== body) problems.push(`EPC の欄が空なのに本文の判定と違う ${c.op} 本文=${body} 実際=${got}`);
    }
  }
  console.log(`  ${problems.length === 0 ? '✅' : '❌'} EPC の欄からの役割の回帰: ${EPC_CASES.length - problems.length}/${EPC_CASES.length} PASS`);
  for (const p of problems) console.log(`      ${p}`);
  return problems;
}

type FalseNegative = { operator: string; key: string; value: string };
type Audit = {
  totals: Record<string, number>;
  falseNegativeProjects: FalseNegative[];
  falseNegativeNews: FalseNegative[];
  overreach: Record<string, { title: number; project: number }>;
};

/** 暴発の上限（実測値・2026-08-09）。素の部分一致に戻すと ポート=174本 に跳ねる。 */
const OVERREACH_LIMIT: Record<string, number> = {
  ポート株式会社: 0,
  パス株式会社: 0,
  株式会社テス: 3,
  東急株式会社: 3,
};

function main(): void {
  const auditPath = path.join(process.cwd(), 'src', 'lib', 'generated', 'operators-match-audit.json');
  if (!fs.existsSync(auditPath)) {
    console.error(`[verify-operator-matching] 監査データがありません: ${auditPath}`);
    console.error('  先に npm run build:operators-detail を実行してください。');
    process.exit(1);
  }
  const audit: Audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const problems: string[] = [];

  console.log('[verify-operator-matching] 突合の回帰検査');
  console.log(
    `  対象: operators=${audit.totals.operators} projects=${audit.totals.projectsVisible} news=${audit.totals.newsTotal}`
  );
  console.log(`  接続: project=${audit.totals.projectLinks}件 news=${audit.totals.newsLinks}件`);

  // 0) 検出器そのものの回帰（境界判定・真陽性を隠していないか）
  problems.push(...runBoundaryRegression());
  problems.push(...runNfkcRegression());
  problems.push(...runEpcRegression());

  // 1) 偽陰性（0件表示なのに構造化フィールドに社名が現れる）
  for (const [label, rows] of [
    ['projects', audit.falseNegativeProjects],
    ['news', audit.falseNegativeNews],
  ] as const) {
    if (rows.length === 0) {
      console.log(`  ✅ 偽陰性(${label}) = 0件`);
    } else {
      console.log(`  ❌ 偽陰性(${label}) = ${rows.length}件`);
      for (const r of rows) console.log(`      ${r.operator} ⇢ ${r.key}「${r.value}」`);
      problems.push(`偽陰性(${label}) ${rows.length}件`);
    }
  }

  // 2) 暴発（短い社名が本文・事業者欄で暴れていないか）
  for (const [name, limit] of Object.entries(OVERREACH_LIMIT)) {
    const m = audit.overreach[name];
    if (!m) {
      console.log(`  －  暴発チェック ${name}: 事業者マスタに未登録（スキップ）`);
      continue;
    }
    if (m.title <= limit) {
      console.log(`  ✅ 暴発チェック ${name}: title一致=${m.title}本（上限${limit}） project=${m.project}件`);
    } else {
      console.log(`  ❌ 暴発チェック ${name}: title一致=${m.title}本 > 上限${limit}`);
      problems.push(`暴発 ${name} ${m.title}本`);
    }
  }

  if (problems.length) {
    console.error(`\n[verify-operator-matching] FAIL: ${problems.join(' / ')}`);
    process.exit(1);
  }
  console.log('\n[verify-operator-matching] PASS');
}

main();

export {};
