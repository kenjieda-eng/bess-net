#!/usr/bin/env tsx
/**
 * scripts/post-news-weekly-2026-08-w4.ts — 週次まとめ 8月後半号（金曜ワンセット#4 ②・2026-08-30 遅延実施）
 *
 * 原稿: 金曜ワンセット#4 依頼書（対象期間 8/13〜8/29）。一次照合済みの修正2点を反映:
 *   - ③ BESSROOM「相談」→ 原文どおり「問い合わせ」（サービス開始月の断定も外す）
 *   - ⑤ 109.43→19.31 円は EPRX 年次取りまとめ（一次）に存在しない EIC Data 集計値のため
 *     数値を落として趣旨のみ（36.9%→2.1% は summary_2025.pdf p.48 三次② 年間不足率で一次確認済み。
 *     上限価格 15.00→10.00 円は EPRX ΔkW上限価格 2026/7/30 更新版 PDF で一次確認済み）
 * 運用は post-news-weekly-2026-08-w2.ts と同一（category=市場統計・findBySlug 冪等・要素数照合）。
 */
const SLUG = 'news-weekly-2026-08-w4';

const BODY = [
  '<h2>① 2MW／8MWh級の運開・連系が続く ─ 2週間の発表で8拠点</h2>',
  '<p>ブルースカイエナジーが姫路・大崎・みやき・中津の4拠点で運転を開始し、日本蓄電池は鳥取県岩美郡で受電、熊本県玉名市では需給調整市場に参入しました。TAOKE ENERGY も群馬県太田市・佐賀県伊万里市の2拠点で8月10日に運転を開始しました。滋賀県甲賀市（Fujitaka）と福岡県宮若市（サステナブルHD）は11月の需給調整市場参入を予定しています。いずれも出力約2MW・容量約8MWhという同じ規格で、この形が国内の標準形として定着したことが数で見えた2週間でした。→ 記事: <a href="/news/bluesky-energy-4sites-unten-2026-08">ブルースカイエナジー4拠点運転開始</a> ／ <a href="/news/taoke-ota-imari-unten-2026-08">TAOKE 太田・伊万里の2拠点運転開始</a> ／ <a href="/news/nc-iwami-juden-2026-08">NC岩美郡岩美町蓄電所が受電開始</a></p>',
  '<h2>② 参入が続き、案件は大型化も ─ 不動産大手が20MW級に共同出資</h2>',
  '<p>太陽光発電事業の富士テクニカルコーポレーションがエレビスタと組んで釧路市で第1号を着工し、静岡ガス＆パワーは浜松市の蓄電所建設をグリーンエナジー＆カンパニーに発注しました。スマートエナジーは朝来市の案件でアグリゲーション業務を受注しています。そして東急不動産は IBeeT の共同事業体に出資し、宮城県白石市で20MW／75.2MWh——今回の期間で最大の案件——を2028年度運開予定で新設します。太陽光・ガス・EPC・不動産と、隣接業種からの参入が続き、案件の規模も2MW級の標準形の外へ広がり始めました。→ 記事: <a href="/news/ibeet-tokyu-shiroishi-20mw-2026-08">IBeeT×東急不動産 白石20MW</a> ／ <a href="/news/fuji-technical-kushiro-sannyu-2026-08">富士テクニカル 釧路で第1号着工</a> ／ <a href="/news/gec-hamamatsu-shizuoka-gas-power-2026-08">静岡ガス＆パワー 浜松の建設発注</a></p>',
  '<h2>③ 「用地・売買・運用」の周辺サービスが一斉に立ち上がった</h2>',
  '<p>用地の机上調査ツール（Ene Compass）、権利付き用地の比較ポータル（GRiD DATA）、案件売買のマッチング（BESSROOM・問い合わせ累計150件超）、低圧向けの用地紹介パートナー募集（エレビスタ）と、1週間に4本のリリースが並びました。運用側でも、日立と三菱総研が特別高圧の蓄電池事業者向けに価格予測から入札・OCCTO への計画提出までを自動化するサービスを2027年度に始めると発表し、Bluefield Energy はアグリゲーションの採用決定容量（内示含む）100MW 超えを公表しました。案件数が積み上がった市場で、候補地探し・流通・運用委託の入口が一気に整い始めています。系統側の条件（県・電圧・空き容量・N-1電制）は当サイトの<a href="/grid/search">変電所検索</a>でも無料で絞り込めます。→ 記事: <a href="/news/enecompass-desktop-survey-2026-08">Ene Compass</a> ／ <a href="/news/gift-griddata-portal-2026-08">GRiD DATA</a> ／ <a href="/news/maris-bessroom-150-2026-08">BESSROOM</a> ／ <a href="/news/hitachi-mri-bess-trading-2026-08">日立×三菱総研</a></p>',
  '<h2>④ 資金の出し手が広がる ─ クラウドファンディングとの連携</h2>',
  '<p>スターシーズが不動産クラウドファンディングのホーネットと基本合意し、系統用蓄電所やAIデータセンターの共同開発とファンド組成を協議します。ブルースカイエナジーの4拠点はみずほ証券がアドバイザーに就いています。8月前半の合弁・ファンド型に続き、蓄電所の資金調達の入口が多様化しています。→ 記事: <a href="/news/starseeds-hornet-mou-2026-08">スターシーズ×ホーネット基本合意</a></p>',
  '<h2>⑤ 併読: 需給調整市場の構造が1年で変わった</h2>',
  '<p>姉妹サイト EIC Data の分析（Insight #108）によれば、需給調整市場の調達不足率は2025年度に全6商品で大きく改善し、三次調整力②では36.9%→2.1%になりました（出典: EPRX 需給調整市場 年次取りまとめ）。同分析は、不足の解消で高値約定の局面が細り、三次②では蓄電池の平均落札単価も大幅に下がったと指摘しています。「高値の商品を当てにいく」前提は2024年度限りのものになりつつあり、9月1日実需給分からは一次・二次①・複合商品の上限価格も15.00円→10.00円/ΔkW・30分に下がります。運開が相次ぐ今こそ、収益設計の前提を最新年度で見直す時期です。→ EIC Data: <a href="https://data.eic-jp.org/insight/balancing-shortage-rate">需給調整市場の調達不足率分析</a> ／ 当サイトの<a href="/tools/balancing-revenue">需給調整市場ツール</a></p>',
  '<p>このほか、8月後半の18本を<a href="/news">ニュース一覧</a>に掲載しています。</p>',
  '<p><em>※本記事は編集部によるまとめです。各事実は当サイト掲載の各記事および、そこからリンクする一次情報をご参照ください。</em></p>',
].join('');

const PAYLOAD = {
  slug: SLUG,
  title: '【編集部まとめ】8月後半の蓄電池業界 ─ 2MW級の運開ラッシュと「用地・売買」の周辺サービス台頭（注目5本）',
  lead: '8月後半（8/13〜8/29）の系統用蓄電池の主要リリース18本から編集部が5つの流れを選び、「なぜ注目か」の文脈をつけました。詳細は各記事（一次情報リンクつき）をご覧ください。',
  body: BODY,
  category: ['市場統計'],
  sourceName: '蓄電所ネット編集部',
};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1/news`;
const DRY = process.argv.includes('--dry-run');

async function main(): Promise<void> {
  console.log(`[weekly-w4] slug=${SLUG} mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  const dup = await fetch(`${BASE}?filters=slug[equals]${encodeURIComponent(SLUG)}&fields=id&limit=1`, {
    headers: { 'X-MICROCMS-API-KEY': KEY! },
  }).then((r) => r.json() as Promise<{ totalCount: number }>);
  if (dup.totalCount > 0) {
    console.log('  既存あり → skip（冪等）');
    return;
  }
  console.log(`  title: ${PAYLOAD.title}`);
  console.log(`  body: h2=${(BODY.match(/<h2>/g) || []).length} 内部リンク=${(BODY.match(/href="\/news\//g) || []).length}`);
  if (DRY) return;

  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(PAYLOAD),
  });
  if (!res.ok) {
    console.error(`  ✗ POST ${res.status}: ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  console.log(`  ✓ POST 完了 id=${((await res.json()) as { id: string }).id}`);

  await new Promise((r) => setTimeout(r, 700));
  const after = await fetch(
    `${BASE}?filters=slug[equals]${encodeURIComponent(SLUG)}&fields=slug,title,category,body&limit=1`,
    { headers: { 'X-MICROCMS-API-KEY': KEY! } }
  ).then((r) => r.json() as Promise<{ contents: Array<{ slug: string; title: string; category: string[]; body: string }> }>);
  const rec = after.contents[0];
  const ok =
    rec &&
    rec.title === PAYLOAD.title &&
    JSON.stringify(rec.category) === JSON.stringify(PAYLOAD.category) &&
    (rec.body.match(/<h2/g) || []).length === 5 &&
    (rec.body.match(/href="\/news\//g) || []).length >= 9;
  console.log(`  照合: ${ok ? '✓ 一致（h2=5・内部リンク9+・category=市場統計）' : '✗ 不一致'}`);
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});

export {};
