/**
 * /tools/lcoe-lcos — LCOE・LCOS 計算機（66番）
 *
 * 設計（鉄則#2/#4・落とし穴#92/#103・L-EIC-019/055）:
 *  - 単一 URL・動的ルートなし（静的扱い）。microCMS 0（client-side 計算）。
 *  - 既定値は build 時 precompute 済 NREL ATB / FX JSON を server で読み props 注入。
 *  - revalidate=86400（既定値が変われば再生成）。
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LcoeLcosCalculator, { type SourceProp } from '@/components/LcoeLcosCalculator';
import { siteConfig } from '@/lib/site-config';
// build 時 precompute 済カタログ（鉄則#2/#4）。Ck-1 A8/A9: 読み方を 1 箇所（nrel-atb-reference / fx-reference）に寄せた。
// ★旧版はこのページで ATB の CAPEX・LCOE を読みつつ、CF だけ lcoe-lcos.ts の概数を使い、為替は代替値 158.34 を焼き込んでいた。
import { ATB_SOURCE_NAME, BATTERY_CAPEX, POWER_SOURCE_REFS, atbYearsLabel } from '@/lib/nrel-atb-reference';
import { LCOE_EXCLUDED_NOTE, LCOE_EXCLUDED_SOURCE_KEYS } from '@/lib/lcoe-lcos';
import { FX_USDJPY, fxLabel } from '@/lib/fx-reference';

export const revalidate = 86400;

export const metadata: Metadata = {
  // layout titleTemplate `%s | 蓄電所ネット` が自動付与（落とし穴#86/#88）
  title: '蓄電池 LCOE・LCOS計算機（均等化発電原価・蓄電原価）',
  description:
    '系統用蓄電池の LCOS（均等化蓄電原価）と電源別 LCOE（均等化発電原価）を前提条件から無料試算。NREL ATB（米国前提）の蓄電池CAPEX・電源別のCAPEX・設備利用率・LCOEを基準に、効率・サイクル・割引率等を調整。ブラウザ完結・登録不要。',
  alternates: { canonical: '/tools/lcoe-lcos' },
  openGraph: {
    title: '蓄電池 LCOE・LCOS計算機（無料・登録不要）',
    description:
      '系統用蓄電池のLCOS・電源別LCOEを前提条件から試算。NREL ATB 基準・米国前提/レンジ仮定明記。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function LcoeLcosPage() {
  // ── 蓄電池 LCOS 既定 CAPEX（NREL ATB・$/kW÷4h×USD/JPY）──
  // カタログが無ければ計算機は出さない（代替値を焼き込まない）
  const fxJpyPerUsd = FX_USDJPY ? Math.round(FX_USDJPY.value * 100) / 100 : null;
  const lcosCapex = BATTERY_CAPEX
    ? {
        low: BATTERY_CAPEX.low,
        mid: BATTERY_CAPEX.mid,
        high: BATTERY_CAPEX.high,
        fxJpyPerUsd: BATTERY_CAPEX.fxJpyPerUsd,
        capexUsdPerKwh: BATTERY_CAPEX.usdPerKwh,
        atbYear: BATTERY_CAPEX.atbYear,
        fxMonthLabel: BATTERY_CAPEX.fxMonthLabel,
      }
    : null;

  // ── 電源別（NREL ATB の CAPEX・CF・LCOE。いずれもカタログ）──
  // Ck-1a ■2-8: 燃料費 0 の簡易計算に合わない電源（原子力）は表に出さない（LCOE_EXCLUDED_SOURCE_KEYS）
  const tableRefs = POWER_SOURCE_REFS.filter((s) => !LCOE_EXCLUDED_SOURCE_KEYS.has(s.key));
  const sources: SourceProp[] = tableRefs.map((s) => ({
    key: s.key,
    label: s.label,
    capexUsdPerKw: s.capexUsdPerKw ? Math.round(s.capexUsdPerKw.value) : null,
    capexJpyPerKw: s.capexUsdPerKw && fxJpyPerUsd ? Math.round(s.capexUsdPerKw.value * fxJpyPerUsd) : null,
    capexAtbYear: s.capexUsdPerKw?.atbYear ?? null,
    lcoeUsdPerMwh: s.lcoeUsdPerMwh ? Math.round(s.lcoeUsdPerMwh.value * 10) / 10 : null,
    lcoeAtbYear: s.lcoeUsdPerMwh?.atbYear ?? null,
    cfDefault: s.cf ? Math.round(s.cf.value * 1000) / 1000 : null,
    cfAtbYear: s.cf?.atbYear ?? null,
  }));
  const atbYears = atbYearsLabel(tableRefs);

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LCOE・LCOS計算機',
    alternateName: 'LCOE / LCOS Calculator',
    description:
      '系統用蓄電池のLCOS（均等化蓄電原価）と電源別LCOE（均等化発電原価）を前提条件から無料試算するブラウザ完結ツール。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    url: 'https://bess-net.jp/tools/lcoe-lcos',
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    featureList: [
      'LCOS（均等化蓄電原価）試算（¥/kWh・¥/MWh・$/MWh）',
      'コスト内訳（CAPEX/充電費/O&M 寄与）',
      '電源別 LCOE 比較（太陽光/風力/地熱/水力）',
      'NREL ATB 参考値の並列表示',
      '入力条件付き URL 共有',
    ],
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: 'https://bess-net.jp/tools' },
      { '@type': 'ListItem', position: 3, name: 'LCOE・LCOS計算機', item: 'https://bess-net.jp/tools/lcoe-lcos' },
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
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / LCOE・LCOS計算機
          </p>
          <div className="section-label">NREL ATB 準拠 · 無料・登録不要</div>
          <h1 className="section-title">LCOE・LCOS計算機（均等化発電原価・均等化蓄電原価）</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            系統用蓄電池の <strong>LCOS（均等化蓄電原価）</strong> と、太陽光・風力・地熱・水力の
            <strong>電源別 LCOE（均等化発電原価）</strong> を前提条件から試算します。
            蓄電池CAPEX・電源別のCAPEX・設備利用率・LCOE参考値は <strong>NREL ATB（米国前提・{atbYears}）</strong> を基準に、
            効率・サイクル・割引率などを調整できます。ブラウザ完結・データ送信なし。
          </p>

          {lcosCapex && fxJpyPerUsd !== null ? (
            <LcoeLcosCalculator lcosCapex={lcosCapex} sources={sources} fxJpyPerUsd={fxJpyPerUsd} />
          ) : (
            <p style={{ fontSize: 15 }}>NREL ATB または為替のデータを取得できなかったため、計算機を表示できません。</p>
          )}

          {/* 出典・免責（必須・L-EIC-055、本文そのまま）*/}
          <section style={{ marginTop: 24, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>出典・前提・免責</h2>
            <small style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--color-muted)', display: 'block' }}>
              既定値の出所: {ATB_SOURCE_NAME}（{atbYears}・base year の当年推計・Moderate シナリオ・米国前提）。
              蓄電池CAPEX＝4 時間ユーティリティ規模の $/kW を 4 で割り {fxLabel()} で円換算。
              電源別の CAPEX・設備利用率（CF）・LCOE 参考値も同じ ATB の値です。
              充電単価＝JEPXスポット平均の概数。low/highは感度レンジ（mid±20%）でNREL ATBのシナリオ不確実性に基づく当サイトの仮定であり、
              NRELの予測値そのものではありません。本ツールは概算であり、実際のLCOS/LCOEは案件規模・電池種別・立地・時期で異なります。
              データ提供: EIC Data（CC BY 4.0）。（リンク:{' '}
              <a href="https://atb.nlr.gov/" target="_blank" rel="noopener noreferrer">https://atb.nlr.gov/</a> ・{' '}
              <a href="https://data.eic-jp.org/" target="_blank" rel="noopener noreferrer">https://data.eic-jp.org/</a>）
            </small>
          </section>

          {/* 計算ロジック */}
          <section style={{ marginTop: 16, padding: 20, background: 'var(--color-bg-card, #fff)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>計算ロジック</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, marginTop: 0 }}>
              <li><strong>LCOS</strong> = ( CAPEX + Σ(O&M + 充電費)/(1+r)<sup>t</sup> ) / ( Σ 放電量/(1+r)<sup>t</sup> )。放電量=年サイクル×DoD、充電費=(放電量/RTE)×充電単価、N=min(事業年数, サイクル寿命/年サイクル)。</li>
              <li><strong>LCOE</strong> = ( CAPEX + Σ PV(O&M) + Σ PV(燃料) ) / Σ PV( CF×8760 )。電源別の CAPEX・CF の既定値は NREL ATB（CF は編集可）。</li>
              <li><strong>NREL ATB参考値</strong>は ATB が公表した LCOE（$/MWh）。CF は同じ ATB の値でも、割引率・寿命・O&amp;M などの前提が本ツールの簡易計算と異なるため値は一致しません（比較用）。</li>
              <li><strong>火力・原子力</strong>: {LCOE_EXCLUDED_NOTE}</li>
            </ul>
          </section>

          {/* 関連リンク（curl 200 確認済のみ）*/}
          <section style={{ marginTop: 16, padding: 20, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>関連コンテンツ</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/glossary/lcoe">LCOE（均等化発電原価）— 用語解説</Link></li>
              <li><Link href="/glossary/lcos">LCOS（均等化蓄電原価）— 用語解説</Link></li>
              <li><Link href="/explainer/lcoe-and-bess-economics">解説: LCOEと蓄電池の経済性</Link></li>
              <li><Link href="/tools/irr-simulator">蓄電池IRRシミュレーター</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
