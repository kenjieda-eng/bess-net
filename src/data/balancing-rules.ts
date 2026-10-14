/**
 * src/data/balancing-rules.ts — 需給調整市場 制度変更トラッカー（/tracker/balancing-rules）の改定の定義
 * ★生成物（scripts/gen-balancing-rules.ts が reports/tool-balancing-rules-plan-2026-10-12.data.json と
 *   reports/tool-balancing-rules-2026-10-13.addendum.json から作る）。手で編集しない。
 * 一次が取れた改定だけ（網羅ではない）。日付は公表日（一次の日付）と適用日（実需給日）を分ける。
 */
export type BalancingRuleKind = 'cap' | 'procurement' | 'product' | 'guideline' | 'battery';
export type BalancingProduct = 'primary' | 'secondary-1' | 'secondary-2' | 'tertiary-1' | 'tertiary-2' | 'composite';
export type BalancingRuleStatus = 'effective' | 'scheduled' | 'undecided' | 'watch';
export interface BalancingRuleSource { name: string; publisher: string; url: string; where: string; quote: string; date: string | null; dateFrom: string | null }
export interface BalancingRule {
  id: string;
  kind: BalancingRuleKind;
  status: BalancingRuleStatus;
  title: string;
  /** 公表日（一次の日付）YYYY-MM-DD */
  announcedOn: string;
  /** 適用日（実需給日・受渡日）。一次で日単位が取れないものは null */
  effectiveFrom: string | null;
  products: BalancingProduct[];
  /** 揚水発電機の随意契約の行のエリア（公式の呼び方） */
  areas: string[];
  group: 'pumped-hydro-contract' | null;
  before: string;
  after: string;
  reasonQuote: string | null;
  /** 予定・未決定・注視の行の一次の書きぶり（逐語） */
  pendingQuote: string | null;
  /** pendingQuote が載っている出典の添字 */
  pendingQuoteSource: number | null;
  batteryNote: string | null;
  sources: BalancingRuleSource[];
  /** 関連（題名は生成時の写し。表示中かどうかは画面がビルド時に isExcludedExplainer・isExcludedEvent で判定する） */
  related: { explainer: { slug: string; title: string }[]; policyEvent: { slug: string; title: string }[]; catalogSeries: string[] };
  benchmarkWindow: { products: BalancingProduct[]; before: [string, string]; after: [string, string] } | null;
  dateBasis: { announced: { source: number; quote: string }; effective?: { source: number; quote: string } } | null;
  dateException: string | null;
}

/** 一次を取った日の範囲（研究便の取得日 〜 実装便の取り直し日） */
export const BALANCING_RULES_CHECKED = {"from":"2026-10-12","to":"2026-10-14"} as const;

/** タイムライン本体（適用済み・適用日が一次に無いものを含む） */
export const BALANCING_RULES: readonly BalancingRule[] = [
  {
    "id": "A-1",
    "kind": "cap",
    "status": "effective",
    "title": "需給調整市場 ΔkW上限価格の初設定（2024年4月1日実需給分から）: 複合商品・一次調整力・二次調整力① 19.51、二次調整力②・三次調整力① 7.21、三次調整力② 上限無し",
    "announcedOn": "2024-03-15",
    "effectiveFrom": "2024-04-01",
    "products": [
      "composite",
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "〔上限価格の定めなし〕「需給調整市場は、現行の取引規程において上限価格を定めておらず、必要量を必ず購入する仕組みとなっている。」〔第66回 電力・ガス基本政策小委員会 資料４ スライド37・2023年10月31日〕",
    "after": "〔EPRX「需給調整市場のΔkW上限価格について」の表の 1 行目の写し〕複合商品※2 19.51／一次調整力※3 19.51／二次調整力① 19.51／二次調整力② 7.21／三次調整力① 7.21／三次調整力② 上限無し〔円/ΔkW・30分。適用開始年月日 2024年04月01日・初回約定処理年月日 2024年03月26日。当初の適用終了は 2024年10月4日（第96回 制度検討作業部会 資料３ スライド47・OCCTO 第50回 資料５ スライド8）〕",
    "reasonQuote": "需給調整市場では，募集量に対し応札量が少ないことにより徒に価格が高騰することを回避すべく，次のとおり上限価格を設定します。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場のΔkW上限価格について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/information/docs/14b85fbe8942da7d3bdddda80243e7e170f64d9e.pdf",
        "where": "p.1 本文冒頭＋表の 1 行目＋注※1",
        "quote": "表の行「2024年03月15日 (2024年09月30日) | 2024年03月26日 | 2024年04月01日 | 2026年03月13日 | 19.51 | 19.51 | 19.51 | 7.21 | 7.21 | 上限無し」（列: 公表年月日・初回約定処理年月日・適用開始年月日※1・適用終了年月日※1・複合商品※2・一次調整力※3・二次調整力①・二次調整力②・三次調整力①・三次調整力②）。※1 適用開始年月日，適用終了年月日は実需給日を示しており，応札や約定処理が行われる日ではありません。",
        "date": "2026-07-30",
        "dateFrom": "PDF 1 頁の日付欄（表題の下）"
      },
      {
        "name": "需給調整市場のΔkW上限価格について",
        "publisher": "電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202403151010_news.pdf",
        "where": "p.1 本文",
        "quote": "需給調整市場のΔkW上限価格を公表いたしましたのでお知らせいたします。",
        "date": "2024-03-15",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "需給調整市場について",
        "publisher": "資源エネルギー庁（第96回 総合資源エネルギー調査会 電力・ガス事業分科会 電力・ガス基本政策小委員会 制度検討作業部会 資料3）",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/denryoku_gas/seido_kento/pdf/096_03_00.pdf",
        "where": "スライド45（PDF p.46）・スライド47（PDF p.48）",
        "quote": "第89回制度設計専門会合（2023年9月29日）や、第66回電力・ガス基本政策小委員会（2023年10月31日）において、一次、二次①及び全ての複合商品については「三次②加重平均単価+3σ相当」、二次②及び三次①については「三次②加重平均単価+1σ相当」を上限価格とすること、上限価格の水準については不断に見直すこととされた。／EPRXより、2024年10月4日までを期限に、一次・二次①・複合商品に対して19.51円/ΔkW・30分、二次②・三次①に対して7.21円/ΔkW・30分の上限価格を設定することが通知されている。",
        "date": "2024-09-27",
        "dateFrom": "PDF 表紙（第96回 制度検討作業部会の会議ページ 096.html の開催日「2024年9月27日」とも一致）"
      },
      {
        "name": "今後の電力需給運用について",
        "publisher": "資源エネルギー庁（第66回 総合資源エネルギー調査会 電力・ガス事業分科会 電力・ガス基本政策小委員会 資料4）",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/denryoku_gas/pdf/066_04_00.pdf",
        "where": "スライド37「【参考】一般送配電事業者からの詳細提案について」（スライド下部の表示: 第89回 制度設計専門会合（2023年9月29日）資料7）",
        "quote": "需給調整市場は、現行の取引規程において上限価格を定めておらず、必要量を必ず購入する仕組みとなっている。",
        "date": "2023-10-31",
        "dateFrom": "PDF 表紙（第66回 電力・ガス基本政策小委員会の会議ページ 066.html の開催日「2023年10月31日」とも一致）"
      },
      {
        "name": "2024年度の取引実績について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/information/docs/summary_2024.pdf",
        "where": "p.13・p.29（「落札単価の分布」ページの上限価格表）",
        "quote": "p.13「上限価格 [円/ΔkW・30分]」「19.51 19.51」（複合商品・一次調整力）／p.29「19.51 7.21」（複合商品・二次調整力②）",
        "date": "2025-06-19",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "balancing-price-cap-10yen-explainer",
          "title": "需給調整市場の上限価格が10円に ── 「19.51円→15円→10円」の3年間と、蓄電池収益への意味"
        }
      ],
      "policyEvent": [],
      "catalogSeries": [
        "balancing-price-cap-composite",
        "balancing-price-cap-primary",
        "balancing-price-cap-secondary-1",
        "balancing-price-cap-secondary-2",
        "balancing-price-cap-tertiary-1"
      ]
    },
    "benchmarkWindow": {
      "products": [
        "composite",
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "tertiary-2"
      ],
      "before": [
        "2024-01",
        "2024-03"
      ],
      "after": [
        "2024-04",
        "2024-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 1,
        "quote": "需給調整市場のΔkW上限価格について 2024年3月15日 電力需給調整力取引所"
      },
      "effective": {
        "source": 0,
        "quote": "2024年03月26日 2024年04月01日 2026年03月13日 19.51 19.51 19.51 7.21 7.21 上限無し／※1 適用開始年月日，適用終了年月日は実需給日を示しており，応札や約定処理が行われる日ではありません。"
      }
    },
    "dateException": null
  },
  {
    "id": "A-2",
    "kind": "cap",
    "status": "effective",
    "title": "週間商品のΔkW上限価格の適用継続（当初の適用終了年月日 2024年10月4日 → 当面の間継続・値は不変）",
    "announcedOn": "2024-09-30",
    "effectiveFrom": "2024-10-05",
    "products": [
      "composite",
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1"
    ],
    "areas": [],
    "group": null,
    "before": "「適用終了年月日を 2024 年 10 月 4 日としておりました」〔EPRX 2024年9月19日の告知。値は 複合商品・一次調整力・二次調整力① 19.51／二次調整力②・三次調整力① 7.21 円/ΔkW・30分〕",
    "after": "「現行の上限価格の適用を当面の間継続することが決定いたしました」〔EPRX 2024年9月30日の告知。値は変わらない（19.51／7.21）。現行の PDF の表の 1 行目の適用終了年月日は「2026年03月13日」〕",
    "reasonQuote": "こうしたことから、応札価格や約定価格が安定しない現在の状況では、直近の三次②取引状況を踏まえた上限価格の設定は妥当ではなく、週間商品については10月5日以降当面の間現行の上限価格水準を維持することとしてはどうか。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場のΔkW上限価格について（適用終了年月日の変更）",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202409191500_news.pdf",
        "where": "p.1 本文",
        "quote": "現行の需給調整市場のΔkW上限価格（以下、「上限価格」という）については、適用終了年月日を 2024 年 10 月 4 日としておりましたが、近日中に開催される国の審議会において、今後の上限価格の在り方について検討がなされる予定※であることから、上限価格の変更や適用期間に関して方針が決定しましたら、改めて弊所ホームページにて公表いたします。",
        "date": "2024-09-19",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "需給調整市場のΔkW上限価格について（方針決定のお知らせ）",
        "publisher": "電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202409301900_news.pdf",
        "where": "p.1 本文＋脚注",
        "quote": "このたび、第 96 回制度検討作業部会※における審議結果にもとづき、現行の上限価格の適用を当面の間継続することが決定いたしましたので、お知らせいたします。（※ 第96回制度検討作業部会 (2024年9月27日) 資料3 スライド45参照）",
        "date": "2024-09-30",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "需給調整市場について",
        "publisher": "資源エネルギー庁（第96回 制度検討作業部会 資料3）",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/denryoku_gas/seido_kento/pdf/096_03_00.pdf",
        "where": "スライド45「10月以降の上限価格設定について」（PDF p.46）",
        "quote": "この通知に基づけば、2024年10月5日以降は原則として新たな上限価格を適用することになる。",
        "date": "2024-09-27",
        "dateFrom": "PDF 表紙（第96回 制度検討作業部会の会議ページ 096.html の開催日「2024年9月27日」とも一致）"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理（2024年度上期実績および2024年度下期の予定）",
        "publisher": "電力広域的運営推進機関（第50回 需給調整市場検討小委員会 資料5）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_50_05.pdf",
        "where": "スライド8 の注記",
        "quote": "※ 一次～三次①、複合の現行の上限価格については、電力需給調整力取引所からの公表文書（2024年3月15日）において、2024年4月1日～10月4日が適用期間とされており、また、「同一の上限価格を利用する期間は原則6ヶ月程度となりますが、終了年月日は関係する審議会等による妥当性検証の結果により変更される場合があります」とされている。",
        "date": "2024-09-10",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "balancing-price-cap-10yen-explainer",
          "title": "需給調整市場の上限価格が10円に ── 「19.51円→15円→10円」の3年間と、蓄電池収益への意味"
        }
      ],
      "policyEvent": [],
      "catalogSeries": [
        "balancing-price-cap-composite",
        "balancing-price-cap-primary",
        "balancing-price-cap-secondary-1",
        "balancing-price-cap-secondary-2",
        "balancing-price-cap-tertiary-1"
      ]
    },
    "benchmarkWindow": {
      "products": [
        "composite",
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1"
      ],
      "before": [
        "2024-07",
        "2024-09"
      ],
      "after": [
        "2024-11",
        "2025-01"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 1,
        "quote": "需給調整市場のΔkW上限価格について （方針決定のお知らせ） 2024年9月30日 電力需給調整力取引所"
      },
      "effective": {
        "source": 2,
        "quote": "この通知に基づけば、2024年10月5日以降は原則として新たな上限価格を適用することになる。／週間商品については10月5日以降当面の間現行の上限価格水準を維持することとしてはどうか。"
      }
    },
    "dateException": null
  },
  {
    "id": "A-3",
    "kind": "cap",
    "status": "effective",
    "title": "一次調整力・二次調整力①・複合商品のΔkW上限価格 19.51 → 15.00（2026年3月14日実需給分から）",
    "announcedOn": "2026-02-05",
    "effectiveFrom": "2026-03-14",
    "products": [
      "composite",
      "primary",
      "secondary-1"
    ],
    "areas": [],
    "group": null,
    "before": "〔表の写し〕複合商品 19.51／一次調整力 19.51／二次調整力① 19.51〔円/ΔkW・30分〕",
    "after": "〔表の 2 行目の写し〕複合商品 15.00／一次調整力 15.00／二次調整力① 15.00〔円/ΔkW・30分。適用開始年月日 2026年03月14日・適用終了年月日 2026年08月31日・初回約定処理年月日 2026年03月13日。同じ行の二次調整力② 7.21・三次調整力① 7.21・三次調整力② 上限無し は変わらない〕",
    "reasonQuote": "そこで、前日取引化するタイミングでは、複合市場の状況を予断することができないため、募集量・上限価格について一定の措置を講じた上で、市場への応札状況等をモニタリングし、一定の約定機会を確保しながら競争的な環境が形成されるまでの間、調整力調達コストの高騰を抑制できるように募集量・上限価格を見直すこととしてはどうか。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場のΔkW上限価格について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/information/docs/14b85fbe8942da7d3bdddda80243e7e170f64d9e.pdf",
        "where": "表の 2 行目",
        "quote": "表の行「2026年02月05日 | 2026年03月13日 | 2026年03月14日 | 2026年08月31日 | 15.00 | 15.00 | 15.00 | 7.21 | 7.21 | 上限無し」（列: 公表年月日・初回約定処理年月日・適用開始年月日※1・適用終了年月日※1・複合商品・一次調整力・二次調整力①・二次調整力②・三次調整力①・三次調整力②）",
        "date": "2026-07-30",
        "dateFrom": "PDF 1 頁の日付欄（表題の下）"
      },
      {
        "name": "需給調整市場のΔkW上限価格の更新について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202602051500_news.pdf",
        "where": "p.1 本文＋脚注",
        "quote": "需給調整市場のΔkW 上限価格（以下、「上限価格」という）につきまして、このたび、第 110 回制度検討作業部会※における審議結果にもとづき、一部商品区分の単価を更新することが決定いたしましたので、お知らせいたします。（※ 第110回制度検討作業部会 (2026年 1月23日) 資料4 スライド 6参照）",
        "date": "2026-02-05",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "需給調整市場について",
        "publisher": "資源エネルギー庁（第110回 総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会 制度検討作業部会 資料4）",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/110_04_00.pdf",
        "where": "スライド6「2026年度以降の需給調整市場における対応（２／２）」",
        "quote": "◼ 上限価格：現在の19.51円/ΔkW・30分から15円/ΔkW・30分に引き下げる（ただし、市場における競争状況に改善が見られない場合、10円、7.21円/ΔkW・30分等と段階的に引き下げる）",
        "date": "2026-01-23",
        "dateFrom": "PDF 表紙（第110回 制度検討作業部会の会議ページ 110.html の開催日「2026年1月23日」とも一致）"
      },
      {
        "name": "2025年度の取引実績について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/information/summary_2025.pdf",
        "where": "p.57「３．市場取引における主要な変更点（２/２）」の「2月」行",
        "quote": "3/13取引(3/14実需給分～)分から更新（2/5公表）",
        "date": "2026-06-18",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "balancing-market-cap-cut-2026",
          "title": "2026年度 需給調整市場 上限価格引下げ ── 一次・二次調整力①の19.51→15円が業界に与える影響"
        },
        {
          "slug": "balancing-price-cap-10yen-explainer",
          "title": "需給調整市場の上限価格が10円に ── 「19.51円→15円→10円」の3年間と、蓄電池収益への意味"
        }
      ],
      "policyEvent": [
        {
          "slug": "balancing-market-reform-2026-03",
          "title": "需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定"
        }
      ],
      "catalogSeries": [
        "balancing-price-cap-composite",
        "balancing-price-cap-primary",
        "balancing-price-cap-secondary-1"
      ]
    },
    "benchmarkWindow": {
      "products": [
        "composite",
        "primary",
        "secondary-1"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 1,
        "quote": "需給調整市場のΔkW上限価格の更新について 2026年2月5日 一般社団法人 電力需給調整力取引所"
      },
      "effective": {
        "source": 0,
        "quote": "2026年02月05日 2026年03月13日 2026年03月14日 2026年08月31日 15.00 15.00 15.00 7.21 7.21 上限無し"
      }
    },
    "dateException": null
  },
  {
    "id": "A-4",
    "kind": "cap",
    "status": "effective",
    "title": "一次調整力・二次調整力①・複合商品のΔkW上限価格 15.00 → 10.00（2026年9月1日実需給分から・当面の間）",
    "announcedOn": "2026-07-30",
    "effectiveFrom": "2026-09-01",
    "products": [
      "composite",
      "primary",
      "secondary-1"
    ],
    "areas": [],
    "group": null,
    "before": "〔表の写し〕複合商品 15.00／一次調整力 15.00／二次調整力① 15.00〔円/ΔkW・30分〕",
    "after": "〔表の 3 行目の写し〕複合商品 10.00／一次調整力 10.00／二次調整力① 10.00〔円/ΔkW・30分。適用開始年月日 2026年09月01日・適用終了年月日「当面の間※5※6」・初回約定処理年月日 2026年08月31日。同じ行の二次調整力② 7.21・三次調整力① 7.21・三次調整力② 上限無し は変わらない〕",
    "reasonQuote": "以上を踏まえると、前日取引化後も応札未達が継続し、上限価格付近での応札・約定が確認されていることに加え、一部の高価格帯の約定が引き続き調達費用に一定の影響を与えていることから、一次・二次①・複合商品の上限価格を10円へ引き下げることとし、本年９月１日実需給分から適用することとしてはどうか。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場のΔkW上限価格について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/information/docs/14b85fbe8942da7d3bdddda80243e7e170f64d9e.pdf",
        "where": "表の 3 行目＋注※6",
        "quote": "表の行「2026年07月30日 | 2026年08月31日 | 2026年09月01日 | 当面の間※5※6 | 10.00 | 10.00 | 10.00 | 7.21 | 7.21 | 上限無し」。※6 一次調整力，二次調整力①及び複合商品については，第4回電力安定供給ワーキンググループにおける審議の結果，上限価格の更新が決定いたしました。",
        "date": "2026-07-30",
        "dateFrom": "PDF 1 頁の日付欄（表題の下）"
      },
      {
        "name": "需給調整市場のΔkW上限価格の更新について",
        "publisher": "電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202607300000_news.pdf",
        "where": "p.1 本文＋脚注",
        "quote": "需給調整市場のΔkW上限価格（以下、「上限価格」という）につきまして、このたび、第4回電力安定供給ワーキンググループ※における審議の結果、一部商品区分の単価を更新することが決定いたしましたので、お知らせいたします。（※ 第4回電力安定供給ワーキンググループ (2026年7月14日) 資料6 スライド22参照）",
        "date": "2026-07-30",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "需給調整市場について",
        "publisher": "資源エネルギー庁（総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会 電力安定供給ワーキンググループ（第4回）資料6）",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/pdf/004_06_00.pdf",
        "where": "スライド22「まとめ」",
        "quote": "第110回制度検討作業部会では、前日取引化後、市場における競争状況に改善が見られない場合、一次・二次①・複合商品の上限価格（単位：円/ΔkW・30分）を15円から10円、7.21円等と段階的に引き下げることとされた。",
        "date": "2026-07-14",
        "dateFrom": "PDF 表紙（電力安定供給WG 第4回の会議ページ 004.html の開催日「2026年7月14日」とも一致）"
      },
      {
        "name": "上限価格",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/information/post.php",
        "where": "本文「【上限価格関連情報】」（PDF の更新表示「※2026/7/30更新」）",
        "quote": "上限価格を更新する際は，実需給日に対応する2週間前までに本ページにて公開します",
        "date": "2026-07-30",
        "dateFrom": "掲載 PDF へのリンク横の更新表示（ページ自体に公表日欄は無い）"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "balancing-price-cap-10yen-explainer",
          "title": "需給調整市場の上限価格が10円に ── 「19.51円→15円→10円」の3年間と、蓄電池収益への意味"
        }
      ],
      "policyEvent": [
        {
          "slug": "balancing-market-price-cap-10yen-2026-09",
          "title": "需給調整市場 上限価格改定 ─ 一次・二次①・複合商品を15円→10円に引下げ（2026/9/1実需給分から）"
        },
        {
          "slug": "meti-stable-supply-wg4-balancing-cap-2026-07",
          "title": "第4回 電力安定供給WG ─ 需給調整市場の上限価格15円→10円引下げ（2026年9月1日実需給分から適用・2026年7月30日に確定）"
        }
      ],
      "catalogSeries": [
        "balancing-price-cap-composite",
        "balancing-price-cap-primary",
        "balancing-price-cap-secondary-1"
      ]
    },
    "benchmarkWindow": {
      "products": [
        "composite",
        "primary",
        "secondary-1"
      ],
      "before": [
        "2026-06",
        "2026-08"
      ],
      "after": [
        "2026-09",
        "2026-11"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 1,
        "quote": "需給調整市場のΔkW上限価格の更新について 2026年7月30日 電力需給調整力取引所"
      },
      "effective": {
        "source": 0,
        "quote": "2026年07月30日 2026年08月31日 2026年09月01日 当面の間※5※6 10.00 10.00 10.00 7.21 7.21 上限無し"
      }
    },
    "dateException": null
  },
  {
    "id": "B-1",
    "kind": "procurement",
    "status": "effective",
    "title": "週間商品（二次調整力②・複合商品）の効率的な調達の導入（まず1σ相当を調達し、広域予備率12%未満なら3σ相当まで追加調達）",
    "announcedOn": "2023-06-29",
    "effectiveFrom": null,
    "products": [
      "secondary-2",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "まずもっての調達量を従来の3σ相当から",
    "after": "1σ相当（不足インバランス発生時の84％程度をカバー）へ低減させているところ／2024年度当初（2023年度期中開始時含む）は追加調達判断時点（前日12時前）での最新の広域予備率が12％を下回っているかとする",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "調整力必要量の考え方について（調整力の効率的な調達）",
        "publisher": "電力広域的運営推進機関（第40回需給調整市場検討小委員会 資料2）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2023/files/jukyu_shijyo_40_02.pdf",
        "where": "p.56 まとめ（一次～三次①）",
        "quote": "2024年度当初（2023年度期中開始時含む）は追加調達判断時点（前日12時前）での最新の広域予備率が12％を下回っているかとする／試算結果として、一次～三次①の複合必要量は全エリア合計で40%程度減少することが期待される／（三次①）準備が出来次第反映（その他の商品）2024年度から反映",
        "date": "2023-06-29",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "前日取引化後の調整力必要量の考え方について",
        "publisher": "電力広域的運営推進機関（第58回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/58/jukyu_shijyo_58_04.pdf",
        "where": "p.11",
        "quote": "この考え方としては、二次②と三次①がインバランス対応の調整力であり、効率的な調達により、まずもっての調達量を従来の3σ相当から、1σ相当（不足インバランス発生時の84％程度をカバー）へ低減させているところ",
        "date": "2025-11-13",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "追加調達一時中断（報告）ならびに課題に対する「応急対策」の基本的な考え方について",
        "publisher": "電力広域的運営推進機関（第47回需給調整市場検討小委員会 資料2）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_47_02.pdf",
        "where": "p.2",
        "quote": "2024年度より需給調整市場が全面運開し、一次、二次①・②、三次①および複合商品の週間調達が開始した。",
        "date": "2024-05-15",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": null,
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２３年６月２９日"
      }
    },
    "dateException": "適用日は一次に日単位の記載が無い（第40回 需給調整市場検討小委員会 資料２ p.56「（その他の商品）2024年度から反映」）。"
  },
  {
    "id": "B-1b",
    "kind": "procurement",
    "status": "effective",
    "title": "三次調整力①の効率的な調達の開始（必要量の一部を調達し、不足が見込まれる場合は追加で調達）",
    "announcedOn": "2023-11-27",
    "effectiveFrom": "2023-12-02",
    "products": [
      "tertiary-1"
    ],
    "areas": [],
    "group": null,
    "before": "〔一次に変更前の調達方法の逐語は無い〕",
    "after": "三次調整力①について、2023 年 11 月 28 日取引分（2023 年 12 月 2 日～12 月 8日受渡分）より必要量の調達方法を見直したことをお知らせいたします。…三次調整力①必要量の一部を調達し、不足すると見込まれる場合は追加で調達する方法に見直しました。",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "三次調整力①必要量の効率的調達開始について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/202311271516r2_news.pdf",
        "where": "p.1 本文",
        "quote": "三次調整力①について、2023 年 11 月 28 日取引分（2023 年 12 月 2 日～12 月 8日受渡分）より必要量の調達方法を見直したことをお知らせいたします。",
        "date": "2023-11-27",
        "dateFrom": "PDF 1 頁の日付欄（表題の下）"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "tertiary-reserve-1-detail",
          "title": "需給調整市場 三次調整力①── 蓄電池の主要収益源を徹底解説"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-1"
      ],
      "before": [
        "2023-09",
        "2023-11"
      ],
      "after": [
        "2024-01",
        "2024-03"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2023年11 月27日"
      },
      "effective": {
        "source": 0,
        "quote": "2023 年 11 月 28 日取引分（2023 年 12 月 2 日～12 月 8日受渡分）より必要量の調達方法を見直したことをお知らせいたします。"
      }
    },
    "dateException": null
  },
  {
    "id": "B-2",
    "kind": "procurement",
    "status": "effective",
    "title": "二次調整力②・三次調整力①の前日追加調達の一時中断",
    "announcedOn": "2024-04-26",
    "effectiveFrom": "2024-05-01",
    "products": [
      "secondary-2",
      "tertiary-1"
    ],
    "areas": [],
    "group": null,
    "before": "週間取引では二次②、三次①、複合商品を1σ相当値を調達し、不足すると見込まれる場合には前日取引で3σ相当値－1σ相当値を追加調達する取り組み",
    "after": "2024年4月30日取引分（5月1日受渡分）から当面の間、二次調整力②・三次調整力①の前日追加調達を一時中断する",
    "reasonQuote": "三次②調達費用の高騰は、それを負担するFIT賦課金や託送費増大、ひいては国民負担の増大に繋がることから、第91回制度検討作業部会（2024年4月22日）において、前日取引における二次②、三次①の追加調達一時中断といった検討の方向性が示され",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "二次調整力②・三次調整力①の前日追加調達の一時中断のお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/20240426_news_r.pdf",
        "where": "本文",
        "quote": "一般送配電事業者 9 社（中略）より、2024年4月30日取引分（5月1日受渡分）から当面の間、二次調整力②・三次調整力①の前日追加調達を一時中断するとの申し出がありましたのでお知らせします。",
        "date": "2024-04-26",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "追加調達一時中断（報告）ならびに課題に対する「応急対策」の基本的な考え方について",
        "publisher": "電力広域的運営推進機関（第47回需給調整市場検討小委員会 資料2）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_47_02.pdf",
        "where": "p.2・p.25",
        "quote": "三次②調達費用の高騰は、それを負担するFIT賦課金や託送費増大、ひいては国民負担の増大に繋がることから、第91回制度検討作業部会（2024年4月22日）において、前日取引における二次②、三次①の追加調達一時中断といった検討の方向性が示され（中略）2024年4月30日取引分（5月1日受渡分）より当面の間、追加調達一時中断することとされた（中略）／二次②・三次①の追加調達一時中断により、募集量は約6割減少し",
        "date": "2024-05-15",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "secondary-2",
        "tertiary-1"
      ],
      "before": [
        "2024-02",
        "2024-04"
      ],
      "after": [
        "2024-05",
        "2024-07"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2024年4 月26日"
      },
      "effective": {
        "source": 0,
        "quote": "2024年4月30日取引分（5月1日受渡分）から当面の間、二次調整力②・三次調整力①の前日追加調達を一時中断するとの申し出がありましたのでお知らせします。"
      }
    },
    "dateException": null
  },
  {
    "id": "B-3",
    "kind": "procurement",
    "status": "effective",
    "title": "三次調整力②の募集量削減係数の導入（全エリア共通・ブロック別）",
    "announcedOn": "2024-05-30",
    "effectiveFrom": "2024-06-01",
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "二次調整力②・三次調整力①の前日追加調達分を除いた三次調整力②の募集量",
    "after": "見直し後の三次調整力②の募集量は、二次調整力②・三次調整力①の前日追加調達分を除いた三次調整力②の募集量に「募集量削減係数」を乗じることで算出／2024年6月1日～6月30日 0.837 0.904 0.450 0.481 0.423 0.446 0.880 0.934〔1～8ブロック〕",
    "reasonQuote": "需給調整市場における応札量不足が継続していること等を要因として",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "三次調整力②の募集量の見直しおよび二次調整力②・三次調整力①の前日追加調達の一時中断継続のお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/20240530_news.pdf",
        "where": "p.1",
        "quote": "一般送配電事業者 9 社（中略）より、2024 年 5月 3１日取引分（６月 1 日受渡分）から暫定的に三次調整力②の募集量を見直すこと、ならびに二次調整力②・三次調整力①の前日追加調達の一時中断注２を継続する旨の申し出がありましたのでお知らせします。／各ブロックの募集量削減係数 ＝ 直近約1ヶ月の全エリア・各ブロックの調達率平均",
        "date": "2024-05-30",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "三次②の効率的な調達の早期導入について",
        "publisher": "電力広域的運営推進機関（第48回需給調整市場検討小委員会 資料2）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_48_02.pdf",
        "where": "p.2",
        "quote": "第93回制度検討作業部会（2024年5月27日）において、追加の対策として、三次②募集量の見直しにおける案A-a（一定割合を乗じた募集量の削減）が実施されることとなった。",
        "date": "2024-06-26",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-2"
      ],
      "before": [
        "2024-03",
        "2024-05"
      ],
      "after": [
        "2024-06",
        "2024-08"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2024年5 月30日"
      },
      "effective": {
        "source": 0,
        "quote": "2024 年 5月 3１日取引分（６月 1 日受渡分）から暫定的に三次調整力②の募集量を見直すこと"
      }
    },
    "dateException": null
  },
  {
    "id": "B-4",
    "kind": "procurement",
    "status": "effective",
    "title": "三次調整力②の効率的な調達の開始（1σ相当値の必要量と、3σ相当値×削減係数の小さい方を募集量に）",
    "announcedOn": "2024-06-28",
    "effectiveFrom": "2024-07-01",
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "三次調整力②の募集量に「募集量削減係数」を乗じることで算出〔2024年6月〕",
    "after": "募集量は、３σ相当値の必要量に削減係数を乗じた値と1σ相当値の必要量の小さい方となります",
    "reasonQuote": "本質的に不要な断面の調整力（必要量）は削減することが望ましく",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "三次調整力②の効率的な調達の開始および募集量削減の継続のお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202406281700_news_3200.pdf",
        "where": "p.1",
        "quote": "国の審議会等注 1・2 において、三次調整力②の効率的な調達の実施および募集量削減の継続注3について整理されましたので、2024 年 6月 30 日取引分（7 月 1 日受渡分）から開始することをお知らせします。なお、効率的な調達と募集量削減を同時に行うにあたり、募集量は、３σ相当値の必要量に削減係数を乗じた値と1σ相当値の必要量の小さい方となります。",
        "date": "2024-06-28",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "三次②の効率的な調達の早期導入について",
        "publisher": "電力広域的運営推進機関（第48回需給調整市場検討小委員会 資料2）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_48_02.pdf",
        "where": "p.2・p.35 まとめ",
        "quote": "本質的に不要な断面の調整力（必要量）は削減することが望ましく（中略）三次②募集量見直しにおける案A-c（募集量を3σ→1σ相当に削減）に該当する三次②の効率的な調達の取り組みを進めていくことも重要になると考えられる。／前日に1σ相当値を調達し、3σ必要と想定される断面では余力活用にて追加調達を行う",
        "date": "2024-06-26",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "三次調整力②の募集量の見直しおよび二次調整力②・三次調整力①の前日追加調達の一時中断継続のお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/20240530_news.pdf",
        "where": "p.1 注※1",
        "quote": "見直し後の三次調整力②の募集量は、二次調整力②・三次調整力①の前日追加調達分を除いた三次調整力②の募集量に「募集量削減係数」を乗じることで算出",
        "date": "2024-05-30",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-2"
      ],
      "before": [
        "2024-04",
        "2024-06"
      ],
      "after": [
        "2024-07",
        "2024-09"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2024年6 月28日"
      },
      "effective": {
        "source": 0,
        "quote": "2024 年 6月 30 日取引分（7 月 1 日受渡分）から開始することをお知らせします。"
      }
    },
    "dateException": null
  },
  {
    "id": "B-5",
    "kind": "procurement",
    "status": "effective",
    "title": "中部エリア：揚水発電機の随意契約に伴う週間市場商品の募集量見直し（2024年度）",
    "announcedOn": "2024-07-12",
    "effectiveFrom": "2024-07-20",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "中部エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔一次に変更前の募集量の記載は無い〕",
    "after": "2024 年 7 月１6 日取引分（7 月 20 日受渡分）から、揚水発電機を用いた随意契約の締結に伴い週間市場商品の募集量を見直す／契約容量：約61万kW・契約期間：2024年7月20日～2025年3月31日〔中部電力パワーグリッド 2024年7月12日の告知〕",
    "reasonQuote": "需給調整市場における応札量不足が継続していること等を要因として",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "中部エリアにおける揚水発電機を用いた随意契約の締結に伴う週間市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/20240712_news.pdf",
        "where": "p.1（2025年10月31日 一部更新版）",
        "quote": "需給調整市場における応札量不足が継続していること等を要因として、国の審議会注での整理のとおり、中部電力パワーグリッド株式会社より、2024 年 7 月１6 日取引分（7 月 20 日受渡分）から、揚水発電機を用いた随意契約の締結に伴い週間市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2024-07-12",
        "dateFrom": "PDF 1 頁の日付欄（表題直下・発行日。直下に一部更新日の行あり）"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場週間市場商品における募集量の見直しについて",
        "publisher": "中部電力パワーグリッド株式会社",
        "url": "https://powergrid.chuden.co.jp/news/topics/1214195_3288.html",
        "where": "本文",
        "quote": "契約容量：約61万kW／契約期間：2024年7月20日～2025年3月31日／なお、本契約による募集量の見直しは、2025年3月末まで実施いたします。",
        "date": "2024-07-12",
        "dateFrom": "告知の本文冒頭（見出し直下の日付欄 p.p-lead__text）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2024-04",
        "2024-06"
      ],
      "after": [
        "2024-08",
        "2024-10"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2024年7 月12日"
      },
      "effective": {
        "source": 0,
        "quote": "2024 年 7 月１6 日取引分（7 月 20 日受渡分）から、揚水発電機を用いた随意契約の締結に伴い週間市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。"
      }
    },
    "dateException": null
  },
  {
    "id": "B-6",
    "kind": "procurement",
    "status": "effective",
    "title": "三次調整力②の共同調達エリア拡大（中西ブロックに中部エリアを追加）",
    "announcedOn": "2024-09-27",
    "effectiveFrom": "2024-10-01",
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "2022 年度より東北・東京エリア（東ブロック）と、北陸・関西・中国・四国・九州エリア（中西ブロック）では、連系線の空容量に応じて共同調達を実施しております。",
    "after": "中西ブロックの共同調達に 9 月 30 日取引（10 月 1 日受渡分）から中部エリアが追加となります",
    "reasonQuote": "三次調整力②の必要量を低減させる取り組みとして",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "三次調整力②共同調達エリア拡大のお知らせ（中部エリアの追加）",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/20240927150002_news.pdf",
        "where": "p.1",
        "quote": "三次調整力②の必要量を低減させる取り組みとして、2022 年度より東北・東京エリア（東ブロック）と、北陸・関西・中国・四国・九州エリア（中西ブロック）では、連系線の空容量に応じて共同調達を実施しております。この度、中西ブロックの共同調達に 9 月 30 日取引（10 月 1 日受渡分）から中部エリアが追加となりますのでお知らせいたします。",
        "date": "2024-09-27",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-2"
      ],
      "before": [
        "2024-07",
        "2024-09"
      ],
      "after": [
        "2024-10",
        "2024-12"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2024年9 月27日"
      },
      "effective": {
        "source": 0,
        "quote": "この度、中西ブロックの共同調達に 9 月 30 日取引（10 月 1 日受渡分）から中部エリアが追加となりますのでお知らせいたします。"
      }
    },
    "dateException": null
  },
  {
    "id": "B-7",
    "kind": "procurement",
    "status": "effective",
    "title": "三次調整力②の募集量削減係数をエリア別・余力活用電源とのコストバランス基準へ見直し",
    "announcedOn": "2024-10-30",
    "effectiveFrom": "2024-11-01",
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "各ブロックの募集量削減係数 ＝ 直近約1ヶ月の全エリア・各ブロックの調達率平均〔全エリア共通〕",
    "after": "募集量削減係数 ＝ 直近約1ヶ月の応札量（過去一定期間の各エリア余力平均単価以下）÷直近約1ヶ月分募集量（削減前）",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "三次調整力②の必要量および募集量削減係数の１１月分更新について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202410301810_news.pdf",
        "where": "p.1",
        "quote": "なお、募集量削減係数は、国の審議会注３で再整理され、これまでの全エリア共通からエリア別に変更となり、算定する諸元についても余力活用電源とのコストバランスを考慮した算定方法注３に変更となっております。／募集量削減係数 ＝ 直近約1ヶ月の応札量（過去一定期間の各エリア余力平均単価以下）÷直近約1ヶ月分募集量（削減前）",
        "date": "2024-10-30",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "三次調整力②の募集量の見直しおよび二次調整力②・三次調整力①の前日追加調達の一時中断継続のお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/20240530_news.pdf",
        "where": "p.1 ※2（変更前の算定式）",
        "quote": "各ブロックの募集量削減係数 ＝ 直近約1ヶ月の全エリア・各ブロックの調達率平均",
        "date": "2024-05-30",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-2"
      ],
      "before": [
        "2024-08",
        "2024-10"
      ],
      "after": [
        "2024-11",
        "2025-01"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2024年10 月30日"
      },
      "effective": {
        "source": 0,
        "quote": "11/1～11/30"
      }
    },
    "dateException": null
  },
  {
    "id": "B-8",
    "kind": "procurement",
    "status": "effective",
    "title": "三次調整力②の2025年度必要量テーブル（共同調達と取引単位30分化を入れ替え）",
    "announcedOn": "2025-03-04",
    "effectiveFrom": null,
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "【事前評価時の年間必要量推定値】／24年度：210.4 [億ΔkWh]／2024年度値は、2024年度事前検証で算出した（効率的な調達導入前の）必要量に2025年度設備増加分を補正",
    "after": "【事前評価時の年間必要量推定値】／25年度：93.3 [億ΔkWh]／共同調達と新規施策（30分化）を入替えることとする",
    "reasonQuote": "運用負担と必要量低減効果を考慮して、共同調達と新規施策（30分化）を入替えることとする。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "三次調整力②に関する2024年度事後検証および2025年度事前評価について",
        "publisher": "電力広域的運営推進機関（第54回需給調整市場検討小委員会 資料3）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_54_03.pdf",
        "where": "p.63・p.76 まとめ",
        "quote": "効率的な調達および取引時間単位30分化により、 2025年度の三次②年間必要量（推定値）は約93.3億ΔkWh（2024年度は約210.4億ΔkWh）となる見通し。なお、運用負担と必要量低減効果を考慮して、共同調達と新規施策（30分化）を入替えることとする。",
        "date": "2025-03-04",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "三次調整力②の必要量および募集量削減係数の4月分更新について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202503271830_news.pdf",
        "where": "p.1",
        "quote": "三次調整力②は、2025/3/13 取引分（3/14 実需給分）から取引単位時間が短縮（3 時間⇒30分ブロック）されましたが、公表する各テーブルは３時間単位となります。（削減係数は今回公表する4月取引分から30分単位）",
        "date": "2025-03-27",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": null,
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２５年３月４日"
      }
    },
    "dateException": "2025年度必要量テーブルの適用開始日は一次に日単位の記載が無い（取引単位の30分化は「2025/3/13取引分（3/14実需給分）から」＝EPRX 2025年3月27日）。"
  },
  {
    "id": "B-9",
    "kind": "procurement",
    "status": "effective",
    "title": "中部エリア：揚水発電機の随意契約（約61万kW）に伴う週間市場商品の2025年度向け募集量見直し",
    "announcedOn": "2025-10-31",
    "effectiveFrom": "2025-04-01",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "中部エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔一次に変更前の募集量の記載なし〕",
    "after": "契約容量：約61万kW 契約期間：2025年4月1日～2026年3月31日 これにより、2025年4月1日受渡分から、国の審議会（注2）の整理に基づき算定した週間市場商品の募集量に見直しております",
    "reasonQuote": "需給調整市場における応札量不足が継続していることなどを要因として",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場週間市場商品における2025年度向け募集量の見直しについて",
        "publisher": "中部電力パワーグリッド株式会社",
        "url": "https://powergrid.chuden.co.jp/news/topics/1216968_3288.html",
        "where": "本文（2025年10月31日）",
        "quote": "契約容量：約61万kW 契約期間：2025年4月1日～2026年3月31日 これにより、2025年4月1日受渡分から、国の審議会（注2）の整理に基づき算定した週間市場商品の募集量に見直しておりますので、お知らせします。なお、本契約による募集量の見直しは、2026年3月末まで実施いたします。期中でのお知らせとなりますことをお詫び申し上げます。",
        "date": "2025-10-31",
        "dateFrom": "告知の本文冒頭（見出し直下の日付欄 p.p-lead__text）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-01",
        "2025-03"
      ],
      "after": [
        "2025-04",
        "2025-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2025年10月31日"
      },
      "effective": {
        "source": 0,
        "quote": "これにより、2025年4月1日受渡分から、国の審議会（注2）の整理に基づき算定した週間市場商品の募集量に見直しておりますので、お知らせします。"
      }
    },
    "dateException": "公表（2025年10月31日）は適用開始（2025年4月1日受渡分から）の後。告知の本文に「期中でのお知らせとなりますことをお詫び申し上げます。」とある。"
  },
  {
    "id": "B-10",
    "kind": "procurement",
    "status": "effective",
    "title": "東北エリア：揚水発電機の随意契約（最大23万kW）に伴う週間市場商品の募集量見直し（2025年度）",
    "announcedOn": "2025-04-07",
    "effectiveFrom": "2025-04-12",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "東北エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔一次に変更前の募集量の記載なし〕",
    "after": "契約容量：最大23万kW 契約期間：2025年4月1日～ 2026年3月31日 これにより、2025年4月8日取引分（4月12日実需給分）から、国の審議会（注２）の整理に基づき算定した週間市場商品の募集量に見直しいたします",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "東北エリアにおける揚水発電機を用いた随意契約の締結に伴う週間市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/20250407_news.pdf",
        "where": "p.1",
        "quote": "東北電力ネットワーク株式会社より、2025 年 4 月 8 日取引分（4 月 12 日実需給分）から、揚水発電機を用いた随意契約の締結に伴い週間市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2025-04-07",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場週間市場商品における募集量の見直しについて",
        "publisher": "東北電力ネットワーク株式会社",
        "url": "https://nw.tohoku-epco.co.jp/information/1246871_2390.html",
        "where": "本文（2025年4月7日）",
        "quote": "契約容量：最大23万kW 契約期間：2025年4月1日～ 2026年3月31日 これにより、2025年4月8日取引分（4月12日実需給分）から、国の審議会（注２）の整理に基づき算定した週間市場商品の募集量に見直しいたしますので、お知らせします。",
        "date": "2025-04-07",
        "dateFrom": "告知の本文冒頭（見出し h2 内の日付）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-01",
        "2025-03"
      ],
      "after": [
        "2025-05",
        "2025-07"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2025年4 月7日"
      },
      "effective": {
        "source": 0,
        "quote": "2025 年 4 月 8 日取引分（4 月 12 日実需給分）から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-11",
    "kind": "procurement",
    "status": "effective",
    "title": "異常時（電源脱落）対応調整力の必要量からEPPS動作期待分（固定分600MW）を控除",
    "announcedOn": "2025-04-15",
    "effectiveFrom": "2025-04-26",
    "products": [
      "primary",
      "secondary-1",
      "tertiary-1",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "同一周波数連系系統の単機最大ユニット容量（エリア系統容量按分値）〔第55回 資料３ p.36 の表「異常時（電源脱落）対応調整力必要量（2024年データの年間平均値）」単位 MW の「合計」欄は 2,193〕",
    "after": "単機最大ユニット容量からEPPS期待量を控除（上記が600MW以下となる場合は600MW固定）〔同じ表の「合計」欄は 1,200〕／全9エリアで合計約1,000MW（約45%）の必要量低減となる見込み",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "異常時（電源脱落）対応調整力の取扱いについて",
        "publisher": "電力広域的運営推進機関（第55回需給調整市場検討小委員会 資料3）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_55_03.pdf",
        "where": "p.36・p.42 まとめ",
        "quote": "前述の考え方にもとづき、異常時（電源脱落）対応調整力必要量を試算した結果については下表のとおりであり、全9エリアで合計約1,000MW（約45%）の必要量低減となる見込み。／以上を踏まえ、一般送配電事業者等の準備（必要量見直し対応等）が出来次第、異常時（電源脱落）対応調整力からEPPS動作分を控除する運用を開始することとしてはどうか。",
        "date": "2025-04-15",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理（2025年度実績および2026年度以降の検討課題）",
        "publisher": "電力広域的運営推進機関（第60回需給調整市場検討小委員会 資料3）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/60/jukyu_shijyo_60_03.pdf",
        "where": "p.12・p.31",
        "quote": "EPPS動作量（固定分600MW）については、緊急時対応調整力から控除可能の見通し ※健全側への影響を考慮し、控除後の下限値は600MW 【第55回 本小委員会（完了）】／②EPPSの活用 本小委 ②2025年 4/26分～ ②固定600MW控除",
        "date": "2026-03-03",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "2025年4月～10月の調整力必要量（複合・一次調整力・二次調整力①・三次調整力①）更新について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202504181100_news.pdf",
        "where": "p.1（2025年4月18日）",
        "quote": "今回の更新は、第 55 回需給調整市場検討小委員会の資料３「異常時（電源脱落）対応調整力の取扱いについて」において整理された内容に基づき、運用開始の準備が整った一般送配電事業者の調整力必要量を更新したものとなります。",
        "date": "2025-04-18",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "北海道エリアの2025年9・10月調整力必要量の更新について（複合・一次調整力・二次調整力①・三次調整力①）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/docs/202508271930_news.pdf",
        "where": "p.1 本文",
        "quote": "2025年9・10月分の調整力必要量（複合、一次調整力、二次調整力①、三次調整力①）について、北海道エリアのデータを更新しましたのでお知らせいたします。今回の更新は、第55回需給調整市場検討小委員会の資料３「異常時（電源脱落）対応調整力の取扱いについて」において整理された内容に基づき、運用開始の準備が整ったことで調整力必要量を更新したものとなります。",
        "date": "2025-08-27",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-01",
        "2025-03"
      ],
      "after": [
        "2025-05",
        "2025-07"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２５年４月１５日"
      },
      "effective": {
        "source": 1,
        "quote": "②2025年 4/26分～"
      }
    },
    "dateException": "2025年4月26日の開始は東北・東京・中部・北陸・関西・中国・四国・九州の 8 エリア（EPRX 2025年4月18日「…東北・東京・中部・北陸・関西・中国・四国・九州の各エリアのデータを更新しましたのでお知らせいたします。」）。北海道エリアは 2025年9・10月分の調整力必要量から（EPRX 2025年8月27日「…北海道エリアのデータを更新しましたのでお知らせいたします。」）。"
  },
  {
    "id": "B-12",
    "kind": "procurement",
    "status": "effective",
    "title": "市場外調整力（自然体余力）の募集量からの控除（一次調整力～三次調整力①・複合商品、2026年3月まで）",
    "announcedOn": "2025-06-06",
    "effectiveFrom": "2025-06-14",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "〔控除は本改定で開始〕",
    "after": "控除対象となる市場外調整力の過去実績を【各月別/各商品ブロック別】に算出し、【1σ相当値】を控除量とする／・控除開始：準備が整ったエリアから順次導入開始・控除期限：2026年3月（以降、取引状況に応じて再度検討）",
    "reasonQuote": "市場外調整力の控除の考え方としては、何らかの要因で市場応札できず余力となる調整力であり、応札できない要因への抜本対策実施までの期間に限定して控除することが適切であると考えられる。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "調整力必要量（複合・一次調整力～三次調整力①）からの市場外調整力控除開始について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202506061730_news.pdf",
        "where": "p.1",
        "quote": "需給調整市場検討小委員会※において、調整力必要量（複合・一次調整力～三次調整力①）から市場外調整力としての自然体余力を控除することが整理されました。これを受け、2025年6月10日取引（14～20日実需給分）から、準備が整ったエリアから順次控除を開始いたします。なお、この控除の適用期限は2026年3月までとし、それ以降の取扱いについては、取引状況を踏まえ検討される予定です。",
        "date": "2025-06-06",
        "dateFrom": "PDF 1 頁の日付欄（表題直下）"
      },
      {
        "name": "市場外調整力の控除について（その２）",
        "publisher": "電力広域的運営推進機関（第56回需給調整市場検討小委員会 資料2）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_56_02.pdf",
        "where": "p.10・p.66 まとめ",
        "quote": "対象商品：一次、二次①、二次②、三次①、複合商品 ・対象エリア：北海道、東北、東京、中部、北陸、関西、中国、四国※、九州 控除対象となる市場外調整力の過去実績を【各月別/各商品ブロック別】に算出し、【1σ相当値】を控除量とする ・控除開始：準備が整ったエリアから順次導入開始 ・控除期限：2026年3月（以降、取引状況に応じて再度検討）",
        "date": "2025-06-03",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理（2026年度上期実績および2026年度下期以降の予定）",
        "publisher": "電力広域的運営推進機関（第63回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/63/jukyu_shijyo_63_04.pdf",
        "where": "p.13（控除の終了）",
        "quote": "一次の取引実績としては、自然体余力の控除終了の一方で前日取引化と同時に市場での募集量が1σ相当値への変更、今年度も継続して揚水随契を実施し募集量を圧縮していることに加え",
        "date": "2026-09-15",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-03",
        "2025-05"
      ],
      "after": [
        "2025-07",
        "2025-09"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2025年6 月6日"
      },
      "effective": {
        "source": 0,
        "quote": "2025年6月10日取引（14～20日実需給分）から、準備が整ったエリアから順次控除を開始いたします。"
      }
    },
    "dateException": "控除は準備が整ったエリアから順次（EPRX 2025年6月6日「2025年6月10日取引（14～20日実需給分）から、準備が整ったエリアから順次控除を開始いたします。」）。適用日は最初の週の初日。"
  },
  {
    "id": "B-13",
    "kind": "procurement",
    "status": "effective",
    "title": "関西エリア：揚水発電機の随意契約（約47万kW）に伴う週間市場商品の募集量見直し（2025年度）",
    "announcedOn": "2025-07-11",
    "effectiveFrom": "2025-07-19",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "関西エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔一次に変更前の募集量の記載なし〕",
    "after": "契約容量：約４７万ｋＷ 適用期間：２０２５年７月１９日～２０２６年３月３１日 これにより、契約開始日以降の初回取引である２０２５年７月１５日取引分（同年７月１９日～２５日受渡分）から、国の審議会※２の整理に基づき算定した週間市場商品の募集量を見直します",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "関西エリアにおける揚水発電機を用いた随意契約の締結に伴う週間市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202507111130_news.pdf",
        "where": "p.1",
        "quote": "関西電力送配電株式会社より、2025 年 7 月 15 日取引（7 月 19 日～25 日実需給分）から、揚水発電機を用いた随意契約の締結に伴い週間市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2025-07-11",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場週間市場商品における募集量の見直しについて",
        "publisher": "関西電力送配電株式会社",
        "url": "https://www.kansai-td.co.jp/corporate/information/2025/pdf/20250711_1_01.pdf",
        "where": "p.1（2025年7月11日）",
        "quote": "契約容量：約４７万ｋＷ 適用期間：２０２５年７月１９日～２０２６年３月３１日 これにより、契約開始日以降の初回取引である２０２５年７月１５日取引分（同年７月１９日～２５日受渡分）から、国の審議会※２の整理に基づき算定した週間市場商品の募集量を見直しますので、お知らせします。",
        "date": "2025-07-11",
        "dateFrom": "PDF 1 頁の日付欄（表題の直下）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-04",
        "2025-06"
      ],
      "after": [
        "2025-08",
        "2025-10"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2025年7 月11日"
      },
      "effective": {
        "source": 0,
        "quote": "2025 年 7 月 15 日取引（7 月 19 日～25 日実需給分）から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-14",
    "kind": "procurement",
    "status": "effective",
    "title": "北海道エリア：揚水発電機の随意契約（34万kW）に伴う週間市場商品の募集量見直し（2025年度）",
    "announcedOn": "2025-07-11",
    "effectiveFrom": "2025-07-19",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "北海道エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔一次に変更前の募集量の記載なし〕",
    "after": "契約容量： 34万kW 契約期間： 2025年7月19日～2026年3月31日 これにより、2025年7月15日取引分（7月19日実需給分）から2026年3月31日までの期間において、需給調整市場における週間市場商品の募集量を、随意契約により確保した調整力分を差し引いた募集量に見直しします",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "北海道エリアにおける揚水発電機を用いた随意契約の締結に伴う週間市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202507111420_news.pdf",
        "where": "p.1",
        "quote": "北海道電力ネットワーク株式会社より、2025 年 7 月 15 日取引（7 月 19 日～25 日実需給分）から、揚水発電機を用いた随意契約の締結に伴い週間市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2025-07-11",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場における週間市場商品の募集量の見直しについて",
        "publisher": "北海道電力ネットワーク株式会社",
        "url": "https://www.hepco.co.jp/network/info/info2025/1252833_2061.html",
        "where": "本文（2025年7月11日）",
        "quote": "契約容量： 34万kW 契約期間： 2025年7月19日～2026年3月31日 これにより、2025年7月15日取引分（7月19日実需給分）から2026年3月31日までの期間において、需給調整市場における週間市場商品の募集量を、随意契約により確保した調整力分を差し引いた募集量に見直ししますので、お知らせします。",
        "date": "2025-07-11",
        "dateFrom": "告知の本文冒頭（h1 の直後、右寄せの日付欄 <p class=\"font_90 text_right mb_20\">）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-04",
        "2025-06"
      ],
      "after": [
        "2025-08",
        "2025-10"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2025年7 月11日"
      },
      "effective": {
        "source": 0,
        "quote": "2025 年 7 月 15 日取引（7 月 19 日～25 日実需給分）から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-15",
    "kind": "procurement",
    "status": "effective",
    "title": "東京エリア：揚水発電機の随意契約（約60万kW）に伴う週間市場商品の募集量見直し（2025年度）",
    "announcedOn": "2025-10-06",
    "effectiveFrom": "2025-10-11",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "東京エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔一次に変更前の募集量の記載なし〕",
    "after": "契約容量：約60万kＷ 契約期間：2025 年10 月10日から2026年3 月31日 これにより、2025 年 10 月 7 日取引分（10月 11 日実需給分）から 2026 年 3 月 31 日までの期間において、国の審議会の整理（揚水発電所の随意契約により確保した調整力分を需給調整市場の週間市場商品の募集量から差し引いた値）※2にもとづき算定した募集量に見直しします",
    "reasonQuote": "需給調整市場における応札不足が継続していることなどを要因として",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "東京エリアにおける揚水発電機を用いた随意契約の締結に伴う週間市場商品の募集量等の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202510061140_news.pdf",
        "where": "p.1",
        "quote": "東京電力パワーグリッド株式会社より、2025 年 10 月 7 日取引（10 月 11 日～10 月 17 日実需給分）から、揚水発電機を用いた随意契約の締結に伴い週間市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。／また、揚水発電機を用いた随意契約に伴い、調整力必要量（週間市場商品）に適用する、市場外調整力としての自然体余力の控除量について、10月分の東京エリアを更新しましたのでお知らせいたします。",
        "date": "2025-10-06",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場の週間市場商品における募集量の見直しについて",
        "publisher": "東京電力パワーグリッド株式会社",
        "url": "https://www.tepco.co.jp/pg/company/press-information/information/2025/pdf/251006j0101.pdf",
        "where": "p.1（2025年10月6日）",
        "quote": "契約容量：約60万kＷ 契約期間：2025 年10 月10日から2026年3 月31日 これにより、2025 年 10 月 7 日取引分（10月 11 日実需給分）から 2026 年 3 月 31 日までの期間において、国の審議会の整理（揚水発電所の随意契約により確保した調整力分を需給調整市場の週間市場商品の募集量から差し引いた値）※2にもとづき算定した募集量に見直ししますので、お知らせします。",
        "date": "2025-10-06",
        "dateFrom": "PDF 1 頁の日付欄（告知の本文冒頭）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-07",
        "2025-09"
      ],
      "after": [
        "2025-11",
        "2026-01"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2025年10 月6日"
      },
      "effective": {
        "source": 0,
        "quote": "2025 年 10 月 7 日取引（10 月 11 日～10 月 17 日実需給分）から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-16",
    "kind": "procurement",
    "status": "effective",
    "title": "複合市場商品（一次調整力～三次調整力①・複合商品）の市場での調達上限を1σ相当値に統一（一次調整力・二次調整力①は3σ→1σ、差分は余力で確保）",
    "announcedOn": "2026-01-23",
    "effectiveFrom": "2026-03-14",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "現在、週間商品のうち一次・二次①は3σ相当、二次②・三次①は1σ相当を市場で募集しており、市場外調整力の控除が行われているが※１、控除期限は2026年3月とされている※2。",
    "after": "募集量 ：市場での調達上限を1σ相当値とする（1σ相当値に統一）／〔第60回 資料３ p.73 の表＜2026年度からの調整力必要量の考え方と確保箇所＞の写し。列は 必要量・市場での調達量（=必要量）・余力での確保量※2〕一次 3σ 1σ 3σ-1σ／二次① 3σ 1σ 3σ-1σ",
    "reasonQuote": "応札未達と調整力調達コスト高騰を防ぐ観点より現週間商品における市場募集量の上限設定（1σ統一）と上限価格の引き締め※1（15円/ΔkW・30分）が示されたところ※2。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理（2025年度実績および2026年度以降の検討課題）",
        "publisher": "電力広域的運営推進機関（第60回需給調整市場検討小委員会 資料3）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/60/jukyu_shijyo_60_03.pdf",
        "where": "p.48・p.71・p.73",
        "quote": "第110回TF（2026年1月23日）にて、以下のとおり、2026年度以降の需給調整市場におけるまずもっての方向性が示され、2026年度以降の市場状況によって緩和あるいは更なる引き締めを行うこととされた。✓ 募集量 ：市場での調達上限を1σ相当値とする（1σ相当値に統一）",
        "date": "2026-03-03",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理（2026年度上期実績および2026年度下期以降の予定）",
        "publisher": "電力広域的運営推進機関（第63回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/63/jukyu_shijyo_63_04.pdf",
        "where": "p.7・p.13",
        "quote": "一次の取引実績としては、自然体余力の控除終了の一方で前日取引化と同時に市場での募集量が1σ相当値への変更、今年度も継続して揚水随契を実施し募集量を圧縮していることに加え、前日市場化等の取引状況の変化による影響もあり、全国大で見ると年度当初は不足率が高く推移する一方で、6月以降は一定程度の改善が見られる状況。",
        "date": "2026-09-15",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場について",
        "publisher": "資源エネルギー庁（第109回制度検討作業部会 資料6）",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/109_06_00.pdf",
        "where": "p.2・p.6（2025年12月12日・提案段階）",
        "quote": "第108回作業部会の事務局提案のとおり、複合市場の全ての商品の募集量を１σ相当に統一した場合、2026年度の募集量見込は、2025年度と比べて、一次・二次①では13%減少し、調整力調達コストの抑制が期待される。一方、複合商品（一次～三次①）では50%増加する見通しであり、発電事業者の市場参入機会の確保が期待される。",
        "date": "2025-12-12",
        "dateFrom": "PDF 表紙（第109回 制度検討作業部会の会議ページ 109.html の開催日「2025年12月12日」とも一致）"
      },
      {
        "name": "需給調整市場について",
        "publisher": "資源エネルギー庁（第108回制度検討作業部会 資料4）",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/108_04_00.pdf",
        "where": "p.31（2025年10月29日・提案）",
        "quote": "2026年度以降の複合市場における募集量削減について、制度運用を統一する観点から、一次～三次①の全ての商品で、市場による調達量を最大1σ相当としてはどうか。",
        "date": "2025-10-29",
        "dateFrom": "PDF 表紙（第108回 制度検討作業部会の会議ページ 108.html の開催日「2025年10月29日」とも一致）"
      },
      {
        "name": "需給調整市場について（第110回 制度検討作業部会 資料4）",
        "publisher": "資源エネルギー庁",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/110_04_00.pdf",
        "where": "スライド2 の注※１・スライド6",
        "quote": "募集量：現在の３σ相当量から1σ相当量※まで削減する",
        "date": "2026-01-23",
        "dateFrom": "PDF 表紙（第110回 制度検討作業部会の会議ページ 110.html の開催日「2026年1月23日」とも一致）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "balancing-market-reform-2026-03",
          "title": "需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 4,
        "quote": "2026年1月23日"
      },
      "effective": {
        "source": 4,
        "quote": "※１：「2026年度以降」とは、一次～三次①の前日取引が開始される2026年３月13日の取引（3月14日受渡分）以降を示す。"
      }
    },
    "dateException": null
  },
  {
    "id": "B-17",
    "kind": "procurement",
    "status": "effective",
    "title": "前日取引化後の複合商品（＋二次調整力②・三次調整力①）必要量の判断基準を翌々日計画の広域予備率12%から10%へ（追加調達判断→必要量判断に建付け変更）",
    "announcedOn": "2025-11-13",
    "effectiveFrom": "2026-03-14",
    "products": [
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "現行の複合商品（＋二次②・三次①）の追加調達判断※については、現状、翌々日計画の広域予備率12%を閾値としている",
    "after": "「翌々日計画における広域予備率10%」を新たな閾値として採用することとしたい／2026年度以降（前日取引化以降）は、閾値10%を基本としつつ、今後の運用状況も踏まえ、必要に応じて見直しを検討することとしたい。",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "前日取引化後の調整力必要量の考え方について",
        "publisher": "電力広域的運営推進機関（第58回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/58/jukyu_shijyo_58_04.pdf",
        "where": "p.2・p.16・p.27 まとめ",
        "quote": "2026年度の前日取引化後の複合商品（+二次②・三次①）の必要量の判断基準（閾値）の見直しとして、今回、翌々日計画における広域予備率の計上方法の見直しならびに48点化された2025年度からの実績をもとに分析を行い、前々日断面から当日断面の予備率低下リスクも考慮して、「翌々日計画における広域予備率10%」を新たな閾値として採用することとしたい。",
        "date": "2025-11-13",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理（2025年度実績および2026年度以降の検討課題）",
        "publisher": "電力広域的運営推進機関（第60回需給調整市場検討小委員会 資料3）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/60/jukyu_shijyo_60_03.pdf",
        "where": "p.12・p.21・p.73",
        "quote": "週間商品の前日取引化に関して、前日化以降、複合商品の調達量判断の閾値を10%とする 【第58回 本小委員会（完了）】／この結果を踏まえ、2026年度以降（前日取引化以降）は、閾値10%を基本としつつ、今後の運用状況も踏まえ、必要に応じて見直しを検討することとしたい。",
        "date": "2026-03-03",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場について（第110回 制度検討作業部会 資料4）",
        "publisher": "資源エネルギー庁",
        "url": "https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/110_04_00.pdf",
        "where": "スライド2 の注※１",
        "quote": "※１：「2026年度以降」とは、一次～三次①の前日取引が開始される2026年３月13日の取引（3月14日受渡分）以降を示す。",
        "date": "2026-01-23",
        "dateFrom": "PDF 表紙（第110回 制度検討作業部会の会議ページ 110.html の開催日「2026年1月23日」とも一致）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "balancing-market-reform-2026-03",
          "title": "需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２５年１１月１３日"
      },
      "effective": {
        "source": 2,
        "quote": "※１：「2026年度以降」とは、一次～三次①の前日取引が開始される2026年３月13日の取引（3月14日受渡分）以降を示す。"
      }
    },
    "dateException": "この行の資料（第58回 資料４・第60回 資料３）は、時期を「2026年度以降（前日取引化以降）」と書くだけで日付が無い。適用日は、資源エネルギー庁 第110回 制度検討作業部会 資料４ スライド2 の注※１「2026年３月13日の取引（3月14日受渡分）以降」による。"
  },
  {
    "id": "B-18",
    "kind": "procurement",
    "status": "effective",
    "title": "三次調整力②の必要量：複合商品の必要量（1σ／3σ）に応じて控除量を使い分ける運用を開始",
    "announcedOn": "2025-11-13",
    "effectiveFrom": "2026-03-14",
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "過去、三次②の効率的な調達を導入するにあたって、実務面および早期実現性を考慮して、まずもっては左下図の案A（週間商品の必要量に依らず控除量を固定）での運用を採用していたところ。",
    "after": "予定どおり、2026年度の前日取引化のタイミングに合わせて、複合商品の必要量によって控除量を使い分ける運用を開始していくことする。〔原文ママ〕",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "前日取引化後の調整力必要量の考え方について",
        "publisher": "電力広域的運営推進機関（第58回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/58/jukyu_shijyo_58_04.pdf",
        "where": "p.20・p.21・p.27",
        "quote": "また、関連して三次②必要量については、一般送配電事業者側での準備が整ったため、予定どおり、2026年度の前日取引化のタイミングに合わせて、複合商品の必要量によって控除量を使い分ける運用を開始していくことする。",
        "date": "2025-11-13",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "三次調整力②の必要量テーブルの2026年度取引に向けた更新等について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202603121930_news.pdf",
        "where": "p.1・p.2（2026年3月12日）",
        "quote": "今回の更新は、3 月 14 日実需給分より 2026 年度向け取引が開始となることに伴い、公表するファイルの名称変更および追加を行ったことによるものです。／また、複合商品の必要量に応じて控除量（テーブル）を使い分けするため、上記のファイル名称に付与する形で、公表するファイル名については以下のとおり記載いたします。",
        "date": "2026-03-12",
        "dateFrom": "PDF 1 頁の日付欄"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "balancing-market-reform-2026-03",
          "title": "需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-2"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２５年１１月１３日"
      },
      "effective": {
        "source": 1,
        "quote": "今回の更新は、3 月 14 日実需給分より 2026 年度向け取引が開始となることに伴い、公表するファイルの名称変更および追加を行ったことによるものです。"
      }
    },
    "dateException": null
  },
  {
    "id": "B-19",
    "kind": "procurement",
    "status": "effective",
    "title": "一次調整力～三次調整力①（複合市場）の調整力必要量の算定を30分コマ化に合わせ「組み合わせ算定」へ（所属ブロック単位の必要量を上限に該当コマ＋前後3コマの実績で算定）",
    "announcedOn": "2026-01-20",
    "effectiveFrom": "2026-03-14",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "2024～2025年度においては、複合市場の商品は週間断面、かつ3時間ブロック単位で市場取引が為されており、取引単位に合わせる形で、調整力必要量も3時間ブロック単位の過去実績を基に算定されている。",
    "after": "「所属ブロック単位の必要量を上限に、該当コマ+前後3コマの過去実績を諸元として調整力必要量を算定する」手法を採用する方針／〔第59回 資料４ p.36 の表の写し（2024年度実績データからの試算）〕年間必要量(複合1σ全国計)[億ΔkWh] ブロック単位 343億ΔkWh・組み合わせ算定 331億ΔkWh",
    "reasonQuote": "調整力の役割である「系統の周波数を維持して安定供給を果たす」という観点では、どの手法にも優劣は無いことを踏まえ、過剰な調整力を確保する蓋然性が低い「組み合わせによる算定」を採用することとしてはどうか。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "2026年度以降の調整力必要量について（複合市場商品：一次～三次①）",
        "publisher": "電力広域的運営推進機関（第59回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/59/jukyu_shijyo_59_04.pdf",
        "where": "p.17・p.22・p.36・p.38 まとめ",
        "quote": "複数の対応案を検証した結果として、取引単位の変更を考慮しつつも、過剰な調整力を確保する蓋然性の低い「所属ブロック単位の必要量を上限に、該当コマ+前後3コマの過去実績を諸元として調整力必要量を算定する」手法を採用する方針をお示しした。今後、2026年度より、今回整理した考え方に基づき、一次～三次①調整力の調達を開始することとしたい。",
        "date": "2026-01-20",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "第５９回需給調整市場検討小委員会 および 第７６回調整力の細分化及び広域調達の技術的検討に関する作業会 合同会議 議事録(案)",
        "publisher": "電力広域的運営推進機関",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/59/jukyu_shijyo_59_gijiroku.pdf",
        "where": "議題3 委員長発言",
        "quote": "26年度からの取引開始に向けてのこの手法、特に内容には大きな反対はなかったと感じるが、今回の試算は資料にもあったが、2024年度の実績データからの確認ということだった。今回の整理に基づいて、一次から三次①の調整力必要量、2025年度の実績データが出てきたら、それによって算出をしていただき",
        "date": "2026-01-20",
        "dateFrom": "PDF 1 頁の日時欄（会議日。議事録自体に作成日なし）"
      },
      {
        "name": "調整力必要量（複合・一次調整力～三次調整力①）の2026年3月分（3月14日以降分）および2026年4月～2026年9月分公表について",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/202603091700_news.pdf",
        "where": "p.1（2026年3月9日）",
        "quote": "調整力必要量（複合・一次調整力～三次調整力①）について、前日取引化後の 2026 年 3 月分（3 月 14 日以降分）および 2026 年 4 月～2026 年 9 月分を公表しましたのでお知らせいたします。",
        "date": "2026-03-09",
        "dateFrom": "PDF 1 頁の日付欄"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "balancing-market-reform-2026-03",
          "title": "需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２６年１月２０日"
      },
      "effective": {
        "source": 2,
        "quote": "前日取引化後の 2026 年 3 月分（3 月 14 日以降分）および 2026 年 4 月～2026 年 9 月分を公表しましたのでお知らせいたします。"
      }
    },
    "dateException": "第59回 資料４ p.2 の注は「2026年3月13日受渡分以降」、EPRX の告知（2026年3月9日）は「3 月 14 日以降分」で、1 日の違いがある。適用日は EPRX の告知による。"
  },
  {
    "id": "B-20",
    "kind": "procurement",
    "status": "effective",
    "title": "三次調整力②の2026年度必要量テーブル（母集団データ採録期間を至近2か年→3か年）",
    "announcedOn": "2026-01-20",
    "effectiveFrom": null,
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "2025年度の母集団データ採録期間は、気象予測の精度向上などの至近の取り組み効果が反映できる点や、新たな必要量低減に向けた施策の期中導入の実効性が高いことから、至近2か年データを採用していた。",
    "after": "2026年度の三次②必要量テーブルについては、母集団データの採録期間を至近3か年、特異値補正を格差1%以上とすることとしてはどうか。／アンサンブル手法、効率的な調達、取引単位30分化、複合商品必要量の控除量使い分け運用等により、2026年度の三次②年間必要量推定値は約89.7億ΔkWh（前年比▲4.2億ΔkWh、▲4.5%）となる見通し。",
    "reasonQuote": "母集団が大きくなることで、特異的な予測誤差によって生じる各年度の必要量増減を抑制可能と判断し、今後は採録期間3年をベースとすることとしてはどうか",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "三次調整力②必要量に関する2025年度事後検証および2026年度事前評価について",
        "publisher": "電力広域的運営推進機関（第59回需給調整市場検討小委員会 資料3）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/59/jukyu_shijyo_59_03.pdf",
        "where": "p.51・p.56・p.63 まとめ",
        "quote": "2026年度の三次②必要量テーブルについては、母集団データの採録期間を至近3か年、特異値補正を格差1%以上とすることとしてはどうか。アンサンブル手法、効率的な調達、取引単位30分化、複合商品必要量の控除量使い分け運用等により、2026年度の三次②年間必要量推定値は約89.7億ΔkWh（前年比▲4.2億ΔkWh、▲4.5%）となる見通し。",
        "date": "2026-01-20",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "第５９回需給調整市場検討小委員会 および 第７６回調整力の細分化及び広域調達の技術的検討に関する作業会 合同会議 議事録(案)",
        "publisher": "電力広域的運営推進機関",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/59/jukyu_shijyo_59_gijiroku.pdf",
        "where": "議題2 委員長発言",
        "quote": "この事前評価、事後評価内容そのものに大きな反対はなかった。引き続き三次②の必要量低減に向けて、国、一般送配電事業者と共に密に連携を取り、引き続き検討を行っていただきたい。",
        "date": "2026-01-20",
        "dateFrom": "PDF 1 頁の日時欄（会議日。議事録自体に作成日なし）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": null,
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２６年１月２０日"
      }
    },
    "dateException": "2026年度の三次調整力②の必要量テーブルは「3月14日実需給分より2026年度向け取引が開始」（EPRX 2026年3月12日）とあるが、採録期間の変更の適用日を書いた一次は無い。"
  },
  {
    "id": "B-21",
    "kind": "procurement",
    "status": "effective",
    "title": "中部エリア：揚水発電機の随意契約（約61万kW）に伴う需給調整市場の2026年度向け募集量見直し",
    "announcedOn": "2026-03-31",
    "effectiveFrom": "2026-04-01",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "中部エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔前年度の契約〕契約容量：約61万kW 契約期間：2025年4月1日～2026年3月31日",
    "after": "契約容量：約61万kW 契約期間：2026年4月1日～2027年3月31日 これにより、2026年3月31日取引分（4月1日受渡分）から、需給調整市場における募集量を見直しいたします",
    "reasonQuote": "調整力の効率的な調達による社会コストの抑制を目的として",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "中部エリアおよび東北エリアにおける揚水発電機を用いた随意契約の締結に伴う複合市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/news_202603311710.pdf",
        "where": "p.1（2026年3月31日）",
        "quote": "中部電力パワーグリッド株式会社および東北電力ネットワーク株式会社より、2026 年 4 月 1 日実需給分から、揚水発電機を用いた随意契約の締結に伴い複合市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2026-03-31",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場における2026年度向け募集量の見直しについて",
        "publisher": "中部電力パワーグリッド株式会社",
        "url": "https://powergrid.chuden.co.jp/news/topics/1217576_3288.html",
        "where": "本文（2026年3月31日）",
        "quote": "契約容量：約61万kW 契約期間：2026年4月1日～2027年3月31日 これにより、2026年3月31日取引分（4月1日受渡分）から、需給調整市場における募集量を見直しいたしますので、お知らせします。",
        "date": "2026-03-31",
        "dateFrom": "告知の本文冒頭（見出し直下の日付欄 p.p-lead__text）"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場週間市場商品における2025年度向け募集量の見直しについて",
        "publisher": "中部電力パワーグリッド株式会社",
        "url": "https://powergrid.chuden.co.jp/news/topics/1216968_3288.html",
        "where": "本文（前年度の契約）",
        "quote": "契約容量：約61万kW 契約期間：2025年4月1日～2026年3月31日",
        "date": "2025-10-31",
        "dateFrom": "告知の本文冒頭（見出し直下の日付欄 p.p-lead__text）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2026-01",
        "2026-03"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2026年3 月31日"
      },
      "effective": {
        "source": 0,
        "quote": "2026 年 4 月 1 日実需給分から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-22",
    "kind": "procurement",
    "status": "effective",
    "title": "東北エリア：揚水発電機の随意契約（最大23万kW）に伴う複合市場商品の募集量見直し（2026年度）",
    "announcedOn": "2026-03-31",
    "effectiveFrom": "2026-04-01",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "東北エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔前年度の契約〕契約容量：最大23万kW 契約期間：2025年4月1日～ 2026年3月31日",
    "after": "契約容量：最大23万kW 契約期間：2026年4月1日～2027年3月31日 これにより、当社は、国の審議会 ※2 の整理に基づき、需給調整市場における複合市場商品の募集量について、2026年4月1日受け渡し分から、本契約のもと調達した揚水発電機の調整力相当量を控除する見直しを実施いたします",
    "reasonQuote": "需給調整市場の一次調整力の調達率が低水準であることなどから",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "中部エリアおよび東北エリアにおける揚水発電機を用いた随意契約の締結に伴う複合市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/news_202603311710.pdf",
        "where": "p.1（2026年3月31日）",
        "quote": "中部電力パワーグリッド株式会社および東北電力ネットワーク株式会社より、2026 年 4 月 1 日実需給分から、揚水発電機を用いた随意契約の締結に伴い複合市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2026-03-31",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場複合市場商品における募集量の見直しについて（更新）",
        "publisher": "東北電力ネットワーク株式会社",
        "url": "https://nw.tohoku-epco.co.jp/information/1248501_2390.html",
        "where": "本文（2026年9月28日更新版）",
        "quote": "当社は、需給調整市場の一次調整力の調達率が低水準であることなどから、国の審議会 ※1 での整理のとおり、調整力提供事業者さまとの間で揚水発電機による調整力提供に関する随意契約の協議を進め、この度契約の締結を完了いたしました。契約容量：最大23万kW 契約期間：2026年4月1日～2027年3月31日",
        "date": "2026-09-28",
        "dateFrom": "告知の本文冒頭（見出し h2 内の日付）"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場週間市場商品における募集量の見直しについて",
        "publisher": "東北電力ネットワーク株式会社",
        "url": "https://nw.tohoku-epco.co.jp/information/1246871_2390.html",
        "where": "本文（前年度の契約）",
        "quote": "契約容量：最大23万kW 契約期間：2025年4月1日～ 2026年3月31日",
        "date": "2025-04-07",
        "dateFrom": "告知の本文冒頭（見出し h2 内の日付）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2026-01",
        "2026-03"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2026年3 月31日"
      },
      "effective": {
        "source": 0,
        "quote": "2026 年 4 月 1 日実需給分から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-23",
    "kind": "procurement",
    "status": "effective",
    "title": "関西エリア：揚水発電機の随意契約（約47万kW）に伴う複合市場商品の募集量見直し（2026年度）",
    "announcedOn": "2026-04-01",
    "effectiveFrom": "2026-04-04",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "関西エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔前年度の契約〕契約容量：約４７万ｋＷ 適用期間：２０２５年７月１９日～２０２６年３月３１日",
    "after": "契約容量：約４７万ｋＷ 適用期間：２０２６年４月４日～２０２７年３月３１日 これにより、契約開始日以降の２０２６年４月３日取引分（同年同月４日受渡分）から、国の審議会※２の整理に基づいた募集量に見直します",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "関西エリアにおける揚水発電機を用いた随意契約の締結に伴う複合市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/news_202604011500.pdf",
        "where": "p.1（2026年4月1日）",
        "quote": "関西電力送配電株式会社より、2026年4月4日実需給分から、揚水発電機を用いた随意契約の締結に伴い複合市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2026-04-01",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場における複合市場商品の募集量の見直しについて",
        "publisher": "関西電力送配電株式会社",
        "url": "https://www.kansai-td.co.jp/corporate/information/2026/pdf/20260401_2_01.pdf",
        "where": "p.1（２０２６年４月１日）",
        "quote": "契約容量：約４７万ｋＷ 適用期間：２０２６年４月４日～２０２７年３月３１日 これにより、契約開始日以降の２０２６年４月３日取引分（同年同月４日受渡分）から、国の審議会※２の整理に基づいた募集量に見直しますので、お知らせします。",
        "date": "2026-04-01",
        "dateFrom": "PDF 1 頁の表題直下の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場週間市場商品における募集量の見直しについて",
        "publisher": "関西電力送配電株式会社",
        "url": "https://www.kansai-td.co.jp/corporate/information/2025/pdf/20250711_1_01.pdf",
        "where": "p.1（前年度の契約）",
        "quote": "契約容量：約４７万ｋＷ 適用期間：２０２５年７月１９日～２０２６年３月３１日",
        "date": "2025-07-11",
        "dateFrom": "PDF 1 頁の日付欄（表題の直下）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2026-01",
        "2026-03"
      ],
      "after": [
        "2026-05",
        "2026-07"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2026年4 月1日"
      },
      "effective": {
        "source": 0,
        "quote": "2026年4月4日実需給分から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-24",
    "kind": "procurement",
    "status": "effective",
    "title": "東京エリア：揚水発電機の随意契約（約120万kW）に伴う複合市場商品の募集量見直し（2026年度）",
    "announcedOn": "2026-05-22",
    "effectiveFrom": "2026-05-26",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "東京エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔前年度の契約〕契約容量：約60万kＷ 契約期間：2025年10月10日から2026年3月31日",
    "after": "契約容量：約120万kＷ 契約期間：2026年5月 22日から2027年3月 31日 これにより、2026年5 月25日取引分（5月26日実需給分）から2027年3月31日までの期間において、国の審議会の整理（揚水発電所の随意契約により確保した調整力分を需給調整市場の週間市場商品の募集量から差し引いた値）※2にもとづき算定した募集量に見直しします",
    "reasonQuote": "需給調整市場における応札不足が継続していることなどを要因として",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "東京エリアにおける揚水発電機を用いた随意契約の締結に伴う複合市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/news_202605221500.pdf",
        "where": "p.1（2026年5月22日）",
        "quote": "東京電力パワーグリッド株式会社より、2026 年 5 月 26 日実需給分から、揚水発電機を用いた随意契約の締結に伴い複合市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2026-05-22",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場の週間市場商品における募集量の見直しについて",
        "publisher": "東京電力パワーグリッド株式会社",
        "url": "https://www.tepco.co.jp/pg/company/press-information/information/2026/pdf/26x1301.pdf",
        "where": "p.1（2026年5月22日）",
        "quote": "当社は、需給調整市場における応札不足が継続していることなどを要因として、国の審議会※1での整理を踏まえ、調整力提供事業者との間で揚水発電機による調整力提供に関する随意契約を以下のとおり締結しました。契約容量：約120万kＷ 契約期間：2026年5月 22日から2027年3月 31日",
        "date": "2026-05-22",
        "dateFrom": "PDF 1 頁の日付欄（告知の本文冒頭）"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場の週間市場商品における募集量の見直しについて",
        "publisher": "東京電力パワーグリッド株式会社",
        "url": "https://www.tepco.co.jp/pg/company/press-information/information/2025/pdf/251006j0101.pdf",
        "where": "p.1（前年度の契約）",
        "quote": "契約容量：約60万kＷ 契約期間：2025年10月10日から2026年3月31日",
        "date": "2025-10-06",
        "dateFrom": "PDF 1 頁の日付欄（告知の本文冒頭）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2026-02",
        "2026-04"
      ],
      "after": [
        "2026-06",
        "2026-08"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2026年5 月22日"
      },
      "effective": {
        "source": 0,
        "quote": "2026 年 5 月 26 日実需給分から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-25",
    "kind": "procurement",
    "status": "effective",
    "title": "中国エリア：揚水発電機の随意契約（約15万kW）に伴う複合市場商品の募集量見直し（2026年度）",
    "announcedOn": "2026-06-08",
    "effectiveFrom": "2026-06-10",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "中国エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "〔一次に変更前の募集量の記載は無い〕",
    "after": "契約容量：約15万kW 契約期間：2026年6月8日～2027年3月31日 これにより、2026年6月9日取引分（6月10日受渡分）から、需給調整市場における募集量を見直します",
    "reasonQuote": "需給調整市場における応札不足が継続していることなどから",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "中国エリアにおける揚水発電機を用いた随意契約の締結に伴う複合市場商品の募集量の見直しのお知らせ",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/news_202606081600.pdf",
        "where": "p.1（2026年6月8日）",
        "quote": "中国電力ネットワーク株式会社より、2026 年 6 月 10 日実需給分から、揚水発電機を用いた随意契約の締結に伴い複合市場商品の募集量を見直す旨の申し出がありましたのでお知らせします。",
        "date": "2026-06-08",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場における複合市場商品の募集量の見直しについて",
        "publisher": "中国電力ネットワーク株式会社",
        "url": "https://www.energia.co.jp/nw/information/news/16498.html",
        "where": "本文（2026年06月08日）",
        "quote": "契約容量：約15万kW 契約期間：2026年6月8日～2027年3月31日 これにより、2026年6月9日取引分（6月10日受渡分）から、需給調整市場における募集量を見直しますので、お知らせします。",
        "date": "2026-06-08",
        "dateFrom": "告知の本文冒頭（表題下の日付）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2026-03",
        "2026-05"
      ],
      "after": [
        "2026-07",
        "2026-09"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2026年6 月8日"
      },
      "effective": {
        "source": 0,
        "quote": "2026 年 6 月 10 日実需給分から"
      }
    },
    "dateException": null
  },
  {
    "id": "B-26",
    "kind": "procurement",
    "status": "effective",
    "title": "中国エリア：随意契約対象の揚水発電機の運用権貸与を中断（2026年度下期の募集量は運用権貸与再開の見通しが得られた段階で改めて公表、当面はEPRX公表の調整力必要量を参照）",
    "announcedOn": "2026-09-29",
    "effectiveFrom": null,
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [
      "中国エリア"
    ],
    "group": "pumped-hydro-contract",
    "before": "2026年6月9日取引分（6月10日受渡分）から、需給調整市場における募集量を見直します",
    "after": "現在、当該揚水発電機に係る運用権貸与は中断しております。このため、当面の募集量については、一般社団法人 電力需給調整力取引所が公表している 調整力必要量 をご参照ください。",
    "reasonQuote": "随意契約の対象としている揚水発電機において運転上の制約が生じたことから",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "揚水発電機を用いた随意契約における2026年度下期の複合市場商品の募集量公表の見通しについて",
        "publisher": "中国電力ネットワーク株式会社",
        "url": "https://www.energia.co.jp/nw/information/news/16685.html",
        "where": "本文（2026年09月29日）",
        "quote": "しかしながら、その後、随意契約の対象としている揚水発電機において運転上の制約が生じたことから、現在、当該揚水発電機に係る運用権貸与は中断しております。このため、当面の募集量については、一般社団法人 電力需給調整力取引所が公表している 調整力必要量 をご参照ください。",
        "date": "2026-09-29",
        "dateFrom": "告知の本文冒頭（表題下の日付）"
      },
      {
        "name": "中国エリアにおける揚水発電機を用いた随意契約の締結に伴う複合市場商品の募集量の見直しのお知らせ（2026年9月29日 一部更新）",
        "publisher": "一般社団法人 電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/news_202609291500.pdf",
        "where": "p.1",
        "quote": "https://www.energia.co.jp/nw/information/news/16685.html ※ ※2026年9 月29日 URL更新",
        "date": "2026-09-29",
        "dateFrom": "PDF 1 頁の日付欄（一部更新日）"
      },
      {
        "name": "揚水発電機を用いた随意契約の締結に伴う需給調整市場における複合市場商品の募集量の見直しについて",
        "publisher": "中国電力ネットワーク株式会社",
        "url": "https://www.energia.co.jp/nw/information/news/16498.html",
        "where": "本文（2026年6月8日の見直し）",
        "quote": "これにより、2026年6月9日取引分（6月10日受渡分）から、需給調整市場における募集量を見直しますので、お知らせします。",
        "date": "2026-06-08",
        "dateFrom": "告知の本文冒頭（表題下の日付）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": null,
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "2026年09月29日"
      }
    },
    "dateException": "中断の開始日は一次に記載が無い（中国電力ネットワーク 2026年9月29日「現在、当該揚水発電機に係る運用権貸与は中断しております。」）。"
  },
  {
    "id": "B-27",
    "kind": "procurement",
    "status": "effective",
    "title": "一次調整力の異常時必要量の見直し（周波数低下による需要減少量を控除・東エリア3社〔北海道・東北・東京〕に適用）",
    "announcedOn": "2026-07-31",
    "effectiveFrom": "2026-10-01",
    "products": [
      "primary"
    ],
    "areas": [],
    "group": null,
    "before": "<見直し前の東エリア3社の異常時一次必要量> 単機 1,356MW 756〔MW〕／単機 1,000MW 600〔MW〕",
    "after": "<見直し後の東エリア3社の異常時一次必要量> 単機1,356MW 4月 428 5月 440 6月 429 7月 415 8月 412 9月 422 10月 428 11月 419 12月 393 1月 383 2月 391 3月 414〔MW〕／現状の必要量と比較すると、3社合計で300MW程度の減少となる。",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "一次調整力（異常時必要量）の見直しについて",
        "publisher": "電力広域的運営推進機関（第62回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/62/jukyu_shijyo_62_04.pdf",
        "where": "p.31・p.32・p.34 まとめ",
        "quote": "異常時一次必要量については一次調整力応動後の残分（需要減少量）を控除することとする。上記の運用は東エリア3社（北海道、東北、東京）については問題なく導入可能と考えられるため、まずは東エリア3社において適用することでどうか。本運用開始時期としては、各TSOや事業者の準備期間を考慮し、2026年度下期（2026年10月1日）から運用開始としてはどうか。",
        "date": "2026-07-31",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理（2026年度上期実績および2026年度下期以降の予定）",
        "publisher": "電力広域的運営推進機関（第63回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/63/jukyu_shijyo_63_04.pdf",
        "where": "p.9・p.29",
        "quote": "50Hz系統の東エリア3社（北海道、東北、東京エリア）において、需要減少を考慮した必要量の見直しを適用 【第62回 本小委員会（完了）】／③需要減少量の控除 本小委 ③2026年 10/1分～ ③東エリア3社適用",
        "date": "2026-09-15",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary"
      ],
      "before": [
        "2026-07",
        "2026-09"
      ],
      "after": [
        "2026-10",
        "2026-12"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２６年７月３１日"
      },
      "effective": {
        "source": 1,
        "quote": "③2026年 10/1分～"
      }
    },
    "dateException": null
  },
  {
    "id": "C-1",
    "kind": "product",
    "status": "effective",
    "title": "三次調整力②の取引開始（需給調整市場の創設）",
    "announcedOn": "2021-03-30",
    "effectiveFrom": "2021-04-01",
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "一般送配電事業者による公募調達がエリアごとに行われていました",
    "after": "2021年4月1日に、「需給調整市場」が創設されました。／三次調整力②（2021年4月～）",
    "reasonQuote": "多くの電源等への参加機会の公平性確保、調達コストの透明性・適切性の確保、調整力の効率的な確保の観点から、2021年4月1日に、「需給調整市場」が創設されました。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場とは | 取引概要 | 一般社団法人 電力需給調整力取引所",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/outline.html",
        "where": "需給調整市場の概要／商品説明",
        "quote": "需給調整市場の商品としては、2021年度に三次調整力②、2022年度に三次調整力①を導入してまいりました。",
        "date": null,
        "dateFrom": null
      },
      {
        "name": "需給調整市場の取引開始について",
        "publisher": "電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/news_210330-2.pdf",
        "where": "本文（2021年3月30日）",
        "quote": "本日、需給調整市場システム他の健全性を確認し、3月31日（4月 1日分）から取引を開始することとなりましたので、お知らせいたします。",
        "date": "2021-03-30",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "需給調整市場の検討・詳細設計｜電力広域的運営推進機関",
        "publisher": "電力広域的運営推進機関（OCCTO）",
        "url": "https://www.occto.or.jp/gyomusyokai/no3.html",
        "where": "本文冒頭",
        "quote": "「調整力」は、一般送配電事業者による公募調達がエリアごとに行われていましたが、2021年度以降、「需給調整市場」による広域調達を順次拡大し",
        "date": null,
        "dateFrom": null
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "tertiary-reserve-2-strategy",
          "title": "需給調整市場 三次調整力②応札戦略 ── 60分応動の中規模蓄電池に適した市場"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-2"
      ],
      "before": [
        "2021-01",
        "2021-03"
      ],
      "after": [
        "2021-04",
        "2021-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 1,
        "quote": "需給調整市場の取引開始について 2021年3 月30日 電力需給調整力取引所"
      },
      "effective": {
        "source": 1,
        "quote": "本日、需給調整市場システム他の健全性を確認し、3月31日（4月 1日分）から取引を開始することとなりましたので、お知らせいたします。"
      }
    },
    "dateException": null
  },
  {
    "id": "C-2",
    "kind": "product",
    "status": "effective",
    "title": "三次調整力①の取引開始",
    "announcedOn": "2022-03-18",
    "effectiveFrom": "2022-04-01",
    "products": [
      "tertiary-1"
    ],
    "areas": [],
    "group": null,
    "before": "一般送配電事業者による公募調達がエリアごとに行われていました",
    "after": "三次調整力①（2022年4月～）／三次調整力①取引においては取引実施日の次の土曜日からその次の金曜日に調整を行うことができるΔkW の売買を行います。",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場の三次調整力①取引開始について",
        "publisher": "電力需給調整力取引所",
        "url": "https://www.eprx.or.jp/j_information/docs/220318_news_3rd1.pdf",
        "where": "本文（2022年3月18日）",
        "quote": "本日、需給調整市場システム他の健全性を確認し、3 月 22 日から 4 月 1 日分の三次調整力①取引を開始することとなりましたので、お知らせいたします。",
        "date": "2022-03-18",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "三次調整力①運用開始に向けた需給調整市場システムのシステム切替について",
        "publisher": "電力需給調整力取引所（OCCTO 第26回需給調整市場検討小委員会 資料５）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2021/files/jukyu_shijyo_26_05.pdf",
        "where": "p.4（1．システム切替のスケジュール）",
        "quote": "市場運営者によるMMSのシステム切替作業は、2022年4月1日分の三次調整力①ΔkW取引が3月22日に初回約定となるため",
        "date": "2021-11-02",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場とは | 取引概要 | 一般社団法人 電力需給調整力取引所",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/outline.html",
        "where": "商品説明",
        "quote": "三次調整力①（2022年4月～）",
        "date": null,
        "dateFrom": null
      },
      {
        "name": "需給調整市場の検討・詳細設計｜電力広域的運営推進機関",
        "publisher": "電力広域的運営推進機関（OCCTO）",
        "url": "https://www.occto.or.jp/gyomusyokai/no3.html",
        "where": "本文冒頭",
        "quote": "「調整力」は、一般送配電事業者による公募調達がエリアごとに行われていましたが",
        "date": null,
        "dateFrom": null
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "tertiary-reserve-1-detail",
          "title": "需給調整市場 三次調整力①── 蓄電池の主要収益源を徹底解説"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-1"
      ],
      "before": [
        "2022-01",
        "2022-03"
      ],
      "after": [
        "2022-04",
        "2022-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "需給調整市場の三次調整力①取引開始について 2022年3 月18日 電力需給調整力取引所"
      },
      "effective": {
        "source": 0,
        "quote": "本日、需給調整市場システム他の健全性を確認し、3 月 22 日から 4 月 1 日分の三次調整力①取引を開始することとなりましたので、お知らせいたします。"
      }
    },
    "dateException": null
  },
  {
    "id": "C-3",
    "kind": "product",
    "status": "effective",
    "title": "一次調整力・二次調整力①・二次調整力②の取引開始と複合商品の導入（全面運開）",
    "announcedOn": "2024-02-07",
    "effectiveFrom": null,
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "需給調整市場において、現在は、三次①・②の取引を実施しており",
    "after": "2024年度より需給調整市場が全面運開し、一次、二次①・②、三次①および複合商品の週間調達が開始した。",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "2024年度の需給調整市場全面運開に向けた対応の方向性について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第45回 資料４）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2023/files/jukyu_shijyo_45_04.pdf",
        "where": "p.2 はじめに",
        "quote": "需給調整市場において、現在は、三次①・②の取引を実施しており、2024年度からは一次、二次①・②の取引が開始され、需給調整市場が全面運開となる。",
        "date": "2024-02-07",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "追加調達一時中断（報告）ならびに課題に対する「応急対策」の基本的な考え方について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第47回 資料２）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_47_02.pdf",
        "where": "p.2 はじめに",
        "quote": "2024年度より需給調整市場が全面運開し、一次、二次①・②、三次①および複合商品の週間調達が開始した。",
        "date": "2024-05-15",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "2024年度市場取引および余力活用に関する契約開始に向けた需給調整市場システムのシステム切替について【報告】",
        "publisher": "送配電網協議会・電力需給調整力取引所（OCCTO 第43回小委 資料４）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2023/files/jukyu_shijyo_43_04.pdf",
        "where": "p.2 報告概要",
        "quote": "2024年度向け商品追加(二次②、二次①、一次調整力)、複合約定ロジックの追加他のシステム開発における「システム切替」対応についてご報告。",
        "date": "2023-11-09",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場とは | 取引概要 | 一般社団法人 電力需給調整力取引所",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/outline.html",
        "where": "需給調整市場の概要",
        "quote": "2024年度からは一次調整力・二次調整力①・二次調整力②を導入し、全ての商品区分で市場取引を開始しました。",
        "date": null,
        "dateFrom": null
      },
      {
        "name": "三次調整力①応札不足への対応について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第37回 資料２）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2022/files/jukyu_shijyo_37_02.pdf",
        "where": "p.10 表（複合約定ロジック 2024年度）",
        "quote": "2024年度からの複合商品導入へ向けた対応",
        "date": "2023-03-28",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "balancing-market",
          "title": "需給調整市場と蓄電池：応答速度の優位性と収益機会"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": null,
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２４年２月７日 需給調整市場検討小委員会 事務局"
      }
    },
    "dateException": "適用日は一次に受渡日の単位の記載が無い（第47回 需給調整市場検討小委員会 資料２ p.2「2024年度より需給調整市場が全面運開し」・EPRX 取引概要「二次調整力②（2024年4月～）」「二次調整力①（2024年4月～）」「一次調整力（2024年4月～）」）。公表日の第45回 資料４ は 2024年度からの開始を改めて確かめた資料で、時期は第37回 資料２（2023年3月28日）・第43回 資料４（2023年11月9日）で既に示されている。"
  },
  {
    "id": "C-4",
    "kind": "product",
    "status": "effective",
    "title": "専用線の最低入札量を 5MW から 1MW へ引下げ",
    "announcedOn": "2022-02-24",
    "effectiveFrom": "2024-04-01",
    "products": [
      "tertiary-1",
      "tertiary-2",
      "primary",
      "secondary-1",
      "secondary-2"
    ],
    "areas": [],
    "group": null,
    "before": "現状、一次～三次②の全ての商品において、専用線を用いて接続する場合の最低入札量は、専用線の敷設及び中給システムへの接続対応による一般送配電事業者のコストを考慮し、調整力公募と同様の水準として5MWとしている。",
    "after": "最低入札量見直し 2024年度 専用線の最低入札量を5MWから1MWへ変更／最低入札量 1MW 1MW 1MW 1MW 1MW〔商品要件と取引スケジュール第６版の表。列は一次調整力・二次調整力①・二次調整力②・三次調整力①・三次調整力②〕",
    "reasonQuote": "最低入札量を引き下げることで新規参入が進み、調整力調達不足の緩和や、調達コストの低減が期待されることから、専用線を用いて接続する場合の最低入札量を5MWから1MWに変更することとしてはどうか。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "一次調整力～二次調整力②、複合商品、三次②のルール見直し等に関する意見募集の結果とその対応について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第28回 資料３－１）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2021/files/jukyu_shijyo_28_03_01.pdf",
        "where": "p.17 ４．専用線の最低入札量の引き下げについて",
        "quote": "専用線の最低入札量について、現状は5MWと設定しているところ、簡易指令システムの最低入札量（1MW）まで引き下げてほしいとの意見が寄せられた。",
        "date": "2022-02-24",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "三次調整力①応札不足への対応について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第37回 資料２）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2022/files/jukyu_shijyo_37_02.pdf",
        "where": "p.10 表（最低入札量見直し 2024年度）",
        "quote": "最低入札量見直し 2024年度 専用線の最低入札量を5MWから1MWへ変更",
        "date": "2023-03-28",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場の商品要件と取引スケジュール（第６版）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/shouhin_ver.6_20260313.pdf",
        "where": "p.2 1.商品の種類と要件（最低入札量の行）",
        "quote": "最低入札量 1MW 1MW 1MW 1MW 1MW",
        "date": "2026-03-13",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "取引規程（需給調整市場）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_323122_240401.pdf",
        "where": "p.1 表紙／p.45 第26条(8) 最低入札量（備考「専用線最低入札量の緩和に伴う記載削除」）",
        "quote": "2024年４月１日 実施／(8) 最低入札量 1,000キロワットを最低入札量とする。",
        "date": "2024-04-01",
        "dateFrom": "表紙「2024年４月１日 実施」"
      },
      {
        "name": "需給調整市場 2024年度取引に向けた意見募集結果および取引規程の改定について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/docs/240314_news_r.pdf",
        "where": "p.1 本文",
        "quote": "意見募集の結果（取引規程の改定に係るご意見：45件、売買手数料単価の見通しに係るご意見：0件）および取引規程の改定(2024年4月1日付)について、下記ページにて公表します。",
        "date": "2024-03-14",
        "dateFrom": "PDF 1 頁の日付欄"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-1",
        "tertiary-2",
        "primary",
        "secondary-1",
        "secondary-2"
      ],
      "before": [
        "2024-01",
        "2024-03"
      ],
      "after": [
        "2024-04",
        "2024-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２２年２月２４日 需給調整市場検討小委員会 事務局"
      },
      "effective": {
        "source": 3,
        "quote": "2024年４月１日 実施"
      }
    },
    "dateException": "一次は取引規程の実施日（「2024年４月１日 実施」）で、受渡日（実需給日）を直接書いた記載は無い。"
  },
  {
    "id": "C-5",
    "kind": "product",
    "status": "effective",
    "title": "三次調整力②の入札時間単位 30分化・応動時間 60分以内・継続時間 30分",
    "announcedOn": "2021-11-02",
    "effectiveFrom": "2025-03-14",
    "products": [
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "2024年度 入札単位 3時間ブロック 応動時間 45分以内 継続時間 3時間",
    "after": "2025年度 入札単位 30分ブロック 応動時間 60分以内 継続時間 30分",
    "reasonQuote": "ブロック４～６いずれにおいても、応札量と募集量の算出時間帯にずれが見られるため、第一四半期の対策で取り上げた「ブロック時間の見直し」が、この期間における調達不足の改善にも効果をもたらすと考えられる。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": "蓄電池専用の規定ではなく、三次調整力②の商品要件の改定。指令値に応じた量を出し続けられる時間（継続時間）が3時間から30分になった。",
    "sources": [
      {
        "name": "三次②市場ルール見直し時期等について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会（第26回 資料４）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2021/files/jukyu_shijyo_26_04.pdf",
        "where": "p.22 まとめ",
        "quote": "ブロック時間の見直しは、工事可能時期の制約から2023～2024年度にシステム開発、2025年度からの適用開始とする。",
        "date": "2021-11-02",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "2025年度市場取引開始に向けた需給調整市場システム（MMS）のシステム切替について【報告】",
        "publisher": "一般社団法人 電力需給調整力取引所（OCCTO 第51回需給調整市場検討小委員会 資料４）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_51_04.pdf",
        "where": "p.12 ２．2025年度向け需給調整市場取引開始（PDF のレイアウトで行が分割されているため結合して引用）",
        "quote": "2025年度向け需給調整市場取引開始（三次調整力②の入札時間単位を「30分」、応動時間を「60分以内」、継続時間を「30分」に変更）は、3月14日受渡分（3月14日 00時00分～）から適用予定。",
        "date": "2024-10-23",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "2025年度の取引実績について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/information/summary_2025.pdf",
        "where": "p.56 ３．市場取引における主要な変更点（１/２）",
        "quote": "三次調整力②の取引単位時間30分化（2025年3月中旬システム切替に併せて変更済）",
        "date": "2026-06-18",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場とは | 取引概要 | 一般社団法人 電力需給調整力取引所",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/outline.html",
        "where": "商品説明 三次調整力②",
        "quote": "応動時間は60分以内、継続時間は30分。",
        "date": null,
        "dateFrom": null
      },
      {
        "name": "三次調整力②の取引単位時間30分化のフォローアップについて",
        "publisher": "電力広域的運営推進機関（需給調整市場検討小委員会 事務局）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_56_05.pdf",
        "where": "p2「はじめに」、p5「ブロック時間見直しの開始時期について」",
        "quote": "今回、三次②の取引単位30分化が開始（2025年3月14日受渡分より開始）したことを踏まえたフォローアップとして、その効果や市場への影響について分析を行ったため、その結果についてご報告させていただく。",
        "date": "2025-06-03",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "取引規程 新旧比較表",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_hikaku_250314.pdf",
        "where": "－79－・－80－ 取引規程別冊（三次調整力②）第26条(4)(5)・第29条",
        "quote": "（変更前）ただし，2025年３月31日までを実需給とする取引にあっては，属地エリアの一般送配電事業者が指令を送信してから，取引会員のリソースが供出可能量まで出力を変化するために要する時間は，45分以内とする。／（変更後）…要する時間は，60分以内とする。",
        "date": "2025-03-14",
        "dateFrom": "PDF 1 頁（表紙）右下の改定日（変更後の欄の下・頁番号「－1－」の横）"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理",
        "publisher": "電力広域的運営推進機関（需給調整市場検討小委員会 事務局）",
        "url": "https://www.occto.or.jp/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_55_sankou_01.pdf",
        "where": "p19 の注※5、p24「需給調整市場において予定されている要件変更とスケジュール（三次②）」",
        "quote": "※5入札時間単位「30分」応動時間「60分以内」、継続時間「30分」に変更（2025年度より適用）",
        "date": "2025-04-15",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "tertiary-reserve-2-strategy",
          "title": "需給調整市場 三次調整力②応札戦略 ── 60分応動の中規模蓄電池に適した市場"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "tertiary-2"
      ],
      "before": [
        "2024-12",
        "2025-02"
      ],
      "after": [
        "2025-04",
        "2025-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２１年１１月２日 需給調整市場検討小委員会 事務局"
      },
      "effective": {
        "source": 4,
        "quote": "今回、三次②の取引単位30分化が開始（2025年3月14日受渡分より開始）したことを踏まえたフォローアップとして、その効果や市場への影響について分析を行ったため、その結果についてご報告させていただく。"
      }
    },
    "dateException": null
  },
  {
    "id": "C-6",
    "kind": "product",
    "status": "effective",
    "title": "一次調整力 オフライン監視の場合の応動時間 30秒以内・継続時間 設定なし（オフライン枠の要件変更）",
    "announcedOn": "2023-09-27",
    "effectiveFrom": "2025-04-01",
    "products": [
      "primary"
    ],
    "areas": [],
    "group": null,
    "before": "応動時間 10秒以内／継続時間 5分以上（2024年度）",
    "after": "※6 オフライン監視の場合、応動時間「30秒以内」、継続時間「設定なし」（2025年度より適用）",
    "reasonQuote": "応札不足の未然防止、ひいては調整力調達コストの低減を目的とし、応動時間を30秒以内※とした一次相当の商品（以下、スカウティング枠）の導入検討を行った。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": "蓄電池専用の規定ではなく、一次調整力のオフライン枠全体の要件変更。オフライン枠に単独で参入できる蓄電池は「設備容量が1MW以上10MW未満、かつ電圧階級が特別高圧（一部の22kV等）・高圧」で、1MW未満は原則としてアグリゲートで参入する（OCCTO 第42回 資料３ p.23・揚水発電設備または蓄電池設備の取扱いガイド p.24。1MW未満でも単独で参入できる場合はガイド p.24 ※2）。",
    "sources": [
      {
        "name": "スカウティング枠ならびに追加基準値の導入実現に向けた追加検討について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第42回 資料３）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2023/files/jukyu_shijyo_42_03.pdf",
        "where": "p.39 まとめ",
        "quote": "スカウティング枠の導入時期について、2024年度中にシステム改修可能な7社については2025年4月から導入開始とし、残る2社についてはシステム開発と並行してハンド対応の準備を進め、システム開発完了もしくはハンド対応での準備完了次第、速やかに導入開始としてはどうか。",
        "date": "2023-09-27",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第59回 参考資料１）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/59/jukyu_shijyo_59_sankou_01.pdf",
        "where": "p.20 2025年度以降の商品区分・要件について（注記※6）",
        "quote": "※6 オフライン監視の場合、応動時間「30秒以内」、継続時間「設定なし」（2025年度より適用）",
        "date": "2026-01-20",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場 取引規程の改定に係る意見募集について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/2024/12/11_0955.php",
        "where": "２．主な改定内容",
        "quote": "一次調整力の新オフライン枠の導入",
        "date": "2024-12-11",
        "dateFrom": "告知の本文冒頭（表題下の日付・カテゴリ欄）"
      },
      {
        "name": "取引規程 新旧比較表",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_hikaku_250314.pdf",
        "where": "－272－ 第26条(4)応動時間・(5)継続時間（一次調整力の要件。頁見出しは「取引規程別冊（複合約定）」だが、表紙の頁割り「一次：P256～／複合：P302～」では一次の範囲）。備考欄「一次調整力オフライン枠の要件変更に伴う記載削除」／－271－ 第24条（実働試験・監視方法がオフラインの場合）変更後の欄",
        "quote": "（変更前）監視方法がオフラインの場合は30秒以内（ただし，予定している取引開始が2025年３月31日までの実需給を対象とする場合は10秒以内）とする。／（変更後）専用線オンラインで接続する場合は10秒以内とし，監視方法がオフラインの場合は，30秒以内とする。",
        "date": "2025-03-14",
        "dateFrom": "PDF 1 頁（表紙）右下の改定日（変更後の欄の下・頁番号「－1－」の横）"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理",
        "publisher": "電力広域的運営推進機関（需給調整市場検討小委員会 事務局）",
        "url": "https://www.occto.or.jp/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_55_sankou_01.pdf",
        "where": "p19 の注※6、p20「需給調整市場において予定されている要件変更とスケジュール（一次）」の表",
        "quote": "※6 オフライン監視の場合、応動時間「30秒以内」、継続時間「設定なし」（2025年度より適用）",
        "date": "2025-04-15",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "スカウティング枠ならびに追加基準値の導入実現に向けた追加検討について",
        "publisher": "電力広域的運営推進機関（需給調整市場検討小委員会 事務局）",
        "url": "https://www.occto.or.jp/iinkai/chouseiryoku/jukyuchousei/2023/files/jukyu_shijyo_42_03.pdf",
        "where": "p6（目的）、p23・p39（蓄電池の参入条件）、p27（導入開始時期）",
        "quote": "2024年度中にシステム改修が可能な7社については2025年4月から導入開始とし、残る2社についてはシステム開発と並行してハンド対応の準備を進め、システム開発完了もしくはハンド対応での準備完了次第、速やかに導入開始としてはどうか。",
        "date": "2023-09-27",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "揚水発電設備または蓄電池設備を用いて需給調整市場に参入する場合の取扱いガイド",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/yousuichikudenchi_guide_260314.pdf",
        "where": "p24「４．参入要件（蓄電池設備の一次調整力オフラインへの参入要件）」",
        "quote": "なお、蓄電池の設備容量が1MW以上10MW未満、かつ電圧階級が特別高圧（一部の22kV等）・高圧の場合および1MW未満の蓄電池をアグリゲートして参入する場合は、監視方法がオフラインで参入が可能です。",
        "date": "2026-03-14",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "balancing-market-fcr-detail",
          "title": "需給調整市場 一次調整力（FCR）詳解 ── 高速応答が要求される最高峰市場"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary"
      ],
      "before": [
        "2025-01",
        "2025-03"
      ],
      "after": [
        "2025-04",
        "2025-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２３年９月２７日 需給調整市場検討小委員会 事務局"
      },
      "effective": {
        "source": 3,
        "quote": "模擬信号入力後から30秒以内（ただし，予定している取引開始が2025年３月31日までの実需給を対象とする場合は10秒後以降）の応動実績について，以下の許容範囲内であることを30分コマ単位に評価する。"
      }
    },
    "dateException": "第42回 資料３ は「2024年度中にシステム改修可能な7社については2025年4月から導入開始」とし、残る2社の開始日は一次に無い。適用日は、2025年3月14日 実施の取引規程にも残る第24条（実働試験・監視方法がオフラインの場合）の「予定している取引開始が2025年３月31日までの実需給を対象とする場合は10秒後以降」による（第26条(4)(5)の同じ但し書きは同じ改定で削除）。"
  },
  {
    "id": "C-7",
    "kind": "product",
    "status": "effective",
    "title": "全商品の前日取引化（週間商品→前日の複合市場商品）と入札受付開始の30分前倒し",
    "announcedOn": "2025-12-11",
    "effectiveFrom": "2026-03-14",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "週間商品（一次～三次調整力①）の取引は、取引実施日の週の土曜日からその次の金曜日に調整を行うことができるΔkWの売買を行います。入札受付期間は実需給日に対応する前週月曜日の14時から前週火曜日の14時までとし、約定処理は毎週火曜15時※までに行われます。／三次調整力② の取引については、入札受付期間を実需給断面の前日12時～14時とし",
    "after": "複合市場商品（一次～三次調整力①）および三次調整力② の取引については、入札受付期間を実需給断面の前日11時30分～14時とし、約定処理は実需給断面前日15時までに行われます。",
    "reasonQuote": "アンケート結果によると、「需給変動リスクの低減」と「応札価格の適正化」については前日化の方が効果的であることが分かった一方、「業務量」、「システム面」や「振り分け入札の可否」については、より詳細な状況把握が必要となる。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場の商品要件と取引スケジュール（第５版）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/shouhin_ver.5_20250529.pdf",
        "where": "p.4 2-2. 週間商品の取引スケジュール／p.3 2-1. 三次調整力②の取引スケジュール",
        "quote": "入札受付期間は実需給日に対応する前週月曜日の14時から前週火曜日の14時までとし、約定処理は毎週火曜15時※までに行われます。",
        "date": "2025-05-29",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場の商品要件と取引スケジュール（第６版）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/shouhin_ver.6_20260313.pdf",
        "where": "p.3 2.複合市場商品および三次調整力②の取引スケジュール",
        "quote": "複合市場商品（一次～三次調整力①）および三次調整力② の取引については、入札受付期間を実需給断面の前日11時30分～14時とし、約定処理は実需給断面前日15時までに行われます。",
        "date": "2026-03-13",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "2025年度の取引実績について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/information/summary_2025.pdf",
        "where": "p.57 ３．市場取引における主要な変更点（２/２）3月",
        "quote": "2026年度取引に向けた需給調整市場システム切替が3月13日に作業完了し、3/13取引(3/14実需給分～)から、複合市場商品の前日取引化・および30分化が開始（3/13公表）",
        "date": "2026-06-18",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "【お知らせ】需給調整市場 2026年度取引に向けた取引規程改定に関する意見募集結果および改定について（2026年3月14日付）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/docs/251211_news.pdf",
        "where": "本文（2025年12月11日）",
        "quote": "意見募集の結果および取引規程の改定（2026年3月14日付）について、下記ページにて公表します。",
        "date": "2025-12-11",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "需給調整市場2026年度取引に向けた取引規程改定に関する意見募集について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/2025/10/02_0955.php",
        "where": "本文・２．取引規程の主な改定内容",
        "quote": "需給調整市場では、国の審議会における整理事項の反映を中心に、2026年3月14日に取引規程改定を予定しております。",
        "date": "2025-10-02",
        "dateFrom": "告知ページの掲載日欄（h1 直下の p.entryDate）"
      },
      {
        "name": "調整力必要量（複合・一次調整力～三次調整力①）の2026年3月分（3月14日以降分）および2026年4月～2026年9月分公表について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/docs/202603091700_news.pdf",
        "where": "本文（2026年3月9日）",
        "quote": "調整力必要量（複合・一次調整力～三次調整力①）について、前日取引化後の 2026 年 3 月分（3 月 14 日以降分）および 2026 年 4 月～2026 年 9 月分を公表しましたのでお知らせいたします。",
        "date": "2026-03-09",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "三次調整力①応札不足への対応について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第37回 資料２）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2022/files/jukyu_shijyo_37_02.pdf",
        "where": "p.28 取引会員へのアンケート結果（まとめ）",
        "quote": "このため、「取引スケジュール変更」については、まずは2026年度に前日取引化を実現することを目指し、",
        "date": "2023-03-28",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "balancing-market-practical",
          "title": "需給調整市場の実務：応札から精算までのプロセス"
        }
      ],
      "policyEvent": [
        {
          "slug": "balancing-market-reform-2026-03",
          "title": "需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite",
        "tertiary-2"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 3,
        "quote": "【お知らせ】需給調整市場 2026年度取引に向けた取引規程改定に関する意見募集結果および改定について（2026年3 月14日付） 2025年12 月11日 一般社団法人 電力需給調整力取引所"
      },
      "effective": {
        "source": 2,
        "quote": "2026年度取引に向けた需給調整市場システム切替が3月13日に作業完了し、3/13取引(3/14実需給分～)から、複合市場商品の前日取引化・および30分化が開始（3/13公表）"
      }
    },
    "dateException": null
  },
  {
    "id": "C-8",
    "kind": "product",
    "status": "effective",
    "title": "一次調整力～三次調整力①の入札時間単位 30分化（3時間→30分）と継続時間の変更",
    "announcedOn": "2025-12-11",
    "effectiveFrom": "2026-03-14",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "入札時間単位 3時間※4 3時間※4 3時間※4 3時間※4〔一次調整力～三次調整力①〕／継続時間 5分以上※6 30分以上※4 30分以上※4 3時間※4〔一次調整力・二次調整力①・二次調整力②・三次調整力①〕／※4 2026年度より「30分」に変更予定",
    "after": "入札時間単位 30分 30分 30分 30分 30分／継続時間 5分以上※3 30分 30分 30分 30分",
    "reasonQuote": "週間商品である一次～三次①は複合約定することを踏まえると、この一次～三次①の入札時間単位を3時間で据え置くと、三次②と同様に応札量が十分に市場供出されず、一次～三次①すべてについて調達不足が顕在化する可能性もある。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": "蓄電池専用の規定ではなく、一次調整力～三次調整力①の30分ブロック化・前日取引化の一部。二次調整力②・三次調整力①で出し続ける時間が、商品ブロック（3時間）の時間中から30分コマになった（二次調整力②は、2026年3月31日までを実需給とする取引について「商品ブロックの時間中」出し続けることを求める定めがあった）。あわせて、二次調整力②で「休止時間」を認める規定が削除された（この規定は取引ガイド第7版 p.183 で「なお、蓄電池等における容量制約等は技術的な理由に含まれません」としていた）。",
    "sources": [
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第59回 参考資料１）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/59/jukyu_shijyo_59_sankou_01.pdf",
        "where": "p.20 2025年度以降の商品区分・要件について（入札時間単位・継続時間の行と注記※4）",
        "quote": "※4 2026年度より「30分」に変更予定",
        "date": "2026-01-20",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場の商品要件と取引スケジュール（第６版）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/shouhin_ver.6_20260313.pdf",
        "where": "p.2 1.商品の種類と要件（入札時間単位・継続時間の行）／p.4 改廃履歴",
        "quote": "入札時間単位 30分 30分 30分 30分 30分",
        "date": "2026-03-13",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "一次調整力～二次調整力②、複合商品、三次②のルール見直し等に関する意見募集の結果とその対応について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第28回 資料３－１）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2021/files/jukyu_shijyo_28_03_01.pdf",
        "where": "p.25 ６．一次～三次①のブロック時間見直しについて（３／４）",
        "quote": "以上を踏まえ、一次～三次①の入札時間単位についても、3時間から30分に見直すこととしてはどうか。",
        "date": "2022-02-24",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "三次調整力①応札不足への対応について",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第37回 資料２）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2022/files/jukyu_shijyo_37_02.pdf",
        "where": "p.39 応札不足に関する全体スケジュール（表）",
        "quote": "ブロック時間30分化（一次～三次①） 2026年度",
        "date": "2023-03-28",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "2025年度の取引実績について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/information/summary_2025.pdf",
        "where": "p.57 ３．市場取引における主要な変更点（２/２）3月",
        "quote": "3/13取引(3/14実需給分～)から、複合市場商品の前日取引化・および30分化が開始（3/13公表）",
        "date": "2026-06-18",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "取引規程 新旧比較表",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_hikaku_260314.pdf",
        "where": "PDF 201〜202 頁 取引規程別冊（二次調整力②）第26条(5)・第27条、PDF 132〜133・144 頁 取引規程別冊（三次調整力①）第23条・第27条・第29条。備考「一次調整力～三次調整力①の30分ブロック化、前日取引化」",
        "quote": "（変更後）第29条 本市場における取引は，取引実施日の翌日を０時00分から24時00分まで30分コマ単位に区切り，各30分コマ単位のΔｋＷについて行うものとし，この30分コマ単位のΔｋＷを商品ブロックとする。",
        "date": "2026-03-14",
        "dateFrom": "PDF 1 頁（表紙）右下の改定日（変更後の欄の下・頁番号「－1－」の横）"
      },
      {
        "name": "需給調整市場の取引状況等について",
        "publisher": "電力広域的運営推進機関（需給調整市場検討小委員会 事務局）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/61/jukyu_shijyo_61_02.pdf",
        "where": "p10「需給調整市場の取引状況について（概要）」、p29（電源種別の落札量）",
        "quote": "2026年3月14日受渡分から実施された複合市場商品の前日取引化による需給調整市場における取引状況の変化を確認するため、2025年4月1日から2026年4月30日分までの取引実績を確認した。",
        "date": "2026-06-09",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理",
        "publisher": "電力広域的運営推進機関（需給調整市場検討小委員会 事務局）",
        "url": "https://www.occto.or.jp/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_55_sankou_01.pdf",
        "where": "p19「2025年度以降の商品区分・要件について」の表と注※4",
        "quote": "継続時間 5分以上※6 30分以上※4 30分以上※4 3時間※4 30分※5／※4 2026年度より「30分」に変更予定",
        "date": "2025-04-15",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場2026年度取引に向けた取引規程改定に関する説明会のご案内（2025年10月17日開催）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/2025/09/10_1455.php",
        "where": "本文冒頭・「＜主な改定内容＞」",
        "quote": "需給調整市場では、国の審議会における整理事項の反映を中心に、2026年3月14日に取引規程改定を予定しております。",
        "date": "2025-09-10",
        "dateFrom": "告知の本文冒頭（表題下の日付・カテゴリ欄）"
      },
      {
        "name": "取引ガイド（全商品）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/guide_250401.pdf",
        "where": "第7版 p157（二次調整力② 性能確認(3/10)）、p183「(参考) 休止時間を含むリソースの指令方法」",
        "quote": "※1 休止時間は技術的な理由等をもとに取り決めます（なお、蓄電池等における容量制約等は技術的な理由に含まれません）",
        "date": "2025-04-01",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "【お知らせ】需給調整市場 2026年度取引に向けた取引規程改定に関する意見募集結果および改定について（2026年3月14日付）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/docs/251211_news.pdf",
        "where": "本文",
        "quote": "意見募集の結果および取引規程の改定（2026年3月14日付）について、下記ページにて公表します。",
        "date": "2025-12-11",
        "dateFrom": "PDF 1 頁の日付欄"
      },
      {
        "name": "取引規程 新旧比較表",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_hikaku_260314.pdf",
        "where": "PDF p.201 取引規程別冊（二次調整力②）第26条(5) 変更前／PDF p.203 第29条 変更前",
        "quote": "取引会員のリソースは，30分間以上供出可能量または指令量を継続して出力し続けることが可能であること。 ただし，2026年３月31日までを実需給とする取引にあっては，取引会員のリソースは，第29条（ΔｋＷの入札単位）に定める商品ブロックの時間中，供出可能量または指令量を継続して出力し続けることが可能であること。／…この３時間単位のΔｋＷを商品ブロックとする。",
        "date": "2026-03-14",
        "dateFrom": "PDF 1 頁（表紙）右下の改定日（変更後の欄の下・頁番号「－1－」の横）"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "response-time-vs-reserves",
          "title": "蓄電池の応答時間と一次・二次・三次調整力 ── 応答性能による収益機会の差"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "composite"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 10,
        "quote": "2025年12月11日 一般社団法人 電力需給調整力取引所"
      },
      "effective": {
        "source": 4,
        "quote": "2026年度取引に向けた需給調整市場システム切替が3月13日に作業完了し、3/13取引(3/14実需給分～)から、複合市場商品の前日取引化・および30分化が開始（3/13公表）"
      }
    },
    "dateException": null
  },
  {
    "id": "D-1",
    "kind": "guideline",
    "status": "effective",
    "title": "需給調整市場ガイドライン 2024年3月25日改定（A種／B種電源の一定額を新設・起動費等の反映を2回分まで・揚水発電及び蓄電池の限界費用の算定式を明記）",
    "announcedOn": "2024-03-25",
    "effectiveFrom": "2024-04-01",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "第90回制度設計専門会合 資料7 p.19 の「現状」欄（調整力ΔkW市場の価格規律）:「A種 固定費回収済電源等」＝「逸失利益orマージン（「限界費用」×10％×電源Ⅰ稼働率5％）」、「B種 未回収固定費有電源」＝「機会費用（逸失利益）＋固定費回収のための合理的な額等」／同まとめ:「※「起動費等の入札価格への反映は１回分までしか認めない」規律を２回分までとする。」（改定前の2023年3月10日版の本文そのものは取得できていない）",
    "after": "2024年3月25日版 Ⅲ.2.(1):「一定額＝0.33 円/ΔkW・30 分（※１）または電力・ガス取引監視等委員会事務局との協議を経て決定した額（※２）とし、等は売買手数料とする。（※１）A 種電源という（※２）B 種電源といい、一定額については、制度設計専門会合等の整理に従い必要資料を提出した上で、電源毎に、固定費回収のための合理的な額を上回らない範囲で決定される。」／「起動費等の入札価格への反映は２回分までしか認めない。」／Ⅲ.1.(1)①:「※１揚水発電及び蓄電池の限界費用は、以下の算定式とする。」〔算定式は分数で、分子が「揚水ポンプ・蓄電原資＋揚水・蓄電ロス量にかかる託送費従量料金分（再エネ賦課金含む）」、分母が「発電量（揚水量ーロス量）」〕／Ⅲ.1.(1)②:「「限界費用(円/kWh)×10%程度」の一定額を上乗せした範囲内で kWh 価格を登録するものとする。」",
    "reasonQuote": "（※１）需給調整市場への供出インセンティブを確保する観点からの改定",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場ガイドライン（2024年3月25日改定版）",
        "publisher": "経済産業省（電力・ガス取引監視等委員会サイト掲載）",
        "url": "https://www.egc.meti.go.jp/info/guideline/pdf/20240325001b.pdf",
        "where": "表紙・p.3〜4（Ⅲ.1.(1)①②, Ⅲ.2.(1)）・p.6（起動費等）",
        "quote": "起動費等の入札価格への反映は２回分までしか認めない。２回分の起動費等を各入札ブロックに約定確率を考慮して按分するなど、入札事業者において入札を工夫すること。",
        "date": "2024-03-25",
        "dateFrom": "PDF 表紙（最新の改定日）"
      },
      {
        "name": "「需給調整市場ガイドライン」及び「一般送配電事業者が行う調整力の公募調達に係る考え方」の改定に関する建議について",
        "publisher": "電力・ガス取引監視等委員会",
        "url": "https://www.egc.meti.go.jp/info/public/pdf/20231121001b.pdf",
        "where": "建議文 p.1 と別添 p.2",
        "quote": "調整力ΔkW における一定額は、0.33 円/ΔkW・30 分の範囲内とする。0.33 円/ΔkW・30 分以上の一定額を希望する応札電源（以下「当該電源」という。）については、電力・ガス取引監視等委員会と協議を行い、当該電源の固定費回収に必要な額を超えない範囲内で合理的な額を決定する。",
        "date": "2023-11-21",
        "dateFrom": "PDF 1 頁の日付欄（建議文の文書番号の下）"
      },
      {
        "name": "需給調整市場の運用等について（第90回 制度設計専門会合 資料7）",
        "publisher": "電力・ガス取引監視等委員会 制度設計専門会合",
        "url": "https://www.egc.meti.go.jp/activity/emsc_system/pdf/090_07_00.pdf",
        "where": "p.19「1ｰ４. まとめ」の現状／変更案の表",
        "quote": "※「起動費等の入札価格への反映は１回分までしか認めない」規律を２回分までとする。",
        "date": "2023-10-31",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "「需給調整市場ガイドライン」及び「一般送配電事業者が行う調整力の公募調達に係る考え方」改定の建議について（第477回 電力・ガス取引監視等委員会 資料３）",
        "publisher": "電力・ガス取引監視等委員会事務局",
        "url": "https://www.egc.meti.go.jp/activity/emsc/pdf/477_03_00.pdf",
        "where": "p.1（趣旨）注記",
        "quote": "（※１）需給調整市場への供出インセンティブを確保する観点からの改定",
        "date": "2023-11-21",
        "dateFrom": "PDF 1 頁（表題下の日付）"
      },
      {
        "name": "需給調整市場B種電源協議の報告等について（第95回 制度設計専門会合 資料6）",
        "publisher": "電力・ガス取引監視等委員会 制度設計専門会合",
        "url": "https://www.egc.meti.go.jp/activity/emsc_system/pdf/095_06_00.pdf",
        "where": "p.3 注記",
        "quote": "（※）新たな需給調整市場ガイドラインは、2024年３月25日付けで改定（2024年４月１日受渡分から適用）された。",
        "date": "2024-03-28",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "tertiary-2"
      ],
      "before": [
        "2024-01",
        "2024-03"
      ],
      "after": [
        "2024-04",
        "2024-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "改定 ２０２４年３月２５日"
      },
      "effective": {
        "source": 4,
        "quote": "（※）新たな需給調整市場ガイドラインは、2024年３月25日付けで改定（2024年４月１日受渡分から適用）された。"
      }
    },
    "dateException": null
  },
  {
    "id": "D-2",
    "kind": "guideline",
    "status": "effective",
    "title": "需給調整市場ガイドライン 2025年3月24日改定（起動費等の反映を1回分に戻し取り漏れは事後精算・B種電源は「当年度分」の固定費・kWh一定割合を10%に確定）",
    "announcedOn": "2025-03-24",
    "effectiveFrom": "2025-04-01",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "2024年3月25日版:「起動費等の入札価格への反映は２回分までしか認めない。」／「取り漏れが生じた起動費等については、その相当分の額について当該年度の先々の取引において計上することを許容することを基本とし、その上限額は、固定費回収額と合わせて管理することとする。」／「（※２）B 種電源といい、一定額については、制度設計専門会合等の整理に従い必要資料を提出した上で、電源毎に、固定費回収のための合理的な額を上回らない範囲で決定される。」／「「限界費用(円/kWh)×10%程度」の一定額を上乗せした範囲内で kWh 価格を登録するものとする。」",
    "after": "2025年3月24日版:「起動費等の入札価格への反映は１回分までしか認めない。」／「取り漏れが生じた起動費等については、その相当分の額について、一般送配電事業者と発電事業者等の間で事後精算を行うことを許容する。」／「※２ B 種電源といい、一定額については、制度設計専門会合等の整理に従い必要資料を提出した上で、電源毎に、当年度分の固定費回収のための合理的な額を上回らない範囲で決定される。なお、当年度分の固定費回収後の一定額は、A 種電源とする。」／「「限界費用(円/kWh)×10%」の一定額を上乗せした範囲内で kWh 価格を登録するものとする。」／「なお、逸失利益（機会費用）は、需給調整市場への応札に伴い発生するものに限る。」／「同一出力帯における上げ調整時の限界費用と下げ調整時の限界費用は一致させることとする。」",
    "reasonQuote": "現在、需給調整市場については、多くの商品及びエリアにおいて、募集量未達の状況が継続しており、市場競争が十分に機能していないという課題が生じています。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場ガイドライン（2025年3月24日改定版）",
        "publisher": "経済産業省（電力・ガス取引監視等委員会サイト掲載）",
        "url": "https://www.egc.meti.go.jp/info/guideline/pdf/20250324001a.pdf",
        "where": "表紙・Ⅲ.1.(1)①②・Ⅲ.2.①②・Ⅴ（本ガイドラインの適用について）",
        "quote": "2025 年 3 月 24 日改定後の本ガイドラインについては、2025 年 4 月 1 日以降受け渡し分からの適用とする。",
        "date": "2025-03-24",
        "dateFrom": "PDF 表紙（最新の改定日）"
      },
      {
        "name": "需給調整市場ガイドライン（2024年3月25日改定版）",
        "publisher": "経済産業省（電力・ガス取引監視等委員会サイト掲載）",
        "url": "https://www.egc.meti.go.jp/info/guideline/pdf/20240325001b.pdf",
        "where": "Ⅲ.2.(1) と（適切な起動費等の計上・入札の在り方）",
        "quote": "取り漏れが生じた起動費等については、その相当分の額について当該年度の先々の取引において計上することを許容することを基本とし、その上限額は、固定費回収額と合わせて管理することとする。",
        "date": "2024-03-25",
        "dateFrom": "PDF 表紙（最新の改定日）"
      },
      {
        "name": "「需給調整市場ガイドライン」の改定に関する建議について",
        "publisher": "電力・ガス取引監視等委員会",
        "url": "https://www.egc.meti.go.jp/info/public/pdf/20241202004b.pdf",
        "where": "建議文 p.1・別添 p.2「需給調整市場ガイドライン 改定事項」",
        "quote": "起動費等の入札価格への反映は、１回分までしか認めない旨、記載する。また、取り漏れが生じた起動費等については、その相当分の額について、一般送配電事業者と発電事業者等の間で事後精算を行うことを許容する旨、記載する。",
        "date": "2024-12-02",
        "dateFrom": "PDF 1 頁の日付欄（建議文の文書番号の下）"
      },
      {
        "name": "「需給調整市場ガイドライン」の改定の建議について",
        "publisher": "電力・ガス取引監視等委員会",
        "url": "https://www.egc.meti.go.jp/info/public/news/20241202004.html",
        "where": "本件の概要 1．概要",
        "quote": "現在、需給調整市場については、多くの商品及びエリアにおいて、募集量未達の状況が継続しており、市場競争が十分に機能していないという課題が生じています。",
        "date": "2024-12-02",
        "dateFrom": "告知の「公表日」欄"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "tertiary-2"
      ],
      "before": [
        "2025-01",
        "2025-03"
      ],
      "after": [
        "2025-04",
        "2025-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "改定 ２０２５年３月２４日"
      },
      "effective": {
        "source": 0,
        "quote": "2025年3月24日改定後の本ガイドラインについては、2025年4月1日以降受け渡し分からの適用とする。"
      }
    },
    "dateException": null
  },
  {
    "id": "D-3",
    "kind": "guideline",
    "status": "effective",
    "title": "需給調整市場ガイドライン 2026年3月13日改定（B種電源協議の廃止・事前確認と四半期報告・前日取引化に伴う逸失利益と起動費等の按分・蓄電原資・「問題となる行為」の追加・セーフハーバーの明記）",
    "announcedOn": "2026-03-13",
    "effectiveFrom": "2026-03-14",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "2025年3月24日版:「一定額＝0.33 円/ΔkW・30 分（※１）又は電力・ガス取引監視等委員会事務局との協議を経て決定した額（※２）とし、等は売買手数料とする。」／「後述３．で特定する大きな市場支配力を有する蓋然性の高い事業者に対しては、事前的措置として上記のΔkW 価格で登録することを要請する。」／「卸電力市場価格（予想）は、当該エリアのスポット市場価格と時間前市場価格の想定値の範囲内から、適切な価格を１つ選定する。」／「受渡し日の前週に取引が行われる場合、卸電力市場価格（予想）はスポット市場価格の想定価格とする。受渡し日の前日に取引が行われる場合、卸電力市場価格（予想）は時間前市場価格の想定価格とする。」／Ⅰ:「本文書は、需給調整市場における事前的措置の考え方の詳細を示すことで、需給調整市場の適切な運営を目指すものである。」",
    "after": "2026年3月13日版 Ⅲ.2.:「後述３．で特定する大きな市場支配力を有する蓋然性の高い事業者は、事前的措置として上記のΔkW価格で登録することが望ましい。また、監視においては、当該事業者に対し次年度の取引開始前に、以下のⅰ）について確認を行うとともに、四半期ごとに、以下のⅱ）について報告を求める。」／②:「「一定額」については、0.33円/ΔkW・30分（A種電源）又は「固定費回収のための合理的な額」の考え方に基づき算定した額（B種電源）とし、「等」は売買手数料とする。」／「卸電力市場価格（予想）は、時間前市場価格の想定価格とする。」／「FIP電源併設蓄電池については、蓄電池にかかる固定費のみを算入する。」／※２:「なお、一般送配電事業者からのインバランス補給による充電は適当ではない。」／Ⅰ:「すなわち、セーフハーバーとなる。」／Ⅳ:「１．調整力ΔkW市場における入札価格若しくは入札量又は調整力kWh市場における登録価格の不合理な設定により、不当に収益を得る行為」",
    "reasonQuote": "今般、需給調整市場の監視において発覚した不適切な事案や2026年度からの全商品前日取引化といった取引ルールの変更等を踏まえ、第９回、第10回、第14回及び第15回制度設計・監視専門会合（令和７年５月23日、６月27日、10月29日及び11月21日）において、事後的措置の詳細及び事前的措置の考え方の詳細等について、追加整理を行いました。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場ガイドライン（2026年3月13日改定版）",
        "publisher": "経済産業省",
        "url": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/jyukyuchosei-gl.pdf",
        "where": "表紙・Ⅰ・Ⅲ.1.(1)①※２・Ⅲ.2.①②・Ⅳ・Ⅵ",
        "quote": "2026年3月13日改定後の本ガイドラインについては、2026年3月14日以降受け渡し分からの適用とする。",
        "date": "2026-03-13",
        "dateFrom": "PDF 表紙（最新の改定日）"
      },
      {
        "name": "ガイドライン（電力・ガス取引監視等委員会 ガイドライン・各種とりまとめ・監査規程等）",
        "publisher": "電力・ガス取引監視等委員会",
        "url": "https://www.egc.meti.go.jp/info/guideline/",
        "where": "ガイドライン一覧",
        "quote": "需給調整市場ガイドライン（令和8年3月13日）※令和8年3月14日受け渡し分からの適用",
        "date": null,
        "dateFrom": null
      },
      {
        "name": "需給調整市場ガイドライン（2025年3月24日改定版）",
        "publisher": "経済産業省（電力・ガス取引監視等委員会サイト掲載）",
        "url": "https://www.egc.meti.go.jp/info/guideline/pdf/20250324001a.pdf",
        "where": "Ⅰ・Ⅲ.2.・（卸電力市場価格（予想）の考え方）",
        "quote": "後述３．で特定する大きな市場支配力を有する蓋然性の高い事業者に対しては、事前的措置として上記のΔkW 価格で登録することを要請する。",
        "date": "2025-03-24",
        "dateFrom": "PDF 表紙（最新の改定日）"
      },
      {
        "name": "「適正な電力取引についての指針」及び「需給調整市場ガイドライン」の改定の建議について",
        "publisher": "電力・ガス取引監視等委員会",
        "url": "https://www.egc.meti.go.jp/info/public/news/20251210001.html",
        "where": "本件の概要 1．概要",
        "quote": "事前的措置の対象事業者による一定額（0.33円/ΔkW・30分）を超過した事案に対するB種電源協議については廃止する。",
        "date": "2025-12-10",
        "dateFrom": "告知ページ末尾の公表日欄"
      },
      {
        "name": "「適正な電力取引についての指針」及び「需給調整市場ガイドライン」の改定に関する建議について",
        "publisher": "電力・ガス取引監視等委員会",
        "url": "https://www.egc.meti.go.jp/info/public/pdf/20251210a.pdf",
        "where": "建議文 p.1・別添 2 ②④",
        "quote": "2026年度以降は全商品前日取引化となるため、現在の週間商品である一次調整力～三次調整力①についても「時間前市場価格の想定価格」を用いる。",
        "date": "2025-12-10",
        "dateFrom": "PDF 1 頁の日付欄（建議文の文書番号の下）"
      },
      {
        "name": "「適正な電力取引についての指針（改定案）」及び「需給調整市場ガイドライン（改定案）」に対する意見募集の結果について",
        "publisher": "公正取引委員会 事務総局 経済取引局 調整課／資源エネルギー庁 電力・ガス事業部",
        "url": "https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000309544",
        "where": "p.1（実施期間等）",
        "quote": "令和７年１２月２６日（金）～ 令和８年１月２９日（木）",
        "date": "2026-03-13",
        "dateFrom": "PDF 1 頁（表題直下の日付）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "balancing-market-reform-2026-03",
          "title": "需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "tertiary-2"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "改定 ２０２６年３月１３日"
      },
      "effective": {
        "source": 0,
        "quote": "2026年3月13日改定後の本ガイドラインについては、2026年3月14日以降受け渡し分からの適用とする。"
      }
    },
    "dateException": null
  },
  {
    "id": "D-4",
    "kind": "guideline",
    "status": "effective",
    "title": "適正な電力取引についての指針 2026年3月13日改定（需給調整市場の透明性に「② その他の問題となる行為」を追加し処分対象行為を需給調整市場ガイドラインに委任）",
    "announcedOn": "2026-03-13",
    "effectiveFrom": "2026-03-13",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "令和6年11月22日版 第二部Ⅱ１（５）:「したがって、需給調整市場の適正な価格形成を確保するため、需給調整市場において相場操縦を行うことは電気事業法上問題となり得ることを明らかにする。」／同２（５）イ:「○ 相場操縦」のみ（その他の問題となる行為の項なし）",
    "after": "令和８年３月１３日版 第二部Ⅱ１（５）:「したがって、需給調整市場における公正かつ有効な競争を通じ、適正な価格形成を確保するため、需給調整市場において相場操縦その他の問題となる行為（具体的な処分対象行為は「需給調整市場ガイドライン」に記載）を行うことは電気事業法上問題となり得ることを明らかにする。」／同２（５）イ:「② その他の問題となる行為　需給調整市場における公正かつ有効な競争を通じて、適正な価格形成を確保する観点から、「需給調整市場ガイドライン」に記載する処分対象行為は、電気事業法に基づく業務改善命令や業務改善勧告の対象となり得る。」",
    "reasonQuote": "現状の適正な電力取引についての指針においては、電気事業法に基づく業務改善命令等の対象となり得る「問題となる行為」として相場操縦のみの規定に留まっており、不合理な入札行動に対する事例を十分に明示できていないという課題がありました。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "適正な電力取引についての指針（令和８年３月１３日）",
        "publisher": "公正取引委員会・経済産業省",
        "url": "https://www.jftc.go.jp/hourei_files/denki.pdf",
        "where": "表紙・第二部Ⅱ１（５）（p.18）・２（５）イ②（p.34）・附則（p.86 前後）",
        "quote": "需給調整市場における公正かつ有効な競争を通じて、適正な価格形成を確保する観点から、「需給調整市場ガイドライン」に記載する処分対象行為は、電気事業法に基づく業務改善命令や業務改善勧告の対象となり得る。",
        "date": "2026-03-13",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "適正な電力取引についての指針（令和６年１１月２２日・別紙２）",
        "publisher": "公正取引委員会・経済産業省",
        "url": "https://www.jftc.go.jp/houdou/pressrelease/2024/nov/241122_denryokugl3.pdf",
        "where": "第二部Ⅱ１（５）・２（５）イ",
        "quote": "したがって、需給調整市場の適正な価格形成を確保するため、需給調整市場において相場操縦を行うことは電気事業法上問題となり得ることを明らかにする。",
        "date": "2024-11-22",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "「適正な電力取引についての指針（改定案）」及び「需給調整市場ガイドライン（改定案）」に対する意見募集の結果について",
        "publisher": "公正取引委員会 事務総局 経済取引局 調整課／資源エネルギー庁 電力・ガス事業部",
        "url": "https://public-comment.e-gov.go.jp/pcm/download?seqNo=0000309544",
        "where": "別紙 通しNo.1 の「御意見に対する考え方」",
        "quote": "現状の適正な電力取引についての指針においては、電気事業法に基づく業務改善命令等の対象となり得る「問題となる行為」として相場操縦のみの規定に留まっており、不合理な入札行動に対する事例を十分に明示できていないという課題がありました。",
        "date": "2026-03-13",
        "dateFrom": "PDF 1 頁（表題直下の日付）"
      },
      {
        "name": "「適正な電力取引についての指針」及び「需給調整市場ガイドライン」の改定に関する建議について",
        "publisher": "電力・ガス取引監視等委員会",
        "url": "https://www.egc.meti.go.jp/info/public/pdf/20251210a.pdf",
        "where": "建議文 p.1・別添 1",
        "quote": "需給調整市場の透明性にかかる記載に関し、「その他の問題となる行為」を追記し、その具体的な処分対象行為については、市況の変化に応じて新たな問題行為が発生した際の柔軟性を確保する観点等から、「需給調整市場ガイドライン」に全部委任する旨を記載する。",
        "date": "2025-12-10",
        "dateFrom": "PDF 1 頁の日付欄（建議文の文書番号の下）"
      },
      {
        "name": "関係法令・ガイドライン等｜資源エネルギー庁",
        "publisher": "資源エネルギー庁",
        "url": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/",
        "where": "ガイドライン等の一覧",
        "quote": "適正な電力取引についての指針(令和8年3月13日改定)",
        "date": "2026-10-05",
        "dateFrom": "ページ末尾の最終更新日"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "balancing-market-reform-2026-03",
          "title": "需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "tertiary-2"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "適正な電力取引についての指針 令和８年３月１３日 公正取引委員会"
      },
      "effective": {
        "source": 0,
        "quote": "令和８年３月１３日の改定後の本指針は、同日から適用する。"
      }
    },
    "dateException": "一次は指針の適用の日（「令和８年３月１３日の改定後の本指針は、同日から適用する。」）で、実需給日として書いた記載は無い。"
  },
  {
    "id": "E-4",
    "kind": "battery",
    "status": "effective",
    "title": "低圧リソースの参入：発電リソースを『受電電圧が高圧および特別高圧』に限る定めを削除し、群リソース・機器点参入を新設（2026年3月14日改定）",
    "announcedOn": "2025-12-11",
    "effectiveFrom": "2026-03-14",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "取引規程（2025年4月1日実施）第2条(3) リソース：「調整に用いる発電機等（発電リソース）（受電電圧が高圧および特別高圧の発電機等に限る）および需要家等（需要リソース）（需要抑制により電力量を供出する場合に限る）」",
    "after": "取引規程（2026年3月14日実施）第2条(3) リソース：「調整に用いる発電機等（発電リソース）および需要家等（需要リソース）（需要抑制により電力量を供出する場合に限る）」、新設 (13)群リソース：「受電点の電圧が低圧で，調整に用いる複数のリソースを一括して一つのリソースとみなすもの」。OCCTO：「低圧受電点計測に関しては、2026年度から全商品においてリスト・パターンにて市場参入可」",
    "reasonQuote": "また、家庭用蓄電池やEVを中心に低圧リソースの大幅な普及拡大が見込まれることを踏まえ、低圧リソースを活用して需給調整市場へ参入することが整理されました。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "取引規程 新旧比較表",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_hikaku_260314.pdf",
        "where": "PDF 5〜6 頁 取引規程 本則 第2条（定義）(3)リソース・(13)群リソース。備考「機器個別計測・低圧リソース参入」",
        "quote": "（変更前）調整に用いる発電機等（発電リソース）（受電電圧が高圧および特別高圧の発電機等に限る）および需要家等（需要リソース）（需要抑制により電力量を供出する場合に限る）／（変更後）調整に用いる発電機等（発電リソース）および需要家等（需要リソース）（需要抑制により電力量を供出する場合に限る）",
        "date": "2026-03-14",
        "dateFrom": "PDF 1 頁（表紙）右下の改定日（変更後の欄の下・頁番号「－1－」の横）"
      },
      {
        "name": "需給調整市場における機器個別計測・低圧リソース導入について（2026年度からの制度開始に向けた整理）",
        "publisher": "電力広域的運営推進機関（需給調整市場検討小委員会 事務局）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_57_03.pdf",
        "where": "p31「2026年度時点の需給調整市場における参入条件について」、p34「まとめ」",
        "quote": "低圧受電点計測に関しては、2026年度から全商品においてリスト・パターンにて市場参入可",
        "date": "2025-09-26",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "取引ガイド（全商品）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/guide_ver.10_260701.pdf",
        "where": "第10版 p69「1-3. 機器個別計測・低圧リソース導入 a. 概要」、p70「(参考) 特定計量システムの概要」",
        "quote": "特定計量システムは、2026年4月から開始となります。（低圧を対象とする取引から開始となり、高圧を対象とする取引は2027年4月から対象となります。）",
        "date": "2026-07-01",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場2026年度取引に向けた取引規程改定に関する意見募集について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/2025/10/02_0955.php",
        "where": "「２．取引規程の主な改定内容」",
        "quote": "需給調整市場では、国の審議会における整理事項の反映を中心に、2026年3月14日に取引規程改定を予定しております。／３．機器個別計測・低圧リソース参入",
        "date": "2025-10-02",
        "dateFrom": "告知ページの掲載日欄（h1 直下の p.entryDate）"
      },
      {
        "name": "需給調整市場2026年度取引に向けた取引規程改定に関する説明会のご案内（2025年10月17日開催）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/2025/09/10_1455.php",
        "where": "掲載日欄・本文・【説明内容について】",
        "quote": "需給調整市場では、国の審議会における整理事項の反映を中心に、2026年3月14日に取引規程改定を予定しております。／説明会では、主な改定内容のうち「３．機器個別計測・低圧リソース参入」に関する内容を中心に説明いたします。",
        "date": "2025-09-10",
        "dateFrom": "告知の本文冒頭（表題下の日付・カテゴリ欄）"
      },
      {
        "name": "【お知らせ】需給調整市場 2026年度取引に向けた取引規程改定に関する意見募集結果および改定について（2026年3月14日付）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/docs/251211_news.pdf",
        "where": "本文",
        "quote": "意見募集の結果および取引規程の改定（2026年3月14日付）について、下記ページにて公表します。",
        "date": "2025-12-11",
        "dateFrom": "PDF 1 頁の日付欄"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "low-voltage-balancing-market-launch",
          "title": "低圧系統用蓄電池の需給調整市場参入 ── 4月実装開始とアグリ事業の本格化"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "tertiary-2"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 5,
        "quote": "2025年12月11日 一般社団法人 電力需給調整力取引所"
      },
      "effective": {
        "source": 0,
        "quote": "2026年３月14日 実施"
      }
    },
    "dateException": "公表日は取引規程の改定（2026年3月14日付）を公表した EPRX の告知の日（同じ改定の C-7・C-8・E-6 と同じ）。改定の予定と内容は 2025年9月10日の説明会のご案内が先に示している。適用日は取引規程の実施日（「2026年３月14日 実施」）で、実需給日として書いた記載は無い。機器点の計量に使う特定計量システムは「2026年4月から開始」（取引ガイド第10版 p.70）。"
  },
  {
    "id": "E-5",
    "kind": "battery",
    "status": "effective",
    "title": "容量市場の発動指令電源との同時指令：実効性テストの実施指令を優先（代替不可申請のペナルティⅠ倍率1.0倍・応動不履行の積算対象外）、機器点参入では発動指令を優先（2026年7月1日改定）",
    "announcedOn": "2026-06-18",
    "effectiveFrom": "2026-07-01",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "取引規程（2026年4月1日実施）第13条(1)：発動指令電源の指令との優先関係の定めなし（運用に関する要件はレ「提供期間において，ΔｋＷ約定量の範囲内で属地エリアの一般送配電事業者からの指令に従い調整を行うこと。」まで）。OCCTO 第60回 資料2 p25：「現行の整理において調整力指令よりも実効性テストを優先して応動した場合には、需給調整市場においてアセスメント不適合となる可能性がある。」",
    "after": "取引規程（2026年7月1日実施）第13条(1) 新設 ソ：「機器点参入に用いるリソースの場合，提供期間において，属地エリアの一般送配電事業者から発動指令電源の発動指令を受けたとき（ただし，ツに定める実効性テストにおける実施指令を受けた場合を除く。）は，当該発動指令を優先すること。」ツ：「提供期間において，属地エリアの一般送配電事業者による発動指令電源の実効性テストにおける実施指令を受けた場合は，当該実施指令を優先すること。」取引ガイド第10版 p15（受電点・実効性テスト）：「代替不可申請によるペナルティⅠ倍率：1.0倍」「応動不履行：積算対象外※1」",
    "reasonQuote": "他方で、実効性テストは、発電実績をもってその能力評価を行う必要性があり、実施は発動指令電源とは異なり、広域予備率の状況に依らず、予見性がないこと等を踏まえると、代替不可申請を行うと1.5倍の金銭的ペナルティが科せられることになるものの、当該ケースについては、調整力提供者にとって不利益が生じないように金銭的ペナルティ強度を1.0倍にした上で、契約不履行ペナルティであるアセスメント不適合時の処分の対象外※としてはどうか。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "取引規程 新旧比較表",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_hikaku_ver.18_260701.pdf",
        "where": "PDF 32 頁 取引規程 本則 第13条(1)ソ・ツ（変更後に新設）。備考「発動指令電源の扱いについての修正」",
        "quote": "ツ 提供期間において，属地エリアの一般送配電事業者による発動指令電源の実効性テストにおける実施指令を受けた場合は，当該実施指令を優先すること。",
        "date": "2026-07-01",
        "dateFrom": "PDF 1 頁（表紙）右下の改定日（変更後の欄の下・頁番号「－1－」の横）"
      },
      {
        "name": "取引ガイド（全商品）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/guide_ver.10_260701.pdf",
        "where": "第10版 p15「(参考) 容量市場の発動指令電源における指令を受けた場合の提供期間の扱い」（新規）（受電点参入地点・実効性テストの実施指令の欄）",
        "quote": "指令：実効性テストの実施指令を優先する／代替不可申請によるペナルティⅠ倍率：1.0倍／応動不履行：積算対象外※1",
        "date": "2026-07-01",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "発動指令電源の機器個別計測での扱いについて",
        "publisher": "電力広域的運営推進機関（需給調整市場検討小委員会 事務局）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/60/jukyu_shijyo_60_02.pdf",
        "where": "p9（受電点の現行整理）、p23（実効性テスト時の扱い）、p25（現状の運用）、p27（まとめ）",
        "quote": "なお、本運用の開始時期については、需給調整市場の取引規程類の改定後の開始となる。",
        "date": "2026-03-03",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場 取引規程類の改定に関する意見募集について（2026年7月改定予定）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/2026/05/11_0955.php",
        "where": "本文冒頭・「２．取引規程の改定内容」",
        "quote": "需給調整市場では、需給調整市場検討小委員会における整理事項の反映を中心に、2026年7月1日に取引規程類の改定を予定しております。（改定内容：発動指令電源の扱いについて（需給調整市場検討小委員会における整理事項））",
        "date": "2026-05-11",
        "dateFrom": "告知ページの掲載日欄（h1 直下の p.entryDate）"
      },
      {
        "name": "【お知らせ】需給調整市場 取引規程類の改定に関する意見募集結果および改定について（2026年7月1日付）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/docs/260618_news.pdf",
        "where": "p.1 本文",
        "quote": "今般、意見募集の結果および取引規程の改定（2026年7月1日付）について、下記ページにて公表します。",
        "date": "2026-06-18",
        "dateFrom": "PDF 1 頁の日付欄"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "multi-use-operation-strategy",
          "title": "容量市場×需給調整市場×JEPXのマルチユース運用 ── 蓄電所収益最大化の実務"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "tertiary-2"
      ],
      "before": [
        "2026-04",
        "2026-06"
      ],
      "after": [
        "2026-07",
        "2026-09"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 4,
        "quote": "2026年 6月18日"
      },
      "effective": {
        "source": 0,
        "quote": "2026年７月１日 実施"
      }
    },
    "dateException": "公表日は取引規程の改定（2026年7月1日付）を公表した EPRX の告知の日。意見募集の告知は 2026年5月11日。適用日は取引規程の実施日（「2026年７月１日 実施」）で、実需給日として書いた記載は無い。"
  },
  {
    "id": "E-6",
    "kind": "battery",
    "status": "effective",
    "title": "揚水発電設備または蓄電池設備の取扱いガイド第3版：揚水動力等（揚水動力または蓄電池（蓄電））の需要計画を個別計画で取引計画と一致させる注記と注意事項スライドを新設（2026年3月14日実施）",
    "announcedOn": "2025-12-11",
    "effectiveFrom": "2026-03-14",
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "第2版（2025年4月1日）の「５．計画等の提出」各表（p26〜31）の注は「※注 本表は、需給調整市場参入にあたり、計画提出が必要な項目を記載しております」のみで、需要計画と取引計画の一致に関する注記はない。需要計画の注意事項のスライドもない。",
    "after": "第3版（2026年3月14日）p26〜31（各表に「修正」）：「注）需要計画については、揚水動力等毎の個別計画において、取引計画（調達－販売）と一致するように提出してください。」p32（新規）「５．計画等の提出（需要計画の注意事項について）」：「揚水動力等の翌日（当日）需要計画については、GCまでに揚水動力等毎の個別計画において、取引計画（調達－販売）と一致するように提出してください。」",
    "reasonQuote": null,
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": null,
    "sources": [
      {
        "name": "揚水発電設備または蓄電池設備を用いて需給調整市場に参入する場合の取扱いガイド",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/yousuichikudenchi_guide_260314.pdf",
        "where": "第3版 p26〜31（各表に「修正」の印）、p32「５．計画等の提出（需要計画の注意事項について）」（「新規」の印）",
        "quote": "揚水動力等の翌日（当日）需要計画については、GCまでに揚水動力等毎の個別計画において、取引計画（調達－販売）と一致するように提出してください。",
        "date": "2026-03-14",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "揚水発電設備または蓄電池設備を用いて需給調整市場に参入する場合の取扱いガイド",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/yousuichikudenchi_guide_250401.pdf",
        "where": "第2版 p26〜31「５．計画等の提出」各表の注",
        "quote": "※注 本表は、需給調整市場参入にあたり、計画提出が必要な項目を記載しております",
        "date": "2025-04-01",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場に係る取引規程等の公表",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/announcement.html",
        "where": "公表資料一覧",
        "quote": "揚水発電設備または蓄電池設備を用いて需給調整市場に参入する場合の取扱いガイド（第3版）（2026/3/14実施）［2.0 MB］ ※2025年12月11日掲載",
        "date": "2025-12-11",
        "dateFrom": "一覧の第3版の行の掲載表示「※2025年12月11日掲載」"
      }
    ],
    "related": {
      "explainer": [
        {
          "slug": "balancing-market-practical",
          "title": "需給調整市場の実務：応札から精算までのプロセス"
        }
      ],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary",
        "secondary-1",
        "secondary-2",
        "tertiary-1",
        "tertiary-2",
        "composite"
      ],
      "before": [
        "2025-12",
        "2026-02"
      ],
      "after": [
        "2026-04",
        "2026-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 2,
        "quote": "揚水発電設備または蓄電池設備を用いて需給調整市場に参入する場合の取扱いガイド（第3版）（2026/3/14実施）［2.0 MB］ ※2025年12月11日掲載"
      },
      "effective": {
        "source": 2,
        "quote": "揚水発電設備または蓄電池設備を用いて需給調整市場に参入する場合の取扱いガイド（第3版）（2026/3/14実施）"
      }
    },
    "dateException": "一次はガイドの実施日（「（2026/3/14実施）」）で、実需給日として書いた記載は無い。"
  },
  {
    "id": "C-10",
    "kind": "product",
    "status": "effective",
    "title": "一次調整力の供出可能量の考え方の見直し（専用線オンラインで接続する場合、0.6Hzの周波数低下継続時の量と1.0Hzの周波数低下で10秒以内の量の小さい方に）",
    "announcedOn": "2024-07-30",
    "effectiveFrom": "2025-03-14",
    "products": [
      "primary"
    ],
    "areas": [],
    "group": null,
    "before": "〔取引規程 第2条(11)・2024年10月１日 実施の版〕(11)供出可能量 属地エリアの一般送配電事業者の指令または自端制御による周波数偏差にもとづく発電または需要抑制により供出が可能な送電端における電力（キロワット）／〔第49回 資料２ p.45 の表・一次供出可能量（現行）〕0.2Hzの周波数低下時に10秒以内で供出できる量",
    "after": "〔取引規程 第2条(11)・2025年３月14日 実施の版〕(11)供出可能量 属地エリアの一般送配電事業者の指令または自端制御による周波数偏差にもとづく発電または需要抑制により供出が可能な送電端における電力（キロワット）。一次調整力において，属地エリアの一般送配電事業者の中給システムと専用線オンラインで接続（以下，単に「専用線オンラインで接続」という）する場合は，基準周波数から0.6ヘルツの周波数低下継続時に供出が可能な送電端における電力（キロワット）または，基準周波数から1.0ヘルツの周波数低下で10秒以内に供出可能な送電端における電力（キロワット）の小さい方の値を供出可能量とする。／〔第49回 資料２ p.45 の表・一次供出可能量（見直し案）〕0.6Hzの周波数低下時に供出できる量※1※2",
    "reasonQuote": "一次供出可能量の考え方について、「平常時」「異常時」それぞれに必要な要件を確認し、以下のとおり見直すことで機械的限界が大きい発電機等をより効率的に活用できることから、早期に見直すこととしてはどうか。",
    "pendingQuote": null,
    "pendingQuoteSource": null,
    "batteryNote": "一次調整力の入札量の上限は供出可能量（取引規程別冊（一次調整力）第26条(7)「入札量上限」）。変更後の第2条(11)の一文は「専用線オンラインで接続」する場合の定め。蓄電池がどの監視方法で一次調整力に参入できるかは、揚水発電設備または蓄電池設備の取扱いガイド（第３版 p.24）の表に設備容量・電圧階級ごとに示されている（1MW以上10MW未満で特別高圧（一部の22kV等）・高圧の場合は専用線オンライン・オフラインのどちらも〇）。",
    "sources": [
      {
        "name": "一次調整力における供出可能量の考え方の見直しについて",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第49回 資料２）",
        "url": "https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2024/files/jukyu_shijyo_49_02.pdf",
        "where": "p.45 まとめ（本文の箇条・表・注※2。「1.0z」は原文のまま）",
        "quote": "（変更前）0.2Hzの周波数低下時に10秒以内で供出できる量※1／（変更後）0.6Hzの周波数低下時に供出できる量※1※2※3／※2 異常時要件の「1.0zの周波数低下継続時に10秒以内で供出できる量」と比べて小さい方を供出可能量とする。",
        "date": "2024-07-30",
        "dateFrom": "表紙"
      },
      {
        "name": "取引規程 新旧比較表",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_hikaku_250314.pdf",
        "where": "p.1 表紙（変更前の欄「2024年10月１日 実施」・変更後の欄「2025年３月14日 実施」）／p.7 取引規程 本則 第2条(11)供出可能量 変更後の欄／同じ行の備考",
        "quote": "2024年10月１日 実施／2025年３月14日 実施／…一次調整力において，属地エリアの一般送配電事業者の中給システムと専用線オンラインで接続（以下，単に「専用線オンラインで接続」という）する場合は，基準周波数から0.6ヘルツの周波数低下継続時に供出が可能な送電端における電力（キロワット）または，基準周波数から1.0ヘルツの周波数低下で10秒以内に供出可能な送電端における電力（キロワット）の小さい方の値を供出可能量とする。／一次調整力の供出可能量の考え方の見直し",
        "date": "2025-03-14",
        "dateFrom": "PDF 1 頁（表紙）右下の改定日（変更後の欄の下・頁番号「－1－」の横）"
      },
      {
        "name": "取引規程（需給調整市場）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_250314.pdf",
        "where": "p.1 表紙／p.7 本則 第2条(11)／取引規程別冊（一次調整力）第26条（取引対象のΔｋＷ）(7)入札量上限（頁番号 －228－）",
        "quote": "(7) 入札量上限 第22条（確認項目）(4)で確認した取引会員の単独発電機または各リスト・パターンの供出可能量を上限とする。",
        "date": "2025-03-14",
        "dateFrom": "表紙「2025年３月14日 実施」"
      },
      {
        "name": "需給調整市場 取引規程の改定に係る意見募集結果および改定について（2025年3月14日付）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/docs/250213_news.pdf",
        "where": "本文",
        "quote": "意見募集の結果および取引規程の改定（2025年3 月14日付)について、下記ページにて公表します。",
        "date": "2025-02-13",
        "dateFrom": "本文の日付"
      },
      {
        "name": "需給調整市場 取引規程の改定に係る意見募集について",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/j_information/2024/12/11_0955.php",
        "where": "本文「２．主な改定内容」",
        "quote": "2025年3月14日に取引規程改定を予定しています。／一次調整力の供出可能量の考え方の見直し",
        "date": "2024-12-11",
        "dateFrom": "告知の本文冒頭（表題下の日付・カテゴリ欄）"
      },
      {
        "name": "揚水発電設備または蓄電池設備を用いて需給調整市場に参入する場合の取扱いガイド",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/yousuichikudenchi_guide_260314.pdf",
        "where": "p.24「４．参入要件（蓄電池設備の一次調整力オフラインへの参入要件）」",
        "quote": "蓄電池設備を用いて、一次調整力で需給調整市場に参入する場合の通信設備の要件は、以下のとおりです。／なお、蓄電池の設備容量が1MW以上10MW未満、かつ電圧階級が特別高圧（一部の22kV等）・高圧の場合および1MW未満の蓄電池をアグリゲートして参入する場合は、監視方法がオフラインで参入が可能です。",
        "date": "2026-03-14",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "取引規程（需給調整市場）",
        "publisher": "一般社団法人 電力需給調整力取引所（EPRX）",
        "url": "https://www.eprx.or.jp/outline/docs/kitei_ver.18_260701.pdf",
        "where": "p.8 本則 第2条(26)供出可能量（2026年7月1日 実施の版では号番号が (26) に繰り下がる）",
        "quote": "(26)供出可能量 …一次調整力において，属地エリアの一般送配電事業者の中給システムと専用線オンラインで接続（以下，単に「専用線オンラインで接続」という）する場合は，基準周波数から0.6ヘルツの周波数低下継続時に供出が可能な…小さい方の値を供出可能量とする。",
        "date": "2026-07-01",
        "dateFrom": "表紙「2026年７月１日 実施」"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [],
      "catalogSeries": []
    },
    "benchmarkWindow": {
      "products": [
        "primary"
      ],
      "before": [
        "2024-12",
        "2025-02"
      ],
      "after": [
        "2025-04",
        "2025-06"
      ]
    },
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２４年７月３０日"
      },
      "effective": {
        "source": 2,
        "quote": "2025年３月14日 実施"
      }
    },
    "dateException": null
  }
] as BalancingRule[];

/** 予定・検討中・注視（改定ではないもの・裁定 T8-R2） */
export const BALANCING_RULES_PENDING: readonly BalancingRule[] = [
  {
    "id": "B-28",
    "kind": "procurement",
    "status": "scheduled",
    "title": "二次調整力①を2027年度から広域調達へ（エリア内調達から移行）",
    "announcedOn": "2026-09-15",
    "effectiveFrom": null,
    "products": [
      "secondary-1"
    ],
    "areas": [],
    "group": null,
    "before": "二次調整力①（LFC成分）は、中給システムのLFC演算・制御周期が各エリアごとに異なっているため、各エリアで調達・運用してきた。",
    "after": "一般送配電事業者による二次調整力①（LFC成分）の広域運用が実現したことから、二次調整力①については、2027年度以降は広域調達を開始することとしてはどうか。",
    "reasonQuote": null,
    "pendingQuote": "二次調整力①について、2027年度以降は広域調達を開始する",
    "pendingQuoteSource": 1,
    "batteryNote": null,
    "sources": [
      {
        "name": "二次調整力①の広域運用および広域調達について",
        "publisher": "電力広域的運営推進機関（第63回需給調整市場検討小委員会 資料2）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/63/jukyu_shijyo_63_02.pdf",
        "where": "p.2・p.24・p.29 まとめ",
        "quote": "この点、各種システム改修が完了、広域運用の実績を踏まえて二次①の広域運用が実現したと評価できることから、当初の予定通り2027年度からは広域調達を実施することとしてはどうか。",
        "date": "2026-09-15",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理（2026年度上期実績および2026年度下期以降の予定）",
        "publisher": "電力広域的運営推進機関（第63回需給調整市場検討小委員会 資料4）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/63/jukyu_shijyo_63_04.pdf",
        "where": "p.30",
        "quote": "二次調整力①について、2027年度以降は広域調達を開始する 【第63回 本小委員会（完了）】",
        "date": "2026-09-15",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "occto-balancing-committee-63-2026-09",
          "title": "第63回 需給調整市場検討小委員会: 二次調整力①の広域運用・広域調達、前日取引化後の市場外調整力、議論の方向性（上期報告）"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": null,
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "２０２６年９月１５日"
      }
    },
    "dateException": null
  },
  {
    "id": "C-9",
    "kind": "product",
    "status": "undecided",
    "title": "同時市場の導入（検討中・導入は未決定）",
    "announcedOn": "2025-10-15",
    "effectiveFrom": null,
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2",
      "composite"
    ],
    "areas": [],
    "group": null,
    "before": "現在は卸電力取引所と需給調整市場のそれぞれで取引されている電力（kWh）と調整力（ΔkW）",
    "after": "同時市場は、電力と調整力を同時に取引する市場として、現在の卸電力取引所と需給調整市場を代替する市場となる。",
    "reasonQuote": "各市場が個別に運用されていることによる電源の取り合い等の問題を解消するため、電源を電力と調整力に適切に配分する仕組みを導入し、売り入札不足を原因とする価格高騰の防止や、変動性再エネの増加に対応するための十分な調整力の確保を可能とします。",
    "pendingQuote": "我が国において同時市場が実現可能であると判断された場合には、同時市場の導入を最終決定することとしたい。",
    "pendingQuoteSource": 0,
    "batteryNote": null,
    "sources": [
      {
        "name": "「同時市場の在り方等に関する検討会」第二次中間取りまとめ",
        "publisher": "同時市場の在り方等に関する検討会（資源エネルギー庁・電力広域的運営推進機関 共同事務局）",
        "url": "https://www.meti.go.jp/shingikai/energy_environment/doji_shijo_kento/pdf/20251015_1.pdf",
        "where": "p.61 7 今後の検討の進め方／p.63",
        "quote": "そして、それらの作業を通じ、我が国において同時市場が実現可能であると判断された場合には、同時市場の導入を最終決定することとしたい。",
        "date": "2025-10-15",
        "dateFrom": "PDF 表紙（検討会トップ index.html の一覧「2025年10月15日　第二次中間取りまとめ」とも一致）"
      },
      {
        "name": "同時市場の検討・詳細設計｜電力広域的運営推進機関",
        "publisher": "電力広域的運営推進機関（OCCTO）",
        "url": "https://www.occto.or.jp/gyomusyokai/no4.html",
        "where": "本文",
        "quote": "今後は、同時市場の導入に向けて、実務的な観点を踏まえた市場制度の詳細設計と、同時市場の導入に必要な市場システムの開発に向けた要求定義を順次実施していくことが予定されています。",
        "date": null,
        "dateFrom": null
      },
      {
        "name": "需給調整市場検討小委員会における議論の方向性と整理",
        "publisher": "電力広域的運営推進機関 需給調整市場検討小委員会 事務局（第59回 参考資料１）",
        "url": "https://www.occto.or.jp/assets/iinkai/jukyuchousei/59/jukyu_shijyo_59_sankou_01.pdf",
        "where": "p.16 需給調整市場の応札不足対応一覧（１／３）",
        "quote": "今後の需給調整市場に関する大きな変化（2026年度からの前日取引化、将来的な同時市場や次期中給システムの導入）も踏まえ",
        "date": "2026-01-20",
        "dateFrom": "PDF 表紙"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "meti-doji-shijo-kentoukai-25-2026-09",
          "title": "第25回 同時市場の在り方等に関する検討会: 技術研究の進め方・第1フェーズ検討進捗・詳細業務設計の進捗報告"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": null,
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "「同時市場の在り方等に関する検討会」 第二次中間取りまとめ 2025 年 10 月 15 日 同時市場の在り方等に関する検討会"
      }
    },
    "dateException": null
  },
  {
    "id": "D-4b",
    "kind": "guideline",
    "status": "watch",
    "title": "電力・ガス取引監視等委員会 事務局 B種電源の応札価格の監視方針（第24回 制度設計・監視専門会合 資料4「今後の監視方針」）",
    "announcedOn": "2026-09-29",
    "effectiveFrom": null,
    "products": [
      "primary",
      "secondary-1",
      "secondary-2",
      "tertiary-1",
      "tertiary-2"
    ],
    "areas": [],
    "group": null,
    "before": "同資料 p.24:「電取委事務局では、Ｂ種電源を運用する事前的措置の対象事業者より、３か月に１回、その固定費の回収状況の報告を受け、需給調整市場ガイドラインに照らし、適切な応札が行われていたかの監視を実施。」（根拠は2026年3月13日版ガイドライン Ⅲ.2.「四半期ごとに、以下のⅱ）について報告を求める。」「ⅱ）期中における B種電源の固定費回収状況」）",
    "after": "同資料 p.25「今後の監視方針」:「1. 当該年度分の固定費の回収を完了した電源に関しては、一定額（0.33円/ΔkW・30分）＋逸失利益（機会費用）を超える応札が行われていないかどうか、引き続き厳格に監視を行う。必要に応じ、事業者に対して説明を求めていくこととする。2. 合理的な理由なく、第１四半期の応札実績が年間想定応札量の１/４を大きく上回るなど、実績と計画に著しい乖離が認められた事業者に対しては、実態を踏まえた想定応札量に基づく応札価格への見直しを要請する。」",
    "reasonQuote": "今回の確認の結果、一部事業者において、第１四半期の応札実績が年間想定応札量の１/４を大きく上回っているにもかかわらず、当初の想定応札量及び一定額を見直さずに応札を継続している事例が確認。",
    "pendingQuote": "以下のとおり監視を行うこととしたい",
    "pendingQuoteSource": 0,
    "batteryNote": null,
    "sources": [
      {
        "name": "需給調整市場の運用等について（第24回 制度設計・監視専門会合 資料4）",
        "publisher": "電力・ガス取引監視等委員会 事務局",
        "url": "https://www.egc.meti.go.jp/activity/emsc_systemsurveillance/pdf/024_04_00.pdf",
        "where": "p.24「Ｂ種電源の固定費回収状況の報告（2026年4月～6月）」・p.25「今後の監視方針」・p.28",
        "quote": "前頁の当第１四半期の監視結果を踏まえ、今後は、需給調整市場ガイドラインに基づき、以下のとおり監視を行うこととしたい。",
        "date": "2026-09-29",
        "dateFrom": "PDF 表紙"
      },
      {
        "name": "第24回 制度設計・監視専門会合 配布資料",
        "publisher": "電力・ガス取引監視等委員会",
        "url": "https://www.egc.meti.go.jp/activity/emsc_systemsurveillance/024_haifu.html",
        "where": "配布資料一覧",
        "quote": "資料4　　需給調整市場の運用等について(PDF形式:4,731KB）",
        "date": "2026-09-29",
        "dateFrom": "会議ページの開催日（開催一覧 https://www.egc.meti.go.jp/activity/index_systemsurveillance.html の第24回の行）"
      },
      {
        "name": "需給調整市場ガイドライン（2026年3月13日改定版）",
        "publisher": "経済産業省",
        "url": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/jyukyuchosei-gl.pdf",
        "where": "Ⅲ.2.",
        "quote": "ⅱ）期中における B種電源の固定費回収状況",
        "date": "2026-03-13",
        "dateFrom": "PDF 表紙（最新の改定日）"
      }
    ],
    "related": {
      "explainer": [],
      "policyEvent": [
        {
          "slug": "egc-seido-kanshi-24-2026-09",
          "title": "第24回 制度設計・監視専門会合: 需給調整市場の運用等（三次②・複合市場の動き、B種電源の固定費回収状況と今後の監視方針）ほか（9/29開催）"
        }
      ],
      "catalogSeries": []
    },
    "benchmarkWindow": null,
    "dateBasis": {
      "announced": {
        "source": 0,
        "quote": "第24回 制度設計・監視専門会合 事務局提出資料 2026年９月２９日"
      }
    },
    "dateException": "資料は事務局案の書き方（「以下のとおり監視を行うこととしたい」）で、会合で了承されたことを示す一次は未掲載（2026年10月14日時点の開催一覧で、第24回の行は「配布資料 動画」だけ）。"
  }
] as BalancingRule[];
