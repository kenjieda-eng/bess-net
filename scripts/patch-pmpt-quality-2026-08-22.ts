/**
 * scripts/patch-pmpt-quality-2026-08-22.ts
 * glossary/power-market-price-trend (zw7tk0bme) の記事品質を一度で整える。
 *
 * 背景: 容量市場の資料を土台に他市場を後付けした形跡があり、単発の誤りではない。
 *   8/22 に (3) 需給調整市場は出典付きに是正済み（commit 6a1a56a）。本便はその他を揃える。
 *
 * ── フェーズ0 の調査結果（実データ） ───────────────────────────────────────
 * (1) JEPX スポット「年平均10〜15円/kWh、夏冬ピーク30〜50円/kWh、ひっ迫時100円/kWh超」
 *     src/data/eic/jepx-spot-system.json（JEPX スポット システムプライス・unit ¥/kWh・
 *     aggregation daily_mean「48コマの単純平均」・2012-04-01〜・publisher 日本卸電力取引所）
 *     → 日次平均の年度集計は出典化できる: FY2024（2024/4〜2025/3・n=365）平均 12.29 / 最小 5.43 / 最大 19.30
 *       （参考 FY2023 10.74・FY2025 11.06）
 *     → ★「夏冬ピーク時間帯30〜50円/kWh」「需給ひっ迫時100円/kWh超」は 30分コマ単位の値で、
 *       自前データ（日次平均）では出典化できない → 数値を削除し定性説明に置き換える（依頼 (c) 前者）
 *
 * (2) 容量市場「2024年度実需給対応で約定価格5,242円/kW（東京エリア）」
 *     src/data/eic/capacity-main-auction-price-*.json（OCCTO「容量市場 メインオークション約定結果」・
 *     unit ¥/kW・aggregation annual_auction・source_url https://www.occto.or.jp/capacity-market/yoryoshijyo/main/data/）
 *     → ★二重の誤り。2024年度実需給対応は 全9エリア一律 14,137 円/kW（東京も 14,137）。
 *       5,242 円/kW は 2025年度実需給対応の 北海道・九州 の値（同年度の東京は 3,495 円/kW）。
 *     → 出典化して是正する。
 *
 * (4) 非化石価値「FIT非化石0.3〜1.4円/kWh、非FIT非化石0.6〜1.2円/kWh」
 *     src/data/eic/nonfossil-cert-{fit,nonfit,nonfit-re}-price.json（JEPX「非化石価値取引市場 オークション結果」）
 *     → FIT: 2018-05-18〜2026-05-22 の全32回で 0.3〜1.3（★1.4 は誤り）
 *       非FIT（再エネ指定なし）: 2020-11-11〜2026-05-20 の全23回で 0.6〜1.3（★1.2 は誤り）
 *       非FIT（再エネ指定）:     2020-11-12〜2026-05-21 の全23回で 0.6〜1.3
 *     → 出典化して是正する。
 *
 * (a) 重複段落: <p> 7個のうち P6 と P7 が HTML 含め完全一致（249字）。連結は本文に1回だけ出現。
 *     → 後に出現する P7 を段落タグごと削除（P6 を残す）。
 * (d) subcategory: 現在「容量市場」。本記事は JEPX・容量市場・需給調整市場・非化石・先渡を横断し、
 *     本文の市場名言及も 需給調整8/容量7/非化石4/JEPX3/先渡2 で容量市場に寄っていない。
 *     → glossary 1,528件で実在する値（119種）のうち「市場制度_一般」（28件）へ変更。
 *       ★実在しない値は送らない（#106: 未定義値は silently drop）。
 * (e) 8/22 に追加した (3) の記述（19.51/15.00/10.00・円/ΔkW・30分・EPRX出典）は維持する。
 *
 * 作法: GET 先行／from の一意ヒットを PATCH 前に確認／冪等キーは marker 方式（#122）／
 *       PATCH 後 GET 全field照合（正規化差と意図未達を区別）／DELETE・PUT 不使用。
 * 実行: npx tsx --env-file=.env.local scripts/patch-pmpt-quality-2026-08-22.ts [--dry-run]
 */
export {};
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const URL_ = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/glossary/zw7tk0bme`;
const SKIP = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

const DUP_PARA =
  '<p>2030年代以降のグローバル脱炭素化加速・電力市場進化・電化進展・産業構造転換の中で、本領域は日本のエネルギー転換・産業競争力強化・経済安全保障確保の重要要素として位置付けられます。海外先進事例（米国・欧州・豪州・中国等）の継続把握、グローバル業界団体・国際標準化機関への参画、海外プロジェクト機会の探索、日本企業の海外展開支援機関（JBIC・JICA・JOGMEC等）との連携、ESG・サステナビリティ・グリーンファイナンス対応の高度化が、中長期競争力の基盤として戦略的に重要です。</p>';

type Rep = { from: string; to: string; marker: string; note: string };

const REPS: Rep[] = [
  {
    note: '(1) JEPX: 日次平均の年度集計で出典化。コマ単位のピーク／ひっ迫時の数値は自前データで出典化できないため削除し定性説明へ',
    from: '（1）JEPXスポット市場：年平均10〜15円/kWh、夏冬ピーク時間帯30〜50円/kWh、需給ひっ迫時100円/kWh超、',
    to: '（1）JEPXスポット市場：システムプライスの日次平均（48コマの単純平均）をFY2024（2024年4月〜2025年3月・365日）で平均すると12.29円/kWh、同期間の日次平均は最小5.43円/kWh・最大19.30円/kWh（30分コマ単位のピーク価格や需給ひっ迫時の高値は日次平均には現れないため、コマ単価は時系列で確認する）、',
    marker: 'システムプライスの日次平均（48コマの単純平均）をFY2024',
  },
  {
    note: '(2) 容量市場: 2024年度実需給対応の東京は 5,242 ではなく 14,137 円/kW（全9エリア一律）。5,242 は 2025年度実需給対応の北海道・九州',
    from: '（2）容量市場メインオークション：2024年度実需給対応で約定価格5,242円/kW（東京エリア）、',
    to: '（2）容量市場メインオークション：2024年度実需給対応の約定価格は全9エリア一律14,137円/kW、2025年度実需給対応は東京3,495円/kW・北海道および九州5,242円/kW（単位は円/kW・年）、',
    marker: '2024年度実需給対応の約定価格は全9エリア一律14,137円/kW',
  },
  {
    note: '(4) 非化石: 全回次の約定価格の実レンジへ是正（FIT 上限は 1.4 ではなく 1.3、非FIT 上限は 1.2 ではなく 1.3）',
    from: '（4）非化石価値取引市場：FIT非化石0.3〜1.4円/kWh、非FIT非化石0.6〜1.2円/kWh、',
    to: '（4）非化石価値取引市場：FIT非化石は2018年5月以降の全32回の約定価格が0.3〜1.3円/kWh、非FIT非化石は再エネ指定なし・再エネ指定とも2020年11月以降の全23回で0.6〜1.3円/kWh、',
    marker: 'FIT非化石は2018年5月以降の全32回の約定価格が0.3〜1.3円/kWh',
  },
  {
    note: '第2段落の末尾に (1)(2)(4) の出典を追加（(3) は同段落内で EPRX を既出典化済み）',
    from: 'と多様な価格水準が並列している。</p>',
    to: 'と多様な価格水準が並列している。'
      + '出典: （1）は<a href="https://www.jepx.jp/electricpower/market-data/spot/" target="_blank" rel="noopener">一般社団法人 日本卸電力取引所（JEPX）スポット市場取引結果</a>'
      + '（当サイト収録の日次平均系列を年度で集計。時系列は<a href="/market/jepx">JEPX スポット価格ハブ</a>）、'
      + '（2）は<a href="https://www.occto.or.jp/capacity-market/yoryoshijyo/main/data/" target="_blank" rel="noopener">電力広域的運営推進機関（OCCTO）「容量市場 メインオークション約定結果」</a>、'
      + '（4）は<a href="https://www.jepx.jp/nonfossil/market-data/" target="_blank" rel="noopener">日本卸電力取引所「非化石価値取引市場 オークション結果」</a>。</p>',
    marker: '出典: （1）は<a href="https://www.jepx.jp/electricpower/market-data/spot/"',
  },
  {
    note: '(a) 重複段落の削除: 完全同一の <p> が連続する箇所を1つに畳む（後に出現する方を削除）',
    from: DUP_PARA + DUP_PARA,
    to: DUP_PARA,
    marker: '__NEVER_MATCHES__重複解消は from の不在で冪等判定する',
  },
  {
    note: '出典欄に JEPX と OCCTO を追加（両者とも利用規約が出典明示を要求）',
    from: '<li>電力需給調整力取引所（EPRX）「需給調整市場のΔkW上限価格について」「取引実績の取りまとめ結果」</li>',
    to: '<li>電力需給調整力取引所（EPRX）「需給調整市場のΔkW上限価格について」「取引実績の取りまとめ結果」</li>'
      + '<li>一般社団法人 日本卸電力取引所（JEPX）「スポット市場取引結果」「非化石価値取引市場 オークション結果」</li>'
      + '<li>電力広域的運営推進機関（OCCTO）「容量市場 メインオークション約定結果」</li>',
    marker: '<li>一般社団法人 日本卸電力取引所（JEPX）「スポット市場取引結果」',
  },
];

const NEW_SUBCATEGORY = '市場制度_一般';

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
  console.log(`glossary/power-market-price-trend (zw7tk0bme)  detail ${next.length}字  subcategory="${String(before.subcategory)}"`);

  // (e) 8/22 の (3) の記述が生きていることを前提確認
  for (const must of ['19.51円/ΔkW・30分', '15.00円/ΔkW・30分', '10.00円/ΔkW・30分', 'eprx.or.jp/information/post.php']) {
    if (!next.includes(must)) { console.error(`  ✗ 前提が崩れている（8/22 の (3) の記述が不在）: ${must}`); process.exit(1); }
  }
  console.log('  ✓ (e) 8/22 に追加した (3) の記述（19.51/15.00/10.00・EPRX出典）は存在する');

  const patch: Record<string, unknown> = {};
  let applied = 0, done = 0;
  for (const rep of REPS) {
    const isDup = rep.from === DUP_PARA + DUP_PARA;
    if (isDup ? !next.includes(rep.from) : next.includes(rep.marker)) {
      done++; console.log(`  [skip] ${rep.note} — 既に反映済み`); continue;
    }
    const n = next.split(rep.from).length - 1;
    if (n !== 1) { console.error(`  ✗ from が ${n} 回出現（1回でない）: ${rep.note}`); process.exit(1); }
    next = next.replace(rep.from, rep.to);
    applied++;
    console.log(`  → ${rep.note}（from 一意ヒット）`);
  }
  if (applied > 0) patch.detail = next;

  // (d) subcategory
  if (String(before.subcategory) === NEW_SUBCATEGORY) { done++; console.log(`  [skip] subcategory は既に "${NEW_SUBCATEGORY}"`); }
  else { patch.subcategory = NEW_SUBCATEGORY; applied++; console.log(`  → subcategory: "${String(before.subcategory)}" → "${NEW_SUBCATEGORY}"（glossary 実在値・28件が使用）`); }

  if (applied === 0) { console.log(`  [skip] 全て反映済み（${done}件）— 冪等スキップ`); return; }
  console.log(`  detail ${String(before.detail).length} → ${next.length}字（適用 ${applied} / 既反映 ${done}）`);
  if (DRY_RUN) { console.log(`  [dry-run] PATCH ${Object.keys(patch).join(', ')}`); return; }

  await api('PATCH', patch);
  await new Promise((r) => setTimeout(r, 900));
  const after = (await api('GET')) as Record<string, unknown>;

  let bad = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (SKIP.has(k) || k in patch) continue;
    if (JSON.stringify(after[k]) !== JSON.stringify(before[k])) { bad++; console.log(`  ✗ ${k}: 意図しない変化`); }
  }
  const nd = String(after.detail);
  if ('detail' in patch) {
    if (nd === next) console.log(`  ✓ detail: 反映一致（${nd.length}字・正規化なし）`);
    else if (REPS.every((r) => (r.from === DUP_PARA + DUP_PARA ? !nd.includes(r.from) : nd.includes(r.marker))))
      console.log(`  ✓ detail: 反映（${nd.length}字・microCMS 正規化あり＝送信値と文字列一致せず・意図の文言は全て含む）`);
    else { bad++; console.log('  ✗ detail: 意図の文言が入っていない'); }
  }
  // #106: select の silently drop 検出
  if ('subcategory' in patch) {
    const ok = String(after.subcategory) === NEW_SUBCATEGORY;
    console.log(`  ${ok ? '✓' : '✗'} subcategory: "${String(after.subcategory)}"${ok ? '' : '（#106 silently drop 疑い）'}`);
    if (!ok) bad++;
  }

  const checks: Array<[string, boolean]> = [
    ['(a) 重複段落が1つに畳まれている', nd.split(DUP_PARA).length - 1 === 1],
    ['(1) FY2024 12.29円/kWh', nd.includes('12.29円/kWh')],
    ['(1) 最小5.43・最大19.30', nd.includes('最小5.43円/kWh・最大19.30円/kWh')],
    ['(1) 旧「年平均10〜15円/kWh」が消えている', !nd.includes('年平均10〜15円/kWh')],
    ['(1) 旧「夏冬ピーク時間帯30〜50円/kWh」が消えている', !nd.includes('夏冬ピーク時間帯30〜50円/kWh')],
    ['(1) 旧「需給ひっ迫時100円/kWh超」が消えている', !nd.includes('需給ひっ迫時100円/kWh超')],
    ['(2) 2024年度＝全9エリア一律14,137円/kW', nd.includes('全9エリア一律14,137円/kW')],
    ['(2) 2025年度＝東京3,495・北海道/九州5,242', nd.includes('東京3,495円/kW・北海道および九州5,242円/kW')],
    ['(2) 旧「2024年度実需給対応で約定価格5,242円/kW（東京エリア）」が消えている', !nd.includes('2024年度実需給対応で約定価格5,242円/kW（東京エリア）')],
    ['(4) FIT 全32回 0.3〜1.3円/kWh', nd.includes('全32回の約定価格が0.3〜1.3円/kWh')],
    ['(4) 非FIT 全23回 0.6〜1.3円/kWh', nd.includes('全23回で0.6〜1.3円/kWh')],
    ['(4) 旧「0.3〜1.4円/kWh」が消えている', !nd.includes('0.3〜1.4円/kWh')],
    ['(4) 旧「0.6〜1.2円/kWh」が消えている', !nd.includes('0.6〜1.2円/kWh')],
    ['出典: JEPX スポット', nd.includes('jepx.jp/electricpower/market-data/spot/')],
    ['出典: OCCTO 容量市場', nd.includes('occto.or.jp/capacity-market/yoryoshijyo/main/data/')],
    ['出典: JEPX 非化石', nd.includes('jepx.jp/nonfossil/market-data/')],
    ['内部リンク /market/jepx', nd.includes('href="/market/jepx"')],
    ['出典欄に JEPX 追加', nd.includes('「スポット市場取引結果」「非化石価値取引市場 オークション結果」')],
    ['出典欄に OCCTO 追加', nd.includes('「容量市場 メインオークション約定結果」</li>')],
    ['★(e) (3) の 19.51/15.00/10.00 が維持されている', nd.includes('19.51円/ΔkW・30分') && nd.includes('15.00円/ΔkW・30分') && nd.includes('10.00円/ΔkW・30分')],
    ['★(e) EPRX 出典が維持されている', nd.includes('eprx.or.jp/information/post.php')],
    ['★(3) の需給調整の実績値が維持されている', nd.includes('全電源3.10円/ΔkW・30分') && nd.includes('蓄電池のみ15.99円/ΔkW・30分')],
    ['★/tools/balancing-revenue リンクが維持されている', nd.includes('href="/tools/balancing-revenue"')],
  ];
  for (const [label, cond] of checks) { console.log(`  ${cond ? '✓' : '✗'} ${label}`); if (!cond) bad++; }
  console.log(`\n[patch-pmpt-quality] 意図外の変化・未達 ${bad}件`);
  if (bad) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
