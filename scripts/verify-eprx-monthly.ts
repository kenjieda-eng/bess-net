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
 * 検査の対象は「ページが出す年度（src/lib/balancing-fallback.ts の BALANCING_FY_DATE のキー）× 6 商品」で固定する
 * （カタログや手転記の中身から対象を作ると、データが欠けたときに対象ごと縮んで気づけない）。
 *   軸1: 月次の単純平均（小数第2位に丸め）＝ カタログの年平均（2026-09-20 手転記・2026-10-07 カタログ月次とも 12 組一致）
 *   軸2: 約定月数 ＝ カタログ年次 notes の「約定月のみ: FY2024 11ヶ月 / FY2025 12ヶ月」の記載
 *   軸3: カタログ年次に当該年度の点があるか・カタログ月次に当該年度×商品の点があるか・ページに無い年度がカタログに来ていないか
 *   軸4（暫定・2026-10-07）: カタログ月次 ＝ 手転記 src/data/eprx-monthly-battery.json の全セル（6 商品 × 24 月＝144・null は null 同士）。
 *        期待セル数はページの年度数から決める（手転記の年度が欠けても縮まない）・カタログ側に手転記に無い月が無いかも見る。
 *        転記の正しさとカタログの正しさを互いに保証する。手転記 JSON の撤去（1 サイクル後の別便）と一緒にこの軸も外す
 *        （外した後も、月次の欠けは軸3 が拾う）。
 * 出典欄の検査（EPRX 月次置換便のレビュー反映・2026-10-07）:
 *   軸5: 出典の読み取り … 月次 notes から各年度の資料名・ページが読めるか（読めないとその年度・商品の出所が出典欄から抜ける）・
 *        同じ年度で商品ごとに資料名が食い違わないか・上限価格 notes から商品ごとに資料が読めるか・資料の集合と公表日が商品間で揃うか・
 *        出典欄に出る資料名（notes 由来＝テンプレート変数なので verify:source-names の対象外）が台帳 src/data/source-documents.json にあるか
 *   軸6: 上限価格の注記と利用条件 … src/lib/balancing-cap.ts の capNoteProblems()（注記の文が成り立つか）・
 *        月次 6 本と上限 5 本の license_notice／license_url が、ページに出している年次（一次 battery）と同一か
 *
 * 落とし穴 #119 に従い、幅の算出と一致判定は src/lib/eprx-monthly.ts、上限の判定は src/lib/balancing-cap.ts の関数を使う（表示側と同じ実装）。
 * 表示側が自動で縮退するのは軸1 だけ（月次平均≠ページの年平均の商品の幅を出さない）なので、この検査は**警告**（exit 0）に留めつつ、
 * 不一致は機能の欠落か出典の欠落としてログで目立つ形にする。
 *
 * 実行: npm run verify:eprx-monthly（prebuild の末尾でも走る）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
// 年度→年次の点の日付はページと同じ定義を読む（#119・二重に持たない）。balancing-fallback.ts は import を持たない＝生成物が無くても読める
import { BALANCING_FY_DATE } from '../src/lib/balancing-fallback';
export {};

const ROOT = process.cwd();
const EIC_DIR = path.join(ROOT, 'src', 'data', 'eic');
const MANUAL = path.join(ROOT, 'src', 'data', 'eprx-monthly-battery.json');
const LEDGER = path.join(ROOT, 'src', 'data', 'source-documents.json');
const PRODUCTS = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'] as const;
const CAP_PRODUCTS = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'composite'] as const;
/** ページが license_notice の 3 行を出している年次系列（page.tsx の EPRX_META＝primaryBatteryData と対。あちらを変えたらここも） */
const DISPLAYED_LICENSE_SERIES = 'balancing-price-primary-battery';
/** ページが出す年度（年度→カタログ年次の点の日付） */
const FY_DATE: Record<string, string> = BALANCING_FY_DATE;
const FY_KEYS = Object.keys(FY_DATE);

type CatalogFile = {
  meta?: { notes?: string; license_notice?: string; license_url?: string };
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

/** 「」の中の資料名を取り出す（「「2024年度の取引実績について」（2025年6月19日）」→ 2024年度の取引実績について） */
function docNamesIn(s: string): string[] {
  return [...s.matchAll(/「([^「」]+)」/g)].map((m) => m[1]);
}

/** 台帳の name・aliases（verify-source-names と同じ正規化: NFKC・空白除去） */
const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, '').trim();
function ledgerNames(): Set<string> | null {
  try {
    const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8')) as { documents: { name: string; aliases?: string[] }[] };
    const known = new Set<string>();
    for (const d of ledger.documents) {
      known.add(norm(d.name));
      for (const a of d.aliases ?? []) known.add(norm(a));
    }
    return known;
  } catch {
    return null;
  }
}

/** 途中で例外が出ても、それまでに見つけた問題は必ず出す（main の外に置く） */
const problems: string[] = [];
let summaryLine = '';

function printResult(): void {
  if (summaryLine) console.log(summaryLine);
  if (problems.length === 0) {
    console.log('[verify:eprx-monthly] ok   全組一致（表示側は年平均と年度内の幅を並べてよい）');
    return;
  }
  console.warn('');
  console.warn('[verify:eprx-monthly] ★★★ WARN 月次・年次・手転記・出典・上限価格のいずれかがずれている ★★★');
  for (const p of problems) console.warn(`   - ${p}`);
  console.warn('   → 表示側が自動で縮退するのは、月次平均（丸め）≠ ページに出ている年平均（カタログ。無ければ fallback）の商品の「年度内の幅」だけ（矛盾した幅は読者に出ない）。');
  console.warn('   → それ以外（軸2〜6・年次カタログの欠け＝ページは fallback の年平均で表示を続ける・ページに無い年度）は表示を止めない。読者に出ている文・出典を直す必要がある。');
  console.warn('   → 軸4 の不一致は、カタログ側（eic-data-pipeline）と手転記のどちらが正しいかを EPRX の PDF で確かめる。');
  console.warn('');
}

async function main(): Promise<void> {
  console.log('[verify:eprx-monthly] EPRX 月次（カタログ）× カタログ年平均の検算');
  // 月次系列はカタログの生成物（prebuild の precompute-eic-data が作る）。prebuild ではこの検査は precompute-eic-data の後に走るので、
  // 無いのは取得の失敗（10% までは許容されて先へ進む）。その場合 next build は src/lib/eprx-monthly.ts の静的 import で失敗する。
  // （src/lib/eprx-monthly.ts はこの JSON を静的 import するので、存在を確かめてから読む）。
  const missing = PRODUCTS.filter((p) => !fs.existsSync(path.join(EIC_DIR, `balancing-price-monthly-${p}-battery.json`)));
  if (missing.length > 0) {
    problems.push(
      `検査を飛ばした: カタログ月次 ${missing.length} 本が無い（${missing.join(', ')}）。` +
        'precompute-eic-data の取得失敗の可能性。next build は src/lib/eprx-monthly.ts の import で失敗する。',
    );
    return;
  }
  const lib = await import('../src/lib/eprx-monthly');

  // 軸1〜3（ページの年度 × 6 商品）
  let checked = 0;
  for (const fy of lib.listFiscalYears()) {
    if (!FY_KEYS.includes(fy)) {
      problems.push(`${fy}: カタログ月次にページの年度に無い年度がある（軸3）。年度を足すときは src/lib/balancing-fallback.ts の BALANCING_FY_DATE・page の年度・台帳をまとめて更新する`);
    }
  }
  for (const fy of FY_KEYS) {
    const date = FY_DATE[fy];
    const present = lib.listProducts(fy);
    for (const product of PRODUCTS) {
      if (!present.includes(product)) {
        problems.push(`${fy} ${product}: カタログ月次に当該年度の点が無い（軸3・ページはこの商品の幅を出せない）`);
        continue;
      }
      const ja = lib.productJaOf(fy, product) ?? product;
      const series = lib.catalogSeriesOf(fy, product);
      const stats = lib.getMonthlyStats(fy, product);
      if (!series || !stats) {
        problems.push(`${fy} ${ja}: 月次が読めない`);
        continue;
      }
      const cat = readCatalog(series);
      if (!cat) {
        problems.push(`${fy} ${ja}: カタログ年次 ${series}.json が無い（軸3・precompute-eic-data の取得失敗の可能性。page は fallback の年平均で表示を続ける）`);
        continue;
      }
      const point = cat.points?.find((p) => p.date === date);
      if (!point || typeof point.value !== 'number') {
        problems.push(`${fy} ${ja}: カタログ ${series} に ${date} の点が無い（軸3）`);
        continue;
      }
      checked++;
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
  if (fs.existsSync(MANUAL)) {
    const cellDiffs: string[] = [];
    let manual: { fiscal_years: Record<string, { products: Record<string, { months: Record<string, number | null> }> }> } | null = null;
    try {
      manual = JSON.parse(fs.readFileSync(MANUAL, 'utf8'));
    } catch (e) {
      cellDiffs.push(`手転記 JSON が読めない（${(e as Error).message}）`);
    }
    if (manual) {
      const expectedCells = PRODUCTS.length * FY_KEYS.length * 12;
      const manualFys = Object.keys(manual.fiscal_years ?? {});
      for (const fy of FY_KEYS) if (!manualFys.includes(fy)) cellDiffs.push(`手転記に ${fy} が無い`);
      for (const p of PRODUCTS) {
        const cat = readCatalog(lib.monthlySeriesOf(p));
        const byMonth = new Map((cat?.points ?? []).map((pt) => [pt.date.slice(0, 7), pt.value]));
        const seen = new Set<string>();
        for (const [fy, fd] of Object.entries(manual.fiscal_years)) {
          const y = Number(fy.replace(/^FY/, ''));
          for (const [label, v] of Object.entries(fd.products?.[p]?.months ?? {})) {
            cells++;
            const mm = Number(label.replace('月', ''));
            const key = `${mm >= 4 ? y : y + 1}-${String(mm).padStart(2, '0')}`;
            seen.add(key);
            const cv = byMonth.has(key) ? byMonth.get(key) : undefined;
            const same = (v === null && cv === null) || (typeof v === 'number' && typeof cv === 'number' && Math.abs(v - cv) < 1e-9);
            if (!same) cellDiffs.push(`${p} ${key}: 手転記 ${v} ／ カタログ ${cv === undefined ? '（点なし）' : cv}`);
          }
        }
        // カタログ側にあって手転記に無い月（ページの年度の範囲内。範囲外の年度は軸3 が見る）
        for (const pt of cat?.points ?? []) {
          const key = pt.date.slice(0, 7);
          const yy = Number(key.slice(0, 4));
          const mm = Number(key.slice(5, 7));
          if (FY_KEYS.includes(`FY${mm >= 4 ? yy : yy - 1}`) && !seen.has(key)) {
            cellDiffs.push(`${p} ${key}: 手転記に無い（カタログ ${pt.value}）`);
          }
        }
      }
      if (cells !== expectedCells) {
        cellDiffs.push(`手転記のセル数 ${cells} ≠ 期待 ${expectedCells}（${PRODUCTS.length} 商品 × ページの ${FY_KEYS.length} 年度 × 12 か月）`);
      }
    }
    if (cellDiffs.length === 0) {
      console.log(`[verify:eprx-monthly] 軸4 カタログ月次 ＝ 手転記: ${cells} セル全一致`);
    } else {
      console.log(`[verify:eprx-monthly] 軸4 カタログ月次 ≠ 手転記: ${cellDiffs.length} 件の不一致（${cells} セル）  ★NG`);
      for (const d of cellDiffs) problems.push(`軸4 ${d}`);
    }
  } else {
    console.log('[verify:eprx-monthly] 軸4 skip 手転記 JSON が無い（撤去済みなら本軸も外す）');
  }

  // 軸5: 出典の読み取り（出典欄から出所が抜けないこと・資料名が台帳にあること）
  const sourceProblems: string[] = [];
  const shownDocNames = new Set<string>();
  for (const fy of FY_KEYS) {
    const headings = new Set<string>();
    for (const product of lib.listProducts(fy)) {
      const s = lib.getMonthlyStats(fy, product);
      if (!s) continue;
      if (s.pdfPage === 0 || s.pageHeading === '') {
        sourceProblems.push(`${fy} ${product}: 月次 notes から資料名・ページが読めない（出典欄からこの年度・商品の出所が抜ける）`);
      } else {
        headings.add(s.pageHeading);
      }
    }
    if (headings.size > 1) sourceProblems.push(`${fy}: 商品ごとに資料名が食い違う（${[...headings].join(' ／ ')}）`);
  }
  const monthlyLines = lib.monthlySourceLinesOf(FY_KEYS);
  if (monthlyLines.length !== FY_KEYS.length) {
    sourceProblems.push(`月次の出典の行が ${monthlyLines.length} 行（ページの年度は ${FY_KEYS.length}）`);
  }
  for (const l of monthlyLines) for (const n of docNamesIn(l)) shownDocNames.add(n);

  const capMissing = CAP_PRODUCTS.filter((p) => !fs.existsSync(path.join(EIC_DIR, `balancing-price-cap-${p}.json`)));
  let capNoteLine = '';
  let capInfoLine = '';
  const capProblems: string[] = [];
  if (capMissing.length > 0) {
    problems.push(`軸5・6 上限価格は未検査: カタログ ${capMissing.length} 本が無い（${capMissing.join(', ')}）。next build は src/lib/balancing-cap.ts の import で失敗する`);
  } else {
    const cap = await import('../src/lib/balancing-cap');
    // 商品ごとに資料が読めるか・資料の集合と公表日が商品間で揃うか
    const docSets = new Map<string, string>();
    const datesByName = new Map<string, Set<string>>();
    for (const p of cap.CAP_PRODUCT_KEYS) {
      const srcs = cap.capSourcesOf(p);
      if (srcs.length === 0) sourceProblems.push(`上限価格 ${p}: notes から資料名・ページが読めない（出典欄からこの商品のページが抜ける）`);
      docSets.set(p, [...new Set(srcs.map((x) => x.doc))].sort().join(' ／ '));
      for (const { doc } of srcs) {
        const m = doc.match(/^「([^「」]+)」（([^（）]+)）$/);
        if (!m) continue;
        if (!datesByName.has(m[1])) datesByName.set(m[1], new Set());
        datesByName.get(m[1])!.add(m[2]);
      }
    }
    if (new Set(docSets.values()).size > 1) {
      sourceProblems.push(`上限価格: 商品ごとに資料の集合が違う（${[...docSets].map(([p, d]) => `${p}=${d}`).join(' ｜ ')}）`);
    }
    for (const [name, dates] of datesByName) {
      if (dates.size > 1) sourceProblems.push(`上限価格: 資料「${name}」の公表日が商品間で揃わない（${[...dates].join(' ／ ')}）＝出典欄で同じ資料が 2 行になる`);
    }
    const capLines = cap.capSourceLines();
    if (capLines.length === 0) sourceProblems.push('上限価格 notes から資料名・ページが 1 件も読めない（出典欄の上限価格の行から出所が抜ける）');
    for (const l of capLines) for (const n of docNamesIn(l)) shownDocNames.add(n);

    // 軸6: 上限価格の注記が成り立つか（判定は balancing-cap.ts の 1 か所。値は WARN を出さない capNoteValues から）
    const note = cap.capNoteValues();
    if (note.afterSource === 'revision') shownDocNames.add(note.revision.sourceTitle);
    capProblems.push(...cap.capNoteProblems());
    capNoteLine =
      `[verify:eprx-monthly] 軸6 上限価格の注記: ${note.until.y}/${note.until.m}/${note.until.d} まで ${note.before}・` +
      `${note.from.y}/${note.from.m}/${note.from.d} から ${note.after}（${note.afterSource === 'revision' ? 'カタログ未収載の改定' : 'カタログ'}）・継続 ${note.keep}`;
    if (note.afterSource === 'catalog') {
      capInfoLine =
        '[verify:eprx-monthly] 情報: カタログに改定日の点が入った（出典欄の「カタログ未収載の改定」の一文は自動で消える）。' +
        '上限価格の出典の行に改定の出所が含まれているかを一度確かめる。';
    }
  }

  const known = ledgerNames();
  if (!known) {
    sourceProblems.push('台帳 src/data/source-documents.json が読めない（資料名を照合できない）');
  } else {
    for (const n of shownDocNames) {
      if (!known.has(norm(n))) sourceProblems.push(`出典欄の資料名「${n}」が台帳（src/data/source-documents.json）の name・aliases に無い`);
    }
  }
  if (sourceProblems.length === 0) {
    console.log(
      `[verify:eprx-monthly] 軸5 出典の読み取り: 月次 ${monthlyLines.length} 行・資料名 ${shownDocNames.size} 種（すべて台帳にあり）` +
        `${capMissing.length > 0 ? '・上限価格は未検査' : ''}  ok`,
    );
  } else {
    for (const p of sourceProblems) problems.push(`軸5 ${p}`);
  }

  // 軸6: 上限価格の注記（軸5 の後に出す）
  if (capNoteLine) console.log(`${capNoteLine}  ${capProblems.length === 0 ? 'ok' : '★NG'}`);
  if (capInfoLine) console.log(capInfoLine);
  for (const p of capProblems) problems.push(`軸6 上限価格の注記: ${p}`);

  // 軸6: 利用条件（月次・上限の license_notice／license_url が、ページに出している年次の 3 行と同一か）
  const shown = readCatalog(DISPLAYED_LICENSE_SERIES)?.meta;
  const licenseIds = [
    ...PRODUCTS.map((p) => `balancing-price-monthly-${p}-battery`),
    ...(capMissing.length > 0 ? [] : CAP_PRODUCTS.map((p) => `balancing-price-cap-${p}`)),
  ];
  const licenseDiffs: string[] = [];
  if (!shown) {
    problems.push(`軸6 利用条件: ページに出している ${DISPLAYED_LICENSE_SERIES} が読めず比較できない`);
  } else {
    for (const id of licenseIds) {
      const m = readCatalog(id)?.meta;
      if (!m) licenseDiffs.push(`${id}（読めない）`);
      else if (m.license_notice !== shown.license_notice || m.license_url !== shown.license_url) licenseDiffs.push(id);
    }
    if (licenseDiffs.length === 0) {
      console.log(
        `[verify:eprx-monthly] 軸6 利用条件: 月次 ${PRODUCTS.length}・上限 ${capMissing.length > 0 ? '未検査' : `${CAP_PRODUCTS.length} 本`}の license_notice／license_url ＝ ページに出している ${DISPLAYED_LICENSE_SERIES}  ok`,
      );
    } else {
      problems.push(
        `軸6 利用条件: ${licenseDiffs.join(', ')} の license_notice／license_url がページに出している ${DISPLAYED_LICENSE_SERIES} と違う（その系列の利用条件がページに出ていない）`,
      );
    }
  }

  summaryLine =
    `[verify:eprx-monthly] ${checked} / ${FY_KEYS.length * PRODUCTS.length} 組を検査（軸1〜3）・${cells} セル（軸4）・出典（軸5）・上限価格と利用条件（軸6）`;
}

main()
  .catch((e) => {
    problems.push(`検査が例外で途中で止まった（以降の軸は未検査）: ${(e as Error).message}`);
  })
  // 警告のみ・ビルドは止めない（exit 0 固定）。表示側の自己ガードが読者影響を防ぐ。
  .finally(() => {
    printResult();
    process.exit(0);
  });
