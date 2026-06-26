import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function pairRoutes(app: FastifyInstance) {
  // 创建配对
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { partnerId, inviteCode } = request.body as { partnerId?: string; inviteCode?: string };
    
    // 如果传入的是 inviteCode，先查找对应的用户
    let resolvedPartnerId = partnerId;
    if (!resolvedPartnerId && inviteCode) {
      const partner = await prisma.user.findUnique({
        where: { inviteCode },
        select: { id: true },
      });
      if (!partner) {
        return reply.status(404).send({ error: '邀请码无效' });
      }
      if (partner.id === userId) {
        return reply.status(400).send({ error: '不能与自己配对' });
      }
      resolvedPartnerId = partner.id;
    }
    
    if (!resolvedPartnerId) {
      return reply.status(400).send({ error: '请填写对方的邀请码' });
    }
    
    // 硬性检查：不能配对自身
    if (resolvedPartnerId === userId) {
      return reply.status(400).send({ error: '不能与自己配对' });
    }
    
    // 1对1限制：检查当前用户是否已配对
    const myExistingPair = await prisma.pair.findFirst({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
        status: 'active',
      },
    });
    
    if (myExistingPair) {
      return reply.status(400).send({ error: '你已经配对了，无法与其他用户配对' });
    }
    
    // 检查对方是否已配对
    const partnerExistingPair = await prisma.pair.findFirst({
      where: {
        OR: [
          { userAId: resolvedPartnerId },
          { userBId: resolvedPartnerId },
        ],
        status: 'active',
      },
    });
    
    if (partnerExistingPair) {
      return reply.status(400).send({ error: '对方已经配对了' });
    }
    
    // 确保 userAId < userBId（使用字符串比较保证确定性排序）
    const [userAId, userBId] = userId < resolvedPartnerId 
      ? [userId, resolvedPartnerId] 
      : [resolvedPartnerId, userId];
    
    try {
      const pair = await prisma.pair.create({
        data: {
          userAId,
          userBId,
        },
        include: {
          userA: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          userB: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      });
      
      return { pair };
    } catch (error: any) {
      // 捕获 P2002 唯一约束冲突（TOCTOU 竞态条件保护）
      if (error?.code === 'P2002') {
        return reply.status(409).send({ error: '配对创建失败，可能已存在重复配对' });
      }
      throw error;
    }
  });
  
  // 获取我的配对
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    
    const pairs = await prisma.pair.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
        status: 'active',
      },
      include: {
        userA: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        userB: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    
    return { pairs };
  });
  
  // 获取配对详情
  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    
    const pair = await prisma.pair.findFirst({
      where: {
        id,
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
      include: {
        userA: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        userB: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    
    if (!pair) {
      return reply.status(404).send({ error: '配对不存在' });
    }
    
    return { pair };
  });
}
