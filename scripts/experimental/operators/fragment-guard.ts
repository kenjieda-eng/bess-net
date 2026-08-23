/**
 * scripts/experimental/operators/fragment-guard.ts
 *
 * 社名抽出の「断片」を候補から落とすガード（§3・再発防止）。
 *
 * ── なぜ必要か（2026-08-23 実測）──────────────────────────────────────
 * 8/23 の A-1実行で登録した第1層36社のうち2社が、本文からの社名抽出が前後の語を巻き込んだ
 * 断片で、いずれも既存社の重複だった。断片は既存社と**別文字列**になるため、slug 照合や
 * 正規化キーの完全一致では検出できない（機械照合の構造的な穴）。
 *   「E-Flow合同会社運用」  ← 「E-Flow合同会社運用のモデル」の語尾巻き込み（正: E-Flow合同会社）
 *   「茨城県ノーバル・ホールディングス」← 地名前置の巻き込み（正: 株式会社ノーバル・ホールディングス）
 *   「合同会社クラダシ」    ← 「合同会社クラダシ・インベストメント2号」が「・」で切れた断片
 *
 * ── 4パターン ────────────────────────────────────────────────────
 *  (a) 既存社名（マスタ＋aliases）を部分文字列として含む（＝既存社に語が付いた形）
 *  (b) 先頭が都道府県名・市区町村名（地名の前置巻き込み）
 *  (c) 末尾が動作語（運用／開発／建設／設置／出資／保有 等）
 *  (d) 「・」「／」で切れている疑い（法人格が欠けている・語として不完全）
 *
 * ★ガードで落とした候補は必ず「除外理由つきログ」に残す（黙って消さない）。
 *   呼び出し側は checkFragment() の戻り値をレポートに出力すること。
 */

/** 47都道府県（前置の地名巻き込み検出用） */
export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
  '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県',
  '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;

/** 末尾に付くと断片を疑う動作語（(c)） */
export const TRAILING_ACTION_WORDS = [
  '運用', '開発', '建設', '設置', '出資', '保有', '運転', '施工', '導入', '供給', '納入', '製造',
  '販売', '提供', '取得', '参画', '参入', '着工', '稼働', '受託', '委託', '管理', '整備', '調達',
] as const;

/** 法人格（(d) の判定に使う） */
export const LEGAL_FORMS = [
  '株式会社', '合同会社', '有限会社', '合資会社', '合名会社', '一般社団法人', '一般財団法人',
  '公益社団法人', '公益財団法人', '独立行政法人', '国立研究開発法人', '協同組合', '農業協同組合',
] as const;

export type FragmentPattern = 'a-contains-existing' | 'b-leading-place' | 'c-trailing-action' | 'd-broken-delimiter';

export type FragmentVerdict = {
  isFragment: boolean;
  /** high = 断片とほぼ確定 / review = 弱いシグナル。人の確認が要る（実在社の可能性） */
  confidence: 'high' | 'review';
  patterns: FragmentPattern[];
  /** 除外理由（人が読む用・ログにそのまま出す） */
  reasons: string[];
  /** (a) で当たった既存社名（あれば） */
  matchedExisting?: string;
};

const NFKC = (s: string) => (s ?? '').normalize('NFKC').trim();

/**
 * (b) 市区町村名の抽出は辞書を持たないため、「県/府/都/道 + 市/区/町/村」で始まる形と、
 * 「N文字の地名 + 市/区/町/村」で始まりその直後に法人格または既知社名が続く形を見る。
 * 過検出を避けるため、社名そのものが自治体（例: 自治体カテゴリの登録）である場合は
 * 呼び出し側で除く想定（本ガードは候補抽出時にのみ使う）。
 */
function leadingPlace(name: string): string | null {
  const n = NFKC(name);
  // ★法人格を含む名は対象外。「北海道札幌蓄電合同会社」「宮崎県串間市蓄電所合同会社」
  //   「滋賀県愛荘町…合同会社」のような SPC は地名で始まるのが正しい社名であり、
  //   地名前置だけで断片と判定すると実在社を落とす（2026-08-23 実測で4件の偽陽性）。
  //   断片（例: 茨城県ノーバル・ホールディングス）は法人格が欠けているのが決定的な違い。
  if (LEGAL_FORMS.some((f) => n.includes(f))) return null;
  for (const p of PREFECTURES) {
    if (n.startsWith(p) && n.length > p.length) return p;
  }
  const m = n.match(/^([一-龥ぁ-んァ-ヶA-Za-z]{2,6}[市区町村])(.+)$/);
  if (m && m[2].length >= 2) return m[1];
  return null;
}

/** (a) で候補から既存社名を除いた「余り」が、明らかに社名の一部でない語かを見る */
const NOISE_SUFFIX_RE = new RegExp(`^(${TRAILING_ACTION_WORDS.join('|')}|向|用|製|側|等|他|ら|及び|および|と|の|は|が|を|に|へ|で|も)`);
function residueIsNoise(residue: string): boolean {
  const r = residue.trim();
  if (!r) return false;
  if (/^[0-9０-９]+$/.test(r)) return true;          // 「…銀行100」
  if (/^[・／/、,]/.test(r)) return true;             // 「…株式会社・芙蓉総合リース…」
  if (LEGAL_FORMS.some((f) => r.startsWith(f))) return true; // 社名の連結
  return NOISE_SUFFIX_RE.test(r);                    // 「…パワーサプライ向」「…合同会社運用」
}

/**
 * 断片判定。
 * @param name        判定する候補社名
 * @param existingNames マスタ社名＋aliases（正規化前の生表記でよい）
 */
export function checkFragment(name: string, existingNames: Iterable<string>): FragmentVerdict {
  const n = NFKC(name);
  const patterns: FragmentPattern[] = [];
  const reasons: string[] = [];
  let matchedExisting: string | undefined;

  // (a) 既存社名を部分文字列として含む（完全一致は「既存」であって断片ではないので除く）
  //     ★「余り」がノイズ語（動作語・数字・区切り・他社名の連結）なら断片とほぼ確定 high、
  //       地域名などの修飾語なら実在の別法人（例: 住友商事九州）の可能性があるため review。
  let weak = false;
  for (const raw of existingNames) {
    const e = NFKC(raw);
    if (!e || e.length < 4) continue; // 短すぎる社名は部分一致が暴発する
    if (e === n) continue;            // 完全一致＝既存社そのもの
    if (n.includes(e)) {
      const residue = n.replace(e, '');
      patterns.push('a-contains-existing');
      matchedExisting = raw;
      if (residueIsNoise(residue)) {
        reasons.push(`既存社名「${raw}」＋ノイズ語「${residue}」＝前後の語を巻き込んだ断片`);
      } else {
        weak = true;
        reasons.push(`既存社名「${raw}」を部分文字列として含む（余り「${residue}」。実在の別法人の可能性があり要確認）`);
      }
      break;
    }
  }
  // (a2) 候補が既存社名の「途中で切れた接頭辞」（例: 合同会社クラダシ ⊂ 合同会社クラダシ・インベストメント2号）
  if (!patterns.includes('a-contains-existing')) {
    for (const raw of existingNames) {
      const e = NFKC(raw);
      if (!e || n.length < 4 || e === n) continue;
      if (e.startsWith(n) && /^[・／/]/.test(e.slice(n.length))) {
        patterns.push('d-broken-delimiter');
        matchedExisting = raw;
        reasons.push(`既存社名「${raw}」が区切り記号の手前で切れた接頭辞（分割途中の断片）`);
        break;
      }
    }
  }

  // (b) 先頭が都道府県名・市区町村名
  const place = leadingPlace(n);
  if (place) {
    patterns.push('b-leading-place');
    reasons.push(`先頭が地名「${place}」（地名の前置を巻き込んだ断片の疑い）`);
  }

  // (c) 末尾が動作語
  for (const w of TRAILING_ACTION_WORDS) {
    if (n.endsWith(w)) {
      patterns.push('c-trailing-action');
      reasons.push(`末尾が動作語「${w}」（語尾を巻き込んだ断片の疑い）`);
      break;
    }
  }

  // (d) 「・」「／」で切れている疑い＝法人格が欠けている、または区切り記号で終わる
  const hasLegal = LEGAL_FORMS.some((f) => n.includes(f));
  if (/[・／/]$/.test(n)) {
    patterns.push('d-broken-delimiter');
    reasons.push('末尾が区切り記号（「・」「／」）で終わる＝語として不完全');
  } else if (!hasLegal && /[・／/]/.test(n)) {
    patterns.push('d-broken-delimiter');
    reasons.push('区切り記号（「・」「／」）を含むが法人格が無い＝分割の途中で切れた疑い');
  } else if (/^[・／/]/.test(n)) {
    patterns.push('d-broken-delimiter');
    reasons.push('先頭が区切り記号（「・」「／」）で始まる＝語として不完全');
  }
  // ★「法人格が無く短い」だけでは落とさない。オリンピア／九州製鋼／岡谷鋼機／住友商事九州 のような
  //   実在社を巻き込むため（2026-08-23 実測で4件の偽陽性）。略称の扱いは導出側の保留判定に任せる。

  const isFragment = patterns.length > 0;
  const confidence: 'high' | 'review' = isFragment && weak && patterns.length === 1 ? 'review' : 'high';
  return { isFragment, confidence, patterns, reasons, matchedExisting };
}

/**
 * 候補配列にガードを適用し、通過分と除外分（理由つき）を返す。
 * ★除外分は必ずレポートに出力すること（黙って消さない）。
 */
export function applyFragmentGuard<T extends { name: string }>(
  candidates: T[],
  existingNames: Iterable<string>,
): { passed: T[]; dropped: Array<T & { guard: FragmentVerdict }> } {
  const existing = [...existingNames];
  const passed: T[] = [];
  const dropped: Array<T & { guard: FragmentVerdict }> = [];
  for (const c of candidates) {
    const v = checkFragment(c.name, existing);
    if (v.isFragment) dropped.push({ ...c, guard: v });
    else passed.push(c);
  }
  return { passed, dropped };
}
