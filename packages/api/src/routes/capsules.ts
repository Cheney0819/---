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
    const diffDays = diffMinutes / (60 * 24);

    if (diffMinutes < CAPSULE_CONSTANTS.MIN_TRIGGER_MINUTES) {
      return reply.status(400).send({
        error: `触发时间至少需要 ${CAPSULE_CONSTANTS.MIN_TRIGGER_MINUTES} 分钟后`
      });
    }

    if (diffDays > CAPSULE_CONSTANTS.MAX_FUTURE_DAYS) {
      return reply.status(400).send({
        error: `触发时间不能超过 ${CAPSULE_CONSTANTS.MAX_FUTURE_DAYS} 天`
      });
    }

    // 验证配对关系，同时验证 receiverId 是配对中的另一方
    const pair = await prisma.pair.findFirst({
      where: {
        id: body.pairId,
        status: 'active',
        OR: [
          { userAId: userId, userBId: body.receiverId },
          { userBId: userId, userAId: body.receiverId },
        ],
      },
    });

    if (!pair) {
      return reply.status(404).send({ error: '配对不存在或接收者不在此配对中' });
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

  // 打开胶囊（原子操作避免竞态条件）
  app.post('/:id/open', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };

    const capsule = await prisma.timeCapsule.findFirst({
      where: {
        id,
        receiverId: userId,
      },
    });

    if (!capsule) {
      return reply.status(404).send({ error: '胶囊不存在' });
    }

    if (capsule.status !== 'delivered') {
      return reply.status(400).send({ error: '胶囊还未送达' });
    }

    // 使用原子更新避免竞态条件
    const updated = await prisma.timeCapsule.updateMany({
      where: {
        id,
        status: 'delivered',
      },
      data: {
        status: 'read',
        readAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return reply.status(409).send({ error: '胶囊已被打开' });
    }

    // 重新查询获取最新数据
    const result = await prisma.timeCapsule.findUnique({ where: { id } });
    return { capsule: result };
  });
}
