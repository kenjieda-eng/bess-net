/**
 * scripts/patch-projects-pj2g-2026-09-08.ts — Pj2-G 実行便（ユウ裁定 2026-09-05 §2）
 *
 * ★全行、2026-09-08 に一次を再取得して逐語を取り直したうえで確定した値のみを送る（裁定§1）。
 *   提案表（reports/projects-name-city-proposals-2026-09-05.md）の verbatim は捏造検出済みのため一切使っていない。
 *   再取得で提案値と食い違った行は SKIP_ROWS に理由つきで退避し、PATCH しない。
 *
 * 送信フィールドは各行で明示したもののみ。status/cod/outputMw/capacityMwh/sourceUrl/座標は
 * ■1 の canonical を除き触らない。POST/DELETE なし。
 *
 * 実行: npx tsx --env-file=.env.local scripts/patch-projects-pj2g-2026-09-08.ts [--dry-run]
 */
export {};
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

type Row = { slug: string; patch: Record<string, unknown>; why: string };

/** ■1 canonical への諸元移設（301 の前に実行・順序厳守） */
const CANONICAL: Row = {
  slug: 'pr-co160356-bess',
  patch: {
    outputMw: 1.995,
    capacityMwh: 8.34,
    city: '松阪市',
    operator: '株式会社エー・ディー・ワークス',
  },
  why:
    '諸元: SHD PR 065 逐語「規模：出力 1,995kW／容量 8,340kWh」→ MW/MWh 換算（1台417kWh×20台=8,340kWh で内部整合）。' +
    '★PR 077 の丸め「2MW/8MWh」・ADW 043 の上限表記「出力2,000kW以下」は不採用。' +
    'city: 043「三重県松阪市（生産・収穫エリア）」/065「設置場所：三重県松阪市」/077「三重県松阪市において」— 4本とも大字なし。' +
    'operator: 043/054 逐語「株式会社ＡＤワークスグループ（…以下「ADWG」）の子会社で、収益不動産事業を推進する株式会社エー･ディー･ワークス（…以下「ADW」）」＋043「当社は事業者として土地の取得及び蓄電所設備への投資を行います。」' +
    '（現値「ADワークスグループ」は親会社＝リリース発表主体）。name は一次同士が食い違うためスキップ（SKIP_ROWS 参照）。',
};

/** ■2 裁定 (2)(3)(4) の実行行 */
const ROWS: Row[] = [
  // ── ✅CONFIRMED
  { slug: 'pr-co161802-gifu', patch: { name: 'NC岐阜市太郎丸蓄電所（日本蓄電池）', city: '岐阜市太郎丸' },
    why: 'PR057 見出し・本文・施設概要表の3箇所で「NC岐阜市太郎丸蓄電所」／表「所在地 岐阜県岐阜市太郎丸」' },
  { slug: 'pr-co161802-shimane', patch: { name: 'NC益田市東町蓄電所（日本蓄電池）', city: '益田市' },
    why: 'PR055 3箇所で「NC益田市東町蓄電所」／表「所在地 島根県益田市」（★所在地欄は市まで。名称の「東町」を city に拡張しない）' },
  { slug: 'pr-co161802-yamaguchi', patch: { name: 'NC北山田堤下蓄電所（日本蓄電池）', city: '山口市嘉川' },
    why: '自社サイト power-receiving-start-yamaguchi 3箇所で「NC北山田堤下蓄電所」／表「所在地 山口県山口市嘉川」' },
  { slug: 'pr-co168085-saga', patch: { name: 'MSK伊万里蓄電所（三崎未来ホールディングス）', city: '伊万里市東山代町' },
    why: 'mfh.co.jp/20260401 施設概要『施設名：MSK伊万里蓄電所』（半角MSK）／大字「東山代町」は本文・og:description・施設概要の3箇所' },
  { slug: 'pr-co176494-okayama', patch: { name: '岡山県備前市伊部蓄電所（エネフォワード）', city: '備前市伊部' },
    why: 'PR007 本文の「」内固有名＋figcaption の2箇所で「岡山県備前市伊部蓄電所」。現 name はタイトル「岡山県備前市に伊部蓄電所が竣工」の助詞「に」を含む切り出し' },
  { slug: 'pr-co43349-bess', patch: { name: '仙台地点系統用蓄電所（関電エネルギーソリューション）', city: '仙台市' },
    why: 'kenes.jp 20240520-01 の title・h2・パンくずの3箇所に「仙台地点系統用蓄電所」。現 name の「仙台パワーステーション」は敷地所有会社名（逐語「当社が出資する仙台パワーステーション株式会社の敷地内の一角に蓄電池を設置し」）。★pref は一次に「宮城県」の記載が無く unverifiable のため送らない' },
  { slug: 'pr-co69153-ibaraki', patch: { name: 'ノーバル・パワーC3（ノーバル・ソーラー）' },
    why: 'PR005 = 取手市の C3（TESLA MEGAPACK・3,854.4kWh）。city「取手市」は現値のまま変更なし' },
  { slug: 'pr-co69153-ibaraki-2', patch: { name: 'ノーバル・パワーC2（ノーバル・ソーラー）', city: '常総市' },
    why: 'PR004 = 常総市の C2（CATL・4,887.6kWh）。★-3 と同一施設の二重登載＝301候補として報告（本便では 301 しない）' },
  { slug: 'pr-co69153-ibaraki-3', patch: { name: 'ノーバル・パワーC2（ノーバル・ソーラー）', city: '常総市' },
    why: 'PR006 = 同上 C2 の商業運転開始告知。現 name の「（茨城県常総市蓄電所）」は一次に無い語' },
  { slug: 'pr-co86244-tochigi-8mwh', patch: { name: '足利市借宿蓄電所（サンヴィレッジ）', city: '足利市' },
    why: 'PR059 figcaption「足利市借宿蓄電所」（★根拠は写真キャプション1箇所のみ・本文は記述的表現）／city は一次「栃木県足利市」まで（大字「借宿町」は一次に無い）' },
  { slug: 'pr-co88876-bess', patch: { city: '紀の川市桃山町最上', prefecture: '和歌山県' },
    why: 'PR042 の所在地逐語「和歌山県紀の川市桃山町最上字東垣内」（字＝東垣内 は落とす）。name は裁定どおり変更なし' },
  { slug: 'pr-co98598-bess', patch: { city: '松浦市', prefecture: '長崎県' },
    why: 'cosmo-energy 260225-01 は松浦市・仙台市の2拠点を並記。本レコードは松浦側。name は裁定(5)により現状維持' },
  { slug: 'pr-looop-saitama', patch: { name: '埼玉県比企郡蓄電ステーション（Looop）' },
    why: 'looop.co.jp/info/4923 の見出し・本文・概要見出しの3箇所で「」内固有名『埼玉県比企郡蓄電ステーション』。city「小川町」は変更なし' },

  // ── ⚠️NEEDS_REVIEW（争点が一次再取得で解消できた行のみ）
  { slug: 'pr-co161802-fukushima', patch: { name: 'NC岩瀬郡鏡石町蓄電所（日本蓄電池）', city: '鏡石町' },
    why: 'PR042 施設概要表「施設名 NC岩瀬郡鏡石町蓄電所」。争点(city は鏡石町か岩瀬郡鏡石町か)→ 裁定3「郡は含めない」に従い鏡石町' },
  { slug: 'pr-co161802-gifu-3', patch: { name: 'NC羽島市足近町蓄電所（日本蓄電池）', city: '羽島市足近町' },
    why: 'PR014 施設概要表「所在地 岐阜県羽島市足近町」＝大字まで一次にあり' },
  { slug: 'pr-co161802-kumamoto-2', patch: { name: 'NC宇城市豊野町蓄電所（日本蓄電池）', city: '宇城市豊野町' },
    why: '自社サイト power-receiving-start-nctoyono。現 name は既に正式名と一致し、事業者併記の付加のみ。city は所在地欄の逐語' },
  { slug: 'pr-co161802-saga-2', patch: { name: 'NC唐津市相知町蓄電所（日本蓄電池）', city: '唐津市' },
    why: '自社サイト operation-start-karatsu 本文逐語「NC唐津市相知町蓄電所（所在地：佐賀県唐津市…）」。争点(city)→ 一次は本文括弧内・施設概要表とも「唐津市」まで＝相知町は名称の中だけ' },
  { slug: 'pr-co140317-bess', patch: { city: '和歌山市松江' },
    why: '大字「松江」は一次にあり。★name は一次に「メガパワー」0ヒットのためスキップ（SKIP_ROWS 参照）' },
  { slug: 'pr-co166651-bess', patch: { city: '松江市宍道町', prefecture: '島根県' },
    why: 'PR111「２．蓄電所の概要」設置場所欄「島根県松江市宍道町」。★name は一次逐語が「（仮称）松江市宍道蓄電所」で提案と食い違うためスキップ' },

  // ── 🔺REFUTED のうち裁定 (4) で実行承認された2行
  { slug: 'pr-co109041-gunma', patch: { name: 'OLY Power Storage 三室町（オリンピア）', city: '伊勢崎市三室町' },
    why: '裁定条件クリア。PR133 副題・本文の「」内が半角スペース区切りで「OLY Power Storage 三室町」と byte 単位一致（★【概要】欄のみ「OLYPowerstorage三室町」の表記ゆれあり・「」内の逐語を採用）' },
  { slug: 'pr-co85634-fukuoka', patch: { name: '中川商事株式会社 第一系統用蓄電所', city: '古賀市', operator: '中川商事株式会社' },
    why: '裁定(4)。PR019 本文「」内・写真キャプション・事業概要の3箇所で「中川商事株式会社 第一系統用蓄電所」（区切りは半角スペース U+0020）。事業概要「事業者／中川商事株式会社」「運用／ヒラソル・エナジー株式会社」＝operator を中川商事へ是正（施設名に社名を含むため括弧の事業者名は重ねない）' },
];

/** 一次再取得で提案値と食い違い、裁定§1 によりスキップした行（報告用・PATCH しない） */
const SKIP_ROWS: Array<{ slug: string; field: string; proposed: string; primary: string; reason: string }> = [
  { slug: 'pr-co160356-bess', field: 'name', proposed: 'ADW三重松阪市蓄電所（エー・ディー・ワークス）',
    primary: 'PR043「ADW三重松阪蓄電所」×9／PR054「ADW三重松阪市蓄電所」×6',
    reason: '一次同士が食い違う（各リリース内では表記が一貫）。加えて正式名に既に略称 ADW を含むため「（エー・ディー・ワークス）」の重ね付けは様式上も不可。要裁定' },
  { slug: 'pr-co140317-bess', field: 'name', proposed: '和歌山メガパワー蓄電所（エネルギーパワー）',
    primary: 'PR034 生HTML全文で「メガパワー」ヒット 0。施設の固有名は一次に存在しない',
    reason: '提案名は別案件（PR111 のパワーエックス製品「Mega Power 2700A」）からの混入の疑い。固有名を発明しない' },
  { slug: 'pr-co166651-bess', field: 'name', proposed: '松江市宍道蓄電所（ちゅうぎんエナジー）',
    primary: 'PR111 名称欄「（仮称）松江市宍道蓄電所」',
    reason: '一次は「（仮称）」付き（レコードも計画中）。提案は仮称表記を落としており、確定名を主張してしまう。要裁定' },
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
async function bySlug(slug: string): Promise<Record<string, unknown> | null> {
  const d = await api<{ contents: Array<Record<string, unknown>> }>('GET', `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`);
  return d.contents[0] ?? null;
}

let done = 0, skipped = 0, failed = 0;

async function runRow(row: Row): Promise<void> {
  const before = await bySlug(row.slug);
  if (!before) { console.log(`  ★NG ${row.slug}: 不在`); failed++; return; }
  const fields = Object.keys(row.patch);
  const diff = fields.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(row.patch[k]));
  console.log(`\n■ ${row.slug} (id=${before.id})`);
  for (const k of fields) console.log(`   ${k}: ${JSON.stringify(before[k])} → ${JSON.stringify(row.patch[k])}${diff.includes(k) ? '' : ' [同値]'}`);
  if (diff.length === 0) { console.log('   [skip] 全フィールド同値（冪等）'); skipped++; return; }
  console.log(`   根拠: ${row.why}`);
  if (DRY_RUN) { console.log(`   [dry-run] ${diff.join(',')} を送信予定`); done++; return; }

  const payload: Record<string, unknown> = {};
  for (const k of diff) payload[k] = row.patch[k];
  await api('PATCH', `${BASE}/${before.id}`, payload);
  await new Promise((r) => setTimeout(r, 700));
  const after = await bySlug(row.slug);
  let bad = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {}), ...fields])) {
    if (SYS.has(k)) continue;
    if (fields.includes(k)) {
      const ok = JSON.stringify(after?.[k]) === JSON.stringify(row.patch[k]);
      if (!ok) { bad++; console.log(`   ✗ ${k}: 保存=${JSON.stringify(after?.[k])}`); }
    } else if (JSON.stringify(after?.[k]) !== JSON.stringify(before[k])) {
      bad++; console.log(`   ✗ ${k}: 意図しない変化 ${JSON.stringify(before[k])} → ${JSON.stringify(after?.[k])}`);
    }
  }
  console.log(`   #106: ${bad === 0 ? `✓ 送信 ${diff.length} field 一致・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  if (bad === 0) done++; else failed++;
  await new Promise((r) => setTimeout(r, 300));
}

async function main(): Promise<void> {
  console.log(`[Pj2-G] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log('\n════════ ■1 canonical への諸元移設（301 の前・順序厳守） ════════');
  await runRow(CANONICAL);
  console.log('\n════════ ■2 name/city/pref PATCH（裁定の実行行） ════════');
  for (const row of ROWS) await runRow(row);

  console.log('\n════════ 一次との食い違いでスキップした行（裁定§1） ════════');
  for (const s of SKIP_ROWS) {
    console.log(`  ・${s.slug} [${s.field}]`);
    console.log(`      提案: ${s.proposed}`);
    console.log(`      一次: ${s.primary}`);
    console.log(`      理由: ${s.reason}`);
  }
  console.log(`\n[Pj2-G] 実行 ${done} / 冪等スキップ ${skipped} / 失敗 ${failed} / 食い違いスキップ ${SKIP_ROWS.length}`);
  if (failed) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
