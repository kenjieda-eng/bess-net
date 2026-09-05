#!/usr/bin/env tsx
/**
 * scripts/verify-projects-body.ts — projects body 表示時再構成の回帰検査
 *
 * 承認: 検証記録_Pj2D_裁定_2026-09-03_ユウ.md §2 裁定A 条件②
 *   「実行時にも全331件 diff を機械分類し『テンプレ件以外の変化0・第1文以外の変化0』を再検証」
 *
 * 2軸で検査する（#118 / #119 の2軸化と同じ思想）:
 *   軸1: 合成データによる単体検査 — 判定条件・組み立て・冪等・非破壊の仕様が保たれているか
 *   軸2: 本番データ全件による機械分類 — 実データで「触ってはいけないものを触っていない」か
 *
 * 実行: npm run verify:projects-body
 *   軸2 は microCMS の env が必要。無い場合は軸1 のみ実行して PASS/FAIL を返す。
 */
import {
  reconstructProjectBody,
  isTemplateBody,
  TEMPLATE_HEAD,
  TEMPLATE_MARK,
} from '../src/lib/projects-body';
import { LIST_EXCLUDED_PROJECT_SLUGS } from '../src/lib/projects-excluded';

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean, detail?: string): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const TAIL =
  '<h2 id="h1b9eb7c3a9">出典</h2><ul>' +
  '<li>企業公式サイト: <a href="https://example.co.jp/" target="_blank" rel="noopener noreferrer">https://example.co.jp/</a></li>' +
  '<li>PR TIMES: <a href="https://prtimes.jp/main/html/rd/p/000000001.000000001.html" target="_blank" rel="noopener noreferrer">https://prtimes.jp/main/html/rd/p/000000001.000000001.html</a></li>' +
  '</ul><p>※本ページは公開情報を構造化したものです。最新の進捗・諸元については、上記出典URLをご参照ください。</p>';

function tpl(first: string): string {
  return `${TEMPLATE_HEAD}<p>${first}</p><p>～リード文～</p>${TAIL}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rec(over: Record<string, any>): any {
  return {
    body: tpl('<strong>旧名</strong>は、旧所在地に立地する系統用蓄電所。発表企業：旧事業者。ステータス：計画中（発表日：2020-01-01）。'),
    name: '新名',
    prefecture: '東京都',
    city: '千代田区',
    operator: '新事業者',
    status: ['稼働中'],
    cod: '2026-01-01',
    outputMw: 2,
    capacityMwh: 8,
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000001.000000001.html',
    ...over,
  };
}

function firstParagraph(body: string): string {
  const m = /^<h2 id="h3af4d147a9">プロジェクト概要<\/h2><p>([\s\S]*?)<\/p>/.exec(body);
  return m ? m[1] : '';
}

console.log('=== 軸1: 合成データによる単体検査 ===');

// --- 判定条件（テンプレ指紋） ---
check('指紋①なし（見出しで始まらない）→ 触らない', (() => {
  const body = `<p>手書きの本文です。発表企業：X。</p>`;
  return reconstructProjectBody(rec({ body })) === body;
})());
check('指紋②なし（発表企業：を含まない）→ 触らない', (() => {
  const body = `${TEMPLATE_HEAD}<p><strong>A</strong>は、東京都に立地する系統用蓄電所。</p>${TAIL}`;
  return reconstructProjectBody(rec({ body })) === body;
})());
check('見出しが途中にあるだけ（先頭でない）→ 触らない', (() => {
  const body = `<p>前置き</p>${TEMPLATE_HEAD}<p><strong>A</strong>は、東京都に立地する系統用蓄電所。発表企業：X。</p>`;
  return reconstructProjectBody(rec({ body })) === body;
})());
check('キュレーション本文（「〜系統用蓄電所で、」型）→ 触らない', (() => {
  const body = '<p><strong>NC長浜市三川町蓄電所</strong>は、滋賀県長浜市三川町に立地する系統用蓄電所で、定格出力1,988kW。</p>';
  return reconstructProjectBody(rec({ body })) === body;
})());
check('body 空 → 空のまま', reconstructProjectBody(rec({ body: '' })) === '');
check('isTemplateBody の判定が指紋2条件と一致', isTemplateBody(tpl('x発表企業：y')) && !isTemplateBody('<p>x</p>'));

// --- 第1段落の組み立て ---
check('第1段落が field から再生成される', (() => {
  const out = firstParagraph(reconstructProjectBody(rec({})));
  return out === '<strong>新名</strong>は、東京都千代田区に立地する系統用蓄電所。出力 2 MW、容量 8 MWh 規模。発表企業：新事業者。ステータス：稼働中（発表日：2026-01-01）。';
})(), firstParagraph(reconstructProjectBody(rec({}))));
check('所在地が空 → 「は系統用蓄電所。」（壊れた日本語を出さない）', (() => {
  const out = firstParagraph(reconstructProjectBody(rec({ prefecture: null, city: null })));
  return out.startsWith('<strong>新名</strong>は系統用蓄電所。') && !out.includes('は、に立地する');
})());
check('出力のみ（容量0）→ 出力句だけ', firstParagraph(reconstructProjectBody(rec({ capacityMwh: 0 }))).includes('出力 2 MW 規模。'));
check('容量のみ（出力0）→ 容量句だけ', firstParagraph(reconstructProjectBody(rec({ outputMw: 0 }))).includes('容量 8 MWh 規模。'));
check('両方0（調査中）→ 諸元句を出さない', (() => {
  const out = firstParagraph(reconstructProjectBody(rec({ outputMw: 0, capacityMwh: 0 })));
  return !out.includes('出力') && !out.includes('容量');
})());
check('小数はそのまま（8.146 を丸めない）', firstParagraph(reconstructProjectBody(rec({ capacityMwh: 8.146 }))).includes('容量 8.146 MWh 規模。'));
check('status 空 → ステータス句を出さない', !firstParagraph(reconstructProjectBody(rec({ status: [] }))).includes('ステータス：'));
check('HTML 特殊文字をエスケープする', firstParagraph(reconstructProjectBody(rec({ name: 'A<b>&' }))).includes('A&lt;b&gt;&amp;'));

// --- 非破壊 ---
check('第2段落（リード文）を保つ', reconstructProjectBody(rec({})).includes('<p>～リード文～</p>'));
check('出典ブロックを保つ', reconstructProjectBody(rec({})).includes('<h2 id="h1b9eb7c3a9">出典</h2>'));
check('末尾の注記を保つ', reconstructProjectBody(rec({})).includes('※本ページは公開情報を構造化したものです'));
check('企業公式サイト行を保つ', reconstructProjectBody(rec({})).includes('https://example.co.jp/'));

// --- 出典 URL の統一 ---
check('sourceUrl が出典に既出 → PR TIMES 行を書き換えない', (() => {
  const out = reconstructProjectBody(rec({}));
  return out.includes('000000001.000000001.html') && !out.includes('999');
})());
check('sourceUrl が出典に無い → PR TIMES 行を sourceUrl に揃える', (() => {
  const src = 'https://prtimes.jp/main/html/rd/p/000000999.000000001.html';
  const out = reconstructProjectBody(rec({ sourceUrl: src }));
  return out.includes(`<li>PR TIMES: <a href="${src}"`) && out.includes(`>${src}</a>`) && !out.includes('000000001.000000001.html');
})());
check('★sourceUrl が別の <li>（企業元リリース）に既出 → PR TIMES 行を消さない', (() => {
  const other = 'https://prtimes.jp/main/html/rd/p/000000104.000000001.html';
  const body = `${TEMPLATE_HEAD}<p><strong>A</strong>は、東京都に立地する系統用蓄電所。発表企業：X。</p>` +
    `<h2 id="h1b9eb7c3a9">出典</h2><ul>` +
    `<li>🎯 <strong>企業元リリース</strong>: <a href="${other}" target="_blank" rel="noopener noreferrer">${other}</a></li>` +
    `<li>PR TIMES: <a href="https://prtimes.jp/main/html/rd/p/000000121.000000001.html" target="_blank" rel="noopener noreferrer">https://prtimes.jp/main/html/rd/p/000000121.000000001.html</a></li></ul>`;
  const out = reconstructProjectBody(rec({ body, sourceUrl: other }));
  return out.includes('000000121.000000001.html');
})());
check('sourceUrl が PR TIMES でない → 出典を触らない', (() => {
  const out = reconstructProjectBody(rec({ sourceUrl: 'https://example.co.jp/news/1' }));
  return out.includes('000000001.000000001.html');
})());

// --- 冪等 ---
check('冪等: 2回適用しても同じ', (() => {
  const r1 = rec({});
  const a = reconstructProjectBody(r1);
  const b = reconstructProjectBody({ ...r1, body: a });
  return a === b;
})());
check('冪等: 所在地が空のケースでも', (() => {
  const r1 = rec({ prefecture: null, city: null });
  const a = reconstructProjectBody(r1);
  const b = reconstructProjectBody({ ...r1, body: a });
  return a === b;
})());

console.log(`\n軸1: ${pass} PASS / ${fail} FAIL`);

// ===== 軸2: 本番データ全件 =====
async function axis2(): Promise<void> {
  const domain = process.env.MICROCMS_SERVICE_DOMAIN;
  const key = process.env.MICROCMS_API_KEY;
  if (!domain || !key) {
    console.log('\n=== 軸2: skip（MICROCMS env なし）===');
    return;
  }
  console.log('\n=== 軸2: 本番データ全件の機械分類（裁定A条件②）===');
  const base = `https://${domain}.microcms.io/api/v1/projects`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = [];
  for (let off = 0; off < 2000; off += 100) {
    const r = await fetch(`${base}?limit=100&offset=${off}`, { headers: { 'X-MICROCMS-API-KEY': key } });
    if (!r.ok) throw new Error(`GET projects → HTTP ${r.status}`);
    const d = (await r.json()) as { totalCount: number; contents: unknown[] };
    all.push(...d.contents);
    if (all.length >= d.totalCount) break;
  }

  const P1 = /^<h2 id="h3af4d147a9">プロジェクト概要<\/h2><p>([\s\S]*?)<\/p>/;
  const PR = /<li>PR TIMES: <a href="[^"]*"[^>]*>[^<]*<\/a><\/li>/;
  let tplCount = 0, changed = 0, changedListed = 0, nonTpl = 0, beyond = 0, nonIdem = 0, lost = 0, urlChanged = 0;
  for (const r of all) {
    const b0: string = r.body ?? '';
    const isTpl = isTemplateBody(b0);
    if (isTpl) tplCount++;
    const b1 = reconstructProjectBody(r);
    if (reconstructProjectBody({ ...r, body: b1 }) !== b1) nonIdem++;
    if (b1 === b0) continue;
    changed++;
    if (!LIST_EXCLUDED_PROJECT_SLUGS.has(r.slug)) changedListed++;
    if (!isTpl) nonTpl++;
    if (b0.replace(P1, '').replace(PR, '') !== b1.replace(P1, '').replace(PR, '')) beyond++;
    for (const must of ['<h2 id="h1b9eb7c3a9">出典</h2>', '※本ページは公開情報を構造化したものです']) {
      if (b0.includes(must) && !b1.includes(must)) lost++;
    }
    if ((b0.match(PR)?.[0] ?? '') !== (b1.match(PR)?.[0] ?? '')) urlChanged++;
  }
  console.log(`  レコード ${all.length}件 / テンプレ指紋一致 ${tplCount}件`);
  console.log(`  本文が変わる ${changed}件（掲載中 ${changedListed}件） / 出典URLが変わる ${urlChanged}件`);
  check('テンプレ件以外の変化 0', nonTpl === 0, `${nonTpl}件`);
  check('第1段落・出典URL以外の変化 0', beyond === 0, `${beyond}件`);
  check('テンプレ後段の欠落 0', lost === 0, `${lost}件`);
  check('非冪等 0', nonIdem === 0, `${nonIdem}件`);
}

axis2()
  .then(() => {
    console.log(`\n[verify:projects-body] ${pass} PASS / ${fail} FAIL`);
    if (fail > 0) process.exit(1);
    console.log('All checks passed. ✓');
  })
  .catch((e) => {
    console.error('[verify:projects-body] FATAL:', e);
    process.exit(1);
  });

export {};
