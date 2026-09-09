/**
 * scripts/patch-projects-pj2g3-2026-09-09.ts — Pj2-G 追修便 裁定返し（ユウ裁定 2026-09-09）
 *
 * reports/projects-pj2g2-2026-09-08.md の要裁定3件への回答を反映する。
 *   1. kyuden-omuta-reuse  body §2「EV由来電池」→「リユース電池」（当該1文のみ・#122 marker 方式）
 *   2. pr-co140317-bess    outputMw 0 → null（一次に出力の記載が皆無＝未記載であって公表値でない）
 *                          cod 2025-10-14 → null（PR034 の配信日時 2025-10-14 17:59 の混入。本文に運開の記載なし）
 *   3. pr-co69153-ibaraki-3 capacityMwh 4.887 → 4.8876（一次逐語「4887.6kWh」の kWh→MWh 換算・精度損失なし）
 *
 * ★大原則（Pj2-G ■0）: 各行は PATCH 直前に一次を再取得して逐語を取り直し、食い違えば書かずに報告する。
 *   本スクリプトはその再取得を行内（PRIMARY）に組み込み、失敗した行は PRIMARY_MISMATCH に退避する。
 * ★書込は指定 field のみ（POST/DELETE/PUT なし）。PATCH 後は GET 全 field 照合（#106）。
 * ★null 送信は microCMS がキーごと落とすことがある（pr-co149815 で実証）ため、照合では undefined ≡ null と扱う。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-projects-pj2g3-2026-09-09.ts [--dry-run]
 */
import { execFileSync } from 'node:child_process';
export {};
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

type Row = {
  slug: string;
  patch: Record<string, unknown>;
  why: string;
  /** richEditor の冪等キー（#122）。__replaceBody の完了条件＝ marker あり かつ from なし */
  marker?: { field: string; text: string };
  /** 一次再取得。null = 逐語一致、string = 食い違いの理由（この行は書かない） */
  primary: () => Promise<string | null>;
};

// ── 一次再取得ユーティリティ（読取のみ・Chrome UA）
// kyuden.co.jp は Node fetch の既定ヘッダだと 403 を返す（curl -A では 200）。fetch 失敗時は curl にフォールバック。
async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'ja,en;q=0.8' } });
  if (r.ok) return r.text();
  const out = execFileSync('curl', ['-s', '-A', UA, '-w', '\n%{http_code}', url], { maxBuffer: 16 * 1024 * 1024 }).toString('utf-8');
  const nl = out.lastIndexOf('\n');
  const code = out.slice(nl + 1).trim();
  if (code !== '200') throw new Error(`GET ${url} → HTTP ${r.status}（fetch）/ ${code}（curl）`);
  console.log(`   （fetch HTTP ${r.status} → curl で 200 取得）`);
  return out.slice(0, nl);
}
function unescapeHtml(s: string): string {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function stripHtml(s: string): string {
  return unescapeHtml(s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ''));
}
const count = (s: string, w: string) => s.split(w).length - 1;
/** PR TIMES の本文は __NEXT_DATA__ 内 pressRelease.text（HTML）。500字超の最初の text を本文とみなす */
function prTimesBody(html: string): string {
  const m = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) return '';
  const walk = (o: unknown): string | null => {
    if (Array.isArray(o)) { for (const v of o) { const r = walk(v); if (r) return r; } return null; }
    if (o && typeof o === 'object') {
      const rec = o as Record<string, unknown>;
      if (typeof rec.text === 'string' && rec.text.length > 500) return rec.text;
      for (const v of Object.values(rec)) { const r = walk(v); if (r) return r; }
    }
    return null;
  };
  return stripHtml(walk(JSON.parse(m[1])) ?? '');
}
const prTimesDatePublished = (html: string) => /"datePublished"\s*:\s*"([^"]*)"/.exec(html)?.[1] ?? '';

const PR034 = 'https://prtimes.jp/main/html/rd/p/000000034.000140317.html';
const PR004 = 'https://prtimes.jp/main/html/rd/p/000000004.000069153.html';
const PR006 = 'https://prtimes.jp/main/html/rd/p/000000006.000069153.html';
const KYUDEN = 'https://www.kyuden.co.jp/press/2022/h220805-1.html';
const IBARAKI_VERBATIM = 'システム構成は1927.2kW出力の4887.6kWh（2時間システム）となっており';
const WAKAYAMA_VERBATIM = '和歌山県和歌山市松江に設備容量約8.2MWhの系統用蓄電所を建設・運営する事業を計画しています';

const PRIMARY = {
  kyuden: async (): Promise<string | null> => {
    const t = stripHtml(await fetchText(KYUDEN));
    const ev = count(t, 'EV'), car = count(t, '電気自動車'), fl = count(t, '電動フォークリフト');
    console.log(`   一次再取得 ${KYUDEN}: EV=${ev} 電気自動車=${car} 電動フォークリフト=${fl}（期待 0/0/≥1）`);
    return ev === 0 && car === 0 && fl >= 1 ? null : `一次に EV=${ev} 電気自動車=${car} 電動フォークリフト=${fl}`;
  },
  pr034: async (): Promise<string | null> => {
    const h = await fetchText(PR034);
    const dp = prTimesDatePublished(h);
    const b = prTimesBody(h);
    const hits = ['運転開始', '稼働', '竣工', '運用開始', '営業運転', '出力', 'kW'].map((w) => `${w}=${count(b, w)}`);
    const verb = b.includes(WAKAYAMA_VERBATIM);
    console.log(`   一次再取得 ${PR034}: datePublished=${dp} / ${hits.join(' ')} / 逐語「…約8.2MWh…計画しています」=${verb}`);
    const bad: string[] = [];
    if (!dp.startsWith('2025-10-14')) bad.push(`datePublished=${dp}`);
    for (const w of ['運転開始', '稼働', '竣工', '運用開始', '営業運転', '出力', 'kW']) if (count(b, w) !== 0) bad.push(`${w}=${count(b, w)}`);
    if (!verb) bad.push('8.2MWh 逐語なし');
    return bad.length ? bad.join(' / ') : null;
  },
  ibaraki: async (): Promise<string | null> => {
    const bad: string[] = [];
    for (const u of [PR004, PR006]) {
      const b = prTimesBody(await fetchText(u));
      const ok = b.includes(IBARAKI_VERBATIM);
      console.log(`   一次再取得 ${u}: 逐語「${IBARAKI_VERBATIM}」=${ok}`);
      if (!ok) bad.push(`${u} 逐語なし`);
    }
    return bad.length ? bad.join(' / ') : null;
  },
};

const OMUTA_FROM = 'EV由来電池';
const OMUTA_TO = 'リユース電池';
/** 置換後の当該文に固有の語句（§3 の既存「リユース電池ならではの」とは衝突しない） */
const OMUTA_MARK = 'リユース電池の系統用二次利用';

const ROWS: Row[] = [
  { slug: 'kyuden-omuta-reuse', patch: { __replaceBody: [OMUTA_FROM, OMUTA_TO] }, marker: { field: 'body', text: OMUTA_MARK },
    primary: PRIMARY.kyuden,
    why: '一次（九州電力 2022-08-05 プレス＋別紙）に「EV」「電気自動車」は0件、電池は「電動フォークリフトで使用した蓄電池を再利用」。'
       + '§2「EV由来電池の系統用二次利用は…」は大牟田を EV 由来と述べており §1（電動フォークリフト）と矛盾。4文字・当該1文のみの最小差分で是正（ユウ裁定 2026-09-09）' },
  { slug: 'pr-co140317-bess', patch: { outputMw: null, cod: null }, primary: PRIMARY.pr034,
    why: 'outputMw: 一次 PR034 に出力の記載が皆無（「出力」「kW」とも0件）。0 は「0MW と公表された」ではなく「未記載」→ null。'
       + 'cod: PR034 の datePublished が 2025-10-14 17:59 で本文に運転開始・稼働・竣工の記載なし＝配信日の混入 → null。status「計画中」は一次と整合するため触らない（ユウ裁定 2026-09-09）' },
  { slug: 'pr-co69153-ibaraki-3', patch: { capacityMwh: 4.8876 }, primary: PRIMARY.ibaraki,
    why: '一次逐語「1927.2kW出力の4887.6kWh」（PR000000004／000000006 とも）。換算元 4,887.6kWh → 4.8876MWh（kWh→MWh は精度損失なし）。'
       + '現値 4.887 は切り捨て。outputMw 1.927 は 1927.2kW の丸めだが本便の対象外（ユウ裁定 2026-09-09）' },
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
async function bySlug(slug: string): Promise<Record<string, unknown> | null> {
  const d = await api<{ contents: Array<Record<string, unknown>> }>('GET', `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`);
  return d.contents[0] ?? null;
}
/** undefined（キー欠落）と null を同値として比較する（null 送信でキーが落ちる仕様に対応） */
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);

let done = 0, skipped = 0, failed = 0;
const PRIMARY_MISMATCH: Array<{ slug: string; reason: string }> = [];

/** 裁定返し 1 の付帯報告: body 全体で「EV」「電気自動車」が残っていないか（触らず報告のみ） */
function reportResidualEv(slug: string, body: string): void {
  const hits = [...body.matchAll(/.{0,50}(EV|電気自動車).{0,50}/g)].map((m) => m[0]);
  console.log(`   残存スキャン（${slug} body 全文 ${body.length}字）: EV=${count(body, 'EV')} 電気自動車=${count(body, '電気自動車')} リユース電池=${count(body, 'リユース電池')}`);
  for (const h of hits) console.log(`      > ${h}`);
}

async function runRow(row: Row): Promise<void> {
  const before = await bySlug(row.slug);
  if (!before) { console.log(`\n■ ${row.slug}: ★NG 不在`); failed++; return; }
  console.log(`\n■ ${row.slug} (id=${before.id})`);

  // 大原則: 実行直前に一次を再取得（取得失敗も「逐語を取り直せていない」ので書かない）
  let mismatch: string | null;
  try { mismatch = await row.primary(); } catch (e) { mismatch = `一次取得失敗: ${(e as Error).message}`; }
  if (mismatch) {
    console.log(`   [SKIP] 一次再取得で食い違い → 書かない: ${mismatch}`);
    PRIMARY_MISMATCH.push({ slug: row.slug, reason: mismatch });
    return;
  }

  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row.patch)) {
    if (k === '__replaceBody') {
      const [from, to] = v as [string, string];
      const cur = String(before.body ?? '');
      const hasMark = row.marker ? cur.includes(row.marker.text) : false;
      const n = count(cur, from);
      if (hasMark && n === 0) { console.log(`   [skip] body: marker「${row.marker!.text}」あり・置換元なし（冪等）`); continue; }
      if (hasMark && n > 0) { console.log(`   [停止] body: marker あり かつ 置換元 ${n} 箇所 → 状態不明のため書込まず`); failed++; return; }
      if (n !== 1) { console.log(`   [停止] body: 置換元「${from}」が ${n} 箇所（一意でない）→ 書込まず`); failed++; return; }
      payload.body = cur.replace(from, to);
      const sentence = /[^。]*EV由来電池[^。]*。/.exec(cur)?.[0] ?? '';
      console.log(`   body: 1箇所置換「${from}」→「${to}」（${cur.length}→${String(payload.body).length}字）`);
      console.log(`      before: ${sentence}`);
      console.log(`      after : ${sentence.replace(from, to)}`);
    } else if (norm(before[k]) !== norm(v)) {
      payload[k] = v;
      console.log(`   ${k}: ${norm(before[k])} → ${norm(v)}${k in before ? '' : '（現在キー欠落）'}`);
    } else {
      console.log(`   ${k}: ${norm(v)} [同値]`);
    }
  }
  if (Object.keys(payload).length === 0) {
    console.log('   [skip] 変更なし（冪等）'); skipped++;
    if (row.slug === 'kyuden-omuta-reuse') reportResidualEv(row.slug, String(before.body ?? ''));
    return;
  }
  console.log(`   根拠: ${row.why}`);
  if (DRY_RUN) {
    console.log(`   [dry-run] ${Object.keys(payload).join(',')} を送信予定`); done++;
    if (payload.body) reportResidualEv(row.slug, String(payload.body));
    return;
  }

  await api('PATCH', `${BASE}/${before.id}`, payload);
  await new Promise((r) => setTimeout(r, 700));
  const after = await bySlug(row.slug);
  let bad = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {}), ...Object.keys(payload)])) {
    if (SYS.has(k)) continue;
    if (k in payload) {
      if (k === 'body') {
        // richEditor は保存時に正規化されるため送信値との全文一致で判定しない（#122）
        const ab = String(after?.body ?? '');
        const ok = ab.includes(row.marker!.text) && !ab.includes(OMUTA_FROM);
        if (!ok) { bad++; console.log('   ✗ body: marker なし or 置換元が残存'); }
        else console.log(`   ✓ body: marker「${row.marker!.text}」あり・「${OMUTA_FROM}」なし（送信値と全文一致=${ab === payload.body}／false でも失敗としない）`);
      } else if (norm(after?.[k]) !== norm(payload[k])) {
        bad++; console.log(`   ✗ ${k}: 保存=${norm(after?.[k])}`);
      } else {
        console.log(`   ✓ ${k}: ${norm(after?.[k])}${payload[k] === null && !(k in (after ?? {})) ? '（キーごと消滅＝null 保存）' : ''}`);
      }
    } else if (norm(after?.[k]) !== norm(before[k])) {
      bad++; console.log(`   ✗ ${k}: 意図しない変化 ${norm(before[k])} → ${norm(after?.[k])}`);
    }
  }
  console.log(`   #106: ${bad === 0 ? `✓ 送信 ${Object.keys(payload).length} field 一致・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  if (bad === 0) done++; else failed++;
  if (payload.body) reportResidualEv(row.slug, String(after?.body ?? ''));
  await new Promise((r) => setTimeout(r, 300));
}

async function main(): Promise<void> {
  console.log(`[Pj2-G 裁定返し] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  for (const row of ROWS) await runRow(row);
  if (PRIMARY_MISMATCH.length) {
    console.log('\n════════ 一次再取得で食い違い（書かなかった行） ════════');
    for (const s of PRIMARY_MISMATCH) console.log(`  ・${s.slug}: ${s.reason}`);
  }
  console.log(`\n[Pj2-G 裁定返し] 実行 ${done} / 冪等スキップ ${skipped} / 失敗 ${failed} / 一次不一致 ${PRIMARY_MISMATCH.length}`);
  if (failed || PRIMARY_MISMATCH.length) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
