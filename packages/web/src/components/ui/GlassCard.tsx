'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'dark' | 'light';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = true,
  onClick,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'bg-dark-600/30 border-gray-700/30',
    dark: 'bg-dark-800/50 border-gray-700/20',
    light: 'bg-white/5 border-white/10',
  };

  return (
    <div
      className={`
        rounded-2xl border backdrop-blur-xl
        ${variantClasses[variant]}
        ${hover ? 'transition-all duration-300 hover:bg-dark-600/50 hover:border-gray-600/50 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${onClick ? 'active:scale-[0.98]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// 新拟态卡片
interface NeuCardProps {
  children: React.ReactNode;
  className?: string;
  pressed?: boolean;
}

export const NeuCard: React.FC<NeuCardProps> = ({
  children,
  className = '',
  pressed = false,
}) => {
  return (
    <div
      className={`
        rounded-2xl p-4
        ${pressed 
          ? 'bg-dark-700 shadow-inner' 
          : 'bg-dark-600/50 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(60,60,80,0.1)]'
        }
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
};
