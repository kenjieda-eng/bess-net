/**
 * scripts/projects-normalize-stage2a.ts
 *
 * /projects 正規化ステージ2A（2026-06-26 ユウ承認）。
 *   PART1（適用）: E 所在地の都道府県サフィックス正規化（群馬→群馬県 等・想定17件）。
 *   PART2（適用）: A 破損タイトル修正（5 slug 指定・現値一致時のみ）。
 *   PART3（dry-run のみ）: B 量産タイトルへの operator 付与候補一覧（適用しない）。
 *
 * 安全:
 *   - データ源 getAllProjects()（1スキャン・contains不使用＝鉄則#1/#97/#98）。
 *   - 冪等 PATCH（既に目標値なら skip・鉄則#90/#91）。新事実を作らない（L-EIC-019）。
 *   - 落とし穴#104: 本ファイルは module（先頭 export {}）。push 前 npx tsc --noEmit。
 *   - PATCH 前後で before→after を print。--dry-run で書き込みなしプレビュー。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-normalize-stage2a.ts [--dry-run]
 */
export {};
import { getAllProjects, type Project } from '../src/lib/microcms';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;

async function apiFetch(method: 'GET' | 'PATCH', url: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text.slice(0, 300)}`);
  }
  return resp.json();
}
async function patchById(id: string, fields: Record<string, unknown>): Promise<void> {
  if (DRY_RUN) return;
  await apiFetch('PATCH', `${BASE}/${id}`, fields);
}

// ── 都道府県 canonical マップ ──────────────────────────────
const PREF47 = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県',
'群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県',
'長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県',
'和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県',
'福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
const PREF_SET = new Set(PREF47);
const PREF_BARE: Record<string, string> = {};
for (const p of PREF47) {
  if (p.endsWith('県') || p.endsWith('府')) PREF_BARE[p.slice(0, -1)] = p; // 群馬→群馬県, 大阪→大阪府
}
PREF_BARE['東京'] = '東京都';
// 北海道 は canonical（bare 形なし＝対象外）。「全国」等は PREF_BARE キーでないため不変。

// ── PART2 破損タイトル修正（slug 指定・現値一致時のみ） ──────
const TITLE_FIXES: { slug: string; cur: string; next: string }[] = [
  { slug: 'pr-co93934-bess-3',  cur: 'との蓄電所',                                  next: '系統用蓄電池（fantasista）' },
  { slug: 'pr-co89612-bess',    cur: '社との系統用蓄電池',                          next: '系統用蓄電池（マーチャントバンカーズ）' },
  { slug: 'pr-japan-bess',      cur: 'Japan株式会社との系統用蓄電池',              next: '系統用蓄電池（ブルースカイエナジー）' },
  { slug: 'pr-energy-ntt-bess', cur: 'ENERGYがNTTアノードエナジーの系統用蓄電所', next: '系統用蓄電所（TAOKE ENERGY）' },
  { slug: 'pr-energy-bess',     cur: 'ENERGYが開発した岩手北上蓄電所',            next: '岩手北上蓄電所（TAOKE ENERGY）' },
];

// ── PART3 generic 判定 ─────────────────────────────────────
const GENERIC_EXACT = new Set(['系統用蓄電池','系統用蓄電所','蓄電所','蓄電池','日本蓄電池',
'系統用蓄電池プロジェクト','系統用蓄電所プロジェクト','系統用蓄電池事業','蓄電所プロジェクト',
'系統蓄電所','次世代蓄電池','大型蓄電池']);
const GENERIC_RE = /^(低圧)?(系統用?)?(再エネ併設型|次世代|大型)?蓄電(池|所|システム)(事業|プロジェクト)?$/;
const coreName = (s: string) => (s || '').replace(/[（(][^（）()]*[)）]\s*$/, '').trim();
const opCore = (s: string) =>
  (s || '').replace(/(株式会社|合同会社|有限会社|（株）|\(株\)|㈱)/g, '').trim();

async function main(): Promise<void> {
  console.log(`[projects-normalize-stage2a] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const projects: Project[] = await getAllProjects();
  console.log(`getAllProjects: ${projects.length} 件取得`);
  // フィールドid 確認（PATCH 先が name/prefecture で正しいか）
  const k = Object.keys(projects[0] as unknown as Record<string, unknown>);
  console.log(`fields: ${k.filter((x) => ['name','prefecture','operator','slug'].includes(x)).join(',')} (raw keys=${k.length})`);

  const bySlug = new Map(projects.map((p) => [p.slug, p]));

  // ── PART1: 都道府県サフィックス正規化 ────────────────────
  console.log(`\n=== PART1: 所在地サフィックス正規化 ===`);
  let p1ok = 0, p1skip = 0;
  for (const p of projects) {
    const cur = p.prefecture;
    if (!cur) continue;
    const target = PREF_BARE[cur];
    if (!target) continue;            // 既に canonical / 全国 / 北海道 → 対象外
    if (cur === target) { p1skip++; continue; }
    console.log(`  ${p.slug}: prefecture「${cur}」→「${target}」`);
    await patchById(p.id, { prefecture: target });
    p1ok++;
  }
  // 冪等確認用: 既に canonical な bare 由来件数
  const alreadyCanon = projects.filter((p) => p.prefecture && PREF_SET.has(p.prefecture)).length;
  console.log(`  PART1: ${DRY_RUN ? '(対象)' : 'PATCH'} ${p1ok} 件 / 既canonical参考=${alreadyCanon}`);

  // ── PART2: 破損タイトル修正 ──────────────────────────────
  console.log(`\n=== PART2: 破損タイトル修正（5件） ===`);
  let p2ok = 0, p2done = 0, p2miss = 0;
  for (const fix of TITLE_FIXES) {
    const p = bySlug.get(fix.slug);
    if (!p) { console.log(`  [skip] ${fix.slug}: 見つからない`); p2miss++; continue; }
    if (p.name === fix.next) { console.log(`  [skip-done] ${fix.slug}: 既に「${fix.next}」`); p2done++; continue; }
    if (p.name !== fix.cur) { console.log(`  [skip-mismatch] ${fix.slug}: 現値「${p.name}」が想定「${fix.cur}」と不一致`); p2miss++; continue; }
    console.log(`  ${fix.slug}: name「${p.name}」→「${fix.next}」`);
    await patchById(p.id, { name: fix.next });
    p2ok++;
  }
  console.log(`  PART2: ${DRY_RUN ? '(対象)' : 'PATCH'} ${p2ok} 件 / 既済 ${p2done} / skip ${p2miss}`);

  // ── PART3: B 量産タイトル operator 付与候補（dry-run のみ・常に適用なし） ──
  console.log(`\n=== PART3: B operator付与候補（適用なし） ===`);
  const candidates: { slug: string; title: string; operator: string; proposal: string }[] = [];
  const needSource: { slug: string; title: string; operator: string }[] = [];
  for (const p of projects) {
    const title = p.name || '';
    const cn = coreName(title);
    const isGeneric = GENERIC_EXACT.has(cn) || GENERIC_RE.test(cn);
    if (!isGeneric) continue;
    const op = (p.operator || '').trim();
    if (!op) continue; // operator 空は対象外（B のうち operator なしは要一次情報・別途）
    // title==operator（operator付与で重複解消できない）→ 別掲
    if (title === op || opCore(op) === title || title.includes(opCore(op)) || op.includes(title)) {
      needSource.push({ slug: p.slug, title, operator: op });
      continue;
    }
    if (!title.includes(op)) {
      candidates.push({ slug: p.slug, title, operator: op, proposal: `${title}（${op}）` });
    }
  }
  console.log(`  候補(operator付与可): ${candidates.length} 件 / 別掲(title==operator 要一次情報): ${needSource.length} 件`);

  // PART3 一覧を機械可読で出力（チャット貼付用に JSON も保存）
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.join(process.cwd(), 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'projects-stage2a-part3.json'),
    JSON.stringify({ candidates, needSource }, null, 2));
  console.log(`  → tmp/projects-stage2a-part3.json に保存`);

  console.log(`\n[done] PART1=${p1ok} PART2=${p2ok}（mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}）`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
