import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);

    const pair = await prisma.pair.findFirst({
      where: {
        id: params.id,
        OR: [{ userAId: auth.id }, { userBId: auth.id }],
      },
      include: {
        userA: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        userB: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!pair) {
      return NextResponse.json({ error: '配对不存在' }, { status: 404 });
    }

    return NextResponse.json({ pair });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Get pair error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
