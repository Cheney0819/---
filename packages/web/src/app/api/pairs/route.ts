import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const { partnerId } = await request.json() as { partnerId: string };

    if (!partnerId) {
      return NextResponse.json({ error: '缺少 partnerId' }, { status: 400 });
    }

    // 禁止配对自身
    if (partnerId === auth.id) {
      return NextResponse.json({ error: '不能与自己配对' }, { status: 400 });
    }

    // 检查是否已有配对
    const existing = await prisma.pair.findFirst({
      where: { OR: [{ userAId: auth.id }, { userBId: auth.id }], status: 'active' },
    });
    if (existing) {
      return NextResponse.json({ error: '你已经配对了，无法与其他用户配对' }, { status: 400 });
    }

    // 检查对方是否已配对
    const partnerHasPair = await prisma.pair.findFirst({
      where: { OR: [{ userAId: partnerId }, { userBId: partnerId }], status: 'active' },
    });
    if (partnerHasPair) {
      return NextResponse.json({ error: '对方已经配对了' }, { status: 400 });
    }

    const [userAId, userBId] = auth.id < partnerId ? [auth.id, partnerId] : [partnerId, auth.id];

    const pair = await prisma.pair.create({
      data: { userAId, userBId },
      include: {
        userA: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        userB: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ pair }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Create pair error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);

    const pairs = await prisma.pair.findMany({
      where: { OR: [{ userAId: auth.id }, { userBId: auth.id }], status: 'active' },
      include: {
        userA: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        userB: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ pairs });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('List pairs error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
