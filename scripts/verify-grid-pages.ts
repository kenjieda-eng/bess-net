#!/usr/bin/env tsx
/**
 * scripts/verify-grid-pages.ts — 県のページの並びと、変電所の詳細の題名の重なりの検査（小さな直し便・2026-11-02）
 *
 * 1. 県のページの一覧（getPrefectureSubstationsStatic）が全県で空容量の降順・件数が pref_meta と同じ。
 *    沖縄県だけ名前順の一覧を返していた（/grid/prefecture/沖縄県 の「空容量大きい順」が逆転）。
 * 2. 同じエリアの中で、変電所の詳細の title と h1 が重ならない。
 * 3. 見分ける語は同じエリアに同名がある変電所だけに付く（ほかの題名は変えない）。
 * 4. 表示用の名前（displaySubstationName・変電所の名前便 2026-11-02）: 「変電所変電所」「配電塔変電所」のように二重にならない・
 *    足さない設備の語に「変電所」が付かない・決めた例のとおりになる。
 * 5. 名称非公開（小さな直し便・2026-11-05）: 判定（isUndisclosedSubstation）が 23 件ちょうどで、IndexNow の NO_SUBMIT_SLUGS と同じ集合。
 *    題名・h1 に内部の番号（「(名称非公開)」・rikuden_ など）が出ない。冒頭の文は理由の文。noindex（page.tsx）とサイトマップの除外
 *    （sitemap.ts）が同じ関数を通る。同名の判定は「変電所」を外したキー（sameNameKey）で、東京の 4 組は裁定待ちの例外。
 * 6. 凍結（小さな直し便・2026-11-07）: 同名の判定は凍結の行も入れて数え、凍結のページと動いているページの title・h1 が重ならない
 *    （須磨 77/6.6 と凍結の須磨 77/33 が同じ題名だった）。noindex は名称非公開と凍結の 2 種類だけ（isNoindexSubstation）で、
 *    page.tsx の robots・sitemap.ts・IndexNow の NO_SUBMIT_SLUGS が同じ集合を見る。
 * 7. 名称非公開の題名・h1（小さな直し便・2026-11-07）: 事業者の名前が 1 回だけ（府県・事業者・No. を 1 つの括弧に）。
 * 8. 県の一覧の並びは表示と同じ空容量（関西の算出値が負なら 0・grid-avail.ts の shownAvailMw）で降順。
 * 9. 小さな直し便（2026-11-08）: (a) 詳細の「同じ県の他の変電所」「〇〇エリアで空容量の大きい変電所」（index.json の pref_top・area_top）に
 *    凍結が 0。(b) 転送にした凍結（FROZEN_REDIRECTS・egz-kikan-x）は next.config.js の redirects に permanent で載り、転送先はエリアのページ。
 *    凍結の行（同名の判定）・一覧・pref_top・area_top のどれにも入らない（凍結のページ 9 → 8）。
 *
 * microCMS へのアクセスなし（precompute の静的データだけ）。問題があれば exit 1＝ビルドで落ちる。prebuild に入れている。
 */
import substationsIndex from '../src/data/substations/index.json';
import { substationPageTitle, substationHeadingName, displaySubstationName, substationBasicSentence, operatorShortName } from '../src/lib/grid-meta';
import { getAreaSubstationsStatic, getFrozenAreaSubstationsStatic, getPrefectureSubstationsStatic, nameQualifiers, sameNameKey, SAME_NAME_RULING_PENDING } from '../src/lib/grid-static-lists';
import { isUndisclosedSubstation, undisclosedReason } from '../src/lib/substation-undisclosed';
import { isNoindexSubstation } from '../src/lib/substation-noindex';
import { FROZEN_PAGE_SLUGS, FROZEN_REDIRECTS, FROZEN_SUBSTATION_SLUGS } from '../src/lib/substations-frozen';
import { AREA_META } from '../src/app/grid/[slug]/area-meta';
import { shownAvailMw } from '../src/lib/grid-avail';
import * as fs from 'node:fs';
export {};

type TopRow = { slug: string; name: string; cap: number | null; kv: number | null };
const index = substationsIndex as unknown as {
  area_dates: Record<string, unknown>;
  pref_meta: Record<string, { count: number }>;
  pref_top: Record<string, TopRow[]>;
  area_top: Record<string, TopRow[]>;
};
const problems: string[] = [];

const prefs = Object.keys(index.pref_meta).filter((p) => p !== 'unknown');
for (const pref of prefs) {
  const list = getPrefectureSubstationsStatic(pref);
  if (list.length !== index.pref_meta[pref].count) problems.push(`${pref}: 一覧 ${list.length} 件・pref_meta ${index.pref_meta[pref].count} 件`);
  const inversions = list.filter((s, i) => i > 0 && (shownAvailMw(s) ?? -1) > (shownAvailMw(list[i - 1]) ?? -1)).length;
  if (inversions) problems.push(`${pref}: 空容量（表示値）の降順でない所が ${inversions} か所（先頭 ${list[0]?.name} ${list[0] ? shownAvailMw(list[0]) : '—'}MW）`);
}

const perArea: string[] = [];
let groupsTotal = 0;
let membersTotal = 0;
let added = 0;
let kept = 0;
const undisclosed: string[] = [];
const frozenSeen: string[] = [];
const frozenPairs: string[] = [];
let noindexActive = 0;
for (const area of Object.keys(index.area_dates)) {
  const rows = getAreaSubstationsStatic(area);
  // 凍結の行も入れて同名を数える（凍結のページも開けるので、題名が重なってはいけない・2026-11-07）
  const frozen = getFrozenAreaSubstationsStatic(area);
  const withFrozen = [...rows, ...frozen];
  const qualifiers = nameQualifiers(withFrozen);
  const byName = new Map<string, number>();
  for (const s of withFrozen) byName.set(sameNameKey(s), (byName.get(sameNameKey(s)) ?? 0) + 1);
  for (const f of frozen) {
    frozenSeen.push(f.slug);
    if (!FROZEN_PAGE_SLUGS.has(f.slug)) problems.push(`${f.slug}: 凍結の行にあるのに凍結のページの一覧に無い（転送にしたものは入れない）`);
    if (rows.some((s) => s.slug === f.slug)) problems.push(`${f.slug}: 凍結なのに一覧に出ている`);
    if (!isNoindexSubstation(f)) problems.push(`${f.slug}: 凍結のページが noindex でない`);
    const mates = rows.filter((s) => sameNameKey(s) === sameNameKey(f));
    if (mates.length) frozenPairs.push(`${f.slug}「${substationPageTitle(f, f.prefecture, qualifiers.get(f.slug) ?? null)}」／${mates.map((m) => `${m.slug}「${substationPageTitle(m, m.prefecture, qualifiers.get(m.slug) ?? null)}」`).join('／')}`);
  }
  for (const s of rows) {
    if (isNoindexSubstation(s)) {
      noindexActive++;
      if (!isUndisclosedSubstation(s)) problems.push(`${s.slug}: 名称非公開でも凍結でもないのに noindex`);
    }
  }
  const groups = [...byName.values()].filter((n) => n > 1);
  perArea.push(`${area} ${groups.length}`);
  groupsTotal += groups.length;
  membersTotal += groups.reduce((a, b) => a + b, 0);

  for (const s of withFrozen) {
    const same = (byName.get(sameNameKey(s)) ?? 0) > 1;
    if (same !== qualifiers.has(s.slug)) problems.push(`${s.slug} ${s.name}: 同名 ${same} なのに見分ける語が ${qualifiers.get(s.slug) ?? 'なし'}`);
    if (same && !qualifiers.get(s.slug)) problems.push(`${s.slug} ${s.name}: 見分ける語が空`);
  }
  const seen = new Map<string, string>();
  const check = (kind: string, value: string, slug: string) => {
    const key = `${kind}:${value}`;
    if (seen.has(key)) problems.push(`${area}: ${kind}が重なる「${value}」（${seen.get(key)}・${slug}）`);
    seen.set(key, slug);
  };
  // title・h1 の重なりは凍結のページも入れて見る（題名は page.tsx と同じ関数）
  for (const s of withFrozen) {
    const q = qualifiers.get(s.slug) ?? null;
    check('title', substationPageTitle(s, s.prefecture, q), s.slug);
    check('h1', substationHeadingName(s, s.prefecture, q), s.slug);
  }
  for (const s of rows) {
    const q = qualifiers.get(s.slug) ?? null;
    const display = displaySubstationName(s);

    // 一次の名前に元からある語（四日市火力変電所）は問わない。九州の「中間」は地名なので 1 字以上前に付くものだけ
    if (display.includes('変電所変電所') || (display !== s.name && /(?:配電塔|変電塔|開閉所|発電所|発電|水力|変換所|塔|SS|.中間|局|局配|火力|直配)変電所/.test(display))) problems.push(`${s.slug} ${s.name}: 二重になった「${display}」`);
    if (display !== s.name) added++; else kept++;
    if (/(?:配電塔|変電塔|開閉|発電所|変換所|\(塔\))/.test(s.name) && display !== s.name) problems.push(`${s.slug} ${s.name}: 足さない語に足した「${display}」`);
    if (display.includes('変電所') && (display.match(/変電所/g) ?? []).length > 1) problems.push(`${s.slug} ${s.name}: 「変電所」が 2 回「${display}」`);
    // 冒頭の 1 文: 欠けた値を出さない／変電所と呼ばない設備を「の変電所」と書かない／名前が公表されていないレコードには出さない／文の中で電圧が食い違わない
    const sentence = substationBasicSentence(s, s.operator);
    if (/undefined|null|NaN/.test(sentence ?? '')) problems.push(`${s.slug} ${s.name}: 冒頭の 1 文に欠けた値「${sentence}」`);
    if (sentence && !display.includes('変電所') && sentence.includes('変電所')) problems.push(`${s.slug} ${s.name}: 変電所と呼ばない設備の文に「変電所」「${sentence}」`);
    if (sentence && /^[0-9A-Za-z]+$/.test(s.name)) problems.push(`${s.slug} ${s.name}: 名前が公表されていないのに文がある`);
    if (isUndisclosedSubstation(s)) {
      undisclosed.push(s.slug);
      const title = substationPageTitle(s, s.prefecture, q);
      const h1 = substationHeadingName(s, s.prefecture, q);
      if (/\(名称非公開\)|rikuden_|energia_|kansai_/.test(title + display) || !display.startsWith('名称非公開の変電所（')) problems.push(`${s.slug}: 名称非公開の表示名が崩れている「${display}」`);
      // 事業者の名前は 1 回だけ（2026-11-07: 北陸の 20 件で「（北陸電力送配電・No.…）（福井県・北陸電力送配電）」と 2 回出ていた）。
      // 正式名と短い名（中国電力NW など）のどちらで出ても数える。短い名が正式名の一部でないので重ねて数えない
      const op = s.operator ?? '';
      const names = [...new Set([op, operatorShortName(op)].filter(Boolean))];
      const opCount = (t: string) => names.reduce((n, name) => n + (t.split(name).length - 1), 0);
      for (const [kind, t] of [['title', title], ['h1', h1]] as const) {
        if (op && opCount(t) !== 1) problems.push(`${s.slug}: 名称非公開の${kind}に事業者が ${opCount(t)} 回「${t}」`);
        if ((t.match(/（/g) ?? []).length !== 1) problems.push(`${s.slug}: 名称非公開の${kind}の括弧が 1 つでない「${t}」`);
        if (s.prefecture && !t.includes(`（${s.prefecture}・`)) problems.push(`${s.slug}: 名称非公開の${kind}に府県が無い「${t}」`);
      }
      // No. は公表元の番号の形（英数・全角英字・「基」などで、slug や「-」「_」を含まない）。495b246 で rkd-toyama-tss0076 が「No.rkd-toyama-tss0076」になった
      const no = display.match(/・No\.([^）]+)）$/)?.[1] ?? '';
      if (!no || /[-_\s]/.test(no) || display.includes(s.slug)) problems.push(`${s.slug}: 名称非公開の No. が公表元の番号の形でない「${display}」`);
      if (sentence !== undisclosedReason(s)) problems.push(`${s.slug}: 名称非公開の冒頭の文が理由の文でない「${sentence}」`);
    }
    if (sentence && /\d\/\d[\d.]*kVは/.test(sentence)) problems.push(`${s.slug} ${s.name}: 主語に電圧が残っている「${sentence}」`);
  }
}

// 決めた例（便 §2-1 と報告の表）。規則を変えたらここも変える
const EXAMPLES: Array<[string, number | null, number | null, string]> = [
  ['新野田', 500, 275, '新野田変電所'],
  ['新京葉(1)', 500, 275, '新京葉変電所(1)'],
  ['依佐美変電所（２）', 275, 77, '依佐美変電所（２）'],
  ['山梨変電所(1)', 154, 66, '山梨変電所(1)'],
  ['一の勢（6kV）', 66, 6, '一の勢変電所（6kV）'],
  ['中島　66/22kV', 66, 22, '中島変電所　66/22kV'],
  ['新野田11・12・14B', 275, 154, '新野田変電所11・12・14B'],
  ['阿月(変)', 66, 6, '阿月変電所'],
  ['上場第１', 22, 6, '上場第１変電所'],
  ['開発', 77, 6.6, '開発変電所'],
  ['中間', 66, 6, '中間変電所'],
  // 足さない
  ['安代配電塔', 22, 6.6, '安代配電塔'],
  ['伊上(塔)', 22, 6, '伊上(塔)'],
  ['本川開閉所', 187, 66, '本川開閉所'],
  ['永代橋中間', null, 22, '永代橋中間'],
  ['大宮局', null, null, '大宮局'],
  ['新富士（局配）', null, null, '新富士（局配）'],
  ['御岳（発）', null, null, '御岳（発）'],
  ['敦賀火力', 275, 77, '敦賀火力'],
  ['九谷　直配', 6.6, 6.6, '九谷　直配'],
  ['1113', 11, 66, '1113'],
  ['西宮浜1号', 22, 6.6, '西宮浜1号'],
  ['坂下№1', 22, 6, '坂下№1'],
  ['小原', 154, 11, '小原'],
  ['遠野', 6.6, 33, '遠野'],
  ['東町', 11, 6.9, '東町'],
];
for (const [name, p, s, want] of EXAMPLES) {
  const got = displaySubstationName({ name, voltage_primary_kv: p, voltage_secondary_kv: s });
  if (got !== want) problems.push(`例「${name}」: 期待「${want}」・実際「${got}」`);
}

// 名称非公開の例（表示名の形）
for (const [rec, want] of [
  [{ name: '(名称非公開) rikuden_local03_FSS062', external_id: 'rikuden_local03_FSS062', operator: '北陸電力送配電' }, '名称非公開の変電所（北陸電力送配電・No.FSS062）'],
  [{ name: '(名称非公開) energia_kikan_基S16', external_id: 'energia_kikan_基S16', operator: '中国電力ネットワーク' }, '名称非公開の変電所（中国電力NW・No.基S16）'],
  [{ name: '変電所', external_id: 'kansai_kikan_ＢＵ', operator: '関西電力送配電' }, '名称非公開の変電所（関西電力送配電・No.ＢＵ）'],
  [{ name: '(名称非公開) rikuden_local01_TSS076', external_id: 'rkd-toyama-tss0076', operator: '北陸電力送配電' }, '名称非公開の変電所（北陸電力送配電・No.TSS076）'],
] as const) {
  const got = displaySubstationName({ ...rec, voltage_primary_kv: 275, voltage_secondary_kv: 154 });
  if (got !== want) problems.push(`例「${rec.name}」: 期待「${want}」・実際「${got}」`);
}
// 名称非公開は 23 件ちょうどで、IndexNow の道具の NO_SUBMIT_SLUGS と同じ集合（どちらかだけ変えると、送る・送らないと noindex が食い違う）
const toolSrc = fs.readFileSync('scripts/indexnow-submit.ts', 'utf8');
const noSubmitBlock = toolSrc.slice(toolSrc.indexOf('const UNDISCLOSED_SLUGS'), toolSrc.indexOf(']);', toolSrc.indexOf('const UNDISCLOSED_SLUGS')));
const noSubmit = new Set([...noSubmitBlock.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]));
if (undisclosed.length !== 23) problems.push(`名称非公開が ${undisclosed.length} 件（23 件のはず）`);
if (undisclosed.length !== noSubmit.size || undisclosed.some((s) => !noSubmit.has(s))) problems.push('名称非公開と IndexNow の UNDISCLOSED_SLUGS が食い違う');
// IndexNow の NO_SUBMIT_SLUGS は 名称非公開＋凍結（noindex の 2 種類）
if (!/const NO_SUBMIT_SLUGS[^=]*=\s*new Set\(\[\.\.\.UNDISCLOSED_SLUGS,\s*\.\.\.FROZEN_SUBSTATION_SLUGS\]\)/.test(toolSrc)) problems.push('IndexNow の NO_SUBMIT_SLUGS が 名称非公開＋凍結 になっていない');
// 凍結のページ: 全件がエリアの凍結の行にある（noindex と同名の判定に入る）。転送にした凍結は入らない（2026-11-08）
if (frozenSeen.length !== FROZEN_PAGE_SLUGS.size) problems.push(`凍結の行 ${frozenSeen.length} 件・凍結のページ ${FROZEN_PAGE_SLUGS.size} 件`);
if (FROZEN_PAGE_SLUGS.size + FROZEN_REDIRECTS.size !== FROZEN_SUBSTATION_SLUGS.size) problems.push('凍結のページ＋転送 ≠ 凍結の全件');
// 9(a). 詳細の「同じ県の他の変電所」「〇〇エリアで空容量の大きい変電所」に凍結が 0（2026-11-08）
const topFrozen: string[] = [];
for (const [key, rows] of [...Object.entries(index.pref_top), ...Object.entries(index.area_top)]) {
  for (const r of rows) if (FROZEN_SUBSTATION_SLUGS.has(r.slug)) topFrozen.push(`${key}:${r.slug}`);
}
if (topFrozen.length) problems.push(`pref_top・area_top に凍結 ${topFrozen.length} 件（${topFrozen.slice(0, 5).join('・')}）`);
// 9(b). 転送にした凍結: どの一覧にも無く、転送先はエリアのページ（redirects は下の finish で照合）
for (const [slug, to] of FROZEN_REDIRECTS) {
  const m = /^\/grid\/([a-z]+)$/.exec(to);
  if (!m || !AREA_META[m[1]]) problems.push(`${slug}: 転送先 ${to} がエリアのページでない`);
  if (frozenSeen.includes(slug)) problems.push(`${slug}: 転送にしたのに凍結の行に入っている`);
  if (Object.keys(index.area_dates).some((a) => getAreaSubstationsStatic(a).some((s) => s.slug === slug))) problems.push(`${slug}: 転送にしたのに一覧に出ている`);
}
if (noindexActive !== undisclosed.length) problems.push(`一覧の noindex ${noindexActive} 件・名称非公開 ${undisclosed.length} 件`);
// noindex とサイトマップの除外が同じ判定を通る
const pageSrc = fs.readFileSync('src/app/grid/[slug]/page.tsx', 'utf8');
if (!/isNoindexSubstation\(sub\)\s*\?\s*\{\s*robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/.test(pageSrc)) problems.push('page.tsx の noindex が isNoindexSubstation を通っていない');
if (!/substationPageTitle\(sub,/.test(pageSrc) || !/substationHeadingName\(sub,/.test(pageSrc)) problems.push('page.tsx の題名・見出しが substationPageTitle／substationHeadingName を通っていない');
const sitemapSrc = fs.readFileSync('src/app/sitemap.ts', 'utf8');
if (!/substations\.filter\(\(s\)\s*=>\s*!isNoindexSubstation\(s\)\)/.test(sitemapSrc)) problems.push('sitemap.ts が noindex（名称非公開・凍結）を外していない');
for (const slug of SAME_NAME_RULING_PENDING) {
  if (!Object.keys(index.area_dates).some((a) => getAreaSubstationsStatic(a).some((s) => s.slug === slug))) problems.push(`裁定待ちの ${slug} が一覧に無い（再取込で変わった？）`);
}

async function finish(): Promise<void> {
  // 9(b). next.config.js の redirects（評価した結果）に、転送にした凍結が permanent で 1 本ずつ載っている
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nextConfig = require('../next.config.js') as { redirects: () => Promise<{ source: string; destination: string; permanent?: boolean }[]> };
  const redirects = await nextConfig.redirects();
  for (const [slug, to] of FROZEN_REDIRECTS) {
    const hit = redirects.filter((r) => r.source === `/grid/${slug}`);
    if (hit.length !== 1 || hit[0].destination !== to || hit[0].permanent !== true) problems.push(`${slug}: next.config.js の redirects に「/grid/${slug} → ${to}（permanent）」が 1 本でない（${JSON.stringify(hit)}）`);
  }
  console.log(`[verify:grid-pages] 名称非公開 ${undisclosed.length} 件・凍結のページ ${frozenSeen.length} 件（どちらも noindex・サイトマップ外）・凍結の転送 ${FROZEN_REDIRECTS.size} 件（${[...FROZEN_REDIRECTS].map(([s, t]) => `${s} → ${t}`).join('・')}）・同名の判定の裁定待ち ${SAME_NAME_RULING_PENDING.size} 件`);
  frozenPairs.forEach((p) => console.log(`[verify:grid-pages] 凍結と同名: ${p}`));
  console.log(`[verify:grid-pages] 県 ${prefs.length}・同じエリアで同名の組 ${groupsTotal}（${membersTotal} 件）: ${perArea.join('・')}`);
  console.log(`[verify:grid-pages] 表示名に「変電所」を足した ${added} 件・そのまま ${kept} 件・pref_top／area_top の凍結 ${topFrozen.length} 件`);
  if (problems.length) {
    console.error(`[verify:grid-pages] ★NG ${problems.length} 件`);
    problems.slice(0, 40).forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log('[verify:grid-pages] ok   県の一覧は降順・同じエリアで title と h1 の重なり 0・凍結は詳細の並びに 0・転送は redirects に 1 本');
}
finish().catch((e) => {
  console.error('[verify:grid-pages] ★NG', e);
  process.exit(1);
});
