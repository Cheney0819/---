// EdgeOne Pages Functions - WebSocket 端点
// 在 EdgeOne 上运行，提供实时聊天推送

import { PrismaClient } from '@prisma/client';
import { verify } from 'jose';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'shiguangjian-secret-key-2024';

// 在线用户映射
const onlineUsers = new Map<string, Set<WebSocket>>();

// 心跳超时阈值
const HEARTBEAT_TIMEOUT_MS = 60000;
const MAX_WS_CONNECTIONS = 10000;
let totalConnections = 0;

// 获取 JWT Secret key
function getJwtKey(): CryptoKey {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

// 验证 JWT token（用 Web Crypto API）
async function verifyToken(token: string): Promise<{ id: string; username: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
    const signature = base64UrlDecode(parts[2]);

    const key = await getJwtKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );

    if (!valid) return null;

    // 验证 issuer 和 audience
    if (payload.iss !== 'shiguangjian' || payload.aud !== 'shiguangjian-api') return null;

    return { id: payload.sub || payload.id, username: payload.username };
  } catch {
    return null;
  }
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 只处理 /ws 路径
    if (url.pathname !== '/ws') {
      return new Response('Not Found', { status: 404 });
    }

    // WebSocket 升级
    if (!request.headers.get('upgrade')?.toLowerCase().includes('websocket')) {
      return new Response('Expected WebSocket', { status: 400 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    server.accept();

    // 处理连接
    handleConnection(server, client);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};

async function handleConnection(ws: WebSocket, client: WebSocket) {
  if (totalConnections >= MAX_WS_CONNECTIONS) {
    ws.send(JSON.stringify({ type: 'error', error: '服务器连接数已满，请稍后重试' }));
    ws.close();
    return;
  }

  let userId: string | null = null;

  // 心跳定时器
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const send = (data: any) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  ws.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data as string);

      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'auth':
          if (!data.token) {
            send({ type: 'auth_error', error: '缺少 token' });
            ws.close();
            return;
          }
          try {
            const decoded = await verifyToken(data.token);
            if (!decoded) {
              send({ type: 'auth_error', error: 'token 无效' });
              ws.close();
              return;
            }
            userId = decoded.id;
            if (!onlineUsers.has(userId)) {
              onlineUsers.set(userId, new Set());
            }
            onlineUsers.get(userId)!.add(ws);
            totalConnections++;

            // 启动心跳
            heartbeatTimer = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
              }
            }, 30000);

            send({ type: 'auth_success', userId });
            broadcastToPartner(userId, { type: 'user_online', userId });
          } catch {
            send({ type: 'auth_error', error: 'token 无效' });
            ws.close();
          }
          break;

        case 'message':
          if (!userId || !data.pairId) {
            send({ type: 'error', error: '缺少必要字段' });
            return;
          }
          const contentType = data.contentType || 'text';
          const mediaUrls = data.mediaUrls || [];

          if (contentType === 'text') {
            if (typeof data.message !== 'string') {
              send({ type: 'error', error: '消息格式错误' });
              return;
            }
            if (data.message.length > 5000) {
              send({ type: 'error', error: '消息过长' });
              return;
            }
            if (userId && data.pairId && data.message) {
              const pair = await prisma.pair.findFirst({
                where: { id: data.pairId, status: 'active', OR: [{ userAId: userId }, { userBId: userId }] },
              });
              if (pair) {
                const receiverId = pair.userAId === userId ? pair.userBId : pair.userAId;
                sendToUser(receiverId, { type: 'new_message', message: data.message, pairId: data.pairId });
              }
            }
          } else {
            if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
              send({ type: 'error', error: '缺少媒体地址' });
              return;
            }
            if (mediaUrls.length > 10) {
              send({ type: 'error', error: '媒体数量过多' });
              return;
            }
            if (userId && data.pairId) {
              const pair = await prisma.pair.findFirst({
                where: { id: data.pairId, status: 'active', OR: [{ userAId: userId }, { userBId: userId }] },
              });
              if (pair) {
                const receiverId = pair.userAId === userId ? pair.userBId : pair.userAId;
                sendToUser(receiverId, { type: 'new_message', message: data.message || '', pairId: data.pairId, contentType, mediaUrls });
              }
            }
          }
          break;

        case 'typing':
          if (userId && data.pairId) {
            const pair = await prisma.pair.findUnique({ where: { id: data.pairId } });
            if (pair) {
              const receiverId = pair.userAId === userId ? pair.userBId : pair.userAId;
              sendToUser(receiverId, { type: 'typing', isTyping: data.isTyping, userId });
            }
          }
          break;

        case 'read':
          if (userId && data.messageId) {
            const message = await prisma.message.findUnique({ where: { id: data.messageId } });
            if (message) {
              sendToUser(message.senderId, { type: 'message_read', messageId: data.messageId });
            }
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  };

  ws.onclose = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    totalConnections = Math.max(0, totalConnections - 1);
    if (userId) {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          broadcastToPartner(userId, { type: 'user_offline', userId });
        }
      }
    }
  };

  ws.onerror = () => {
    console.error('WebSocket error');
  };
}

async function sendToUser(userId: string, data: any) {
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
    where: { status: 'active', OR: [{ userAId: userId }, { userBId: userId }] },
  });
  for (const pair of pairs) {
    const partnerId = pair.userAId === userId ? pair.userBId : pair.userAId;
    sendToUser(partnerId, data);
  }
}
