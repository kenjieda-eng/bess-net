#!/usr/bin/env tsx
/**
 * scripts/patch-projects-pj2e-2026-09-03.ts — Pj2-E: body 1件 ＋ name 2件の PATCH
 *
 * 承認: 02_計画・運営/検証記録_Pj2D_裁定_2026-09-03_ユウ.md
 *   §1「E（energia）実測分岐: 中国電力 PDF『所在地：山口県下松市』・原文に広島 0回——修正案 承認（#122 marker 方式）」
 *   §4 裁定C「name 個別化 2件 — 承認」
 *   §5「microCMS PATCH: energia body 1件＋name 2件の計3件のみ」
 *
 * ★本便の microCMS 書込はこの3件のみ。他のフィールド・他のレコードには一切触らない。
 *
 * ■ #122 対応（richEditor は保存時に正規化する）
 *   body の冪等判定に「送信した HTML の全文一致」を使わない。
 *   marker は正規化の影響を受けない**素の本文**を使う:
 *     - 未適用の marker: 「広島県内に立地予定です」（これが残っていれば未適用）
 *     - 適用済みの marker: 「山口県下松市（下松発電所跡地）に立地予定です」
 *   置換型（from → to）なので from ⊄ to であり、両方向を完了条件にしてよい。
 *   PATCH 後の照合も「送信値との一致」ではなく **marker の存在／不在** で判定する。
 *
 * ■ 一次（energia）
 *   中国電力 2025-12-05「下松蓄電所の建設工事開始について」
 *   https://www.energia.co.jp/assets/press/2025/p20251205-2.pdf
 *   「当社は、本日、当社初の蓄電所となる「下松蓄電所」（所在地：山口県下松市、2024年12月27日
 *     お知らせ済み）の建設工事を開始しましたので、お知らせします。」
 *   【蓄電所概要】「所在地　下松発電所跡地（山口県下松市大字平田字東潮上」
 *   ★原文に「広島」の語は 0 回。body の「広島県内」は中国電力の本店（広島市中区）との取り違え。
 *
 * ■ 一次（name 2件）
 *   PR 000000042: 「系統用蓄電池事業「紀の川桃山町蓄電所」における工事着工のお知らせ」
 *   PR 000000037: 「系統用蓄電池事業「紀の川上田井蓄電所」における工事着工のお知らせ」
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

/** body の marker 置換（#122） */
const BODY_JOB = {
  slug: 'energia-first-bess',
  /** 未適用の marker（素の本文・正規化の影響を受けない） */
  from: '広島県内に立地予定です',
  /** 適用後の marker */
  to: '山口県下松市（下松発電所跡地）に立地予定です',
  why:
    '一次（中国電力 2025-12-05「下松蓄電所の建設工事開始について」）に「所在地：山口県下松市」' +
    '「所在地　下松発電所跡地（山口県下松市大字平田字東潮上」と明記。原文に「広島」は0回。' +
    '「広島県内」は発表主体・中国電力の本店（広島市中区）を設備所在地と取り違えたもの。',
};

/** name の個別化（裁定C） */
const NAME_JOBS = [
  {
    slug: 'pr-co88876-bess',
    expect: '系統用蓄電池（スターシーズ株式会社）',
    value: '紀の川桃山町蓄電所（スターシーズ）',
    why: '一次タイトル「系統用蓄電池事業「紀の川桃山町蓄電所」における工事着工のお知らせ」（PR 000000042・逐語）',
  },
  {
    slug: 'pr-co88876-bess-2',
    expect: '系統用蓄電池（スターシーズ株式会社）',
    value: '紀の川上田井蓄電所（スターシーズ）',
    why: '一次タイトル「系統用蓄電池事業「紀の川上田井蓄電所」における工事着工のお知らせ」（PR 000000037・逐語）',
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

/** 変更フィールド以外の不変を確認（#106） */
function otherFieldDiffs(
  before: Record<string, unknown>,
  after: Record<string, unknown> | null,
  field: string
): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {})])) {
    if (SYS.has(k) || k === field) continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after?.[k])) out.push(k);
  }
  return out;
}

let applied = 0, skipped = 0, failed = 0;

async function runBodyJob(): Promise<void> {
  const j = BODY_JOB;
  console.log(`\n■ body PATCH: ${j.slug}`);
  const before = await getBySlug(j.slug);
  if (!before) {
    console.log('  ★NG: レコードが見つからない');
    failed++;
    return;
  }
  const body = String(before.body ?? '');
  const hasFrom = body.includes(j.from);
  const hasTo = body.includes(j.to);
  console.log(`  marker 判定（#122・素の本文で判定）: 未適用「${j.from}」=${hasFrom} / 適用済「${j.to}」=${hasTo}`);

  if (hasTo && !hasFrom) {
    console.log('  [skip] 既に適用済み（冪等 #91）');
    skipped++;
    return;
  }
  if (!hasFrom) {
    console.log(`  [スキップ] 未適用 marker が本文に無い → 想定外の状態のため書き込まない`);
    console.log(`             本文冒頭: ${body.replace(/<[^>]+>/g, '').slice(0, 160)}`);
    skipped++;
    return;
  }
  const occurrences = body.split(j.from).length - 1;
  if (occurrences !== 1) {
    console.log(`  [スキップ] marker が ${occurrences} 箇所ある → 一意でないため書き込まない`);
    skipped++;
    return;
  }

  const next = body.replace(j.from, j.to);
  console.log(`  [PATCH] 「${j.from}」→「${j.to}」`);
  console.log(`          理由: ${j.why}`);
  console.log(`          文字数 ${body.length} → ${next.length}（差 ${next.length - body.length}）`);
  if (DRY) { applied++; return; }

  await api('PATCH', `${BASE}/${before.id}`, { body: next });
  await new Promise((r) => setTimeout(r, 1200));
  const after = await getBySlug(j.slug);
  const ab = String(after?.body ?? '');

  // ★#122: 送信値との全文一致では判定しない。marker の存在／不在で判定する
  const okFrom = !ab.includes(j.from);
  const okTo = ab.includes(j.to);
  const exact = ab === next;
  const others = otherFieldDiffs(before, after, 'body');
  console.log(`  #106/#122: 旧marker消滅=${okFrom ? '✓' : '★NG'} / 新marker存在=${okTo ? '✓' : '★NG'} / 他フィールド変化=${others.join(',') || '0'}`);
  console.log(`             送信値との全文一致=${exact}（false でも失敗ではない＝richEditor の保存時正規化）`);
  if (!exact) {
    console.log(`             ※差異は正規化由来。意図した文言は上記2つの marker で確認済み`);
  }
  if (okFrom && okTo && others.length === 0) applied++;
  else failed++;
}

async function runNameJobs(): Promise<void> {
  for (const j of NAME_JOBS) {
    console.log(`\n■ name PATCH: ${j.slug}`);
    const before = await getBySlug(j.slug);
    if (!before) { console.log('  ★NG: レコードが見つからない'); failed++; continue; }
    const cur = String(before.name ?? '');
    if (cur === j.value) { console.log(`  [skip] 既に「${j.value}」（冪等 #91）`); skipped++; continue; }
    if (cur !== j.expect) {
      console.log(`  [スキップ] 現状値が承認時と不一致（承認時=「${j.expect}」／現在=「${cur}」）`);
      skipped++; continue;
    }
    console.log(`  [PATCH] name: 「${cur}」→「${j.value}」`);
    console.log(`          理由: ${j.why}`);
    if (DRY) { applied++; continue; }

    await api('PATCH', `${BASE}/${before.id}`, { name: j.value });
    await new Promise((r) => setTimeout(r, 1000));
    const after = await getBySlug(j.slug);
    const okField = String(after?.name ?? '') === j.value;
    const others = otherFieldDiffs(before, after, 'name');
    console.log(`  #106: 反映=${okField ? '✓' : '★NG'}（実値「${after?.name}」）/ 他フィールド変化=${others.join(',') || '0'}`);
    if (okField && others.length === 0) applied++; else failed++;
    await new Promise((r) => setTimeout(r, 400));
  }
}

async function main(): Promise<void> {
  console.log(`[pj2e] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / 承認スコープ: body 1件 ＋ name 2件 の計3件のみ`);
  await runBodyJob();
  await runNameJobs();
  console.log(`\n[done] 実行 ${applied} / スキップ ${skipped} / 失敗 ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

export {};
