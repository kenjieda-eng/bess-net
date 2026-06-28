/**
 * scripts/fix-links-description-blockdedup-2026-06.ts
 *
 * /links 改善ステージ2B — description の「見出しブロック」重複除去（情報損失ゼロ）。
 * 2A後も「どのような場合に見るのか」「蓄電池事業との関わり」等の見出しブロックが
 * 2〜3回繰り返される。各見出しは最も長い版（短い版はその prefix=truncation）を1つだけ残す。
 *
 * 安全（L-EIC-019・情報損失ゼロ）:
 *  - 各見出しにつき最長版のみ採用＝短い版は最長版の部分文字列なので情報を失わない。
 *  - ★ガード: 入力の全ブロック本文が出力ブロックのいずれかの部分文字列であることを検証。
 *    1つでも失われる（＝真に異なる内容）なら その entry は PATCH せず skip＋報告（手動確認用）。
 *  - description のみ PATCH。見出し順序・本文は不変（重複の除去のみ）。冪等（重複なしは skip）。
 *
 * 実行: (env 読込後) npx tsx scripts/fix-links-description-blockdedup-2026-06.ts [--dry-run]
 */
export {};
import { getAllLinks } from '../src/lib/microcms';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/links`;

const heading = (b: string) => { const m = b.match(/^【([^】]+)】/); return m ? m[1] : '(本文のみ)'; };
const body = (b: string) => b.replace(/^【[^】]+】/, '').trim();

function dedup(desc: string): { newDesc: string; removed: number; unsafe: boolean; headings: string[] } {
  const raw = desc.split(/(?=【[^】]+】)/).map((b) => b.trim()).filter(Boolean);
  if (raw.length === 0) return { newDesc: desc, removed: 0, unsafe: false, headings: [] };
  const order: string[] = [];
  const longest = new Map<string, string>();
  for (const b of raw) {
    const h = heading(b);
    if (!longest.has(h)) { order.push(h); longest.set(h, b); }
    else if (b.length > longest.get(h)!.length) longest.set(h, b);
  }
  const out = order.map((h) => longest.get(h)!);
  const outBodies = out.map(body);
  // ガード: 入力の全ブロック本文が出力のどれかに含まれること（情報損失ゼロの検証）
  for (const b of raw) {
    const bb = body(b);
    if (!outBodies.some((ob) => ob.includes(bb))) {
      return { newDesc: desc, removed: 0, unsafe: true, headings: order };
    }
  }
  return { newDesc: out.join('\n\n'), removed: raw.length - out.length, unsafe: false, headings: order };
}

async function patchDescription(id: string, description: string): Promise<void> {
  if (DRY_RUN) return;
  const resp = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!resp.ok) throw new Error(`PATCH ${id} HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
}

async function main(): Promise<void> {
  console.log(`[blockdedup] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const links = await getAllLinks();
  console.log(`getAllLinks: ${links.length} 件`);

  let ok = 0, skip = 0, unsafe = 0, err = 0, charsBefore = 0, charsAfter = 0;
  const samples: string[] = [];
  for (const l of links) {
    const desc = l.description || '';
    const { newDesc, removed, unsafe: uf, headings } = dedup(desc);
    if (uf) {
      console.log(`  [unsafe-skip] ${l.slug}: 真に異なる版あり＝両方保持・手動確認（headings=${headings.join('/')}）`);
      unsafe++; continue;
    }
    if (removed < 1) { skip++; continue; }
    try {
      charsBefore += desc.length; charsAfter += newDesc.length;
      if (samples.length < 5) {
        const beforeH = desc.split(/(?=【[^】]+】)/).map((b) => b.trim()).filter(Boolean).map(heading);
        samples.push(`  [${l.slug}] ${desc.length}→${newDesc.length}字 (除去${removed}ブロック)\n     before見出し: ${beforeH.join(' / ')}\n     after見出し : ${headings.join(' / ')}`);
      }
      await patchDescription(l.id, newDesc);
      ok++;
    } catch (e) { console.error(`  [err] ${l.slug}: ${(e as Error).message}`); err++; }
  }
  console.log(`\n[done] ${DRY_RUN ? '(対象)' : 'PATCH'} ok=${ok}  skip(重複なし)=${skip}  unsafe-skip=${unsafe}  err=${err}`);
  console.log(`  文字数: ${charsBefore} → ${charsAfter}（削減 ${charsBefore - charsAfter}・対象${ok}件平均 ${ok ? Math.round((charsBefore - charsAfter) / ok) : 0}字）`);
  console.log('\n=== 代表5件 見出し構成 before→after ===');
  for (const s of samples) console.log(s);
  process.exit(err > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
