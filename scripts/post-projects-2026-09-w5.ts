#!/usr/bin/env tsx
/**
 * scripts/post-projects-2026-09-w5.ts — 金曜ワンセット#5 ⑤ projects 連動（承認済み例外・差分限定・#106）
 *
 * ■ 実査結果（2026-09-05・GET 全件＋一次照合）
 *   徳島板野: 「新規候補」だったが、**既存レコードが同一案件で存在**（9/3 恒久策＝同定確認を先に）
 *     - pr-co149815-bess … 2/20 参入発表（PR 000000013.000149815）由来。徳島大正銀行名義・所在地空・1.99MW/8.226MWh
 *       → 同一案件。**差分 PATCH**（新規 POST はしない）
 *     - pr-co92942-bess  … 同日の Sustech アグリ受託発表由来（徳島県・1.99MW/8.226MWh）→ 同一案件の二重登載。
 *       ★301 集約の候補として報告のみ（コード変更＝本便の承認範囲外）
 *     - pr-sustech-bess（GSユアサ×Sustech 1.3MW/4.2MWh）・pr-co143072-bess-2（テスHD 徳島市・板野町）は別案件
 *   グローム: 豊岡1号・西方町第2号とも projects に**不在** → 西方町第2号のみ新規 POST（指示どおり）
 *   コレック岡山: 9/1 登録済み（correc-okayama-kumegun-bess）→ 触らない
 *
 * ■ 一次照合で確定した値（原文優先・推測で埋めない）
 *   徳島板野（Sustech PR 000000090.000092942 ＋ 徳島大正銀行 PDF news_260901.pdf）
 *     - 施設固有名: なし（両一次とも「本蓄電所」「系統用蓄電所」）→ #4 便 SOP⑤の規則「（事業者名）＋市町村」で命名
 *     - 所在地: 「徳島県板野郡」まで（町名は両一次に記載なし）→ city は「板野郡」（一次の粒度・推測で町を足さない）
 *     - 定格出力 1,990kW／蓄電池公称容量 8,226kWh（Sustech 概要表）＝既存値と一致
 *     - 竣工: 「令和８年８月31日に竣工」（徳島大正銀行 PDF）。Sustech 側は「完工し、竣工セレモニー」のみで日付なし
 *     - ★運転開始／稼働開始の語は両一次とも**なし** → 実測分岐: status は現状（稼働中）を変更せず、cod も触らない
 *       （竣工日を cod に入れない＝Pj2-B #53「完工≠運開」。現 cod 2026-02-20 は参入発表の配信日転記＝別途報告）
 *     - 事業主体: とくぎんトモニリンクアップ株式会社（徳島大正銀行100%子会社）→ operator を是正
 *     - アグリゲーター Sustech（ELIC）／蓄電システム PowerX／施工 グリーンエナジー・プラス（PDF）
 *   グローム西方町（PR 000000008.000185790）
 *     - 施設名「GM西方町金井2465蓄電所（第2号）」／所在地「栃木県栃木市西方町金井44」
 *     - 「最大受電電力 1,994kW」（一次は「出力」と書いていない→ body で最大受電電力と明記）
 *     - 容量(kWh)・蓄電池メーカー: 記載なし → capacityMwh は 0（調査中）・メーカーは書かない
 *     - 検収・引渡し 2026年7月10日＝「約7週間前倒しでの事業開始」「第2号施設が稼働段階へ」→ status 稼働中・cod 2026-07-10
 *     - 契約主体は連結子会社 福山医療器／接続先 東京電力パワーグリッド
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const BASE = `https://${DOMAIN}.microcms.io/api/v1/projects`;
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
type Rec = Record<string, unknown> & { id: string; slug: string };
const NOTE = '<p><em>※本案件情報は事業者の公式プレスリリース等に基づき編集部が整備したものです。最新の進捗・諸元については出典URLをご参照ください。</em></p>';

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const bySlug = async (slug: string): Promise<Rec | null> =>
  (await api<{ contents: Rec[] }>('GET', `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0] ?? null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function otherDiffs(b: Rec, a: Rec | null, changed: string[]): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {})])) {
    if (SYS.has(k) || changed.includes(k)) continue;
    if (JSON.stringify(b[k]) !== JSON.stringify(a?.[k])) out.push(k);
  }
  return out;
}
function eq(sent: unknown, stored: unknown): boolean {
  const a = Array.isArray(sent) ? sent : [sent], b = Array.isArray(stored) ? stored : [stored];
  return JSON.stringify(a) === JSON.stringify(b);
}
let done = 0, skipped = 0, failed = 0;

// ── 徳島板野: 差分 PATCH（pr-co149815-bess）
const TOKUGIN = {
  slug: 'pr-co149815-bess',
  expect: { name: '系統用蓄電池（株式会社徳島大正銀行）', operator: '株式会社徳島大正銀行', prefecture: null as string | null, city: null as string | null },
  patch: {
    name: '徳島県板野郡蓄電所（とくぎんトモニリンクアップ）',
    operator: 'とくぎんトモニリンクアップ株式会社',
    prefecture: '徳島県',
    city: '板野郡',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000090.000092942.html',
    body:
      '<p><strong>徳島県板野郡蓄電所</strong>は、徳島大正銀行（トモニホールディングスグループ）の100%子会社であるとくぎんトモニリンクアップが徳島県板野郡で導入した系統用蓄電所（定格出力1,990kW／蓄電池公称容量8,226kWh・蓄電システムはパワーエックス製）。四国の地方銀行グループ初の系統用蓄電池事業として2026年2月20日に参入を発表し、徳島大正銀行の発表によれば2026年8月31日に竣工した（施工はグリーンエナジー＆カンパニーの100%子会社グリーンエナジー・プラス）。アグリゲーターはSustechで、分散型電力運用プラットフォーム「ELIC」により需給調整市場（EPRX）・卸電力取引市場（JEPX）等を対象とした市場入札から充放電制御・実績分析までを担う。運転開始日は竣工時点の両発表に記載がない。</p>' +
      '<p>関連ニュース: <a href="/news/tokugin-tomoni-itano-shunko-2026-09">竣工（2026年9月1日発表）</a>／<a href="/news/pr-2026-02-20-co149815-13">参入発表</a>／<a href="/news/pr-2026-02-20-sustech-79">Sustechのアグリゲーション受託</a>／<a href="/news/pr-2026-02-20-co109041-222">パワーエックスの蓄電システム受注</a></p>' + NOTE,
  },
};

// ── グローム 西方町第2号: 新規 POST
const GLOME = {
  slug: 'glome-nishikata-kanai-2465-bess',
  name: 'GM西方町金井2465蓄電所（グローム・ホールディングス）',
  operator: 'グローム・ホールディングス株式会社',
  prefecture: '栃木県', city: '栃木市西方町金井',
  outputMw: 1.994, capacityMwh: 0,
  status: ['稼働中'], cod: '2026-07-10',
  sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000008.000185790.html',
  body:
    '<p><strong>GM西方町金井2465蓄電所</strong>は、グローム・ホールディングスが系統用蓄電所事業の第2号施設として栃木県栃木市西方町金井44に設けた系統用蓄電所（最大受電電力1,994kW・用地面積2,888平方メートル・接続先は東京電力パワーグリッド）。2026年7月10日に検収・引渡しを完了し、当初の事業開始予定日（2026年9月1日）から約7週間前倒しで稼働段階に入った（2026年8月14日発表）。契約主体は連結子会社の福山医療器で、アグリゲーター（特定卸供給事業者）との契約も締結済み。容量（kWh）と蓄電池メーカーは発表に記載がない。</p>' +
    '<p>関連ニュース: <a href="/news/glome-nishikata-no2-hikiwatashi-2026-08">検収・引渡し完了（2026年8月14日発表）</a>／<a href="/news/glome-hd-toyooka-1-bess-shiunten-2026-07">第1号「GM豊岡市但東町蓄電所」の試運転開始</a></p>' + NOTE,
};

async function patchTokugin(): Promise<void> {
  console.log(`\n■ ⑤-1 徳島板野: 差分 PATCH ${TOKUGIN.slug}（同一案件の既存レコード）`);
  const b = await bySlug(TOKUGIN.slug);
  if (!b) { console.log('  ★NG 不在'); failed++; return; }
  console.log(`  現在: name=${JSON.stringify(b.name)} operator=${JSON.stringify(b.operator)} ${b.prefecture ?? 'null'}/${b.city ?? 'null'} ${b.outputMw}MW/${b.capacityMwh}MWh status=${JSON.stringify(b.status)} cod=${JSON.stringify(b.cod)}`);
  for (const [k, v] of Object.entries(TOKUGIN.expect)) {
    const cur = b[k] ?? null;
    if (cur !== v) { console.log(`  [スキップ] ${k} が承認時の実データと不一致（想定=${JSON.stringify(v)} 現在=${JSON.stringify(cur)}）→ 書き込まない`); skipped++; return; }
  }
  const changed = Object.entries(TOKUGIN.patch).filter(([k, v]) => String(b[k] ?? '') !== String(v)).map(([k]) => k);
  if (changed.length === 0) { console.log('  [skip] 既に反映済み（冪等）'); skipped++; return; }
  console.log(`  [PATCH] ${changed.join(', ')}（status/cod/outputMw/capacityMwh は触らない＝実測分岐: 一次に運転開始の記載なし）`);
  if (DRY) { done++; return; }
  const payload: Record<string, unknown> = {}; for (const k of changed) payload[k] = (TOKUGIN.patch as Record<string, unknown>)[k];
  await api('PATCH', `${BASE}/${b.id}`, payload);
  await sleep(1000);
  const a = await bySlug(TOKUGIN.slug);
  const bad = changed.filter((k) => String(a?.[k] ?? '') !== String((TOKUGIN.patch as Record<string, unknown>)[k]));
  const others = otherDiffs(b, a, changed);
  console.log(`  #106: 反映=${bad.length ? '★NG ' + bad.join(',') : '✓'} / 他フィールド変化=${others.join(',') || '0'}`);
  if (!bad.length && !others.length) done++; else failed++;
}

async function postGlome(): Promise<void> {
  console.log(`\n■ ⑤-2 グローム 西方町第2号: 新規 POST ${GLOME.slug}`);
  const ex = await bySlug(GLOME.slug);
  if (ex) { console.log(`  [skip] 既存（id=${ex.id}）`); skipped++; return; }
  // 名称＋市町村で二重登載を再確認
  const dup = await api<{ contents: Rec[] }>('GET', `${BASE}?filters=name[contains]西方町[or]name[contains]グローム&fields=slug,name&limit=5`);
  if (dup.contents.length) { console.log(`  [スキップ] 名称照合で既存あり: ${dup.contents.map((x) => x.slug).join(',')}`); skipped++; return; }
  console.log(`  [POST] ${GLOME.name} / ${GLOME.prefecture}${GLOME.city} / ${GLOME.outputMw}MW／容量は記載なし(0=調査中) / ${GLOME.status} / cod=${GLOME.cod}`);
  if (DRY) { done++; return; }
  await api('POST', BASE, GLOME);
  await sleep(1000);
  const a = await bySlug(GLOME.slug);
  if (!a) { console.log('  ★NG POST 後に GET できない'); failed++; return; }
  const bad = Object.entries(GLOME).filter(([k, v]) => !eq(v, a[k])).map(([k]) => `${k}: 送信=${JSON.stringify(GLOME[k as keyof typeof GLOME])} 保存=${JSON.stringify(a[k])}`);
  console.log(`  #106: ${bad.length ? '★NG\n     ' + bad.join('\n     ') : `✓ 全 ${Object.keys(GLOME).length} field 一致（id=${a.id}）`}`);
  if (!bad.length) done++; else failed++;
}

async function main(): Promise<void> {
  console.log(`[projects w5] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  const pre = await api<{ totalCount: number }>('GET', `${BASE}?limit=0`);
  console.log(`  投入前 総件数 ${pre.totalCount}`);
  await patchTokugin();
  await postGlome();
  console.log('\n■ 記録: コレック岡山 correc-okayama-kumegun-bess は 9/1 登録済み → 触らない');
  console.log('■ 報告: pr-co92942-bess（Sustech 受託発表由来）は pr-co149815-bess と同一案件の二重登載 → 301 集約候補（コード変更は本便の範囲外・提案のみ）');
  if (!DRY) { const post = await api<{ totalCount: number }>('GET', `${BASE}?limit=0`); console.log(`  投入後 総件数 ${post.totalCount}`); }
  console.log(`\n[done] 実行 ${done} / スキップ ${skipped} / 失敗 ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
