/**
 * scripts/post-subsidy-chikudenchi07r.ts
 *
 * R7補正 系統用蓄電システム等導入支援事業（chikudenchi07r）の subsidies 新規エントリ 1件 POST。
 * 2026-07-06 依頼（説明会エントリー受付開始の先行情報還元・案A GO）。
 *
 * 安全設計（post-policy-events-2026-07.ts と同方式）:
 *  - 冪等: findBySlug で既存確認、あれば skip（重複作成しない・鉄則#90/#91）。
 *  - L-EIC-019: 補助率・上限・公募期間は未公表のため書かない（空欄）。
 *    GXフューチャー・リーグ要件は公式の「方針」表記を維持し断定しない。
 *  - L-EIC-027: deadline/applicationStart なし → deriveStatus は手動 status を素通し、「公募予定」表示で安定。
 *  - scheme 内 URL は平文・末尾に句読点や括弧を含めない（リンク化破損防止・EDAさん指示②）。
 *  - DELETE/PUT/PATCH なし・POST 1件のみ。
 *
 * 実行: npx tsx --env-file=.env.local scripts/post-subsidy-chikudenchi07r.ts [--dry-run]
 */
export {};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/subsidies`;

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

const DRAFT = {
  slug: 'sii-chikudenchi07r',
  name: '令和7年度補正 系統用蓄電システム等導入支援事業',
  organization: 'SII（環境共創イニシアチブ）／経済産業省',
  category: ['蓄電池'] as string[],
  status: ['公募予定'] as string[],
  fiscalYear: '令和7年度補正（2025年度補正・2026年度執行）',
  sourceUrl: 'https://sii.or.jp/chikudenchi07r/',
  scheme:
    '系統用蓄電システム等の導入支援（令和7年度補正）。公募スケジュール・要領は未公表。応募要件として、GXフューチャー・リーグ会員であることが求められる方針（中小企業を除く。事業トップ記載）。【2026-07-06 確認】公募説明会の事前エントリー受付が開始（会場・オンライン併用、参加には事前エントリー必須）。日時・会場は公式エントリーフォーム参照: https://sii.or.jp/entries/chikudenchi07r/input',
};

async function main(): Promise<void> {
  const totalBefore = await getTotalCount();
  console.log(`totalCount before: ${totalBefore}`);

  const existing = await findBySlug(DRAFT.slug);
  if (existing) {
    console.log(`SKIP: slug=${DRAFT.slug} は既存 (id=${existing.id})。POST しません（冪等）。`);
    return;
  }

  if (DRY_RUN) {
    console.log('--dry-run: POST payload ↓');
    console.log(JSON.stringify(DRAFT, null, 2));
    return;
  }

  const created = (await apiFetch('POST', BASE, DRAFT)) as { id: string };
  console.log(`POST OK: id=${created.id} slug=${DRAFT.slug}`);
  const totalAfter = await getTotalCount();
  console.log(`totalCount after: ${totalAfter} (期待: ${totalBefore + 1})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
