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

interface DiaryComment {
  id: string;
  content: string;
  author: { id: string; username: string; displayName?: string };
  createdAt: string;
}

interface Diary {
  id: string;
  title: string;
  entries: DiaryEntry[];
}

// 情绪 → emoji 映射
const MOOD_EMOJI: Record<string, string> = {
  '开心': '😊',
  '感动': '😭',
  '幸福': '🥰',
  '平静': '😌',
  '思念': '💭',
  '期待': '✨',
  '愤怒': '😤',
  '惊讶': '😲',
};

export default function DiaryPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [currentDiary, setCurrentDiary] = useState<Diary | null>(null);
  const [newEntry, setNewEntry] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState<Record<string, DiaryComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
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
      if (!currentDiary) {
        const { diary } = await diaryApi.create('我们的日记', token!);
        setCurrentDiary(diary);

        const { entry } = await diaryApi.addEntry(diary.id, newEntry, mood || undefined, token!);
        setCurrentDiary({ ...diary, entries: [entry, ...diary.entries] });
      } else {
        const { entry } = await diaryApi.addEntry(currentDiary.id, newEntry, mood || undefined, token!);
        setCurrentDiary({
          ...currentDiary,
          entries: [entry, ...currentDiary.entries],
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

  // ---- 评论相关 ----

  const loadComments = async (entryId: string) => {
    setCommentLoading(prev => ({ ...prev, [entryId]: true }));
    try {
      const res = await fetch(`/api/diaries/entries/${entryId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('加载评论失败');
      const data = await res.json();
      setComments(prev => ({ ...prev, [entryId]: data.comments || [] }));
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(prev => ({ ...prev, [entryId]: false }));
    }
  };

  const handleSubmitComment = async (entryId: string) => {
    const content = (commentInputs[entryId] || '').trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/diaries/entries/${entryId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('发表失败');
      const data = await res.json();
      setComments(prev => ({
        ...prev,
        [entryId]: prev[entryId] ? [...prev[entryId], data.comment] : [data.comment],
      }));
      setCommentInputs(prev => ({ ...prev, [entryId]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (entryId: string, commentId: string) => {
    try {
      const res = await fetch(`/api/diaries/entries/${entryId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('删除失败');
      setComments(prev => ({
        ...prev,
        [entryId]: (prev[entryId] || []).filter(c => c.id !== commentId),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const moods = ['开心', '感动', '幸福', '平静', '思念', '期待', '愤怒', '惊讶'];

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
                      {MOOD_EMOJI[m] ?? ''} {m}
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
                          <Tag variant="primary">
                            {(MOOD_EMOJI[entry.mood] ?? '') + ' ' + entry.mood}
                          </Tag>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">{entry.content}</p>

                    {/* 评论区 */}
                    <div className="mt-4 pt-3 border-t border-gray-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => loadComments(entry.id)}
                          className="text-xs text-gray-400 hover:text-primary-pink transition-colors btn-tap"
                        >
                          💬 查看评论
                        </button>
                        {(comments[entry.id] || []).length > 0 && (
                          <span className="text-xs text-gray-500">
                            {comments[entry.id].length} 条
                          </span>
                        )}
                      </div>

                      {comments[entry.id] !== undefined && (
                        <>
                          {commentLoading[entry.id] && (
                            <p className="text-xs text-gray-500 mb-2">加载中...</p>
                          )}

                          <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
                            {(comments[entry.id] || []).map((c) => (
                              <div key={c.id} className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-primary-teal font-medium">
                                    {c.author.displayName || c.author.username}
                                  </span>
                                  <p className="text-xs text-gray-300 break-all">{c.content}</p>
                                  <span className="text-[10px] text-gray-500">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteComment(entry.id, c.id)}
                                  className="text-xs text-gray-500 hover:text-red-400 btn-tap shrink-0"
                                  title="删除评论"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentInputs[entry.id] || ''}
                              onChange={(e) =>
                                setCommentInputs(prev => ({
                                  ...prev,
                                  [entry.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmitComment(entry.id);
                              }}
                              placeholder="写评论..."
                              className="flex-1 bg-dark-700/50 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-pink placeholder-gray-500"
                            />
                            <button
                              onClick={() => handleSubmitComment(entry.id)}
                              className="px-3 py-2 bg-primary-pink text-white text-xs rounded-lg hover:bg-pink-600 transition-colors btn-tap"
                            >
                              发送
                            </button>
                          </div>
                        </>
                      )}
                    </div>
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
