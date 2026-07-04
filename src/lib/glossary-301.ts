/**
 * src/lib/glossary-301.ts
 *
 * Glossary 重複統合 301 マップの単一情報源（SSOT）。
 * - middleware.ts が 301 リダイレクトに使用。
 * - term→slug / english→slug マップ構築（precompute-glossary-detail / getLinkableTargets）が
 *   GLOSSARY_301_SOURCE_SLUGS（301元slug）を除外に使用 → 301-hop relatedTerms/オートリンクを撲滅
 *   （落とし穴#102、stage-2A）。旧entryは microCMS に残す（middleware が 301 処理）。
 */

export const GLOSSARY_301: Record<string, string> = {
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

  // P4 B-3: Rule C batch2 クローズ＋explainerリンク監査 新規発見（2026-07-04 ユウ監査確定）
  // 却下: transformer-ai→transformer（#132 別概念・変圧器≠AI Transformer）
  // 独立維持: lithium-iron-phosphate-material（リン酸鉄=材料。301しない）
  '/glossary/us-ira-act':      '/glossary/ira-us',                  // 同一概念IRA・薄テンプレ（ira-usa-detail→ira-us と整合）
  '/glossary/output-control':  '/glossary/curtailment',             // term「出力制御」完全一致の真重複（curtailment 13記事で主流）
  '/glossary/lfp':             '/glossary/lithium-iron-phosphate',  // #129 向き先変更: 総称LFPは電池側へ（6/19監査方針）
};

// 301 元slug集合（bare slug、"/glossary/" prefix 除去）。term→slug / english→slug マップから除外する。
export const GLOSSARY_301_SOURCE_SLUGS: Set<string> = new Set(
  Object.keys(GLOSSARY_301).map((p) => p.replace(/^\/glossary\//, ''))
);

/** 301 チェーン（A→B→C）を最終 canonical の bare slug へ解決。 */
export function canonicalGlossarySlug(slug: string): string {
  let cur = '/glossary/' + slug;
  const seen = new Set<string>();
  while (GLOSSARY_301[cur] && !seen.has(cur)) {
    seen.add(cur);
    cur = GLOSSARY_301[cur];
  }
  return cur.replace(/^\/glossary\//, '');
}
