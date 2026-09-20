#!/usr/bin/env tsx
/**
 * scripts/patch-lc3-jepx-doc-name-2026-09-20.ts — 実在しない資料名の是正（Lc-3 ■1 の取りこぼし分）
 *
 * 背景:
 *   Lc-1 の指示文にあった JEPX「スポット市場取引結果」は、JEPX のサイトに存在しない名称だった。
 *   2026-09-20 実測: https://www.jepx.jp/electricpower/market-data/spot/ の <title> は
 *   「スポット市場 | 市場情報 | 電力取引 | JEPX」。サイト内に「取引結果」の語は 0 件。
 *   Lc-2 で src 側（/market/jepx・JEPXDashboard）は是正したが、**microCMS 側を取りこぼしていた**。
 *   Lc-1 の PATCH は href をトップへ寄せただけで、資料名はそのまま残していたため。
 *
 *   Lc-3 ■0 で依頼者が「実在名は『スポット市場』」と確定させているので、是正を完了させる。
 *
 * 対象: glossary/power-market-price-trend.detail（richEditor・2 箇所）
 *   (1) 本文の出典行:  …（JEPX）</a>「スポット市場取引結果」（当サイト収録の日次平均系列を…
 *   (2) 「主な出典・参考情報」リスト: …（JEPX）「スポット市場取引結果」「非化石価値取引市場 オークション結果」…
 *
 * ★触らないもの（Lc-3 ■1(d)「是正は報告後・私の指示で」に従う）:
 *   - JEPX「非化石価値取引市場 オークション結果」… 実在ページは「非化石価値取引」（title で確認）。要裁定。
 *   - OCCTO「容量市場 メインオークション約定結果」… 実在確認中。要裁定。
 *
 * ★#122: richEditor は保存時に正規化される。冪等判定は「古い名称が 0 件」を marker にする。
 * ★#106: PATCH 後に GET で全フィールド照合（detail 以外の変化 0）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-lc3-jepx-doc-name-2026-09-20.ts [--dry-run]
 */
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const EP = `https://${DOMAIN}.microcms.io/api/v1/glossary`;
const SLUG = 'power-market-price-trend';
const FIELD = 'detail';

const OLD_NAME = '「スポット市場取引結果」';
const NEW_NAME = '「スポット市場」';

type Rec = Record<string, unknown> & { id: string };
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);

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
  console.log(`[Lc-3 ■1 資料名] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / glossary/${SLUG}.${FIELD}`);

  // 書込直前に一次を確認: JEPX の spot ページの <title> に「スポット市場」があり「取引結果」が無いこと
  const res = await fetch('https://www.jepx.jp/electricpower/market-data/spot/', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  }).catch(() => null);
  if (!res || !res.ok) {
    console.error('   [中止] JEPX の一次ページを取得できない');
    process.exit(1);
  }
  const html = await res.text();
  const title = /<title>(.*?)<\/title>/s.exec(html)?.[1]?.trim() ?? '';
  const hasSpot = title.includes('スポット市場');
  const hasResult = html.includes('取引結果');
  console.log(`   一次確認: <title>「${title}」／「スポット市場」=${hasSpot}／サイト内「取引結果」=${hasResult ? 'あり' : '0 件'}`);
  if (!hasSpot || hasResult) {
    console.error('   [中止] 一次の前提（「スポット市場」が実在し「取引結果」が無い）が崩れている');
    process.exit(1);
  }

  const before = await bySlug();
  if (!before) {
    console.error('   ★NG レコード不在');
    process.exit(1);
  }
  const cur = String(before[FIELD] ?? '');
  const n = count(cur, OLD_NAME);
  if (n === 0) {
    console.log('   適用済み（冪等・旧名称 0 件）');
    process.exit(0);
  }
  console.log(`   旧名称 ${OLD_NAME} … ${n} 箇所`);
  const next = cur.split(OLD_NAME).join(NEW_NAME);
  console.log(`   ${FIELD}: ${cur.length} → ${next.length} 字`);
  if (DRY) {
    console.log('\n[done] DRY-RUN');
    process.exit(0);
  }

  await api('PATCH', `${EP}/${before.id}`, { [FIELD]: next });
  await new Promise((r) => setTimeout(r, 900));

  const after = await bySlug();
  let bad = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {})])) {
    if (SYS.has(k)) continue;
    if (k === FIELD) {
      const av = String(after?.[k] ?? '');
      const okOld = count(av, OLD_NAME) === 0;
      const okNew = count(av, NEW_NAME) >= n;
      if (!okOld || !okNew) {
        bad++;
        console.log(`   ✗ ${k}: 旧名称 0 件=${okOld} ／ 新名称 ${n} 箇所以上=${okNew}`);
      } else {
        console.log(
          `   ✓ ${k}: 旧名称 0 件・新名称 ${count(av, NEW_NAME)} 箇所` +
            `（送信値と全文一致=${av === next}／richEditor の正規化で false でも失敗としない）`,
        );
      }
      continue;
    }
    if (norm(after?.[k]) !== norm(before[k])) {
      bad++;
      console.log(`   ✗ ${k}: 変化した（期待: 不変）`);
    }
  }
  console.log(`   #106: ${bad === 0 ? `✓ ${FIELD} のみ変更・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  process.exit(bad > 0 ? 1 : 0);
}
main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
