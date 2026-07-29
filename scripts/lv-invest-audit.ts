/**
 * scripts/lv-invest-audit.ts — 低圧投資家ガイド 全量総点検（完成前検査・2026-07-29）
 *
 * 本番HTMLに対して機械検査（2-1〜2-12）を実施。microCMS への書込・削除は一切しない（GET のみ、
 * 実際は本番サイト bess-net.jp への HTTP GET だけ）。LV_INVEST_ARTICLES は import type 経由で
 * microcms を実行時に読み込まないため env 不要。
 *
 * 実行: AUDIT_BASE=https://bess-net.jp tsx scripts/lv-invest-audit.ts
 * 出力: 標準出力に表形式サマリ＋ scratchpad に evidence JSON。
 */
import { LV_INVEST_ARTICLES } from '@/lib/lv-invest';
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.env.AUDIT_BASE || 'https://bess-net.jp').replace(/\/$/, '');
const OUT = process.env.AUDIT_OUT || 'audit-evidence.json';

const SLUGS = LV_INVEST_ARTICLES.map((a) => a.slug);
const CASE_SLUGS = LV_INVEST_ARTICLES.filter((a) => a.slug.startsWith('case-')).map((a) => a.slug);
const STRONG_DISCLAIMER_SLUGS = ['contract-clauses', 'om-contract'];
const EXTERNAL_LINK_SLUGS = LV_INVEST_ARTICLES.filter((a) => a.externalLinks?.length).map((a) => a.slug);

const CTA_URL = 'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_lv_invest';

// ---- 禁止語の正準リスト（scripts/lv-invest-banned-words.json に内蔵・以後の監査はこれで判定） ----
// hardBanned: 全87で0であるべき（鉤括弧内でも不可）。quoteOnly: 出現可だが全出現が「」内であるべき。
const BANNED = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'lv-invest-banned-words.json'), 'utf8')
) as { hardBanned: string[]; quoteOnly: string[] };
const HARD_BANNED = BANNED.hardBanned;
const QUOTE_FORM = BANNED.quoteOnly;

const LINK_PREFIXES = ['/lv', '/dl', '/tools', '/faq', '/market', '/buyer', '/policy-calendar', '/incidents', '/about', '/privacy', '/editorial-policy'];

// ---------------- fetch helpers ----------------
type Fetched = { url: string; status: number; ct: string; html: string };
function cb() {
  return `__audit=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
async function get(path: string, opts: { body?: boolean } = {}): Promise<Fetched> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const sep = url.includes('?') ? '&' : '?';
  const full = `${url}${sep}${cb()}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(full, {
        redirect: 'manual',
        cache: 'no-store',
        headers: { 'cache-control': 'no-cache', pragma: 'no-cache', 'user-agent': 'bess-net-audit/1.0' },
      });
      const ct = res.headers.get('content-type') || '';
      const html = opts.body === false ? '' : await res.text();
      return { url, status: res.status, ct, html };
    } catch (e) {
      if (attempt === 2) return { url, status: -1, ct: '', html: String(e) };
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return { url, status: -1, ct: '', html: '' };
}
async function pool<T, R>(items: T[], n: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

// ---------------- html helpers ----------------
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}
/** 表示テキスト近似: script/style 除去 → タグ除去 → 実体復号（#107 と同方針）。 */
function displayText(html: string): string {
  const noScript = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  const noTags = noScript.replace(/<[^>]+>/g, ' ');
  return decodeEntities(noTags).replace(/\s+/g, ' ');
}
function getTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : '';
}
function getCanonical(html: string): string {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  for (const l of links) {
    if (/rel=["']canonical["']/i.test(l)) {
      const h = l.match(/href=["']([^"']+)["']/i);
      if (h) return decodeEntities(h[1]);
    }
  }
  return '';
}
function jsonLdTypes(html: string): string[] {
  const out: string[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1]);
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) if (d && d['@type']) out.push(String(d['@type']));
    } catch {
      /* ignore parse errors */
    }
  }
  return out;
}
function countOcc(hay: string, needle: string): number {
  if (!needle) return 0;
  let c = 0;
  let i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) {
    c++;
    i += needle.length;
  }
  return c;
}
/** 鉤括弧「」の外に needle が出るか（全出現が括弧内なら false）。 */
function hasUnbracketed(text: string, needle: string): boolean {
  const stripped = text.replace(/「[^」]*」/g, '');
  return countOcc(stripped, needle) > 0;
}
/** article-body 内のネストアンカー検出（<a> の入れ子）。 */
function hasNestedAnchor(html: string): boolean {
  let depth = 0;
  const re = /<a\b|<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[0].toLowerCase() === '</a>') depth = Math.max(0, depth - 1);
    else {
      depth++;
      if (depth > 1) return true;
    }
  }
  return false;
}
/** ページ内の href を抽出（decode 済み・重複あり）。 */
function extractHrefs(html: string): string[] {
  const out: string[] = [];
  const re = /href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(decodeEntities(m[1]));
  return out;
}

// ---------------- main ----------------
type ArticleRec = {
  slug: string;
  status: number;
  title: string;
  titleSuffixOnce: boolean;
  titleHasKw: boolean;
  canonical: string;
  canonicalOk: boolean;
  ctaOk: boolean;
  hasNormalDisclaimer: boolean;
  hasStrong: boolean;
  hasCaseBox: boolean;
  jsonLdArticle: boolean;
  jsonLdBreadcrumb: boolean;
  nested: boolean;
  banHits: { word: string; count: number }[];
  quoteViolations: { word: string; count: number }[];
  eduLinks: string[];
};

async function main() {
  console.log(`AUDIT_BASE=${BASE}  articles=${SLUGS.length}`);

  // fetch all articles
  const arts = await pool(SLUGS, 8, async (slug) => {
    const r = await get(`/lv/invest/${slug}`);
    return { slug, ...r };
  });
  const htmlBySlug = new Map<string, string>(arts.map((a) => [a.slug, a.html]));

  // hub, explainer index, sitemap
  const hub = await get('/lv/invest');
  const explainerIdx = await get('/explainer');
  const sitemap = await get('/sitemap.xml');

  const records: ArticleRec[] = arts.map((a) => {
    const html = a.html;
    const text = displayText(html);
    const title = getTitle(html);
    const decodedHtml = decodeEntities(html);
    const canonical = getCanonical(html);
    const types = jsonLdTypes(html);
    const banHits = HARD_BANNED.map((w) => ({ word: w, count: countOcc(text, w) })).filter((x) => x.count > 0);
    const textNoBrackets = text.replace(/「[^」]*」/g, '');
    const quoteViolations = QUOTE_FORM.map((w) => ({ word: w, count: countOcc(textNoBrackets, w) })).filter(
      (x) => x.count > 0
    );
    // article-body 抽出（nested anchor 判定はbody部に限定）
    const bodyMatch = html.match(/<div class="article-body"[\s\S]*?<\/div>\s*(?:<!--|<section|<p class="back-link"|$)/i);
    const bodyHtml = bodyMatch ? bodyMatch[0] : html;
    const eduLinks = extractHrefs(html)
      .filter((h) => h.includes('data.eic-jp.org/insight/'))
      .map((h) => h)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    // #88: サフィックス「 | 蓄電所ネット」がちょうど1回・末尾（本文中のブランド名は数えない）
    const SUFFIX = ' | 蓄電所ネット';
    const suffixCount = countOcc(title, SUFFIX);
    return {
      slug: a.slug,
      status: a.status,
      title,
      titleSuffixOnce: suffixCount === 1 && title.endsWith(SUFFIX),
      titleHasKw: title.includes('低圧蓄電所') || title.includes('蓄電池'),
      canonical,
      canonicalOk: canonical === `${BASE}/lv/invest/${a.slug}` || canonical === `https://bess-net.jp/lv/invest/${a.slug}`,
      ctaOk: decodedHtml.includes(CTA_URL),
      hasNormalDisclaimer: html.includes('安心してお読みいただくために'),
      hasStrong: text.includes('法的助言'),
      hasCaseBox: /編集部が(作成し|想定例として構成)/.test(text),
      jsonLdArticle: types.includes('Article'),
      jsonLdBreadcrumb: types.includes('BreadcrumbList'),
      nested: hasNestedAnchor(bodyHtml),
      banHits,
      quoteViolations,
      eduLinks,
    };
  });

  // ---- link crawl (2-6) ----
  const allHtml = [hub.html, ...arts.map((a) => a.html)];
  const linkSet = new Set<string>();
  for (const html of allHtml) {
    for (const href of extractHrefs(html)) {
      let target = '';
      if (href.includes('data.eic-jp.org')) target = href.split('#')[0];
      else if (href.startsWith('/') && LINK_PREFIXES.some((p) => href === p || href.startsWith(p + '/') || href.startsWith(p + '?') || href.startsWith(p + '#')))
        target = `${BASE}${href.split('#')[0]}`;
      else if (/^https?:\/\/(www\.)?bess-net\.jp\//.test(href)) {
        const path = href.replace(/^https?:\/\/(www\.)?bess-net\.jp/, '').split('#')[0];
        if (LINK_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))) target = `${BASE}${path}`;
      }
      if (target) linkSet.add(target);
    }
  }
  const links = [...linkSet].sort();
  const linkResults = await pool(links, 8, async (u) => {
    const r = await get(u);
    return { url: u, status: r.status, ct: r.ct };
  });
  const linkBad = linkResults.filter((r) => r.status !== 200);

  // ---- DL PDFs (2-10) ----
  const dlSet = new Set<string>();
  for (const href of extractHrefs(hub.html)) {
    const h = decodeEntities(href);
    if (/\/dl\/[^"']+\.pdf$/i.test(h)) dlSet.add(h.startsWith('http') ? h : `${BASE}${h}`);
  }
  const dls = [...dlSet].sort();
  const dlResults = await pool(dls, 6, async (u) => {
    const r = await get(u, { body: false });
    return { url: u, status: r.status, ct: r.ct };
  });
  const dlBad = dlResults.filter((r) => r.status !== 200 || !/pdf/i.test(r.ct));

  // ---- backlink graph (2-7) ----
  const inbound = new Map<string, number>();
  for (const slug of SLUGS) inbound.set(slug, 0);
  const sources: { html: string; self?: string }[] = [{ html: hub.html }, ...arts.map((a) => ({ html: a.html, self: a.slug }))];
  for (const slug of SLUGS) {
    let n = 0;
    for (const src of sources) {
      if (src.self === slug) continue; // 自己参照は除外
      if (src.html.includes(`/lv/invest/${slug}"`) || src.html.includes(`/lv/invest/${slug}?`)) n++;
    }
    inbound.set(slug, n);
  }
  const isolated = SLUGS.filter((s) => (inbound.get(s) || 0) === 0);

  // ---- sitemap (2-8/2-9/2-12) ----
  const smUrls = (sitemap.html.match(/<loc>([^<]+)<\/loc>/gi) || []).map((l) => l.replace(/<\/?loc>/gi, ''));
  const smLvInvest = smUrls.filter((u) => /\/lv\/invest(\/|$)/.test(u));
  const smLvInvestSlugs = smLvInvest.map((u) => u.replace(/.*\/lv\/invest\/?/, '').replace(/\/$/, '')).filter(Boolean);
  const smLvInvestDup = smLvInvest.length !== new Set(smLvInvest).size;
  const smExplainerLeaks = SLUGS.filter((s) => smUrls.includes(`https://bess-net.jp/lv/invest/${s}`) && smUrls.includes(`https://bess-net.jp/explainer/${s}`));
  const missingInSitemap = SLUGS.filter((s) => !smLvInvestSlugs.includes(s));
  const hubInSitemap = smUrls.includes('https://bess-net.jp/lv/invest');

  // explainer numberOfItems (2-8)
  let numberOfItems = -1;
  {
    const re = /"numberOfItems"\s*:\s*(\d+)/;
    const m = explainerIdx.html.match(re);
    if (m) numberOfItems = Number(m[1]);
  }
  // 87 slug が /explainer 一覧HTMLに露出していないか
  const explainerLeakInIndex = SLUGS.filter((s) => explainerIdx.html.includes(`/explainer/${s}"`));

  // ============ REPORT ============
  const R: string[] = [];
  const P = (s = '') => R.push(s);
  const pass = (b: boolean) => (b ? 'PASS' : 'NG');

  P(`\n================ 低圧投資家ガイド 総点検（${BASE}）================`);

  // 2-1 title
  const t1ng = records.filter((r) => !(r.status === 200 && r.titleSuffixOnce && r.titleHasKw));
  P(`\n[2-1] title サフィックス1回＋KW含有: 対象87 / PASS ${87 - t1ng.length} / NG ${t1ng.length}`);
  t1ng.forEach((r) => P(`   NG ${r.slug}: suffixOnce=${r.titleSuffixOnce} kw=${r.titleHasKw} title="${r.title}"`));

  // 2-2 canonical
  const t2ng = records.filter((r) => !r.canonicalOk);
  P(`\n[2-2] canonical /lv/invest/{slug}: 対象87 / PASS ${87 - t2ng.length} / NG ${t2ng.length}`);
  t2ng.forEach((r) => P(`   NG ${r.slug}: canonical="${r.canonical}"`));

  // 2-3 CTA
  const t3ng = records.filter((r) => !r.ctaOk);
  const hubCta = decodeEntities(hub.html).includes(CTA_URL);
  P(`\n[2-3] CTA funnel_lv_invest UTM3点: 対象87記事＋ハブ / 記事PASS ${87 - t3ng.length} / 記事NG ${t3ng.length} / ハブ=${pass(hubCta)}`);
  t3ng.forEach((r) => P(`   NG ${r.slug}`));

  // 2-4 disclaimers
  const normalNg = records.filter((r) => !r.hasNormalDisclaimer);
  const strongHave = records.filter((r) => r.hasStrong).map((r) => r.slug).sort();
  const caseHave = records.filter((r) => r.hasCaseBox).map((r) => r.slug).sort();
  const strongOk = JSON.stringify(strongHave) === JSON.stringify([...STRONG_DISCLAIMER_SLUGS].sort());
  const caseOk = JSON.stringify(caseHave) === JSON.stringify([...CASE_SLUGS].sort());
  P(`\n[2-4] 免責: 通常免責 present=${87 - normalNg.length}/87 / 強化免責=${JSON.stringify(strongHave)} (期待${JSON.stringify(STRONG_DISCLAIMER_SLUGS)}) ${pass(strongOk)} / 想定例box=${caseHave.length}本 ${pass(caseOk)}`);
  if (normalNg.length) P(`   通常免責NG: ${normalNg.map((r) => r.slug).join(', ')}`);
  P(`   想定例box slugs: ${caseHave.join(', ')}`);

  // 2-5 banned words
  const banAny = records.filter((r) => r.banHits.length > 0);
  const quoteAny = records.filter((r) => r.quoteViolations.length > 0);
  P(`\n[2-5] 禁止語（正準: scripts/lv-invest-banned-words.json）: hardBanned=${JSON.stringify(HARD_BANNED)} / quoteOnly=${JSON.stringify(QUOTE_FORM)}`);
  P(`   hardBanned hit記事=${banAny.length} / quoteOnly の括弧外出現記事=${quoteAny.length}`);
  banAny.forEach((r) => P(`   hardBanned hit ${r.slug}: ${JSON.stringify(r.banHits)}`));
  quoteAny.forEach((r) => P(`   括弧外 ${r.slug}: ${JSON.stringify(r.quoteViolations)}`));

  // 2-6 link sweep
  P(`\n[2-6] 内部リンク全数スイープ: ユニーク${links.length}件クロール / 非200 ${linkBad.length}件 / nested-anchor ${records.filter((r) => r.nested).length}記事`);
  linkBad.forEach((r) => P(`   非200 ${r.status} ${r.url}`));
  records.filter((r) => r.nested).forEach((r) => P(`   nested-anchor ${r.slug}`));

  // 2-7 backlinks
  P(`\n[2-7] 被リンク網: 孤立記事(被リンク0)=${isolated.length}`);
  if (isolated.length) P(`   孤立: ${isolated.join(', ')}`);
  const minInbound = Math.min(...SLUGS.map((s) => inbound.get(s) || 0));
  P(`   最小被リンク数=${minInbound} / 例(少ない順先頭5): ${SLUGS.map((s) => [s, inbound.get(s) || 0] as [string, number]).sort((a, b) => a[1] - b[1]).slice(0, 5).map(([s, n]) => `${s}:${n}`).join(', ')}`);

  // 2-8 non-mixing
  P(`\n[2-8] 非混在: /explainer numberOfItems=${numberOfItems} (期待174) ${pass(numberOfItems === 174)} / explainer一覧への87slug露出=${explainerLeakInIndex.length} / sitemap二重露出=${smExplainerLeaks.length}`);
  if (explainerLeakInIndex.length) P(`   露出: ${explainerLeakInIndex.join(', ')}`);

  // 2-9 sitemap
  P(`\n[2-9] sitemap: /lv/invest 記事slug=${smLvInvestSlugs.length} (期待87) / ハブ収録=${pass(hubInSitemap)} / 重複=${pass(!smLvInvestDup)} / 記事漏れ=${missingInSitemap.length}`);
  if (missingInSitemap.length) P(`   漏れ: ${missingInSitemap.join(', ')}`);

  // 2-10 DL
  P(`\n[2-10] DL PDF: 検出${dls.length}件 (期待12) / 200+application/pdf NG=${dlBad.length}`);
  dlResults.forEach((r) => P(`   ${r.status} ${/pdf/i.test(r.ct) ? 'pdf' : r.ct} ${r.url}`));

  // 2-11 structured data
  const sdNg = records.filter((r) => !(r.jsonLdArticle && r.jsonLdBreadcrumb));
  P(`\n[2-11] 構造化データ Article+BreadcrumbList: 対象87 / PASS ${87 - sdNg.length} / NG ${sdNg.length}`);
  sdNg.forEach((r) => P(`   NG ${r.slug}: Article=${r.jsonLdArticle} Breadcrumb=${r.jsonLdBreadcrumb}`));

  // 2-12 generation consistency
  const all200 = records.filter((r) => r.status === 200).length;
  const codeCount = SLUGS.length;
  const consistent = smLvInvestSlugs.length === codeCount && all200 === codeCount;
  P(`\n[2-12] 生成整合: code=${codeCount} / sitemap(microCMS由来)=${smLvInvestSlugs.length} / live200=${all200} / 一致=${pass(consistent)}`);

  // Stage1 EIC links summary
  P(`\n[Stage1] EIC教材リンク: 対象記事=${JSON.stringify(EXTERNAL_LINK_SLUGS)}`);
  for (const s of EXTERNAL_LINK_SLUGS) {
    const r = records.find((x) => x.slug === s)!;
    P(`   ${s}: eduLinks=${JSON.stringify(r.eduLinks)}`);
  }
  // 混入チェック: 対象外記事に insight リンクが無いこと
  const leaked = records.filter((r) => !EXTERNAL_LINK_SLUGS.includes(r.slug) && r.eduLinks.length > 0);
  P(`   混入(対象外記事のinsightリンク)=${leaked.length}${leaked.length ? ': ' + leaked.map((r) => r.slug).join(',') : ''}`);
  P(`   UTM整合(全eduLinkにedu_cluster付与): ${records.every((r) => r.eduLinks.every((h) => h.includes('utm_campaign=edu_cluster'))) ? 'PASS' : 'NG'}`);

  const report = R.join('\n');
  console.log(report);

  writeFileSync(OUT, JSON.stringify({ base: BASE, records, links: linkResults, dls: dlResults, inbound: Object.fromEntries(inbound), numberOfItems, smLvInvestSlugs }, null, 2));
  console.log(`\n[evidence] ${OUT}`);

  // machine-readable verdict line
  const NG =
    t1ng.length + t2ng.length + t3ng.length + (hubCta ? 0 : 1) + normalNg.length + (strongOk ? 0 : 1) + (caseOk ? 0 : 1) +
    banAny.length + quoteAny.length + linkBad.length + records.filter((r) => r.nested).length + isolated.length +
    (numberOfItems === 174 ? 0 : 1) + explainerLeakInIndex.length + smExplainerLeaks.length +
    (hubInSitemap ? 0 : 1) + (smLvInvestDup ? 1 : 0) + missingInSitemap.length + (smLvInvestSlugs.length === 87 ? 0 : 1) +
    dlBad.length + (dls.length === 12 ? 0 : 1) + sdNg.length + (consistent ? 0 : 1) + leaked.length;
  console.log(`\n==== TOTAL_NG=${NG} ====`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
