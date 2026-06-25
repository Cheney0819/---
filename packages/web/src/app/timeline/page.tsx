'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { messageApi, capsuleApi, pairApi } from '@/lib/api';
import { FadeIn, SlideIn } from '@/components/motion';
import { BackIcon, TimelineIcon, CapsuleIcon, DiaryIcon, MilestoneIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';

interface TimelineItem {
  id: string;
  type: 'message' | 'capsule' | 'diary' | 'milestone';
  timestamp: string;
  content: string;
  title?: string;
}

export default function TimelinePage() {
  const { token, isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadTimeline();
  }, [isAuthenticated]);

  const loadTimeline = async () => {
    try {
      // 获取所有数据
      const pairsData = await pairApi.list(token!);

      if (!pairsData.pairs?.length) {
        setLoading(false);
        return;
      }

      const pairId = pairsData.pairs[0].id;
      
      const [messagesData, capsulesData] = await Promise.all([
        messageApi.list(pairId, token!),
        capsuleApi.received(token!),
      ]);

      // 合并所有数据
      const allItems: TimelineItem[] = [];

      // 添加消息
      messagesData.messages?.forEach((msg: any) => {
        allItems.push({
          id: msg.id,
          type: 'message',
          timestamp: msg.createdAt,
          content: msg.content,
        });
      });

      // 添加胶囊
      capsulesData.capsules?.forEach((capsule: any) => {
        allItems.push({
          id: capsule.id,
          type: 'capsule',
          timestamp: capsule.createdAt,
          content: capsule.content,
          title: '时间胶囊',
        });
      });

      // 检测里程碑
      const messageCount = messagesData.messages?.length || 0;
      if (messageCount >= 100) {
        allItems.push({
          id: 'milestone-100',
          type: 'milestone',
          timestamp: new Date().toISOString(),
          content: '第100条消息',
          title: '里程碑',
        });
      }

      // 按时间排序
      allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setItems(allItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'capsule': return <CapsuleIcon size={14} color="#fbbf24" />;
      case 'diary': return <DiaryIcon size={14} color="#ec4899" />;
      case 'milestone': return <MilestoneIcon size={14} color="#f472b6" />;
      default: return <span className="text-xs">💬</span>;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'capsule': return 'bg-yellow-500/20 text-yellow-400';
      case 'diary': return 'bg-pink-500/20 text-pink-400';
      case 'milestone': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-primary-teal/20 text-primary-teal';
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
          <div className="flex items-center gap-2">
            <TimelineIcon size={22} color="#667eea" />
            <h1 className="text-xl font-bold text-white">记忆时间轴</h1>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-dark-600/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <FadeIn>
            <GlassCard className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-dark-600/30 rounded-2xl flex items-center justify-center">
                <TimelineIcon size={36} color="#667eea" />
              </div>
              <p className="text-gray-400 font-medium">还没有记忆</p>
            </GlassCard>
          </FadeIn>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <SlideIn key={item.id} direction="up" delay={index * 150}>
                <div className="relative flex">
                  {/* 左侧时间线 */}
                  <div className="w-24 flex-shrink-0 relative">
                    <div className={`absolute right-0 top-4 w-3 h-3 rounded-full ${item.type === 'milestone' ? 'bg-pink-500' : 'bg-primary-teal'} relative`}>
                      <div className={`absolute inset-0 rounded-full ${item.type === 'milestone' ? 'bg-pink-500' : 'bg-primary-teal'} animate-ping opacity-30`} />
                    </div>
                    {index < items.length - 1 && (
                      <div className="absolute right-1.5 top-7 bottom-0 w-px bg-gradient-to-b from-primary-teal/50 to-transparent" />
                    )}
                  </div>

                  {/* 右侧内容 */}
                  <div className="flex-1 pb-6">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-primary-teal">
                        {new Date(item.timestamp).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-600 ml-2">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <GlassCard className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${getIconBg(item.type)}`}>
                          {getIcon(item.type)}
                        </div>
                        {item.title && (
                          <span className="text-xs font-medium text-primary-gold">{item.title}</span>
                        )}
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">{item.content}</p>
                    </GlassCard>
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
