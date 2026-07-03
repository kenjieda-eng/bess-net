/**
 * scripts/post-policy-events-2026-07.ts
 *
 * 週次政策チェック（2026-07-03）追加分 1件。
 *   接続検討数の事業者別上限 運用開始予定（2026-08-01）
 *   ─ 第10回 次世代電力系統WG（2026-04-16）報告 → 第11回（2026-06-10）継続審議。
 *     空押さえ対策 第2弾（4/1 接続検討早期化・10/1 土地使用権原要件化と連なる規律強化）。
 *
 * 安全設計（post-policy-events-2026-06d.ts と同方式）:
 *  - 冪等: findBySlug で既存確認、あれば skip（重複作成しない・鉄則#90/#91）。
 *  - L-EIC-026: description は依頼書の本文案をそのまま投入。
 *  - L-EIC-019: エリア別上限の参考試算（概ね5〜12件程度）は「暫定・確定値は各社公表待ち」と明記。
 *  - 種別=公表（既存 4/1 bess-grid-connection-quick-2026-04 と同種別に統一・ユウ指示）／status=予定（未来）。
 *  - 出典: 次世代電力系統WG インデックス（第10回・第11回資料へ到達可能な公式ページ・ユウ指定）。
 *    METI は curl では到達不可のことがあるため probeUrl は参考ログのみ（06d と同運用）。
 *  - DELETE/PUT/PATCH なし・POST 1件のみ。
 *
 * 実行: npx tsx --env-file=.env.local scripts/post-policy-events-2026-07.ts [--dry-run]
 */
export {};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/policy-events`;

async function apiFetch(method: string, url: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text.slice(0, 400)}`);
  }
  return resp.json();
}
async function findBySlug(slug: string): Promise<{ id: string } | null> {
  const url = `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id&limit=1`;
  const data = (await apiFetch('GET', url)) as { contents: { id: string }[] };
  return data.contents[0] ?? null;
}
async function getTotalCount(): Promise<number> {
  const data = (await apiFetch('GET', `${BASE}?limit=1`)) as { totalCount: number };
  return data.totalCount;
}
async function probeUrl(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      method: 'GET', redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (bess-net policy-calendar verify)' },
      signal: AbortSignal.timeout(20000),
    });
    return String(resp.status);
  } catch {
    return '000(到達不可)';
  }
}

const DRAFT = {
  slug: 'meti-connection-review-cap-2026-08',
  title:
    '接続検討数の事業者別上限 運用開始（予定）─ 1事業者・同一エリアの同時保有件数に上限（空押さえ対策 第2弾）',
  eventDate: '2026-08-01',
  eventType: '公表', // 既存 4/1 bess-grid-connection-quick-2026-04 と同種別（運用変更系）
  issuer: 'METI（資源エネルギー庁）',
  status: '予定',
  category: ['公表'] as string[],
  description:
    '経済産業省 資源エネルギー庁の第10回 次世代電力系統ワーキンググループ（2026年4月16日）で報告され、第11回（2026年6月10日）で継続審議された対応。1事業者が同一の一般送配電エリアで同時に保有できる「接続検討」の件数に上限を設ける運用を、2026年8月1日から開始予定。系統用蓄電池の接続検討申込みが急増し（同一エリアで100件超の大量申込み事例も報告）、事業確度の低い「空押さえ」的な検討枠の占有が、事業確度の高い事業者の迅速な接続を妨げている状況への対策。7月31日時点で受付済みの案件は従来どおり回答され、8月1日時点で未受付の案件から上限が適用される予定。エリア別の上限件数は第10回WG資料で参考試算（各エリア概ね5〜12件程度）が示されたが、資源エネルギー庁は「実際の上限数と異なる可能性がある」と注記しており、確定値は各一般送配電事業者の正式公表を待つ必要がある（沖縄は試算対象外）。4月施行の接続検討早期化運用（既登録 2026-04）・10月1日予定の土地使用権原要件化（既登録 6/10エントリ）と連なる、空押さえ対策の一連の規律強化。',
  sourceUrl:
    'https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/smart_power_grid_wg/index.html',
};

async function main(): Promise<void> {
  const totalBefore = await getTotalCount();
  console.log(`[post-policy-events-2026-07] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`policy-events 現在件数: ${totalBefore}`);

  const existing = await findBySlug(DRAFT.slug);
  if (existing) {
    console.log(`[skip-dup] ${DRAFT.slug} — already exists (id=${existing.id})`);
    process.exit(0);
  }
  const probe = await probeUrl(DRAFT.sourceUrl);
  console.log(`[src] sourceUrl HTTP ${probe} : ${DRAFT.sourceUrl}`);

  if (DRY_RUN) {
    console.log(`[dry-run] POST ${DRAFT.slug}: ${DRAFT.eventDate} [${DRAFT.eventType}/${DRAFT.status}] cat=${DRAFT.category.join('・')}`);
    console.log(`[dry-run] title: ${DRAFT.title}`);
    process.exit(0);
  }

  const body: Record<string, unknown> = {
    slug: DRAFT.slug, title: DRAFT.title, eventDate: DRAFT.eventDate,
    eventType: [DRAFT.eventType], issuer: DRAFT.issuer, description: DRAFT.description,
    sourceUrl: DRAFT.sourceUrl, status: [DRAFT.status], category: DRAFT.category,
  };
  const result = (await apiFetch('POST', BASE, body)) as { id: string };
  console.log(`[ok] ${DRAFT.slug} — created id=${result.id}`);

  const totalAfter = await getTotalCount();
  console.log(`policy-events 件数: ${totalBefore} → ${totalAfter}  差分=+${totalAfter - totalBefore}`);
  process.exit(0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
