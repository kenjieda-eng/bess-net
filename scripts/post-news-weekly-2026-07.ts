/**
 * scripts/post-news-weekly-2026-07.ts
 *
 * 週次まとめ記事 初回（7月号）投入 — news-weekly- 枠の初稼働
 *
 * 使い方:
 *   MICROCMS_API_KEY=xxx npx tsx scripts/post-news-weekly-2026-07.ts --dry-run
 *   MICROCMS_API_KEY=xxx npx tsx scripts/post-news-weekly-2026-07.ts
 *
 * 設計:
 *   - category は '市場統計'（実在値）。getIndustryNews は '編集部' を除外するため、
 *     編集部にするとフィード・「今週のまとめ」枠・sitemap から漏れる（microcms.ts:688-693 実査）。
 *     → 週次まとめは feed に載る実在カテゴリ '市場統計' を選定（既存 news-2026-003 で使用実績）。
 *   - sourceName/sourceUrl は編集記事の既存慣行（'蓄電所ネット編集部' / '/news'）。
 *   - 禁止語ガード（scripts/lv-invest-banned-words.json）を POST 前に強制。
 *   - findBySlug で冪等（既存なら skip）。API キーは環境変数のみ・ログ出力しない。.env は変更しない。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!API_KEY) {
  console.error('ERROR: MICROCMS_API_KEY 環境変数が必要です');
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/news`;

// ─── 記事ペイロード ────────────────────────────────────────────────────────────
const SLUG = 'news-weekly-2026-07';

const BODY = [
  '<h2>① 東京ガス、運用予定容量が1GWを突破</h2>',
  '<p>岡山・美作蓄電所（29MW）の最適運用受託により、系統用蓄電池の運用予定容量が1GW規模に到達しました。大手エネルギー事業者の運用（アグリゲーション）事業がこの規模に育ったことは、蓄電所オーナーにとって「運用を任せる先」の層が厚くなっていることを意味します。→ <a href="/news/tokyo-gas-bess-1gw-mimasaka-2026-07">記事：東京ガス、運用予定容量が1GWを突破</a></p>',
  '<h2>② SBIマネープラザ、初の系統用蓄電所ファンド</h2>',
  '<p>島根県大田市の蓄電所（1,990kW／10,160kWh・需給調整市場参入済み）を対象に、蓄電所を金融商品として保有する形が登場しました。設備を直接保有する投資と、ファンド持分で関わる投資 ── 選択肢が分かれ始めたことは、市場の成熟に向けた一歩です。→ <a href="/news/sbi-moneyplaza-bess-fund-ota-shimane-2026-07">記事：SBIマネープラザ、初の系統用蓄電所ファンド</a></p>',
  '<h2>③ Tensor Energy×ライジング、低圧で1,000機構想</h2>',
  '<p>低圧系統用蓄電池のアグリゲーションを2030年までに1,000機規模で組成する協業です。低圧クラスの運用インフラが厚くなる動きは、低圧蓄電所の保有を検討する個人・法人にとって運用委託先の選択肢に直結します。アグリゲーターの役割は<a href="/lv/invest/aggregator-role">解説記事（アグリゲーターの役割）</a>へ。→ <a href="/news/tensor-energy-rising-lv-bess-partnership-2026-07">記事：Tensor Energy×ライジング、低圧で1,000機構想</a></p>',
  '<h2>④ SINEXCEL、2MW／8MWh で需給調整市場へ</h2>',
  '<p>三重県松阪市の系統用蓄電所（2MW／8MWh）が需給調整市場に参入しました。小規模クラスの蓄電所でも複数市場で収益機会を持つ実例が積み上がっていくことは、収益構造を理解するうえで良い教材です。→ <a href="/news/sinexcel-matsusaka-bess-balancing-entry-2026-07">記事：SINEXCEL、2MW／8MWhで需給調整市場へ</a></p>',
  '<h2>⑤ 三木森HD、81MWh・10案件を順次運転開始へ</h2>',
  '<p>総出力19.8MW・総容量81MWhを10案件に分けて2026年10月から順次運転開始する計画です。1案件あたり約2MW級の中規模蓄電所を多数展開する形は、いまの日本市場の一つの典型になりつつあります。→ <a href="/news/mikimori-hd-bess-10sites-81mwh-2026-07">記事：三木森HD、81MWh・10案件を順次運転開始へ</a></p>',
  '<h2>7月の全18本</h2>',
  '<p>このほか、20年オフテイク契約・防災協定・EPC大口受注・海外勢のファイナンスなど、7月分の18本を<a href="/news">ニュース一覧（/news）</a>に掲載しています。低圧蓄電所への投資を検討中の方は、<a href="/lv/invest">投資家のための低圧蓄電所ガイド（/lv/invest）</a>もあわせてどうぞ。</p>',
  '<p><em>※本記事は蓄電所ネット編集部が、当サイト掲載の各ニュースおよび一次情報リンクをもとに整理したまとめです。各事実の詳細は本文中の各記事および一次情報をご参照ください。</em></p>',
].join('\n');

const PAYLOAD = {
  slug: SLUG,
  title:
    '【編集部まとめ】7月の蓄電池業界 ─ 運用1GW時代・蓄電所ファンド登場・低圧1,000機構想（注目5本）',
  lead:
    '7月に配信された系統用蓄電池の主要リリース18本から、編集部が5本を選び、それぞれ「なぜ注目か」の文脈をつけました。個別の詳細は各記事（当サイト内・一次情報リンクつき）をご覧ください。',
  body: BODY,
  tags: '系統用蓄電池, 蓄電所, 週次まとめ, 編集部, 市場動向',
  sourceName: '蓄電所ネット編集部',
  sourceUrl: 'https://bess-net.jp/news',
  category: ['市場統計'],
};

// ─── 禁止語ガード ─────────────────────────────────────────────────────────────
function bannedWordCheck(): { hard: string[]; quote: string[] } {
  const p = path.join(process.cwd(), 'scripts', 'lv-invest-banned-words.json');
  const { hardBanned, quoteOnly } = JSON.parse(fs.readFileSync(p, 'utf8')) as {
    hardBanned: string[];
    quoteOnly: string[];
  };
  const hay = `${PAYLOAD.title}\n${PAYLOAD.lead}\n${PAYLOAD.body}`;
  const hard = hardBanned.filter((w) => hay.includes(w));
  // quoteOnly は「」で囲めば可。素の出現のみ検出（囲みは簡易に前後1文字で判定）。
  const quote = quoteOnly.filter((w) => {
    let i = hay.indexOf(w);
    while (i !== -1) {
      const before = hay[i - 1];
      const after = hay[i + w.length];
      const quoted = (before === '「' || before === '『' || before === '"') &&
        (after === '」' || after === '』' || after === '"');
      if (!quoted) return true;
      i = hay.indexOf(w, i + w.length);
    }
    return false;
  });
  return { hard, quote };
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text.slice(0, 400)}`);
  }
  return resp.json() as T;
}

async function main(): Promise<void> {
  console.log('━'.repeat(70));
  console.log(`[post-news-weekly] slug=${SLUG}  mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);

  // 1) 禁止語チェック
  const { hard, quote } = bannedWordCheck();
  console.log(`  禁止語 hardBanned: ${hard.length === 0 ? '0（OK）' : hard.join(', ')}`);
  console.log(`  禁止語 quoteOnly(素出現): ${quote.length === 0 ? '0（OK）' : quote.join(', ')}`);
  if (hard.length > 0 || quote.length > 0) {
    console.error('  [abort] 禁止語検出のため中止');
    process.exit(2);
  }

  // 2) 内部リンク抽出（本文の href 数）
  const links = [...PAYLOAD.body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  console.log(`  本文内部リンク: ${links.length}本`);
  links.forEach((l) => console.log(`     - ${l}`));
  console.log(`  category: ${JSON.stringify(PAYLOAD.category)}  sourceName: ${PAYLOAD.sourceName}`);

  // 3) 冪等: findBySlug
  const found = await api<{ contents: { id: string }[] }>(
    'GET',
    `${BASE}?filters=slug[equals]${encodeURIComponent(SLUG)}&fields=id&limit=1`
  );
  if (found.contents[0]) {
    console.log(`  [skip] 既存 (id=${found.contents[0].id}) — POST しません`);
    return;
  }

  if (DRY_RUN) {
    console.log('  [dry-run] POST 予定（実行なし）');
    console.log('━'.repeat(70));
    return;
  }

  // 4) POST
  const created = await api<{ id: string }>('POST', BASE, PAYLOAD);
  console.log(`  [ok] created id=${created.id}`);

  // 5) GET 全 field 照合
  const back = await api<{ contents: Record<string, unknown>[] }>(
    'GET',
    `${BASE}?filters=slug[equals]${encodeURIComponent(SLUG)}&fields=id,slug,title,category,lead,body,sourceName,sourceUrl,tags&limit=1`
  );
  const r = back.contents[0] as Record<string, unknown>;
  const ok =
    r &&
    r.slug === PAYLOAD.slug &&
    r.title === PAYLOAD.title &&
    JSON.stringify(r.category) === JSON.stringify(PAYLOAD.category) &&
    r.lead === PAYLOAD.lead &&
    r.body === PAYLOAD.body &&
    r.sourceName === PAYLOAD.sourceName;
  console.log(`  [get照合] slug/title/category/lead/body/sourceName 一致: ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) {
    console.error('  照合不一致:', {
      slug: r?.slug,
      category: r?.category,
      titleEq: r?.title === PAYLOAD.title,
      bodyEq: r?.body === PAYLOAD.body,
    });
    process.exit(1);
  }
  console.log('━'.repeat(70));
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

export {};
