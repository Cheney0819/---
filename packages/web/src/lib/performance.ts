import React, { useState, useEffect } from 'react';
// 性能优化工具

// 1. 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 2. 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 3. 图片懒加载
export function useLazyLoad(ref: React.RefObject<HTMLElement>, callback: () => void) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref, callback]);

  return isVisible;
}

// 4. 内存缓存
const cache = new Map<string, { data: any; timestamp: number }>();

export function getCachedData(key: string, maxAge: number = 5 * 60 * 1000): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.data;
  }
  return null;
}

export function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// 5. 请求缓存
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  cacheTime: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = getCachedData(cacheKey, cacheTime);
  
  if (cached) {
    return cached;
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  setCachedData(cacheKey, data);
  return data;
}
