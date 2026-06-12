/**
 * scripts/post-policy-events-2026-06b.ts
 *
 * 週次政策チェック（2026-06-12 金）追加分 2件
 *
 *   ① meti-reserve-capacity-bid-pubcomm-2026-06
 *      予備電源制度GL・容量市場入札GL案 パブコメ（募集中、7/5締切）
 *   ② ltdc-3-auction-result-2026-05
 *      長期脱炭素電源オークション第3回 約定結果公表（OCCTO、5/13）
 *
 * 現在件数: 29（前作業で 27→29 済）→ 本作業で 29→31
 *
 * 冪等設計: findBySlug で既存確認、あれば skip。
 * 実行: npx tsx scripts/post-policy-events-2026-06b.ts [--dry-run]
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

async function apiFetch(method: string, url: string, body?: unknown): Promise<unknown> {
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

async function findBySlug(slug: string): Promise<{ id: string } | null> {
  const url = `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id&limit=1`;
  const data = (await apiFetch('GET', url)) as { contents: { id: string }[] };
  return data.contents[0] ?? null;
}

async function getTotalCount(): Promise<number> {
  const data = (await apiFetch('GET', `${BASE}?limit=1`)) as { totalCount: number };
  return data.totalCount;
}

type Draft = {
  slug: string;
  title: string;
  eventDate: string;
  eventType: string;
  issuer: string;
  description: string;
  sourceUrl: string;
  status: string;
  category?: string[];
};

const DRAFTS: Draft[] = [
  // ─── ① パブコメ（募集中・7/5締切） ────────────────────────
  {
    slug: 'meti-reserve-capacity-bid-pubcomm-2026-06',
    title: '予備電源制度ガイドライン・容量市場における入札ガイドライン（案）等 パブコメ募集',
    eventDate: '2026-06-05',
    eventType: 'パブコメ',
    issuer: 'METI（資源エネルギー庁）',
    description:
      '経産省 資源エネルギー庁 電力・ガス事業部 電力基盤整備課が公示（任意の意見募集）。次世代電力・ガス事業基盤構築小委員会 電力安定供給WGの「予備電源の第3回以降の募集内容及び容量市場の供給力確保時期の見直しについて（案）」「予備電源制度ガイドライン（案）」「容量市場における入札ガイドライン（案）」の3案が対象。受付＝2026/6/5 23時〜2026/7/5 23時。容量市場の入札ガイドライン・供給力確保時期の見直しは、系統用蓄電池が容量市場・予備電源で収益を積む際のルールに直結。',
    sourceUrl:
      'https://public-comment.e-gov.go.jp/servlet/Public?CLASSNAME=PCMMSTDETAIL&id=620226016&Mode=0',
    status: '進行中',
    category: ['パブコメ', '容量市場'],
  },

  // ─── ② LTDC 第3回 約定結果（5/13公表） ───────────────────
  {
    slug: 'ltdc-3-auction-result-2026-05',
    title: '長期脱炭素電源オークション 約定結果公表（応札年度：2025年度／第3回）',
    eventDate: '2026-05-13',
    eventType: '公表',
    issuer: 'OCCTO',
    description:
      'OCCTOが業務規程32条の18等に基づき、長期脱炭素電源オークション（応札年度2025年度＝第3回。応札開始は2026-01、別イベントで登録済）の約定結果と落札電源一覧（別紙）を公表。落札事業者は容量確保契約書の締結手続きへ（5/28以降に確認依頼を順次通知）。長期脱炭素電源オークションは系統用蓄電池（長期固定電源）も応札可能で、落札BESSは長期の容量収入を確保できる制度。',
    sourceUrl: 'https://www.occto.or.jp/news/012080.html',
    status: '終了',
    category: ['長期脱炭素オークション', '公表'],
  },
];

async function postOne(draft: Draft): Promise<'ok' | 'skip' | 'err'> {
  try {
    const existing = await findBySlug(draft.slug);
    if (existing) {
      console.log(`  [skip] ${draft.slug} — already exists (id=${existing.id})`);
      return 'skip';
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] POST ${draft.slug}: ${draft.eventDate} [${draft.eventType}] ${draft.title.slice(0, 50)}`);
      return 'ok';
    }

    const body: Record<string, unknown> = {
      slug: draft.slug,
      title: draft.title,
      eventDate: draft.eventDate,
      eventType: [draft.eventType],
      issuer: draft.issuer,
      description: draft.description,
      sourceUrl: draft.sourceUrl,
      status: [draft.status],
    };
    if (draft.category && draft.category.length > 0) body.category = draft.category;

    const result = (await apiFetch('POST', BASE, body)) as { id: string };
    console.log(`  [ok] ${draft.slug} — created id=${result.id}`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${draft.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

async function main(): Promise<void> {
  const totalBefore = await getTotalCount();
  console.log(`[post-policy-events-2026-06b] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`policy-events 現在件数: ${totalBefore}`);

  let ok = 0, skip = 0, err = 0;
  for (const draft of DRAFTS) {
    const r = await postOne(draft);
    if (r === 'ok') ok++;
    else if (r === 'skip') skip++;
    else err++;
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\n[done] ok=${ok}  skip=${skip}  err=${err}`);

  if (!DRY_RUN) {
    const totalAfter = await getTotalCount();
    console.log(`policy-events 件数: ${totalBefore} → ${totalAfter}  差分=+${totalAfter - totalBefore}`);
  }

  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
