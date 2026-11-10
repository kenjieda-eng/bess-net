#!/usr/bin/env tsx
/**
 * scripts/verify-deals.ts — 蓄電所の売買・出資 公表事例（src/data/deals.json・/tracker/deals）の検査（売買事例の一覧便・2026-11-10）
 *
 * 設計（reports/deals-research-2026-10-20.md の 3-12）の 1〜8 と、裁定（2026-10-27）から足した 3 つ:
 *   1. 形: id が一意で 'D-YYYYMMDD-NN'（日付は公表日）。公表日が YYYY-MM-DD・2024-01-01 以降・未来でない。
 *      種類・段階・印・エリアが定義の値（種類に「成約の支援」は無い＝裁定 R9）。出典が 1 本以上・行の出典がちょうど 1 本・取得日がある。
 *   2. 逐語: price.label と price.text・scale（「／」のつなぎ目ごと）が、どれかの出典の quotes[].text に含まれる。公表日が行の出典の publishedOn と一致する
 *      （例外は DATE_EXCEPTIONS に理由つき）。
 *   3. 出典: URL のホストが ALLOWED_HOSTS（発表者のサイト・PR TIMES・適時開示など）にある。報道・まとめ・当サイトは不可。
 *   4. リンク: newsSlug・projectSlugs が表示中（src/lib/deals-related.ts＝画面と同じ関数）。表示中でなければ画面は結ばない（警告だけ）。
 *   5. 並び: --html のとき、画面の行の順と JSON-LD の position が compareDealsForDisplay の順と同じ。
 *   6. エリア: 場所の県から決まるエリアが areas に入っている。供給エリアが分かれる県（SPLIT_PREFS）の行は、手で付けた areas と
 *      その決め方（areaBasis。一次の管内の記載・市区町村から当てた・決まらない理由）がある。
 *   7. 語: 見出し（当サイトが組み立てる）と note に、評価の語と社内の語（scripts/lib/internal-words.ts）が 0。
 *   8. --html <path>: 冒頭の 1 行・全行の公表日と発表者・件数＝データの件数・「このページの案件の売買を仲介・紹介するものではありません。」・
 *      次の一歩の枠が introduce と sell で各 1 か所・EPRX の数値が無い・「成約の支援」が 0。
 *   9〜11（裁定）: 裁定で「外す」とした研究便の行（EXCLUDED_CIDS）と、保留の行（HOLD_CIDS）が items に 0。
 *
 * microCMS へのアクセスなし。prebuild では警告だけ（exit 0）。--strict で問題があれば exit 1。
 * 実行: npm run verify:deals   …   npm run verify:deals -- --strict   …   npm run verify:deals -- --strict --html .next/server/app/tracker/deals.html
 */
import * as fs from 'node:fs';
import {
  DEALS_FILE,
  DEAL_AREA_ORDER,
  KIND_ORDER,
  MARK_ORDER,
  STAGE_ORDER,
  dealDateLabel,
  dealHeading,
  sortDeals,
} from '../src/lib/deals';
import { areaOfPref, PREF_TO_AREA, SPLIT_PREFS } from '../src/lib/pref-area';
import { isVisibleNewsSlug, isVisibleProjectSlug } from '../src/lib/deals-related';
import { hasEprxNumbers } from '../src/lib/next-step';
import { INTERNAL } from './lib/internal-words';
export {};

const STRICT = process.argv.includes('--strict');
const htmlIdx = process.argv.indexOf('--html');
const HTML = htmlIdx >= 0 ? process.argv[htmlIdx + 1] : null;

/** 出典の URL のホスト（発表者のサイト・プレスリリースの配信・適時開示・投資法人のサイト）。報道・まとめ・当サイトは入れない */
const ALLOWED_HOSTS: readonly string[] = [
  // 初版（2026-11-10）の出典のホスト。新しい発表者のサイトは、一次（発表者の公表文・適時開示・プレスリリースの配信）であることを確かめて足す
  'contents.xj-storage.jp',
  'daiwa-ei.jp',
  'digitalpr.jp',
  'fantasista-tokyo.jp',
  'jholdings.co.jp',
  'juniperassets.com',
  'prtimes.jp',
  'ssl4.eir-parts.net',
  'www.itochu.co.jp',
  'www.sbi-moneyplaza.co.jp',
  'www.startupandglobalfinancialcity.metro.tokyo.lg.jp',
  'www.tmex.co.jp',
  'www2.jpx.co.jp',
];

/** 公表日が行の出典の publishedOn と違う行（理由つき） */
const DATE_EXCEPTIONS: Readonly<Record<string, string>> = {};

/** 裁定 §2 で「外す」とした研究便の行（cid）。初版にも、その後の追加にも入れない */
const EXCLUDED_CIDS: readonly string[] = [
  // 裁定 §2 で「→ 外す」「外す＝」の 42 行（02_計画・運営/売買事例_裁定_原則15と81行と設計13問_2026-10-27_ユウ.md）
  'C022', 'C031', 'C044', 'C461', 'C061', 'C065', 'C066', 'C077', 'C105', 'C123',
  'C130', 'C464', 'C147', 'C159', 'C158', 'C161', 'C180', 'C185', 'C186', 'C189',
  'C467', 'C212', 'C216', 'C217', 'C245', 'C259', 'C275', 'C278', 'C307', 'C308',
  'C321', 'C383', 'C405', 'C410', 'C422', 'C470', 'C429', 'C430', 'C440', 'C443',
  'C444', 'C452',
];

/** 原則でも決まらず、ユウの裁定を待つ行（cid）。裁定で載せると決まったら、ここから外して deals.json に足す */
const HOLD_CIDS: readonly string[] = [
  // 初版（2026-11-10）で原則でも決まらなかった行（報告 reports/deals-list-2026-11-10.md (3)）
  'C029', 'C074', 'C098', 'C112', 'C202', 'C249', 'C293', 'C329', 'C330', 'C393', 'C460',
];

/** 見出し・補足に使わない評価の語 */
const EVAL_WORDS = /業界初|日本初|国内初|世界初|最大|最大級|最高|唯一|画期的|注目|圧倒的|大型の|大規模な/;

const problems: string[] = [];
const notes: string[] = [];
const todayJst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const items = DEALS_FILE.items;

// ── 1. 形 ──
const ids = new Set<string>();
for (const d of items) {
  const at = d.id || '(id なし)';
  if (ids.has(d.id)) problems.push(`${at}: id が重複`);
  ids.add(d.id);
  if (!/^D-\d{8}-\d{2}$/.test(d.id)) problems.push(`${at}: id が D-YYYYMMDD-NN でない`);
  else if (d.id.slice(2, 10) !== d.announcedOn.replace(/-/g, '')) problems.push(`${at}: id の日付と公表日 ${d.announcedOn} が違う`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.announcedOn)) problems.push(`${at}: 公表日が YYYY-MM-DD でない`);
  if (d.announcedOn < '2024-01-01') problems.push(`${at}: 公表日 ${d.announcedOn} が 2024-01-01 より前`);
  if (d.announcedOn > todayJst) problems.push(`${at}: 公表日 ${d.announcedOn} が未来`);
  if (!d.publisher.trim()) problems.push(`${at}: 発表者が空`);
  if (d.kinds.length === 0) problems.push(`${at}: 種類が空`);
  for (const k of d.kinds) if (!(KIND_ORDER as readonly string[]).includes(k)) problems.push(`${at}: 種類「${k}」は定義に無い（成約の支援は作らない）`);
  if (d.stages.length === 0) problems.push(`${at}: 段階が空`);
  for (const s of d.stages) if (!(STAGE_ORDER as readonly string[]).includes(s)) problems.push(`${at}: 段階「${s}」は定義に無い`);
  for (const m of d.marks) if (!(MARK_ORDER as readonly string[]).includes(m)) problems.push(`${at}: 印「${m}」は定義に無い`);
  if (d.areas.length === 0) problems.push(`${at}: エリアが空（分からなければ unknown）`);
  for (const a of d.areas) if (!(DEAL_AREA_ORDER as readonly string[]).includes(a)) problems.push(`${at}: エリア「${a}」は定義に無い`);
  if (d.sources.length === 0) problems.push(`${at}: 出典が無い`);
  if (d.sources.filter((s) => s.role === 'primary').length !== 1) problems.push(`${at}: 行の出典（primary）がちょうど 1 本でない`);
  for (const s of d.sources) {
    if (!s.title.trim() || !s.publisher.trim()) problems.push(`${at}: 出典の題名か発行者が空（${s.url}）`);
    if (!/^https?:\/\//.test(s.url)) problems.push(`${at}: 出典の URL が http(s) でない（${s.url}）`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.fetchedOn)) problems.push(`${at}: 出典の取得日が YYYY-MM-DD でない（${s.url}）`);
    if (s.sha256 !== null && !/^[0-9a-f]{64}$/.test(s.sha256)) problems.push(`${at}: 出典の sha256 の形が違う（${s.url}）`);
    if (s.quotes.length === 0) problems.push(`${at}: 出典に逐語が無い（${s.url}）`);
  }
  if (d.researchCids.length === 0) notes.push(`${at}: 研究便の行番号なし（この便より後に足した行）`);
}

// ── 2. 逐語 ──
for (const d of items) {
  const quoteText = d.sources.flatMap((s) => s.quotes.map((q) => q.text)).join('\n');
  if (d.price) {
    if (!quoteText.includes(d.price.text)) problems.push(`${d.id}: 価格「${d.price.text}」がどの出典の逐語にも無い`);
    if (!quoteText.includes(d.price.label)) problems.push(`${d.id}: 価格のラベル「${d.price.label}」がどの出典の逐語にも無い`);
  }
  // 規模は「／」で別の箇所からの抜き出しをつなぐことがある（画面の決まりと同じ）。つなぎ目ごとに逐語を確かめる
  for (const seg of d.scale ? d.scale.split('／').filter(Boolean) : []) {
    if (!quoteText.includes(seg)) problems.push(`${d.id}: 規模の「${seg}」がどの出典の逐語にも無い`);
  }
  const primary = d.sources.find((s) => s.role === 'primary');
  if (primary && primary.publishedOn !== d.announcedOn && !DATE_EXCEPTIONS[d.id]) {
    problems.push(`${d.id}: 公表日 ${d.announcedOn} と行の出典の日付 ${primary.publishedOn} が違う（例外なら DATE_EXCEPTIONS に理由）`);
  }
}

// ── 3. 出典のホスト ──
const BANNED = /(^|\.)bess-net\.jp$|nikkei\.com$|newswitch\.jp$|itmedia\.co\.jp$|yahoo\.co\.jp$|denkishimbun\.com$|wikipedia\.org$/;
const hosts = new Map<string, number>();
for (const d of items) {
  for (const s of d.sources) {
    let host = '';
    try { host = new URL(s.url).hostname; } catch { problems.push(`${d.id}: 出典の URL が読めない（${s.url}）`); continue; }
    hosts.set(host, (hosts.get(host) ?? 0) + 1);
    if (BANNED.test(host)) problems.push(`${d.id}: 出典のホスト ${host} は一次ではない（報道・まとめ・当サイト）`);
    else if (!ALLOWED_HOSTS.includes(host)) problems.push(`${d.id}: 出典のホスト ${host} が ALLOWED_HOSTS に無い（発表者のサイト等なら足す）`);
  }
}

// ── 4. リンク ──
for (const d of items) {
  if (d.newsSlug && !isVisibleNewsSlug(d.newsSlug)) notes.push(`${d.id}: 記事 ${d.newsSlug} は表示中でない（画面は結ばない）`);
  for (const p of d.projectSlugs) if (!isVisibleProjectSlug(p)) notes.push(`${d.id}: プロジェクト ${p} は表示中でない（画面は結ばない）`);
}

// ── 6. エリア ──
for (const d of items) {
  for (const p of d.places) {
    if (!p.pref) continue;
    if (!(p.pref in PREF_TO_AREA)) { problems.push(`${d.id}: 県「${p.pref}」が対応表に無い`); continue; }
    const a = areaOfPref(p.pref);
    if (a && !d.areas.includes(a)) problems.push(`${d.id}: ${p.pref} のエリア ${a} が areas に無い`);
    // 分かれる県は、手で付けた areas と、その決め方（areaBasis＝一次の管内の記載・市区町村から当てた・決まらない理由）を持つ
    if (!a && SPLIT_PREFS.has(p.pref) && !d.areaBasis.trim()) {
      problems.push(`${d.id}: ${p.pref} は供給エリアが分かれる県。市区町村（${p.city || '記載なし'}）から手で areas を付け、areaBasis に決め方を書く`);
    }
  }
}

// ── 7. 語 ──
for (const d of items) {
  const ours = `${dealHeading(d)}\n${d.note}`;
  const ev = ours.match(EVAL_WORDS);
  if (ev) problems.push(`${d.id}: 見出しか補足に評価の語「${ev[0]}」`);
  for (const [re, label] of INTERNAL) {
    const m = ours.match(re);
    if (m) problems.push(`${d.id}: 見出しか補足に社内の語（${label}）「${m[0]}」`);
  }
}

// ── 9〜11. 裁定で外した行・保留の行 ──
const cidsIn = new Map<string, string>();
for (const d of items) for (const c of d.researchCids) {
  if (cidsIn.has(c)) problems.push(`${d.id}: 研究便の行 ${c} が ${cidsIn.get(c)} にも入っている（1 取引 1 行）`);
  cidsIn.set(c, d.id);
}
for (const c of EXCLUDED_CIDS) if (cidsIn.has(c)) problems.push(`${cidsIn.get(c)}: 裁定で外した行 ${c} が入っている`);
for (const c of HOLD_CIDS) if (cidsIn.has(c)) problems.push(`${cidsIn.get(c)}: 保留の行 ${c} が入っている（裁定の後に HOLD_CIDS から外して足す）`);

// ── 5・8. ビルド出力（--html） ──
if (HTML) {
  if (!fs.existsSync(HTML)) problems.push(`--html ${HTML} が無い`);
  else {
    const raw = fs.readFileSync(HTML, 'utf8');
    const visible = raw.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!-- -->/g, '');
    const sorted = sortDeals(items);
    const domIds = [...visible.matchAll(/id="deal-(D-\d{8}-\d{2})"/g)].map((m) => m[1]);
    if (domIds.join(',') !== sorted.map((d) => d.id).join(',')) problems.push(`--html: 画面の行の順（${domIds.length} 行）が compareDealsForDisplay の順と違う`);
    const ld = [...raw.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
    const list = ld.find((j) => j && j['@type'] === 'ItemList');
    const ldIds = list ? (list.itemListElement as { position: number; url: string }[]).sort((a, b) => a.position - b.position).map((e) => e.url.replace(/^.*#deal-/, '')) : [];
    if (ldIds.join(',') !== sorted.map((d) => d.id).join(',')) problems.push('--html: JSON-LD の position の順が compareDealsForDisplay の順と違う');
    if (list && list.numberOfItems !== items.length) problems.push(`--html: JSON-LD の numberOfItems ${list.numberOfItems}・データ ${items.length}`);
    const LEAD = '各社の発表・適時開示・有価証券報告書などの一次で確かめた、蓄電所の売買・出資の公表事実だけを並べています（網羅ではありません）。このページの案件の売買を仲介・紹介するものではありません。';
    if (!visible.includes(LEAD)) problems.push('--html: 冒頭の 1 行が無い');
    if (!visible.includes('このページの案件の売買を仲介・紹介するものではありません。')) problems.push('--html: 「このページの案件の売買を仲介・紹介するものではありません。」が無い');
    if (!visible.includes(`${items.length} 件のうち ${items.length} 件を表示`)) problems.push(`--html: 「${items.length} 件のうち ${items.length} 件を表示」が無い`);
    for (const d of items) {
      const re = new RegExp(`id="deal-${d.id}"[\\s\\S]*?</article>`);
      const card = visible.match(re)?.[0] ?? '';
      if (!card.includes(dealDateLabel(d.announcedOn))) problems.push(`--html: ${d.id} の公表日が初期 DOM に無い`);
      const pub = d.publisher.replace(/&/g, '&amp;');
      if (!card.includes(pub)) problems.push(`--html: ${d.id} の発表者が初期 DOM に無い`);
    }
    const intro = (raw.match(/data-next-step-box="introduce"/g) ?? []).length;
    const sell = (raw.match(/data-next-step-box="sell"/g) ?? []).length;
    if (intro !== 1 || sell !== 1) problems.push(`--html: 次の一歩の枠 introduce ${intro}・sell ${sell}（各 1 か所）`);
    if ((visible.match(/data-next-step-box=/g) ?? []).length !== 2) problems.push('--html: 次の一歩の枠が 2 つでない');
    if (visible.includes('成約の支援')) problems.push('--html: 「成約の支援」がある');
    if (hasEprxNumbers(visible.replace(/<[^>]+>/g, ' '))) problems.push('--html: EPRX の数値がある（次の一歩を置けないページ）');
    const bytes = fs.statSync(HTML).size;
    notes.push(`--html: ${HTML} ${bytes.toLocaleString('en-US')} バイト（${(bytes / 1024 / 1024).toFixed(2)}MB・1.5MB を超えたら年ごとのページに分ける）`);
    if (bytes > 1.5 * 1024 * 1024) problems.push(`--html: ${(bytes / 1024 / 1024).toFixed(2)}MB が 1.5MB を超えた（裁定 §3-10: 年ごとのページに分ける）`);
  }
}

// ── 出力 ──
const byKind = KIND_ORDER.map((k) => `${k} ${items.filter((d) => d.kinds.includes(k)).length}`).join('・');
console.log(`[verify:deals] ${items.length} 件（${byKind}）・価格あり ${items.filter((d) => d.price).length}・出典のホスト ${hosts.size} 種・確かめた日 ${DEALS_FILE.checked.from}〜${DEALS_FILE.checked.to}`);
for (const n of notes) console.log(`[verify:deals] note ${n}`);
if (problems.length) {
  const head = STRICT ? '★NG' : 'WARN';
  (STRICT ? console.error : console.warn)(`[verify:deals] ${head} ${problems.length} 件`);
  problems.slice(0, 60).forEach((p) => (STRICT ? console.error : console.warn)(`  - ${p}`));
  if (STRICT) process.exit(1);
} else {
  console.log(`[verify:deals] ok   形・逐語・出典・エリア・語・裁定で外した行と保留の行${HTML ? '・ビルド出力' : ''}`);
}
