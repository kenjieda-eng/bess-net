/**
 * src/lib/subsidies-meta.ts — S4/S5（2026-08-09）補助金ページの title / description
 *
 * 背景（GSC 2026-05-08〜08-07）: /subsidies 系8URLで 表示4,366・クリック33＝**CTR 0.76%**。
 * 順位12位以内なのに CTR 2%未満のURLが5本・表示計2,724。用語集（S1）と同じ病。
 *
 * 実査した現状:
 *  - 詳細ページの title は `item.name` **のみ**（中間サフィックスは元から無く、
 *    layout の titleTemplate が「 | 蓄電所ネット」を足しているだけ）。
 *  - description は「{機関}が執行する蓄電池関連補助金「{名称}」の概要。」＝**定型文が先頭**で、
 *    検索者が知りたい 対象・補助率・締切 が後ろに回っていた。
 *  - 名称の先頭が「令和7年度補正 」等の年度で占められ、**探している制度名が後ろにずれていた**。
 *
 * 方針（S1で確立した規律をそのまま適用）:
 *  - 既存フィールドからの**抽出のみ**。新規の文章生成はしない
 *  - **自前で切り詰めない**。収まらなければ要素を落とす（年度→状態の順に落とす）
 *  - サイト名は1回だけ
 *  - 状態（公募中／締切）は **deadline_iso から導出**する。microCMS の生 status は
 *    時間で drift するため、締切超過を「公募中」と表示してはならない（L-EIC-027）
 */

/** 日付から状態を導くために必要な最小の型（precompute の JSON と互換） */
export type SubsidyDateFacts = {
  status: string[];
  deadline_iso?: string | null;
  start_iso?: string | null;
  is_rolling?: boolean;
};

/** build 時の JST 日付（YYYY-MM-DD） */
export function getTodayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * deadline_iso / start_iso ベースで status を自動導出（L-EIC-027）。
 * /subsidies ハブと詳細ページで同一の判定を使うため共有する。
 */
export function deriveSubsidyStatus(item: SubsidyDateFacts, todayISO: string): string {
  // 採択結果公表は終端状態（結果公表日が過去でも受付終了に上書きしない）
  if (item.status[0] === '採択結果公表') return '採択結果公表';
  // 締切超過が最優先（受付終了）
  if (!item.is_rolling && item.deadline_iso && item.deadline_iso < todayISO) {
    return '受付終了';
  }
  // 開始日が未来 → 公募予定
  if (item.start_iso && item.start_iso > todayISO) {
    return '公募予定';
  }
  return item.status[0] || 'その他';
}

/**
 * 締切カウントダウン（表示規約 2026-08-08）:
 *   未来=「あと◯日」／当日=「本日締切」／超過=「締切済」／deadline_iso なし・随時=表示なし
 */
export function deadlineCountdown(item: SubsidyDateFacts, todayISO: string): string | null {
  if (item.is_rolling || !item.deadline_iso) return null;
  const days = Math.round((Date.parse(item.deadline_iso) - Date.parse(todayISO)) / 86400000);
  if (days > 0) return `あと${days}日`;
  if (days === 0) return '本日締切';
  return '締切済';
}

/* ------------------------------------------------------------------ *
 * S5: 表示名の是正（honesty fix）
 *
 * microCMS の name が「NeV（次世代自動車振興センター）公式サイト」で、
 * title と H1 の両方が「◯◯公式サイト」で終わっていた。
 * **当サイトは公式サイトではない**ため、検索結果で誤認される恐れがある。
 * microCMS を書き換えず、コード側で表示名を是正する。
 * ------------------------------------------------------------------ */

/** slug → 表示名の上書き（理由をコメントで明記すること） */
export const SUBSIDY_DISPLAY_NAME_OVERRIDE: Record<string, string> = {
  // 当サイトは公式サイトではない。団体名だけを表示名にする
  'nev-portal': 'NeV（次世代自動車振興センター）',
};

/** slug → title の上書き（当サイト固有の価値が伝わる形。ページの実内容と一致させること） */
export const SUBSIDY_TITLE_OVERRIDE: Record<string, string> = {
  // 実内容＝CEV補助金・充電インフラ補助金の執行団体としての制度メモ＋公式サイトへの案内。
  // 「蓄電池補助金の一覧」ではないので、一覧があるかのような title にはしない。
  // 充電インフラ補助金にも触れたいが title が長くなるため、そちらは description に載せる。
  'nev-portal': 'NeV（次世代自動車振興センター）— CEV補助金の執行団体',
};

/** 出典が主で、当サイトは案内であることを明示すべきページ */
export const SUBSIDY_POINTER_SLUGS = new Set<string>(['nev-portal']);

export function subsidyDisplayName(slug: string, name: string): string {
  return SUBSIDY_DISPLAY_NAME_OVERRIDE[slug] ?? name;
}

/* ------------------------------------------------------------------ *
 * S4: title / description
 * ------------------------------------------------------------------ */

const SITE_SUFFIX = '｜蓄電所ネット';
/** 補助金名は元々長いため、用語集より緩めの上限にする */
const TITLE_MAX = 40;

/** 「令和7年度補正 ◯◯」「令和8年度 ◯◯」等の年度接頭辞を分離する */
export function splitFiscalPrefix(name: string): { core: string; fiscal: string } {
  const m = String(name || '').match(/^\s*(令和\d+年度(?:補正)?|平成\d+年度(?:補正)?|\d{4}年度(?:補正)?)\s*/);
  if (!m) return { core: String(name || '').trim(), fiscal: '' };
  return { core: String(name).slice(m[0].length).trim(), fiscal: m[1] };
}

/** 状態ラベル（title に載せる短い形）。載せない場合は空文字。 */
export function statusLabel(item: SubsidyDateFacts, todayISO: string): string {
  const st = deriveSubsidyStatus(item, todayISO);
  if (st === '公募中') {
    if (!item.is_rolling && item.deadline_iso && item.deadline_iso >= todayISO) {
      const [, mm, dd] = item.deadline_iso.split('-');
      return `公募中・締切${Number(mm)}/${Number(dd)}`;
    }
    return '公募中';
  }
  if (st === '公募予定') return '公募予定';
  if (st === '採択結果公表') return '採択結果';
  if (st === '受付終了') return '受付終了';
  return '';
}

/**
 * 詳細ページの title。
 * 優先度は 制度名 → 状態 → 年度。上限を超えたら後ろの要素から落とす（自前で切り詰めない）。
 */
export function buildSubsidyTitle(
  slug: string,
  name: string,
  facts: SubsidyDateFacts,
  todayISO: string
): string {
  const override = SUBSIDY_TITLE_OVERRIDE[slug];
  if (override) return `${override}${SITE_SUFFIX}`;

  const { core, fiscal } = splitFiscalPrefix(subsidyDisplayName(slug, name));
  let out = core;

  // 名称に既に結果・終了等が入っている場合、状態ラベルは重複するので付けない
  const label = statusLabel(facts, todayISO);
  const redundant = /結果|一覧|終了/.test(core) && /採択結果|受付終了/.test(label);
  if (label && !redundant && (out + ` — ${label}` + SITE_SUFFIX).length <= TITLE_MAX) {
    out += ` — ${label}`;
  }
  if (fiscal && (out + `（${fiscal}）` + SITE_SUFFIX).length <= TITLE_MAX) {
    out += `（${fiscal}）`;
  }
  return `${out}${SITE_SUFFIX}`;
}

/** description。対象・補助率・締切の要点を先頭に置く（定型文を先頭にしない）。 */
export function buildSubsidyDescription(
  slug: string,
  item: {
    name: string;
    organization?: string;
    targetEntity?: string;
    subsidyRate?: string;
    upperLimit?: string;
    deadline?: string;
    scheme?: string;
  },
  facts: SubsidyDateFacts,
  todayISO: string
): string {
  const parts: string[] = [];
  // 出典案内が主のページ（団体ポータル等）は、そのページ自体が公募ではないので状態を先頭に出さない
  const label = SUBSIDY_POINTER_SLUGS.has(slug) ? '' : statusLabel(facts, todayISO);
  if (label) parts.push(label);
  if (item.targetEntity) parts.push(`対象: ${item.targetEntity}`);
  if (item.subsidyRate) parts.push(`補助率: ${item.subsidyRate}`);
  if (item.upperLimit) parts.push(`上限: ${item.upperLimit}`);
  if (item.deadline && deriveSubsidyStatus(facts, todayISO) !== '受付終了') {
    parts.push(`締切: ${item.deadline}`);
  }
  let out = parts.join('／');
  const who = item.organization ? `${item.organization}が執行。` : '';
  const head = out ? `${out}。${who}` : who;
  const tail = item.scheme ? item.scheme : '';
  const full = `${head}${tail}`.trim();
  return full || `${subsidyDisplayName(slug, item.name)}の概要。`;
}
