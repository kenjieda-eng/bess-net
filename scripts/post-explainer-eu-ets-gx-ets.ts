/**
 * scripts/post-explainer-eu-ets-gx-ets.ts
 *
 * 解説#3「EU ETSとGX-ETS」を microCMS explainer に POST。
 * 使い方: npx tsx scripts/post-explainer-eu-ets-gx-ets.ts [--dry-run]
 *
 * 出典:
 *   - EEA EU ETS Data Viewer（EU全体・年次、CC BY 準拠）
 *   - 経済産業省「排出量取引制度（GX-ETS）」
 *   - EIC Data Insight #75「EU ETS×日本GX-ETS」(data.eic-jp.org, CC BY 4.0, 200確認済 2026-06-09)
 *   - SII 令和7年度補正 系統用蓄電システム等導入支援事業（GXフューチャー・リーグ要件）
 *   - 注記：EU実績は日本の予言ではない（産業構造・電源構成・制度差）
 *
 * Phase A 確認済み（2026-06-09）:
 *   - https://data.eic-jp.org/insight/eu-ets-vs-jp-gx → 200
 *   - bess-net glossary eu-ets/gx-ets/carbon-pricing → 404（data.eic-jp.org/glossary/* へクロスリンク）
 *   - /explainer/lcoe-and-bess-economics, /explainer/lcoe-and-power-mix, /policy-calendar → 200
 */

// module スコープ（他スクリプトとの変数衝突回避）
import {} from 'node:process';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/explainer`;

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

// ─────────────────────────────────────────────────────────────
// エントリ本体
// ─────────────────────────────────────────────────────────────

const SLUG = 'eu-ets-and-gx-ets-for-bess';

const INSIGHT75_URL = 'https://data.eic-jp.org/insight/eu-ets-vs-jp-gx';

// bess-net側 glossary eu-ets/gx-ets/carbon-pricing → 404のため data.eic-jp.org へクロスリンク
const DATA_GLOSSARY_EU_ETS = 'https://data.eic-jp.org/glossary/eu-ets';
const DATA_GLOSSARY_GX_ETS = 'https://data.eic-jp.org/glossary/gx-ets';
const DATA_GLOSSARY_CARBON = 'https://data.eic-jp.org/glossary/carbon-pricing';

const BODY = `<h2>排出量取引とは ── 炭素に価格をつける仕組み</h2>
<p>排出量取引（キャップ&トレード）は、温室効果ガスの排出量に総量の上限（キャップ）を定め、排出枠を市場で売買できるようにする制度です。枠が足りなければ市場で買い、削減して余れば売る。これにより<strong>炭素を出すことにコスト（<a href="${DATA_GLOSSARY_CARBON}">炭素価格</a>）が生まれ</strong>、安く減らせる主体から排出が減っていきます。欧州の <a href="${DATA_GLOSSARY_EU_ETS}">EU ETS</a> が2005年から20年の実績を持ち、日本では <a href="${DATA_GLOSSARY_GX_ETS}">GX-ETS</a> が動き出したところです。</p>

<h2>EU ETSが20年で示したこと</h2>
<p>欧州環境機関（EEA）の実データを見ると、EU ETS は次の3つを同時に進めてきました（EU全体・年次）。</p>
<ul>
<li><strong>無償枠の縮小</strong>：無償割当は2005年の約20.8億EUAから2025年の<strong>約4.9億EUA（493百万）へ、約76%縮小</strong>。タダで配る枠を年々絞り、価格シグナルを強めてきました。</li>
<li><strong>発電部門の有償化</strong>：2013年（フェーズ3）で発電部門が原則として無償割当を受けず、排出枠をオークションで買う建付けに転換。オークション量が急増しました（2025年 約328百万EUA）。</li>
<li><strong>結果としての排出減</strong>：発電・熱を中心とする燃料燃焼の検証排出量は2014年の約12.3億トンから2025年の<strong>約5.6億トンへ、約55%減</strong>。炭素価格を最も強く課された部門で、排出が最も速く落ちました。</li>
</ul>
<p>20年分の詳しい推移とグラフは、データ面の解説 Insight #75「<a href="${INSIGHT75_URL}">EU ETS × 日本 GX-ETS</a>」（EIC Data、EEA一次データ）を参照してください。</p>

<h2>日本のGX-ETSはどの地点にいるか</h2>
<p>日本の GX-ETS は、CO₂ 直接排出が年10万トン以上の事業者を対象に<strong>2026年度から義務ベースで本格稼働</strong>します。2027年度秋ごろに排出枠取引市場が開設され、<strong>2033年度から発電部門を対象とした有償オークション</strong>が始まる予定です。価格の急変動に備えた上下限価格も置かれます。</p>
<p>EU の20年を物差しにすると、日本はいま EU の初期フェーズ（無償割当が中心だった時期）にあたり、2033年度の発電有償化は EU が2013年に踏んだ「発電＝オークション」の節目に対応します。<strong>EUが排出削減を最も大きく動かした転換点に、日本は約20年遅れで向かおうとしている</strong>わけです。ただしこれはEUの結果が日本で再現されるという予言ではなく、同じ設計上の節目を時間差で迎えるという構造の対応です（産業構造・電源構成・電力市場制度が異なるため、同じ政策が同じ排出経路をたどる保証はありません）。</p>

<h2>蓄電池ビジネスへの3つの意味</h2>
<p>炭素価格は遠い制度の話ではなく、系統用蓄電池の事業環境を直接動かします。</p>
<ol>
<li><strong>電力市場の構造変化</strong>：炭素価格が上がると火力の限界費用（1kWh発電するコスト）が上がり、卸電力市場の価格水準やスパイクの構造が変わります。蓄電池の<strong>裁定取引（安く充電・高く放電）や調整力の価値</strong>は、この火力コストの動きと裏表です。EUで発電が有償化されたフェーズ3以降に電力市場が大きく動いたように、日本も2033年度の発電有償化に向けて市場構造が変わっていきます。</li>
<li><strong>GX予算と補助金の入口要件</strong>：GX-ETS は GX 政策パッケージの一部です。すでに<strong>令和7年度補正の系統用蓄電池補助金（SII執行）では「GXフューチャー・リーグ会員」であることが応募要件になる方針</strong>（個社で2030年度排出量目標＋GX需要創出コミットメントの提出。中小企業は除く）が示されています。炭素政策と資金調達が直結し始めており、補助金を取りに行く事業者にとって制度ウォッチが実利になります。</li>
<li><strong>脱炭素価値の明示化</strong>：蓄電池は再エネを捨てずに使う装置です。炭素価格が上がるほど、化石燃料に対する再エネ＋蓄電池の相対的な価値が高まります。カーボンプライシングの強化は、蓄電所の事業性を底上げする方向に働きます。</li>
</ol>

<h2>まとめ</h2>
<p>EU ETS は「炭素価格が電源と投資を動かす」ことを20年かけて実証しました。日本の GX-ETS の本格化は、蓄電池事業の前提条件が変わっていく過程そのものです。コスト（<a href="/explainer/lcoe-and-bess-economics">LCOEと蓄電池の経済性</a>）と電源構成（<a href="/explainer/lcoe-and-power-mix">LCOEと電源構成</a>）に続き、制度というもう一段上のルールも、蓄電所の収益と資金調達に効いてきます。制度の動きは <a href="/policy-calendar">政策カレンダー</a> で追えます。</p>`;

const PAYLOAD = {
  title: 'EU ETSとGX-ETS ─ 排出量取引は蓄電池ビジネスに何をもたらすか',
  slug: SLUG,
  category: ['制度'],
  lead: '炭素に価格をつける排出量取引。20年先行するEU ETSは無償枠を約76%縮め、発電部門の排出を約55%減らした。日本のGX-ETSは2026年度に義務化、2033年度に発電を有償化する。カーボンプライシングは火力のコストを通じて電力市場を変え、系統用蓄電池の収益機会と補助金要件の両方に直結する。',
  body: BODY,
  sources: 'European Environment Agency (EEA), EU ETS Data Viewer（EU全体・年次）／ 経済産業省「排出量取引制度（GX-ETS）」／ EIC Data Insight #75「EU ETS×日本GX-ETS」 data.eic-jp.org（CC BY 4.0、200確認済 2026-06-09）／ SII 令和7年度補正 系統用蓄電システム等導入支援事業（GXフューチャー・リーグ要件）',
  relatedTerms: '需給調整市場,容量市場,卸電力市場（JEPX）,系統用蓄電池',
};

async function main(): Promise<void> {
  console.log(`[post-explainer-eu-ets-gx-ets] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`slug: ${SLUG}`);
  console.log(`#75 URL: ${INSIGHT75_URL}`);
  console.log(`data glossary cross-links: eu-ets=${DATA_GLOSSARY_EU_ETS}, gx-ets=${DATA_GLOSSARY_GX_ETS}, carbon-pricing=${DATA_GLOSSARY_CARBON}`);

  const existing = await findBySlug(SLUG);
  if (existing) {
    console.log(`[skip] ${SLUG} — already exists (id=${existing.id})`);
    return;
  }

  if (DRY_RUN) {
    console.log(`[dry-run] POST ${SLUG}`);
    console.log(`  title: ${PAYLOAD.title}`);
    console.log(`  category: ${PAYLOAD.category.join(', ')}`);
    console.log(`  relatedTerms: ${PAYLOAD.relatedTerms}`);
    console.log(`  body: ${PAYLOAD.body.length} chars`);
    console.log(`  body preview (first 200): ${PAYLOAD.body.slice(0, 200)}`);
    return;
  }

  const result = (await api('POST', BASE, PAYLOAD)) as { id: string };
  console.log(`[ok] ${SLUG} — created id=${result.id}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
