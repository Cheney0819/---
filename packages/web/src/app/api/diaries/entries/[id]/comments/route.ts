import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);

    // 验证用户有权访问该日记条目
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
      return NextResponse.json({ error: '无权查看此条目' }, { status: 403 });
    }

    const comments = await prisma.diaryComment.findMany({
      where: { diaryEntryId: params.id },
      include: {
        author: {
          select: { id: true, username: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Get comments error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    // 验证用户有权在该日记中评论
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
      return NextResponse.json({ error: '无权评论此条目' }, { status: 403 });
    }

    const comment = await prisma.diaryComment.create({
      data: {
        content: content.trim(),
        diaryEntryId: params.id,
        authorId: auth.id,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Create comment error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
