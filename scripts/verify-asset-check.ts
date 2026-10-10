#!/usr/bin/env tsx
/**
 * scripts/verify-asset-check.ts — /tools/asset-check（蓄電所 評価軸セルフチェック）の否定テスト（T2 実装便・2026-10-10）
 *
 * 報告 reports/tool-asset-check-questions-2026-10-10.md の (2)「否定テストの案」と裁定 R1・R2・R7・R9 を機械で確かめる。
 *   1. 設問の定義（src/data/asset-check-questions.ts）が data.json からの生成結果と一致（手で直していない）
 *   2. 数: 8 軸 × 5 問＝40 問・「該当しない」を選べる問い 19・3 択 21（data.json の options の数で判定＝applies_when の文頭では見ない）
 *   3. 前提の質問（PREMISES）が自動で「該当しない」にする問い＝「該当しない」を選べる 19 問とちょうど一致・選択肢ごとの正解表（applies_when から書き起こし）と完全一致・注記のキーが実在
 *   4. 採点: 全部はい→100%／全部不明→50%／全部いいえ→0%／全部該当しない（選べる問いだけ）→ 全問が該当しない軸は「対象外」・NaN にならない／
 *      混在の検算／未回答は数えない／「該当しない」を選べない問いの na は無視／前提からの自動判定と手での上書き
 *   5. リポ内の一次（data.json の repo_ref）の行に逐語が今もある（台帳の改版で行がずれたら検出）
 *   6. 出典欄の資料名（docName）が台帳 src/data/source-documents.json に登録されている（name か別名）
 *   7. 画面に出る文に、順位・格付け・良し悪しの語が無い（免責の決まった言い回しは除く）・比較の対象になりうる事業者名が無い（R9: 一次の発行元は許可）
 *   8. 入力を保存・送信する API を使っていない（localStorage・cookie・fetch・sendBeacon・URL への書き込み など）
 *   9. （--html <ビルド出力の HTML> を渡したとき）初期 DOM に 40 問の文・冒頭 1 行・前提の質問 9 つがあり、禁止語が無い
 * 警告のみ（exit 0）。--strict で問題があれば exit 1。一次 URL の生死はネットワークを使うので別（scripts/verify-asset-check-urls.ts・手で回す）。
 *
 * 実行: npm run verify:asset-check（prebuild でも走る）
 *       npx tsx scripts/verify-asset-check.ts --html .next/server/app/tools/asset-check.html
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ASSET_CHECK_AXES, ASSET_CHECK_QUESTIONS } from '../src/data/asset-check-questions';
import {
  PREMISES,
  QUESTION_NOTES,
  DELEGATED_TO_FIRE_RISK_CHECK,
  FIRE_RISK_DISCLAIMER,
  answerOptions,
  autoNotApplicable,
  effectiveAnswers,
  summarizeAxes,
  formatAxisValue,
  type AssetCheckAnswer,
} from '../src/lib/asset-check';
export {};

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const htmlArg = process.argv.indexOf('--html');
const HTML = htmlArg >= 0 ? process.argv[htmlArg + 1] : null;
const DATA = path.join(ROOT, 'reports', 'tool-asset-check-questions-2026-10-10.data.json');
const LEDGER = path.join(ROOT, 'src', 'data', 'source-documents.json');
const OPERATORS = path.join(ROOT, 'src', 'lib', 'generated', 'operators-detail-index.json');

/** 画面に出してはいけない語（評価・格付け・良し悪し）。決まった免責の言い回しは除いてから見る（検査 7 と 9 で共有） */
const ALLOWED_PHRASES = ['評価・格付けではありません', '評価・格付けや融資・保険の可否を示すものではありません', '良し悪しではありません'];
const BANNED_WORDS = ['順位', 'ランク', '格付け', '優良', '良好', '低リスク', '高リスク', 'スコア', '偏差値', 'おすすめ', '業界平均', '上位', '下位', '良い', '悪い', '良し悪し'];
const withoutAllowed = (s: string) => ALLOWED_PHRASES.reduce((acc, a) => acc.split(a).join(''), s);
/** 調べの経緯・内部の言い回し（画面に出さない） */
const INTERNAL_RE = [/本便/, /[A-H]\d+(?:／[A-H]\d+)* から/, /XML の/, /API v1/, /ModDate/, /CreationDate/, /統合した/, /の編で確かめた/, /起点の書き方/];
// コードの定数名（例: LEDGER_RATE_COLUMNS）がデータや画面の文に出ない。ソースの文字列リテラルは ${…} に定数名を含むので見ない
const CODE_NAME_RE = /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/;
/** 比較の対象になりうる蓄電池・PCS のメーカー（当サイトの事業者 DB に無い名前も見る・R9） */
const MAKERS = ['CATL', 'BYD', 'Tesla', 'LG Energy', 'Samsung SDI', 'Sungrow', 'Huawei', 'Fluence', 'Wärtsilä', 'Hithium', 'CALB', 'Gotion', 'EVE Energy', 'REPT', 'Envision', 'パナソニック', 'GSユアサ', 'エリーパワー'];

const problems: string[] = [];
const notes: string[] = [];
let checks = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) problems.push(msg);
};

type DataQ = { id: string; options: string[]; primary: DataP; other_primaries: DataP[] };
type DataP = { name: string; quote?: string; repo_ref?: { path: string; lines: number[] } | null };
const data = JSON.parse(fs.readFileSync(DATA, 'utf8')) as { questions: DataQ[] };
const Q = ASSET_CHECK_QUESTIONS;
const ids = Q.map((q) => q.id);

// 1. 生成結果との一致
{
  const r = spawnSync(process.execPath, [path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs'), path.join(ROOT, 'scripts', 'gen-asset-check-questions.ts'), '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  ok(r.status === 0, `設問の定義が data.json からの生成結果と違う（npx tsx scripts/gen-asset-check-questions.ts で作り直す）: ${(r.stderr || r.stdout || '').trim().slice(0, 200)}`);
}

// 2. 数
ok(ASSET_CHECK_AXES.length === 8, `軸が 8 でない（${ASSET_CHECK_AXES.length}）`);
ok(Q.length === 40, `設問が 40 でない（${Q.length}）`);
for (const a of ASSET_CHECK_AXES) ok(Q.filter((q) => q.axis === a.key).length === 5, `軸 ${a.key} の設問が 5 でない`);
ok(new Set(ids).size === ids.length, '設問 id が重複している');
const naIds = Q.filter((q) => q.allowsNotApplicable).map((q) => q.id);
ok(naIds.length === 19, `「該当しない」を選べる問いが 19 でない（${naIds.length}）`);
const dataById = new Map(data.questions.map((d) => [d.id, d]));
for (const q of Q) {
  const d = dataById.get(q.id);
  ok(!!d, `${q.id}: data.json に無い`);
  if (!d) continue;
  ok(answerOptions(q).length === d.options.length, `${q.id}: 選択肢の数が data.json（${d.options.length}）と違う`);
  ok(answerOptions(q).includes('na') === d.options.includes('該当しない'), `${q.id}: 「該当しない」の有無が data.json と違う`);
}
ok(Q.filter((q) => answerOptions(q).length === 3).length === 21, '3 択の問いが 21 でない');

// 3. 前提の質問の自動判定がちょうど 19 問を覆う
{
  const covered = new Set<string>();
  for (const p of PREMISES) {
    for (const [v, list] of Object.entries(p.notApplicable)) {
      ok(p.options.some((o) => o.value === v), `前提 ${p.key}: 選択肢に無い値 ${v} に割り当てがある`);
      for (const id of list) {
        ok(ids.includes(id), `前提 ${p.key}: 存在しない問い ${id}`);
        ok(naIds.includes(id), `前提 ${p.key}: 「該当しない」を選べない問い ${id} を該当しないにしている`);
        covered.add(id);
      }
    }
  }
  ok(PREMISES.length === 9, `前提の質問が 9 でない（${PREMISES.length}）`);
  const missing = naIds.filter((id) => !covered.has(id));
  ok(missing.length === 0, `前提の質問から自動で「該当しない」にならない問いがある: ${missing.join('・')}`);

  // 正解表: 前提の選択肢ごとに「該当しない」になる問い（各問の applies_when から書き起こした。対応の取り違えは覆いの検査では素通りする）
  //   E1・E4・E6＝運転を開始しているサイト／E3＝需給調整市場に参加している（いた）／E7＝需給調整市場か容量確保契約（運転前でも容量確保契約は持てる）
  //   D1＝高圧・特別高圧／D4＝特別高圧／D5＝10kW 未満の低圧を除く／F7＝賃借／F8＝借りている（その他は賃借が混じりうるので F7・F8 とも自動にしない）
  //   F1・F3＝アグリゲーターに委託／H3＝委託かつ発電事業者でない／F5＝O&M 外部委託／G2〜G4＝財物か事業中断の保険／G5＝事業中断の保険／A2＝長期脱炭素か SII
  const EXPECTED: Record<string, Record<string, string[]>> = {
    operating: { yes: [], no: ['E1', 'E3', 'E4', 'E6'] },
    voltage: { lv_small: ['D1', 'D4', 'D5'], lv: ['D1', 'D4'], hv: ['D4'], ehv: [] },
    land: { own: ['F7', 'F8'], lease: [], superficies: ['F7'], other: [] },
    aggregator: { yes: [], no: ['F1', 'F3', 'H3'] },
    om: { yes: [], no: ['F5'] },
    markets: { balancing: [], capacity: ['E3'], both: [], none: ['E3', 'E7'] },
    insurance: { both: [], property: ['G5'], bi: [], none: ['G2', 'G3', 'G4', 'G5'] },
    generationBusiness: { yes: ['H3'], no: [] },
    ltdcOrSii: { yes: [], no: ['A2'] },
  };
  let n = 0;
  for (const p of PREMISES) {
    const exp = EXPECTED[p.key];
    ok(!!exp, `前提 ${p.key}: 正解表に無い`);
    if (!exp) continue;
    ok(Object.keys(exp).length === p.options.length && p.options.every((o) => o.value in exp), `前提 ${p.key}: 選択肢が正解表と違う`);
    for (const o of p.options) {
      const got = [...autoNotApplicable({ [p.key]: o.value })].sort().join(',');
      const want = [...(exp[o.value] ?? [])].sort().join(',');
      n++;
      ok(got === want, `前提 ${p.key}=${o.value}: 自動で「該当しない」になる問いが正解表と違う（実装 ${got || 'なし'}・正解 ${want || 'なし'}）`);
    }
  }
  notes.push(`前提の選択肢 ${n} 通り`);
  // 注記のキーが実在する問いか（打ち間違えると注記が黙って消える）
  for (const k of Object.keys(QUESTION_NOTES)) ok(ids.includes(k), `注記のキー ${k} が問いに無い`);
}

// 4. 採点
{
  const all = (a: AssetCheckAnswer) => Object.fromEntries(Q.map((q) => [q.id, a])) as Record<string, AssetCheckAnswer>;
  const sum = (answers: Record<string, AssetCheckAnswer | undefined>) => summarizeAxes(ASSET_CHECK_AXES, Q, effectiveAnswers(Q, answers, {}));
  for (const [a, want] of [['yes', 100], ['unknown', 50], ['no', 0]] as const) {
    for (const s of sum(all(a))) ok(s.status === 'value' && s.percent === want, `全部「${a}」で軸 ${s.axis} が ${want}% でない（${formatAxisValue(s)}）`);
  }
  // 全部「該当しない」（選べる問いだけ・ほかは はい）
  const naAll = Object.fromEntries(Q.map((q) => [q.id, q.allowsNotApplicable ? 'na' : 'yes'])) as Record<string, AssetCheckAnswer>;
  for (const s of sum(naAll)) {
    const allNa = Q.filter((q) => q.axis === s.axis).every((q) => q.allowsNotApplicable);
    if (allNa) ok(s.status === 'notApplicable' && s.percent === null && formatAxisValue(s) === '対象外', `全問が該当しないの軸 ${s.axis} が「対象外」にならない（${formatAxisValue(s)}）`);
    else ok(s.status === 'value' && s.percent === 100 && Number.isFinite(s.percent as number), `軸 ${s.axis}: 該当しないを除いた割合が 100% でない`);
    ok(s.applicable === s.total - s.notApplicable, `軸 ${s.axis}: 該当する問いの数が合わない`);
  }
  // 混在の検算（A: A2 該当しない・A1 はい・A3 いいえ・A5 不明・A6 はい → (1+0+0.5+1)/4 = 62.5%）
  const mix = sum({ A1: 'yes', A2: 'na', A3: 'no', A5: 'unknown', A6: 'yes' }).find((s) => s.axis === 'A')!;
  ok(mix.status === 'value' && mix.percent === 62.5 && mix.applicable === 4 && mix.answered === 4, `混在の検算が合わない（A: ${mix.percent}・該当 ${mix.applicable}・回答 ${mix.answered}）`);
  // 分母は該当する問いの数（報告 (2) の式。未回答は点 0）: A1 はいだけ → 1/5 = 20%・該当 5・回答 1／何も答えていない軸は「未回答」
  const partial = sum({ A1: 'yes' });
  const pa = partial.find((s) => s.axis === 'A')!;
  ok(pa.status === 'value' && pa.percent === 20 && pa.applicable === 5 && pa.answered === 1, `分母が該当する問いの数になっていない（A: ${pa.percent}・該当 ${pa.applicable}・回答 ${pa.answered}）`);
  ok(partial.filter((s) => s.axis !== 'A').every((s) => s.status === 'unanswered' && formatAxisValue(s) === '未回答'), '何も答えていない軸が「未回答」にならない');
  // 「該当しない」を選べない問いの na は無視
  const bad = effectiveAnswers(Q, { A1: 'na' }, {});
  ok(bad.A1 === undefined, '「該当しない」を選べない問い（A1）の na が残る');
  // 前提からの自動判定と手での上書き（運転前でも E7＝容量確保契約は自動にしない）
  const auto = effectiveAnswers(Q, { E1: 'yes' }, { operating: 'no' });
  ok(auto.E3 === 'na' && auto.E1 === 'yes' && auto.E7 === undefined, `前提（運転前）の自動判定か手での上書きが違う（E1=${auto.E1}・E3=${auto.E3}・E7=${auto.E7}）`);
  // 前提を「答えない」に戻すと自動の「該当しない」は消え、手の答えは残る
  const back = effectiveAnswers(Q, { E1: 'no' }, {});
  ok(back.E3 === undefined && back.E1 === 'no', '前提を戻したときに自動の「該当しない」が残るか手の答えが消える');
  ok(autoNotApplicable({}).size === 0, '前提に答えていないのに自動で「該当しない」になる問いがある');
}

// 5. リポ内の一次の行に逐語
{
  const ns = (s: string) => s.replace(/\s+/g, '');
  let n = 0;
  for (const d of data.questions) {
    for (const p of [d.primary, ...d.other_primaries]) {
      const r = p.repo_ref;
      if (!r || !r.lines?.length || /\.(pdf|xlsx)$/.test(r.path)) continue;
      const file = path.join(ROOT, r.path);
      if (!fs.existsSync(file)) {
        problems.push(`${d.id}: リポ内の一次のファイルが無い（${r.path}）`);
        continue;
      }
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
      const text = r.lines.map((i) => lines[i - 1] ?? '').join('');
      n++;
      ok(ns(text).includes(ns(p.quote ?? '')), `${d.id}: ${r.path} の ${r.lines.join(',')} 行に逐語が無い（台帳の改版で行がずれた？）「${(p.quote ?? '').slice(0, 30)}」`);
    }
  }
  notes.push(`リポ内の一次 ${n} か所`);
}

// 6. 出典欄の資料名が台帳にある
{
  const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8')) as { documents: { name: string; aliases?: string[] }[] };
  const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, '');
  const known = new Set(ledger.documents.flatMap((d) => [d.name, ...(d.aliases ?? [])]).map(norm));
  const names = [...new Set(Q.map((q) => q.primary.docName).filter((x): x is string => !!x))];
  for (const nm of names) ok(known.has(norm(nm)), `出典欄の資料名が台帳に無い:「${nm}」`);
  notes.push(`出典欄の資料名 ${names.length} 種`);
}

// 7. 画面に出る文の禁止語・事業者名
{
  const pageSrc = fs.readFileSync(path.join(ROOT, 'src', 'app', 'tools', 'asset-check', 'page.tsx'), 'utf8');
  const compSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'AssetChecker.tsx'), 'utf8');
  const strLits = (src: string) => [...src.matchAll(/'([^'\n]*)'|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? '');
  const texts: { where: string; text: string }[] = [];
  for (const q of Q) {
    for (const [k, v] of Object.entries({ question: q.question, appliesWhen: q.appliesWhen, answerNote: q.answerNote ?? '', why: q.why, nextAction: q.nextAction })) {
      texts.push({ where: `${q.id}.${k}`, text: v });
    }
  }
  for (const [id, ns] of Object.entries(QUESTION_NOTES)) ns.forEach((n, i) => texts.push({ where: `注記 ${id}#${i}`, text: n.text }));
  for (const p of PREMISES) texts.push({ where: `前提 ${p.key}`, text: [p.question, ...p.options.map((o) => o.label)].join(' ') });
  texts.push({ where: 'fire-risk-check の断り', text: FIRE_RISK_DISCLAIMER }, { where: '任せる項目', text: DELEGATED_TO_FIRE_RISK_CHECK.map((d) => `${d.label} ${d.question}`).join('／') });
  strLits(pageSrc).forEach((t, i) => texts.push({ where: `page.tsx 文字列#${i}`, text: t }));
  strLits(compSrc).forEach((t, i) => texts.push({ where: `AssetChecker.tsx 文字列#${i}`, text: t }));
  // 一次の名前・該当箇所・発行元（画面に出る）
  for (const q of Q) {
    texts.push({ where: `${q.id}.primary`, text: [q.primary.name, q.primary.where, q.primary.issuer].join(' ') });
    q.others.forEach((o, i) => texts.push({ where: `${q.id}.others#${i}`, text: o.name }));
  }
  // 「合格」は画面の部品の文だけで見る（設問の「なぜ」は一次の要約で「審査に合格しない限り」＝長期脱炭素電源オークションの規定を含む）
  const BANNED_UI = [...BANNED_WORDS, '合格'];
  for (const t of texts) {
    const s = withoutAllowed(t.text);
    const list = /^(page\.tsx|AssetChecker\.tsx|前提|fire-risk-check|任せる)/.test(t.where) ? BANNED_UI : BANNED_WORDS;
    for (const w of list) ok(!s.includes(w), `${t.where}: 禁止語「${w}」`);
    // 調べの経緯・内部の言い回しが画面に出ない（「本便」・候補番号「C7 から統合」・検証の手順の注記）
    for (const re of INTERNAL_RE) ok(!re.test(t.text), `${t.where}: 内部の言い回し ${re}`);
    if (!/^(page\.tsx|AssetChecker\.tsx)/.test(t.where)) ok(!CODE_NAME_RE.test(t.text), `${t.where}: コードの定数名 ${(t.text.match(CODE_NAME_RE) ?? [''])[0]}`);
    for (const m of MAKERS) ok(!t.text.includes(m), `${t.where}: メーカー名「${m}」`);
  }
  // R9: 比較の対象になりうる事業者名（当サイトの事業者 DB の名前）を出さない。一次の発行元は許可
  if (fs.existsSync(OPERATORS)) {
    const ops = JSON.parse(fs.readFileSync(OPERATORS, 'utf8')) as Record<string, { operator: { name: string } }>;
    const ALLOW = ['東北電力ネットワーク', '三菱UFJ銀行', '東京インフラ・エネルギー投資法人', '三井住友海上', '東京海上日動', 'Chubb', '日本損害保険協会', 'Munich Re', '浜松市', '福島市', '電力広域的運営推進機関', '電力需給調整力取引所', '環境共創イニシアチブ', '電気安全環境研究所', '東京電力パワーグリッド', '日本規格協会'];
    const opNames = [...new Set(Object.values(ops).map((o) => o.operator?.name).filter((n): n is string => !!n && n.length >= 4))].filter((n) => !ALLOW.some((a) => a.includes(n) || n.includes(a)));
    const visible = texts.map((t) => t.text).join('\n') + '\n' + Q.flatMap((q) => [q.primary.name, q.primary.issuer, ...q.others.map((o) => o.name)]).join('\n');
    const hits = opNames.filter((n) => visible.includes(n));
    ok(hits.length === 0, `比較の対象になりうる事業者名が画面の文にある: ${hits.slice(0, 10).join('・')}`);
    notes.push(`事業者名の照合 ${opNames.length} 社`);
  } else {
    notes.push('事業者名の照合は operators-detail-index.json が無いので飛ばした（prebuild の build:operators-detail の後に走る）');
  }
}

// 8. 保存・送信の API を使っていない
{
  const files = ['src/components/AssetChecker.tsx', 'src/lib/asset-check.ts', 'src/app/tools/asset-check/page.tsx', 'src/data/asset-check-questions.ts'];
  const RE = /localStorage|sessionStorage|indexedDB|document\.cookie|\bfetch\s*\(|sendBeacon|XMLHttpRequest|useSearchParams|history\.(pushState|replaceState)|navigator\.clipboard/;
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    ok(!RE.test(src), `${f}: 入力を保存・送信しうる API を使っている（${(src.match(RE) ?? [''])[0]}）`);
  }
}

// 9. 初期 DOM（ビルド出力を渡したときだけ）
if (HTML) {
  const h = fs.readFileSync(HTML, 'utf8').replace(/<!-- -->/g, '');
  const vis = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
  const flat = vis.replace(/\s+/g, '');
  const f = (s: string) => s.replace(/\s+/g, '');
  const missing = Q.filter((q) => !flat.includes(f(q.question))).map((q) => q.id);
  ok(missing.length === 0, `初期 DOM に問いの文が無い: ${missing.join('・')}`);
  ok(flat.includes(f('評価・格付けではありません。買い手・貸し手・保険者が確かめる項目の棚卸しです。')), '初期 DOM に冒頭 1 行が無い');
  ok(flat.includes(f('入力はこの画面の中だけで使い、保存も送信もしません。')), '初期 DOM に「保存も送信もしません」が無い');
  const premiseMissing = PREMISES.filter((p) => !flat.includes(f(p.question))).map((p) => p.key);
  ok(premiseMissing.length === 0, `初期 DOM に前提の質問が無い: ${premiseMissing.join('・')}`);
  ok(new RegExp(`<svg[^>]*aria-label="${ASSET_CHECK_AXES.length} 軸の整備済みの割合`).test(h), '初期 DOM にレーダー（SVG）が無い');
  // サイト共通のヘッダ・フッタにある語は除外できないので、本文の main だけを見る（「合格」は 7 と同じく見ない）
  const main = withoutAllowed((h.match(/<main[\s\S]*?<\/main>/) ?? [''])[0].replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' '));
  for (const w of BANNED_WORDS) ok(!main.includes(w), `初期 DOM（main）に禁止語「${w}」`);
  for (const re of INTERNAL_RE) ok(!re.test(main), `初期 DOM（main）に内部の言い回し ${re}`);
  ok(!CODE_NAME_RE.test(main), `初期 DOM（main）にコードの定数名 ${(main.match(CODE_NAME_RE) ?? [''])[0]}`);
  notes.push(`初期 DOM: 問いの文 ${Q.length - missing.length}/${Q.length}`);
}

console.log(`[verify:asset-check] 検査 ${checks} 件・${notes.join('・')}`);
if (problems.length === 0) {
  console.log('[verify:asset-check] ok   設問・採点・前提・一次・禁止語・保存なし');
} else {
  console.warn(`[verify:asset-check] ★WARN ${problems.length} 件`);
  for (const p of problems.slice(0, 40)) console.warn(`   - ${p}`);
  if (problems.length > 40) console.warn(`   …ほか ${problems.length - 40} 件`);
}
process.exit(STRICT && problems.length ? 1 : 0);
