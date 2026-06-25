import WebSocket, { WebSocket as WS } from 'ws';
import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { WS_CONSTANTS } from '../constants';

// 在线用户映射：一个用户可能在多个设备/标签页连接
const onlineUsers = new Map<string, Set<WebSocket>>();

// 心跳超时阈值（毫秒）
const HEARTBEAT_TIMEOUT_MS = WS_CONSTANTS.HEARTBEAT_INTERVAL_MS * 2;

// Fix: 最大 WebSocket 连接数保护，防止内存耗尽
const MAX_WS_CONNECTIONS = 10000;

// 全局连接计数器
let totalConnections = 0;

export function setupWebSocket(app: FastifyInstance) {
  // 定期扫描清理超时连接
  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    for (const [userId, sockets] of onlineUsers) {
      for (const socket of sockets) {
        // @ts-ignore
        if (socket._lastPongTime && now - (socket._lastPongTime as number) > HEARTBEAT_TIMEOUT_MS) {
          sockets.delete(socket);
          // @ts-ignore
          socket.terminate();
          totalConnections = Math.max(0, totalConnections - 1);
        }
      }
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        broadcastToPartner(userId, { type: 'user_offline', userId });
      }
    }
  }, WS_CONSTANTS.HEARTBEAT_INTERVAL_MS);

  // 停止服务时清理定时器
  app.addHook('onClose', () => {
    clearInterval(heartbeatInterval);
  });

  app.get('/ws', { websocket: true } as any, (socket: any, request: any) => {
    // Fix: 连接数超限保护
    if (totalConnections >= MAX_WS_CONNECTIONS) {
      socket.send(JSON.stringify({ type: 'error', error: '服务器连接数已满，请稍后重试' }));
      socket.close();
      return;
    }

    let userId: string | null = null;

    // 连接时立即发送 ping
    // @ts-ignore
    socket._lastPongTime = Date.now();
    socket.ping();

    socket.on('pong', () => {
      // @ts-ignore
      socket._lastPongTime = Date.now();
    });

    socket.on('message', async (message: any) => {
      // Fix: 消息大小限制（最大 10KB）
      if (message.length > 10 * 1024) {
        socket.send(JSON.stringify({ type: 'error', error: '消息过大' }));
        return;
      }

      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'auth':
            if (!data.token) {
              socket.send(JSON.stringify({ type: 'auth_error', error: '缺少 token' }));
              socket.close();
              return;
            }

            try {
              const decoded = app.jwt.verify(data.token) as { id: string; username: string };
              userId = decoded.id;

              // 支持多设备同时在线
              if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
              }
              onlineUsers.get(userId)!.add(socket);
              totalConnections++;

              socket.send(JSON.stringify({ type: 'auth_success', userId }));
              broadcastToPartner(userId, { type: 'user_online', userId });
            } catch (error) {
              socket.send(JSON.stringify({ type: 'auth_error', error: 'token 无效' }));
              socket.close();
            }
            break;

          case 'message':
            // Fix: 消息基本校验
            if (!userId || !data.pairId) {
              socket.send(JSON.stringify({ type: 'error', error: '缺少必要字段' }));
              return;
            }
            if (typeof data.message !== 'string') {
              socket.send(JSON.stringify({ type: 'error', error: '消息格式错误' }));
              return;
            }
            if (data.message.length > 5000) {
              socket.send(JSON.stringify({ type: 'error', error: '消息过长' }));
              return;
            }
            if (userId && data.pairId && data.message) {
              const pair = await prisma.pair.findFirst({
                where: {
                  id: data.pairId,
                  status: 'active',
                  OR: [
                    { userAId: userId },
                    { userBId: userId },
                  ],
                },
              });
              if (pair) {
                const receiverId = pair.userAId === userId ? pair.userBId : pair.userAId;
                sendToUser(receiverId, {
                  type: 'new_message',
                  message: data.message,
                  pairId: data.pairId,
                });
              }
            }
            break;

          case 'typing':
            if (userId && data.pairId) {
              const pair = await prisma.pair.findUnique({ where: { id: data.pairId } });
              if (pair) {
                const receiverId = pair.userAId === userId ? pair.userBId : pair.userAId;
                sendToUser(receiverId, {
                  type: 'typing',
                  isTyping: data.isTyping,
                  userId,
                });
              }
            }
            break;

          case 'read':
            if (userId && data.messageId) {
              const message = await prisma.message.findUnique({ where: { id: data.messageId } });
              if (message) {
                sendToUser(message.senderId, {
                  type: 'message_read',
                  messageId: data.messageId,
                });
              }
            }
            break;
        }
      } catch (error) {
        // Fix: 只记录 error.message，不记录整个 error 对象
        console.error('WebSocket message error:', error instanceof Error ? error.message : String(error));
      }
    });

    socket.on('close', () => {
      totalConnections = Math.max(0, totalConnections - 1);
      if (userId) {
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket);
          // 所有连接都断开时才标记离线
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            broadcastToPartner(userId, { type: 'user_offline', userId });
          }
        }
      }
    });
  });
}

export function sendToUser(userId: string, data: any) {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    for (const socket of sockets) {
      // @ts-ignore
      if (socket.readyState === WS.OPEN) {
        socket.send(JSON.stringify(data));
      }
    }
  }
}

async function broadcastToPartner(userId: string, data: any) {
  const pairs = await prisma.pair.findMany({
    where: {
      status: 'active',
      OR: [
        { userAId: userId },
        { userBId: userId },
      ],
    },
  });

  for (const pair of pairs) {
    const partnerId = pair.userAId === userId ? pair.userBId : pair.userAId;
    sendToUser(partnerId, data);
  }
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && (onlineUsers.get(userId)?.size ?? 0) > 0;
}
