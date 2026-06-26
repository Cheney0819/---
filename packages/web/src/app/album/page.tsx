'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { albumApi, uploadApi } from '@/lib/api';
import { FadeIn, ScaleIn } from '@/components/motion';
import { BackIcon, AlbumIcon, UploadIcon, PhotoIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { UPLOAD_CONSTANTS } from '@/lib/constants';

interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  mediaType?: string;
  category?: { id: string; name: string } | null;
  uploader: { username: string; displayName?: string };
  createdAt: string;
}

type CategoryFilter = 'all' | '旅行' | '日常' | '纪念日';

export default function AlbumPage() {
  const { token, isAuthenticated } = useAuthStore();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: '旅行', label: '旅行' },
    { key: '日常', label: '日常' },
    { key: '纪念日', label: '纪念日' },
  ];

  const filteredPhotos = categoryFilter === 'all'
    ? photos
    : photos.filter(p => p.category?.name === categoryFilter);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadAlbum();
  }, [isAuthenticated]);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || uploading) return;

    if (!(UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setNotification('只支持 JPG/PNG/GIF/WebP 格式的图片');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadApi.file(file, token);
      // 添加到第一个相册
      const { albums } = await albumApi.list(token);
      if (albums && albums.length > 0) {
        // 直接通过 REST API 添加照片到相册
        const { photo } = await albumApi.addPhoto(albums[0].id, result.url, token);
        if (photo) {
          loadAlbum();
        } else {
          // Fallback: if no photo returned, use the URL directly
          setPhotos(prev => [...prev, {
            id: Date.now().toString(),
            url: result.url,
            uploader: { username: '' },
            createdAt: new Date().toISOString(),
          }]);
        }
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setNotification(err.message || '上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

    const loadAlbum = async () => {
    try {
      const { albums } = await albumApi.list(token!);
      if (albums && albums.length > 0) {
        setPhotos(albums[0].media || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            <h1 className="text-xl font-bold text-white">共享相册</h1>
          </div>
          <GradientButton size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <div className="flex items-center gap-1">
              <UploadIcon size={14} />
              <span>上传</span>
            </div>
          </GradientButton>
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES.join(',')}
            onChange={handleUploadPhoto}
            className="hidden"
          />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-4">
        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all card-hover ${
                categoryFilter === cat.key
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'bg-dark-600/40 text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-dark-600/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <EmptyState
            icon={<AlbumIcon size={36} color="#4ade80" />}
            title={categoryFilter === 'all' ? '还没有照片' : '该分类下暂无照片'}
            description={categoryFilter === 'all' ? '上传你们的照片' : '切换到其他分类查看'}
          />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredPhotos.map((photo, index) => (
              <ScaleIn key={photo.id} delay={index * 50}>
                <div className={`aspect-square rounded-xl overflow-hidden relative group cursor-pointer bg-gradient-to-br ${photoColors[index % photoColors.length]} card-hover`}>
                  <img 
                    src={photo.url} 
                    alt="photo" 
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{photo.uploader.displayName || photo.uploader.username}</p>
                  </div>
                </div>
              </ScaleIn>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
