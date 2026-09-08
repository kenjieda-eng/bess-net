#!/usr/bin/env tsx
/**
 * scripts/verify-nearby-cards.ts — 「近隣プロジェクトカードに一覧除外レコード（301元／案件性なし）が出ない」機械検査
 *
 * 背景（Pj2-G ■3.5・2026-09-08 ユウ裁定）:
 *   /grid/[slug] の「近隣のプロジェクト」カードは getNearbyProjects（src/lib/related-cards.ts）が返す。
 *   /projects 一覧・sitemap は LIST_EXCLUDED_PROJECT_SLUGS で除外済みだったが、近隣カードだけ未配線で、
 *   301元レコード（クリックすると canonical へ 301 する）や案件性なしレコードが候補に残っていた。
 *
 * 検査（microCMS への書込なし・GET のみ）:
 *   軸1: 座標を持つ projects のうち、一覧除外に該当する slug が何件あるか（＝除外の効き目の件数）
 *   軸2: getNearbyProjects と同じ絞り込みを再現し、返り値に除外対象が 1 件も含まれないこと
 *   軸3: related-cards.ts が isListExcludedProject を実際に呼んでいること（実装の退行検知）
 *
 * 実行: npx tsx --env-file=.env.local scripts/verify-nearby-cards.ts
 */
import { readFileSync } from 'node:fs';
import { getAllProjectsWithCoords } from '../src/lib/microcms';
import { isListExcludedProject, LIST_EXCLUDED_PROJECT_SLUGS } from '../src/lib/projects-excluded';
import { getNearbyProjects } from '../src/lib/related-cards';

async function main(): Promise<void> {
  let fail = 0;
  const all = await getAllProjectsWithCoords();
  console.log(`[verify:nearby-cards] 座標を持つ projects: ${all.length} 件 / 一覧除外リスト: ${LIST_EXCLUDED_PROJECT_SLUGS.size} 件`);

  // ── 軸1: 除外対象で座標を持つもの
  const excludedWithCoords = all.filter((p) => isListExcludedProject(p.slug));
  console.log(`\n軸1: 座標つきの一覧除外レコード = ${excludedWithCoords.length} 件（この件数だけ近隣カード候補から消える）`);
  for (const p of excludedWithCoords) console.log(`   - ${p.slug}（${p.prefecture ?? '—'} / ${p.name}）`);

  // ── 軸2: 各除外レコードの座標を origin にして、その slug 自身が返ってこないこと
  //    （自分自身が半径0で必ずヒットするはずの位置なので、除外が効いていなければ必ず出る）
  console.log(`\n軸2: 除外レコードの座標を origin にして getNearbyProjects を呼び、除外対象が返らないことを確認`);
  let leaked = 0;
  for (const p of excludedWithCoords) {
    const near = await getNearbyProjects({
      origin: { latitude: p.latitude, longitude: p.longitude },
      radiusKm: 50,
      limit: 50,
      // excludeSlug は渡さない（除外フィルタ側だけで消えることを確かめる）
    });
    const bad = near.filter((n) => isListExcludedProject(n.slug));
    if (bad.length > 0) {
      leaked += bad.length;
      console.log(`   ✗ origin=${p.slug} → 除外対象が ${bad.length} 件混入: ${bad.map((b) => b.slug).join(', ')}`);
    }
  }
  if (leaked === 0) console.log(`   ✓ 全 ${excludedWithCoords.length} origin で混入 0`);
  else fail++;

  // ── 軸3: 実装が isListExcludedProject を呼んでいるか（退行検知）
  // 宣言（export async function …）から関数末尾までの範囲で呼んでいるかを見る。
  // ★ファイル冒頭の説明コメントにも関数名が出るため、アンカーは export 宣言に取ること（窓が広すぎ/狭すぎると誤判定する）
  const src = readFileSync('src/lib/related-cards.ts', 'utf8');
  const decl = src.indexOf('export async function getNearbyProjects');
  const nextDecl = src.indexOf('export async function getNearbySubstations');
  const body = decl >= 0 ? src.slice(decl, nextDecl > decl ? nextDecl : decl + 3000) : '';
  const wired = /isListExcludedProject/.test(src) && /isListExcludedProject\s*\(/.test(body);
  console.log(`\n軸3: related-cards.ts が getNearbyProjects 内で isListExcludedProject を呼ぶ → ${wired ? '✓' : '✗ 未配線'}`);
  if (!wired) fail++;

  console.log(`\n[verify:nearby-cards] ${fail === 0 ? 'All checks passed. ✓' : `FAIL ${fail} 軸`}`);
  if (fail) process.exit(1);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
