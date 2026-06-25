'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { GradientText } from '@/components/motion';
import { ShieldIcon } from '@/components/icons';
import BlackHoleCanvas from '@/components/BlackHoleCanvas';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token } = await authApi.login({ email, password });
      setAuth(user, token);
      window.history.replaceState(null, "", "/dashboard");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.message;
      setError((/^[\x00-\x7F]+$/.test(msg) || msg.includes("database") || msg.includes("connection")
        ? "登录失败，请检查邮箱和密码" : msg) || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <BlackHoleCanvas />

      {/* 引导层 */}
      {showIntro && (
        <div 
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowIntro(false)}
        >
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-400/30 to-rose-400/30 rounded-full flex items-center justify-center animate-bounce-subtle">
              <ShieldIcon size={48} color="#f9a8d4" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">进入我们的宇宙</h2>
            <p className="text-gray-400 text-sm">点击任意位置开始</p>
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* 登录卡片 */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-400/30 to-rose-400/30 rounded-full flex items-center justify-center">
                <ShieldIcon size={40} color="#f9a8d4" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                <GradientText>时光笺</GradientText>
              </h1>
              <p className="text-gray-400 text-sm">你和 ta 的私密空间</p>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-2 ml-1">邮箱</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all duration-300"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-xs mb-2 ml-1">密码</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all duration-300"
                  required
                />
              </div>

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
              <ShieldIcon size={12} />
              <span>端到端加密</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
