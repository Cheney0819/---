'use client';

import React, { useState, useEffect } from 'react';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, label, className = '' }) => {
  const [open, setOpen] = useState(false);
  const d = value ? new Date(value) : new Date();
  const [y, setY] = useState(d.getFullYear());
  const [m, setM] = useState(d.getMonth() + 1);
  const [day, setDay] = useState(d.getDate());

  const maxDay = new Date(y, m, 0).getDate();
  const safeDay = Math.min(day, maxDay);

  useEffect(() => { if (day > maxDay) setDay(maxDay); }, [maxDay]);
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleOpen = () => {
    if (value) { const [py, pm, pd] = value.split('-').map(Number); setY(py); setM(pm); setDay(pd); }
    setOpen(true);
  };

  const confirm = () => {
    onChange(`${y}-${String(m).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`);
    setOpen(false);
  };

  return (
    <div className={className}>
      {label && <label className="block text-gray-400 text-sm mb-2">{label}</label>}
      
      <button onClick={handleOpen} className="w-full px-5 py-4 bg-dark-600/50 border border-gray-700/50 rounded-2xl text-left transition-all hover:border-primary-teal/30 flex items-center justify-between">
        <span className={value ? 'text-white text-lg' : 'text-gray-500 text-lg'}>{value ? `${y}年${m}月${safeDay}日` : '选择日期'}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* 毛玻璃遮罩 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setOpen(false)} />
          
          {/* 底部面板 */}
          <div className="absolute bottom-0 left-0 right-0 bg-dark-800 rounded-t-[32px]" style={{ animation: 'slideUp 0.3s ease-out' }}>
            {/* 拖拽条 */}
            <div className="flex justify-center pt-4 pb-3">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            
            {/* 标题栏 */}
            <div className="flex justify-between items-center px-8 pb-6">
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-base">取消</button>
              <span className="text-white font-semibold text-base">选择日期</span>
              <button onClick={confirm} className="text-primary-teal font-semibold text-base">确定</button>
            </div>

            {/* 日期预览 */}
            <div className="mx-8 mb-8 py-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(168, 237, 234, 0.08) 0%, rgba(254, 214, 227, 0.05) 100%)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span className="text-[40px] font-bold text-white tracking-wider">
                {y}<span className="text-lg text-gray-500 mx-2">年</span>{m}<span className="text-lg text-gray-500 mx-2">月</span>{safeDay}<span className="text-lg text-gray-500">日</span>
              </span>
            </div>

            {/* 三列选择器 */}
            <div className="flex gap-4 px-8 pb-10">
              <select value={y} onChange={e => setY(+e.target.value)}
                className="flex-1 py-5 bg-dark-700 border border-gray-600/50 rounded-2xl text-white text-center text-xl font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-teal/50 focus:border-primary-teal/50 transition-all">
                {Array.from({length: 41}, (_, i) => <option key={i} value={1990+i}>{1990+i}年</option>)}
              </select>
              
              <select value={m} onChange={e => setM(+e.target.value)}
                className="flex-1 py-5 bg-dark-700 border border-gray-600/50 rounded-2xl text-white text-center text-xl font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-teal/50 focus:border-primary-teal/50 transition-all">
                {Array.from({length: 12}, (_, i) => <option key={i} value={i+1}>{i+1}月</option>)}
              </select>
              
              <select value={safeDay} onChange={e => setDay(+e.target.value)}
                className="flex-1 py-5 bg-dark-700 border border-gray-600/50 rounded-2xl text-white text-center text-xl font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-teal/50 focus:border-primary-teal/50 transition-all">
                {Array.from({length: maxDay}, (_, i) => <option key={i} value={i+1}>{i+1}日</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
