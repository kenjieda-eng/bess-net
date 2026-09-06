#!/usr/bin/env tsx
/**
 * scripts/post-news-weekly-2026-09-w1.ts — 週次まとめ w6（金曜ワンセット#5 ②・2026-09-05 遅延実施）
 *
 * 原稿: 金曜ワンセット#5 依頼書 ②（柱5本＋併読枠）。対象期間 8/28〜9/3（8/28〜31 分は月次バッチ既報）。
 *   (1) 需給調整市場の上限価格 10円 適用開始（9/1）→ 解説記事 balancing-price-cap-10yen-explainer（本番 200 確認済み）
 *   (2) LTDC 応札年度2026 の募集要綱・契約約款が制定（9/2）→ policy-calendar ltdc-2026-boshuyoukou-kouhyou-2026-09（9/5 便で POST 済み）
 *   (3) 環境省ストレージパリティ二次公募 受付中（〜10/2 正午）→ subsidies moe-storage-parity-r08（本番 200 確認済み）
 *   (4) 地銀グループの蓄電所が竣工（徳島・①-3）→ tokugin-tomoni-itano-shunko-2026-09
 *   (5) 容量市場 追加オークション約定結果（月次バッチ既報の参照のみ）→ occto-tsuika-auction-fy2027-kekka-2026-08
 *   併読枠: EIC Data 需給調整市場（三次調整力②）系列 → https://data.eic-jp.org/catalog/balancing-price-tertiary-2
 *           【CC確定 2026-09-05: HTTP 200・<title>「需給調整市場 三次調整力② 年間平均落札単価 (年次)」を実測】
 *   公開文面の呼称は「2026年度メインオークション」（「第7回」は使わない）。内部運用の話は載せない。
 * 運用は post-news-weekly-2026-08-w4.ts と同一（category=市場統計・findBySlug 冪等・要素数照合）。
 */
const SLUG = 'news-weekly-2026-09-w1';
const BODY = [
  '<h2>① 需給調整市場の上限価格が15円→10円に ─ 9月1日実需給分から適用開始</h2>',
  '<p>需給調整市場の一次調整力・二次調整力①・複合商品の上限価格が、9月1日実需給分から15.00円→10.00円/ΔkW・30分に引き下げられました。系統用蓄電池の主戦場である商品の天井が3分の2になった計算で、「上限に張り付く高値約定」を前提にした収益計画はこの日を境に成り立たなくなります。二次②・三次①は7.21円のまま、三次②には上限がありません。→ 解説: <a href="/explainer/balancing-price-cap-10yen-explainer">上限価格10円の解説記事</a> ／ 当サイトの<a href="/tools/balancing-revenue">需給調整市場ツール</a></p>',
  '<h2>② 長期脱炭素電源オークション、応札年度2026年度の募集要綱と契約約款が制定</h2>',
  '<p>電力広域的運営推進機関は9月2日、長期脱炭素電源オークションの募集要綱（応札年度：2026年度）と容量確保契約約款を公表・制定しました。参加要件・登録方法・応札方法・落札決定方法・契約条件がこれで確定し、業務マニュアル（参加登録・応札・契約締結編）の意見募集も9月15日まで行われています。国側では8月31日の電力安定供給WGで「第4回募集に向けて」の確定版が示されており、蓄電池が主要な落札区分であるこの制度の今年度分は、国の方針と広域機関の要綱の両輪が揃いました。→ <a href="/policy-calendar">政策カレンダー</a>（募集要綱公表・業務マニュアル意見募集・容量停止計画マニュアル意見募集）</p>',
  '<h2>③ 環境省ストレージパリティ事業、二次公募を受付中（10月2日正午まで）</h2>',
  '<p>令和8年度の「ストレージパリティの達成に向けた太陽光発電設備等の価格低減促進事業」は二次公募の受付中で、締切は10月2日正午です。二次公募からIP通信機能を持つ機器にJC-STARの★1以上の適合ラベルが必須要件になった点は、製品選定の段階で確認が必要です。→ <a href="/subsidies/moe-storage-parity-r08">補助金ページ</a> ／ 用語: <a href="/glossary/jc-star">JC-STAR</a></p>',
  '<h2>④ 地方銀行グループの蓄電所が竣工 ─ 徳島県板野郡、1,990kW／8,226kWh</h2>',
  '<p>徳島大正銀行の100%子会社・とくぎんトモニリンクアップが徳島県板野郡で進めていた系統用蓄電所が8月31日に竣工しました（蓄電システムはパワーエックス製、アグリゲーターはSustech）。四国の地方銀行グループ初として2月に参入を発表してから約半年での竣工で、金融機関が自ら蓄電所を持つ動きの実例が一つ形になりました。同じ週にはイーレックスが他社保有の蓄電池を対象にしたアグリゲーションサービスを開始し、スマートエナジーとパワーエックスが発電所併設型蓄電池で協業検討の覚書を結んでいます。→ 記事: <a href="/news/tokugin-tomoni-itano-shunko-2026-09">とくぎんトモニ 板野郡の蓄電所が竣工</a> ／ <a href="/news/erex-bess-aggregation-start-2026-09">イーレックス アグリゲーションサービス開始</a> ／ <a href="/news/smart-energy-powerx-heisetsu-mou-2026-09">スマートエナジー×パワーエックス 覚書</a></p>',
  '<h2>⑤ 参照: 容量市場・追加オークション（実需給2027年度）の約定結果</h2>',
  '<p>8月6日に公表された追加オークションの約定結果（全エリア10,361円/kW、蓄電池13.8万kWが全量約定）は月次バッチで既報のとおりです。次は2026年度メインオークション（対象実需給年度：2030年度）で、応札の受付期間は10月13日〜23日です（10月26日〜30日は期待容量等算定諸元一覧の登録受付期間）。→ 記事: <a href="/news/occto-tsuika-auction-fy2027-kekka-2026-08">追加オークション約定結果</a> ／ <a href="/policy-calendar">政策カレンダー</a></p>',
  '<h2>併読: 三次調整力②の落札単価はどう動いてきたか</h2>',
  '<p>上限価格の引き下げを収益設計に織り込むには、上限のない三次調整力②の水準感も押さえておきたいところです。姉妹サイト EIC Data には、需給調整市場 三次調整力②の年間平均落札単価（円/ΔkW・30分）の年次系列があります。→ EIC Data: <a href="https://data.eic-jp.org/catalog/balancing-price-tertiary-2">需給調整市場 三次調整力② 年間平均落札単価（年次）</a></p>',
  '<p>このほか、今週の記事は<a href="/news">ニュース一覧</a>に掲載しています。</p>',
  '<p><em>※本記事は編集部によるまとめです。各事実は当サイト掲載の各記事および、そこからリンクする一次情報をご参照ください。</em></p>',
].join('');
const PAYLOAD = {
  slug: SLUG,
  title: '【編集部まとめ】9月第1週の蓄電池業界 ─ 需給調整市場の上限10円が適用開始、LTDC 2026年度の募集要綱が確定（注目5本）',
  lead: '8月28日〜9月3日の系統用蓄電池の主要な動きから編集部が5つを選び、「なぜ注目か」の文脈をつけました。詳細は各記事・各ページ（一次情報リンクつき）をご覧ください。',
  body: BODY,
  category: ['市場統計'],
  sourceName: '蓄電所ネット編集部',
};
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const BASE = `https://${DOMAIN}.microcms.io/api/v1/news`;
const DRY = process.argv.includes('--dry-run');
async function main(): Promise<void> {
  console.log(`[weekly-2026-09-w1] slug=${SLUG} mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  const dup = await fetch(`${BASE}?filters=slug[equals]${encodeURIComponent(SLUG)}&fields=id&limit=1`, { headers: { 'X-MICROCMS-API-KEY': KEY! } }).then((r) => r.json() as Promise<{ totalCount: number }>);
  if (dup.totalCount > 0) { console.log('  既存あり → skip（冪等）'); return; }
  const h2 = (BODY.match(/<h2[\s>]/g) || []).length, links = (BODY.match(/href="\/news\//g) || []).length;
  console.log(`  title: ${PAYLOAD.title}\n  body: h2=${h2} 内部/news リンク=${links} EIC Data リンク=${(BODY.match(/data\.eic-jp\.org/g) || []).length}`);
  if (DRY) return;
  const res = await fetch(BASE, { method: 'POST', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' }, body: JSON.stringify(PAYLOAD) });
  if (!res.ok) { console.error(`  ✗ POST ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
  console.log(`  ✓ POST 完了 id=${((await res.json()) as { id: string }).id}`);
  await new Promise((r) => setTimeout(r, 800));
  const after = await fetch(`${BASE}?filters=slug[equals]${encodeURIComponent(SLUG)}&fields=slug,title,category,body&limit=1`, { headers: { 'X-MICROCMS-API-KEY': KEY! } }).then((r) => r.json() as Promise<{ contents: Array<{ slug: string; title: string; category: string[]; body: string }> }>);
  const rec = after.contents[0];
  const ok = rec && rec.title === PAYLOAD.title && JSON.stringify(rec.category) === JSON.stringify(PAYLOAD.category) && (rec.body.match(/<h2[\s>]/g) || []).length === h2 && (rec.body.match(/href="\/news\//g) || []).length === links;
  console.log(`  #106: title=${rec?.title === PAYLOAD.title ? '✓' : '★NG'} category=${JSON.stringify(rec?.category)} h2=${(rec?.body.match(/<h2[\s>]/g) || []).length}/${h2} リンク=${(rec?.body.match(/href="\/news\//g) || []).length}/${links} → ${ok ? '✓' : '★NG'}`);
  if (!ok) process.exit(1);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
