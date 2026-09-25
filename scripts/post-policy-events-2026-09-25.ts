#!/usr/bin/env tsx
/**
 * scripts/post-policy-events-2026-09-25.ts — 金曜ワンセット#7 ③（週次政策 2026-09-25 実施分）
 *
 * 原稿: OneDrive 03_5月13日朝_実行/週次政策_policy-calendar投入_2026-09-25.md §2（POST 1）・§3（PATCH 2）
 * POST : meti-haishutsuryo-torihiki-shoiinkai-9-2026-09（第9回 排出量取引制度小委員会・9/25）
 * PATCH: A meti-doji-shijo-kentoukai-25-2026-09（id lkuuuf36h）status 終了＋sourceUrl 差替＋description 末尾1文置換
 *        B pubcom-baseload-market-guideline-202608（id 22csj0vxc）status 終了（既に終了なら skip）
 *
 * ★原稿からの変更点（本 run で一次をブラウザ取得して是正。報告に明記する）:
 *   1. issuer の所管室名を一次の逐語へ。開催案内ページのお問合せ先は
 *      「イノベーション・環境局 GXG環境政策課環境経済室」（原稿は「GXグループ環境経済室」）。
 *   2. description から内部運用メモ「（未登録・10/1月次バッチで遡及登録予定）」を削除。
 *      公開本文に社内メモを載せない（Ck-1b §2 で 28 件を是正した同型）。
 *   3. description の当サイト解説の題名を実在の逐語へ。
 *      「EU ETSとGX-ETSがBESSに与える3つの意味」→「EU ETSとGX-ETS ─ 排出量取引は蓄電池ビジネスに何をもたらすか」
 *      （explainer/eu-ets-and-gx-ets-for-bess・microCMS GET で確認）。
 *   4. 一次で裏の取れない語を削除: 排出枠の呼称「（GXダッシュ）」、配布資料の推測パス「（emissions_trading/009.html見込み）」。
 *
 * ★#106: eventType / status / category は配列で送る。live の実使用値のみ
 *        （status: 予定42/終了64/進行中6、eventType: 重要会議26、category: 重要会議29・公表14）。
 * ★#122: description は textArea（richEditor ではない）だが、PATCH の置換は置換元が一意のときだけ実行する。
 * ★冪等: POST は slug 既存なら skip。PATCH は現在値が期待値と違えば中止して報告。DELETE / PUT なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/post-policy-events-2026-09-25.ts [--dry-run]
 */
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const EP = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;

type Rec = Record<string, unknown> & { id: string; slug: string };

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const bySlug = async (slug: string): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${EP}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const byId = (id: string) => api<Rec>('GET', `${EP}/${id}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);

// ── §2 POST 1 件 ─────────────────────────────────────────────
const POST_ROW: Record<string, unknown> & { slug: string } = {
  slug: 'meti-haishutsuryo-torihiki-shoiinkai-9-2026-09',
  title:
    '第9回 排出量取引制度小委員会: 上下限価格に係る事項（みなし保有措置・リバースオークションの方法等／GX推進機構が実施する下限価格に係る措置の具体）',
  eventDate: '2026-09-25',
  eventType: ['重要会議'],
  issuer:
    '経済産業省 産業構造審議会 イノベーション・環境分科会 排出量取引制度小委員会（イノベーション・環境局 GXG環境政策課環境経済室）',
  description:
    '経済産業省の産業構造審議会 イノベーション・環境分科会 排出量取引制度小委員会が2026年9月25日（金）13時〜15時に経済産業省別館227会議室で開催される（議題1は公開・配信、議題2は非公開）。議題は (1) みなし保有措置やリバースオークションの方法等について（排出枠の上下限価格制度の運用設計）、(2) GX推進機構が実施する下限価格に係る措置の具体について（非公開）。本委員会はGX-ETS（GX推進法に基づく排出量取引制度）の本格稼働（2026年度〜）に向けた制度詳細を検討する場で、直近の第8回は2026年8月26日開催。排出枠の価格に上限・下限を設ける仕組みが検討されており、下限価格はGX推進機構による吸収措置（買い支え的な性格）が想定される。系統用蓄電池にとってはGX-ETSの炭素価格が火力電源の限界費用（＝卸電力市場の価格形成）に波及する経路で間接的に収益機会に影響するほか、GXフューチャー・リーグ等の補助金要件・脱炭素価値の訴求にも関わる論点（解説「EU ETSとGX-ETS ─ 排出量取引は蓄電池ビジネスに何をもたらすか」と同一の制度トラック）。配布資料は議題2が非公開のため一部のみ、または開催後に委員会ページで公開される可能性がある。',
  sourceUrl: 'https://www.meti.go.jp/shingikai/information/2026/20260925_3k.html',
  status: ['予定'],
  category: ['重要会議', '公表'],
  kind: [],
  relatedTopics: [],
  eventTopics: [],
};

// ── §3 PATCH 2 件 ────────────────────────────────────────────
const PATCH_A = {
  id: 'lkuuuf36h',
  slug: 'meti-doji-shijo-kentoukai-25-2026-09',
  expect: {
    status: ['予定'],
    sourceUrl: 'https://www.meti.go.jp/shingikai/information/2026/20260914_3k.html',
  },
  set: {
    status: ['終了'],
    sourceUrl: 'https://www.meti.go.jp/shingikai/energy_environment/doji_shijo_kento/025.html',
  },
  replace: {
    old: '配布資料は開催後に検討会ページ（doji_shijo_kento/025.html）で公開見込み。',
    // ★資料4 の題名は一次（025.html）の逐語「第1フェーズの検討進捗状況」（原稿の「〜について」は一次に無い）
    new: '配布資料（資料3「技術研究の進め方について」・資料4「第1フェーズの検討進捗状況」・資料5「詳細業務設計の進捗報告（事業者アンケート・ヒアリングについて）」等）が検討会ページ（doji_shijo_kento/025.html）で公開された。',
  },
  why: '一次 https://www.meti.go.jp/shingikai/energy_environment/doji_shijo_kento/025.html をブラウザで本文取得（METI は curl に 202/403）。<title>「第25回 同時市場の在り方等に関する検討会（METI/経済産業省）」、開催日 2026年9月14日、資料1〜5・参考資料1〜3 の掲載を確認。',
};

const PATCH_B = {
  id: '22csj0vxc',
  slug: 'pubcom-baseload-market-guideline-202608',
  expect: { status: ['進行中'] },
  set: { status: ['終了'] },
  why: '一次 e-Gov 案件 620340006 をブラウザで確認。「受付締切」「※この案件については、すでに意見募集は終了していますので、意見・情報の提出はできません。」「受付締切日時 2026年9月24日23時59分」を逐語で取得。',
};

let posted = 0, patched = 0, skipped = 0, failed = 0;

async function runPost(): Promise<void> {
  console.log(`\n■ POST ${POST_ROW.slug}`);
  const cur = await bySlug(POST_ROW.slug);
  if (cur) { console.log(`   [skip] 既存あり（id=${cur.id}）`); skipped++; return; }
  for (const [k, v] of Object.entries(POST_ROW)) {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    console.log(`   ${k}: ${s.length > 110 ? `${s.slice(0, 110)}…（${s.length}字）` : s}`);
  }
  if (DRY) { posted++; return; }
  const res = await api<{ id: string }>('POST', EP, POST_ROW);
  await sleep(900);
  const after = await bySlug(POST_ROW.slug);
  const diffs: string[] = [];
  for (const [k, v] of Object.entries(POST_ROW)) {
    if (norm(after?.[k]) !== norm(v)) diffs.push(`${k}: 送信=${norm(v).slice(0, 60)} 保存=${norm(after?.[k]).slice(0, 60)}`);
  }
  console.log(diffs.length === 0
    ? `   #106: ✓ 全 ${Object.keys(POST_ROW).length} field 一致（id=${res.id}）`
    : `   #106: 差分 ${diffs.length} 件 → ${diffs.join(' / ')}`);
  if (diffs.length === 0 || diffs.every((d) => d.startsWith('eventDate'))) posted++; else failed++;
}

async function runPatch(p: typeof PATCH_A | typeof PATCH_B): Promise<void> {
  console.log(`\n■ PATCH ${p.slug}（id ${p.id}）`);
  const before = await byId(p.id);
  for (const [k, v] of Object.entries(p.expect)) {
    if (norm(before[k]) !== norm(v)) {
      console.log(`   [中止] 現在値が原稿と不一致: ${k} 現在=${norm(before[k])} 期待=${norm(v)}`);
      skipped++; return;
    }
  }
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p.set)) {
    if (norm(before[k]) === norm(v)) { console.log(`   ${k}: ${norm(v)} [同値・skip]`); continue; }
    payload[k] = v;
    console.log(`   ${k}: 前 ${norm(before[k])} → 後 ${norm(v)}`);
  }
  const rep = (p as typeof PATCH_A).replace;
  const desc = String(before.description ?? '');
  if (rep) {
    const n = count(desc, rep.old);
    if (n === 0 && desc.includes(rep.new)) console.log('   description: 置換済み（冪等）');
    else if (n !== 1) { console.log(`   [見送り] description: 置換元が ${n} 箇所（一意でない）`); skipped++; return; }
    else {
      payload.description = desc.replace(rep.old, rep.new);
      console.log(`   description: 末尾1文を置換（${desc.length}→${String(payload.description).length}字）`);
    }
  }
  if (Object.keys(payload).length === 0) { console.log('   [skip] 変更なし（冪等）'); skipped++; return; }
  console.log(`   根拠: ${p.why}`);
  if (DRY) { patched++; return; }
  await api('PATCH', `${EP}/${p.id}`, payload);
  await sleep(900);
  const after = await byId(p.id);
  let other = 0;
  for (const k of Object.keys(before)) {
    if (['updatedAt', 'revisedAt'].includes(k)) continue;
    if (k in payload) continue;
    if (norm(before[k]) !== norm(after[k])) { other++; console.log(`   ★他フィールド変化: ${k}`); }
  }
  const okSet = Object.entries(payload).every(([k, v]) => norm(after[k]) === norm(v));
  console.log(`   #106: ${okSet ? '✓ 対象フィールド反映' : '★NG 反映されていない'}・他フィールド変化 ${other}`);
  if (okSet && other === 0) patched++; else failed++;
}

async function main(): Promise<void> {
  console.log(`[金曜#7 ③ policy-events] mode=${DRY ? 'DRY-RUN' : '本実行'}`);
  await runPost();
  await runPatch(PATCH_A);
  await runPatch(PATCH_B);
  console.log(`\n[done] POST ${posted} / PATCH ${patched} / skip ${skipped} / 失敗 ${failed}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
