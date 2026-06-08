/**
 * scripts/post-explainer-lcoe-power-mix.ts
 *
 * 解説#2「LCOEと電源構成」を microCMS explainer に POST。
 * 使い方: npx tsx scripts/post-explainer-lcoe-power-mix.ts [--dry-run]
 *
 * 出典:
 *   - NREL ATB 2024（CC BY 4.0・米国前提コスト序列）
 *   - 経産省 電力調査統計（meti-gen-*、日本の電源構成シェア）
 *   - Insight #74「LCOE×電源構成」(data.eic-jp.org, 200確認済 2026-06-08)
 *   - 注記：LCOEは米国前提の相対比較参考値。日本のコストそのものではない。
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

const SLUG = 'lcoe-and-power-mix';

// #74永続URL: 2026-06-08 curl 200確認済み → リンク化
const INSIGHT74_URL = 'https://data.eic-jp.org/insight/lcoe-vs-power-mix';

const BODY = `<h2>LCOEで見ると、最も安い電源は再エネ</h2>
<p>発電コストの指標 <a href="/glossary/lcoe">LCOE</a>（均等化発電原価）で電源を並べると、いま最も安いのは再生可能エネルギーです。米エネルギー省 NREL の ATB（2024年版、$/MWh、米国前提）では次の序列になります。</p>
<ul>
<li>陸上風力：<strong>20.7</strong>／太陽光（ユーティリティ）：<strong>43.2</strong>（最安グループ）</li>
<li>地熱：70.2／火力（ガス・石炭、概数）：約40〜80</li>
<li>水力：115.0／原子力：126.6／バイオマス：195.5（高コストグループ）</li>
</ul>
<p>陸上風力と大規模太陽光は、原子力や水力の半分以下のコストです。<strong>※</strong>これはNREL ATBによる<strong>米国前提のコスト序列</strong>で、日本の実コストそのものではありません（相対比較の参考として用います）。</p>

<h2>ところが、日本の電源構成は真逆に近い</h2>
<p>では日本で実際に使われている電源（2025年・発電量シェア）はどうか。経済産業省の電力調査統計をもとに見ると、コストが安い電源ほど、むしろシェアが小さいことが分かります。</p>
<ul>
<li>火力：<strong>73.7%</strong>（最大）</li>
<li>原子力：11.2%／水力：9.5%</li>
<li>太陽光：4.1%／バイオマス：4.1%／陸上風力：<strong>1.3%</strong>／地熱：0.2%</li>
<li>（再エネ計：約19.1%）</li>
</ul>
<p>LCOEで最安の陸上風力はわずか1.3%、太陽光も4.1%。一方、LCOEでは中位以上の火力が7割超を占めています。<strong>「最も安い電源」と「最も使われている電源」が一致しない</strong>──これがコスト序列と普及のギャップです。</p>

<h2>なぜギャップが生まれるのか ── LCOEは「いつ発電できるか」を測らない</h2>
<p>理由は、LCOEが<strong>平均コストだけを見て、発電のタイミングを測らない</strong>指標だからです。太陽光は昼だけ、風力は風次第でしか発電できません。需要は夜も止まらないのに、安い再エネは「必要なときに必ず出せる」わけではないのです。一方、火力は燃料さえあれば出力を調整でき、需要に合わせて供給できます。だから、コストが高くても「使える電源」として主役を続けています。</p>
<p>東京電力エリアでは2026年3月に管内で初めて再エネの出力制御（発電を一時的に止める措置）が実施されました。安い再エネが増えても、変動を吸収できなければ、せっかくの電気を捨てることになります。</p>

<h2>ギャップを埋める鍵 ── 系統用蓄電池</h2>
<p>このギャップを埋めるのが<strong>系統用蓄電池</strong>です。安い再エネが余るときに充電し、足りないときに放電する。これにより、変動する再エネを「必要なときに使える電力」へ変換できます。つまり、<strong>再エネのコストが安くなるほど、その安さを実際に活かすための蓄電池の価値が高まる</strong>という関係です。</p>
<p>蓄電池はこの調整の対価を、卸電力市場の裁定・容量市場・<a href="/glossary/balancing-market">需給調整市場</a>から得ます。その経済性の見方は、解説<a href="/explainer/lcoe-and-bess-economics">「LCOEと蓄電池の経済性」</a>で詳しく扱っています。</p>

<h2>まとめ</h2>
<p>LCOEで最安の再エネが、日本ではまだ主役になれていない。その差は「コストの低さ」ではなく「変動性」にあります。安い再エネを主力電源に変えるための装置が系統用蓄電池であり、再エネ拡大と蓄電池導入は同じコインの裏表です。電源別コストと電源構成の詳しいデータは、データ面の解説（<a href="${INSIGHT74_URL}">Insight #74「LCOE×電源構成」</a>）も参照してください。</p>`;

const PAYLOAD = {
  title: 'LCOEと電源構成 ─ 最も安い電源が、なぜ日本で主役になれないのか',
  slug: SLUG,
  category: ['市場統計'],
  lead: 'LCOE（発電原価）で見ると、いま最も安い電源は陸上風力と太陽光。ところが日本の電源構成では、その2つの合計はわずか数%で、最大は依然として火力が7割超。この「コスト序列」と「普及」のギャップはなぜ生まれ、系統用蓄電池がどう橋渡しするのかを解説する。',
  body: BODY,
  sources: 'NREL Annual Technology Baseline (ATB) 2024, OEDI, CC BY 4.0（LCOE・米国前提コスト序列） ／ 経済産業省 電力調査統計（日本の電源構成シェア・meti-gen-*、bess-net catalog） ／ EIC Data Insight #74「LCOE×電源構成」(data.eic-jp.org, CC BY 4.0)',
  relatedTerms: 'LCOE（均等化発電原価）,卸電力市場（JEPX）,需給調整市場,容量市場,系統用蓄電池',
};

async function main(): Promise<void> {
  console.log(`[post-explainer-lcoe-power-mix] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`slug: ${SLUG}`);
  console.log(`#74 URL: ${INSIGHT74_URL}`);

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
