/**
 * scripts/post-policy-events-2026-06.ts
 *
 * policy-calendar 2件追加（2026-06-12 追加分）
 *
 *   1. 需給調整市場 2026年度改革（2026-03-13、METI）
 *   2. 系統用蓄電池の迅速な系統連系（2026-04-01、METI）
 *
 * 冪等設計: findBySlug で既存確認、あれば skip。
 * eventType: スキーマ選択肢「法改正/パブコメ/重要会議/オークション/公表」より "法改正" を使用
 *            （スキーマに "制度改定" は存在しない）
 *
 * 実行:
 *   npx tsx scripts/post-policy-events-2026-06.ts [--dry-run]
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
  eventType: string;  // POST時に [eventType] に変換
  issuer: string;
  description: string;
  sourceUrl: string;
  status: string;     // POST時に [status] に変換
  category?: string[];
};

const DRAFTS: Draft[] = [
  // ─── 1. 需給調整市場 2026年度改革 ───────────────────────────
  {
    slug: 'balancing-market-reform-2026-03',
    title: '需給調整市場 2026年度改革 ─ 全商品前日取引化＋募集量1σ＋上限価格引下げ＋ガイドライン改定',
    eventDate: '2026-03-13',
    eventType: '法改正',
    issuer: 'METI',
    description:
      '2026年3月13日、経済産業省の審議会（系統ワーキンググループ第109回）が需給調整市場の2026年度以降の改革方針を決定。①全商品の前日取引化（同日取引廃止）②需給バランスに応じた募集量1σへの統一③上限価格引下げ④運用ガイドライン改定の4点が確定。蓄電所事業者の入札スケジュール・運用最適化・収益計画に直接影響する制度改定。',
    sourceUrl:
      'https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/system_review/pdf/109_06_00.pdf',
    status: '終了',
    category: ['需給調整市場'],
  },

  // ─── 2. 系統用蓄電池の迅速な系統連系 ────────────────────────
  {
    slug: 'bess-grid-connection-quick-2026-04',
    title: '系統用蓄電池の迅速な系統連系 ─ 接続検討の早期化運用変更＋暫定空押さえ対策（2026年4月〜）',
    eventDate: '2026-04-01',
    eventType: '法改正',
    issuer: 'METI',
    description:
      '2026年4月から、経済産業省が系統用蓄電池の迅速な系統連系を実現するための運用変更を施行。①接続検討の早期化（申込前相談の簡素化・審査期間の短縮）②暫定空押さえへの対策（期限付き権利確保・確認手続き強化）の2本柱。系統連系リードタイムの短縮により、蓄電所事業者の案件組成コスト削減・収益化前倒しに直結する重要運用変更。',
    sourceUrl:
      'https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/smart_power_grid_wg/pdf/007_01_01.pdf',
    status: '終了',
    category: ['法改正'],
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
  console.log(`[post-policy-events-2026-06] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
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
