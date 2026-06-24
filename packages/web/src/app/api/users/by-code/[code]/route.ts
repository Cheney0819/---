import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    await getAuthUser(request);

    const user = await prisma.user.findUnique({
      where: { inviteCode: params.code },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Find by code error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
