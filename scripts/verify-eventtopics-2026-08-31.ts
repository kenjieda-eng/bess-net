#!/usr/bin/env tsx
/**
 * scripts/verify-eventtopics-2026-08-31.ts — 工程A: eventTopics の52選択肢を canary で事前検証
 *
 * 背景: relatedTopics が単一選択で作成されており 4値→1値に silently drop（#106）。
 *       microCMS 上で複数選択へ変更できないため、EDAさんが新フィールド eventTopics
 *       （複数選択・選択肢52）を新規作成。旧 relatedTopics は削除せず放置（空のまま）。
 *
 * A-1: canary の eventTopics に 52値すべてを PATCH
 * A-2: GET して差集合を取る（空なら 52選択肢が全登録＋複数選択であることが同時に確定）
 * A-3: 通ったら本来の4値へ PATCH で戻し、#106 全field照合（要素数4）
 *
 * PATCH は canary 1件・eventTopics のみ。他フィールドの不変も毎回照合する。
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const PE = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;
const SLUG = 'smart-energy-week-spring-2026';
const REAL4 = ['BESS', '系統用蓄電池', '太陽光', 'VPP'];
const SYS = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

const ALL52: string[] = [
  'BESS', 'BESS併設', 'CATL', 'Fluence', 'GX', 'Huawei', 'LDES', 'LFP', 'Megapack', 'PCS',
  'PF', 'PPA', 'Tesla', 'VPP', 'アグリゲーター', 'ノンファーム接続', 'バイオマス', 'リユース',
  'レジリエンス', '中国', '中部', '九州', '全固体電池', '再エネ', '出力制御', '国際', '地域',
  '太陽光', '容量市場', '投資', '東北', '業界団体', '次世代電池', '欧州', '水素', '洋上風力',
  '省エネ', '米国', '系統安定化', '系統用蓄電池', '系統連系', '経営戦略', '脱炭素', '自家消費',
  '蓄電池技術', '運用', '長期脱炭素オークション', '関西', '電力エネルギー', '電力工学',
  '需給調整市場', '風力',
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}

async function getCanary(): Promise<Record<string, unknown>> {
  const d = await api<{ contents: Array<Record<string, unknown>> }>(
    'GET',
    `${PE}?filters=slug[equals]${encodeURIComponent(SLUG)}&limit=1`
  );
  if (!d.contents[0]) throw new Error(`canary ${SLUG} が見つからない`);
  return d.contents[0];
}

/** eventTopics 以外のフィールドが動いていないか */
function otherDiffs(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (SYS.has(k) || k === 'eventTopics') continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) out.push(`${k}: ${JSON.stringify(before[k])} → ${JSON.stringify(after[k])}`);
  }
  return out;
}

async function main(): Promise<void> {
  console.log(`[A] eventTopics 52値の事前検証（canary=${SLUG}）`);
  console.log(`  検証値: ${ALL52.length} 値`);
  if (new Set(ALL52).size !== 52) {
    console.error(`  ★定数が52値でない（重複?）: ${new Set(ALL52).size}`);
    process.exit(1);
  }

  const before = await getCanary();
  console.log(`  canary id=${before.id} / 現在の eventTopics=${JSON.stringify(before.eventTopics ?? null)} / relatedTopics=${JSON.stringify(before.relatedTopics ?? null)}`);

  // ---- A-1: 52値を PATCH ----
  console.log('\n■ A-1: eventTopics に 52値すべてを PATCH');
  await api('PATCH', `${PE}/${before.id}`, { eventTopics: ALL52 });
  await new Promise((r) => setTimeout(r, 1000));

  // ---- A-2: 差集合 ----
  const mid = await getCanary();
  const got = (mid.eventTopics as string[] | undefined) ?? [];
  const missing = ALL52.filter((v) => !got.includes(v));
  const extra = got.filter((v) => !ALL52.includes(v));
  console.log('\n■ A-2: 差集合');
  console.log(`  送信 ${ALL52.length} 値 → 受信 ${got.length} 値`);
  console.log(`  欠け（送ったのに入らなかった値）: ${missing.length === 0 ? '空 ✓' : JSON.stringify(missing)}`);
  console.log(`  余り（送っていないのに入った値）: ${extra.length === 0 ? '空 ✓' : JSON.stringify(extra)}`);
  const od1 = otherDiffs(before, mid);
  console.log(`  他フィールドの変化: ${od1.length ? '★ ' + od1.join(' / ') : '0 ✓'}`);
  if (missing.length) {
    console.error('\n★ 選択肢に未登録の値があります → 停止。上記「欠け」を管理画面で追加してください。');
    console.error('  （canary の eventTopics はこの状態で残します。追加後に本スクリプトを再実行）');
    process.exit(1);
  }
  console.log(`  → 52値すべて保持＝選択肢は全登録済み、かつ複数選択（要素数${got.length}が保持された）`);

  // ---- A-3: 本来の4値へ戻す ----
  console.log('\n■ A-3: 本来の4値へ戻す');
  await api('PATCH', `${PE}/${before.id}`, { eventTopics: REAL4 });
  await new Promise((r) => setTimeout(r, 1000));
  const after = await getCanary();
  const fin = (after.eventTopics as string[] | undefined) ?? [];
  const ok4 = fin.length === REAL4.length && REAL4.every((v) => fin.includes(v));
  console.log(`  eventTopics: ${JSON.stringify(fin)}（要素数 ${fin.length}／期待 ${REAL4.length}）${ok4 ? ' ✓' : ' ★NG'}`);
  const od2 = otherDiffs(before, after);
  console.log(`  #106 他フィールドの変化: ${od2.length ? '★ ' + od2.join(' / ') : '0 ✓'}`);
  if (!ok4 || od2.length) process.exit(1);
  console.log('\n[A 完了] 52値の事前検証 PASS・canary は本来の4値に復元済み。工程C（残り40件）へ進めます。');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

export {};
