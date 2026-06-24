import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);

    const capsules = await prisma.timeCapsule.findMany({
      where: { senderId: auth.id },
      orderBy: { createdAt: 'desc' },
      include: { receiver: { select: { id: true, username: true, displayName: true } } },
    });

    return NextResponse.json({ capsules });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('List sent capsules error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
