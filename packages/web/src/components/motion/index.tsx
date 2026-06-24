'use client';

import React, { useEffect, useState } from 'react';

// 淡入动画
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// 滑入动画
export const SlideIn: React.FC<{
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}> = ({ children, direction = 'up', delay = 0, className = '' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const transforms: Record<string, string> = {
    left: 'translate-x-0',
    right: 'translate-x-0',
    up: 'translate-y-0',
    down: 'translate-y-0',
  };

  const initialTransforms: Record<string, string> = {
    left: '-translate-x-8',
    right: 'translate-x-8',
    up: 'translate-y-8',
    down: '-translate-y-8',
  };

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? `opacity-100 ${transforms[direction]}` : `opacity-0 ${initialTransforms[direction]}`
      } ${className}`}
    >
      {children}
    </div>
  );
};

// 缩放动画
export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// 渐变文字
export const GradientText: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <span className={`bg-gradient-to-r from-primary-teal to-primary-pink bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
};

// 脉冲动画
export const Pulse: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
};

// 悬停缩放
export const HoverScale: React.FC<{
  children: React.ReactNode;
  scale?: number;
  className?: string;
}> = ({ children, scale = 1.05, className = '' }) => {
  return (
    <div
      className={`transition-transform duration-200 hover:scale-[${scale}] ${className}`}
    >
      {children}
    </div>
  );
};

// 点击反馈
export const TapScale: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`active:scale-95 transition-transform duration-100 ${className}`}>
      {children}
    </div>
  );
};

// 浮动动画
export const Float: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`animate-float ${className}`}>
      {children}
    </div>
  );
};

// 打字效果
export const TypeWriter: React.FC<{
  text: string;
  speed?: number;
  className?: string;
}> = ({ text, speed = 50, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, index + 1));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [index, text, speed]);

  return <span className={className}>{displayedText}<span className="animate-pulse">|</span></span>;
};
