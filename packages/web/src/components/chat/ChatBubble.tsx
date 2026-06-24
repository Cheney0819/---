'use client';

import React from 'react';
import { SlideIn } from '@/components/motion';

interface ChatBubbleProps {
  content: string;
  isMe: boolean;
  timestamp: string;
  readAt?: Date;
  index: number;
}

export function ChatBubble({ content, isMe, timestamp, readAt, index }: ChatBubbleProps) {
  return (
    <SlideIn 
      direction={isMe ? 'right' : 'left'} 
      delay={index < 10 ? index * 50 : 0}
    >
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`max-w-[75%]`}>
          {/* 消息气泡 */}
          <div className={`px-4 py-3 ${
            isMe 
              ? 'bg-gradient-to-br from-primary-teal to-primary-teal/80 text-dark-900 rounded-2xl rounded-tr-md shadow-lg shadow-primary-teal/10' 
              : 'bg-dark-600/80 text-white rounded-2xl rounded-tl-md border border-gray-700/30'
          }`}>
            <p className="text-[15px] leading-relaxed">{content}</p>
          </div>
          
          {/* 时间和状态 */}
          <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <span className="text-gray-500 text-[11px]">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isMe && (
              <span className={`text-[11px] font-medium ${readAt ? 'text-primary-teal' : 'text-gray-500'}`}>
                {readAt ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </SlideIn>
  );
}
