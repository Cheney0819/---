import WebSocket from 'ws';
import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

// 在线用户映射：一个用户可能在多个设备/标签页连接
const onlineUsers = new Map<string, Set<WebSocket>>();

export function setupWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true } as any, (socket: any, request: any) => {
    let userId: string | null = null;

    socket.on('message', async (message: any) => {
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

              socket.send(JSON.stringify({ type: 'auth_success', userId }));
              broadcastToPartner(userId, { type: 'user_online', userId });
            } catch (error) {
              socket.send(JSON.stringify({ type: 'auth_error', error: 'token 无效' }));
              socket.close();
            }
            break;

          case 'message':
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
        console.error('WebSocket message error:', error);
      }
    });

    socket.on('close', () => {
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
      if (socket.readyState === WebSocket.OPEN) {
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
