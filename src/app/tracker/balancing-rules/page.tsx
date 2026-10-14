/**
 * /tracker/balancing-rules — 需給調整市場 制度変更トラッカー（T8 実装便・2026-10-14）
 *
 * 便: OneDrive 03_5月13日朝_実行/T8_実装便_需給調整市場_制度変更トラッカー_…（裁定 T8-R1〜R8）。
 *   - 定義は src/data/balancing-rules.ts（生成物＝研究便の data.json＋追補 JSON）。force-static・外部 API 0（鉄則 #2）。
 *   - 上限価格の数値は src/lib/balancing-cap.ts（カタログ）から出し、焼き込まない（R5・#119・#121）。
 *   - 前後比較の範囲は build 時の monthlyCoverageYms() で判定（R6）。関連は表示中のものだけ（R7）。
 *   - 全行の title・日付・逐語・一次を初期 DOM に載せる（#107）。当サイトは改定の良し悪しを評価しない。
 *   - 日本語の文の途中に JSX の改行由来の半角空白を入れないよう、段落は文字列で書く。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import BalancingRulesTimeline, { type RuleView, type TimelineView } from '@/components/BalancingRulesTimeline';
import { siteConfig } from '@/lib/site-config';
import { BALANCING_RULES, BALANCING_RULES_CHECKED, BALANCING_RULES_PENDING, type BalancingRule } from '@/data/balancing-rules';
import { KIND_LABEL, PRODUCT_LABEL, STATUS_LABEL, benchmarkLinkOf, buildTimelineItems, dateLabel, publisherShort, sortAreas, sortTimeline, ymLabel } from '@/lib/balancing-rules';
import { visibleRelated } from '@/lib/balancing-rules-related';
import { monthlyCoverageYms } from '@/lib/eprx-monthly';
import { capAt, type CapProductKey, CAP_PRODUCT_KEYS } from '@/lib/balancing-cap';

export const dynamic = 'force-static';

const PAGE_PATH = '/tracker/balancing-rules';
// 受け入れ基準: title に主要キーワード「蓄電池/蓄電所」（区分 E＝蓄電池に関わる要件）。5 区分を description とそろえる
const TITLE = '需給調整市場 制度変更トラッカー（上限価格・募集量・商品仕様・ガイドライン・蓄電池の要件）';
const LEAD = '一次が取れた改定だけを載せています（網羅ではありません）。日付は公表日（一次の日付）と適用日（実需給日）を分けています。当サイトは改定の良し悪しや収益への影響を評価しません。';

export const metadata: Metadata = {
  title: TITLE,
  description: `需給調整市場の制度の改定を、上限価格・募集量・商品仕様・ガイドライン・蓄電池に関わる要件の 5 区分で、公表日と適用日（実需給日）を分けて並べたタイムライン。各改定に EPRX・OCCTO・資源エネルギー庁などの一次の逐語つき。改定の良し悪しは評価しません。`,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: TITLE,
    description: '需給調整市場の制度の改定を、一次の逐語つきで公表日と適用日を分けて並べたタイムライン。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const linkStyle = { color: 'var(--color-accent)' } as const;
const p15 = { fontSize: 15, lineHeight: 1.8, marginBottom: 12 } as const;

/** 上限価格の行（区分 A）: 適用日の上限をカタログから（焼き込まない） */
function capLineOf(r: BalancingRule): string | null {
  if (r.kind !== 'cap' || !r.effectiveFrom) return null;
  const date = r.effectiveFrom;
  const parts = CAP_PRODUCT_KEYS.filter((k) => (r.products as string[]).includes(k)).map((k) => {
    const v = capAt(k as CapProductKey, date);
    return v === null ? null : `${PRODUCT_LABEL[k as keyof typeof PRODUCT_LABEL]} ${v.toFixed(2)}`;
  }).filter((x): x is string => !!x);
  // 三次調整力②はカタログに上限価格の系列が無い（EPRX の表も「上限無し」）
  const tertiary2 = (r.products as string[]).includes('tertiary-2') ? '・三次調整力② 上限無し' : '';
  return parts.length ? `${dateLabel(date)}時点 ${parts.join('・')}${tertiary2}（円/ΔkW・30分）` : null;
}

function viewOf(r: BalancingRule, coverage: readonly string[]): RuleView {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    announcedLabel: dateLabel(r.announcedOn),
    effectiveLabel: r.effectiveFrom ? dateLabel(r.effectiveFrom) : null,
    products: r.products,
    areas: r.areas,
    before: r.before,
    after: r.after,
    reasonQuote: r.reasonQuote,
    batteryNote: r.batteryNote,
    sources: r.sources.map((s) => ({ name: s.name, publisher: s.publisher, url: s.url, where: s.where, quote: s.quote, dateLabel: s.date ? dateLabel(s.date) : null })),
    // 裁定 T8-R7: 表示中の解説・政策イベントだけ結ぶ（src/lib/balancing-rules-related.ts・verify も同じ関数を使う）
    ...visibleRelated(r),
    capLine: capLineOf(r),
    bench: benchmarkLinkOf(r, coverage),
    dateException: r.dateException,
  };
}

export default function BalancingRulesPage() {
  const url = `${siteConfig.url}${PAGE_PATH}`;
  const coverage = monthlyCoverageYms();
  const items: TimelineView = buildTimelineItems(BALANCING_RULES).map((it) =>
    it.type === 'row' ? { type: 'row', row: viewOf(it.row, coverage) } : { type: 'group', key: it.key, fiscalYear: it.fiscalYear, rows: it.rows.map((r) => viewOf(r, coverage)) },
  );
  const areas = sortAreas(BALANCING_RULES.flatMap((r) => r.areas));
  const pending = BALANCING_RULES_PENDING.map((r) => ({ r, v: viewOf(r, coverage) }));
  const counts = Object.fromEntries(Object.keys(KIND_LABEL).map((k) => [k, BALANCING_RULES.filter((r) => r.kind === k).length]));
  const publishers = [...new Set([...BALANCING_RULES, ...BALANCING_RULES_PENDING].flatMap((r) => r.sources.map((s) => publisherShort(s.publisher))))];

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: TITLE,
    url,
    numberOfItems: BALANCING_RULES.length,
    // 画面の並び（適用日の新しい順＝sortTimeline）で position を振る
    itemListElement: sortTimeline(BALANCING_RULES).map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.title, url: `${url}#rule-${r.id}` })),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      { '@type': 'ListItem', position: 2, name: '業界トラッカー', item: `${siteConfig.url}/tracker` },
      { '@type': 'ListItem', position: 3, name: '需給調整市場 制度変更トラッカー', item: url },
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
            <Link href="/">トップ</Link> / <Link href="/tracker">業界トラッカー</Link> / 需給調整市場 制度変更トラッカー
          </p>
          <div className="section-label">制度の改定 · 一次の逐語つき</div>
          <h1 className="section-title">{TITLE}</h1>
          <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.8, margin: '0 0 12px' }}>{LEAD}</p>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.8 }}>
            {`需給調整市場の制度の改定 ${BALANCING_RULES.length} 件を、適用日の新しい順（適用日が一次に無い行は公表日で）に並べ、揚水発電機の随意契約に伴う募集量の見直しは年度ごとにまとめています（${Object.entries(counts).map(([k, n]) => `${KIND_LABEL[k as keyof typeof KIND_LABEL]} ${n} 件`).join('、')}）。各行の開閉欄に、変更前・変更後の一次の逐語と、一次資料（資料名・発行者・該当箇所・資料の日付）を載せています。`}
          </p>

          <BalancingRulesTimeline items={items} areas={areas} />

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>{'予定・検討中・注視（改定ではないもの）'}</h2>
          <p style={p15}>{'次の項目は、改定として適用日が一次に無いか、改定ではないため、上のタイムラインには入れていません。一次の書きぶりをそのまま載せます。'}</p>
          {pending.map(({ r, v }) => (
            <article key={r.id} id={`rule-${r.id}`} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', margin: '10px 0', background: '#fafafa', overflowWrap: 'anywhere' }}>
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{`${r.status === 'effective' ? '' : STATUS_LABEL[r.status]}・区分 ${KIND_LABEL[r.kind]}（整理番号 ${r.id}）`}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 6px', lineHeight: 1.6 }}>{r.title}</h3>
              <p style={{ fontSize: 14, margin: '0 0 6px' }}>{`公表日（一次の日付）: ${v.announcedLabel}　適用日（実需給日）: ${v.effectiveLabel ?? '適用日は一次に無し'}`}</p>
              {r.dateException && <p style={{ fontSize: 13, margin: '0 0 6px', color: 'var(--color-muted)', lineHeight: 1.7 }}>{`注記: ${r.dateException}`}</p>}
              {r.pendingQuote && (
                <p style={{ fontSize: 14, margin: '0 0 6px', lineHeight: 1.7 }}>
                  {`一次の書きぶり: 「${r.pendingQuote}」`}
                  {r.pendingQuoteSource !== null && r.sources[r.pendingQuoteSource]
                    ? `（${r.sources[r.pendingQuoteSource].publisher}「${r.sources[r.pendingQuoteSource].name}」${r.sources[r.pendingQuoteSource].where}）`
                    : ''}
                </p>
              )}
              <details style={{ fontSize: 14, lineHeight: 1.7 }}>
                <summary style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>{'一次資料'}</summary>
                <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                  {v.sources.map((s, i) => (
                    <li key={`${s.url}-${i}`} style={{ marginBottom: 4 }}>
                      {`${s.publisher}「`}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>{s.name}</a>
                      {`」${s.dateLabel ? `（${s.dateLabel}）` : ''}　${s.where}`}
                      <span style={{ display: 'block', color: 'var(--color-muted)' }}>{`逐語: ${s.quote}`}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>{'このトラッカーの決まり'}</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 22, marginBottom: 20 }}>
            <li>{'載せるのは、電力需給調整力取引所（EPRX）・電力広域的運営推進機関（OCCTO）・資源エネルギー庁の審議会資料・電力・ガス取引監視等委員会の公表・一般送配電事業者の告知などの一次で確かめられた改定だけです。報道や解説記事は根拠にしていません。'}</li>
            <li>{'公表日は、その改定の内容（または時期）を一次が示した日（決定の資料・告知の日付）です。EPRX の取引規程の改定で入った変更は、改定を公表した EPRX の告知の日にそろえています。適用日は実需給日（受渡日）で、一次に日単位の記載が無いものは「適用日は一次に無し」としています。一次が実施日・適用日だけを書いている行は、その旨を「日付の注記」に書いています。'}</li>
            <li>{'上限価格の行の「上限価格（カタログ）」の欄の数値は、当サイトのデータカタログ（上限価格の系列）から表示しています。題名と変更後の欄の数値は一次の表の値で、カタログの値と一致することをビルドのたびに確かめています。'}</li>
            <li>{`「前後の月を入札ベンチマークで比べる」から、改定の前後 3 か月の月次平均を入札ベンチマークで開けます（改定が月の途中のときは、その月を前後どちらにも入れていません）。後の期間の月次がまだ無い行は、月次の公表後に比べられます。月次の範囲（${coverage.length ? ymLabel(coverage[0]) : '—'}から）より前の月を含む行は比べられません。`}</li>
            <li>{'開閉欄の〔〕内は当サイトの補足で、一次の文ではありません。「／」は別の箇所からの抜き出しのつなぎ目です。'}</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>{'関連'}</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22, marginBottom: 20 }}>
            <li><Link href="/tools/balancing-benchmark" style={linkStyle}>需給調整 入札ベンチマーク（蓄電池）</Link></li>
            <li><Link href="/tracker/imbalance" style={linkStyle}>需給調整市場 約定価格トラッカー</Link></li>
            <li><Link href="/policy-calendar" style={linkStyle}>政策カレンダー</Link></li>
            <li><Link href="/glossary/balancing-market" style={linkStyle}>用語集「需給調整市場」</Link></li>
          </ul>

          <section className="article-sources">
            <h3>出典</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>
              {`各改定の一次資料は、それぞれの行の開閉欄に資料名・発行者・該当箇所・資料の日付・逐語つきで載せています（一次は ${dateLabel(BALANCING_RULES_CHECKED.from)}〜${dateLabel(BALANCING_RULES_CHECKED.to)} に取り直して確かめました）。発行者: ${publishers.join('・')}。`}
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
