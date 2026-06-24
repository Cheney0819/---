import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, AuthError } from '@/lib/auth';
import { checkAndTriggerCapsules } from '@/lib/scheduler';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser(request);

    // 懒触达到期胶囊
    await checkAndTriggerCapsules();

    const capsule = await prisma.timeCapsule.findFirst({
      where: { id: params.id, receiverId: auth.id },
    });

    if (!capsule) {
      return NextResponse.json({ error: '胶囊不存在' }, { status: 404 });
    }

    if (capsule.status !== 'delivered') {
      return NextResponse.json({ error: '胶囊还未送达' }, { status: 400 });
    }

    // 原子更新避免竞态
    const updated = await prisma.timeCapsule.updateMany({
      where: { id: params.id, status: 'delivered' },
      data: { status: 'read', readAt: new Date() },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: '胶囊已被打开' }, { status: 409 });
    }

    const result = await prisma.timeCapsule.findUnique({ where: { id: params.id } });
    return NextResponse.json({ capsule: result });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error('Open capsule error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
