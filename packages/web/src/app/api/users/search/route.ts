import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const q = request.nextUrl.searchParams.get('q') || '';

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      take: 20,
    });

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Search error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
