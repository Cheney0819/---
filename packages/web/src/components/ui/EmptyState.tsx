'use client';

import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 mb-4 bg-dark-600/30 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <p className="text-gray-400 font-medium mb-2">{title}</p>
      {description && <p className="text-gray-500 text-sm mb-4">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
