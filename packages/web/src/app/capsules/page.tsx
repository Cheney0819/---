'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { capsuleApi, pairApi } from '@/lib/api';
import { useEncryption } from '@/contexts/EncryptionContext';
import { FadeIn, ScaleIn, SlideIn } from '@/components/motion';
import { BackIcon, CapsuleIcon, HeartIcon, SendIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Tag } from '@/components/ui/Tag';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { CapsuleReveal } from '@/components/capsule/CapsuleReveal';

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
  const { encrypt } = useEncryption();
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
      alert(err.message);
    }
  };

  const handleCreate = async () => {
    if (!newContent.trim() || !newTriggerTime) return;
    
    setCreating(true);
    try {
      // 获取配对信息
      const { pairs } = await pairApi.list(token!);
      if (!pairs || pairs.length === 0) {
        alert('请先创建配对');
        return;
      }
      
      const pair = pairs[0];
      const receiverId = pair.userA.id === user?.id ? pair.userB.id : pair.userA.id;
      
      // 创建时间胶囊
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
      alert(err.message || '创建失败');
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
            <div className="flex items-center gap-2">
              <CapsuleIcon size={22} color="#ffd700" />
              <h1 className="text-xl font-bold text-white">时间胶囊</h1>
            </div>
          </div>
          <GradientButton
            onClick={() => setShowCreateModal(true)}
            size="sm"
          >
            <div className="flex items-center gap-1">
              <span>+</span>
              <span>创建</span>
            </div>
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
                    ? 'bg-gradient-to-r from-primary-teal to-primary-teal/80 text-dark-900 shadow-lg shadow-primary-teal/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                收到的 ({received.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 btn-tap ${
                  activeTab === 'sent' 
                    ? 'bg-gradient-to-r from-primary-teal to-primary-teal/80 text-dark-900 shadow-lg shadow-primary-teal/20' 
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
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : capsules.length === 0 ? (
          <FadeIn delay={200}>
            <GlassCard className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-dark-600/30 rounded-2xl flex items-center justify-center glass">
                <CapsuleIcon size={36} color="#ffd700" />
              </div>
              <p className="text-gray-400 font-medium mb-2">
                {activeTab === 'received' ? '还没有收到时间胶囊' : '还没有发送时间胶囊'}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                {activeTab === 'received' ? '等待 ta 给你写一封来自过去的信' : '给 ta 写一封来自未来的信'}
              </p>
              <GradientButton
                onClick={() => setShowCreateModal(true)}
                size="sm"
              >
                创建时间胶囊
              </GradientButton>
            </GlassCard>
          </FadeIn>
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

                  {/* 倒计时 */}
                  {capsule.status === 'pending' && (
                    <div className="mb-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-sm">⏳</span>
                        <span className="text-yellow-400 text-sm">
                          {getCountdown(capsule.triggerTime)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {capsule.status === 'read' ? (
                    <GlassCard className="p-4 border-l-4 border-l-primary-pink" variant="dark">
                      <p className="text-white text-sm leading-relaxed">{capsule.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-gray-500 text-xs">
                          写入于 {new Date(capsule.createdAt).toLocaleDateString()}
                        </p>
                        {capsule.sender && (
                          <p className="text-gray-500 text-xs">
                            来自 {capsule.sender.displayName || capsule.sender.username}
                          </p>
                        )}
                      </div>
                    </GlassCard>
                  ) : capsule.status === 'delivered' && activeTab === 'received' ? (
                    <div>
                      <div className="text-center mb-4 p-6 bg-gradient-to-br from-primary-teal/10 to-primary-pink/10 rounded-2xl">
                        <div className="text-4xl mb-2">💌</div>
                        <p className="text-white font-medium">时间胶囊已送达</p>
                        <p className="text-gray-400 text-sm mt-1">点击下方按钮查看内容</p>
                      </div>
                      <GradientButton
                        fullWidth
                        onClick={() => handleOpen(capsule.id)}
                        variant="primary"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <HeartIcon size={16} />
                          <span>打开时间胶囊</span>
                        </div>
                      </GradientButton>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto mb-3 bg-dark-700/50 rounded-2xl flex items-center justify-center glass">
                        <span className="text-2xl">🔒</span>
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

      {/* 创建时间胶囊弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-sm p-6 animate-scale-in" variant="dark">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">💌</div>
              <h3 className="text-lg font-semibold text-white">创建时间胶囊</h3>
              <p className="text-gray-400 text-sm mt-1">写一封给未来的信</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">内容</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="你想对未来说什么..."
                  className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-teal/50 transition-all duration-300 resize-none h-32 input-focus"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">送达时间</label>
                <input
                  type="datetime-local"
                  value={newTriggerTime}
                  onChange={(e) => setNewTriggerTime(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-primary-teal/50 transition-all duration-300 input-focus"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-dark-600/50 text-gray-400 rounded-xl hover:bg-dark-600 transition-all duration-200 active:scale-95 btn-tap"
              >
                取消
              </button>
              <GradientButton
                onClick={handleCreate}
                disabled={!newContent.trim() || !newTriggerTime || creating}
                loading={creating}
                className="flex-1"
              >
                <div className="flex items-center justify-center gap-2">
                  <SendIcon size={16} />
                  <span>发送</span>
                </div>
              </GradientButton>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
