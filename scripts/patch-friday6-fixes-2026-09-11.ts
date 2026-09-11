#!/usr/bin/env tsx
/**
 * scripts/patch-friday6-fixes-2026-09-11.ts — 金曜ワンセット#6 ⑦ 積み残し小修正（承認済み 9/5・9/9 裁定）
 *
 *   (a) glossary  capacity-contribution  shortDef のみ（detail・他 field 不変）
 *   (b) policy-events capacity-main-auction-2026-09  sourceUrl（現 URL が同等以上に直接的なら見送り）
 *   (d) projects  pr-co69153-ibaraki-3  outputMw 1.927 → 1.9272（一次 1927.2kW）
 *   ※ (c) は調査提案のみ・(e) はコード変更のみ（本スクリプトの対象外）
 *
 * ★大原則: 各行は PATCH 直前に一次を再取得し、逐語と「何の数字・何の日付か」が合うときだけ書く。
 *   現在値が承認時の値と違う行は書かない（誰かが先に直した可能性）。#106: PATCH 後 GET 全 field 照合。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-friday6-fixes-2026-09-11.ts [--dry-run]
 */
import { execFileSync } from 'node:child_process';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

type Rec = Record<string, unknown> & { id: string; slug: string };
const ep = (e: string) => `https://${DOMAIN}.microcms.io/api/v1/${e}`;
async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const bySlug = async (e: string, slug: string): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${ep(e)}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 一次取得（Chrome UA・失敗時 curl フォールバック）→ タグを除いた本文テキスト */
async function primaryText(url: string): Promise<string> {
  let html = '';
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8', 'Accept-Language': 'ja,en;q=0.8' } }).catch(() => null);
  if (r && r.ok) html = await r.text();
  else {
    const out = execFileSync('curl', ['-sL', '-A', UA, '-w', '\n%{http_code}', url], { maxBuffer: 16 * 1024 * 1024 }).toString('utf-8');
    const nl = out.lastIndexOf('\n');
    if (out.slice(nl + 1).trim() !== '200') throw new Error(`GET ${url} → ${r?.status ?? 'fetch失敗'} / curl ${out.slice(nl + 1).trim()}`);
    html = out.slice(0, nl);
  }
  const nd = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  const src = nd ? nd[1].replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\n/g, ' ') : html;
  return src.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
}
const has = (t: string, w: string) => t.replace(/\s+/g, '').includes(w.replace(/\s+/g, ''));

type Row = {
  label: string; endpoint: string; slug: string; field: string;
  expect: unknown; value: unknown;
  /** 一次照合。null=一致（書いてよい）、文字列=食い違い理由（書かない） */
  primary: () => Promise<string | null>;
  why: string;
};

// (a) OCCTO 容量拠出金の一次 URL は照合エージェントの結果で確定（下の CAPACITY_CONTRIBUTION_URL）
// OCCTO「かいせつ容量市場スペシャルサイト」の「容量拠出金とは」（定義と負担者3者を1文で述べる。定款 第55条の2 とも一致）
const CAPACITY_CONTRIBUTION_URL = 'https://www.occto.or.jp/capacity-market/kouri/about/';
const ROWS: Row[] = [
  {
    label: '(a) glossary capacity-contribution shortDef', endpoint: 'glossary', slug: 'capacity-contribution', field: 'shortDef',
    expect: '容量市場の費用を負担する小売電気事業者からの拠出金制度。',
    value: '容量市場の費用を賄う拠出金制度。小売電気事業者・一般送配電事業者・配電事業者が負担する',
    primary: async () => {
      const t = await primaryText(CAPACITY_CONTRIBUTION_URL);
      const need = ['容量拠出金', '小売電気事業者', '一般送配電事業者', '配電事業者'];
      const miss = need.filter((w) => !has(t, w));
      console.log(`   一次 ${CAPACITY_CONTRIBUTION_URL}: ${need.map((w) => `${w}=${has(t, w) ? '✓' : '✗'}`).join(' ')}`);
      return miss.length ? `一次に ${miss.join('・')} が無い` : null;
    },
    why: 'OCCTO の容量拠出金ページが負担者を小売電気事業者・一般送配電事業者・配電事業者と明記。現 shortDef は小売のみで、detail（三者併記）と食い違っていた',
  },
  {
    label: '(b) policy-events capacity-main-auction-2026-09 sourceUrl', endpoint: 'policy-events', slug: 'capacity-main-auction-2026-09', field: 'sourceUrl',
    expect: 'https://www.occto.or.jp/market-board/market/jitsujukyu/',
    value: 'https://www.occto.or.jp/news/012742.html',
    primary: async () => {
      const cand = await primaryText('https://www.occto.or.jp/news/012742.html');
      // 現 URL は 2026-09-11 実測で HTTP 404（取得できない＝応札期間を述べていない＝同等以上に直接的ではない）
      let cur = '', curNote = '';
      try { cur = await primaryText('https://www.occto.or.jp/market-board/market/jitsujukyu/'); } catch (e) { curNote = `取得不可（${(e as Error).message.slice(0, 80)}）`; }
      const k = ['10月13日', '10月23日'];
      const c1 = k.every((w) => has(cand, w)), c0 = cur !== '' && k.every((w) => has(cur, w));
      console.log(`   候補 012742.html: 応札期間「10月13日」「10月23日」=${c1 ? '✓' : '✗'} ／ 現 URL: ${c0 ? '✓（同等に直接的）' : curNote || '✗（期間の記載なし）'}`);
      if (!c1) return '候補 URL に応札期間の記載が無い';
      if (c0) return '現 URL も応札期間を直接述べている＝同等以上に直接的なので見送り';
      return null;
    },
    why: '012742.html（2026-07-30 OCCTO 告知）が「2026年10月13日（火）〜2026年10月23日（金） 応札の受付期間」を直接述べる。現 URL は 2026-09-11 実測で HTTP 404（本文を取得できない）',
  },
  {
    label: '(d) projects pr-co69153-ibaraki-3 outputMw', endpoint: 'projects', slug: 'pr-co69153-ibaraki-3', field: 'outputMw',
    expect: 1.927, value: 1.9272,
    primary: async () => {
      const bad: string[] = [];
      for (const u of ['https://prtimes.jp/main/html/rd/p/000000004.000069153.html', 'https://prtimes.jp/main/html/rd/p/000000006.000069153.html']) {
        const t = await primaryText(u);
        const ok = has(t, '1927.2kW出力の4887.6kWh');
        console.log(`   一次 ${u}: 逐語「1927.2kW出力の4887.6kWh」=${ok ? '✓' : '✗'}`);
        if (!ok) bad.push(u);
      }
      return bad.length ? `逐語なし: ${bad.join(', ')}` : null;
    },
    why: '一次逐語「システム構成は1927.2kW出力の4887.6kWh（2時間システム）」（PR000000004／000000006）。換算元 1,927.2kW → 1.9272MW（精度損失なし）。capacityMwh 4.8876 は 9/9 便で是正済み',
  },
];

let done = 0, skipped = 0, failed = 0;
const held: string[] = [];

async function runRow(row: Row): Promise<void> {
  console.log(`\n■ ${row.label}`);
  const b = await bySlug(row.endpoint, row.slug);
  if (!b) { console.log('   ★NG 不在'); failed++; return; }
  const cur = b[row.field];
  console.log(`   現在: ${JSON.stringify(cur)}`);
  if (JSON.stringify(cur) === JSON.stringify(row.value)) { console.log('   [skip] 既に反映済み（冪等）'); skipped++; return; }
  if (JSON.stringify(cur) !== JSON.stringify(row.expect)) { console.log(`   [見送り] 現在値が承認時（${JSON.stringify(row.expect)}）と違う → 書かない`); held.push(`${row.label}: 現在値不一致`); skipped++; return; }
  let mismatch: string | null;
  try { mismatch = await row.primary(); } catch (e) { mismatch = `一次取得失敗: ${(e as Error).message}`; }
  if (mismatch) { console.log(`   [見送り] ${mismatch}`); held.push(`${row.label}: ${mismatch}`); skipped++; return; }
  console.log(`   [PATCH] ${row.field}: ${JSON.stringify(cur)} → ${JSON.stringify(row.value)}\n   根拠: ${row.why}`);
  if (DRY) { done++; return; }
  await api('PATCH', `${ep(row.endpoint)}/${b.id}`, { [row.field]: row.value });
  await sleep(900);
  const a = await bySlug(row.endpoint, row.slug);
  let bad = 0;
  for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {})])) {
    if (SYS.has(k)) continue;
    const want = k === row.field ? row.value : b[k];
    if (JSON.stringify(a?.[k]) !== JSON.stringify(want)) { bad++; console.log(`   ✗ ${k}: 期待=${JSON.stringify(want)} 保存=${JSON.stringify(a?.[k])}`); }
  }
  console.log(`   #106: ${bad === 0 ? `✓ ${row.field} 反映・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  if (bad === 0) done++; else failed++;
  await sleep(300);
}

async function main(): Promise<void> {
  console.log(`[friday6 ⑦] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  if (CAPACITY_CONTRIBUTION_URL.startsWith('@@')) { console.error('CAPACITY_CONTRIBUTION_URL 未設定'); process.exit(1); }
  for (const row of ROWS) await runRow(row);
  console.log(`\n[done] 実行 ${done} / スキップ・見送り ${skipped} / 失敗 ${failed}`);
  held.forEach((h) => console.log('  - ' + h));
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
