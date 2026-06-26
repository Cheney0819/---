'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { userApi, passwordApi } from '@/lib/api';
import { FadeIn, ScaleIn, GradientText } from '@/components/motion';
import { BackIcon, ShieldIcon, LogoutIcon, PhotoIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function ProfilePage() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setMessage('');
    try {
      await userApi.uploadAvatar(file, token!);
      const avatarUrl = (file as any)._previewUrl || '';
      if (user) {
        setAuth({ ...user, avatarUrl }, token!);
      }
      setMessage('头像上传成功');
    } catch (err: any) {
      setMessage(err.message || '头像上传失败');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    setPwdSaving(true);
    setPasswordMsg('');
    try {
      await passwordApi.change({ currentPassword, newPassword, confirmPassword }, token!);
      setPasswordMsg('密码修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      setPasswordMsg(err.message || '密码修改失败');
    } finally {
      setPwdSaving(false);
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
              <div
                className="relative cursor-pointer group"
                onClick={handleAvatarClick}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="w-28 h-28 rounded-3xl object-cover shadow-xl shadow-primary-teal/20"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-teal to-primary-pink flex items-center justify-center text-dark-900 text-4xl font-bold shadow-xl shadow-primary-teal/20">
                    {(user?.displayName || user?.username || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PhotoIcon size={24} className="text-white" />
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-3xl bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs">上传中...</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2">
                  <StatusBadge status="online" size="lg" />
                </div>
              </div>
            </ScaleIn>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
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

          {/* 修改密码 */}
          <GlassCard className="p-6 mb-6">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full flex items-center justify-between text-white font-semibold"
            >
              <span>修改密码</span>
              <span className="text-gray-400 text-sm">{showPasswordForm ? '收起 ▲' : '展开 ▼'}</span>
            </button>
            {showPasswordForm && (
              <div className="space-y-4 mt-4 pt-4 border-t border-gray-700/30">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">当前密码</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码"
                    className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少8位密码"
                    className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">确认新密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 transition-all"
                  />
                </div>
                {passwordMsg && (
                  <div className={`p-3 rounded-xl text-center text-sm ${passwordMsg.includes('成功') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {passwordMsg}
                  </div>
                )}
                <GradientButton fullWidth onClick={handleChangePassword} loading={pwdSaving}>确认修改</GradientButton>
              </div>
            )}
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
