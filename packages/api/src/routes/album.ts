import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';

const createAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const addPhotoSchema = z.object({
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  mediaType: z.enum(['image', 'video']).default('image'),
  metadata: z.any().optional(),
});

export async function albumRoutes(app: FastifyInstance) {
  // 获取相册列表
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    
    const pair = await prisma.pair.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: 'active',
      },
    });
    
    if (!pair) return { albums: [] };
    
    const albums = await prisma.sharedAlbum.findMany({
      where: { pairId: pair.id },
      include: {
        media: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, url: true, thumbnailUrl: true, mediaType: true },
        },
        _count: { select: { media: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { albums };
  });
  
  // 创建相册
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = createAlbumSchema.parse(request.body);
    
    const pair = await prisma.pair.findFirst({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: 'active',
      },
    });
    
    if (!pair) return reply.status(400).send({ error: '请先创建配对' });
    
    const album = await prisma.sharedAlbum.create({
      data: {
        pairId: pair.id,
        name: body.name,
        description: body.description,
      },
    });
    
    return { album };
  });
  
  // 获取相册详情
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    
    const album = await prisma.sharedAlbum.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: {
              select: { id: true, username: true, displayName: true },
            },
          },
        },
      },
    });
    
    if (!album) return { error: '相册不存在' };
    
    return { album };
  });
  
  // 上传照片
  app.post('/:id/photos', { preHandler: [app.authenticate] }, async (request) => {
    const { id: userId } = request.user as { id: string };
    const { id: albumId } = request.params as { id: string };
    const body = addPhotoSchema.parse(request.body);
    
    const photo = await prisma.sharedMedia.create({
      data: {
        albumId,
        uploaderId: userId,
        url: body.url,
        thumbnailUrl: body.thumbnailUrl,
        mediaType: body.mediaType,
        metadata: body.metadata,
      },
      include: {
        uploader: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });
    
    return { photo };
  });
  
  // 删除照片
  app.delete('/photos/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    
    // 查找照片并验证归属
    const photo = await prisma.sharedMedia.findUnique({
      where: { id },
      include: { album: true },
    });
    
    if (!photo) {
      return reply.status(404).send({ error: '照片不存在' });
    }
    
    // 验证用户是否属于该相册的配对
    const pair = await prisma.pair.findFirst({
      where: {
        id: photo.album.pairId,
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
    });
    
    if (!pair) {
      return reply.status(403).send({ error: '无权删除此照片' });
    }
    
    await prisma.sharedMedia.delete({ where: { id } });
    
    return { success: true };
  });
}
