'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ScaleIn } from '@/components/motion';

interface QuickActionButtonProps {
  href: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  color: string;
  delay?: number;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  href,
  icon: Icon,
  label,
  color,
  delay = 0,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <ScaleIn delay={delay}>
      <Link
        href={href}
        className="block relative group"
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        <div
          className={`p-5 bg-dark-600/30 rounded-2xl border border-gray-700/30 transition-all duration-300 group-hover:border-gray-600/50 ${
            isPressed ? 'scale-95' : 'group-hover:scale-[1.02]'
          }`}
        >
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
            <Icon size={26} color="#fff" />
          </div>
          <p className="text-white font-medium text-sm">{label}</p>
        </div>
        
        {/* 悬停光效 */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-white/0 transition-all duration-300 pointer-events-none" />
      </Link>
    </ScaleIn>
  );
};
