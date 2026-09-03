#!/usr/bin/env tsx
/**
 * scripts/patch-projects-pj2c-2026-09-03.ts — Pj2-C: 再承認 24行の裁定実行（PATCH 16行）
 *
 * 承認: 02_計画・運営/検証記録_Pj2B_再承認裁定_2026-09-03_ユウ.md
 *   実行 16 ＋ 実測分岐 3（#2/#5/#33・別便）＋ 現状維持 5（#13 #1 #32 #37 #39）＝ 24
 * 提案の出所: reports/projects-pj2b-reapproval-2026-09-03.md（実データ列は 9/3 の GET 実測）
 *
 * ■ 裁定で変わった点（Pj2-B の付帯指示からの変更）
 *   D規則: city は「郡を含めない」に確定（CC 推奨をユウが採用）。
 *     → #40 の提案値「比企郡小川町」は **「小川町」** に正規化して実行
 *     → #39 naganuma-bess の「長沼町 → 夕張郡長沼町」は **却下**（付帯指示(i)を撤回・現状維持）
 *
 * ■ 実行 16 行
 *   A（city 破損の是正）3: #20 #23 #40
 *   B（prefecture 誤り）2: #7 #22
 *   C（city null → 値）2: #8 #14
 *   D（郡様式）1: #31
 *   E（cod が発表日 → 運開日）2: #11 #42
 *   F-1（トップ/一覧 → 個別リリース）4: #21 #43 #49 #50
 *   F-2（実行2）: #12 #51
 *
 * PATCH のみ（POST/DELETE 禁止）。各行 PATCH 前に GET し、再承認レポートの「実データ値」と
 * 一致することを確認してから PATCH（不一致はスキップして報告＝#91 の安全弁・Pj2-B で機能した段）。
 * PATCH 後は GET 全field照合（#106・変更フィールド以外の不変も確認）。
 * 冪等: 既に目標値なら skip。
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1/projects`;
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

type Row = {
  n: number;
  group: string;
  slug: string;
  field: string;
  /** PATCH 前に一致していることを確認する現在値（再承認レポートの実データ列） */
  expect: string | number | null;
  /** 書き込む値 */
  value: string | number;
  why: string;
};

const ROWS: Row[] = [
  // ── A: city にPRタイトル断片が混入（同一取込器の事故）
  {
    n: 20, group: 'A', slug: 'pr-tecra-miyagi', field: 'city',
    expect: '【想定年利12.0%】不動産クラウドファンディング「TECROWD」、国内開発型ファンド「宮城県角田市',
    value: '角田市',
    why: 'PRタイトル断片の混入を除去。D規則により都道府県を含めない',
  },
  {
    n: 23, group: 'A', slug: 'pr-co176308-bess', field: 'city',
    expect: 'Solutions、東京電力グループと共同開発。日本の市',
    value: '庄原市',
    why: 'PRタイトル断片の混入を除去。一次＝広島県庄原市（ユウ 9/3 逐語確認）',
  },
  {
    n: 40, group: 'A', slug: 'pr-looop-saitama', field: 'city',
    expect: '～電力卸市',
    value: '小川町',
    why: 'PRタイトル断片の混入を除去。★裁定でD規則適用＝「比企郡小川町」→「小川町」',
  },
  // ── B: prefecture が誤り（本社所在地の混入等・A と同一事故）
  {
    n: 7, group: 'B', slug: 'pr-co160356-bess-2', field: 'prefecture',
    expect: '三重県',
    value: '熊本県',
    why: '一次は熊本県益城町（ADW 益城）。三重県は同社第一拠点（三重松阪）の混入',
  },
  {
    n: 22, group: 'B', slug: 'pr-co176308-bess', field: 'prefecture',
    expect: '東京都',
    value: '広島県',
    why: '一次は広島県庄原市。東京都は本社所在地の混入（ユウ 9/3 特定）',
  },
  // ── C: city が null → 値
  {
    n: 8, group: 'C', slug: 'pr-co160356-bess-2', field: 'city',
    expect: null,
    value: '益城町',
    why: '一次「熊本県益城町」。D規則により郡（上益城郡）を含めない',
  },
  {
    n: 14, group: 'C', slug: 'pr-co143072-bess', field: 'city',
    expect: null,
    value: '菊川市',
    why: '一次「静岡県菊川市」',
  },
  // ── D: 郡様式（裁定＝郡を含めない）
  {
    n: 31, group: 'D', slug: 'pr-co173175-shiga-4mwh', field: 'city',
    expect: '愛知郡愛荘町',
    value: '愛荘町',
    why: '裁定D規則＝郡を含めない。町村名は県内で実用上一意・市表記と粒度が揃う',
  },
  // ── E: cod がリリース発表日 → 実際の運開日
  {
    n: 11, group: 'E', slug: 'pr-co160356-bess-2', field: 'cod',
    expect: '2026-02-12',
    value: '2026-08-31',
    why: '一次「2026年8月31日 竣工・引渡し、稼働開始」。既存 2/12 はリリース発表日',
  },
  {
    n: 42, group: 'E', slug: 'pr-looop-saitama', field: 'cod',
    expect: '2025-04-03',
    value: '2025-02-21',
    why: '一次「2025年2月21日」運開。既存 4/3 はリリースURLの日付（4923_20250403）',
  },
  // ── F-1: 企業トップ/一覧ページ → 個別リリース
  {
    n: 21, group: 'F-1', slug: 'pr-tecra-miyagi', field: 'sourceUrl',
    expect: 'https://tecrowd.jp/',
    value: 'https://prtimes.jp/main/html/rd/p/000000143.000061009.html',
    why: '企業トップ → 当該案件の個別リリース',
  },
  {
    n: 43, group: 'F-1', slug: 'pr-looop-saitama', field: 'sourceUrl',
    expect: 'https://looop.co.jp/',
    value: 'https://looop.co.jp/info/4923_20250403',
    why: '企業トップ → 当該案件の個別リリース（自社一次）',
  },
  {
    n: 49, group: 'F-1', slug: 'pr-co140317-bess', field: 'sourceUrl',
    expect: 'https://www.jicn.co.jp/',
    value: 'https://prtimes.jp/main/html/rd/p/000000034.000140317.html',
    why: '企業トップ → 当該案件の個別リリース',
  },
  {
    n: 50, group: 'F-1', slug: 'jpn-gifu-sendai', field: 'sourceUrl',
    expect: 'https://www.nipponchikudenchi.co.jp/news/',
    value: 'https://prtimes.jp/main/html/rd/p/000000056.000161802.html',
    why: 'ニュース一覧 → 当該案件の個別リリース',
  },
  // ── F-2: 実行2
  {
    n: 12, group: 'F-2', slug: 'pr-co160356-bess-2', field: 'sourceUrl',
    expect: 'https://prtimes.jp/main/html/rd/p/000000043.000160356.html',
    value: 'https://prtimes.jp/main/html/rd/p/000000085.000160356.html',
    why: '043＝三重松阪リリース。B で県を熊本に直すため出典も益城（085）へ揃える',
  },
  {
    n: 51, group: 'F-2', slug: 'namie-redox-flow', field: 'sourceUrl',
    expect: 'https://project.nikkeibp.co.jp/ms/atcl/19/news/00001/05614/?ST=msb',
    value: 'https://prtimes.jp/main/html/rd/p/000000007.000110789.html',
    why: '二次（媒体記事）→ 一次（リリース）。恒久ルール2',
  },
  // ── F-2 実測分岐（裁定「提案側が当該案件と確定した場合のみ実行」）
  //    一次照合の結果 #2・#5 は EXECUTE 確定、#33 ota-bess は KEEP（現状維持）。
  //    #33 は 039＝運転開始（2025-08-01）／027＝工事着工（2024-12-10）で、027 は運開を
  //    「2025年8月1日（予定）」としか書かない。差し替えると status=稼働中 の根拠が
  //    「予定」段階へ後退＝劣化するため実行しない。
  {
    n: 2, group: 'F-2実測', slug: 'pr-co76147-bess-2', field: 'sourceUrl',
    expect: 'https://ssl4.eir-parts.net/doc/8439/ir_material12/268748/00.pdf',
    value: 'https://prtimes.jp/main/html/rd/p/000000212.000076147.html',
    why: '一次照合で同一発表と確定（2025-12-12・合計101MW・4カ所の定格出力/定格容量/運開年度が全一致）。適時開示PDFは保存期間で失効しうるため恒久URLへ',
  },
  {
    n: 5, group: 'F-2実測', slug: 'pr-co55631-tokyo-4mw', field: 'sourceUrl',
    expect: 'https://prtimes.jp/main/html/rd/p/000000104.000055631.html',
    value: 'https://prtimes.jp/main/html/rd/p/000000129.000055631.html',
    why: '一次照合で 129＝当該事象（2案件4MW・群馬・運転開始2024-12-15）の一次と確定。104 は2023-08-30の事業参入発表で対象3案件・出力記載なし',
  },
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}

async function getBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const d = await api<{ contents: Array<Record<string, unknown>> }>(
    'GET',
    `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`
  );
  return d.contents[0] ?? null;
}

/** 期待値との一致（null は「未設定/空」を意味する） */
function matches(expect: Row['expect'], actual: unknown): boolean {
  if (expect === null) return actual === undefined || actual === null || actual === '';
  if (typeof expect === 'number') return Number(actual) === expect;
  return String(actual ?? '') === expect;
}

async function main(): Promise<void> {
  console.log(`[pj2c] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / 実行対象 ${ROWS.length} 行（裁定: 実行16＋実測分岐3＋現状維持5＝24）`);
  let applied = 0, skipped = 0, failed = 0;
  const done: string[] = [], skip: string[] = [], ng: string[] = [];

  for (const row of ROWS) {
    const tag = `#${String(row.n).padStart(2)} [${row.group}] ${row.slug}.${row.field}`;
    const before = await getBySlug(row.slug);
    if (!before) {
      console.log(`  [★NG] ${tag} — レコードが見つからない`);
      failed++; ng.push(`${tag} 不存在`);
      continue;
    }
    const actual = before[row.field];

    // 冪等: 既に目標値
    if (String(actual ?? '') === String(row.value)) {
      console.log(`  [skip] ${tag} — 既に目標値「${row.value}」（冪等 #91）`);
      skipped++; skip.push(`${tag} 冪等`);
      continue;
    }
    // 安全弁: 承認時の実データと一致するか
    if (!matches(row.expect, actual)) {
      console.log(`  [スキップ] ${tag} — 承認時の実データと不一致（承認時=${JSON.stringify(row.expect)} ／ 現在=${JSON.stringify(actual)}）`);
      skipped++; skip.push(`${tag} 現状値不一致 現在=${JSON.stringify(actual)}`);
      continue;
    }

    console.log(`  [PATCH] ${tag}: ${JSON.stringify(actual)} → ${JSON.stringify(row.value)}`);
    console.log(`          理由: ${row.why}`);
    if (DRY) { applied++; continue; }

    await api('PATCH', `${BASE}/${before.id}`, { [row.field]: row.value });
    await new Promise((r) => setTimeout(r, 800));
    const after = await getBySlug(row.slug);
    const okField = String(after?.[row.field] ?? '') === String(row.value);
    const others: string[] = [];
    for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {})])) {
      if (SYS.has(k) || k === row.field) continue;
      if (JSON.stringify(before[k]) !== JSON.stringify(after?.[k])) others.push(k);
    }
    if (okField && others.length === 0) {
      console.log(`          #106: ✓ 反映・他フィールド変化0`);
      applied++; done.push(`${tag} → ${JSON.stringify(row.value)}`);
    } else {
      console.log(`          ★#106 NG: 反映=${okField} 他フィールド変化=${others.join(',') || '0'}`);
      failed++; ng.push(`${tag} 照合NG`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n[done] 実行 ${applied} / スキップ ${skipped} / 失敗 ${failed}`);
  if (done.length) { console.log('  ── 実行'); done.forEach((l) => console.log(`   ${l}`)); }
  if (skip.length) { console.log('  ── スキップ'); skip.forEach((l) => console.log(`   ${l}`)); }
  if (ng.length) { console.log('  ── ★NG'); ng.forEach((l) => console.log(`   ${l}`)); }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

export {};
