#!/usr/bin/env tsx
/**
 * scripts/scan-lc1-source-urls.ts — microCMS 全エンドポイント・全フィールドの JEPX/OCCTO URL 棚卸し（Lc-1・読取専用）
 *
 * 前回の走査は「richEditor 本文中の <a href>」だけを見ていたため、links.url のような
 * URL そのものを値に持つフィールドを取りこぼした（実際 /links/jepx-prices が残存）。
 * ここでは全フィールドの文字列を対象に、値の中に現れる URL を残らず拾う。
 *
 * 読取専用（GET のみ）。出力は件数と該当箇所のみ。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/scan-lc1-source-urls.ts
 */
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }

const ENDPOINTS = [
  'glossary', 'links', 'faq', 'explainer', 'news', 'projects', 'operators',
  'policy-events', 'subsidies', 'substations',
];

// 探す URL パターン（■2 の死んだ URL ＋ ■3 の JEPX 深い URL）
const PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: '■2 死: occto.or.jp/info/disclaimer.html', re: /occto\.or\.jp\/info\/disclaimer\.html/g },
  { label: '■2 死: jepx.jp/electricpower/index.html', re: /jepx\.jp\/electricpower\/index\.html/g },
  { label: '■3 JEPX 深い URL', re: /https?:\/\/(?:www\.)?jepx\.jp\/(?!\s)[a-z0-9][a-z0-9\-/._]*/g },
];

type Rec = Record<string, unknown> & { id: string };

async function getAll(ep: string): Promise<Rec[]> {
  const out: Rec[] = [];
  // ★ページサイズは 400「Response body size is too long」を見て自動縮小する。
  //   links は 1 レコードが大きく limit=100 で上限に当たる（2026-09-20 実測）。
  //   固定 limit のままだと 1 ページ目だけ読んで「該当 0」と誤報告する（今回それが起きた）。
  let limit = 100;
  for (let offset = 0; ; ) {
    const url = `https://${DOMAIN}.microcms.io/api/v1/${ep}?limit=${limit}&offset=${offset}`;
    const r = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
    if (!r.ok) {
      if (r.status === 404) return [];
      const body = await r.text();
      if (r.status === 400 && /body size is too long/i.test(body) && limit > 5) {
        limit = Math.floor(limit / 2);
        console.log(`      ${ep}: 応答サイズ上限のため limit を ${limit} に縮小して継続`);
        continue;
      }
      throw new Error(`${ep} → HTTP ${r.status}: ${body.slice(0, 200)}`);
    }
    const j = (await r.json()) as { contents: Rec[]; totalCount: number };
    out.push(...j.contents);
    offset += j.contents.length;
    if (offset >= j.totalCount || j.contents.length === 0) break;
  }
  return out;
}

function* strings(v: unknown, path: string): Generator<[string, string]> {
  if (typeof v === 'string') { yield [path, v]; return; }
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) yield* strings(v[i], `${path}[${i}]`); return; }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) yield* strings(x, path ? `${path}.${k}` : k);
  }
}

async function main(): Promise<void> {
  console.log('[Lc-1 走査] microCMS 全エンドポイント・全フィールド（GET のみ）\n');
  const hits: Record<string, string[]> = {};
  for (const p of PATTERNS) hits[p.label] = [];

  for (const ep of ENDPOINTS) {
    const recs = await getAll(ep).catch((e) => { console.log(`   ${ep}: 取得失敗 ${e}`); return [] as Rec[]; });
    if (recs.length === 0) { console.log(`   ${ep}: 0 件（または存在しない）`); continue; }
    let epHits = 0;
    for (const rec of recs) {
      const slug = String((rec as { slug?: string }).slug ?? rec.id);
      for (const [field, s] of strings(rec, '')) {
        if (field === 'id' || field.endsWith('At')) continue;
        for (const p of PATTERNS) {
          p.re.lastIndex = 0;
          const found = [...s.matchAll(p.re)].map((m) => m[0]);
          for (const f of found) {
            // 既に是正済みの /disclaimer/ と トップは ■3 の対象外
            if (p.label.startsWith('■3') && /^https?:\/\/(?:www\.)?jepx\.jp\/(disclaimer)\/?$/.test(f)) continue;
            hits[p.label].push(`${ep}/${slug}.${field} → ${f}`);
            epHits++;
          }
        }
      }
    }
    console.log(`   ${ep}: ${recs.length} 件走査・該当 ${epHits}`);
  }

  console.log('');
  for (const p of PATTERNS) {
    const list = [...new Set(hits[p.label])];
    console.log(`${p.label}: ${list.length} 件`);
    for (const h of list) console.log(`   - ${h}`);
  }
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
