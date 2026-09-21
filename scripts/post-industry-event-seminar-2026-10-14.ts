#!/usr/bin/env tsx
/**
 * scripts/post-industry-event-seminar-2026-10-14.ts — /events に 10/14 セミナーを 1 件収載（An-1 ■3・2026-09-21）
 *
 * 前例: tmp/post-seetel-event.ts（2026-07-05・industry-events に SEETEL セミナーを POST 1 件）。
 *   2026-08-31 の API 統合で industry-events は policy-events（kind=業界）へ移ったため、同じ形を policy-events に入れる
 *   （フィールド対応 organizer→issuer / officialUrl→sourceUrl。scripts/migrate-industry-events-2026-08-31.ts）。
 *   前例と同じく slug は案内ページと同一、sourceUrl は内部案内ページ（外部の申込ページを直接指さない＝3 段導線）。
 *
 * 収載基準（2026-09-11 裁定）: 公的機関・業界団体の説明会は収載／有料の商業セミナーは収載しない。
 *   本件は無料・当サイト運営団体の共催 → 収載可（依頼 ■3）。
 * 一次: https://pps-net.org/seminar/165196（2026-09-21 取得）。issuer は一次の主催欄を逐語（区切りは「、」）。
 *
 * ★#106: select（eventType・status・kind・eventTopics）は既存レコードで使われている実在値のみ。投入後に GET で全 field 照合。
 * ★冪等（#91）: slug で先に引き、既存なら skip。POST 1 件のみ。PATCH / PUT / DELETE なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/post-industry-event-seminar-2026-10-14.ts [--dry-run]
 */
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const EP = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
type Rec = Record<string, unknown> & { id: string; slug: string };
const bySlug = async (slug: string): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${EP}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** 日付は microCMS が ISO（T00:00:00.000Z）で返すため先頭 10 文字で比べる */
const norm = (k: string, v: unknown) =>
  k === 'eventDate' && typeof v === 'string' ? v.slice(0, 10) : JSON.stringify(v === undefined ? null : v);

const ROW = {
  slug: 'seminar-bess-investment-2026-10-14', // 案内ページと同一 slug（前例どおり）
  title: '【無料オンラインセミナー】経営者のための系統用蓄電池投資セミナー',
  eventDate: '2026-10-14',
  eventType: ['セミナー'],
  issuer: '一般社団法人エネルギー情報センター 新電力ネット運営事務局、RAUL株式会社', // 一次の主催欄を逐語
  // ★運営団体の主催であることを冒頭に置く（/events の「各主催者とは独立」の断り書きの例外を、読む前に分かるように）
  description:
    '当サイト運営団体の一般社団法人エネルギー情報センター（新電力ネット運営事務局）とRAUL株式会社が主催する、経営者・事業オーナー向けの無料オンラインセミナー（Zoom、13:00〜14:00）。系統用蓄電池事業の市場環境・収益構造、100％即時償却を活用した設備投資、事業承継、自社株評価への活用可能性などを、公認会計士・税理士の平尾和也氏（RAULエグゼクティブアドバイザー）が解説する。100％即時償却の適用には一定の要件があると主催者は注記している。',
  sourceUrl: 'https://bess-net.jp/info/seminar-bess-investment-2026-10-14', // 前例どおり内部案内ページ
  status: ['予定'],
  venue: 'オンライン（Zoom）', // 既存の業界枠オンライン開催と同じ表記
  location: 'オンライン',
  kind: ['業界'],
  eventTopics: ['系統用蓄電池', '投資'], // いずれも既存レコードで使用中の実在値（#106）
};

async function main(): Promise<void> {
  console.log(`[An-1 ■3] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / POST 1 件（policy-events kind=業界）`);
  const before = await api<{ totalCount: number }>('GET', `${EP}?limit=0`);
  console.log(`投入前の総件数: ${before.totalCount}`);
  const cur = await bySlug(ROW.slug);
  if (cur) {
    console.log(`[skip] 既存あり（id=${cur.id}・重複 POST しない）`);
    process.exit(0);
  }
  for (const [k, v] of Object.entries(ROW)) console.log(`   ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  // ★リンク先（案内ページ）が本番で 200 になってから入れる。先に入れると /events の「公式サイト →」が 404 を指す
  //   （microCMS への書込は Vercel の再ビルドを起こすため、コードのデプロイ前に実行すると 404 の窓が生じうる）
  const live = await fetch(ROW.sourceUrl, { redirect: 'manual' });
  console.log(`リンク先 ${ROW.sourceUrl} → HTTP ${live.status}`);
  if (live.status !== 200) {
    console.log('[中止] 案内ページがまだ 200 でない。コードのデプロイ完了を待ってから実行する。');
    process.exit(1);
  }
  if (DRY) process.exit(0);

  const res = await api<{ id: string }>('POST', EP, ROW);
  await sleep(900);
  const a = await bySlug(ROW.slug);
  let bad = 0;
  for (const [k, v] of Object.entries(ROW)) {
    if (norm(k, a?.[k]) !== norm(k, v)) { bad++; console.log(`   ✗ ${k}: 送信=${norm(k, v)} 保存=${norm(k, a?.[k])}`); }
  }
  const after = await api<{ totalCount: number }>('GET', `${EP}?limit=0`);
  console.log(`#106: ${bad === 0 ? `✓ 全 ${Object.keys(ROW).length} field 一致（id=${res.id}）` : `★NG 不一致 ${bad}`}`);
  console.log(`総件数: ${before.totalCount} → ${after.totalCount}`);
  process.exit(bad === 0 ? 0 : 1);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
