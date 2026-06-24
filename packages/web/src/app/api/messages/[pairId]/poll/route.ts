import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { pairId: string } }) {
  try {
    const auth = await getAuthUser(request);
    const pairId = params.pairId;

    const since = request.nextUrl.searchParams.get('since');
    if (!since) {
      return NextResponse.json({ error: '缺少 since 参数' }, { status: 400 });
    }

    const pair = await prisma.pair.findFirst({
      where: { id: pairId, OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) {
      return NextResponse.json({ error: '配对不存在' }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: {
        pairId,
        createdAt: { gt: new Date(since) },
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, username: true, displayName: true } } },
    });

    // 同时检查已读状态更新
    const readUpdates = await prisma.message.findMany({
      where: {
        pairId,
        senderId: auth.id,
        readAt: { gt: new Date(since) },
      },
      select: { id: true, readAt: true },
    });

    return NextResponse.json({ messages, readUpdates });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Poll messages error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
