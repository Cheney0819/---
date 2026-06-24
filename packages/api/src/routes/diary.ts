import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';

const createDiarySchema = z.object({
  title: z.string().min(1).max(100),
});

const addEntrySchema = z.object({
  content: z.string().min(1).max(10000),
  mood: z.string().max(20).optional(),
  weather: z.string().max(20).optional(),
  tags: z.array(z.string()).optional(),
});

export async function diaryRoutes(app: FastifyInstance) {
  // 获取日记列表
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    
    // 获取用户的配对
    const pair = await prisma.pair.findFirst({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
        status: 'active',
      },
    });
    
    if (!pair) {
      return { diaries: [] };
    }
    
    const diaries = await prisma.sharedDiary.findMany({
      where: { pairId: pair.id },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            author: {
              select: { id: true, username: true, displayName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { diaries };
  });
  
  // 创建日记
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = createDiarySchema.parse(request.body);
    
    // 获取用户的配对
    const pair = await prisma.pair.findFirst({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
        status: 'active',
      },
    });
    
    if (!pair) {
      return reply.status(400).send({ error: '请先创建配对' });
    }
    
    const diary = await prisma.sharedDiary.create({
      data: {
        pairId: pair.id,
        title: body.title,
      },
    });
    
    return { diary };
  });
  
  // 获取日记详情
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    
    const diary = await prisma.sharedDiary.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, username: true, displayName: true },
            },
          },
        },
      },
    });
    
    if (!diary) {
      return { error: '日记不存在' };
    }
    
    return { diary };
  });
  
  // 添加日记条目
  app.post('/:id/entries', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    const { id: diaryId } = request.params as { id: string };
    const body = addEntrySchema.parse(request.body);
    
    const entry = await prisma.diaryEntry.create({
      data: {
        diaryId,
        authorId: userId,
        content: body.content,
        mood: body.mood,
        weather: body.weather,
        tags: body.tags || [],
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });
    
    return { entry };
  });
  
  // 删除日记条目
  app.delete('/entries/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    
    // 查找条目并验证归属
    const entry = await prisma.diaryEntry.findUnique({
      where: { id },
      include: { diary: true },
    });
    
    if (!entry) {
      return reply.status(404).send({ error: '条目不存在' });
    }
    
    // 验证用户是否属于该日记的配对
    const pair = await prisma.pair.findFirst({
      where: {
        id: entry.diary.pairId,
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
    });
    
    if (!pair) {
      return reply.status(403).send({ error: '无权删除此条目' });
    }
    
    await prisma.diaryEntry.delete({
      where: { id },
    });
    
    return { success: true };
  });
}
