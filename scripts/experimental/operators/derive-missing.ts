#!/usr/bin/env tsx
/**
 * scripts/experimental/operators/derive-missing.ts — ナビ不在事業者の再導出（A-1差分便 §1・2026-08-21）
 *
 * ★microCMS は GET のみ。POST しない（登録候補の報告まで）。
 *
 * 母集団（依頼書 1-1）:
 *   (a) projects の事業者欄（保有・開発）に登場する社名 … 構造化欄。A-3 と同じ
 *       normalizeEntityName / resolveStructuredEntities の分割規則で要素化し、マスタ完全一致で解決できない要素
 *   (b) projects 本文で**役割語と同一文**にある法人格つき社名（Op9 の関与文脈）のうちマスタ不在のもの
 *   (c) news の title/本文/sourceName に登場する法人格つき社名のうちマスタ不在のもの
 *       （/news 一覧と同じ除外 isExcludedNews / isTopicExcludedNews を適用）
 *
 * マスタ照合は A-3 と同一（normalizeEntityName で正規化し完全一致。前方一致は採らない＝東急⊂東急不動産）。
 * aliases（15社・8/21適用）も正規化キーに加える＝別表記による偽「不在」を防ぐ。
 *
 * 法人格つき社名の抽出（本文用）:
 *   前置型「株式会社X」「合同会社X」「一般社団法人X」… ／ 後置型「X株式会社」「X合同会社」「Xホールディングス」
 *   後置型の X は ひらがな を含めない連続（助詞で切るため。「みずほ」等ひらがな入り社名は途中で切れて
 *   保留候補に落ちる＝見落としではなく人の目に回す設計）。
 *
 * 判定（依頼書 1-3）:
 *   登録候補 … 法人格つきの完全形で一次（news/projects 本文・事業者欄）に明記
 *   保留候補 … 略称のみ（法人格なし）／海外法人の日本法人か不明（英字のみ・Japan 等）／部署名・組織名の疑い
 * カテゴリは推測で埋めない（全件「調査中」。本文に役割語があれば「文脈ヒント」として別欄に残す）。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const OUT_MD = 'reports/operators-missing-2026-08-21.md';
const OUT_JSON = 'reports/operators-missing-2026-08-21.json';

const LEGAL_PRE = '(?:株式会社|合同会社|有限会社|一般社団法人|一般財団法人|公益財団法人|公益社団法人|独立行政法人|国立研究開発法人|学校法人|特定非営利活動法人)';
const LEGAL_POST = '(?:株式会社|合同会社|有限会社|ホールディングス)';
const NAME_BODY = '[一-龥ァ-ヶーＡ-Ｚａ-ｚA-Za-z0-9０-９＆&・．.\\-]';
// 前置型: 株式会社＋名称（名称はひらがな不可・2〜25字）
const RE_PRE = new RegExp(`${LEGAL_PRE}(${NAME_BODY}{2,25})`, 'g');
// 後置型: 名称＋株式会社（名称はひらがな不可・2〜25字）
const RE_POST = new RegExp(`(?<![ぁ-ん一-龥ァ-ヶーＡ-Ｚａ-ｚA-Za-z0-9０-９])(${NAME_BODY}{2,25})${LEGAL_POST}`, 'g');

const ROLE_WORDS = ['オフテイク', 'オフテーカー', 'トーリング', '最適運用', '運用受託', '運用を受託', '運用を担',
  'アグリゲーション', 'EPC', '設計・調達・建設', '施工を担', '建設工事を受注', 'システム構築', '出資', '共同出資',
  '資本参画', '製', '供給', '納入', '提供'];

type Hit = {
  key: string;              // 正規化キー
  raw: string;              // 初出の原文表記
  legal: boolean;           // 法人格つき完全形で観測したか
  sources: Set<'a' | 'b' | 'c'>;
  count: number;
  firstUrl: string;
  firstTitle: string;
  roleHint: Set<string>;    // 同一文の役割語（カテゴリの「文脈ヒント」。推測はしない）
};

async function main() {
  loadEnv();
  const { client, getAllOperators, getAllProjects } = await import('../../../src/lib/microcms');
  const { normalizeEntityName, buildEntityIndex, STRUCTURED_SPLIT_RE } = await import('../../../src/lib/operator-match') as unknown as {
    normalizeEntityName: (s: string) => string;
    buildEntityIndex: (names: string[]) => Map<string, string[]>;
    STRUCTURED_SPLIT_RE?: RegExp;
  };
  const { plainBody } = await import('../../../src/lib/project-involvement');
  // 導出専用: 全角英数（ＲＥ１００電力）と半角（RE100電力）を同一視する。本番の突合規則は変えない
  const nkey = (s: string) => normalizeEntityName(s.normalize('NFKC'));
  const { isExcludedNews } = await import('../../../src/lib/news-excluded');
  const { isTopicExcludedNews } = await import('../../../src/lib/news-topic-gate');
  const { LIST_EXCLUDED_PROJECT_SLUGS } = await import('../../../src/lib/projects-excluded');

  // ---- マスタ（名称＋aliases を正規化キーに） ----
  const operators = await getAllOperators();
  const masterKeys = buildEntityIndex(operators.map((o) => o.name.normalize('NFKC')));
  let aliasKeys = 0;
  for (const o of operators) {
    const al = String((o as { aliases?: string }).aliases || '').split(/[\n、,/]/).map((s) => s.trim()).filter(Boolean);
    for (const a of al) {
      const k = nkey(a);
      if (k.length >= 2 && !masterKeys.has(k)) { masterKeys.set(k, [o.name]); aliasKeys++; }
    }
  }
  const inMaster = (raw: string) => {
    const k = nkey(raw);
    return k.length < 2 || masterKeys.has(k);
  };
  console.log(`[derive-missing] マスタ ${operators.length}社（正規化キー ${masterKeys.size}・うち alias 由来 ${aliasKeys}）`);

  // ---- projects ----
  const projectsAll = await getAllProjects();
  const projects = projectsAll.filter((p) => !LIST_EXCLUDED_PROJECT_SLUGS.has(p.slug));
  console.log(`[derive-missing] projects ${projectsAll.length}件（一覧除外後 ${projects.length}）`);

  // ---- news（本文込み・一覧と同じ除外を適用） ----
  const news: Array<{ slug: string; title: string; body?: string; sourceName?: string; publishedAt?: string }> = [];
  for (let offset = 0; ; offset += 100) {
    const res = await client.getList<{ slug: string; title: string; body?: string; sourceName?: string; publishedAt?: string }>({
      endpoint: 'news',
      queries: { limit: 100, offset, fields: 'slug,title,body,sourceName,publishedAt', orders: '-publishedAt' },
    });
    news.push(...res.contents);
    if (offset + 100 >= res.totalCount) break;
    await sleep(400);
  }
  const newsVisible = news.filter((n) => !isExcludedNews(n.slug) && !isTopicExcludedNews(n.slug));
  console.log(`[derive-missing] news ${news.length}本（一覧除外後 ${newsVisible.length}）`);

  const hits = new Map<string, Hit>();
  const add = (raw: string, legal: boolean, src: 'a' | 'b' | 'c', url: string, title: string, roleHint?: string[]) => {
    const key = nkey(raw);
    if (key.length < 2) return;
    if (masterKeys.has(key)) return;                         // マスタ（＋alias）に実在 → 不在ではない
    if (/^(他|ほか|など|等|同社|当社|弊社|各社|両社|\d+社)$/.test(key)) return;
    // 配信プラットフォーム・自サイト・役割語だけのトークンは社名ではない
    if (/^(PRTIMES|蓄電所ネット編集部|蓄電所ネット|編集部|出資|共同出資|\d+社共同出資|100%出資|ファンド組成|開発|運用|リユース電池|SPC)$/i.test(key)) return;
    if (/子会社$/.test(key)) return;
    let h = hits.get(key);
    if (!h) {
      h = { key, raw: raw.trim(), legal, sources: new Set(), count: 0, firstUrl: url, firstTitle: title, roleHint: new Set() };
      hits.set(key, h);
    }
    h.legal = h.legal || legal;
    h.sources.add(src);
    h.count++;
    for (const r of roleHint ?? []) h.roleHint.add(r);
  };

  const splitRe = STRUCTURED_SPLIT_RE ?? /[×／/、,・]|\s+と\s+|\s+および\s+/;
  const hasLegal = (s: string) => new RegExp(`${LEGAL_PRE}|${LEGAL_POST}`).test(s);

  // (a) 事業者欄
  for (const p of projects) {
    const raw = String(p.operator ?? '').trim();
    if (!raw || raw === 'null') continue;
    const blocks: string[] = [raw.replace(/（[^）]*）|\([^)]*\)/g, ' ')];
    for (const m of raw.matchAll(/（([^）]*)）|\(([^)]*)\)/g)) blocks.push(m[1] ?? m[2] ?? '');
    for (const b of blocks) {
      if (!b.trim()) continue;
      if (inMaster(b)) continue;               // ブロック全体で解決
      for (const part of b.split(splitRe)) {
        // 「運用: しろくま電力」「SPC: PP6合同会社」「出資：伊藤忠商事」の役割接頭辞を剥がす
        const t = part.trim().replace(/^[^：:]{1,10}[：:]\s*/, '').trim();
        if (!t || inMaster(t)) continue;
        add(t, hasLegal(t), 'a', `https://bess-net.jp/projects/${p.slug}`, p.name);
      }
    }
  }
  // (b) projects 本文（役割語と同一文の法人格つき社名）
  const extractLegalNames = (text: string): string[] => {
    const out: string[] = [];
    for (const m of text.matchAll(RE_PRE)) out.push(m[0]);
    for (const m of text.matchAll(RE_POST)) out.push(m[0]);
    return out;
  };
  const sentences = (html: string) => plainBody(html).split(/[。\n]/).map((s) => s.trim()).filter(Boolean);
  for (const p of projects) {
    for (const s of sentences(p.body ?? '')) {
      const roles = ROLE_WORDS.filter((w) => s.includes(w));
      if (roles.length === 0) continue;
      for (const nm of extractLegalNames(s)) add(nm, true, 'b', `https://bess-net.jp/projects/${p.slug}`, p.name, roles);
    }
  }
  // (c) news title / 本文 / sourceName
  for (const n of newsVisible) {
    const url = `https://bess-net.jp/news/${n.slug}`;
    for (const nm of extractLegalNames(n.title ?? '')) add(nm, true, 'c', url, n.title);
    for (const s of sentences(n.body ?? '')) {
      const roles = ROLE_WORDS.filter((w) => s.includes(w));
      if (roles.length === 0) continue;   // A-3/Op2: 本文のみの一致は不採用。役割語と同一文に限る
      for (const nm of extractLegalNames(s)) add(nm, true, 'c', url, n.title, roles);
    }
    const sn = String(n.sourceName ?? '').trim();
    if (sn && sn !== 'null' && !inMaster(sn)) {
      for (const part of sn.split(splitRe)) {
        const t = part.trim();
        if (t && !inMaster(t)) add(t, hasLegal(t), 'c', url, n.title);
      }
    }
  }

  // ---- 判定 ----
  const isForeignish = (raw: string) => /^[A-Za-zＡ-Ｚａ-ｚ0-9 .&\-]+$/.test(raw.replace(/株式会社|合同会社/g, '')) || /Japan|ジャパン/.test(raw);
  const isOrgish = (raw: string) => /(部|課|室|センター|事務局|協議会|委員会|連絡会|プロジェクト|事業部|支社|支店|営業所)$/.test(nkey(raw));
  const rows = [...hits.values()].map((h) => {
    let verdict: '登録候補' | '保留候補' = '登録候補';
    const why: string[] = [];
    if (!h.legal) { verdict = '保留候補'; why.push('法人格なし（略称のみ）'); }
    if (isForeignish(h.raw)) { verdict = '保留候補'; why.push('海外法人／日本法人か要確認'); }
    if (isOrgish(h.raw)) { verdict = '保留候補'; why.push('部署・組織名の可能性'); }
    if (h.raw.length <= 3) { verdict = '保留候補'; why.push('3字以下'); }
    if (/^(エンジニアリング|キャピタル|コンサルティング|パートナーズ|リース|電力|エナジー|エネルギー|ホールディングス|マネジメント|ソリューションズ|サービス|エネルギーサービス|インベストメント\d*|テクノロジーズ|ジャパン|Japan|ENERGY|Energy)$/i.test(h.key)) {
      verdict = '保留候補'; why.push('一般語のみ（社名内スペースでの断片の可能性）');
    }
    return {
      key: h.key, name: h.raw, legal: h.legal, sources: [...h.sources].sort().join('/'),
      count: h.count, firstUrl: h.firstUrl, firstTitle: h.firstTitle,
      roleHint: [...h.roleHint].slice(0, 4).join('・') || '',
      verdict, why: why.join('・'),
    };
  }).sort((x, y) => y.count - x.count || x.name.localeCompare(y.name, 'ja'));

  const reg = rows.filter((r) => r.verdict === '登録候補');
  const hold = rows.filter((r) => r.verdict === '保留候補');

  const summary = {
    generated_on: '2026-08-21',
    population: {
      operators_master: operators.length, master_keys: masterKeys.size, alias_keys: aliasKeys,
      projects_total: projectsAll.length, projects_visible: projects.length,
      news_total: news.length, news_visible: newsVisible.length,
    },
    method: '構造化欄=normalizeEntityName→マスタ完全一致（前方一致なし）／本文=法人格つき社名の抽出（ひらがな不可・2〜25字）・(b)は役割語と同一文のみ',
    counts: { missing_total: rows.length, register: reg.length, hold: hold.length,
      by_source: { a: rows.filter((r) => r.sources.includes('a')).length,
        b: rows.filter((r) => r.sources.includes('b')).length,
        c: rows.filter((r) => r.sources.includes('c')).length } },
    rows,
  };
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 1));

  const L: string[] = [];
  L.push('# ナビ不在事業者の再導出（2026-08-21・A-1差分便 §1）\n');
  L.push('**microCMS 書込ゼロ**（GETのみ）。POST は承認後の別便。\n');
  L.push('## 母集団と抽出条件\n');
  L.push(`- operators マスタ: **${operators.length}社**（正規化キー ${masterKeys.size}、うち aliases 由来 ${aliasKeys}）`);
  L.push(`- (a) projects 事業者欄: ${projects.length}件（一覧除外後。全${projectsAll.length}）`);
  L.push(`- (b) projects 本文（役割語と同一文の法人格つき社名）: 同上`);
  L.push(`- (c) news title/本文/sourceName: **${newsVisible.length}本**（/news一覧と同じ除外後。全${news.length}）`);
  L.push(`- 照合: A-3 と同一（normalizeEntityName → マスタ完全一致・前方一致なし）。aliases 15社も照合キーに含む\n`);
  L.push(`## 結果: 不在 **${rows.length}件** ＝ 登録候補 **${reg.length}** ／ 保留候補 **${hold.length}**（根拠別 a=${summary.counts.by_source.a}・b=${summary.counts.by_source.b}・c=${summary.counts.by_source.c}）\n`);
  L.push('カテゴリは推測で埋めない（全件「調査中」）。「文脈ヒント」は同一文にあった役割語で、カテゴリの確定材料ではない。\n');
  const table = (list: typeof rows) => {
    L.push('| 社名（初出表記） | 根拠 | 登場回数 | 初出の出典URL（当サイト） | 推定カテゴリ | 文脈ヒント | 判定理由 |');
    L.push('|---|---|---:|---|---|---|---|');
    for (const r of list) L.push(`| ${r.name} | ${r.sources} | ${r.count} | ${r.firstUrl} | 調査中 | ${r.roleHint} | ${r.why} |`);
    L.push('');
  };
  const tier1 = (list: typeof rows) => list.filter((r) => /[ab]/.test(r.sources));
  const tier2 = (list: typeof rows) => list.filter((r) => !/[ab]/.test(r.sources));
  L.push(`## 第1層: 案件に直結（事業者欄(a)／案件本文の関与文脈(b) を含む）— 登録候補 ${tier1(reg).length} ／ 保留 ${tier1(hold).length}\n`);
  L.push('旧A-3の「ナビ不在」に最も近い層（構造化欄＋案件本文）。\n');
  L.push(`### 1-登録候補（${tier1(reg).length}）\n`); table(tier1(reg));
  L.push(`### 1-保留候補（${tier1(hold).length}）\n`); table(tier1(hold));
  L.push(`## 第2層: news 由来のみ（c: title／sourceName／本文の役割語同一文）— 登録候補 ${tier2(reg).length} ／ 保留 ${tier2(hold).length}\n`);
  L.push('news 本文の役割語同一文から拾った社（Op2 が関連記事の根拠としては不採用とした領域）。登録の優先度は第1層より低い。\n');
  L.push(`### 2-登録候補（${tier2(reg).length}）\n`); table(tier2(reg));
  L.push(`### 2-保留候補（${tier2(hold).length}）\n`); table(tier2(hold));
  L.push('## 旧「41社」との差について\n');
  L.push(`旧リストはファイル未残存のため件数以外は照合不能。本便の第1層（案件直結）は ${tier1(rows).length}件で旧41に近い規模、`
    + `第2層（news本文の役割語同一文）${tier2(rows).length}件が差の主因。他の要因: ①aliases 15社を照合キーに追加（別表記による偽不在が消える方向）`
    + ' ②8月のニュース・projects 追加（母集団の増加） ③全角/半角を NFKC で同一視（導出専用・本番突合は不変）。');
  fs.writeFileSync(OUT_MD, L.join('\n') + '\n');
  console.log(`[derive-missing] 不在 ${rows.length}件（登録候補 ${reg.length} / 保留候補 ${hold.length}） → ${OUT_MD}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
