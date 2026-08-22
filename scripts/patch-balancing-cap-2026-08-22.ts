/**
 * scripts/patch-balancing-cap-2026-08-22.ts
 * 需給調整市場 ΔkW上限価格の確定（EPRX 2026-07-30 公表）を microCMS 本文へ反映。
 *
 * 一次確認済の事実（これ以外の数値を創作しない）:
 *   一次調整力 / 二次調整力① / 複合商品
 *     2026年8月31日 実需給分まで … 15.00 円/ΔkW・30分
 *     2026年9月1日  実需給分から … 10.00 円/ΔkW・30分（適用終了「当面の間」）
 *   二次調整力② / 三次調整力① … 7.21 円/ΔkW・30分 を当面継続（第96回制度検討作業部会）
 *   三次調整力② … 上限なし
 *   根拠: 第4回 電力安定供給WG（資源エネルギー庁 2026/7/14）資料6 ／ 出典 https://www.eprx.or.jp/information/post.php
 *
 * 方針（依頼書フェーズ1・判定 A）:
 *   「審議中/案/決定前」「時点非明示の 15円 断定」を、時点明示の両論併記へ書き換える。
 *   → 9/1 を跨いでも陳腐化しない（L-EIC-027 の趣旨）。
 *   C 区分（7.21円・三次②上限なし）は変更しない。数値定数（EPRX 実績）は触らない。
 *
 * 作法: 冪等（#91、既に新文言なら skip）／DELETE・PUT なし／PATCH は対象フィールドのみ／
 *       PATCH 後 GET で全field照合（#106、対象外フィールドの意図しない変化を検出）。
 * 実行: npx tsx --env-file=.env.local scripts/patch-balancing-cap-2026-08-22.ts [--dry-run]
 */
export {};
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(method: string, url: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url.split('/api/v1/')[1]} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}
const SKIP = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

/**
 * 置換 1 件（from は現行本文に必ず 1 回だけ存在すること）
 * marker: 冪等判定に使う文字列。★richEditor（body/detail）は microCMS が保存時に正規化するため
 *   （見出し id の自動採番・rel="noopener" → "noopener noreferrer"）、送信した to の全文一致では
 *   「適用済み」を判定できず、再実行で二重追記になる（2026-08-22 に実際に発生・切除で復旧）。
 *   マーカーには正規化の影響を受けない素の本文（見出しテキスト等）を指定する。省略時は to。
 */
type Rep = { field: string; from: string; to: string; marker?: string };
type Target = { endpoint: string; id: string; slug: string; note: string; reps: Rep[] };

const CAP_SRC = '出典: 電力需給調整力取引所（EPRX）2026年7月30日公表「需給調整市場のΔkW上限価格について」、根拠: 第4回 電力安定供給ワーキンググループ 資料6';

const TARGETS: Target[] = [
  // ── 1. policy-events: WG第4回（「案」→ 7/30 確定を追記。当時の議論の記述は史実として残す） ──
  {
    endpoint: 'policy-events', id: 'ubgm56farge5', slug: 'meti-stable-supply-wg4-balancing-cap-2026-07',
    note: 'title の「適用案」と description 末尾の「確定をトラックする」を、確定済みの記述へ',
    reps: [
      {
        field: 'title',
        from: '（2026年9月1日実需給分から適用案）',
        to: '（2026年9月1日実需給分から適用・2026年7月30日に確定）',
      },
      {
        // 上の置換だけでは title 前半の「引下げ案」が残り、「案（…確定）」という自己矛盾になる。
        // /policy-calendar 一覧の見出しがこの title なので、一覧上は未確定に読めてしまう（本番照合で検出）。
        field: 'title',
        from: '15円→10円引下げ案（',
        to: '15円→10円引下げ（',
      },
      {
        field: 'description',
        from: '上限価格の引下げは系統用蓄電池のΔkW価値収益の上限を直接規定するため、WGでの結論、国の審議会での正式決定、9月1日適用の確定をトラックする。',
        to: '上限価格の引下げは系統用蓄電池のΔkW価値収益の上限を直接規定する。【2026年8月22日追記】本WGの議論を踏まえ、電力需給調整力取引所（EPRX）が2026年7月30日に「需給調整市場のΔkW上限価格について」を公表し、一次調整力・二次調整力①・複合商品のΔkW上限価格を、2026年8月31日実需給分まで15.00円/ΔkW・30分、2026年9月1日実需給分から10.00円/ΔkW・30分（適用終了は「当面の間」）とすることが確定した。二次調整力②・三次調整力①は第96回制度検討作業部会の審議結果により7.21円/ΔkW・30分を当面継続、三次調整力②は引き続き上限なし。',
      },
    ],
  },
  // ── 2. policy-events: 2026年度改革（「議論中・最終水準は要確認」→ 確定を追記） ──
  {
    endpoint: 'policy-events', id: 'hlq3868w69', slug: 'balancing-market-reform-2026-03',
    note: 'description の「最終水準は要確認」を確定済みの記述へ',
    reps: [
      {
        field: 'description',
        from: '蓄電池収益性〔2MW/8MWh・4時間率・CAPEX6.8万円/kWh・IRR目線5〜10%〕を踏まえ適切水準を継続議論、最終水準は要確認）。',
        to: '蓄電池収益性〔2MW/8MWh・4時間率・CAPEX6.8万円/kWh・IRR目線5〜10%〕を踏まえ適切水準を継続議論）。【2026年8月22日追記】その後の水準は確定し、一次調整力・二次調整力①・複合商品のΔkW上限価格は2026年8月31日実需給分まで15.00円/ΔkW・30分、2026年9月1日実需給分から10.00円/ΔkW・30分（適用終了は「当面の間」。電力需給調整力取引所が2026年7月30日公表）。二次調整力②・三次調整力①は7.21円/ΔkW・30分を当面継続、三次調整力②は上限なし。',
      },
    ],
  },
  // ── 3. faq: 低圧の収益（「審議中」→ 確定・時点明示） ──
  {
    endpoint: 'faq', id: 'yic3-u58r', slug: 'faq-lv-02',
    note: 'answer の「引下げ案・2026年7月時点で審議中」を時点明示の確定記述へ',
    reps: [
      {
        field: 'answer',
        from: 'なお需給調整市場では上限価格の引下げ案（15円→10円・2026年7月時点で審議中）が出ており、制度動向の影響も受けます。',
        to: 'なお需給調整市場のΔkW上限価格（一次調整力・二次調整力①・複合商品）は、2026年8月31日実需給分まで15.00円/ΔkW・30分、2026年9月1日実需給分から10.00円/ΔkW・30分に引き下げられます（適用終了は「当面の間」。電力需給調整力取引所が2026年7月30日公表）。このような制度動向の影響も受けます。',
      },
    ],
  },
  // ── 4. glossary: 低圧蓄電所（「審議中」→ 確定・時点明示） ──
  {
    endpoint: 'glossary', id: 'yy71w6can', slug: 'low-voltage-bess',
    note: 'detail の「上限価格引下げ案（15円→10円・審議中）」を時点明示の確定記述へ',
    reps: [
      {
        field: 'detail',
        from: '需給調整市場の上限価格引下げ案（15円→10円・審議中）のような制度動向の影響を受ける。',
        to: '需給調整市場のΔkW上限価格の引下げ（一次調整力・二次調整力①・複合商品。2026年8月31日実需給分まで15.00円/ΔkW・30分、2026年9月1日実需給分から10.00円/ΔkW・30分。電力需給調整力取引所が2026年7月30日公表）のような制度動向の影響を受ける。',
      },
    ],
  },
  // ── 5. explainer: マルチユース運用（時点非明示の「上限が15円」→ 両論併記） ──
  {
    endpoint: 'explainer', id: 'multi-use-operation-strategy', slug: 'multi-use-operation-strategy',
    note: 'body の「2026年度から一次・二次①の上限が15円に引き下げ。」を時点明示の両論併記へ',
    reps: [
      {
        field: 'body',
        from: '2026年度から一次・二次①の上限が15円に引き下げ。',
        to: 'ΔkW上限価格は一次・二次①・複合商品で、2026年8月31日実需給分まで15.00円/ΔkW・30分、2026年9月1日実需給分から10.00円/ΔkW・30分（二次②・三次①は7.21円/ΔkW・30分を当面継続、三次②は上限なし。電力需給調整力取引所 2026年7月30日公表）。',
        marker: '2026年9月1日実需給分から10.00円/ΔkW・30分（二次②・三次①は7.21円/ΔkW・30分を当面継続',
      },
    ],
  },
  // ── 6. explainer: 2026年度 上限価格引下げ（19.51→15 は史実。9/1 の 10.00 円を追記） ──
  {
    endpoint: 'explainer', id: 'balancing-market-cap-cut-2026', slug: 'balancing-market-cap-cut-2026',
    note: 'lead / body に 2026-09-01 の 10.00 円化を追記（title の 19.51→15 は 2026年度の史実として維持）',
    reps: [
      {
        field: 'lead',
        from: '募集量見直しと合わせ、系統用蓄電池ビジネスの収益構造に直接影響する。',
        to: '募集量見直しと合わせ、系統用蓄電池ビジネスの収益構造に直接影響する。さらに2026年9月1日実需給分からは、一次・二次調整力①・複合商品の上限価格が10.00円/ΔkW・30分へ引き下げられる。',
      },
      {
        field: 'body',
        from: '<p>2026年4月から新しい上限価格での約定が始まる。3月13日の前日取引移行(3月14日精算)を境に、市場参加者は新条件下でのオペレーションへ。約定結果はOCCTOが週次で公表する。</p>',
        to: '<p>2026年4月から新しい上限価格での約定が始まる。3月13日の前日取引移行(3月14日精算)を境に、市場参加者は新条件下でのオペレーションへ。約定結果はOCCTOが週次で公表する。</p><h2 id="hcap10yen2609">6. 【2026年8月22日追記】9月1日実需給分から10.00円へ</h2><p>本記事の19.51円→15円の引下げ後も上限価格付近への応札集中が続いたことから、第4回 電力安定供給ワーキンググループ（資源エネルギー庁、2026年7月14日 資料6）の審議結果に基づき、電力需給調整力取引所（EPRX）が2026年7月30日に「需給調整市場のΔkW上限価格について」を公表した。これにより<strong>一次調整力・二次調整力①・複合商品</strong>のΔkW上限価格は、<strong>2026年8月31日実需給分まで15.00円/ΔkW・30分、2026年9月1日実需給分から10.00円/ΔkW・30分</strong>（適用終了は「当面の間」）となる。<strong>二次調整力②・三次調整力①</strong>は第96回制度検討作業部会の審議結果により<strong>7.21円/ΔkW・30分</strong>を当面継続、<strong>三次調整力②</strong>は引き続き<strong>上限なし</strong>。上限15円→10円は金額5円・約33%の引下げにあたり、上限付近で約定してきた系統用蓄電池・VPPのΔkW価値収入に直接影響する。マルチユース運用・IRRシミュレーションの収益前提は「10円」で見直す必要がある。出典: <a href="https://www.eprx.or.jp/information/post.php" target="_blank" rel="noopener">電力需給調整力取引所「需給調整市場のΔkW上限価格について」（2026年7月30日）</a>。</p>',
        marker: '6. 【2026年8月22日追記】9月1日実需給分から10.00円へ',
      },
    ],
  },
];

async function main(): Promise<void> {
  let patched = 0, skipped = 0, bad = 0;
  for (const t of TARGETS) {
    const url = `${BASE}/${t.endpoint}/${t.id}`;
    const before = (await apiFetch('GET', url)) as Record<string, unknown>;
    if (before.slug !== t.slug) throw new Error(`slug 不一致: ${t.id} → ${String(before.slug)}`);
    console.log(`\n■ ${t.endpoint}/${t.slug} (${t.id})`);
    console.log(`  意図: ${t.note}`);

    // 差分を組み立て（冪等: 既に to を含み from が無い → その置換は済み）
    const body: Record<string, string> = {};
    let doneCount = 0;
    for (const rep of t.reps) {
      const cur = String(before[rep.field] ?? '');
      // 冪等（#91）: marker が入っていれば適用済み。★追記型（from ⊂ to）では from も残るため
      //   「to があり from が無い」を条件にすると二重追記になる（2026-08-22 実測）。
      //   richEditor では to 全文一致も使えない（正規化されるため）→ marker で判定する。
      if (cur.includes(rep.marker ?? rep.to)) { doneCount++; console.log(`  [skip] ${rep.field}: 既に反映済み`); continue; }
      const n = cur.split(rep.from).length - 1;
      if (n !== 1) { bad++; console.log(`  ✗ ${rep.field}: from が ${n} 回出現（1回でないため停止）`); continue; }
      const next = (body[rep.field] ?? cur).replace(rep.from, rep.to);
      body[rep.field] = next;
      console.log(`  → ${rep.field}: ${cur.length} → ${next.length}字`);
    }
    if (Object.keys(body).length === 0) {
      if (doneCount === t.reps.length) { skipped++; console.log('  [skip] 全置換が反映済み — 冪等スキップ'); }
      continue;
    }
    if (DRY_RUN) { console.log(`  [dry-run] PATCH ${Object.keys(body).join(', ')}`); continue; }

    await apiFetch('PATCH', url, body);
    await sleep(800);
    const after = (await apiFetch('GET', url)) as Record<string, unknown>;

    // #106: 全field照合（対象フィールドは意図どおり／それ以外は不変）
    let drift = 0;
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (SKIP.has(k)) continue;
      if (k in body) {
        if (after[k] !== body[k]) {
          // richEditor は見出し id の自動採番・rel="noopener noreferrer" 補完など正規化を行う。
          // 意図の文言が全て入っていれば正規化と判定し drift にしない（2026-08-22 実測）。
          const okIntent = t.reps.filter((r) => r.field === k).every((r) => String(after[k] ?? '').includes(r.marker ?? r.to));
          if (okIntent) console.log(`  ✓ ${k}: 反映（${String(after[k]).length}字・microCMS 正規化あり: 送信値と文字列一致せず・意図の文言は全て含む）`);
          else { drift++; console.log(`  ✗ ${k}: 送信値と GET 値が不一致（意図の文言が入っていない）`); }
        } else {
          console.log(`  ✓ ${k}: 反映一致（${String(after[k]).length}字）`);
        }
      } else if (JSON.stringify(after[k]) !== JSON.stringify(before[k])) {
        drift++;
        console.log(`  ✗ ${k}: 意図しない変化 ${JSON.stringify(before[k])?.slice(0, 80)} → ${JSON.stringify(after[k])?.slice(0, 80)}`);
      }
    }
    // 実体検査: 新文言が入っていること。置換型（from ⊄ to）はさらに旧文言が消えていること
    for (const rep of t.reps) {
      const s = String(after[rep.field] ?? '');
      const isAppend = rep.to.includes(rep.from);
      const ok = s.includes(rep.marker ?? rep.to) && (isAppend || !s.includes(rep.from));
      if (!ok) { drift++; console.log(`  ✗ ${rep.field}: 新文言不在${isAppend ? '' : ' or 旧文言残存'}`); }
    }
    if (drift) { bad++; } else { patched++; console.log('  ✓ 意図外の変化 0'); }
    await sleep(500);
  }
  console.log(`\n[patch-balancing-cap-2026-08-22] PATCH ${patched} / skip ${skipped} / 不一致 ${bad}`);
  if (bad) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
