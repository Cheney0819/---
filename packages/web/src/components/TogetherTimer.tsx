'use client';

import { useEffect, useState } from 'react';

interface TogetherTimerProps {
  startDate: Date;
  className?: string;
}

export const TogetherTimer: React.FC<TogetherTimerProps> = ({ startDate, className = '' }) => {
  const [timeElapsed, setTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeElapsed({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    
    return () => clearInterval(interval);
  }, [startDate]);

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <TimeUnit value={timeElapsed.days} label="天" />
      <Separator />
      <TimeUnit value={timeElapsed.hours} label="时" />
      <Separator />
      <TimeUnit value={timeElapsed.minutes} label="分" />
      <Separator />
      <TimeUnit value={timeElapsed.seconds} label="秒" />
    </div>
  );
};

const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 bg-gradient-to-br from-primary-teal/20 to-primary-pink/20 rounded-xl flex items-center justify-center border border-primary-teal/30">
      <span className="text-2xl font-bold text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-xs text-gray-500 mt-2">{label}</span>
  </div>
);

const Separator: React.FC = () => (
  <span className="text-2xl font-bold text-primary-teal/50 mt-[-20px]">:</span>
);
