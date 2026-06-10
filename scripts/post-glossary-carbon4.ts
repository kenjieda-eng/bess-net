/**
 * scripts/post-glossary-carbon4.ts
 *
 * 解説#3「EU ETS と GX-ETS」投入で判明した炭素価格4語を microCMS glossary に POST。
 *   EU ETS / GX-ETS / カーボンプライシング / キャップ・アンド・トレード
 *
 * 使い方: npx tsx scripts/post-glossary-carbon4.ts [--dry-run]
 * 冪等: 既存 slug があれば skip。
 *
 * Phase A 確認済み（2026-06-10）:
 *   - bess-net glossary eu-ets/gx-ets/carbon-pricing → 未作成 (NOT FOUND)
 *   - cap-and-trade → EXISTS (term="Cap and Trade"、sparse) → SKIP
 *   - /glossary/cap-and-trade → HTTP 200 ✅
 *   - bess-net category実スキーマ = ["基礎","市場制度","技術"] → 4語とも "市場制度"
 *   - 現在件数: 1,519
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
  // ─── 1. EU ETS ─────────────────────────────────────────────
  {
    term: 'EU ETS（欧州排出量取引制度）',
    slug: 'eu-ets',
    reading: 'いーゆーいーてぃーえす',
    english: 'EU Emissions Trading System',
    category: ['市場制度'],
    subcategory: '炭素価格',
    shortDef: 'EU の排出量取引制度。2005年に始まった世界最大の炭素市場で、域内の発電所・産業施設に排出枠（EUA）の市場取引を義務付ける。価格は2021年以降の枠引き締めで急騰し、火力発電のコスト上昇を通じて電力価格に波及する。日本のGX-ETSが手本とする制度。',
    detail: '<p>EU ETS（EU Emissions Trading System、欧州排出量取引制度）は、2005年に始まった世界最大の炭素市場です。EU域内の発電所や産業施設に対し、CO2排出量に見合う排出枠（EUA＝EU Allowance）の保有を義務付け、過不足を市場で売買させる<a href="/glossary/cap-and-trade">キャップ・アンド・トレード</a>方式をとります。排出枠の総量（キャップ）は年々絞られ、第4フェーズ（2021年〜）の引き締めで価格は一時 €90/tCO2 台まで急騰しました。</p><p>炭素価格は火力発電のコストに上乗せされるため、卸電力価格を押し上げる方向に働きます。系統用蓄電池の視点では、火力の限界費用が上がるほど<a href="/glossary/wholesale-electricity-market">卸電力市場</a>の価格差（ピークとボトムの差）が開きやすく、安く充電して高く放電する裁定収益の源泉が広がります。日本でも2026年度から<a href="/glossary/gx-ets">GX-ETS</a>が本格稼働しており、EUが20年かけて歩んだ道筋は解説 <a href="/explainer/eu-ets-and-gx-ets-for-bess">EU ETS と日本の GX-ETS</a> で詳しく扱っています。</p>',
    relatedTerms: 'GX-ETS,カーボンプライシング,キャップ・アンド・トレード',
  },

  // ─── 2. GX-ETS ─────────────────────────────────────────────
  {
    term: 'GX-ETS（日本版排出量取引制度）',
    slug: 'gx-ets',
    reading: 'じーえっくすいーてぃーえす',
    english: 'GX Emissions Trading System',
    category: ['市場制度'],
    subcategory: '炭素価格',
    shortDef: '日本の排出量取引制度。GXリーグの枠組みで2026年4月から本格稼働し、2026年度に対象企業の排出量取引が義務化。2033年度には発電部門へ有償オークション（排出枠の買い取り）が導入される予定で、火力コストを通じて卸電力価格に影響する。',
    detail: '<p>GX-ETS（GX Emissions Trading System）は、日本の排出量取引制度です。GXリーグの枠組みのもとで段階的に整備され、2026年4月から本格稼働、2026年度に対象企業の排出量取引が義務化されました。2033年度には発電部門に有償オークション（排出枠を買い取る方式）が導入される予定です。これは<a href="/glossary/eu-ets">EU ETS</a>が早期に進めた「発電の有償化」を、日本が約20年遅れで追う構図です。</p><p>制度設計の本体は<a href="/glossary/cap-and-trade">キャップ・アンド・トレード</a>で、EU ETSと同じ系譜にあります。発電部門への炭素価格が強まると火力の発電コストが上がり、<a href="/glossary/wholesale-electricity-market">卸電力市場</a>の価格上昇・変動拡大を通じて系統用蓄電池の裁定機会に効いてきます。日本のカーボンプライシングはGX-ETSに加え、2028年度開始予定の炭素賦課金と組み合わせて導入される計画です（<a href="/glossary/carbon-pricing">カーボンプライシング</a>参照）。詳しくは解説 <a href="/explainer/eu-ets-and-gx-ets-for-bess">EU ETS と日本の GX-ETS</a> を参照してください。</p>',
    relatedTerms: 'EU ETS,カーボンプライシング,キャップ・アンド・トレード',
  },

  // ─── 3. カーボンプライシング ────────────────────────────────
  {
    term: 'カーボンプライシング',
    slug: 'carbon-pricing',
    reading: 'かーぼんぷらいしんぐ',
    english: 'Carbon Pricing',
    category: ['市場制度'],
    subcategory: '炭素価格',
    shortDef: 'CO2排出に価格を付ける政策手段の総称。主に①炭素税②排出量取引（EU ETS・GX-ETSが代表）③クレジット取引の3形態がある。発電コストへの上乗せを通じて卸電力価格に上昇圧力をかける。',
    detail: '<p>カーボンプライシング（Carbon Pricing）は、CO2排出に価格を付けて削減を促す政策手段の総称です。大きく3形態に分かれます──①<strong>炭素税</strong>（政府が排出量に応じて課税）②<strong>排出量取引</strong>（排出枠を市場で売買、<a href="/glossary/eu-ets">EU ETS</a>や<a href="/glossary/gx-ets">GX-ETS</a>が代表）③<strong>クレジット取引</strong>（削減量を認証して売買、自主参加）。②の排出量取引は<a href="/glossary/cap-and-trade">キャップ・アンド・トレード</a>の仕組みで運用されます。</p><p>日本では2026年度のGX-ETS導入に加え、2028年度から炭素賦課金（化石燃料の輸入事業者等に課す賦課金）の開始が予定されています。いずれも発電コストに上乗せされ、<a href="/glossary/wholesale-electricity-market">卸電力市場</a>の価格を押し上げる方向に働きます。火力の限界費用が上がるほどピーク時間帯の価格が高くなり、安く充電して高く放電する系統用蓄電池の裁定収益にとっては追い風となります。</p>',
    relatedTerms: 'EU ETS,GX-ETS,キャップ・アンド・トレード,卸電力市場',
  },

  // ─── 4. キャップ・アンド・トレード ─────────────────────────
  // cap-and-trade は既存あり（term="Cap and Trade"）→ findBySlug で自動 SKIP
  {
    term: 'キャップ・アンド・トレード',
    slug: 'cap-and-trade',
    reading: 'きゃっぷあんどとれーど',
    english: 'Cap and Trade',
    category: ['市場制度'],
    subcategory: '炭素価格',
    shortDef: '排出量取引の代表的な方式。排出総量の上限（キャップ）を定めて排出枠を配分し、過不足を市場で売買（トレード）させる。EU ETS・GX-ETSがこの方式を採用。キャップを絞るほど炭素価格が上がる。',
    detail: '<p>キャップ・アンド・トレード（Cap and Trade）は、排出量取引でもっとも広く使われる制度設計です。まず社会全体の排出総量に上限（<strong>キャップ</strong>）を設け、その範囲で排出枠を企業に配分します。排出が枠を超える企業は市場で枠を買い、余った企業は売る（<strong>トレード</strong>）ことで、削減コストの低いところから優先的に削減が進む仕組みです。<a href="/glossary/eu-ets">EU ETS</a>や日本の<a href="/glossary/gx-ets">GX-ETS</a>はこの方式を採用しています。</p><p>枠の配分には、無償で配る「無償割当」と、オークションで買い取らせる「有償割当」があります。キャップを年々絞るほど枠が希少になり炭素価格が上がる──これが<a href="/glossary/carbon-pricing">カーボンプライシング</a>として発電コストに反映され、<a href="/glossary/wholesale-electricity-market">卸電力市場</a>の価格と変動に波及します。火力比率の高い電力システムほどこの影響を受けやすく、系統用蓄電池の裁定価値にも関わってきます。</p>',
    relatedTerms: 'EU ETS,GX-ETS,カーボンプライシング',
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
  console.log(`[post-glossary-carbon4] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`glossary 現在件数: ${totalBefore}`);
  console.log('  category マッピング: 全語 → ["市場制度"]（実スキーマ選択肢: 基礎/市場制度/技術）');

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
