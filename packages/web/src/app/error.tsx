'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">出错了</h2>
        <p className="text-gray-400 mb-6">{error.message}</p>
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
