import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { CAPSULE_CONSTANTS } from '../constants';

const createCapsuleSchema = z.object({
  pairId: z.string(),
  receiverId: z.string(),
  content: z.string().max(CAPSULE_CONSTANTS.CONTENT_MAX_LENGTH),
  mediaUrls: z.array(z.string()).max(CAPSULE_CONSTANTS.MEDIA_MAX_COUNT).optional(),
  triggerTime: z.string().datetime(),
  triggerCondition: z.any().optional(),
});

export async function capsuleRoutes(app: FastifyInstance) {
  // 创建时间胶囊
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = createCapsuleSchema.parse(request.body);
    
    const triggerTime = new Date(body.triggerTime);
    const now = new Date();
    const diffMinutes = (triggerTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (diffMinutes < CAPSULE_CONSTANTS.MIN_TRIGGER_MINUTES) {
      return reply.status(400).send({ 
        error: `触发时间至少需要 ${CAPSULE_CONSTANTS.MIN_TRIGGER_MINUTES} 分钟后` 
      });
    }
    
    // 验证配对关系
    const pair = await prisma.pair.findFirst({
      where: {
        id: body.pairId,
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
    });
    
    if (!pair) {
      return reply.status(404).send({ error: '配对不存在' });
    }
    
    const capsule = await prisma.timeCapsule.create({
      data: {
        pairId: body.pairId,
        senderId: userId,
        receiverId: body.receiverId,
        content: body.content,
        mediaUrls: body.mediaUrls || [],
        triggerTime,
        triggerCondition: body.triggerCondition,
      },
    });
    
    return { capsule };
  });
  
  // 获取我收到的胶囊
  app.get('/received', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    
    const capsules = await prisma.timeCapsule.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });
    
    return { capsules };
  });
  
  // 获取我发送的胶囊
  app.get('/sent', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    
    const capsules = await prisma.timeCapsule.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        receiver: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });
    
    return { capsules };
  });
  
  // 打开胶囊
  app.post('/:id/open', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    
    const capsule = await prisma.timeCapsule.findFirst({
      where: {
        id,
        receiverId: userId,
      },
    });
    
    if (!capsule) {
      return { error: '胶囊不存在' };
    }
    
    if (capsule.status !== 'delivered') {
      return { error: '胶囊还未送达' };
    }
    
    const updated = await prisma.timeCapsule.update({
      where: { id },
      data: { 
        status: 'read',
        readAt: new Date(),
      },
    });
    
    return { capsule: updated };
  });
}
