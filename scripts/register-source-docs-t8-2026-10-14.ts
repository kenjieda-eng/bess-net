#!/usr/bin/env tsx
/**
 * scripts/register-source-docs-t8-2026-10-14.ts — /tracker/balancing-rules の出典の資料名を台帳 src/data/source-documents.json に登録する（T8 実装便・一回物）
 *
 * - 台帳に無い資料名（NFKC・空白無視で照合＝verify:source-names と同じ）だけを足す。資料名ごとに 1 件（同名で URL が複数なら note に列挙）。
 * - title_verbatim・HTTP・資料の日付は、2026-10-14 に一次を取り直した結果（reports/tool-balancing-rules-2026-10-13.addendum.json の
 *   sourceMeta、C-10 の出典は rowsAdd の title_verbatim）。checked_on は取り直した日 2026-10-14。
 * - 便の指示で 2 件を取り直す: 「適正な電力取引についての指針」（固定 URL の中身が令和8年3月13日版に替わった＝title_verbatim と checked_on を更新）、
 *   「需給調整市場ガイドライン」（未登録＝資源エネルギー庁の現行版の URL で登録）。
 * - 台帳は CRLF で、配列の書き方（1 行／展開）が混在している。JSON を書き直すと無関係な行が変わるため、新しい項目は documents 配列の
 *   閉じ括弧の前に文字列で差し込み、既存の 1 件は完全一致の置換で直す（置換対象がちょうど 1 か所でなければ止める）。
 * - 既定は dry run（足す件数と名前を出すだけ）。--apply で書き込む。2 回目は「足すもの 0」になる（冪等）。
 *
 * 実行: npx tsx scripts/register-source-docs-t8-2026-10-14.ts [--apply]
 */
import fs from 'node:fs';
import path from 'node:path';
import { BALANCING_RULES, BALANCING_RULES_PENDING } from '../src/data/balancing-rules';

export {};

const ROOT = process.cwd();
const LEDGER = path.join(ROOT, 'src', 'data', 'source-documents.json');
const ADD = path.join(ROOT, 'reports', 'tool-balancing-rules-2026-10-13.addendum.json');
const APPLY = process.argv.includes('--apply');
const CHECKED_ON = '2026-10-14';
const USED_IN = 'src/data/balancing-rules.ts（/tracker/balancing-rules の一次）';

type Meta = { date: string; dateFrom: string; title_verbatim: string; http: string };
type AddSrc = { url: string; title_verbatim?: string; http?: string; date?: string; dateFrom?: string };
const add = JSON.parse(fs.readFileSync(ADD, 'utf8')) as {
  sourceMeta: Record<string, Meta>;
  rowsAdd: { sources: AddSrc[] }[];
  rowPatch: Record<string, { sourcesAppend?: AddSrc[] }>;
};
/** 取り直しの結果: sourceMeta（117 本）→ rowsAdd（C-10）→ rowPatch の sourcesAppend（レビュー後に足した出典）の順に探す */
const metaOf = (url: string): Meta | null => {
  const m = add.sourceMeta[url];
  if (m) return m;
  const extra = [...add.rowsAdd.flatMap((r) => r.sources), ...Object.values(add.rowPatch).flatMap((p) => p.sourcesAppend ?? [])];
  for (const s of extra) if (s.url === url && s.title_verbatim) return { date: s.date ?? '', dateFrom: s.dateFrom ?? '', title_verbatim: s.title_verbatim, http: s.http ?? '' };
  return null;
};

const raw = fs.readFileSync(LEDGER, 'utf8');
const ledger = JSON.parse(raw) as { documents: { name: string; aliases?: string[] }[] };
const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, '');
const known = new Set(ledger.documents.flatMap((d) => [d.name, ...(d.aliases ?? [])]).map(norm));

// 資料名 → 出典（初出の発行者・URL と、同名の URL の一覧）
const byName = new Map<string, { name: string; publisher: string; urls: string[] }>();
for (const r of [...BALANCING_RULES, ...BALANCING_RULES_PENDING]) {
  for (const s of r.sources) {
    const k = norm(s.name);
    if (known.has(k)) continue;
    const e = byName.get(k) ?? { name: s.name, publisher: s.publisher, urls: [] };
    if (!e.urls.includes(s.url)) e.urls.push(s.url);
    byName.set(k, e);
  }
}
const problems: string[] = [];
const entries: Record<string, string>[] = [];
for (const e of byName.values()) {
  const m = metaOf(e.urls[0]);
  if (!m || !m.title_verbatim) {
    problems.push(`「${e.name}」の表題の逐語が無い（${e.urls[0]}）`);
    continue;
  }
  const others = e.urls.slice(1).map((u) => {
    const mo = metaOf(u);
    return `${u}${mo?.date ? `（${mo.date}）` : ''}`;
  });
  entries.push({
    name: e.name,
    publisher: e.publisher,
    url: e.urls[0],
    title_verbatim: m.title_verbatim,
    checked_on: CHECKED_ON,
    note: `T8 実装便で登録。2026-10-14 に取り直し（HTTP ${m.http}）。資料の日付 ${m.date || '（ページに日付なし）'}${m.dateFrom ? `＝${m.dateFrom}` : ''}。` +
      (others.length ? `同じ資料名の別の URL: ${others.join('／')}。` : ''),
    used_in: USED_IN,
  });
}
// 便の指示: 需給調整市場ガイドライン（未登録）
const GL_URL = 'https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/jyukyuchosei-gl.pdf';
if (!known.has(norm('需給調整市場ガイドライン')) && !entries.some((e) => norm(e.name) === norm('需給調整市場ガイドライン'))) {
  const m = metaOf(GL_URL);
  if (!m) problems.push('需給調整市場ガイドラインの取り直しの結果が無い');
  else
    entries.push({
      name: '需給調整市場ガイドライン',
      publisher: '経済産業省（資源エネルギー庁「関係法令・ガイドライン等」に掲載）',
      url: GL_URL,
      title_verbatim: m.title_verbatim,
      checked_on: CHECKED_ON,
      note: `T8 実装便で登録（便の指示＝未登録だった）。2026-10-14 に取り直し（HTTP ${m.http}）。表紙の最新の改定日 ${m.date}。固定 URL で、改定のたびに中身が替わりうる。電力・ガス取引監視等委員会の一覧（https://www.egc.meti.go.jp/info/guideline/）の現行版は「需給調整市場ガイドライン（令和8年3月13日）※令和8年3月14日受け渡し分からの適用」。`,
      used_in: USED_IN,
    });
}

// 便の指示: 適正な電力取引についての指針（固定 URL の中身が令和8年3月13日版に替わった）
const JFTC_OLD = '"title_verbatim": "適正な電力取引についての指針",\r\n      "checked_on": "2026-09-21",';
const jftc = metaOf('https://www.jftc.go.jp/hourei_files/denki.pdf');
const JFTC_NEW = jftc
  ? `"title_verbatim": ${JSON.stringify(jftc.title_verbatim)},\r\n      "checked_on": "${CHECKED_ON}",`
  : '';
const jftcCount = raw.split(JFTC_OLD).length - 1;
const jftcDone = jftc ? raw.includes(JFTC_NEW) : false;
if (!jftc) problems.push('適正な電力取引についての指針の取り直しの結果が無い');
else if (!jftcDone && jftcCount !== 1) problems.push(`適正な電力取引についての指針の置換対象が 1 か所でない（${jftcCount}）`);

console.log(`[register-source-docs-t8] 足す ${entries.length} 件・指針の更新 ${jftcDone ? '済み' : jftcCount === 1 ? '1 件' : '—'}`);
entries.forEach((e) => console.log(`  + ${e.name}`));
if (problems.length) {
  console.error(`[register-source-docs-t8] 止めた:\n - ${problems.join('\n - ')}`);
  process.exit(1);
}
if (!APPLY) {
  console.log('[register-source-docs-t8] dry run（書き込まない）。書き込むときは --apply');
  process.exit(0);
}
const TAIL = '\r\n  ]\r\n}\r\n';
if (!raw.endsWith(TAIL)) {
  console.error('[register-source-docs-t8] 台帳の末尾が想定（documents 配列の閉じ・CRLF）と違う＝止めた');
  process.exit(1);
}
const block = entries
  .map((e) => `    {\r\n${Object.entries(e).map(([k, v]) => `      ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\r\n')}\r\n    }`)
  .join(',\r\n');
let next = raw;
if (jftc && !jftcDone) next = next.replace(JFTC_OLD, JFTC_NEW);
if (entries.length) next = next.slice(0, next.length - TAIL.length) + ',\r\n' + block + TAIL;
JSON.parse(next); // 壊していないこと
fs.writeFileSync(LEDGER, next);
console.log(`[register-source-docs-t8] 書き込んだ（${raw.length} → ${next.length} 文字）`);
