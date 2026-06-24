'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = true,
}) => {
  const baseClasses = 'bg-dark-600/50';
  const animationClasses = animation ? 'animate-pulse' : '';
  
  const variantClasses = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100px'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
    />
  );
};

// 骨架屏组合组件
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-dark-600/30 rounded-2xl p-4 border border-gray-700/20 ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="40%" height={12} className="mt-2" />
      </div>
    </div>
    <Skeleton variant="text" width="100%" height={14} />
    <Skeleton variant="text" width="80%" height={14} className="mt-2" />
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ count = 3, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonMessage: React.FC<{ isMe?: boolean }> = ({ isMe = false }) => (
  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
    <div className={`${isMe ? 'ml-auto' : 'mr-auto'}`}>
      <Skeleton 
        variant="rectangular" 
        width={isMe ? '180px' : '160px'} 
        height={44}
        className="rounded-2xl"
      />
    </div>
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <Skeleton variant="circular" width={size} height={size} />
);
