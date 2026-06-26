'use client';

import { useEffect, useState } from 'react';
import PairCard from '@/components/PairCard';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { pairApi } from '@/lib/api';
import { FadeIn, SlideIn, ScaleIn, GradientText } from '@/components/motion';
import { CapsuleIcon, TimelineIcon, DiaryIcon, AlbumIcon, LogoutIcon, ShieldIcon, CalendarIcon, HeartIcon } from '@/components/icons';
import HeartBeat from '@/components/HeartBeat';
import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';

interface Pair {
  id: string;
  userA: { id: string; username: string; displayName?: string };
  userB: { id: string; username: string; displayName?: string };
  status: string;
}

export default function DashboardPage() {
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [pageReady, setPageReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    loadPairs();
    loadStartDate();
    updateGreeting();
    setTimeout(() => setPageReady(true), 1500);
  }, [isAuthenticated]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了');
    else if (hour < 12) setGreeting('早上好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');
  };

  const loadPairs = async () => {
    try { const { pairs } = await pairApi.list(token!); setPairs(pairs); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadStartDate = () => {
    const saved = localStorage.getItem('shiguangjian_start_date');
    if (saved) setStartDate(new Date(saved));
  };

  const handleSaveDate = () => {
    if (!selectedDate) return;
    localStorage.setItem('shiguangjian_start_date', selectedDate);
    setStartDate(new Date(selectedDate));
    setShowDateModal(false);
  };

  const handleClearDate = () => {
    localStorage.removeItem('shiguangjian_start_date');
    setStartDate(null);
    setShowDateModal(false);
  };

  const getPartner = (pair: Pair) => pair.userA.id === user?.id ? pair.userB : pair.userA;

  // 计算在一起的天数/月数/年数
  const [elapsedDays, setElapsedDays] = useState(0);
  const [elapsedMonths, setElapsedMonths] = useState(0);
  const [elapsedYears, setElapsedYears] = useState(0);

  useEffect(() => {
    if (!startDate) return;
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < startDate.getDate())) {
      years--;
      months += 12;
    }
    if (months < 0) months += 12;
    
    setElapsedDays(days);
    setElapsedMonths(months);
    setElapsedYears(years);
  }, [startDate]);

  if (!isAuthenticated) return null;

  const quickActions = [
    { href: '/capsules', icon: CapsuleIcon, label: '时间胶囊', color: 'from-yellow-500/80 to-orange-500/80', iconBg: 'bg-yellow-500/20', desc: '给未来的信' },
    { href: '/timeline', icon: TimelineIcon, label: '记忆时间轴', color: 'from-blue-500/80 to-purple-500/80', iconBg: 'bg-blue-500/20', desc: '记录每个瞬间' },
    { href: '/diary', icon: DiaryIcon, label: '共享日记', color: 'from-pink-500/80 to-rose-500/80', iconBg: 'bg-pink-500/20', desc: '写下心情' },
    { href: '/album', icon: AlbumIcon, label: '共享相册', color: 'from-green-500/80 to-emerald-500/80', iconBg: 'bg-green-500/20', desc: '珍藏回忆' },
  ];

  if (!pageReady) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-teal to-primary-pink rounded-3xl flex items-center justify-center animate-pulse shadow-xl shadow-primary-teal/30">
            <ShieldIcon size={36} color="#0d1117" />
          </div>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-2 h-2 bg-primary-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-strong">
        <div className="max-w-lg mx-auto px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-teal to-primary-pink rounded-xl flex items-center justify-center shadow-lg shadow-primary-teal/20">
              <ShieldIcon size={20} color="#0d1117" />
            </div>
            <h1 className="text-xl font-bold gradient-text">时光笺</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-600/50 hover:bg-dark-600 transition-colors">
              <StatusBadge status="online" size="sm" />
              <div className="flex items-center gap-2">
                <img
                  src={user?.avatarUrl || ''}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-teal/20"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="text-sm text-gray-300">{user?.displayName || user?.username}</span>
              </div>
            </Link>
            <button onClick={() => { logout(); router.replace('/login'); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-dark-600/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all btn-tap">
              <LogoutIcon size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-6">
        {/* 欢迎语 */}
        <FadeIn delay={50}>
          <div className="mb-8">
            <p className="text-gray-400 text-sm mb-1">{greeting}</p>
            <h2 className="text-3xl font-bold text-white">{user?.displayName || user?.username}</h2>
          </div>
        </FadeIn>

        {/* 在一起时间 - 紧凑统计栏 */}
        <FadeIn delay={100}>
          <div className="mb-6">
            {startDate ? (
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} color="#f472b6" />
                    <p className="text-gray-400 text-sm">我们已经在一起</p>
                    <span className="text-white font-bold text-base">
                      {elapsedDays}
                    </span>
                    <span className="text-gray-500 text-xs">天 {elapsedMonths > 0 ? `${elapsedMonths}个月` : ''} {elapsedYears > 0 ? `${elapsedYears}年` : ''}</span>
                  </div>
                  <button onClick={() => setShowDateModal(true)} className="text-gray-500 text-xs hover:text-white transition-colors btn-tap px-3 py-1 rounded-full bg-dark-600/50 hover:bg-dark-600">
                    修改
                  </button>
                </div>
              </GlassCard>
            ) : (
              <button onClick={() => setShowDateModal(true)} className="w-full">
                <GlassCard className="p-6 cursor-pointer group hover:border-primary-teal/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-teal/20 to-primary-pink/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <HeartIcon size={20} color="#f472b6" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium text-sm">设置在一起的日期</p>
                      <p className="text-gray-500 text-xs">开始计算你们的时光</p>
                    </div>
                  </div>
                </GlassCard>
              </button>
            )}
          </div>
        </FadeIn>

        {/* 我的配对 */}
        <FadeIn delay={200}>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">我的配对</h2>
              <Link href="/search" className="text-sm text-primary-teal hover:text-primary-teal/80 transition-colors">
                + 搜索配对
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : pairs.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-teal/10 to-primary-pink/10 flex items-center justify-center">
                  <HeartBeat size={32} color="#a8edea" />
                </div>
                <p className="text-gray-300 font-medium mb-1">还没有配对</p>
                <p className="text-gray-500 text-sm">搜索用户名来添加你的 ta</p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {pairs.map((pair, index) => (
                  <SlideIn key={pair.id} delay={index * 100}>
                    <PairCard pair={pair} currentUserId={user?.id || ''} index={index} />
                  </SlideIn>
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* 快捷功能 - 2x2 网格 */}
        <FadeIn delay={300}>
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">快捷功能</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <SlideIn key={action.href} delay={400 + index * 80}>
                  <Link href={action.href}>
                    <GlassCard className="p-4 group card-hover">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl ${action.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <action.icon size={24} color={action.color.includes('yellow') ? '#fbbf24' : action.color.includes('blue') ? '#3b82f6' : action.color.includes('pink') ? '#ec4899' : '#22c55e'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">{action.label}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{action.desc}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </SlideIn>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* 底部间距 */}
        <div className="h-4" />
      </div>

      {/* 设置日期弹窗 - 简化版 */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-sm p-6 animate-scale-in" variant="dark">
            <h3 className="text-lg font-semibold text-white mb-4">设置在一起的日期</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-2 ml-1">选择日期</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-primary-teal/50 transition-all duration-300"
                />
              </div>
              <p className="text-gray-500 text-xs text-center">设置后将开始计算你们在一起的时间</p>
            </div>
            <div className="flex gap-3 mt-6">
              {startDate && (
                <button onClick={handleClearDate} className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-200 text-sm font-medium active:scale-95 btn-tap">清除</button>
              )}
              <button onClick={() => setShowDateModal(false)} className="flex-1 py-3 bg-dark-600/50 text-gray-400 rounded-xl hover:bg-dark-600 transition-all duration-200 active:scale-95 btn-tap">取消</button>
              <button onClick={handleSaveDate} disabled={!selectedDate} className="flex-1 py-3 bg-gradient-to-r from-primary-teal to-primary-teal/80 text-dark-900 font-medium rounded-xl disabled:opacity-50 transition-all duration-200 hover:shadow-lg active:scale-95 btn-tap">保存</button>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
