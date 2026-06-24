'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusConfig = {
    online: { color: 'bg-green-500', label: '在线', pulse: true },
    offline: { color: 'bg-gray-500', label: '离线', pulse: false },
    busy: { color: 'bg-red-500', label: '忙碌', pulse: false },
    away: { color: 'bg-yellow-500', label: '离开', pulse: false },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} ${config.color} rounded-full`} />
        {config.pulse && (
          <div className={`absolute inset-0 ${config.color} rounded-full animate-ping opacity-75`} />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-gray-400">{config.label}</span>
      )}
    </div>
  );
};

// 在线用户头像堆叠
interface AvatarStackProps {
  users: Array<{ id: string; name: string; avatar?: string }>;
  max?: number;
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  users,
  max = 3,
  className = '',
}) => {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayUsers.map((user, index) => (
        <div
          key={user.id}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-teal to-primary-pink flex items-center justify-center text-dark-900 text-xs font-bold border-2 border-dark-800"
          style={{ zIndex: max - index }}
        >
          {user.name[0].toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-dark-800">
          +{remaining}
        </div>
      )}
    </div>
  );
};
