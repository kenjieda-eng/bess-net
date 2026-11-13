/**
 * /tracker/deals — 蓄電所の売買・出資 公表事例トラッカー（売買事例の一覧便・2026-11-10）
 *
 * 便: OneDrive 03_5月13日朝_実行/売買事例の一覧便_tracker-dealsを新設・…_2026-10-29起草_ユウ.md（＋11/10 の追補）。
 * 裁定: 02_計画・運営/売買事例_裁定_原則15と81行と設計13問_2026-10-27_ユウ.md（原則 R1〜R15・81 行・設計 13 問）。
 *   - データは src/data/deals.json（真実源・直接足していく）。force-static・runtime と build の microCMS は 0（鉄則 #2／#3）。
 *   - 件数・内訳は焼き込まずデータから数える。並びは compareDealsForDisplay 1 か所（#124）。JSON-LD の position も同じ順。
 *   - 全行の見出し・日付・発表者・逐語を初期 DOM に載せる（#107）。当サイトは仲介しない・評価しない。
 *   - 冒頭の 1 行は案 A（2 文目は NextStepBox の他社の案件の 1 行と一字一句同じ・裁定 §3-1）。
 *   - 次の一歩は一覧の後に introduce と sell の 2 枠（他社の案件の切り替え・行ごとには置かない・裁定 §3-2）。
 *   - 日本語の文の途中に JSX の改行由来の半角空白を入れないよう、段落は文字列で書く。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NextStepBox from '@/components/NextStepBox';
import CorrectionHistory from '@/components/CorrectionHistory';
import DealsList, { type DealView } from '@/components/DealsList';
import { siteConfig } from '@/lib/site-config';
import { contactUrl } from '@/lib/contact-link';
import {
  DEALS_FILE,
  KIND_LABEL,
  KIND_ORDER,
  MARK_LABEL,
  MARK_ORDER,
  dealDateLabel,
  dealHeading,
  sortDeals,
  type Deal,
} from '@/lib/deals';
import { isVisibleNewsSlug, isVisibleProjectSlug } from '@/lib/deals-related';

export const dynamic = 'force-static';

const PAGE_PATH = '/tracker/deals';
// 受け入れ基準: title に主要キーワード「蓄電所」。種類に「成約の支援」は無い（裁定 R9）
const TITLE = '蓄電所の売買・出資 公表事例トラッカー（取得・譲渡・出資・ファンドの組成）';
const LEAD = '各社の発表・適時開示・有価証券報告書などの一次で確かめた、蓄電所の売買・出資の公表事実だけを並べています（網羅ではありません）。このページの案件の売買を仲介・紹介するものではありません。';

export const metadata: Metadata = {
  title: TITLE,
  description: '蓄電所の取得・譲渡・出資・ファンドの組成・接続権や用地の取得のうち、各社の発表・適時開示などの一次で確かめた公表事例を、公表日の新しい順に一次の逐語つきで並べた一覧。網羅ではありません。当サイトは掲載の案件の売買を仲介・紹介しません。',
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: TITLE,
    description: '蓄電所の売買・出資の公表事例を、一次の逐語つきで公表日の新しい順に並べた一覧（網羅ではありません）。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const linkStyle = { color: 'var(--color-accent)' } as const;

function viewOf(d: Deal): DealView {
  return {
    id: d.id,
    heading: dealHeading(d),
    year: d.announcedOn.slice(0, 4),
    announcedLabel: dealDateLabel(d.announcedOn),
    publisher: d.publisher,
    kinds: d.kinds,
    stages: d.stages,
    areas: d.areas,
    marks: d.marks,
    placeText: d.places.map((p) => p.text).filter(Boolean).join('／'),
    scale: d.scale,
    parties: d.parties,
    price: d.price,
    note: d.note,
    sources: d.sources.map((s) => ({
      title: s.displayTitle ?? s.title,
      titleNote: s.displayTitle ? '〔利回りの表示を省略〕' : '',
      publisher: s.publisher,
      url: s.url,
      roleLabel: s.role === 'primary' ? '行の出典' : '関連の発表',
      publishedLabel: s.publishedOn ? dealDateLabel(s.publishedOn) : null,
      modifiedLabel: s.modifiedOn ? dealDateLabel(s.modifiedOn) : null,
      fetchedLabel: dealDateLabel(s.fetchedOn),
      quotes: s.quotes.map((q) => ({ where: q.where, text: q.text })),
    })),
    // 設計 3-12 の 4: 表示中の記事・プロジェクトだけ結ぶ（src/lib/deals-related.ts・verify も同じ関数）
    newsSlug: isVisibleNewsSlug(d.newsSlug) ? d.newsSlug : null,
    projectSlugs: d.projectSlugs.filter(isVisibleProjectSlug),
  };
}

export default function DealsPage() {
  const url = `${siteConfig.url}${PAGE_PATH}`;
  const deals = sortDeals(DEALS_FILE.items);
  const views = deals.map(viewOf);
  const years = [...new Set(deals.map((d) => d.announcedOn.slice(0, 4)))]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((year) => ({ year, count: deals.filter((d) => d.announcedOn.startsWith(year)).length }));
  const kindCounts = KIND_ORDER.map((k) => `${KIND_LABEL[k]} ${deals.filter((d) => d.kinds.includes(k)).length} 件`).join('、');
  const markCounts = MARK_ORDER.map((m) => ({ m, n: deals.filter((d) => d.marks.includes(m)).length }))
    .filter((x) => x.n > 0)
    .map((x) => `${MARK_LABEL[x.m]} ${x.n} 件`)
    .join('、');
  const priced = deals.filter((d) => d.price).length;
  const publishers = [...new Set(deals.flatMap((d) => d.sources.map((s) => s.publisher.trim())))];

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: TITLE,
    url,
    numberOfItems: deals.length,
    // 画面の並び（compareDealsForDisplay）で position を振る
    itemListElement: views.map((v, i) => ({ '@type': 'ListItem', position: i + 1, name: v.heading, url: `${url}#deal-${v.id}` })),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      { '@type': 'ListItem', position: 2, name: '業界トラッカー', item: `${siteConfig.url}/tracker` },
      { '@type': 'ListItem', position: 3, name: '蓄電所の売買・出資 公表事例', item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1080 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/tracker">業界トラッカー</Link> / 蓄電所の売買・出資 公表事例
          </p>
          <div className="section-label">公表事例 · 一次の逐語つき</div>
          <h1 className="section-title">{TITLE}</h1>
          <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.8, margin: '0 0 12px' }}>{LEAD}</p>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.8 }}>
            {`蓄電所の売買・出資の公表事例 ${deals.length} 件を、公表日（行の出典の一次の日付）の新しい順に並べています（${kindCounts}。1 行が複数の種類を持つことがあります${markCounts ? `。印は${markCounts}` : ''}。価格が一次に書いてある行は ${priced} 件）。段階と当事者は発表の時点のものです。各行の開閉欄に、一次の題名・発行者・日付と、要の欄の逐語を載せています。`}
          </p>

          <DealsList items={views} years={years} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '0 20px' }}>
            <NextStepBox variant="introduce" othersProject />
            <NextStepBox variant="sell" othersProject />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>{'この一覧の決まり'}</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 22, marginBottom: 20 }}>
            <li>{'載せるのは、蓄電所の取得・譲渡・出資・ファンドの組成・接続権や用地の取得のうち、取引の完了か、売買契約・出資契約の締結が一次（発表者の公表文・適時開示・有価証券報告書など）に書いてあるものです（2024年1月以降の公表）。報道や解説記事は根拠にしていません。'}</li>
            <li>{'載せないもの: 基本合意・覚書・検討の開始・出資の記載の無い業務提携・方針や予定の発表、決議や決定だけで実行・締結が書かれていない発表、自社で建てる蓄電所の工事の発注や完成した設備の引渡し、蓄電池などの製品の売買、運用権の契約（オフテイク・トーリング）、融資、自社だけで行う投資（共同の出資者や取引の相手が一次に無いもの）や子会社の設立、売買の場やマッチングのサービスの告知。'}</li>
            <li>{'1 つの取引は 1 行です。最初に取引を公表した一次を行の出典と公表日にし、同じ取引のほかの発表は「関連の発表」として開閉欄に載せています。月ごとの進捗の発表は、新しく出た取引があるときだけ行にしています。決議や予定の発表が最初の公表だった取引は、後の一次で締結か完了が確かめられたときに、最初の発表の日付で載せています（確かめた一次は、開閉欄の「関連の発表」にあります）。'}</li>
            <li>{'公表の後に、中止や解約が開示された取引は載せません。載せた後に開示されたときは、行を外すか直して、訂正履歴に書きます。'}</li>
            <li>{'段階は発表の時点のもので、一次に書いてある語だけで決めています（書いていなければ「不明」）。発表の後に段階が変わっても、行は書き換えません。'}</li>
            <li>{'価格は、成約した個別の取引の金額（出資額・ファンドの総額を含む）が一次に書いてあるときだけ、一次のラベルと逐語で載せています。kW・kWh あたりには換算しません。下限だけが開示されているものは「以上」のまま載せます。利回り・想定収益・募集の状況・総事業費の見込みは、一次にあっても価格の欄に載せません（開閉欄の逐語にも、利回り・出資単位・宣伝の言い回し・会社全体の目標は入れていません）。載せていない行は「—」です。'}</li>
            <li>{'規模は、その取引の対象の値で、一次の逐語として確かめたものだけを載せています（目標や計画の値は載せません）。載せていない行は「—」で、一次の書きぶりは開閉欄の逐語にあります。'}</li>
            <li>{'印: 「海外」は案件の所在地が日本の外のもの、「併設」は一次に太陽光発電などと同じ地点とあるもの、「低圧の区画販売」は一次に区画の販売があるものです。'}</li>
            <li>{'エリアは一般送配電の供給エリアです。県の中で供給エリアが分かれる県は、一次の所在地（市区町村）で決めています。'}</li>
            <li>{'〔〕内は当サイトの補足で、一次の文ではありません。開閉欄の「」内は一次の逐語で、「／」は別の箇所からの抜き出しのつなぎ目、「…」は略した所です。出典の題名は一次のままですが、題名の中の利回りの表示は省いています。'}</li>
            <li>{'網羅ではありません。当サイトが相談などを通じて知った案件は、了承があっても載せません。'}</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>{'関連'}</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22, marginBottom: 20 }}>
            <li><Link href="/tracker" style={linkStyle}>業界トラッカー</Link></li>
            <li><Link href="/projects" style={linkStyle}>蓄電所プロジェクトDB</Link></li>
            <li><Link href="/operators" style={linkStyle}>事業者ナビ</Link></li>
            <li><Link href="/news" style={linkStyle}>蓄電池ニュース</Link></li>
          </ul>

          <section className="article-sources">
            <h3>出典</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>
              {`各行の一次資料は、それぞれの行の開閉欄に題名・発行者・日付・取得日と要の欄の逐語つきで載せています。取引を探したのは ${dealDateLabel(DEALS_FILE.newsCheckedThrough)} までの公表で、それより後に公表された取引は載せていません。2026年10月より後の公表は、当サイトの蓄電池ニュースに載せた発表から探しています。一次は ${dealDateLabel(DEALS_FILE.checked.from)}${DEALS_FILE.checked.to !== DEALS_FILE.checked.from ? `〜${dealDateLabel(DEALS_FILE.checked.to)}` : ''} に確かめました。発行者: ${publishers.join('／')}。`}
            </p>
          </section>

          <div className="page-section" style={{ background: 'var(--color-bg)', padding: 16, borderRadius: 8, fontSize: 15, color: 'var(--color-muted)' }}>
            <p style={{ margin: 0 }}>
              {'掲載内容に関するご指摘は '}
              <a href={contactUrl({ campaign: 'tracker_deals', position: 'feedback' })} target="_blank" rel="noopener noreferrer">
                {'お問い合わせ'}
              </a>
              {' よりご連絡ください。'}
            </p>
          </div>

          <CorrectionHistory path="/tracker/deals" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
