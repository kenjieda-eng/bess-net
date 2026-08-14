#!/usr/bin/env tsx
/**
 * scripts/batch5-friday2-2026-08-14.ts — 金曜ワンセット#2 続行分（⑤projects連動＋裁定1-6）
 *
 * すべて一次情報で確定した値のみ（推測ゼロ）。出典URLは各planに記載。
 * DELETE/PUTなし・差分限定・PATCH/POST後にGET照合（#106）。禁止語ゲート付き（lv-invest-banned-words.json）。
 *
 * 裁定1: 熊本J&S（JFEエンジニアリング一次2本）を新規起票
 * 裁定2: osaka-large-bess 是正（関電PDF突合: 多奈川蓄電所・建設中・商用運転2028年2月予定・
 *         2025年6月着工。cod 2025年5月除去。現座標は大阪市中心部で誤り→除去=taishi前例）
 * 裁定3: gifu-imari-bess 分割→既存照合の結果「両側とも既存レコードあり」→集約:
 *         伊万里=pr-000kwh-bess（同一PR TIMES出典で確定）を正常化PATCH、
 *         岐阜=日本蓄電池の県内案件は全て個別レコード保有済（jpn-takayama cod2026年2月が対応先有力）
 *         → gifu-imari-bess は EXCLUDED フラグ（コード側）。新規POSTなし。
 * 裁定4: kumagaya-bess×yatogo-bess 重複を一次で確定（東北電力2025-03-04リリース＝
 *         弥藤吾蓄電所・埼玉県熊谷市・営業運転開始）→ yatogo正・kumagaya EXCLUDED。
 *         出資者は最新一次で「エムエル・パワー株式会社（みずほリース100%子会社）」表記が実在
 *         → 英字「ML Power」でなく一次の和文表記へ。運開は一次が実績日明記（2025年3月4日）→月まで。
 * 裁定5: tagawa-130mwh outputMw 35→29.97（bodyの「35MW級」も是正）
 * 裁定6: policy-events tepco-pg-grid-info-suspension-2026-05 status→終了（実在値37件で確認。
 *         一次: TEPCO 2026-06-02「公開を再開しました」確認済・件別承認）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BANNED = JSON.parse(fs.readFileSync(path.join(HERE, 'lv-invest-banned-words.json'), 'utf8')) as {
  hardBanned: string[];
  quoteOnly: string[];
};

type PatchPlan = {
  kind: 'patch';
  endpoint: 'projects' | 'policy-events';
  slug: string;
  patch?: Record<string, unknown>;
  // bodyの部分置換（全文再構成しない是正用）。before本文に oldが1回だけ現れることを検証して置換。
  bodyReplace?: { old: string; next: string };
  source: string;
  note: string;
};
type PostPlan = {
  kind: 'post';
  endpoint: 'projects';
  payload: Record<string, unknown>;
  source: string;
  note: string;
};

const NOTE_EM =
  '<p><em>※本案件情報は、各事業者の公式プレスリリース・IR資料等に基づき編集部が整備したものです。最新の進捗・諸元については、出典および各事業者の公式発表をご参照ください。</em></p>';

const PLANS: Array<PatchPlan | PostPlan> = [
  // ---------- ⑤ PATCH 3件 ----------
  {
    kind: 'patch',
    endpoint: 'projects',
    slug: 'erex-no3-kameoka',
    patch: { status: ['建設中'] },
    source: 'https://prtimes.jp/main/html/rd/p/000000034.000071823.html',
    note: '⑤: GEC 2026-08 リリース「施工に着手」→計画中から建設中へ',
  },
  {
    kind: 'patch',
    endpoint: 'projects',
    slug: 'nc-nagano-city',
    patch: {
      name: 'NC長野市上ケ屋蓄電所（NCパイオニア）',
      status: ['建設中'],
      body:
        '<p><strong>NC長野市上ケ屋蓄電所</strong>は、リミックスポイントと日本蓄電池の共同出資ファンド「合同会社NCパイオニア」が2026年末までに全国7か所で開発する系統用蓄電所の一つで、長野県長野市に立地します。2026年8月4日に蓄電池の設置を開始しました（施工は中部プラントサービス）。受電開始は2026年10月見込み。</p><p>需給調整市場・JEPX・容量市場への対応を想定しています。出力・容量は一次リリースに記載がなく調査中です。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 リミックスポイント: <a href="https://prtimes.jp/main/html/rd/p/000000201.000033609.html" target="_blank" rel="noopener noreferrer">NCパイオニアによる系統用蓄電所開発（2026年6月1日）</a></li><li>📰 日本蓄電池: <a href="https://prtimes.jp/main/html/rd/p/000000098.000161802.html" target="_blank" rel="noopener noreferrer">NC長野市上ケ屋蓄電所 蓄電池設置開始（2026年8月）</a></li></ul>',
    },
    source: 'https://prtimes.jp/main/html/rd/p/000000098.000161802.html',
    note: '⑤: 施設名確定（NC長野市上ケ屋蓄電所）＋設置開始（2026-08-04）で建設中へ',
  },
  {
    kind: 'patch',
    endpoint: 'projects',
    slug: 'pr-taokeenergy-mie-2mw',
    patch: {
      city: '志摩市',
      status: ['稼働中'],
      capacityMwh: 8,
      operator: 'TAOKE ENERGY（SPC: PP6合同会社）',
      body:
        '<p><strong>三重県志摩市阿児町の系統用蓄電所</strong>（定格出力2MW・定格容量8MWh）は、TAOKE ENERGYがSPC「PP6合同会社」を通じて展開するファンド投資案件です。2026年7月27日より需給調整市場の一次調整力（オフライン）での運用を開始しています。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 TAOKE ENERGY: <a href="https://prtimes.jp/main/html/rd/p/000000025.000103834.html" target="_blank" rel="noopener noreferrer">三重県志摩市で2MWの蓄電所（2026年5月）</a></li><li>📰 TAOKE ENERGY: <a href="https://prtimes.jp/main/html/rd/p/000000038.000103834.html" target="_blank" rel="noopener noreferrer">ファンド投資案件で初の一次調整力市場参入（2026年8月）</a></li></ul>',
    },
    source: 'https://prtimes.jp/main/html/rd/p/000000038.000103834.html',
    note: '⑤: city破損「ENERGY、三重県志摩市」是正＋一次調整力運用開始で稼働中＋容量8MWh（一次確定）',
  },
  // ---------- 裁定4: yatogo正へ是正 ----------
  {
    kind: 'patch',
    endpoint: 'projects',
    slug: 'yatogo-bess',
    patch: {
      operator: '坂東蓄電所1号合同会社（エムエル・パワー・東北電力）',
      status: ['稼働中'],
      cod: '2025年3月',
      body:
        '<p><strong>弥藤吾蓄電所</strong>は、みずほリース100%子会社のエムエル・パワーと東北電力が共同出資する「坂東蓄電所1号合同会社」が運営する系統用蓄電所で、埼玉県熊谷市に立地します。出力1.96MW・容量7.46MWhで、GSユアサ製リチウムイオン電池とダイヘン製システムを採用し、2025年3月4日に営業運転を開始しました。</p><p>東京都「系統用大規模蓄電池導入促進事業」の助成対象案件で、同合同会社は群馬県伊勢崎市（韮塚蓄電所）・太田市（小角田蓄電所）でも蓄電所の建設を進めてきました。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 東北電力・みずほリース: <a href="https://www.tohoku-epco.co.jp/news/normal/1246259_2558.html" target="_blank" rel="noopener noreferrer">弥藤吾蓄電所の営業運転開始について（2025年3月4日）</a></li><li>📰 GSユアサ: <a href="https://newsroom.gs-yuasa.com/news-release/207" target="_blank" rel="noopener noreferrer">東京都「系統用大規模蓄電池導入促進事業」において14.9MWhのリチウムイオン蓄電池設備が採用</a></li></ul>',
    },
    source: 'https://www.tohoku-epco.co.jp/news/normal/1246259_2558.html',
    note: '裁定4: kumagaya-bessと同一（1.96MW/7.46MWh・熊谷市・GSユアサ）→yatogo正。営業運転開始2025-03-04（一次実績）。出資者は一次の和文表記へ',
  },
  // ---------- 裁定5: tagawa outputMw ----------
  {
    kind: 'patch',
    endpoint: 'projects',
    slug: 'tagawa-130mwh',
    patch: { outputMw: 29.97 },
    bodyReplace: { old: '容量130MWh級・出力35MW級の規模で', next: '容量130MWh・出力29.97MWの規模で' },
    source: 'https://corp.shirokumapower.com/news/-X5BLc4T',
    note: '裁定5: 一次（しろくま電力）で29.97MW確定。「35」は本文からも除去',
  },
  // ---------- 裁定2: osaka-large 是正 ----------
  {
    kind: 'patch',
    endpoint: 'projects',
    slug: 'osaka-large-bess',
    patch: {
      name: '多奈川蓄電所',
      status: ['建設中'],
      cod: null,
      city: '泉南郡岬町',
      latitude: null,
      longitude: null,
      sourceUrl: 'https://www.kepco.co.jp/corporate/pr/2025/pdf/20250507_1j.pdf',
      body:
        '<p><strong>多奈川蓄電所</strong>は、関西電力・きんでん・JEXI（ジャパン・エクステンシブ・インフラストラクチャー）が2025年3月7日に設立した「多奈川蓄電所合同会社」が保有する系統用蓄電所で、大阪府泉南郡岬町の関西電力 多奈川発電所跡地に建設中です。定格出力99MW・定格容量396MWhは系統用蓄電所として国内最大級。2025年6月に着工し、2028年2月の商用運転開始を目指しています。</p><p>三菱UFJ銀行がプロジェクトファイナンスを組成しており、電力市場取引の収益のみで運営する蓄電所事業でのノンリコース型プロジェクトファイナンスの活用は国内初とされています。電力市場での蓄電池運用は関西電力100%子会社のE-Flow合同会社が担います。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 関西電力: <a href="https://www.kepco.co.jp/corporate/pr/2025/pdf/20250507_1j.pdf" target="_blank" rel="noopener noreferrer">大阪府泉南郡岬町における蓄電所事業への参画（2025年5月7日）</a></li></ul>',
    },
    source: 'https://www.kepco.co.jp/corporate/pr/2025/pdf/20250507_1j.pdf',
    note: '裁定2: 稼働中→建設中（商用運転2028年2月予定・2025年6月着工）。cod除去。座標は大阪市中心部の誤値→除去（taishi前例）。所在地・名称はPDF別紙1で確定',
  },
  // ---------- 裁定3: 伊万里=pr-000kwh-bess の正常化（集約先） ----------
  {
    kind: 'patch',
    endpoint: 'projects',
    slug: 'pr-000kwh-bess',
    patch: {
      name: '佐賀県伊万里市東山代町蓄電所（エネフォワード）',
      city: '伊万里市',
      cod: '2026年1月',
      body:
        '<p><strong>佐賀県伊万里市東山代町蓄電所</strong>は、エネフォワードが佐賀県伊万里市東山代町で運営する系統用蓄電所（AC出力2,000kW・蓄電容量8,000kWh）で、2026年1月より本格的な商用運転を開始しました。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 エネフォワード: <a href="https://prtimes.jp/main/html/rd/p/000000005.000176494.html" target="_blank" rel="noopener noreferrer">佐賀県伊万里市東山代町蓄電所が商用運転を開始（2026年2月3日）</a></li></ul>',
    },
    source: 'https://prtimes.jp/main/html/rd/p/000000005.000176494.html',
    note: '裁定3: PR取込破損（name「000kWhの系統用蓄電所」・city「【稼働開始】佐賀県伊万里市」）を一次の施設名で正常化。codは一次「2026年1月より商用運転開始」（現値は発表日の誤用）。gifu-imari-bessはEXCLUDEDへ（コード側）',
  },
  // ---------- 裁定6: policy-events（件別承認） ----------
  {
    kind: 'patch',
    endpoint: 'policy-events',
    slug: 'tepco-pg-grid-info-suspension-2026-05',
    patch: { status: ['終了'] },
    source: 'https://www.tepco.co.jp/pg/consignment/system/information/index-j.html',
    note: '裁定6: TEPCO 2026-06-02「公開を再開しました」（一次確認済）→ 進行中→終了（実在値）',
  },
  // ---------- ⑤ POST 4件＋裁定1 ----------
  {
    kind: 'post',
    endpoint: 'projects',
    payload: {
      name: 'NC銚子市春日町蓄電所（日本蓄電池）',
      slug: 'nc-choshi-kasugacho-bess',
      status: ['稼働中'],
      outputMw: 1.998,
      capacityMwh: 8.146,
      prefecture: '千葉県',
      city: '銚子市',
      operator: '日本蓄電池株式会社',
      epc: '鈴木電機',
      cod: '2026年8月',
      marketParticipation: ['JEPX', '需給調整市場', '容量市場'],
      sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000097.000161802.html',
      body:
        '<p><strong>NC銚子市春日町蓄電所</strong>は、日本蓄電池が千葉県銚子市で展開する系統用蓄電所で、2026年8月3日に受電・運転開始しました。定格出力1,998kW・定格容量8,146kWh。蓄電池システムはTMEIC製（電池セルはCATL製）、設計・施工は鈴木電機が担当しています。</p><p>JEPX・需給調整市場・容量市場に対応します。日本蓄電池とリミックスポイントは2028年までに70箇所の蓄電所の運転開始を予定しています。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 日本蓄電池: <a href="https://prtimes.jp/main/html/rd/p/000000097.000161802.html" target="_blank" rel="noopener noreferrer">NC銚子市春日町蓄電所 受電・運転開始（2026年8月）</a></li></ul>',
    },
    source: 'https://prtimes.jp/main/html/rd/p/000000097.000161802.html',
    note: '⑤新規: 受電・運転開始（2026-08-03）。ニュース nc-choshi-kasugacho-unten-2026-08 と連動',
  },
  {
    kind: 'post',
    endpoint: 'projects',
    payload: {
      name: '静岡県の系統用蓄電所（クラダシ・インベストメント2号）',
      slug: 'gec-kuradashi-shizuoka-bess',
      status: ['建設中'],
      outputMw: 1.94,
      capacityMwh: 8.028,
      prefecture: '静岡県',
      operator: '合同会社クラダシ・インベストメント2号（グリーンエナジー＆カンパニー×クラダシ）',
      marketParticipation: [],
      sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000028.000071823.html',
      body:
        '<p><strong>静岡県の系統用蓄電所</strong>は、グリーンエナジー＆カンパニーとクラダシの合弁「合同会社クラダシ・インベストメント2号」（出資比率50%:50%・GK-TKスキーム）による第一弾案件の一つです。定格出力1,940kW・定格容量8,028kWh。2026年6月に受電を開始しており、2026年8月頃の運用開始を予定しています。</p><p>所在市町村は一次リリースで非公表のため、都道府県までの掲載としています。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 グリーンエナジー＆カンパニー: <a href="https://prtimes.jp/main/html/rd/p/000000028.000071823.html" target="_blank" rel="noopener noreferrer">クラダシとの合弁による系統用蓄電所 国内2案件が始動（2026年8月）</a></li></ul>',
    },
    source: 'https://prtimes.jp/main/html/rd/p/000000028.000071823.html',
    note: '⑤新規: 受電済み（2026年6月）・運用開始2026年8月頃予定→建設中。市町村非公表',
  },
  {
    kind: 'post',
    endpoint: 'projects',
    payload: {
      name: '島根県の系統用蓄電所（クラダシ・インベストメント2号）',
      slug: 'gec-kuradashi-shimane-bess',
      status: ['計画中'],
      outputMw: 1.998,
      capacityMwh: 8.224,
      prefecture: '島根県',
      operator: '合同会社クラダシ・インベストメント2号（グリーンエナジー＆カンパニー×クラダシ）',
      marketParticipation: [],
      sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000028.000071823.html',
      body:
        '<p><strong>島根県の系統用蓄電所</strong>は、グリーンエナジー＆カンパニーとクラダシの合弁「合同会社クラダシ・インベストメント2号」（出資比率50%:50%・GK-TKスキーム）による第一弾案件の一つです。定格出力1,998kW・定格容量8,224kWh。受電は2027年1月の予定です。</p><p>所在市町村は一次リリースで非公表のため、都道府県までの掲載としています。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 グリーンエナジー＆カンパニー: <a href="https://prtimes.jp/main/html/rd/p/000000028.000071823.html" target="_blank" rel="noopener noreferrer">クラダシとの合弁による系統用蓄電所 国内2案件が始動（2026年8月）</a></li></ul>',
    },
    source: 'https://prtimes.jp/main/html/rd/p/000000028.000071823.html',
    note: '⑤新規: 受電2027年1月予定・着工記述なし→計画中。市町村非公表',
  },
  {
    kind: 'post',
    endpoint: 'projects',
    payload: {
      name: '広原蓄電所（Eku Energy）',
      slug: 'hirohara-bess',
      status: ['建設中'],
      outputMw: 30,
      capacityMwh: 120,
      prefecture: '宮崎県',
      city: '宮崎市',
      operator: 'Eku Energy Japan株式会社',
      marketParticipation: [],
      sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000005.000182081.html',
      body:
        '<p><strong>広原蓄電所</strong>は、Eku Energy Japanが保有する宮崎県宮崎市大字広原の系統用蓄電所（出力30MW・蓄電容量120MWh）です。2026年8月の発表時点で、テスラ製の蓄電池システム「Megapack 2 XL」32台を含む主要設備の搬入・設置が完了し、接続工事と試験の段階に進んでいます。2027年1月の運転開始を目指しています。</p><p>東京ガスが20年間の運用管理を担い、三菱UFJ銀行がプロジェクトファイナンスを組成しています。Eku Energyはマッコーリー・アセット・マネジメントとBCIの共同出資会社です。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 Eku Energy: <a href="https://prtimes.jp/main/html/rd/p/000000005.000182081.html" target="_blank" rel="noopener noreferrer">広原蓄電所の主要設備据え付け完了（2026年8月）</a></li></ul>',
    },
    source: 'https://prtimes.jp/main/html/rd/p/000000005.000182081.html',
    note: '⑤新規: 据付完了・2027年1月運開目標→建設中。ニュース eku-hirohara-sueteuke-2026-08 と連動',
  },
  {
    kind: 'post',
    endpoint: 'projects',
    payload: {
      name: '熊本県玉名郡長洲町の系統用蓄電所（J＆S蓄電）',
      slug: 'js-tamana-nagasu-bess',
      status: ['稼働中'],
      outputMw: 1.999,
      capacityMwh: 8.4,
      prefecture: '熊本県',
      city: '長洲町',
      operator: 'J＆S蓄電合同会社',
      cod: '2024年10月',
      marketParticipation: [],
      sourceUrl: 'https://www.jfe-eng.co.jp/news/2024/20241021.html',
      body:
        '<p><strong>熊本県玉名郡長洲町の系統用蓄電所</strong>は、J＆S蓄電合同会社が運営する系統用蓄電所（出力1,999kW・容量8,400kWh）で、2024年10月1日に運用を開始しました（開所式は同年10月18日）。JFEエンジニアリングが2023年7月に発表した系統用蓄電池事業への参入案件です。</p><p>※所在地は一次リリースでは「長州町」と表記されていますが、自治体の正式名称（玉名郡長洲町）で掲載しています。</p>' +
        NOTE_EM +
        '<h2>出典</h2><ul><li>📰 JFEエンジニアリング: <a href="https://www.jfe-eng.co.jp/news/2023/20230727.html" target="_blank" rel="noopener noreferrer">系統用蓄電池事業への参入（2023年7月27日）</a></li><li>📰 JFEエンジニアリング: <a href="https://www.jfe-eng.co.jp/news/2024/20241021.html" target="_blank" rel="noopener noreferrer">系統用蓄電池事業の運用開始（2024年10月21日）</a></li></ul>',
    },
    source: 'https://www.jfe-eng.co.jp/news/2024/20241021.html',
    note: '裁定1: 出典2本併記で新規起票。三木森HD（mikimori-tamana-gun-bess）とは別事業者・非重複を確認済',
  },
];

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
if (!DOMAIN || !KEY) {
  console.error('env 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1`;

function bannedHits(text: string): string[] {
  const hits: string[] = [];
  for (const w of BANNED.hardBanned) if (text.includes(w)) hits.push(w);
  for (const w of BANNED.quoteOnly) {
    let i = -1;
    while ((i = text.indexOf(w, i + 1)) >= 0) {
      const before = text.slice(Math.max(0, i - 1), i);
      if (before !== '「') hits.push(`${w}(裸)`);
    }
  }
  return hits;
}

async function findBySlug(ep: string, slug: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(`${BASE}/${ep}?filters=${encodeURIComponent(`slug[equals]${slug}`)}&depth=0`, {
    headers: { 'X-MICROCMS-API-KEY': KEY! },
  });
  if (!r.ok) throw new Error(`GET ${ep} ${r.status}`);
  return ((await r.json()) as { contents: Record<string, unknown>[] }).contents[0] ?? null;
}

// bodyはmicroCMSが見出しid付与等の正規化を行うため、タグ除去テキストの包含で照合
function textOf(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
}

async function main(): Promise<void> {
  const apply = process.env.APPLY === '1';
  console.log(`[batch5] mode = ${apply ? 'APPLY' : 'DRY-RUN'} / plans = ${PLANS.length}`);

  // 禁止語ゲート（全plan・全文字列フィールド）
  let bannedFail = 0;
  for (const p of PLANS) {
    const obj = p.kind === 'post' ? p.payload : (p.patch ?? {});
    const texts = Object.values(obj).filter((v): v is string => typeof v === 'string');
    if (p.kind === 'patch' && p.bodyReplace) texts.push(p.bodyReplace.next);
    const hits = bannedHits(texts.join('\n'));
    if (hits.length) {
      console.log(`  ★禁止語 ${p.kind === 'post' ? (p.payload.slug as string) : p.slug}: ${hits.join(', ')}`);
      bannedFail++;
    }
  }
  console.log(`禁止語ゲート: ${bannedFail === 0 ? 'PASS（全plan 0件）' : `FAIL ${bannedFail}plan`}`);
  if (bannedFail) process.exit(1);

  const log: unknown[] = [];
  let fail = 0;

  for (const plan of PLANS) {
    if (plan.kind === 'patch') {
      const before = await findBySlug(plan.endpoint, plan.slug);
      if (!before) {
        console.log(`\n■ PATCH ${plan.endpoint}/${plan.slug}: ★見つからない`);
        fail++;
        continue;
      }
      const patch: Record<string, unknown> = { ...(plan.patch ?? {}) };
      if (plan.bodyReplace) {
        const cur = String(before.body ?? '');
        const n = cur.split(plan.bodyReplace.old).length - 1;
        if (n !== 1) {
          console.log(`\n■ PATCH ${plan.endpoint}/${plan.slug}: ★bodyReplace対象が${n}回出現（期待1）→中止`);
          fail++;
          continue;
        }
        patch.body = cur.replace(plan.bodyReplace.old, plan.bodyReplace.next);
      }
      console.log(`\n■ PATCH ${plan.endpoint}/${plan.slug} (id=${before.id})`);
      console.log(`  根拠: ${plan.source}`);
      for (const [k, v] of Object.entries(patch)) {
        const cur = before[k];
        const cs = typeof cur === 'string' && cur.length > 60 ? cur.slice(0, 60) + '…' : JSON.stringify(cur);
        const ns = typeof v === 'string' && v.length > 60 ? v.slice(0, 60) + '…' : JSON.stringify(v);
        console.log(`    ${k}: ${cs} → ${ns}`);
      }
      if (!apply) continue;

      const res = await fetch(`${BASE}/${plan.endpoint}/${before.id}`, {
        method: 'PATCH',
        headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        console.log(`    ✗ PATCH ${res.status}: ${(await res.text()).slice(0, 200)}`);
        fail++;
        continue;
      }
      await new Promise((r) => setTimeout(r, 700));
      const after = await findBySlug(plan.endpoint, plan.slug);
      const drift: string[] = [];
      for (const k of Object.keys(before)) {
        if (['updatedAt', 'revisedAt', 'publishedAt'].includes(k)) continue;
        if (k in patch) continue;
        if (JSON.stringify(before[k]) !== JSON.stringify(after?.[k])) drift.push(k);
      }
      const misses = Object.entries(patch).filter(([k, v]) => {
        const got = after?.[k];
        if (k === 'body') return textOf(String(got ?? '')) !== textOf(String(v ?? ''));
        if (v === null) return got !== undefined && got !== null;
        return JSON.stringify(got ?? null) !== JSON.stringify(v);
      });
      const ok = drift.length === 0 && misses.length === 0;
      if (!ok) fail++;
      console.log(`    ${ok ? '✓' : '✗'} PATCH＋照合: 他field変化=${drift.length ? drift.join(',') : 'なし'} / 不一致=${misses.map(([k]) => k).join(',') || 'なし'}`);
      log.push({ kind: 'patch', endpoint: plan.endpoint, slug: plan.slug, keys: Object.keys(patch), drift, misses: misses.map(([k]) => k) });
    } else {
      const slug = plan.payload.slug as string;
      const dup = await findBySlug(plan.endpoint, slug);
      console.log(`\n■ POST ${plan.endpoint}/${slug}`);
      console.log(`  根拠: ${plan.source}`);
      if (dup) {
        console.log(`  既存あり(id=${dup.id}) → skip（冪等）`);
        continue;
      }
      console.log(`  name: ${plan.payload.name} / status=${JSON.stringify(plan.payload.status)} / ${plan.payload.outputMw}MW / ${plan.payload.capacityMwh}MWh`);
      if (!apply) continue;

      const res = await fetch(`${BASE}/${plan.endpoint}`, {
        method: 'POST',
        headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify(plan.payload),
      });
      if (!res.ok) {
        console.log(`    ✗ POST ${res.status}: ${(await res.text()).slice(0, 200)}`);
        fail++;
        continue;
      }
      const id = ((await res.json()) as { id: string }).id;
      await new Promise((r) => setTimeout(r, 700));
      const after = await findBySlug(plan.endpoint, slug);
      const misses = Object.entries(plan.payload).filter(([k, v]) => {
        const got = after?.[k];
        if (k === 'body') return textOf(String(got ?? '')) !== textOf(String(v ?? ''));
        return JSON.stringify(got ?? null) !== JSON.stringify(v);
      });
      const ok = !!after && misses.length === 0;
      if (!ok) fail++;
      console.log(`    ${ok ? '✓' : '✗'} POST(id=${id})＋照合: 不一致=${misses.map(([k]) => k).join(',') || 'なし'}`);
      log.push({ kind: 'post', endpoint: plan.endpoint, slug, id, misses: misses.map(([k]) => k) });
    }
  }

  if (apply) fs.writeFileSync(path.join(HERE, '.batch5-log.json'), JSON.stringify(log, null, 2));
  console.log(`\n[batch5] ${apply ? '適用' : 'ドライラン'}完了 / 失敗 ${fail}件`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});

export {};
