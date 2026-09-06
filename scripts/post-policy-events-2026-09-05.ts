#!/usr/bin/env tsx
/**
 * scripts/post-policy-events-2026-09-05.ts — 週次政策チェック 2026-09-05 便
 *
 * 原稿: OneDrive 03_5月13日朝_実行/週次政策_policy-calendar投入_2026-09-05.md §2
 * 前提: 金曜ワンセット9-4 §③ が未実施（2026-09-05 GET で 2 slug 不在を確認）のため、先に実施する。
 *
 * ■ 書込（policy-events のみ・DELETE/PUT なし）
 *   A. 9-4§③(i)  PATCH capacity-main-auction-2026-09 … eventDate/endDate を公式実値へ
 *        公式: OCCTO 告知 https://www.occto.or.jp/news/012742.html（2026-07-30 掲載）＋募集要綱（2030年度・2026-07-30 版）p.9 表
 *        「(4)2026年10月13日（火）〜2026年10月23日（金）　応札の受付期間」
 *        「(5)2026年10月26日（月）〜2026年10月30日（金）　応札容量算定に用いた期待容量等算定諸元一覧登録受付期間」
 *        ★【2026-09-05 追修便で是正】本便の初版は PDF 平文化の行ずれで (5) を応札期間と誤読し 10/26〜10/30 を書いた。
 *          ユウ内部メモの 10/13〜10/23 が正。value を 10/13〜10/23 に直してある（再実行しても誤値に戻らない）。
 *        現状 eventDate=2026-09-01・endDate なし → deriveDisplayStatus が「終了」に自動補正して誤表示（9/2 ユウ発見）。
 *   B. 9-4§③(ii) POST 2件（title は 9-4 原稿に無いため CC が構成・description は原稿どおり）
 *   C. 本便 POST 4件（原稿 §2 のとおり・description は改変しない）
 *   D. PATCH① occto-capacity-kentoukai-76-20260901 … description 末尾に 1 文追記のみ
 *        ★status は触らない（実測分岐）: eventType=重要会議・endDate なし・eventDate 9/1 < 今日 → deriveDisplayStatus が
 *          表示を自動で「終了」にする（src/lib/policy-utils.ts）。9/1 便 3-c と同じ判定。
 *        冪等: マーカー「9/1 開催済み。」の存在で判定（#122。description は textArea＝正規化なし）。
 *   E. POST 6件を slug で GET し全 field を送信値と照合（#106 select silently drop 検出）
 *
 * ■ 事前確認（2026-09-05 実施済み）
 *   ・#87 重複: 6 slug とも不在。title 2語照合（容量停止計画／定款／安定供給WG／第121回／補完オークション）で
 *     同一イベントの既存登録なし（「容量停止計画」ヒットの capacity-outage-plan-briefing-2026-06 は 6/26 実務説明会＝別イベント）
 *   ・#106 select: v4 スキーマ JSON で eventType/status/category の全値が実在
 *   ・sourceUrl: 7 URL とも HTTP 200（METI 006.html のみ curl 403 → ブラウザで本文照合:
 *     開催日 2026年8月31日・参考資料2「長期脱炭素電源オークションの第4回募集に向けて」＝原稿と一致・修正不要）
 *   ・追加② 説明資料 PDF p.10: 「プロジェクト全体の融資総額に対して３割を上限」「民間水準並みの金利水準」
 *     「長期脱炭素電源オークションの落札案件、投資適格である契約先との長期PPA案件」を逐語確認（改版なし）
 *   ・第76回 76.html: 【資料３】【資料４】【資料５】・9月2日・22ページ・表記 を確認（原稿の半角「資料3」は転記表記の差）
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

type Ev = Record<string, unknown> & { id: string; slug: string };

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getAll(): Promise<{ total: number; list: Ev[] }> {
  const list: Ev[] = [];
  let total = 0;
  for (let offset = 0; offset < 1000; offset += 100) {
    const d = await api<{ totalCount: number; contents: Ev[] }>('GET', `${BASE}?limit=100&offset=${offset}`);
    total = d.totalCount;
    list.push(...d.contents);
    if (list.length >= total) break;
  }
  return { total, list };
}
async function getBySlug(slug: string): Promise<Ev | null> {
  const d = await api<{ contents: Ev[] }>('GET', `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`);
  return d.contents[0] ?? null;
}
/** 変更フィールド以外の不変を確認（#106） */
function otherDiffs(before: Ev, after: Ev | null, changed: string[]): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {})])) {
    if (SYS.has(k) || changed.includes(k)) continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after?.[k])) out.push(k);
  }
  return out;
}
/** 送信値と保存値の一致（日付は日付部分・select は配列化して比較） */
function eq(sent: unknown, stored: unknown): boolean {
  if (typeof sent === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sent)) return String(stored ?? '').slice(0, 10) === sent;
  const a = Array.isArray(sent) ? sent : [sent];
  const b = Array.isArray(stored) ? stored : [stored];
  return JSON.stringify(a) === JSON.stringify(b);
}

// ─────────────────────────────────────────────────────────────
// B. 9-4§③(ii)  ／  C. 本便 4件
// ─────────────────────────────────────────────────────────────
type NewEv = {
  slug: string; title: string; eventDate: string; eventType: string; issuer: string;
  status: string; category: string[]; description: string; sourceUrl: string;
};

const POSTS: NewEv[] = [
  // ── B-1（9-4§③(ii)）
  {
    slug: 'ltdc-2026-boshuyoukou-kouhyou-2026-09',
    title: 'OCCTO 公表: 長期脱炭素電源オークション募集要綱（応札年度2026年度）・容量確保契約約款を制定（9/2）',
    eventDate: '2026-09-02',
    eventType: '公表',
    issuer: '電力広域的運営推進機関（OCCTO）',
    status: '終了',
    category: ['長期脱炭素オークション', '公表'],
    description:
      '電力広域的運営推進機関が2026年9月2日、「容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）」および「長期脱炭素電源オークション 容量確保契約約款」を公表・制定した。参加要件・登録方法・応札方法・落札決定方法・契約条件を規定する。同要綱に関する制度詳細説明会は9月17日開催（申込締切9月9日、既登録）。',
    sourceUrl: 'https://www.occto.or.jp/news/013102.html',
  },
  // ── B-2（9-4§③(ii)）
  {
    slug: 'ltdc-gyoumu-manual-pubcom-2026-09',
    title: 'OCCTO 意見募集: 長期脱炭素電源オークション業務マニュアル（参加登録・応札・容量確保契約書の締結編、応札年度2026年度）（9/15締切）',
    eventDate: '2026-09-15',
    eventType: 'パブコメ',
    issuer: '電力広域的運営推進機関（OCCTO）',
    status: '進行中',
    category: ['長期脱炭素オークション', 'パブコメ'],
    description:
      '電力広域的運営推進機関が「容量市場業務マニュアル 長期脱炭素電源オークション 参加登録・応札・容量確保契約書の締結編（応札年度：2026年度）」（案）について意見募集を実施している。募集期間は2026年9月2日〜9月15日（火）17時、所定様式をメールで提出する。',
    sourceUrl: 'https://www.occto.or.jp/iken/2026_260902_youryoushijo_gyoumumanual_longax_1.html',
  },
  // ── C-①（本便・原稿 §2 追加①）
  {
    slug: 'occto-capacity-teishi-keikaku-manual-pubcomm-2026-09',
    title: 'OCCTO 意見募集: 容量停止計画の調整業務マニュアル（メイン／長期脱炭素 別冊、対象実需給 2027・2028年度）（9/16締切）',
    eventDate: '2026-09-16',
    eventType: 'パブコメ',
    issuer: '電力広域的運営推進機関（OCCTO）需給計画部',
    status: '進行中',
    category: ['容量市場', '長期脱炭素オークション', 'パブコメ'],
    description:
      '電力広域的運営推進機関が業務規程第6条第1項に基づき、「容量市場業務マニュアル 容量停止計画の調整業務編（実需給年度の2年度前に行う容量停止計画の調整）」（対象実需給年度2028年度、および2027年度〔適用開始2026年7月30日〕）と「容量市場業務マニュアル 長期脱炭素電源オークション 実需給期間前から発生するリクワイアメント対応編（別冊）容量停止計画の調整業務」（対象実需給年度2028年度・2027年度）の計4文書（案）について意見募集を実施している（募集期間2026年9月3日〜9月16日（水）17時、所定様式をメール提出）。対象はメインオークション落札の安定電源・変動電源（単独）と長期脱炭素電源オークション落札の安定電源・変動電源が実需給年度の2年前に行う容量停止計画の提出・調整・経済的ペナルティ確定の手続。長期脱炭素電源オークションの主要落札区分である系統用蓄電池は、落札後の停止計画調整とペナルティ運用が本マニュアルに直接従うため、実務影響が大きい。',
    sourceUrl: 'https://www.occto.or.jp/iken/000714.html',
  },
  // ── C-②（本便・原稿 §2 追加②）
  {
    slug: 'occto-teikan-kitei-henkou-pubcomm-2026-09',
    title: 'OCCTO 意見募集: 定款・業務規程・送配電等業務指針の変更案（大規模電源・地域内送電線の融資業務追加、9/18 正午締切）',
    eventDate: '2026-09-18',
    eventType: 'パブコメ',
    issuer: '電力広域的運営推進機関（OCCTO）総務部',
    status: '進行中',
    category: ['法改正', 'パブコメ'],
    description:
      '電力広域的運営推進機関が、2026年7月成立の改正電気事業法（施行予定2026年12月）等に対応する定款・業務規程・送配電等業務指針の変更案について意見募集を実施している（募集期間2026年9月2日〜9月18日（金）12時必着、メールまたは郵送）。施行期日は2026年12月1日または経済産業大臣認可日のいずれか遅い日。主な変更点は (1) 経済産業大臣が認定した地域内送電線等の整備計画および大規模電源の整備計画（認定発電等用電気工作物整備等計画）に基づく資金の貸付け業務（財政投融資等を財源）の追加、(2) 基幹送変電設備整備等計画の認定に先立つ工事概要・費用の妥当性評価、(3) 広域系統整備交付金の申請・算定方法の変更、(4) 広域系統整備計画のコスト検証ガイドラインに基づく評価。説明資料では、電源向け融資の投資回収予見性の確認要件として「長期脱炭素電源オークションの落札案件、投資適格である契約先との長期PPA案件であること等」が例示され、融資総額はプロジェクト全体の3割上限を基本、金利は民間水準並みとされる。長期脱炭素電源オークションで落札した系統用蓄電池の資金調達手段に関わる制度変更。上位法令の意見公募は今後資源エネルギー庁が別途実施予定。',
    sourceUrl: 'https://www.occto.or.jp/iken/2026_260902_ikenboshu.html',
  },
  // ── C-③（本便・原稿 §2 追加③）
  {
    slug: 'meti-stable-supply-wg6-ltdc-round4-final-2026-08',
    title: '電力安定供給WG 第6回: 長期脱炭素電源オークション「第4回募集に向けて」確定版（令和8年8月）を提示',
    eventDate: '2026-08-31',
    eventType: '重要会議',
    issuer: '経済産業省 資源エネルギー庁（総合資源エネルギー調査会 次世代電力・ガス事業基盤構築小委員会 電力安定供給WG）',
    status: '終了',
    category: ['長期脱炭素オークション', '重要会議'],
    description:
      '2026年8月31日開催の総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会 電力安定供給ワーキンググループ（第6回）。参考資料として「長期脱炭素電源オークションの第4回募集に向けて」（令和8年8月、確定版）が掲載され、7月17日〜8月16日に実施したパブリック・コメント（案件番号620226020、既登録 meti-ltdc-round4-guideline-pubcomm-2026-07）を経た第4回募集（応札年度2026年度）の国側の方針が固まった。第4回募集は電源種混合で脱炭素電源を対象に落札電源へ原則20年間の固定費水準の容量収入を確保する仕組みで、系統用蓄電池・揚水は第1回〜第3回を通じて主要な落札電源。OCCTO 側では9月2日に「募集要綱（応札年度2026年度）」と「容量確保契約約款」を公表しており、国側方針と広域機関側要綱の両輪が揃った。',
    sourceUrl: 'https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/006.html',
  },
  // ── C-④（本便・原稿 §2 追加④）
  {
    slug: 'occto-chousei-iinkai-121-hokan-auction-2026-08',
    title: '第121回 調整力及び需給バランス評価等に関する委員会: 容量市場「補完オークション」の在り方を取りまとめ・2027年度需給見通し',
    eventDate: '2026-08-24',
    eventType: '重要会議',
    issuer: '電力広域的運営推進機関（OCCTO）',
    status: '終了',
    category: ['容量市場', '重要会議'],
    description:
      '2026年8月24日18:00〜20:00開催。議題は (1) 中長期の需給見通しを踏まえた供給力確保策について（資料1）、(2) 2027年度の需給見通しについて（報告、資料2）、(3) イベリア半島大規模停電を踏まえた日本の電力系統での対応について（報告、資料3）。資料1では追加の供給力確保策「容量市場（補完オークション）」について、実需給1〜3年前の期間をまとめて募集し複数年契約も可能とする、計画上休廃止となっている高経年電源を対象にコストベースのマルチプライスで調達する、容量市場の一部として容量拠出金で費用負担する、との整理を示し、予備電源との一括募集の可能性にも言及した。資料2では容量市場追加オークション約定結果等を反映した再評価で、2027年1月前半に中部・北陸・関西・中国・九州の5エリアで厳気象H1需要に対する予備率が3%を下回る見通しを報告した。資料3では速い出力変化が可能な蓄電池に対する変化速度上限の設定をグリッドコード検討会で検討中と整理している。',
    sourceUrl: 'https://www.occto.or.jp/iinkai/chousei_jukyu/121.html',
  },
];

// ─────────────────────────────────────────────────────────────
// A. 9-4§③(i)  PATCH 応札期間
// ─────────────────────────────────────────────────────────────
const MAIN_AUCTION = {
  slug: 'capacity-main-auction-2026-09',
  expect: { eventDate: '2026-09-01', endDate: '' },
  // 2026-09-05 追修便で 10/26〜10/30（誤読）→ 10/13〜10/23 に是正。expect は初版実行時の現状値（9/1・なし）のまま。
  value: { eventDate: '2026-10-13', endDate: '2026-10-23' },
  why: 'OCCTO 012742.html（2026-07-30）「(4)2026年10月13日（火）〜2026年10月23日（金）　応札の受付期間」',
};

// ─────────────────────────────────────────────────────────────
// D. PATCH① 第76回 description 追記
// ─────────────────────────────────────────────────────────────
const KENTOUKAI76 = {
  slug: 'occto-capacity-kentoukai-76-20260901',
  marker: '9/1 開催済み。',
  append:
    '9/1 開催済み。配布資料（資料3 追加オークション約定結果、資料4 長期脱炭素電源オークション募集要綱に関する意見募集の結果、資料5 電源等区分と需給ひっ迫時リクワイアメント・ペナルティの検討方向性）は 2026年9月2日に公開（資料5 は同日22ページの表記修正あり）。',
};

let posted = 0, skipped = 0, patched = 0, failed = 0;
const notes: string[] = [];

async function blockA(): Promise<void> {
  console.log('\n■ A. 9-4§③(i) PATCH 応札期間: ' + MAIN_AUCTION.slug);
  const before = await getBySlug(MAIN_AUCTION.slug);
  if (!before) { console.log('  ★NG 不在'); failed++; return; }
  const curDate = String(before.eventDate ?? '').slice(0, 10);
  const curEnd = String(before.endDate ?? '').slice(0, 10);
  console.log(`  現在: eventDate=${curDate} endDate=${curEnd || '(なし)'} status=${JSON.stringify(before.status)}`);
  if (curDate === MAIN_AUCTION.value.eventDate && curEnd === MAIN_AUCTION.value.endDate) {
    console.log('  [skip] 既に公式実値（冪等 #91）'); skipped++; notes.push('A: 既に反映済み'); return;
  }
  if (curDate !== MAIN_AUCTION.expect.eventDate || curEnd !== MAIN_AUCTION.expect.endDate) {
    console.log(`  [スキップ] 現状値が想定と不一致（想定 eventDate=${MAIN_AUCTION.expect.eventDate} endDate なし）→ 書き込まない`);
    skipped++; notes.push('A: 現状値不一致でスキップ'); return;
  }
  console.log(`  [PATCH] eventDate ${curDate}→${MAIN_AUCTION.value.eventDate} / endDate (なし)→${MAIN_AUCTION.value.endDate}`);
  console.log(`          根拠: ${MAIN_AUCTION.why}`);
  if (DRY) { patched++; return; }
  await api('PATCH', `${BASE}/${before.id}`, MAIN_AUCTION.value);
  await sleep(1000);
  const after = await getBySlug(MAIN_AUCTION.slug);
  const ok = String(after?.eventDate ?? '').slice(0, 10) === MAIN_AUCTION.value.eventDate && String(after?.endDate ?? '').slice(0, 10) === MAIN_AUCTION.value.endDate;
  const others = otherDiffs(before, after, ['eventDate', 'endDate']);
  console.log(`  #106: 反映=${ok ? '✓' : '★NG'} / 他フィールド変化=${others.join(',') || '0'}`);
  if (ok && others.length === 0) patched++; else failed++;
}

async function blockBC(): Promise<void> {
  console.log('\n■ B/C. POST 6件（9-4§③(ii) 2 ＋ 本便 4）');
  for (const ev of POSTS) {
    const exists = await getBySlug(ev.slug);
    if (exists) { console.log(`  [skip] ${ev.slug} — 既存（id=${exists.id}）`); skipped++; continue; }
    console.log(`  [POST] ${ev.slug}  eventDate=${ev.eventDate} eventType=${ev.eventType} status=${ev.status} category=${JSON.stringify(ev.category)}`);
    if (DRY) { posted++; continue; }
    // ★v4: select は単一選択でも配列で送る（GET も配列で返る）。文字列で送ると HTTP 400 "unexpected data type"
    const payload = { ...ev, eventType: [ev.eventType], status: [ev.status] };
    await api('POST', BASE, payload);
    await sleep(1000);
    const got = await getBySlug(ev.slug);
    if (!got) { console.log('     ★NG: POST 後に GET できない'); failed++; continue; }
    const bad: string[] = [];
    for (const [k, v] of Object.entries(ev)) if (!eq(v, got[k])) bad.push(`${k}: 送信=${JSON.stringify(v)} 保存=${JSON.stringify(got[k])}`);
    if (bad.length) { console.log(`     ★#106 NG:\n       ${bad.join('\n       ')}`); failed++; }
    else { console.log(`     #106: ✓ 全 ${Object.keys(ev).length} field 一致（id=${got.id}）`); posted++; }
    await sleep(400);
  }
}

async function blockD(): Promise<void> {
  console.log('\n■ D. PATCH① 第76回: ' + KENTOUKAI76.slug);
  const before = await getBySlug(KENTOUKAI76.slug);
  if (!before) { console.log('  ★NG 不在'); failed++; return; }
  const desc = String(before.description ?? '');
  console.log(`  現在: status=${JSON.stringify(before.status)} eventType=${JSON.stringify(before.eventType)} endDate=${before.endDate ?? '(なし)'} description=${desc.length}字`);
  console.log('  status: 触らない（実測分岐＝deriveDisplayStatus が 9/1<今日 で「終了」表示に自動補正。9/1 便 3-c と同じ）');
  if (desc.includes(KENTOUKAI76.marker)) { console.log('  [skip] description に既にマーカーあり（冪等 #122）'); skipped++; notes.push('D: 追記済み'); return; }
  const next = desc + KENTOUKAI76.append;
  console.log(`  [PATCH] description 末尾に1文追記 ${desc.length}→${next.length}字`);
  if (DRY) { patched++; return; }
  await api('PATCH', `${BASE}/${before.id}`, { description: next });
  await sleep(1000);
  const after = await getBySlug(KENTOUKAI76.slug);
  const ad = String(after?.description ?? '');
  const ok = ad.includes(KENTOUKAI76.marker) && ad.startsWith(desc);
  const others = otherDiffs(before, after, ['description']);
  console.log(`  #106/#122: マーカー存在=${ad.includes(KENTOUKAI76.marker) ? '✓' : '★NG'} / 旧本文を保持=${ad.startsWith(desc) ? '✓' : '★NG'} / 全文一致=${ad === next} / 他フィールド変化=${others.join(',') || '0'}`);
  if (ok && others.length === 0) patched++; else failed++;
}

async function main(): Promise<void> {
  console.log(`[policy-events 2026-09-05] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  const pre = await getAll();
  const preSeiSaku = pre.list.filter((x) => !(Array.isArray(x.kind) && (x.kind as string[]).includes('業界'))).length;
  console.log(`  投入前: 総件数 ${pre.total}（政策 ${preSeiSaku} ／ 業界 ${pre.total - preSeiSaku}）`);

  await blockA();
  await blockBC();
  await blockD();

  if (!DRY) {
    console.log('\n■ E. 投入後 全件 GET 照合');
    const post = await getAll();
    const postSeiSaku = post.list.filter((x) => !(Array.isArray(x.kind) && (x.kind as string[]).includes('業界'))).length;
    console.log(`  投入後: 総件数 ${post.total}（政策 ${postSeiSaku} ／ 業界 ${post.total - postSeiSaku}）`);
    for (const ev of POSTS) {
      const got = post.list.find((x) => x.slug === ev.slug);
      const bad = got ? Object.entries(ev).filter(([k, v]) => !eq(v, got[k])).map(([k]) => k) : ['(不在)'];
      console.log(`  ${bad.length ? '★NG' : '✓'} ${ev.slug}${bad.length ? ' 不一致=' + bad.join(',') : ''}`);
      if (bad.length) failed++;
    }
  }
  console.log(`\n[done] POST ${posted} / PATCH ${patched} / スキップ ${skipped} / 失敗 ${failed}`);
  notes.forEach((n) => console.log('  - ' + n));
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

export {};
