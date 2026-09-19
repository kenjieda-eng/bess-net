#!/usr/bin/env tsx
/**
 * scripts/post-policy-events-2026-09-19.ts — 週次政策チェック（2026-09-19 実施分）の policy-events 投入
 *
 * 原稿: OneDrive 03_5月13日朝_実行/週次政策_policy-calendar投入_2026-09-19.md §2（POST 4 件）・§3（PATCH）
 * POST: meti-chotatsu-kakaku-iinkai-116-2026-09 / occto-chousei-iinkai-122-hokan-auction-2026-09 /
 *       egov-denjiho-sekourisoku-kaisei-pubcomm-2026-09 / meti-electric-power-wg4-2026-09
 * PATCH: A occto-balancing-committee-63-2026-09（status＋末尾追記）／B occto-teikan-kitei-henkou-pubcomm-2026-09・
 *        occto-capacity-teishi-keikaku-manual-pubcomm-2026-09（status）／C occto-gridcode-kentoukai-22-2026-08（末尾追記）／
 *        D meti-chuchoki-market-wg4-2026-09（置換＋status＋sourceUrl）
 *
 * ★手順3（追加③）の判定: (a)。e-Gov 案件 620340007 の意見公募要領・省令案・様式案を取得して確認した結果、
 *   様式第31の18の2（大規模発電等用電気工作物休止（廃止）協議申込書）に「蓄電用の電気工作物」の区分があり、
 *   省令案は発電事業に係る発電等用電気工作物の要件（新設 第3条の4・出力1万kW）と休廃止事前協議の対象出力
 *   （第45条の19の2・10万kW以上）を定める＝蓄電所に直接触れる。原稿の description の
 *   「改正内容の詳細は案件ページで確認する必要がある。」の 1 文だけを実物の改正項目 2 文に置換した（他は原稿のまま）。
 *
 * ★#106: select は v4 スキーマの実在値のみ。eventType / status は単一選択でも配列で送る（9/5 便で HTTP 400 実証）。
 *   投入後に GET で全 field を照合する。
 * ★#122: description の追記はマーカー（素の文言）で冪等判定。置換は置換元が 1 回だけのときに限る。
 * ★DELETE / PUT なし。他エンドポイントは触らない。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/post-policy-events-2026-09-19.ts [--dry-run]
 */
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const DRY = process.argv.includes('--dry-run');
const EP = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);

// ─────────────────────────────────────────────────────────────
// §2 POST 4 件（description は原稿のまま。③ のみ手順3(a) の 1 文置換）
// ─────────────────────────────────────────────────────────────
const POSTS: Array<Record<string, unknown> & { slug: string }> = [
  {
    slug: 'meti-chotatsu-kakaku-iinkai-116-2026-09',
    title: '第116回 調達価格等算定委員会: 託送収入見通しの変更を踏まえた発電側課金相当額の変更（報告）・着床式洋上風力 第4回入札の上限価格',
    eventDate: '2026-09-25',
    eventType: ['重要会議'],
    issuer: '経済産業省 資源エネルギー庁（省エネルギー・新エネルギー部 新エネルギー課）',
    description:
      '経済産業省の第116回 調達価格等算定委員会が2026年9月25日（金）11時〜12時にオンラインで開催される（非公開）。議題は (1) 入札（着床式洋上風力〔海洋再エネ整備法適用外〕第4回）の上限価格について、(2) 託送供給等に係る収入の見通しの変更を踏まえた発電側課金相当額の変更について（報告事項）、(3) その他。一般送配電事業者8社の託送供給等収入見通しの変更は2026年9月4日に国が承認済みで、2026年11月1日適用の託送料金期中改定により発電側課金の基本料金が上昇する（東北 93.04→109.37円/kW、関西 97.98→116.23円/kW 等）。系統用蓄電池は放電時に発電側課金を負担する一方、FIT/FIP 認定電源には調達価格・基準価格に発電側課金相当額が上乗せされる仕組みで、本委員会はその相当額の見直しを報告として扱う。蓄電池（FIP 併設を含む）の発電側課金負担と相当額調整の整合をフォローする論点。配布資料は開催後に委員会ページで公開。',
    sourceUrl: 'https://www.meti.go.jp/shingikai/information/2026/20260925_2k.html',
    status: ['予定'],
    category: ['重要会議', '公表'],
  },
  {
    slug: 'occto-chousei-iinkai-122-hokan-auction-2026-09',
    title: '第122回 調整力及び需給バランス評価等に関する委員会: 補完オークション・需給状況を表す新たなシグナルの検討状況・今後の供給信頼度評価の課題整理',
    eventDate: '2026-09-29',
    eventType: ['重要会議'],
    issuer: '電力広域的運営推進機関（OCCTO）',
    description:
      '電力広域的運営推進機関の第122回 調整力及び需給バランス評価等に関する委員会が2026年9月29日（火）17時〜19時に開催される（会議室O、Web併用。議題資料は前日公開予定）。議題は (1) 補完オークションについて、(2) 需給状況を表す新たなシグナルの検討状況について、(3) 今後の供給信頼度評価の課題整理について（報告）。第121回（8月24日）で「補完オークション」の在り方を取りまとめており、本回はその続報。補完オークションは容量市場メイン・追加オークション後に供給力が不足する場合の追加調達の枠組みで、系統用蓄電池が安定電源（放電可能時間3時間以上）として参加する容量市場の調達機会と約定価格の形成に関わる。需給状況を表す新たなシグナルは、需給ひっ迫時の市場価格・広域予備率に代わる指標の検討で、蓄電池の放電タイミングと収益機会に影響しうる。配布資料・議事録は開催後に同ページで公開。',
    sourceUrl: 'https://www.occto.or.jp/iinkai/chousei_jukyu/122.html',
    status: ['予定'],
    category: ['容量市場', '重要会議'],
  },
  {
    slug: 'egov-denjiho-sekourisoku-kaisei-pubcomm-2026-09',
    title: '資源エネ庁 意見募集: 電気事業法施行規則等の一部を改正する省令案等（案件番号 620340007、10/15 締切）',
    eventDate: '2026-09-16',
    endDate: '2026-10-15',
    eventType: ['パブコメ'],
    issuer: '経済産業省 資源エネルギー庁 電力・ガス事業部',
    description:
      '資源エネルギー庁 電力・ガス事業部が2026年9月16日に「電気事業法施行規則等の一部を改正する省令案等に対する意見公募」を公示した（e-Gov 案件番号 620340007、カテゴリー 工業、受付締切 2026年10月15日23時59分）。2026年7月17日に成立した改正電気事業法（大規模送電線・大規模電源の整備促進と広域機関による融資、大規模電源の休廃止時の一般送配電事業者との事前協議、中長期市場・需給調整市場を開設する卸電力取引所の大臣指定、太陽電池発電設備の適合性確認等。公布後9月以内に施行）の施行に向けた省令改正の可能性があるが、意見公募要領によれば改正の内容は、基幹送変電設備整備等計画及び発電等用電気工作物整備等計画の申請・認定手続と認定要件等の規定の整備、広域的運営推進機関の財務・会計及び業務に関する規定の整備、広域機関が貸付けの内容を決定するに当たって従うべき基準の制定、卸電力取引所の国庫納付に伴う規定の整備、大規模電源の休廃止の際の事前の協議に関する規定の整備等である。省令案は発電事業に係る発電等用電気工作物の要件（新設 第3条の4）として出力1万キロワットを定め、休廃止の事前協議の対象を出力10万キロワット以上（第45条の19の2）とし、協議申込書の様式（様式第31の18の2）には「発電用の電気工作物」と並んで「蓄電用の電気工作物」の区分が置かれている。系統用蓄電池は電気事業法上の発電設備として同施行規則の届出・技術基準・発電事業の規定に従うため、改正範囲に蓄電池関連の規定が含まれるかを確認のうえ意見提出を検討する対象。',
    sourceUrl: 'https://public-comment.e-gov.go.jp/servlet/Public?CLASSNAME=PCMMSTDETAIL&id=620340007&Mode=0',
    status: ['進行中'],
    category: ['パブコメ', '法改正'],
  },
  {
    slug: 'meti-electric-power-wg4-2026-09',
    title: '第4回 電力事業環境整備WG: 託送供給等約款の変更届出（発電側課金の期中改定）を報告・小売電気事業者の量的な供給力確保の在り方',
    eventDate: '2026-09-18',
    eventType: ['重要会議'],
    issuer: '経済産業省 資源エネルギー庁（電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会）',
    description:
      '経済産業省 総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会の第4回 電力事業環境整備ワーキンググループが2026年9月18日（金）9時〜11時にオンラインで開催された（インターネット配信あり）。議題は (1) 託送供給等約款の変更届出について（報告、資料3）、(2) 小売電気事業者の量的な供給力確保の在り方について（資料4）。資料3 は一般送配電事業者8社の託送収入見通し変更（2026年9月4日 国が承認）に伴う託送供給等約款の変更届出の報告で、2026年11月1日適用の託送料金期中改定により発電側課金の基本料金が上昇する（東北 93.04→109.37円/kW、関西 97.98→116.23円/kW 等）。系統用蓄電池は放電時に発電側課金を負担するため、期中改定は蓄電所の運転コストに直結する。資料4 の小売電気事業者の供給力確保義務の在り方は、容量市場・相対契約による供給力調達の需要側ルールとして蓄電池のkW価値の買い手行動に影響する。第3回（8月25日）は改正電気事業法に基づくファイナンス支援（融資制度）を扱っており、本WGは改正電事法の運用と電力事業の環境整備を横断的に扱う。配布資料4点は同ページで公開。',
    sourceUrl: 'https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/electric_power_wg/004.html',
    status: ['終了'],
    category: ['重要会議', '公表'],
  },
];

// ─────────────────────────────────────────────────────────────
// §3 PATCH
// ─────────────────────────────────────────────────────────────
type Patch = {
  label: string;
  slug: string;
  set?: Record<string, unknown>;
  /** description 末尾への 1 文追記（marker があれば適用済み＝#122） */
  append?: { text: string; marker: string };
  /** description 内の 1 文置換（置換元が 1 回だけのときのみ） */
  replace?: { old: string; new: string };
  why: string;
};

const PATCHES: Patch[] = [
  {
    label: 'A 第63回 需給調整市場検討小委（開催済み・資料公開）',
    slug: 'occto-balancing-committee-63-2026-09',
    set: { status: ['終了'] },
    append: {
      text: '9月15日に開催され、配布資料4点（資料2 二次調整力①の広域運用および広域調達について、資料3 需給調整市場前日取引化後の市場外調整力の状況等について、資料4 議論の方向性と整理（上期報告・9月15日修正版、新旧対照表あり））が公開された。',
      marker: '配布資料4点（資料2 二次調整力①の広域運用および広域調達について',
    },
    why: '一次 https://www.occto.or.jp/iinkai/jukyuchousei/63.html（更新日 2026-09-16）で開催日・議題・配布資料4点・資料4 の 9/15 修正版と新旧対照表を確認',
  },
  {
    label: 'B1 定款・業務規程・指針変更案 意見募集（9/18 締切）',
    slug: 'occto-teikan-kitei-henkou-pubcomm-2026-09',
    set: { status: ['終了'] },
    why: '募集終了（OCCTO トップ新着 9/18「＜募集終了＞」）。パブコメは deriveDisplayStatus の日付導出の対象外・格納「進行中」は自動変更されないため PATCH が要る',
  },
  {
    label: 'B2 容量停止計画マニュアル 意見募集（9/16 締切）',
    slug: 'occto-capacity-teishi-keikaku-manual-pubcomm-2026-09',
    set: { status: ['終了'] },
    why: '締切経過（9/16）。同上の理由で PATCH が要る',
  },
  {
    label: 'C 第22回 グリッドコード検討会（資料5 の蓄電池要件を明示）',
    slug: 'occto-gridcode-kentoukai-22-2026-08',
    append: {
      text: '資料5 は「周波数調整に関する蓄電池の個別技術要件の検討」を柱とし、蓄電池の有効電力変化速度（ランプレート）上限を含む制御応答性の要件案を扱っている。',
      marker: '資料5 は「周波数調整に関する蓄電池の個別技術要件の検討」',
    },
    why: '9/11 便 §7 の持ち越し。EDAさんの指示文に本行が含まれている＝GO 済みとして実行',
  },
  {
    label: 'D 中長期取引市場検討WG 第4回（議題確定・資料公開）',
    slug: 'meti-chuchoki-market-wg4-2026-09',
    set: { status: ['終了'], sourceUrl: 'https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/chuchoki_torihiki/004.html' },
    replace: {
      old: '開催案内（9月9日更新）時点で議題は「調整中」。',
      new: '資料3「中長期取引市場の詳細検討（3）（市場範囲、供出量を高める方策等）」が公開され、市場範囲と供出量を高める方策が論点となった。',
    },
    why: '一次 chuchoki_torihiki/004.html（最終更新 2026-09-16）で開催日と資料3 の題名をブラウザ本文で確認',
  },
];

let posted = 0, skipped = 0, patched = 0, failed = 0;
const notes: string[] = [];

async function runPost(row: Record<string, unknown> & { slug: string }): Promise<void> {
  console.log(`\n■ POST ${row.slug}`);
  const cur = await bySlug(row.slug);
  if (cur) { console.log('   [skip] 既存あり（重複 POST しない）'); skipped++; notes.push(`${row.slug}: 既存あり`); return; }
  for (const [k, v] of Object.entries(row)) {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    console.log(`   ${k}: ${s.length > 120 ? s.slice(0, 120) + `…（${s.length}字）` : s}`);
  }
  if (DRY) { posted++; return; }
  const res = await api<{ id: string }>('POST', EP, row);
  await sleep(900);
  const a = await bySlug(row.slug);
  let bad = 0;
  for (const [k, v] of Object.entries(row)) {
    if (norm(a?.[k]) !== norm(v)) { bad++; console.log(`   ✗ ${k}: 送信=${norm(v)} 保存=${norm(a?.[k])}`); }
  }
  console.log(`   #106: ${bad === 0 ? `✓ 全 ${Object.keys(row).length} field 一致（id=${res.id}）` : `★NG 不一致 ${bad}`}`);
  if (bad === 0) posted++; else failed++;
  await sleep(300);
}

async function runPatch(p: Patch): Promise<void> {
  console.log(`\n■ PATCH ${p.label}  [${p.slug}]`);
  const b = await bySlug(p.slug);
  if (!b) { console.log('   ★NG 不在'); failed++; return; }
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p.set ?? {})) {
    if (norm(b[k]) === norm(v)) { console.log(`   ${k}: ${norm(v)} [同値・skip]`); continue; }
    payload[k] = v;
    console.log(`   ${k}: 前 ${norm(b[k])} → 後 ${norm(v)}`);
  }
  const desc = String(b.description ?? '');
  if (p.append) {
    if (count(desc, p.append.marker) >= 1) console.log('   description: 追記済み（冪等・marker あり）');
    else {
      payload.description = desc + p.append.text;
      console.log(`   description: 末尾に 1 文追記（${desc.length}→${String(payload.description).length}字）`);
      console.log(`      追記文: ${p.append.text}`);
    }
  }
  if (p.replace) {
    const n = count(desc, p.replace.old);
    if (n === 0 && desc.includes(p.replace.new)) console.log('   description: 置換済み（冪等）');
    else if (n !== 1) { console.log(`   [見送り] description: 置換元が ${n} 箇所（一意でない）`); notes.push(`${p.slug}: 置換元 ${n} 箇所`); skipped++; return; }
    else {
      payload.description = desc.replace(p.replace.old, p.replace.new);
      console.log(`   description: 「${p.replace.old}」→「${p.replace.new}」（${desc.length}→${String(payload.description).length}字）`);
    }
  }
  if (Object.keys(payload).length === 0) { console.log('   [skip] 変更なし（冪等）'); skipped++; return; }
  console.log(`   根拠: ${p.why}`);
  if (DRY) { patched++; return; }
  await api('PATCH', `${EP}/${b.id}`, payload);
  await sleep(900);
  const a = await bySlug(p.slug);
  let bad = 0;
  for (const k of new Set([...Object.keys(b), ...Object.keys(a ?? {}), ...Object.keys(payload)])) {
    if (SYS.has(k)) continue;
    if (k === 'description' && 'description' in payload) {
      const av = String(a?.description ?? '');
      const okMarker = p.append ? count(av, p.append.marker) === 1 : true;
      const okReplace = p.replace ? count(av, p.replace.old) === 0 && av.includes(p.replace.new) : true;
      if (!okMarker || !okReplace) { bad++; console.log(`   ✗ description: marker/置換の確認に失敗`); }
      else console.log(`   ✓ description: ${p.append ? 'marker 1 回' : ''}${p.replace ? '置換元なし・置換後あり' : ''}（送信値と全文一致=${av === payload.description}）`);
      continue;
    }
    const want = k in payload ? payload[k] : b[k];
    if (norm(a?.[k]) !== norm(want)) { bad++; console.log(`   ✗ ${k}: 期待=${norm(want)} 保存=${norm(a?.[k])}`); }
  }
  console.log(`   #106: ${bad === 0 ? `✓ 送信 ${Object.keys(payload).length} field 反映・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  if (bad === 0) patched++; else failed++;
  await sleep(300);
}

async function main(): Promise<void> {
  console.log(`[週次政策 2026-09-19] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / POST ${POSTS.length} 件・PATCH ${PATCHES.length} 件`);
  const before = await api<{ totalCount: number }>('GET', `${EP}?limit=0`);
  console.log(`投入前の総件数: ${before.totalCount}`);
  for (const row of POSTS) await runPost(row);
  for (const p of PATCHES) await runPatch(p);
  const after = await api<{ totalCount: number }>('GET', `${EP}?limit=0`);
  console.log(`\n[done] POST ${posted} / スキップ ${skipped} / PATCH ${patched} / 失敗 ${failed}`);
  console.log(`総件数: ${before.totalCount} → ${after.totalCount}`);
  notes.forEach((n) => console.log('  - ' + n));
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
