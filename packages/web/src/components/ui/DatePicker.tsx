'use client';

import React, { useState } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  min?: string;
  max?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = '选择日期',
  label,
  min,
  max,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-gray-400 text-sm mb-2 ml-1">{label}</label>
      )}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="w-full px-5 py-4 bg-dark-600/50 border border-gray-700/50 rounded-2xl text-white focus:outline-none focus:border-primary-teal/50 focus:bg-dark-600 transition-all duration-300 cursor-pointer"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

// 日期时间选择器
interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  min?: string;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  min,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-gray-400 text-sm mb-2 ml-1">{label}</label>
      )}
      <div className="relative">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          className="w-full px-5 py-4 bg-dark-600/50 border border-gray-700/50 rounded-2xl text-white focus:outline-none focus:border-primary-teal/50 focus:bg-dark-600 transition-all duration-300 cursor-pointer"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
      </div>
    </div>
  );
};
