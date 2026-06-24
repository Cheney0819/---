import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const { publicKey } = await request.json() as { publicKey: string };

    await prisma.user.update({
      where: { id: auth.id },
      data: { publicKey },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Upload keys error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
