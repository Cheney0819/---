'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api';
import { FadeIn, ScaleIn, GradientText } from '@/components/motion';
import { BackIcon, ShieldIcon, LogoutIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function ProfilePage() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await userApi.update({ displayName }, token!);
      if (user) setAuth({ ...user, displayName }, token!);
      setMessage('保存成功');
    } catch (err: any) {
      const saveErr = err.message;
      setMessage(saveErr ? (/^[\x00-\x7F]+$/.test(saveErr) || saveErr.includes("database") ? "保存失败，请稍后重试" : saveErr) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700">
      <header className="sticky top-0 z-10 glass-strong">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-600 transition-colors text-gray-400 hover:text-white btn-tap">
            <BackIcon size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">个人资料</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8">
        <FadeIn>
          {/* 头像 */}
          <div className="flex flex-col items-center mb-10">
            <ScaleIn>
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-teal to-primary-pink flex items-center justify-center text-dark-900 text-4xl font-bold shadow-xl shadow-primary-teal/20">
                  {(user?.displayName || user?.username || '?')[0].toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <StatusBadge status="online" size="lg" />
                </div>
              </div>
            </ScaleIn>
            <p className="text-gray-400 text-sm mt-4">@{user?.username}</p>
            <div className="flex items-center gap-1.5 mt-2 text-green-400">
              <ShieldIcon size={14} />
              <span className="text-xs">端到端加密保护</span>
            </div>
          </div>

          {/* 邀请码 */}
          <GlassCard className="p-6 mb-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">我的邀请码</p>
              <p className="text-4xl font-bold tracking-widest gradient-text">
                {(user as any)?.inviteCode || '------'}
              </p>
              <p className="text-gray-500 text-xs mt-2">将此邀请码分享给对方进行配对</p>
            </div>
          </GlassCard>

          {/* 编辑资料 */}
          <GlassCard className="p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">编辑资料</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">用户名</label>
                <input type="text" value={user?.username || ''} disabled className="w-full px-4 py-3 bg-dark-700/50 border border-gray-700/30 rounded-xl text-gray-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">邮箱</label>
                <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 bg-dark-700/50 border border-gray-700/30 rounded-xl text-gray-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">昵称</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="设置昵称" className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all" />
              </div>
              {message && (
                <div className={`p-3 rounded-xl text-center text-sm ${message.includes('成功') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {message}
                </div>
              )}
              <GradientButton fullWidth onClick={handleSave} loading={saving}>保存</GradientButton>
            </div>
          </GlassCard>

          {/* 退出登录 */}
          <button onClick={() => { logout(); router.replace('/login'); }} className="w-full py-4 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
            <LogoutIcon size={18} />
            <span>退出登录</span>
          </button>
        </FadeIn>
      </div>
    </main>
  );
}
