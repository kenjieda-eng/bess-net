#!/usr/bin/env tsx
/**
 * scripts/post-glossary-n1-densei-2026-09-05.ts — 金曜ワンセット#5 ⑦(c) glossary 新規1語 POST: N-1電制
 *
 * 承認: 9/2 委任裁定（⑦ 4項とも承認済み）。定義文は依頼書のとおり。
 * 参照URL【CC確定 2026-09-05】: OCCTO「N-1電制の基本的な考え方について」
 *   https://www.occto.or.jp/news/access_oshirase_2018_181001_n-1densei_shiryou.html
 *   HTTP 200・<title>N-1電制の基本的な考え方について｜電力広域的運営推進機関</title>・本文に「N-1電制」18箇所
 *   逐語:「2018年10月より開始したN-1電制先行適用を発展させた仕組みとして、2022年7月5日より、系統のさらなる
 *         有効利用をはかることを目的として、費用負担を前提に、既設電源を含め全ての電源をN-1電制の候補とし、
 *         運用容量を拡大する仕組み(N-1電制本格適用)を開始します。」（更新日 2025年01月23日）
 * 既存照合: term[contains]N-1／slug[contains]n-1／term[contains]電制 → 0件（2026-09-05 GET）
 * 関連語: ノンファーム接続（non-firm-connection・存在確認済み）・空き容量・系統連系
 * category/subcategory は non-firm-connection と同じ「系統連系」「連系制度・出力抑制」（実在値）
 * ※ 解説記事 how-to-check-grid-from-site からのリンク復元はしない（依頼書どおり）
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const BASE = `https://${DOMAIN}.microcms.io/api/v1/glossary`;
const DRY = process.argv.includes('--dry-run');
const REF = 'https://www.occto.or.jp/news/access_oshirase_2018_181001_n-1densei_shiryou.html';

const TERM = {
  slug: 'n-1-densei',
  term: 'N-1電制',
  english: 'N-1 Curtailment Scheme',
  reading: 'えぬまいなすいちでんせい',
  category: ['系統連系'],
  subcategory: '連系制度・出力抑制',
  shortDef: '送電設備の1回線故障（N-1）時に、あらかじめ契約した電源を瞬時に制御（電制）することを前提に、平常時の系統の空き容量を拡大して接続を認める運用',
  detail:
    '<h3 id="h-n1densei-1">1. N-1電制とは</h3><p>送電設備の1回線故障（N-1）が起きた際に、あらかじめ契約した電源を瞬時に制御（電制）することを前提として、平常時の系統の空き容量を拡大し接続を認める運用です。従来は故障時にも耐えられる容量しか接続できませんでしたが、この仕組みで既設系統の受け入れ余地が広がりました。</p>' +
    '<h3 id="h-n1densei-2">2. 経緯</h3><p>電力広域的運営推進機関の資料によれば、2018年10月に先行適用が始まり、2022年7月5日からは費用負担を前提に既設電源を含め全ての電源を候補として運用容量を拡大する「本格適用」に移行しています。</p>' +
    '<h3 id="h-n1densei-3">3. 当サイトでの見方</h3><p>当サイトの<a href="/grid/search">変電所検索</a>では「N-1電制 適用可否」「N-1可能量」の欄がこの仕組みに対応します。候補地の系統に受け入れ余地があるかを見る際は、空き容量とあわせて確認してください。</p>' +
    `<p>出典: 電力広域的運営推進機関「N-1電制の基本的な考え方について」 ${REF} ／ 関連: <a href="/glossary/non-firm-connection">ノンファーム接続</a></p>`,
  relatedTerms: 'ノンファーム接続,空き容量,系統連系,運用容量,出力制御',
};

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 400)}`);
  return r.json() as T;
}
async function main(): Promise<void> {
  console.log(`[glossary N-1電制] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  // slug＋term の両方で既存照合（区切り付き）
  const bySlug = await api<{ totalCount: number }>('GET', `${BASE}?filters=slug[equals]${TERM.slug}&fields=id&limit=1`);
  const byTerm = await api<{ totalCount: number; contents: Array<{ slug: string; term: string }> }>('GET', `${BASE}?filters=term[equals]${encodeURIComponent(TERM.term)}&fields=slug,term&limit=3`);
  const near = await api<{ contents: Array<{ slug: string; term: string }> }>('GET', `${BASE}?filters=term[contains]電制[or]slug[contains]n-1&fields=slug,term&limit=5`);
  console.log(`  既存照合: slug=${bySlug.totalCount} term=${byTerm.totalCount} 近似(電制/n-1)=${near.contents.length}`);
  if (bySlug.totalCount > 0 || byTerm.totalCount > 0) { console.log('  既存あり → skip（冪等）'); return; }
  const ref = await fetch(REF, { method: 'HEAD' }).then((r) => r.status).catch(() => 0);
  console.log(`  参照URL: HTTP ${ref} ${REF}`);
  if (ref !== 200) { console.log('  ★参照URL が 200 でない → 出典行を落として報告'); TERM.detail = TERM.detail.replace(/<p>出典:[^<]*(<a[^>]*>[^<]*<\/a>)?<\/p>$/, ''); }
  console.log(`  POST: ${TERM.term}（${TERM.slug}）category=${JSON.stringify(TERM.category)} subcategory=${TERM.subcategory} detail=${TERM.detail.length}字`);
  if (DRY) return;
  const created = await api<{ id: string }>('POST', BASE, TERM);
  await new Promise((r) => setTimeout(r, 900));
  const got = await api<{ contents: Array<Record<string, unknown>> }>('GET', `${BASE}?filters=slug[equals]${TERM.slug}&limit=1`);
  const g = got.contents[0];
  const bad: string[] = [];
  for (const [k, v] of Object.entries(TERM)) {
    const s = g?.[k];
    const same = Array.isArray(v) ? JSON.stringify(v) === JSON.stringify(s) : (k === 'detail' ? String(s ?? '').includes('N-1電制とは') && String(s ?? '').includes('本格適用') : String(s ?? '') === String(v));
    if (!same) bad.push(`${k}: 送信=${JSON.stringify(v).slice(0, 60)} 保存=${JSON.stringify(s).slice(0, 60)}`);
  }
  console.log(`  #106: ${bad.length ? '★NG\n     ' + bad.join('\n     ') : `✓ 全 ${Object.keys(TERM).length} field 一致（id=${created.id}・detail は richEditor 正規化のため marker で判定）`}`);
  if (bad.length) process.exit(1);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
