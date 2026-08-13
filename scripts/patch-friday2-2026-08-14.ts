#!/usr/bin/env tsx
/**
 * scripts/patch-friday2-2026-08-14.ts — 金曜ワンセット#2 ⑦⑧のPATCH（2026-08-14）
 *
 * すべて一次情報で確定した値のみ（推測ゼロ）。出典URLは各planに記載。
 * DELETE/PUTなし・差分限定・PATCH後にGET全field照合（#106）。
 *
 * ⑦-2 taishi-bess: 日経BP記事の誤植（茨城県に存在しない「太子町」）を取り込んでいた。
 *   一次（パワーエックス 2025-12-18 リリース）で「だいご蓄電所／茨城県久慈郡大子町北田気662／
 *   事業者 株式会社クリハラント」を確定。兵庫県の座標も誤りのため除去（推測で入れ直さない）。
 * ⑦-3 tokyo-ev-promotion: 助成対象は車両のみ（ページ原文に「蓄電」0回）。
 *   定置用蓄電池に使えると誤読されない対象欄へ是正。
 * ⑧ operator null: 一次で確定した6件のみ投入。
 */
import * as fs from 'node:fs';

type Plan = {
  endpoint: 'projects' | 'subsidies';
  slug: string;
  patch: Record<string, unknown>;
  source: string;
  note: string;
};

const PLANS: Plan[] = [
  {
    endpoint: 'projects',
    slug: 'taishi-bess',
    patch: {
      name: 'だいご蓄電所',
      prefecture: '茨城県',
      city: '大子町',
      operator: '株式会社クリハラント',
      outputMw: 1.9,
      capacityMwh: 8.226,
      latitude: null,
      longitude: null,
      body:
        '<p><strong>だいご蓄電所</strong>は、茨城県久慈郡大子町（大子町役場敷地内）に立地する系統用蓄電所で、2025年12月18日に発表され、2026年2月に運転を開始しました。事業者は株式会社クリハラント。パワーエックス製の蓄電システム「Mega Power 2700A」3台（合計容量8,226kWh・PCS出力1.9MW）を採用しています。</p><p>停電時に電力を供給できるBCP機能を備え、災害時には大子町の指定避難所である「大子町営研修センター」の非常用電源として活用されます。地域防災への貢献と平時の市場参加を両立する事業モデルです。</p><p><em>※本案件情報は、各事業者の公式プレスリリース・IR資料等に基づき編集部が整備したものです。最新の進捗・諸元については、出典および各事業者の公式発表をご参照ください。</em></p><h2 id="src-daigo">出典</h2><ul><li>📰 パワーエックス: <a href="https://prtimes.jp/main/html/rd/p/000000207.000109041.html" target="_blank" rel="noopener noreferrer">クリハラントが大子町役場敷地内に新設した系統蓄電所向けに蓄電システムを納入（2025年12月18日）</a></li><li>📰 パワーエックス: <a href="https://prtimes.jp/main/html/rd/p/000000237.000109041.html" target="_blank" rel="noopener noreferrer">「だいご蓄電所」2026年2月運転開始（2026年4月9日）</a></li></ul>',
      sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000207.000109041.html',
    },
    source: 'https://prtimes.jp/main/html/rd/p/000000207.000109041.html',
    note: '⑦-2: 太子町(兵庫)→大子町(茨城)の是正。日経の誤植が起点。座標は誤値のため除去',
  },
  {
    endpoint: 'subsidies',
    slug: 'tokyo-ev-promotion',
    patch: {
      targetEntity: '都内の個人・法人（FCV・EV・PHEV車両の導入者。定置用（系統用）蓄電池は対象外）',
      scheme:
        '都内におけるFCV・EV・PHEVの導入支援。国のCEV補助金との併用が可能で、車両種別ごとに補助上限額を設定。助成対象は車両のみで、定置用（系統用）蓄電池は対象外。V2H・V2B等の設備は本事業では車両助成額の上乗せ事由であり、設備自体への助成は別事業。',
    },
    source: 'https://www.tokyo-co2down.jp/subsidy/ev/',
    note: '⑦-3: 対象は車両のみ（原文に「蓄電」0回）。誤読防止の明示',
  },
  {
    endpoint: 'projects',
    slug: 'namie-redox-flow',
    patch: { operator: '株式会社RS Technologies' },
    source: 'https://prtimes.jp/main/html/rd/p/000000007.000110789.html',
    note: '⑧: 自社リリース＋住友電工リリースで確定（住友電工製VRFB・浪江町）',
  },
  {
    endpoint: 'projects',
    slug: 'sado-megasolar-bess',
    patch: { operator: '東北電力ネットワーク株式会社' },
    source: 'https://nw.tohoku-epco.co.jp/news/pdf/__icsFiles/afieldfile/2023/12/18/20231218001.pdf',
    note: '⑧: 公式プレスリリースPDFで確定（両津火力構内5MW/5MWh・2023-12-18運開）',
  },
  {
    endpoint: 'projects',
    slug: 'arao-bess',
    patch: { operator: '株式会社テレビショッピング研究所（開発・運用: しろくま電力/旧afterFIT）' },
    source: 'https://prtimes.jp/main/html/rd/p/000000100.000055631.html',
    note: '⑧: 「事業主はテレビショッピング研究所、開発・設計・施工ならびに管理・運用をafterFITが担います」',
  },
  {
    endpoint: 'projects',
    slug: 'naganuma-bess',
    patch: { operator: '株式会社城洋商事' },
    source: 'https://www.jys-joyoshoji.co.jp/info/179/',
    note: '⑧: 自社サイト「事業者：株式会社城洋商事／所在地：北海道夕張郡長沼町／落札容量：37,515kW」',
  },
  {
    endpoint: 'projects',
    slug: 'tagawa-130mwh',
    patch: { operator: 'ヘキサ・エネルギーサービス合同会社' },
    source: 'https://corp.shirokumapower.com/news/-X5BLc4T',
    note: '⑧: 「ヘキサ・エネルギーサービスが、SPCを通じて保有・事業を推進」（しろくま電力は技術パートナー）',
  },
  {
    endpoint: 'projects',
    slug: 'osaka-large-bess',
    patch: { operator: '多奈川蓄電所合同会社（関西電力・きんでん・JEXI）' },
    source: 'https://www.kepco.co.jp/corporate/pr/2025/pdf/20250507_1j.pdf',
    note: '⑧: 関西電力リリースで確定（99MW/396MWh）。★status=稼働中/cod=2025-05は一次と矛盾（商用運転は2028年2月予定）→報告',
  },
];

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
if (!DOMAIN || !KEY) {
  console.error('env 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1`;

async function findBySlug(ep: string, slug: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(`${BASE}/${ep}?filters=${encodeURIComponent(`slug[equals]${slug}`)}&depth=0`, {
    headers: { 'X-MICROCMS-API-KEY': KEY! },
  });
  if (!r.ok) throw new Error(`GET ${ep} ${r.status}`);
  return ((await r.json()) as { contents: Record<string, unknown>[] }).contents[0] ?? null;
}

async function main(): Promise<void> {
  const apply = process.env.APPLY === '1';
  console.log(`[friday2] mode = ${apply ? 'APPLY' : 'DRY-RUN'} / plans = ${PLANS.length}`);
  const log: unknown[] = [];
  let fail = 0;

  for (const plan of PLANS) {
    const before = await findBySlug(plan.endpoint, plan.slug);
    if (!before) {
      console.log(`  ✗ ${plan.slug}: 見つからない`);
      fail++;
      continue;
    }
    console.log(`\n■ ${plan.endpoint}/${plan.slug} (id=${before.id})`);
    console.log(`  根拠: ${plan.source}`);
    for (const [k, v] of Object.entries(plan.patch)) {
      const cur = before[k];
      const curStr = typeof cur === 'string' && cur.length > 60 ? cur.slice(0, 60) + '…' : JSON.stringify(cur);
      const nextStr = typeof v === 'string' && v.length > 60 ? v.slice(0, 60) + '…' : JSON.stringify(v);
      console.log(`    ${k}: ${curStr} → ${nextStr}`);
    }
    if (!apply) continue;

    const res = await fetch(`${BASE}/${plan.endpoint}/${before.id}`, {
      method: 'PATCH',
      headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(plan.patch),
    });
    if (!res.ok) {
      console.log(`    ✗ PATCH ${res.status}: ${(await res.text()).slice(0, 200)}`);
      fail++;
      continue;
    }
    await new Promise((r) => setTimeout(r, 700));
    const after = await findBySlug(plan.endpoint, plan.slug);
    // #106: 差分がplanのキーのみであること＋各値が入ったこと
    const drift: string[] = [];
    for (const k of Object.keys(before)) {
      if (['updatedAt', 'revisedAt', 'publishedAt'].includes(k)) continue;
      if (k in plan.patch) continue;
      if (JSON.stringify(before[k]) !== JSON.stringify(after?.[k])) drift.push(k);
    }
    const misses = Object.entries(plan.patch).filter(([k, v]) => {
      const got = after?.[k];
      if (typeof v === 'string' && typeof got === 'string')
        // body は microCMS が見出しid等を付与するため包含で判定
        return k === 'body' ? !(got.includes('だいご蓄電所') && got.includes('久慈郡大子町')) : got !== v;
      return JSON.stringify(got ?? null) !== JSON.stringify(v);
    });
    const ok = drift.length === 0 && misses.length === 0;
    if (!ok) fail++;
    console.log(`    ${ok ? '✓' : '✗'} PATCH＋照合: 他field変化=${drift.length ? drift.join(',') : 'なし'} / 不一致=${misses.map(([k]) => k).join(',') || 'なし'}`);
    log.push({ slug: plan.slug, endpoint: plan.endpoint, keys: Object.keys(plan.patch), drift, misses: misses.map(([k]) => k) });
  }

  if (apply) fs.writeFileSync('scripts/.friday2-patch-log.json', JSON.stringify(log, null, 2));
  console.log(`\n[friday2] ${apply ? '適用' : 'ドライラン'}完了 / 失敗 ${fail}件`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});

export {};
