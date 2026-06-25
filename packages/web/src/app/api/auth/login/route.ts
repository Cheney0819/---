import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// 简单内存速率限制（生产环境建议用 Redis）
const loginAttempts = new Map<string, number[]>();

function getRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 分钟窗口
  const maxRequests = 5;

  const timestamps = loginAttempts.get(clientIp) || [];
  const recent = timestamps.filter(t => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return false;
  }

  recent.push(now);
  loginAttempts.set(clientIp, recent);
  return true;
}

// 定期清理过期记录
setInterval(() => {
  for (const [ip, timestamps] of loginAttempts.entries()) {
    const filtered = timestamps.filter(t => Date.now() - t < 60 * 1000);
    if (filtered.length === 0) {
      loginAttempts.delete(ip);
    } else {
      loginAttempts.set(ip, filtered);
    }
  }
}, 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!getRateLimit(clientIp)) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    const body = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const token = await signToken({ id: user.id, username: user.username });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        inviteCode: user.inviteCode,
        avatarUrl: user.avatarUrl,
        platform: user.platform,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Login error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
