/**
 * src/middleware.ts
 *
 * 旧 news-2026-NNN-* スラッグへ 410 Gone を返す（SEO 対応）
 * Glossary 重複スラッグ → canonical へ 301 リダイレクト
 *
 * 背景 (2026-06-02):
 *   Google Search Console で /news/news-2026-NNN-* 形式が 708 件 404 として記録。
 *   これらは microCMS にもサイトマップにも存在しない旧スラッグ残存（原因1）。
 *   Google に「恒久的に消滅」を伝えるため 404 → 410 に格上げ。
 *
 * 背景 (2026-06-10):
 *   旧AI生成スタブ eu-ets-detail / carbon-pricing-detail が canonical
 *   eu-ets / carbon-pricing と重複。SEO重複コンテンツ・relatedTerms衝突を解消するため
 *   301 で canonical へ統合（非破壊）。
 *
 * 背景 (2026-06-19, P1 batch1):
 *   Glossary 重複候補 134 グループ（docs/glossary-dup-candidates.md）をユウ監査。
 *   Rule A（-detail スタブ 32件）+ Rule B（term正規化重複 91グループ→100件）を batch1 承認。
 *   以下を除外:
 *     - #29 response-time-detail: 「駆けつけ時間」≠「応動時間」、別概念
 *     - #3 ce-marking-detail: borderline、要再検討
 *     - #43 distributed-energy-resource-2: canonical slug に "-2" 残留
 *   以下を canonical 反転（GA4/GSC 実績）:
 *     - #93 spot-market（GA4 6v）← day-ahead-market（1v）
 *     - #112 dispatch-command-source（GSC 4.4位）← dispatch-resource（0v）
 *     - #123 fire-separation-distance（GA4 8v・397秒）← setback-distance, separation-distance
 *   Rule C（english正規化 8件）batch2 承認（2026-06-21）:
 *     6グループ統合。除外: #129 lfp（クラスタ要整理）、#132 transformer-ai（別概念）。
 *     ※ re100-detail は batch1 Rule A で既存のため batch2 では追加しない（冪等）。
 *
 * 保護:
 *   src/data/legacy-news-allowlist.json に列挙されたスラッグ（現存 28 件）は
 *   410 の対象外。build 時に build:legacy-news-allowlist が再生成。
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import legacyAllowlist from '@/data/legacy-news-allowlist.json';

const LEGACY = new Set(legacyAllowlist as string[]);

// Glossary 重複統合 301 マップ（完全一致のみ）
// L-EIC-021: 同スラッグは sitemap.ts の GLOSSARY_SITEMAP_DENYLIST にも追加済み
const GLOSSARY_301: Record<string, string> = {
  // §3.5 炭素価格クラスタ 旧スタブ（既存 2026-06-10）
  '/glossary/eu-ets-detail':        '/glossary/eu-ets',
  '/glossary/carbon-pricing-detail': '/glossary/carbon-pricing',

  // P1 batch1: Rule A — -detail スタブ統合（2026-06-19）
  // 除外: #3 ce-marking-detail（borderline）、#29 response-time-detail（別概念）
  '/glossary/capex-detail':                          '/glossary/capex',
  '/glossary/ccs-detail':                            '/glossary/ccs',
  '/glossary/curtailment-detail':                    '/glossary/curtailment',
  '/glossary/c-rate-detail':                         '/glossary/c-rate',
  '/glossary/dscr-detail':                           '/glossary/dscr',
  '/glossary/eu-battery-regulation-detail':          '/glossary/eu-battery-regulation',
  '/glossary/iec-detail':                            '/glossary/iec',
  '/glossary/ieee-detail':                           '/glossary/ieee',
  '/glossary/iot-detail':                            '/glossary/iot',
  '/glossary/mezzanine-detail':                      '/glossary/mezzanine',
  '/glossary/npv-detail':                            '/glossary/npv',
  '/glossary/opex-detail':                           '/glossary/opex',
  '/glossary/ppa-detail':                            '/glossary/ppa',
  '/glossary/re100-detail':                          '/glossary/re100',
  '/glossary/scada-detail':                          '/glossary/scada',
  '/glossary/spinning-reserve-detail':               '/glossary/spinning-reserve',
  '/glossary/v2l-detail':                            '/glossary/v2l',
  '/glossary/aggregator-detail':                     '/glossary/aggregator',
  '/glossary/operating-lease-detail':                '/glossary/operating-lease',
  '/glossary/green-bond-detail':                     '/glossary/green-bond',
  '/glossary/container-bess-detail':                 '/glossary/container-bess',
  '/glossary/corporate-ppa-detail':                  '/glossary/corporate-ppa',
  '/glossary/finance-lease-detail':                  '/glossary/finance-lease',
  '/glossary/microgrid-detail':                      '/glossary/microgrid',
  '/glossary/substation-detail':                     '/glossary/substation',
  '/glossary/tokyo-subsidy-detail':                  '/glossary/tokyo-subsidy',
  '/glossary/offshore-wind-detail':                  '/glossary/offshore-wind',
  '/glossary/grid-scale-battery-detail':             '/glossary/grid-scale-battery',
  '/glossary/decarbonization-leading-region-detail': '/glossary/decarbonization-leading-region',
  '/glossary/battery-passport-detail':               '/glossary/battery-passport',

  // P1 batch1: Rule B — term 正規化重複統合（2026-06-19）
  // 除外: #43 distributed-energy-resource-2（canonical slug に "-2" 残留）
  // 反転: #93 spot-market / #112 dispatch-command-source / #123 fire-separation-distance
  '/glossary/ah-detail':                             '/glossary/ah-ampere-hour',
  '/glossary/bcp-detail':                            '/glossary/business-continuity-plan',
  '/glossary/bcp-business-continuity-plan':          '/glossary/business-continuity-plan',
  '/glossary/bems':                                  '/glossary/building-energy-management-system',
  '/glossary/bess-battery-energy-storage-system':    '/glossary/battery-energy-storage-system',
  '/glossary/bess-detail-2':                         '/glossary/battery-energy-storage-system',
  '/glossary/bms-detail':                            '/glossary/battery-management-system',
  '/glossary/bms-battery-management-system':         '/glossary/battery-management-system',
  '/glossary/blackstart-detail':                     '/glossary/black-start',
  '/glossary/bloomberg-nef':                         '/glossary/bloombergnef',
  '/glossary/caiso-california':                      '/glossary/caiso',
  '/glossary/derms-detail':                          '/glossary/der-management-system',
  '/glossary/dod-depth-of-discharge':                '/glossary/depth-of-discharge',
  '/glossary/dr-demand-response':                    '/glossary/demand-response',
  '/glossary/dr-detail':                             '/glossary/demand-response',
  '/glossary/ems-detail':                            '/glossary/energy-management-system',
  '/glossary/ems-energy-management-system':          '/glossary/energy-management-system',
  '/glossary/ercot-texas':                           '/glossary/ercot',
  '/glossary/ess-detail':                            '/glossary/ess-energy-storage-system',
  '/glossary/enerc-catl-product':                    '/glossary/enerc',
  '/glossary/ferc-usa':                              '/glossary/ferc',
  '/glossary/ffr':                                   '/glossary/fast-frequency-response',
  '/glossary/frt':                                   '/glossary/frt-fault-ride-through',
  '/glossary/gwh-detail':                            '/glossary/gwh-gigawatt-hour',
  '/glossary/hems':                                  '/glossary/home-energy-management-system',
  '/glossary/iea-international':                     '/glossary/iea',
  '/glossary/ira-usa-detail':                        '/glossary/ira-us',
  '/glossary/irr':                                   '/glossary/internal-rate-of-return',
  '/glossary/j-credit-japan':                        '/glossary/j-credit',
  '/glossary/jera-japan':                            '/glossary/jera',
  '/glossary/lfp-battery-detail':                    '/glossary/lithium-iron-phosphate',
  '/glossary/mtbf-mean-time-between-failures':       '/glossary/mtbf',
  '/glossary/mttr-mean-time-to-repair':              '/glossary/mttr',
  '/glossary/mwh-detail':                            '/glossary/megawatt-hour',
  '/glossary/nedo':                                  '/glossary/new-energy-and-industrial-technology-development-organization',
  '/glossary/om-operation-maintenance':              '/glossary/operation-maintenance',
  '/glossary/occto-japan-org':                       '/glossary/organization-for-cross-regional-coordination-of-transmission-operators',
  '/glossary/occto':                                 '/glossary/organization-for-cross-regional-coordination-of-transmission-operators',
  '/glossary/pbt':                                   '/glossary/pbt-payback-time',
  '/glossary/pcs-detail':                            '/glossary/power-conditioning-system',
  '/glossary/pjm-interconnection':                   '/glossary/pjm',
  '/glossary/powertitan-sungrow':                    '/glossary/powertitan',
  '/glossary/repower-eu':                            '/glossary/repowereu',
  '/glossary/rul-remaining-life':                    '/glossary/rul',
  '/glossary/sii':                                   '/glossary/sustainable-open-innovation-initiative',
  '/glossary/sla-detail':                            '/glossary/sla-service-level-agreement',
  '/glossary/soc-state-of-charge':                   '/glossary/state-of-charge',
  '/glossary/soh-state-of-health':                   '/glossary/state-of-health',
  '/glossary/spc':                                   '/glossary/special-purpose-company',
  '/glossary/spc-special-purpose':                   '/glossary/special-purpose-company',
  '/glossary/sustech-japan-ems':                     '/glossary/sustech',
  '/glossary/tcfd-disclosure':                       '/glossary/tcfd',
  '/glossary/tensor-energy-ems':                     '/glossary/tensor-energy',
  '/glossary/ul-9540a-standard':                     '/glossary/ul-9540a',
  '/glossary/ul-9540-standard':                      '/glossary/ul-9540',
  '/glossary/v2g-detail':                            '/glossary/vehicle-to-grid',
  '/glossary/v2h-detail':                            '/glossary/vehicle-to-home',
  '/glossary/v2x-vehicle-to-x':                     '/glossary/v2x',
  '/glossary/vpp-detail':                            '/glossary/virtual-power-plant',
  '/glossary/vpp-virtual-power-plant':               '/glossary/virtual-power-plant',
  '/glossary/kwh-unit-detail':                       '/glossary/kilowatt-hour',
  '/glossary/imbalance-fee-detail':                  '/glossary/imbalance-charge',
  '/glossary/infra-fund':                            '/glossary/infrastructure-fund',
  '/glossary/gas-venting':                           '/glossary/gas-release',
  '/glossary/cobalt-resource':                       '/glossary/cobalt',
  // #93 スポット市場: canonical 反転（GA4 spot-market 6v > day-ahead-market 1v）
  '/glossary/day-ahead-market':                      '/glossary/spot-market',
  '/glossary/nickel-resource':                       '/glossary/nickel',
  '/glossary/peak-cutting':                          '/glossary/peak-cut',
  '/glossary/peak-shifting':                         '/glossary/peak-shift',
  '/glossary/main-auction-jp':                       '/glossary/main-auction',
  '/glossary/lithium-resource':                      '/glossary/lithium',
  '/glossary/tso-japan-detail':                      '/glossary/general-transmission-distribution',
  '/glossary/mitsubishi-corporation':                '/glossary/mitsubishi-corp',
  '/glossary/marubeni-japan':                        '/glossary/marubeni',
  '/glossary/itochu-corporation':                    '/glossary/itochu',
  '/glossary/sumitomo-corporation':                  '/glossary/sumitomo-corp',
  '/glossary/renewable-special-law':                 '/glossary/renewable-energy-special-measures-act',
  '/glossary/renewable-surcharge':                   '/glossary/renewable-energy-surcharge',
  '/glossary/fc-frequency-conv':                     '/glossary/frequency-converter',
  '/glossary/capacity-procurement-contract-amount':  '/glossary/capacity-contract-payment',
  '/glossary/performance-warranty':                  '/glossary/performance-guarantee',
  '/glossary/fire-service-law':                      '/glossary/fire-service-act',
  '/glossary/specified-wholesale-supply-business':   '/glossary/specified-wholesale-supply',
  '/glossary/ministry-of-environment':               '/glossary/ministry-of-the-environment',
  // #112 発動指令電源: canonical 反転（GSC 4.4位 dispatch-command-source 0v → 12v）
  '/glossary/dispatch-resource':                     '/glossary/dispatch-command-source',
  '/glossary/power-generation-business':             '/glossary/generation-business-operator',
  '/glossary/availability-rate':                     '/glossary/availability',
  '/glossary/jeac-9701':                             '/glossary/grid-interconnection-code',
  '/glossary/meti':                                  '/glossary/ministry-of-economy-trade-and-industry',
  '/glossary/earthquake-resistant-design':           '/glossary/seismic-design',
  '/glossary/local-subsidy':                         '/glossary/local-government-subsidy',
  '/glossary/chikudensho':                           '/glossary/battery-storage-site',
  '/glossary/trial-operation':                       '/glossary/commissioning',
  '/glossary/additional-auction-jp':                 '/glossary/additional-auction',
  '/glossary/kansai-electric':                       '/glossary/kepco',
  // #123 離隔距離: canonical 反転（GA4 8v・397秒 fire-separation-distance）
  '/glossary/setback-distance':                      '/glossary/fire-separation-distance',
  '/glossary/separation-distance':                   '/glossary/fire-separation-distance',
  '/glossary/chief-engineer-elec':                   '/glossary/chief-electrical-engineer',
  '/glossary/electricity-business-law':              '/glossary/electricity-business-act',
  '/glossary/non-fossil-value-market':               '/glossary/non-fossil-certificate-market',

  // P1 batch2: Rule C — english 正規化重複統合（2026-06-21）
  // 除外: #129 lfp（クラスタ要整理）、#132 transformer-ai（変圧器≠AITransformer、別概念）
  // ※ re100-detail → re100 は batch1 Rule A 既存（line 63）のため追加しない
  '/glossary/cbi-standard-2':          '/glossary/cbi-standard',
  '/glossary/fit-feed-in-tariff':      '/glossary/feed-in-tariff',
  '/glossary/tesla-megapack-product':  '/glossary/megapack',
  '/glossary/re100-detail-2':          '/glossary/re100',
  '/glossary/re100-japan':             '/glossary/re100',
  '/glossary/non-firm-detail':         '/glossary/non-firm-connection',
  '/glossary/multi-use-detail':        '/glossary/multi-use-operation',
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Glossary 重複統合 301
  if (pathname in GLOSSARY_301) {
    return NextResponse.redirect(new URL(GLOSSARY_301[pathname], req.url), { status: 301 });
  }

  // /news/news-2026-{数字}-{...} パターンのみ対象
  const m = pathname.match(/^\/news\/(news-2026-\d+-.+)$/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    if (!LEGACY.has(slug)) {
      return new NextResponse('Gone', { status: 410 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/news/:slug*', '/glossary/:slug*'],
};
