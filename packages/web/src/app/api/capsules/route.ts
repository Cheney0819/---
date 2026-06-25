import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';
import { CAPSULE_CONSTANTS } from '@/lib/constants';

const createCapsuleSchema = z.object({
  pairId: z.string(),
  receiverId: z.string(),
  content: z.string().max(CAPSULE_CONSTANTS.CONTENT_MAX_LENGTH),
  mediaUrls: z.array(z.string()).max(CAPSULE_CONSTANTS.MEDIA_MAX_COUNT).optional(),
  triggerTime: z.string().datetime(),
  triggerCondition: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const body = createCapsuleSchema.parse(await request.json());

    const triggerTime = new Date(body.triggerTime);
    const now = new Date();
    const diffMinutes = (triggerTime.getTime() - now.getTime()) / (1000 * 60);
    const diffDays = diffMinutes / (60 * 24);

    if (diffMinutes < CAPSULE_CONSTANTS.MIN_TRIGGER_MINUTES) {
      return NextResponse.json({ error: `触发时间至少需要 ${CAPSULE_CONSTANTS.MIN_TRIGGER_MINUTES} 分钟后` }, { status: 400 });
    }

    if (diffDays > CAPSULE_CONSTANTS.MAX_FUTURE_DAYS) {
      return NextResponse.json({ error: `触发时间不能超过 ${CAPSULE_CONSTANTS.MAX_FUTURE_DAYS} 天` }, { status: 400 });
    }

    // 验证配对关系，同时验证 receiverId 是配对中的另一方
    const pair = await prisma.pair.findFirst({
      where: {
        id: body.pairId,
        status: 'active',
        OR: [
          { userAId: auth.id, userBId: body.receiverId },
          { userBId: auth.id, userAId: body.receiverId },
        ],
      },
    });

    if (!pair) {
      return NextResponse.json({ error: '配对不存在或接收者不在此配对中' }, { status: 404 });
    }

    const capsule = await prisma.timeCapsule.create({
      data: {
        pairId: body.pairId,
        senderId: auth.id,
        receiverId: body.receiverId,
        content: body.content,
        mediaUrls: (body.mediaUrls ?? []) as any,
        triggerTime,
        triggerCondition: (body.triggerCondition ?? null) as any,
      },
    });

    return NextResponse.json({ capsule }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Create capsule error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
