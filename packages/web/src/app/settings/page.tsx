'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { FadeIn } from '@/components/motion';
import { BackIcon, ShieldIcon, BellIcon, PaletteIcon, UserIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';

export default function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  if (!isAuthenticated) return null;

  const settingsGroups: Array<{
    title: string;
    items: Array<{
      icon: React.FC<{ size?: number; color?: string }>;
      label: string;
      onClick?: () => void;
      toggle?: boolean;
      value?: boolean;
      onChange?: (v: boolean) => void;
    }>;
  }> = [
    {
      title: '账户',
      items: [
        { icon: UserIcon, label: '编辑资料', onClick: () => router.push('/profile') },
        { icon: ShieldIcon, label: '隐私设置', onClick: () => {} },
      ]
    },
    {
      title: '通知',
      items: [
        { icon: BellIcon, label: '推送通知', toggle: true, value: notifications, onChange: setNotifications },
        { icon: BellIcon, label: '消息提示音', toggle: true, value: sound, onChange: setSound },
      ]
    },
    {
      title: '外观',
      items: [
        { icon: PaletteIcon, label: '深色模式', toggle: true, value: darkMode, onChange: setDarkMode },
      ]
    },
  ];

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
          {settingsGroups.map((group, groupIndex) => (
            <div key={group.title} className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3 ml-1">{group.title}</h3>
              <GlassCard className="divide-y divide-gray-700/30">
                {group.items.map((item, itemIndex) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-4 px-4 cursor-pointer hover:bg-dark-600/30 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                    onClick={item.onClick}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-dark-700/50 flex items-center justify-center">
                        <item.icon size={20} color="#a8edea" />
                      </div>
                      <span className="text-white">{item.label}</span>
                    </div>
                    
                    {item.toggle ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onChange?.(!item.value);
                        }}
                        className={`w-12 h-7 rounded-full transition-colors duration-200 ${
                          item.value ? 'bg-primary-teal' : 'bg-dark-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                          item.value ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                ))}
              </GlassCard>
            </div>
          ))}

          {/* 退出登录 */}
          <div className="mb-8">
            <button
              onClick={() => { logout(); router.replace('/login'); }}
              className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-medium hover:bg-red-500/20 transition-all duration-200 btn-tap"
            >
              退出登录
            </button>
          </div>

          {/* 版本信息 */}
          <div className="text-center text-gray-600 text-xs pb-8">
            <p>时光笺 v1.0.0</p>
            <p className="mt-1">端到端加密 · 只有你们能看到</p>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
