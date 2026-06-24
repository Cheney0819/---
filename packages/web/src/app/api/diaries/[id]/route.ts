import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);

    const diary = await prisma.sharedDiary.findUnique({
      where: { id: params.id },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, username: true, displayName: true } } },
        },
      },
    });

    if (!diary) {
      return NextResponse.json({ error: '日记不存在' }, { status: 404 });
    }

    const pair = await prisma.pair.findFirst({
      where: { id: diary.pairId, OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) {
      return NextResponse.json({ error: '无权查看此日记' }, { status: 403 });
    }

    return NextResponse.json({ diary });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Get diary error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
