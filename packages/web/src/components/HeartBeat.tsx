'use client';

import React from 'react';

export default function HeartBeat({ size = 24, color = '#f472b6' }: { size?: number; color?: string }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size + 8, height: size + 8 }}>
      {/* 光晕 */}
      <div 
        className="absolute rounded-full animate-heartbeat-glow"
        style={{ 
          width: size * 1.8, 
          height: size * 1.8, 
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
        }} 
      />
      {/* 心形 */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill={color}
        className="animate-heartbeat relative z-10 drop-shadow-lg"
        style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </div>
  );
}
