/**
 * src/lib/grid-meta.ts — Gr6（2026-08-09）/grid のエリア・県ページの title / description
 *
 * 背景（GSC 2026-05-08〜08-07）:
 *  「◯◯電力 空き容量」で上位に出ているのに CTR がほぼ 0 だった。
 *   中部電力 空き容量 220表示・8.7位・CTR 0% ／ 関西電力 空き容量 139・8.0位・0%
 *   東北電力 空き容量 135・7.1位・0.7% ／ 中国電力 空き容量 90・7.3位・1.0%
 *  実査したところ、エリアページの title は「{エリア}エリア｜蓄電池 系統空き容量DB」で、
 *  **検索語に含まれる「◯◯電力」が1文字も入っていなかった**（10エリアすべて）。
 *
 * ★県ページについての実測（重要・誤解を避けるために記録）:
 *  47県の title は**すべて同一テンプレート**「{県}の変電所一覧｜蓄電池 系統空き容量DB」であり、
 *  三重県 3.16% と 静岡県 0.82% の CTR 差は **title では説明できない**。
 *  高CTR群(≥2.5%)と低CTR群(<1.5%)を比べると平均掲載順位は 6.57 vs 6.56 でほぼ同一、
 *  唯一の相関は**変電所数（123件 vs 271件）**だった＝大きい県ほどクエリの意図が散っていると考えられる。
 *  よって本変更は「titleを直せばCTR差が埋まる」ものではなく、
 *  「事業者名という検索語を title に入れて当たり判定を増やす」ものである。
 *
 * 規律は S1（用語集）・S4（補助金）と同じ:
 *  - 既存データからの組み立てのみ。誇張しない
 *  - **自前で切り詰めない**。収まらなければ後ろの要素から落とす
 *  - サイト名は1回だけ
 */

import subsidiesData from '@/data/subsidies.json';

const SITE_SUFFIX = '｜蓄電所ネット';
/** エリアページの目安上限（全角）。事業者名が先頭に来るので短くできる */
const TITLE_MAX = 36;
/**
 * 県ページの上限。事業者名が「中部電力パワーグリッド」のように長く、
 * 36字だと**事業者名が丸ごと落ちる**（＝Gr6 の目的そのものが達成できない）ため緩める。
 *
 * ★S4（補助金）では「その長さでは検索結果に出ないから伸ばさない」と判断したが、ここは事情が違う:
 *   検索語との**マッチ判定は title の全文**に対して行われ、表示上の切り詰めとは別。
 *   「◯◯電力 空き容量」に当てるのが目的なので、表示外になっても入れる価値がある。
 */
const PREF_TITLE_MAX = 42;

/** 事業者名を「◯◯電力」で始まる検索語に当てやすい形にそろえる（正式名をそのまま使う） */
export function operatorLabel(operators: string[]): string {
  return operators[0] ?? '';
}

/** 複数事業者にまたがる県の表記（2社目以降は「ほか」でまとめる＝誤解を生まない） */
export function operatorLabelMulti(operators: string[]): string {
  if (operators.length === 0) return '';
  if (operators.length === 1) return operators[0];
  return `${operators[0]}ほか${operators.length - 1}社`;
}

/** 地図のあるエリアか（AreaPage の「中部限定マップへの導線」＝/grid/chubu/map と同じ条件。地図は中部だけ） */
export function areaHasMap(areaSlug: string): boolean {
  return areaSlug === 'chubu';
}

/**
 * エリアページの title。
 * 「{事業者名}の系統空き容量・変電所一覧 — {n}件（{エリア}エリア）｜蓄電所ネット」
 * 地図のあるエリア（中部だけ・/grid/chubu/map）は「{事業者名}の変電所一覧・空き容量マップ」
 * （「系統空き容量」と「空き容量マップ」を両方入れると 36 字に収まらないため、地図のあるエリアは後者だけ）。
 * 優先度は 事業者名+空き容量+変電所一覧 → 件数 → エリア名（検索の入口便・2026-10-30 で「変電所一覧」「マップ」を足した）。
 */
export function buildAreaTitle(areaJp: string, operator: string, count: number | null, hasMap = false): string {
  const who = operator || `${areaJp}エリア`;
  let out = hasMap ? `${who}の変電所一覧・空き容量マップ` : `${who}の系統空き容量・変電所一覧`;
  if (count && (out + ` — ${count.toLocaleString()}件` + SITE_SUFFIX).length <= TITLE_MAX) {
    out += ` — ${count.toLocaleString()}件`;
  }
  if (operator && (out + `（${areaJp}エリア）` + SITE_SUFFIX).length <= TITLE_MAX) {
    out += `（${areaJp}エリア）`;
  }
  return `${out}${SITE_SUFFIX}`;
}

/* ------------------------------------------------------------------ *
 * 検索の入口便（2026-10-30）: description とページ冒頭の要約を「答えが先」に
 *  GSC（7/27〜10/26）で県のページ 39 枚が検索の稼ぎ頭（CTR 3.14%・加重順位 6.1）、
 *  愛知 0.9%・長野／福岡 1.8%・静岡 1.9% と低い県がある。題名は Gr6 で既に事業者名と件数を含むので、
 *  今回は検索結果に出る説明文に「件数・空きのある件数・空き容量が最も大きい変電所」を先に出す。
 *  数字はすべてページが表示している一覧（precompute・凍結除外済み）から作る＝焼き込まない。
 * ------------------------------------------------------------------ */

/** description の目安上限（Google の切れ目の前後）。超えるときは後ろの句から落とす */
const DESC_MAX = 120;

/** 説明文・要約の箱に使う一覧の行（GridListItem の一部） */
export type GridFactsItem = {
  slug: string;
  name: string;
  cap_avail_mw: number | null;
  voltage_primary_kv: number | null;
};
export type GridFacts = {
  count: number;
  positive: number;
  top: GridFactsItem[];
  /** 最大値と同じ空き容量の変電所の数（同着が多い＝三重 49MW が 3 件など。1 件だけ名指しすると誤解を生む） */
  maxCount: number;
  /** 上位 n 件の切れ目（n 位）と同じ値の変電所が、上位 n 件の外にもある */
  tieAtCutoff: boolean;
};

/**
 * 一覧から 変電所数・空きのある変電所数（空き容量 > 0）・空き容量の上位 n 件 を取る。
 * 並びは 空き容量の降順 → 名称 → slug（#124: 同着でもビルドごとに変わらない）。
 */
export function gridFacts(items: GridFactsItem[], topN = 5): GridFacts {
  const withCap = items.filter((s) => typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0);
  const top = [...withCap]
    .sort((a, b) => (b.cap_avail_mw as number) - (a.cap_avail_mw as number)
      || a.name.localeCompare(b.name, 'ja') || a.slug.localeCompare(b.slug))
    .slice(0, topN);
  const sameAs = (v: number | null | undefined) => withCap.filter((s) => s.cap_avail_mw === v).length;
  const last = top[top.length - 1]?.cap_avail_mw;
  return {
    count: items.length,
    positive: withCap.length,
    top,
    maxCount: top.length ? sameAs(top[0].cap_avail_mw) : 0,
    tieAtCutoff: top.length > 0 && sameAs(last) > top.filter((s) => s.cap_avail_mw === last).length,
  };
}

/**
 * 「{対象}の変電所{N}件の系統空き容量（{事業者}・公表{日付}）。空きのある変電所{M}件、空き容量が最も大きいのは{名}（{X}MW）。{使い方}」
 * 長いときは 使い方 → 最大の 1 件 → 空きのある件数 の順に落とす（自前で文字を切らない）。
 */
function buildGridDescription(subject: string, operatorText: string, published: string | null, facts: GridFacts, howTo: string): string {
  const paren = [operatorText, published ? `公表${published}` : ''].filter(Boolean).join('・');
  const s1 = `${subject}の変電所${facts.count.toLocaleString()}件の系統空き容量${paren ? `（${paren}）` : ''}。`;
  const s2a = `空きのある変電所${facts.positive.toLocaleString()}件`;
  const top = facts.top[0];
  // 最大値が同着のときは 1 件だけ名指ししない（「◯◯ほか2件（各49MW）」）
  const s2b = !top ? ''
    : facts.maxCount > 1
      ? `、空き容量が最も大きいのは${top.name}ほか${facts.maxCount - 1}件（各${top.cap_avail_mw?.toLocaleString()}MW）`
      : `、空き容量が最も大きいのは${top.name}（${top.cap_avail_mw?.toLocaleString()}MW）`;
  const cands = [`${s1}${s2a}${s2b}。${howTo}`, `${s1}${s2a}${s2b}。`, `${s1}${s2a}。`, s1];
  return cands.find((c) => c.length <= DESC_MAX) ?? s1;
}

/**
 * エリアページの description。
 * 使い方の句はエリアページの一覧（SubstationsBrowser）の実装どおり＝電圧階級・空容量あり・N-1電制で絞り込める。
 */
export function buildAreaDescription(areaJp: string, operator: string, published: string | null, facts: GridFacts): string {
  return buildGridDescription(`${areaJp}エリア`, operator, published, facts, '電圧階級・空容量あり・N-1電制で絞り込めます。');
}

/**
 * 県ページの title。
 * 「{県}の変電所 系統空き容量 — {事業者名}管内{n}件｜蓄電所ネット」
 * 優先度は 県名+空き容量 → 事業者名 → 件数。
 */
export function buildPrefTitle(pref: string, operators: string[], count: number | null): string {
  let out = `${pref}の変電所 系統空き容量`;
  const op = operatorLabelMulti(operators);
  const cnt = count ? `${count.toLocaleString()}件` : '';
  // 優先度: 事業者名 ＞ 件数（Gr6 の目的は「◯◯電力」という検索語を title に入れること）
  if (op) {
    const withOp = `${out} — ${op}管内${cnt}`;
    if ((withOp + SITE_SUFFIX).length <= PREF_TITLE_MAX) return `${withOp}${SITE_SUFFIX}`;
    const withOpNoCount = `${out} — ${op}管内`;
    if ((withOpNoCount + SITE_SUFFIX).length <= PREF_TITLE_MAX) return `${withOpNoCount}${SITE_SUFFIX}`;
  }
  if (cnt && (out + ` — ${cnt}` + SITE_SUFFIX).length <= PREF_TITLE_MAX) out += ` — ${cnt}`;
  return `${out}${SITE_SUFFIX}`;
}

/**
 * 県ページの description（検索の入口便・2026-10-30）。
 * 県ページには絞り込みの部品が無い（空容量の大きい順の一覧だけ）ので、使い方の句は「一覧で確認できます」にする。
 */
export function buildPrefDescription(pref: string, operators: string[], published: string | null, facts: GridFacts): string {
  return buildGridDescription(pref, operatorLabelMulti(operators), published, facts, '空容量の大きい順の一覧で、N-1電制・電圧も確認できます。');
}

/**
 * 変電所の詳細の題名に入れる事業者の短い名（/grid の出典欄の表記と同じ）。表に無い名前はそのまま返す。
 */
const OPERATOR_SHORT: Record<string, string> = {
  北海道電力ネットワーク: '北海道電力NW',
  東北電力ネットワーク: '東北電力NW',
  東京電力パワーグリッド: '東京電力PG',
  中部電力パワーグリッド: '中部電力PG',
  中国電力ネットワーク: '中国電力NW',
};
export function operatorShortName(operator: string): string {
  return OPERATOR_SHORT[operator] ?? operator;
}

/* ------------------------------------------------------------------ *
 * 変電所の名前便（2026-11-02）: 詳細の題名・h1・OG・JSON-LD・description・冒頭の一文に出す名前
 *  検索語は「◯◯変電所」なのに、名前が素のままのエリアでは詳細のページに「変電所」の語が無かった。
 *  10 社の列見出しはすべて「変電所名」（関西だけ表の題が「電気所（発電所，変電所，配電塔）」）。
 *  ただし一次の名前が別の設備を指すもの・番号の意味が分からないものには足さない（足さないのは誤りにならない）。
 *  DB の name と基本情報の「変電所名」の欄は一次の表記のまま。同名の判定（nameQualifiers）も一次の名前のまま。
 * ------------------------------------------------------------------ */

type SubstationNameInput = {
  name: string;
  voltage_primary_kv?: number | null;
  voltage_secondary_kv?: number | null;
};

/** 既に設備の語がある（配電塔・変電塔・(塔)は「塔」）／名前が非公開 */
const NAME_HAS_KIND = /変電所|変電設備|塔|開閉|発電所|変換所|SS$|S\/S$|非公開/;
/** 一次の語尾が変電所以外を指す（東京の「中間」「局」「局配」「（発）」・中部の「第二発」・北陸の「火力」「直配」）。九州の「中間」は地名なので 1 字以上前に付くものだけ */
const NAME_OTHER_KIND = /.中間$|局$|局配$|[（(](?:局配|発)[）)]$|[一二三四五六七八九十]発$|火力$|水力$|直配$/;
/** 東北の番号だけの名前（一次の変電所名の欄が No. と同じ＝名前が公表されていない） */
const NAME_ONLY_CODE = /^[0-9A-Za-z]+$/;
/** 末尾の番号が設備の一部か変圧器の番号か分からない（西宮浜1号・坂下№1・高崎1）。第N は名前の一部なので除く */
const NAME_UNCLEAR_NUMBER = /(?:[0-9０-９]+号|[№]\s*[0-9０-９]+|No\.\s*[0-9０-９]+|(?<!第)[0-9０-９]+)$/;
/** 「(変)」は中国の一次の略記で、変電所そのもの */
const NAME_ABBREVIATED = /^(.+?)[（(]変[）)]$/;
/** 北陸の名前の末尾の電圧（中島　66/22kV・伏木66/22kV） */
const NAME_VOLTAGE_SUFFIX = /[\s　]*\d+(?:\.\d+)?\/\d+(?:\.\d+)?kV$/;
/** 名前の後ろに残す部分: (1)・(22kV)・（奥多々良木）／ 77/6kV ／ 変圧器の番号 11・12・14B・5，7，8B・2U */
const NAME_SUFFIX = [
  /^(.+?)([\s　]*[（(].*[）)])$/,
  /^(.+?)([\s　]*\d+(?:\.\d+)?\/\d+(?:\.\d+)?kV)$/,
  /^(.+?)([0-9０-９]+(?:[，,・\-－][0-9０-９]+)+[BＢUＵ]?)$/,
  /^(.+?)([0-9０-９]+[BＢUＵ](?:[0-9０-９]+[BＢUＵ])*)$/,
];
/**
 * 足すと同じエリアの別の行「◯◯変電所」と題名が重なる素の名前（東京 4 組。同じ栃木県・山梨県に両方の行がある）。
 * 再取込で組が増えたら verify:grid-pages が落ちるので、ここに足す。
 */
const NAME_WOULD_COLLIDE: ReadonlySet<string> = new Set(['関谷', '谷村', '東山梨', '北巨摩']);

/** 発電機側の電圧の行（一次 ≤ 二次／一次が 11kV 以下／二次が 11kV。関西の小原 154/11・九州の上椎葉 11/6 など）。関西の表は発電所も含むが名前に語が無い */
function hasGeneratorVoltage({ voltage_primary_kv: p, voltage_secondary_kv: s }: SubstationNameInput): boolean {
  if (typeof p !== 'number' || typeof s !== 'number') return false;
  return p <= s || p <= 11 || s === 11;
}

/** 変電所の詳細に出す名前。足さないものは一次の名前のまま返す */
export function displaySubstationName(sub: SubstationNameInput): string {
  const name = sub.name;
  const abbreviated = NAME_ABBREVIATED.exec(name);
  if (abbreviated) return `${abbreviated[1]}変電所`;
  if (NAME_HAS_KIND.test(name) || NAME_OTHER_KIND.test(name) || NAME_ONLY_CODE.test(name)) return name;
  if (NAME_WOULD_COLLIDE.has(name) || hasGeneratorVoltage(sub)) return name;
  for (const suffix of NAME_SUFFIX) {
    const m = suffix.exec(name);
    if (m) return `${m[1]}変電所${m[2]}`;
  }
  if (NAME_UNCLEAR_NUMBER.test(name)) return name;
  return `${name}変電所`;
}

/**
 * 詳細の冒頭に足す基本の 1 文（データから。数字が無い欄は書かない・評価の語は書かない）。
 * 「新野田変電所は東京電力パワーグリッド管内の 500/275kV の変電所で、変圧器 4 台・運用容量 3,420MW。」
 * 名前が公表されていないレコードは主語が立たないので出さない。
 */
export function substationBasicSentence(
  sub: SubstationNameInput & { units?: number | null; cap_operational_mw?: number | null },
  operator: string | null | undefined,
): string | null {
  if (!sub.name || sub.name === '変電所' || sub.name.includes('非公開') || NAME_ONLY_CODE.test(sub.name)) return null;
  const display = displaySubstationName(sub);
  // 北陸の「粟田部変電所77/6kV」は同じ文の電圧欄（77/6.6kV）と食い違うので、主語からは外す
  const subject = display.replace(NAME_VOLTAGE_SUFFIX, '');
  const volt = sub.voltage_primary_kv != null && sub.voltage_secondary_kv != null
    ? ` ${sub.voltage_primary_kv}/${sub.voltage_secondary_kv}kV の` : '';
  const kind = display.includes('変電所') ? '変電所' : '設備';
  // 運用容量は基本情報の表（fmtNum）と同じ桁で出す（沖縄の 0.12MW が表では 0.1 MW）
  const cap = sub.cap_operational_mw;
  const capText = cap == null ? '' : Number.isInteger(cap) ? cap.toLocaleString() : cap.toFixed(1);
  const facts = [
    sub.units != null ? `変圧器 ${sub.units.toLocaleString()} 台` : '',
    capText ? `運用容量 ${capText}MW` : '',
  ].filter(Boolean).join('・');
  const head = `${subject}は${operator ? `${operator}管内の` : ''}${volt}${kind}`;
  return facts ? `${head}で、${facts}。` : `${head}。`;
}

/**
 * 変電所の詳細の title（検索の入口便・2026-10-30）。
 * 「{変電所名}（{県}・{事業者の短い名}）の系統空き容量・蓄電池連系条件」。県が確定しないレコード（基幹系統・関西ローカル系）は従来どおり。name は displaySubstationName を通した名前を渡す。
 * 同じ名前の変電所が別の県・別の社にある（ロングテールの「◯◯変電所」の取り違え）ため。サイト名は layout の titleTemplate が付ける。
 * qualifier は同じエリアの同名を見分ける語（substationNameQualifier・2026-11-02）。名前が重ならない変電所は null で、題名は変わらない。
 */
export function buildSubstationTitle(name: string, prefecture: string | null, operator: string, qualifier: string | null = null): string {
  const where = [qualifier, prefecture, prefecture && operator ? operatorShortName(operator) : ''].filter(Boolean).join('・');
  return where ? `${name}（${where}）の系統空き容量・蓄電池連系条件` : `${name}の系統空き容量・蓄電池連系条件`;
}

/* ------------------------------------------------------------------ *
 * Gr8（2026-08-09）: 県からの導線に使う件数
 * ------------------------------------------------------------------ */

/**
 * この県で使える補助金の件数。
 * applicable_prefs は「東京」「長崎」等の**短縮表記**（落とし穴 #110 の派生元ルール）なので、
 * 県ページ側の「東京都」「長崎県」から接尾辞を落として突合する。
 */
const PREF_SUBSIDY_COUNT: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const s of subsidiesData as Array<{ applicable_prefs?: string[] }>) {
    for (const p of s.applicable_prefs ?? []) out[p] = (out[p] ?? 0) + 1;
  }
  return out;
})();

export function subsidyCountForPref(pref: string): number {
  const short = pref.replace(/[都道府県]$/, '');
  return PREF_SUBSIDY_COUNT[short] ?? PREF_SUBSIDY_COUNT[pref] ?? 0;
}
