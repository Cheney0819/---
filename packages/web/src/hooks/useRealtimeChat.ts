'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readAt?: string | null;
  sender?: { id: string; username: string; displayName?: string | null };
  pairId?: string;
}

interface PollResult {
  messages: ChatMessage[];
  readUpdates: { id: string; readAt: string }[];
}

type MessageHandler = (data: { type: string; message?: ChatMessage; pairId?: string }) => void;

export function useRealtimeChat(pairId: string, onMessage: MessageHandler) {
  const lastTsRef = useRef<string>(new Date().toISOString());
  const pollRef = useRef<NodeJS.Timeout>();
  const onMessageRef = useRef<MessageHandler>(onMessage);
  onMessageRef.current = onMessage;
  const visibleRef = useRef(true);

  const poll = useCallback(async () => {
    try {
      const token = localStorage.getItem('shiguangjian-auth');
      if (!token) return;
      const { token: authToken } = JSON.parse(token) as { token: string };

      const since = lastTsRef.current;
      const res = await fetch(`/api/messages/${pairId}/poll?since=${encodeURIComponent(since)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) return;

      const data = await res.json() as PollResult;

      for (const msg of data.messages) {
        onMessageRef.current({ type: 'new_message', message: msg, pairId });
        if (msg.createdAt > lastTsRef.current) {
          lastTsRef.current = msg.createdAt;
        }
      }

      for (const update of data.readUpdates) {
        if (update.readAt && update.readAt > lastTsRef.current) {
          lastTsRef.current = update.readAt;
        }
      }
    } catch {
      // 轮询失败静默，下次重试
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairId]);

  useEffect(() => {
    lastTsRef.current = new Date().toISOString();
    poll();
    pollRef.current = setInterval(poll, 2000);

    const handleVisibilityChange = () => {
      visibleRef.current = !document.hidden;
      if (visibleRef.current) {
        poll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [poll]);

  const sendTyping = useCallback((isTyping: boolean) => {
    // Typing indicator via REST — lightweight, optional
    try {
      const raw = localStorage.getItem('shiguangjian-auth');
      if (!raw) return;
      const { token } = JSON.parse(raw) as { token: string };
      fetch(`/api/messages/${pairId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'typing', isTyping }),
      }).catch(() => {});
    } catch { /* ignore */ }
  }, [pairId]);

  return { sendTyping };
}
