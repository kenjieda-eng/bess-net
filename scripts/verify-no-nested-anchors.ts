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

// news 1件は sitemap から動的取得（固定URLは archive で 404 化する。2026-07-27 B7:
// 旧 /news/pr-2026-05-08-goodwejapan-15 が本番 404 になった件を恒久対策）。
const NEWS_SAMPLE_FALLBACK = '/lv/what-is'; // sitemap 取得失敗時の恒久URL

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
  // '/projects/pr-co1379-bess', // 2026-05-17 削除: microCMS から archive 済 (script 対象外、本番 404)
  // news 2件（固定・恒久サンプル）＋ 1件は sitemap から動的解決（下記 resolveNewsSample）
  '/news/pr-2026-05-08-co70816-344',
  '/news/pr-2026-05-08-auroraenergyresearch-4',
  // explainer 3件
  // 依頼W.6 §3-1A: pcs-power-conversion-system は 404 だったため pcs-selection-guide に変更
  '/explainer/grid-scale-bess',
  '/explainer/balancing-market',
  '/explainer/pcs-selection-guide',
];

/** sitemap.xml から実在する /news/<slug> を1件取得。失敗時は恒久URLにフォールバック。 */
async function resolveNewsSample(base: string): Promise<string> {
  try {
    const res = await fetch(base + '/sitemap.xml');
    if (!res.ok) return NEWS_SAMPLE_FALLBACK;
    const xml = await res.text();
    const m = xml.match(/https?:\/\/[^<]*?(\/news\/[a-z0-9-]+)</i);
    return m ? m[1] : NEWS_SAMPLE_FALLBACK;
  } catch {
    return NEWS_SAMPLE_FALLBACK;
  }
}

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
  const newsSample = await resolveNewsSample(base);
  const urls = [...SAMPLE_URLS, newsSample];
  console.log(`[verify-linkify] base: ${base}`);
  console.log(`[verify-linkify] news sample (dynamic): ${newsSample}`);
  console.log(`[verify-linkify] checking ${urls.length} pages...`);

  let failed = 0;
  for (const path of urls) {
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
    console.error(`\n${failed}/${urls.length} pages have issues. Build FAILED.`);
    process.exit(1);
  }
  console.log(`\nAll ${urls.length} pages clean. ✓`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
