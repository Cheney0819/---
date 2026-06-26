import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; cid: string } },
) {
  try {
    const auth = await getAuthUser(request);

    const comment = await prisma.diaryComment.findUnique({
      where: { id: params.cid },
      include: { diaryEntry: { include: { diary: true } } },
    });

    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 });
    }

    // 验证用户有权删除该评论（评论作者或配对成员）
    if (comment.authorId !== auth.id) {
      const pair = await prisma.pair.findFirst({
        where: {
          id: comment.diaryEntry.diary.pairId,
          OR: [{ userAId: auth.id }, { userBId: auth.id }],
        },
      });
      if (!pair) {
        return NextResponse.json({ error: '无权删除此评论' }, { status: 403 });
      }
    }

    await prisma.diaryComment.delete({
      where: { id: params.cid },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
