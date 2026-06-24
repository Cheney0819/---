import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

// 在线用户映射
const onlineUsers = new Map<string, WebSocket>();

// 用户与 WebSocket 映射
const userSockets = new Map<string, WebSocket>();

export function setupWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, request) => {
    let userId: string | null = null;

    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'auth':
            // 验证 JWT Token
            if (!data.token) {
              socket.send(JSON.stringify({ type: 'auth_error', error: 'Token required' }));
              socket.close();
              return;
            }

            try {
              const decoded = app.jwt.verify(data.token) as { id: string; username: string };
              userId = decoded.id;
              onlineUsers.set(userId, socket);
              userSockets.set(userId, socket);
              socket.send(JSON.stringify({ type: 'auth_success', userId }));
              
              // 通知对方用户上线
              broadcastToPartner(userId, { type: 'user_online', userId });
            } catch (error) {
              socket.send(JSON.stringify({ type: 'auth_error', error: 'Invalid token' }));
              socket.close();
            }
            break;

          case 'message':
            // 转发消息给对方
            if (userId && data.pairId) {
              const pair = await prisma.pair.findUnique({ where: { id: data.pairId } });
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
            // 转发输入状态
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
            // 转发已读状态
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
        onlineUsers.delete(userId);
        userSockets.delete(userId);
        // 通知对方用户离线
        broadcastToPartner(userId, { type: 'user_offline', userId });
      }
    });
  });
}

// 发送消息给指定用户
export function sendToUser(userId: string, data: any) {
  const socket = onlineUsers.get(userId);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

// 广播给配对的另一方
async function broadcastToPartner(userId: string, data: any) {
  const pairs = await prisma.pair.findMany({
    where: {
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

// 检查用户是否在线
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
