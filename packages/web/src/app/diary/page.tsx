'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { diaryApi } from '@/lib/api';
import { FadeIn, SlideIn } from '@/components/motion';
import { BackIcon, DiaryIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Tag } from '@/components/ui/Tag';
import { SwipeableListItem } from '@/components/ui/SwipeableListItem';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface DiaryEntry {
  id: string;
  content: string;
  mood?: string;
  author: { id: string; username: string; displayName?: string };
  createdAt: string;
}

interface Diary {
  id: string;
  title: string;
  entries: DiaryEntry[];
}

export default function DiaryPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [currentDiary, setCurrentDiary] = useState<Diary | null>(null);
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadDiary();
  }, [isAuthenticated]);

  const loadDiary = async () => {
    try {
      const { diaries } = await diaryApi.list(token!);
      setDiaries(diaries);
      if (diaries.length > 0) {
        setCurrentDiary(diaries[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim() || sending) return;

    setSending(true);
    try {
      // 如果没有日记，先创建
      if (!currentDiary) {
        const { diary } = await diaryApi.create('我们的日记', token!);
        setCurrentDiary(diary);
        
        const { entry } = await diaryApi.addEntry(diary.id, newEntry, mood || undefined, token!);
        setCurrentDiary({ ...diary, entries: [entry, ...diary.entries] });
      } else {
        const { entry } = await diaryApi.addEntry(currentDiary.id, newEntry, mood || undefined, token!);
        setCurrentDiary({ 
          ...currentDiary, 
          entries: [entry, ...currentDiary.entries] 
        });
      }
      
      setNewEntry('');
      setMood('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await diaryApi.deleteEntry(entryId, token!);
      if (currentDiary) {
        setCurrentDiary({
          ...currentDiary,
          entries: currentDiary.entries.filter(e => e.id !== entryId),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moods = ['开心', '感动', '幸福', '平静', '思念', '期待'];

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700">
      <header className="sticky top-0 z-10 glass-strong">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-600 transition-colors text-gray-400 hover:text-white btn-tap">
            <BackIcon size={20} />
          </button>
          <div className="flex items-center gap-2">
            <DiaryIcon size={22} color="#f472b6" />
            <h1 className="text-xl font-bold text-white">共享日记</h1>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-4">
        {/* 新建日记 */}
        <FadeIn>
          <GlassCard className="mb-6 p-4">
            <form onSubmit={handleSend}>
              <textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="写点什么..."
                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none h-24 text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/30">
                <div className="flex gap-2 flex-wrap">
                  {moods.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(mood === m ? '' : m)}
                      className={`px-3 py-1 rounded-full text-xs transition-all duration-200 btn-tap ${
                        mood === m 
                          ? 'bg-primary-pink text-white' 
                          : 'bg-dark-700/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <GradientButton
                  size="sm"
                  disabled={!newEntry.trim() || sending}
                  loading={sending}
                >
                  写入
                </GradientButton>
              </div>
            </form>
          </GlassCard>
        </FadeIn>

        {/* 日记列表 */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : !currentDiary || currentDiary.entries.length === 0 ? (
          <FadeIn delay={200}>
            <GlassCard className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-dark-600/30 rounded-2xl flex items-center justify-center">
                <DiaryIcon size={36} color="#f472b6" />
              </div>
              <p className="text-gray-400 font-medium">还没有日记</p>
              <p className="text-gray-500 text-sm mt-1">写下你们的故事</p>
            </GlassCard>
          </FadeIn>
        ) : (
          <div className="space-y-4">
            {currentDiary.entries.map((entry, index) => (
              <SlideIn key={entry.id} delay={index * 100}>
                <SwipeableListItem onDelete={() => handleDeleteEntry(entry.id)}>
                  <GlassCard className="p-4 border-l-4 border-l-primary-pink">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-primary-teal text-xs font-medium">
                        {entry.author.displayName || entry.author.username}
                      </span>
                      <div className="flex items-center gap-2">
                        {entry.mood && (
                          <Tag variant="primary">{entry.mood}</Tag>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">{entry.content}</p>
                  </GlassCard>
                </SwipeableListItem>
              </SlideIn>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
