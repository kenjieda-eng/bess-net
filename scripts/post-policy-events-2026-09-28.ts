#!/usr/bin/env tsx
/**
 * scripts/post-policy-events-2026-09-28.ts — 週次政策 2026-09-28 実施分
 *
 * 原稿: OneDrive 03_5月13日朝_実行/週次政策_policy-calendar投入_2026-09-28.md §2（POST 2）・§3（PATCH 3）
 * POST : ① occto-ltdc2026-jitsumu-setsumeikai-2026-10（LTDC 実務説明会・10/7・申込 10/1 15時）
 *        ② meti-saiene-shuryoku-shoi-5-2026-09（第5回 再エネ主力電源化小委・9/30）
 * PATCH: A meti-haishutsuryo-torihiki-shoiinkai-9-2026-09 status 終了＋sourceUrl 差替＋description 末尾1文置換
 *        B meti-chotatsu-kakaku-iinkai-116-2026-09        status 終了＋sourceUrl 差替＋description 末尾1文置換
 *        C pubcom-fit-fip-rule-amendment-202608           status 終了（既に終了なら skip）
 *
 * ★原稿からの変更点（投入直前に一次を read-only subagent 4 本で再取得・逐語照合して是正。報告に明記する）:
 *   1. POST① description の鉤括弧「容量市場 説明会資料・動画」→「容量市場　説明会資料・動画」（一次は全角空白 U+3000）。
 *   2. POST② description 末尾「配布資料は開催後に委員会ページで公開。」を削除。開催案内に記載が無く、
 *      前例の第4回は資料が開催当日の開始前（10:00 JST・会議 13:00〜）に掲載されていて「開催後」と合わない（R8）。
 *   3. PATCH A の置換後の文: ②の内訳 3 つは一次では括弧の外の下位項目、「次回以降の予定」は審議事項ではなく
 *      「２．」の別章。目次の構造どおりに書き直した（語句はすべて資料3 PDF に逐語で存在）。
 *   4. PATCH B の置換後の文: 資料2 の題名が要約だったため一次（santeii/116.html）の逐語へ。
 *   ※POST① の title は兄弟レコード（7/27 概要・9/17 詳細）と同じサイトの統一形なので原稿のまま（事実誤りではない）。
 *
 * ★id は slug から解決する（原稿の id は照合にだけ使う）。前便の報告書に id の誤記があったため
 *   （reports/friday-7-2026-09-25.md §4 は A の id を 3kx2nam-q9o と記載・実 id は 7_len768ts0）。
 *   解決した id が原稿の id と違えば中止して報告する。
 * ★#106: eventType / status / category は配列で送る（v4 スキーマの選択肢に実在する値のみ）。
 *        kind / relatedTopics / eventTopics は []（9/25 便と同じ）。registrationDeadline は ① のみ。
 * ★#122: description は textArea だが、置換は置換元が description 内で一意のときだけ。照合は置換後の文の存在で判定。
 * ★冪等: POST は slug 既存なら skip。PATCH は現在値が原稿の「現在値」と違えば中止して報告。DELETE / PUT なし。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/post-policy-events-2026-09-28.ts [--dry-run] [--skip-post2]
 */
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const SKIP_POST2 = process.argv.includes('--skip-post2');
const EP = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;

type Rec = Record<string, unknown> & { id: string; slug: string };
const calls: Record<string, number> = {};

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  calls[method] = (calls[method] ?? 0) + 1;
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

// ── v4 スキーマの選択肢（scripts/microcms-schema-policy-events-v4-2026-08-27.json）＝ #106 の実在確認に使う
const SELECTS: Record<string, string[]> = {
  eventType: ['法改正', 'パブコメ', '重要会議', 'オークション', '公表', '展示会', 'セミナー', 'シンポジウム', '学会', '業界団体総会'],
  status: ['予定', '進行中', '終了'],
  category: ['容量市場', '需給調整市場', '長期脱炭素オークション', 'パブコメ', '重要会議', '補助金', '法改正', '公表'],
};

// ── §2 POST 2 件 ─────────────────────────────────────────────
const POST_ROWS: (Record<string, unknown> & { slug: string })[] = [
  {
    slug: 'occto-ltdc2026-jitsumu-setsumeikai-2026-10',
    title:
      '長期脱炭素電源オークション（応札年度2026年度）実務説明会（参加登録・応札・容量確保契約書の締結）（10/7 Web開催、申込 10/1 15時）',
    eventDate: '2026-10-07',
    registrationDeadline: '2026-10-01',
    eventType: ['重要会議'],
    issuer: '電力広域的運営推進機関（OCCTO）',
    description:
      '電力広域的運営推進機関（OCCTO）が容量市場 長期脱炭素電源オークション実務説明会（参加登録・応札・容量確保契約書の締結）（応札年度：2026年度）を2026年10月7日（水）10時〜12時にWeb（会議ツール「Webex」）で開催する（2026年9月25日案内）。7月27日の制度概要説明会・9月17日の制度詳細説明会に続く回で、案内ページでは「今回の説明会では、長期脱炭素電源オークションの実務についてご説明いたします」とし、内容は「2026年度を応札年度とする長期脱炭素電源オークションへの参加を希望する事業者の具体的な参加登録・応札・容量確保契約書の締結方法に係る内容」とされている。参加申込期日は2026年10月1日（木）15時00分（申込フォーム、定員になり次第受付終了。10月5日までに案内メールが届かない場合は事務局へ連絡）。資料は後日掲載、説明会終了後に「容量市場　説明会資料・動画」ページで説明会動画が公開予定。長期脱炭素電源オークションは系統用蓄電池（BESS）が主要な落札電源の一つで、応札年度2026年度への参加を検討する蓄電池事業者にとって参加登録・応札・契約締結の実務手順を確認する機会。',
    sourceUrl: 'https://www.occto.or.jp/news/013496.html',
    status: ['予定'],
    category: ['容量市場', '長期脱炭素オークション'],
    kind: [],
    relatedTopics: [],
    eventTopics: [],
  },
  {
    slug: 'meti-saiene-shuryoku-shoi-5-2026-09',
    title:
      '第5回 再生可能エネルギー主力電源化小委員会: 事業用太陽光発電におけるFIT/FIP制度の支援重点化について（9/30）',
    eventDate: '2026-09-30',
    eventType: ['重要会議'],
    issuer: '経済産業省 資源エネルギー庁（省エネルギー・新エネルギー部 新エネルギー課）',
    description:
      '経済産業省の総合資源エネルギー調査会 省エネルギー・新エネルギー分科会／電力・ガス事業分科会 再生可能エネルギー主力電源化小委員会（第5回）が2026年9月30日（水）15時〜18時にオンラインで開催される。議題は「事業用太陽光発電におけるFIT/FIP制度の支援重点化について」。第3回（7月28日）・第4回（8月24日）に続く審議で、第4回の資料1では、昨年度の調達価格等算定委員会の意見において事業用太陽光発電（地上設置）を2027年度以降FIT/FIP制度における支援の対象外とする一方、地域共生が図られた形で導入が期待される太陽光発電に支援を重点化する方針が示されたこと、事務局が「FIT/FIP制度での支援重点化に相応しい類型を選定するための一定の考え方」の案を提示したこと、次回以降はその考え方に基づき候補類型への当てはめと類型の整理を行うことが説明されている。FIT/FIP制度の対象範囲の見直しは、太陽光発電と蓄電池の併設やFIP電源での蓄電池活用といった事業モデルの前提に関わるため、審議の到達点をトラックする。',
    sourceUrl: 'https://www.meti.go.jp/shingikai/information/2026/20260930_4k.html',
    status: ['予定'],
    category: ['重要会議'],
    kind: [],
    relatedTopics: [],
    eventTopics: [],
  },
];

// ── §3 PATCH 3 件 ────────────────────────────────────────────
type Patch = {
  label: string;
  slug: string;
  briefId: string;
  expect: Record<string, unknown>;
  expectDescLen?: number;
  set: Record<string, unknown>;
  replace?: { old: string; new: string };
  why: string;
};

const PATCHES: Patch[] = [
  {
    label: 'A',
    slug: 'meti-haishutsuryo-torihiki-shoiinkai-9-2026-09',
    briefId: '7_len768ts0',
    expect: { status: ['予定'], sourceUrl: 'https://www.meti.go.jp/shingikai/information/2026/20260925_3k.html' },
    expectDescLen: 536,
    set: {
      status: ['終了'],
      sourceUrl: 'https://www.meti.go.jp/shingikai/sankoshin/sangyo_gijutsu/emissions_trading/009.html',
    },
    replace: {
      old: '配布資料は議題2が非公開のため一部のみ、または開催後に委員会ページで公開される可能性がある。',
      new: '配布資料は委員会ページで公開され、資料3「事務局資料」（題名「上下限価格に係る措置について」。目次は「本日の審議事項」として ①上限価格（みなし保有措置） ②下限価格（リバースオークション）〔リバースオークション及び売渡しの共通事項・リバースオークションの設計・売渡しの設計〕 ③取引開始後のフォローアップ の3点と、「次回以降の予定」）が閲覧できる。資料4「事務局資料」は非公開。会議の動画も掲載されている。',
    },
    why: 'emissions_trading/009.html（開催結果・配布資料ページ）と資料3 PDF を一次で確認。',
  },
  {
    label: 'B',
    slug: 'meti-chotatsu-kakaku-iinkai-116-2026-09',
    briefId: '3_q-mxrubr',
    expect: { status: ['予定'], sourceUrl: 'https://www.meti.go.jp/shingikai/information/2026/20260925_2k.html' },
    expectDescLen: 439,
    set: { status: ['終了'], sourceUrl: 'https://www.meti.go.jp/shingikai/santeii/116.html' },
    replace: {
      old: '配布資料は開催後に委員会ページで公開。',
      new: '配布資料は委員会ページで公開された。参考資料1「発電側課金相当額について（報告事項）」（資源エネルギー庁、12頁）は、一般送配電事業者8社の第1規制期間（2023〜2027年度）の収入見通し変更が承認され2026年11月1日以降に発電側課金の単価が変更となることから、全国平均での費用負担増加分を再度算出し、2024年度〜2026年度に新規認定を受けた案件の発電側課金相当額を改めて報告するものと説明している。同資料は、揚水発電・蓄電池のkWh課金が免除と整理されていることも再掲している（p.7・p.9）。資料2「令和8年度の供給価格上限額（着床式洋上風力発電設備（海洋再エネ整備法適用外）第4回）に関する意見（案）」は非公開。',
    },
    why: 'santeii/116.html（配布資料一覧）と参考資料1 PDF を一次で確認。',
  },
  {
    label: 'C',
    slug: 'pubcom-fit-fip-rule-amendment-202608',
    briefId: '1hnt1c64077f',
    expect: { status: ['進行中'], eventDate: '2026-09-12' },
    set: { status: ['終了'] },
    why: 'e-Gov 案件 620340004 が「受付締切」（2026/8/14〜9/12）。',
  },
];

let posted = 0, patched = 0, skipped = 0, failed = 0, aborted = 0;

function checkSelects(row: Record<string, unknown>, slug: string): string[] {
  const bad: string[] = [];
  for (const [k, opts] of Object.entries(SELECTS)) {
    const v = row[k];
    if (!Array.isArray(v)) { bad.push(`${slug}.${k} が配列でない`); continue; }
    for (const x of v) if (!opts.includes(String(x))) bad.push(`${slug}.${k}「${x}」は選択肢に無い`);
  }
  return bad;
}

async function tally(label: string): Promise<{ total: number; seisaku: number; gyokai: number }> {
  const all: Rec[] = [];
  for (let off = 0; ; off += 100) {
    const r = await api<{ contents: Rec[]; totalCount: number }>('GET', `${EP}?limit=100&offset=${off}&fields=id,slug,kind`);
    all.push(...r.contents);
    if (r.contents.length < 100) break;
  }
  const gyokai = all.filter((x) => Array.isArray(x.kind) && (x.kind as string[]).includes('業界')).length;
  const out = { total: all.length, seisaku: all.length - gyokai, gyokai };
  console.log(`[${label}] policy-events 全 ${out.total} 件（政策 ${out.seisaku}・業界 ${out.gyokai}）`);
  return out;
}

async function runPost(row: Record<string, unknown> & { slug: string }): Promise<void> {
  console.log(`\n■ POST ${row.slug}`);
  const cur = await bySlug(row.slug);
  if (cur) { console.log(`   [skip] 既存あり（id=${cur.id}）`); skipped++; return; }
  for (const [k, v] of Object.entries(row)) {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    console.log(`   ${k}: ${s.length > 110 ? `${s.slice(0, 110)}…（${s.length}字）` : s}`);
  }
  if (DRY) { posted++; return; }
  const res = await api<{ id: string }>('POST', EP, row);
  await sleep(900);
  const after = await bySlug(row.slug);
  const diffs: string[] = [];
  for (const [k, v] of Object.entries(row)) {
    const got = after?.[k];
    // 日付は microCMS が ISO 日時で返す（2026-10-07 → 2026-10-07T00:00:00.000Z 等）ので日付部で比べる
    const same = (k === 'eventDate' || k === 'registrationDeadline')
      ? String(got ?? '').slice(0, 10) === String(v) || new Date(String(got)).toISOString().slice(0, 10) === String(v)
      : norm(got) === norm(v);
    if (!same) diffs.push(`${k}: 送信=${norm(v).slice(0, 60)} 保存=${norm(got).slice(0, 60)}`);
  }
  console.log(diffs.length === 0
    ? `   #106: ✓ 全 ${Object.keys(row).length} field 一致（id=${res.id}）`
    : `   #106: 差分 ${diffs.length} 件 → ${diffs.join(' / ')}`);
  if (diffs.length === 0) posted++; else failed++;
}

async function runPatch(p: Patch): Promise<void> {
  console.log(`\n■ PATCH ${p.label} ${p.slug}`);
  const found = await bySlug(p.slug);
  if (!found) { console.log('   [中止] slug が存在しない'); aborted++; return; }
  if (found.id !== p.briefId) {
    console.log(`   [中止] slug→id の解決結果（${found.id}）が原稿の id（${p.briefId}）と違う`);
    aborted++; return;
  }
  console.log(`   id: ${found.id}（slug から解決・原稿の id と一致）`);
  const before = await byId(found.id);
  for (const [k, v] of Object.entries(p.expect)) {
    const got = k === 'eventDate' ? String(before[k] ?? '').slice(0, 10) : before[k];
    if (norm(got) !== norm(v)) {
      // 既に目標値なら冪等 skip、そうでなければ中止
      if (k in p.set && norm(before[k]) === norm(p.set[k])) continue;
      console.log(`   [中止] 現在値が原稿と不一致: ${k} 現在=${norm(got)} 期待=${norm(v)}`);
      aborted++; return;
    }
  }
  const desc = String(before.description ?? '');
  if (p.expectDescLen !== undefined) console.log(`   description 現在 ${desc.length} 字（原稿の記録 ${p.expectDescLen} 字）`);
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p.set)) {
    if (norm(before[k]) === norm(v)) { console.log(`   ${k}: ${norm(v)} [同値・skip]`); continue; }
    payload[k] = v;
    console.log(`   ${k}: 前 ${norm(before[k])} → 後 ${norm(v)}`);
  }
  if (p.replace) {
    const n = count(desc, p.replace.old);
    if (n === 0 && desc.includes(p.replace.new)) console.log('   description: 置換済み（冪等）');
    else if (n !== 1) { console.log(`   [中止] description: 置換元が ${n} 箇所（一意でない）`); aborted++; return; }
    else {
      payload.description = desc.replace(p.replace.old, p.replace.new);
      console.log(`   description: 末尾1文を置換（${desc.length}→${String(payload.description).length}字）`);
    }
  }
  if (Object.keys(payload).length === 0) { console.log('   [skip] 変更なし（冪等）'); skipped++; return; }
  console.log(`   根拠: ${p.why}`);
  if (DRY) { patched++; return; }
  await api('PATCH', `${EP}/${found.id}`, payload);
  await sleep(900);
  const after = await byId(found.id);
  let other = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (['updatedAt', 'revisedAt'].includes(k)) continue;
    if (k in payload) continue;
    if (norm(before[k]) !== norm(after[k])) { other++; console.log(`   ★他フィールド変化: ${k}`); }
  }
  const okSet = Object.entries(payload).every(([k, v]) =>
    k === 'description' ? String(after.description ?? '').includes(p.replace!.new) && !String(after.description ?? '').includes(p.replace!.old)
      : norm(after[k]) === norm(v));
  console.log(`   #106/#122: ${okSet ? '✓ 対象フィールド反映（description は置換後の文の存在・置換元の消滅で判定）' : '★NG 反映されていない'}・他フィールド変化 ${other}`);
  if (okSet && other === 0) patched++; else failed++;
}

async function main(): Promise<void> {
  console.log(`[週次政策 2026-09-28 policy-events] mode=${DRY ? 'DRY-RUN' : '本実行'}${SKIP_POST2 ? '（②は skip）' : ''}`);
  const bad = POST_ROWS.flatMap((r) => checkSelects(r, r.slug));
  if (bad.length) { console.log(`[中止] #106 選択肢の不実在: ${bad.join(' / ')}`); process.exit(1); }
  console.log('#106: POST 2 件の eventType / status / category はすべて v4 の選択肢に実在・配列');
  const t0 = await tally('前');
  const rows = SKIP_POST2 ? POST_ROWS.slice(0, 1) : POST_ROWS;
  for (const r of rows) await runPost(r);
  for (const p of PATCHES) await runPatch(p);
  if (!DRY) await tally('後');
  console.log(`\n[done] POST ${posted} / PATCH ${patched} / skip ${skipped} / 中止 ${aborted} / 失敗 ${failed}`);
  console.log(`[microCMS 呼び出し] ${Object.entries(calls).map(([m, n]) => `${m} ${n}`).join('・')}`);
  if (t0) void t0;
  if (aborted || failed) process.exit(2);
}
main().catch((e) => { console.error(e); process.exit(1); });
