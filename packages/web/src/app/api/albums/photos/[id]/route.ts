import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);

    const photo = await prisma.sharedMedia.findUnique({
      where: { id: params.id },
      include: { album: true },
    });

    if (!photo) return NextResponse.json({ error: '照片不存在' }, { status: 404 });

    const pair = await prisma.pair.findFirst({
      where: { id: photo.album.pairId, OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) return NextResponse.json({ error: '无权删除此照片' }, { status: 403 });

    await prisma.sharedMedia.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Delete photo error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
