#!/usr/bin/env tsx
/**
 * scripts/patch-lc1-jepx-links-2026-09-20.ts — JEPX の出典リンクをトップへ寄せる（Lc-1 ■3）
 *
 * ユウ裁定: JEPX「リンクについて」はトップ以外へのリンクを断り、著作権条項は出所の明示を求める。
 *   両立する形は「出所はテキストで明示・リンク先は https://www.jepx.jp/ トップ」。
 *   ★出所の文言は消さない（読者が一次に辿れることは保つ）。リンクの href だけをトップへ、
 *     ページ名は <a> の外に地の文として残す。
 *
 * 対象（microCMS の全 endpoint を走査して該当したのはこの 1 レコードのみ・2026-09-20 実測）:
 *   glossary/power-market-price-trend の detail に 2 箇所
 *     (1) スポット市場取引結果 https://www.jepx.jp/electricpower/market-data/spot/
 *     (2) 非化石価値取引市場 オークション結果 https://www.jepx.jp/nonfossil/market-data/
 *
 * ★#122: richEditor は保存時に正規化されるため、冪等判定は「置換元が無く・置換後がある」で行う。
 * ★#106: PATCH 後に GET で全 field を照合（他フィールド変化 0）。DELETE/PUT/POST なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-lc1-jepx-links-2026-09-20.ts [--dry-run]
 */
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const EP = `https://${DOMAIN}.microcms.io/api/v1/glossary`;
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const SLUG = 'power-market-price-trend';
const FIELD = 'detail';

type Rec = Record<string, unknown> & { id: string; slug: string };
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);

const REPLACEMENTS: Array<{ label: string; old: string; new: string }> = [
  {
    label: '(1) スポット市場取引結果',
    old: '<a href="https://www.jepx.jp/electricpower/market-data/spot/" target="_blank" rel="noopener noreferrer">一般社団法人 日本卸電力取引所（JEPX）スポット市場取引結果</a>',
    new: '<a href="https://www.jepx.jp/" target="_blank" rel="noopener noreferrer">一般社団法人 日本卸電力取引所（JEPX）</a>「スポット市場取引結果」',
  },
  {
    label: '(2) 非化石価値取引市場 オークション結果',
    old: '<a href="https://www.jepx.jp/nonfossil/market-data/" target="_blank" rel="noopener noreferrer">日本卸電力取引所「非化石価値取引市場 オークション結果」</a>',
    new: '<a href="https://www.jepx.jp/" target="_blank" rel="noopener noreferrer">日本卸電力取引所</a>「非化石価値取引市場 オークション結果」',
  },
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const bySlug = async (): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${EP}?filters=slug[equals]${SLUG}&limit=1`)).contents[0] ?? null;

async function main(): Promise<void> {
  console.log(`[Lc-1 ■3 JEPX リンク] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / glossary/${SLUG}.${FIELD}`);

  // 書込直前に一次を確認: JEPX トップが 200 であること
  const top = await fetch('https://www.jepx.jp/', { headers: { 'User-Agent': 'Mozilla/5.0' } }).catch(() => null);
  console.log(`   一次確認: https://www.jepx.jp/ → ${top ? top.status : '取得失敗'}`);
  if (!top || !top.ok) { console.error('   [中止] リンク先の生存を確認できない'); process.exit(1); }

  const b = await bySlug();
  if (!b) { console.error('   ★NG レコード不在'); process.exit(1); }
  let cur = String(b[FIELD] ?? '');
  const before = cur;
  let applied = 0, already = 0;

  for (const r of REPLACEMENTS) {
    const nOld = count(cur, r.old);
    const nNew = count(cur, r.new);
    if (nOld === 0 && nNew >= 1) { console.log(`   ${r.label}: 適用済み（冪等）`); already++; continue; }
    if (nOld !== 1) { console.log(`   [見送り] ${r.label}: 置換元が ${nOld} 箇所（一意でない）`); continue; }
    cur = cur.replace(r.old, r.new);
    applied++;
    console.log(`   ${r.label}:`);
    console.log(`      前「${r.old}」`);
    console.log(`      後「${r.new}」`);
  }

  if (applied === 0) { console.log(`\n[done] 変更なし（適用済み ${already}）`); process.exit(0); }
  console.log(`   ${FIELD}: ${before.length} → ${cur.length} 字`);
  if (DRY) { console.log('\n[done] DRY-RUN'); process.exit(0); }

  await api('PATCH', `${EP}/${b.id}`, { [FIELD]: cur });
  await new Promise((r) => setTimeout(r, 900));
  const a = await bySlug();
  let bad = 0;
  for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {})])) {
    if (SYS.has(k)) continue;
    if (k === FIELD) {
      const av = String(a?.[k] ?? '');
      const okOld = REPLACEMENTS.every((r) => count(av, r.old) === 0);
      const okNew = REPLACEMENTS.every((r) => count(av, r.new) === 1);
      const deep = /jepx\.jp\/(?!")[a-z0-9\-/]+/.test(av);
      if (!okOld || !okNew || deep) { bad++; console.log(`   ✗ ${k}: 置換元なし=${okOld} 置換後1回=${okNew} 深いJEPXリンク残存=${deep}`); }
      else console.log(`   ✓ ${k}: 置換元 0・置換後 各 1 回・深い JEPX リンク 0（送信値と全文一致=${av === cur}／richEditor の正規化で false でも失敗としない）`);
      continue;
    }
    if (norm(a?.[k]) !== norm(b[k])) { bad++; console.log(`   ✗ ${k}: 変化した（期待: 不変）`); }
  }
  console.log(`   #106: ${bad === 0 ? '✓ detail のみ変更・他フィールド変化 0' : `★NG 不一致 ${bad}`}`);
  process.exit(bad > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
