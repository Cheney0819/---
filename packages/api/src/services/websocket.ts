import WebSocket, { WebSocket as WS } from 'ws';
import { jwtVerify } from 'jose';
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

// 手动验证 JWT，确保 issuer/audience 校验生效
async function verifyWsToken(token: string): Promise<{ id: string; username: string } | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: 'shiguangjian',
      audience: 'shiguangjian-api',
      algorithms: ['HS256'],
    });
    const sub = payload.sub as string | undefined;
    if (!sub || sub !== (payload.id as string)) return null;
    return { id: sub, username: (payload.username as string) || '' };
  } catch {
    return null;
  }
}

// 跟踪上一次的心跳定时器，防止热重载泄漏
let _currentHeartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function setupWebSocket(app: FastifyInstance) {
  // 清理之前的定时器（防止热重载泄漏）
  if (_currentHeartbeatInterval) {
    clearInterval(_currentHeartbeatInterval);
  }
  
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

  _currentHeartbeatInterval = heartbeatInterval;
  
  // 停止服务时清理定时器
  app.addHook('onClose', () => {
    clearInterval(heartbeatInterval);
    _currentHeartbeatInterval = null;
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
      // Fix: 消息大小限制（最大 100KB，支持表情包/照片/语音 URL）
      if (message.length > 100 * 1024) {
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
              const decoded = await verifyWsToken(data.token);
              if (!decoded) {
                socket.send(JSON.stringify({ type: 'auth_error', error: 'token 无效' }));
                socket.close();
                return;
              }
              userId = decoded.id;

              // 支持多设备同时在线
              if (!onlineUsers.has(userId)) {
                onlineUsers.set(userId, new Set());
              }
              onlineUsers.get(userId)!.add(socket);
              totalConnections++;

              socket.send(JSON.stringify({ type: 'auth_success', userId }));
              broadcastToPartner(userId, { type: 'user_online', userId });
              // 认证成功后，告知对方（partner）的在线状态
              const myPairs = await prisma.pair.findMany({
                where: { status: 'active', OR: [{ userAId: userId }, { userBId: userId }] },
              });
              for (const pair of myPairs) {
                const partnerId = pair.userAId === userId ? pair.userBId : pair.userAId;
                const partnerIsOnline = onlineUsers.has(partnerId) && onlineUsers.get(partnerId)!.size > 0;
                socket.send(JSON.stringify({
                  type: 'partner_status',
                  partnerId,
                  online: partnerIsOnline,
                }));
              }
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

            // 支持纯文本和多媒體消息
            const contentType = data.contentType || 'text';
            const mediaUrls = data.mediaUrls || [];

            if (contentType === 'text') {
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
            } else {
              // 多媒体消息（image / voice）：校验 URL
              if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
                socket.send(JSON.stringify({ type: 'error', error: '缺少媒体地址' }));
                return;
              }
              if (mediaUrls.length > 10) {
                socket.send(JSON.stringify({ type: 'error', error: '媒体数量过多' }));
                return;
              }
              if (userId && data.pairId) {
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
                    message: data.message || '',
                    pairId: data.pairId,
                    contentType,
                    mediaUrls,
                  });
                }
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
