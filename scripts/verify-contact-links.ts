#!/usr/bin/env tsx
/**
 * scripts/verify-contact-links.ts — 相談のリンク（eic-jp.org/contact）の検査（入口の掃除と計測便・2026-10-17）
 *
 * 1. src（既定）: `https://eic-jp.org/contact` の生の文字列が src/lib/contact-link.ts の外に無いこと（コメントは除く）。
 *    また href / url に UTM の無い式（siteConfig.contactUrl・siteConfig.organization.contactUrl・CONTACT_DISPLAY_URL）を渡していないこと。
 *    → 相談のリンクは必ず contactUrl({ campaign, position }) で作る。画面に URL を文字で出すときだけ CONTACT_DISPLAY_URL。
 * 2. --html <dir>（例 .next/server/app、または本番を curl で保存したフォルダ）: その下の *.html の
 *    eic-jp.org/contact への href が全部 utm_source=bess-net を持つこと（例外 0）。リンクの表示の文字に utm_ が出ていないこと。
 * 3. --self-test: 故障注入（わざと壊した src の行・HTML の断片）を検出できることを確かめる。
 *
 * 既定は警告だけ（exit 0）。--strict で違反があれば exit 1。
 * 実行: npx tsx scripts/verify-contact-links.ts [--html .next/server/app] [--strict] [--self-test]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { addContactUtmToHtml } from '../src/lib/contact-link';
export {};

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const htmlIdx = args.indexOf('--html');
const HTML_DIR = htmlIdx >= 0 ? args[htmlIdx + 1] : undefined;
const SELF_TEST = args.includes('--self-test');
const TAG = '[verify:contact-links]';

const ALLOWED_RAW_FILES = new Set(['src/lib/contact-link.ts']);
const RAW_URL = /https?:\/\/(?:www\.)?eic-jp\.org\/contact/;
// href・url に UTM の無い式を渡している所
const BARE_HREF = /\b(?:href|url|ctaUrl|heroCtaUrl)\s*[:=]\s*\{?\s*(?:siteConfig\.(?:organization\.)?contactUrl|CONTACT_DISPLAY_URL)\b/;

type Finding = { where: string; text: string; why: string };

function isCommentLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('{/*');
}

// 表示用の URL（UTM なし）の式。使ってよいのは「画面に文字で出す {…} だけの行」と定義のファイルだけ
//（変数に入れてから href に渡す形＝旧 /projects の siteContactUrl を見逃さないため。レビュー M1・2026-10-17）
const DISPLAY_REF = /siteConfig\.(?:organization\.)?contactUrl|CONTACT_DISPLAY_URL/;
const DISPLAY_CHILD = /^\s*\{(?:siteConfig\.(?:organization\.)?contactUrl|CONTACT_DISPLAY_URL)\}\s*$/;
const DISPLAY_DEF_FILES = new Set(['src/lib/site-config.ts', 'src/lib/contact-link.ts']);

export function checkSrcLine(file: string, line: string): string | null {
  if (isCommentLine(line)) return null;
  if (!ALLOWED_RAW_FILES.has(file) && RAW_URL.test(line)) return '生の URL（contactUrl() を使う）';
  if (BARE_HREF.test(line)) return 'UTM の無い式を href / url に渡している';
  if (!DISPLAY_DEF_FILES.has(file) && DISPLAY_REF.test(line) && !DISPLAY_CHILD.test(line)) return '表示用の URL（UTM なし）を表示の外で使っている';
  return null;
}

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(p, exts, out);
    } else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

function checkSrc(root = 'src'): Finding[] {
  const out: Finding[] = [];
  for (const f of walk(root, ['.ts', '.tsx'])) {
    const rel = f.split(path.sep).join('/');
    if (rel.startsWith('src/lib/generated/')) continue;
    const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const why = checkSrcLine(rel, line);
      if (why) out.push({ where: `${rel}:${i + 1}`, text: line.trim().slice(0, 160), why });
    });
  }
  return out;
}

function decode(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/** HTML 1 枚の中の eic-jp.org/contact へのリンク（href と表示の文字） */
export function contactAnchors(html: string): { href: string; text: string }[] {
  const out: { href: string; text: string }[] = [];
  const re = /<a\b[^>]*?\shref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/g;
  for (let m: RegExpExecArray | null; (m = re.exec(html)); ) {
    const href = decode(m[2]);
    if (!RAW_URL.test(href)) continue;
    const text = decode(m[3].replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '')).trim();
    out.push({ href, text });
  }
  return out;
}

export function checkAnchor(a: { href: string; text: string }): string | null {
  if (!/[?&]utm_source=bess-net(?:&|$)/.test(a.href)) return 'href に utm_source=bess-net が無い';
  if (/utm_/.test(a.text)) return '表示の文字に UTM が出ている';
  return null;
}

function checkHtml(dir: string): { findings: Finding[]; pages: number; anchors: number; byCampaign: Map<string, number> } {
  const findings: Finding[] = [];
  const byCampaign = new Map<string, number>();
  let pages = 0;
  let anchors = 0;
  for (const f of walk(dir, ['.html'])) {
    const html = fs.readFileSync(f, 'utf8');
    const list = contactAnchors(html);
    if (list.length === 0) continue;
    pages++;
    for (const a of list) {
      anchors++;
      const why = checkAnchor(a);
      if (why) findings.push({ where: path.relative(dir, f).split(path.sep).join('/'), text: `${a.href}（表示: ${a.text.slice(0, 60)}）`, why });
      const c = /[?&]utm_campaign=([^&]+)/.exec(a.href)?.[1] ?? '（なし）';
      byCampaign.set(c, (byCampaign.get(c) ?? 0) + 1);
    }
  }
  return { findings, pages, anchors, byCampaign };
}

function selfTest(): boolean {
  const srcBad: [string, string][] = [
    ['src/app/x/page.tsx', `        <a href="https://eic-jp.org/contact" target="_blank">相談</a>`],
    ['src/app/x/page.tsx', `                href={siteConfig.organization.contactUrl}`],
    ['src/app/x/page.tsx', `                href={siteConfig.contactUrl}`],
    ['src/data/x.ts', `    heroCtaUrl: 'https://eic-jp.org/contact',`],
    ['src/data/x.ts', `    ctaPrimary: { label: '相談', url: siteConfig.contactUrl },`],
    ['src/app/x/page.tsx', `  const u = 'https://eic-jp.org/contact?utm_source=bess-net&utm_campaign=x';`],
    ['src/app/x/page.tsx', `              href={CONTACT_DISPLAY_URL}`],
    ['src/data/x.ts', `    heroCtaUrl: siteConfig.organization.contactUrl,`],
    ['src/app/projects/page.tsx', `const siteContactUrl = siteConfig.organization.contactUrl;`],
    ['src/app/x/page.tsx', `  const u = CONTACT_DISPLAY_URL + '?x=1';`],
  ];
  const srcGood: [string, string][] = [
    ['src/lib/contact-link.ts', `export const CONTACT_DISPLAY_URL = 'https://eic-jp.org/contact';`],
    ['src/app/x/page.tsx', ` * CTA→eic-jp.org/contact。中立・非媒介`],
    ['src/app/x/page.tsx', `              {CONTACT_DISPLAY_URL}`],
    ['src/app/x/page.tsx', `                href={contactUrl({ campaign: 'about', position: 'body' })}`],
    ['src/app/anken/flow/page.tsx', `['① お問い合わせ', '…窓口は ', 'eic-jp.org/contact', ' です。'],`],
    ['src/lib/site-config.ts', `  contactUrl: CONTACT_DISPLAY_URL,`],
    ['src/app/about/page.tsx', `                  {siteConfig.organization.contactUrl}`],
  ];
  const htmlBad = [
    `<a href="https://eic-jp.org/contact" target="_blank">お問い合わせ</a>`,
    `<a class="x" href="https://eic-jp.org/contact?utm_medium=referral">相談</a>`,
    `<a href="https://eic-jp.org/contact?utm_source=bess-net&amp;utm_medium=referral">https://eic-jp.org/contact?utm_source=bess-net</a>`,
    `<a href="https://www.eic-jp.org/contact/">相談</a>`,
  ];
  const htmlGood = [
    `<a href="https://eic-jp.org/contact?utm_source=bess-net&amp;utm_medium=referral&amp;utm_campaign=about&amp;utm_content=body">https://eic-jp.org/contact</a>`,
    `<a href="https://eic-jp.org/contact?utm_source=bess-net&amp;utm_medium=anken&amp;utm_campaign=anken_top&amp;utm_content=hero">相談<!-- -->する</a>`,
    `<a href="https://eic-jp.org/company">会社概要</a>`,
  ];
  let ok = true;
  for (const [f, l] of srcBad) if (!checkSrcLine(f, l)) { console.log(`${TAG} self-test NG: src の違反を見逃した: ${l.trim()}`); ok = false; }
  for (const [f, l] of srcGood) if (checkSrcLine(f, l)) { console.log(`${TAG} self-test NG: src の正しい行を違反とした: ${l.trim()}`); ok = false; }
  for (const h of htmlBad) {
    const as = contactAnchors(h);
    if (as.length !== 1 || !checkAnchor(as[0])) { console.log(`${TAG} self-test NG: HTML の違反を見逃した: ${h}`); ok = false; }
  }
  for (const h of htmlGood) {
    const as = contactAnchors(h);
    if (as.some((a) => checkAnchor(a))) { console.log(`${TAG} self-test NG: HTML の正しいリンクを違反とした: ${h}`); ok = false; }
  }
  // microCMS の本文に足す関数（src/lib/contact-link.ts の addContactUtmToHtml）: href だけ変わり、表示の文字と UTM 済みの href は変わらない
  const body = `<li>お問い合わせ: <a href="https://eic-jp.org/contact" target="_blank" rel="noopener noreferrer">https://eic-jp.org/contact</a></li><a href="https://eic-jp.org/contact?utm_source=bess-net&amp;utm_campaign=x">既</a><a href='https://eic-jp.org/contact/'>末尾</a><a href="https://eic-jp.org/company">別</a>`;
  const done = addContactUtmToHtml(body, { campaign: 'news_detail', position: 'body' });
  const as = contactAnchors(done);
  const fixedOk = as.length === 3 && as.every((a) => !checkAnchor(a)) && as[0].text === 'https://eic-jp.org/contact' && done.includes('utm_campaign=x"') && done.includes('href="https://eic-jp.org/company"');
  if (!fixedOk) { console.log(`${TAG} self-test NG: addContactUtmToHtml の結果が想定と違う: ${done}`); ok = false; }
  if (addContactUtmToHtml(done, { campaign: 'news_detail', position: 'body' }) !== done) { console.log(`${TAG} self-test NG: addContactUtmToHtml が冪等でない`); ok = false; }
  console.log(`${TAG} self-test ${ok ? 'ok' : 'NG'}（src 違反 ${srcBad.length}・src 正 ${srcGood.length}・HTML 違反 ${htmlBad.length}・HTML 正 ${htmlGood.length}・本文の付け足し 2）`);
  return ok;
}

function main(): void {
  let bad = 0;
  if (SELF_TEST && !selfTest()) bad++;
  const src = checkSrc();
  if (src.length === 0) console.log(`${TAG} ok   src: 生の URL・UTM の無い href 0 件（src/lib/contact-link.ts の外）`);
  else {
    console.log(`${TAG} WARN src: ${src.length} 件`);
    for (const f of src) console.log(`  ${f.where} ${f.why}: ${f.text}`);
    bad += src.length;
  }
  if (HTML_DIR) {
    const r = checkHtml(HTML_DIR);
    const camp = [...r.byCampaign.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join('・');
    if (r.findings.length === 0) console.log(`${TAG} ok   HTML（${HTML_DIR}）: ${r.pages} ページ・リンク ${r.anchors} 本が全部 UTM つき・表示の文字に UTM 0`);
    else {
      console.log(`${TAG} WARN HTML（${HTML_DIR}）: ${r.findings.length} 本（${r.pages} ページ・リンク ${r.anchors} 本のうち）`);
      for (const f of r.findings.slice(0, 50)) console.log(`  ${f.where} ${f.why}: ${f.text}`);
      bad += r.findings.length;
    }
    console.log(`${TAG} campaign 別: ${camp}`);
  }
  if (bad && STRICT) process.exit(1);
}
main();
