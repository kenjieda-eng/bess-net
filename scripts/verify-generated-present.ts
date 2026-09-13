#!/usr/bin/env tsx
/**
 * scripts/verify-generated-present.ts — prebuild の生成物 11 本が「このビルドで」書かれたかの検査（金曜#6 追修便④ ■1・2026-09-13）
 *
 * 背景: src/lib/generated/ を git の追跡から外した（生成物は毎ビルド prebuild が作る）。
 *   追跡中は、書き手が黙って書かなかった場合に「前回コミットした古いファイル」がそのまま使われ、失敗が表に出なかった。
 *   追跡を外した後もローカルでは前回ビルドの残りが同じ役をしうるため、prebuild の最初と最後で次を行う:
 *     --mark  : 出力フォルダを作り（新規クローンには無い）、開始の印を置く（prebuild の先頭）
 *     --check : 11 本すべてが「存在する・空でない・JSON として読める・開始の印より後に書かれた」ことを確かめ、
 *               1 本でも満たさなければ exit 1 でビルドを止める（prebuild の末尾）
 *   11 本のうち 9 本は next build の静的 import で、欠ければ Module not found で落ちる。残る
 *   projects-maintenance.json（保守リスト）と operators-match-audit.json（突合の監査）はサイトから import されず、
 *   この検査が無いと欠けても・古くても素通りする。
 *
 * 実行: prebuild（build:generated-mark ／ verify:generated）。手動: npx tsx scripts/verify-generated-present.ts --check
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const DIR = path.join(process.cwd(), 'src', 'lib', 'generated');
const MARK = path.join(DIR, '.prebuild-started');

/** 期待する生成物と書き手（この一覧が唯一の定義。書き手を増やしたらここにも足す） */
export const EXPECTED_GENERATED: ReadonlyArray<{ file: string; writer: string }> = [
  { file: 'news-topic-exclusions.json', writer: 'build:news-topic-gate' },
  { file: 'glossary-faq-index.json', writer: 'build:glossary-faq-index' },
  { file: 'glossary-detail-index.json', writer: 'build:glossary-detail' },
  { file: 'operators-detail-index.json', writer: 'build:operators-detail' },
  { file: 'operators-category-index.json', writer: 'build:operators-detail' },
  { file: 'operators-match-audit.json', writer: 'build:operators-detail' },
  { file: 'grid-area-lists.json', writer: 'build:substations' },
  { file: 'related-news-map.json', writer: 'build:related-news' },
  { file: 'explainer-related-map.json', writer: 'build:explainer-related' },
  { file: 'projects-pref-count.json', writer: 'build:projects-pref-count' },
  { file: 'projects-maintenance.json', writer: 'build:projects-maintenance' },
];

function mark(): void {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(MARK, new Date().toISOString() + '\n');
  console.log(`[verify:generated] 開始の印 ${path.relative(process.cwd(), MARK)}`);
}

function check(): void {
  if (!fs.existsSync(MARK)) {
    console.error('[verify:generated] FAIL: 開始の印が無い（prebuild の先頭で build:generated-mark が走っていない）');
    process.exit(1);
  }
  const t0 = fs.statSync(MARK).mtimeMs;
  let fail = 0;
  for (const { file, writer } of EXPECTED_GENERATED) {
    const p = path.join(DIR, file);
    let result: string;
    if (!fs.existsSync(p)) {
      result = 'MISSING（このビルドで書かれていない）';
    } else {
      const st = fs.statSync(p);
      if (st.size === 0) {
        result = 'EMPTY';
      } else if (st.mtimeMs < t0) {
        result = `STALE（開始の印より前のファイル＝このビルドで書かれていない・${new Date(st.mtimeMs).toISOString()}）`;
      } else {
        try {
          JSON.parse(fs.readFileSync(p, 'utf8'));
          result = `OK ${st.size.toLocaleString('en-US')} bytes`;
        } catch {
          result = 'INVALID JSON';
        }
      }
    }
    const ok = result.startsWith('OK');
    if (!ok) fail++;
    console.log(`[verify:generated] ${ok ? 'ok  ' : 'FAIL'} ${file.padEnd(30)} ← ${writer.padEnd(27)} ${result}`);
  }
  // 一覧に無い .json（書き手を足したのに一覧を更新していない）は知らせる（ビルドは止めない）
  const extra = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && !EXPECTED_GENERATED.some((e) => e.file === f));
  if (extra.length > 0) {
    console.warn(`[verify:generated] WARN 一覧に無い生成物: ${extra.join(', ')}（EXPECTED_GENERATED に足すこと）`);
  }
  if (fail > 0) {
    console.error(`[verify:generated] FAIL ${fail}/${EXPECTED_GENERATED.length} 本 → ビルドを止める`);
    process.exit(1);
  }
  console.log(`[verify:generated] PASS ${EXPECTED_GENERATED.length}/${EXPECTED_GENERATED.length} 本（すべてこのビルドで生成）`);
}

const mode = process.argv[2];
if (mode === '--mark') mark();
else if (mode === '--check') check();
else {
  console.error('usage: tsx scripts/verify-generated-present.ts --mark | --check');
  process.exit(2);
}
