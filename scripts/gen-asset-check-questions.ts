#!/usr/bin/env tsx
/**
 * scripts/gen-asset-check-questions.ts — /tools/asset-check の設問定義を、T2 設問研究便の data.json から生成する（T2 実装便・2026-10-10）
 *
 * 入力: reports/tool-asset-check-questions-2026-10-10.data.json の questions（40 問・一次は 2026-10-10 に取り直して照合済み）
 * 出力: src/data/asset-check-questions.ts（★手で編集しない。直すときは data.json か、このスクリプトの対応表を直して再生成する）
 *
 * 便の指示（T2 実装便 §0）: 設問の文・一次・「なぜ」・「次にやること」は data.json から機械的に生成する（手で写さない）。予備は入れない。
 *
 * 生成の規則
 *   - 一次の URL: e-Gov 法令 API（/api/1/lawdata/<ID>）は読み手が開ける法令ページ（/law/<ID>）に替える。
 *     リポ内の一次（当サイトの台帳の定義）は public_url（当サイトの公開ページ）へリンクし、「当サイトの定義」として出す（リポのパスは出さない）。
 *   - 出典欄の資料名（docName）は、一次の表題を 2026-10-10 に取って確かめたもの（下の DOC_BY_URL）。台帳 src/data/source-documents.json に登録する。
 *
 * 実行: npx tsx scripts/gen-asset-check-questions.ts          （書き出す）
 *       npx tsx scripts/gen-asset-check-questions.ts --check  （書き出さずに、既存の出力と一致するかだけ見る。不一致なら exit 1）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'reports', 'tool-asset-check-questions-2026-10-10.data.json');
const OUT = path.join(ROOT, 'src', 'data', 'asset-check-questions.ts');
const CHECK = process.argv.includes('--check');

type Primary = { name: string; issuer?: string; url: string; where: string; quote?: string; verified: string; public_url?: string | null };
type Q = {
  id: string;
  axis: string;
  axis_label: string;
  question: string;
  options: string[];
  applies_when: string;
  answer_note: string | null;
  why: string;
  next_action: string;
  primary: Primary;
  other_primaries: Primary[];
  strength: string;
};

/** 出典欄に「」で出す資料名と発行元（一次の表題を 2026-10-10 に実機で確認。台帳 source-documents.json の name と一致させる） */
const DOC_BY_URL: Record<string, { docName: string; publisher: string }> = {
  'https://laws.e-gov.go.jp/api/1/lawdata/129AC0000000089': { docName: '民法', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/324AC0000000100': { docName: '建設業法', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/324AC0000000193': { docName: '水防法', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/324M50004000014': { docName: '建設業法施行規則', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/339AC0000000170': { docName: '電気事業法', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/340M50000400054': { docName: '電気関係報告規則', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/343AC0000000098': { docName: '騒音規制法', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/343AC0000000100': { docName: '都市計画法', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/412AC0000000057': { docName: '土砂災害警戒区域等における土砂災害防止対策の推進に関する法律', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/420AC0000000056': { docName: '保険法', publisher: 'e-Gov 法令検索' },
  'https://laws.e-gov.go.jp/api/1/lawdata/423AC0000000123': { docName: '津波防災地域づくりに関する法律', publisher: 'e-Gov 法令検索' },
  'https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/S100T65O.pdf': { docName: '有価証券報告書（内国投資証券）第12期', publisher: '東京インフラ・エネルギー投資法人（EDINET）' },
  'https://nw.tohoku-epco.co.jp/consignment/request/emit/pdf/zz1.pdf': { docName: '接続検討申込および系統連系申込に必要な様式および資料【高圧】', publisher: '東北電力ネットワーク' },
  'https://sii.or.jp/chikudenchi07r/uploads/R7r_kess_kouboyouryou.pdf': { docName: '令和７年度補正 系統用蓄電システム等導入支援事業 公募要領', publisher: '環境共創イニシアチブ（SII）' },
  'https://www.city.hamamatsu.shizuoka.jp/documents/13411/youkou.pdf': { docName: '浜松市適正な蓄電池設備の設置等に関する要綱', publisher: '浜松市' },
  'https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/pdf/keitou_kangaekata_20260401.pdf': { docName: '系統情報の公表の考え方', publisher: '資源エネルギー庁' },
  'https://www.eprx.or.jp/outline/docs/guide_ver.10_260701.pdf': { docName: '取引ガイド（全商品）', publisher: '電力需給調整力取引所（EPRX）' },
  'https://www.mlit.go.jp/common/000993022.pdf': { docName: '蓄電池を収納する専用コンテナに係る建築基準法の取扱いについて（技術的助言）', publisher: '国土交通省住宅局建築指導課長' },
  'https://www.ms-ins.com/pdf/business/cost/kigyo-hiyou.pdf': { docName: '企業費用・利益総合保険のご案内', publisher: '三井住友海上火災保険' },
  'https://www.occto.or.jp/assets/260902_boshuyoukou_long_2026.pdf': { docName: '容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）', publisher: '電力広域的運営推進機関（OCCTO）' },
  'https://www.occto.or.jp/assets/access/oshirase/2018/files/20250123_n-1densei.pdf': { docName: '流通設備の整備計画の策定（送配電等業務指針第５５条関連）におけるＮ－１電制の考え方について', publisher: '電力広域的運営推進機関（OCCTO）' },
  'https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf': { docName: '送配電等業務指針', publisher: '電力広域的運営推進機関（OCCTO）' },
  'https://www.occto.or.jp/grid/assets/NF_setuzokuriyou_20260710.pdf': { docName: '系統の接続および利用ルールについて ～ノンファーム型接続～', publisher: '電力広域的運営推進機関（OCCTO）' },
  'https://www.occto.or.jp/institution/access/kentou/access_process.html': { docName: '発電設備等系統アクセスの流れ', publisher: '電力広域的運営推進機関（OCCTO）' },
  'https://www.sonpo.or.jp/sme_insurance/corporate-property/': { docName: '企業財産のリスク', publisher: '日本損害保険協会（企業のための保険ナビ）' },
};

/** 一次の種類（data の strength の先頭語）→ 画面の表示 */
const STRENGTH_LABEL: Record<string, string> = {
  law: '法令',
  'market-operator-rule': '系統・市場の運営機関の規程・様式',
  'site-definition': '当サイトの定義',
  'government-guideline': '官公庁の資料',
  'insurer-public': '保険会社の公開資料',
  'public-dd-or-finance': '公開の融資・投資資料',
};

/**
 * 表示の整え（data.json の研究記録はそのまま残し、画面に出す文だけを整える＝規則をここに置く・T2 実装便のレビュー指摘）
 *   - 「ほかの一次」の名前に残る調べの段階の候補番号（「（C7 から統合）」「・G6 から統合）」「（B1 から）」）を外す。
 *     画面にある問いの番号（A1〜H8）と同じ形なので、読み手は抜けた問いがあるように読んでしまう。
 *   - 該当箇所に残る検証の手順の注記（「（XML の … で確認）」「（CreationDate … ModDate …）」）を外す。
 */
const stripMergeIds = (s: string) =>
  s
    .replace(/（[A-H]\d+(?:／[A-H]\d+)* から(?:統合)?）/g, '')
    .replace(/・[A-H]\d+(?:／[A-H]\d+)* から(?:統合)?）/g, '）')
    .replace(/（）/g, '')
    .trim();
const stripCheckNotes = (s: string) =>
  s
    .replace(/（XML の[^）]*で確認）/g, '')
    .replace(/（CreationDate[^）]*）/g, '')
    .trim();

const egovLaw = (u: string) => {
  const m = u.match(/^https:\/\/laws\.e-gov\.go\.jp\/api\/1\/lawdata\/([0-9A-Z]+)$/);
  return m ? `https://laws.e-gov.go.jp/law/${m[1]}` : u;
};

type OutPrimary = { name: string; issuer: string; href: string; where: string; quote: string | null; siteDefinition: boolean; docName: string | null };
function toPrimary(p: Primary): OutPrimary | null {
  if (p.url.startsWith('http')) {
    const doc = DOC_BY_URL[p.url] ?? null;
    // 発行元は台帳と同じ書き方（DOC_BY_URL.publisher）にそろえる（data の issuer には「e-Gov 法令 API v1・法令ID …」など調べの記録が混じる）
    return { name: stripMergeIds(p.name), issuer: doc?.publisher ?? p.issuer ?? '', href: egovLaw(p.url), where: stripCheckNotes(p.where), quote: p.quote ?? null, siteDefinition: false, docName: doc?.docName ?? null };
  }
  if (p.public_url) {
    // リポ内の定義は、逐語（コードの断片）は出さず、当サイトの公開ページへ
    return { name: p.name, issuer: '蓄電所ネット（当サイト）', href: p.public_url, where: '', quote: null, siteDefinition: true, docName: null };
  }
  return null;
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8')) as { questions: Q[] };
const problems: string[] = [];
const questions = data.questions.map((q) => {
  const primary = toPrimary(q.primary);
  if (!primary) problems.push(`${q.id}: 主の一次のリンク先が決まらない（${q.primary.url}）`);
  if (q.primary.url.startsWith('http') && !DOC_BY_URL[q.primary.url]) problems.push(`${q.id}: 出典欄の資料名が対応表に無い（${q.primary.url}）`);
  // 他の一次は http のものだけ（名称と開けるリンク）。当サイトの定義は主の一次で出す
  const others = q.other_primaries
    .filter((x) => x.url.startsWith('http'))
    .map((x) => ({ name: stripMergeIds(x.name), href: egovLaw(x.url) }))
    .filter((x, i, a) => a.findIndex((y) => y.href === x.href && y.name === x.name) === i);
  const strengthKey = q.strength.split(/[（＋\s]/)[0];
  if (!STRENGTH_LABEL[strengthKey]) problems.push(`${q.id}: 一次の種類が不明（${q.strength}）`);
  return {
    id: q.id,
    axis: q.axis,
    question: q.question,
    allowsNotApplicable: q.options.includes('該当しない'),
    appliesWhen: q.applies_when,
    answerNote: q.answer_note,
    why: q.why,
    nextAction: q.next_action,
    strength: STRENGTH_LABEL[strengthKey] ?? q.strength,
    primary,
    others,
  };
});
const axes = [...new Map(data.questions.map((q) => [q.axis, q.axis_label])).entries()].map(([key, label]) => ({ key, label }));

if (problems.length) {
  console.error('[gen-asset-check-questions] 生成できない:\n  ' + problems.join('\n  '));
  process.exit(1);
}

const header = `/**
 * src/data/asset-check-questions.ts — /tools/asset-check（蓄電所 評価軸セルフチェック）の設問定義
 *
 * ★自動生成（scripts/gen-asset-check-questions.ts）。手で編集しない。
 *   出どころ: reports/tool-asset-check-questions-2026-10-10.data.json（T2 設問研究便・一次は 2026-10-10 に取り直して照合済み）
 *   直すときは data.json か生成スクリプトの対応表を直し、\`npx tsx scripts/gen-asset-check-questions.ts\` で再生成する。
 *   検査 \`npm run verify:asset-check\` が、この出力と data.json からの再生成の一致を確かめる。
 */
`;
const body = `
export type AssetCheckAxisKey = ${axes.map((a) => `'${a.key}'`).join(' | ')};

export type AssetCheckPrimary = {
  /** 一次の名称（条・節まで） */
  name: string;
  issuer: string;
  /** 読み手が開けるリンク（当サイトの定義は当サイトの公開ページ） */
  href: string;
  /** 該当箇所（当サイトの定義は空） */
  where: string;
  /** 一次の逐語（当サイトの定義は null） */
  quote: string | null;
  /** 主たる裏づけが当サイトの定義（当サイトの想定）か */
  siteDefinition: boolean;
  /** 出典欄に「」で出す資料名（当サイトの定義は null） */
  docName: string | null;
};

export type AssetCheckQuestion = {
  id: string;
  axis: AssetCheckAxisKey;
  question: string;
  /** 「該当しない」を選べるか（当てはまる条件がある 19 問） */
  allowsNotApplicable: boolean;
  appliesWhen: string;
  answerNote: string | null;
  why: string;
  nextAction: string;
  /** 主の一次の種類（法令・系統と市場の運営機関の規程と様式・当サイトの定義 など） */
  strength: string;
  primary: AssetCheckPrimary;
  others: { name: string; href: string }[];
};

export const ASSET_CHECK_AXES: { key: AssetCheckAxisKey; label: string }[] = ${JSON.stringify(axes, null, 2)};

export const ASSET_CHECK_QUESTIONS: AssetCheckQuestion[] = ${JSON.stringify(questions, null, 2)};
`;
const out = header + body;

if (CHECK) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
  if (cur !== out) {
    console.error('[gen-asset-check-questions] src/data/asset-check-questions.ts が data.json からの生成結果と違う（手で直したか、data.json が変わった）');
    process.exit(1);
  }
  console.log(`[gen-asset-check-questions] ok  出力は data.json からの生成結果と一致（${questions.length} 問・${axes.length} 軸）`);
} else {
  fs.writeFileSync(OUT, out);
  console.log(`[gen-asset-check-questions] 書き出し: ${path.relative(ROOT, OUT)}（${questions.length} 問・${axes.length} 軸）`);
}
