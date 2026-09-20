#!/usr/bin/env tsx
/**
 * scripts/patch-lc3-links-jepx-japan-2026-09-20.ts — links/jepx-japan の description に統合先の案内を足す（Lc-3 ■2(c)）
 *
 * 背景:
 *   /links/jepx-prices は「JEPX スポット市場のデータページへの直リンク」を主眼にしたエントリだが、
 *   JEPX「リンクについて」が「・トップページ以外のページへのリンク」を明示的に断っているため、
 *   エントリとして成立しない。同じ宛先（トップ）を指す jepx-japan があるので、そちらへ統合する。
 *   コード側は src/lib/links-excluded.ts で一覧・sitemap から外し、詳細は 200 のまま noindex にした。
 *
 * ★(b)（除外）とセットで実施する。片方だけ入れない（依頼書の指示）。
 *   除外だけ入れると「どこへ行けばスポット価格を見られるか」の案内が消える。
 *
 * ★textArea（richEditor ではない）なので #122 の保存時正規化は起きない＝送信値と全文一致するはず。
 *   それでも冪等判定は marker（追記した一文の有無）で行う。
 * ★#106: PATCH 後に GET で全フィールド照合（description 以外の変化 0）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-lc3-links-jepx-japan-2026-09-20.ts [--dry-run]
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
const EP = `https://${DOMAIN}.microcms.io/api/v1/links`;
const SLUG = 'jepx-japan';
const FIELD = 'description';

/**
 * 追記する一文。
 * ★資料名は実機で確認したものだけを使う（Lc-3 ■1 の趣旨）:
 *   「スポット市場」… https://www.jepx.jp/electricpower/market-data/spot/ の <title> で実測
 *   「非化石価値取引」… https://www.jepx.jp/nonfossil/market-data/ の <title> で実測
 *     （当サイトが従来使っていた「非化石価値取引市場 オークション結果」はページに存在しない名称）
 * ★URL は書かない。JEPX はトップ以外へのリンクを断っており、深い URL を案内文に載せる必要もない。
 */
const MARKER = 'スポット市場・非化石価値取引の市場情報も同サイト内で公開されています。';
const APPEND = `\n\n${MARKER}`;

type Rec = Record<string, unknown> & { id: string };
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);

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
  console.log(`[Lc-3 ■2(c)] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / links/${SLUG}.${FIELD}`);

  const before = await bySlug();
  if (!before) {
    console.error('   ★NG レコード不在');
    process.exit(1);
  }
  const cur = String(before[FIELD] ?? '');
  if (cur.includes(MARKER)) {
    console.log('   適用済み（冪等・marker あり）');
    process.exit(0);
  }
  const next = cur + APPEND;
  console.log(`   ${FIELD}: ${cur.length} → ${next.length} 字`);
  console.log(`      追記「${MARKER}」`);
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
      const okMarker = av.includes(MARKER);
      const okOnce = av.split(MARKER).length - 1 === 1;
      if (!okMarker || !okOnce) {
        bad++;
        console.log(`   ✗ ${k}: marker あり=${okMarker} ／ 1 回だけ=${okOnce}`);
      } else {
        console.log(`   ✓ ${k}: marker 1 回（送信値と全文一致=${av === next}）`);
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
