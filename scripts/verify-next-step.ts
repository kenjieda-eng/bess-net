/**
 * scripts/verify-next-step.ts — 「運営元からのご案内」の判定（src/lib/next-step.ts）の試験（次の一歩便・2026-10-20）
 *
 * EPRX の資料の数値とみなす書き方（拾うべきもの）と、拾ってはいけないもの（JEPX の円/kWh など）を固定する。
 * レビュー（2026-10-20）で、タグ・実体参照・全角・∆／⊿ を挟むと 3 形の正規表現をすり抜けると分かったための試験。
 * 使い方: npm run verify:next-step（失敗があれば exit 1）
 */
import { explainerNextStep, hasEprxNumbers, newsNextStep, projectNextStep } from '../src/lib/next-step';

export {};

const TAG = '[verify:next-step]';
let ng = 0;
function check(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    ng++;
    console.log(`${TAG} NG   ${name}: ${JSON.stringify(got)}（期待 ${JSON.stringify(want)}）`);
  }
}

// 拾うべきもの（EPRX の数値）
const HIT = [
  '15.00円/ΔkW・30分',
  '上限は 15 円 / Δ kW',
  '15円/<strong>ΔkW</strong>',
  '15円&#47;&Delta;kW',
  '15円&#x2F;ΔkW',
  '１５円／ΔｋＷ',
  '15円/∆kW',
  '15円/⊿kW',
  '15円/ΔKW',
  'ΔkW・30分あたり',
  'Δ&nbsp;kW・30分',
  '19.51円→15円→10円',
  '19.51→15円',
  '１９．５１円→１５円',
  '15円から10円へ下がる',
  '15円⇒10円',
  '15円&rarr;10円',
  '15.00円/kW・30分',
  'EPRX が公表した約定平均価格は 15.99円',
];
// 拾ってはいけないもの
const MISS = [
  'JEPX のスポット価格は 12.5円/kWh',
  '容量市場の約定価格は 14,137円/kW',
  '2025年から2026年にかけて',
  '出力 2MW・容量 8MWh',
  'EPRX の取引ガイドでは ΔkW約定量 を定義している',
  '',
];
for (const t of HIT) check(`拾う「${t}」`, hasEprxNumbers(t), true);
for (const t of MISS) check(`拾わない「${t}」`, hasEprxNumbers(t), false);
check('null', hasEprxNumbers(null), false);
check('undefined', hasEprxNumbers(undefined), false);

// 解説: 表の slug・保留・本文・題・関連カード
check('解説 表にある', explainerNextStep('bess-ma-valuation', ['M&A', null, '本文'], [{ title: '関連' }]), 'asset');
check('解説 表に無い', explainerNextStep('no-such-slug', ['題'], []), null);
check('解説 保留', explainerNextStep('multi-use-operation-strategy', ['題'], []), null);
check('解説 題に数値', explainerNextStep('bess-ma-valuation', ['15円/ΔkW の話', '本文'], []), null);
check('解説 出典に数値', explainerNextStep('bess-ma-valuation', ['題', '本文', '<p>EPRX 公表 7.21円</p>'], []), null);
check('解説 カードに数値', explainerNextStep('bess-ma-valuation', ['題'], [{ title: '「19.51円→15円→10円」の3年間' }]), null);
check('解説 カードの導入文に数値', explainerNextStep('bess-ma-valuation', ['題'], [{ title: '題', lead: '15.00円/ΔkW・30分から' }]), null);

// ニュース: category・編集部・除外・題と導入文
check('ニュース 投資', newsNextStep('a', ['投資'], ['題', '導入', '本文'], [], false), 'introduce');
check('ニュース 開発計画', newsNextStep('a', ['開発計画', '市場'], ['題'], [], false), 'introduce');
check('ニュース 対象外の category', newsNextStep('a', ['市場'], ['題'], [], false), null);
check('ニュース 編集部', newsNextStep('a', ['投資', '編集部'], ['題'], [], false), null);
check('ニュース 除外', newsNextStep('a', ['投資'], ['題'], [], true), null);
check('ニュース 保留', newsNextStep('pr-2026-04-22-co30719-100', ['投資'], ['題'], [], false), null);
check('ニュース 導入文に数値', newsNextStep('a', ['投資'], ['題', '上限 15円/ΔkW', '本文'], [], false), null);

// 案件: 稼働中・除外・関連カード
check('案件 稼働中', projectNextStep(true, ['名', '本文'], [], false), 'introduce');
check('案件 稼働中でない', projectNextStep(false, ['名', '本文'], [], false), 'land');
check('案件 除外', projectNextStep(true, ['名'], [], true), null);
check('案件 関連解説に数値', projectNextStep(false, ['名'], [{ title: '「19.51円→15円→10円」', lead: '' }], false), null);

if (ng) {
  console.log(`${TAG} NG ${ng} 件`);
  process.exit(1);
}
console.log(`${TAG} ok   拾う ${HIT.length}・拾わない ${MISS.length + 2}・判定 18 の試験がすべて通った`);
