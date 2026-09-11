#!/usr/bin/env tsx
/**
 * scripts/post-projects-friday6-2026-09-11.ts — 金曜ワンセット#6 ⑤ projects 連動（承認済み例外・差分限定・#106）
 *
 * PLAN は一次照合（調査エージェント→反証エージェント→編集部の確認）で確定した値を埋め込んだもの。
 * ★大原則: 各行は書込の直前に一次を再取得し、PLAN の must（逐語片）がすべて一次に在るときだけ書く。
 *   1 つでも無ければその行は書かずに報告する（逐語の再確認が取れない値は書かない）。
 * ★POST: slug が既存ならスキップ（#91）。POST 後は slug で GET し、送信した全 field を照合（#106）。
 * ★PATCH: 変更する field の現在値が承認時の expect と一致するときだけ書く。body は末尾追記のみで、
 *   marker が既にあればスキップ（#122）。PATCH 後は GET 全 field 照合（変えていない field の変化 0 を確認）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/post-projects-friday6-2026-09-11.ts [--dry-run]
 */
import { execFileSync } from 'node:child_process';
import { LIST_EXCLUDED_PROJECT_SLUGS } from '../src/lib/projects-excluded';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const BASE = `https://${DOMAIN}.microcms.io/api/v1/projects`;
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

type Rec = Record<string, unknown> & { id: string; slug: string };
type Must = { url: string; text: string };
type PlanPost = { kind: 'POST'; label: string; record: Record<string, unknown> & { slug: string }; must: Must[]; why: string };
type PlanPatch = {
  kind: 'PATCH'; label: string; slug: string;
  expect: Record<string, unknown>;          // 変更する field の承認時の現在値
  set: Record<string, unknown>;             // 変更後の値（null で消す）
  appendBody?: { html: string; marker: string };
  /** 取込器テンプレ本文の全置換（reconstructProjectBody が第1段落を field から再生成するため、
   *  cod を運開日にすると「発表日：」ラベルで誤表示になる → テンプレ外の本文に差し替える）。
   *  現在の本文が expectIncludes を含むときだけ置換し、marker があれば冪等スキップ */
  replaceBody?: { html: string; marker: string; expectIncludes: string };
  must: Must[]; why: string;
};
type Plan = PlanPost | PlanPatch;

// ─────────────────────────────────────────────────────────────
// 一次照合で確定した計画（編集部が確認した値のみ。手で書き換えない）
// ─────────────────────────────────────────────────────────────
const PLAN: Plan[] = [
  {
    "kind": "POST",
    "label": "静岡県静岡市蓄電所（ENEOS Power）",
    "record": {
      "slug": "eneos-shimizu",
      "name": "静岡県静岡市蓄電所（ENEOS Power）",
      "status": [
        "計画中"
      ],
      "outputMw": 50,
      "capacityMwh": 109,
      "prefecture": "静岡県",
      "city": "静岡市",
      "operator": "ENEOS Power株式会社",
      "cod": null,
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000002768.000002296.html",
      "body": "<p><strong>静岡県静岡市蓄電所</strong>は、ENEOS Power株式会社がENEOS株式会社の清水油槽所内の遊休地で開発に着手した特別高圧系統用蓄電所（出力50MW、容量109MWh）。所在地（静岡県静岡市）は2026年9月8日の<a href=\"https://eneospower-co.wjopen.jp/cmsdata/filelib/20260908.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">ENEOS Powerの発表（PDF）</a>による（出典の大和ハウス工業配信の本文には県市名の記載がない）。ENEOSグループとして初めての西日本エリア（60Hz地域）における系統用蓄電所の開発で、ENEOS Powerが全国で推進する蓄電所開発プロジェクトの一環。ENEOS Powerの発表では「着工：2027年1月予定、運開：2028年度内予定」としている。EPCは大和エネルギー株式会社で、建設工事に関するEPC契約をENEOS Powerと締結し、特高変電設備、蓄電池、パワーコンディショナなどの設備の調達から、設計、施工まで一貫して担う。大和エネルギーの発表（2026年9月8日）では「2027年1月に着工し、2028年度内の竣工を予定」としており、同社の系統用蓄電所EPC事業の着工第1号となる。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000002768.000002296.html",
        "text": "出力50MW、容量109MWh"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000002768.000002296.html",
        "text": "ENEOS株式会社の清水油槽所内の遊休地"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000002768.000002296.html",
        "text": "2028年度内の竣工を予定"
      },
      {
        "url": "https://eneospower-co.wjopen.jp/cmsdata/filelib/20260908.pdf",
        "text": "静岡県静岡市"
      },
      {
        "url": "https://eneospower-co.wjopen.jp/cmsdata/filelib/20260908.pdf",
        "text": "運開：2028年度内予定"
      }
    ],
    "why": "A-1: 大和ハウス工業配信（大和エネルギー発表）の出力50MW・容量109MWh・2028年度内竣工予定＋ENEOS Power 同日発表の「静岡県静岡市」「運開：2028年度内予定」（年度精度→cod null）"
  },
  {
    "kind": "POST",
    "label": "福島県蓄電所（HEXA）",
    "record": {
      "slug": "hexa-fukushima-merchant-bess",
      "name": "福島県蓄電所（HEXA）",
      "status": [
        "稼働中"
      ],
      "outputMw": 1.998,
      "capacityMwh": 4.936,
      "prefecture": "福島県",
      "city": null,
      "operator": "ヘキサ・エネルギーサービス合同会社",
      "cod": null,
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
      "body": "<p><strong>福島県蓄電所</strong>は、ヘキサ・エネルギーサービス合同会社が福島県に所在する高圧蓄電所（系統用蓄電池）として商業運転を開始した施設（出力1,998kW・定格容量4,936kWh）。同社は2026年8月末に引き渡しを受け、商業運転および電力市場での運用を開始したと2026年9月7日に発表した（商業運転開始の具体的な日付は記載がない）。発表ではマーチャント型取引の蓄電所と位置付けており、市場運用は同社が独自に開発した取引システムが担う。同社が2025年3月に株式会社パワーエックスと締結した、日本国内における系統蓄電所開発に関する業務提携に基づく取り組みで、宮城県の高圧蓄電所（出力・定格容量とも同値）とあわせて2件の運用開始として発表された。所在市町村は発表に記載がないため、都道府県までの掲載としている。蓄電池の製品名・メーカーも発表に記載がない。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
        "text": "福島県および宮城県に所在する高圧蓄電所2件"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
        "text": "1,998"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
        "text": "4,936"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
        "text": "商業運転および電力市場での運用を開始"
      }
    ],
    "why": "B-1: 既存 hexa 系（pr-co109041-bess＝パワーエックス×HEXA の提携告知で所在地・諸元なし、hexa-fukushima-tokyogas-offtake＝49.7MW の別案件）はいずれも福島県の本施設に1対1で当たらない→新規。商業運転開始の逐語で稼働中、「8月末」は引き渡し時期で日付精度なし→cod null"
  },
  {
    "kind": "POST",
    "label": "宮城県蓄電所（HEXA）",
    "record": {
      "slug": "hexa-miyagi-merchant-bess",
      "name": "宮城県蓄電所（HEXA）",
      "status": [
        "稼働中"
      ],
      "outputMw": 1.998,
      "capacityMwh": 4.936,
      "prefecture": "宮城県",
      "city": null,
      "operator": "ヘキサ・エネルギーサービス合同会社",
      "cod": null,
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
      "body": "<p><strong>宮城県蓄電所</strong>は、ヘキサ・エネルギーサービス合同会社が宮城県に所在する高圧蓄電所（系統用蓄電池）として商業運転を開始した施設（出力1,998kW・定格容量4,936kWh）。同社は2026年8月末に引き渡しを受け、商業運転および電力市場での運用を開始したと2026年9月7日に発表した（商業運転開始の具体的な日付は記載がない）。発表ではマーチャント型取引の蓄電所と位置付けており、市場運用は同社が独自に開発した取引システムが担う。同社が2025年3月に株式会社パワーエックスと締結した、日本国内における系統蓄電所開発に関する業務提携に基づく取り組みで、福島県の高圧蓄電所（出力・定格容量とも同値）とあわせて2件の運用開始として発表された。所在市町村は発表に記載がないため、都道府県までの掲載としている。蓄電池の製品名・メーカーも発表に記載がない。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
        "text": "福島県および宮城県に所在する高圧蓄電所2件"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
        "text": "1,998"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
        "text": "4,936"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000007.000173123.html",
        "text": "商業運転および電力市場での運用を開始"
      }
    ],
    "why": "B-1: 既存 hexa 系（pr-co109041-bess＝パワーエックス×HEXA の提携告知で所在地・諸元なし、hexa-fukushima-tokyogas-offtake＝49.7MW の別案件）はいずれも宮城県の本施設に1対1で当たらない→新規。商業運転開始の逐語で稼働中、「8月末」は引き渡し時期で日付精度なし→cod null"
  },
  {
    "kind": "POST",
    "label": "NC柳井市遠崎洛田蓄電所",
    "record": {
      "slug": "nc-yanai-tosaki-bess",
      "name": "NC柳井市遠崎洛田蓄電所",
      "status": [
        "稼働中"
      ],
      "outputMw": 1.988,
      "capacityMwh": 8.146,
      "prefecture": "山口県",
      "city": "柳井市",
      "operator": "日本蓄電池株式会社",
      "cod": null,
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000106.000161802.html",
      "body": "<p><strong>NC柳井市遠崎洛田蓄電所</strong>は、日本蓄電池が山口県柳井市に設置した系統用蓄電所（定格出力1,988kW／容量8,146kWh）。蓄電池システムは TMEIC（蓄電池は CATL）。設計・施工はワイ・ジャスト（2026年3月11日の設置開始の発表による）で、2025年9月29日に着工した（同社公式サイトの着工案件一覧による）。2026年9月7日よりデジタルグリッドをアグリゲーターとして需給調整市場での運用を開始した。主用途として需給調整市場・JEPX（卸売市場）・容量市場への対応と再エネ出力の平準化を掲げる。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>",
      "marketParticipation": [
        "需給調整市場"
      ]
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000106.000161802.html",
        "text": "NC柳井市遠崎洛田蓄電所"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000106.000161802.html",
        "text": "山口県柳井市"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000106.000161802.html",
        "text": "1,988kW・8,146kWh"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000106.000161802.html",
        "text": "TMEIC（蓄電池：CATL）"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000106.000161802.html",
        "text": "デジタルグリッド"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000046.000161802.html",
        "text": "ワイ・ジャスト"
      },
      {
        "url": "https://www.nipponchikudenchi.co.jp/news/construction-starts-202509/",
        "text": "2025年9月29日"
      },
      {
        "url": "https://www.nipponchikudenchi.co.jp/news/1789/",
        "text": "受電を開始"
      }
    ],
    "why": "B-2: 既存に柳井の施設なし→新規。施設名・所在地・定格出力/容量は 106 の施設概要の逐語。status は同社公式の受電告知（受電を開始）で稼働中。受電日は公式サイト 2026-02-19 と 3/11 配信の設置開始 2026-02-26 が前後矛盾するため cod は null（需給調整運用開始日 9/7 は cod にしない）"
  },
  {
    "kind": "POST",
    "label": "鹿児島県鹿児島市蓄電所（エー・ディー・ワークス）",
    "record": {
      "slug": "adw-kagoshima-bess",
      "name": "鹿児島県鹿児島市蓄電所（エー・ディー・ワークス）",
      "status": [
        "建設中"
      ],
      "outputMw": 2,
      "capacityMwh": 8,
      "prefecture": "鹿児島県",
      "city": "鹿児島市",
      "operator": "株式会社エー・ディー・ワークス",
      "cod": null,
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000036.000160356.html",
      "body": "<p><strong>鹿児島県鹿児島市蓄電所（エー・ディー・ワークス）</strong>は、株式会社ADワークスグループの子会社である株式会社エー・ディー・ワークス（ADW）が鹿児島県鹿児島市で開発を進める系統用蓄電所。同社は2025年12月23日、鹿児島県鹿児島市において同社で「三拠点目」となる系統用蓄電所開発用地（6,756㎡）を取得したと発表し、同用地は「2026年12月に第三拠点として稼働開始を予定」としていた。その後、親会社の株式会社ADワークスグループが2026年6月24日付で公表した資料（<a href=\"https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">５．蓄電所保有状況／用地取得状況</a>）では「3号」として掲載され、出力／容量は約2MW／約8MWh（いずれも概数）、ステータスは「工事中」、稼働時期は「2027年稼働予定」と記載されている（年までの表記）。施設の固有名は一次に記載がない。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000036.000160356.html",
        "text": "鹿児島県鹿児島市"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000036.000160356.html",
        "text": "三拠点目"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000036.000160356.html",
        "text": "6,756"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "鹿児島市"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "約2MW／約8MWh"
      }
    ],
    "why": "A-2: ADW 鹿児島市。既存 ADW 3件（松阪＝第1号・益城町＝第2号・参入表明）と所在地が異なる新規。値は PR TIMES＋親会社 2026-06-24 付資料 p.8 の行（約2MW／約8MWh・建設中）。cod は null（年のみは null・月までは YYYY-MM-01）"
  },
  {
    "kind": "POST",
    "label": "熊本県熊本市蓄電所（エー・ディー・ワークス）",
    "record": {
      "slug": "adw-kumamoto-bess",
      "name": "熊本県熊本市蓄電所（エー・ディー・ワークス）",
      "status": [
        "計画中"
      ],
      "outputMw": 2,
      "capacityMwh": 8,
      "prefecture": "熊本県",
      "city": "熊本市",
      "operator": "株式会社エー・ディー・ワークス",
      "cod": null,
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000074.000160356.html",
      "body": "<p><strong>熊本県熊本市蓄電所（エー・ディー・ワークス）</strong>は、株式会社ADワークスグループの100％子会社である株式会社エー・ディー・ワークス（ADW）が熊本県熊本市で開発する系統用蓄電所。株式会社ADワークスグループは2026年6月15日、ADWが熊本県熊本市・宮崎県日南市・三重県多気町にて計3か所の用地を追加取得し、保有する用地は累計6か所に到達したと発表した。同日付の同グループ資料では「4号」として「用地取得済み(2027年稼働予定）」と記載され、2026年6月24日付の同グループ資料（<a href=\"https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">５．蓄電所保有状況／用地取得状況</a>）では出力／容量は約2MW／約8MWh（いずれも概数）、ステータスは「着工準備中」、稼働時期は「2027年稼働予定」とされている（年までの表記）。施設の固有名は一次に記載がない。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000074.000160356.html",
        "text": "熊本県熊本市・宮崎県日南市・三重県多気町"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "熊本市"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "約2MW／約8MWh"
      }
    ],
    "why": "A-2: ADW 熊本市。既存 ADW 3件（松阪＝第1号・益城町＝第2号・参入表明）と所在地が異なる新規。値は PR TIMES＋親会社 2026-06-24 付資料 p.8 の行（約2MW／約8MWh・計画中）。cod は null（年のみは null・月までは YYYY-MM-01）"
  },
  {
    "kind": "POST",
    "label": "宮崎県日南市蓄電所（エー・ディー・ワークス）",
    "record": {
      "slug": "adw-nichinan-bess",
      "name": "宮崎県日南市蓄電所（エー・ディー・ワークス）",
      "status": [
        "建設中"
      ],
      "outputMw": 2,
      "capacityMwh": 8,
      "prefecture": "宮崎県",
      "city": "日南市",
      "operator": "株式会社エー・ディー・ワークス",
      "cod": null,
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000074.000160356.html",
      "body": "<p><strong>宮崎県日南市蓄電所（エー・ディー・ワークス）</strong>は、株式会社ADワークスグループの100％子会社である株式会社エー・ディー・ワークス（ADW）が宮崎県日南市で開発を進める系統用蓄電所。株式会社ADワークスグループは2026年6月15日、ADWが熊本県熊本市・宮崎県日南市・三重県多気町にて計3か所の用地を追加取得し、保有する用地は累計6か所に到達したと発表した。同日付の同グループ資料では「5号」として「用地取得済み(2027年稼働予定）」と記載されていたが、2026年6月22日付および6月24日付の同グループ資料（<a href=\"https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">５．蓄電所保有状況／用地取得状況</a>）ではステータスが「工事中」とされ、6月24日付資料では出力／容量は約2MW／約8MWh（いずれも概数）、稼働時期は「2027年稼働予定」と記載されている（年までの表記）。施設の固有名は一次に記載がない。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000074.000160356.html",
        "text": "熊本県熊本市・宮崎県日南市・三重県多気町"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "日南市"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "約2MW／約8MWh"
      }
    ],
    "why": "A-2: ADW 日南市。既存 ADW 3件（松阪＝第1号・益城町＝第2号・参入表明）と所在地が異なる新規。値は PR TIMES＋親会社 2026-06-24 付資料 p.8 の行（約2MW／約8MWh・建設中）。cod は null（年のみは null・月までは YYYY-MM-01）"
  },
  {
    "kind": "POST",
    "label": "三重県多気町蓄電所（エー・ディー・ワークス）",
    "record": {
      "slug": "adw-taki-bess",
      "name": "三重県多気町蓄電所（エー・ディー・ワークス）",
      "status": [
        "計画中"
      ],
      "outputMw": 2,
      "capacityMwh": 8,
      "prefecture": "三重県",
      "city": "多気町",
      "operator": "株式会社エー・ディー・ワークス",
      "cod": null,
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000074.000160356.html",
      "body": "<p><strong>三重県多気町蓄電所（エー・ディー・ワークス）</strong>は、株式会社ADワークスグループの100％子会社である株式会社エー・ディー・ワークス（ADW）が三重県多気町で開発する系統用蓄電所。株式会社ADワークスグループは2026年6月15日、ADWが熊本県熊本市・宮崎県日南市・三重県多気町にて計3か所の用地を追加取得し、保有する用地は累計6か所に到達したと発表した。同日付の同グループ資料では「6号」として「用地取得済み(2027年稼働予定）」と記載され、2026年6月24日付の同グループ資料（<a href=\"https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">５．蓄電所保有状況／用地取得状況</a>）では出力／容量は約2MW／約8MWh（いずれも概数）、ステータスは「着工準備中」、稼働時期は「2027年稼働予定」とされている（年までの表記）。同資料では第1号（三重県松阪市）とは別の拠点として掲載されている。施設の固有名は一次に記載がない。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000074.000160356.html",
        "text": "熊本県熊本市・宮崎県日南市・三重県多気町"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "多気町"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "約2MW／約8MWh"
      }
    ],
    "why": "A-2: ADW 多気町。既存 ADW 3件（松阪＝第1号・益城町＝第2号・参入表明）と所在地が異なる新規。値は PR TIMES＋親会社 2026-06-24 付資料 p.8 の行（約2MW／約8MWh・計画中）。cod は null（年のみは null・月までは YYYY-MM-01）"
  },
  {
    "kind": "POST",
    "label": "佐賀県伊万里市蓄電所（エー・ディー・ワークス）",
    "record": {
      "slug": "adw-imari-bess",
      "name": "佐賀県伊万里市蓄電所（エー・ディー・ワークス）",
      "status": [
        "計画中"
      ],
      "outputMw": 2,
      "capacityMwh": 8,
      "prefecture": "佐賀県",
      "city": "伊万里市",
      "operator": "株式会社エー・ディー・ワークス",
      "cod": "2027-05-01",
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000077.000160356.html",
      "body": "<p><strong>佐賀県伊万里市蓄電所（エー・ディー・ワークス）</strong>は、株式会社ADワークスグループの子会社である株式会社エー・ディー・ワークス（ADW）が佐賀県伊万里市で開発を予定する系統用蓄電所。同社は2026年6月22日、第７号（佐賀県伊万里市）となる系統用蓄電所開発用地の取得契約を締結したと発表した。出力は約2MW、容量は約8MWh（一次の表記は「約２MW／約８MWh」で、いずれも概数）、稼働開始時期は2027年5月（予定・月精度）。発表では、今後、各用地における蓄電所の開発工事及び系統接続手続きを経て稼働開始を予定するとし、稼働開始時期は工事進捗、系統接続手続きその他の状況により変動する可能性があるとしている。取得契約は系統連系に係る工事等諸条件の確定を停止条件としている。親会社ADワークスグループの2026年6月24日付資料（<a href=\"https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">５．蓄電所保有状況／用地取得状況</a>）ではステータスを「用地取得契約締結」としている。施設の固有名は一次に記載がない。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000077.000160356.html",
        "text": "佐賀県伊万里市"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000077.000160356.html",
        "text": "2027年５月（予定）"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "伊万里市"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "約2MW／約8MWh"
      }
    ],
    "why": "A-2: ADW 伊万里市。既存 ADW 3件（松阪＝第1号・益城町＝第2号・参入表明）と所在地が異なる新規。値は PR TIMES＋親会社 2026-06-24 付資料 p.8 の行（約2MW／約8MWh・計画中）。cod は 2027-05-01（年のみは null・月までは YYYY-MM-01）"
  },
  {
    "kind": "POST",
    "label": "栃木県日光市蓄電所（エー・ディー・ワークス）",
    "record": {
      "slug": "adw-nikko-bess",
      "name": "栃木県日光市蓄電所（エー・ディー・ワークス）",
      "status": [
        "計画中"
      ],
      "outputMw": 2,
      "capacityMwh": 8,
      "prefecture": "栃木県",
      "city": "日光市",
      "operator": "株式会社エー・ディー・ワークス",
      "cod": "2027-09-01",
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000077.000160356.html",
      "body": "<p><strong>栃木県日光市蓄電所（エー・ディー・ワークス）</strong>は、株式会社ADワークスグループの子会社である株式会社エー・ディー・ワークス（ADW）が栃木県日光市で開発を予定する系統用蓄電所。同社は2026年6月22日、第８号（栃木県日光市）となる系統用蓄電所開発用地の取得契約を締結したと発表した。出力は約2MW、容量は約8MWh（一次の表記は「約２MW／約８MWh」で、いずれも概数）、稼働開始時期は2027年9月（予定・月精度）。発表では、今後、各用地における蓄電所の開発工事及び系統接続手続きを経て稼働開始を予定するとし、稼働開始時期は工事進捗、系統接続手続きその他の状況により変動する可能性があるとしている。取得契約は系統連系に係る工事等諸条件の確定を停止条件としている。親会社ADワークスグループの2026年6月24日付資料（<a href=\"https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">５．蓄電所保有状況／用地取得状況</a>）ではステータスを「用地取得契約締結」としている。施設の固有名は一次に記載がない。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000077.000160356.html",
        "text": "栃木県日光市"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000077.000160356.html",
        "text": "2027年9月（予定）"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "日光市"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "約2MW／約8MWh"
      }
    ],
    "why": "A-2: ADW 日光市。既存 ADW 3件（松阪＝第1号・益城町＝第2号・参入表明）と所在地が異なる新規。値は PR TIMES＋親会社 2026-06-24 付資料 p.8 の行（約2MW／約8MWh・計画中）。cod は 2027-09-01（年のみは null・月までは YYYY-MM-01）"
  },
  {
    "kind": "POST",
    "label": "ADW愛知東浦町蓄電所",
    "record": {
      "slug": "adw-higashiura-bess",
      "name": "ADW愛知東浦町蓄電所",
      "status": [
        "計画中"
      ],
      "outputMw": 2,
      "capacityMwh": 8,
      "prefecture": "愛知県",
      "city": "東浦町",
      "operator": "株式会社エー・ディー・ワークス",
      "cod": "2028-02-01",
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000078.000160356.html",
      "body": "<p><strong>ADW愛知東浦町蓄電所</strong>は、株式会社ADワークスグループの子会社である株式会社エー・ディー・ワークス（ADW）が愛知県東浦町で開発を予定する系統用蓄電所。同社は2026年6月24日、愛知県東浦町にて第９号となる系統用蓄電所開発用地を取得したと発表し、同用地で開発予定の蓄電所を「ADW愛知東浦町蓄電所」としている。出力は約2MW、容量は約8MWh（一次の表記は「約２MW／約８MWh」で、いずれも概数）、稼働開始時期は2028年2月（予定・月精度）で、工事進捗、系統接続手続きその他の状況により変動する可能性があるとしている。親会社ADワークスグループの同日付資料（<a href=\"https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">５．蓄電所保有状況／用地取得状況</a>）ではステータスを「着工準備中」としている。</p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000078.000160356.html",
        "text": "ADW愛知東浦町蓄電所"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000078.000160356.html",
        "text": "愛知県東浦町"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000078.000160356.html",
        "text": "2028年２月（予定）"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "東浦町"
      },
      {
        "url": "https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120260623577609.pdf",
        "text": "約2MW／約8MWh"
      }
    ],
    "why": "A-2: ADW 東浦町。既存 ADW 3件（松阪＝第1号・益城町＝第2号・参入表明）と所在地が異なる新規。値は PR TIMES＋親会社 2026-06-24 付資料 p.8 の行（約2MW／約8MWh・計画中）。cod は 2028-02-01（年のみは null・月までは YYYY-MM-01）"
  },
  {
    "kind": "PATCH",
    "label": "朝来メガパワー蓄電所（pr-co109041-hyogo・朝来寄せ）",
    "slug": "pr-co109041-hyogo",
    "expect": {
      "name": "兵庫県〜兵庫県朝来市蓄電所",
      "city": "〜兵庫県朝来市",
      "operator": "パワーエックス",
      "cod": "2025-04-09"
    },
    "set": {
      "name": "朝来メガパワー蓄電所",
      "city": "朝来市",
      "operator": "エネルギーパワー株式会社",
      "cod": "2025-12-01"
    },
    "replaceBody": {
      "html": "<p><strong>朝来メガパワー蓄電所</strong>は、エネルギーパワー株式会社が兵庫県朝来市和田山町東谷字大谷に整備・保有する系統用蓄電所（PCS出力1,979kW／蓄電容量（公称）8,226kWh）。2025年4月9日、株式会社パワーエックスが、エネルギーパワーから兵庫県内で整備を進める高圧蓄電所2ヶ所（朝来メガパワー蓄電所・丹波メガパワー蓄電所）向けに系統用蓄電システム「Mega Power」6台を受注したと発表した。Mega Powerは20フィートコンテナ（ISO規格）で、電池種類はリン酸鉄リチウムイオン（LFP）、公称容量は2,742kWh、生産地は岡山県玉野市。発表では、関西エリアの電力系統に接続し、発電事業並びに需給調整市場等における調整力等の取引を行うとしており、電力小売と電気工事を手がけるエネルギーパワーが新たに系統用蓄電所事業に参入し、最初に整備・保有するプロジェクトと説明している。同発表では竣工を2025年6月（予定）としていた。</p><p>エネルギーパワーの開示資料によれば、工事代金の支払先は株式会社イースト・エンジニアリングで、2025年7月に竣工した。2025年12月から商業運転を開始し、主に需給調整市場を通じた需給調整力の提供を始めたとしている。運転開始日は月精度（2025年12月）で、日付は開示資料に記載がない。出典：<a href=\"https://kenep.co.jp/pdf/ir_20241127-2.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">固定資産の取得及び資金の借入に関するお知らせ（2024年11月27日）</a>／<a href=\"https://kenep.co.jp/pdf/ir_20251128-4.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">2025年8月期 発行者情報（2025年11月28日）</a>／<a href=\"https://kenep.co.jp/pdf/ir_20260414-2.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">2026年8月期 中間決算短信（2026年4月14日）</a>。</p><p>関連ニュース: <a href=\"/news/pr-2025-04-09-co109041-154\">パワーエックスの蓄電システム受注（2025年4月9日）</a></p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p><p>※同一リリースで並記された別施設（朝来／丹波）であり重複ではない。パワーエックスの2025年4月9日の発表は、朝来メガパワー蓄電所（兵庫県朝来市和田山町東谷字大谷）と丹波メガパワー蓄電所（兵庫県丹波市青垣町西芦田字藤渕）を同じ諸元（PCS出力1,979kW／蓄電容量（公称）8,226kWh）で並記している。本項目は朝来メガパワー蓄電所を扱い、丹波メガパワー蓄電所は別項目で扱う。</p>",
      "marker": "※同一リリースで並記された別施設（朝来／丹波）であり重複ではない",
      "expectIncludes": "000000154.000109041"
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "朝来メガパワー蓄電所"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "兵庫県朝来市和田山町東谷字大谷"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "1,979kW"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "8,226"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "エネルギーパワー株式会社"
      },
      {
        "url": "https://kenep.co.jp/pdf/ir_20260414-2.pdf",
        "text": "朝来メガパワー蓄電所及び丹波メガパワー蓄電所は2025年12月から"
      }
    ],
    "why": "A-3（9/8 裁定・朝来寄せ）: PR154 プロジェクト①の固有名・所在地・事業者の逐語。cod は事業者の中間決算短信（2026-04-14）「2025年12月から商業運転を開始」の月精度→2025-12-01（依頼の null 想定から一次で更新）。status 稼働中・諸元は現値のまま。取込器テンプレ本文は cod を「発表日」と表示するため全置換（末尾に非重複メモ）"
  },
  {
    "kind": "POST",
    "label": "丹波メガパワー蓄電所",
    "record": {
      "slug": "tamba-megapower",
      "name": "丹波メガパワー蓄電所",
      "status": [
        "稼働中"
      ],
      "outputMw": 1.979,
      "capacityMwh": 8.226,
      "prefecture": "兵庫県",
      "city": "丹波市",
      "operator": "エネルギーパワー株式会社",
      "cod": "2025-12-01",
      "sourceUrl": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
      "body": "<p><strong>丹波メガパワー蓄電所</strong>は、エネルギーパワー株式会社が兵庫県丹波市青垣町西芦田字藤渕に整備・保有する系統用蓄電所（PCS出力1,979kW／蓄電容量（公称）8,226kWh）。2025年4月9日、株式会社パワーエックスが、エネルギーパワーから兵庫県内で整備を進める高圧蓄電所2ヶ所（朝来メガパワー蓄電所・丹波メガパワー蓄電所）向けに系統用蓄電システム「Mega Power」6台を受注したと発表した。Mega Powerは20フィートコンテナ（ISO規格）で、電池種類はリン酸鉄リチウムイオン（LFP）、公称容量は2,742kWh、生産地は岡山県玉野市。発表では、関西エリアの電力系統に接続し、発電事業並びに需給調整市場等における調整力等の取引を行うとしており、電力小売と電気工事を手がけるエネルギーパワーが新たに系統用蓄電所事業に参入し、最初に整備・保有するプロジェクトと説明している。同発表では竣工を2025年6月（予定）としていた。</p><p>エネルギーパワーの開示資料によれば、工事代金の支払先は株式会社BS ENERGYで、2025年7月に竣工した。2025年12月から商業運転を開始し、主に需給調整市場を通じた需給調整力の提供を始めたとしている。運転開始日は月精度（2025年12月）で、日付は開示資料に記載がない。出典：<a href=\"https://kenep.co.jp/pdf/ir_20241127-2.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">固定資産の取得及び資金の借入に関するお知らせ（2024年11月27日）</a>／<a href=\"https://kenep.co.jp/pdf/ir_20251128-4.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">2025年8月期 発行者情報（2025年11月28日）</a>／<a href=\"https://kenep.co.jp/pdf/ir_20260414-2.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">2026年8月期 中間決算短信（2026年4月14日）</a>。</p><p>関連ニュース: <a href=\"/news/pr-2025-04-09-co109041-154\">パワーエックスの蓄電システム受注（2025年4月9日）</a></p><p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p><p>※同一リリースで並記された別施設（朝来／丹波）であり重複ではない。パワーエックスの2025年4月9日の発表は、朝来メガパワー蓄電所（兵庫県朝来市和田山町東谷字大谷）と丹波メガパワー蓄電所（兵庫県丹波市青垣町西芦田字藤渕）を同じ諸元（PCS出力1,979kW／蓄電容量（公称）8,226kWh）で並記している。本項目は丹波メガパワー蓄電所を扱い、朝来メガパワー蓄電所は別項目で扱う。</p>",
      "marketParticipation": [
        "需給調整市場"
      ]
    },
    "must": [
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "丹波メガパワー蓄電所"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "兵庫県丹波市青垣町西芦田字藤渕"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "1,979kW"
      },
      {
        "url": "https://prtimes.jp/main/html/rd/p/000000154.000109041.html",
        "text": "8,226"
      },
      {
        "url": "https://kenep.co.jp/pdf/ir_20260414-2.pdf",
        "text": "朝来メガパワー蓄電所及び丹波メガパワー蓄電所は2025年12月から"
      }
    ],
    "why": "A-3: PR154 プロジェクト②（丹波）。朝来とは所在地が異なる別施設（同一リリース並記）→新規。status・cod は事業者の中間決算短信「2025年12月から商業運転を開始」"
  }
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const bySlug = async (slug: string): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const squash = (s: string) => s.replace(/[\s　]+/g, '');

/** 一次取得（Chrome UA・失敗時 curl）。PR TIMES は __NEXT_DATA__ 内の本文も含めてテキスト化。URL 単位でキャッシュ */
const cache = new Map<string, string>();
/** PDF（事業者 IR・親会社資料）は pdfplumber で本文を抽出する（生バイトは圧縮ストリームで照合できない） */
function pdfText(url: string): string {
  const py = [
    'import sys,io,urllib.request,pdfplumber',
    `r=urllib.request.urlopen(urllib.request.Request(sys.argv[1],headers={'User-Agent':${JSON.stringify(UA)}}),timeout=60).read()`,
    "print('\\n'.join((p.extract_text() or '') for p in pdfplumber.open(io.BytesIO(r)).pages))",
  ].join('\n');
  return execFileSync('python', ['-c', py, url], { maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).toString('utf-8');
}
async function primaryText(url: string): Promise<string> {
  if (cache.has(url)) return cache.get(url)!;
  if (/\.pdf($|\?)/i.test(url)) { cache.set(url, squash(pdfText(url))); return cache.get(url)!; }
  let html = '';
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8', 'Accept-Language': 'ja,en;q=0.8' } }).catch(() => null);
  if (r && r.ok) html = await r.text();
  else {
    const out = execFileSync('curl', ['-sL', '-A', UA, '-w', '\n%{http_code}', url], { maxBuffer: 32 * 1024 * 1024 }).toString('utf-8');
    const nl = out.lastIndexOf('\n');
    if (out.slice(nl + 1).trim() !== '200') throw new Error(`GET ${url} → ${r?.status ?? 'fetch失敗'} / curl ${out.slice(nl + 1).trim()}`);
    html = out.slice(0, nl);
  }
  const nd = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  let t = html;
  if (nd) { try { t += ' ' + JSON.stringify(JSON.parse(nd[1])); } catch { t += ' ' + nd[1]; } }
  t = t.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\n/g, ' ').replace(/\\"/g, '"')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  cache.set(url, squash(t));
  return cache.get(url)!;
}
async function checkMust(must: Must[]): Promise<string[]> {
  const miss: string[] = [];
  for (const m of must) {
    try { if (!(await primaryText(m.url)).includes(squash(m.text))) miss.push(`「${m.text}」@${m.url}`); }
    catch (e) { miss.push(`取得失敗 ${m.url}: ${(e as Error).message}`); }
  }
  return miss;
}
function eqStored(sent: unknown, stored: unknown): boolean {
  const a = Array.isArray(sent) ? sent : [sent], b = Array.isArray(stored) ? stored : [stored];
  return JSON.stringify(a.map((x) => (x === undefined ? null : x))) === JSON.stringify(b.map((x) => (x === undefined ? null : x)));
}

let posted = 0, patched = 0, skipped = 0, failed = 0;
const held: string[] = [];

async function runPost(p: PlanPost): Promise<void> {
  console.log(`\n■ POST ${p.label}  slug=${p.record.slug}`);
  const ex = await bySlug(p.record.slug);
  if (ex) { console.log(`   [skip] 既存（id=${ex.id}）`); skipped++; return; }
  const miss = await checkMust(p.must);
  console.log(`   一次再確認: 逐語片 ${p.must.length - miss.length}/${p.must.length}`);
  if (miss.length) { console.log(`   [見送り] 逐語が取れない: ${miss.join(' ／ ')}`); held.push(`${p.label}: ${miss.join(' ／ ')}`); skipped++; return; }
  const r = p.record;
  console.log(`   ${r.name} ／ ${r.prefecture ?? 'null'} ${r.city ?? ''} ／ ${r.outputMw ?? 'null'}MW・${r.capacityMwh ?? 'null'}MWh ／ ${JSON.stringify(r.status)} ／ cod=${r.cod ?? 'null'} ／ ${r.operator}\n   根拠: ${p.why}`);
  if (DRY) { posted++; return; }
  const payload = Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null && v !== undefined));
  await api('POST', BASE, payload);
  await sleep(1000);
  const a = await bySlug(r.slug);
  if (!a) { console.log('   ★NG POST 後に GET できない'); failed++; return; }
  const bad = Object.entries(payload).filter(([k, v]) => !eqStored(v, a[k])).map(([k, v]) => `${k}: 送信=${JSON.stringify(v)} 保存=${JSON.stringify(a[k])}`);
  console.log(`   #106: ${bad.length ? '★NG\n     ' + bad.join('\n     ') : `✓ 送信 ${Object.keys(payload).length} field 全一致（id=${a.id}）`}`);
  if (bad.length) failed++; else posted++;
  await sleep(300);
}

async function runPatch(p: PlanPatch): Promise<void> {
  console.log(`\n■ PATCH ${p.label}  slug=${p.slug}`);
  const b = await bySlug(p.slug);
  if (!b) { console.log('   ★NG 不在'); failed++; return; }
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p.set)) {
    if (norm(b[k]) === norm(v)) { console.log(`   ${k}: ${norm(v)} [同値]`); continue; }
    if (k in p.expect && norm(b[k]) !== norm(p.expect[k])) {
      console.log(`   [見送り] ${k} の現在値 ${norm(b[k])} が承認時 ${norm(p.expect[k])} と違う → この行は書かない`);
      held.push(`${p.label}: ${k} 現在値不一致`); skipped++; return;
    }
    payload[k] = v;
    console.log(`   ${k}: ${norm(b[k])} → ${norm(v)}`);
  }
  if (p.appendBody) {
    const cur = String(b.body ?? '');
    if (cur.includes(p.appendBody.marker)) console.log(`   body: marker「${p.appendBody.marker.slice(0, 24)}…」既出（冪等）`);
    else { payload.body = cur + p.appendBody.html; console.log(`   body: 末尾へ追記（${cur.length}→${String(payload.body).length}字）`); }
  }
  if (p.replaceBody) {
    const cur = String(b.body ?? '');
    if (cur.includes(p.replaceBody.marker)) console.log(`   body: marker「${p.replaceBody.marker.slice(0, 24)}…」既出（冪等）`);
    else if (!cur.includes(p.replaceBody.expectIncludes)) {
      console.log(`   [見送り] body が承認時の本文ではない（「${p.replaceBody.expectIncludes}」を含まない）→ この行は書かない`);
      held.push(`${p.label}: body 現在値不一致`); skipped++; return;
    } else { payload.body = p.replaceBody.html; console.log(`   body: テンプレ本文を全置換（${cur.length}→${p.replaceBody.html.length}字）`); }
  }
  if (Object.keys(payload).length === 0) { console.log('   [skip] 変更なし（冪等）'); skipped++; return; }
  const miss = await checkMust(p.must);
  console.log(`   一次再確認: 逐語片 ${p.must.length - miss.length}/${p.must.length}`);
  if (miss.length) { console.log(`   [見送り] 逐語が取れない: ${miss.join(' ／ ')}`); held.push(`${p.label}: ${miss.join(' ／ ')}`); skipped++; return; }
  console.log(`   根拠: ${p.why}`);
  if (DRY) { patched++; return; }
  await api('PATCH', `${BASE}/${b.id}`, payload);
  await sleep(1000);
  const a = await bySlug(p.slug);
  let bad = 0;
  for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {}), ...Object.keys(payload)])) {
    if (SYS.has(k)) continue;
    if (k === 'body' && 'body' in payload) {
      const ab = String(a?.body ?? '');
      const ok = p.replaceBody
        ? ab.includes(p.replaceBody.marker) && !ab.includes('発表企業：')
        : ab.includes(p.appendBody!.marker) && ab.startsWith(String(b.body ?? '').slice(0, 40));
      if (!ok) { bad++; console.log('   ✗ body: marker なし／置換・追記が反映されていない'); }
      else console.log(`   ✓ body: marker あり・${p.replaceBody ? 'テンプレ文言なし' : '旧本文保持'}（richEditor 正規化のため全文一致では判定しない #122）`);
      continue;
    }
    const want = k in payload ? payload[k] : b[k];
    if (norm(a?.[k]) !== norm(want)) { bad++; console.log(`   ✗ ${k}: 期待=${norm(want)} 保存=${norm(a?.[k])}`); }
  }
  console.log(`   #106: ${bad === 0 ? `✓ 送信 ${Object.keys(payload).length} field 反映・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  if (bad) failed++; else patched++;
  await sleep(300);
}

async function listedSummary(): Promise<{ total: number; listed: number; mw: number; mwh: number }> {
  const all: Rec[] = [];
  for (let off = 0; off < 1000; off += 100) {
    const d = await api<{ totalCount: number; contents: Rec[] }>('GET', `${BASE}?fields=slug,outputMw,capacityMwh&limit=100&offset=${off}`);
    all.push(...d.contents); if (all.length >= d.totalCount) break;
  }
  const listed = all.filter((p) => !LIST_EXCLUDED_PROJECT_SLUGS.has(p.slug));
  const sum = (k: string) => listed.reduce((s, p) => s + (typeof p[k] === 'number' && (p[k] as number) > 0 ? (p[k] as number) : 0), 0);
  return { total: all.length, listed: listed.length, mw: sum('outputMw'), mwh: sum('capacityMwh') };
}

async function main(): Promise<void> {
  console.log(`[projects friday6] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / PLAN ${PLAN.length} 行`);
  if (PLAN.length === 0) { console.error('PLAN が空（埋め込み失敗）'); process.exit(1); }
  const pre = await listedSummary();
  console.log(`  投入前: 総件数 ${pre.total} ／ 掲載 ${pre.listed} ／ 掲載合計 ${pre.mw.toFixed(4)}MW・${pre.mwh.toFixed(4)}MWh`);
  for (const p of PLAN) { if (p.kind === 'POST') await runPost(p); else await runPatch(p); }
  if (!DRY) {
    const post = await listedSummary();
    console.log(`\n  投入後: 総件数 ${post.total} ／ 掲載 ${post.listed} ／ 掲載合計 ${post.mw.toFixed(4)}MW・${post.mwh.toFixed(4)}MWh`);
    console.log(`  差分: 総件数 +${post.total - pre.total} ／ 掲載 +${post.listed - pre.listed} ／ MW ${(post.mw - pre.mw >= 0 ? '+' : '')}${(post.mw - pre.mw).toFixed(4)} ／ MWh ${(post.mwh - pre.mwh >= 0 ? '+' : '')}${(post.mwh - pre.mwh).toFixed(4)}`);
  }
  console.log(`\n[done] POST ${posted} / PATCH ${patched} / スキップ・見送り ${skipped} / 失敗 ${failed}`);
  held.forEach((h) => console.log('  - ' + h));
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
