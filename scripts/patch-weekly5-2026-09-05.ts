#!/usr/bin/env tsx
/**
 * scripts/patch-weekly5-2026-09-05.ts — 金曜ワンセット#5 ⑦(a)(b)（承認済み・9/2 委任裁定）
 *
 * ⑦(a) news occto-tsuika-auction-fy2027-kekka-2026-08 の1フレーズ復元（原文準拠・9/1 検証記録 §2）
 *   「…電源の追加処理は行われなかった。」→「…追加できる電源がないため約定処理を終了した（電源の追加はなし）。」
 *   一次（実需給2027 追加オークション 約定結果 PDF p19/p26）逐語:
 *   「不足エリアで追加できる電源がないため、約定処理を終了した。」／表「追加量（なし）」
 *   冪等: 旧句の存在／新句の存在で判定（#122・news.body は richEditor のため送信本文の全文一致で判定しない）
 *
 * ⑦(b) policy-events renewable-mass-deploy-2026 → status ["終了"] ＋ description 末尾に1文追記（出典つき）
 *   出典: 後継エントリ meti-saiene-shuryoku-shoi-launch-2026-06（2026-06-03 発足・改組）の sourceUrl
 *         https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saiene_shuryoku/index.html
 *   冪等: マーカー「主力電源化小委員会へ改組」の存在で判定。status は既に ["終了"] なら skip
 *   occto-balancing-market-review-2026 → 維持（変更なし・GET で現状を記録するのみ）
 *
 * 各件 前後 GET 全 field 照合（#106）。DELETE/PUT なし。
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
type Rec = Record<string, unknown> & { id: string };

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const ep = (e: string) => `https://${DOMAIN}.microcms.io/api/v1/${e}`;
async function bySlug(e: string, slug: string): Promise<Rec | null> {
  const d = await api<{ contents: Rec[] }>('GET', `${ep(e)}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`);
  return d.contents[0] ?? null;
}
function otherDiffs(b: Rec, a: Rec | null, changed: string[]): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {})])) {
    if (SYS.has(k) || changed.includes(k)) continue;
    if (JSON.stringify(b[k]) !== JSON.stringify(a?.[k])) out.push(k);
  }
  return out;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let done = 0, skipped = 0, failed = 0;

async function partA(): Promise<void> {
  console.log('\n■ ⑦(a) news occto-tsuika-auction-fy2027-kekka-2026-08 — 1フレーズ復元');
  const FROM = '電源の追加処理は行われなかった。';
  const TO = '追加できる電源がないため約定処理を終了した（電源の追加はなし）。';
  const b = await bySlug('news', 'occto-tsuika-auction-fy2027-kekka-2026-08');
  if (!b) { console.log('  ★NG 不在'); failed++; return; }
  const body = String(b.body ?? '');
  const hasFrom = body.includes(FROM), hasTo = body.includes(TO);
  console.log(`  marker: 旧句=${hasFrom} / 新句=${hasTo} / body=${body.length}字`);
  if (hasTo && !hasFrom) { console.log('  [skip] 復元済み（冪等）'); skipped++; return; }
  if (!hasFrom) { console.log('  [スキップ] 旧句が見当たらない → 想定外のため書き込まない'); skipped++; return; }
  if (body.split(FROM).length - 1 !== 1) { console.log('  [スキップ] 旧句が複数箇所 → 一意でないため書き込まない'); skipped++; return; }
  const next = body.replace(FROM, TO);
  console.log(`  [PATCH] 「${FROM}」→「${TO}」（${body.length}→${next.length}字）`);
  if (DRY) { done++; return; }
  await api('PATCH', `${ep('news')}/${b.id}`, { body: next });
  await sleep(1000);
  const a = await bySlug('news', 'occto-tsuika-auction-fy2027-kekka-2026-08');
  const ab = String(a?.body ?? '');
  const ok = ab.includes(TO) && !ab.includes(FROM);
  const others = otherDiffs(b, a, ['body']);
  console.log(`  #106/#122: 新句存在=${ab.includes(TO) ? '✓' : '★NG'} 旧句消滅=${!ab.includes(FROM) ? '✓' : '★NG'} 送信値と全文一致=${ab === next}（false でも失敗としない） 他フィールド変化=${others.join(',') || '0'}`);
  if (ok && others.length === 0) done++; else failed++;
}

async function partB(): Promise<void> {
  console.log('\n■ ⑦(b) policy-events renewable-mass-deploy-2026 — 終了化＋改組の1文追記');
  const SRC = 'https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saiene_shuryoku/index.html';
  const MARK = '主力電源化小委員会へ改組';
  const APPEND = `2026年6月3日に再生可能エネルギー主力電源化小委員会へ改組され、本小委員会としての議論は終了した（後継は同日発足の主力電源化小委員会エントリ。出典: ${SRC}）。`;
  const b = await bySlug('policy-events', 'renewable-mass-deploy-2026');
  if (!b) { console.log('  ★NG 不在'); failed++; return; }
  const st = (b.status as string[] | undefined) ?? [];
  const desc = String(b.description ?? '');
  console.log(`  現在: status=${JSON.stringify(st)} description=${desc.length}字 マーカー=${desc.includes(MARK)}`);
  const patch: Record<string, unknown> = {};
  if (JSON.stringify(st) !== JSON.stringify(['終了'])) patch.status = ['終了'];
  if (!desc.includes(MARK)) patch.description = desc + APPEND;
  if (Object.keys(patch).length === 0) { console.log('  [skip] 終了化・追記とも済み（冪等）'); skipped++; return; }
  console.log(`  [PATCH] ${Object.keys(patch).join(' + ')}${patch.description ? `（description ${desc.length}→${String(patch.description).length}字）` : ''}`);
  if (DRY) { done++; return; }
  await api('PATCH', `${ep('policy-events')}/${b.id}`, patch);
  await sleep(1000);
  const a = await bySlug('policy-events', 'renewable-mass-deploy-2026');
  const okSt = JSON.stringify(a?.status) === JSON.stringify(['終了']);
  const okDesc = String(a?.description ?? '').includes(MARK) && String(a?.description ?? '').startsWith(desc);
  const others = otherDiffs(b, a, Object.keys(patch));
  console.log(`  #106: status=${okSt ? '✓' : '★NG'} description(マーカー＋旧本文保持)=${okDesc ? '✓' : '★NG'} 他フィールド変化=${others.join(',') || '0'}`);
  if (okSt && okDesc && others.length === 0) done++; else failed++;

  console.log('\n■ ⑦(b) occto-balancing-market-review-2026 — 維持（記録のみ）');
  const k = await bySlug('policy-events', 'occto-balancing-market-review-2026');
  console.log(`  status=${JSON.stringify(k?.status)} eventDate=${String(k?.eventDate).slice(0, 10)} eventType=${JSON.stringify(k?.eventType)} → 変更なし`);
}

async function main(): Promise<void> {
  console.log(`[weekly5 ⑦(a)(b)] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  await partA();
  await partB();
  console.log(`\n[done] 実行 ${done} / スキップ ${skipped} / 失敗 ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
