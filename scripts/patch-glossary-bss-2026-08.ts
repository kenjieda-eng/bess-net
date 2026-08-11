#!/usr/bin/env tsx
/**
 * scripts/patch-glossary-bss-2026-08.ts — 8/12便【B】（2026-08-12・EDAさん承認済み）
 *
 * 対象: glossary battery-storage-site（蓄電所）の detail フィールド 1件のみ。
 * 差分は B-1（導入実績の出典付き更新）/ B-2（FAQ 3問）/ B-3（本文末の関連導線）のみ。
 *
 * B-1: 無出典の「2024年時点の累積導入量は約2GWh…」を削除し、一次出典付き段落へ置換
 *      （出典PDFはブラウザUAで HTTP 200 を事前確認済み。数値・時点・倍率は承認原稿のまま）。
 * B-2: FAQ 3問を detail 末尾に追加（#107: 初期DOMに載る。FAQPage JSON-LD への反映は
 *      コード側の器拡張が自動で行う＝本文が真実源・二重管理なし）。
 * B-3: 末尾の「関連：実データで確認」ブロックを置換。
 *      ★旧ブロックは「全国9社・6,507変電所」という古い数値を含んでいた（現在は10社8,225件）。
 *      ★件数は本文に焼き込まない（まさに 6,507 が焼き付いて古くなった実例があるため）。
 *
 * 落とし穴 #106: PATCH 前に GET 保存済み（bss_before.json）・PATCH 後に GET 全field照合。
 * 実行: DRY（既定）／APPLY=1 で実行。
 */
import * as fs from 'node:fs';

const SLUG = 'battery-storage-site';

// ---- B-1 ----------------------------------------------------------------
const B1_OLD =
  '日本では2024年時点の累積導入量は約2GWh、2030年目標は政府想定で14〜16GWh、業界推計では20GWh級も視野に入る。';
const B1_NEW =
  '導入の現在地（一次資料より）: 経済産業省の資料によると、2024年9月末時点で連系済みの系統用蓄電池は約10万kW。一方、接続検討の受付は約8,800万kW（前年比約3.2倍）、接続契約は約620万kW（同約2.1倍）に達しており、連系済み容量に対して桁違いの開発パイプラインが積み上がっている段階にある（出典: <a href="https://www.meti.go.jp/policy/mono_info_service/joho/conference/battery_strategy2/shiryo06.pdf" target="_blank" rel="noopener noreferrer">経済産業省「定置用蓄電システムの現状と課題」2025年3月12日、蓄電池産業戦略検討官民協議会 資料6</a>）。';

// ---- B-3 ----------------------------------------------------------------
const B3_OLD =
  '<h4 id="h1c2a13efdd">関連：実データで確認</h4><p>蓄電所ネット では、全国9社・6,507変電所の系統空き容量データを統合提供しています。</p><ul><li><a href="/grid">系統空き容量データベース（9社6,507件）</a></li><li><a href="/grid/chubu/map">中部地方マップ（業界初）</a></li><li><a href="/grid/search">変電所名フリーテキスト検索</a></li></ul>';
const B3_NEW =
  '<h4 id="h1c2a13efdd">関連：実データで確認</h4><ul><li><a href="/projects">全国の蓄電所プロジェクト一覧（プロジェクトDB）</a></li><li><a href="/grid">変電所の系統空き容量データベース</a></li><li><a href="/lv/what-is">低圧蓄電所との違い（低圧系統用蓄電池とは）</a></li><li><a href="/subsidies">使える補助金を探す（補助金カレンダー）</a></li></ul>';

// ---- B-2（B-3 の直前に挿入） --------------------------------------------
const B2_FAQ = [
  '<h3 id="faq-bss">よくある質問</h3>',
  '<h4>Q. 蓄電所とは何ですか？</h4>',
  '<p>電力系統に直接連系し、電気の売買や調整力の提供を行う大型蓄電池施設のことです。2022年5月の電気事業法等改正で発電事業として位置づけられ、太陽光発電所や火力発電所と並ぶ「電源」の一種として扱われています。詳しくは本ページの解説をご覧ください。</p>',
  '<h4>Q. 蓄電所に固定資産税はかかりますか？</h4>',
  '<p>事業用の蓄電池設備は、一般に固定資産税（償却資産）の課税対象になります（標準税率1.4%）。ただし課税の扱い・特例の有無は自治体や取得時期・適用制度によって異なるため、具体的な判断は所在自治体・税理士への確認が必要です。</p>',
  '<h4>Q. 蓄電所の電池は劣化しますか？交換は必要ですか？</h4>',
  '<p>リチウムイオン電池は充放電の繰り返しと経年で容量が徐々に低下します。事業計画では、劣化を見込んだ容量設計（オーバーサイズ）や、運転期間中のセル・モジュール増設/交換（オーグメンテーション）を織り込むのが一般的です。劣化の速さは電池の種類・運用パターン・温度管理によって変わります。</p>',
].join('');

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
if (!DOMAIN || !KEY) {
  console.error('[bss] MICROCMS env 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1`;

async function getRecord(): Promise<Record<string, unknown>> {
  const r = await fetch(
    `${BASE}/glossary?filters=${encodeURIComponent(`slug[equals]${SLUG}`)}&depth=0`,
    { headers: { 'X-MICROCMS-API-KEY': KEY! } }
  );
  if (!r.ok) throw new Error(`GET ${r.status}`);
  const j = (await r.json()) as { contents: Record<string, unknown>[] };
  if (!j.contents[0]) throw new Error('record not found');
  return j.contents[0];
}

function applyEdits(detail: string): string {
  if (!detail.includes(B1_OLD)) throw new Error('B-1 対象文が見つからない（本文が変わっている）');
  if (!detail.includes(B3_OLD)) throw new Error('B-3 対象ブロックが見つからない（本文が変わっている）');
  let out = detail.replace(B1_OLD, B1_NEW);
  out = out.replace(B3_OLD, B2_FAQ + B3_NEW);
  return out;
}

async function main(): Promise<void> {
  const apply = process.env.APPLY === '1';
  console.log(`[bss] mode = ${apply ? 'APPLY' : 'DRY-RUN'}`);
  const before = await getRecord();
  const detail = String(before.detail ?? '');
  console.log(`  現 detail = ${detail.length}字`);
  const next = applyEdits(detail);
  console.log(`  新 detail = ${next.length}字（+${next.length - detail.length}）`);
  console.log('  B-1 置換 ✓ / B-2 FAQ 3問挿入 ✓ / B-3 導線置換 ✓（6,507の古い数値も解消）');
  if (!apply) return;

  const res = await fetch(`${BASE}/glossary/${before.id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ detail: next }),
  });
  if (!res.ok) {
    console.error(`  ✗ PATCH ${res.status}: ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  console.log('  ✓ PATCH 完了');

  // #106: GET 全field照合（差分が detail のみであること）
  await new Promise((r) => setTimeout(r, 800));
  const after = await getRecord();
  const drift: string[] = [];
  for (const k of Object.keys(before)) {
    if (['updatedAt', 'revisedAt', 'publishedAt'].includes(k)) continue;
    if (k === 'detail') continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) drift.push(k);
  }
  const detailOk = String(after.detail) === next;
  console.log(`  照合: detail一致=${detailOk ? '✓' : '✗'} / 他field変化=${drift.length ? '✗ ' + drift.join(',') : '✓ なし'}`);
  const faqOk = String(after.detail).includes('Q. 蓄電所に固定資産税はかかりますか？');
  const b1Ok = String(after.detail).includes('2024年9月末時点で連系済みの系統用蓄電池は約10万kW');
  const goneOk = !String(after.detail).includes('約2GWh') && !String(after.detail).includes('6,507');
  console.log(`  内容: B-1=${b1Ok ? '✓' : '✗'} / FAQ=${faqOk ? '✓' : '✗'} / 旧記述(2GWh・6,507)残存なし=${goneOk ? '✓' : '✗'}`);
  fs.writeFileSync('scripts/.bss-patch-log.json', JSON.stringify({ beforeLen: detail.length, afterLen: next.length, drift, detailOk }, null, 2));
  if (!detailOk || drift.length || !faqOk || !b1Ok || !goneOk) process.exit(1);
}

main().catch((e) => {
  console.error('[bss] ERROR:', e);
  process.exit(1);
});

export {};
