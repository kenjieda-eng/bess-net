/**
 * scripts/post-policy-events-2026-06d.ts
 *
 * 週次政策チェック（2026-06-26 金）追加分。
 *   A. meti-grid-wg11-bess-connection-2026-06
 *      第11回 次世代電力系統WG（系統用蓄電池の迅速な系統連系・空押さえ対策／6/10開催）★★★蓄電池明示
 *   B. meti-reserve-capacity-bid-pubcomm-2026-06
 *      予備電源・容量市場入札GL案 パブコメ（7/5締切・募集中）— 冪等再確認（既投入ならskip）
 *
 * 安全設計:
 *  - 冪等: findBySlug で既存確認、あれば skip（重複作成しない・鉄則#90/#91）。
 *  - L-EIC-026: description は依頼書の全文をそのまま投入。
 *  - select 表示値は schema（microcms-schema-policy-events.json）準拠。
 *  - L-EIC-020（出典の到達性）: 出典URLを GET し status を報告（参考）。
 *    ただし METI(meti.go.jp) は本実行環境から到達不可（timeout/000）のため SKIP ゲートにはしない。
 *    候補A の出典は ユウ＋WebSearch＋一次PDF(011_02_00.pdf) で人手裏取り済（L-EIC-020充足）、
 *    かつ 011.html を本環境で200確認できないため依頼書のフォールバック規則に従い index.html を採用。
 *    候補B(e-gov)は curl 200 確認済。
 *
 * 実行: (env 読込後) npx tsx scripts/post-policy-events-2026-06d.ts [--dry-run]
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
// 出典到達性（参考ログのみ。投入可否ゲートにはしない）
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

type Draft = {
  slug: string; title: string; eventDate: string; eventType: string;
  issuer: string; description: string; sourceUrl: string; status: string; category?: string[];
};

const DRAFTS: Draft[] = [
  // ─── A. ★★★ 第11回 次世代電力系統WG（6/10）──────────────────
  {
    slug: 'meti-grid-wg11-bess-connection-2026-06',
    title:
      '第11回 次世代電力系統WG ─ 系統用蓄電池の迅速な系統連系（空押さえ対策・土地使用権原の要件化を10月1日付規程改正へ）',
    eventDate: '2026-06-10',
    eventType: '公表',
    issuer: 'METI（資源エネルギー庁）',
    status: '終了',
    category: ['重要会議', '公表'],
    description:
      '経済産業省 資源エネルギー庁が第11回 次世代電力系統ワーキンググループ（総合資源エネルギー調査会 省エネルギー・新エネルギー分科会 再生可能エネルギー大量導入・次世代電力ネットワーク小委員会／電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会）を2026年6月10日に開催。資料2-1「系統用蓄電池をはじめとする発電等設備の迅速な系統連系に向けた対応について」で、事業確度が低いまま連系予約を維持する「空押さえ」案件を是正し事業確度の高い事業者が迅速に系統接続できるようにする取組として、発電等設備の契約申込時に事業用地の土地使用権原（使用権を示す書類）の提出を要件化する方針を提示。本年10月1日付（予定）で関係規程類を改正し、同日以降の契約申込み受付分から運用開始する予定。対象は系統用蓄電池に限らず接続検討が必要な全ての新設発電設備だが、案件数が多い系統用蓄電池の連系予約実務（土地の権利書類の準備・申込タイミング）に直結する重要論点。第7回（2026年2月9日）からの継続審議で、4月施行の接続検討早期化運用（既登録 bess-grid-connection-quick-2026-04）に続く第2弾の規律強化。',
    // 依頼書プライマリの 011.html を採用。Node fetch で HTTP 200＋内容（第11回/系統用蓄電池）確認済
    // （Bash curl は本環境で METI timeout だが Node fetch は到達）。一次裏取り: 011_02_00.pdf（6/10・資料2-1）も200。
    sourceUrl: 'https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/smart_power_grid_wg/011.html',
  },
  // ─── B. 7/5締切パブコメ（冪等再確認）────────────────────────
  {
    slug: 'meti-reserve-capacity-bid-pubcomm-2026-06',
    title: '予備電源制度ガイドライン・容量市場における入札ガイドライン（案）等 パブコメ募集',
    eventDate: '2026-06-05',
    eventType: 'パブコメ',
    issuer: 'METI（資源エネルギー庁）',
    status: '進行中',
    category: ['パブコメ', '容量市場'],
    description:
      '経産省 資源エネルギー庁 電力・ガス事業部 電力基盤整備課が公示（任意の意見募集）。次世代電力・ガス事業基盤構築小委員会 電力安定供給WGの「予備電源の第3回以降の募集内容及び容量市場の供給力確保時期の見直しについて（案）」「予備電源制度ガイドライン（案）」「容量市場における入札ガイドライン（案）」の3案が対象。受付＝2026年6月5日23時〜2026年7月5日23時。容量市場の入札ガイドライン・供給力確保時期の見直しは、系統用蓄電池が容量市場・予備電源で収益を積む際のルールに直結。',
    sourceUrl: 'https://public-comment.e-gov.go.jp/servlet/Public?CLASSNAME=PCMMSTDETAIL&id=620226016&Mode=0',
  },
];

async function postOne(draft: Draft): Promise<'ok' | 'skip-dup' | 'err'> {
  try {
    const existing = await findBySlug(draft.slug);
    if (existing) {
      console.log(`  [skip-dup] ${draft.slug} — already exists (id=${existing.id})`);
      return 'skip-dup';
    }
    const probe = await probeUrl(draft.sourceUrl);
    console.log(`  [src] ${draft.slug} sourceUrl HTTP ${probe} : ${draft.sourceUrl}`);
    if (DRY_RUN) {
      console.log(`  [dry-run] POST ${draft.slug}: ${draft.eventDate} [${draft.eventType}/${draft.status}] cat=${(draft.category ?? []).join('・')}`);
      return 'ok';
    }
    const body: Record<string, unknown> = {
      slug: draft.slug, title: draft.title, eventDate: draft.eventDate,
      eventType: [draft.eventType], issuer: draft.issuer, description: draft.description,
      sourceUrl: draft.sourceUrl, status: [draft.status],
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
  console.log(`[post-policy-events-2026-06d] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`policy-events 現在件数: ${totalBefore}`);
  let ok = 0, skipDup = 0, err = 0;
  for (const draft of DRAFTS) {
    const r = await postOne(draft);
    if (r === 'ok') ok++; else if (r === 'skip-dup') skipDup++; else err++;
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }
  console.log(`\n[done] ok=${ok}  skip-dup=${skipDup}  err=${err}`);
  if (!DRY_RUN) {
    const totalAfter = await getTotalCount();
    console.log(`policy-events 件数: ${totalBefore} → ${totalAfter}  差分=+${totalAfter - totalBefore}`);
  }
  process.exit(err > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
