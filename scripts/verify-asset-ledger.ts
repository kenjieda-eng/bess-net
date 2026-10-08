#!/usr/bin/env tsx
/**
 * scripts/verify-asset-ledger.ts — 配布中の資産台帳テンプレート（xlsx）が定義どおりかの検査（T3 台帳便・2026-10-08）
 *
 * 定義 src/lib/asset-ledger-spec.ts と、commit 済みの public/dl/bess-asset-ledger-v{版}.xlsx を突き合わせる。
 * 定義だけ直して xlsx を作り直し忘れると、ページ（定義から描く）と配布物が食い違う（#118／#119 と同型）。それを毎ビルド拾う。
 *   1. シート: README＋01〜08 が定義の順で並ぶ（枚数は ledgerSheetCount）
 *   2. 各データシート: A1＝シート名と版・列名の行・説明の行（定義と一字一句・行は LEDGER_ROW）・説明の行まで固定
 *   3. データ検証: 選択肢の列はプルダウン（定義の選択肢と同じ）・日付の列は日付の検証（入力の先頭行と末行）
 *   4. 書式: 日付・年月の列の表示形式
 *   5. 数式: 04_月次実績 の合計収益・営業利益が入力行の先頭〜末（数式行）まで定義どおりの式
 *   6. 08: 項目・参照シート・参照列の表示（列名（列記号 列）を「・」で連結）が定義どおり
 *   7. README: 全行（A1 の版・段落・シート一覧・更新履歴）が定義の ledgerReadmeRows と行番号・順序・余分な行まで一致
 *   （2 では列幅と説明の行の高さも定義の ledgerColumnWidth・ledgerDescRowHeight と突き合わせる）
 * 警告のみ（exit 0）。配布物の再生成は npm run build:asset-ledger。
 *
 * 実行: npm run verify:asset-ledger（prebuild でも走る）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import ExcelJS from 'exceljs';
import {
  LEDGER_FILE_NAME,
  LEDGER_ROW,
  LEDGER_INPUT_ROWS,
  LEDGER_FORMULA_ROWS,
  LEDGER_CHECKLIST_ITEMS,
  LEDGER_CHECKLIST_SHEET,
  ledgerColumnWidth,
  ledgerDescRowHeight,
  ledgerReadmeRows,
  ledgerDataSheets,
  ledgerSheetTitle,
  checklistProblems,
  columnLetter,
  formulaOf,
  checklistColumnLabel,
} from '../src/lib/asset-ledger-spec';
export {};

const FILE = path.join(process.cwd(), 'public', 'dl', LEDGER_FILE_NAME);
const problems: string[] = [];
const counts = { sheets: 0, columns: 0, lists: 0, dates: 0, formulas: 0, checklist: 0 };

const text = (v: ExcelJS.CellValue): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'text' in (v as object)) return String((v as { text: unknown }).text);
  if (typeof v === 'object' && 'richText' in (v as object)) return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('');
  return String(v);
};

async function main(): Promise<void> {
  for (const p of checklistProblems()) problems.push(`定義: ${p}`);
  if (!fs.existsSync(FILE)) {
    problems.push(`配布物 ${path.relative(process.cwd(), FILE)} が無い（npm run build:asset-ledger で生成して commit する）`);
    return;
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  // 1. シートの並び
  const expected = ['README', ...ledgerDataSheets().map((s) => s.name)];
  const actual = wb.worksheets.map((w) => w.name);
  counts.sheets = actual.length;
  if (actual.join('|') !== expected.join('|')) problems.push(`シートの並び: ${actual.join('・')} ≠ 定義 ${expected.join('・')}`);

  const first = LEDGER_ROW.firstInput;
  const last = first + LEDGER_INPUT_ROWS - 1;
  for (const sheet of ledgerDataSheets()) {
    const ws = wb.getWorksheet(sheet.name);
    if (!ws) continue;
    // 2. 見出し
    if (text(ws.getCell(LEDGER_ROW.title, 1).value) !== ledgerSheetTitle(sheet.name)) {
      problems.push(`${sheet.name}: A1 が「${text(ws.getCell(LEDGER_ROW.title, 1).value)}」（定義は「${ledgerSheetTitle(sheet.name)}」）`);
    }
    const view = ws.views?.[0] as { state?: string; ySplit?: number } | undefined;
    if (view?.state !== 'frozen' || view?.ySplit !== LEDGER_ROW.desc) problems.push(`${sheet.name}: ${LEDGER_ROW.desc} 行目までの固定が無い`);
    if (ws.getRow(LEDGER_ROW.desc).height !== ledgerDescRowHeight(sheet)) {
      problems.push(`${sheet.name}: 説明の行の高さ ${ws.getRow(LEDGER_ROW.desc).height}（定義から求めると ${ledgerDescRowHeight(sheet)}）`);
    }
    const extra = text(ws.getCell(LEDGER_ROW.header, sheet.columns.length + 1).value);
    if (extra) problems.push(`${sheet.name}: 定義に無い列がある（${extra}）`);
    sheet.columns.forEach((c, i) => {
      counts.columns++;
      const L = columnLetter(i + 1);
      const h = text(ws.getCell(LEDGER_ROW.header, i + 1).value);
      const d = text(ws.getCell(LEDGER_ROW.desc, i + 1).value);
      if (h !== c.name) problems.push(`${sheet.name}／${L}: 列名「${h}」≠ 定義「${c.name}」`);
      if (d !== c.desc) problems.push(`${sheet.name}／${c.name}: 説明が定義と違う`);
      if (ws.getColumn(i + 1).width !== ledgerColumnWidth(c)) problems.push(`${sheet.name}／${c.name}: 列幅 ${ws.getColumn(i + 1).width}（定義は ${ledgerColumnWidth(c)}）`);
      // 3. データ検証
      for (const r of [first, last]) {
        const dv = ws.getCell(r, i + 1).dataValidation as ExcelJS.DataValidation | undefined;
        if (c.type === 'list') {
          const want = `"${(c.options ?? []).join(',')}"`;
          if (!dv || dv.type !== 'list' || String(dv.formulae?.[0]) !== want) {
            problems.push(`${sheet.name}／${c.name}: ${L}${r} のプルダウンが無いか選択肢が違う（${dv ? String(dv.formulae?.[0]) : 'なし'}）`);
          }
        } else if (c.type === 'date' || c.type === 'month') {
          if (!dv || dv.type !== 'date') problems.push(`${sheet.name}／${c.name}: ${L}${r} に日付の検証が無い`);
        } else if (dv) {
          problems.push(`${sheet.name}／${c.name}: ${L}${r} に定義に無い検証（${dv.type}）`);
        }
      }
      if (c.type === 'list') counts.lists++;
      // 4. 書式
      if (c.type === 'date' || c.type === 'month') {
        counts.dates++;
        const want = c.type === 'date' ? 'yyyy-mm-dd' : 'yyyy-mm';
        if (ws.getCell(first, i + 1).numFmt !== want) problems.push(`${sheet.name}／${c.name}: 表示形式が ${ws.getCell(first, i + 1).numFmt}（定義は ${want}）`);
      }
      // 5. 数式
      if (c.type === 'formula') {
        let bad = 0;
        for (let r = first; r < first + LEDGER_FORMULA_ROWS; r++) {
          const v = ws.getCell(r, i + 1).value as { formula?: string } | null;
          if (!v || v.formula !== formulaOf(sheet, c, r)) bad++;
          else counts.formulas++;
        }
        if (bad) problems.push(`${sheet.name}／${c.name}: 数式が定義と違う行が ${bad} 行（${first}〜${first + LEDGER_FORMULA_ROWS - 1} 行）`);
        const after = ws.getCell(first + LEDGER_FORMULA_ROWS, i + 1).value;
        if (after) problems.push(`${sheet.name}／${c.name}: 数式行の後ろ（${first + LEDGER_FORMULA_ROWS} 行）にも値がある`);
      }
    });
  }

  // 6. 08 の行
  const ws08 = wb.getWorksheet(LEDGER_CHECKLIST_SHEET.name);
  if (ws08) {
    LEDGER_CHECKLIST_ITEMS.forEach((it, k) => {
      const r = first + k;
      // 参照列は「列名（列記号 列）」の文字を「・」で連結（シート内リンクは付けない＝build-asset-ledger.ts の注記）
      const label = checklistColumnLabel(it.sheet, it.columns);
      if (label.includes('（? 列）')) {
        problems.push(`08: ${r} 行目「${it.item}」の参照列が定義に無い（${label}）`);
      } else if (text(ws08.getCell(r, 1).value) !== it.item || text(ws08.getCell(r, 2).value) !== it.sheet || text(ws08.getCell(r, 3).value) !== label) {
        problems.push(`08: ${r} 行目が定義（${it.item}／${it.sheet}／${label}）と違う`);
      } else {
        counts.checklist++;
      }
    });
    if (text(ws08.getCell(first + LEDGER_CHECKLIST_ITEMS.length, 1).value)) problems.push('08: 定義に無い行がある');
  }

  // 7. README（ページは定義から描くので、ここが定義とずれると配布物とページが食い違う）。行番号・順序・余分な行まで完全一致
  const readme = wb.getWorksheet('README');
  if (readme) {
    const expectedRows = ledgerReadmeRows();
    const actual = new Map<number, string[]>();
    readme.eachRow((row, n) => {
      const cells = [1, 2, 3].map((c) => text(row.getCell(c).value));
      if (cells.some((x) => x)) actual.set(n, cells);
    });
    for (const e of expectedRows) {
      const a = actual.get(e.row);
      // 結合した行（B:C）は C に B と同じ値が読めることがあるので、C は見ない
      const same = a && a[0] === e.cells[0] && a[1] === e.cells[1] && (e.merge || a[2] === e.cells[2]);
      if (!same) problems.push(`README ${e.row} 行目（${e.kind}「${e.cells[0] || e.cells[1]}」）が定義と違う`);
      actual.delete(e.row);
    }
    for (const n of actual.keys()) problems.push(`README ${n} 行目に定義に無い行がある`);
  }
}

main()
  .catch((e) => problems.push(`検査が例外で途中で止まった: ${(e as Error).message}`))
  .finally(() => {
    console.log(
      `[verify:asset-ledger] ${LEDGER_FILE_NAME}: シート ${counts.sheets}・列 ${counts.columns}・プルダウン ${counts.lists} 列・日付 ${counts.dates} 列・数式 ${counts.formulas} セル・08 の項目 ${counts.checklist}`,
    );
    if (problems.length === 0) {
      console.log('[verify:asset-ledger] ok   配布物は定義どおり');
    } else {
      console.warn('[verify:asset-ledger] ★WARN 配布物（xlsx）と定義（src/lib/asset-ledger-spec.ts）が食い違う → npm run build:asset-ledger で作り直して commit');
      for (const p of problems.slice(0, 40)) console.warn(`   - ${p}`);
      if (problems.length > 40) console.warn(`   …ほか ${problems.length - 40} 件`);
    }
    process.exit(0);
  });
