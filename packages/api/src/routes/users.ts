import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';

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
    
    const user = await prisma.user.update({
      where: { id },
      data: body,
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
  app.get('/search', { preHandler: [app.authenticate] }, async (request) => {
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
  app.put('/me/keys', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    const { publicKey } = request.body as { publicKey: string };
    
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
  app.get('/by-code/:code', { preHandler: [app.authenticate] }, async (request) => {
    const { code } = request.params as { code: string };
    
    const user = await prisma.user.findUnique({
      where: { inviteCode: code.toUpperCase() },
      select: { id: true, username: true, displayName: true, inviteCode: true },
    });
    
    if (!user) {
      return { error: '未找到该用户' };
    }
    
    return { user };
  });

}