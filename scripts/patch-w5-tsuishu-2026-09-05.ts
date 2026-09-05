#!/usr/bin/env tsx
/**
 * scripts/patch-w5-tsuishu-2026-09-05.ts — 金曜#5 追修便（ユウ裁定 9/5・EDAさん貼付 9/5）
 *
 * 書込対象（DELETE/PUT なし・各件 PATCH 前 GET 現状値照合＋PATCH 後 #106 全 field 照合）:
 *   ■1 policy-events capacity-main-auction-2026-09 … eventDate 2026-10-26→2026-10-13 / endDate 2026-10-30→2026-10-23
 *      一次（2026-09-05 再取得・逐語）:
 *        HTML https://www.occto.or.jp/news/012742.html（更新日 2026年07月30日）
 *          「(4)2026年10月13日（火）〜2026年10月23日（金）　応札の受付期間」
 *          「(5)2026年10月26日（月）〜2026年10月30日（金）　応札容量算定に用いた期待容量等算定諸元一覧登録受付期間」
 *        PDF 260730_mainauction_boshuyoukou_jitsujukyu2030.pdf p.9 第３章 １.募集スケジュール（pdfplumber extract_tables 行構造保持）
 *          | 2026年10月13日（火）～2026年10月23日（金） | 応札の受付期間 |
 *          | 2026年10月26日（月）～2026年10月30日（金） | 応札容量算定に用いた期待容量等算定諸元一覧登録受付期間 |
 *      ※9/5 政策便の 10/26〜30 は PDF 平文化での行ずれ（金曜#5 報告 判断依頼3 と同根）。
 *   ■4 projects pr-co149815-bess … cod "2026-02-20"（2/20 参入発表日の混入）→ null
 *      表示ステータス「稼働中」は stored status[0] の直接表示（src/app/projects/[slug]/page.tsx:64・page.tsx:38）で
 *      cod から導出していない → null 化で表示は後退しない（実測分岐）。cod 表示は {item.cod && …} で行ごと消える。
 *   ■3(2) 92942 → 149815 の差分移植 … 移植対象なし（sourceUrl は Sustech トップページ、body 断片は竣工で失効、
 *      latitude/longitude は geocoding-results.json addr_source=pref-only＝県名「徳島」の派生座標で一次裏付けなし。
 *      L-EIC-027（導出値を手入力しない）により移植しない。canonical は city=板野郡 確定のため次回 geocoding 便で pref+city 付与が筋）
 *   ■5(a) glossary area-price … detail 末尾に「容量市場におけるエリアプライス」節を追記（JEXP 定義・shortDef・category 不変）
 *      冪等 marker: 見出しテキスト「容量市場におけるエリアプライス」（#122 richEditor は id を採番し直す）
 *   ■5(b) glossary capacity-contribution … detail を §B-4 で置換（現全文は reports/ に保存済み・復元可能）
 *      冪等 marker: 「一般送配電事業者が実需給年度に」
 *   ■5(e) glossary n-1-densei … --n1-url=<URL> --n1-title=<title> 指定時のみ detail 末尾に参考行を追記（marker=URL）
 *
 * 使い方: npx tsx --env-file=.env.local scripts/patch-w5-tsuishu-2026-09-05.ts [--dry-run] [--n1-url=... --n1-title=...]
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const N1_URL = arg('n1-url');
const N1_TITLE = arg('n1-title');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
type Rec = Record<string, unknown> & { id: string };

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url.replace(/\?.*/, '')} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
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
const d10 = (v: unknown) => (typeof v === 'string' ? v.slice(0, 10) : 'null');
let done = 0, skipped = 0, failed = 0;

// ───────────────────────────── ■1 ─────────────────────────────
async function part1(): Promise<void> {
  console.log('\n■1 policy-events capacity-main-auction-2026-09 — 応札受付期間の是正');
  const SLUG = 'capacity-main-auction-2026-09';
  const b = await bySlug('policy-events', SLUG);
  if (!b) { console.log('  ★NG 不在'); failed++; return; }
  console.log(`  現状: title=${b.title} eventDate=${d10(b.eventDate)} endDate=${d10(b.endDate)} status=${JSON.stringify(b.status)} eventType=${JSON.stringify(b.eventType)}`);
  const want = { eventDate: '2026-10-13', endDate: '2026-10-23' };
  if (d10(b.eventDate) === want.eventDate && d10(b.endDate) === want.endDate) { console.log('  [skip] 是正済み（冪等）'); skipped++; return; }
  console.log(`  [PATCH] eventDate ${d10(b.eventDate)}→${want.eventDate} / endDate ${d10(b.endDate)}→${want.endDate}`);
  if (DRY) { done++; return; }
  await api('PATCH', `${ep('policy-events')}/${b.id}`, want);
  await sleep(1000);
  const a = await bySlug('policy-events', SLUG);
  const ok = d10(a?.eventDate) === want.eventDate && d10(a?.endDate) === want.endDate;
  const others = otherDiffs(b, a, ['eventDate', 'endDate']);
  console.log(`  #106: eventDate=${d10(a?.eventDate)} endDate=${d10(a?.endDate)} → ${ok ? '✓' : '★NG'} 他フィールド変化=${others.join(',') || '0'}`);
  if (ok && others.length === 0) done++; else failed++;
}

// ───────────────────────────── ■4 ─────────────────────────────
async function part4(): Promise<void> {
  console.log('\n■4 projects pr-co149815-bess — cod null 化（2/20 参入発表日の混入）');
  const SLUG = 'pr-co149815-bess';
  const b = await bySlug('projects', SLUG);
  if (!b) { console.log('  ★NG 不在'); failed++; return; }
  console.log(`  現状: name=${b.name} status=${JSON.stringify(b.status)} cod=${d10(b.cod)} city=${b.city} operator=${b.operator}`);
  if (JSON.stringify(b.status) !== JSON.stringify(['稼働中'])) { console.log(`  [停止] status が想定（["稼働中"]）と異なる → 書込まず報告`); failed++; return; }
  if (b.cod === undefined || b.cod === null) { console.log('  [skip] cod は既に null（冪等）'); skipped++; return; }
  if (d10(b.cod) !== '2026-02-20') { console.log(`  [停止] cod=${d10(b.cod)} は想定（2026-02-20）と異なる → 書込まず報告`); failed++; return; }
  console.log('  [PATCH] cod 2026-02-20 → null（status は触らない）');
  if (DRY) { done++; return; }
  await api('PATCH', `${ep('projects')}/${b.id}`, { cod: null });
  await sleep(1000);
  const a = await bySlug('projects', SLUG);
  const ok = a !== null && (a.cod === undefined || a.cod === null) && JSON.stringify(a.status) === JSON.stringify(['稼働中']);
  const others = otherDiffs(b, a, ['cod']);
  console.log(`  #106: cod=${a?.cod === undefined ? '(キー無し=null)' : JSON.stringify(a?.cod)} status=${JSON.stringify(a?.status)} → ${ok ? '✓' : '★NG'} 他フィールド変化=${others.join(',') || '0'}`);
  if (ok && others.length === 0) done++; else failed++;
}

// ───────────────────────────── ■5(a) ─────────────────────────────
const AREA_MARK = '容量市場におけるエリアプライス';
const AREA_APPEND =
  `<h3>11. ${AREA_MARK}（同名別概念）</h3>` +
  '<p>なお、容量市場でもエリア別の約定価格を「エリアプライス」と呼ぶ。容量市場の約定処理で、連系線の制約により特定エリアの供給信頼度が目標を満たせない（市場分断）と判断された場合に、そのエリアに全国一律と異なる約定価格が付く仕組み。不足エリアで追加できる電源がない場合は追加処理を終了し、結果として全エリア同一価格になることもある（実需給2027追加オークションの北海道が例）。</p>' +
  '<p>関連: 市場分断・<a href="/glossary/expected-unserved-energy">供給信頼度（EUE）</a>・<a href="/glossary/main-auction">メインオークション</a>・<a href="/glossary/additional-auction">追加オークション</a>／参照: 電力広域的運営推進機関「容量市場 追加オークション（対象実需給年度：2027年度）約定結果」 <a href="https://www.occto.or.jp/news/012931.html" target="_blank" rel="noopener">https://www.occto.or.jp/news/012931.html</a>（当サイト解説: <a href="/news/occto-tsuika-auction-fy2027-kekka-2026-08">追加オークション約定結果の記事</a>）</p>';
async function part5a(): Promise<void> {
  console.log('\n■5(a) glossary area-price — 容量市場のエリアプライス節を末尾追記');
  const b = await bySlug('glossary', 'area-price');
  if (!b) { console.log('  ★NG 不在'); failed++; return; }
  const det = String(b.detail ?? '');
  console.log(`  現状: shortDef=${String(b.shortDef).slice(0, 40)}… category=${JSON.stringify(b.category)} subcategory=${b.subcategory} detail=${det.length}字 marker=${det.includes(AREA_MARK)}`);
  if (det.includes(AREA_MARK)) { console.log('  [skip] 追記済み（冪等）'); skipped++; return; }
  const next = det + AREA_APPEND;
  console.log(`  [PATCH] detail ${det.length}→${next.length}字（先頭〜既存末尾は不変）`);
  if (DRY) { done++; return; }
  await api('PATCH', `${ep('glossary')}/${b.id}`, { detail: next });
  await sleep(1000);
  const a = await bySlug('glossary', 'area-price');
  const ad = String(a?.detail ?? '');
  const ok = ad.includes(AREA_MARK) && ad.includes('実需給2027追加オークションの北海道が例') && ad.startsWith(det.slice(0, 200)) && (ad.match(new RegExp(AREA_MARK, 'g')) || []).length === 1;
  const others = otherDiffs(b, a, ['detail']);
  console.log(`  #106/#122: marker=${ad.includes(AREA_MARK) ? '✓' : '★NG'} 既存冒頭保持=${ad.startsWith(det.slice(0, 200)) ? '✓' : '★NG'} marker出現=${(ad.match(new RegExp(AREA_MARK, 'g')) || []).length}回 送信値と全文一致=${ad === next}（false でも失敗としない） 他フィールド変化=${others.join(',') || '0'}`);
  if (ok && others.length === 0) done++; else failed++;
}

// ───────────────────────────── ■5(b) ─────────────────────────────
// marker は是正後の文言（三者併記）に合わせる。初回実行時は旧 marker「一般送配電事業者が実需給年度に」で照合したため
// ★NG 表示になったが、旧定型文消滅・参照URL・他フィールド変化0 は ✓（PATCH 自体は成功。再実行で marker=true を確認）
const CC_MARK = '配電事業者が実需給年度に';
const CC_DETAIL =
  '<h3>1. 容量拠出金とは</h3>' +
  // §B-4 逐語を基に、一次（OCCTO「容量拠出金を知ろう！」2026-09-05 実測）で2点だけ是正:
  //  ・支払主体は三者（小売電気事業者・一般送配電事業者・配電事業者）— 原文「小売電気事業者および一般送配電事業者、配電事業者が支払いを行う」
  //  ・電気料金への反映は「各小売電気事業者の判断」— 原文「反映させるかどうかは…各小売電気事業者の判断」→「波及する」を「波及しうる」に
  '<p><strong>容量拠出金</strong>は、容量市場の容量確保契約金額を賄うため、小売電気事業者・一般送配電事業者・配電事業者が実需給年度に OCCTO へ支払う負担金。小売電気事業者の判断で電気料金に反映されうるため（小売経由で需要家のコストにも波及しうる）、蓄電池事業者だけでなく電力調達側にも影響する。</p>' +
  '<h3>2. 関連用語</h3>' +
  '<p><a href="/glossary/capacity-market">容量市場</a>・<a href="/glossary/capacity-procurement-contract-amount">容量確保契約（容量確保契約金額）</a>・<a href="/glossary/transitional-power-source">経過措置（経過措置電源）</a>・<a href="/glossary/retail-electricity-business">小売電気事業者</a>・<a href="/glossary/main-auction">メインオークション</a>・<a href="/glossary/additional-auction">追加オークション</a></p>' +
  '<p>参照: 電力広域的運営推進機関「容量拠出金を知ろう！」（かいせつ容量市場スペシャルサイト） <a href="__KYOSHUTSU_URL__" target="_blank" rel="noopener">__KYOSHUTSU_URL__</a></p>';
async function part5b(): Promise<void> {
  console.log('\n■5(b) glossary capacity-contribution — detail を §B-4 で置換');
  const url = arg('kyoshutsu-url');
  const b = await bySlug('glossary', 'capacity-contribution');
  if (!b) { console.log('  ★NG 不在'); failed++; return; }
  const det = String(b.detail ?? '');
  console.log(`  現状: shortDef=${b.shortDef} category=${JSON.stringify(b.category)} subcategory=${b.subcategory} detail=${det.length}字 marker=${det.includes(CC_MARK)}`);
  if (det.includes(CC_MARK)) { console.log('  [skip] 置換済み（冪等）'); skipped++; return; }
  if (!det.includes('この概念は、現代の蓄電池業界')) { console.log('  [停止] 現 detail が定型文でない（想定外）→ 書込まず報告'); failed++; return; }
  if (!url) { console.log('  [停止] --kyoshutsu-url 未指定（参照URLの実在確認待ち）→ 書込まず'); failed++; return; }
  const next = CC_DETAIL.replace(/__KYOSHUTSU_URL__/g, url);
  console.log(`  [PATCH] detail ${det.length}→${next.length}字（shortDef/category/relatedTerms は不変）`);
  if (DRY) { done++; return; }
  await api('PATCH', `${ep('glossary')}/${b.id}`, { detail: next });
  await sleep(1000);
  const a = await bySlug('glossary', 'capacity-contribution');
  const ad = String(a?.detail ?? '');
  const ok = ad.includes(CC_MARK) && !ad.includes('この概念は、現代の蓄電池業界') && ad.includes(url);
  const others = otherDiffs(b, a, ['detail']);
  console.log(`  #106/#122: marker=${ad.includes(CC_MARK) ? '✓' : '★NG'} 旧定型文消滅=${!ad.includes('この概念は、現代の蓄電池業界') ? '✓' : '★NG'} 参照URL=${ad.includes(url) ? '✓' : '★NG'} 送信値と全文一致=${ad === next}（false でも失敗としない） 他フィールド変化=${others.join(',') || '0'}`);
  if (ok && others.length === 0) done++; else failed++;
}

// ───────────────────────────── ■5(e) ─────────────────────────────
async function part5e(): Promise<void> {
  console.log('\n■5(e) glossary n-1-densei — 参照ページ追記（任意）');
  if (!N1_URL) { console.log('  [見送り] --n1-url 未指定（実在ページなし or 後続判断）'); skipped++; return; }
  const b = await bySlug('glossary', 'n-1-densei');
  if (!b) { console.log('  ★NG 不在'); failed++; return; }
  const det = String(b.detail ?? '');
  if (det.includes(N1_URL)) { console.log('  [skip] 追記済み（冪等）'); skipped++; return; }
  const line = `<p>参考: ${N1_TITLE ?? '資源エネルギー庁の解説ページ'} <a href="${N1_URL}" target="_blank" rel="noopener">${N1_URL}</a></p>`;
  const next = det + line;
  console.log(`  [PATCH] detail ${det.length}→${next.length}字 追記=${line}`);
  if (DRY) { done++; return; }
  await api('PATCH', `${ep('glossary')}/${b.id}`, { detail: next });
  await sleep(1000);
  const a = await bySlug('glossary', 'n-1-densei');
  const ad = String(a?.detail ?? '');
  const ok = ad.includes(N1_URL) && ad.startsWith(det.slice(0, 200)) && (ad.split(N1_URL).length - 1) === 2;
  const others = otherDiffs(b, a, ['detail']);
  console.log(`  #106/#122: URL存在=${ad.includes(N1_URL) ? '✓' : '★NG'} 既存冒頭保持=${ad.startsWith(det.slice(0, 200)) ? '✓' : '★NG'} 他フィールド変化=${others.join(',') || '0'}`);
  if (ok && others.length === 0) done++; else failed++;
}

async function main(): Promise<void> {
  console.log(`[w5 追修便] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  await part1();
  await part4();
  await part5a();
  await part5b();
  await part5e();
  console.log(`\n[done] 実行 ${done} / スキップ ${skipped} / 停止・失敗 ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
