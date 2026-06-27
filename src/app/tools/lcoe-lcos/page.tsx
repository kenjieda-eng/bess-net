/**
 * /tools/lcoe-lcos — LCOE・LCOS 計算機（66番、業界唯一）
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
import { POWER_SOURCES } from '@/lib/lcoe-lcos';
import { siteConfig } from '@/lib/site-config';

// build 時 precompute 済 JSON（鉄則#2/#4）
import atbCapexBattery from '@/data/eic/atb-capex-battery.json';
import fxUsdJpy from '@/data/eic/fx-usdjpy-monthly-avg.json';
import capexPv from '@/data/eic/atb-capex-utility-pv.json';
import capexOnshore from '@/data/eic/atb-capex-onshore-wind.json';
import capexOffshore from '@/data/eic/atb-capex-offshore-wind.json';
import capexNuclear from '@/data/eic/atb-capex-nuclear.json';
import capexGeo from '@/data/eic/atb-capex-geothermal.json';
import capexHydro from '@/data/eic/atb-capex-hydro.json';
import lcoePv from '@/data/eic/atb-lcoe-utility-pv.json';
import lcoeOnshore from '@/data/eic/atb-lcoe-onshore-wind.json';
import lcoeOffshore from '@/data/eic/atb-lcoe-offshore-wind.json';
import lcoeNuclear from '@/data/eic/atb-lcoe-nuclear.json';
import lcoeGeo from '@/data/eic/atb-lcoe-geothermal.json';
import lcoeHydro from '@/data/eic/atb-lcoe-hydro.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  // layout titleTemplate `%s | 蓄電所ネット` が自動付与（落とし穴#86/#88）
  title: 'LCOE・LCOS計算機（均等化発電原価・均等化蓄電原価）',
  description:
    '系統用蓄電池の LCOS（均等化蓄電原価）と電源別 LCOE（均等化発電原価）を前提条件から無料試算。NREL ATB 2024（米国前提）の蓄電池CAPEX・電源別CAPEX/LCOEを基準に、効率・サイクル・割引率等を調整。ブラウザ完結・登録不要。',
  alternates: { canonical: '/tools/lcoe-lcos' },
  openGraph: {
    title: 'LCOE・LCOS計算機（業界唯一・無料）',
    description:
      '系統用蓄電池のLCOS・電源別LCOEを前提条件から試算。NREL ATB 2024基準・米国前提/レンジ仮定明記。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

type EicJson = { points?: { date: string; value: number | null }[] };
function lastValue(d: EicJson, fallback: number): number {
  const pts = (d.points ?? []).filter((p) => p.value != null);
  return pts.length ? (pts[pts.length - 1].value as number) : fallback;
}

const CAPEX_BY_KEY: Record<string, EicJson> = {
  'utility-pv': capexPv, 'onshore-wind': capexOnshore, 'offshore-wind': capexOffshore,
  'nuclear': capexNuclear, 'geothermal': capexGeo, 'hydro': capexHydro,
};
const LCOE_BY_KEY: Record<string, EicJson> = {
  'utility-pv': lcoePv, 'onshore-wind': lcoeOnshore, 'offshore-wind': lcoeOffshore,
  'nuclear': lcoeNuclear, 'geothermal': lcoeGeo, 'hydro': lcoeHydro,
};

export default function LcoeLcosPage() {
  // ── 蓄電池 LCOS 既定 CAPEX（NREL ATB 2024、$/kW÷4h×fx）──
  const fxJpyPerUsd = Math.round(lastValue(fxUsdJpy, 158.34) * 100) / 100;
  const capexUsdPerKw = lastValue(atbCapexBattery, 2101);
  const capexUsdPerKwh = Math.round((capexUsdPerKw / 4) * 100) / 100;
  const mid = Math.round((capexUsdPerKwh * fxJpyPerUsd) / 1000) * 1000;   // ≒ 83,000
  const lcosCapex = {
    low: Math.round((mid * 0.8) / 100) * 100,
    mid,
    high: Math.round((mid * 1.2) / 100) * 100,
    fxJpyPerUsd,
    capexUsdPerKwh,
  };

  // ── 電源別（NREL ATB CAPEX/LCOE 実値 + 代表CF）──
  const sources: SourceProp[] = POWER_SOURCES.map((s) => {
    const capexUsd = lastValue(CAPEX_BY_KEY[s.key], 0);
    return {
      key: s.key,
      label: s.label,
      capexUsdPerKw: Math.round(capexUsd),
      capexJpyPerKw: Math.round(capexUsd * fxJpyPerUsd),
      lcoeUsdPerMwh: Math.round(lastValue(LCOE_BY_KEY[s.key], 0) * 10) / 10,
      cfDefault: s.cfDefault,
    };
  });

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
      '電源別 LCOE 比較（太陽光/風力/原子力/地熱/水力）',
      'NREL ATB 2024 参考値の並列表示',
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
          <div className="section-label">業界唯一 · 無料・登録不要</div>
          <h1 className="section-title">LCOE・LCOS計算機（均等化発電原価・均等化蓄電原価）</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            系統用蓄電池の <strong>LCOS（均等化蓄電原価）</strong> と、太陽光・風力・原子力等の
            <strong>電源別 LCOE（均等化発電原価）</strong> を前提条件から試算します。
            蓄電池CAPEX・電源別CAPEX/LCOE参考値は <strong>NREL ATB 2024（米国前提）</strong> を基準に、
            効率・サイクル・割引率などを調整できます。ブラウザ完結・データ送信なし。
          </p>

          <LcoeLcosCalculator lcosCapex={lcosCapex} sources={sources} fxJpyPerUsd={fxJpyPerUsd} />

          {/* 出典・免責（必須・L-EIC-055、本文そのまま）*/}
          <section style={{ marginTop: 24, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>出典・前提・免責</h2>
            <small style={{ fontSize: 12.5, lineHeight: 1.8, color: 'var(--color-muted)', display: 'block' }}>
              既定値: 蓄電池CAPEX＝NREL ATB 2024（米国前提・$/kW÷4h、USD/JPY換算）。電源別LCOE参考値＝NREL ATB 2024（$/MWh）。
              充電単価＝JEPXスポット平均の概数。low/highは感度レンジ（mid±20%）でNREL ATBのシナリオ不確実性に基づく当サイトの仮定であり、
              NRELの予測値そのものではありません。本ツールは概算であり、実際のLCOS/LCOEは案件規模・電池種別・立地・時期で異なります。
              データ提供: EIC Data（CC BY 4.0）。（リンク:{' '}
              <a href="https://atb.nrel.gov/" target="_blank" rel="noopener noreferrer">https://atb.nrel.gov/</a> ・{' '}
              <a href="https://data.eic-jp.org/" target="_blank" rel="noopener noreferrer">https://data.eic-jp.org/</a>）
            </small>
          </section>

          {/* 計算ロジック */}
          <section style={{ marginTop: 16, padding: 20, background: 'var(--color-bg-card, #fff)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>計算ロジック</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.8, marginTop: 0 }}>
              <li><strong>LCOS</strong> = ( CAPEX + Σ(O&M + 充電費)/(1+r)<sup>t</sup> ) / ( Σ 放電量/(1+r)<sup>t</sup> )。放電量=年サイクル×DoD、充電費=(放電量/RTE)×充電単価、N=min(事業年数, サイクル寿命/年サイクル)。</li>
              <li><strong>LCOE</strong> = ( CAPEX + Σ PV(O&M) + Σ PV(燃料) ) / Σ PV( CF×8760 )。電源別CAPEXはNREL ATB、CFは代表値（概数・編集可）。</li>
              <li><strong>NREL ATB参考値</strong>は ATB が独自CF・前提で公表した LCOE（$/MWh）。本ツールの簡易LCOEとは前提が異なるため値は一致しません（比較用）。</li>
              <li><strong>火力</strong>は NREL ATB に LCOE 系列がなく、燃料費・CO2価格依存のため本ツールでは試算しません（概数 $40–80/MWh の定性注記のみ・捏造回避）。</li>
            </ul>
          </section>

          {/* 関連リンク（curl 200 確認済のみ）*/}
          <section style={{ marginTop: 16, padding: 20, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>関連コンテンツ</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
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
