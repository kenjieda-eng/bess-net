/**
 * scripts/links-stage2c.ts
 *
 * /links 2C — description の汎用ボイラープレート撤去・site固有化（dry-run→適用）。
 *   保持: 先頭の「【{名} とは】」セクションのみ（site固有リード＋公式URL）。
 *   撤去: 後続の汎用4セクション（どのような場合に見るのか/蓄電池事業との関わり/主要なコンテンツ・サービス/業界関係者への活用ヒント）。
 *   撤去: 【とは】リード末尾の「高頻度の汎用締め文」＝corpus内で K+ サイトに出る文（=テンプレ）。site固有文(freq<K)＋公式URLは残す。
 *
 * ★ 情報の新規生成なし＝既存テキストの部分削除のみ（L-EIC-019）。先頭文（{名}は、…）は常に保持。
 * 安全: microCMS は description のみ PATCH。冪等（既に簡潔なら skip）。module化(#104)。
 * 実行: (env 読込後) npx tsx scripts/links-stage2c.ts [--dry-run] [--report <path>]
 */
export {};
import * as fs from 'node:fs';
import { getAllLinks, type LinkSiteLite } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const reportIdx = process.argv.indexOf('--report');
const REPORT = reportIdx >= 0 ? process.argv[reportIdx + 1] : '';
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/links`;
const FREQ_THRESHOLD = 3; // 文が K+ サイトに出れば汎用テンプレと判定

const HEADER_RE = /【[^】]*】/g;
const URL_RE = /公式URL：\S+/;

function splitSentences(text: string): string[] {
  return text.split(/(?<=。)/).filter((s) => s.trim().length > 0);
}

type Parsed = { firstHeader: string; leadSentences: string[]; urlPart: string; dropped: string[]; ok: boolean };

function parse(desc: string): Parsed {
  const headers = [...desc.matchAll(HEADER_RE)];
  if (headers.length === 0) return { firstHeader: '', leadSentences: [], urlPart: '', dropped: [], ok: false };
  const firstHeader = headers[0][0];
  const sec1Start = (headers[0].index ?? 0) + firstHeader.length;
  const sec1End = headers.length > 1 ? (headers[1].index ?? desc.length) : desc.length;
  let sec1 = desc.slice(sec1Start, sec1End).trim();
  const dropped = headers.slice(1).map((h) => h[0]);
  const urlIdx = sec1.indexOf('公式URL：');
  let lead = urlIdx >= 0 ? sec1.slice(0, urlIdx) : sec1;
  // 公式URL は とは内優先、無ければ全文の最初の出現を流用（既存テキスト）
  const urlInSec1 = urlIdx >= 0 ? (sec1.slice(urlIdx).match(URL_RE)?.[0] ?? '') : '';
  const urlPart = urlInSec1 || (desc.match(URL_RE)?.[0] ?? '');
  return { firstHeader, leadSentences: splitSentences(lead.trim()), urlPart, dropped, ok: true };
}

function buildFreq(links: LinkSiteLite[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const l of links) {
    const p = parse(l.description || '');
    if (!p.ok) continue;
    const seen = new Set<string>();
    for (const s of p.leadSentences) {
      const key = s.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }
  return freq;
}

type Result = { slug: string; title: string; before: string; after: string; changed: boolean; keptN: number; removedSentences: string[]; droppedSecN: number; tiny: boolean; noUrl: boolean; id: string };

function transform(l: LinkSiteLite, freq: Map<string, number>): Result {
  const desc = l.description || '';
  const p = parse(desc);
  const base: Result = { slug: l.slug, title: l.title, before: desc, after: desc, changed: false, keptN: 0, removedSentences: [], droppedSecN: 0, tiny: false, noUrl: false, id: l.id };
  if (!p.ok) return base; // 構造なし＝skip（要注意で別途報告）
  const kept: string[] = [];
  const removed: string[] = [];
  p.leadSentences.forEach((s, i) => {
    const key = s.trim();
    if (i === 0) { kept.push(s); return; }            // 先頭文（{名}は…）は常に保持
    if ((freq.get(key) ?? 0) >= FREQ_THRESHOLD) removed.push(key);
    else kept.push(s);
  });
  const cleanedLead = kept.join('').trim();
  const after = `${p.firstHeader}\n\n${cleanedLead}${p.urlPart ? p.urlPart : ''}`.trim();
  return {
    ...base,
    after,
    changed: after !== desc.trim(),
    keptN: kept.length,
    removedSentences: removed,
    droppedSecN: p.dropped.length,
    tiny: kept.length <= 1,
    noUrl: !p.urlPart,
  };
}

async function patch(id: string, description: string): Promise<void> {
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PATCH', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!r.ok) throw new Error(`PATCH ${id} HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

async function main(): Promise<void> {
  console.log(`[links-2c] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const links = await getAllLinks();
  console.log(`  links=${links.length}`);
  const freq = buildFreq(links);

  const results = links.map((l) => transform(l, freq));
  const changed = results.filter((r) => r.changed);
  const skipped = results.filter((r) => !r.changed);
  const noStruct = results.filter((r) => !parse(r.before).ok);
  const tiny = changed.filter((r) => r.tiny);
  const noUrl = changed.filter((r) => r.noUrl);

  const totalBefore = results.reduce((s, r) => s + r.before.length, 0);
  const totalAfterChanged = changed.reduce((s, r) => s + r.after.length, 0);
  const totalBeforeChanged = changed.reduce((s, r) => s + r.before.length, 0);

  console.log(`  変換=${changed.length} / skip(既簡潔)=${skipped.length} / 構造なし=${noStruct.length}`);
  console.log(`  要注意 site固有文が極小(kept<=1)=${tiny.length} / 公式URL無し=${noUrl.length}`);
  console.log(`  文字数: 変換対象 before合計=${totalBeforeChanged} → after合計=${totalAfterChanged}（-${totalBeforeChanged - totalAfterChanged}, 平均 ${changed.length ? Math.round((totalBeforeChanged - totalAfterChanged) / changed.length) : 0}/件）`);

  // 高頻度文 top15（テンプレ確認用）
  const topFreq = [...freq.entries()].filter(([, n]) => n >= FREQ_THRESHOLD).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log(`\n  高頻度文（freq>=${FREQ_THRESHOLD}・撤去対象テンプレ）top15:`);
  for (const [s, n] of topFreq) console.log(`    [${n}サイト] ${s.slice(0, 60)}`);

  // 撤去された section header の distinct
  const droppedHeaders = new Map<string, number>();
  for (const r of changed) { for (const h of parse(r.before).dropped) droppedHeaders.set(h, (droppedHeaders.get(h) ?? 0) + 1); }
  console.log(`\n  撤去 section header distinct: ${[...droppedHeaders.entries()].map(([h, n]) => `${h}×${n}`).join(' / ')}`);

  if (REPORT) {
    const lines: string[] = [];
    lines.push(`# links 2C dry-run report (FREQ_THRESHOLD=${FREQ_THRESHOLD})`);
    lines.push(`変換=${changed.length} skip=${skipped.length} 構造なし=${noStruct.length} 要注意tiny=${tiny.length} noUrl=${noUrl.length}\n`);
    lines.push(`## 要注意: site固有文が極小（kept<=1）${tiny.length}件`);
    for (const r of tiny) lines.push(`  [${r.slug}] after="${r.after.replace(/\n/g, ' ')}"`);
    lines.push(`\n## 要注意: 公式URL無し ${noUrl.length}件`);
    for (const r of noUrl) lines.push(`  [${r.slug}]`);
    lines.push(`\n## 構造なし(skip) ${noStruct.length}件`);
    for (const r of noStruct) lines.push(`  [${r.slug}] before(先頭120)="${r.before.slice(0, 120).replace(/\n/g, ' ')}"`);
    lines.push(`\n## 全変換 before→after`);
    for (const r of changed) {
      lines.push(`\n### [${r.slug}] ${r.title}  (kept=${r.keptN}, 撤去sec=${r.droppedSecN}, 撤去文=${r.removedSentences.length}, ${r.before.length}→${r.after.length}字)`);
      lines.push(`BEFORE: ${r.before.replace(/\n/g, '⏎').slice(0, 400)}`);
      lines.push(`AFTER : ${r.after.replace(/\n/g, '⏎')}`);
      if (r.removedSentences.length) lines.push(`撤去文: ${r.removedSentences.map((s) => s.slice(0, 40)).join(' | ')}`);
    }
    fs.writeFileSync(REPORT, lines.join('\n'));
    console.log(`\n  report → ${REPORT}`);
  }

  // 情報新規生成ゼロの検証: after の各文（公式URL除く）は before に含まれること
  let violation = 0;
  for (const r of changed) {
    const afterCore = r.after.replace(/【[^】]*】/g, '').replace(URL_RE, '').replace(/\s/g, '');
    const beforeCore = r.before.replace(/\s/g, '');
    if (afterCore && !beforeCore.includes(afterCore.slice(0, Math.min(afterCore.length, 200)))) {
      // 文単位で確認
      for (const s of splitSentences(r.after.replace(/【[^】]*】/g, '').replace(URL_RE, ''))) {
        if (s.trim() && !r.before.includes(s.trim())) { violation += 1; if (violation <= 5) console.log(`  ⚠ 新規生成疑い [${r.slug}]: ${s.trim().slice(0, 40)}`); }
      }
    }
  }
  console.log(`\n  情報新規生成ゼロ検証: 違反文=${violation}（0なら部分削除のみ）`);

  if (!DRY_RUN) {
    console.log(`\n  [EXECUTE] PATCH ${changed.length}件...`);
    let done = 0;
    for (const r of changed) { await patch(r.id, r.after); done += 1; if (done % 25 === 0) console.log(`    ${done}/${changed.length}`); }
    console.log(`  [ok] PATCH 完了 ${done}件`);
  }
  console.log(`[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
