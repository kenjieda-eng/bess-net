/**
 * scripts/post-glossary-core4.ts
 *
 * 解説#1投入で判明した中核4語を microCMS glossary に POST。
 *   LCOE / LCOS / 充放電効率（ラウンドトリップ効率）/ 卸電力市場（JEPX）
 *
 * 使い方: npx tsx scripts/post-glossary-core4.ts [--dry-run]
 * 冪等: 既存 slug があれば skip。
 */

import {} from 'node:process';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/glossary`;

async function api(method: 'GET' | 'POST', url: string, body?: unknown): Promise<unknown> {
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
  return resp.json();
}

async function findBySlug(slug: string): Promise<{ id: string } | null> {
  const url = `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id&limit=1`;
  const data = (await api('GET', url)) as { contents: { id: string }[] };
  return data.contents[0] ?? null;
}

async function getTotalCount(): Promise<number> {
  const data = (await api('GET', `${BASE}?limit=1`)) as { totalCount: number };
  return data.totalCount;
}

// ─────────────────────────────────────────────────────────────
// 4語の定義
// ─────────────────────────────────────────────────────────────

type GlossaryEntry = {
  term: string;
  slug: string;
  reading: string;
  english: string;
  category: string[];
  subcategory: string;
  shortDef: string;
  detail: string;
  relatedTerms: string;
};

const ENTRIES: GlossaryEntry[] = [
  {
    term: 'LCOE（均等化発電原価）',
    slug: 'lcoe',
    reading: 'えるしーおーいー',
    english: 'Levelized Cost of Energy',
    category: ['基礎'],
    subcategory: 'コスト指標',
    shortDef: '発電設備が生涯に発電する電力1MWh（1kWh）あたりの平均コスト。建設費・運転維持費・燃料費の総額を生涯発電量で割って求め、太陽光・風力・火力・原子力など異なる電源を横並びで比較するのに使う。',
    detail: '<p>LCOE（Levelized Cost of Energy、均等化発電原価）は、ある電源が一生のあいだに発電する電力量あたりの平均コストを示す指標です。初期投資（建設費）から運転維持費、燃料費までを生涯総額として計上し、それを生涯発電量で割って「1kWhあたり何円か」を求めます。前提（設備利用率・割引率・燃料価格）によって変わるため、出典と前提の確認が重要です。</p><p>太陽光・陸上風力のLCOEは近年大きく低下し、多くの地域で火力や原子力を下回るようになりました。一方で<strong>系統用蓄電池にはLCOEをそのまま使えません</strong>。蓄電池は発電せず電力を移動させる装置のため、分母となる「発電量」が存在しないからです。蓄電池の原価は<a href="/glossary/lcos">LCOS（均等化蓄電原価）</a>で測ります。</p>',
    relatedTerms: 'LCOS,充放電効率,卸電力市場',
  },
  {
    term: 'LCOS（均等化蓄電原価）',
    slug: 'lcos',
    reading: 'えるこす',
    english: 'Levelized Cost of Storage',
    category: ['基礎'],
    subcategory: 'コスト指標',
    shortDef: '蓄電設備が生涯に放電する電力1MWh（1kWh）あたりの平均コスト。設備費・運転維持費に充電電力費を加えた総額を、生涯放電量で割って求める。発電向けのLCOEに対し、蓄電池の原価を測る指標。',
    detail: '<p>LCOS（Levelized Cost of Storage、均等化蓄電原価）は、蓄電池が放電する電力量あたりの平均コストです。設備費（CAPEX）・運転維持費に加え、<strong>充電に使う電力の購入費</strong>を含めて総コストとし、生涯の放電量で割ります。発電原価の<a href="/glossary/lcoe">LCOE</a>に対応する、蓄電池版のコスト指標です。</p><p>LCOSは単一の決まった値ではなく、設備コストを起点に運用前提で大きく変わります。効く要素は主に3つ──<a href="/glossary/round-trip-efficiency">充放電効率</a>（取り出せる割合）、<a href="/glossary/cycle-life">サイクル寿命</a>（生涯放電量＝分母）、充電電力費（いくらで充電するか）。「安く充電し、効率よく、多サイクル使う」ほどLCOSは下がります。蓄電所の投資判断では、LCOS（原価）を複数市場の収益（卸裁定・容量・需給調整）と突き合わせて評価します。</p>',
    relatedTerms: 'LCOE,充放電効率,サイクル寿命',
  },
  {
    term: '充放電効率（ラウンドトリップ効率）',
    slug: 'round-trip-efficiency',
    reading: 'じゅうほうでんこうりつ',
    english: 'Round-trip efficiency',
    category: ['技術'],
    subcategory: '性能指標',
    shortDef: '蓄電池に充電した電力量のうち、放電して取り出せる割合。残りは充放電・変換の損失。リチウムイオン系で概ね85〜95%程度。LCOSや収益性に直結する。',
    detail: '<p>充放電効率（ラウンドトリップ効率）は、充電した電力のうち放電時に取り出せる割合を示します。たとえば効率90%なら、100充電して放電で取り出せるのは90で、残り10は損失です。蓄電システムでは電池セルだけでなくPCS（変換装置）や補機の消費も効率に影響します。</p><p>効率は蓄電所の経済性に直結します。<a href="/glossary/lcos">LCOS</a>の計算では効率が低いほど実質コストが上がり、卸市場の裁定（安く充電し高く放電）でも損失分だけ利幅が削られます。<a href="/glossary/cycle-life">サイクル寿命</a>とともに、蓄電池の性能評価の中心的な指標です。</p>',
    relatedTerms: 'LCOS,サイクル寿命',
  },
  {
    term: '卸電力市場（JEPX）',
    slug: 'wholesale-electricity-market',
    reading: 'おろしでんりょくしじょう',
    english: 'Wholesale electricity market (JEPX)',
    category: ['市場制度'],
    subcategory: '電力市場',
    shortDef: '電力を卸取引する市場。日本では日本卸電力取引所（JEPX）のスポット市場が中心で、30分コマごとに価格が決まる。蓄電池は安い時間帯に充電し高い時間帯に放電する裁定取引で収益を得る。',
    detail: '<p>卸電力市場は、小売電気事業者や発電事業者が電力を売買する市場です。日本では日本卸電力取引所（JEPX）のスポット市場が中心で、翌日の30分コマ（1日48コマ）ごとに価格が決まります。需給がひっ迫すると価格が跳ね、余剰時には下がります。</p><p>系統用蓄電池にとって卸市場は基本的な収益源の一つです。価格が安い時間帯に充電し、高い時間帯に放電する「<strong>裁定取引</strong>」で価格差を取ります。ただし蓄電池の収益はこれ単独ではなく、<a href="/glossary/capacity-market">容量市場</a>・<a href="/glossary/balancing-market">需給調整市場</a>と組み合わせた積み上げで決まります。</p>',
    relatedTerms: '需給調整市場,容量市場',
  },
];

// ─────────────────────────────────────────────────────────────

async function postOne(entry: GlossaryEntry): Promise<'ok' | 'skip' | 'err'> {
  try {
    const existing = await findBySlug(entry.slug);
    if (existing) {
      console.log(`  [skip] ${entry.slug} — already exists (id=${existing.id})`);
      return 'skip';
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] POST ${entry.slug} [category=${entry.category.join(',')}]`);
      console.log(`           term: ${entry.term}`);
      return 'ok';
    }

    const result = (await api('POST', BASE, {
      term: entry.term,
      slug: entry.slug,
      reading: entry.reading,
      english: entry.english,
      category: entry.category,
      subcategory: entry.subcategory,
      shortDef: entry.shortDef,
      detail: entry.detail,
      relatedTerms: entry.relatedTerms,
    })) as { id: string };
    console.log(`  [ok] ${entry.slug} — created id=${result.id}`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${entry.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

async function main(): Promise<void> {
  const totalBefore = await getTotalCount();
  console.log(`[post-glossary-core4] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`glossary 現在件数: ${totalBefore}`);

  let ok = 0, skip = 0, err = 0;
  for (const entry of ENTRIES) {
    const r = await postOne(entry);
    if (r === 'ok') ok++;
    else if (r === 'skip') skip++;
    else err++;
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  console.log(`[done] ok=${ok}  skip=${skip}  err=${err}`);

  if (!DRY_RUN) {
    const totalAfter = await getTotalCount();
    console.log(`glossary 件数: ${totalBefore} → ${totalAfter}  差分=+${totalAfter - totalBefore}`);
  }

  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
