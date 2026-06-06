/**
 * scripts/post-explainer-lcoe.ts
 *
 * 解説#1「LCOEと蓄電池の経済性」を microCMS explainer に POST。
 * 使い方: npx tsx scripts/post-explainer-lcoe.ts [--dry-run]
 */

// import で module スコープにして他スクリプトとの変数衝突を回避
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

const SLUG = 'lcoe-and-bess-economics';

const BODY = `<h2>LCOEとは何か ── 発電コストの共通ものさし</h2>
<p>LCOE（Levelized Cost of Energy／均等化発電原価）は、ある電源が生涯にわたって発電する電力1MWhあたりの平均コストを示す指標です。建設費・運転維持費・燃料費などの総額を、その設備が生涯に発電する総電力量で割って求めます。太陽光・風力・原子力といった<strong>異なる電源を横並びで比較する</strong>ために広く使われています。</p>
<p>参考までに、米エネルギー省 NREL の Annual Technology Baseline（ATB, 2024年版）による主要電源のLCOEは次の水準です（$/MWh、米国前提）。</p>
<ul>
<li>陸上風力：<strong>20.7</strong>／太陽光（ユーティリティ）：<strong>43.2</strong> ── 最も安い部類</li>
<li>地熱：70.2／CSP（集光型太陽熱）：93.3／太陽光（商業用）：95.1</li>
<li>洋上風力：112.2／水力：115.0／原子力：<strong>126.6</strong>（2023年版）／バイオマス：195.5</li>
</ul>
<p>陸上風力と大規模太陽光が、原子力や水力を大きく下回っていることが分かります。火力（ガス・石炭）は本データセットに安定した代表値がありませんが、一般に40〜80$/MWh前後とされ、陸上風力・大規模太陽光はこの水準も下回ってきています。</p>
<p><strong>※注意：</strong>上記はNREL ATBによる<strong>米国コスト前提の推計値で、日本のLCOEそのものではありません</strong>。電源間の相対的なコスト構造を見るための参考として用います（円換算は1MWhあたり、USD/JPY=158.34で約 風力3.3円/kWh・太陽光6.8円/kWh・原子力20.0円/kWh）。</p>

<h2>なぜ蓄電池にLCOEをそのまま使えないのか</h2>
<p>ここで重要なのは、<strong>系統用蓄電池は「発電」しない</strong>という点です。蓄電池は電気を作り出すのではなく、安いとき・余っているときに充電し、必要なときに放電する"エネルギーの移動装置"です。LCOEの計算式は分母に「生涯発電量」を置きますが、蓄電池にはそもそも発電量がありません。つまり、LCOEの枠組みは蓄電池の経済性を測る物差しとして<strong>構造的に噛み合いません</strong>。</p>
<p>「蓄電池のコストをLCOEで比較する」という説明を見かけることがありますが、これは厳密には誤りか、少なくとも誤解を招く表現です。</p>

<h2>正しいものさしは「LCOS」</h2>
<p>蓄電池の原価を測る指標は、LCOEではなく <strong>LCOS（Levelized Cost of Storage／均等化蓄電原価）</strong> です。設備費・運転維持費に加えて<strong>充電に使う電力の購入費</strong>を含めた総コストを、生涯の<strong>放電量</strong>で割って求めます。</p>
<p>LCOSは単一の決まった値があるわけではなく、<strong>設備コスト（CAPEX）を起点に、運用の前提次第で大きく変わります</strong>。NREL ATB（2024年版）では系統用4時間蓄電池のCAPEXは <strong>約525$/kWh（約8.3万円/kWh、158.34円/＄換算）</strong> です（2021年の約359$/kWhからサプライチェーン高で上昇、米国前提）。この設備コストに、次の3要素が効いてLCOSが決まります。</p>
<ul>
<li><strong><a href="/glossary/cycle-life">サイクル寿命</a></strong>：何回充放電を繰り返せるか。生涯放電量＝分母を左右します。</li>
<li><strong>充放電効率（ラウンドトリップ効率）</strong>：充電した電力のうち放電で取り出せる割合。失われる分はそのままコストになります。</li>
<li><strong>充電電力費</strong>：いくらで充電するか。市場価格に依存します。</li>
</ul>
<p>つまり同じ設備でも、「安く充電し、効率よく、多サイクル使う」ほどLCOSは下がります。</p>

<h2>コストだけでは語れない ── 蓄電所は「収益の積み上げ」で見る</h2>
<p>ここがLCOE/LCOSと蓄電所ビジネスの最大の違いです。発電所はLCOE（コスト）の低さがほぼそのまま競争力ですが、<strong>蓄電所はコスト（LCOS）だけでは投資判断できません</strong>。蓄電池の価値は、複数の電力市場から得る<strong>収益の積み上げ</strong>で決まるからです。</p>
<ul>
<li><strong>卸電力市場（JEPX）の裁定</strong>：安い時間帯に充電し、高い時間帯に放電して価格差を取る。</li>
<li><strong><a href="/glossary/capacity-market">容量市場</a>（kW価値、OCCTO運営）</strong>：将来の供給力を提供することへの対価。</li>
<li><strong><a href="/glossary/balancing-market">需給調整市場</a>（ΔkW価値、5商品）</strong>：周波数維持などの調整力を提供することへの対価。</li>
</ul>
<p>とくに需給調整市場では、同じ商品でも<strong>電源の種類によって約定価格が大きく異なります</strong>。たとえば三次調整力②（FY2024・年平均）の単価は、新型リソースと従来型でおよそ次のように分かれています（単位：円/ΔkW・30分）。</p>
<ul>
<li>蓄電池：<strong>109.43</strong> ／ VPP：46.24（新型）</li>
<li>火力：4.90 ／ 水力：1.82 ／ 揚水：0.72（従来型）</li>
</ul>
<p>新型（蓄電池・VPP）と従来型（火力・水力・揚水）でおよそ150倍の開きがあり、これが蓄電池の収益機会の大きさを示しています。<strong>ただし注意が必要です。</strong>この単価は約定が成立したときの"水準"であり、約定量で加重した平均ではありません。したがって「単価 × 自社の全保有量」で収益を見積もると過大評価になります。実際の収益は「単価 × 自社の入札量 × 落札率（どれだけ稀少な時間に当たるか）」で考える必要があります。電源種別の<a href="/tools/balancing-revenue">需給調整市場 約定価格比較</a>は当サイトのツールで確認できます。</p>

<h2>まとめ ── 蓄電所の経済性の見方</h2>
<p>整理すると、系統用蓄電池の経済性は次の式で捉えるのが正確です。</p>
<p><strong>経済性 ＝ 複数市場からの収益（卸裁定＋容量＋需給調整） − LCOS（原価） − 運用コスト</strong>、さらに稼働率と落札率で調整。</p>
<p>「LCOEが安いか」ではなく、「LCOSをどれだけ抑え、複数市場の収益をどれだけ積み上げられるか」が蓄電所投資の本質です。具体的な収益シミュレーションは、当サイトの<a href="/tools/irr-simulator">IRRシミュレーター</a>や<a href="/tools/balancing-revenue">需給調整市場 収益比較ツール</a>で試算できます。また需給調整市場の最新動向は<a href="/tracker/imbalance">需給調整市場トラッカー</a>でご確認いただけます。</p>`;

const PAYLOAD = {
  title: 'LCOEと蓄電池の経済性 ─ なぜ蓄電所は「LCOS」で見るべきか',
  slug: SLUG,
  category: ['市場統計'],
  lead: 'LCOE（均等化発電原価）は発電コストを比べる物差しだが、発電しない蓄電池にそのまま当てはめると誤解を生む。系統用蓄電池の経済性を測る正しい指標 LCOS と、コストだけでは語れない複数市場の収益構造を、データとともに解説する。',
  body: BODY,
  sources: 'NREL Annual Technology Baseline (ATB), Open Energy Data Initiative (OEDI), CC BY 4.0 ／ data.eic-jp.org ／ EPRX年次PDF（需給調整、bess-net catalog balancing-price-tertiary-2-*、2026-05-28）／ OCCTO・JEPX',
  relatedTerms: 'サイクル寿命,需給調整市場,容量市場,フルマーチャント',
};

async function main(): Promise<void> {
  console.log(`[post-explainer-lcoe] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`slug: ${SLUG}`);

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
    return;
  }

  const result = (await api('POST', BASE, PAYLOAD)) as { id: string };
  console.log(`[ok] ${SLUG} — created id=${result.id}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
