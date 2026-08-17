#!/usr/bin/env tsx
/**
 * scripts/verify-grid-list-fields.ts — 一覧の全列が静的データに存在するかの機械検査（落とし穴 #118）
 *
 * 背景（2026-08-16）: エリア/県ページを precompute 静的データへ移した際（#116 恒久策）、
 * `units`（台数）と `n1_capacity_mw`（N-1電制適用可能量）を持たせ忘れ、10エリア全ての一覧で
 * その列だけが静かに「—」になった。件数と基準日は正しかったため気づけなかった。
 *
 * 本スクリプトは「一覧に出る列 ＝ 静的JSONに必ず入っている」ことを毎回検査する。
 * 実行: npx tsx scripts/verify-grid-list-fields.ts   （microCMS へのアクセスなし・ローカル検査のみ）
 *
 * 追補（落とし穴 #119・2026-08-17）: 検査軸を2つに増やした。
 *   軸1（#118）静的JSONに列があるか
 *   軸2（#119）その列が消費側（toSubstationShape）まで届いているか
 * facility_class は軸1を満たしていたのに toSubstationShape が落としており、
 * 関西1,575件・沖縄151件の設備区分が一覧で不可視だった。軸1だけでは検出できない。
 */
import * as fs from 'node:fs';
import { toSubstationShape, type GridListItem } from '../src/lib/grid-static-lists';

// 一覧ビューが参照するフィールド（追加時はここも更新する）
const REQUIRED_FOR_LIST = [
  'id', 'slug', 'name', 'prefecture', 'facility_class', 'operator', 'area',
  'voltage_class', 'voltage_primary_kv', 'voltage_secondary_kv',
  'units', 'capacity_total_mw', 'cap_operational_mw', 'cap_avail_mw',
  'n1_eligible', 'n1_capacity_mw', 'oc_possibility', 'external_id',
  'last_updated', 'fetched_at', 'source_url', 'latitude', 'longitude',
] as const;

// 「値が全件 null なら実質欠落」を検出する対象（表示に使う数値・文字列）
const MUST_HAVE_SOME_VALUE = ['units', 'cap_avail_mw', 'voltage_class', 'external_id'] as const;

function main() {
  const path = 'src/lib/generated/grid-area-lists.json';
  if (!fs.existsSync(path)) {
    console.error(`✗ ${path} がありません。先に npm run build:substations を実行してください`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(path, 'utf8')) as {
    by_area: Record<string, Array<Record<string, unknown>>>;
  };
  let fail = 0;
  const areas = Object.keys(data.by_area);
  console.log(`[verify-grid-list-fields] エリア${areas.length}・${Object.values(data.by_area).reduce((n, l) => n + l.length, 0)}件を検査`);

  for (const area of areas) {
    const list = data.by_area[area];
    if (list.length === 0) { console.log(`  ✗ ${area}: 0件`); fail++; continue; }
    const keys = new Set(Object.keys(list[0]));
    const missing = REQUIRED_FOR_LIST.filter((k) => !keys.has(k));
    const allNull = MUST_HAVE_SOME_VALUE.filter((k) => list.every((s) => s[k] === null || s[k] === undefined));
    if (missing.length || allNull.length) {
      fail++;
      console.log(`  ✗ ${area}（${list.length}件）`);
      if (missing.length) console.log(`      キー欠落: ${missing.join(', ')}`);
      if (allNull.length) console.log(`      全件null（実質欠落）: ${allNull.join(', ')}`);
    } else {
      const withUnits = list.filter((s) => typeof s.units === 'number').length;
      console.log(`  ✓ ${area}（${list.length}件・台数あり ${withUnits}件）`);
    }
  }
  // ── 軸2（#119）: 静的JSONの値が toSubstationShape を通っても残るか ──
  // 「JSONにはある／画面には出ない」を検出する。値を持つ代表レコードで往復照合する。
  console.log('\n[軸2] 消費側 shape（toSubstationShape）への到達を検査');
  const SHAPE_CRITICAL = [
    'facility_class', 'units', 'n1_capacity_mw', 'external_id',
    'voltage_class', 'cap_avail_mw', 'last_updated', 'source_url',
  ] as const;
  for (const key of SHAPE_CRITICAL) {
    // その列に実値を持つレコードを全エリアから1件拾う（無ければ検査対象外）
    let sample: Record<string, unknown> | undefined;
    let fromArea = '';
    for (const area of areas) {
      const hit = data.by_area[area].find((s) => s[key] !== null && s[key] !== undefined);
      if (hit) { sample = hit; fromArea = area; break; }
    }
    if (!sample) { console.log(`  - ${key}: 実値を持つレコードなし（検査対象外）`); continue; }
    const shaped = toSubstationShape([sample as unknown as GridListItem])[0] as unknown as Record<string, unknown>;
    const got = shaped[key];
    // 配列フィールド（voltage_class 等）は空配列も「消失」扱い
    const lost = got === null || got === undefined || (Array.isArray(got) && got.length === 0);
    if (lost) {
      fail++;
      console.log(`  ✗ ${key}: 静的JSON=${JSON.stringify(sample[key])}（${fromArea}）→ shape で消失`);
    } else {
      console.log(`  ✓ ${key}: ${fromArea} の実値が shape まで到達`);
    }
  }

  // ── 軸3（#121）: 「データ基準日」の単一ソースが実データの最新版と一致するか ──
  // エリアページのヘッダも出典欄も src/data/substations/index.json の area_dates を見る。
  // 旧実装は出典欄が subs[0].last_updated（名称順の1件目＝実質ランダム）で、版が複数ある
  // エリア（北海道4種）でヘッダ 8/7・出典欄 7/31 と食い違っていた。
  console.log('\n[軸3] データ基準日の単一ソース（area_dates）が実データの最新版と一致するか');
  const areaDates = (JSON.parse(fs.readFileSync('src/data/substations/index.json', 'utf8')) as {
    area_dates?: Record<string, { last_updated: string | null; last_updated_variants: number }>;
  }).area_dates ?? {};
  for (const area of areas) {
    const dates = data.by_area[area]
      .map((s) => String(s.last_updated ?? '').slice(0, 10))
      .filter(Boolean);
    const actualMax = dates.sort().at(-1) ?? null;
    const variants = new Set(dates).size;
    const meta = areaDates[area];
    const ok = meta?.last_updated === actualMax && meta?.last_updated_variants === variants;
    if (!ok) fail++;
    console.log(
      `  ${ok ? '✓' : '✗'} ${area}: area_dates=${meta?.last_updated ?? 'なし'}（${meta?.last_updated_variants ?? '?'}種）` +
        ` / 実データ最新=${actualMax}（${variants}種）`
    );
  }

  console.log(fail === 0 ? '\n[verify-grid-list-fields] PASS' : `\n[verify-grid-list-fields] FAIL ${fail}件`);
  if (fail) process.exit(1);
}

main();
export {};
