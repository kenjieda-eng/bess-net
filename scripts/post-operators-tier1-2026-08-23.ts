/**
 * scripts/post-operators-tier1-2026-08-23.ts
 * ナビ不在 第1層の登録候補を operators に POST（A-1実行・ユウ裁定）。
 *
 * 裁定: reports/operators-missing-2026-08-21.md の第1層 登録候補39社のみ登録。
 *       第2層169社（news由来のみ）は登録しない（保留リストとして報告に残す）。
 *
 * ── 実データ確認による前提の訂正（着手前）─────────────────────────────
 * ★依頼書の「category を『調査中』で登録」は実行不可。operators.category に「調査中」という
 *   選択肢は存在しない（実在20種のみ）。microCMS の select は未定義値を silently drop するため
 *   （落とし穴 #106）、送っても結果は [] になり「設定した」という誤報告になる。
 *   → さらに 2026-08-23 の実測で、category は **POST の必須項目** と判明した:
 *       category: []   → 400 'category' has unexpected data type
 *       キー自体を省略 → 400 'category' field required error
 *     既存544社のうち139社は category: [] だが、API 経由の POST ではその状態を作れない。
 *   → 一次情報でカテゴリを確定できない社は「推測で埋めない」裁定に従い **登録を見送る**。
 *     テキスト項目には「調査中」を明記できるので、確定社の body では事業区分欄に使う。
 * ★description / bessRelation / body は既存544社が全件非空＝実質必須。名称・カテゴリ・出典URLだけ
 *   では POST できないため、当サイト掲載案件との関係（＝第1層である根拠）を事実として記述する。
 *   一次情報で事業内容が取れた社はその要約を使う。推測は入れない。
 * ★prefecture は依頼書の項目リストに無いため設定しない → 都道府県別ページの増分は +0。
 *
 * ── 除外1社（登録しない・要判断）───────────────────────────────────
 * 「合同会社クラダシ」… 一次情報で当該法人を特定できない。根拠PR（グリーンエナジー＆カンパニー
 *   https://prtimes.jp/main/html/rd/p/000000028.000071823.html ）に登場するのは「株式会社クラダシ」と
 *   「合同会社クラダシ・インベストメント2号」の2社のみで、案件ページ本文にも当該表記が無い。
 *   社名抽出が「・」で切れた断片と判断される（後者は本便で別途登録する）。
 *   実在が確認できない法人名を事業者ナビに載せると 544社の質を毀損するため登録しない。
 *
 * ── 保留2社（カテゴリ未確定・POST 必須のため登録できない）────────────────
 * 「合同会社バッテリーファーム」「株式会社テレビショッピング研究所」
 *   いずれも法人の実在は一次情報で確認できたが、20種のいずれに当たるかを一次情報で確定できない。
 *   （前者は東京ガスPRで「蓄電池事業者」、開発は Kingdom BESS と役割が分離。
 *     後者は本業が通信販売で、荒尾案件では「事業主」だが開発・運用は afterFIT と明記）
 *   → 39社 − 除外1 − 保留2 = **36社を登録**。3社は報告に明記して江田さん判断を仰ぐ。
 *
 * 作法: POST 前に slug 照合（完全一致・既存544 slug と突合）＋正規化キー衝突チェック（0件確認済）／
 *       冪等（既存 slug があれば skip = #91）／POST 後 GET 全field照合（#106 select drop 検出）／
 *       DELETE・PUT 不使用。
 * 実行: npx tsx --env-file=.env.local scripts/post-operators-tier1-2026-08-23.ts [--dry-run]
 */
export {};
import fs from 'node:fs';
import path from 'node:path';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/operators`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** operators.category の実在20種。これ以外は送らない（#106） */
const VALID_CATEGORIES = new Set([
  'アグリゲーター', 'EPC', '開発事業者', '電池メーカー', '電力会社', '金融', 'PCS', '自治体',
  '研究機関', '土地', '業界団体', 'コンサル', '商社', '電気主任', '送配電', '法務', '保険',
  'O&M', '監視', '消防',
]);

/** 登録しない社（理由はファイル冒頭） */
const EXCLUDE = new Set(['合同会社クラダシ']);

type Research = {
  name: string; confirmed: boolean; category: string[]; sourceUrl: string;
  websiteUrl: string; prefecture: string; businessSummary: string; quote: string; notes?: string;
};
type Row = { key: string; name: string; sources: string; count: number; firstUrl: string; firstTitle: string };

const S = 'C:/Users/kenji/AppData/Local/Temp/claude/C--Users-kenji-Documents-GitHub-bess-net/7088fb52-56f5-41b2-8af2-6a2a5b8bb5ba/scratchpad';
const research = JSON.parse(fs.readFileSync(`${S}/research39.json`, 'utf-8')) as Research[];
const tier1 = JSON.parse(fs.readFileSync(`${S}/tier1_39.json`, 'utf-8')) as Row[];
const byName = new Map(tier1.map((r) => [r.name, r]));

/** slug 生成: 手当てした対訳表（社名→英小文字ケバブ）。推測ローマ字化を避け全件明示する */
const SLUGS: Record<string, string> = {
  'オリンピア': 'olympia-dev',
  '合同会社NCパイオニア': 'nc-pioneer',
  '九州製鋼': 'kyushu-seiko',
  '坂東蓄電所1号合同会社': 'bando-bess-1',
  '株式会社ミツウロコグループホールディングス': 'mitsuuroko-gr-hd',
  '合同会社OPTIRON北信': 'optiron-hokushin',
  'アールツー蓄電所合同会社': 'r2-bess',
  '株式会社城洋商事': 'johyo-shoji',
  '合同会社クラダシ・インベストメント2号': 'kuradashi-investment-2',
  '住友商事九州': 'sumitomo-corp-kyushu',
  '西鉄自然電力合同会社': 'nishitetsu-shizen-denryoku',
  'SBIマネープラザ': 'sbi-moneyplaza',
  'でんきの駅合同会社': 'denki-no-eki',
  'フォーアールエナジー': '4r-energy',
  '岡谷鋼機': 'okaya-kohki',
  '株式会社ミライト': 'mirait',
  '御徳蓄電所合同会社': 'otoku-bess',
  '森トラスト株式会社': 'mori-trust',
  '北海道札幌蓄電合同会社': 'hokkaido-sapporo-chikuden',
  'E-Flow合同会社運用': 'e-flow-unyo',
  'J＆S蓄電合同会社': 'js-chikuden',
  'アールワン蓄電所合同会社': 'r1-bess',
  'ハニカム1合同会社': 'honeycomb-1',
  'リニューアブルエナジー・マネジメント株式会社': 'renewable-energy-management',
  '茨城県ノーバル・ホールディングス': 'noval-holdings',
  '株式会社おてんとさん': 'otentosan',
  '株式会社テレビショッピング研究所': 'tv-shopping-lab',
  '株式会社関電エネルギーソリューション': 'kanden-energy-solution',
  '株式会社徳島大正銀行': 'tokushima-taisho-bank',
  '宮崎県串間市蓄電所合同会社': 'kushima-bess',
  '合同会社RJキャピタル2': 'rj-capital-2',
  '合同会社バッテリーファーム': 'battery-farm',
  '四電エンジニアリング株式会社': 'yonden-engineering',
  '松山みかんエナジー合同会社': 'matsuyama-mikan-energy',
  '多奈川蓄電所合同会社': 'tanagawa-bess',
  '嬬恋蓄電所合同会社': 'tsumagoi-bess',
  '苫小牧パワーストレージ合同会社': 'tomakomai-power-storage',
  '福岡県筑前町蓄電所合同会社': 'chikuzenmachi-bess',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildRecord(r: Research) {
  const row = byName.get(r.name);
  if (!row) throw new Error(`第1層リストに不在: ${r.name}`);
  const slug = SLUGS[r.name];
  if (!slug) throw new Error(`slug 未定義: ${r.name}`);
  for (const c of r.category) if (!VALID_CATEGORIES.has(c)) throw new Error(`未定義カテゴリ: ${r.name} → ${c}`);

  const src = ({ a: '案件の事業者欄', b: '案件本文の関与記述', 'a/b': '案件の事業者欄と本文の関与記述', 'a/c': '案件の事業者欄とニュース', 'b/c': '案件本文の関与記述とニュース', 'a/b/c': '案件の事業者欄・本文の関与記述・ニュース' } as Record<string, string>)[row.sources] ?? '案件';
  const site = `当サイト掲載の案件「${row.firstTitle}」ほか${row.count}件で、${src}に社名が確認できる事業者。`;
  const desc = r.confirmed
    ? `${r.businessSummary} ${site}`.slice(0, 300)
    : `${r.businessSummary ? r.businessSummary + ' ' : ''}${site}事業区分は一次情報で確定できていないため調査中。`.slice(0, 300);

  const body =
    `<h3 id="hop-gaiyo">会社概要</h3><ul>`
    + (r.websiteUrl ? `<li>公式サイト: <a href="${esc(r.websiteUrl)}" target="_blank" rel="noopener noreferrer">${esc(r.websiteUrl)}</a></li>` : '')
    + (r.prefecture ? `<li>所在地: ${esc(r.prefecture)}</li>` : '')
    + `<li>事業区分: ${r.category.length ? esc(r.category.join('・')) : '調査中（一次情報で確定できていない）'}</li>`
    + `</ul>`
    + `<h3 id="hop-bess">蓄電所事業との関係</h3><p>${esc(site)}`
    + (r.confirmed && r.quote ? `一次情報には「${esc(r.quote)}」と記載されている。` : '')
    + `</p>`
    + `<h3 id="hop-shutten">出典</h3><ul>`
    + (r.sourceUrl ? `<li><a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(r.sourceUrl)}</a></li>` : '')
    + `<li>当サイト: <a href="${esc(row.firstUrl)}">${esc(row.firstUrl)}</a></li>`
    + `</ul>`;

  const content: Record<string, unknown> = {
    name: r.name,
    slug,
    description: desc,
    bessRelation: desc,
    body,
  };
  // ★category は POST の必須項目。2026-08-23 に実測:
  //     category: []   → 400 'category' has unexpected data type
  //     キー自体を省略 → 400 'category' field required error
  //   既存544社のうち139社は category: [] だが、API 経由の POST ではその状態を作れない
  //   （管理画面インポート由来か、後から空にされたものと考えられる）。
  //   → 一次情報でカテゴリを確定できない社は「推測で埋めない」裁定に従い登録を見送る（下の skip）。
  if (r.category.length) content.category = r.category;
  if (r.sourceUrl) content.sourceUrl = r.sourceUrl;
  return { slug, content, confirmed: r.confirmed };
}

async function api(method: string, url: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function main(): Promise<void> {
  // 投入前の全件 GET（slug 照合・件数）
  const before: Array<Record<string, unknown>> = [];
  for (let o = 0; ; o += 100) {
    const j = (await api('GET', `${BASE}?limit=100&offset=${o}&fields=id,name,slug,category`)) as { contents: Array<Record<string, unknown>>; totalCount: number };
    before.push(...j.contents);
    if (o + 100 >= j.totalCount) break;
    await sleep(400);
  }
  const existingSlugs = new Set(before.map((x) => String(x.slug)));
  const existingNames = new Set(before.map((x) => String(x.name)));
  console.log(`[operators-tier1] mode=${DRY_RUN ? 'DRY-RUN' : 'APPLY'} 投入前件数=${before.length}`);

  const targets = research.filter((r) => !EXCLUDE.has(r.name));
  console.log(`  対象 ${research.length}社 − 除外 ${research.length - targets.length}社（${[...EXCLUDE].join(', ')}）= ${targets.length}社`);

  // slug の自己重複チェック
  const seen = new Set<string>();
  for (const r of targets) {
    const s = SLUGS[r.name];
    if (!s) throw new Error(`slug 未定義: ${r.name}`);
    if (seen.has(s)) throw new Error(`slug が本便内で重複: ${s}`);
    seen.add(s);
  }

  let added = 0, skipped = 0, bad = 0;
  const held: string[] = [];
  const posted: Array<{ name: string; slug: string; id: string; category: string[] }> = [];
  for (const r of targets) {
    const { slug, content, confirmed } = buildRecord(r);
    if (existingSlugs.has(slug)) { console.log(`  [skip] ${r.name}: slug "${slug}" は既存`); skipped++; continue; }
    if (existingNames.has(r.name)) { console.log(`  [skip] ${r.name}: 同名が既存`); skipped++; continue; }
    if (!confirmed) {
      console.log(`  [hold] ${r.name}: カテゴリ未確定 → category が POST 必須のため登録を見送る（推測で埋めない裁定）`);
      held.push(r.name); skipped++; continue;
    }
    if (DRY_RUN) {
      console.log(`  [dry-run] POST ${slug.padEnd(28)} cat=${JSON.stringify(content.category)} ${confirmed ? '' : '（カテゴリ未確定）'} ${r.name}`);
      continue;
    }
    const res = (await api('POST', BASE, content)) as { id: string };
    await sleep(700);
    const got = (await api('GET', `${BASE}/${res.id}`)) as Record<string, unknown>;
    const checks: Array<[string, boolean]> = [
      ['name', got.name === content.name],
      ['slug', got.slug === content.slug],
      ['category', JSON.stringify(got.category ?? []) === JSON.stringify(content.category ?? [])],
      ['description', got.description === content.description],
      ['bessRelation', got.bessRelation === content.bessRelation],
      ['body', got.body === content.body],
      ['sourceUrl', (content.sourceUrl ?? '') === (got.sourceUrl ?? '')],
    ];
    const miss = checks.filter(([, ok]) => !ok).map(([k]) => k);
    // body は richEditor 正規化があり得るため、意図の文言が入っていれば可（#122）
    const bodyOnly = miss.length === 1 && miss[0] === 'body' && String(got.body).includes('蓄電所事業との関係');
    if (miss.length && !bodyOnly) {
      bad++;
      console.log(`  ✗ POST ${slug} id=${res.id} 不一致: ${miss.join(',')}（#106 select drop 疑い）`);
    } else {
      added++;
      posted.push({ name: r.name, slug, id: res.id, category: got.category as string[] });
      console.log(`  ✓ POST ${slug.padEnd(28)} id=${res.id} cat=${JSON.stringify(got.category)}${bodyOnly ? '（body は正規化あり・意図の見出しは含む）' : ''}`);
    }
    await sleep(400);
  }

  const after = DRY_RUN ? before : await (async () => {
    const a: Array<Record<string, unknown>> = [];
    for (let o = 0; ; o += 100) {
      const j = (await api('GET', `${BASE}?limit=100&offset=${o}&fields=id,slug`)) as { contents: Array<Record<string, unknown>>; totalCount: number };
      a.push(...j.contents);
      if (o + 100 >= j.totalCount) break;
      await sleep(400);
    }
    return a;
  })();
  const d = after.length - before.length;
  console.log(`[operators-tier1] 投入前 ${before.length} → 投入後 ${after.length}（${d === 0 ? '±0' : (d > 0 ? '+' : '') + d}）/ 追加${added} スキップ${skipped} 不一致${bad}`);
  if (held.length) console.log(`  保留（カテゴリ未確定・POST 必須のため登録せず）: ${held.join(' / ')}`);
  if (!DRY_RUN && posted.length) {
    const out = path.join('reports', 'operators-tier1-posted-2026-08-23.json');
    fs.writeFileSync(out, JSON.stringify({ generated_on: '2026-08-23', excluded: [...EXCLUDE], held, posted }, null, 1));
    console.log(`  → ${out} に登録結果を保存（${posted.length}社）`);
  }
  if (bad) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
