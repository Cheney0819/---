import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pairId: string; messageId: string } }
) {
  try {
    const auth = await getAuthUser(request);

    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
    });

    if (!message) {
      return NextResponse.json({ error: '消息不存在' }, { status: 404 });
    }

    if (message.pairId !== params.pairId) {
      return NextResponse.json({ error: '消息不属于此配对' }, { status: 400 });
    }

    const pair = await prisma.pair.findUnique({
      where: { id: params.pairId },
    });

    if (!pair || (pair.userAId !== auth.id && pair.userBId !== auth.id)) {
      return NextResponse.json({ error: '无权删除此消息' }, { status: 403 });
    }

    if (message.senderId !== auth.id) {
      return NextResponse.json({ error: '无权删除此消息' }, { status: 403 });
    }

    await prisma.message.update({
      where: { id: params.messageId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Delete message error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
