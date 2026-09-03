#!/usr/bin/env tsx
/**
 * scripts/precompute-projects-maintenance.ts — projects の保守対象リスト（Pj2-A・2026-09-03）
 *
 * 目的: 次回以降の Pj2（データ品質の再調査）で「どの案件を調べるか」を毎回手で抽出しないで済むよう、
 *   build 時に対象リストを内部 JSON として出力する。
 *   ★ページ表示には一切使わない（読み込む消費側コードを作らない）。表示は不変。
 *
 * 出力: src/lib/generated/projects-maintenance.json
 *   - investigating: 「調査中」= outputMw === 0 || capacityMwh === 0（/projects の investigatingCount と同一定義）
 *   - overdue: 運開予定日超過 = cod（解釈可能なもの）< ビルド日(JST) かつ status !== '稼働中'
 *   いずれも一覧除外集合（LIST_EXCLUDED_PROJECT_SLUGS）を除いた「掲載対象」から抽出する。
 *
 * 判定定義は /projects の実装（src/app/projects/page.tsx）と同じ式を使う（#119: 定義は一箇所）。
 * ここで式を変えると「サイトの表示件数」と「保守リストの件数」がずれるので、変える時は両方直すこと。
 *
 * 出力はキー順を固定しタイムスタンプを持たない＝データ不変なら差分ゼロ（drift 抑制。
 * 既存の precompute-projects-pref-count.ts と同方針）。
 *
 * 実行: prebuild（build:projects-maintenance）。
 * 手動: npx tsx --env-file=.env.local scripts/precompute-projects-maintenance.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LIST_EXCLUDED_PROJECT_SLUGS } from '../src/lib/projects-excluded';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('[projects-maintenance] ERROR: MICROCMS env required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;

type Row = {
  slug: string;
  name?: string;
  operator?: string;
  prefecture?: string;
  city?: string;
  outputMw?: number;
  capacityMwh?: number;
  status?: string[];
  cod?: string;
};

/** ビルド日（JST） */
function todayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * cod の表記ゆれを ISO 日付に寄せる。解釈できないものは null（＝超過判定の対象外）。
 * projects の cod は 'YYYY-MM-DD' が主だが '2026年8月' '2028年度' 等の自由記述も混在するため、
 * 「確実に過ぎている」と言える形にだけ寄せる（月のみは月末、年度のみは年度末＝甘めに倒す）。
 */
export function normalizeCod(cod?: string): string | null {
  if (!cod) return null;
  const s = cod.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(s);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  m = /^(\d{4})年(\d{1,2})月/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const last = new Date(Date.UTC(y, mo, 0)).getUTCDate(); // 当月末日
    return `${y}-${String(mo).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  }
  m = /^(\d{4})年度/.exec(s);
  if (m) return `${Number(m[1]) + 1}-03-31`;
  return null;
}

/** 「調査中」判定（/projects の investigatingCount と同一式） */
export function isInvestigating(p: Pick<Row, 'outputMw' | 'capacityMwh'>): boolean {
  return p.outputMw === 0 || p.capacityMwh === 0;
}

/** 運開予定日超過 かつ status が稼働中でない */
export function isOverdue(p: Pick<Row, 'cod' | 'status'>, today: string): boolean {
  const d = normalizeCod(p.cod);
  if (!d) return false;
  const st = (p.status ?? [])[0] ?? '';
  return d < today && st !== '稼働中';
}

type Entry = {
  slug: string;
  name: string;
  operator: string;
  prefecture: string;
  city: string;
  outputMw: number | null;
  capacityMwh: number | null;
  status: string;
  cod: string;
  /** 欠落しているフィールド名（再調査で埋める候補） */
  missing: string[];
};

function toEntry(p: Row): Entry {
  return {
    slug: p.slug,
    name: p.name ?? '',
    operator: p.operator ?? '',
    prefecture: p.prefecture ?? '',
    city: p.city ?? '',
    outputMw: p.outputMw ?? null,
    capacityMwh: p.capacityMwh ?? null,
    status: (p.status ?? []).join('/'),
    cod: p.cod ?? '',
    missing: [
      p.outputMw === 0 ? 'outputMw' : null,
      p.capacityMwh === 0 ? 'capacityMwh' : null,
      !p.prefecture ? 'prefecture' : null,
      !p.city ? 'city' : null,
      !p.cod ? 'cod' : null,
      !p.operator ? 'operator' : null,
    ].filter((x): x is string => x !== null),
  };
}

async function main(): Promise<void> {
  const all: Row[] = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const r = await fetch(
      `${BASE}?limit=100&offset=${offset}&fields=slug,name,operator,prefecture,city,outputMw,capacityMwh,status,cod`,
      { headers: { 'X-MICROCMS-API-KEY': API_KEY! } }
    );
    if (!r.ok) throw new Error(`GET projects → HTTP ${r.status}`);
    const d = (await r.json()) as { totalCount: number; contents: Row[] };
    all.push(...d.contents);
    if (all.length >= d.totalCount) break;
  }
  const listed = all.filter((p) => !LIST_EXCLUDED_PROJECT_SLUGS.has(p.slug));
  const today = todayJST();

  const investigating = listed.filter(isInvestigating).map(toEntry).sort((a, b) => a.slug.localeCompare(b.slug));
  const overdue = listed.filter((p) => isOverdue(p, today)).map(toEntry).sort((a, b) => a.slug.localeCompare(b.slug));
  const both = investigating.filter((i) => overdue.some((o) => o.slug === i.slug)).map((i) => i.slug);

  const out = {
    // ★generatedAt は入れない（データ不変なら差分ゼロにするため。判定日は overdueAsOf に持つ）
    overdueAsOf: today,
    totals: {
      all: all.length,
      listed: listed.length,
      investigating: investigating.length,
      overdue: overdue.length,
      both: both.length,
    },
    investigating,
    overdue,
  };

  const outPath = path.join(process.cwd(), 'src/lib/generated/projects-maintenance.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
  console.log(
    `[projects-maintenance] projects ${all.length}件（掲載 ${listed.length}）→ 調査中 ${investigating.length} / 予定日超過 ${overdue.length}（重複 ${both.length}・判定日 ${today}）→ ${outPath}`
  );
}

main().catch((e) => {
  console.error('[projects-maintenance] FATAL:', e);
  process.exit(1);
});
