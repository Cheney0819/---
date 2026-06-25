'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { FadeIn } from '@/components/motion';
import { ShieldIcon } from '@/components/icons';
import BlackHoleCanvas from '@/components/BlackHoleCanvas';

export default function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证密码
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6位');
      return;
    }

    setLoading(true);

    try {
      // 使用昵称作为用户名和邮箱
      // 使用用户输入的邮箱
      const { user, token } = await authApi.register({
        username: nickname,
        email,
        password,
        displayName: nickname,
      });
      setAuth(user, token);
    window.history.replaceState(null, "", "/dashboard");
    router.push("/dashboard");
    } catch (err: any) {
      const msg = err.message;
      setError((/^[\x00-\x7F]+$/.test(msg) || msg.includes("database") || msg.includes("connection")
        ? "注册失败，请稍后重试" : msg) || '缔结失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 复用黑洞背景 */}
      <BlackHoleCanvas />

      {/* 注册卡片 */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-400/30 to-rose-400/30 rounded-full flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pink-300">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">缔结双星</h1>
              <p className="text-gray-400 text-sm">建立你们的引力链接</p>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 我们的昵称 */}
              <div>
                <label className="block text-gray-400 text-xs mb-2 ml-1">你的昵称</label>
                <input
                  type="text"
                  placeholder="你的专属昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all duration-300"
                  required
                  minLength={2}
                />
              </div>

              {/* 邮箱 */}
              <div>
                <label className="block text-gray-400 text-xs mb-2 ml-1">邮箱</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all duration-300"
                  required
                />
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-gray-400 text-xs mb-2 ml-1">密码</label>
                <input
                  type="password"
                  placeholder="设置密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all duration-300"
                  required
                  minLength={6}
                />
              </div>

              {/* 确认密码 */}
              <div>
                <label className="block text-gray-400 text-xs mb-2 ml-1">确认密码</label>
                <input
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all duration-300"
                  required
                  minLength={6}
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
                {loading ? '缔结中...' : '建立引力链接'}
              </button>
            </form>

            {/* 登录链接 */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                已有星轨？{' '}
                <Link href="/login" className="text-pink-400 hover:text-pink-300 transition-colors">
                  穿越视界
                </Link>
              </p>
            </div>

            {/* 安全提示 */}
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-xs">
              <ShieldIcon size={12} />
              <span>端到端加密，数据完全私密</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
