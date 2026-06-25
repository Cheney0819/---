'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { WS_CONSTANTS } from '@/lib/constants';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (data: WebSocketMessage) => void;

export function useWebSocket(onMessage: MessageHandler) {
  const { user, token, isAuthenticated } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef<MessageHandler>(onMessage);
  onMessageRef.current = onMessage;

  // Fix: 前端主动发送心跳 pong，避免被服务端踢掉
  const sendHeartbeat = useCallback((ws: WebSocket) => {
    if (ws.readyState === WebSocket.OPEN) {
      // 浏览器 WebSocket 会自动响应 ping，但也主动发 pong 保持活跃
      ws.send(JSON.stringify({ type: 'ping' }));
    }
    heartbeatTimerRef.current = setTimeout(
      () => sendHeartbeat(ws),
      WS_CONSTANTS.HEARTBEAT_INTERVAL_MS
    );
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // 发送 token 进行认证
      ws.send(JSON.stringify({ type: 'auth', token }));
      // 启动心跳
      sendHeartbeat(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Fix: 处理服务端 ping，回复 pong
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        
        onMessageRef.current(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // 清除心跳定时器
      if (heartbeatTimerRef.current) {
        clearTimeout(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      // 重连
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, WS_CONSTANTS.RECONNECT_INTERVAL_MS);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, token, sendHeartbeat]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimerRef.current) {
        clearTimeout(heartbeatTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { sendMessage };
}
