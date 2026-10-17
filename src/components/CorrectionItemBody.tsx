/**
 * 訂正履歴の 1 件の本文（直す前／直した後・理由／一次）。記事末（CorrectionHistory）と一覧（CorrectionsList）が同じ部品を使う（#119）。
 * 依存を持たない表示だけの部品（クライアント側からも読み込める）。
 * 同じページの複数の箇所を同じ日に直したもの（1 件にまとめた記録）は、before／after を改行で区切って持ち、箇条で出す（便 §1「before／after を箇条で」）。
 * ブロック（<div>・<ul>）を返すので、呼び出し側の入れ物は <p> ではなく <div> にする。
 */
export type CorrectionItemBodyProps = {
  kind: '訂正' | '表示の停止' | '表示の再開';
  before: string;
  after: string;
  basis: { name: string; publisher: string; url: string }[];
};

/** 改行で区切った箇条（1 つだけなら文のまま） */
function Text({ label, text }: { label: string; text: string }) {
  const items = text.split('\n').map((s) => s.trim()).filter(Boolean);
  if (items.length <= 1) return <div>{`${label}: ${items[0] ?? ''}`}</div>;
  return (
    <div>
      {`${label}:`}
      {/* サイト共通の CSS は ul の黒丸を消しているので明示する */}
      <ul style={{ margin: '2px 0 4px', paddingLeft: '1.4em', listStyleType: 'disc' }}>
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

export default function CorrectionItemBody({ kind, before, after, basis }: CorrectionItemBodyProps) {
  const afterLabel = kind === '表示の停止' ? '理由' : kind === '表示の再開' ? '再開の内容' : '直した後';
  return (
    <>
      <Text label="直す前" text={before} />
      <Text label={afterLabel} text={after} />
      {basis.length > 0 ? (
        <div style={{ color: 'var(--color-muted)' }}>
          {'一次: '}
          {basis.map((b, i) => (
            <span key={`${b.url}-${i}`}>
              {i > 0 ? '／' : ''}
              {`${b.publisher}「`}
              <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', wordBreak: 'break-all' }}>{b.name}</a>
              {'」'}
            </span>
          ))}
        </div>
      ) : (
        // 一次（開催告知・公表資料）が見つからないことを理由に表示を止めたもの／出典の資料を確認できず行を外した訂正
        <div style={{ color: 'var(--color-muted)' }}>{`一次: 確認できませんでした（${afterLabel}のとおり）`}</div>
      )}
    </>
  );
}
