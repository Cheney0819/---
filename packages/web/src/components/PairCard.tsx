'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MessageIcon } from '@/components/icons';

interface PairCardProps {
  pair: {
    id: string;
    userA: { id: string; username: string; displayName?: string };
    userB: { id: string; username: string; displayName?: string };
  };
  currentUserId: string;
  index: number;
}

const PairCard: React.FC<PairCardProps> = React.memo(({ pair, currentUserId, index }) => {
  const partner = pair.userA.id === currentUserId ? pair.userB : pair.userA;
  const name = partner.displayName || partner.username;
  const initial = name[0].toUpperCase();
  const chatUrl = `/chat/${pair.id}`;

  return (
    <Link
      href={chatUrl}
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <div style={{
        backgroundColor: 'rgba(34, 39, 51, 0.3)',
        border: '1px solid rgba(55, 65, 81, 0.3)',
        borderRadius: '16px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0d1117',
          fontWeight: 'bold',
          fontSize: '20px',
          flexShrink: 0,
        }}>
          {initial}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>@{partner.username}</p>
        </div>
        
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
});

PairCard.displayName = 'PairCard';

export default PairCard;
