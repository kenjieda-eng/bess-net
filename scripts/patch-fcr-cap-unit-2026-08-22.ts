/**
 * scripts/patch-fcr-cap-unit-2026-08-22.ts
 * explainer/balancing-market-fcr-detail の「3. 価格水準と収益性」の上限価格記述を是正。
 *
 * 誤記（修正前）: 「2024-2025年度の上限価格は12円/kW・h程度」
 *   → 単位が誤り（正しくは 円/ΔkW・30分。kW・h ではない）／数値も誤り／年度表現も誤り。
 *
 * 一次確認済の正しい事実（EPRX「需給調整市場のΔkW上限価格について」2026/7/30更新版。単位は全て 円/ΔkW・30分）:
 *   適用 2024/04/01〜2026/03/13 … 複合19.51 / 一次19.51 / 二次①19.51 / 二次②7.21 / 三次①7.21 / 三次②上限無し
 *   適用 2026/03/14〜2026/08/31 … 複合15.00 / 一次15.00 / 二次①15.00 / 二次②7.21 / 三次①7.21 / 三次②上限無し
 *   適用 2026/09/01〜当面の間   … 複合10.00 / 一次10.00 / 二次①10.00 / 二次②7.21 / 三次①7.21 / 三次②上限無し
 *   出典 https://www.eprx.or.jp/information/post.php
 *   根拠 一次・二次①・複合＝第4回 電力安定供給WG（2026/7/14）資料6 スライド22
 *        二次②・三次①＝第96回 制度検討作業部会（2024/9/27）資料3 スライド45
 *
 * ★年度表現を使わない（#123）: 15.00円の適用は 2026/3/14〜8/31 の約5.5か月のみで、
 *   FY2025 は 2026/3/13 まで 19.51円。「2025年度の上限は15円」と書くと誤りになるため、
 *   すべて「実需給日の期間」で記述する。
 * ★冪等キーは marker 方式（#122）: richEditor は保存時に見出し id を再採番し rel を補完するため、
 *   送信本文の全文一致では判定できない。正規化の影響を受けない素の本文を marker にする。
 *
 * 作法: GET 先行／from の一意ヒットを確認してから置換／DELETE・PUT 不使用／他フィールド不変／
 *       PATCH 後 GET で全field照合（正規化ありと意図未達を区別してログ出力）。
 * 実行: npx tsx --env-file=.env.local scripts/patch-fcr-cap-unit-2026-08-22.ts [--dry-run]
 */
export {};
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const URL_ = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/explainer/balancing-market-fcr-detail`;
const SKIP = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

const FROM =
  '<strong>2024-2025年度の上限価格は12円/kW・h程度</strong>で、需給調整市場全体の中で最高水準。年間平均稼働時間（kW単価×時間）で計算すると、kW容量当たりの収益性が最も高い。ただし2026年度以降の上限価格引下げが予告されている（落とし穴：上限改定）。';

const TO =
  'ΔkW価値の<strong>上限価格</strong>は年度ではなく<strong>実需給日</strong>で区切られ、単位は<strong>円/ΔkW・30分</strong>（kW・h ではない）。一次調整力の上限価格は、'
  + '<strong>2024年4月1日実需給分から2026年3月13日実需給分まで19.51円/ΔkW・30分</strong>、'
  + '<strong>2026年3月14日実需給分から2026年8月31日実需給分まで15.00円/ΔkW・30分</strong>、'
  + '<strong>2026年9月1日実需給分から当面の間10.00円/ΔkW・30分</strong>と二段階で引き下げられている'
  + '（複合商品・二次調整力①も同水準。二次調整力②・三次調整力①は全期間7.21円/ΔkW・30分、三次調整力②は上限なし）。'
  + '上限が設定されている商品の中では一次調整力が最も高い水準にあるが、上限の切下げはΔkW価値収入の上限をそのまま縮めるため、'
  + '収益前提は適用期間ごとに置き換える必要がある。'
  + '出典: <a href="https://www.eprx.or.jp/information/post.php" target="_blank" rel="noopener">電力需給調整力取引所「需給調整市場のΔkW上限価格について」（2026年7月30日更新）</a>'
  + '（根拠: 一次調整力・二次調整力①・複合商品＝第4回 電力安定供給ワーキンググループ〔2026年7月14日〕資料6 スライド22、'
  + '二次調整力②・三次調整力①＝第96回 制度検討作業部会〔2024年9月27日〕資料3 スライド45）。';

/** 冪等マーカー: 正規化（見出しid再採番・rel補完）の影響を受けない素の本文（#122） */
const MARKER = '2026年9月1日実需給分から当面の間10.00円/ΔkW・30分';

async function api(method: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(URL_, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function main(): Promise<void> {
  const before = (await api('GET')) as Record<string, unknown>;
  if (before.slug !== 'balancing-market-fcr-detail') throw new Error(`slug 不一致: ${String(before.slug)}`);
  const cur = String(before.body);
  console.log(`explainer/balancing-market-fcr-detail  body ${cur.length}字`);

  if (cur.includes(MARKER)) { console.log('  [skip] 既に反映済み（marker 一致）— 冪等スキップ'); return; }

  const n = cur.split(FROM).length - 1;
  console.log(`  from の出現回数: ${n}`);
  if (n !== 1) { console.error('  ✗ from が一意にヒットしない — 中止'); process.exit(1); }

  const next = cur.replace(FROM, TO);
  console.log(`  body ${cur.length} → ${next.length}字`);
  if (DRY_RUN) { console.log('  [dry-run] PATCH body のみ'); return; }

  await api('PATCH', { body: next });
  await new Promise((r) => setTimeout(r, 900));
  const after = (await api('GET')) as Record<string, unknown>;

  // #106: 全field照合（body 以外は不変であること）
  let drift = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (SKIP.has(k) || k === 'body') continue;
    if (JSON.stringify(after[k]) !== JSON.stringify(before[k])) { drift++; console.log(`  ✗ ${k}: 意図しない変化`); }
  }
  const nb = String(after.body);
  if (nb === next) console.log(`  ✓ body: 反映一致（${nb.length}字・正規化なし）`);
  else if (nb.includes(MARKER)) console.log(`  ✓ body: 反映（${nb.length}字・microCMS 正規化あり＝送信値と文字列一致せず・意図の文言は含む）`);
  else { drift++; console.log('  ✗ body: 意図の文言が入っていない'); }

  for (const [label, cond] of [
    ['旧記述「12円/kW・h」が消えている', !nb.includes('12円/kW・h')],
    ['19.51円/ΔkW・30分', nb.includes('19.51円/ΔkW・30分')],
    ['15.00円/ΔkW・30分', nb.includes('15.00円/ΔkW・30分')],
    ['10.00円/ΔkW・30分', nb.includes('10.00円/ΔkW・30分')],
    ['7.21円/ΔkW・30分', nb.includes('7.21円/ΔkW・30分')],
    ['三次②は上限なし', nb.includes('三次調整力②は上限なし')],
    ['年度表現を残していない（2024-2025年度）', !nb.includes('2024-2025年度')],
    ['出典URL', nb.includes('eprx.or.jp/information/post.php')],
    ['根拠 資料6 スライド22', nb.includes('資料6 スライド22')],
    ['根拠 資料3 スライド45', nb.includes('資料3 スライド45')],
  ] as Array<[string, boolean]>) {
    console.log(`  ${cond ? '✓' : '✗'} ${label}`);
    if (!cond) drift++;
  }
  console.log(`\n[patch-fcr-cap-unit] 意図外の変化・未達 ${drift}件`);
  if (drift) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
