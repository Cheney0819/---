'use client';

import React, { useEffect, useState } from 'react';

interface CollapseEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function CollapseEffect({ isActive, onComplete }: CollapseEffectProps) {
  const [phase, setPhase] = useState<'idle' | 'expand' | 'cover' | 'done'>('idle');

  useEffect(() => {
    if (isActive) {
      // Phase 1: 膨胀 (0-400ms)
      setPhase('expand');
      
      // Phase 2: 覆盖 (400-700ms)
      setTimeout(() => setPhase('cover'), 400);
      
      // Phase 3: 完成 (700ms)
      setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 700);
    }
  }, [isActive, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* 膨胀层 - 使用 transform 优化性能 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b3d 50%, #1a0a2e 100%)',
          transform: phase === 'expand' ? 'scale(1)' : 'scale(0.01)',
          opacity: phase === 'done' ? 0 : 1,
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          willChange: 'transform, opacity',
        }}
      />

      {/* 中心光点 */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: '8px',
          height: '8px',
          background: 'radial-gradient(circle, #fff 0%, rgba(180,120,255,0.6) 50%, transparent 100%)',
          boxShadow: '0 0 30px 15px rgba(180,120,255,0.3)',
          transform: phase === 'expand' ? 'scale(0)' : 'scale(1)',
          opacity: phase === 'expand' ? 0 : 1,
          transition: 'transform 0.3s ease, opacity 0.2s ease',
        }}
      />
    </div>
  );
}
