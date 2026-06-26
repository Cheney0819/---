import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';
import { USER_CONSTANTS } from '@/lib/constants';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(USER_CONSTANTS.PASSWORD_MIN_LENGTH).max(USER_CONSTANTS.PASSWORD_MAX_LENGTH),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const body = changePasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const valid = await bcrypt.compare(body.currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: '当前密码不正确' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, USER_CONSTANTS.BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { id: auth.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message || '请求参数有误' }, { status: 400 });
    }
    console.error('Change password error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
