#!/usr/bin/env tsx
/**
 * scripts/post-news-weekly-2026-08-w2.ts — 週次まとめ 8月前半号（金曜ワンセット#2 ②）
 *
 * 原稿: 金曜ワンセット8-14_ニュース原稿_2026-08-13_ユウ.md（承認済み・原稿どおり）
 * 運用は post-news-weekly-2026-07.ts と同一:
 *   - category は '市場統計'（実在値）。getIndustryNews は '編集部' を除外するため、
 *     まとめ枠に出すには市場統計を使う（2026-08-07 実証）。
 *   - findBySlug で冪等・POST後に内容照合（microCMS は HTML を正規化するため要素数で照合）。
 */
const SLUG = 'news-weekly-2026-08-w2';

const BODY = [
  '<h2>① 一次調整力（オフライン）の商用運用が中小規模で積み上がる</h2>',
  '<p>TAOKE ENERGYが岩手県滝沢市の2MW蓄電所で8月3日から一次調整力（オフライン）の運用を開始。さらに愛知・三重の2案件では、SPCを通じたファンド投資案件として初の一次調整力参入を実現しました。2MW級でも需給調整市場の高速な商品で収益機会を持てる実例が、この夏まとまって増えています。→ 記事: <a href="/news/taoke-takizawa-primary-freq-2026-08">滝沢市の2MW蓄電所が一次調整力で運用開始</a> ／ <a href="/news/taoke-fund-primary-freq-aichi-mie-2026-08">ファンド投資案件で初の一次調整力市場参入</a></p>',
  '<h2>② 日本蓄電池、受電・設置・防災協定の3本 ─ 2028年70箇所へ量産が続く</h2>',
  '<p>千葉県銚子市で受電・運転開始（1,998kW／8,146kWh）、長野市で設置開始、そして福岡県嘉麻市とは災害時に蓄電所から外部給電する協定（72時間で約470世帯分）を締結。蓄電所が「市場で稼ぐ設備」であると同時に「地域の防災インフラ」として位置づけられていく流れが具体化しています。→ 記事: <a href="/news/nc-choshi-kasugacho-unten-2026-08">NC銚子市春日町蓄電所が受電・運転開始</a> ほか2本</p>',
  '<h2>③ 合弁・ファンド型の保有スキームが広がる ─ GEC×クラダシの2案件始動</h2>',
  '<p>グリーンエナジー＆カンパニーとクラダシの50:50合弁（GK-TKスキーム）による第一弾2案件が始動。7月のSBIマネープラザのファンドに続き、蓄電所を「直接保有する」以外の関わり方が増えています。設備は静岡・島根とも約2MW／8MWh級で、いまの標準形です。→ 記事: <a href="/news/gec-kuradashi-jv-2sites-2026-08">合弁の系統用蓄電所 国内2案件が始動</a></p>',
  '<h2>④ 蓄電所の「売買」を仲介するサービスが登場</h2>',
  '<p>デジタルグリッドが、開発中〜運用開始済みの系統用蓄電所の売買マッチングを2026年9月に開始すると発表。案件が数百件規模で積み上がってきた市場で、セカンダリー取引の入口が整い始めました。売買・流通の動きは当サイトの流通案件ページでも扱っている領域です。→ 記事: <a href="/news/digitalgrid-bess-matching-2026-08">系統用蓄電所の売買マッチング新サービス</a></p>',
  '<h2>⑤ 30MW級の大型も進行 ─ 宮崎・広原蓄電所が据え付け完了</h2>',
  '<p>Eku Energyの広原蓄電所（30MW／120MWh）で主要設備の据え付けが完了、2027年1月の運転開始を目指します。東京ガスが20年間の運用契約、三菱UFJ銀行がプロジェクトファイナンスを組成と、大型案件の「作る・運用する・資金をつける」の分業が定着してきました。→ 記事: <a href="/news/eku-hirohara-sueteuke-2026-08">広原蓄電所の主要設備据え付け完了</a></p>',
  '<p>このほか、京都府亀岡市の施工着手（イーレックス連携3件目）など、8月前半の9本を<a href="/news">ニュース一覧</a>に掲載しています。</p>',
  '<p><em>※本記事は編集部によるまとめです。各事実は当サイト掲載の各記事および、そこからリンクする一次情報をご参照ください。</em></p>',
].join('');

const PAYLOAD = {
  slug: SLUG,
  title: '【編集部まとめ】8月前半の蓄電池業界 ─ 一次調整力の商用運用が続々・蓄電所の売買マッチング登場（注目5本）',
  lead: '8月前半の系統用蓄電池の主要リリース9本から編集部が5本を選び、「なぜ注目か」の文脈をつけました。詳細は各記事（一次情報リンクつき）をご覧ください。',
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
  console.log(`[weekly-w2] slug=${SLUG} mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
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
    (rec.body.match(/href="\/news\//g) || []).length >= 6;
  console.log(`  照合: ${ok ? '✓ 一致（h2=5・内部リンク6+・category=市場統計）' : '✗ 不一致'}`);
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});

export {};
