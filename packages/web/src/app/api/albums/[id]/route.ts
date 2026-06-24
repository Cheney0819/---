import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);

    const album = await prisma.sharedAlbum.findUnique({
      where: { id: params.id },
      include: {
        media: {
          orderBy: { createdAt: 'desc' },
          include: { uploader: { select: { id: true, username: true, displayName: true } } },
        },
      },
    });

    if (!album) return NextResponse.json({ error: '相册不存在' }, { status: 404 });

    const pair = await prisma.pair.findFirst({
      where: { id: album.pairId, OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) return NextResponse.json({ error: '无权查看此相册' }, { status: 403 });

    return NextResponse.json({ album });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Get album error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
