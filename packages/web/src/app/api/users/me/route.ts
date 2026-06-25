import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';

const updateSchema = z.object({
  displayName: z.string().max(100).optional(),
  avatarUrl: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const body = updateSchema.parse(await request.json());

    const updateData: { displayName?: string; avatarUrl?: string } = {};
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

    const user = await prisma.user.update({
      where: { id: auth.id },
      data: updateData,
      select: { id: true, username: true, displayName: true, email: true, inviteCode: true, avatarUrl: true, platform: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Update user error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
