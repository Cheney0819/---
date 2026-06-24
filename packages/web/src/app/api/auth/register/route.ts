import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { USER_CONSTANTS } from '@/lib/constants';

const registerSchema = z.object({
  username: z.string().min(USER_CONSTANTS.USERNAME_MIN_LENGTH).max(USER_CONSTANTS.USERNAME_MAX_LENGTH),
  email: z.string().email(),
  password: z.string().min(USER_CONSTANTS.PASSWORD_MIN_LENGTH).max(USER_CONSTANTS.PASSWORD_MAX_LENGTH),
  displayName: z.string().max(USER_CONSTANTS.DISPLAY_NAME_MAX_LENGTH).optional(),
  platform: z.enum(['android', 'ios', 'web']).default('web'),
});

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = registerSchema.parse(await request.json());

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username: body.username }, { email: body.email }] },
    });
    if (existingUser) {
      if (existingUser.username === body.username) {
        return NextResponse.json({ error: '用户名已被占用' }, { status: 409 });
      }
      return NextResponse.json({ error: '邮箱已被注册' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(body.password, USER_CONSTANTS.BCRYPT_SALT_ROUNDS);

    let inviteCode = generateInviteCode();
    let retries = 0;
    while (await prisma.user.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
      if (++retries > 100) {
        return NextResponse.json({ error: '生成邀请码失败，请重试' }, { status: 500 });
      }
    }

    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        displayName: body.displayName || body.username,
        inviteCode,
        platform: body.platform,
      },
      select: { id: true, username: true, displayName: true, email: true, inviteCode: true, createdAt: true },
    });

    const token = await signToken({ id: user.id, username: user.username });

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
