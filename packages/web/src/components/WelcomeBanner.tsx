'use client';

import React from 'react';
import { GradientText } from '@/components/motion';
import { HeartIcon } from '@/components/icons';

interface WelcomeBannerProps {
  username: string;
  startDate?: Date;
  onSetDate?: () => void;
}

export function WelcomeBanner({ username, startDate, onSetDate }: WelcomeBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-600/50 to-dark-700/50 border border-gray-700/30 p-6">
      {/* 装饰背景 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-teal/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-pink/10 rounded-full blur-2xl" />
      
      <div className="relative">
        <p className="text-gray-400 text-sm mb-1">{getGreeting()}，</p>
        <h2 className="text-2xl font-bold text-white mb-2">
          {username}
        </h2>
        
        {startDate ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <HeartIcon size={14} color="#f472b6" />
            <span>始于 {startDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        ) : (
          <button 
            onClick={onSetDate}
            className="flex items-center gap-2 text-gray-500 text-sm hover:text-primary-teal transition-colors"
          >
            <HeartIcon size={14} color="#6b7280" />
            <span>设置在一起的日期</span>
          </button>
        )}
      </div>
    </div>
  );
}
