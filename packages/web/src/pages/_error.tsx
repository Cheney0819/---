import React from 'react';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
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
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
          {statusCode === 404 ? '页面不存在' : '出错了'}
        </p>
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

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
