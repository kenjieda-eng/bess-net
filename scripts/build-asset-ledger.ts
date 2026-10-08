#!/usr/bin/env tsx
/**
 * scripts/build-asset-ledger.ts — 系統用蓄電所 資産台帳テンプレート（xlsx）を定義から生成する（T3 台帳便・2026-10-08）
 *
 * 定義は src/lib/asset-ledger-spec.ts の 1 か所（#119）。xlsx を手で編集しない（次の生成で消える）。
 * 出力: public/dl/bess-asset-ledger-v{版}.xlsx（版は LEDGER_VERSION）。
 * 生成後は scripts/verify-asset-ledger.ts（npm run verify:asset-ledger・prebuild でも走る）で読み戻して検査する。
 *
 * 実行: npm run build:asset-ledger
 *   ★定義を変えたら必ず再生成して xlsx も commit する（verify が「定義と配布物の食い違い」を WARN する）。
 *   ★版を上げるときは LEDGER_VERSION・LEDGER_RELEASED・LEDGER_CHANGELOG を変える（ファイル名が変わる＝旧版は残る）。
 *   ★生成のたびにバイト列は変わる（zip の中の時刻。docProps の日時は固定している）。中身が同じでも git の差分になるので、
 *     定義を変えたときだけ生成する（中身の一致は verify:asset-ledger が見る）。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import ExcelJS from 'exceljs';
import {
  LEDGER_VERSION,
  LEDGER_RELEASED,
  LEDGER_FILE_NAME,
  LEDGER_TITLE,
  LEDGER_ROW,
  LEDGER_INPUT_ROWS,
  LEDGER_FORMULA_ROWS,
  LEDGER_SHEETS,
  LEDGER_CHECKLIST_SHEET,
  LEDGER_CHECKLIST_ITEMS,
  ledgerDataSheets,
  checklistProblems,
  columnLetter,
  formulaOf,
  ledgerSheetTitle,
  checklistColumnLabel,
  ledgerColumnWidth,
  ledgerDescRowHeight,
  ledgerReadmeRows,
  type LedgerColumn,
  type LedgerSheet,
} from '../src/lib/asset-ledger-spec';
export {};

const OUT = path.join(process.cwd(), 'public', 'dl', LEDGER_FILE_NAME);
/** 版の年月の 1 日（docProps の作成・更新日時。生成のたびに変わらないよう固定） */
const FIXED_DATE = new Date(`${LEDGER_RELEASED}-01T00:00:00Z`);

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2D4F' } };
const DESC_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
const DESC_FONT: Partial<ExcelJS.Font> = { color: { argb: 'FF666666' }, size: 9 };
const FMT: Partial<Record<LedgerColumn['type'], string>> = { date: 'yyyy-mm-dd', month: 'yyyy-mm' };

/**
 * 範囲にデータ検証を掛ける。exceljs 4.4 は実行時に worksheet.dataValidations.add(範囲, 検証) を持つが、
 * 型定義（index.d.ts）に載っていないため、ここだけ型を補う（範囲 1 つにつき検証 1 つ＝セルごとに書くより xlsx が小さい）。
 */
function addValidation(ws: ExcelJS.Worksheet, range: string, dv: ExcelJS.DataValidation): void {
  (ws as unknown as { dataValidations: { add(range: string, dv: ExcelJS.DataValidation): void } }).dataValidations.add(range, dv);
}

/** 金額（円）の列は桁区切り */
function numFmtOf(c: LedgerColumn): string | undefined {
  if (FMT[c.type]) return FMT[c.type];
  if ((c.type === 'number' || c.type === 'formula') && /\(円(\/年)?\)$/.test(c.name)) return '#,##0';
  return undefined;
}

/** プルダウンの警告文。選択肢を並べると長すぎるとき（Excel の画面の上限 225 字に余裕を見て 200 字）は短い文にする */
function listErrorText(options: readonly string[]): string {
  const s = `選択肢: ${options.join('・')}`;
  return s.length > 200 ? 'プルダウンの選択肢から選んでください' : s;
}

/** データ検証の一覧（"A,B,C"）。Excel の上限 255 字を超えたら生成を止める */
function listFormula(options: readonly string[], where: string): string {
  const s = options.join(',');
  if (s.length > 255) throw new Error(`${where}: 選択肢の文字列が 255 字を超える（${s.length} 字）`);
  if (options.some((o) => o.includes(',') || o.includes('"'))) throw new Error(`${where}: 選択肢に , か " が含まれる`);
  return `"${s}"`;
}

function addDataSheet(wb: ExcelJS.Workbook, sheet: LedgerSheet): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(sheet.name, { views: [{ state: 'frozen', ySplit: LEDGER_ROW.desc }] });
  ws.columns = sheet.columns.map((c) => ({ width: ledgerColumnWidth(c) }));
  ws.getCell(LEDGER_ROW.title, 1).value = ledgerSheetTitle(sheet.name);
  ws.getCell(LEDGER_ROW.title, 1).font = { bold: true, size: 12 };
  const header = ws.getRow(LEDGER_ROW.header);
  const desc = ws.getRow(LEDGER_ROW.desc);
  sheet.columns.forEach((c, i) => {
    const h = header.getCell(i + 1);
    h.value = c.name;
    h.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    h.fill = HEADER_FILL;
    h.alignment = { vertical: 'middle', wrapText: true };
    const d = desc.getCell(i + 1);
    d.value = c.desc;
    d.font = DESC_FONT;
    d.fill = DESC_FILL;
    d.alignment = { vertical: 'top', wrapText: true };
  });
  header.height = 30;
  // 説明が切れて隠れないよう、最も長い説明の推定行数から高さを決める（定義側の関数＝verify も同じ値で検査）
  desc.height = ledgerDescRowHeight(sheet);

  const first = LEDGER_ROW.firstInput;
  const last = first + LEDGER_INPUT_ROWS - 1;
  sheet.columns.forEach((c, i) => {
    const L = columnLetter(i + 1);
    const fmt = numFmtOf(c);
    if (fmt) ws.getColumn(i + 1).numFmt = fmt;
    if (c.type === 'list') {
      addValidation(ws, `${L}${first}:${L}${last}`, {
        type: 'list',
        allowBlank: true,
        formulae: [listFormula(c.options ?? [], `${sheet.name}／${c.name}`)],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: '選択肢にない値',
        error: listErrorText(c.options ?? []),
      });
    }
    if (c.type === 'date' || c.type === 'month') {
      addValidation(ws, `${L}${first}:${L}${last}`, {
        type: 'date',
        // 下限は Excel の通し番号 1（＝1900-01-01。古い登記・書類の日付でも警告しない。日付でない値だけを止める）。
        // exceljs は 1899-12-30 起点で日付を通し番号に直すので、1899-12-31 を渡すと 1 になる
        operator: 'greaterThanOrEqual',
        allowBlank: true,
        formulae: [new Date(Date.UTC(1899, 11, 31))],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: '日付ではない値',
        error: c.type === 'month' ? '年月はその月の 1 日の日付で入れてください（例: 2026-04-01）' : '日付で入れてください（例: 2026-04-01）',
      });
    }
    if (c.type === 'formula') {
      for (let r = first; r < first + LEDGER_FORMULA_ROWS; r++) {
        ws.getCell(r, i + 1).value = { formula: formulaOf(sheet, c, r) };
      }
    }
  });
  return ws;
}

function addReadme(wb: ExcelJS.Workbook): void {
  const ws = wb.addWorksheet('README');
  ws.columns = [{ width: 26 }, { width: 70 }, { width: 40 }];
  // 行の並びは定義（ledgerReadmeRows）から。検査（verify-asset-ledger.ts）も同じ並びと突き合わせる
  // シート内リンクは付けない（exceljs の内部リンクは location に # が付く非標準の形で書かれ、開くアプリによっては修復の対象になりうる）
  for (const row of ledgerReadmeRows()) {
    const [a, b, c] = row.cells;
    if (a) ws.getCell(row.row, 1).value = a;
    if (b) ws.getCell(row.row, 2).value = b;
    if (c) ws.getCell(row.row, 3).value = c;
    if (row.merge) ws.mergeCells(row.row, 2, row.row, 3);
    if (row.kind === 'title') ws.getCell(row.row, 1).font = { bold: true, size: 12 };
    if (row.kind === 'paragraph' || row.kind === 'sectionTitle') {
      ws.getCell(row.row, 1).font = { bold: true };
      ws.getCell(row.row, 1).alignment = { vertical: 'top' };
    }
    if (row.kind === 'paragraph') {
      ws.getCell(row.row, 2).alignment = { vertical: 'top', wrapText: true };
      ws.getRow(row.row).height = Math.max(30, Math.ceil([...b].length / 50) * 15);
    }
    if (row.kind === 'tableHeader') {
      for (let k = 1; k <= 3; k++) {
        ws.getCell(row.row, k).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ws.getCell(row.row, k).fill = HEADER_FILL;
      }
    }
    if (row.kind === 'sheet') {
      ws.getCell(row.row, 2).alignment = { wrapText: true, vertical: 'top' };
      ws.getCell(row.row, 3).alignment = { wrapText: true, vertical: 'top' };
    }
  }
}

function addChecklist(wb: ExcelJS.Workbook): void {
  const ws = addDataSheet(wb, LEDGER_CHECKLIST_SHEET);
  LEDGER_CHECKLIST_ITEMS.forEach((it, k) => {
    const r = LEDGER_ROW.firstInput + k;
    ws.getCell(r, 1).value = it.item;
    ws.getCell(r, 2).value = it.sheet;
    // 列記号を文字で添える（リンクは付けない＝README と同じ理由）
    ws.getCell(r, 3).value = checklistColumnLabel(it.sheet, it.columns);
    ws.getCell(r, 3).alignment = { wrapText: true, vertical: 'top' };
  });
}

async function main(): Promise<void> {
  const problems = checklistProblems();
  if (problems.length > 0) {
    for (const p of problems) console.error(`[build:asset-ledger] ✗ ${p}`);
    throw new Error('定義（src/lib/asset-ledger-spec.ts）に問題があるため生成しない');
  }
  const wb = new ExcelJS.Workbook();
  wb.creator = '蓄電所ネット';
  wb.lastModifiedBy = '蓄電所ネット';
  wb.title = `${LEDGER_TITLE} v${LEDGER_VERSION}`;
  wb.created = FIXED_DATE;
  wb.modified = FIXED_DATE;
  // 数式（04 の合計収益・営業利益）を開いたときに計算させる
  wb.calcProperties = { fullCalcOnLoad: true };

  addReadme(wb);
  for (const s of LEDGER_SHEETS) addDataSheet(wb, s);
  addChecklist(wb);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await wb.xlsx.writeFile(OUT);
  const size = fs.statSync(OUT).size;
  console.log(`[build:asset-ledger] wrote ${path.relative(process.cwd(), OUT)}（${size.toLocaleString('en-US')} バイト・シート ${wb.worksheets.length}）`);
}

main().catch((e) => {
  console.error(`[build:asset-ledger] ✗ ${(e as Error).message}`);
  process.exit(1);
});
