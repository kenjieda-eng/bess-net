#!/usr/bin/env tsx
/**
 * scripts/post-news-weekly-2026-09-w2.ts — 週次まとめ w7（金曜ワンセット#6 ②・2026-09-11）
 *
 * 原稿: 金曜ワンセット#6 依頼書 ②（柱5本＋併読枠）。対象期間 9/4〜9/10。
 *   (1) 大手グループの EPC 本格参入（大和エネルギー・着工第1号は ENEOS Power の 50MW／109MWh）→ ①-1
 *   (2) 運用フェーズ: HEXA 高圧2件の商業運転（マーチャント型）＋ NC柳井の需給調整市場参入 → ①-2・①-3
 *   (3) サステナブルHD の主軸移行と Raptor 安全設計の公開 → ①-4・①-5
 *   (4) 低圧パッケージ GREEN CHORD と周辺サービス → ①-6
 *   (5) 政策: 容量停止計画の実務説明会（9/10 案内）・第63回需給調整市場小委（9/15）・LTDC 制度詳細説明会（9/17）
 *   併読枠: EIC Data 需給調整市場（三次調整力②）系列 https://data.eic-jp.org/catalog/balancing-price-tertiary-2
 *           【CC確定 2026-09-11: HTTP 200・<title>「需給調整市場 三次調整力② 年間平均落札単価 (年次)」を実測】
 * 数値・日付は ① の一次照合（調査→反証）で確定した値のみ。「低圧の周辺サービス4本」は本便で一次を照合していないため、
 * 件数・社名を出さず「告知が相次いだ」とだけ書く。内部運用の話は載せない。
 * 運用は post-news-weekly-2026-09-w1.ts と同一（category=市場統計・findBySlug 冪等・要素数照合）。
 */
const SLUG = 'news-weekly-2026-09-w2';
const BODY = [
  '<h2>① 大手グループが蓄電所のEPCに本格参入 ─ 大和エネルギー、着工第1号はENEOS Powerの50MW／109MWh</h2>',
  '<p>大和ハウスグループの大和エネルギーが9月8日、系統用蓄電所のEPC事業に本格参入すると発表しました。着工第1号は、ENEOS株式会社の清水油槽所（静岡県静岡市）内の遊休地にENEOS Powerが開発する特別高圧の系統用蓄電所（出力50MW、容量109MWh）で、2027年1月に着工し、2028年度内の竣工を予定しています。同社はEPC事業者として太陽光発電所329件・344MW（2026年8月1日時点）を手がけてきた経験を、蓄電インフラ分野に生かすとしています。ENEOSグループにとっては、初めての西日本エリア（60Hz地域）での系統用蓄電所の開発です。→ 記事: <a href="/news/daiwa-energy-eneos-shimizu-50mw-epc-2026-09">大和エネルギー、EPC事業に本格参入</a> ／ <a href="/projects/eneos-shimizu">プロジェクトDB</a></p>',
  '<h2>② 運用フェーズの案件が続く ─ HEXAの高圧2件が商業運転、NC柳井は需給調整市場へ</h2>',
  '<p>ヘキサ・エネルギーサービスは9月7日、福島県と宮城県の高圧蓄電所2件（いずれも出力1,998kW・定格容量4,936kWh）について、8月末に引き渡しを受け、商業運転と電力市場での運用を開始したと発表しました。同社は2件を「マーチャント型取引となる高圧蓄電所」と位置付け、市場リスクを自ら負担する事業モデルと説明しています。同じ9月7日には、日本蓄電池の「NC柳井市遠崎洛田蓄電所」（山口県柳井市・1,988kW／8,146kWh）がデジタルグリッドをアグリゲーターとして需給調整市場での運用を始めました。→ 記事: <a href="/news/hexa-fukushima-miyagi-merchant-bess-2026-09">HEXA 高圧2件が商業運転</a> ／ <a href="/news/nc-yanai-tosaki-balancing-entry-2026-09">NC柳井市遠崎洛田蓄電所が需給調整市場に参入</a> ／ 用語: <a href="/glossary/merchant-project">マーチャント型</a></p>',
  '<h2>③ 事業者の主軸移行と安全設計の公開 ─ サステナブルHD</h2>',
  '<p>サステナブルホールディングスは9月4日、ENERGY事業の主軸を太陽光発電所の開発・販売から系統用蓄電池事業へ移行したと発表しました。用地開発から系統連系対応、機器選定、システム統合、需給調整市場への参入支援までを一貫して提供する体制です。同日には、蓄電池製品「Raptor」の安全設計（BMSによる監視・管理、自動消火システム、IP保護設計）と、各機器の基本保証期間（Raptor 5年・PCS 3年・高圧連系盤 1年・EMS 3年）も公開しています。→ 記事: <a href="/news/sustainable-hd-bess-pivot-2026-09">系統用蓄電池事業へ主軸移行</a> ／ <a href="/news/sustainable-hd-raptor-safety-design-2026-09">Raptor の安全設計と保証期間</a> ／ 当サイトの<a href="/tools/fire-risk-check">蓄電池火災リスク自己診断</a></p>',
  '<h2>④ 低圧蓄電所のパッケージ化 ─ グリーンエナジー&amp;カンパニー「GREEN CHORD」</h2>',
  '<p>グリーンエナジー&amp;カンパニーは9月7日、低圧系統用蓄電池「GREEN CHORD」（定格出力50kW〔低圧連系のため49.9kWで運転〕／蓄電容量204.8kWh）を、施工に必要な部材まで含めたパッケージとして9月8日から提供すると発表しました。出荷前に模擬周波数試験とEMSの通信設定を済ませ、アグリゲーション（同一エリアの低圧蓄電所30基以上でバランシンググループを構成）とO&amp;Mをセットで提供します。同じ週には、低圧蓄電所向けの申請代行や情報サイトなど周辺サービスの告知も相次ぎました。→ 記事: <a href="/news/green-chord-lv-bess-package-2026-09">GREEN CHORD 提供開始</a> ／ <a href="/lv/entry-guide">低圧蓄電所の事業参入ガイド</a></p>',
  '<h2>⑤ 政策: 容量停止計画の実務説明会、第63回需給調整市場小委</h2>',
  '<p>電力広域的運営推進機関は9月10日、容量市場の実務説明会（容量停止計画の調整業務、対象実需給年度2028・2027年度）を10月1日にWebで開催すると案内しました（参加申込期日は9月18日10時）。長期脱炭素電源オークションで落札した蓄電池の停止計画調整とペナルティ運用に関わる内容です。9月15日の第63回需給調整市場検討小委員会では、二次調整力①の広域運用・広域調達などが議題に上がっています。長期脱炭素電源オークション（応札年度2026年度）の制度詳細説明会は9月17日に開かれますが、参加受付はすでに終了しており、終了後に動画が公開される予定です。→ <a href="/policy-calendar">政策カレンダー</a></p>',
  '<h2>併読: 三次調整力②の落札単価の水準</h2>',
  '<p>需給調整市場に参入する蓄電所が増えるなか、上限価格のない三次調整力②の水準感も押さえておきたいところです。姉妹サイト EIC Data には、需給調整市場 三次調整力②の年間平均落札単価（円/ΔkW・30分）の年次系列（2021年度〜）があります。→ EIC Data: <a href="https://data.eic-jp.org/catalog/balancing-price-tertiary-2">需給調整市場 三次調整力② 年間平均落札単価（年次）</a></p>',
  '<p>このほか、今週の記事は<a href="/news">ニュース一覧</a>に掲載しています。</p>',
  '<p><em>※本記事は編集部によるまとめです。各事実は当サイト掲載の各記事および、そこからリンクする一次情報をご参照ください。</em></p>',
].join('');
const PAYLOAD = {
  slug: SLUG,
  title: '【編集部まとめ】9月第2週の蓄電池業界 ─ 大和エネルギーがEPC本格参入、HEXAのマーチャント型2件が商業運転（注目5本）',
  lead: '9月4日〜9月10日の系統用蓄電池の主要な動きから編集部が5つを選び、「なぜ注目か」の文脈をつけました。詳細は各記事・各ページ（一次情報リンクつき）をご覧ください。',
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
  console.log(`[weekly-2026-09-w2] slug=${SLUG} mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  const dup = await fetch(`${BASE}?filters=slug[equals]${encodeURIComponent(SLUG)}&fields=id&limit=1`, { headers: { 'X-MICROCMS-API-KEY': KEY! } }).then((r) => r.json() as Promise<{ totalCount: number }>);
  if (dup.totalCount > 0) { console.log('  既存あり → skip（冪等）'); return; }
  // 本文がリンクする /news/ の記事がすべて実在することを確かめてから投入する（① の投入後に実行する）
  const linked = [...new Set([...BODY.matchAll(/href="\/news\/([^"]+)"/g)].map((m) => m[1]))];
  const missing: string[] = [];
  for (const s of linked) {
    const r = await fetch(`${BASE}?filters=slug[equals]${encodeURIComponent(s)}&fields=id&limit=1`, { headers: { 'X-MICROCMS-API-KEY': KEY! } }).then((x) => x.json() as Promise<{ totalCount: number }>);
    if (r.totalCount === 0) missing.push(s);
  }
  const h2 = (BODY.match(/<h2[\s>]/g) || []).length, links = (BODY.match(/href="\/news\//g) || []).length;
  console.log(`  title: ${PAYLOAD.title}\n  body: h2=${h2} 内部/news リンク=${links}（未投入 ${missing.length}: ${missing.join(', ') || 'なし'}） EIC Data リンク=${(BODY.match(/data\.eic-jp\.org/g) || []).length}`);
  if (missing.length && !DRY) { console.error('  ✗ リンク先の記事が未投入 → 投入しない（① を先に）'); process.exit(1); }
  if (DRY) return;
  const res = await fetch(BASE, { method: 'POST', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' }, body: JSON.stringify(PAYLOAD) });
  if (!res.ok) { console.error(`  ✗ POST ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
  console.log(`  ✓ POST 完了 id=${((await res.json()) as { id: string }).id}`);
  await new Promise((r) => setTimeout(r, 800));
  const after = await fetch(`${BASE}?filters=slug[equals]${encodeURIComponent(SLUG)}&fields=slug,title,lead,category,sourceName,body&limit=1`, { headers: { 'X-MICROCMS-API-KEY': KEY! } }).then((r) => r.json() as Promise<{ contents: Array<{ slug: string; title: string; lead: string; category: string[]; sourceName: string; body: string }> }>);
  const rec = after.contents[0];
  const ok = rec && rec.title === PAYLOAD.title && rec.lead === PAYLOAD.lead && rec.sourceName === PAYLOAD.sourceName && JSON.stringify(rec.category) === JSON.stringify(PAYLOAD.category) && (rec.body.match(/<h2[\s>]/g) || []).length === h2 && (rec.body.match(/href="\/news\//g) || []).length === links;
  console.log(`  #106: title=${rec?.title === PAYLOAD.title ? '✓' : '★NG'} lead=${rec?.lead === PAYLOAD.lead ? '✓' : '★NG'} category=${JSON.stringify(rec?.category)} h2=${(rec?.body.match(/<h2[\s>]/g) || []).length}/${h2} リンク=${(rec?.body.match(/href="\/news\//g) || []).length}/${links} → ${ok ? '✓' : '★NG'}`);
  if (!ok) process.exit(1);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
