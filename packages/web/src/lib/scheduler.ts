import { prisma } from './prisma';
import { notificationService } from './notification';

// 懒触发：在用户访问胶囊相关接口时检查并送达到期胶囊
export async function checkAndTriggerCapsules(): Promise<void> {
  const pendingCapsules = await prisma.timeCapsule.findMany({
    where: {
      status: 'pending',
      triggerTime: { lte: new Date() },
    },
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true, platform: true, deviceToken: true } },
    },
  });

  for (const capsule of pendingCapsules) {
    await prisma.timeCapsule.update({
      where: { id: capsule.id },
      data: { status: 'delivered', deliveredAt: new Date() },
    });

    await notificationService.notifyCapsuleDelivered(capsule.receiverId, capsule.id).catch(() => {});
  }
}
