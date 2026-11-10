/**
 * scripts/lib/import-graph.ts — ページから読み込み先（@/… と相対）をたどり、microCMS を値として import していないかを見る
 * （補助金の一覧の作り直しの間隔便・2026-11-10 に verify-grid-detail-static.ts から切り出した。挙動は不変）
 *
 * - import／export … from・require()・副作用の import '…'・動的 import('…') をたどる。import type（句が型だけ）は見ない。
 * - src/lib/microcms.ts を値として読み込んでいたら、読み込みの道筋つきで problems に入れる（その先はたどらない）。
 * - microcms-js-sdk を import していたら problems に入れる。
 * - コメント（ブロックと行頭の //）は外してから見る。
 *
 * 使う所: scripts/verify-grid-detail-static.ts（/grid/[slug]）・scripts/verify-jst-today.ts（/subsidies）。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

export type ImportWalk = {
  /** たどった読み込み先（起点を含む。.json なども入る） */
  seen: Set<string>;
  /** microCMS を値として読み込んでいる所（無ければ空） */
  problems: string[];
};

/** コメント（ブロックと行頭の //）を外したソース。fetch( などを数えるときも同じ外し方を使う */
export const stripComments = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

export function walkValueImports(root: string, startFiles: string[]): ImportWalk {
  const STARTS = startFiles.filter((f) => fs.existsSync(f));
  const FORBIDDEN_FILE = path.join(root, 'src', 'lib', 'microcms.ts');
  const problems: string[] = [];
  const resolveLocal = (from: string, spec: string): string | null => {
    let base: string;
    if (spec.startsWith('@/')) base = path.join(root, 'src', spec.slice(2));
    else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
    else return null;
    for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
      const f = base + ext;
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
    }
    return null;
  };
  /** import 句が型だけか（import type X／import { type A, type B }） */
  const isTypeOnly = (clause: string): boolean => {
    const c = clause.trim();
    if (/^type\s/.test(c)) return true;
    const m = /^\{([\s\S]*)\}$/.exec(c);
    return !!m && m[1].split(',').map((s) => s.trim()).filter(Boolean).every((s) => /^type\s/.test(s));
  };
  const seen = new Set<string>();
  const parent = new Map<string, string>();
  const queue = [...STARTS];
  while (queue.length) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const src = stripComments(fs.readFileSync(file, 'utf8'));
    const specs: Array<{ spec: string; typeOnly: boolean }> = [];
    // 句の形を限る（`export type X = …` のような from の無い文から次の from まで伸びて、値の import を「型だけ」と見誤らない）
    const CLAUSE = String.raw`(?:type\s+)?(?:[\w$]+\s*,\s*)?(?:\{[^}]*\}|\*\s+as\s+[\w$]+|\*|[\w$]+)`;
    for (const m of src.matchAll(new RegExp(String.raw`^\s*(?:import|export)\s+(${CLAUSE})\s*from\s+['"]([^'"]+)['"]`, 'gm'))) {
      specs.push({ spec: m[2], typeOnly: isTypeOnly(m[1]) });
    }
    for (const m of src.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push({ spec: m[1], typeOnly: false });
    for (const m of src.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) specs.push({ spec: m[1], typeOnly: false });
    for (const m of src.matchAll(/import\(\s*['"`]([^'"`$]+)/g)) specs.push({ spec: m[1], typeOnly: false });
    for (const { spec, typeOnly } of specs) {
      if (typeOnly) continue;
      if (spec === 'microcms-js-sdk') problems.push(`${path.relative(root, file)} が microcms-js-sdk を import している`);
      const target = resolveLocal(file, spec);
      if (!target) continue;
      if (target === FORBIDDEN_FILE) {
        const via: string[] = [path.relative(root, file)];
        let cur = file;
        while (parent.has(cur)) { cur = parent.get(cur)!; via.unshift(path.relative(root, cur)); }
        problems.push(`microcms.ts を値として import している: ${via.join(' → ')} → src/lib/microcms.ts`);
        continue;
      }
      if (!seen.has(target) && !parent.has(target) && !STARTS.includes(target)) parent.set(target, file);
      queue.push(target);
    }
  }
  return { seen, problems };
}
