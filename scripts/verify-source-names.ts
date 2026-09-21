#!/usr/bin/env tsx
/**
 * scripts/verify-source-names.ts — 出典に書いた資料名が台帳に登録されているかの検査（警告のみ・Ck-1 A6・2026-09-21）
 *
 * ★目的（Lc-3 ■1(e) の設計）
 *   資料名の「実在」を機械で常時検証することはしない（発行元が改称する・URL が無い資料が多い・
 *   meti.go.jp 等は bot 判定で取れない＝誤検知の山になる）。
 *   代わりに「書くときに 1 回だけ一次の <title> を実機で取り、台帳に確認日つきで登録する」運用にし、
 *   この検査は**台帳に無い資料名（＝登録漏れ）を警告する**だけにする。機械的に判定でき、誤検知しない。
 *
 * ★台帳: src/data/source-documents.json
 *   documents[]: { name, publisher, url, title_verbatim, checked_on, aliases? }
 *   name は**サイトに書いている資料名**（「」の中身）。title_verbatim は確認した一次の <title>/PDF 表題の逐語。
 *   name と title_verbatim が違ってよい（短縮して書いている等）。違う書き方を複数使うなら aliases に足す。
 *
 * ★検査対象（Lc-3 の抽出と同じ考え方。「」の全部ではなく、出典として書かれた箇所だけ）
 *   src      : <section className="article-sources"> 内の 「」／ 出典・出所 の語と同じ行の 〈発行元〉「」
 *   microCMS : explainer.sources（欄全体が出典）／ glossary.detail・faq.answer・policy-events.description の
 *              〈発行元〉「」で前後 120 字に 出典・出所・参照・公表 の語があるもの
 *   ★microCMS は MICROCMS_SERVICE_DOMAIN・MICROCMS_API_KEY があるときだけ読む（GET のみ・約 25 リクエスト）。
 *     prebuild には入れない（毎ビルドで microCMS を全件読む負荷を足さない＝鉄則 #2）。書く前に手で回す。
 *
 * 実行: npm run verify:source-names            （src のみ。env があれば microCMS も）
 *       set -a && . ./.env.local && set +a && npm run verify:source-names
 *       … --strict を付けると未登録があれば exit 1
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const EIC_DIR = path.join(SRC, 'data', 'eic');
const LEDGER = path.join(SRC, 'data', 'source-documents.json');
const STRICT = process.argv.includes('--strict');

type Doc = { name: string; publisher: string; url: string; title_verbatim: string; checked_on: string; aliases?: string[] };
type Hit = { name: string; publisher: string; location: string };

// ─── 台帳 ───
const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8')) as { documents: Doc[] };
/** 照合用の正規化: 全角/半角の揺れ・空白だけを吸収する（表記ゆれ自体は吸収しない＝別名は aliases に明示） */
const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, '').trim();
const known = new Set<string>();
const ledgerProblems: string[] = [];
for (const d of ledger.documents) {
  for (const k of ['name', 'publisher', 'url', 'title_verbatim', 'checked_on'] as const) {
    if (!d[k] || !String(d[k]).trim()) ledgerProblems.push(`「${d.name ?? '?'}」の ${k} が空`);
  }
  if (d.checked_on && !/^\d{4}-\d{2}-\d{2}$/.test(d.checked_on)) ledgerProblems.push(`「${d.name}」の checked_on が YYYY-MM-DD でない`);
  if (d.url && !/^https?:\/\//.test(d.url)) ledgerProblems.push(`「${d.name}」の url が http(s) でない`);
  known.add(norm(d.name));
  for (const a of d.aliases ?? []) known.add(norm(a));
}

// ─── 抽出 ───
const BRACKET = /[「『]([^「」『』\n]{2,90})[」』]/g;
const PUBLISHER_BEFORE = /([一-龥ァ-ヶA-Za-zＡ-Ｚａ-ｚ0-9０-９ー・（）()&＆\s]{2,40})$/;
const CUE_SRC = /(出典|出所|データ提供)/;
const CUE_CMS = /(出典|出所|参照|参考|公表|より作成|をもとに|根拠)/;

function publisherBefore(text: string, pos: number): string {
  const line = text.slice(Math.max(0, pos - 60), pos).split('\n').pop() ?? '';
  const m = line.match(PUBLISHER_BEFORE);
  return m ? m[1].replace(/^[\s>{}=,:;；]+|[\s>{}=,:;；]+$/g, '') : '';
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p === EIC_DIR || p.includes(`${path.sep}generated`)) continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const hits: Hit[] = [];

// src
for (const f of walk(SRC)) {
  const text = fs.readFileSync(f, 'utf8')
    // コメントは数えない（JSX の {/* */} を含む）
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, '');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const lineOf = (pos: number) => text.slice(0, pos).split('\n').length;
  // (a) article-sources ブロック
  for (const sm of text.matchAll(/<section className="article-sources"[\s\S]*?<\/section>/g)) {
    for (const bm of sm[0].matchAll(BRACKET)) {
      const pos = (sm.index ?? 0) + (bm.index ?? 0);
      hits.push({ name: bm[1].trim(), publisher: publisherBefore(text, pos), location: `${rel}:${lineOf(pos)}` });
    }
  }
  // (b) 出典・出所 の語と同じ行の 〈発行元〉「」
  const lines = text.split('\n');
  lines.forEach((ln, i) => {
    if (!CUE_SRC.test(ln)) return;
    for (const bm of ln.matchAll(BRACKET)) {
      const pub = publisherBefore(ln, bm.index ?? 0);
      if (!pub) continue;
      hits.push({ name: bm[1].trim(), publisher: pub, location: `${rel}:${i + 1}` });
    }
  });
}

// microCMS（env があるときだけ・GET のみ）
async function cmsHits(): Promise<Hit[] | null> {
  const domain = process.env.MICROCMS_SERVICE_DOMAIN;
  const key = process.env.MICROCMS_API_KEY;
  if (!domain || !key) return null;
  const out: Hit[] = [];
  const TARGETS: { ep: string; fields: string[]; wholeFieldIsCitation?: string[] }[] = [
    { ep: 'explainer', fields: ['sources'], wholeFieldIsCitation: ['sources'] },
    { ep: 'glossary', fields: ['detail'] },
    { ep: 'faq', fields: ['answer'] },
    { ep: 'policy-events', fields: ['description'] },
  ];
  for (const t of TARGETS) {
    for (let offset = 0; offset < 5000; offset += 100) {
      const url = `https://${domain}.microcms.io/api/v1/${t.ep}?limit=100&offset=${offset}&fields=slug,${t.fields.join(',')}`;
      const r = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': key } });
      if (!r.ok) throw new Error(`GET ${t.ep} → HTTP ${r.status}`);
      const d = (await r.json()) as { contents: Record<string, string>[] };
      for (const it of d.contents) {
        for (const fld of t.fields) {
          const raw = it[fld];
          if (typeof raw !== 'string' || !raw.trim()) continue;
          const plain = raw.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
          const whole = t.wholeFieldIsCitation?.includes(fld);
          for (const bm of plain.matchAll(BRACKET)) {
            const pos = bm.index ?? 0;
            const pub = publisherBefore(plain, pos);
            if (!whole) {
              if (!pub) continue;
              const ctx = plain.slice(Math.max(0, pos - 120), pos + bm[0].length + 120);
              if (!CUE_CMS.test(ctx)) continue;
            }
            out.push({ name: bm[1].trim(), publisher: pub, location: `${t.ep}/${it.slug}.${fld}` });
          }
        }
      }
      if (d.contents.length < 100) break;
      await new Promise((res) => setTimeout(res, 200));
    }
  }
  return out;
}

(async () => {
  console.log(`[verify:source-names] 台帳 ${ledger.documents.length} 件（別名込み ${known.size} 表記）`);
  if (ledgerProblems.length) {
    console.warn(`[verify:source-names] WARN 台帳の不備 ${ledgerProblems.length} 件`);
    ledgerProblems.slice(0, 20).forEach((p) => console.warn(`   - ${p}`));
  }
  const cms = await cmsHits();
  if (cms === null) console.log('[verify:source-names] 注記: microCMS の env が無いため src のみ検査（microCMS も見るなら .env.local を読み込んで実行）');
  // 資料名ではないもの: JSX（内部リンク「<Link…>」）・テンプレート変数（「${…}」「{…}」は定数側で台帳と突合）・
  // 当サイト自身や当サイトの解説記事を指す「」（本サイト「BESS-NET」／解説「…」）
  const SELF_PUBLISHERS = /^(本サイト|当サイト|解説|蓄電所ネット|関連記事)$/;
  const isDocName = (h: Hit) => !/[<>{}$]/.test(h.name) && !SELF_PUBLISHERS.test(h.publisher.trim());
  const all = [...hits, ...(cms ?? [])].filter(isDocName);
  const unregistered = new Map<string, Hit[]>();
  for (const h of all) {
    if (known.has(norm(h.name))) continue;
    const list = unregistered.get(h.name) ?? [];
    list.push(h);
    unregistered.set(h.name, list);
  }
  const srcN = hits.filter(isDocName).length;
  const cmsN = cms ? cms.filter(isDocName).length : null;
  console.log(`[verify:source-names] 出典として書かれた資料名 ${all.length} 箇所（src ${srcN}・microCMS ${cmsN ?? '未検査'}）`);
  if (unregistered.size === 0) {
    console.log('[verify:source-names] ok   台帳に無い資料名: 0 種');
  } else {
    console.warn(`[verify:source-names] WARN 台帳に無い資料名: ${unregistered.size} 種（書く前に一次の <title> を取り、台帳に登録する）`);
    for (const [name, hs] of [...unregistered.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 60)) {
      const pubs = [...new Set(hs.map((h) => h.publisher).filter(Boolean))].slice(0, 2).join('／');
      console.warn(`   - ${pubs ? pubs + '「' : '「'}${name}」 … ${hs.slice(0, 2).map((h) => h.location).join(', ')}${hs.length > 2 ? ` ほか ${hs.length - 2}` : ''}`);
    }
    if (unregistered.size > 60) console.warn(`   … ほか ${unregistered.size - 60} 種`);
  }
  if (STRICT && (unregistered.size > 0 || ledgerProblems.length > 0)) process.exit(1);
  process.exit(0);
})().catch((e) => {
  console.error('[verify:source-names] FATAL', e);
  process.exit(1);
});
