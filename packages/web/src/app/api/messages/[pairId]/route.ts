import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';
import { MESSAGE_CONSTANTS, PAGINATION_CONSTANTS } from '@/lib/constants';
import { notificationService } from '@/lib/notification';

const sendMessageSchema = z.object({
  content: z.string().max(MESSAGE_CONSTANTS.CONTENT_MAX_LENGTH),
  contentType: z.enum(['text', 'image', 'voice']).default('text'),
  mediaUrls: z.array(z.string()).max(MESSAGE_CONSTANTS.MEDIA_MAX_COUNT).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { pairId: string } }) {
  try {
    const auth = await getAuthUser(request);
    const pairId = params.pairId;

    const rawPage = request.nextUrl.searchParams.get('page') || '1';
    const rawLimit = request.nextUrl.searchParams.get('limit') || String(PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE);
    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const limit = Math.min(PAGINATION_CONSTANTS.MAX_PAGE_SIZE, Math.max(1, parseInt(rawLimit, 10) || PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const pair = await prisma.pair.findFirst({
      where: { id: pairId, OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) {
      return NextResponse.json({ error: '配对不存在' }, { status: 404 });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { pairId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { sender: { select: { id: true, username: true, displayName: true } } },
      }),
      prisma.message.count({ where: { pairId } }),
    ]);

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('List messages error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { pairId: string } }) {
  try {
    const auth = await getAuthUser(request);
    const pairId = params.pairId;
    const body = sendMessageSchema.parse(await request.json());

    const pair = await prisma.pair.findFirst({
      where: { id: pairId, status: 'active', OR: [{ userAId: auth.id }, { userBId: auth.id }] },
    });

    if (!pair) {
      return NextResponse.json({ error: '配对不存在' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        pairId,
        senderId: auth.id,
        content: body.content,
        contentType: body.contentType,
        mediaUrls: body.mediaUrls || [],
      },
      include: { sender: { select: { id: true, username: true, displayName: true } } },
    });

    const receiverId = pair.userAId === auth.id ? pair.userBId : pair.userAId;
    notificationService.notifyNewMessage(receiverId, message.id).catch(() => {});

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Send message error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
