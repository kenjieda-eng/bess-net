/**
 * /tools/balancing-benchmark — 需給調整 入札ベンチマーク（蓄電池）（T1 実装便・2026-10-08）
 *
 * 仕様: reports/tool-balancing-benchmark-plan-2026-10-08.md（設計書）と T1 実装便の裁定 R1〜R9。
 *  - force-static（データはビルド時のカタログだけ）。カタログ JSON はこのサーバ側で読み、月の配列・上限・出典の文字列だけを
 *    クライアント（BalancingBenchmark）へ props で渡す。
 *  - 範囲・月数・既定の期間はすべて summary（全電源・蓄電池の月次 12 本に共通する年月）から＝焼き込まない。
 *  - 鉄則 #2: 外部 API 0・microCMS 0。
 *  - 当サイトは評価者ではない（事業者名の欄・順位・良し悪しの語を置かない）。入力はサイト側に残さない（URL は商品と期間だけ）。
 */

import { Fragment } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { BalancingBenchmark } from '@/components/BalancingBenchmark';
import { siteConfig } from '@/lib/site-config';
import { eprxNoticeLinesForDisplay, normalizeLicenseUrl, EPRX_TOP } from '@/lib/eic-license';
import { monthlySourceLinesOf, EPRX_MONTHLY_SOURCE } from '@/lib/eprx-monthly';
import { capNoteValues, capRevisionCitationText, capSourceLines, CAP_SOURCE_NAME } from '@/lib/balancing-cap';
import {
  BENCH_PRODUCTS,
  CAP_NEAR_RATIO,
  CSV_SAVE_LABEL,
  NEAR_CAP_PRODUCTS,
  capRatio,
  SINGLE_AND_COMPOSITE_CAP_PRODUCTS,
  defaultPeriod,
  type BenchProductKey,
} from '@/lib/balancing-benchmark-calc';
// 台帳の約定率の列名と定義（R8: 定義は asset-ledger-spec.ts 1 か所・#119）
import { LEDGER_RATE_COLUMNS, LEDGER_TITLE } from '@/lib/asset-ledger-spec';
// 市場データの組み立ては scripts/verify-balancing-benchmark.ts と同じ関数（#119）
import { buildBenchMonths, benchLabels, fiscalYearOfYm } from '@/lib/balancing-benchmark-data';
// 利用条件の 3 行は /tools/balancing-revenue と同じ系列から（scripts/verify-eprx-monthly.ts の DISPLAYED_LICENSE_SERIES と対）
import primaryBatteryData from '@/data/eic/balancing-price-primary-battery.json';

export const dynamic = 'force-static';

const PAGE_PATH = '/tools/balancing-benchmark';

// ─── summary（ページ全体で使う数値の出どころ・1 か所＝設計書 2-5） ───
const MONTHS = buildBenchMonths();
const YMS = MONTHS.map((m) => m.ym);
const SUMMARY = {
  first: YMS[0],
  last: YMS[YMS.length - 1],
  months: YMS.length,
  products: BENCH_PRODUCTS.length,
};
const DEFAULT_PERIOD = defaultPeriod(YMS);
const FYS = [...new Set(YMS.map(fiscalYearOfYm))];
const ymLabel = (ym: string) => `${Number(ym.slice(0, 4))}年${Number(ym.slice(5, 7))}月`;
const LABELS = benchLabels(FYS[FYS.length - 1]);

/** 範囲の中で月内に上限が変わる月（R4 の注記に出す） */
const CAP_CHANGES = [
  ...new Set(
    MONTHS.flatMap((m) => BENCH_PRODUCTS.map((p) => m.cap[p]).filter((c) => c?.changedOn).map((c) => c!.changedOn as string)),
  ),
].sort();
const ymdJa = (d: string) => `${Number(d.slice(0, 4))}年${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;
const listJa = (ps: readonly BenchProductKey[]) => ps.map((p) => LABELS[p]).join('・');
/** 上限価格の設定が範囲内で一度も無い商品（三次②） */
const NO_CAP_PRODUCTS = BENCH_PRODUCTS.filter((p) => MONTHS.every((m) => m.cap[p] === null));
/** 二次②・三次①の単独応札の上限（範囲内の値。1 つならその値・複数なら幅）。焼き込まない（R3） */
const SINGLE_CAP_TEXT = (() => {
  const vs = [
    ...new Set(MONTHS.flatMap((m) => SINGLE_AND_COMPOSITE_CAP_PRODUCTS.flatMap((p) => (m.cap[p] ? [m.cap[p]!.start, m.cap[p]!.end] : [])))),
  ].sort((a, b) => a - b);
  if (vs.length === 0) return null;
  return `${vs.length === 1 ? vs[0].toFixed(2) : `${vs[0].toFixed(2)}〜${vs[vs.length - 1].toFixed(2)}`} 円/ΔkW・30分`;
})();
/** 範囲内に、蓄電池の月次平均が単独応札の上限を上回る月がある商品（無い商品は「上回る月があります」の文に入れない） */
const OVER_SINGLE_CAP_PRODUCTS = SINGLE_AND_COMPOSITE_CAP_PRODUCTS.filter((p) =>
  MONTHS.some((m) => m.battery[p] !== null && m.cap[p] !== null && (m.battery[p] as number) > m.cap[p]!.effective),
);
/**
 * 上限の改定の一次（EPRX 公表）を出典欄に併記するか。/tools/balancing-revenue と同じ判定（capNoteValues の revisionCitation）で、
 * 範囲の中に改定日の月が入るときだけ出す（WARN は収益シナリオの capNote() 側で 1 回だけ出る）。
 */
const CAP_NOTE = capNoteValues();
const CAP_REVISION_CITATION = CAP_NOTE.revision.from.slice(0, 7) <= SUMMARY.last ? capRevisionCitationText(CAP_NOTE) : '';

// ─── 出典 ───
const EPRX_META = primaryBatteryData.meta as unknown as { license_notice?: string; license_url?: string };
const EPRX_NOTICE_LINES = eprxNoticeLinesForDisplay(EPRX_META.license_notice);
const EPRX_LICENSE_URL = normalizeLicenseUrl(EPRX_META.license_url) ?? 'https://www.eprx.or.jp/terms/';
const SOURCE_ALL = monthlySourceLinesOf(FYS, 'all').join('／');
const SOURCE_BATTERY = monthlySourceLinesOf(FYS, 'battery').join('／');
const SOURCE_CAP = capSourceLines().join('／');
const THETA = `${Math.round(CAP_NEAR_RATIO * 100)}%`;
/** 全電源の月次平均の上限比の最大（範囲内・印を全電源に付けない理由＝R2 を数値で示す。焼き込まない） */
const ALL_MAX_RATIO = Math.max(0, ...MONTHS.flatMap((m) => BENCH_PRODUCTS.map((p) => capRatio(m.all[p], m.cap[p]) ?? 0)));

export const metadata: Metadata = {
  title: '需給調整 入札ベンチマーク（蓄電池）— 自社の落札単価を EPRX の月次平均と比べる',
  description: `需給調整市場で自社の蓄電池が得た月ごとの平均落札単価と約定率を入れると、EPRX 公表の月次平均（全電源・蓄電池）で計算した場合との差を月別と期間合計で出します。${ymLabel(SUMMARY.first)}〜${ymLabel(SUMMARY.last)}の ${SUMMARY.months} か月・${SUMMARY.products} 商品。単価・約定率・容量はサイトに残りません。`,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: '需給調整 入札ベンチマーク（蓄電池）',
    description: '自社の月次の落札単価を EPRX 公表の月次平均と比べる（運用の評価ではありません）。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const linkStyle = { color: 'var(--color-accent)' } as const;

export default function BalancingBenchmarkPage() {
  const url = `${siteConfig.url}${PAGE_PATH}`;
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '需給調整 入札ベンチマーク（蓄電池）',
    description: '自社の月次の平均落札単価と約定率を、EPRX 公表の月次平均（全電源・蓄電池）で計算した場合と比べるブラウザ内のツール。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    url,
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: `${siteConfig.url}/tools` },
      { '@type': 'ListItem', position: 3, name: '需給調整 入札ベンチマーク', item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 需給調整 入札ベンチマーク
          </p>
          <div className="section-label">EPRX 月次平均・ブラウザ内 · 無料・登録不要</div>
          <h1 className="section-title">需給調整 入札ベンチマーク（蓄電池）</h1>
          {/* 便の固定注記（冒頭 1 行・逐語） */}
          <p
            style={{
              borderLeft: '4px solid var(--color-accent, #00B5A5)',
              background: '#fffbeb',
              padding: '10px 14px',
              borderRadius: '0 6px 6px 0',
              fontSize: 15,
              lineHeight: 1.7,
              margin: '0 0 16px',
            }}
          >
            公表されている月次平均との比較です。コマ別の入札の良し悪しは公表範囲外で、この結果は運用の評価ではありません。
          </p>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 12, lineHeight: 1.8 }}>
            {`需給調整市場で自社の蓄電池が得た月ごとの平均落札単価と約定率を入れると、同じ容量・同じ約定率のまま単価だけを EPRX 公表の月次平均（全電源・蓄電池）に置き換えて計算した場合との差を、月別と期間合計で出します（${ymLabel(SUMMARY.first)}〜${ymLabel(SUMMARY.last)}の ${SUMMARY.months} か月・${SUMMARY.products} 商品）。`}
          </p>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: '0 0 20px' }}>
            {`入力した単価・約定率・容量は、サーバにもブラウザの保存領域にも残しません（計算はこのページの中だけで行います）。URL には商品と期間だけが入ります。入力を持ち出すときは「${CSV_SAVE_LABEL}」で、この端末にファイルとして保存してください。保存されるのは、いま選んでいる期間の月だけです（契約容量と商品は CSV に入らないので、読み込んだ後に選び直してください。期間は CSV の最初と最後の年月に合わせます）。`}
          </p>

          <div
            style={{
              background: '#fff',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              padding: '20px 16px',
              marginBottom: 24,
            }}
          >
            <BalancingBenchmark months={MONTHS} labels={LABELS} defaultStart={DEFAULT_PERIOD.start} defaultEnd={DEFAULT_PERIOD.end} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>使い方と定義</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.85, paddingLeft: 22, marginBottom: 20 }}>
            <li>{'アグリゲーターの月次報告から、月ごとの平均落札単価（円/ΔkW・30分）と約定率を写します。空欄の月は計算から外し、0 を入れた月は 0 として数えます。単価・約定率・容量のどれかが欠けた月は「不完全」として外します。'}</li>
            <li>
              {`約定率（容量ベース）＝ ${LEDGER_RATE_COLUMNS.capacity.definition}。この定義で、単価がその月の約定量で加重した平均なら、「実績」（単価 × 容量 × コマ数 × 約定率）は ΔkW の約定収益（単価 × 約定量）と一致します。`}
              <Link href="/tools/asset-ledger" style={linkStyle}>{LEDGER_TITLE}</Link>
              {`の「${LEDGER_RATE_COLUMNS.capacity.name}」がこの定義です（「${LEDGER_RATE_COLUMNS.bid.name}＝${LEDGER_RATE_COLUMNS.bid.definition}」は分母が違うので、そのままは写せません）。`}
            </li>
            <li>
              {'この約定率は、'}
              <Link href="/tools/balancing-revenue" style={linkStyle}>需給調整 収益シナリオ</Link>
              {'の「落札率」（これからの見込みとして入れる率）とは別物です。収益の式（単価 × 容量 × コマ数 × 率）は同じ関数を使っています（コマ数は、こちらはその月の日数 × 48、収益シナリオは年間のコマ数の入力）。'}
            </li>
            <li>{`上限比 ＝ 市場の月次平均 ÷ その月の上限価格。蓄電池の月次平均が上限の ${THETA} 以上の月に「上限付近」の印を付けます（${listJa(NEAR_CAP_PRODUCTS)}）。全電源の月次平均は範囲内で最大でも上限の ${(ALL_MAX_RATIO * 100).toFixed(1)}% のため、上限比の列だけを出します。`}</li>
            <li>
              {`${listJa(SINGLE_AND_COMPOSITE_CAP_PRODUCTS)}は、${
                OVER_SINGLE_CAP_PRODUCTS.length > 0 && SINGLE_CAP_TEXT
                  ? `${OVER_SINGLE_CAP_PRODUCTS.length < SINGLE_AND_COMPOSITE_CAP_PRODUCTS.length ? `${listJa(OVER_SINGLE_CAP_PRODUCTS)}で、` : ''}蓄電池の月次平均が単独応札の上限（${SINGLE_CAP_TEXT}）を上回る月があります。`
                  : ''
              }EPRX の上限価格表の注記では、単独応札にはその商品の上限、複合応札には複合商品の上限が適用されます（月次平均に複合応札がどれだけ含まれるかの内訳は、この資料には載っていません）。このため印は付けず、上限の列に単独と複合の両方を出します。${
                NO_CAP_PRODUCTS.length > 0 ? `${listJa(NO_CAP_PRODUCTS)}には上限価格の設定がありません。` : ''
              }`}
            </li>
            {CAP_CHANGES.length > 0 && (
              <li>{`月の途中で上限価格が改定された月（${CAP_CHANGES.map((d) => `${ymdJa(d)}〜`).join('・')}）は、上限比の分母に日数で加重した上限を使います（コマごとの約定量はこのツールでは使わないため、日数での近似です）。`}</li>
            )}
            <li>{'蓄電池・全電源とも、EPRX の月次平均の算出方法（約定量で加重するかどうか）は資料に明記がありません。蓄電池の月次平均は、蓄電池が約定したときの単価水準です。'}</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>この比較で分からないこと</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.85, paddingLeft: 22, marginBottom: 24 }}>
            <li>コマ別の入札の良し悪し（このツールが使うのは月次の平均だけです）。</li>
            <li>市場全体の約定量や、ほかの事業者との比較（このツールは利用者の数字と公表の平均を並べるだけです）。</li>
            <li>平均の取り方（約定量で加重するかどうか）が、市場側と利用者の報告で揃っているかどうか。</li>
          </ul>

          <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
            {'年間の収益の見込みを商品ごとに試算するには'}
            <Link href="/tools/balancing-revenue" style={linkStyle}>需給調整 収益シナリオ（蓄電池）</Link>
            {'、商品別・年次の約定価格と不足率は'}
            <Link href="/tracker/imbalance" style={linkStyle}>需給調整市場 約定価格トラッカー</Link>
            {'、制度の用語は'}
            <Link href="/glossary/balancing-market" style={linkStyle}>用語集「需給調整市場」</Link>
            {'を参照してください。'}
          </p>

          {/* ─── 出典・免責 ─── */}
          <section
            style={{
              padding: '14px 16px',
              background: 'var(--color-bg, #f9fafb)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.8,
            }}
          >
            <strong style={{ color: '#374151', fontSize: 15 }}>出典・免責</strong>
            <br />
            {'・市場の月次平均の出典: '}
            <a href={EPRX_TOP} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              一般社団法人 電力需給調整力取引所（EPRX）
            </a>
            {'「取引実績の取りまとめ結果」より転記・編集。'}
            <br />
            {'・EPRX「サイトのご利用にあたって」の「４．著作権等について」に従い、出典と、編集・加工等を行った旨を記載しています。同項は商用目的での利用に EPRX との事前契約を求めており、当サイトの利用が該当するかは EPRX に照会中です。'}
            <br />
            {`・${EPRX_NOTICE_LINES.length > 1 ? '出典表記・利用条件（EIC カタログ license_notice の逐語）' : '出典表記（EIC カタログ license_notice 1 行目の逐語）'}:「`}
            {EPRX_NOTICE_LINES.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
            {'」 ／ 利用条件: '}
            <a href={EPRX_LICENSE_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              EPRX「サイトのご利用にあたって」
            </a>
            <br />
            {`・全電源の月次平均: 「取引実績の取りまとめ結果」${SOURCE_ALL ? `（${SOURCE_ALL}）` : ''}の「平均落札単価の推移」ページの月次表。`}
            <br />
            {`・蓄電池の月次平均: 同${SOURCE_BATTERY ? `（${SOURCE_BATTERY}）` : ''}の電源種別別 月次平均落札単価（「ー」＝落札なしの月は「約定なし」）。`}
            <br />
            {`・ΔkW 上限価格: 同${SOURCE_CAP ? `（${SOURCE_CAP}）` : ''}の「落札単価の分布」ページの上限価格表${CAP_REVISION_CITATION}。`}
            <br />
            {`・いずれも EIC カタログの系列（カタログの出典表記: ${EPRX_MONTHLY_SOURCE.sourceName ?? CAP_SOURCE_NAME ?? '電力需給調整力取引所 取引実績の取りまとめ結果'}）。データ加工・提供: `}
            <a href="https://data.eic-jp.org" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              data.eic-jp.org
            </a>
            {`（${siteConfig.organization.name}）。`}
            <br />
            {'・本ツールは運用の評価や収益の予測ではありません。契約・運用の判断には一次資料とアグリゲーターの報告を確認してください。'}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
