#!/usr/bin/env tsx
/**
 * scripts/indexnow-submit.ts — 中身が変わったページを IndexNow（Bing ほか）に知らせる（Bing への即時通知便・2026-10-31）
 *
 * ★既定は dry run（送る URL の件数と先頭 10 件を表示するだけ）。送るのは --apply を明示したときだけ（R32 と同じ考え方）。
 * ★同じ URL を、変わっていないのに何度も送らない（IndexNow の作法）。送るのは中身が変わったページだけ。
 * ★変電所の詳細（/grid/{slug}）は送らない（裁定 2026-10-31）: 約 7,300 件が事前生成でなく、巡回が集中すると microCMS に当たり、429 で 404 になる（鉄則 #2・#4）。
 *   Bing はサイトマップで自分の速さで巡回する。どの選び方でも、この道具は変電所の詳細を外す。変電所のデータ更新の便では IndexNow を使わない。
 *
 * 送る URL の選び方（どれか 1 つ）:
 *   --all                 本番 sitemap.xml の全 URL（変電所の詳細を除く）
 *   --since YYYY-MM-DD    sitemap の lastmod がその日（JST）以降の URL（変電所の詳細を除く）
 *   --urls <ファイル>      1 行 1 URL（https://bess-net.jp/… か /…。空行と # で始まる行は無視）。便で直したページの一覧
 *
 * ★--since の限界（reports/indexnow-2026-10-31.md (1)）: sitemap の lastmod は「中身が変わった日」とは限らない。
 *   - 固定ページ・ハブ・links など: sitemap を作った時刻（毎回変わる）→ 毎日全部を送ることになるので、--since では外す
 *   - news・解説・用語・補助金・案件・事業者: microCMS の updatedAt。コードだけの変更は反映されない
 *
 * 応答: 200／202 は受理。それ以外（400／403／422／429 など）はコードと本文を表示して止める。
 * 鍵: public/{32 桁の 16 進}.txt（中身は鍵だけ）。公開してよい値だが、ログには先頭 4 文字だけ出す。送る前に本番の鍵のファイルを確かめる。
 *
 * 実行: npx tsx scripts/indexnow-submit.ts --all [--apply] [--log=<path>]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const SITE = 'https://bess-net.jp';
const HOST = 'bess-net.jp';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10000; // IndexNow の 1 回の上限

const argv = process.argv.slice(2);
const flagValue = (name: string): string | undefined => {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const APPLY = argv.includes('--apply');
const ALL = argv.includes('--all');
const SINCE = flagValue('since');
const URLS_FILE = flagValue('urls');
const LOG_PATH = flagValue('log');

/** 止めるときは例外で main の外へ抜ける（fetch の後の process.exit は Windows の Node で UV_HANDLE_CLOSING の異常終了になる） */
class Stop extends Error {}
function stop(message: string): never {
  throw new Stop(message);
}

function readKey(): string {
  const dir = path.join(process.cwd(), 'public');
  const files = fs.readdirSync(dir).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (files.length !== 1) stop(`public/ の鍵のファイルが ${files.length} 本（1 本のはず）`);
  const key = files[0].replace(/\.txt$/, '');
  if (fs.readFileSync(path.join(dir, files[0]), 'utf8').trim() !== key) stop('鍵のファイルの中身がファイル名と違う');
  return key;
}

const decodeXml = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

async function readSitemap(): Promise<{ url: string; lastmod: string | null }[]> {
  const r = await fetch(`${SITE}/sitemap.xml`);
  if (!r.ok) stop(`sitemap.xml の取得が HTTP ${r.status}`);
  const xml = await r.text();
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    url: decodeXml(/<loc>([\s\S]*?)<\/loc>/.exec(body)?.[1]?.trim() ?? ''),
    lastmod: /<lastmod>([\s\S]*?)<\/lastmod>/.exec(body)?.[1]?.trim() ?? null,
  }));
}

/** URL を送る形にそろえる（非 ASCII は符号化・符号化済みの % は二重にしない）。別のホストは止める */
function normalize(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw.startsWith('/') ? `${SITE}${raw}` : raw);
  } catch {
    stop(`URL として読めない: ${raw}`);
  }
  if (u.host !== HOST) stop(`別のホストの URL: ${raw}`);
  return u.href;
}

/** /grid/ 直下で変電所の詳細でないページ（エリア・検索・県の一覧） */
const GRID_NOT_DETAIL = new Set(['tohoku', 'hokuriku', 'shikoku', 'kansai', 'chugoku', 'okinawa', 'hokkaido', 'chubu', 'kyushu', 'tokyo', 'search', 'prefecture']);
function isSubstationDetail(url: string): boolean {
  const m = /^\/grid\/([^/]+)\/?$/.exec(new URL(url).pathname);
  return !!m && !GRID_NOT_DETAIL.has(m[1]);
}

async function selectUrls(): Promise<string[]> {
  if ([ALL, SINCE !== undefined, URLS_FILE !== undefined].filter(Boolean).length !== 1) {
    stop('--all・--since YYYY-MM-DD・--urls <ファイル> のどれか 1 つを指定する');
  }
  if (URLS_FILE !== undefined) {
    return fs.readFileSync(URLS_FILE, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  }
  const rows = await readSitemap();
  if (rows.length === 0) stop('sitemap.xml に URL が無い');
  if (ALL) return rows.map((r) => r.url);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(SINCE!)) stop(`--since は YYYY-MM-DD: ${SINCE}`);
  const from = new Date(`${SINCE}T00:00:00+09:00`).getTime();
  // sitemap を作った時刻＝lastmod の最大値（固定ページ・ハブなどに同じ値が入る）。中身の日ではないので外す
  const stamps = rows.map((r) => r.lastmod).filter((l): l is string => !!l);
  const newest = stamps.reduce((a, b) => (new Date(b).getTime() > new Date(a).getTime() ? b : a));
  const generated = stamps.filter((l) => l === newest).length >= 2 ? newest : null;
  const dated = rows.filter((r) => r.lastmod !== null && r.lastmod !== generated);
  console.log(`--since ${SINCE}: lastmod が sitemap を作った時刻・空の ${rows.length - dated.length} 件は外す（中身の日ではない）`);
  return dated.filter((r) => new Date(r.lastmod!).getTime() >= from).map((r) => r.url);
}

async function main(): Promise<void> {
  const key = readKey();
  const keyLocation = `${SITE}/${key}.txt`;
  const selected = [...new Set((await selectUrls()).map(normalize))];
  const urls = selected.filter((u) => !isSubstationDetail(u));
  console.log(`[indexnow] mode=${APPLY ? '本実行' : 'DRY-RUN'}・送る URL ${urls.length.toLocaleString()} 件（変電所の詳細 ${(selected.length - urls.length).toLocaleString()} 件を外した）・鍵 ${key.slice(0, 4)}…`);
  urls.slice(0, 10).forEach((u) => console.log(`  ${u}`));
  if (urls.length > 10) console.log(`  …ほか ${(urls.length - 10).toLocaleString()} 件`);

  const kr = await fetch(keyLocation);
  const keyOk = kr.status === 200 && (await kr.text()).trim() === key;
  console.log(`本番の鍵のファイル: HTTP ${kr.status}・中身 ${keyOk ? '一致' : '不一致'}`);

  if (!APPLY) { console.log('dry run なので送っていない（送るのは --apply）'); return; }
  if (!keyOk) stop('本番の鍵のファイルを確かめられないので送らない（push とデプロイの後に流す）');
  if (urls.length === 0) { console.log('送る URL が無い'); return; }

  const log: Record<string, unknown>[] = [];
  const writeLog = () => { if (LOG_PATH) fs.writeFileSync(LOG_PATH, JSON.stringify({ count: urls.length, batches: log }, null, 1)); };
  for (let i = 0; i < urls.length; i += BATCH) {
    const urlList = urls.slice(i, i + BATCH);
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
    });
    const body = (await r.text()).slice(0, 300);
    const accepted = r.status === 200 || r.status === 202;
    console.log(`  ${i + 1}〜${i + urlList.length} 件目: HTTP ${r.status}${accepted ? '（受理）' : ''}${body ? ` ${body}` : ''}`);
    log.push({ at: new Date().toISOString(), from: i + 1, to: i + urlList.length, status: r.status, body });
    writeLog();
    if (!accepted) stop(`HTTP ${r.status} なので、ここで止めた（${i + urlList.length < urls.length ? '残りは送っていない' : '最後の回'}）`);
    if (i + BATCH < urls.length) await new Promise((res) => setTimeout(res, 2000));
  }
}

main().catch((e) => {
  console.error(e instanceof Stop ? `[止めた] ${e.message}` : e);
  process.exitCode = 1;
});
