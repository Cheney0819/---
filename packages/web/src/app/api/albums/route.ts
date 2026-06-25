import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

const createAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);

    const pair = await prisma.pair.findFirst({
      where: { OR: [{ userAId: auth.id }, { userBId: auth.id }], status: 'active' },
    });

    if (!pair) return NextResponse.json({ albums: [] });

    const albums = await prisma.sharedAlbum.findMany({
      where: { pairId: pair.id },
      include: {
        media: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, url: true, thumbnailUrl: true, mediaType: true } },
        _count: { select: { media: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ albums });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('List albums error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const body = createAlbumSchema.parse(await request.json());

    const pair = await prisma.pair.findFirst({
      where: { OR: [{ userAId: auth.id }, { userBId: auth.id }], status: 'active' },
    });

    if (!pair) return NextResponse.json({ error: '请先创建配对' }, { status: 400 });

    const album = await prisma.sharedAlbum.create({
      data: { pairId: pair.id, name: body.name, description: body.description },
    });

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "请求参数有误" }, { status: 400 });
    console.error('Create album error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
