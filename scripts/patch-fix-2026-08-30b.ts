#!/usr/bin/env tsx
/**
 * scripts/patch-fix-2026-08-30b.ts — 8/30便の是正（policy description・projects 出力桁）
 *
 * ■ 1. policy-events pubcom-fit-fip-rule-amendment-202608 の description を趣旨ベースに書き直す
 *   e-Gov 620340004 の意見公募要領PDF（seqNo=0000319480）「1．意見公募の趣旨・目的・背景」を
 *   一次で確認した結果、趣旨は「風力発電設備への廃棄等費用積立制度の導入に係る改正規定の施行に
 *   伴う様式改正」であり蓄電池は対象外（＝2026-08-21 の週次政策便 §3「登録しない」判定と同一根拠）。
 *   8/30 便の description は様式欄の実在だけを書いており「蓄電池に関わる改正」と読めるため是正する。
 *   ★ description のみ。title・eventType・category・status・sourceUrl は変えない
 *
 * ■ 2. projects pr-co161802-kumamoto の outputMw を 1.988 → 1.998 に是正
 *   一次（PR TIMES 000000102.000161802・2026-08-19）の施設概要表が「1,998kW・8,146kWh」。
 *   再取得して 1,998kW（1,988 は 0 ヒット）を確認済み。capacityMwh 8.146 は変更しない
 *
 * 冪等（#91）: 現値が既に正なら skip。PATCH 前後 GET 全 field 照合（#106）。DELETE/PUT 不使用
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const DRY = process.argv.includes('--dry-run');
const HDR = { 'X-MICROCMS-API-KEY': KEY };
const SYS = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

/** 意見公募要領PDF「1．意見公募の趣旨・目的・背景」の逐語（全角数字も原文のまま） */
const SHUSHI =
  '資源エネルギー庁では、再生可能エネルギー電気の利用の促進に関する特別措置法施行規則の一部を改正する省令（令和８年経済産業省令第２９号）のうち、風力発電設備への廃棄等費用積立制度の導入に係る改正規定の施行に伴い、必要な様式改正に向けた検討を行いました。';

const NEW_DESCRIPTION =
  '案件番号 620340004。公示 2026-08-14、受付締切 2026-09-12 23:59。' +
  '意見公募要領 1．意見公募の趣旨・目的・背景（逐語）は「' + SHUSHI + '」。' +
  '改正案の様式には蓄電池の位置・区分計量の可否・系統からの充電の有無といった記載欄が含まれるが、' +
  'これは既存様式の踏襲であり、本改正の対象ではない（意見公募要領の趣旨で確認）。' +
  '系統用蓄電池事業者に直接の影響はない見込み。';

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { ...HDR };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}

async function one(
  endpoint: string,
  slug: string,
  field: string,
  next: unknown
): Promise<'ok' | 'skip' | 'err'> {
  const base = `https://${DOMAIN}.microcms.io/api/v1/${endpoint}`;
  const list = await api<{ contents: Array<Record<string, unknown>> }>(
    'GET',
    `${base}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`
  );
  const before = list.contents[0];
  if (!before) {
    console.log(`  [★NG] ${endpoint}/${slug} が見つからない`);
    return 'err';
  }
  if (JSON.stringify(before[field]) === JSON.stringify(next)) {
    console.log(`  [skip] ${slug}.${field} は既に正（冪等 #91）: ${JSON.stringify(next).slice(0, 60)}`);
    return 'skip';
  }
  console.log(`  [PATCH] ${slug}.${field}`);
  console.log(`     前: ${JSON.stringify(before[field]).slice(0, 120)}`);
  console.log(`     後: ${JSON.stringify(next).slice(0, 120)}`);
  if (DRY) return 'ok';

  await api('PATCH', `${base}/${before.id}`, { [field]: next });
  await new Promise((r) => setTimeout(r, 800));
  const after = (
    await api<{ contents: Array<Record<string, unknown>> }>(
      'GET',
      `${base}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`
    )
  ).contents[0];

  // #106: 対象フィールドの実反映 ＋ 他フィールドの不変
  const applied = JSON.stringify(after[field]) === JSON.stringify(next);
  const others: string[] = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (SYS.has(k) || k === field) continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) others.push(k);
  }
  const ok = applied && others.length === 0;
  console.log(`     照合: ${ok ? '✓' : '★NG'} 反映=${applied} 他フィールド変化=${others.length ? others.join(',') : '0'}（#106）`);
  return ok ? 'ok' : 'err';
}

async function main(): Promise<void> {
  console.log(`[fix-0830b] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  let err = 0;

  console.log('■ 1. policy-events description');
  if ((await one('policy-events', 'pubcom-fit-fip-rule-amendment-202608', 'description', NEW_DESCRIPTION)) === 'err') err++;

  console.log('■ 2. projects outputMw');
  if ((await one('projects', 'pr-co161802-kumamoto', 'outputMw', 1.998)) === 'err') err++;

  // 件数の不変確認
  const pe = await api<{ totalCount: number }>('GET', `https://${DOMAIN}.microcms.io/api/v1/policy-events?limit=0`);
  const pj = await api<{ totalCount: number }>('GET', `https://${DOMAIN}.microcms.io/api/v1/projects?limit=0`);
  console.log(`[件数] policy-events=${pe.totalCount}（54 のまま） / projects=${pj.totalCount}（330 のまま）`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

export {};
