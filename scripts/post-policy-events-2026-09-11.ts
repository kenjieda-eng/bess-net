#!/usr/bin/env tsx
/**
 * scripts/post-policy-events-2026-09-11.ts — 週次政策チェック 2026-09-11 便（POST 6 件・PATCH なし）
 *
 * 原稿: OneDrive 03_5月13日朝_実行/週次政策_policy-calendar投入_2026-09-11.md §2
 *   POSTS は原稿 §2 から機械抽出して埋め込んだ（description は原稿の値そのまま・改変なし）。
 *   「金曜ワンセット9-11」§③(i)(ii) は本便が正本（slug 同一）。§③ の eventType「説明会」「委員会」は
 *   v4 select に無いため使わず、原稿どおり ["重要会議"]（#106）。
 *
 * ■ 書込: policy-events の POST のみ（PATCH/DELETE/PUT なし・他エンドポイント不可触）
 * ■ #106: eventType/status/category の各値を v4 スキーマ JSON の selectItems で実在確認してから送る。
 *         eventType/status は単一選択でも配列で送る（文字列だと HTTP 400。9/5 便で実証）。
 *         POST 後は slug で GET し、送信した全 field を照合する。
 * ■ v4 任意フィールド（registrationDeadline・endDate）: 管理画面に未追加だと POST が 400 になる。
 *         400 の本文がそのフィールド名を含むときだけ、当該フィールドを落として 1 回だけ再送し、報告に残す。
 *         （400 は作成されないので再送で二重登録にはならない）
 * ■ 冪等: slug が既存ならスキップ（#91）。
 *
 * ■ 事前確認（2026-09-11 実施）
 *   ・#87 重複: 6 slug とも不在。title 2 語照合でヒットは「実務説明会×容量停止計画」の
 *     capacity-outage-plan-briefing-2026-06（6/26 開催・対象 2028 年度のみ）1 件＝別イベント（本便は 10/1・2028＋2027 年度）。
 *   ・sourceUrl: OCCTO 3 件は curl 200。METI 3 件は curl が 202/403（bot 判定）→ ブラウザで本文照合。
 *     差し替え候補 doji_shijo_kento/025.html・chuchoki_torihiki_wg/004.html は「ページが存在しません」→ 差し替えなし。
 *   ・追加④の議題: 開催案内（最終更新 2026-09-09）は依然「調整中」→ description は原稿のまま。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/post-policy-events-2026-09-11.ts [--dry-run]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;
const DRY = process.argv.includes('--dry-run');

type Ev = Record<string, unknown> & { id: string; slug: string };
type NewEv = {
  slug: string; title: string; eventDate: string; eventType: string[]; issuer: string;
  description: string; sourceUrl: string; status: string[]; category: string[];
  endDate?: string; registrationDeadline?: string;
};
const OPTIONAL_V4 = ['registrationDeadline', 'endDate'] as const;

// ─────────────────────────────────────────────────────────────
// 原稿 §2 から機械抽出（手で書き換えない）
// ─────────────────────────────────────────────────────────────
const POSTS: NewEv[] = [
  {
    "slug": "occto-balancing-committee-63-2026-09",
    "title": "第63回 需給調整市場検討小委員会: 二次調整力①の広域運用・広域調達、前日取引化後の市場外調整力、議論の方向性（上期報告）",
    "eventDate": "2026-09-15",
    "eventType": [
      "重要会議"
    ],
    "issuer": "電力広域的運営推進機関（OCCTO）",
    "description": "電力広域的運営推進機関が第63回需給調整市場検討小委員会（第80回 調整力の細分化及び広域調達の技術的検討に関する作業会と合同開催）を2026年9月15日（火）18時〜20時に開催する（第二事務所 会議室O、Web併用）。予定議題は (1) 二次調整力①の広域運用および広域調達について、(2) 需給調整市場前日取引化後の市場外調整力の状況等について、(3) 需給調整市場検討小委員会における議論の方向性と整理（上期報告）。二次調整力①は蓄電池の主要な参入商品の一つであり、エリア内調達から広域調達へ移行すれば約定価格・必要量の決まり方が変わる。前日取引化後に一般送配電事業者が市場外で確保する調整力の量は、市場で取引される調整力の残余量＝蓄電池の需給調整市場収益の前提に直結する。配布資料・議事録は開催後に同ページで公開。",
    "sourceUrl": "https://www.occto.or.jp/iinkai/jukyuchousei/63.html",
    "status": [
      "予定"
    ],
    "category": [
      "需給調整市場",
      "重要会議"
    ]
  },
  {
    "slug": "occto-capacity-outage-plan-briefing-fy2028-2027-2026-09",
    "title": "容量市場 実務説明会（容量停止計画の調整業務）（対象実需給年度：2028年度、2027年度）— 業務マニュアル更新に伴う説明（10/1、申込 9/18 10時）",
    "eventDate": "2026-10-01",
    "eventType": [
      "重要会議"
    ],
    "issuer": "電力広域的運営推進機関（OCCTO）",
    "description": "電力広域的運営推進機関が容量市場 実務説明会（容量停止計画の調整業務）（対象実需給年度：2028年度、2027年度）を2026年10月1日（木）11時〜12時に Web（Webex）で開催する（2026年9月10日案内）。2026年6月26日の実務説明会に続く回で、今回は「容量市場 容量確保契約約款（対象実需給年度：2030年度以降）」「同（2024-2029年度）」および「長期脱炭素電源オークション容量確保契約約款」の内容を踏まえて容量停止計画の調整業務を見直した事項を説明する。対象実需給年度2027年度については、2025年度に実施した容量停止計画調整以降に停止計画を追加・変更したことで供給信頼度の確保に影響を与え、調整不調電源に科される経済的ペナルティが確定した場合の当該ペナルティの反映手続きも説明される。参加申込期日は2026年9月18日（金）10時（申込フォーム、先着）。資料は後日掲載、終了後に録画を「容量市場 説明会資料・動画」で公開予定。関連の業務マニュアル2文書（メイン／長期脱炭素 別冊）は9月3日〜16日に意見募集中。長期脱炭素電源オークションで落札した系統用蓄電池は実需給2年前の停止計画調整とペナルティ運用が本マニュアルに従うため、運用担当者向けの実務説明会。",
    "sourceUrl": "https://www.occto.or.jp/news/013408.html",
    "status": [
      "予定"
    ],
    "category": [
      "容量市場",
      "長期脱炭素オークション"
    ],
    "registrationDeadline": "2026-09-18"
  },
  {
    "slug": "meti-doji-shijo-kentoukai-25-2026-09",
    "title": "第25回 同時市場の在り方等に関する検討会: 技術研究の進め方・第1フェーズ検討進捗・詳細業務設計の進捗報告",
    "eventDate": "2026-09-14",
    "eventType": [
      "重要会議"
    ],
    "issuer": "経済産業省 資源エネルギー庁",
    "description": "経済産業省の第25回 同時市場の在り方等に関する検討会が2026年9月14日（月）9時〜12時に開催される（対面：電力広域的運営推進機関 第二事務所 会議室O 兼オンライン、インターネット配信あり）。議題は (1) 技術研究の進め方について、(2) 第1フェーズの検討進捗状況について、(3) 詳細業務設計の進捗報告。第24回（6月29日）で設置が決まった業務設計・技術検証の研究会による第1フェーズ検証の最初の進捗報告回。同時市場は kWh（電力量）と ΔkW（調整力）を同時に約定させる市場設計の構想で、実現すれば卸電力市場での裁定取引と需給調整市場での ΔkW 供出という系統用蓄電池の現行収益スタックの前提が変わる中長期の最重要制度トラック。配布資料は開催後に検討会ページ（doji_shijo_kento/025.html）で公開見込み。",
    "sourceUrl": "https://www.meti.go.jp/shingikai/information/2026/20260914_3k.html",
    "status": [
      "予定"
    ],
    "category": [
      "需給調整市場",
      "重要会議"
    ]
  },
  {
    "slug": "meti-chuchoki-market-wg4-2026-09",
    "title": "中長期取引市場検討WG 第4回: 電力の中長期取引市場（先物・長期契約）の制度設計（議題は開催案内で調整中）",
    "eventDate": "2026-09-16",
    "eventType": [
      "重要会議"
    ],
    "issuer": "資源エネルギー庁（電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会）",
    "description": "資源エネルギー庁の中長期取引市場検討ワーキンググループ（総合資源エネルギー調査会 電力・ガス事業分科会 次世代電力・ガス事業基盤構築小委員会）第4回が2026年9月16日（水）16時〜18時にオンラインで開催される（インターネット配信あり）。開催案内（9月9日更新）時点で議題は「調整中」。電力の中長期取引市場（先物・長期契約等）の制度設計を検討するWGで、第3回（8月3日）に続く回。フルマーチャント型蓄電所の収益ヘッジ手段（長期契約・オフテイク市場の整備）に将来的に影響し得るトラックとして、議題確定と資料公表をフォローする。",
    "sourceUrl": "https://www.meti.go.jp/shingikai/information/2026/20260916_2k.html",
    "status": [
      "予定"
    ],
    "category": [
      "重要会議"
    ]
  },
  {
    "slug": "occto-gridcode-kentoukai-22-2026-08",
    "title": "第22回 グリッドコード検討会: FRT要件見直し（特高）・負荷周波数制御/瞬動予備力/発電設備の制御応答性の個別技術要件を審議（議事録 9/10 公開）",
    "eventDate": "2026-08-21",
    "eventType": [
      "重要会議"
    ],
    "issuer": "電力広域的運営推進機関（OCCTO）",
    "description": "電力広域的運営推進機関の第22回 グリッドコード検討会が2026年8月21日（金）10時〜12時に開催され、議事録が2026年9月10日に公開された。議題は (1) 個別技術要件「FRT 要件見直し（特高）」検討内容についての審議（資料4）、(2) 個別技術要件「負荷周波数制御・経済負荷配分制御・瞬動予備力・周波数変化の抑制対策・発電設備の制御応答性」検討内容についての審議（資料5）。8月24日の第121回 調整力及び需給バランス評価等に関する委員会（資料3）では、速い出力変化が可能な蓄電池に対する有効電力・無効電力の変化速度上限をグリッドコード検討会で検討中と整理されており、本回の「発電設備の制御応答性」がその検討の場にあたる。制御応答性・FRT の要件は系統用蓄電池（PCS）の連系技術要件と需給調整市場（一次調整力等）の応動性能の前提に関わる。配布資料5点・議事録は同ページで公開。",
    "sourceUrl": "https://www.occto.or.jp/iinkai/gridcode/22.html",
    "status": [
      "終了"
    ],
    "category": [
      "需給調整市場",
      "重要会議"
    ]
  },
  {
    "slug": "meti-grid-finance-jizen-soudan-2026-09",
    "title": "METI 公表: 大規模送電線・大規模電源に対する融資制度（改正電気事業法）の事前相談受付を開始（2026年度中の融資実行希望は 9/30 まで）",
    "eventDate": "2026-09-01",
    "eventType": [
      "公表"
    ],
    "issuer": "経済産業省 資源エネルギー庁（電力・ガス事業部 政策課 電力ファイナンス室）",
    "description": "経済産業省は2026年9月1日、電気事業法に基づき大規模送電線および大規模電源の整備を支援する融資制度の運用開始に向け、事前相談の受付を開始した。本制度は経済産業大臣の認定を受けた事業計画について、電力広域的運営推進機関（OCCTO）が財政投融資等を活用して実施に必要な資金を貸し付けるもの。対象計画は (1) 整備等計画（地域間連系線）、(2) 基幹送変電設備整備等計画（地内系統）、(3) 発電等用電気工作物整備等計画（電源）の3類型で、事業者の計画申請後に国が審査・認定し、広域機関が融資審査・決定・実行を行う。2026年度中に広域機関による融資実行を希望する事業者は2026年9月30日（水）までに連絡、2027年度以降の希望者は9月30日以降も受け付ける。8月25日の電力事業環境整備WG（第3回）資料「改正電気事業法に基づくファイナンス支援の実施に向けて」が関連資料。OCCTO 側では対応する定款・業務規程・送配電等業務指針の変更案を9月18日正午まで意見募集中で、その説明資料では電源向け融資の投資回収予見性の確認要件として長期脱炭素電源オークションの落札案件等が例示されている。長期脱炭素電源オークションで落札した大規模な系統用蓄電池の資金調達手段に関わる制度の運用開始。",
    "sourceUrl": "https://www.meti.go.jp/press/2026/09/20260901002.html",
    "status": [
      "進行中"
    ],
    "category": [
      "法改正",
      "公表"
    ],
    "endDate": "2026-09-30"
  }
];

class HttpError extends Error {
  constructor(public status: number, public body: string, method: string) {
    super(`${method} → HTTP ${status}: ${body.slice(0, 300)}`);
  }
}
async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new HttpError(r.status, await r.text(), method);
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
/** 送信値と保存値の一致（日付は日付部分・select は配列で比較） */
function eq(sent: unknown, stored: unknown): boolean {
  if (typeof sent === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sent)) return String(stored ?? '').slice(0, 10) === sent;
  const a = Array.isArray(sent) ? sent : [sent];
  const b = Array.isArray(stored) ? stored : [stored];
  return JSON.stringify(a) === JSON.stringify(b);
}
const isIndustry = (x: Ev) => Array.isArray(x.kind) && (x.kind as string[]).includes('業界');

/** #106: v4 スキーマ JSON の selectItems に全値が実在するか */
function checkSelects(): string[] {
  const schema = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'microcms-schema-policy-events-v4-2026-08-27.json'), 'utf-8')) as {
    apiFields: Array<{ fieldId: string; selectItems?: Array<{ value: string }>; multipleSelect?: boolean }>;
  };
  const allowed = new Map(schema.apiFields.filter((f) => f.selectItems).map((f) => [f.fieldId, { values: new Set(f.selectItems!.map((s) => s.value)), multi: !!f.multipleSelect }]));
  const errs: string[] = [];
  for (const ev of POSTS) {
    for (const f of ['eventType', 'status', 'category'] as const) {
      const spec = allowed.get(f)!;
      const vals = ev[f];
      if (!Array.isArray(vals) || vals.length === 0) errs.push(`${ev.slug}.${f}: 配列でない／空`);
      else {
        if (!spec.multi && vals.length > 1) errs.push(`${ev.slug}.${f}: 単一選択に ${vals.length} 値`);
        for (const v of vals) if (!spec.values.has(v)) errs.push(`${ev.slug}.${f}: 「${v}」は選択肢に無い`);
      }
    }
  }
  return errs;
}

let posted = 0, skipped = 0, failed = 0;
const dropped: string[] = [];

async function postOne(ev: NewEv): Promise<void> {
  const exists = await getBySlug(ev.slug);
  if (exists) { console.log(`  [skip] ${ev.slug} — 既存（id=${exists.id}）`); skipped++; return; }
  const opt = OPTIONAL_V4.filter((k) => ev[k]).map((k) => `${k}=${ev[k]}`).join(' ');
  console.log(`  [POST] ${ev.slug}\n         eventDate=${ev.eventDate} ${opt} eventType=${JSON.stringify(ev.eventType)} status=${JSON.stringify(ev.status)} category=${JSON.stringify(ev.category)} description=${ev.description.length}字`);
  if (DRY) { posted++; return; }

  let payload: Record<string, unknown> = { ...ev };
  try {
    await api('POST', BASE, payload);
  } catch (e) {
    const miss = e instanceof HttpError && e.status === 400 ? OPTIONAL_V4.filter((k) => k in payload && e.body.includes(k)) : [];
    if (miss.length === 0) { console.log(`     ★NG ${(e as Error).message}`); failed++; return; }
    console.log(`     HTTP 400（${miss.join(',')} が管理画面に未追加とみられる）→ 当該フィールドを落として 1 回だけ再送`);
    payload = Object.fromEntries(Object.entries(payload).filter(([k]) => !miss.includes(k as (typeof OPTIONAL_V4)[number])));
    miss.forEach((k) => dropped.push(`${ev.slug}.${k}=${ev[k]}`));
    await api('POST', BASE, payload);
  }
  await sleep(1000);
  const got = await getBySlug(ev.slug);
  if (!got) { console.log('     ★NG: POST 後に GET できない'); failed++; return; }
  const bad: string[] = [];
  for (const [k, v] of Object.entries(payload)) if (!eq(v, got[k])) bad.push(`${k}: 送信=${JSON.stringify(v)} 保存=${JSON.stringify(got[k])}`);
  if (bad.length) { console.log(`     ★#106 NG:\n       ${bad.join('\n       ')}`); failed++; }
  else { console.log(`     #106: ✓ 送信 ${Object.keys(payload).length} field 全一致（id=${got.id}）`); posted++; }
  await sleep(400);
}

async function main(): Promise<void> {
  console.log(`[policy-events 2026-09-11] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / POSTS=${POSTS.length}`);
  if (POSTS.length !== 6) { console.error('POSTS が 6 件でない（原稿抽出の失敗）'); process.exit(1); }
  const selErr = checkSelects();
  console.log(`  #106 select 実在確認: ${selErr.length === 0 ? '✓ 全値が v4 スキーマの選択肢に実在' : '★NG\n    ' + selErr.join('\n    ')}`);
  if (selErr.length) process.exit(1);

  const pre = await getAll();
  const preInd = pre.list.filter(isIndustry).length;
  console.log(`  投入前: 総件数 ${pre.total}（政策 ${pre.total - preInd} ／ 業界 ${preInd}）`);

  console.log('\n■ POST');
  for (const ev of POSTS) await postOne(ev);

  if (!DRY) {
    console.log('\n■ 投入後 全件 GET 照合');
    const post = await getAll();
    const postInd = post.list.filter(isIndustry).length;
    console.log(`  投入後: 総件数 ${post.total}（政策 ${post.total - postInd} ／ 業界 ${postInd}）`);
    for (const ev of POSTS) {
      const got = post.list.find((x) => x.slug === ev.slug);
      const bad = got ? Object.entries(ev).filter(([k, v]) => !eq(v, got[k]) && !dropped.includes(`${ev.slug}.${k}=${v}`)).map(([k]) => k) : ['(不在)'];
      console.log(`  ${bad.length ? '★NG' : '✓'} ${ev.slug}${bad.length ? ' 不一致=' + bad.join(',') : ''}`);
      if (bad.length) failed++;
    }
  }
  console.log(`\n[done] POST ${posted} / スキップ ${skipped} / 失敗 ${failed}${dropped.length ? ` / 落としたフィールド: ${dropped.join(', ')}` : ' / 落としたフィールドなし'}`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

export {};
