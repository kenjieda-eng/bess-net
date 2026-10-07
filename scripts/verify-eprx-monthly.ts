#!/usr/bin/env tsx
/**
 * scripts/verify-eprx-monthly.ts — 月次（カタログ）とカタログ年平均の検算（Lc-2 ■4(c) → EPRX 月次置換便 2026-10-07）
 *
 * これが案B の肝。/tools/balancing-revenue は
 *   ・年平均 …… EIC カタログの年次系列 balancing-price-{product}-battery
 *   ・年度内の幅 …… EIC カタログの月次系列 balancing-price-monthly-{product}-battery（2026-10-07 から。以前は PDF からの手転記）
 * を並べて出す。月次と年次は同じカタログでも別の系列として改訂されうるので、ずれたら読者には
 * 「平均 109.43／幅 9.81〜234.89」のように辻褄の合わない組が出る。**機械が気づく形**を必ず持たせる。
 *
 * 検査（商品 × 年度 の全組）:
 *   軸1: 月次の単純平均（小数第2位に丸め）＝ カタログの年平均（2026-09-20 手転記・2026-10-07 カタログ月次とも 12 組一致）
 *   軸2: 約定月数 ＝ カタログ年次 notes の「約定月のみ: FY2024 11ヶ月 / FY2025 12ヶ月」の記載
 *   軸3: カタログ年次に当該年度の点があるか
 *   軸4（暫定・2026-10-07）: カタログ月次 ＝ 手転記 src/data/eprx-monthly-battery.json の全セル（6 商品 × 24 月＝144・null は null 同士）。
 *        転記の正しさとカタログの正しさを互いに保証する。手転記 JSON の撤去（1 サイクル後の別便）と一緒にこの軸も外す。
 *
 * 落とし穴 #119 に従い、幅の算出と一致判定は src/lib/eprx-monthly.ts の関数を使う（表示側と同じ実装）。
 * 表示側は不一致なら幅を出さない自己ガードを持つので、この検査は**警告**（exit 0）に留める。
 * ただし不一致は「読者に幅が出なくなる」＝機能の欠落なので、ログでは目立つ形にする。
 *
 * 実行: npm run verify:eprx-monthly（prebuild の末尾でも走る）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const ROOT = process.cwd();
const EIC_DIR = path.join(ROOT, 'src', 'data', 'eic');
const MANUAL = path.join(ROOT, 'src', 'data', 'eprx-monthly-battery.json');
const PRODUCTS = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'] as const;

/** 年度キー → カタログ年次 points の date */
const FY_DATE: Record<string, string> = {
  FY2024: '2024-04-01',
  FY2025: '2025-04-01',
};

type CatalogFile = {
  meta?: { notes?: string };
  points?: { date: string; value: number | null }[];
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

async function main(): Promise<void> {
  console.log('[verify:eprx-monthly] EPRX 月次（カタログ）× カタログ年平均の検算');
  // 月次系列はカタログの生成物（prebuild の precompute-eic-data が作る）。無いときは prebuild 前＝検査を飛ばす
  // （src/lib/eprx-monthly.ts はこの JSON を静的 import するので、存在を確かめてから読む）。
  const missing = PRODUCTS.filter((p) => !fs.existsSync(path.join(EIC_DIR, `balancing-price-monthly-${p}-battery.json`)));
  if (missing.length > 0) {
    console.log(`[verify:eprx-monthly] skip カタログ月次 ${missing.length} 本が無い（prebuild 前？）: ${missing.join(', ')}`);
    return;
  }
  const lib = await import('../src/lib/eprx-monthly');

  const problems: string[] = [];
  let checked = 0;

  for (const fy of lib.listFiscalYears()) {
    const date = FY_DATE[fy];
    if (!date) {
      problems.push(`${fy}: 年度→日付の対応が未登録（FY_DATE に追加が要る）`);
      continue;
    }
    for (const product of lib.listProducts(fy)) {
      checked++;
      const ja = lib.productJaOf(fy, product) ?? product;
      const series = lib.catalogSeriesOf(fy, product);
      const stats = lib.getMonthlyStats(fy, product);
      if (!series || !stats) {
        problems.push(`${fy} ${ja}: 月次が読めない`);
        continue;
      }
      const cat = readCatalog(series);
      if (!cat) {
        // prebuild 前（カタログ未生成）に実行されうる。データ欠落そのものは verify:eic-license が見る。
        console.log(`[verify:eprx-monthly] skip ${fy} ${ja}: カタログ ${series}.json が無い（prebuild 前？）`);
        continue;
      }
      const point = cat.points?.find((p) => p.date === date);
      if (!point || typeof point.value !== 'number') {
        problems.push(`${fy} ${ja}: カタログ ${series} に ${date} の点が無い（軸3）`);
        continue;
      }
      const ok = lib.matchesCatalogAnnual(stats, point.value);
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

  // 軸4（暫定）: カタログ月次 ＝ 手転記の全セル
  let cells = 0;
  const cellDiffs: string[] = [];
  if (fs.existsSync(MANUAL)) {
    const manual = JSON.parse(fs.readFileSync(MANUAL, 'utf8')) as {
      fiscal_years: Record<string, { products: Record<string, { months: Record<string, number | null> }> }>;
    };
    for (const p of PRODUCTS) {
      const cat = readCatalog(lib.monthlySeriesOf(p));
      const byMonth = new Map((cat?.points ?? []).map((pt) => [pt.date.slice(0, 7), pt.value]));
      for (const [fy, fd] of Object.entries(manual.fiscal_years)) {
        const y = Number(fy.replace(/^FY/, ''));
        for (const [label, v] of Object.entries(fd.products?.[p]?.months ?? {})) {
          cells++;
          const mm = Number(label.replace('月', ''));
          const key = `${mm >= 4 ? y : y + 1}-${String(mm).padStart(2, '0')}`;
          const cv = byMonth.has(key) ? byMonth.get(key) : undefined;
          const same = (v === null && cv === null) || (typeof v === 'number' && typeof cv === 'number' && Math.abs(v - cv) < 1e-9);
          if (!same) cellDiffs.push(`${p} ${key}: 手転記 ${v} ／ カタログ ${cv === undefined ? '（点なし）' : cv}`);
        }
      }
    }
    if (cellDiffs.length === 0) {
      console.log(`[verify:eprx-monthly] 軸4 カタログ月次 ＝ 手転記: ${cells} セル全一致`);
    } else {
      console.log(`[verify:eprx-monthly] 軸4 カタログ月次 ≠ 手転記: ${cellDiffs.length} / ${cells} セル不一致  ★NG`);
      for (const d of cellDiffs) problems.push(`軸4 ${d}`);
    }
  } else {
    console.log('[verify:eprx-monthly] 軸4 skip 手転記 JSON が無い（撤去済みなら本軸も外す）');
  }

  console.log(`[verify:eprx-monthly] ${checked} 組を検査（軸1〜3）・${cells} セル（軸4）`);
  if (problems.length === 0) {
    console.log('[verify:eprx-monthly] ok   全組一致（表示側は年平均と年度内の幅を並べてよい）');
  } else {
    console.warn('');
    console.warn('[verify:eprx-monthly] ★★★ WARN 月次・年次・手転記のいずれかがずれている ★★★');
    for (const p of problems) console.warn(`   - ${p}`);
    console.warn('   → 表示側は軸1〜3 が合わない商品の「年度内の幅」を出さずに縮退します（矛盾した数値は読者に出ません）。');
    console.warn('   → 軸4 の不一致は、カタログ側（eic-data-pipeline）と手転記のどちらが正しいかを EPRX の PDF で確かめる。');
    console.warn('');
  }
}

main()
  .catch((e) => {
    console.warn(`[verify:eprx-monthly] WARN 検査が例外で止まった: ${(e as Error).message}`);
  })
  // 警告のみ・ビルドは止めない（exit 0 固定）。表示側の自己ガードが読者影響を防ぐ。
  .finally(() => process.exit(0));
