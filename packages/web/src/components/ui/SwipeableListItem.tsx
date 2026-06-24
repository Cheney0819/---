'use client';

import React, { useState, useRef } from 'react';

interface SwipeableListItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  children,
  onDelete,
  onEdit,
  className = '',
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = startX.current - e.touches[0].clientX;
    const newOffset = Math.min(Math.max(diff, 0), 150);
    setOffsetX(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX > 100 && onDelete) {
      onDelete();
    } else if (offsetX > 50 && onEdit) {
      setOffsetX(80);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 操作按钮背景 */}
      <div className="absolute right-0 top-0 bottom-0 flex">
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-20 flex items-center justify-center bg-blue-500 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-20 flex items-center justify-center bg-red-500 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        )}
      </div>

      {/* 内容 */}
      <div
        className="relative bg-dark-800 transition-transform duration-200"
        style={{ transform: `translateX(-${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
