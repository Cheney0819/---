import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function pairRoutes(app: FastifyInstance) {
  // 创建配对
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { partnerId } = request.body as { partnerId: string };
    
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
          { userAId: partnerId },
          { userBId: partnerId },
        ],
        status: 'active',
      },
    });
    
    if (partnerExistingPair) {
      return reply.status(400).send({ error: '对方已经配对了' });
    }
    
    // 确保 userAId < userBId
    const [userAId, userBId] = userId < partnerId 
      ? [userId, partnerId] 
      : [partnerId, userId];
    
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
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
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
      return { error: '配对不存在' };
    }
    
    return { pair };
  });
}
