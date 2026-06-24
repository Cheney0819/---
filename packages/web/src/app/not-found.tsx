export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1117',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>404</h1>
        <p style={{ color: '#9ca3af', marginBottom: '24px' }}>页面不存在</p>
        <a
          href="/"
          style={{
            padding: '12px 24px',
            background: '#a8edea',
            color: '#0d1117',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
