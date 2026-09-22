/**
 * /tools/irr-simulator — 蓄電池IRRシミュレーター (依頼AM)
 *
 * 設計:
 *   - 単一 URL、動的ルートなし → 落とし穴 #79 #98 とは無関係 (静的扱い)
 *   - microCMS リクエストなし → 落とし穴 #95 とは無関係 (client-side 計算)
 *   - revalidate = 86400 (24h、デフォルト値が変更されたら再生成)
 *   - JSON-LD SoftwareApplication schema で SEO リッチリザルト対応
 *   - URL params 連動は IRRSimulator (Client) 側で window.location ベース (落とし穴 #92)
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import IRRSimulator from '@/components/IRRSimulator';
import { siteConfig } from '@/lib/site-config';
// NREL ATB CAPEX + FX（build 時プリコンピュート済み JSON、鉄則 #2/#4 準拠）
import { BATTERY_CAPEX } from '@/lib/nrel-atb-reference';
import { fxLabel } from '@/lib/fx-reference';
// Nv-0c ■3: 容量市場の出所と年度範囲はカタログから（文言は capacity-market-defaults.ts に一本化）
import { CAPACITY_MARKET_NATIONAL as CMN, CAPACITY_MARKET_SOURCE_TEXT, yenLabel } from '@/lib/capacity-market-defaults';
// Nv-0c: スポットの既定価差を、JEPX 30 分値の日内価差（カタログ）と照合して示す
import { SPOT_SPREAD_REFERENCE as SSR, spreadLabel } from '@/lib/spot-spread-reference';
import { getScenarioInput } from '@/lib/irr-defaults';
import { DEPTH_OF_DISCHARGE, PROJECT_LIFETIME_YEARS, ROUND_TRIP_EFFICIENCY } from '@/lib/storage-assumptions';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  // layout.tsx titleTemplate `%s | 蓄電所ネット` で自動付与 (落とし穴 #86)
  title: '蓄電池IRRシミュレーター (無料・登録不要)',
  description:
    '系統用蓄電池プロジェクトのIRR・NPV・ペイバック期間を、収益を単純加算する簡易モデルで概算（無料）。容量市場・需給調整市場・スポットアービトラージの収益を入力でき、3シナリオ(楽観/標準/悲観)を並列計算。感応度分析・CSVエクスポート対応。',
  alternates: { canonical: '/tools/irr-simulator' },
  openGraph: {
    title: '蓄電池IRRシミュレーター (無料・登録不要)',
    description:
      '系統用蓄電池の事業性をIRR/NPV/ペイバックで試算。3シナリオ並列・感応度分析・CSV出力対応。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function IrrSimulatorPage() {
  // 標準シナリオの既定の価差（スポット高値 − 低値）
  const stdInput = getScenarioInput('standard');
  const stdSpread = stdInput.spot_high - stdInput.spot_low;
  // NREL ATB 蓄電池CAPEX 3シナリオ（build 時事前計算、L-EIC-013/015/055 準拠）
  // Ck-1 A9: 円換算は nrel-atb-reference.ts の 1 箇所に寄せた（lcoe-lcos と同じ値）。
  // ★旧版はここで別に計算し、カタログが空のときの代替値（CAPEX 2101 $/kW・USD/JPY 158.34）を焼き込んでいた。
  //   代替値は置かない（カタログが無ければ NREL の参考値ボタン自体を出さない）。
  const capexNrel = BATTERY_CAPEX
    ? {
        low: BATTERY_CAPEX.low,
        mid: BATTERY_CAPEX.mid,
        high: BATTERY_CAPEX.high,
        fxJpyPerUsd: BATTERY_CAPEX.fxJpyPerUsd,
        capexUsdPerKwh: BATTERY_CAPEX.usdPerKwh,
        atbYear: BATTERY_CAPEX.atbYear,
        fxMonthLabel: BATTERY_CAPEX.fxMonthLabel,
      }
    : undefined;

  // JSON-LD SoftwareApplication (SEO リッチリザルト)
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '蓄電池IRRシミュレーター',
    alternateName: 'BESS IRR Simulator',
    description:
      '系統用蓄電池プロジェクトのIRR・NPV・ペイバック期間を、収益を単純加算する簡易モデルで概算するブラウザ完結型ツール（無料）。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    aggregateRating: undefined, // 評価データなしのため省略
    url: 'https://bess-net.jp/tools/irr-simulator',
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    featureList: [
      '3 シナリオ並列計算 (楽観/標準/悲観)',
      'IRR/NPV/ペイバック期間 同時算出',
      '年次累積キャッシュフロー チャート',
      '感応度分析 (スポット価格 ±10%, 容量市場 ±10%)',
      'CSV エクスポート (Excel UTF-8 BOM 対応)',
      '入力条件付き URL 共有',
      'モバイル対応 (768px 以下レスポンシブ)',
    ],
  };

  // BreadcrumbList (リッチリザルト効果)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: 'https://bess-net.jp/tools' },
      {
        '@type': 'ListItem',
        position: 3,
        name: '蓄電池IRRシミュレーター',
        item: 'https://bess-net.jp/tools/irr-simulator',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        {/* Tier 2/3 UI 統一: max-w 1320 */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 蓄電池IRRシミュレーター
          </p>
          <div className="section-label">無料・登録不要 · ブラウザ完結</div>
          <h1 className="section-title">蓄電池IRRシミュレーター</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            {/* ★Nv-0c: 「業界標準ロジック」「3 市場併用前提」を外した。同じ出力を複数の収益に同時計上する簡易モデルで、
                「業界標準」に当たる根拠も無い。需給調整は既定値を置かなくなった。 */}
            系統用蓄電池プロジェクトの <strong>IRR・NPV・ペイバック期間</strong> を、収益を単純加算する簡易モデルで概算します（無料）。
            <strong>容量市場・需給調整市場・スポットアービトラージ</strong> の収益を入力でき（需給調整は既定値なし）、
            <strong>楽観・標準・悲観</strong> の 3 シナリオを並列計算します。
            ブラウザ完結 (ログイン不要)、入力データはサーバー送信なし、CSV エクスポート対応。
          </p>
          {/* Ck-1 A12: 表を入れるため p → div（p の中に table は置けない＝hydration エラーになる） */}
          <div
            className="page-meta"
            style={{
              marginTop: 0,
              marginBottom: 24,
              paddingTop: 0,
              borderTop: 'none',
              fontSize: 15,
              color: 'var(--color-muted)',
            }}
          >
            {/* ★Nv-0c ■3: 実際に使っている一次だけを、正しい機関名・資料名で書く。
                旧「容量市場 ¥8,000/kW/年 (2025年度オークション結果反映)」「需給調整市場 ¥1,500/kW/月」
                「JEPX スポット ¥9-23/kWh (2024年度実績)」「出典: JEPX/OCCTO/SII 公表資料」は、いずれも一次に対応が無かった
                （8,000・1,500 は 2026-05-14 の議論メモ由来）。スポットは JEPX 30 分値の日内価差と照合でき、既定の価差は過大方向。
                値が一次に対応していないものに「公表資料」とは書かない。 */}
            {/* ★#107: 既定値の数値・年度ラベル・理由は初期 DOM に載せる。
                IRRSimulator はウィザード形式で Step 3 はクリックするまで描画されないため、ここ（サーバ描画）に置く。 */}
            <strong>※ 既定値と出所</strong>
            <br />
            ・<strong>容量市場対価</strong>: {CAPACITY_MARKET_SOURCE_TEXT}（対象実需給年度 {CMN.firstFy}〜{CMN.lastFy} の {CMN.count} 年度分）から、
            標準＝中央値 {yenLabel(CMN.median)} 円/kW
            {CMN.medianIsObserved ? '' : `（${CMN.count} 年度の中央 2 値の平均で、どの年度の値そのものでもありません）`}、
            楽観＝最大 {yenLabel(CMN.max?.value)} 円/kW（対象実需給年度 {CMN.max?.deliveryFy}）、
            悲観＝最小 {yenLabel(CMN.min?.value)} 円/kW（対象実需給年度 {CMN.min?.deliveryFy}）。
            参考: 直近の実施回（対象実需給年度 {CMN.latest?.deliveryFy}）の全国値は {yenLabel(CMN.latest?.value)} 円/kW。
            全国値は OCCTO が公表した全国値ではなく、エリア値からの加重平均です。
            「対象実需給年度」は供給力を提供する年度で、メインオークションはその 4 年前に実施されます。
            {/* Ck-1 A12: 中央値を読者が検算できるよう、全観測値を年度ラベルつきで出す（カタログから動的・焼き込みなし） */}
            {CMN.count > 0 && (
              <table
                style={{ borderCollapse: 'collapse', margin: '8px 0 10px', fontSize: 14, lineHeight: 1.6 }}
                aria-label="容量市場メインオークション 全国加重平均（対象実需給年度別）"
              >
                <caption style={{ textAlign: 'left', fontSize: 14, marginBottom: 4 }}>
                  全国加重平均の全 {CMN.count} 年度（中央値 {yenLabel(CMN.median)} 円/kW の計算に使った値）
                </caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: 'left', padding: '2px 12px 2px 0', borderBottom: '1px solid var(--color-border)' }}>対象実需給年度</th>
                    <th scope="col" style={{ textAlign: 'right', padding: '2px 12px', borderBottom: '1px solid var(--color-border)' }}>円/kW</th>
                    <th scope="col" style={{ textAlign: 'left', padding: '2px 0 2px 12px', borderBottom: '1px solid var(--color-border)' }}>既定値での扱い</th>
                  </tr>
                </thead>
                <tbody>
                  {CMN.observations.map((o) => {
                    const tags: string[] = [];
                    if (CMN.max?.deliveryFy === o.deliveryFy) tags.push('楽観＝最大');
                    if (CMN.min?.deliveryFy === o.deliveryFy) tags.push('悲観＝最小');
                    if (CMN.medianObservations.some((m) => m.deliveryFy === o.deliveryFy)) {
                      tags.push(CMN.medianIsObserved ? '標準＝中央値' : '中央 2 値（平均が標準）');
                    }
                    if (CMN.latest?.deliveryFy === o.deliveryFy) tags.push('直近の実施回');
                    return (
                      <tr key={o.deliveryFy}>
                        <td style={{ padding: '2px 12px 2px 0' }}>{o.deliveryFy} 年度</td>
                        <td style={{ padding: '2px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{yenLabel(o.value)}</td>
                        <td style={{ padding: '2px 0 2px 12px' }}>{tags.join('・') || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <br />
            ・<strong>需給調整対価</strong>: 既定値を置いていません。需給調整市場の収益は、蓄電池の容量をどれだけ需給調整に割り当てるかで大きく変わるためです。
            入力する場合は、裁定取引・容量市場と<strong>同じ容量を重複して計上しない</strong>よう注意してください。
            需給調整市場の約定単価を公表しているのは電力需給調整力取引所（EPRX）で、単位は円/ΔkW・30分です（入力欄の円/kW/月とは単位が違います）。
            商品別の実データ（年平均と年度内の幅）は <Link href="/tools/balancing-revenue">需給調整市場 収益試算</Link> で確認できます。
            <br />
            {/* ★Nv-0c レビュー: 鉤括弧で逐語引用のように書かない（実際は公募要領の 2 行を要約したもの） */}
            ・<strong>補助率</strong>: 大規模プリセットの標準 33% は、SII 系統用蓄電システム等導入支援事業（令和7年度補正）公募要領 1-10 で
            リチウムイオン電池の 1,000kW以上10,000kW未満・10,000kW以上30,000kW未満がいずれも 1/3 以内（補助対象経費に対する率・上限額あり）であることを
            33% で近似したものです。本試算は CAPEX 全額に掛けています（近似）。
            <br />
            {capexNrel && (
              <>
                ・<strong>CAPEX の参考値</strong>（Step 2）: NREL ATB {capexNrel.atbYear} 年版（米国前提・mid=実データ・CC BY 4.0）の 4 時間構成 {capexNrel.capexUsdPerKwh} $/kWh を {fxLabel()} で円換算した {capexNrel.mid.toLocaleString('ja-JP')} 円/kWh。
              </>
            )}
            <br />
            {/* Ck-1 A9: 性能前提は storage-assumptions.ts の 1 箇所（/tools/lcoe-lcos と同じ値） */}
            ・<strong>充放電効率・耐用年数・放電深度</strong>: 効率 {Math.round(ROUND_TRIP_EFFICIENCY.value * 100)}%・耐用年数 {PROJECT_LIFETIME_YEARS.value} 年は{' '}
            <a href={ROUND_TRIP_EFFICIENCY.source.kind === 'primary' ? ROUND_TRIP_EFFICIENCY.source.url : undefined} target="_blank" rel="noopener noreferrer">{ROUND_TRIP_EFFICIENCY.source.label}</a>
            の前提です。放電深度 {Math.round(DEPTH_OF_DISCHARGE.value * 100)}% は{DEPTH_OF_DISCHARGE.source.label}です。
            <br />
            ・<strong>スポット価格の高値・安値</strong>（標準の価差 {spreadLabel(stdSpread)} 円/kWh）は当サイトの想定値です。
            {SSR.fy !== null && (
              <>
                一次と照合すると、JEPX の 30 分値から算出した日内価差（システムプライス）の {SSR.fy} 年度平均は、
                4 時間充放電に相当する上位 8 コマ−下位 8 コマで {spreadLabel(SSR.top8Avg)} 円/kWh、日内の最大−最小（理論上限）で {spreadLabel(SSR.rangeAvg)} 円/kWh です。
                {stdSpread > (SSR.top8Avg ?? Infinity) ? <strong>既定の価差はこれを上回るため、裁定収益は過大になりうる方向です。</strong> : null}
              </>
            )}
            <br />
            ・<strong>CAPEX の既定値、補助率の楽観・悲観値と高圧プリセットの値は当サイトの想定値で、一次資料の公表値ではありません。</strong>
            <br />
            均等化原価で比べたい場合は <Link href="/tools/lcoe-lcos">LCOE・LCOS計算機</Link> もご利用ください。
          </div>

          <IRRSimulator
            capexNrel={capexNrel}
            spotHint={
              SSR.fy !== null
                ? `放電時の想定単価（当サイトの想定）。参考: JEPX 30 分値の日内価差 ${SSR.fy} 年度平均は 4 時間相当 ${spreadLabel(SSR.top8Avg)} 円/kWh`
                : undefined
            }
          />

          {/* 計算ロジック説明（IRRSimulator の注意書きから #calc-logic で案内している） */}
          <section
            id="calc-logic"
            style={{
              marginTop: 40,
              padding: 20,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              計算ロジック・前提
            </h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8 }}>
              <li>
                <strong>収益モデル</strong>: アービトラージ (放電 - 充電 × 効率) + 容量市場 (固定対価)
                + 需給調整 (月額固定) の単純加算
              </li>
              <li>
                <strong>劣化</strong>: 年 1% 容量低下 (下限 70%)、アービトラージ収益にのみ影響
              </li>
              <li>
                <strong>IRR 計算</strong>: 二分法 (bisection)、収束精度 1e-6 億円
              </li>
              <li>
                <strong>NPV 計算</strong>: 割引率 5% (デフォルト)、耐用年数（既定 {PROJECT_LIFETIME_YEARS.value} 年・入力で変更可）の DCF
              </li>
              <li>
                <strong>ペイバック</strong>: 累積CFが補助金控除後の初期投資を上回る年 (線形補間)
              </li>
              <li>
                <strong>OPEX</strong>: 出力 (MW) × 単価 (円/MW/年) で算定
              </li>
              <li>
                <strong>補助金</strong>: 初期投資から %で控除 (CAPEX 補助、運用補助は対象外)
              </li>
            </ul>
            <p
              style={{
                fontSize: 15,
                color: 'var(--color-muted)',
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              <strong>制約・想定</strong>: 本シミュレーターは「全市場併用可能」前提の単純加算モデル。
              実事業ではマルチユース時間配分の trade-off (例: 容量市場入札時間中はアービトラージ充電不可)
              で収益が下振れする可能性があります。投資判断には EPC/コンサル含めた精緻シミュレーションが必須です。
            </p>
          </section>

          {/* 使い方 アコーディオン形式 (シンプル) */}
          <section
            style={{
              marginTop: 24,
              padding: 20,
              background: 'var(--color-bg-card, #fff)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              使い方
            </h2>
            <ol style={{ fontSize: 15, lineHeight: 1.8 }}>
              <li>
                <strong>シナリオ選択</strong>: 編集したいシナリオ (楽観/標準/悲観) を選択
              </li>
              <li>
                <strong>Step 1</strong>: 設備情報 (容量・出力・効率・耐用年数等) — 3 シナリオ共通
              </li>
              <li>
                <strong>Step 2</strong>: 投資情報 (CAPEX・OPEX・補助金率) — シナリオ別
              </li>
              <li>
                <strong>Step 3</strong>: 市場前提 (スポット価格・容量市場・需給調整) — シナリオ別
              </li>
              <li>
                <strong>結果確認</strong>: 入力変更で即座に再計算、IRR/NPV/Payback を 3 シナリオ並列で表示
              </li>
              <li>
                <strong>共有 / 出力</strong>: URL 共有 (入力条件付き) or CSV エクスポート (Excel 対応)
              </li>
            </ol>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
