'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from '@/components/icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
    onTyping(false);
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // 发送正在输入状态
    onTyping(e.target.value.length > 0);
    
    // 清除之前的超时
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 3秒后自动停止输入状态
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="sticky bottom-0 bg-dark-800/90 backdrop-blur-xl border-t border-gray-800/50">
      <div className="max-w-lg mx-auto px-4 py-3 flex gap-3 items-center">
        {/* 输入框 */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            disabled={disabled}
            className="w-full px-5 py-3.5 bg-dark-600/50 border border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-teal/50 focus:bg-dark-600 transition-all duration-300 pr-12"
          />
          {/* 字数统计 */}
          {message.length > 0 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
              {message.length}
            </span>
          )}
        </div>
        
        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 btn-tap ${
            message.trim() && !disabled
              ? 'bg-gradient-to-r from-primary-teal to-primary-teal/80 text-dark-900 shadow-lg shadow-primary-teal/25 hover:shadow-xl hover:shadow-primary-teal/30'
              : 'bg-dark-600/50 text-gray-600'
          }`}
        >
          <SendIcon size={20} />
        </button>
      </div>
    </div>
  );
}
