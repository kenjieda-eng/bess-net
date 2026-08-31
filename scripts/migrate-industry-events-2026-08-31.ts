#!/usr/bin/env tsx
/**
 * scripts/migrate-industry-events-2026-08-31.ts
 * microCMS API 統合（11→10）: industry-events 41件 → policy-events（kind=業界）へ POST
 *
 * 前提: EDAさんが管理画面で policy-events にスキーマ追加済み（kind / endDate / venue /
 *       location / registrationDeadline / relatedTopics ＋ eventType に業界5値 ＋ kind 2値）。
 *       industry-events の下書きは 0 件（EDAさん確認）＝公開41件のみで完結。
 *
 * ★#106（未定義の select 値は silently drop される）が最大リスク。
 *   コンテンツAPIキーでは select の選択肢を列挙できない（Management API は 403）ため、
 *   「canary 1件を POST → 全field照合 → 落ちていれば即停止」で実地検証してから残りを流す。
 *   canary は捨てデータではなく本番移行対象の1件目（失敗しても PATCH で補正可能・DELETE 不要）。
 *
 * 冪等（#91）: slug で policy-events を先に引き、既存なら skip（kind の値も報告）。
 * 照合（#106）: POST 後に GET し、送信した全フィールドを比較。配列は「値」と「要素数」の両方。
 * DELETE / PUT は使用しない。category は送らない（空のまま）。
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const DRY = process.argv.includes('--dry-run');
const ONLY_CANARY = process.argv.includes('--canary');
const PE = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;
const IE = `https://${DOMAIN}.microcms.io/api/v1/industry-events`;

type IndustryRec = {
  id: string;
  title: string;
  slug: string;
  eventDate: string;
  endDate?: string;
  venue?: string;
  location?: string;
  eventType?: string[];
  organizer?: string;
  description?: string;
  officialUrl?: string;
  registrationDeadline?: string;
  relatedTopics?: string[];
  status?: string[];
};

/** 4-a のフィールド対応。organizer→issuer / officialUrl→sourceUrl / kind=業界 */
function toPayload(r: IndustryRec): Record<string, unknown> {
  const p: Record<string, unknown> = {
    title: r.title,
    slug: r.slug, // 変更しない
    eventDate: r.eventDate,
    kind: ['業界'],
  };
  if (r.endDate) p.endDate = r.endDate;
  if (r.venue) p.venue = r.venue;
  if (r.location) p.location = r.location;
  if (r.eventType?.length) p.eventType = r.eventType;
  if (r.organizer) p.issuer = r.organizer;
  if (r.description) p.description = r.description;
  if (r.officialUrl) p.sourceUrl = r.officialUrl;
  if (r.registrationDeadline) p.registrationDeadline = r.registrationDeadline;
  if (r.relatedTopics?.length) p.relatedTopics = r.relatedTopics;
  if (r.status?.length) p.status = r.status;
  // category は送らない（空のまま）
  return p;
}

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}

async function fetchAllIndustry(): Promise<IndustryRec[]> {
  const out: IndustryRec[] = [];
  for (let offset = 0; offset < 500; offset += 100) {
    const d = await api<{ totalCount: number; contents: IndustryRec[] }>(
      'GET',
      `${IE}?limit=100&offset=${offset}&orders=eventDate`
    );
    out.push(...d.contents);
    if (out.length >= d.totalCount) break;
  }
  return out;
}

async function findPolicyBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const d = await api<{ contents: Array<Record<string, unknown>> }>(
    'GET',
    `${PE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`
  );
  return d.contents[0] ?? null;
}

/** #106 照合: 送信値と受信値を全フィールド比較。配列は値＋要素数 */
function diffOf(sent: Record<string, unknown>, got: Record<string, unknown> | null): string[] {
  const diffs: string[] = [];
  if (!got) return ['GET で取得できない'];
  for (const [k, v] of Object.entries(sent)) {
    const g = got[k];
    if (Array.isArray(v)) {
      const ga = Array.isArray(g) ? g : null;
      if (!ga) {
        diffs.push(`${k}: 配列でない（受信=${JSON.stringify(g)}）★silently drop の疑い`);
        continue;
      }
      if (ga.length !== v.length) diffs.push(`${k}: 要素数 送信${v.length} → 受信${ga.length}（落ちた値=${JSON.stringify(v.filter((x) => !ga.includes(x)))}）`);
      else if (JSON.stringify(ga) !== JSON.stringify(v)) diffs.push(`${k}: 値 ${JSON.stringify(v)} → ${JSON.stringify(ga)}`);
    } else if (k === 'eventDate' || k === 'endDate' || k === 'registrationDeadline') {
      // date は T00:00:00.000Z 正規化があるため日付部で比較
      if (String(g ?? '').slice(0, 10) !== String(v).slice(0, 10)) diffs.push(`${k}: ${v} → ${g}`);
    } else if (g !== v) {
      diffs.push(`${k}: ${JSON.stringify(v)?.slice(0, 60)} → ${JSON.stringify(g)?.slice(0, 60)}`);
    }
  }
  return diffs;
}

async function migrateOne(r: IndustryRec, label: string): Promise<'ok' | 'skip' | 'err'> {
  const payload = toPayload(r);
  const existing = await findPolicyBySlug(r.slug);
  if (existing) {
    const k = JSON.stringify(existing.kind ?? null);
    console.log(`  [skip] ${label} ${r.slug} — policy-events に既存 (id=${existing.id}, kind=${k})`);
    return 'skip';
  }
  if (DRY) {
    console.log(`  [dry-run] ${label} POST ${r.slug} | ${String(payload.eventType)} | topics=${(payload.relatedTopics as string[] | undefined)?.length ?? 0} | endDate=${payload.endDate ? String(payload.endDate).slice(0, 10) : '—'}`);
    return 'ok';
  }
  const res = await api<{ id: string }>('POST', PE, payload);
  await new Promise((x) => setTimeout(x, 800));
  const got = await findPolicyBySlug(r.slug);
  const diffs = diffOf(payload, got);
  if (diffs.length) {
    console.log(`  [★照合NG] ${label} ${r.slug} (id=${res.id})`);
    diffs.forEach((d) => console.log(`      - ${d}`));
    return 'err';
  }
  console.log(`  [ok] ${label} ${r.slug} — id=${res.id}（#106 全field一致・配列要素数一致）`);
  return 'ok';
}

async function main(): Promise<void> {
  console.log(`[migrate] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}${ONLY_CANARY ? ' (canary のみ)' : ''}`);
  const src = await fetchAllIndustry();
  console.log(`  industry-events 取得: ${src.length} 件`);
  if (src.length !== 41) {
    console.error(`  ★件数が 41 でない → 停止`);
    process.exit(1);
  }

  // canary = relatedTopics が最多の1件（新 eventType・endDate・venue・location も同時に検証）
  const canary = [...src].sort((a, b) => (b.relatedTopics?.length ?? 0) - (a.relatedTopics?.length ?? 0))[0];
  const rest = src.filter((r) => r.slug !== canary.slug);

  console.log(`\n■ canary（選択肢が silently drop されないかの実地検証）: ${canary.slug}`);
  console.log(`   eventType=${JSON.stringify(canary.eventType)} relatedTopics=${JSON.stringify(canary.relatedTopics)}`);
  const c = await migrateOne(canary, '[canary]');
  if (c === 'err') {
    console.error('\n★ canary で差分検出 → 残り40件は投入せず停止（スキーマの選択肢を確認してください）');
    process.exit(1);
  }
  if (ONLY_CANARY) {
    console.log('\n--canary 指定のためここで終了');
    return;
  }

  console.log(`\n■ 残り ${rest.length} 件`);
  let ok = c === 'ok' ? 1 : 0, skip = c === 'skip' ? 1 : 0, err = 0;
  for (const [i, r] of rest.entries()) {
    const v = await migrateOne(r, `[${i + 2}/41]`);
    if (v === 'ok') ok++; else if (v === 'skip') skip++; else { err++; console.error('  ★差分検出 → 以降を中止'); break; }
    await new Promise((x) => setTimeout(x, 400));
  }

  console.log(`\n[done] ok=${ok} skip=${skip} err=${err}`);
  const pe = await api<{ totalCount: number }>('GET', `${PE}?limit=0`);
  console.log(`[policy-events 総件数] ${pe.totalCount}（54 + 41 = 95 が想定）`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

export {};
