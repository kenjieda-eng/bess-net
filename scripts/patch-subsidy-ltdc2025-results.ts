/**
 * scripts/patch-subsidy-ltdc2025-results.ts
 *
 * 長期脱炭素電源オークション（応札年度：2025年度）約定結果反映（2026-07-06 月曜定例）。
 * microCMS subsidies id=ds9ttcdaq（slug=occto-ltdc-2025）を PATCH 1件のみ。
 *
 * 安全設計:
 *  - 冪等: PATCH 前に GET で slug 一致を確認。PATCH 後 GET で反映値を検証（#91）。
 *  - status「採択結果公表」は既存使用実績あり（subsidies select は未定義値を silently drop するため要検証）。
 *  - id / slug / category / fiscalYear / subsidyRate / upperLimit は変更しない。
 *  - deadline は「2026年5月13日（約定結果公表）」→ precompute が deadline_iso=2026-05-13 を導出。
 *
 * 実行: npx tsx --env-file=.env.local scripts/patch-subsidy-ltdc2025-results.ts [--dry-run]
 */
export {};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }

const ID = 'ds9ttcdaq';
const EXPECT_SLUG = 'occto-ltdc-2025';
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/subsidies`;

const PATCH_FIELDS = {
  name: '長期脱炭素電源オークション（応札年度：2025年度）約定結果',
  status: ['採択結果公表'] as string[],
  targetEntity: '脱炭素電源（蓄電池・水素・原子力等）事業者（落札事業者）',
  applicationStart: '2025年10月（参加登録）・2026年1月（応札）',
  deadline: '2026年5月13日（約定結果公表）',
  sourceUrl: 'https://www.occto.or.jp/various/capacity-market/jitsujukyukanren/2025_boshuyoukou_long.html',
  scheme:
    '2025年度応札の長期脱炭素電源オークション約定結果（2026年5月13日公表）。約定総容量729.9万kW（脱炭素電源426.1万kW＋LNG専焼火力303.8万kW、落札率67%）。蓄電池は応札125.1万kW・落札率46%。「リチウムイオン蓄電池・揚水（新設除く）」区分の約定は81.9万kW、「リチウムイオン以外の蓄電池・揚水（新設）・LDES」区分は88.6万kW。容量確保契約の結果公表は2026年8月頃予定。',
};

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

async function main(): Promise<void> {
  const before = (await apiFetch('GET', `${BASE}/${ID}`)) as Record<string, unknown>;
  if (before.slug !== EXPECT_SLUG) {
    throw new Error(`ABORT: id=${ID} の slug が期待値と不一致 (got=${before.slug}, expect=${EXPECT_SLUG})`);
  }
  console.log(`before: name=${before.name} status=${JSON.stringify(before.status)} deadline=${before.deadline}`);

  if (DRY_RUN) {
    console.log('--dry-run: PATCH payload ↓');
    console.log(JSON.stringify(PATCH_FIELDS, null, 2));
    return;
  }

  await apiFetch('PATCH', `${BASE}/${ID}`, PATCH_FIELDS);
  const after = (await apiFetch('GET', `${BASE}/${ID}`)) as Record<string, unknown>;
  const checks: Array<[string, boolean]> = [
    ['name', after.name === PATCH_FIELDS.name],
    ['status', Array.isArray(after.status) && (after.status as string[])[0] === '採択結果公表'],
    ['targetEntity', after.targetEntity === PATCH_FIELDS.targetEntity],
    ['applicationStart', after.applicationStart === PATCH_FIELDS.applicationStart],
    ['deadline', after.deadline === PATCH_FIELDS.deadline],
    ['sourceUrl', after.sourceUrl === PATCH_FIELDS.sourceUrl],
    ['scheme', after.scheme === PATCH_FIELDS.scheme],
    ['slug不変', after.slug === EXPECT_SLUG],
    ['fiscalYear不変', after.fiscalYear === before.fiscalYear],
  ];
  let ok = true;
  for (const [label, pass] of checks) {
    console.log(`  ${pass ? 'OK' : 'NG'}: ${label}`);
    if (!pass) ok = false;
  }
  if (!ok) { console.error('VERIFY FAILED'); process.exit(2); }
  console.log('PATCH OK + verify PASS (1 PATCH のみ)');
}

main().catch((e) => { console.error(e); process.exit(1); });
