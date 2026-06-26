'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { FadeIn } from '@/components/motion';
import { BackIcon, ShieldIcon, BellIcon, PaletteIcon, UserIcon, LogoutIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const saved = localStorage.getItem(key);
  return saved !== null ? JSON.parse(saved) : fallback;
}

export default function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState(() => getStored('setting_notifications', true));
  const [sound, setSound] = useState(() => getStored('setting_sound', true));
  const [darkMode, setDarkMode] = useState(() => getStored('setting_darkMode', true));

  // 持久化
  useEffect(() => { localStorage.setItem('setting_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('setting_sound', JSON.stringify(sound)); }, [sound]);
  useEffect(() => { localStorage.setItem('setting_darkMode', JSON.stringify(darkMode)); }, [darkMode]);

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700">
      <header className="sticky top-0 z-10 glass-strong">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-600 transition-colors text-gray-400 hover:text-white btn-tap">
            <BackIcon size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">设置</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        <FadeIn>
          {/* 通知设置 */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 mb-3">通知</h3>
            <GlassCard>
              <div className="flex items-center justify-between py-4 border-b border-gray-700/30">
                <div className="flex items-center gap-3">
                  <BellIcon size={20} color="#a8edea" />
                  <span className="text-white">推送通知</span>
                </div>
                <button onClick={() => setNotifications(!notifications)} className={`w-12 h-7 rounded-full transition-colors ${notifications ? 'bg-pink-400' : 'bg-dark-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <BellIcon size={20} color="#a8edea" />
                  <span className="text-white">消息提示音</span>
                </div>
                <button onClick={() => setSound(!sound)} className={`w-12 h-7 rounded-full transition-colors ${sound ? 'bg-pink-400' : 'bg-dark-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${sound ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </GlassCard>
          </div>

          {/* 外观设置 */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 mb-3">外观</h3>
            <GlassCard>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <PaletteIcon size={20} color="#a8edea" />
                  <span className="text-white">深色模式</span>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-pink-400' : 'bg-dark-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-gray-500 text-xs ml-2">{darkMode ? '开' : '关'}</span>
              </div>
            </GlassCard>
          </div>

          {/* 退出登录 */}
          <button onClick={() => { logout(); router.replace('/login'); }} className="w-full py-4 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
            <LogoutIcon size={18} />
            <span>退出登录</span>
          </button>

          {/* 版本信息 */}
          <div className="text-center mt-8 text-gray-600 text-xs">
            <p>时光笺 v1.0.0</p>
            <p className="mt-1">端到端加密 · 只有你们能看到</p>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
