/**
 * scripts/patch-operator-aliases.ts
 *
 * 依頼Z Step 4: Phase 1 の主要 operators に aliases（テキストエリア方式）を投入する。
 *
 * ## 前提
 *  - microCMS の operators schema に「aliases」テキストエリア（複数行）フィールドが追加済み（Step 1）
 *    - 江田さん判断で「繰り返し」ではなく「テキストエリア」方式
 *    - API レスポンス: { aliases: "JFEエンジ\nJFE-E" } のような改行区切り string
 *  - MICROCMS_API_KEY と MICROCMS_SERVICE_DOMAIN が環境変数に設定済み
 *  - 入力ファイル: scripts/operator-aliases-phase1.yaml（block scalar `|` 形式）
 *
 * ## 実行方法
 *   # 1) Webhook を OFF（依頼Z §投入時の注意）
 *   #    microCMS 管理画面 > サービス設定 > Webhook
 *   # 2) 環境変数を設定して dry-run で確認
 *   $ MICROCMS_API_KEY=xxx \
 *     MICROCMS_SERVICE_DOMAIN=yyy \
 *     npx tsx scripts/patch-operator-aliases.ts --dry-run
 *   # 3) 問題なければ本実行
 *   $ MICROCMS_API_KEY=xxx \
 *     MICROCMS_SERVICE_DOMAIN=yyy \
 *     npx tsx scripts/patch-operator-aliases.ts
 *   # 4) 完了後に Webhook を ON、build 待ち
 *
 * ## 動作
 *  1. YAML を読み込み（block scalar `|` または plain scalar 両対応）
 *  2. 各 operator を slug で検索（filters[slug][equals]）
 *  3. 既存 aliases 文字列を行で split → 新規行と Set merge → 重複排除して再 join
 *  4. 該当 ID に対して PATCH /api/v1/operators/{id} に { aliases: "<改行区切り>" }
 *
 * ## エラーハンドリング
 *  - slug 不一致 → warn 出力して skip
 *  - 同 alias を複数 operator に投入しようとしたら fatal error（落とし穴 #77）
 *  - 既存 aliases に新規 alias がすべて含まれていれば no-op
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type AliasEntry = {
  slug: string;
  name?: string;
  aliases: string[]; // YAML 側は配列で扱い、PATCH 時に改行区切り string に変換
};

type OperatorRecord = {
  id: string;
  name: string;
  slug: string;
  aliases?: string;
};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error(
    'ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY env vars are required'
  );
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/operators`;

async function api(
  method: 'GET' | 'PATCH' | 'PUT',
  url: string,
  body?: unknown
): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text}`);
  }
  return resp.json();
}

/** slug で operator を検索（最初の 1 件） */
async function findBySlug(slug: string): Promise<OperatorRecord | null> {
  const url = `${BASE}?filters=slug[equals]${encodeURIComponent(
    slug
  )}&fields=id,name,slug,aliases&limit=1`;
  const data = (await api('GET', url)) as {
    contents: OperatorRecord[];
    totalCount: number;
  };
  return data.contents[0] ?? null;
}

/** PATCH で aliases を更新（既存 string と merge して重複排除、改行区切り string で送信） */
async function patchAliases(
  operator: OperatorRecord,
  newAliases: string[]
): Promise<void> {
  const existingArr = (operator.aliases ?? '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const merged = Array.from(new Set([...existingArr, ...newAliases]));
  const diff = merged.filter((a) => !existingArr.includes(a));
  if (diff.length === 0) {
    console.log(
      `  [skip] ${operator.slug} (${operator.name}) — already has all aliases`
    );
    return;
  }

  const body = { aliases: merged.join('\n') };

  if (DRY_RUN) {
    console.log(
      `  [dry-run] PATCH ${operator.slug}: + [${diff.join(', ')}] → final string ${JSON.stringify(body.aliases)}`
    );
    return;
  }

  await api('PATCH', `${BASE}/${operator.id}`, body);
  console.log(
    `  [ok] ${operator.slug} (${operator.name}) — added [${diff.join(', ')}]`
  );
}

/**
 * 簡易 YAML ローダー（依存追加を避けるため必要部分のみ）
 * 対応形式:
 *   - 各エントリ: "  - slug: xxx" / "    name: yyy" / "    aliases: ..."
 *   - aliases の値:
 *       a) plain scalar:    aliases: "東急"
 *       b) bare plain:      aliases: 東急
 *       c) block scalar:    aliases: |
 *                             東急不動産HD
 *                             東急不動産
 *       d) flow sequence:   aliases: [foo, bar]   ← 念のため後方互換
 *
 * 戻り値の aliases は常に string[] に正規化（patch 時に \n join）。
 */
function parseYaml(text: string): AliasEntry[] {
  const lines = text.split(/\r?\n/);
  const out: AliasEntry[] = [];
  let cur: Partial<AliasEntry> | null = null;
  // block scalar 中: indent はその開始行で確定する
  let blockMode = false;
  let blockIndent = -1; // block scalar 本体の必要 indent（>blockBaseIndent）
  let blockBaseIndent = -1; // "aliases:" 行の indent

  function pushCurIfReady(): void {
    if (cur && cur.slug && Array.isArray(cur.aliases)) {
      out.push(cur as AliasEntry);
    }
  }

  for (const raw of lines) {
    // block scalar 中は raw を温存（indent 比較で抜けるか判定）
    if (blockMode && cur) {
      // 完全に空の行は許容（blank line in block scalar = 空行扱い、ここでは無視）
      if (raw.trim() === '') continue;
      const indent = raw.length - raw.trimStart().length;
      if (indent > blockBaseIndent) {
        // block scalar 本体の行（indent はあまり厳密にチェックしない）
        if (blockIndent < 0) blockIndent = indent;
        const value = raw.slice(blockIndent).replace(/\s+#.*$/, '').trim();
        if (value) cur.aliases!.push(value);
        continue;
      }
      // indent が下がった → block scalar 終了、通常処理へフォールスルー
      blockMode = false;
      blockIndent = -1;
      blockBaseIndent = -1;
      // この行は通常処理にかける
    }

    // コメントと空行
    const stripped = raw.replace(/(^|\s)#.*$/, '$1');
    const trimmed = stripped.trim();
    if (!trimmed) continue;

    // top-level "operators:"
    if (/^operators:\s*$/.test(trimmed)) continue;

    // new entry "  - slug: xxx"
    const newEntry = stripped.match(/^(\s*)-\s+slug:\s*(.+)$/);
    if (newEntry) {
      pushCurIfReady();
      cur = { slug: newEntry[2].trim(), aliases: [] };
      continue;
    }

    if (!cur) continue;

    // "    name: ..."
    const nameLine = stripped.match(/^\s+name:\s*(.+)$/);
    if (nameLine) {
      cur.name = nameLine[1].replace(/^["']|["']$/g, '').trim();
      continue;
    }

    // "    aliases: <value>" — block scalar / plain / flow seq の判定
    const aliasLine = stripped.match(/^(\s+)aliases:\s*(.*)$/);
    if (aliasLine) {
      const baseIndent = aliasLine[1].length;
      const tail = aliasLine[2].trim();
      cur.aliases = [];
      if (tail === '|' || tail === '|-' || tail === '|+') {
        // block scalar 開始
        blockMode = true;
        blockIndent = -1;
        blockBaseIndent = baseIndent;
      } else if (tail.startsWith('[') && tail.endsWith(']')) {
        // flow sequence: [foo, bar] (後方互換)
        const inner = tail.slice(1, -1);
        for (const item of inner.split(',')) {
          const v = item.trim().replace(/^["']|["']$/g, '');
          if (v) cur.aliases!.push(v);
        }
      } else if (tail) {
        // plain scalar / quoted scalar
        const v = tail.replace(/^["']|["']$/g, '');
        if (v) cur.aliases!.push(v);
      }
      // tail が空なら block scalar の継続行待ち（ただし | が無いパターン）
      continue;
    }
  }
  pushCurIfReady();
  return out;
}

async function main(): Promise<void> {
  // CommonJS では __dirname が使えるが ESM/tsx 環境差を避けて process.cwd() ベース
  const yamlPath = path.join(
    process.cwd(),
    'scripts',
    'operator-aliases-phase1.yaml'
  );
  if (!fs.existsSync(yamlPath)) {
    console.error(`ERROR: YAML not found: ${yamlPath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(yamlPath, 'utf8');
  const entries = parseYaml(text);

  console.log(
    `[patch-operator-aliases] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}, ${entries.length} entries`
  );

  if (entries.length === 0) {
    console.error(
      'ERROR: parsed 0 entries from YAML — check format (block scalar `|` etc.)'
    );
    process.exit(1);
  }

  // 重複 alias チェック（落とし穴 #77）
  const aliasOwners = new Map<string, string>();
  for (const e of entries) {
    for (const a of e.aliases) {
      const exist = aliasOwners.get(a);
      if (exist && exist !== e.slug) {
        console.error(
          `FATAL: alias "${a}" appears under multiple slugs: ${exist} and ${e.slug}`
        );
        process.exit(2);
      }
      aliasOwners.set(a, e.slug);
    }
  }

  let ok = 0,
    skip = 0,
    notFound = 0,
    err = 0;

  for (const e of entries) {
    if (e.aliases.length === 0) {
      skip++;
      continue;
    }
    try {
      const op = await findBySlug(e.slug);
      if (!op) {
        console.warn(
          `  [warn] slug "${e.slug}" (${e.name ?? '?'}) not found in microCMS — skip`
        );
        notFound++;
        continue;
      }
      if (e.name && e.name !== op.name) {
        console.warn(
          `  [warn] name mismatch for ${e.slug}: spec="${e.name}" vs microCMS="${op.name}"`
        );
      }
      await patchAliases(op, e.aliases);
      ok++;
    } catch (err2) {
      console.error(`  [err] ${e.slug}: ${(err2 as Error).message}`);
      err++;
    }
  }

  console.log(
    `\n[done] ok=${ok}, skip=${skip}, notFound=${notFound}, err=${err}`
  );
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
