import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { MESSAGE_CONSTANTS, PAGINATION_CONSTANTS } from '../constants';
import { notificationService } from '../services/notification';

// 注意：客户端发送的内容已经是加密后的密文
// 服务器只存储密文，不接触明文
const sendMessageSchema = z.object({
  content: z.string().max(MESSAGE_CONSTANTS.CONTENT_MAX_LENGTH), // 加密后的密文
  contentType: z.enum(['text', 'image', 'voice']).default('text'),
  mediaUrls: z.array(z.string()).max(MESSAGE_CONSTANTS.MEDIA_MAX_COUNT).optional(), // 加密后的媒体 URL
});

export async function messageRoutes(app: FastifyInstance) {
  // 获取消息历史
  app.get('/:pairId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { pairId } = request.params as { pairId: string };
    const { page: rawPage = '1', limit: rawLimit = String(PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE) } =
      request.query as { page?: string; limit?: string };
    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const limit = Math.min(PAGINATION_CONSTANTS.MAX_PAGE_SIZE, Math.max(1, parseInt(rawLimit, 10) || PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE));
    
    const skip = (page - 1) * limit;
    
    // 验证配对关系
    const pair = await prisma.pair.findFirst({
      where: {
        id: pairId,
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
    });
    
    if (!pair) {
      return reply.status(404).send({ error: '配对不存在' });
    }
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { pairId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, username: true, displayName: true },
          },
        },
      }),
      prisma.message.count({ where: { pairId } }),
    ]);
    
    // 返回密文，客户端本地解密
    return {
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
  
  // 发送消息
  // 客户端流程：
  // 1. 用 Signal Protocol 加密消息内容
  // 2. 发送密文到服务器
  // 3. 服务器存储密文
  // 4. 服务器发送静默推送给对方
  // 5. 对方客户端收到推送后本地解密
  app.post('/:pairId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { pairId } = request.params as { pairId: string };
    const body = sendMessageSchema.parse(request.body);
    
    // 验证配对关系
    const pair = await prisma.pair.findFirst({
      where: {
        id: pairId,
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
    });
    
    if (!pair) {
      return reply.status(404).send({ error: '配对不存在' });
    }
    
    // 存储密文（服务器不接触明文）
    const message = await prisma.message.create({
      data: {
        pairId,
        senderId: userId,
        content: body.content, // 这是密文，不是明文
        contentType: body.contentType,
        mediaUrls: body.mediaUrls || [], // 这些 URL 也是加密后的
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });
    
    // 确定接收者 ID
    const receiverId = pair.userAId === userId ? pair.userBId : pair.userAId;
    
    // 发送静默推送（只包含 messageId，不包含内容）
    // 对方客户端收到后会：
    // 1. 拉取新消息（拿到密文）
    // 2. 本地用 Signal Protocol 解密
    // 3. 显示本地通知（明文只在设备上显示）
    await notificationService.notifyNewMessage(receiverId, message.id);
    
    return { message };
  });
  
  // 标记已读
  app.put('/:id/read', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };

    // 验证该消息的接收者是否是当前用户
    const message = await prisma.message.findUnique({
      where: { id },
      include: { pair: true },
    });

    if (!message) {
      return reply.status(404).send({ error: '消息不存在' });
    }

    const isReceiver = message.pair.userAId === userId || message.pair.userBId === userId;
    if (message.senderId === userId || !isReceiver) {
      return reply.status(403).send({ error: '无权标记此消息' });
    }

    await prisma.message.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return { success: true };
  });
  
  // 删除消息（软删除）
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    
    const message = await prisma.message.findUnique({
      where: { id },
    });
    
    if (!message) {
      return reply.status(404).send({ error: '消息不存在' });
    }
    
    if (message.senderId !== userId) {
      return reply.status(403).send({ error: '无权删除此消息' });
    }
    
    await prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    return { success: true };
  });
}
