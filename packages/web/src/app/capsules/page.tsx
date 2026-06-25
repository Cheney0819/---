'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { capsuleApi, pairApi } from '@/lib/api';
import { FadeIn, ScaleIn, SlideIn } from '@/components/motion';
import { BackIcon, CapsuleIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';

interface Capsule {
  id: string;
  content: string;
  status: 'pending' | 'delivered' | 'read';
  triggerTime: string;
  createdAt: string;
  sender?: { username: string; displayName?: string };
  receiver?: { username: string; displayName?: string };
}

export default function CapsulesPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [received, setReceived] = useState<Capsule[]>([]);
  const [sent, setSent] = useState<Capsule[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTriggerTime, setNewTriggerTime] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadCapsules();
  }, [isAuthenticated]);

  const loadCapsules = async () => {
    try {
      const [r, s] = await Promise.all([
        capsuleApi.received(token!),
        capsuleApi.sent(token!),
      ]);
      setReceived(r.capsules);
      setSent(s.capsules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (id: string) => {
    try {
      await capsuleApi.open(id, token!);
      loadCapsules();
    } catch (err: any) {
      const openErr = err.message;
      alert(openErr ? (/^[\x00-\x7F]+$/.test(openErr) || openErr.includes("database") ? "操作失败，请稍后重试" : openErr) : "操作失败");
    }
  };

  const handleCreate = async () => {
    if (!newContent.trim() || !newTriggerTime) return;
    
    setCreating(true);
    try {
      const { pairs } = await pairApi.list(token!);
      if (!pairs || pairs.length === 0) {
        setNotification('请先创建配对');
        return;
      }
      
      // 如果有多个配对，选择第一个活跃的
      const activePairs = pairs.filter((p: any) => p.status === 'active');
      const pair = activePairs[0] || pairs[0];
      const receiverId = pair.userA.id === user?.id ? pair.userB.id : pair.userA.id;
      
      await capsuleApi.create({
        pairId: pair.id,
        receiverId,
        content: newContent,
        triggerTime: new Date(newTriggerTime).toISOString(),
      }, token!);
      
      setShowCreateModal(false);
      setNewContent('');
      setNewTriggerTime('');
      loadCapsules();
    } catch (err: any) {
      const createErr = err.message;
      alert(createErr ? (/^[\x00-\x7F]+$/.test(createErr) || createErr.includes("database") ? "创建失败，请稍后重试" : createErr) : "创建失败");
    } finally {
      setCreating(false);
    }
  };

  const getCountdown = (triggerTime: string) => {
    const now = new Date();
    const target = new Date(triggerTime);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}天后送达`;
    if (hours > 0) return `${hours}小时后送达`;
    return `${minutes}分钟后送达`;
  };

  if (!isAuthenticated) return null;

  const capsules = activeTab === 'received' ? received : sent;

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700">
      <header className="sticky top-0 z-10 glass-strong">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-600 transition-colors text-gray-400 hover:text-white btn-tap">
              <BackIcon size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">时间胶囊</h1>
          </div>
          <GradientButton onClick={() => setShowCreateModal(true)} size="sm">
            + 创建
          </GradientButton>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Tabs */}
        <FadeIn>
          <GlassCard className="p-1 mb-6" variant="dark">
            <div className="flex">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 btn-tap ${
                  activeTab === 'received' 
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-400/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                收到的 ({received.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 btn-tap ${
                  activeTab === 'sent' 
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-400/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                发送的 ({sent.length})
              </button>
            </div>
          </GlassCard>
        </FadeIn>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-dark-600/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : capsules.length === 0 ? (
          <EmptyState
            icon={<CapsuleIcon size={36} color="#ffd700" />}
            title={activeTab === 'received' ? '还没有收到时间胶囊' : '还没有发送时间胶囊'}
            description={activeTab === 'received' ? '等待 ta 给你写一封来自过去的信' : '给 ta 写一封来自未来的信'}
            action={{ label: '创建时间胶囊', onClick: () => setShowCreateModal(true) }}
          />
        ) : (
          <div className="space-y-4">
            {capsules.map((capsule, index) => (
              <SlideIn key={capsule.id} delay={index * 100}>
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        capsule.status === 'pending' ? 'bg-yellow-500 animate-pulse' : 
                        capsule.status === 'delivered' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <Tag variant={
                        capsule.status === 'pending' ? 'warning' : 
                        capsule.status === 'delivered' ? 'success' : 'primary'
                      }>
                        {capsule.status === 'pending' ? '等待中' : capsule.status === 'delivered' ? '已送达' : '已读'}
                      </Tag>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(capsule.triggerTime).toLocaleDateString()}
                    </span>
                  </div>

                  {capsule.status === 'pending' && (
                    <div className="mb-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <span className="text-yellow-400 text-sm">
                        ⏳ {getCountdown(capsule.triggerTime)}
                      </span>
                    </div>
                  )}
                  
                  {capsule.status === 'read' ? (
                    <GlassCard className="p-4 border-l-4 border-l-pink-400" variant="dark">
                      <p className="text-white text-sm leading-relaxed">{capsule.content}</p>
                      <p className="text-gray-500 text-xs mt-3">
                        写入于 {new Date(capsule.createdAt).toLocaleDateString()}
                      </p>
                    </GlassCard>
                  ) : capsule.status === 'delivered' && activeTab === 'received' ? (
                    <GradientButton fullWidth onClick={() => handleOpen(capsule.id)}>
                      💌 打开时间胶囊
                    </GradientButton>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 mx-auto mb-2 bg-dark-700/50 rounded-xl flex items-center justify-center glass">
                        <span className="text-xl">🔒</span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        {capsule.status === 'pending' ? '胶囊还未送达' : '等待对方打开'}
                      </p>
                    </div>
                  )}
                </GlassCard>
              </SlideIn>
            ))}
          </div>
        )}
      </div>

      {/* 创建弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-sm p-6 animate-scale-in" variant="dark">
            <h3 className="text-lg font-semibold text-white mb-4">创建时间胶囊</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">内容</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="你想对未来说什么..."
                  className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-400/50 resize-none h-24"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">送达时间</label>
                <input
                  type="datetime-local"
                  value={newTriggerTime}
                  onChange={(e) => setNewTriggerTime(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-pink-400/50"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-dark-600/50 text-gray-400 rounded-xl hover:bg-dark-600 transition-all active:scale-95"
              >
                取消
              </button>
              <GradientButton
                onClick={handleCreate}
                disabled={!newContent.trim() || !newTriggerTime || creating}
                loading={creating}
                className="flex-1"
              >
                创建
              </GradientButton>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
