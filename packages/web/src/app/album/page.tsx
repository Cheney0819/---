'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { albumApi } from '@/lib/api';
import { FadeIn, ScaleIn } from '@/components/motion';
import { BackIcon, AlbumIcon, UploadIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Skeleton } from '@/components/ui/Skeleton';

interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: string;
  uploader: { username: string; displayName?: string };
  createdAt: string;
}

interface Album {
  id: string;
  name: string;
  media: Photo[];
  _count: { media: number };
}

export default function AlbumPage() {
  const { token, isAuthenticated } = useAuthStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadAlbums();
  }, [isAuthenticated]);

  const loadAlbums = async () => {
    try {
      const { albums } = await albumApi.list(token!);
      setAlbums(albums);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    try {
      await albumApi.create(newAlbumName, token!);
      setNewAlbumName('');
      setShowCreateModal(false);
      loadAlbums();
    } catch (err) {
      console.error(err);
    }
  };

  const photoColors = [
    'from-blue-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-indigo-500 to-blue-500',
    'from-teal-500 to-cyan-500',
  ];

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700">
      <header className="sticky top-0 z-10 glass-strong">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-dark-600 transition-colors text-gray-400 hover:text-white btn-tap">
              <BackIcon size={20} />
            </button>
            <div className="flex items-center gap-2">
              <AlbumIcon size={22} color="#4ade80" />
              <h1 className="text-xl font-bold text-white">共享相册</h1>
            </div>
          </div>
          <GradientButton onClick={() => setShowCreateModal(true)} size="sm">
            + 新建
          </GradientButton>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <FadeIn>
            <GlassCard className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-dark-600/30 rounded-2xl flex items-center justify-center">
                <AlbumIcon size={36} color="#4ade80" />
              </div>
              <p className="text-gray-400 font-medium">还没有相册</p>
              <p className="text-gray-500 text-sm mt-1">创建第一个相册</p>
            </GlassCard>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {albums.map((album, index) => (
              <ScaleIn key={album.id} delay={index * 100}>
                <GlassCard className="p-4 cursor-pointer" hover>
                  <div className={`aspect-square rounded-xl mb-3 overflow-hidden ${photoColors[index % photoColors.length]} flex items-center justify-center`}>
                    {album._count.media > 0 ? (
                      <AlbumIcon size={32} color="rgba(255,255,255,0.5)" />
                    ) : (
                      <span className="text-white/50 text-4xl">📷</span>
                    )}
                  </div>
                  <p className="text-white font-medium truncate">{album.name}</p>
                  <p className="text-gray-500 text-xs">{album._count.media} 张照片</p>
                </GlassCard>
              </ScaleIn>
            ))}
          </div>
        )}
      </div>

      {/* 创建相册弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-sm p-6 animate-scale-in" variant="dark">
            <h3 className="text-lg font-semibold text-white mb-4">创建相册</h3>
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="相册名称"
              className="w-full px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-teal/50 transition-all duration-300"
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-dark-600/50 text-gray-400 rounded-xl hover:bg-dark-600 transition-all duration-200 active:scale-95 btn-tap">取消</button>
              <GradientButton onClick={handleCreateAlbum} disabled={!newAlbumName.trim()} className="flex-1">创建</GradientButton>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
