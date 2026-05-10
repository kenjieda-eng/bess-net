/**
 * scripts/verify-no-nested-anchors.ts (依頼W.5 §5-1)
 *
 * 主要 16 ページを fetch して、auto-link クラスを持つ <a> のネストが
 * 発生していないことを検証する。1件でも見つかれば exit 1（CI 失敗）。
 *
 * 使い方:
 *   tsx scripts/verify-no-nested-anchors.ts
 *   tsx scripts/verify-no-nested-anchors.ts --base https://bess-net.jp
 *   VERCEL_URL=preview-xxx.vercel.app tsx scripts/verify-no-nested-anchors.ts
 */

const SAMPLE_URLS = [
  // operators 5件
  '/operators/osaka-gas',
  '/operators/tesla-inc',
  '/operators/pr-yanekara',
  '/operators/pr-fluenceenergyinc',
  '/operators/pr-auroraenergyresearch',
  // projects 5件
  '/projects/pr-jfe-hokkaido',
  '/projects/pr-co161802-kumamoto',
  '/projects/pr-co10686-tokyo',
  '/projects/pr-co161611-bess',
  '/projects/pr-co1379-bess',
  // news 3件
  '/news/pr-2026-05-08-co70816-344',
  '/news/pr-2026-05-08-auroraenergyresearch-4',
  '/news/pr-2026-05-08-goodwejapan-15',
  // explainer 3件
  // 依頼W.6 §3-1A: pcs-power-conversion-system は 404 だったため pcs-selection-guide に変更
  '/explainer/grid-scale-bess',
  '/explainer/balancing-market',
  '/explainer/pcs-selection-guide',
];

function resolveBase(): string {
  const argIdx = process.argv.indexOf('--base');
  if (argIdx >= 0 && process.argv[argIdx + 1]) {
    return process.argv[argIdx + 1].replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`;
  }
  return 'https://bess-net.jp';
}

function countNestedAuto(html: string): number {
  // auto-link クラスを含む <a> が連続するブロック (依頼W.5 §5-1 例)
  // 例: <a class="auto-link auto-link-glossary" ...><a class="auto-link..." ...>
  const re = /(?:<a [^>]*?auto-link[^>]*?>){2,}/g;
  return (html.match(re) ?? []).length;
}

function countAutoLinks(html: string): number {
  return (html.match(/<a [^>]*?class="[^"]*auto-link/g) ?? []).length;
}

async function main(): Promise<void> {
  const base = resolveBase();
  console.log(`[verify-linkify] base: ${base}`);
  console.log(`[verify-linkify] checking ${SAMPLE_URLS.length} pages...`);

  let failed = 0;
  for (const path of SAMPLE_URLS) {
    try {
      const res = await fetch(base + path);
      // 依頼W.6 §3-1B: HTTP 200 を必須化（404 サンプルを CI で即検出）
      if (res.status !== 200) {
        console.error(`❌ ${path}: HTTP ${res.status} (expected 200)`);
        failed++;
        continue;
      }
      const html = await res.text();
      const nests = countNestedAuto(html);
      const totalAuto = countAutoLinks(html);
      if (nests > 0) {
        console.error(`❌ ${path}: ${nests} nested anchor blocks (auto-link total ${totalAuto})`);
        failed++;
      } else {
        console.log(`✅ ${path}: clean (auto-link total ${totalAuto})`);
      }
    } catch (e) {
      console.error(`❌ ${path}: fetch error -- ${(e as Error).message}`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`\n${failed}/${SAMPLE_URLS.length} pages have issues. Build FAILED.`);
    process.exit(1);
  }
  console.log(`\nAll ${SAMPLE_URLS.length} pages clean. ✓`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
