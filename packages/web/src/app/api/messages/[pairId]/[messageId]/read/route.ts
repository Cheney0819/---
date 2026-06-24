import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { pairId: string; messageId: string } }
) {
  try {
    const auth = await getAuthUser(request);

    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
      include: { pair: true },
    });

    if (!message) {
      return NextResponse.json({ error: '消息不存在' }, { status: 404 });
    }

    const isMember = message.pair.userAId === auth.id || message.pair.userBId === auth.id;
    if (message.senderId === auth.id || !isMember) {
      return NextResponse.json({ error: '无权标记此消息' }, { status: 403 });
    }

    await prisma.message.update({
      where: { id: params.messageId },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Mark read error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
