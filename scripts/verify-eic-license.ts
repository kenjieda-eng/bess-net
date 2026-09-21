#!/usr/bin/env tsx
/**
 * scripts/verify-eic-license.ts — 表示中の EIC 系列のライセンス表記の検査（警告のみ・Lc-1 ■6・2026-09-20）
 *
 * 目的: 「表示に使っている系列の license_notice が空」を build のログで気づけるようにする。
 *   Y-14 の宿題④。落とすのではなく警告（exit 0 固定）。ライセンス表記の欠落はビルドを止める性質の問題ではなく、
 *   気づかないまま公開が続くことが問題なので、毎ビルドのログに出す。
 *
 * 表示系列の定義: src 配下（src/data を除く）の .ts/.tsx が import している `@/data/eic/<id>.json`（相対パス `../data/eic/<id>.json` も含む・Ck-1）。
 *   これらは src/data/eic/<id>.json（上流 eic-data-pipeline が prebuild で再生成）にメタを持つ。
 *
 * 検査:
 *   軸1: license_notice が空・未定義 → 警告（件数と id）
 *   軸2: license_url が既知の 404（src/lib/eic-license.ts の DEAD_LICENSE_URL_FIX の左辺）→ 警告
 *        表示側は normalizeLicenseUrl で正した URL を出すため読者影響は無いが、上流カタログの修正が要る合図
 *   軸3: license_url が無い系列 → 警告（リンクなしで license 名だけが出る）
 *   軸4: ★表示系列を持つのに出典表記が無いルート → 警告（Lc-2 ■1(d)）
 *        JEPX の著作権条項は「利用する場合は、出所を明示した上でご利用下さい」、OCCTO も「出典を記載してください」と
 *        出所明示を利用の条件にしている。/industry が 9 系列から作った数値を出典表記ゼロで出していた（2026-09-20 実測）。
 *        「系列を import しているのはページ、出所表記は子コンポーネント」という形があるので、
 *        page.tsx 単体ではなく import をたどった到達ファイル群で判定する。
 *
 * 実行: npm run verify:eic-license（prebuild の末尾でも走る）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DEAD_LICENSE_URL_FIX, normalizeSourceLinkHref } from '../src/lib/eic-license';
export {};

// ─── 軸0: リンク方針表そのものの自己テスト（Lc-2）─────────────────────────────
// normalizeSourceLinkHref は「同じホストの深い URL をトップへ寄せる」関数だが、
// 判定を `${u.origin}/ === top` と書くと**そのホストの全 URL が素通り**する。
// 実際に一度埋め込み、/policy-calendar の生成 HTML に深い EPRX リンクが残って初めて気づいた。
// 関数の振る舞いは build のたびに確かめる（表を増やすときの取り違えもここで止まる）。
const LINK_POLICY_CASES: [string, string][] = [
  ['https://www.eprx.or.jp/information/post.php', 'https://www.eprx.or.jp/'],
  ['https://www.eprx.or.jp/information/summary.php', 'https://www.eprx.or.jp/'],
  ['https://www.eprx.or.jp/', 'https://www.eprx.or.jp/'],
  ['https://www.eprx.or.jp/terms/', 'https://www.eprx.or.jp/terms/'], // 利用条件ページは例外
  ['https://www.jepx.jp/electricpower/market-data/spot/', 'https://www.jepx.jp/'],
  ['https://www.jepx.jp/disclaimer/', 'https://www.jepx.jp/disclaimer/'], // 同上
  ['https://www.jepx.jp/', 'https://www.jepx.jp/'],
  ['https://www.occto.or.jp/market-board/market/', 'https://www.occto.or.jp/market-board/market/'], // deep-ok
  ['https://www.meti.go.jp/press/whatever.html', 'https://www.meti.go.jp/press/whatever.html'], // 方針表に無いソースは触らない
];
const policyNg = LINK_POLICY_CASES.filter(([input, want]) => normalizeSourceLinkHref(input) !== want);
if (policyNg.length === 0) {
  console.log(`[verify:eic-license] ok   リンク方針表の自己テスト: ${LINK_POLICY_CASES.length} 件すべて期待どおり`);
} else {
  console.warn(`[verify:eic-license] ★WARN リンク方針表の自己テストが不一致: ${policyNg.length} 件`);
  for (const [input, want] of policyNg) {
    console.warn(`   - ${input}\n       → ${normalizeSourceLinkHref(input)}（期待: ${want}）`);
  }
}

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const EIC_DIR = path.join(ROOT, 'src', 'data', 'eic');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p === EIC_DIR) continue; // 生成データ自体は対象外
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

type Meta = { id?: string; license?: string; license_url?: string; license_notice?: string; source_name?: string };

function metaOf(id: string): Meta | null {
  const p = path.join(EIC_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return (JSON.parse(fs.readFileSync(p, 'utf8')).meta ?? {}) as Meta;
  } catch {
    return null;
  }
}

// catalog.json は「系列」ではなくカタログ索引そのもの（meta を持たない）。
// 検査対象に混ぜると license_notice 空・license_url 無しに必ず計上され、件数の信号が濁る。
const NOT_A_SERIES = new Set(['catalog']);

/**
 * カタログ系列の import。`@/data/eic/<id>.json` と、scripts からも読めるよう相対パスで書いた
 * `../data/eic/<id>.json`（src/lib/capacity-market-defaults.ts・spot-spread-reference.ts・
 * nrel-atb-reference.ts・fx-reference.ts）の両方を拾う。
 * ★Ck-1（2026-09-21）: 旧版は `@/` 形式しか拾わず、Nv-0c で相対 import にした系列（容量市場 national・
 *   JEPX 日内価差）が「表示系列」から漏れていた。import / require 文の文字列だけを対象にする（コメント中の
 *   パス表記は数えない）。
 */
const EIC_IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"][^'"]*?data\/eic\/([a-z0-9-]+)\.json['"]/g;

const used = new Map<string, string[]>(); // id → 参照元ファイル
for (const f of walk(SRC)) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(EIC_IMPORT_RE)) {
    if (NOT_A_SERIES.has(m[1])) continue;
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const list = used.get(m[1]) ?? [];
    if (!list.includes(rel)) list.push(rel);
    used.set(m[1], list);
  }
}

const ids = [...used.keys()].sort();
const missingFile: string[] = [];
const emptyNotice: string[] = [];
const deadUrl: string[] = [];
const noUrl: string[] = [];

for (const id of ids) {
  const meta = metaOf(id);
  if (!meta) {
    missingFile.push(id);
    continue;
  }
  if (!(meta.license_notice ?? '').trim()) emptyNotice.push(id);
  if (meta.license_url && meta.license_url in DEAD_LICENSE_URL_FIX) deadUrl.push(id);
  if (!meta.license_url) noUrl.push(id);
}

console.log(`[verify:eic-license] 表示系列 ${ids.length} 件（src が import している data/eic/*.json・相対 import 含む）`);
const warn = (label: string, list: string[]) => {
  if (list.length === 0) {
    console.log(`[verify:eic-license] ok   ${label}: 0 件`);
    return;
  }
  console.warn(`[verify:eic-license] WARN ${label}: ${list.length} 件`);
  for (const id of list.slice(0, 20)) {
    console.warn(`   - ${id}（参照: ${(used.get(id) ?? []).slice(0, 2).join(', ')}）`);
  }
  if (list.length > 20) console.warn(`   … ほか ${list.length - 20} 件`);
};

warn('license_notice が空', emptyNotice);
warn('license_url が既知の 404（上流カタログの修正待ち・表示は正規化済み）', deadUrl);
warn('license_url が無い', noUrl);
warn('カタログに JSON が無い（prebuild 前・または id の綴り違い）', missingFile);

// ─── 軸4: 表示系列を持つのに出典表記が無いルート（Lc-2 ■1(d)）─────────────────

/** import 文から、同じリポジトリ内のファイルへの参照だけを取り出す */
function localImportsOf(file: string): string[] {
  const text = fs.readFileSync(file, 'utf8');
  const out: string[] = [];
  for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    let base: string | null = null;
    if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
    else if (spec.startsWith('./') || spec.startsWith('../')) base = path.resolve(path.dirname(file), spec);
    if (!base) continue;
    for (const ext of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
      const p = base + ext;
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        out.push(p);
        break;
      }
    }
  }
  return out;
}

/** page.tsx から import を辿って到達するファイル群（深さ制限つき・循環対策あり） */
function reachableFrom(entry: string, maxDepth = 3): string[] {
  const seen = new Set<string>([entry]);
  let frontier = [entry];
  for (let d = 0; d < maxDepth; d++) {
    const next: string[] = [];
    for (const f of frontier) {
      for (const dep of localImportsOf(f)) {
        if (seen.has(dep)) continue;
        seen.add(dep);
        next.push(dep);
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  return [...seen];
}

/**
 * 出典表記とみなす語。
 * ★「EIC Data」「data.eic-jp.org」を判定語に入れてはいけない。
 *   /industry には教材への送客リンク「制度の仕組み（EIC Data 教材）」があり、共通フッタにも
 *   グループサイトへのリンクがある。これらを出典表記と数えると、実際に出典ゼロだった /industry が
 *   素通りする（＝この検査が何も検出できない）。2026-09-20 に実際に素通りすることを確認して締めた。
 * ★共通フッタと src/lib も判定対象から外す。
 *   フッタは全ページに出るのでページ固有の表記にならない。src/lib は出典表記の「語彙そのもの」
 *   （eic-license.ts の既定文など）を持つため、import しただけで合格になってしまう。
 */
const ATTRIBUTION_WORDS = ['出典', '出所', 'データ提供'];
const FOOTER_FILE = path.join(SRC, 'components', 'SiteFooter.tsx');
const ATTRIBUTION_SCAN_DIRS = [path.join(SRC, 'app'), path.join(SRC, 'components')];

const APP_DIR = path.join(SRC, 'app');
const pageFiles: string[] = [];
(function collectPages(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collectPages(p);
    else if (e.name === 'page.tsx') pageFiles.push(p);
  }
})(APP_DIR);

const routesMissingAttribution: string[] = [];
for (const page of pageFiles) {
  const files = reachableFrom(page).filter((f) => f !== FOOTER_FILE);
  let seriesCount = 0;
  let hasAttribution = false;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    for (const m of text.matchAll(EIC_IMPORT_RE)) {
      if (!NOT_A_SERIES.has(m[1])) seriesCount++;
    }
    // コメントは出典表記として数えない。
    // ★行頭が // や * かどうかで判定してはいけない。JSX の {/* … */} は継続行が日本語で始まるため
    //   行単位のフィルタをすり抜け、「出所表記が無い」と書いた説明コメント自体で合格してしまう
    //   （2026-09-20 の否定テストで実際にすり抜けた）。ブロックコメントごと除去する。
    if (ATTRIBUTION_SCAN_DIRS.some((d) => f.startsWith(d))) {
      const visible = text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
      if (ATTRIBUTION_WORDS.some((w) => visible.includes(w))) hasAttribution = true;
    }
  }
  if (seriesCount > 0 && !hasAttribution) {
    const route = '/' + path.relative(APP_DIR, path.dirname(page)).replace(/\\/g, '/');
    routesMissingAttribution.push(`${route}（系列 ${seriesCount} ・${path.relative(ROOT, page).replace(/\\/g, '/')}）`);
  }
}

// 軸4 の要素はルート名であって系列 id ではないので、warn() の「参照:」補記は付けない
if (routesMissingAttribution.length === 0) {
  console.log('[verify:eic-license] ok   表示系列を持つのに出典表記が無いルート: 0 件');
} else {
  console.warn(
    `[verify:eic-license] WARN 表示系列を持つのに出典表記が無いルート（JEPX/OCCTO は出所明示が利用の条件）: ${routesMissingAttribution.length} 件`,
  );
  for (const r of routesMissingAttribution) console.warn(`   - ${r}`);
}
console.log(
  `[verify:eic-license] 注記: 動的ロード（getIndicatorsByIdPrefix / getSeriesMany）の系列は静的 import ではないため軸4 の系列数に含まれない。` +
    ` /market/jepx・/dashboard/market が該当（いずれも出典表記あり・2026-09-20 実測）。`,
);

console.log('[verify:eic-license] 警告のみ・ビルドは止めない（exit 0）');
process.exit(0);
