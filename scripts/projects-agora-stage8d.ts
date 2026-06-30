/**
 * scripts/projects-agora-stage8d.ts
 *
 * /projects ステージ8 PART D — 城洋（JYSグループ）の太田案件を新規追加（POST 1件のみ）。
 *   ※ユウ承認「出典準拠でPOST」。当初spec の「小角田蓄電所（城洋商事）」は一次情報と矛盾するため補正:
 *     - 日経BP 03607: 太田市の事業者は「城洋」（「城洋商事」は桐生案件・「光遊社」は熊谷案件）。
 *     - 「小角田」は日経BP・しろくま両出典に非掲載＝既存 tohoku-kotsunoda(坂東1号/東北電力) の名称。
 *       → 名称衝突を避け「群馬太田蓄電所（城洋・JYSグループ）」/ slug ota-johyo-bess とする。
 *   各社第1号案件は各2MW/7MWh、セルCATL・PCS LS Electric・運用afterFIT（現しろくま電力）、東京都促進事業採択。
 *   運開時期は出典記事時点で「2024年内予定」＝確定情報なしのため status 空（捏造しない L-EIC-019）。
 *
 * 安全: microCMS POST のみ（DELETE/PUT/PATCH なし）。冪等（slug 既存なら skip）。module化(#104)。
 * 出典: しろくま電力(corp.shirokumapower.com/news/NYZ3Xcuy)・日経BP 03607。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-agora-stage8d.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;

const SLUG = 'ota-johyo-bess';
const NEW = {
  slug: SLUG,
  name: '群馬太田蓄電所（城洋・JYSグループ）',
  operator: '城洋（JYSグループ・しろくま電力/旧afterFIT 運用）',
  outputMw: 2,
  capacityMwh: 7,
  prefecture: '群馬県',
  city: '太田市',
  status: [] as string[],
  sourceUrl: 'https://corp.shirokumapower.com/news/NYZ3Xcuy',
  body:
    '<p><strong>群馬太田蓄電所</strong>は、城洋（JYSグループ）が群馬県太田市に展開する系統用蓄電所で、出力2MW・容量7MWh級です。蓄電池セルはCATL製、パワーコンディショナー（PCS）はLS Electric製を採用し、システム構築および運用・管理はafterFIT（現・しろくま電力）が担当します。</p>' +
    '<p>JYSグループは、太田市（城洋）・桐生市（城洋商事）・熊谷市（光遊社）にそれぞれ出力2MW・容量7MWhの系統用蓄電池「第1号案件」を展開しており、各案件は東京都の系統用大規模蓄電池導入促進事業に採択されています。出典記事時点では2024年内の運転開始を予定と公表されていました。</p>' +
    '<p><em>※本案件情報は、しろくま電力（旧afterFIT）の公式発表および日経クロステック等の報道に基づき編集部が整備したものです。運転開始時期等の最新情報は出典をご参照ください。なお、群馬県太田市には別事業者（fantasista／ポート／坂東蓄電所1号ほか）の系統用蓄電所も立地しており、本案件はそれらとは別の案件です。</em></p>',
};

async function main(): Promise<void> {
  console.log(`[agora-stage8d] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const exists = all.find((p) => p.slug === SLUG);
  if (exists) { console.log(`  [skip-done] slug "${SLUG}" は既存（id=${exists.id}, name=${exists.name}）`); return; }

  // 名称衝突チェック（同名 strict は許容＝太田クラスタは事業者で区別。参考表示のみ）
  const sameName = all.filter((p) => p.name === NEW.name);
  console.log(`  衝突チェック: slug "${SLUG}" 既存=なし / 同名"${NEW.name}"=${sameName.length}件`);
  const kotsu = all.find((p) => p.slug === 'tohoku-kotsunoda');
  console.log(`  参考: 既存 tohoku-kotsunoda=「${kotsu?.name}」op=${kotsu?.operator}（別案件・本POSTと別事業者）`);

  console.log(`  POST →`);
  console.log(`     slug=${NEW.slug} / name=「${NEW.name}」`);
  console.log(`     operator=「${NEW.operator}」/ MW=${NEW.outputMw} / MWh=${NEW.capacityMwh}`);
  console.log(`     所在=${NEW.prefecture}${NEW.city} / status=[${NEW.status.join(',')}]（空＝運開未確定）/ cod=（空）`);
  console.log(`     sourceUrl=${NEW.sourceUrl}`);

  if (!DRY_RUN) {
    const r = await fetch(BASE, {
      method: 'POST', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(NEW),
    });
    if (!r.ok) throw new Error(`POST HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const j = await r.json();
    console.log(`  [ok] POST 完了 contentId=${j.id}`);
  }
  console.log(`[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
