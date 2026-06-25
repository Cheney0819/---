import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

const createDiarySchema = z.object({
  title: z.string().min(1).max(100),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);

    const pair = await prisma.pair.findFirst({
      where: { OR: [{ userAId: auth.id }, { userBId: auth.id }], status: 'active' },
    });

    if (!pair) {
      return NextResponse.json({ diaries: [] });
    }

    const diaries = await prisma.sharedDiary.findMany({
      where: { pairId: pair.id },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { author: { select: { id: true, username: true, displayName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ diaries });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('List diaries error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const body = createDiarySchema.parse(await request.json());

    const pair = await prisma.pair.findFirst({
      where: { OR: [{ userAId: auth.id }, { userBId: auth.id }], status: 'active' },
    });

    if (!pair) {
      return NextResponse.json({ error: '请先创建配对' }, { status: 400 });
    }

    const diary = await prisma.sharedDiary.create({
      data: { pairId: pair.id, title: body.title },
    });

    return NextResponse.json({ diary }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "请求参数有误" }, { status: 400 });
    console.error('Create diary error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
