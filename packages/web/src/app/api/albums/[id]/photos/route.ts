import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

const addPhotoSchema = z.object({
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  mediaType: z.enum(['image', 'video']).default('image'),
  metadata: z.any().optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);
    const body = addPhotoSchema.parse(await request.json());
    const albumId = params.id;

    const album = await prisma.sharedAlbum.findUnique({ where: { id: albumId } });
    if (!album) return NextResponse.json({ error: '相册不存在' }, { status: 404 });

    const pair = await prisma.pair.findFirst({
      where: { id: album.pairId, OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) return NextResponse.json({ error: '无权在此相册中上传照片' }, { status: 403 });

    const photo = await prisma.sharedMedia.create({
      data: {
        albumId,
        uploaderId: auth.id,
        url: body.url,
        thumbnailUrl: body.thumbnailUrl,
        mediaType: body.mediaType,
        metadata: body.metadata,
      },
      include: { uploader: { select: { id: true, username: true, displayName: true } } },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Add photo error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
