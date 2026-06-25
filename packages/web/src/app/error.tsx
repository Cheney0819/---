'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 兜底：如果错误信息包含英文数据库/技术错误，显示通用中文提示
  const message = error.message;
  const displayMessage = /^[\x00-\x7F]+$/.test(message) || 
    message.includes('database') || 
    message.includes('connection') || 
    message.includes('Prisma') ||
    message.includes('Error:')
    ? '出了点问题，请稍后重试' 
    : message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">出错了</h2>
        <p className="text-gray-400 mb-6">{displayMessage}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary-teal text-dark-900 rounded-xl font-medium"
        >
          重试
        </button>
      </div>
    </div>
  );
}
