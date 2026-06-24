'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ShieldIcon } from '@/components/icons';
import BlackHoleCanvas from '@/components/BlackHoleCanvas';
import CollapseEffect from '@/components/CollapseEffect';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showCollapse, setShowCollapse] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token } = await authApi.login({ email, password });
      setAuth(user, token);
      setShowCollapse(true);
    } catch (err: any) {
      setError(err.message || '登录失败');
      setLoading(false);
    }
  };

  const handleCollapseComplete = () => {
    // 清除历史记录，防止返回到登录/注册页
    window.history.replaceState(null, '', '/dashboard');
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <CollapseEffect isActive={showCollapse} onComplete={handleCollapseComplete} />
      <BlackHoleCanvas />

      {showIntro && (
        <div 
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm cursor-pointer transition-opacity duration-500"
          onClick={() => setShowIntro(false)}
        >
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full flex items-center justify-center animate-pulse">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pink-300">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">进入我们的宇宙</h2>
            <p className="text-gray-400 text-sm">点击任意位置开始</p>
            <div className="mt-8 flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-400/30 to-rose-400/30 rounded-2xl flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pink-300">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">时光笺</h1>
              <p className="text-gray-400 text-sm">你和 ta 的私密空间</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all duration-300"
                required
              />
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all duration-300"
                required
              />

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-semibold rounded-xl disabled:opacity-50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-400/25 active:scale-[0.98]"
              >
                {loading ? '穿越中...' : '进入花园'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                还没有星轨？{' '}
                <Link href="/register" className="text-pink-400 hover:text-pink-300 transition-colors">
                  缔结双星
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-xs">
              <ShieldIcon size={14} color="#4ade80" className="animate-breathing" />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-semibold">端到端加密</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
