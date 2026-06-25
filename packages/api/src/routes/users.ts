import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { rateLimit } from '../middleware/ratelimit';

export async function userRoutes(app: FastifyInstance) {
  // 更新设备令牌 (FCM)
  app.put('/me/device', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.user as { id: string };
    const { deviceToken } = request.body as { deviceToken: string };
    
    await prisma.user.update({
      where: { id },
      data: { deviceToken },
    });
    
    return { success: true };
  });
  
  // 更新用户信息
  app.put('/me', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.user as { id: string };
    const body = request.body as { displayName?: string; avatarUrl?: string };
    
    // Fix 15: 显式构建更新对象（防 IDOR）
    const updateData: { displayName?: string; avatarUrl?: string } = {};
    if (body.displayName !== undefined) {
      updateData.displayName = body.displayName;
    }
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });
    
    return { user };
  });
  
  // 搜索用户
  app.get('/search', { preHandler: [app.authenticate, rateLimit] }, async (request) => {
    // Fix 9: 搜索接口添加速率限制
    const { q } = request.query as { q: string };
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: 20,
    });
    
    return { users };
  });

  // 上传公钥
  app.put('/me/keys', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { publicKey } = request.body as { publicKey: string };
    
    // Fix 13: 公钥长度验证（最大 1024 字节）
    if (Buffer.byteLength(publicKey, 'utf-8') > 1024) {
      return reply.status(400).send({ error: '公钥过长' });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { publicKey },
    });
    
    return { success: true };
  });
  
  // 获取对方公钥
  app.get('/:id/publickey', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: { publicKey: true },
    });
    
    if (!user || !user.publicKey) {
      return { error: '公钥不存在' };
    }
    
    return { publicKey: user.publicKey };
  });

  // 通过识别码查找用户
  app.get('/by-code/:code', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { code } = request.params as { code: string };
    
    const user = await prisma.user.findUnique({
      where: { inviteCode: code.toUpperCase() },
      select: { id: true, username: true, displayName: true, inviteCode: true },
    });
    
    // Fix 14: 统一返回消息，防止枚举
    if (!user) {
      return reply.status(404).send({ error: '用户不存在' });
    }
    
    return { user };
  });

}
