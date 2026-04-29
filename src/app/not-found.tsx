import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
        background: '#F7F9FC',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#0F2D4F',
            marginBottom: '16px',
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#1A1A1A',
            marginBottom: '24px',
          }}
        >
          お探しのページは見つかりませんでした
        </p>
        <Link
          href="/"
          style={{
            color: '#00B5A5',
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
