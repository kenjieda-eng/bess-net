/**
 * scripts/post-lv-invest-b8-2026-07-28.ts — 低圧投資家ガイド B8（最終）: 運営・相談 G群 G-9〜G-12
 *
 * B7 と同一方式: explainer へ category:["低圧投資"] 公開POST → GET全field照合（#106・正規化=
 * 見出しアンカーid自動付与＋& の &amp; 実体化＋テーブルエディタの既定属性/tbody/セル内p を吸収）。
 * 冪等（#91）slug既存skip・700ms逐次（#90）。DELETE/PUT 不使用。禁止語9語すべて0で作成・通常免責。
 *
 * 【江田健二 紹介の前提訂正】依頼書は「/about から転用」だが /about に代表 bio は無い。創作禁止の趣旨に
 * 従い、サイト内で既に公開済みの検証可能な bio（src/components/StartTrustBlock.tsx＝EIC理事・著書
 * 『2時間でわかる 蓄電池ビジネスの未来』）のみを転用し、新規の経歴・実績は一切創作しない。
 * 実行: npx tsx --env-file=.env.local scripts/post-lv-invest-b8-2026-07-28.ts [--dry-run]
 */
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: MICROCMS env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/explainer`;
const HEADERS = { 'X-MICROCMS-API-KEY': API_KEY!, 'Content-Type': 'application/json' };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Article = { slug: string; title: string; lead: string; body: string };

const DISC = '<p>※本記事は一般的な情報提供であり、特定案件の推奨や投資助言ではありません。</p>';

const ARTICLES: Article[] = [
  {
    slug: 'who-answers',
    title: '相談を担当するのはどんな人たちか',
    lead: '相談窓口は「誰が答えるのか」が見えないと使いにくいものです。このページでは、当サイトの相談対応の体制を紹介します。',
    body:
      '<h2>運営団体</h2><p>蓄電所ネットは一般社団法人エネルギー情報センター（EIC）が運営しています。エネルギー分野の情報提供を続けてきた団体で、特定の販売会社・メーカーの系列ではありません（<a href="/lv/invest/how-we-earn">報酬の方針</a>はこちら）。</p>' +
      '<h2>代表の紹介</h2><p>当ガイドを運営するエネルギー情報センター（EIC）の理事・江田健二は、『2時間でわかる 蓄電池ビジネスの未来』ほか蓄電池・エネルギー分野の著書を持ちます。</p>' +
      '<h2>相談対応の体制</h2><p>ご相談にはEICの担当チームが対応し、内容に応じて代表が直接お答えすることもあります。得意なのは、営業資料の読み方の整理・確認質問の設計・制度や仕組みの解説。できないこと（個別案件の推奨・税務法務の個別判断）は<a href="/lv/invest/free-consultation-scope">相談範囲の記事</a>のとおりです。</p>' +
      '<h2>顔の見える相談先であるために</h2><p>情報サイトの相談窓口は、営業の入口になっている例も少なくありません。当サイトは「誰が・どんな方針で答えるか」を先に公開することで、その不安ごと引き受けたいと考えています。方針と違う対応があった場合は、お問い合わせからご指摘ください。</p>' +
      '<h2>次に読む</h2><ul><li><a href="/lv/invest/free-consultation-scope">無料相談でできること・できないこと</a></li><li><a href="/lv/invest/will-you-be-sold-to">相談したら何かを売られますか？</a></li><li><a href="/about">蓄電所ネットについて</a></li></ul>' +
      DISC,
  },
  {
    slug: 'how-we-protect-data',
    title: '相談者の情報をどのように守るか',
    lead: '相談には、資産状況や検討中の案件など、外に出したくない情報が含まれます。その扱いを先に明示します。',
    body:
      '<h2>利用目的はご相談への回答だけ</h2><p>いただいた情報は、ご相談への回答とそのやり取りにのみ使います。営業目的の連絡には使いません（<a href="/lv/invest/will-you-be-sold-to">売り込みをしない方針</a>はこちら）。メールマガジン等への自動登録もありません。</p>' +
      '<h2>第三者に渡しません</h2><p>ご相談の内容・連絡先を、ご本人の同意なく販売会社その他の第三者に提供することはありません。「この販売会社に確認してみては」とご案内することはあっても、こちらから相談者の情報を先方に伝えることはありません。</p>' +
      '<h2>記事化は同意が前提</h2><p>ご相談を記事の題材にする場合は、事前に同意をいただき、個人・案件が特定されない形に匿名化します（<a href="/lv/invest/consultation-policy">相談と編集の方針</a>のとおり）。現在掲載中の相談パターンは編集部作成の想定例です。</p>' +
      '<h2>匿名でのご相談も可能</h2><p>案件名・会社名・金額を伏せた形のご相談でも、一般論の範囲でお答えできます。詳細を開示いただくほど具体的な整理ができる、という関係です。サイト全体の個人情報の扱いは<a href="/privacy">プライバシーポリシー</a>をご覧ください。</p>' +
      '<h2>次に読む</h2><ul><li><a href="/lv/invest/who-answers">相談を担当するのはどんな人たちか</a></li><li><a href="/lv/invest/consultation-policy">よくあるご相談と回答の方針</a></li><li><a href="/privacy">プライバシーポリシー</a></li></ul>' +
      DISC,
  },
  {
    slug: 'our-vision',
    title: '蓄電所ネットが目指す低圧蓄電所市場',
    lead: 'このガイドを運営する理由を、市場への考えとして書き残しておきます。個別の記事の背景にある思想として、読んでいただければ十分です。',
    body:
      '<h2>いまの市場の課題は「確認のしにくさ」</h2><p>低圧蓄電所は新しい市場で、価格の相場観・運用実績・会社の評判といった「確認の材料」がまだ整っていません。情報の非対称性が大きい市場では、買い手が不利になり、強引な営業が通りやすくなります。課題は市場の将来性ではなく、確認のしにくさにある——これが当サイトの現状認識です。</p>' +
      '<h2>目指すのは「確認できる市場」</h2><p>買い手が、確認の手順と道具を持っている。売り手が、確認に耐える情報開示を標準にする。確認された取引が増えるほど、実績データが蓄積され、次の買い手の確認がさらに楽になる——この循環ができれば、市場は健全に大きくなれます。このガイドの記事・資料・相談は、すべてその循環の最初の一押しのつもりで作っています。</p>' +
      '<h2>誠実な売り手にとっても良い市場のはず</h2><p>確認できる市場は、誠実な販売会社・運用会社が正当に選ばれる市場でもあります。当サイトの15の質問に全部答えられる会社にとって、確認文化はむしろ追い風のはずです。事業者の方からの情報提供・ご意見も歓迎します（<a href="/lv/invest/how-we-verify">確認手順</a>はこちら）。</p>' +
      '<h2>読者への招待</h2><p>確認して買う。確認して見送る。どちらも市場を良くする行動です。このガイドを使って確認したこと自体が、次の投資家のための道になります。</p>' +
      '<h2>次に読む</h2><ul><li><a href="/lv/invest/listing-criteria">案件・事業者情報の掲載基準</a></li><li><a href="/lv/invest/how-we-earn">蓄電所ネットは誰から報酬を受け取るのか</a></li><li><a href="/lv/invest/3min-guide">3分でわかる低圧系統用蓄電池投資</a></li></ul>' +
      DISC,
  },
  {
    slug: 'guide-changelog',
    title: '低圧投資家ガイドの更新・訂正履歴',
    lead: 'このページは、低圧投資家ガイドの更新と訂正の記録です。誤りが見つかれば訂正し、ここに履歴を残します（サイト全体の考え方は編集方針へ）。',
    body:
      '<h2>履歴</h2><ul><li>2026年7月: 「投資家のための低圧蓄電所ガイド」を公開（入口別の記事群・登録不要のダウンロード資料12点・無料相談の方針明示）。</li></ul>' +
      '<h2>訂正の方針</h2><p>事実誤認・数値の誤り・誤解を招く表現が見つかった場合、記事を訂正のうえ、このページに「いつ・どの記事を・どう直したか」を追記します。軽微な誤字脱字の修正は履歴の対象外です。制度・市場の変化に伴う内容の更新も、主要なものはここに記録します。</p>' +
      '<h2>お気づきの点があれば</h2><p>「この記述はおかしいのでは」という指摘は、当ガイドの品質そのものです。お問い合わせからお寄せください。確認のうえ、必要な訂正と履歴の追記を行います。</p>' +
      '<h2>次に読む</h2><ul><li><a href="/lv/invest/consultation-policy">よくあるご相談と回答の方針</a></li><li><a href="/lv/invest/how-we-verify">販売会社からの情報をどう確認しているか</a></li><li><a href="/editorial-policy">編集方針</a></li></ul>' +
      DISC,
  },
];

async function getJson(url: string): Promise<any> {
  const r = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': API_KEY! } });
  if (!r.ok) throw new Error(`GET ${url} → HTTP ${r.status}`);
  return r.json();
}

async function main(): Promise<void> {
  console.log(`[lv-invest B8] ${ARTICLES.length}本 投入（${DRY ? 'DRY-RUN' : '本番POST'}）`);
  const normBody = (s: string) =>
    s
      .replace(/\s+id="[^"]*"/g, '')
      .replace(/&amp;/g, '&')
      .replace(/ colspan="1" rowspan="1"/g, '')
      .replace(/<\/?tbody>/g, '')
      .replace(/<(th|td)><p>/g, '<$1>')
      .replace(/<\/p><\/(th|td)>/g, '</$1>');
  for (const a of ARTICLES) {
    const exists = (await getJson(`${BASE}?limit=0&filters=slug[equals]${a.slug}`)).totalCount;
    if (exists > 0) { console.log(`SKIP(既存): ${a.slug}`); continue; }
    if (DRY) { console.log(`[dry] would POST: ${a.slug} (${a.title})`); continue; }

    const payload = { title: a.title, slug: a.slug, category: ['低圧投資'], lead: a.lead, body: a.body };
    await sleep(700);
    const r = await fetch(BASE, { method: 'POST', headers: HEADERS, body: JSON.stringify(payload) });
    const body = await r.json();
    if (!r.ok) throw new Error(`POST ${a.slug} → HTTP ${r.status}: ${JSON.stringify(body)}`);
    await sleep(700);
    const got = (await getJson(`${BASE}/${body.id}`)) as { slug: string; title: string; category: string[]; lead: string; body: string };
    const catOk = Array.isArray(got.category) && got.category.includes('低圧投資');
    const fieldOk = got.slug === a.slug && got.title === a.title && got.lead === a.lead && normBody(got.body) === normBody(a.body);
    console.log(`POST OK: ${a.slug} (id=${body.id}) category=${JSON.stringify(got.category)} 全field=${fieldOk ? '一致' : 'DIFF!'}`);
    if (!catOk || !fieldOk) { console.error(`FATAL: ${a.slug} の照合不一致（#106）`); process.exit(3); }
  }
  const total = (await getJson(`${BASE}?limit=0`)).totalCount;
  const inv = (await getJson(`${BASE}?limit=0&filters=category[contains]低圧投資`)).totalCount;
  console.log(`=== 完了: explainer totalCount=${total} / 低圧投資=${inv} ===`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

export {};
