#!/usr/bin/env tsx
/**
 * scripts/verify-eprx-monthly.ts — 月次転記データとカタログ年平均の検算（Lc-2 ■4(c)）
 *
 * これが案B の肝。/tools/balancing-revenue は
 *   ・年平均 …… EIC カタログ（上流 eic-data-pipeline が毎ビルド再生成）
 *   ・年度内の幅 …… src/data/eprx-monthly-battery.json（PDF から手で転記・commit 済み）
 * という**出所の違う 2 つの数値**を並べて出す。両者がずれたら、読者には「平均 109.43／幅 9.81〜234.89」の
 * ように辻褄の合わない組が出る。上流がデータを改訂しても手元の転記は自動では追随しないので、
 * **機械が気づく形**を必ず持たせる。
 *
 * 検査（商品 × 年度 の全組）:
 *   軸1: 月次の単純平均（小数第2位に丸め）＝ カタログの年平均
 *        2026-09-20 実測で 12 組すべて厳密一致（最大生差 0.0045）。丸め一致を規則とする。
 *   軸2: 約定月数 ＝ カタログ notes の「約定月のみ: FY2024 11ヶ月 / FY2025 12ヶ月」の記載
 *   軸3: カタログ側に当該年度の点があるか
 *
 * 落とし穴 #119 に従い、幅の算出と一致判定は src/lib/eprx-monthly.ts の関数を使う（表示側と同じ実装）。
 * 表示側は不一致なら幅を出さない自己ガードを持つので、この検査は**警告**（exit 0）に留める。
 * ただし不一致は「読者に幅が出なくなる」＝機能の欠落なので、ログでは目立つ形にする。
 *
 * 実行: npm run verify:eprx-monthly（prebuild の末尾でも走る）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getMonthlyStats,
  matchesCatalogAnnual,
  listFiscalYears,
  listProducts,
  catalogSeriesOf,
  productJaOf,
  type BalancingProductKey,
} from '../src/lib/eprx-monthly';
export {};

const ROOT = process.cwd();
const EIC_DIR = path.join(ROOT, 'src', 'data', 'eic');

/** 年度キー → カタログ points の date */
const FY_DATE: Record<string, string> = {
  FY2024: '2024-04-01',
  FY2025: '2025-04-01',
};

type CatalogFile = {
  meta?: { notes?: string };
  points?: { date: string; value: number }[];
};

function readCatalog(series: string): CatalogFile | null {
  const p = path.join(EIC_DIR, `${series}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as CatalogFile;
  } catch {
    return null;
  }
}

/** notes の「約定月のみ: FY2024 11ヶ月 / FY2025 12ヶ月」から当該年度の月数を読む */
function awardedMonthsInNotes(notes: string | undefined, fy: string): number | null {
  if (!notes) return null;
  const m = notes.match(new RegExp(`${fy}\\s*(\\d+)\\s*ヶ月`));
  return m ? Number(m[1]) : null;
}

const problems: string[] = [];
let checked = 0;

console.log('[verify:eprx-monthly] EPRX 月次転記 × カタログ年平均の検算');

for (const fy of listFiscalYears()) {
  const date = FY_DATE[fy];
  if (!date) {
    problems.push(`${fy}: 年度→日付の対応が未登録（FY_DATE に追加が要る）`);
    continue;
  }
  for (const product of listProducts(fy) as BalancingProductKey[]) {
    checked++;
    const ja = productJaOf(fy, product) ?? product;
    const series = catalogSeriesOf(fy, product);
    const stats = getMonthlyStats(fy, product);
    if (!series || !stats) {
      problems.push(`${fy} ${ja}: 転記データが読めない`);
      continue;
    }
    const cat = readCatalog(series);
    if (!cat) {
      // prebuild 前（カタログ未生成）に実行されうる。データ欠落そのものは verify:eic-license が見る。
      console.log(`[verify:eprx-monthly] skip ${fy} ${ja}: カタログ ${series}.json が無い（prebuild 前？）`);
      continue;
    }
    const point = cat.points?.find((p) => p.date === date);
    if (!point) {
      problems.push(`${fy} ${ja}: カタログ ${series} に ${date} の点が無い（軸3）`);
      continue;
    }
    const ok = matchesCatalogAnnual(stats, point.value);
    const notesMonths = awardedMonthsInNotes(cat.meta?.notes, fy);
    const monthsOk = notesMonths === null || notesMonths === stats.awardedMonths;

    const line =
      `  ${fy} ${ja.padEnd(7)} 月次平均 ${stats.mean.toFixed(4)} → 丸め ${(Math.round(stats.mean * 100) / 100).toFixed(2)}` +
      ` / カタログ ${point.value}  幅 ${stats.min.toFixed(2)}〜${stats.max.toFixed(2)}` +
      ` / 約定 ${stats.awardedMonths}か月（notes: ${notesMonths ?? '記載なし'}）  p${stats.pdfPage}`;

    if (ok && monthsOk) {
      console.log(`${line}  ok`);
    } else {
      console.log(`${line}  ★NG`);
      if (!ok) {
        problems.push(
          `${fy} ${ja}: 月次平均 ${(Math.round(stats.mean * 100) / 100).toFixed(2)} ≠ カタログ年平均 ${point.value}（軸1）`,
        );
      }
      if (!monthsOk) {
        problems.push(`${fy} ${ja}: 約定月数 ${stats.awardedMonths} ≠ notes の ${notesMonths}（軸2）`);
      }
    }
  }
}

console.log(`[verify:eprx-monthly] ${checked} 組を検査`);
if (problems.length === 0) {
  console.log('[verify:eprx-monthly] ok   全組一致（表示側は年平均と年度内の幅を並べてよい）');
} else {
  console.warn('');
  console.warn('[verify:eprx-monthly] ★★★ WARN 転記データとカタログがずれている ★★★');
  for (const p of problems) console.warn(`   - ${p}`);
  console.warn('   → 表示側は該当商品の「年度内の幅」を出さずに縮退します（矛盾した数値は読者に出ません）。');
  console.warn('   → 復旧: EPRX の最新 PDF を取り直し、');
  console.warn('      python scripts/experimental/eprx/extract_monthly_battery.py FY2024=… FY2025=… を再実行して commit。');
  console.warn('');
}

// 警告のみ・ビルドは止めない（exit 0 固定）。表示側の自己ガードが読者影響を防ぐ。
process.exit(0);
