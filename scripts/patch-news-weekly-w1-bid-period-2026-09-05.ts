#!/usr/bin/env tsx
/**
 * scripts/patch-news-weekly-w1-bid-period-2026-09-05.ts — 週次まとめ w6（news-weekly-2026-09-w1）⑤段落の応札期間 1 フレーズ是正
 *
 * 誤: 「応札の受付期間は10月26日〜30日です。」（9/5 政策便と同根の PDF 行ずれ誤読が週次本文にも入っていた）
 * 正: 「応札の受付期間は10月13日〜23日です（10月26日〜30日は期待容量等算定諸元一覧の登録受付期間）。」
 * 一次: OCCTO https://www.occto.or.jp/news/012742.html（2026-07-30 掲載）
 *   「(4)2026年10月13日（火）〜2026年10月23日（金）　応札の受付期間」
 *   「(5)2026年10月26日（月）〜2026年10月30日（金）　応札容量算定に用いた期待容量等算定諸元一覧登録受付期間」
 * 冪等: 旧句の有無／新句の有無で判定（#122・news.body は richEditor のため送信本文の全文一致で判定しない）。旧句が一意でなければ書かない。
 * 実行: npx tsx --env-file=.env.local scripts/patch-news-weekly-w1-bid-period-2026-09-05.ts [--dry-run]
 * ★書込は承認後のみ（既定は --dry-run 相当ではないので、承認前は必ず --dry-run を付ける）
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const SLUG = 'news-weekly-2026-09-w1';
const FROM = '応札の受付期間は10月26日〜30日です。';
const TO = '応札の受付期間は10月13日〜23日です（10月26日〜30日は期待容量等算定諸元一覧の登録受付期間）。';
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
type Rec = Record<string, unknown> & { id: string };
async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const EP = `https://${DOMAIN}.microcms.io/api/v1/news`;
async function get(): Promise<Rec | null> {
  const d = await api<{ contents: Rec[] }>('GET', `${EP}?filters=slug[equals]${SLUG}&limit=1`);
  return d.contents[0] ?? null;
}
async function main(): Promise<void> {
  console.log(`[weekly-w1 応札期間] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  const b = await get();
  if (!b) { console.log('  ★NG 不在'); process.exit(1); }
  const body = String(b.body ?? '');
  const nFrom = body.split(FROM).length - 1, hasTo = body.includes(TO);
  console.log(`  現状: body=${body.length}字 旧句=${nFrom}箇所 新句=${hasTo}`);
  if (hasTo && nFrom === 0) { console.log('  [skip] 是正済み（冪等）'); return; }
  if (nFrom !== 1) { console.log('  [停止] 旧句が一意でない → 書込まず'); process.exit(1); }
  const next = body.replace(FROM, TO);
  console.log(`  [PATCH] 「${FROM}」→「${TO}」（${body.length}→${next.length}字）`);
  if (DRY) return;
  await api('PATCH', `${EP}/${b.id}`, { body: next });
  await new Promise((r) => setTimeout(r, 1000));
  const a = await get();
  const ab = String(a?.body ?? '');
  const others = [...new Set([...Object.keys(b), ...Object.keys(a ?? {})])].filter((k) => !SYS.has(k) && k !== 'body' && JSON.stringify(b[k]) !== JSON.stringify(a?.[k]));
  const ok = ab.includes(TO) && !ab.includes(FROM) && others.length === 0;
  console.log(`  #106/#122: 新句=${ab.includes(TO) ? '✓' : '★NG'} 旧句消滅=${!ab.includes(FROM) ? '✓' : '★NG'} 他フィールド変化=${others.join(',') || '0'} → ${ok ? '✓' : '★NG'}`);
  if (!ok) process.exit(1);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
