import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

const addEntrySchema = z.object({
  content: z.string().min(1).max(10000),
  mood: z.string().max(20).optional(),
  weather: z.string().max(20).optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);
    const body = addEntrySchema.parse(await request.json());
    const diaryId = params.id;

    const diary = await prisma.sharedDiary.findUnique({ where: { id: diaryId } });
    if (!diary) {
      return NextResponse.json({ error: '日记不存在' }, { status: 404 });
    }

    const pair = await prisma.pair.findFirst({
      where: { id: diary.pairId, OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) {
      return NextResponse.json({ error: '无权在此日记中写条目' }, { status: 403 });
    }

    const entry = await prisma.diaryEntry.create({
      data: {
        diaryId,
        authorId: auth.id,
        content: body.content,
        mood: body.mood,
        weather: body.weather,
        tags: body.tags || [],
      },
      include: { author: { select: { id: true, username: true, displayName: true } } },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Add entry error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
