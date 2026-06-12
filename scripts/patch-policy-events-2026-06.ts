/**
 * scripts/patch-policy-events-2026-06.ts
 *
 * 2026-06-12: policy-events 2件の description・eventType を正確版に PATCH
 *
 *  [1] hlq3868w69 (balancing-market-reform-2026-03)
 *      eventType: ["法改正"] → ["公表"]
 *      description: 推測補完版 → 一次資料ベース（第109回制度検討作業部会 資料6）
 *
 *  [2] g6b-vyuk1684 (bess-grid-connection-quick-2026-04)
 *      eventType: ["法改正"] → ["公表"]
 *      description: 推測補完版 → 一次資料ベース（第7回次世代電力系統WG 資料1-1）
 *      category: "系統連系" は schema 選択肢に存在しないため現状維持 ["法改正"]
 *
 * 冪等設計 (落とし穴#91): GET で現在値確認し、既に正しければ skip。
 *
 * 実行: npx tsx scripts/patch-policy-events-2026-06.ts [--dry-run]
 *
 * L-EIC-026: description 等の本文は参照ではなく実テキストで完全記載
 */

import {} from 'node:process';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/policy-events`;

async function apiFetch(method: 'GET' | 'PATCH', url: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text.slice(0, 400)}`);
  }
  return resp.json();
}

// ─────────────────────────────────────────────────────────────
// PATCH 対象
// ─────────────────────────────────────────────────────────────

const PATCH_1 = {
  id: 'hlq3868w69',
  slug: 'balancing-market-reform-2026-03',
  eventType: ['公表'],
  description:
    '需給調整市場の週間商品（一次・二次①・二次②・三次①）が2026年度に全商品前日取引化（電力需給調整力取引所のシステム切替を経て、2026年3月13日の市場取引＝3月14日受渡分より移行）。募集量を1σ相当に統一（2025年度比で一次・二次①は約13%減、複合商品〔一次〜三次①〕は約50%増の見通し）。上限価格は引き下げる方向で議論中（現行19.51円/ΔkW・30分。第108回制度検討作業部会の提案は7.21円/ΔkW・30分〔14.42円/ΔkW・h相当〕、選択肢10/15/19.51円も提示。蓄電池収益性〔2MW/8MWh・4時間率・CAPEX6.8万円/kWh・IRR目線5〜10%〕を踏まえ適切水準を継続議論、最終水準は要確認）。需給調整市場ガイドライン・「適正な電力取引についての指針」も改定（不適切入札の処分対象明確化、B種電源協議の廃止、蓄電池の限界費用の考え方を含むΔkW/kWh価格の整理。電力・ガス取引監視等委員会が2025年12月10日建議）。蓄電所の需給調整収益モデルの質的転換を迫る重要改定。出典＝資源エネルギー庁 第109回制度検討作業部会 資料6（2025年12月12日）。',
};

const PATCH_2 = {
  id: 'g6b-vyuk1684',
  slug: 'bess-grid-connection-quick-2026-04',
  eventType: ['公表'],
  description:
    '資源エネルギー庁が系統用蓄電池の迅速な系統連系策を提示。①接続検討の早期化に資する運用変更を2026年4月開始（配電系統に連系する高圧設備で、接続検討の申込時に「上位系統増強の受容性の有無」と「工事費負担金の上限額」を提示。事業者ニーズに合わない場合は連系"否"で速やかに回答）。②系統用蓄電池の暫定空押さえ対策を2026年4月以降の契約申込みから適用（契約申込み時の保証金額の増額、工事費負担金の分割払いルールの厳格化）。背景に系統用蓄電池の契約申込みが2025年9月末で約2,400万kW〔前年比3.9倍〕に急増（25年12月末・全国約2,868万kW）。順潮流側ノンファーム型接続は計画値制御の導入を目指すが構築5〜7年、暫定で早期連系追加対策（充電制限時間の柔軟化）も見直し。蓄電所の用地・系統枠確保プロセスに直結。出典＝資源エネルギー庁 第7回次世代電力系統WG 資料1-1（2026年2月9日）。',
};

// ─────────────────────────────────────────────────────────────

async function patchEntry(
  target: typeof PATCH_1,
): Promise<'ok' | 'skip' | 'err'> {
  try {
    const entry = (await apiFetch('GET', `${BASE}/${target.id}?fields=id,slug,eventType,description`)) as {
      id: string;
      slug: string;
      eventType: string[];
      description: string;
    };

    const sameType = JSON.stringify(entry.eventType) === JSON.stringify(target.eventType);
    const sameDesc = entry.description === target.description;

    if (sameType && sameDesc) {
      console.log(`  [skip] ${target.slug} — already up to date`);
      return 'skip';
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] PATCH ${target.slug}`);
      if (!sameType) console.log(`    eventType: ${JSON.stringify(entry.eventType)} → ${JSON.stringify(target.eventType)}`);
      if (!sameDesc) console.log(`    description: (${entry.description.length}chars) → (${target.description.length}chars)`);
      return 'ok';
    }

    await apiFetch('PATCH', `${BASE}/${target.id}`, {
      eventType: target.eventType,
      description: target.description,
    });
    console.log(`  [ok] ${target.slug} patched`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${target.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

async function main(): Promise<void> {
  console.log(`[patch-policy-events-2026-06] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);

  let ok = 0, skip = 0, err = 0;
  const count = (r: 'ok' | 'skip' | 'err') => {
    if (r === 'ok') ok++; else if (r === 'skip') skip++; else err++;
  };

  count(await patchEntry(PATCH_1));
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
  count(await patchEntry(PATCH_2));

  console.log(`[done] ok=${ok}  skip=${skip}  err=${err}`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
