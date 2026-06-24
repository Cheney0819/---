import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, username: true, displayName: true, email: true, inviteCode: true, avatarUrl: true, platform: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GetMe error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
