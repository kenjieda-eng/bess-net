/**
 * scripts/post-policy-events-2026-06c.ts
 *
 * 週次政策チェック（2026-06-26 金）追加分 2件
 *
 *   A. capacity-outage-plan-briefing-2026-06
 *      OCCTO 容量市場 実務説明会（容量停止計画の調整業務／対象2028年度）（6/26開催）
 *   B. occto-balancing-committee-61-2026-06
 *      第61回 需給調整市場検討小委員会（第78回 作業会と合同、6/9）遡及
 *
 * 現在件数: 31（前作業 06b で 29→31）→ 本作業で最大 31→33
 *
 * 安全設計:
 *  - 冪等: findBySlug で既存確認、あれば skip（重複作成しない）。
 *  - L-EIC-019/020: POST 前に sourceUrl を GET し HTTP 200 のものだけ投入。
 *    200 以外（404/不達）は skip して報告（壊れた出典を作らない）。
 *  - L-EIC-026: description は依頼書の全文をそのまま投入。
 *  - select 表示値は schema（microcms-schema-policy-events.json）準拠。
 *  - A.status: 6/26 14:00-15:30 開催。07:53 JST（15:30 前）投入＝「予定」。
 *
 * 実行: npx tsx scripts/post-policy-events-2026-06c.ts [--dry-run]
 */

// モジュール化（top-level import/export がないと script 扱い＝global scope となり、
// 他 script の const SERVICE_DOMAIN/API_KEY と "Cannot redeclare" 衝突 → build 失敗。
// 06b は import {} from 'node:process' で回避していた。本ファイルは export {} で明示。
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

// L-EIC-019/020: sourceUrl の到達性確認（200 のみ投入可）
async function checkSourceUrl(url: string): Promise<number> {
  try {
    const resp = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (bess-net policy-calendar verify)' },
    });
    return resp.status;
  } catch {
    return 0; // 不達
  }
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
  // ─── A. 今週の本命・本日開催（OCCTO 容量市場 実務説明会） ──────────
  {
    slug: 'capacity-outage-plan-briefing-2026-06',
    title:
      '容量市場 実務説明会（容量停止計画の調整業務）（対象実需給年度：2028年度）',
    eventDate: '2026-06-26',
    eventType: '重要会議',
    issuer: 'OCCTO',
    status: '予定',
    category: ['容量市場', '長期脱炭素オークション'],
    description:
      'OCCTOが容量市場の実務説明会（容量停止計画の調整業務／対象実需給年度2028年度）を開催。Web開催（Webex）、2026年6月26日（金）14時〜15時30分。「容量市場業務マニュアル 容量停止計画の調整業務編（実需給年度の2年度前に行う調整／対象2026年度以降）」改訂版、および「長期脱炭素電源オークション（別冊）容量停止計画の調整業務」に基づき、容量停止計画の調整に必要な手続きと容量市場システムの操作手順を説明する。参加申込期日は2026年6月24日（水）15時（先着・定員制）。終了後に録画を公開予定。容量市場・長期脱炭素電源オークションで容量収入を得る系統用蓄電池の運用実務（計画停止の届出・調整）に直結する説明会。',
    sourceUrl: 'https://www.occto.or.jp/news/012415.html',
  },

  // ─── B. 遡及・推奨（第61回 需給調整市場検討小委） ──────────────
  {
    slug: 'occto-balancing-committee-61-2026-06',
    title:
      '第61回 需給調整市場検討小委員会（第78回 調整力の細分化・広域調達作業会と合同開催）',
    eventDate: '2026-06-09',
    eventType: '重要会議',
    issuer: 'OCCTO',
    status: '終了',
    category: ['需給調整市場', '重要会議'],
    description:
      'OCCTOが第61回需給調整市場検討小委員会（第78回 調整力の細分化及び広域調達の技術的検討に関する作業会と合同）を開催（2026年6月9日18時〜20時、Web併用）。議題は①需給調整市場の取引状況等について、②調整力指令と出力制御指令が重複した場合の取り扱いについて。②は再エネ出力制御指令と調整力供出指令が同時に発生した場合の優先順位・運用整理であり、需給調整市場へ調整力を供出する系統用蓄電池・アグリゲーターの運用に影響しうる論点。配布資料・録画はOCCTO委員会ページで公開。',
    sourceUrl: 'https://www.occto.or.jp/iinkai/jukyuchousei/61.html',
  },
];

async function postOne(draft: Draft): Promise<'ok' | 'skip-dup' | 'skip-url' | 'err'> {
  try {
    // 1) 冪等: 既存 slug は skip
    const existing = await findBySlug(draft.slug);
    if (existing) {
      console.log(`  [skip-dup] ${draft.slug} — already exists (id=${existing.id})`);
      return 'skip-dup';
    }

    // 2) L-EIC-019/020: sourceUrl 200 でなければ skip（壊れた出典を作らない）
    const code = await checkSourceUrl(draft.sourceUrl);
    if (code !== 200) {
      console.log(`  [skip-url] ${draft.slug} — sourceUrl HTTP ${code}: ${draft.sourceUrl}`);
      return 'skip-url';
    }
    console.log(`  [url-ok] ${draft.slug} — sourceUrl HTTP 200`);

    if (DRY_RUN) {
      console.log(
        `  [dry-run] POST ${draft.slug}: ${draft.eventDate} [${draft.eventType}/${draft.status}] ` +
        `cat=${(draft.category ?? []).join('・')} ${draft.title.slice(0, 40)}`
      );
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
  console.log(`[post-policy-events-2026-06c] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`policy-events 現在件数: ${totalBefore}`);

  let ok = 0, skipDup = 0, skipUrl = 0, err = 0;
  for (const draft of DRAFTS) {
    const r = await postOne(draft);
    if (r === 'ok') ok++;
    else if (r === 'skip-dup') skipDup++;
    else if (r === 'skip-url') skipUrl++;
    else err++;
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\n[done] ok=${ok}  skip-dup=${skipDup}  skip-url=${skipUrl}  err=${err}`);

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
