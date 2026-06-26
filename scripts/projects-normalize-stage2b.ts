/**
 * scripts/projects-normalize-stage2b.ts
 *
 * /projects 正規化ステージ2B（2026-06-26 ユウ承認）。
 *   B 量産タイトル（generic-only）に operator を付与: name = 「{現title}（{operator}）」。
 *   stage-2A PART3 の dry-run で確定した想定49件が対象。
 *
 * 安全:
 *   - データ源 getAllProjects()（1スキャン・contains不使用＝鉄則#1/#97/#98）。
 *   - 冪等 PATCH（既に「（{operator}）」付与済なら skip-done・鉄則#90/#91）。
 *   - title==operator（日本蓄電池×14 等18件）は要一次情報＝触らない（skip-excluded）。
 *   - L-EIC-019: 既存 operator フィールドのみ使用（新事実なし）。
 *   - 落とし穴#104: 本ファイルは module（先頭 export {}）。push 前 npx tsc --noEmit。
 *   - PATCH 前後で before→after を print。--dry-run で書き込みなしプレビュー。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-normalize-stage2b.ts [--dry-run]
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

// generic 判定（stage-2A PART3 と同一ロジック）
const GENERIC_EXACT = new Set(['系統用蓄電池','系統用蓄電所','蓄電所','蓄電池','日本蓄電池',
'系統用蓄電池プロジェクト','系統用蓄電所プロジェクト','系統用蓄電池事業','蓄電所プロジェクト',
'系統蓄電所','次世代蓄電池','大型蓄電池']);
const GENERIC_RE = /^(低圧)?(系統用?)?(再エネ併設型|次世代|大型)?蓄電(池|所|システム)(事業|プロジェクト)?$/;
const coreName = (s: string) => (s || '').replace(/[（(][^（）()]*[)）]\s*$/, '').trim();
const opCore = (s: string) =>
  (s || '').replace(/(株式会社|合同会社|有限会社|（株）|\(株\)|㈱)/g, '').trim();

async function main(): Promise<void> {
  console.log(`[projects-normalize-stage2b] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const projects: Project[] = await getAllProjects();
  console.log(`getAllProjects: ${projects.length} 件取得`);

  let ok = 0, done = 0, excluded = 0, nonGeneric = 0, noOp = 0;
  for (const p of projects) {
    const title = p.name || '';
    const cn = coreName(title);
    if (!(GENERIC_EXACT.has(cn) || GENERIC_RE.test(cn))) { nonGeneric++; continue; }
    const op = (p.operator || '').trim();
    if (!op) { noOp++; continue; }

    // 冪等: 既に「（{operator}）」付与済
    if (title.endsWith(`（${op}）`) || title.endsWith(`(${op})`)) {
      console.log(`  [skip-done] ${p.slug}: 既に「…（${op}）」`);
      done++; continue;
    }
    // title==operator（要一次情報・触らない）
    if (title === op || opCore(op) === title || title.includes(opCore(op)) || op.includes(title)) {
      console.log(`  [skip-excluded] ${p.slug}: title==operator系（要一次情報）「${title}」/ op=${op}`);
      excluded++; continue;
    }
    // operator が既に title 内（念のため）
    if (title.includes(op)) {
      console.log(`  [skip-done] ${p.slug}: operator 既含有「${title}」`);
      done++; continue;
    }

    const next = `${title}（${op}）`;
    console.log(`  ${p.slug}: name「${title}」→「${next}」`);
    await patchById(p.id, { name: next });
    ok++;
  }

  console.log(`\n[done] ${DRY_RUN ? '(対象)' : 'PATCH'} ok=${ok}  skip-done=${done}  skip-excluded=${excluded}`);
  console.log(`  (参考: 非generic=${nonGeneric} / generic but operator空=${noOp})  mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
