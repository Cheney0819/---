import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { pairRoutes } from './routes/pairs';
import { messageRoutes } from './routes/messages';
import { capsuleRoutes } from './routes/capsules';
import { diaryRoutes } from './routes/diary';
import { albumRoutes } from './routes/album';
import { startScheduler } from './services/scheduler';
import { setupWebSocket } from './services/websocket';

// ============ Prisma 客户端 ============
export const prisma = new PrismaClient();

// ============ 创建 Fastify 实例 ============
const app = Fastify({
  logger: true,
});

// ============ 认证装饰器 ============
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}

app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: '未登录或登录已过期' });
  }
});

// ============ 注册插件和路由 ============
async function setupApp() {
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('缺少 JWT_SECRET 环境变量，服务无法启动');
    process.exit(1);
  }
  await app.register(jwt, {
    secret: jwtSecret,
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(pairRoutes, { prefix: '/api/pairs' });
  await app.register(messageRoutes, { prefix: '/api/messages' });
  await app.register(capsuleRoutes, { prefix: '/api/capsules' });
  await app.register(diaryRoutes, { prefix: '/api/diaries' });

  // 设置 WebSocket
  setupWebSocket(app);
  // 启动定时任务
  startScheduler();
  await app.register(albumRoutes, { prefix: '/api/albums' });

  // 健康检查
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

// ============ 启动服务器 ============
async function start() {
  try {
    await setupApp();
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    console.log(`🚀 时光笺 API 服务器运行在 http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
