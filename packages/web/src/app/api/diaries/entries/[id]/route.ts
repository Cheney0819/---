import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);

    const entry = await prisma.diaryEntry.findUnique({
      where: { id: params.id },
      include: { diary: true },
    });

    if (!entry) {
      return NextResponse.json({ error: '条目不存在' }, { status: 404 });
    }

    const pair = await prisma.pair.findFirst({
      where: { id: entry.diary.pairId, OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) {
      return NextResponse.json({ error: '无权删除此条目' }, { status: 403 });
    }

    await prisma.diaryEntry.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Delete entry error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
