/**
 * scripts/patch-pmpt-unit-2026-08-22.ts
 * glossary/power-market-price-trend の detail から「需給調整市場を 円/kW・年 で書いた誤記」を是正。
 *
 * 誤記（修正前・detail 第2段落の (3)）:
 *   「（3）需給調整市場：一次調整力（GF）3,000〜10,000円/kW・年、二次調整力（LFC）2,000〜8,000円/kW・年、
 *     三次調整力500〜5,000円/kW・年、」
 *   → 需給調整市場のΔkW価値の単位は 円/ΔkW・30分。円/kW・年 は容量市場のkW価値の単位で、市場の取り違え。
 *     桁も合わない（一次の上限 10.00 円/ΔkW・30分 は通年フル落札で 175,200 円/kW・年 相当）。
 *     一方 3,000〜10,000 円/kW・年 は同段落 (2) の容量市場 5,242 円/kW とほぼ同帯。
 *
 * ★方針: 出典のない数値レンジを別の出典のない数値レンジに置き換えない。
 *   出典のある単位・数値（円/ΔkW・30分）へ置き換え、年間収益（円/kW・年）の一律レンジは記載しない。
 *   同段落 (2) 容量市場の 5,242 円/kW（＝kW価値・正しい単位系）には触れない。
 *
 * 一次確認済の事実（EPRX「需給調整市場のΔkW上限価格について」2026/7/30更新。単位は全て 円/ΔkW・30分）:
 *   2024/04/01〜2026/03/13 実需給分 … 複合19.51 / 一次19.51 / 二次①19.51 / 二次②7.21 / 三次①7.21 / 三次②上限無し
 *   2026/03/14〜2026/08/31 実需給分 … 複合15.00 / 一次15.00 / 二次①15.00 / 二次②7.21 / 三次①7.21 / 三次②上限無し
 *   2026/09/01〜当面の間          … 複合10.00 / 一次10.00 / 二次①10.00 / 二次②7.21 / 三次①7.21 / 三次②上限無し
 *   出典 https://www.eprx.or.jp/information/post.php
 *   根拠 第4回 電力安定供給WG（2026/7/14）資料6 スライド22 ／ 第96回 制度検討作業部会（2024/9/27）資料3 スライド45
 *
 * 実勢（リポジトリ内の既存出典を再利用・新規に数値を作らない）:
 *   src/data/eic/balancing-price-primary.json         points 2024-04-01=3.1 / 2025-04-01=3.63
 *   src/data/eic/balancing-price-primary-battery.json points 2024-04-01=15.99 / 2025-04-01=11.41
 *   いずれも unit=円/ΔkW・30分・aggregation=annual_mean・出典「電力需給調整力取引所 取引実績の取りまとめ結果」。
 *   ★上限価格ではなく約定実績の平均。単純平均で volume-weighted ではない。2025-04-01 は FY2025 上期の暫定値。
 *
 * 設計（敵対的レビューで草案の破綻を検出したため、下記3点を満たす構造にした）:
 *   1) 第2段落は「主要市場の価格動向（2024年時点）は、（1）…（5）…、と多様な価格水準が並列している。」という
 *      句点1個の単一文。ここへ長文を差し込むと係り受けが切れ、(4)(5) が埋没する。
 *      → (3) は他項目と同じ長さ・体言止め・読点終わりの断片に留め、詳細は直後の新段落に置く。
 *   2) 段落冒頭の「（2024年時点）」と矛盾させない。→ (3) には FY2024 の値のみを置き、
 *      2026年の上限価格と FY2025 上期は次段落（時点を自前で明示）に置く。
 *   3) 「実勢は上限より低い」と書かない。蓄電池の実績 15.99/11.41 は新上限 10.00 を上回るため
 *      字面が破綻する。→「引下げ前の実績」であることと、9/1 以降は上限以下になることを明記する。
 *
 * 作法: GET 先行／from の一意ヒットを PATCH 前に確認／追記ではなく置換（新段落は同一の置換操作で挿入）／
 *       冪等キーは marker 方式（#122）／PATCH 後 GET 全field照合（正規化差と意図未達を区別）／
 *       DELETE・PUT 不使用／他フィールド不変。
 * 実行: npx tsx --env-file=.env.local scripts/patch-pmpt-unit-2026-08-22.ts [--dry-run]
 */
export {};
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const URL_ = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/glossary/zw7tk0bme`;
const SKIP = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

type Rep = { from: string; to: string; marker: string; note: string };

const REPS: Rep[] = [
  {
    note: '(3) の行: 単位を是正し、他項目と同じ長さ・体言止めの断片に揃える（2024年時点と整合）',
    from: '（3）需給調整市場：一次調整力（GF）3,000〜10,000円/kW・年、二次調整力（LFC）2,000〜8,000円/kW・年、三次調整力500〜5,000円/kW・年、',
    to: '（3）需給調整市場：単位は容量市場のkW価値（円/kW・年）ではなくΔkW価値の円/ΔkW・30分で、一次調整力の年間平均落札単価はFY2024（通年）が全電源3.10円/ΔkW・30分・蓄電池のみ15.99円/ΔkW・30分（上限価格と期間別は次段落）、',
    marker: '一次調整力の年間平均落札単価はFY2024（通年）が全電源3.10円/ΔkW・30分',
  },
  {
    note: '第2段落の直後に、単位の区別・上限価格3期・実勢・一律レンジ不可・ツール導線・出典を持つ新段落を挿入',
    from: 'と多様な価格水準が並列している。</p>',
    to: 'と多様な価格水準が並列している。</p>'
      + '<p><strong>需給調整市場の単位と上限価格</strong>：需給調整市場で取引されるΔkW価値の単位は<strong>円/ΔkW・30分</strong>'
      + '（ΔkWは調整に充てる出力幅、30分は取引の1コマ）であり、容量市場のkW価値の単位である円/kW・年とは異なる。'
      + 'ΔkW上限価格は、一次調整力・二次調整力①・複合商品で、'
      + '<strong>2024年4月1日実需給分から2026年3月13日実需給分まで19.51円/ΔkW・30分</strong>、'
      + '<strong>2026年3月14日実需給分から2026年8月31日実需給分まで15.00円/ΔkW・30分</strong>、'
      + '<strong>2026年9月1日実需給分から当面の間10.00円/ΔkW・30分</strong>'
      + '（二次調整力②・三次調整力①は7.21円/ΔkW・30分を当面継続、三次調整力②は上限なし）。'
      + '実勢の水準は上限価格とは別で、年間平均落札単価（<strong>上限価格ではなく約定実績の平均</strong>）は一次調整力で、'
      + 'FY2024（通年）が全電源3.10円/ΔkW・30分・蓄電池のみ15.99円/ΔkW・30分、'
      + 'FY2025上期（暫定・2025年4〜9月のみ）が全電源3.63円/ΔkW・30分・蓄電池のみ11.41円/ΔkW・30分'
      + '（単純平均で約定量による加重をしていないため、蓄電池の高値は小さな約定量に乗る。通年と上期は対象期間が非対称で推移としては比較できない）。'
      + 'これらはいずれも上限引下げ前の実績であり、2026年9月1日実需給分以降は上限のある商品の約定単価は10.00円/ΔkW・30分以下になる。'
      + 'なお<strong>年間収益（円/kW・年）の一律のレンジは示せない</strong>。提供容量・年間提供コマ数・商品別の落札率で結果が大きく変わるためで、'
      + '前提を置いた試算は<a href="/tools/balancing-revenue">需給調整 収益シナリオ（蓄電池）</a>で行える。'
      + '出典: <a href="https://www.eprx.or.jp/information/post.php" target="_blank" rel="noopener">電力需給調整力取引所「需給調整市場のΔkW上限価格について」（2026年7月30日更新）</a>'
      + '（根拠: 一次調整力・二次調整力①・複合商品＝第4回 電力安定供給ワーキンググループ〔2026年7月14日〕資料6 スライド22、'
      + '二次調整力②・三次調整力①＝第96回 制度検討作業部会〔2024年9月27日〕資料3 スライド45）。'
      + '年間平均落札単価は電力需給調整力取引所「取引実績の取りまとめ結果」より転記・編集。</p>',
    marker: '需給調整市場の単位と上限価格',
  },
  {
    note: '出典欄に電力需給調整力取引所（EPRX）を追加（EPRX 利用規約が出典明示を要求。catalog の license_notice 準拠）',
    from: '<li>OCCTO（電力広域的運営推進機関）公表資料</li>',
    to: '<li>OCCTO（電力広域的運営推進機関）公表資料</li><li>電力需給調整力取引所（EPRX）「需給調整市場のΔkW上限価格について」「取引実績の取りまとめ結果」</li>',
    marker: '電力需給調整力取引所（EPRX）「需給調整市場のΔkW上限価格について」',
  },
];

async function api(method: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(URL_, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function main(): Promise<void> {
  const before = (await api('GET')) as Record<string, unknown>;
  if (before.slug !== 'power-market-price-trend') throw new Error(`slug 不一致: ${String(before.slug)}`);
  let next = String(before.detail);
  console.log(`glossary/power-market-price-trend (zw7tk0bme)  detail ${next.length}字`);

  let applied = 0, done = 0;
  for (const rep of REPS) {
    if (next.includes(rep.marker)) { done++; console.log(`  [skip] ${rep.note} — 既に反映済み（marker 一致）`); continue; }
    const n = next.split(rep.from).length - 1;
    if (n !== 1) { console.error(`  ✗ from が ${n} 回出現（1回でない）: ${rep.note}`); process.exit(1); }
    next = next.replace(rep.from, rep.to);
    applied++;
    console.log(`  → ${rep.note}（from 一意ヒット）`);
  }
  if (applied === 0) { console.log(`  [skip] 全置換が反映済み（${done}/${REPS.length}）— 冪等スキップ`); return; }
  console.log(`  detail ${String(before.detail).length} → ${next.length}字（適用 ${applied} / 既反映 ${done}）`);
  if (DRY_RUN) { console.log('  [dry-run] PATCH detail のみ'); return; }

  await api('PATCH', { detail: next });
  await new Promise((r) => setTimeout(r, 900));
  const after = (await api('GET')) as Record<string, unknown>;

  let bad = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (SKIP.has(k) || k === 'detail') continue;
    if (JSON.stringify(after[k]) !== JSON.stringify(before[k])) { bad++; console.log(`  ✗ ${k}: 意図しない変化`); }
  }
  const nd = String(after.detail);
  if (nd === next) console.log(`  ✓ detail: 反映一致（${nd.length}字・正規化なし）`);
  else if (REPS.every((r) => nd.includes(r.marker))) console.log(`  ✓ detail: 反映（${nd.length}字・microCMS 正規化あり＝送信値と文字列一致せず・意図の文言は全て含む）`);
  else { bad++; console.log('  ✗ detail: 意図の文言が入っていない'); }

  const checks: Array<[string, boolean]> = [
    ['旧「3,000〜10,000円/kW・年」が消えている', !nd.includes('3,000〜10,000円/kW・年')],
    ['旧「2,000〜8,000円/kW・年」が消えている', !nd.includes('2,000〜8,000円/kW・年')],
    ['旧「500〜5,000円/kW・年」が消えている', !nd.includes('500〜5,000円/kW・年')],
    ['★容量市場の「5,242円/kW（東京エリア）」は不変', nd.includes('約定価格5,242円/kW（東京エリア）')],
    ['★JEPX の 円/kWh 記述は不変', nd.includes('年平均10〜15円/kWh')],
    ['★非化石の 円/kWh 記述は不変', nd.includes('FIT非化石0.3〜1.4円/kWh')],
    ['19.51円/ΔkW・30分', nd.includes('19.51円/ΔkW・30分')],
    ['15.00円/ΔkW・30分', nd.includes('15.00円/ΔkW・30分')],
    ['10.00円/ΔkW・30分', nd.includes('10.00円/ΔkW・30分')],
    ['7.21円/ΔkW・30分を当面継続', nd.includes('7.21円/ΔkW・30分を当面継続')],
    ['三次調整力②は上限なし', nd.includes('三次調整力②は上限なし')],
    ['実績 3.10 / 3.63（全電源）', nd.includes('全電源3.10円/ΔkW・30分') && nd.includes('全電源3.63円/ΔkW・30分')],
    ['実績 15.99 / 11.41（蓄電池）', nd.includes('蓄電池のみ15.99円/ΔkW・30分') && nd.includes('蓄電池のみ11.41円/ΔkW・30分')],
    ['「上限価格ではなく約定実績の平均」の明記', nd.includes('上限価格ではなく約定実績の平均')],
    ['FY2025 が上期・暫定である明記', nd.includes('FY2025上期（暫定・2025年4〜9月のみ）')],
    ['期間非対称の注記', nd.includes('通年と上期は対象期間が非対称')],
    ['年間収益の一律レンジは示せない', nd.includes('年間収益（円/kW・年）の一律のレンジは示せない')],
    ['ツールへの内部リンク', nd.includes('href="/tools/balancing-revenue"')],
    ['出典URL', nd.includes('eprx.or.jp/information/post.php')],
    ['根拠 資料6 スライド22', nd.includes('資料6 スライド22')],
    ['根拠 資料3 スライド45', nd.includes('資料3 スライド45')],
    ['出典欄に EPRX を追加', nd.includes('電力需給調整力取引所（EPRX）「需給調整市場のΔkW上限価格について」')],
  ];
  for (const [label, cond] of checks) { console.log(`  ${cond ? '✓' : '✗'} ${label}`); if (!cond) bad++; }
  console.log(`\n[patch-pmpt-unit] 意図外の変化・未達 ${bad}件`);
  if (bad) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
