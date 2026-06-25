'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { inviteApi, pairApi } from '@/lib/api';
import { FadeIn, SlideIn } from '@/components/motion';
import { BackIcon, ShieldIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';

export default function SearchPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [code, setCode] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = async () => {
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    setFoundUser(null);
    
    try {
      const { user: found, error: err } = await inviteApi.findByCode(code.toUpperCase(), token!);
      if (err) {
        setError(err);
      } else {
        setFoundUser(found);
      }
    } catch (err: any) {
      setError(err.message ? (/^[\x00-\x7F]+$/.test(err.message) || err.message.includes("database") ? "查找失败，请稍后重试" : err.message) : "查找失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePair = async () => {
    if (!foundUser) return;
    setPairing(true);
    try {
      await pairApi.create(foundUser.id, token!);
      router.push('/dashboard');
    } catch (err: any) {
      const pairErr = err.message;
      alert(pairErr ? (/^[\x00-\x7F]+$/.test(pairErr) || pairErr.includes("database") ? "配对失败，请稍后重试" : pairErr) : "配对失败");
    } finally {
      setPairing(false);
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
          <h1 className="text-xl font-bold text-white">配对</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* 我的识别码 */}
        <FadeIn>
          <GlassCard className="p-6 mb-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">我的识别码</p>
              <p className="text-3xl font-bold text-primary-teal tracking-widest">
                {user?.inviteCode || "加载中..."}
              </p>
              <p className="text-gray-500 text-xs mt-2">将此识别码分享给对方</p>
            </div>
          </GlassCard>
        </FadeIn>

        {/* 输入识别码 */}
        <FadeIn delay={100}>
          <GlassCard className="p-6 mb-6">
            <p className="text-gray-400 text-sm mb-4">输入对方的识别码</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="输入8位识别码"
                maxLength={8}
                className="flex-1 px-4 py-3 bg-dark-600/50 border border-gray-700/50 rounded-xl text-white text-center text-lg tracking-widest placeholder-gray-500 focus:outline-none focus:border-primary-teal/50 transition-all duration-300 font-mono"
              />
              <GradientButton onClick={handleSearch} disabled={loading || !code.trim()} size="sm">
                {loading ? '查找中...' : '查找'}
              </GradientButton>
            </div>
            
            {error && (
              <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
            )}
          </GlassCard>
        </FadeIn>

        {/* 查找结果 */}
        {foundUser && (
          <FadeIn delay={200}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-teal to-primary-pink flex items-center justify-center text-dark-900 font-bold text-2xl">
                  {(foundUser.displayName || foundUser.username)[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">{foundUser.displayName || foundUser.username}</p>
                  <p className="text-gray-500 text-sm">@{foundUser.username}</p>
                </div>
              </div>
              
              <GradientButton 
                onClick={handlePair} 
                fullWidth 
                disabled={pairing}
                className="mt-4"
              >
                <div className="flex items-center justify-center gap-2">
                  <ShieldIcon size={18} />
                  <span>{pairing ? '配对中...' : '确认配对'}</span>
                </div>
              </GradientButton>
            </GlassCard>
          </FadeIn>
        )}
      </div>
    </main>
  );
}
