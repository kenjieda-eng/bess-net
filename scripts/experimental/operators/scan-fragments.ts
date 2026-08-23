/**
 * scripts/experimental/operators/scan-fragments.ts
 *
 * §2 断片チェック（読取専用・登録はしない）。
 *  - 第2層169社（reports/operators-missing-2026-08-21.md 由来の news のみ候補）を全数走査
 *  - 第1層の登録済み36社も同じ4パターンで再走査（他に断片が無いことの確認）
 * 判定は fragment-guard.ts（§3 と同一実装）を使う＝「レポートの判定＝次回導出の判定」を保証する。
 *
 * 出力: reports/operators-fragment-scan-2026-08-23.md / .json（除外理由つきログ）
 * 実行: npx tsx --env-file=.env.local scripts/experimental/operators/scan-fragments.ts
 */
export {};
import fs from 'node:fs';
import path from 'node:path';
import { checkFragment, type FragmentVerdict } from './fragment-guard';

const d = process.env.MICROCMS_SERVICE_DOMAIN;
const k = process.env.MICROCMS_API_KEY;
if (!d || !k) { console.error('ERROR: env required'); process.exit(1); }

type Row = { key: string; name: string; sources: string; count: number; firstUrl: string; firstTitle: string; verdict: string };

async function getAllOperators(): Promise<Array<{ name: string; slug: string; aliases?: string }>> {
  const all: Array<{ name: string; slug: string; aliases?: string }> = [];
  for (let o = 0; ; o += 100) {
    const r = await fetch(`https://${d}.microcms.io/api/v1/operators?limit=100&offset=${o}&fields=name,slug,aliases`, { headers: { 'X-MICROCMS-API-KEY': k! } });
    if (!r.ok) throw new Error(`operators HTTP ${r.status}`);
    const j = (await r.json()) as { contents: typeof all; totalCount: number };
    all.push(...j.contents);
    if (o + 100 >= j.totalCount) break;
    await new Promise((x) => setTimeout(x, 400));
  }
  return all;
}

const PAT_LABEL: Record<string, string> = {
  'a-contains-existing': '(a) 既存社名を部分文字列として含む',
  'b-leading-place': '(b) 先頭が都道府県名・市区町村名',
  'c-trailing-action': '(c) 末尾が動作語',
  'd-broken-delimiter': '(d) 「・」「／」で切れている疑い',
};

(async () => {
  const ops = await getAllOperators();
  // 除外済み（301元）の断片は「既存社名」に含めない＝断片を基準に断片を判定しないため
  const EXCLUDED = new Set(['e-flow-unyo', 'noval-holdings']);
  const existing: string[] = [];
  for (const o of ops) {
    if (EXCLUDED.has(o.slug)) continue;
    existing.push(o.name);
    for (const a of String(o.aliases ?? '').split(/[,、\n]/).map((x) => x.trim()).filter(Boolean)) existing.push(a);
  }
  console.log(`operators マスタ ${ops.length}社（除外${EXCLUDED.size}）→ 照合名 ${existing.length}件`);

  const report = JSON.parse(fs.readFileSync('reports/operators-missing-2026-08-21.json', 'utf-8')) as { rows: Row[] };
  const tier2 = report.rows.filter((r) => !r.sources.includes('a') && !r.sources.includes('b') && r.verdict === '登録候補');
  console.log(`第2層（news のみ・登録候補）: ${tier2.length}社`);

  const posted = JSON.parse(fs.readFileSync('reports/operators-tier1-posted-2026-08-23.json', 'utf-8')) as { posted: Array<{ name: string; slug: string }> };
  console.log(`第1層 登録済み: ${posted.posted.length}社`);

  const scan = (name: string): FragmentVerdict => checkFragment(name, existing);

  const t2hits: Array<{ name: string; count: number; firstUrl: string; guard: FragmentVerdict }> = [];
  for (const r of tier2) {
    const v = scan(r.name);
    if (v.isFragment) t2hits.push({ name: r.name, count: r.count, firstUrl: r.firstUrl, guard: v });
  }
  const t1hits: Array<{ name: string; slug: string; guard: FragmentVerdict }> = [];
  for (const p of posted.posted) {
    // 登録済み36社は自分自身がマスタに居るので、自分を除いた照合名で判定する
    const others = existing.filter((e) => e !== p.name);
    const v = checkFragment(p.name, others);
    if (v.isFragment) t1hits.push({ name: p.name, slug: p.slug, guard: v });
  }

  const byPat = (hits: Array<{ guard: FragmentVerdict }>) => {
    const m = new Map<string, number>();
    for (const h of hits) for (const p of h.guard.patterns) m.set(p, (m.get(p) ?? 0) + 1);
    return m;
  };

  const lines: string[] = [];
  lines.push('# operators 断片スキャン（2026-08-23・報告のみ・登録なし）', '');
  lines.push('判定は `scripts/experimental/operators/fragment-guard.ts`（§3 の抽出ガードと同一実装）。', '');
  lines.push('## §2-1 第2層（news 由来のみ・登録候補）の断片検出', '');
  lines.push(`対象 **${tier2.length}社** / 検出 **${t2hits.length}社** → 保留リストから除外。残り **${tier2.length - t2hits.length}社**`, '');
  lines.push('| パターン | 件数 |', '|---|---:|');
  for (const [p, n] of [...byPat(t2hits)].sort((a, b) => b[1] - a[1])) lines.push(`| ${PAT_LABEL[p] ?? p} | ${n} |`);
  const rev = t2hits.filter((h) => h.guard.confidence === 'review');
  lines.push('', '※1社が複数パターンに該当する場合があるため、パターン別件数の合計は検出社数と一致しない。', '');
  lines.push(`※確信度「高」${t2hits.length - rev.length}社 ／ 「要確認」${rev.length}社（実在の別法人の可能性があり、除外の可否は人の判断が要る）。`, '');
  lines.push('| 社名 | 登場回数 | 確信度 | 該当パターン | 除外理由 |', '|---|---:|---|---|---|');
  for (const h of t2hits.sort((a, b) => b.count - a.count)) {
    lines.push(`| ${h.name} | ${h.count} | ${h.guard.confidence === 'high' ? '高' : '**要確認**'} | ${h.guard.patterns.map((p) => p.split('-')[0]).join(',')} | ${h.guard.reasons.join(' ／ ')} |`);
  }
  lines.push('', '## §2-2 第1層 登録済み36社の再走査', '');
  lines.push(`対象 **${posted.posted.length}社** / 検出 **${t1hits.length}社**`, '');
  if (!t1hits.length) {
    lines.push('**他に断片はなかった**（8/23 に是正した e-flow-unyo / noval-holdings を除く34社は全て通過）。', '');
  } else {
    lines.push('| 社名 | slug | 該当パターン | 理由 |', '|---|---|---|---|');
    for (const h of t1hits) lines.push(`| ${h.name} | ${h.slug} | ${h.guard.patterns.map((p) => p.split('-')[0]).join(',')} | ${h.guard.reasons.join(' ／ ')} |`);
    lines.push('');
  }

  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync(path.join('reports', 'operators-fragment-scan-2026-08-23.md'), lines.join('\n'));
  fs.writeFileSync(path.join('reports', 'operators-fragment-scan-2026-08-23.json'), JSON.stringify({
    generated_on: '2026-08-23',
    master_operators: ops.length,
    tier2: { total: tier2.length, detected: t2hits.length, remaining: tier2.length - t2hits.length, hits: t2hits },
    tier1_posted: { total: posted.posted.length, detected: t1hits.length, hits: t1hits },
  }, null, 1));

  console.log(`\n§2-1 第2層 ${tier2.length}社 → 断片検出 ${t2hits.length}社（残り ${tier2.length - t2hits.length}社）`);
  for (const [p, n] of [...byPat(t2hits)].sort((a, b) => b[1] - a[1])) console.log(`   ${PAT_LABEL[p] ?? p}: ${n}件`);
  console.log(`§2-2 第1層 登録済み ${posted.posted.length}社 → 断片検出 ${t1hits.length}社`);
  for (const h of t1hits) console.log(`   ★ ${h.name} (${h.slug}): ${h.guard.reasons.join(' / ')}`);
  console.log('→ reports/operators-fragment-scan-2026-08-23.md / .json');
})();
