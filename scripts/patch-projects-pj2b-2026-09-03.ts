#!/usr/bin/env tsx
/**
 * scripts/patch-projects-pj2b-2026-09-03.ts — Pj2-B: projects 差分 PATCH（承認54行）
 *
 * 承認: 02_計画・運営/検証記録_Pj2A_承認表_2026-09-03_ユウ.md（55行中54行承認・#41 却下）
 * 提案の出所: reports/projects-backfill-2026-09.md (a) の表
 *
 * ■ 付帯指示の適用（実査結果つき）
 *  (i)  city は都道府県を含めない — 実査: city 値あり215件中212件が「含まない」＝多数派。
 *       #20「宮城県角田市」→「角田市」／#39「北海道夕張郡長沼町」→「夕張郡長沼町」
 *  (ii) #38・#53 は実測分岐 → **両件とも運開日の一次記載なし・完工日のみ** のため **スキップ**
 *       #53 一次: 「2025年11月に着工、2026年１月に完工するべく」（運転開始の語なし）
 *       #38 一次: 「2027年度の完工予定」（運転開始は制度説明の文脈のみで当該設備の運開日ではない）
 *  (iii) cod は既存様式に正規化 — 実査: cod 値あり254件で YYYY-MM-DD 199 / YYYY年M月 39 /
 *       YYYY年度系 10 / YYYY年M月（予定）5 / YYYY年M月D日 1。
 *       日付が確定している行は YYYY-MM-DD、月までの行は「YYYY年M月（予定）」に寄せる。
 *  (iv) 数値フィールドはフィールド単位へ換算して格納（承認表 §2 の是正方針）。
 *       #9 「約2MW」→ outputMw = 2 ／ #10 「約8MWh」→ capacityMwh = 8。
 *       ★projects に notes 相当のフィールドは存在しない（実在フィールド: body/capacityMwh/city/
 *         marketParticipation/name/operator/outputMw/prefecture/slug/sourceUrl/status）ため
 *         「約」は格納できない。原文が概数である旨は sourceUrl 先が担保する（報告に換算元を記録）。
 *
 * ■ 却下
 *  #41 pr-looop-saitama capacityMwh 7.684 → 「7,683.8kWh」: 現状値が正しい MWh 換算のため実行しない。
 *
 * PATCH のみ（POST/DELETE 禁止）。各行 PATCH 前に現状値を GET 照合し、
 * 表の「現状値」と食い違えばその行をスキップ（誰かが先に直した可能性）。
 * PATCH 後は GET 全field照合（#106・変更フィールド以外の不変も確認）。
 * 冪等: 現状値 = 提案値なら skip。
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

type Row = { n: number; slug: string; field: string; current: string; proposed: string; url: string; quote: string };

/** 却下・スキップ行（承認表・実測分岐による） */
const REJECTED = new Set([41]); // 承認表 §2 で却下
const SKIP_MEASURED = new Map<number, string>([
  [38, '実測分岐(ii): 一次は「2027年度の完工予定」のみで運開日の記載なし → 完工日を cod に入れない'],
  [53, '実測分岐(ii): 一次は「2026年1月に完工」のみで運開日の記載なし → 完工日を cod に入れない'],
]);

/** 付帯指示(i)(iii)(iv) による値の正規化。null を返したらその行はスキップ */
function normalize(row: Row): { value: string | number; note: string } | null {
  const p = row.proposed.trim();
  if (row.field === 'city') {
    // (i) 都道府県を含めない（既存215件中212件がこの様式）
    const stripped = p.replace(/^(北海道|東京都|京都府|大阪府|.{2,3}県)/, '');
    return { value: stripped, note: stripped !== p ? `付帯(i) 都道府県を除去: 「${p}」→「${stripped}」` : '' };
  }
  if (row.field === 'cod') {
    // (iii) 既存様式へ正規化
    let m = /^(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(p);
    if (m) {
      const v = `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
      return { value: v, note: `付帯(iii) YYYY-MM-DD へ正規化: 「${p}」→「${v}」` };
    }
    m = /^(\d{4})年(\d{1,2})月/.exec(p);
    if (m) {
      const v = `${m[1]}年${Number(m[2])}月（予定）`;
      return { value: v, note: `付帯(iii) 既存様式へ正規化: 「${p}」→「${v}」` };
    }
    return null; // 年度のみ・自由記述は正規化できない → スキップ（#38 はここに来る前に SKIP_MEASURED）
  }
  if (row.field === 'outputMw' || row.field === 'capacityMwh') {
    // (iv) フィールド単位へ換算
    const num = /([0-9]+(?:\.[0-9]+)?)/.exec(p.replace(/,/g, ''));
    if (!num) return null;
    return { value: Number(num[1]), note: `付帯(iv) 数値へ換算（換算元の原文: 「${p}」・「約」はフィールドに格納不可）` };
  }
  return { value: p, note: '' };
}

/** 表の「現状値」表記と実データの一致判定（(なし)/（空欄…）等のゆらぎを吸収） */
function currentMatches(row: Row, actual: unknown): boolean {
  const c = row.current.trim();
  const isEmptyExpr = /^[（(]?(なし|未設定|空欄|空)/.test(c) || c === '—';
  if (isEmptyExpr) return actual === undefined || actual === null || actual === '';
  if (row.field === 'outputMw' || row.field === 'capacityMwh') {
    const num = /([0-9]+(?:\.[0-9]+)?)/.exec(c.replace(/,/g, ''));
    return num ? Number(num[1]) === Number(actual) : false;
  }
  return String(actual ?? '') === c;
}

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

async function main(): Promise<void> {
  const fs = await import('node:fs');
  const rows: Row[] = JSON.parse(fs.readFileSync('scripts/_pj2b_rows.json', 'utf8'));
  console.log(`[pj2b] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / 表の行数=${rows.length}（承認54・却下1）`);

  let applied = 0, skipped = 0, failed = 0;
  const log: string[] = [];

  for (const row of rows) {
    const tag = `#${String(row.n).padStart(2)} ${row.slug} .${row.field}`;
    if (REJECTED.has(row.n)) {
      console.log(`  [却下] ${tag} — 承認表 §2 で却下（現状値が正しい MWh 換算）`);
      skipped++; log.push(`却下 ${tag}`);
      continue;
    }
    if (SKIP_MEASURED.has(row.n)) {
      console.log(`  [スキップ] ${tag} — ${SKIP_MEASURED.get(row.n)}`);
      skipped++; log.push(`スキップ(実測分岐) ${tag}`);
      continue;
    }
    const before = await getBySlug(row.slug);
    if (!before) {
      console.log(`  [★NG] ${tag} — レコードが見つからない`);
      failed++; continue;
    }
    const norm = normalize(row);
    if (!norm) {
      console.log(`  [スキップ] ${tag} — 提案値を既存様式へ正規化できない（「${row.proposed}」）`);
      skipped++; log.push(`スキップ(様式不能) ${tag}`);
      continue;
    }
    const actual = before[row.field];
    // 冪等: 既に提案値なら skip
    if (String(actual ?? '') === String(norm.value)) {
      console.log(`  [skip] ${tag} — 既に提案値（冪等 #91）`);
      skipped++; continue;
    }
    // 現状値の一致確認
    if (!currentMatches(row, actual)) {
      console.log(`  [スキップ] ${tag} — 現状値が表と不一致（表=「${row.current}」／実データ=${JSON.stringify(actual)}）→ 誰かが先に直した可能性`);
      skipped++; log.push(`スキップ(現状値不一致) ${tag} 実=${JSON.stringify(actual)}`);
      continue;
    }
    console.log(`  [PATCH] ${tag}: ${JSON.stringify(actual)} → ${JSON.stringify(norm.value)}${norm.note ? `  ※${norm.note}` : ''}`);
    if (DRY) { applied++; continue; }

    await api('PATCH', `${BASE}/${before.id}`, { [row.field]: norm.value });
    await new Promise((r) => setTimeout(r, 800));
    const after = await getBySlug(row.slug);
    const okField = String(after?.[row.field] ?? '') === String(norm.value);
    const others: string[] = [];
    for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {})])) {
      if (SYS.has(k) || k === row.field) continue;
      if (JSON.stringify(before[k]) !== JSON.stringify(after?.[k])) others.push(k);
    }
    if (okField && others.length === 0) {
      console.log(`     #106: ✓ 反映・他フィールド変化0`);
      applied++;
    } else {
      console.log(`     ★#106 NG: 反映=${okField} 他フィールド変化=${others.join(',') || '0'}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n[done] 実行 ${applied} / スキップ ${skipped} / 失敗 ${failed}`);
  log.forEach((l) => console.log(`  - ${l}`));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

export {};
